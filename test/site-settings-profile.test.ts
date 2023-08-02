import { randomUUID } from 'crypto';
import { SiteUserRole } from '../src/users/SiteUserRole.enum';
import {
  createTestContext,
  generateAuthToken,
  getSiteHStores,
  normalizeDateTimeToUtc,
  replaceRandomId,
  seedPremiereSite,
  seedProSite,
  seedRevenueReports,
  seedSite,
  seedUser,
  testSiteUserRoleAccess,
  updateSiteProfileHStore,
} from './__helpers';
import { GetProfileSettingsResponseDto } from '../src/site-settings/dto/GetProfileSetings.dto';
import {
  getMonthDayYearDateString,
  getTodayDateUtc,
  getXDaysAgoDateUtc,
} from '../src/utils/date';
import { SerializeDto } from '../src/utils/serializeDto';
import { UpdateProfileSettingsReqBodyDto } from '../src/site-settings/dto/UpdateProfileSettings.dto';

const ctx = createTestContext();

describe('Profile Site Settings', () => {
  describe('GET /api/v1/sites/:siteId/site_settings/profile_settings', () => {
    it('returns the site profile settings for an owner with only default settings filled in', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const body = await fetchProfileSettingsJson({
        siteId: site.id,
        user,
        randomId,
      });
      expect(body.site_id).toEqual(site.id);
      expect(body).toMatchSnapshot({ site_id: expect.any(Number) });
    });

    it('returns the site profile settings for an owner with additional fields and categories', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteData: { category_id: 2 },
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        profile: {
          address1: '1 Main St',
          city: 'Boca Raton',
          state: 'FL',
          zipcode: '776655',
          country: 'US',
          country_of_operation: 'UK',
          contact_email: 'contact-email-override@example.com',
        },
        settings: {
          brand_color: '#100001',
          influencer_non_profit_work: 'true',
          influencer_non_profit_rate: '20',
        },
        socialMedia: {
          youtube: `${randomId} youtube`,
          instagram: `${randomId} instagram`,
          snapchat: `${randomId} snaptchat`,
          tiktok: `${randomId} tiktok`,
          facebook: `${randomId} facebook`,
          pinterest: `${randomId} pinterest`,
          twitter: `${randomId} twitter`,
        },
      });
      await ctx.prisma.$executeRaw`
          INSERT INTO categories_sites (category_id, site_id, created_at, updated_at)
          VALUES (1, ${site.id}, current_timestamp, current_timestamp),
            (2, ${site.id}, current_timestamp, current_timestamp),
            (5, ${site.id}, current_timestamp, current_timestamp)
        `;
      const body = await fetchProfileSettingsJson({
        siteId: site.id,
        user,
        randomId,
      });
      expect(body.site_id).toEqual(site.id);
      expect(body).toMatchSnapshot({ site_id: expect.any(Number) });
    });

    it('returns the site profile settings for an admin', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId, admin: true });
      const { site } = await seedSite({
        ctx,
        randomId,
      });
      const body = await fetchProfileSettingsJson({
        siteId: site.id,
        user,
        randomId,
      });
      expect(body.site_id).toEqual(site.id);
      expect(body).toMatchSnapshot({ site_id: expect.any(Number) });
    });

    it('returns the site profile settings for a user with the ad_settings role', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.ad_settings] }],
      });

      const body = await fetchProfileSettingsJson({
        siteId: site.id,
        user,
        randomId,
      });
      expect(body.site_id).toEqual(site.id);
      expect(body).toMatchSnapshot({ site_id: expect.any(Number) });
    });

    it('returns the site profile settings for a premiere site', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedPremiereSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 1_000_000_000,
      });
      await ctx.reportingDb
        .$executeRaw`REFRESH MATERIALIZED VIEW mat_premiere_revenue_summaries`;
      const body = await fetchProfileSettingsJson({
        siteId: site.id,
        user,
        randomId,
      });
      expect(body.site_id).toEqual(site.id);
      expect(body).toMatchSnapshot({ site_id: expect.any(Number) });
    });

    it('returns the site profile settings for a pro site', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const date = new Date();
      date.setMonth(date.getMonth() - 11);
      const { site } = await seedProSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        profile: {
          address_verified_at: date.toISOString().substring(0, 10),
          address1: '1 Main St',
          city: 'Boca Raton',
          state: 'FL',
          zipcode: '776655',
          country: 'US',
        },
      });
      let body = await fetchProfileSettingsJson({
        siteId: site.id,
        user,
        randomId,
      });
      expect(body.site_id).toEqual(site.id);
      expect(body.address_expired).toEqual(false);
      expect(body.address_verified_at).toEqual(
        date.toISOString().substring(0, 10),
      );
      expect(body.address_exists).toEqual(true);
      date.setMonth(date.getMonth() - 2);
      await updateSiteProfileHStore({
        ctx,
        siteId: site.id,
        profile: {
          address_verified_at: date.toISOString().substring(0, 10),
          address1: '1 Main St',
          city: 'Boca Raton',
          state: 'FL',
          country: 'US',
        },
      });
      body = await fetchProfileSettingsJson({
        siteId: site.id,
        user,
        randomId,
      });
      expect(body.address_expired).toEqual(true);
      expect(body.address_exists).toEqual(false);
    });

    it('returns address fields', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedProSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const body = await fetchProfileSettingsJson({
        siteId: site.id,
        user,
        randomId,
      });
      expect(body.site_id).toEqual(site.id);
      expect(body).toMatchSnapshot({ site_id: expect.any(Number) });
    });

    it('returns a 401 for a user without a role on the site', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId, admin: true });
      const otherUser = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const resp = await fetchProfileSettings({
        siteId: site.id,
        user: otherUser,
      });
      expect(resp.status).toEqual(401);
    });

    it('returns a 401 for a user with a role on the site other than ad_settings or owner', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [
          {
            userId: user.id,
            roles: [
              SiteUserRole.post_termination_new_owner,
              SiteUserRole.reporting,
              SiteUserRole.payment,
              SiteUserRole.video,
            ],
          },
        ],
      });
      const resp = await fetchProfileSettings({
        siteId: site.id,
        user,
      });
      expect(resp.status).toEqual(401);
    });

    it('returns a 400 if the site id is not valid', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const resp = await fetchProfileSettings({
        siteId: 'abc' as unknown as number,
        user,
      });
      expect(resp.status).toEqual(process.env.USE_RAILS_API ? 404 : 400);
    });

    it('returns a 404 if the site does not exist', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const resp = await fetchProfileSettings({
        siteId: 99999999,
        user,
      });
      expect(resp.status).toEqual(404);
    });
  });

  describe('PATCH /api/v1/sites/:siteId/site_settings/profile_settings', () => {
    it('returns the updated profile settings for an owner of the site', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        /**
         * Settings lat/long bypasses geocoding logic in Rails API. Waiting
         * to see if we need to implement it still or not
         */
        siteData: {
          latitude: -34.93280010000001,
          longitude: 138.59812779999993,
        },
      });
      const body = await updateProfileSettingsJson({
        siteId: site.id,
        user,
        randomId,
        body: {
          site_description: `Updated site description ${randomId}`,
          site_image: `Updated site_image ${randomId}`,
          slug_override: `Updated slug_override ${randomId}`,
          author_name: `Updated author_name ${randomId}`,
          contact_email: `Updated contact_email ${randomId}`,
          pinterest_email: `Updated pinterest_email ${randomId}`,
          facebook: `Updated facebook ${randomId}`,
          snapchat: `Updated snapchat ${randomId}`,
          instagram: `Updated instagram ${randomId}`,
          tiktok: `Updated tiktok ${randomId}`,
          twitter: `Updated twitter ${randomId}`,
          youtube: `Updated youtube ${randomId}`,
          pinterest: `Updated pinterest ${randomId}`,
          address1: `Updated address1 ${randomId}`,
          city: `Updated city ${randomId}`,
          state: `Updated state ${randomId}`,
          zipcode: `Updated zipcode ${randomId}`,
          country: `Updated country ${randomId}`,
          author_bio: `Updated author_bio ${randomId}`,
          author_image: `Updated author_image ${randomId}`,
          screenshot_timestamp: 1689702981,
          given_notice: true,
          phone_number: `Updated phone_number ${randomId}`,
          category_id: 7,
          category_ids: [7, 8],
          country_of_operation: `US`,
          brand_color: '#000012',
        },
      });
      expect(body.site_id).toEqual(site.id);
      expect(body).toMatchSnapshot({ site_id: expect.any(Number) });
    });

    it('verifies the address even if no address fields change if verify_address is true', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const addressFields = {
        address1: `address1 ${randomId}`,
        city: `city ${randomId}`,
        state: `state ${randomId}`,
        zipcode: `zipcode ${randomId}`,
        country: `country ${randomId}`,
        phone_number: `phone_number ${randomId}`,
      };
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        profile: addressFields,
        siteData: {
          latitude: -34.93280010000001,
          longitude: 138.59812779999993,
        },
      });
      const body = await updateProfileSettingsJson({
        siteId: site.id,
        user,
        randomId,
        body: {
          ...addressFields,
          verify_address: true,
        },
      });
      expect(body.site_id).toEqual(site.id);
      expect(body.address_verified_at).toEqual('<today>');
      expect(body).toMatchSnapshot({ site_id: expect.any(Number) });
    });

    it('does not verify the address if the address fields do not change and verify_address is not passed', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const addressFields = {
        address1: `address1 ${randomId}`,
        city: `city ${randomId}`,
        state: `state ${randomId}`,
        zipcode: `zipcode ${randomId}`,
        country: `country ${randomId}`,
        phone_number: `phone_number ${randomId}`,
        address_verified_at: '2022-01-18',
      };
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        profile: { ...addressFields },
        siteData: {
          latitude: -34.93280010000001,
          longitude: 138.59812779999993,
        },
      });
      const body = await updateProfileSettingsJson({
        siteId: site.id,
        user,
        randomId,
        body: addressFields,
      });
      expect(body.site_id).toEqual(site.id);
      expect(body.address_verified_at).toEqual('2022-01-18');
    });

    it('accepts pro invite', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        settings: {
          pro_invited: 'true',
          pro_invited_on: '2022-01-18',
        },
        siteData: {
          latitude: -34.93280010000001,
          longitude: 138.59812779999993,
        },
      });
      const body = await updateProfileSettingsJson({
        siteId: site.id,
        user,
        randomId,
        body: { pro_accepted: 'accepted' },
      });
      expect(body.pro_accepted).toEqual('accepted');
      const { settings } = await getSiteHStores({ ctx, siteId: site.id });
      expect(settings.pro_accepted_by).toEqual('user title');
      const timeDiff = Date.now() / 1000 - Number(settings.pro_accepted_on);
      expect(timeDiff).toBeGreaterThanOrEqual(0);
      expect(timeDiff).toBeLessThan(10);
      expect(body).toMatchSnapshot({ site_id: expect.any(Number) });
    });

    it('accepts premiere invite', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        settings: {
          premiere_invited: 'true',
        },
        siteData: {
          latitude: -34.93280010000001,
          longitude: 138.59812779999993,
        },
      });
      const body = await updateProfileSettingsJson({
        siteId: site.id,
        user,
        randomId,
        body: { premiere_accepted: true },
      });
      expect(body.premiere_accepted).toEqual(true);
      const { settings } = await getSiteHStores({ ctx, siteId: site.id });
      expect(settings.premiere_accepted_by).toEqual('user title');
      const timeDiff =
        Date.now() / 1000 - Number(settings.premiere_accepted_on);
      expect(timeDiff).toBeGreaterThanOrEqual(0);
      expect(timeDiff).toBeLessThan(10);
      expect(body).toMatchSnapshot({ site_id: expect.any(Number) });
    });

    it('sets premiere_manage_account if the site is a premiere account', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        settings: {
          premiere_invited: 'true',
          premiere_accepted: 'true',
        },
        siteData: {
          latitude: -34.93280010000001,
          longitude: 138.59812779999993,
        },
      });
      const body = await updateProfileSettingsJson({
        siteId: site.id,
        user,
        randomId,
        body: { premiere_manage_account: true },
      });
      expect(body.premiere_accepted).toEqual(true);
      const { settings } = await getSiteHStores({ ctx, siteId: site.id });
      expect(settings.premiere_manage_account).toEqual('true');
      expect(settings.premiere_manage_account_enabled_on).toEqual(
        getMonthDayYearDateString(getTodayDateUtc()),
      );
    });

    it('cannot set premiere_accepted if the site is not already premiere_invited', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const body = await updateProfileSettingsJson({
        siteId: site.id,
        user,
        randomId,
        body: { premiere_accepted: true },
      });
      expect(body.premiere_accepted).toEqual(null);
    });

    it('cannot set pro_accepted if the site is not already pro_invited', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const body = await updateProfileSettingsJson({
        siteId: site.id,
        user,
        randomId,
        body: { pro_accepted: 'accepted' },
      });
      expect(body.pro_accepted).toEqual(null);
    });

    it('accepts the terms of service', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        profile: {
          accepted_terms_of_service: 'false',
          accepted_terms_of_service_by: null,
          accepted_terms_of_service_on: null,
        },
        siteData: {
          latitude: -34.93280010000001,
          longitude: 138.59812779999993,
        },
      });
      const body = await updateProfileSettingsJson({
        siteId: site.id,
        user,
        randomId,
        body: { accepted_terms_of_service: true },
      });
      expect(body.accepted_terms_of_service).toEqual(true);
      expect(
        body.accepted_terms_of_service_on?.startsWith(
          getMonthDayYearDateString(getTodayDateUtc()),
        ),
      ).toEqual(true);
      expect(body.accepted_terms_of_service_by).toEqual('user title');
    });

    it('ignores additional fields passed in', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        profile: {
          accepted_terms_of_service: 'false',
          accepted_terms_of_service_by: null,
          accepted_terms_of_service_on: null,
        },
        siteData: {
          latitude: -34.93280010000001,
          longitude: 138.59812779999993,
        },
      });
      const body = await updateProfileSettingsJson({
        siteId: site.id,
        user,
        randomId,
        body: {
          accepted_terms_of_service_by: 'someone',
          accepted_terms_of_service_on: '2023-01-01',
          fblr: 0.8,
          killswitch: true,
          facebook_count: 123,
          premiere_manage_account_enabled_on: '2023-01-01',
          premiere_accepted_by: 'someone',
          address_verified_at: '2023-01-01',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      });
      expect(body).toMatchSnapshot({ site_id: expect.any(Number) });
      const { settings, profile } = await getSiteHStores({
        ctx,
        siteId: site.id,
      });
      expect(profile.fblr).toEqual(undefined);
      expect(settings.killswitch).toEqual(undefined);
    });

    it('handles adding and removing categories', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        siteData: {
          category_id: 2,
          latitude: -34.93280010000001,
          longitude: 138.59812779999993,
        },
      });
      await ctx.prisma.$executeRaw`
        INSERT INTO categories_sites (category_id, site_id, created_at, updated_at)
        VALUES (1, ${site.id}, current_timestamp, current_timestamp),
          (2, ${site.id}, current_timestamp, current_timestamp),
          (5, ${site.id}, current_timestamp, current_timestamp)
      `;
      const body = await updateProfileSettingsJson({
        siteId: site.id,
        randomId,
        user,
        body: {
          category_id: 1,
          category_ids: [3, 5],
        },
      });
      expect(body.category_id).toMatchInlineSnapshot(`
        {
          "created_at": "2023-05-30T00:00:00.000Z",
          "iab_code": "IAB1",
          "id": 1,
          "parent_id": 1,
          "slug": "arts-and-entertainment",
          "title": "Arts & Entertainment",
          "updated_at": "2023-05-30T00:00:00.000Z",
        }
      `);
      expect(
        body.category_ids?.sort((a, b) =>
          (a.slug || '') > (b.slug || '') ? 1 : -1,
        ),
      ).toMatchInlineSnapshot(`
        [
          {
            "created_at": "2023-05-30T00:00:00.000Z",
            "iab_code": "IAB6",
            "id": 3,
            "parent_id": null,
            "slug": "family-and-parenting",
            "title": "Family & Parenting",
            "updated_at": "2023-05-30T00:00:00.000Z",
          },
          {
            "created_at": "2023-05-30T00:00:00.000Z",
            "iab_code": "IAB8",
            "id": 5,
            "parent_id": null,
            "slug": "food-and-drink",
            "title": "Food & Drink",
            "updated_at": "2023-05-30T00:00:00.000Z",
          },
        ]
      `);
    });

    describe('User Role Access', () => {
      void testSiteUserRoleAccess({
        ctx,
        expectedStatuses: {
          ad_settings: 200,
          admin: 200,
          owner: 200,
          payment: 401,
          post_termination_new_owner: 401,
          reporting: 401,
          video: 401,
        },
        makeRequest: async ({ user, siteId }) => {
          return updateProfileSettings({
            siteId,
            user,
            body: {
              contact_email: 'Updated contact_email',
            },
          });
        },
      });
    });
  });
});

