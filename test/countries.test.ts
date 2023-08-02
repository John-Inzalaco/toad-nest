import { createTestContext, generateAuthToken, seedUser } from './__helpers';
import { users } from '@prisma/dashboard';

const ctx = createTestContext();

describe('Countries API', () => {
  let user: users;

  beforeAll(async () => {
    user = await seedUser({ ctx });
  });

  describe('/api/v1/countries', () => {
    it('lists all countries', async () => {
      const resp = await fetch(`${ctx.host}/api/v1/countries`, {
        headers: {
          Authorization: generateAuthToken(user),
        },
      });
      const body = await resp.json();
      expect(body).toMatchInlineSnapshot(`
        {
          "country": [
            {
              "code": "AF",
              "id": 1,
              "name": "Afghanistan",
            },
            {
              "code": "CN",
              "id": 2,
              "name": "China",
            },
            {
              "code": "IN",
              "id": 3,
              "name": "India",
            },
            {
              "code": "ID",
              "id": 4,
              "name": "Indonesia",
            },
            {
              "code": "PK",
              "id": 5,
              "name": "Pakistan",
            },
            {
              "code": "US",
              "id": 6,
              "name": "United States",
            },
            {
              "code": "BR",
              "id": 7,
              "name": "Brazil",
            },
            {
              "code": "NG",
              "id": 8,
              "name": "Nigeria",
            },
            {
              "code": "BD",
              "id": 9,
              "name": "Bangladesh",
            },
            {
              "code": "RU",
              "id": 10,
              "name": "Russia",
            },
          ],
        }
      `);
    });

    it('can filter countries by code', async () => {
      const resp = await fetch(`${ctx.host}/api/v1/countries?code=US`, {
        headers: {
          Authorization: generateAuthToken(user),
        },
      });
      const body = await resp.json();
      expect(body).toMatchInlineSnapshot(`
        {
          "country": [
            {
              "code": "US",
              "id": 6,
              "name": "United States",
            },
          ],
        }
      `);
    });

    it('can filter countries by name', async () => {
      const resp = await fetch(
        `${ctx.host}/api/v1/countries?name=${encodeURIComponent(
          'United States',
        )}`,
        {
          headers: {
            Authorization: generateAuthToken(user),
          },
        },
      );
      const body = await resp.json();
      expect(body).toMatchInlineSnapshot(`
        {
          "country": [
            {
              "code": "US",
              "id": 6,
              "name": "United States",
            },
          ],
        }
      `);
    });

    it("returns an error if the user isn't authenticated", async () => {
      const resp = await fetch(`${ctx.host}/api/v1/countries`);
      expect(resp.status).toEqual(401);
      expect(resp.statusText).toEqual('Unauthorized');
    });

    it("returns an empty array if name filter doesn't exist", async () => {
      const resp = await fetch(
        `${ctx.host}/api/v1/countries?name=${encodeURIComponent('Fake')}`,
        {
          headers: {
            Authorization: generateAuthToken(user),
          },
        },
      );
      const body = await resp.json();
      expect(body).toMatchInlineSnapshot(`
        {
          "country": [],
        }
      `);
    });

    it("returns an empty array if code filter doesn't exist", async () => {
      const resp = await fetch(
        `${ctx.host}/api/v1/countries?code=${encodeURIComponent('ZZ')}`,
        {
          headers: {
            Authorization: generateAuthToken(user),
          },
        },
      );
      const body = await resp.json();
      expect(body).toMatchInlineSnapshot(`
        {
          "country": [],
        }
      `);
    });

    it('blocks access to a pds token', async () => {
      const resp = await fetch(`${ctx.host}/api/v1/countries`, {
        headers: {
          Authorization: generateAuthToken(user, 'pds'),
        },
      });
      expect(resp.status).toEqual(401);
    });

    it('blocks access to an mcp token', async () => {
      const resp = await fetch(`${ctx.host}/api/v1/countries`, {
        headers: {
          Authorization: generateAuthToken(user, 'mcp'),
        },
      });
      expect(resp.status).toEqual(401);
    });
  });

  describe('/api/v1/countries/:id', () => {
    it('returns a single country by id', async () => {
      const resp = await fetch(`${ctx.host}/api/v1/countries/2`, {
        headers: {
          Authorization: generateAuthToken(user),
        },
      });
      const body = await resp.json();
      expect(body).toMatchInlineSnapshot(`
        {
          "country": {
            "code": "CN",
            "id": 2,
            "name": "China",
          },
        }
      `);
    });

    it('returns a 404 if the country id is not found', async () => {
      const resp = await fetch(`${ctx.host}/api/v1/countries/1000`, {
        headers: {
          Authorization: generateAuthToken(user),
        },
      });
      expect(resp.status).toEqual(404);
      expect(resp.statusText).toEqual('Not Found');
    });

    it('returns a 401 if the user is not authenticated', async () => {
      const resp = await fetch(`${ctx.host}/api/v1/countries/1000`);
      expect(resp.status).toEqual(401);
      expect(resp.statusText).toEqual('Unauthorized');
    });
  });
});
