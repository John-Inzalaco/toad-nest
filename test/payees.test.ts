import { randomUUID } from 'crypto';
import {
  createTestContext,
  generateAuthToken,
  normalizeDateTimeToUtc,
  seedSite,
  seedUser,
  testSiteUserRoleAccess,
} from './__helpers';
import { SiteUserRole } from '../src/users/SiteUserRole.enum';
import { GetPayeeResponseDto } from '../src/payees/dto/GetPayee.dto';
import { Prisma, payees, sites } from '@prisma/dashboard';
import { SerializeDto } from '../src/utils/serializeDto';
import { hashQueryString } from '../src/payees/helpers/hashQueryString';
import { GetExistingPayeesResponseDto } from '../src/payees/dto/GetExistingPayees.dto';

const ctx = createTestContext();

const { TIPALTI_API_KEY = '' } = process.env;

describe('payees routes', () => {
  describe('hashQueryString', () => {
    it('returns the expected value', () => {
      expect(
        hashQueryString({
          queryString:
            'idap=56236f4c-cca0-4301-a6f1-8386a8b3a57c&payer=MEDIAVINE&ts=1688671973',
          key: TIPALTI_API_KEY,
        }),
      ).toEqual(
        'a1a10f62bfa40849a901fd01b4f51989b8fc3b70b76d7515bf77e82797f40b02',
      );

      expect(
        hashQueryString({
          queryString:
            'idap=bab1f788-be7a-4daa-a580-926e9423d455&payer=MEDIAVINE&redirectto=http%3A%2F%2Flocalhost%3A6000%2F%3Ftipalti_completed%3Dtrue&ts=1688672517',
          key: TIPALTI_API_KEY,
        }),
      ).toEqual(
        'd5b16eaac5aaf3f6085c216a279738d3d3bae13c98651e533cc4f5305a61819b',
      );
    });
  });

  describe('GET /api/v1/sites/:site_id/site_settings/payees', () => {
    it('returns the payee for a site without a payee', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const body = await fetchPayeeJson({
        siteId: site.id,
        user,
        randomId,
        payeeId: null,
      });
      expect(body).toMatchInlineSnapshot(`
        {
          "frames": {
            "edit_profile": null,
            "history": null,
          },
          "payee": null,
          "payee_name_updated": null,
          "site": "<site_id>",
        }
      `);
    });

    it('returns the payee for a site with a payee', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const payee = await seedPayee({ uuid: randomId });
      const { site } = await seedSite({
        ctx,
        siteData: {
          payee_id: payee.id,
        },
        settings: {
          payee_name_updated: 'true',
        },
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const body = await fetchPayeeJson({
        siteId: site.id,
        user,
        randomId,
        payeeId: payee.id,
      });
      expect(body).toMatchInlineSnapshot(`
        {
          "frames": {
            "edit_profile": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui.sandbox.tipalti.com/Payees/PayeeDashboard.aspx?idap=<uuid>&payer=MEDIAVINE&redirectto=http%3A%2F%2Flocalhost%3A6000%2F%3Ftipalti_completed%3Dtrue&ts=<timestamp>&hashkey=<hashkey>" />",
            "history": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui2.sandbox.tipalti.com/PayeeDashboard/PaymentsHistory?idap=<uuid>&payer=MEDIAVINE&ts=<timestamp>&hashkey=<hashkey>" />",
          },
          "payee": {
            "created_at": "2023-07-06T15:45:15.838Z",
            "id": "<payee_id>",
            "name": "Payee Name",
            "tipalti_completed": true,
            "updated_at": "2023-07-06T15:45:15.839Z",
            "uuid": "<uuid>",
          },
          "payee_name_updated": true,
          "site": "<site_id>",
        }
      `);
    });

    it('returns the payee for a site with a payee where payee_name_updated is false and tipalti_completed is false', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const payee = await seedPayee({
        uuid: randomId,
        tipalti_completed: false,
      });
      const { site } = await seedSite({
        ctx,
        siteData: {
          payee_id: payee.id,
        },
        settings: {
          payee_name_updated: 'false',
        },
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const body = await fetchPayeeJson({
        siteId: site.id,
        user,
        randomId,
        payeeId: payee.id,
      });
      expect(body).toMatchInlineSnapshot(`
        {
          "frames": {
            "edit_profile": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui.sandbox.tipalti.com/Payees/PayeeDashboard.aspx?idap=<uuid>&payer=MEDIAVINE&redirectto=http%3A%2F%2Flocalhost%3A6000%2F%3Ftipalti_completed%3Dtrue&ts=<timestamp>&hashkey=<hashkey>" />",
            "history": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui2.sandbox.tipalti.com/PayeeDashboard/PaymentsHistory?idap=<uuid>&payer=MEDIAVINE&ts=<timestamp>&hashkey=<hashkey>" />",
          },
          "payee": {
            "created_at": "2023-07-06T15:45:15.838Z",
            "id": "<payee_id>",
            "name": "Payee Name",
            "tipalti_completed": false,
            "updated_at": "2023-07-06T15:45:15.839Z",
            "uuid": "<uuid>",
          },
          "payee_name_updated": false,
          "site": "<site_id>",
        }
      `);
    });

    it('returns the payee for a site with a payee where payee_name_updated is null and tipalti_completed is null', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const payee = await seedPayee({
        uuid: randomId,
        tipalti_completed: null,
      });
      const { site } = await seedSite({
        ctx,
        siteData: {
          payee_id: payee.id,
        },
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const body = await fetchPayeeJson({
        siteId: site.id,
        user,
        randomId,
        payeeId: payee.id,
      });
      expect(body).toMatchInlineSnapshot(`
        {
          "frames": {
            "edit_profile": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui.sandbox.tipalti.com/Payees/PayeeDashboard.aspx?idap=<uuid>&payer=MEDIAVINE&redirectto=http%3A%2F%2Flocalhost%3A6000%2F%3Ftipalti_completed%3Dtrue&ts=<timestamp>&hashkey=<hashkey>" />",
            "history": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui2.sandbox.tipalti.com/PayeeDashboard/PaymentsHistory?idap=<uuid>&payer=MEDIAVINE&ts=<timestamp>&hashkey=<hashkey>" />",
          },
          "payee": {
            "created_at": "2023-07-06T15:45:15.838Z",
            "id": "<payee_id>",
            "name": "Payee Name",
            "tipalti_completed": null,
            "updated_at": "2023-07-06T15:45:15.839Z",
            "uuid": "<uuid>",
          },
          "payee_name_updated": null,
          "site": "<site_id>",
        }
      `);
    });

    it('returns correct iframe urls', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const payee = await seedPayee({
        uuid: randomId,
        tipalti_completed: false,
      });
      const { site } = await seedSite({
        ctx,
        siteData: {
          payee_id: payee.id,
        },
        settings: {
          payee_name_updated: 'false',
        },
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const resp = await fetchPayee({
        siteId: site.id,
        user,
      });
      const body = (await resp.json()) as SerializeDto<GetPayeeResponseDto>;
      const { frames } = body.site;
      const historySrc = frames.history?.match(/src="(.*)"/)?.[1] || '';
      const historyUrl = new URL(
        historySrc?.replace(new RegExp('&amp;', 'g'), '&'),
      );
      const historyTs = Number(historyUrl.searchParams.get('ts'));
      const historyTsDiff = Date.now() / 1000 - historyTs;
      const historyHashkey = historyUrl.searchParams.get('hashkey');
      const historyQueryStringWithoutHashkey = historyUrl.search
        .replace('?', '')
        .replace(`&hashkey=${historyHashkey}`, '');

      expect(historyTsDiff).toBeLessThan(10);
      expect(historyTsDiff).toBeGreaterThan(0);
      expect(
        hashQueryString({
          queryString: historyQueryStringWithoutHashkey,
          key: TIPALTI_API_KEY,
        }),
      ).toEqual(historyHashkey);

      const profileSrc = frames.edit_profile?.match(/src="(.*)"/)?.[1] || '';
      const profileUrl = new URL(
        profileSrc?.replace(new RegExp('&amp;', 'g'), '&'),
      );
      const profileTs = Number(profileUrl.searchParams.get('ts'));
      const profileTsDiff = new Date().getTime() / 1000 - profileTs;
      const profileHashkey = profileUrl.searchParams.get('hashkey');
      const profileQueryStringWithoutHashkey = profileUrl.search
        .replace('?', '')
        .replace(`&hashkey=${profileHashkey}`, '');

      expect(profileTsDiff).toBeLessThan(10);
      expect(profileTsDiff).toBeGreaterThan(0);
      expect(
        hashQueryString({
          queryString: profileQueryStringWithoutHashkey,
          key: TIPALTI_API_KEY,
        }),
      ).toEqual(profileHashkey);
    });

    it('returns a 404 if the site is not found', async () => {
      const user = await seedUser({ ctx });
      const resp = await fetchPayee({
        siteId: 999999999,
        user,
      });
      expect(resp.status).toEqual(404);
    });

    describe('User Role Access', () => {
      void testSiteUserRoleAccess({
        ctx,
        expectedStatuses: {
          ad_settings: 401,
          admin: 200,
          owner: 200,
          payment: 200,
          post_termination_new_owner: 401,
          reporting: 401,
          video: 401,
        },
        makeRequest: async ({ user, siteId }) => {
          const resp = await fetchPayee({
            siteId,
            user,
          });
          return resp;
        },
      });
    });
  });

  describe('POST /api/v1/sites/:site_id/site_settings/payees', () => {
    it('creates a payee and associates it with the site', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const body = await createPayeeJson({
        siteId: site.id,
        user,
      });

      expect(body).toMatchInlineSnapshot(`
        {
          "frames": {
            "edit_profile": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui.sandbox.tipalti.com/Payees/PayeeDashboard.aspx?idap=<uuid>&payer=MEDIAVINE&redirectto=http%3A%2F%2Flocalhost%3A6000%2F%3Ftipalti_completed%3Dtrue&ts=<timestamp>&hashkey=<hashkey>" />",
            "history": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui2.sandbox.tipalti.com/PayeeDashboard/PaymentsHistory?idap=<uuid>&payer=MEDIAVINE&ts=<timestamp>&hashkey=<hashkey>" />",
          },
          "payee": {
            "created_at": "<created_at>",
            "id": "<payee_id>",
            "name": "Payee Name",
            "tipalti_completed": false,
            "updated_at": "<updated_at>",
            "uuid": "<uuid>",
          },
          "payee_name_updated": null,
          "site": "<site_id>",
        }
      `);
    });

    it('does not allow creating a payee for a test_site', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        siteData: {
          test_site: true,
        },
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const resp = await createPayee({
        siteId: site.id,
        user,
      });
      expect(resp.status).toEqual(422);
      const error = await resp.json();
      expect(error).toMatchInlineSnapshot(`
        {
          "sites": [
            "You cannot create a Payee Profile for a Test Site",
          ],
        }
      `);
    });

    it('overwrites a payee if one is already on the site', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const payee = await seedPayee({
        name: 'Replacement Payee',
        uuid: randomId,
        tipalti_completed: true,
      });
      const { site } = await seedSite({
        ctx,
        siteData: { payee_id: payee.id },
        settings: { payee_name_updated: 'true' },
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const body = await createPayeeJson({
        siteId: site.id,
        user,
      });
      // Question: Should payee_name_updated stay true here?
      // Does this case even exist?
      expect(body).toMatchInlineSnapshot(`
        {
          "frames": {
            "edit_profile": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui.sandbox.tipalti.com/Payees/PayeeDashboard.aspx?idap=<uuid>&payer=MEDIAVINE&redirectto=http%3A%2F%2Flocalhost%3A6000%2F%3Ftipalti_completed%3Dtrue&ts=<timestamp>&hashkey=<hashkey>" />",
            "history": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui2.sandbox.tipalti.com/PayeeDashboard/PaymentsHistory?idap=<uuid>&payer=MEDIAVINE&ts=<timestamp>&hashkey=<hashkey>" />",
          },
          "payee": {
            "created_at": "<created_at>",
            "id": "<payee_id>",
            "name": "Payee Name",
            "tipalti_completed": false,
            "updated_at": "<updated_at>",
            "uuid": "<uuid>",
          },
          "payee_name_updated": true,
          "site": "<site_id>",
        }
      `);
    });

    it('returns a 400 if attempting to create a payee with an empty string name', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const resp = await createPayee({
        siteId: site.id,
        name: '',
        user,
      });
      expect(resp.status).toEqual(process.env.USE_RAILS_API ? 422 : 400);
    });

    describe('User Role Access', () => {
      void testSiteUserRoleAccess({
        ctx,
        expectedStatuses: {
          ad_settings: 401,
          admin: process.env.USE_RAILS_API ? 200 : 201,
          owner: process.env.USE_RAILS_API ? 200 : 201,
          payment: process.env.USE_RAILS_API ? 200 : 201,
          post_termination_new_owner: 401,
          reporting: 401,
          video: 401,
        },
        makeRequest: async ({ user, siteId }) => {
          const resp = await createPayee({
            siteId,
            user,
          });
          return resp;
        },
      });
    });
  });

  describe('GET /api/v1/sites/:siteId/site_settings/payees/existing_payees', () => {
    it('returns the payee for an owner', async () => {
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const { sites, payees } = await seedExistingPayees(user.id);
      const body = await fetchExistingPayeesJson({
        siteId: site.id,
        user,
        sites,
        payees,
      });
      if (process.env.USE_RAILS_API) {
        expect(body).toMatchInlineSnapshot(`
          [
            {
              "id": "<payee_id 1>",
              "name": "Payee 1",
              "tipalti_completed": true,
              "uuid": "<payee_uuid 1>",
            },
            {
              "id": "<payee_id 2>",
              "name": "Payee 2",
              "tipalti_completed": false,
              "uuid": "<payee_uuid 2>",
            },
            {
              "id": "<payee_id 3>",
              "name": "Payee 3",
              "tipalti_completed": false,
              "uuid": "<payee_uuid 3>",
            },
            {
              "id": "<payee_id 4>",
              "name": "Payee 4",
              "tipalti_completed": true,
              "uuid": "<payee_uuid 4>",
            },
            {
              "id": "<payee_id 5>",
              "name": "Payee 5",
              "tipalti_completed": true,
              "uuid": "<payee_uuid 5>",
            },
            {
              "id": "<payee_id 6>",
              "name": "Payee 6",
              "tipalti_completed": true,
              "uuid": "<payee_uuid 6>",
            },
          ]
        `);
      } else {
        expect(body).toMatchInlineSnapshot(`
          [
            {
              "id": "<payee_id 2>",
              "name": "Payee 2",
              "tipalti_completed": false,
              "uuid": "<payee_uuid 2>",
            },
            {
              "id": "<payee_id 3>",
              "name": "Payee 3",
              "tipalti_completed": false,
              "uuid": "<payee_uuid 3>",
            },
          ]
        `);
      }
    });

    it('returns the payee for an admin', async () => {
      const user = await seedUser({ ctx, admin: true });
      const { site } = await seedSite({
        ctx,
      });
      const { sites, payees } = await seedExistingPayees(user.id);
      const body = await fetchExistingPayeesJson({
        siteId: site.id,
        user,
        sites,
        payees,
      });
      expect(body).toMatchInlineSnapshot(`
        [
          {
            "id": "<payee_id 1>",
            "name": "Payee 1",
            "tipalti_completed": true,
            "uuid": "<payee_uuid 1>",
          },
          {
            "id": "<payee_id 2>",
            "name": "Payee 2",
            "tipalti_completed": false,
            "uuid": "<payee_uuid 2>",
          },
          {
            "id": "<payee_id 3>",
            "name": "Payee 3",
            "tipalti_completed": false,
            "uuid": "<payee_uuid 3>",
          },
          {
            "id": "<payee_id 4>",
            "name": "Payee 4",
            "tipalti_completed": true,
            "uuid": "<payee_uuid 4>",
          },
          {
            "id": "<payee_id 5>",
            "name": "Payee 5",
            "tipalti_completed": true,
            "uuid": "<payee_uuid 5>",
          },
          {
            "id": "<payee_id 6>",
            "name": "Payee 6",
            "tipalti_completed": true,
            "uuid": "<payee_uuid 6>",
          },
          {
            "id": "<payee_id 7>",
            "name": "Payee Not On Associated Site",
            "tipalti_completed": true,
            "uuid": "<payee_uuid 7>",
          },
        ]
      `);
    });

    it('returns a 404 if the site does not exist', async () => {
      const user = await seedUser({ ctx });
      await seedExistingPayees(user.id);
      const resp = await fetchExistingPayees({
        siteId: 999999999,
        user,
      });
      expect(resp.status).toEqual(404);
    });

    it('returns a 400 if the site id is invalid', async () => {
      const user = await seedUser({ ctx });
      await seedExistingPayees(user.id);
      const resp = await fetchExistingPayees({
        siteId: 'abc' as unknown as number,
        user,
      });
      expect(resp.status).toEqual(process.env.USE_RAILS_API ? 404 : 400);
    });

    describe('User Role Access', () => {
      void testSiteUserRoleAccess({
        ctx,
        expectedStatuses: {
          ad_settings: 401,
          admin: 200,
          owner: 200,
          payment: 200,
          post_termination_new_owner: 401,
          reporting: 401,
          video: 401,
        },
        makeRequest: async ({ user, siteId }) => {
          const resp = await fetchExistingPayees({
            siteId,
            user,
          });
          return resp;
        },
      });
    });
  });

  describe('PATCH /api/v1/sites/:siteId/site_settings/payees/confirm_payee_name', () => {
    it('sets payee_name_updated to true', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const payee = await seedPayee({ uuid: randomId });
      const { site } = await seedSite({
        ctx,
        siteData: {
          payee_id: payee.id,
        },
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const body = await confirmPayeeNameJson({
        siteId: site.id,
        user,
        randomId,
        payeeId: payee.id,
      });
      expect(body).toMatchInlineSnapshot(`
        {
          "frames": {
            "edit_profile": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui.sandbox.tipalti.com/Payees/PayeeDashboard.aspx?idap=<uuid>&payer=MEDIAVINE&redirectto=http%3A%2F%2Flocalhost%3A6000%2F%3Ftipalti_completed%3Dtrue&ts=<timestamp>&hashkey=<hashkey>" />",
            "history": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui2.sandbox.tipalti.com/PayeeDashboard/PaymentsHistory?idap=<uuid>&payer=MEDIAVINE&ts=<timestamp>&hashkey=<hashkey>" />",
          },
          "payee": {
            "created_at": "2023-07-06T15:45:15.838Z",
            "id": "<payee_id>",
            "name": "Payee Name",
            "tipalti_completed": true,
            "updated_at": "2023-07-06T15:45:15.839Z",
            "uuid": "<uuid>",
          },
          "payee_name_updated": true,
          "site": "<site_id>",
        }
      `);
    });

    it('sets payee_name_updated to true even if there is no payee', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const body = await confirmPayeeNameJson({
        siteId: site.id,
        user,
        randomId,
        payeeId: null,
      });
      expect(body).toMatchInlineSnapshot(`
        {
          "frames": {
            "edit_profile": null,
            "history": null,
          },
          "payee": null,
          "payee_name_updated": true,
          "site": "<site_id>",
        }
      `);
    });

    it('succeeds even if payee_name_updated is already true', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const payee = await seedPayee({ uuid: randomId });
      const { site } = await seedSite({
        ctx,
        siteData: {
          payee_id: payee.id,
        },
        settings: { payee_name_updated: 'true' },
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const body = await confirmPayeeNameJson({
        siteId: site.id,
        user,
        randomId,
        payeeId: payee.id,
      });
      expect(body).toMatchInlineSnapshot(`
        {
          "frames": {
            "edit_profile": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui.sandbox.tipalti.com/Payees/PayeeDashboard.aspx?idap=<uuid>&payer=MEDIAVINE&redirectto=http%3A%2F%2Flocalhost%3A6000%2F%3Ftipalti_completed%3Dtrue&ts=<timestamp>&hashkey=<hashkey>" />",
            "history": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui2.sandbox.tipalti.com/PayeeDashboard/PaymentsHistory?idap=<uuid>&payer=MEDIAVINE&ts=<timestamp>&hashkey=<hashkey>" />",
          },
          "payee": {
            "created_at": "2023-07-06T15:45:15.838Z",
            "id": "<payee_id>",
            "name": "Payee Name",
            "tipalti_completed": true,
            "updated_at": "2023-07-06T15:45:15.839Z",
            "uuid": "<uuid>",
          },
          "payee_name_updated": true,
          "site": "<site_id>",
        }
      `);
    });

    describe('User Role Access', () => {
      void testSiteUserRoleAccess({
        ctx,
        expectedStatuses: {
          ad_settings: 401,
          admin: 200,
          owner: 200,
          payment: 200,
          post_termination_new_owner: 401,
          reporting: 401,
          video: 401,
        },
        makeRequest: async ({ user, siteId }) => {
          const resp = await confirmPayeeName({
            siteId,
            user,
          });
          return resp;
        },
      });
    });
  });

  describe('PATCH /api/v1/sites/:siteId/site_settings/payees/confirm', () => {
    it('sets tipalti_completed to true', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const payee = await seedPayee({
        uuid: randomId,
        tipalti_completed: false,
      });
      const { site } = await seedSite({
        ctx,
        siteData: {
          payee_id: payee.id,
        },
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const body = await confirmPayeeJson({
        siteId: site.id,
        user,
        randomId,
        payeeId: payee.id,
      });
      expect(body).toMatchInlineSnapshot(`
        {
          "frames": {
            "edit_profile": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui.sandbox.tipalti.com/Payees/PayeeDashboard.aspx?idap=<uuid>&payer=MEDIAVINE&redirectto=http%3A%2F%2Flocalhost%3A6000%2F%3Ftipalti_completed%3Dtrue&ts=<timestamp>&hashkey=<hashkey>" />",
            "history": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui2.sandbox.tipalti.com/PayeeDashboard/PaymentsHistory?idap=<uuid>&payer=MEDIAVINE&ts=<timestamp>&hashkey=<hashkey>" />",
          },
          "payee": {
            "created_at": "2023-07-06T15:45:15.838Z",
            "id": "<payee_id>",
            "name": "Payee Name",
            "tipalti_completed": true,
            "updated_at": "<updated_at>",
            "uuid": "<uuid>",
          },
          "payee_name_updated": null,
          "site": "<site_id>",
        }
      `);
    });

    it('succeeds even if tipalti_completed is already true', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const payee = await seedPayee({
        uuid: randomId,
        tipalti_completed: true,
      });
      const { site } = await seedSite({
        ctx,
        siteData: {
          payee_id: payee.id,
        },
        settings: { payee_name_updated: 'true' },
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const body = await confirmPayeeJson({
        siteId: site.id,
        user,
        randomId,
        payeeId: payee.id,
      });
      expect(body).toMatchInlineSnapshot(`
        {
          "frames": {
            "edit_profile": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui.sandbox.tipalti.com/Payees/PayeeDashboard.aspx?idap=<uuid>&payer=MEDIAVINE&redirectto=http%3A%2F%2Flocalhost%3A6000%2F%3Ftipalti_completed%3Dtrue&ts=<timestamp>&hashkey=<hashkey>" />",
            "history": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui2.sandbox.tipalti.com/PayeeDashboard/PaymentsHistory?idap=<uuid>&payer=MEDIAVINE&ts=<timestamp>&hashkey=<hashkey>" />",
          },
          "payee": {
            "created_at": "2023-07-06T15:45:15.838Z",
            "id": "<payee_id>",
            "name": "Payee Name",
            "tipalti_completed": true,
            "updated_at": "<updated_at>",
            "uuid": "<uuid>",
          },
          "payee_name_updated": true,
          "site": "<site_id>",
        }
      `);
    });

    it('404s if there is no site', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });

      const resp = await confirmPayee({
        siteId: 9999999,
        user,
      });
      expect(resp.status).toEqual(404);
    });

    it('422s if there is no payee on the site', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const resp = await confirmPayee({
        siteId: site.id,
        user,
      });
      expect(resp.status).toEqual(process.env.USE_RAILS_API ? 500 : 422);
    });

    describe('User Role Access', () => {
      void testSiteUserRoleAccess({
        ctx,
        expectedStatuses: {
          ad_settings: 401,
          admin: 200,
          owner: 200,
          payment: 200,
          post_termination_new_owner: 401,
          reporting: 401,
          video: 401,
        },
        makeRequest: async ({ user, siteId }) => {
          const payee = await seedPayee({});
          await ctx.prisma.sites.update({
            data: { payee_id: payee.id },
            where: { id: siteId },
          });
          const resp = await confirmPayee({
            siteId,
            user,
          });
          return resp;
        },
      });
    });
  });

  describe('PATCH /api/v1/sites/:siteId/site_settings/payees/choose', () => {
    const siteUserRoles = Object.entries(SiteUserRole);
    for (const existingSiteRole of siteUserRoles) {
      const [existingSiteRoleName, existingSiteRoleValue] = existingSiteRole;
      if (
        typeof existingSiteRoleValue !== 'number' ||
        existingSiteRoleValue === SiteUserRole.owner ||
        existingSiteRoleValue === SiteUserRole.payment
      ) {
        continue;
      }
      for (const addToSiteRole of [
        ['owner', SiteUserRole.owner],
        ['payment', SiteUserRole.payment],
      ]) {
        const [addToSiteRoleName, addToSiteRoleValue] = addToSiteRole;
        if (typeof addToSiteRoleValue !== 'number') {
          continue;
        }

        it(`Prevents access to payee when Existing Site Role: ${existingSiteRoleName}, Add to Site Role: ${addToSiteRoleName} `, async () => {
          const randomId = randomUUID();
          const user = await seedUser({ ctx, randomId });
          const payee = await seedPayee({
            uuid: randomId,
          });
          await seedSite({
            ctx,
            siteData: {
              payee_id: payee.id,
            },
            siteUsers: [{ userId: user.id, roles: [existingSiteRoleValue] }],
          });
          const { site } = await seedSite({
            ctx,
            siteUsers: [{ userId: user.id, roles: [addToSiteRoleValue] }],
          });
          const resp = await choosePayee({
            siteId: site.id,
            user,
            payeeId: payee.id,
          });
          expect(resp.status).toEqual(process.env.USE_RAILS_API ? 200 : 403);
        });
      }
    }

    it('prevents choosing a payee on a site that a user has no access to', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const payee = await seedPayee({
        uuid: randomId,
      });
      await seedSite({
        ctx,
        siteData: {
          payee_id: payee.id,
        },
      });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const resp = await choosePayee({
        siteId: site.id,
        user,
        payeeId: payee.id,
      });
      expect(resp.status).toEqual(process.env.USE_RAILS_API ? 200 : 403);
    });

    it('sets an existing payee to the payee for a site with owner roles', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const payee = await seedPayee({
        uuid: randomId,
      });
      await seedSite({
        ctx,
        siteData: {
          payee_id: payee.id,
        },
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const body = await choosePayeeJson({
        siteId: site.id,
        user,
        randomId,
        payeeId: payee.id,
      });
      expect(body).toMatchInlineSnapshot(`
        {
          "frames": {
            "edit_profile": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui.sandbox.tipalti.com/Payees/PayeeDashboard.aspx?idap=<uuid>&payer=MEDIAVINE&redirectto=http%3A%2F%2Flocalhost%3A6000%2F%3Ftipalti_completed%3Dtrue&ts=<timestamp>&hashkey=<hashkey>" />",
            "history": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui2.sandbox.tipalti.com/PayeeDashboard/PaymentsHistory?idap=<uuid>&payer=MEDIAVINE&ts=<timestamp>&hashkey=<hashkey>" />",
          },
          "payee": {
            "created_at": "2023-07-06T15:45:15.838Z",
            "id": "<payee_id>",
            "name": "Payee Name",
            "tipalti_completed": true,
            "updated_at": "2023-07-06T15:45:15.839Z",
            "uuid": "<uuid>",
          },
          "payee_name_updated": null,
          "site": "<site_id>",
        }
      `);
    });

    it('sets an existing payee to the payee for a site with payment roles', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const payee = await seedPayee({
        uuid: randomId,
      });
      await seedSite({
        ctx,
        siteData: {
          payee_id: payee.id,
        },
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.payment] }],
      });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.payment] }],
      });
      const body = await choosePayeeJson({
        siteId: site.id,
        user,
        randomId,
        payeeId: payee.id,
      });
      expect(body).toMatchInlineSnapshot(`
        {
          "frames": {
            "edit_profile": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui.sandbox.tipalti.com/Payees/PayeeDashboard.aspx?idap=<uuid>&payer=MEDIAVINE&redirectto=http%3A%2F%2Flocalhost%3A6000%2F%3Ftipalti_completed%3Dtrue&ts=<timestamp>&hashkey=<hashkey>" />",
            "history": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui2.sandbox.tipalti.com/PayeeDashboard/PaymentsHistory?idap=<uuid>&payer=MEDIAVINE&ts=<timestamp>&hashkey=<hashkey>" />",
          },
          "payee": {
            "created_at": "2023-07-06T15:45:15.838Z",
            "id": "<payee_id>",
            "name": "Payee Name",
            "tipalti_completed": true,
            "updated_at": "2023-07-06T15:45:15.839Z",
            "uuid": "<uuid>",
          },
          "payee_name_updated": null,
          "site": "<site_id>",
        }
      `);
    });

    it('sets an existing payee to the payee for a site as an admin', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId, admin: true });
      const payee = await seedPayee({
        uuid: randomId,
      });
      await seedSite({
        ctx,
        siteData: {
          payee_id: payee.id,
        },
      });
      const { site } = await seedSite({
        ctx,
      });
      const body = await choosePayeeJson({
        siteId: site.id,
        user,
        randomId,
        payeeId: payee.id,
      });
      expect(body).toMatchInlineSnapshot(`
        {
          "frames": {
            "edit_profile": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui.sandbox.tipalti.com/Payees/PayeeDashboard.aspx?idap=<uuid>&payer=MEDIAVINE&redirectto=http%3A%2F%2Flocalhost%3A6000%2F%3Ftipalti_completed%3Dtrue&ts=<timestamp>&hashkey=<hashkey>" />",
            "history": "<iframe id="tipalti" width="100%" height="1400px;" style="border: 0; margin: 0;" src="https://ui2.sandbox.tipalti.com/PayeeDashboard/PaymentsHistory?idap=<uuid>&payer=MEDIAVINE&ts=<timestamp>&hashkey=<hashkey>" />",
          },
          "payee": {
            "created_at": "2023-07-06T15:45:15.838Z",
            "id": "<payee_id>",
            "name": "Payee Name",
            "tipalti_completed": true,
            "updated_at": "2023-07-06T15:45:15.839Z",
            "uuid": "<uuid>",
          },
          "payee_name_updated": null,
          "site": "<site_id>",
        }
      `);
    });

    it('404s if there is no site', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });

      const resp = await confirmPayee({
        siteId: 9999999,
        user,
      });
      expect(resp.status).toEqual(404);
    });

    it('404s if there is no payee', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.payment] }],
      });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.payment] }],
      });
      const resp = await choosePayee({
        siteId: site.id,
        user,
        payeeId: 9999999,
      });
      expect(resp.status).toEqual(404);
    });

    describe('User Role Access', () => {
      void testSiteUserRoleAccess({
        ctx,
        expectedStatuses: {
          ad_settings: 401,
          admin: 200,
          owner: 200,
          payment: 200,
          post_termination_new_owner: 401,
          reporting: 401,
          video: 401,
        },
        makeRequest: async ({ user, siteId }) => {
          const payee = await seedPayee({});
          await seedSite({
            ctx,
            siteUsers: [{ roles: [SiteUserRole.owner], userId: user.id }],
            siteData: { payee_id: payee.id },
          });
          const resp = await choosePayee({
            siteId,
            payeeId: payee.id,
            user,
          });
          return resp;
        },
      });
    });
  });
});

