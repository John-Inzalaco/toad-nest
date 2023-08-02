import { randomUUID } from 'crypto';
import { ListPlaylistsResponseDto } from '../src/playlists/dto/ListPlaylists.dto';
import {
  createTestContext,
  generateAuthToken,
  seedPlaylist,
  seedSite,
  seedUser,
  testSiteUserRoleAccess,
} from './__helpers';
import { playlists, sites, users } from '@prisma/dashboard';
import { SiteUserRole } from '../src/users/SiteUserRole.enum';

const ctx = createTestContext();

describe('Playlists', () => {
  describe('Index', () => {
    async function fetchPlaylists({
      queryParams,
      user,
      site,
    }: {
      queryParams?: ConstructorParameters<typeof URLSearchParams>[0];
      user: users;
      site: sites;
    }) {
      const headers = {
        Authorization: `${generateAuthToken(user)}`,
        'content-type': 'application/json',
      };
      const resp = await fetch(
        `${ctx.host}/api/v1/sites/${site.id}/playlists${
          queryParams ? `?${new URLSearchParams(queryParams)}` : ''
        }`,
        {
          headers,
        },
      );

      return { resp };
    }

    it('returns all playlists', async () => {
      const { user, site } = await seedMultiplePlaylists(2);
      const { resp } = await fetchPlaylists({ user, site });
      expect(resp.status).toEqual(200);
      const body = (await resp.json()) as ListPlaylistsResponseDto;

      const staticBody = replaceDynamicFields(body, [
        'created_at',
        'updated_at',
        'id',
        'site_id',
        'user_id',
        'slug',
        'title',
        'description',
      ]);
      /** Ensure order for snapshotting */
      staticBody.playlists.sort(
        (a: { title: string | null }, b: { title: string | null }) => {
          if (a.title && b.title) {
            return a.title > b.title ? 1 : -1;
          }
          return 0;
        },
      );

      expect(staticBody).toMatchSnapshot();
    });

    describe('query param options', () => {
      let playlists: playlists[];
      let user: users;
      let site: sites;

      beforeAll(async () => {
        /** Reusing these records to speed up tests */
        const seed = await seedMultiplePlaylists(100);
        playlists = seed.playlists;
        user = seed.user;
        site = seed.site;
      });

      it('validate sort params', async () => {
        const { resp } = await fetchPlaylists({
          queryParams: {
            sort: 'image',
            direction: 'asc',
          },
          user,
          site,
        });

        expect(resp.status).toEqual(process.env.USE_RAILS_API ? 200 : 400);
        // const body = (await resp.json()) as ListPlaylistsResponseDto;
      });

      it('sorts by title', async () => {
        const { resp } = await fetchPlaylists({
          queryParams: {
            sort: 'title',
            direction: 'asc',
          },
          user,
          site,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(resp.status).toEqual(200);
        const body = (await resp.json()) as ListPlaylistsResponseDto;

        const expectedTitles = playlists
          .sort((a, b) => (a.title && b.title && a.title > b.title ? 1 : -1))
          .map((playlist) => playlist.title);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const actualTitles = body.playlists.map(
          (playlist: playlists) => playlist.title,
        );

        expect(actualTitles).toEqual(expectedTitles);
      });

      it('sorts by created_at', async () => {
        const { resp } = await fetchPlaylists({
          queryParams: {
            sort: 'created_at',
            direction: 'asc',
          },
          user,
          site,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(resp.status).toEqual(200);
        const body = (await resp.json()) as ListPlaylistsResponseDto;

        const expectedResult = [...playlists]
          .sort((a, b) =>
            a.created_at && b.created_at && a.created_at > b.created_at
              ? 1
              : -1,
          )
          .map((playlist) => new Date(playlist.created_at));

        const actualResult = body.playlists.map(
          (playlist: playlists) => new Date(playlist.created_at),
        );

        expect(actualResult).toEqual(expectedResult);
      });

      it('paginates by 25 by default', async () => {
        const { resp } = await fetchPlaylists({
          queryParams: {
            page: '1',
          },
          user,
          site,
        });
        const body = (await resp.json()) as ListPlaylistsResponseDto;
        expect(body.playlists.length).toEqual(25);
      });

      it('paginates by given per_page param', async () => {
        const { resp } = await fetchPlaylists({
          queryParams: {
            page: '1',
            per_page: '10',
          },
          user,
          site,
        });
        const body = (await resp.json()) as ListPlaylistsResponseDto;
        expect(body.playlists.length).toEqual(10);
      });

      it('takes a page param', async () => {
        const defaultPerPage = 25;
        const page = 3;

        const { resp } = await fetchPlaylists({
          user,
          site,
          queryParams: {
            page: page.toString(),
          },
        });
        const body = (await resp.json()) as ListPlaylistsResponseDto;
        /** Sorting by created_at, desc, as defaulted in Rails app */
        const sortedPlaylists = [...playlists].sort((a, b) =>
          a.created_at && b.created_at && a.created_at < b.created_at ? 1 : -1,
        );
        const expectedResult =
          sortedPlaylists[defaultPerPage * (page - 1)].title;
        const actualResult = body.playlists[0].title;
        expect(actualResult).toEqual(expectedResult);
      });

      it('takes page and per_page params', async () => {
        const perPage = 10;
        const page = 3;

        const { resp } = await fetchPlaylists({
          user,
          site,
          queryParams: {
            page: page.toString(),
            per_page: perPage.toString(),
          },
        });
        const body = (await resp.json()) as ListPlaylistsResponseDto;
        /** Sorting by created_at, desc, as defaulted in Rails app */
        const sortedPlaylists = [...playlists].sort((a, b) =>
          a.created_at && b.created_at && a.created_at < b.created_at ? 1 : -1,
        );
        const expectedResult = sortedPlaylists[perPage * (page - 1)].title;
        const actualResult = body.playlists[0].title;
        expect(actualResult).toEqual(expectedResult);
      });
      it('searches by title', async () => {
        const searchTerm = 'Hello World';
        const user = await seedUser({ ctx });
        const { site } = await seedSite({
          ctx,
          siteUsers: [
            {
              userId: user.id,
              roles: [SiteUserRole.video],
            },
          ],
        });

        const { playlist: playlistOne } = await seedPlaylist({
          ctx,
          site,
          user,
          playlistData: {
            title: `${searchTerm} Video One Title`,
            description: 'Video One Description',
          },
        });

        const { playlist: playlistTwo } = await seedPlaylist({
          ctx,
          site,
          user,
          playlistData: {
            title: 'Video Two',
            description: `${searchTerm} Video Two Description`,
          },
        });

        await seedPlaylist({
          ctx,
          site,
          user,
          playlistData: {
            title: 'Video Three Title',
            description: `Video Three Description`,
          },
        });

        const { playlist: playlistFour } = await seedPlaylist({
          ctx,
          site,
          user,
          playlistData: {
            title: `${searchTerm} Video Four`,
            description: `Video Four Description`,
          },
        });

        const expectedResult = [
          playlistOne.title,
          playlistTwo.title,
          /** Three should not match */
          playlistFour.title,
        ];
        const { resp } = await fetchPlaylists({
          queryParams: {
            query: searchTerm.replace(' ', '+'),
          },
          user,
          site,
        });
        const body = (await resp.json()) as ListPlaylistsResponseDto;

        const actualResult = body.playlists.map(
          (playlist: playlists) => playlist.title,
        );

        expect(new Set(actualResult)).toEqual(new Set(expectedResult));
      });

      it('returns the count of the entire dataset available', async () => {
        const page = 3;

        const { resp } = await fetchPlaylists({
          user,
          site,
          queryParams: {
            page: page.toString(),
          },
        });

        const body = (await resp.json()) as ListPlaylistsResponseDto;
        expect(body.playlists.length).toEqual(25);
        expect(body.total_count).toEqual(100);
      });
    });

    void testSiteUserRoleAccess({
      ctx,
      expectedStatuses: {
        ad_settings: 401,
        admin: 200,
        owner: 200,
        payment: 401,
        post_termination_new_owner: 401,
        reporting: 401,
        video: 200,
      },
      makeRequest: ({ user, siteId }) => {
        return fetch(`${ctx.host}/api/v1/sites/${siteId}/playlists`, {
          headers: {
            Authorization: `${generateAuthToken(user)}`,
          },
        });
      },
    });
  });
});

type ConvertDynamicFields<V extends string, T> = T extends
  | string
  | number
  | boolean
  | null
  | undefined
  ? T
  : {
      [K in keyof T]: T[K] extends (infer U)[]
        ? ConvertDynamicFields<V, U>[]
        : K extends V
        ? `<${K}>`
        : ConvertDynamicFields<V, T[K]>;
    };
const replaceDynamicFields = <V extends string, T extends object>(
  obj: T,
  fieldNames: V[],
): ConvertDynamicFields<V, T> => {
  return Object.entries(obj).reduce<Record<string, unknown>>(
    (prev, [key, value]: [key: string, value: unknown]) => {
      if (Array.isArray(value)) {
        prev[key] = value.map((v) =>
          typeof v === 'object' ? replaceDynamicFields(v, fieldNames) : v,
        );
      } else if (value && typeof value === 'object') {
        prev[key] = replaceDynamicFields(value, fieldNames);
      } else if (fieldNames.includes(key as V)) {
        prev[key] = `<${key}>`;
      } else {
        prev[key] = value;
      }
      return prev;
    },
    {},
  ) as ConvertDynamicFields<V, T>;
};

async function seedMultiplePlaylists(numOfPlaylists: number) {
  const playlists = [];
  const initialPlaylist = await seedPlaylist({
    ctx,
    playlistData: { title: `title ${1}` },
  });

  const { playlist, site, user } = initialPlaylist;

  playlists.push(playlist);

  for (let i = 1; i < numOfPlaylists; i++) {
    const { playlist } = await seedPlaylist({
      ctx,
      site,
      user,
      playlistData: {
        title: `title ${randomUUID().slice(0, 3)}`,
        description: `description ${randomUUID().slice(0, 3)}`,
      },
    });
    playlists.push(playlist);
  }

  return { playlists, site, user };
}
