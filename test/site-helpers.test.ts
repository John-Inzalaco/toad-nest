import * as siteHelpers from '../src/sites/site-helpers';
import { SiteSettingsHStore } from '../src/sites/hstore/SiteSettingsHStore';

describe('siteHelpers', () => {
  describe('addressVerification', () => {
    describe('getAddressExists', () => {
      it('returns true when all address fields are present', () => {
        expect(
          siteHelpers.getAddressExists({
            address1: '123',
            city: 'City',
            state: 'State',
            zipcode: 'Zipcode',
            country: 'Country',
          }),
        ).toBe(true);
      });

      it('returns false when any address field is mising', () => {
        expect(
          siteHelpers.getAddressExists({
            address1: null,
            city: 'City',
            state: 'State',
            zipcode: 'Zipcode',
            country: 'Country',
          }),
        ).toBe(false);
        expect(
          siteHelpers.getAddressExists({
            address1: '123',
            state: 'State',
            zipcode: 'Zipcode',
            country: 'Country',
          }),
        ).toBe(false);
        expect(
          siteHelpers.getAddressExists({
            address1: '123',
            city: 'City',
            state: 'State',
            zipcode: null,
            country: 'Country',
          }),
        ).toBe(false);
        expect(
          siteHelpers.getAddressExists({
            address1: '123',
            city: 'City',
            state: 'State',
            zipcode: 'Zipcode',
            country: '',
          }),
        ).toBe(false);
        expect(siteHelpers.getAddressExists({})).toBe(false);
      });
    });

    describe('getAddressExpired', () => {
      it('returns null if address_verified_at is not present', () => {
        expect(
          siteHelpers.getAddressExpired({ address_verified_at: null }),
        ).toBe(null);
        expect(siteHelpers.getAddressExpired({})).toBe(null);
      });

      it('returns false when address_verified_at is within a year', () => {
        const date = new Date();
        expect(
          siteHelpers.getAddressExpired({
            address_verified_at: date,
          }),
        ).toBe(false);
        date.setMonth(date.getMonth() - 6);
        expect(
          siteHelpers.getAddressExpired({
            address_verified_at: date,
          }),
        ).toBe(false);
        date.setMonth(date.getMonth() - 5);
        expect(
          siteHelpers.getAddressExpired({
            address_verified_at: date,
          }),
        ).toBe(false);
      });

      it('returns true when address_verified_at is older than a year', () => {
        const date = new Date();
        date.setMonth(date.getMonth() - 13);
        expect(
          siteHelpers.getAddressExpired({
            address_verified_at: date,
          }),
        ).toBe(true);
      });
    });
  });

  describe('siteTier', () => {
    let site: { settings: SiteSettingsHStore };
    beforeEach(() => {
      site = {
        settings: {
          premiere_invited: false,
          premiere_accepted: false,
          pro_invited: false,
          pro_accepted: '',
        } as SiteSettingsHStore,
      };
    });
    describe('isPremiereInvited', () => {
      describe('returns true when', () => {
        it('site has been invited to premiere but not accepted', () => {
          site.settings.premiere_invited = true;
          expect(siteHelpers.isPremiereInvited(site.settings)).toBe(true);
        });
      });

      describe('returns false when', () => {
        it('site hasn`t been invited', () => {
          expect(siteHelpers.isPremiereInvited(site.settings)).toBe(false);
        });

        it('site has accepted', () => {
          site.settings.premiere_invited = true;
          site.settings.premiere_accepted = true;
          expect(siteHelpers.isPremiereInvited(site.settings)).toBe(false);
        });
      });
    });

    describe('isProInvited', () => {
      describe('returns true when', () => {
        it('site has been pro invited and pro accepted equals `na`', () => {
          site.settings.pro_invited = true;
          site.settings.pro_accepted = `na`;
          expect(siteHelpers.isProInvited(site.settings)).toBe(true);
        });
      });

      describe('returns false when', () => {
        it('site has not been invited', () => {
          expect(siteHelpers.isProInvited(site.settings)).toBe(false);
        });

        it('site has a value other than `na` for pro accepted', () => {
          site.settings.pro_invited = true;
          expect(siteHelpers.isProInvited(site.settings)).toBe(false);
        });
      });
    });
  });
});
