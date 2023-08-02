import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_DB_CLIENT_TOKEN,
  DashboardDbService,
} from '../db/dashboardDb.service';
import { convertSiteUserKeysToMask } from '../users/rolesUtilities';
import { randomUUID } from 'crypto';
import { CreateSiteUserBodyDto } from './dto/CreateSiteUser.dto';
import { randomBytes } from 'crypto';
import { Prisma, users } from '@prisma/dashboard';
import { hash as hashPassword } from '../utils/passwords';
import { EmailsService } from '../emails/emails.service';
import { SiteUserRoleKey } from '../users/SiteUserRole.enum';
import { hashInvitationToken } from './helpers';

interface CreateSiteUserParams {
  siteId: number;
  body: CreateSiteUserBodyDto;
}

type CreateSiteUserDbParams = {
  email: string;
  existingUser: Pick<users, 'id' | 'email' | 'invitation_token'> | null;
  siteId: number;
  roles: SiteUserRoleKey[];
};
interface GetNewUserDataParams {
  email: string;
}
interface GetInvitationDateParams {
  invitationTokenEncrypted: string;
}

@Injectable()
export class SiteUsersService {
  constructor(
    @Inject(DASHBOARD_DB_CLIENT_TOKEN)
    private readonly dashboardDb: DashboardDbService,
    private readonly emailsService: EmailsService,
  ) {}

  async createSiteUser({ siteId, body }: CreateSiteUserParams) {
    const existingUser = await this.dashboardDb.users.findUnique({
      select: {
        id: true,
        email: true,
        invitation_token: true,
        site_users: { where: { site_id: siteId } },
      },
      where: { email: body.email },
    });
    if (existingUser?.site_users.length) {
      throw new BadRequestException({
        email: [
          'Email already exists. Please add the role to an existing user.',
        ],
      });
    }
    const site = await this.dashboardDb.sites.findUnique({
      select: {
        title: true,
        site_users: { take: 1 },
      },
      where: { id: siteId },
    });
    let roles = body.roles;
    // Add owner role if no other users exist for the site
    if (site?.site_users.length === 0) {
      roles = [...roles, 'owner'];
    }
    const siteUser = await this.createSiteUserDb({
      email: body.email,
      siteId,
      roles,
      existingUser,
    });
    if (existingUser && !existingUser.invitation_token) {
      await this.emailsService.sendInviteExistingUserToSiteEmail({
        email: existingUser.email,
        siteTitle: site?.title || '',
      });
      return siteUser;
    } else {
      const { encrypted: invitationTokenEncrypted, raw: invitationTokenRaw } =
        await this.generateInvitationToken();
      if (siteUser.user_id) {
        await this.dashboardDb.users.update({
          where: { id: siteUser.user_id },
          data: this.getInvitationData({ invitationTokenEncrypted }),
        });
      }
      await this.emailsService.sendInviteNewUserToSiteEmail({
        email: body.email,
        siteTitle: site?.title || '',
        invitationTokenRaw: invitationTokenRaw,
      });
      return siteUser;
    }
  }

  private async createSiteUserDb({
    email,
    siteId,
    roles,
    existingUser,
  }: CreateSiteUserDbParams) {
    const createdAt = new Date();
    const siteUser = this.dashboardDb.site_users.create({
      select: {
        id: true,
        site_id: true,
        created_at: true,
        updated_at: true,
        roles_mask: true,
        user_id: true,
        users: { select: { id: true } },
      },
      data: {
        created_at: createdAt,
        updated_at: createdAt,
        users: existingUser
          ? { connect: { id: existingUser.id } }
          : {
              create: await this.getNewUserData({
                email,
              }),
            },
        sites: { connect: { id: siteId } },
        roles_mask: convertSiteUserKeysToMask(roles),
      },
    });
    return siteUser;
  }

  private async getNewUserData({
    email,
  }: GetNewUserDataParams): Promise<Prisma.usersCreateInput> {
    const createdAt = new Date();
    const hashedPassword = await hashPassword(
      randomBytes(11).toString('base64url').slice(0, 8),
    );
    return {
      authentication_token: randomBytes(15).toString('base64url'),
      created_at: createdAt,
      updated_at: createdAt,
      email,
      jwt_secret: randomUUID(),
      encrypted_password: hashedPassword,
    };
  }

  private getInvitationData({
    invitationTokenEncrypted,
  }: GetInvitationDateParams) {
    const createdAt = new Date();
    return {
      invitation_created_at: createdAt,
      invitation_sent_at: createdAt,
      invitation_token: invitationTokenEncrypted,
    };
  }

  private async generateInvitationToken() {
    const raw = randomBytes(15).toString('base64url');
    const encrypted = await hashInvitationToken(raw);
    return { encrypted, raw };
  }
}