function normalizeProfileSettingsResponse(
  body: SerializeDto<GetProfileSettingsResponseDto>,
  randomId: string,
) {
  return replaceRandomId(
    {
      ...body.site,
      accepted_terms_of_service_on: normalizeDateTimeToUtc(
        body.site.accepted_terms_of_service_on,
      ),
      category_id: body.site.category_id && {
        ...body.site.category_id,
        created_at: normalizeDateTimeToUtc(body.site.category_id.created_at),
        updated_at: normalizeDateTimeToUtc(body.site.category_id.updated_at),
      },
      category_ids: body.site.category_ids?.map((category) => ({
        ...category,
        created_at: normalizeDateTimeToUtc(category.created_at),
        updated_at: normalizeDateTimeToUtc(category.updated_at),
      })),
      address_verified_at: body.site.address_verified_at?.replace(
        getMonthDayYearDateString(getTodayDateUtc()),
        '<today>',
      ),
    },
    randomId,
  );
}

interface FetchProfileSettingsParams {
  user: { id: number; jwt_secret: string } | null;
  siteId: number;
}
function fetchProfileSettings({ siteId, user }: FetchProfileSettingsParams) {
  return fetch(
    `${ctx.host}/api/v1/sites/${siteId}/site_settings/profile_settings`,
    { headers: user ? { Authorization: generateAuthToken(user) } : undefined },
  );
}
interface FetchProfileSettingsJsonParams extends FetchProfileSettingsParams {
  randomId: string;
}
async function fetchProfileSettingsJson({
  siteId,
  user,
  randomId,
}: FetchProfileSettingsJsonParams): Promise<
  SerializeDto<GetProfileSettingsResponseDto['site']>
