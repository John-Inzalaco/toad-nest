import { randomUUID } from 'crypto';
import { SiteUserRole } from '../src/users/SiteUserRole.enum';
import {
  DATE_REGEX,
  createTestContext,
  generateAuthToken,
  normalizeDateTimeToUtc,
  replaceRandomId,
  seedFeatures,
  seedGA4Property,
  seedHealthCheck,
  seedPayee,
  seedPremiereSite,
  seedProSite,
  seedRevenueReports,
  seedSite,
  seedUser,
  updateSiteProfileHStore,
  updateSiteSettingHStore,
} from './__helpers';
import {
  getMonthDayYearDateString,
  getTodayDateUtc,
  getXDaysAgoDateUtc,
  getXYearsAgoDateUtc,
} from '../src/utils/date';
import { SerializeDto } from '../src/utils/serializeDto';
import { GetSiteResponseDto } from '../src/sites/dto/GetSite.dto';

const ctx = createTestContext();

const date2YearsAgo = getXYearsAgoDateUtc(2);
const date3YearsAgo = getXYearsAgoDateUtc(3);

describe('GET /api/v1/sites/:id', () => {
  it('returns a site for an owner', async () => {
    const randomId = randomUUID();
    const user = await seedUser({ ctx });
    const { site } = await seedSite({
      ctx,
      siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      randomId,
    });
    await seedRevenueReportImpressions({
      siteId: site.id,
      totalImpressions: 31000,
    });
    const body = await fetchSiteJson({ siteId: site.id, user, randomId });
    expect(body).toMatchSnapshot({
      id: expect.any(Number),
      created_at: expect.stringMatching(DATE_REGEX),
    });
  });

  it('returns a site for an owner with different values', async () => {
    const randomId = randomUUID();
    const user = await seedUser({ ctx });
    const { site } = await seedSite({
      ctx,
      siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      randomId,
      siteData: {
        deactivated: true,
        do_not_pay: true,
        grow_site_id: `${randomId}-grow`,
        opt_in_to_beta_center: true,
        test_site: true,
        uuid: randomId,
      },
      profile: {
        given_notice: 'true',
      },
      settings: {
        killswitch: 'true',
        disable_onboarding_wizard: 'true',
        disable_reporting: 'true',
        owned: 'true',
        zergnet_id: '76279',
        loyalty_bonus_disabled: 'true',
        enable_automatic_recipe_selectors: 'true',
        premiere_invited: 'true',
        ganalytics_state: 'CONNECTED',
        ganalytics_refresh_token_expired_at: '1634659850',
        gutter_enable: 'true',
      },
    });
    const body = await fetchSiteJson({ siteId: site.id, user, randomId });
    expect(body).toMatchSnapshot({
      id: expect.any(Number),
      created_at: expect.stringMatching(DATE_REGEX),
    });
  });

  it('returns payment fields', async () => {
    const randomId = randomUUID();
    const user = await seedUser({ ctx });
    const payee = await seedPayee({ ctx });
    const { site } = await seedSite({
      ctx,
      siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      randomId,
      siteData: {
        payee_id: payee.id,
      },
      settings: {
        payee_name_updated: 'true',
      },
    });
    let body = await fetchSiteJson({ siteId: site.id, user, randomId });
    expect({
      needs_payment: body.needs_payment,
      tipalti_completed: body.tipalti_completed,
      payee_name_updated: body.payee_name_updated,
    }).toMatchInlineSnapshot(`
      {
        "needs_payment": false,
        "payee_name_updated": true,
        "tipalti_completed": true,
      }
    `);
    await ctx.prisma.payees.update({
      where: { id: payee.id },
      data: { tipalti_completed: false },
    });
    body = await fetchSiteJson({ siteId: site.id, user, randomId });
    expect({
      needs_payment: body.needs_payment,
      tipalti_completed: body.tipalti_completed,
      payee_name_updated: body.payee_name_updated,
    }).toMatchInlineSnapshot(`
      {
        "needs_payment": false,
        "payee_name_updated": true,
        "tipalti_completed": false,
      }
    `);
  });

  it('returns chicory_enabled fields based on recipe selector fields', async () => {
    const randomId = randomUUID();
    const user = await seedUser({ ctx });
    const { site } = await seedSite({
      ctx,
      siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      randomId,
      settings: {
        recipe_selector: '.recipe-card',
      },
    });
    let body = await fetchSiteJson({ siteId: site.id, user, randomId });
    expect(body.chicory_enabled).toEqual(true);
    await updateSiteSettingHStore({
      ctx,
      siteId: site.id,
      settings: {
        recipe_selector: null,
        recipe_mobile_selector: '.recipe-card',
      },
    });
    body = await fetchSiteJson({ siteId: site.id, user, randomId });
    expect(body.chicory_enabled).toEqual(true);
  });

  it('returns address fields', async () => {
    const randomId = randomUUID();
    const user = await seedUser({ ctx });
    const date = new Date();
    date.setMonth(date.getMonth() - 11);
    const { site } = await seedSite({
      ctx,
      siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      randomId,
      profile: {
        address_verified_at: date.toISOString().substring(0, 10),
        address1: '1 Main St',
        city: 'Boca Raton',
        state: 'FL',
        zipcode: '776655',
        country: 'US',
      },
    });
    let body = await fetchSiteJson({ siteId: site.id, user, randomId });
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
    body = await fetchSiteJson({ siteId: site.id, user, randomId });
    expect(body.address_expired).toEqual(true);
    expect(body.address_exists).toEqual(false);
  });

  it('returns features for the site', async () => {
    const randomId = randomUUID();
    await seedFeatures({ ctx });
    const user = await seedUser({ ctx });
    const { site } = await seedSite({
      ctx,
      siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      randomId,
    });
    await ctx.prisma.flipper_gates.createMany({
      data: [
        {
          key: 'actors',
          feature_key: 'ga4_settings_page',
          value: `Site:${site.id}`,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          key: 'actors',
          feature_key: 'clickwrap_tos',
          value: `Site:${site.id}`,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
    });
    const body = await fetchSiteJson({ siteId: site.id, user, randomId });
    expect(body.features.sort()).toMatchInlineSnapshot(`
      [
        "clickwrap_tos",
        "ga4_settings_page",
      ]
    `);
  });

  it('returns premiere fields for the site', async () => {
    const randomId = randomUUID();
    const user = await seedUser({ ctx });
    const { site } = await seedPremiereSite({
      ctx,
      siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      randomId,
    });
    const body = await fetchSiteJson({ siteId: site.id, user, randomId });
    expect(body).toMatchSnapshot({
      id: expect.any(Number),
      created_at: expect.stringMatching(DATE_REGEX),
    });
  });

  it('returns pro fields for the site', async () => {
    const randomId = randomUUID();
    const user = await seedUser({ ctx });
    const { site } = await seedSite({
      ctx,
      siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      randomId,
      settings: {
        pro_invited: 'true',
        pro_invited_on: '1664476538',
        pro_accepted: 'accepted',
        pro_accepted_on: '1664476539',
        pro_accepted_by: 'Pro Accepter',
        pro_last_audit: '2022-11-29',
        pro_last_inspected: '2022-11-29',
      },
    });
    const body = await fetchSiteJson({ siteId: site.id, user, randomId });
    expect(body).toMatchSnapshot({
      id: expect.any(Number),
      created_at: expect.stringMatching(DATE_REGEX),
    });
  });

  it('returns GA4 fields for the site', async () => {
    const randomId = randomUUID();
    const user = await seedUser({ ctx });
    const { site } = await seedSite({
      ctx,
      siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      randomId,
      siteData: {
        ga4_live_on: new Date('2023-04-24T00:00:00.000Z'),
      },
    });
    await ctx.prisma.flipper_features.upsert({
      where: { key: 'ga4_settings_page' },
      create: {
        key: 'ga4_settings_page',
        created_at: new Date(),
        updated_at: new Date(),
      },
      update: {},
    });
    await ctx.prisma.flipper_gates.create({
      data: {
        key: 'actors',
        feature_key: 'ga4_settings_page',
        value: `Site:${site.id}`,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    await seedGA4Property({
      ctx,
      siteId: site.id,
      userId: user.id,
    });
    const body = await fetchSiteJson({ siteId: site.id, user, randomId });
    expect(body.ga4_property_connected).toEqual(true);
    expect(normalizeDateTimeToUtc(body.ga4_live_on)).toEqual(
      '2023-04-24T00:00:00.000Z',
    );
    expect(body.ga4_settings_page).toEqual(true);
    expect(body.analytics_connection_status).toEqual('connected');
  });

  it('returns a site for an admin', async () => {
    const randomId = randomUUID();
    const user = await seedUser({ ctx, admin: true });
    const { site } = await seedSite({
      ctx,
      randomId,
    });
    const body = await fetchSiteJson({ siteId: site.id, user, randomId });
    expect(body).toMatchSnapshot({
      id: expect.any(Number),
      created_at: expect.stringMatching(DATE_REGEX),
    });
  });

  it('returns a site for a user with site_user reporting role', async () => {
    const randomId = randomUUID();
    const user = await seedUser({ ctx });
    const { site } = await seedSite({
      ctx,
      randomId,
      siteUsers: [{ userId: user.id, roles: [SiteUserRole.reporting] }],
    });
    const body = await fetchSiteJson({ siteId: site.id, user, randomId });
    expect(body).toMatchSnapshot({
      id: expect.any(Number),
      created_at: expect.stringMatching(DATE_REGEX),
    });
  });

  it('returns a site for a user with site_user post_termination_new_owner role', async () => {
    const randomId = randomUUID();
    const user = await seedUser({ ctx });
    const { site } = await seedSite({
      ctx,
      randomId,
      siteUsers: [
        { userId: user.id, roles: [SiteUserRole.post_termination_new_owner] },
      ],
    });
    const body = await fetchSiteJson({ siteId: site.id, user, randomId });
    expect(body).toMatchSnapshot({
      id: expect.any(Number),
      created_at: expect.stringMatching(DATE_REGEX),
    });
  });

  it('returns a site for a user with site_user without any roles', async () => {
    const randomId = randomUUID();
    const user = await seedUser({ ctx });
    const { site } = await seedSite({
      ctx,
      randomId,
      siteUsers: [{ userId: user.id, roles: [] }],
    });
    const body = await fetchSiteJson({ siteId: site.id, user, randomId });
    expect(body).toMatchSnapshot({
      id: expect.any(Number),
      created_at: expect.stringMatching(DATE_REGEX),
    });
  });

  it('returns a 401 if the user does not have access to the site', async () => {
    const randomId = randomUUID();
    const user = await seedUser({ ctx });
    const { site } = await seedSite({
      ctx,
      randomId,
    });
    const resp = await fetchSite({ siteId: site.id, user });
    expect(resp.status).toEqual(401);
  });

  it('returns a 401 if no auth header is passed', async () => {
    const randomId = randomUUID();
    const { site } = await seedSite({
      ctx,
      randomId,
    });
    const resp = await fetchSite({ siteId: site.id, user: null });
    expect(resp.status).toEqual(401);
  });

  it('returns a 404 if the site does not exist', async () => {
    const user = await seedUser({ ctx });
    const resp = await fetchSite({ siteId: 2147483647, user });
    expect(resp.status).toEqual(404);
  });

  it('can get a site with a PDS token', async () => {
    const randomId = randomUUID();
    const user = await seedUser({ ctx });
    const { site } = await seedSite({
      ctx,
      randomId,
      siteUsers: [{ userId: user.id, roles: [] }],
    });
    const body = await fetchSiteJson({
      siteId: site.id,
      user,
      clientApplicationId: 'pds',
      randomId,
    });
    expect(body).toMatchSnapshot({
      id: expect.any(Number),
      created_at: expect.stringMatching(DATE_REGEX),
    });
  });

  describe('revenue share', () => {
    it('returns correct revenue share for a pro accepted site with impressions over 85% threshold and no loyalty bonus', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedProSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 15_999_999,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<today>",
          "impressions": 15999999,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0,
          "revenue_share": 0.85,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });

    it('returns correct revenue share for a pro accepted site with impressions over 85% threshold and a loyalty bonus', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedProSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: { anniversary_on: date2YearsAgo },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 15_999_999,
      });
      const body = await fetchSiteJson({
        siteId: site.id,
        user,
        randomId,
        anniversaryOn: date2YearsAgo,
      });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_2_years_ago>",
          "impressions": 15999999,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.02,
          "revenue_share": 0.85,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.87);
    });

    it('returns correct revenue share for a pro accepted site with impressions below specific pro threshold', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedProSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 31_000,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<today>",
          "impressions": 31000,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0,
          "revenue_share": 0.85,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });

    it('returns correct revenue share for a pro accepted site with impressions below specific pro threshold and loyalty bonus', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedProSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 31_000,
      });
      const body = await fetchSiteJson({
        siteId: site.id,
        user,
        randomId,
        anniversaryOn: date3YearsAgo,
      });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 31000,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.03,
          "revenue_share": 0.82,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });

    it('returns correct revenue share for a pro accepted site with impressions above the 82.25% threshold', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedProSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 10_000_011,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 10000011,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.03,
          "revenue_share": 0.825,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.855);
    });

    it('caps the loyalty bonus at 5 years', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const date7YearsAgo = getXYearsAgoDateUtc(7);
      const { site } = await seedProSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date7YearsAgo,
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 10_000_011,
      });
      const body = await fetchSiteJson({
        siteId: site.id,
        user,
        randomId,
        anniversaryOn: date7YearsAgo,
      });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<anniversary_date>",
          "impressions": 10000011,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.05,
          "revenue_share": 0.825,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.875);
    });

    it('correctly calculate the loyalty bonus when the anniversary has not occurred yet this year', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const dateNotQuite2YearsAgo = getXYearsAgoDateUtc(2);
      dateNotQuite2YearsAgo.setDate(dateNotQuite2YearsAgo.getDate() + 1);
      const { site } = await seedProSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: dateNotQuite2YearsAgo,
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 10_000_011,
      });
      const body = await fetchSiteJson({
        siteId: site.id,
        user,
        randomId,
        anniversaryOn: dateNotQuite2YearsAgo,
      });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<anniversary_date>",
          "impressions": 10000011,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.01,
          "revenue_share": 0.84,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });

    it('returns a loyalty_bonus of 0 when anniversary_on is null', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedProSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: null,
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 10_000_011,
      });
      const body = await fetchSiteJson({
        siteId: site.id,
        user,
        randomId,
      });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "impressions": 10000011,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0,
          "revenue_share": 0.85,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });

    it('returns revenue share of 0.9 with no loyalty bonus for a premiere site', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedPremiereSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 50_000_024,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 50000024,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0,
          "revenue_share": 0.9,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });

    it('returns revenue share of 0.75 with loyalty bonus for a regular site', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 31_000,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 31000,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.03,
          "revenue_share": 0.75,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });

    it('returns revenuse_share of 1 for an owned site', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: { owned: 'true' },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 1_000_029,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 1000029,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.03,
          "revenue_share": 0.97,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });

    it('returns pro revenue share of 0.825 with loyalty bonus for a regular site that has enough impressions for Pro and has been invited but has not accepted', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: {
          pro_accepted: 'na',
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 10_000_011,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 10000011,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.03,
          "revenue_share": 0.825,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.855);
    });

    it('returns revenue share of 0.75 with loyalty bonus for a regular site that does not have enough impressions for Pro and has been invited but has not accepted', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: {
          pro_accepted: 'na',
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 1_000_029,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 1000029,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.03,
          "revenue_share": 0.75,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });

    it('uses health check revenue share for a pro site if it is available rather than calculating it', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedProSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 1_000_029,
      });
      await seedHealthCheck({
        ctx,
        siteId: site.id,
        data: { revenue_share: 8900 },
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 1000029,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.03,
          "revenue_share": 0.86,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });

    it('uses health check revenue for a premiere site if it is available rather than calculating it', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedPremiereSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 1_000_029,
      });
      await seedHealthCheck({
        ctx,
        siteId: site.id,
        data: { revenue_share: 9100 },
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 1000029,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0,
          "revenue_share": 0.91,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });

    it('uses health check revenue for an owned site if it is available rather than calculating it', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: { owned: 'true' },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 1_000_029,
      });
      await seedHealthCheck({
        ctx,
        siteId: site.id,
        data: { revenue_share: 9100 },
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 1000029,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.03,
          "revenue_share": 0.88,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });

    it('uses health check revenue for a regular site if it is available rather than calculating it', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 1_000_029,
      });
      await seedHealthCheck({
        ctx,
        siteId: site.id,
        data: { revenue_share: 7900 },
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 1000029,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.03,
          "revenue_share": 0.76,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });

    it(`only includes impression data for 32 days ago to 2 days ago for revenue share calculation`, async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedProSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
      });
      await seedRevenueReports({
        ctx,
        siteId: site.id,
        generateItem: ({ index }) => ({
          paid_impressions:
            index === 0
              ? 50_000_000
              : index === 32 || index === 33
              ? 30_000_000
              : Math.ceil(10_000_000 / 30),
        }),
        startDate: getXDaysAgoDateUtc(33),
        endDate: getXDaysAgoDateUtc(0),
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 10333354,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.03,
          "revenue_share": 0.825,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.855);
    });

    it('returns correct revenue_share for a site that has loyalty_bonus_disabled', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: {
          loyalty_bonus_disabled: 'true',
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 1_000_029,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 1000029,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0,
          "revenue_share": 0.75,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });

    it('returns correct revenue_share for a pro site that has loyalty_bonus_disabled', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedProSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: {
          loyalty_bonus_disabled: 'true',
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 10_000_011,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 10000011,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0,
          "revenue_share": 0.85,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });

    it('returns correct revenue_share for a premiere site that has loyalty_bonus_disabled', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedPremiereSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: {
          loyalty_bonus_disabled: 'true',
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 100_000_017,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 100000017,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0,
          "revenue_share": 0.9,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });

    it('returns correct revenue_share for a site that has loyalty_bonus_disabled and revenue_share is pulled from a health_check', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: {
          loyalty_bonus_disabled: 'true',
        },
      });
      await seedHealthCheck({
        ctx,
        siteId: site.id,
        data: { revenue_share: 7600 },
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 0,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0,
          "revenue_share": 0.76,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });

    it('returns correct revenue_share for a pro site that has loyalty_bonus_disabled and revenue_share is pulled from a health_check', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedProSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: {
          loyalty_bonus_disabled: 'true',
        },
      });
      await seedHealthCheck({
        ctx,
        siteId: site.id,
        data: { revenue_share: 8700 },
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 0,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0,
          "revenue_share": 0.87,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });

    it('returns correct revenue_share for a premiere site that has loyalty_bonus_disabled and revenue_share is pulled from a health_check', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedPremiereSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: {
          loyalty_bonus_disabled: 'true',
        },
      });
      await seedHealthCheck({
        ctx,
        siteId: site.id,
        data: { revenue_share: 9100 },
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 0,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0,
          "revenue_share": 0.91,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });

    it('subtracts 2.5% from revenue_share if net30_revenue_share_payments is true', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: {
          net30_revenue_share_payments: 'true',
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 1_000_029,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 1000029,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.03,
          "revenue_share": 0.725,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.825);
    });

    it('subtracts 2.5% for a pro site from revenue_share if net30_revenue_share_payments is true', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedProSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: {
          net30_revenue_share_payments: 'true',
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 1_000_029,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 1000029,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.03,
          "revenue_share": 0.795,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.825);
    });

    it('subtracts 2.5% for a pro site with impressions over the 85% threshold from revenue_share if net30_revenue_share_payments is true', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedProSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: {
          net30_revenue_share_payments: 'true',
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 15_000_001,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 15000001,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.03,
          "revenue_share": 0.825,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.855);
    });

    it('subtracts 2.5% for a premiere site if net30_revenue_share_payments is true', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedPremiereSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: {
          net30_revenue_share_payments: 'true',
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 15_000_001,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 15000001,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0,
          "revenue_share": 0.875,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.825);
    });

    it('subtracts 2.5% from revenue_share if net30_revenue_share_payments is true and revenue_share is calculated with health_check', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: {
          net30_revenue_share_payments: 'true',
        },
      });
      await seedHealthCheck({
        ctx,
        siteId: site.id,
        data: { revenue_share: 7600 },
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 0,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.03,
          "revenue_share": 0.73,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.825);
    });

    it('applies display_revenue_share_override if it is set to a greater value than calculated revenue_share', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: {
          display_revenue_share_override: '95',
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 15_000_001,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 15000001,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.03,
          "revenue_share": 0.95,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.95);
    });

    it('does not apply display_revenue_share_override if it is set to a lower value than calculated revenue_share', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: {
          display_revenue_share_override: '74',
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 15_000_001,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 15000001,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.03,
          "revenue_share": 0.75,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.88);
    });

    it('applies display_revenue_share_override to a pro site', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedProSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: {
          display_revenue_share_override: '89',
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 15_000_001,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 15000001,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.03,
          "revenue_share": 0.86,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.89);
    });

    it('applies display_revenue_share_override to a premiere site', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedPremiereSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: {
          display_revenue_share_override: '92',
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 15_000_001,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 15000001,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0,
          "revenue_share": 0.92,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.92);
    });

    it('combines display_revenue_share_override and net30_revenue_share_payments', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: {
          display_revenue_share_override: '76',
          net30_revenue_share_payments: 'true',
        },
      });
      await seedRevenueReportImpressions({
        siteId: site.id,
        totalImpressions: 1_000_029,
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 1000029,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.03,
          "revenue_share": 0.735,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.825);
    });

    it('does not apply display_revenue_override for revenue_share when a health_check is used', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
        randomId,
        siteData: {
          anniversary_on: date3YearsAgo,
        },
        settings: {
          display_revenue_share_override: '79',
        },
      });
      await seedHealthCheck({
        ctx,
        siteId: site.id,
        data: { revenue_share: 7800 },
      });
      const body = await fetchSiteJson({ siteId: site.id, user, randomId });
      expect(body.loyalty).toMatchInlineSnapshot(`
        {
          "anniversary_on": "<date_3_years_ago>",
          "impressions": 0,
          "impressions_for_eighty": 5000000,
          "impressions_for_eightyfive": 15000000,
          "impressions_for_eightytwofive": 10000000,
          "live_on": "2023-01-01",
          "loyalty_bonus": 0.03,
          "revenue_share": 0.75,
        }
      `);
      expect(body.revenue_share_pro).toEqual(0.85);
    });
  });
});