interface FetchPayeeParams {
  siteId: number;
  user: { id: number; jwt_secret: string } | null;
}
async function fetchPayee({ siteId, user }: FetchPayeeParams) {
  return fetch(`${ctx.host}/api/v1/sites/${siteId}/site_settings/payees`, {
    referrer: 'http://localhost:6000/',
    headers: user
      ? {
          Authorization: generateAuthToken(user),
        }
      : undefined,
  });
}
interface FetchPayeeJsonParams {
  siteId: number;
  payeeId: number | null;
  user: { id: number; jwt_secret: string } | null;
  randomId: string;
}
async function fetchPayeeJson(params: FetchPayeeJsonParams) {
  const resp = await fetchPayee(params);
  const body = (await resp.json()) as SerializeDto<GetPayeeResponseDto>;
  return processFetchPayeeResponse({
    body,
    siteId: params.siteId,
    randomId: params.randomId,
    payeeId: params.payeeId,
  });
}

interface CreatePayeeParams {
  name?: string;
  siteId: number;
  user: { id: number; jwt_secret: string } | null;
}
async function createPayee({
  siteId,
  user,
  name = 'Payee Name',
}: CreatePayeeParams) {
  return fetch(`${ctx.host}/api/v1/sites/${siteId}/site_settings/payees`, {
    method: 'POST',
    body: JSON.stringify({ name }),
    referrer: 'http://localhost:6000/',
    headers: {
      'Content-Type': 'application/json',
      ...(user ? { Authorization: generateAuthToken(user) } : {}),
    },
  });
}

