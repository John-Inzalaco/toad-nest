import { site_users, sites, users } from '@prisma/dashboard';
import { SiteUserRole } from '../users/SiteUserRole.enum';
import { UserRole } from '../users/UserRole.enum';
import { hasAnyRole } from '../users/rolesUtilities';
/**
 * A user can have many site users, granting them roles
 * on multiple sites.
 * To check if a site is a user owned grow site,
 * we need to check for any siteUser roles a user may have
 * for the site in question and check the roles for each one.
 */

function isUserOwnedGrowSite(
  user: Pick<users, 'id' | 'roles_mask'>,
  siteUser: Pick<site_users, 'roles_mask' | 'user_id' | 'site_id'>,
  site: Pick<sites, 'grow_site_id' | 'id'>,
): boolean {
  /** Site does not have Grow so we can stop immediately. */
  if (!site.grow_site_id) {
    return false;
  }

  /**
   * Guards against siteUser records not for this site or
   * siteUser records not for the user in question.
   */
  if (siteUser.user_id !== user.id || siteUser.site_id !== site.id) {
    return false;
  }

  /**
   * This user is an admin or has one of the following roles for this site:
   * Owner, Ad Settings
   */
  const userHasAValidRole =
    hasAnyRole(user.roles_mask, [UserRole.admin]) ||
    hasAnyRole(siteUser.roles_mask, [
      SiteUserRole.owner,
      SiteUserRole.ad_settings,
    ]);

  if (userHasAValidRole) {
    return true;
  }

  return false;
}

export { isUserOwnedGrowSite };
