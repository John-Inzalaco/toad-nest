import { users } from '@prisma/dashboard';
import { isUserOwnedGrowSite } from '../../grow/grow';
import * as siteHelpers from '../../sites/site-helpers';
import { convertUserRolesToStrings } from '../../users/rolesUtilities';
import { hashEmailForIntercom } from '../../utils/intercomHash';
import { SessionSitesData } from '../sessions.service';

class GrowSitesDto {
  site_id!: number;
  grow_site_id!: string;
}

class SiteUserDto {
  id!: number;
  user_id!: number | null;
  site_id!: number | null;
  roles_mask!: number | null;
}

class PayeesDto {
  id!: number;
  tipalti_completed!: boolean | null;
  uuid!: string | null;
  name!: string | null;
}

class UserDto {
  authentication_token!: string | null;
  email!: string;
  id!: number;
  favorite_sites!: string | null;
  read_only_admin!: boolean | null;
  twilio_verify_enabled!: boolean | null;
  name!: string | null;
  roles!: Array<string>;
  enterprise_sites!: number[];
  premiere_sites!: number[];
  premiere_sites_invited!: number[];
  pro_sites!: number[];
  pro_sites_invited!: number[];
  grow_site_ids!: string[];
  grow_sites!: GrowSitesDto[];
  site_users!: SiteUserDto[];
  user_hash!: string;
  site_ids!: number[];
  super_admin!: boolean | null;
  payees!: PayeesDto[];
}

export class ResSessionsSignInDto {
  data!: {
    token: string;
    user: UserDto;
  };

  constructor(
    token: string,
    user: users,
    sessionSitesData: SessionSitesData[],
  ) {
    this.data = {
      token: token,
      user: {
        payees: sessionSitesData.map(createPayee),
        name: user.title || null,
        super_admin: user.super_admin,
        read_only_admin: user.read_only_admin,
        authentication_token: user.authentication_token,
        user_hash: hashEmailForIntercom(user.email),
        favorite_sites: user.favorite_sites,
        email: user.email,
        id: user.id,
        enterprise_sites: [],
        premiere_sites: [],
        premiere_sites_invited: [],
        pro_sites: [],
        pro_sites_invited: [],
        grow_site_ids: [],
        grow_sites: [],
        site_users: sessionSitesData.map(createSiteUser),
        site_ids: [],
        roles: convertUserRolesToStrings(user.roles_mask || 0),
        twilio_verify_enabled: user.twilio_verify_enabled,
      },
    };

    sessionSitesData.map((data) => {
      this.data.user.site_ids.push(data.site_id);

      if (siteHelpers.isPremiereInvited(data.settings)) {
        this.data.user.premiere_sites_invited.push(data.site_id);
      }

      if (siteHelpers.isPremiereAccepted(data.settings)) {
        this.data.user.premiere_sites.push(data.site_id);
      }

      if (siteHelpers.isProInvited(data.settings)) {
        this.data.user.pro_sites_invited.push(data.site_id);
      }

      if (siteHelpers.isProAccepted(data.settings)) {
        this.data.user.pro_sites.push(data.site_id);
      }

      if (siteHelpers.isEnterpriseSite(data.settings)) {
        this.data.user.enterprise_sites.push(data.site_id);
      }

      if (data.grow_site_id !== null) {
        this.data.user.grow_site_ids.push(data.grow_site_id);

        const site = { id: data.site_id, grow_site_id: data.grow_site_id };
        const siteUser = {
          id: data.site_user_id,
          roles_mask: data.site_users_roles_mask,
          user_id: data.site_users_user_id,
          site_id: data.site_users_site_id,
        };

        if (isUserOwnedGrowSite(user, siteUser, site)) {
          this.data.user.grow_sites.push({
            site_id: data.site_id,
            grow_site_id: data.grow_site_id,
          });
        }
      }
    });
  }
}

const createPayee = (d: SessionSitesData) => ({
  id: d.payee_id,
  name: d.payee_name,
  tipalti_completed: d.tipalti_completed,
  uuid: d.payee_uuid,
});

const createSiteUser = (d: SessionSitesData) => ({
  id: d.site_user_id,
  user_id: d.site_users_user_id,
  site_id: d.site_users_site_id,
  roles_mask: d.site_users_roles_mask,
});