interface CreatePayeeJsonParams {
  siteId: number;
  user: { id: number; jwt_secret: string } | null;
}
async function createPayeeJson(params: CreatePayeeJsonParams) {
  const resp = await createPayee(params);
  const body = (await resp.json()) as SerializeDto<GetPayeeResponseDto>;
  const site = await ctx.prisma.sites.findUnique({
    include: { payees: true },
    where: { id: params.siteId },
  });
  const processedBody = processFetchPayeeResponse({
    body,
    siteId: params.siteId,
    payeeId: site?.payees?.id || null,
    randomId: site?.payees?.uuid || '',
  });
  return {
    ...processedBody,
    payee: {
      ...processedBody.payee,
      created_at: '<created_at>',
      updated_at: '<updated_at>',
    },
  };
}

interface FetchExistingPayeeParams {
  siteId: number;
  user: { id: number; jwt_secret: string } | null;
}
async function fetchExistingPayees({ siteId, user }: FetchExistingPayeeParams) {
  return fetch(
    `${ctx.host}/api/v1/sites/${siteId}/site_settings/payees/existing_payees`,
    {
      headers: user
        ? {
            Authorization: generateAuthToken(user),
          }
        : undefined,
    },
  );
}
interface FetchExistingPayeeJsonParams {
  siteId: number;
  user: { id: number; jwt_secret: string } | null;
  payees: payees[];
  sites: sites[];
}
async function fetchExistingPayeesJson({
  siteId,
  user,
  payees,
}: FetchExistingPayeeJsonParams) {
  const resp = await fetchExistingPayees({ siteId, user });
  const body = (await resp.json()) as GetExistingPayeesResponseDto;
  return body.payees
    .filter((payee) => {
      return payees.find((p) => {
        return p.id === payee.id;
      });
    })
    .map((payee) => {
      const payeeNumber = payees.findIndex((p) => p.id === payee.id) + 1;
      const matchedPayee = payees[payeeNumber - 1];
      return {
        ...payee,
        id: `<payee_id ${payeeNumber}>`,
        uuid:
          payee.uuid && matchedPayee.uuid === payee.uuid
            ? `<payee_uuid ${payeeNumber}>`
            : payee.uuid,
      };
    });
}

