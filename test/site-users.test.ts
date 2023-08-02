import { randomUUID } from 'crypto';
import { ListSiteUsersResponseDto } from '../src/site-users/dto/ListSiteUsers.dto';
import {
  UUID_REGEX,
  createTestContext,
  generateAuthToken,
  normalizeDateTimeToUtc,
  replaceRandomId,
  seedSite,
  seedUser,
  testSiteUserRoleAccess,
} from './__helpers';
import { SiteUserRole, SiteUserRoleKey } from '../src/users/SiteUserRole.enum';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { hashInvitationToken } from '../src/site-users/helpers';
import {
  UpdateSiteUserBodyDto,
  UpdateSiteUserResponseDto,
} from '../src/site-users/dto/UpdateSiteUser.dto';
import { CreateSiteUserResponseDto } from '../src/site-users/dto/CreateSiteUser.dto';
import { SerializeDto } from '../src/utils/serializeDto';
import { convertRolesToMask } from '../src/users/rolesUtilities';

const ctx = createTestContext();

const server = setupServer();

describe('site_users routes', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('GET /api/v1/sites/:site_id/site_users', () => {
    it('returns all site_users for a site owner', async () => {
      const { randomId, user, user2, site } = await seedSiteUsers();
      const siteUsers = await fetchSiteUsersJson({
        siteId: site.id,
        user,
        randomId,
      });
      expect(siteUsers[0]).toMatchObject({
        user_id: user.id,
      });
      expect(siteUsers[1]).toMatchObject({
        user_id: user2.id,
      });
      expect({ site_users: siteUsers }).toMatchSnapshot({
        site_users: Array(5).fill({
          site_user_id: expect.any(Number),
          user_id: expect.any(Number),
        }),
      });
    });

    it('returns all site_users for an admin', async () => {
      const { randomId, user, user2, site } = await seedSiteUsers();
      const adminUser = await seedUser({
        ctx,
        admin: true,
      });
      const siteUsers = await fetchSiteUsersJson({
        siteId: site.id,
        user: adminUser,
        randomId,
      });
      expect(siteUsers[0]).toMatchObject({
        user_id: user.id,
      });
      expect(siteUsers[1]).toMatchObject({
        user_id: user2.id,
      });
      expect({ site_users: siteUsers }).toMatchSnapshot({
        site_users: Array(5).fill({
          site_user_id: expect.any(Number),
          user_id: expect.any(Number),
        }),
      });
    });

    it('returns all site_users with a pds token', async () => {
      const { randomId, user, user2, site } = await seedSiteUsers();
      const adminUser = await seedUser({
        ctx,
        admin: true,
      });
      const siteUsers = await fetchSiteUsersJson({
        siteId: site.id,
        user: adminUser,
        randomId,
        clientApplicationId: 'pds',
      });
      expect(siteUsers[0]).toMatchObject({
        user_id: user.id,
      });
      expect(siteUsers[1]).toMatchObject({
        user_id: user2.id,
      });
      expect({ site_users: siteUsers }).toMatchSnapshot({
        site_users: Array(5).fill({
          site_user_id: expect.any(Number),
          user_id: expect.any(Number),
        }),
      });
    });

    it('returns a 401 if the user is not an admin or a site_user', async () => {
      const { user2, site } = await seedSiteUsers();
      const resp = await fetchSiteUsers({
        siteId: site.id,
        user: user2,
      });
      expect(resp.status).toEqual(401);
    });

    it('returns a 400 if the site_id is not valid', async () => {
      const { user } = await seedSiteUsers();
      const resp = await fetchSiteUsers({
        siteId: 'abc' as unknown as number,
        user,
      });
      expect(resp.status).toEqual(process.env.USE_RAILS_API ? 404 : 400);
    });

    it('returns a 404 if the site_id does not exist', async () => {
      const { user } = await seedSiteUsers();
      const resp = await fetchSiteUsers({
        siteId: 99999999,
        user,
      });
      expect(resp.status).toEqual(404);
    });
  });

  describe('POST /api/v1/sites/:site_id/site_users', () => {
    beforeEach(() => {
      server.resetHandlers(
        rest.post(
          'https://mandrillapp.com/api/1.0/messages/send',
          async (_req, res, ctx) => {
            return res(ctx.json({ success: true }));
          },
        ),
      );
    });

    it('creates a site_user', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let body: any = null;
      server.use(
        rest.post(
          'https://mandrillapp.com/api/1.0/messages/send',
          async (req, res, ctx) => {
            body = await req.json();
            return res(ctx.json({ success: true }));
          },
        ),
      );

      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const emailToAdd = `some-other-email-${randomId}@example.com`;
      const resp = await createSiteUserJson({
        siteId: site.id,
        user,
        body: {
          email: emailToAdd,
          email_confirmation: emailToAdd,
          roles: ['ad_settings'],
        },
      });
      const userThatWasAdded = await ctx.prisma.users.findUniqueOrThrow({
        where: { email: emailToAdd },
      });
      const siteUserThatWasAdded = await ctx.prisma.site_users.findFirstOrThrow(
        {
          where: { user_id: userThatWasAdded.id, site_id: site.id },
        },
      );

      if (!process.env.USE_RAILS_API) {
        if (!body) {
          throw new Error('No email request body');
        }
        const invitationTokenMatch = /\?invitation_token=(.*)'\s/.exec(
          body.message.html,
        );
        if (!invitationTokenMatch) {
          throw new Error('No invitation token match found');
        }
        const hashedInvitationToken = await hashInvitationToken(
          invitationTokenMatch?.[1],
        );
        expect(hashedInvitationToken).toEqual(
          userThatWasAdded.invitation_token,
        );
        expect(processEmailRequestBody(body, randomId)).toMatchInlineSnapshot(`
          {
            "key": "MANDRILL_PASSWORD",
            "message": {
              "auto_text": true,
              "from_email": "publishers@mediavine.com",
              "html": "<html>
            <body>
              <p>Hello some-other-email-<randomId>@example.com</p>
              <p>
                Test title <randomId>
                has given you access to their Mediavine dashboard. We created you an
                account under this email address:
                some-other-email-<randomId>@example.com
              </p>
              <p>Since we auto created your account, you'll have to accept the invitation
                by resetting your password in order to first log in.</p>
              <p><a href='https://reporting-staging.mediavine.com/users/invitation/accept?invitation_token=<invitation_token>' target='_blank'>Reset your password here.</a></p>
            </body>
          </html>",
              "subject": "Test title <randomId> has invited you to their Mediavine Dashboard! Instructions inside!",
              "to": [
                {
                  "email": "some-other-email-<randomId>@example.com",
                },
              ],
            },
          }
        `);
      }
      expect(userThatWasAdded.authentication_token?.length).toEqual(20);
      expect(
        Date.now() -
          new Date(userThatWasAdded.invitation_created_at || 0).getTime(),
      ).toBeLessThan(1000 * 60);
      expect(
        Date.now() -
          new Date(userThatWasAdded.invitation_sent_at || 0).getTime(),
      ).toBeLessThan(1000 * 60);
      expect(userThatWasAdded).toMatchObject({
        email: emailToAdd,
        encrypted_password: expect.any(String),
        jwt_secret: expect.stringMatching(UUID_REGEX),
      });
      expect(resp).toMatchObject({
        id: siteUserThatWasAdded.id,
        roles: ['ad_settings'],
        site_id: site.id,
        user_id: userThatWasAdded.id,
      });
      expect(normalizeDateTimeToUtc(resp.created_at)).toEqual(
        siteUserThatWasAdded.created_at.toISOString(),
      );
      expect(normalizeDateTimeToUtc(resp.updated_at)).toEqual(
        siteUserThatWasAdded.updated_at.toISOString(),
      );
    });

    it('creates a site_user for an already existing user', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let body: any = null;
      server.use(
        rest.post(
          'https://mandrillapp.com/api/1.0/messages/send',
          async (req, res, ctx) => {
            body = await req.json();
            return res(ctx.json({ success: true }));
          },
        ),
      );

      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const otherRandomId = randomUUID();
      const otherUser = await seedUser({ ctx, randomId: otherRandomId });

      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const resp = await createSiteUserJson({
        siteId: site.id,
        user,
        body: {
          email: otherUser.email,
          email_confirmation: otherUser.email,
          roles: ['reporting', 'video', 'payment'],
        },
      });
      const siteUserThatWasAdded = await ctx.prisma.site_users.findFirstOrThrow(
        {
          where: { user_id: otherUser.id, site_id: site.id },
        },
      );
      expect(resp).toMatchObject({
        id: siteUserThatWasAdded.id,
        roles: ['reporting', 'video', 'payment'],
        site_id: site.id,
        user_id: otherUser.id,
      });
      expect(normalizeDateTimeToUtc(resp.created_at)).toEqual(
        siteUserThatWasAdded.created_at.toISOString(),
      );
      expect(normalizeDateTimeToUtc(resp.updated_at)).toEqual(
        siteUserThatWasAdded.updated_at.toISOString(),
      );
      if (!process.env.USE_RAILS_API) {
        expect(
          replaceRandomId(
            processEmailRequestBody(body, randomId),
            otherRandomId,
            '<otherRandomId>',
          ),
        ).toMatchInlineSnapshot(`
          {
            "key": "MANDRILL_PASSWORD",
            "message": {
              "auto_text": true,
              "from_email": "publishers@mediavine.com",
              "html": "<html>
            <body>
              <p>Test title <randomId>
                has given you access to their Mediavine dashboard. You can view it using
                your existing account under this email address (<otherRandomId>@example.com) by going to:
                <a href='https://reporting-staging.mediavine.com'>https://reporting-staging.mediavine.com</a>
              </p>
            </body>
          </html>",
              "subject": "You've been given access to Test title <randomId> in the Mediavine Dashboard.",
              "to": [
                {
                  "email": "<otherRandomId>@example.com",
                },
              ],
            },
          }
        `);
      }
    });

    it('sends the add new user email if a user was invited to another site but has not acceted the invitation yet', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let body: any = null;
      let callCount = 0;
      server.use(
        rest.post(
          'https://mandrillapp.com/api/1.0/messages/send',
          async (req, res, ctx) => {
            callCount++;
            body = await req.json();
            return res(ctx.json({ success: true }));
          },
        ),
      );

      const randomId = randomUUID();
      const randomId2 = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const { site: site2 } = await seedSite({
        ctx,
        randomId: randomId2,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const emailToAdd = `some-other-email-${randomId}@example.com`;
      const resp1 = await createSiteUser({
        siteId: site.id,
        user,
        body: {
          email: emailToAdd,
          email_confirmation: emailToAdd,
          roles: ['ad_settings'],
        },
      });
      expect(resp1.status).toEqual(process.env.USE_RAILS_API ? 200 : 201);
      const resp2 = await createSiteUser({
        siteId: site2.id,
        user,
        body: {
          email: emailToAdd,
          email_confirmation: emailToAdd,
          roles: ['owner'],
        },
      });
      expect(resp2.status).toEqual(process.env.USE_RAILS_API ? 200 : 201);
      const userThatWasAdded = await ctx.prisma.users.findUniqueOrThrow({
        where: { email: emailToAdd },
      });

      if (!process.env.USE_RAILS_API) {
        expect(callCount).toEqual(2);
        if (!body) {
          throw new Error('No email request body');
        }
        const invitationTokenMatch = /\?invitation_token=(.*)'\s/.exec(
          body.message.html,
        );
        if (!invitationTokenMatch) {
          throw new Error('No invitation token match found');
        }
        const hashedInvitationToken = await hashInvitationToken(
          invitationTokenMatch?.[1],
        );
        expect(hashedInvitationToken).toEqual(
          userThatWasAdded.invitation_token,
        );
        expect(
          replaceRandomId(
            processEmailRequestBody(body, randomId),
            randomId2,
            '<randomId2>',
          ),
        ).toMatchInlineSnapshot(`
          {
            "key": "MANDRILL_PASSWORD",
            "message": {
              "auto_text": true,
              "from_email": "publishers@mediavine.com",
              "html": "<html>
            <body>
              <p>Hello some-other-email-<randomId>@example.com</p>
              <p>
                Test title <randomId2>
                has given you access to their Mediavine dashboard. We created you an
                account under this email address:
                some-other-email-<randomId>@example.com
              </p>
              <p>Since we auto created your account, you'll have to accept the invitation
                by resetting your password in order to first log in.</p>
              <p><a href='https://reporting-staging.mediavine.com/users/invitation/accept?invitation_token=<invitation_token>' target='_blank'>Reset your password here.</a></p>
            </body>
          </html>",
              "subject": "Test title <randomId2> has invited you to their Mediavine Dashboard! Instructions inside!",
              "to": [
                {
                  "email": "some-other-email-<randomId>@example.com",
                },
              ],
            },
          }
        `);
      }
    });

    it('adds owner to roles if it is the only user on the site', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId, admin: true });
      const { site } = await seedSite({
        ctx,
        randomId,
      });
      const emailToAdd = `some-other-email-${randomId}@example.com`;
      const resp = await createSiteUserJson({
        siteId: site.id,
        user,
        body: {
          email: emailToAdd,
          email_confirmation: emailToAdd,
          roles: ['ad_settings'],
        },
      });
      const userThatWasAdded = await ctx.prisma.users.findUniqueOrThrow({
        where: { email: emailToAdd },
      });
      const siteUserThatWasAdded = await ctx.prisma.site_users.findFirstOrThrow(
        {
          where: { user_id: userThatWasAdded.id, site_id: site.id },
        },
      );
      expect(resp).toMatchObject({
        id: siteUserThatWasAdded.id,
        roles: ['ad_settings', 'owner'],
        site_id: site.id,
        user_id: userThatWasAdded.id,
      });
      expect(normalizeDateTimeToUtc(resp.created_at)).toEqual(
        siteUserThatWasAdded.created_at.toISOString(),
      );
      expect(normalizeDateTimeToUtc(resp.updated_at)).toEqual(
        siteUserThatWasAdded.updated_at.toISOString(),
      );
    });

    it("returns 422 if the email doesn't match email_confirmation", async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const emailToAdd = `some-other-email-${randomId}@example.com`;
      const resp = await createSiteUser({
        siteId: site.id,
        user,
        body: {
          email: emailToAdd,
          email_confirmation: `${emailToAdd}c`,
          roles: ['ad_settings'],
        },
      });
      expect(resp.status).toEqual(422);
      const body = await resp.json();
      expect(body).toMatchInlineSnapshot(`
        {
          "email_confirmation": [
            "email confirmation must match email address",
          ],
        }
      `);
    });

    it('returns 422/400 if the email is not passed', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const emailToAdd = `some-other-email-${randomId}@example.com`;
      const resp = await createSiteUser({
        siteId: site.id,
        user,
        body: {
          email_confirmation: emailToAdd,
          roles: ['ad_settings'],
        },
      });
      expect(resp.status).toEqual(process.env.USE_RAILS_API ? 422 : 400);
    });

    it('returns 422/400 if roles are empty', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const emailToAdd = `some-other-email-${randomId}@example.com`;
      const resp = await createSiteUser({
        siteId: site.id,
        user,
        body: {
          email: emailToAdd,
          email_confirmation: emailToAdd,
          roles: [],
        },
      });
      expect(resp.status).toEqual(process.env.USE_RAILS_API ? 422 : 400);
    });

    it('ignores invalid roles', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const emailToAdd = `some-other-email-${randomId}@example.com`;
      const body = await createSiteUserJson({
        siteId: site.id,
        user,
        body: {
          email: emailToAdd,
          email_confirmation: emailToAdd,
          roles: ['some_other_role', 'owner', 'admin', 'ad_settings'],
        },
      });
      if (process.env.USE_RAILS_API) {
        const userThatWasAdded = await ctx.prisma.users.findUniqueOrThrow({
          where: { email: emailToAdd },
        });
        const siteUserThatWasAdded =
          await ctx.prisma.site_users.findFirstOrThrow({
            where: { user_id: userThatWasAdded.id, site_id: site.id },
          });
        expect(body).toMatchObject({
          id: siteUserThatWasAdded.id,
          roles: ['ad_settings', 'owner'],
          site_id: site.id,
          user_id: userThatWasAdded.id,
        });
      } else {
        expect(body).toMatchInlineSnapshot(`
          {
            "error": "Bad Request",
            "message": [
              "each value in roles must be one of the following values: ad_settings, reporting, video, payment, owner, post_termination_new_owner",
            ],
            "statusCode": 400,
          }
        `);
      }
    });

    it('errors if trying to add a site_user for a user that already has a site_user for the site', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const otherUser = await seedUser({ ctx, randomId: randomUUID() });

      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [
          { userId: user.id, roles: [SiteUserRole.owner] },
          { userId: otherUser.id, roles: [SiteUserRole.owner] },
        ],
      });
      const resp = await createSiteUser({
        siteId: site.id,
        user,
        body: {
          email: otherUser.email,
          email_confirmation: otherUser.email,
          roles: ['reporting', 'video', 'payment'],
        },
      });
      expect(resp.status).toEqual(process.env.USE_RAILS_API ? 422 : 400);
      const body = await resp.json();
      expect(body).toMatchInlineSnapshot(`
        {
          "email": [
            "Email already exists. Please add the role to an existing user.",
          ],
        }
      `);
    });

    describe('User Role Access', () => {
      void testSiteUserRoleAccess({
        ctx,
        expectedStatuses: {
          ad_settings: 401,
          admin: process.env.USE_RAILS_API ? 200 : 201,
          owner: process.env.USE_RAILS_API ? 200 : 201,
          payment: 401,
          post_termination_new_owner: 401,
          reporting: 401,
          video: 401,
        },
        makeRequest: async ({ user, siteId }) => {
          const emailToAdd = `some-other-email-${randomUUID()}@example.com`;
          const resp = await createSiteUser({
            siteId,
            user,
            body: {
              email: emailToAdd,
              email_confirmation: emailToAdd,
              roles: ['owner'],
            },
          });
          return resp;
        },
      });
    });
  });

  describe('PATCH /api/v1/sites/:siteId/site_users/:id', () => {
    it('updates the roles on a site_user', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const userToUpdate = await seedUser({
        ctx,
        email: `${randomId}-other@example.com`,
      });
      const { site, siteUsers } = await seedSite({
        ctx,
        randomId,
        siteUsers: [
          { userId: user.id, roles: [SiteUserRole.owner] },
          { userId: userToUpdate.id, roles: [SiteUserRole.owner] },
        ],
      });
      const body = await updateSiteUserJson({
        siteId: site.id,
        user,
        siteUserId: siteUsers[1].id,
        body: { roles: ['reporting', 'ad_settings'] },
      });
      expect(body).toMatchObject({
        id: siteUsers[1].id,
        roles: ['ad_settings', 'reporting'],
        site_id: site.id,
        user_id: userToUpdate.id,
      });
      expect(normalizeDateTimeToUtc(body.created_at)).toEqual(
        siteUsers[1].created_at.toISOString(),
      );
      const updatedAtDiff =
        new Date(body.updated_at).getTime() - siteUsers[1].updated_at.getTime();
      expect(updatedAtDiff).toBeGreaterThan(0);
      expect(updatedAtDiff).toBeLessThan(10000);
    });

    it('fails if the site_user id is not found', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const userToUpdate = await seedUser({
        ctx,
        email: `${randomId}-other@example.com`,
      });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [
          { userId: user.id, roles: [SiteUserRole.owner] },
          { userId: userToUpdate.id, roles: [SiteUserRole.owner] },
        ],
      });
      const resp = await updateSiteUser({
        siteId: site.id,
        user,
        siteUserId: 999999999,
        body: { roles: ['reporting', 'ad_settings'] },
      });
      expect(resp.status).toEqual(404);
    });

    if (!process.env.USE_RAILS_API) {
      it('fails if the site_user is not associated with the passed in site id', async () => {
        const randomId = randomUUID();
        const user = await seedUser({ ctx, randomId });
        const userToUpdate = await seedUser({
          ctx,
          email: `${randomId}-other@example.com`,
        });
        const { site } = await seedSite({
          ctx,
          randomId,
          siteUsers: [
            { userId: user.id, roles: [SiteUserRole.owner] },
            { userId: userToUpdate.id, roles: [SiteUserRole.owner] },
          ],
        });
        const { siteUsers: otherSiteUsers } = await seedSite({
          ctx,
          randomId: randomUUID(),
          siteUsers: [{ userId: userToUpdate.id, roles: [SiteUserRole.owner] }],
        });
        const resp = await updateSiteUser({
          siteId: site.id,
          user,
          siteUserId: otherSiteUsers[0].id,
          body: { roles: ['reporting', 'ad_settings'] },
        });
        expect(resp.status).toEqual(400);
      });

      it('fails if an invalid user role is passed', async () => {
        const randomId = randomUUID();
        const user = await seedUser({ ctx, randomId });
        const userToUpdate = await seedUser({
          ctx,
          email: `${randomId}-other@example.com`,
        });
        const { site, siteUsers } = await seedSite({
          ctx,
          randomId,
          siteUsers: [
            { userId: user.id, roles: [SiteUserRole.owner] },
            { userId: userToUpdate.id, roles: [SiteUserRole.owner] },
          ],
        });
        const resp = await updateSiteUser({
          siteId: site.id,
          user,
          siteUserId: siteUsers[1].id,
          body: {
            roles: [
              'reporting',
              'something_else',
            ] as unknown[] as SiteUserRoleKey[],
          },
        });
        expect(resp.status).toEqual(400);
      });
    }

    describe('User Role Access', () => {
      void testSiteUserRoleAccess({
        ctx,
        expectedStatuses: {
          ad_settings: 401,
          admin: 200,
          owner: 200,
          payment: 401,
          post_termination_new_owner: 401,
          reporting: 401,
          video: 401,
        },
        makeRequest: async ({ user, siteId }) => {
          const userToUpdate = await seedUser({
            ctx,
            email: `${randomUUID()}-other@example.com`,
          });
          const siteUser = await ctx.prisma.site_users.create({
            data: {
              created_at: new Date(),
              updated_at: new Date(),
              user_id: userToUpdate.id,
              site_id: siteId,
              roles_mask: convertRolesToMask([SiteUserRole.owner]),
            },
          });
          return updateSiteUser({
            user,
            siteId: siteId,
            siteUserId: siteUser.id,
            body: { roles: ['ad_settings', 'reporting'] },
          });
        },
      });
    });
  });

  describe('DELETE /api/v1/sites/:siteId/site_users/:id', () => {
    it('deletes the site_user', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const userToUpdate = await seedUser({
        ctx,
        email: `${randomId}-other@example.com`,
      });
      const { site, siteUsers } = await seedSite({
        ctx,
        randomId,
        siteUsers: [
          { userId: user.id, roles: [SiteUserRole.owner] },
          { userId: userToUpdate.id, roles: [SiteUserRole.owner] },
        ],
      });
      const { siteUsers: otherSiteUsers } = await seedSite({
        ctx,
        randomId: randomUUID(),
        siteUsers: [{ userId: userToUpdate.id, roles: [SiteUserRole.owner] }],
      });

      const resp = await deleteSiteUser({
        siteId: site.id,
        user,
        siteUserId: siteUsers[1].id,
      });
      expect(resp.status).toEqual(204);
      expect(resp.body).toEqual(null);

      const deletedSiteUser = await ctx.prisma.site_users.findUnique({
        where: { id: siteUsers[1].id },
      });
      // Leave other users' site_user alone
      const remainingSiteUser = await ctx.prisma.site_users.findUnique({
        where: { id: siteUsers[0].id },
      });
      // Leaves other site's site_user alone
      const otherSiteUser = await ctx.prisma.site_users.findUnique({
        where: { id: otherSiteUsers[0].id },
      });
      expect(deletedSiteUser).toBeNull();
      expect(remainingSiteUser).not.toBeNull();
      expect(otherSiteUser).not.toBeNull();

      // Cycles the user's jwt_secret when they have a site_user deleted
      const updatedUser = await ctx.prisma.users.findUnique({
        where: { id: user.id },
      });
      const updatedUserToUpdate = await ctx.prisma.users.findUnique({
        where: { id: user.id },
      });
      expect(updatedUser?.jwt_secret).toEqual(user.jwt_secret);
      expect(updatedUserToUpdate?.jwt_secret).not.toEqual(
        userToUpdate.jwt_secret,
      );
    });

    it('fails if the site_user id is not found', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx, randomId });
      const userToUpdate = await seedUser({
        ctx,
        email: `${randomId}-other@example.com`,
      });
      const { site } = await seedSite({
        ctx,
        randomId,
        siteUsers: [
          { userId: user.id, roles: [SiteUserRole.owner] },
          { userId: userToUpdate.id, roles: [SiteUserRole.owner] },
        ],
      });
      const resp = await deleteSiteUser({
        siteId: site.id,
        user,
        siteUserId: 999999999,
      });
      expect(resp.status).toEqual(404);
    });

    if (!process.env.USE_RAILS_API) {
      it('fails if the site_user is not associated with the passed in site id', async () => {
        const randomId = randomUUID();
        const user = await seedUser({ ctx, randomId });
        const userToUpdate = await seedUser({
          ctx,
          email: `${randomId}-other@example.com`,
        });
        const { site } = await seedSite({
          ctx,
          randomId,
          siteUsers: [
            { userId: user.id, roles: [SiteUserRole.owner] },
            { userId: userToUpdate.id, roles: [SiteUserRole.owner] },
          ],
        });
        const { siteUsers: otherSiteUsers } = await seedSite({
          ctx,
          randomId: randomUUID(),
          siteUsers: [{ userId: userToUpdate.id, roles: [SiteUserRole.owner] }],
        });
        const resp = await deleteSiteUser({
          siteId: site.id,
          user,
          siteUserId: otherSiteUsers[0].id,
        });
        expect(resp.status).toEqual(400);
      });
    }

    describe('User Role Access', () => {
      void testSiteUserRoleAccess({
        ctx,
        expectedStatuses: {
          ad_settings: 401,
          admin: 204,
          owner: 204,
          payment: 401,
          post_termination_new_owner: 401,
          reporting: 401,
          video: 401,
        },
        makeRequest: async ({ user, siteId }) => {
          const userToUpdate = await seedUser({
            ctx,
            email: `${randomUUID()}-other@example.com`,
          });
          const siteUser = await ctx.prisma.site_users.create({
            data: {
              created_at: new Date(),
              updated_at: new Date(),
              user_id: userToUpdate.id,
              site_id: siteId,
              roles_mask: convertRolesToMask([SiteUserRole.owner]),
            },
          });
          return deleteSiteUser({
            user,
            siteId: siteId,
            siteUserId: siteUser.id,
          });
        },
      });
    });
  });
});