> {
  const resp = await fetchProfileSettings({ siteId, user });
  const body =
    (await resp.json()) as SerializeDto<GetProfileSettingsResponseDto>;
  return normalizeProfileSettingsResponse(body, randomId);
}

interface UpdateProfileSettingsParams {
  body: UpdateProfileSettingsReqBodyDto;
  user: { id: number; jwt_secret: string } | null;
  siteId: number;
}
function updateProfileSettings({
  body,
  siteId,
  user,
}: UpdateProfileSettingsParams) {
  return fetch(
    `${ctx.host}/api/v1/sites/${siteId}/site_settings/profile_settings`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(user ? { Authorization: generateAuthToken(user) } : {}),
      },
      body: JSON.stringify(body),
    },
  );
}
interface UpdateProfileSettingsJsonParams extends UpdateProfileSettingsParams {
  randomId: string;
}
async function updateProfileSettingsJson({
  body,
  siteId,
  user,
  randomId,
}: UpdateProfileSettingsJsonParams): Promise<
  SerializeDto<GetProfileSettingsResponseDto['site']>
> {
  const resp = await updateProfileSettings({ siteId, user, body });
  const resBody =
    (await resp.json()) as SerializeDto<GetProfileSettingsResponseDto>;
  return normalizeProfileSettingsResponse(resBody, randomId);
}

interface SeedRevenueReportImpressionsParams {
  siteId: number;
  totalImpressions: number;
}
const seedRevenueReportImpressions = ({
  siteId,
  totalImpressions,
}: SeedRevenueReportImpressionsParams) => {
  return seedRevenueReports({
    ctx,
    siteId,
    generateItem: () => ({
      paid_impressions: Math.ceil(totalImpressions / 31),
      revenue: 1_000_000,
      net_revenue: 900_000,
    }),
    startDate: getXDaysAgoDateUtc(33),
    endDate: getXDaysAgoDateUtc(1),
  });
};