interface ConfirmPayeeNameParams {
  siteId: number;
  user: { id: number; jwt_secret: string } | null;
}
async function confirmPayeeName({ siteId, user }: ConfirmPayeeNameParams) {
  return fetch(
    `${ctx.host}/api/v1/sites/${siteId}/site_settings/payees/confirm_payee_name`,
    {
      method: 'PATCH',
      referrer: 'http://localhost:6000/',
      headers: user
        ? {
            Authorization: generateAuthToken(user),
          }
        : undefined,
    },
  );
}
interface ConfirmPayeeNameJsonParams {
  siteId: number;
  payeeId: number | null;
  user: { id: number; jwt_secret: string } | null;
  randomId: string;
}
async function confirmPayeeNameJson(params: ConfirmPayeeNameJsonParams) {
  const resp = await confirmPayeeName(params);
  const body = (await resp.json()) as SerializeDto<GetPayeeResponseDto>;
  return processFetchPayeeResponse({
    body,
    siteId: params.siteId,
    randomId: params.randomId,
    payeeId: params.payeeId,
  });
}

interface ConfirmPayeeParams {
  siteId: number;
  user: { id: number; jwt_secret: string } | null;
}
async function confirmPayee({ siteId, user }: ConfirmPayeeParams) {
  return fetch(
    `${ctx.host}/api/v1/sites/${siteId}/site_settings/payees/confirm`,
    {
      method: 'PATCH',
      referrer: 'http://localhost:6000/',
      headers: user
        ? {
            Authorization: generateAuthToken(user),
          }
        : undefined,
    },
  );
}
interface ConfirmPayeeJsonParams {
  siteId: number;
  payeeId: number | null;
  user: { id: number; jwt_secret: string } | null;
  randomId: string;
}
async function confirmPayeeJson(params: ConfirmPayeeJsonParams) {
  const resp = await confirmPayee(params);
  const body = (await resp.json()) as SerializeDto<GetPayeeResponseDto>;
  const processedBody = processFetchPayeeResponse({
    body,
    siteId: params.siteId,
    randomId: params.randomId,
    payeeId: params.payeeId,
  });
  return {
    ...processedBody,
    payee: {
      ...processedBody.payee,
      updated_at: '<updated_at>',
    },
  };
}

