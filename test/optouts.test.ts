import { createTestContext, generateAuthToken, seedUser } from './__helpers';
import { users } from '@prisma/dashboard';

const ctx = createTestContext();

describe('Optouts API', () => {
  let user: users;

  beforeAll(async () => {
    user = await seedUser({ ctx });
    if (!(await ctx.prisma.optouts.findFirst())) {
      await ctx.prisma.optouts.createMany({
        data: [
          {
            id: 1,
            title: 'Alcohol',
            slug: 'alc',
            description:
              'Ads can include branding ads from alcohol producers, online retailers, wineries, breweries, events sponsored by alcohol companies that do not promote alcoholic drinks, alcohol accessories and non-alcoholic establishments that mention alcohol. Some countries have restrictions on the types of alcohol related ads that are allowed and will only show permitted ad types.',
            iab: 'IAB8-5,IAB8-18',
          },
          {
            id: 2,
            title: 'Gambling & Betting',
            slug: 'gnb',
            description:
              'Ads can include online casino games, lotteries and sports betting and will only serve in regions permitted by law. Some regions have restrictions on the types of gambling ads that are allowed and will only show permitted ad types.',
            iab: 'IAB9-7',
          },
          {
            id: 3,
            title: 'Black Magic, Astrology & Esoteric',
            slug: 'bae',
            description:
              'Includes zodiac, horoscopes, love spells, potions, and psychic-related ads.',
            iab: 'IAB9-20,IAB15-1',
          },
          {
            id: 4,
            title: 'Cosmetic Procedures & Body Modification',
            slug: 'cpbm',
            description:
              'Includes lifts, suctions, lasers, hair removal and restoration, tattoos, and body modification.',
            iab: 'IAB18-2',
          },
          {
            id: 5,
            title: 'Dating',
            slug: 'dtg',
            description:
              'Includes dating services and online dating communities.',
            iab: 'IAB14-1',
          },
          {
            id: 6,
            title: 'Drugs & Supplements',
            slug: 'dns',
            description:
              'Includes pharmaceuticals, vitamins, supplements, and related retailers; does not include resources providing information about drugs.',
            iab: 'IAB7-41,IAB7-43,IAB7-27,IAB7-22,IAB7-20,IAB7-3,IAB7-38,IAB7-6',
          },
          {
            id: 7,
            title: 'Get Rich Quick',
            slug: 'gr',
            description: 'Schemes promising fast earning.',
            iab: '',
          },
          {
            id: 8,
            title: 'Politics',
            slug: 'pol',
            description:
              'Includes politics or controversial social issues; does not include ads for news organizations that are not generally associated with a partisan viewpoint on issues.',
            iab: 'IAB11-4',
          },
          {
            id: 9,
            title: 'References to Sex & Sexuality',
            slug: 'sns',
            description:
              'Includes ads that are sexually suggestive, relate to sexual and reproductive health, or refer to sex and sexuality.',
            iab: 'IAB7-39',
          },
          {
            id: 10,
            title: 'Religion',
            slug: 'rel',
            description:
              'Includes religious ads and ads advocating for or against religious views; does not include astrology or non-denominational spirituality.',
            iab: 'IAB23',
          },
          {
            id: 11,
            title: 'Downloadable Utilities',
            slug: 'dwn',
            description:
              'Mobile add-ons including ringtones, and other downloadable goodies such as screensavers and wallpapers for desktop PCs and profile layouts and graphics for social networks. Mediavine Note: This is often responsible for ads with Download buttons.',
            iab: '',
          },
        ],
      });
    }
  });

  describe('/api/v1/optouts', () => {
    it('lists all optouts', async () => {
      const resp = await fetch(`${ctx.host}/api/v1/optouts`, {
        headers: {
          Authorization: generateAuthToken(user),
        },
      });
      const body = await resp.json();
      expect(body).toMatchInlineSnapshot(`
        {
          "optouts": [
            {
              "description": "Ads can include branding ads from alcohol producers, online retailers, wineries, breweries, events sponsored by alcohol companies that do not promote alcoholic drinks, alcohol accessories and non-alcoholic establishments that mention alcohol. Some countries have restrictions on the types of alcohol related ads that are allowed and will only show permitted ad types.",
              "id": 1,
              "slug": "alc",
              "title": "Alcohol",
            },
            {
              "description": "Ads can include online casino games, lotteries and sports betting and will only serve in regions permitted by law. Some regions have restrictions on the types of gambling ads that are allowed and will only show permitted ad types.",
              "id": 2,
              "slug": "gnb",
              "title": "Gambling & Betting",
            },
            {
              "description": "Includes zodiac, horoscopes, love spells, potions, and psychic-related ads.",
              "id": 3,
              "slug": "bae",
              "title": "Black Magic, Astrology & Esoteric",
            },
            {
              "description": "Includes lifts, suctions, lasers, hair removal and restoration, tattoos, and body modification.",
              "id": 4,
              "slug": "cpbm",
              "title": "Cosmetic Procedures & Body Modification",
            },
            {
              "description": "Includes dating services and online dating communities.",
              "id": 5,
              "slug": "dtg",
              "title": "Dating",
            },
            {
              "description": "Includes pharmaceuticals, vitamins, supplements, and related retailers; does not include resources providing information about drugs.",
              "id": 6,
              "slug": "dns",
              "title": "Drugs & Supplements",
            },
            {
              "description": "Schemes promising fast earning.",
              "id": 7,
              "slug": "gr",
              "title": "Get Rich Quick",
            },
            {
              "description": "Includes politics or controversial social issues; does not include ads for news organizations that are not generally associated with a partisan viewpoint on issues.",
              "id": 8,
              "slug": "pol",
              "title": "Politics",
            },
            {
              "description": "Includes ads that are sexually suggestive, relate to sexual and reproductive health, or refer to sex and sexuality.",
              "id": 9,
              "slug": "sns",
              "title": "References to Sex & Sexuality",
            },
            {
              "description": "Includes religious ads and ads advocating for or against religious views; does not include astrology or non-denominational spirituality.",
              "id": 10,
              "slug": "rel",
              "title": "Religion",
            },
            {
              "description": "Mobile add-ons including ringtones, and other downloadable goodies such as screensavers and wallpapers for desktop PCs and profile layouts and graphics for social networks. Mediavine Note: This is often responsible for ads with Download buttons.",
              "id": 11,
              "slug": "dwn",
              "title": "Downloadable Utilities",
            },
          ],
        }
      `);
    });

    it("returns an error if the user isn't authenticated", async () => {
      const resp = await fetch(`${ctx.host}/api/v1/optouts`);
      expect(resp.status).toEqual(401);
    });
  });
});
