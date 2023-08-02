import {
  Inject,
  Injectable,
  NotFoundException,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import {
  DASHBOARD_DB_CLIENT_TOKEN,
  DashboardDbService,
} from '../db/dashboardDb.service';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { hasAnyRole } from '../users/rolesUtilities';
import { SiteUserRole } from '../users/SiteUserRole.enum';
import { RequestUser } from '../express';
import { permissionsMetadataKey } from './constants';

@Injectable({ scope: Scope.REQUEST })
export class PermissionsService {
  constructor(
    @Inject(REQUEST) private request: Request,
    @Inject(DASHBOARD_DB_CLIENT_TOKEN)
    private prisma: DashboardDbService,
  ) {
    /**
     * This proxy affixes a signal onto the request object that is later
     * checked by the PermissionsInterceptor to ensure that permissions
     * have been explictly set.
     * The proxy prevents this signal from needing to be set on each individual
     * method of the PermissionsService.
     */
    const handler: ProxyHandler<PermissionsService> = {
      get(target: PermissionsService, p: keyof PermissionsService) {
        if (p in target) {
          request[permissionsMetadataKey] = true;
          return target[p];
        }
      },
    };
    const proxy = new Proxy(this, handler);

    return proxy;
  }

  /**
   * If an endpoint has not limited user access this method still must be called
   * to ensure that permissions have explicitly declared for a route.
   */
  assertNoPermissionPolicy() {
    return true;
  }

  assertCanAccessSite = async (
    siteId: number,
  ): Promise<{
    showReportData: boolean;
  }> => {
    if (this.isAdminUser()) {
      return { showReportData: true };
    }
    const siteUser = await this.hasSiteUserWithAnyRoles({ siteId, roles: [] });
    return {
      showReportData: hasAnyRole(siteUser?.roles_mask, [
        SiteUserRole.owner,
        SiteUserRole.reporting,
        SiteUserRole.post_termination_new_owner,
      ]),
    };
  };

  assertCanManageSiteSettings = async (siteId: number) => {
    if (this.isAdminUser()) {
      return true;
    }
    return this.hasSiteUserWithAnyRoles({
      siteId,
      roles: [SiteUserRole.owner, SiteUserRole.ad_settings],
    });
  };

  assertCanManagePayees = async (siteId: number) => {
    if (this.isAdminUser()) {
      return true;
    }
    return this.hasSiteUserWithAnyRoles({
      siteId: Number(siteId),
      roles: [SiteUserRole.owner, SiteUserRole.payment],
    });
  };

  assertCanManageSiteUsers = async (siteId: number) => {
    if (this.isAdminUser()) {
      return true;
    }
    return this.hasSiteUserWithAnyRoles({
      siteId,
      roles: [SiteUserRole.owner],
    });
  };

  assertIsAdmin = () => {
    if (this.isAdminUser()) {
      return true;
    }

    throw new UnauthorizedException();
  };

  assertCanAccessVideos = async (siteId: number, slug?: string) => {
    if (this.isAdminUser()) {
      return true;
    }

    if (slug) {
      const siteForVideo = await this.prisma.videos.findUnique({
        where: {
          slug,
        },
      });

      if (!siteForVideo) {
        throw new Error('Video not Found');
      }

      return this.hasSiteUserWithAnyRoles({
        siteId: Number(siteForVideo.site_id),
        roles: [SiteUserRole.owner, SiteUserRole.video],
      });
    }

    return this.hasSiteUserWithAnyRoles({
      siteId: Number(siteId),
      roles: [SiteUserRole.owner, SiteUserRole.video],
    });
  };

  private isAdminUser = () => {
    const user = this.getUserFromReq();
    return user.isAdmin;
  };

  private getUserFromReq = () => {
    if ('user' in this.request) {
      return this.request.user as RequestUser;
    }
    throw new UnauthorizedException();
  };

  private getSiteUser = async (siteId: number) => {
    return this.prisma.site_users.findFirst({
      select: { id: true, roles_mask: true },
      where: {
        site_id: siteId,
        user_id: this.getUserFromReq().id,
      },
    });
  };

  private hasSiteUserWithAnyRoles = async ({
    siteId,
    roles,
  }: {
    siteId: number;
    roles: SiteUserRole[];
  }) => {
    const siteUser = await this.getSiteUser(siteId);

    if (siteUser) {
      if (hasAnyRole(siteUser?.roles_mask, roles)) {
        return siteUser;
      } else {
        throw new UnauthorizedException();
      }
    }
    const site = await this.prisma.sites.findUnique({
      select: { id: true },
      where: { id: siteId },
    });
    if (!site) {
      throw new NotFoundException();
    }
    throw new UnauthorizedException();
  };
}
