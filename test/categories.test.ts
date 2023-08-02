import { createTestContext, generateAuthToken, seedUser } from './__helpers';
import { users } from '@prisma/dashboard';

const ctx = createTestContext();

describe('Categories API', () => {
  let user: users;

  beforeAll(async () => {
    user = await seedUser({ ctx });
  });

  describe('/api/v1/categories', () => {
    it('lists all categories', async () => {
      const resp = await fetch(`${ctx.host}/api/v1/categories`, {
        headers: {
          Authorization: generateAuthToken(user),
        },
      });
      const body = await resp.json();
      expect(body).toMatchInlineSnapshot(`
        {
          "categories": [
            {
              "id": 1,
              "slug": "arts-and-entertainment",
              "title": "Arts & Entertainment",
            },
            {
              "id": 2,
              "slug": "education",
              "title": "Education",
            },
            {
              "id": 3,
              "slug": "family-and-parenting",
              "title": "Family & Parenting",
            },
            {
              "id": 4,
              "slug": "health-and-fitness",
              "title": "Health & Fitness",
            },
            {
              "id": 5,
              "slug": "food-and-drink",
              "title": "Food & Drink",
            },
            {
              "id": 6,
              "slug": "hobbies-and-interests",
              "title": "Hobbies & Interests",
            },
            {
              "id": 7,
              "slug": "home-and-garden",
              "title": "Home & Garden",
            },
            {
              "id": 8,
              "slug": "style-and-fashion",
              "title": "Style & Fashion",
            },
            {
              "id": 9,
              "slug": "travel",
              "title": "Travel",
            },
            {
              "id": 10,
              "slug": "food-and-drink-vegan",
              "title": "Vegan",
            },
          ],
        }
      `);
    });

    it("returns an error if the user isn't authenticated", async () => {
      const resp = await fetch(`${ctx.host}/api/v1/categories`);
      expect(resp.status).toEqual(401);
    });
  });
});