interface FetchSiteParams {
  siteId: number;
  user: { id: number; jwt_secret: string } | null;
  clientApplicationId?: string;
}
const fetchSite = async ({
  siteId,
  user,
  clientApplicationId,
}: FetchSiteParams) => {
  return fetch(`${ctx.host}/api/v1/sites/${siteId}`, {
    headers: user
      ? {
          Authorization: generateAuthToken(user, clientApplicationId),
        }
      : undefined,
  });
};

interface FetchSiteJsonParams {
  siteId: number;
  user: { id: number; jwt_secret: string } | null;
  clientApplicationId?: string;
  randomId: string;
  anniversaryOn?: Date;
}

const fetchSiteJson = async ({
  siteId,
  user,
  clientApplicationId,
  randomId,
  anniversaryOn,
}: FetchSiteJsonParams) => {
  const resp = await fetchSite({ siteId, user, clientApplicationId });
  const body = (await resp.json()) as SerializeDto<GetSiteResponseDto>;
  return processSiteResponseBody({ body, randomId, anniversaryOn });
};

interface ProcessSiteResponseBodyParams {
  body: SerializeDto<GetSiteResponseDto>;
  randomId: string;
  anniversaryOn?: Date;
}
const processSiteResponseBody = ({
  body,
  randomId,
  anniversaryOn,
}: ProcessSiteResponseBodyParams) => {
  let anniversary_on = body.site.loyalty?.anniversary_on
    ?.replace(getMonthDayYearDateString(date2YearsAgo), '<date_2_years_ago>')
    .replace(getMonthDayYearDateString(date3YearsAgo), '<date_3_years_ago>')
    .replace(getMonthDayYearDateString(getTodayDateUtc()), '<today>');
  if (anniversaryOn) {
    anniversary_on = anniversary_on?.replace(
      getMonthDayYearDateString(anniversaryOn),
      '<anniversary_date>',
    );
  }
  return replaceRandomId(
    {
      ...body.site,
      created_at: normalizeDateTimeToUtc(body.site.created_at),
      accepted_terms_of_service_on: normalizeDateTimeToUtc(
        body.site.accepted_terms_of_service_on,
      ),
      ganalytics_refresh_token_expired_at: normalizeDateTimeToUtc(
        body.site.ganalytics_refresh_token_expired_at,
      ),
      premiere_accepted_on: normalizeDateTimeToUtc(
        body.site.premiere_accepted_on,
      ),
      pro_accepted_on: normalizeDateTimeToUtc(body.site.pro_accepted_on),
      pro_invited_on: normalizeDateTimeToUtc(body.site.pro_invited_on),
      images: {
        ...body.site.images,
        screenshot: body.site.images.screenshot?.replace(
          /s--.*--/g,
          '<cloudinaryHash>',
        ),
      },
      loyalty: body.site.loyalty
        ? {
            ...body.site.loyalty,
            anniversary_on,
          }
        : undefined,
    },
    randomId,
  );
};

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
    }),
    startDate: getXDaysAgoDateUtc(33),
    endDate: getXDaysAgoDateUtc(1),
  });
};