interface ChoosePayeeParams {
  siteId: number;
  payeeId: number;
  user: { id: number; jwt_secret: string } | null;
}
async function choosePayee({ siteId, payeeId, user }: ChoosePayeeParams) {
  return fetch(
    `${ctx.host}/api/v1/sites/${siteId}/site_settings/payees/choose`,
    {
      method: 'PATCH',
      referrer: 'http://localhost:6000/',
      body: JSON.stringify({
        payee_id: payeeId,
      }),
      headers: {
        'Content-Type': 'application/json',
        ...(user ? { Authorization: generateAuthToken(user) } : {}),
      },
    },
  );
}
interface ChoosePayeeJsonParams {
  siteId: number;
  payeeId: number;
  user: { id: number; jwt_secret: string } | null;
  randomId: string;
}
async function choosePayeeJson(params: ChoosePayeeJsonParams) {
  const resp = await choosePayee(params);
  const body = (await resp.json()) as SerializeDto<GetPayeeResponseDto>;
  return processFetchPayeeResponse({
    body,
    siteId: params.siteId,
    randomId: params.randomId,
    payeeId: params.payeeId,
  });
}

async function seedPayee(params?: Partial<Prisma.payeesCreateInput>) {
  return ctx.prisma.payees.create({
    data: {
      name: 'Payee Name',
      tipalti_completed: true,
      uuid: randomUUID(),
      created_at: new Date('2023-07-06T15:45:15.838Z'),
      updated_at: new Date('2023-07-06T15:45:15.839Z'),
      ...params,
    },
  });
}

