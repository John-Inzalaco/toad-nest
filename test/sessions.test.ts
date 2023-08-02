import {
  createTestContext,
  seedPayee,
  seedPremiereSite,
  seedProSite,
  seedSite,
  seedUser,
} from './__helpers';
import { users, sites, payees } from '@prisma/dashboard';
import { SiteUserRole } from '../src/users/SiteUserRole.enum';
import { randomUUID } from 'crypto';
import { ResSessionsSignInDto } from '../src/sessions/dto/resSessionsSignIn.dto';
import jwt from 'jsonwebtoken';

const ctx = createTestContext();

describe('Sessions', () => {
  let user: users;
  let site: sites;
  let payee: payees;

  beforeEach(async () => {
    user = await seedUser({ ctx });
    payee = await seedPayee({ ctx });
    const siteSeed = await seedSite({
      ctx,
      siteUsers: [{ userId: user.id, roles: [] }],
      siteData: {
        payee_id: payee.id,
      },
    });
    site = siteSeed.site;
  });

  describe('sign in', () => {
    let credentials: { email: string; password: string };
    const makeRequest = async (_credentials = credentials) => {
      return fetch(`${ctx.host}/api/v1/users/sign_in`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(_credentials),
      });
    };

    describe('with the correct credentials', () => {
      beforeEach(async () => {
        credentials = {
          email: user.email,
          password: 'password',
        };
      });

      it('returns a valid token', async () => {
        const resp = await makeRequest();
        const body = (await resp.json()) as { data: { token: string } };

        const payload = jwt.verify(
          body.data.token,
          process.env.DEVISE_JWT_SECRET_KEY as string,
          { clockTolerance: 10, algorithms: ['HS256'] },
        ) as {
          user_id: string;
          jwt_secret: string;
          client_application_id: string;
          exp: number;
        };
        const yearFromNowInSeconds =
          Math.round(Date.now() / 1000) + 60 * 60 * 24 * 365;
        expect(payload.user_id).toEqual(user.id);
        expect(payload.client_application_id).toEqual('dashboard');
        expect(payload.jwt_secret).toEqual(user.jwt_secret);
        expect(
          Math.abs(yearFromNowInSeconds - payload.exp) < 2 * 60 * 60 * 24,
        ).toEqual(true);
      });

      it('returns a token and user object', async () => {
        const resp = await makeRequest();
        const body = await resp.json();
        const siteUsers = await ctx.prisma.site_users.findMany({
          where: {
            user_id: user.id,
          },
        });

        expect(body).toMatchObject({
          data: {
            token: expect.any(String),
            user: {
              id: user.id,
              authentication_token: user.authentication_token,
              email: user.email,
              enterprise_sites: [],
              favorite_sites: '1,2,3',
              grow_site_ids: [],
              grow_sites: [],
              name: 'user title',
              payees: [
                {
                  id: payee.id,
                  uuid: payee.uuid,
                  tipalti_completed: payee.tipalti_completed,
                  name: payee.name,
                },
              ],
              premiere_sites: [],
              premiere_sites_invited: [],
              pro_sites: [],
              pro_sites_invited: [],
              read_only_admin: false,
              roles: [],
              site_ids: [site.id],
              site_users: [
                expect.objectContaining({
                  id: siteUsers[0].id,
                  user_id: user.id,
                  site_id: siteUsers[0].site_id,
                  roles_mask: siteUsers[0].roles_mask,
                }),
              ],
              super_admin: true,
              twilio_verify_enabled: false,
              user_hash: expect.any(String),
            },
          },
        });
      });
      it('returns a 201', async () => {
        const resp = await makeRequest();
        expect(resp.status).toEqual(201);
      });

      describe('site collections', () => {
        describe('premiere sites', () => {
          it('returns a users accepted premiere sites', async () => {
            const { site: siteOne } = await seedPremiereSite({
              ctx,
              siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
            });

            const { site: siteTwo } = await seedPremiereSite({
              ctx,
              siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
            });

            const resp = await makeRequest();
            const body: ResSessionsSignInDto =
              (await resp.json()) as ResSessionsSignInDto;
            expect(body.data.user.premiere_sites).toEqual([
              siteOne.id,
              siteTwo.id,
            ]);
          });

          it('returns a users invited premiere sites', async () => {
            const { site: siteOne } = await seedPremiereSite({
              ctx,
              siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
              settings: {
                premiere_accepted: 'false',
                premiere_invited: 'true',
              },
            });

            /**
             * Site who is both invited and accepted which should not be
             * returned under the "invited" array
             */
            await seedPremiereSite({
              ctx,
              siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
            });

            const resp = await makeRequest();
            const body: ResSessionsSignInDto =
              (await resp.json()) as ResSessionsSignInDto;
            expect(body.data.user.premiere_sites_invited).toEqual([siteOne.id]);
          });
        });

        describe('pro sites', () => {
          it('returns a users accepted pro sites', async () => {
            const { site: siteOne } = await seedProSite({
              ctx,
              siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
            });

            const { site: siteTwo } = await seedProSite({
              ctx,
              siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
            });

            const resp = await makeRequest();
            const body: ResSessionsSignInDto =
              (await resp.json()) as ResSessionsSignInDto;
            expect(body.data.user.pro_sites).toEqual([siteOne.id, siteTwo.id]);
          });

          it('returns a users invited pro sites', async () => {
            const { site: siteOne } = await seedProSite({
              ctx,
              siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
              settings: {
                pro_accepted: 'na',
                pro_invited: 'true',
              },
            });

            /**
             * Site who is both invited and accepted which should not be
             * returned under the "invited" array
             */
            await seedProSite({
              ctx,
              siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
            });

            const resp = await makeRequest();
            const body: ResSessionsSignInDto =
              (await resp.json()) as ResSessionsSignInDto;
            expect(body.data.user.pro_sites_invited).toEqual([siteOne.id]);
          });
        });
        describe('enterprise tier', () => {
          it('returns enterprise tier sites', async () => {
            const { site: siteOne } = await seedSite({
              ctx,
              siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
              settings: {
                enterprise_tier: 'true',
              },
            });

            const { site: siteTwo } = await seedSite({
              ctx,
              siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
              settings: {
                enterprise_tier: 'true',
              },
            });

            const resp = await makeRequest();
            const body: ResSessionsSignInDto =
              (await resp.json()) as ResSessionsSignInDto;
            expect(body.data.user.enterprise_sites).toEqual(
              expect.arrayContaining([siteOne.id, siteTwo.id]),
            );
          });
        });
        describe('grow sites', () => {
          it('returns sites with grow site ids', async () => {
            const { site: siteOne } = await seedSite({
              ctx,
              siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
              siteData: {
                grow_site_id: randomUUID().toString(),
              },
            });

            const { site: siteTwo } = await seedSite({
              ctx,
              siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
              siteData: {
                grow_site_id: randomUUID().toString(),
              },
            });

            const resp = await makeRequest();
            const body: ResSessionsSignInDto =
              (await resp.json()) as ResSessionsSignInDto;
            expect(body.data.user.grow_site_ids.length).toEqual(2);
            expect(body.data.user.grow_site_ids).toEqual(
              expect.arrayContaining([
                siteOne.grow_site_id,
                siteTwo.grow_site_id,
              ]),
            );
          });
          it('returns user owned grow sites for admin users', async () => {
            await ctx.prisma.users.update({
              where: { id: user.id },
              data: {
                roles_mask: 1,
              },
            });
            const { site: siteOne } = await seedSite({
              ctx,
              siteUsers: [{ userId: user.id, roles: [] }],
              siteData: {
                grow_site_id: randomUUID().toString(),
              },
            });

            const resp = await makeRequest();
            const body: ResSessionsSignInDto =
              (await resp.json()) as ResSessionsSignInDto;
            expect(body.data.user.grow_sites).toEqual([
              {
                grow_site_id: siteOne.grow_site_id,
                site_id: siteOne.id,
              },
            ]);
          });

          it('returns user owned grow sites for site owner users', async () => {
            const { site: siteOne } = await seedSite({
              ctx,
              siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
              siteData: {
                grow_site_id: randomUUID().toString(),
              },
            });

            const resp = await makeRequest();
            const body: ResSessionsSignInDto =
              (await resp.json()) as ResSessionsSignInDto;
            expect(body.data.user.grow_sites).toEqual([
              {
                grow_site_id: siteOne.grow_site_id,
                site_id: siteOne.id,
              },
            ]);
          });

          it('returns user owned grow sites for site ad settings users', async () => {
            const { site: siteOne } = await seedSite({
              ctx,
              siteUsers: [
                { userId: user.id, roles: [SiteUserRole.ad_settings] },
              ],
              siteData: {
                grow_site_id: randomUUID().toString(),
              },
            });

            const resp = await makeRequest();
            const body: ResSessionsSignInDto =
              (await resp.json()) as ResSessionsSignInDto;
            expect(body.data.user.grow_sites).toEqual([
              {
                grow_site_id: siteOne.grow_site_id,
                site_id: siteOne.id,
              },
            ]);
          });
        });
      });
    });

    describe(`invalid credentials`, () => {
      it(`returns an error message `, async () => {
        const resp = await makeRequest({
          email: user.email,
          password: 'wrong',
        });
        const body = await resp.json();
        expect(body).toMatchInlineSnapshot(`
          {
            "error": "invalid_credentials",
          }
        `);
      });

      it('returns a 401', async () => {
        const resp = await makeRequest({
          email: user.email,
          password: 'wrong',
        });

        expect(resp.status).toEqual(401);
      });
    });
  });
});
