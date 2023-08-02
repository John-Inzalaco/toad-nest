import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  DASHBOARD_DB_CLIENT_TOKEN,
  DashboardDbService,
} from '../db/dashboardDb.service';
import { plainToInstance } from 'class-transformer';
import {
  SiteSettingsHStore,
  SiteSettingsHStoreRaw,
} from '../sites/hstore/SiteSettingsHStore';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../environment';
import { hashQueryString } from './helpers/hashQueryString';
import { randomUUID } from 'crypto';
import { RequestUser } from '../express';
import * as siteHelpers from '../sites/site-helpers';
import { Prisma } from '@prisma/dashboard';
import { SiteUserRole } from '../users/SiteUserRole.enum';
import { convertSiteUserRolesToStrings } from '../users/rolesUtilities';

const MEDIAVINE_PAYER = 'MEDIAVINE';

interface CreatePayeeForSiteParams {
  siteId: number;
  name: string;
}

interface ChoosePayeeParams {
  currentUser: RequestUser;
  siteId: number;
  payeeId: number;
}

@Injectable()
export class PayeesService {
  constructor(
    @Inject(DASHBOARD_DB_CLIENT_TOKEN)
    private readonly dashboardDb: DashboardDbService,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  async getSitePayeeSettings(siteId: number, referer: string) {
    const [payee, payeeNameUpdated] = await Promise.all([
      this.getPayeeForSite(siteId),
      this.getPayeeNameUpdatedForSite(siteId),
    ]);

    return {
      site: {
        site: siteId,
        payee_name_updated: payeeNameUpdated,
        payee,
        frames: {
          history: payee?.uuid ? this.getHistoryIframe(payee.uuid) : null,
          edit_profile: payee?.uuid
            ? this.getProfileIframe(payee.uuid, referer)
            : null,
        },
      },
    };
  }

  async createPayeeForSite({ siteId, name }: CreatePayeeForSiteParams) {
    const site = await this.dashboardDb.sites.findUnique({
      select: { test_site: true },
      where: { id: siteId },
    });
    if (site?.test_site) {
      throw new UnprocessableEntityException({
        sites: ['You cannot create a Payee Profile for a Test Site'],
      });
    }
    const createdAt = new Date();
    await this.dashboardDb.sites.update({
      where: { id: siteId },
      data: {
        payees: {
          create: {
            created_at: createdAt,
            updated_at: createdAt,
            name,
            uuid: randomUUID(),
          },
        },
      },
    });
  }

  async getExistingPayees(user: RequestUser) {
    let siteIdsWithSufficientPermissions: number[] = [];
    if (!user.isAdmin) {
      const siteUsers = await this.dashboardDb.site_users.findMany({
        where: { user_id: user.id },
      });
      siteIdsWithSufficientPermissions = siteUsers.reduce<number[]>(
        (prev, siteUser) => {
          const roles = convertSiteUserRolesToStrings(siteUser.roles_mask);
          if (
            siteUser?.site_id &&
            (roles.includes('owner') || roles.includes('payment'))
          ) {
            prev.push(siteUser.site_id);
          }
          return prev;
        },
        [],
      );
    }
    const payees = await this.dashboardDb.payees.findMany({
      select: {
        id: true,
        name: true,
        tipalti_completed: true,
        uuid: true,
      },
      orderBy: { name: 'asc' },
      where: {
        sites: {
          some: user.isAdmin
            ? {}
            : { id: { in: siteIdsWithSufficientPermissions } },
        },
      },
    });
    return payees;
  }

  async confirmPayeeName(siteId: number) {
    const setStatementsSql = siteHelpers.updateHStoreSql({
      payee_name_updated: true,
    });
    await this.dashboardDb.$executeRaw`
      UPDATE sites
      SET ${Prisma.join(setStatementsSql, ', ')}
      WHERE id = ${siteId}
    `;
  }

  async confirmPayee(siteId: number) {
    const site = await this.dashboardDb.sites.findUnique({
      select: { payee_id: true },
      where: { id: siteId },
    });
    if (!site) {
      throw new NotFoundException('Site not found');
    } else if (!site.payee_id) {
      throw new UnprocessableEntityException('No payee set for site');
    }
    await this.dashboardDb.payees.update({
      where: { id: site.payee_id },
      data: { tipalti_completed: true },
    });
  }

  async choosePayee({ currentUser, siteId, payeeId }: ChoosePayeeParams) {
    const payee = await this.dashboardDb.payees.findUnique({
      where: { id: payeeId },
    });
    if (!payee) {
      throw new NotFoundException('Payee not found');
    }
    if (!currentUser.isAdmin) {
      const siteIdsWithPayee: { id: number }[] = await this.dashboardDb
        .$queryRaw`
          SELECT sites.id 
          FROM sites INNER JOIN site_users ON sites.id = site_users.site_id 
          WHERE sites.payee_id = ${payeeId} 
            AND site_users.user_id = ${currentUser.id}
            AND (
              site_users.roles_mask & ${SiteUserRole.owner} = ${SiteUserRole.owner} 
              OR site_users.roles_mask & ${SiteUserRole.payment} = ${SiteUserRole.payment}
            )
          LIMIT 1
        `;
      if (siteIdsWithPayee.length === 0) {
        throw new ForbiddenException('You do not have access to this payee');
      }
    }
    await this.dashboardDb.sites.update({
      data: {
        payee_id: payeeId,
      },
      where: { id: siteId },
    });
  }

  private async getPayeeForSite(siteId: number) {
    const site = await this.dashboardDb.sites.findUnique({
      select: {
        payees: {
          select: {
            id: true,
            name: true,
            created_at: true,
            updated_at: true,
            tipalti_completed: true,
            uuid: true,
          },
        },
      },
      where: { id: siteId },
    });

    return site?.payees || null;
  }

  private async getPayeeNameUpdatedForSite(siteId: number) {
    const siteQueryResp: { settings: SiteSettingsHStoreRaw }[] = await this
      .dashboardDb.$queryRaw`
        SELECT hstore_to_json(sites.settings) AS settings
        FROM sites
        WHERE sites.id = ${siteId} 
      `;
    const settings = plainToInstance(
      SiteSettingsHStore,
      siteQueryResp[0].settings,
    );
    return settings.payee_name_updated;
  }

  private getHistoryIframe(payeeUuid: string) {
    const baseUrl = this.configService.getOrThrow('TIPALTI_HISTORY_URL', {
      infer: true,
    });
    const TIPALTI_API_KEY = this.configService.getOrThrow('TIPALTI_API_KEY', {
      infer: true,
    });
    const url = new URL(`${baseUrl}/PayeeDashboard/PaymentsHistory`);
    url.searchParams.set('idap', payeeUuid);
    url.searchParams.set('payer', MEDIAVINE_PAYER);
    url.searchParams.set('ts', Math.floor(Date.now() / 1000).toString());
    const currentQueryString = url.searchParams.toString();
    url.searchParams.set(
      'hashkey',
      hashQueryString({
        queryString: currentQueryString,
        key: TIPALTI_API_KEY,
      }),
    );
    return this.makeIframe(url.toString());
  }

  private getProfileIframe(payeeUuid: string, referer: string) {
    const baseUrl = this.configService.getOrThrow('TIPALTI_BASE_URL', {
      infer: true,
    });
    const TIPALTI_API_KEY = this.configService.getOrThrow('TIPALTI_API_KEY', {
      infer: true,
    });
    const url = new URL(`${baseUrl}/Payees/PayeeDashboard.aspx`);
    url.searchParams.set('idap', payeeUuid);
    url.searchParams.set('payer', MEDIAVINE_PAYER);
    url.searchParams.set('redirectto', `${referer}?tipalti_completed=true`);
    url.searchParams.set('ts', Math.floor(Date.now() / 1000).toString());
    const currentQueryString = url.searchParams.toString();
    url.searchParams.set(
      'hashkey',
      hashQueryString({
        queryString: currentQueryString,
        key: TIPALTI_API_KEY,
      }),
    );
    return this.makeIframe(url.toString());
  }

  private makeIframe(src: string) {
    return `<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="${src}" />`;
  }
}