interface ProcessFetchPayeeResponseParams {
  body: SerializeDto<GetPayeeResponseDto>;
  siteId: number;
  payeeId: number | null;
  randomId: string;
}
function processFetchPayeeResponse({
  body,
  siteId,
  payeeId,
  randomId,
}: ProcessFetchPayeeResponseParams) {
  const { site } = body;
  const { frames } = site;
  return {
    ...site,
    site: site.site === siteId ? '<site_id>' : site.site,
    frames: {
      ...frames,
      edit_profile: frames.edit_profile
        ? frames.edit_profile
            .replace(/ts=\d+/, 'ts=<timestamp>')
            .replace(/hashkey=[a-z0-9]+/, 'hashkey=<hashkey>')
            .replace(randomId, '<uuid>')
            .replace(new RegExp('&amp;', 'g'), '&')
        : frames.edit_profile,
      history: frames.history
        ? frames.history
            .replace(/ts=\d+/, 'ts=<timestamp>')
            .replace(/hashkey=[a-z0-9]+/, 'hashkey=<hashkey>')
            .replace(randomId, '<uuid>')
            .replace(new RegExp('&amp;', 'g'), '&')
        : frames.history,
    },
    payee: site.payee
      ? {
          ...site.payee,
          id: site.payee.id === payeeId ? '<payee_id>' : site.payee.id,
          created_at: normalizeDateTimeToUtc(site.payee.created_at),
          updated_at: normalizeDateTimeToUtc(site.payee.updated_at),
          uuid: randomId === site.payee.uuid ? '<uuid>' : site.payee.uuid,
        }
      : site.payee,
  };
}

