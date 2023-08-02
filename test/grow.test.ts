import { isUserOwnedGrowSite } from '../src/grow/grow';
import { SiteUserRole } from '../src/users/SiteUserRole.enum';
import { UserRole } from '../src/users/UserRole.enum';

describe('Grow', () => {
  let user: { id: number; roles_mask: number };
  let site: { id: 1; grow_site_id: string | null };
  let siteUser: { site_id: number; user_id: number; roles_mask: number };

  describe('owned grow sites', () => {
    beforeEach(() => {
      user = { id: 1, roles_mask: 1 };
      siteUser = { site_id: 1, user_id: 1, roles_mask: 1 };
      site = { id: 1, grow_site_id: '1' };
    });
    describe('return true when', () => {
      describe('the site has a grow site id', () => {
        beforeEach(() => {
          site = { id: 1, grow_site_id: '1' };
        });

        it('and the user has an admin role', () => {
          user.roles_mask = UserRole.admin;
          expect(isUserOwnedGrowSite(user, siteUser, site)).toBe(true);
        });

        it('and the siteUser has an owner role', () => {
          siteUser.roles_mask = SiteUserRole.owner;
          expect(isUserOwnedGrowSite(user, siteUser, site)).toBe(true);
        });

        it('and the siteUser has an ad settings role', () => {
          siteUser.roles_mask = SiteUserRole.ad_settings;
          expect(isUserOwnedGrowSite(user, siteUser, site)).toBe(true);
        });
      });
    });

    describe('returns false when', () => {
      it('only receives siteUser records not associated with the given user', () => {
        siteUser.user_id = 2;
        expect(isUserOwnedGrowSite(user, siteUser, site)).toBe(false);
      });

      it('gets receives siteUser records not associated with the given site', () => {
        siteUser.site_id = 2;
        expect(isUserOwnedGrowSite(user, siteUser, site)).toBe(false);
      });

      it('the site doesnt have a grow site id', () => {
        site.grow_site_id = null;
        expect(isUserOwnedGrowSite(user, siteUser, site)).toBe(false);
      });

      it('the user is not an admin or the site user is not an owner or ad settings role', () => {
        siteUser.roles_mask = 0;
        user.roles_mask = 0;
        expect(isUserOwnedGrowSite(user, siteUser, site)).toBe(false);
      });
    });
  });
});