interface FetchSiteUsersParams {
  siteId: number;
  user: { id: number; jwt_secret: string } | null;
  clientApplicationId?: string;
}
async function fetchSiteUsers({
  siteId,
  user,
  clientApplicationId,
}: FetchSiteUsersParams) {
  return fetch(`${ctx.host}/api/v1/sites/${siteId}/site_users`, {
    headers: user
      ? {
          Authorization: generateAuthToken(user, clientApplicationId),
        }
      : undefined,
  });
}

interface FetchSiteUsersJsonParams {
  siteId: number;
  user: { id: number; jwt_secret: string } | null;
  clientApplicationId?: string;
  randomId: string;
}
async function fetchSiteUsersJson(params: FetchSiteUsersJsonParams) {
  const resp = await fetchSiteUsers(params);
  const body = (await resp.json()) as ListSiteUsersResponseDto;
  return replaceRandomId(
    body.site_users.map((siteUser) => ({
      ...siteUser,
      site_id:
        siteUser.site_id === params.siteId ? '<site_id>' : siteUser.site_id,
    })),
    params.randomId,
  );
}

interface CreateSiteUserParams {
  siteId: number;
  user: { id: number; jwt_secret: string } | null;
  body: object;
}
async function createSiteUser({ siteId, user, body }: CreateSiteUserParams) {
  return fetch(`${ctx.host}/api/v1/sites/${siteId}/site_users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(user ? { Authorization: generateAuthToken(user) } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function createSiteUserJson(params: CreateSiteUserParams) {
  const resp = await createSiteUser(params);
  const body = (await resp.json()) as SerializeDto<CreateSiteUserResponseDto>;
  return body;
}

interface UpdateSiteUserParams {
  siteId: number;
  siteUserId: number;
  user: { id: number; jwt_secret: string } | null;
  body: UpdateSiteUserBodyDto;
}
async function updateSiteUser({
  siteId,
  siteUserId,
  user,
  body,
}: UpdateSiteUserParams) {
  return fetch(`${ctx.host}/api/v1/sites/${siteId}/site_users/${siteUserId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(user ? { Authorization: generateAuthToken(user) } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function updateSiteUserJson(params: UpdateSiteUserParams) {
  const resp = await updateSiteUser(params);
  const body = (await resp.json()) as SerializeDto<UpdateSiteUserResponseDto>;
  return body;
}

interface DeleteSiteUserParams {
  siteId: number;
  siteUserId: number;
  user: { id: number; jwt_secret: string } | null;
}
async function deleteSiteUser({
  siteId,
  siteUserId,
  user,
}: DeleteSiteUserParams) {
  return fetch(`${ctx.host}/api/v1/sites/${siteId}/site_users/${siteUserId}`, {
    method: 'DELETE',
    headers: {
      ...(user ? { Authorization: generateAuthToken(user) } : {}),
    },
  });
}

async function seedSiteUsers() {
  const randomId = randomUUID();
  const user = await seedUser({
    ctx,
    email: `${randomId}-1@example.com`,
  });
  const user2 = await seedUser({
    ctx,
    email: `${randomId}-2@example.com`,
  });
  const user3 = await seedUser({
    ctx,
    email: `${randomId}-3@example.com`,
  });
  const user4 = await seedUser({
    ctx,
    email: `${randomId}-4@example.com`,
  });
  const user5 = await seedUser({
    ctx,
    email: `${randomId}-5@example.com`,
  });
  const user6 = await seedUser({
    ctx,
    email: `${randomId}-6@example.com`,
    admin: true,
  });
  // Seeding a second site to ensure these don't come back in the response for another site
  await seedSite({
    ctx,
    siteUsers: [
      { userId: user.id, roles: [SiteUserRole.post_termination_new_owner] },
      { userId: user5.id, roles: [SiteUserRole.owner] },
    ],
  });
  const { site } = await seedSite({
    ctx,
    siteUsers: [
      { userId: user.id, roles: [SiteUserRole.owner] },
      {
        userId: user2.id,
        roles: [SiteUserRole.ad_settings, SiteUserRole.reporting],
      },
      { userId: user3.id, roles: [SiteUserRole.video, SiteUserRole.payment] },
      { userId: user4.id, roles: [SiteUserRole.post_termination_new_owner] },
      { userId: user6.id, roles: [] },
    ],
  });

  return { randomId, user, user2, user3, user4, user5, user6, site };
}

function processEmailRequestBody(
  reqBody: { message: { html: string } },
  randomId: string,
) {
  return replaceRandomId(
    {
      ...reqBody,
      message: {
        ...reqBody.message,
        html: reqBody.message.html.replace(
          /\?invitation_token=.*'\s/,
          `?invitation_token=<invitation_token>' `,
        ),
      },
    },
    randomId,
  );
}