async function seedExistingPayees(userId: number) {
  const randomId = randomUUID();

  const payee1 = await seedPayee({
    name: 'Payee 1',
    tipalti_completed: true,
    uuid: randomUUID(),
  });
  const { site: site1 } = await seedSite({
    ctx,
    siteData: { payee_id: payee1.id },
    siteUsers: [{ userId, roles: [SiteUserRole.ad_settings] }],
  });
  const payee2 = await seedPayee({
    name: 'Payee 2',
    tipalti_completed: false,
    uuid: randomId,
  });
  const { site: site2 } = await seedSite({
    ctx,
    siteData: { payee_id: payee2.id },
    siteUsers: [{ userId, roles: [SiteUserRole.owner] }],
  });
  const payee3 = await seedPayee({
    name: 'Payee 3',
    tipalti_completed: false,
    uuid: randomId,
  });
  const { site: site3 } = await seedSite({
    ctx,
    siteData: { payee_id: payee3.id },
    siteUsers: [{ userId, roles: [SiteUserRole.payment] }],
  });
  const payee4 = await seedPayee({
    name: 'Payee 4',
    tipalti_completed: true,
    uuid: randomId,
  });
  const { site: site4 } = await seedSite({
    ctx,
    siteData: { payee_id: payee4.id },
    siteUsers: [{ userId, roles: [SiteUserRole.post_termination_new_owner] }],
  });
  const payee5 = await seedPayee({
    name: 'Payee 5',
    tipalti_completed: true,
    uuid: randomId,
  });
  const { site: site5 } = await seedSite({
    ctx,
    siteData: { payee_id: payee5.id },
    siteUsers: [{ userId, roles: [SiteUserRole.reporting] }],
  });
  const payee6 = await seedPayee({
    name: 'Payee 6',
    tipalti_completed: true,
    uuid: randomId,
  });
  const { site: site6 } = await seedSite({
    ctx,
    siteData: { payee_id: payee6.id },
    siteUsers: [{ userId, roles: [SiteUserRole.video] }],
  });
  const payee7 = await seedPayee({
    name: 'Payee Not On Associated Site',
    tipalti_completed: true,
    uuid: randomId,
  });
  const { site: site7 } = await seedSite({
    ctx,
    siteData: { payee_id: payee7.id },
  });
  const payee8 = await seedPayee({
    name: 'Payee Not On Site',
    tipalti_completed: true,
    uuid: randomId,
  });

  return {
    payees: [payee1, payee2, payee3, payee4, payee5, payee6, payee7, payee8],
    sites: [site1, site2, site3, site4, site5, site6, site7],
  };
}
