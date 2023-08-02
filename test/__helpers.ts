// tests/__helpers.ts
import {
  PrismaClient,
  payees,
  playlists,
  sites,
  users,
  videos,
  site_users,
  Prisma as PrismaDashboard,
  video_callbacks,
} from '@prisma/dashboard';
import {
  PrismaClient as PrismaClientReporting,
  Prisma as PrismaReporting,
} from '@prisma/reporting';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { hash } from '../src/utils/passwords';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { SiteUserRole, SiteUserRoleKey } from '../src/users/SiteUserRole.enum';
import { convertRolesToMask } from '../src/users/rolesUtilities';
import { toHStore } from '../src/utils/hstore';
import { getYesterdayDateUtc } from '../src/utils/date';
import { SiteSettingsHStoreRaw } from '../src/sites/hstore/SiteSettingsHStore';
import { SiteProfileHStoreRaw } from '../src/sites/hstore/SiteProfileHStore';
import { SiteSocialMediaHStoreRaw } from '../src/sites/hstore/SiteSocialMediaHStore';
import {
  SiteVideoSettingsHStore,
  SiteVideoSettingsHStoreRaw,
} from '../src/sites/hstore/SiteVideoSettingsHStore';
import { rest, DefaultBodyType } from 'msw';
import { setupServer } from 'msw/node';
import { Response } from 'undici';
import { isPresent } from '../src/utils/isPresent';

export interface TestContext {
  prisma: PrismaClient;
  reportingDb: PrismaClientReporting;
  host: string;
}
export function createTestContext(): TestContext {
  const ctx = {} as TestContext;
  const prismaCtx = prismaTestContext();
  const reportingDbCtx = reportingDbTestContext();
  let app: INestApplication | null = null;

  beforeAll(async () => {
    const prisma = await prismaCtx.before();
    const reportingDb = await reportingDbCtx.before();
    let host = 'http://localhost:5000';
    if (process.env.USE_RAILS_API !== 'true') {
      const moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
      app = moduleFixture.createNestApplication();
      app.useGlobalPipes(
        new ValidationPipe({ transform: true, whitelist: true }),
      );
      await app.init();
      const serverInstance = await app.listen(0);
      const port = (serverInstance?.address()).port;
      host = `http://localhost:${port}`;
    }
    Object.assign(ctx, {
      prisma,
      reportingDb,
      host,
    });
  });
  afterAll(async () => {
    await prismaCtx.after();
    await reportingDbCtx.after();
    await reportingDbTestContext().after();
    await app?.close();
  });
  return ctx;
}

function prismaTestContext() {
  let databaseUrl = '';
  let prismaClient: null | PrismaClient = null;
  return {
    async before() {
      // Generate the pg connection string for the test schema
      databaseUrl = `postgres://postgres:postgres@localhost:5432/test_nest_dashboard?schema=public`;
      process.env.DATABASE_URL = `${databaseUrl}&connection_limit=1`;
      // Construct a new Prisma Client connected to the Postgres schema
      prismaClient = new PrismaClient({
        // log: [
        //   {
        //     level: "info",
        //     emit: "stdout",
        //   },
        //   {
        //     level: "query",
        //     emit: "stdout",
        //   },
        //   {
        //     level: "warn",
        //     emit: "stdout",
        //   },
        // ],
      });
      return prismaClient;
    },
    async after() {
      await prismaClient?.$disconnect();
    },
  };
}

function reportingDbTestContext() {
  let databaseUrl = '';
  let prismaClient: null | PrismaClientReporting = null;
  return {
    async before() {
      // Generate the pg connection string for the test schema
      databaseUrl = `postgres://postgres:postgres@localhost:5432/test_nest_reporting?schema=public`;
      process.env.REPORTING_DATABASE_URL = `${databaseUrl}&connection_limit=1`;
      // Construct a new Prisma Client connected to the Postgres schema
      prismaClient = new PrismaClientReporting({
        // log: [
        //   {
        //     level: "info",
        //     emit: "stdout",
        //   },
        //   {
        //     level: "query",
        //     emit: "stdout",
        //   },
        //   {
        //     level: "warn",
        //     emit: "stdout",
        //   },
        // ],
      });
      return prismaClient;
    },
    async after() {
      await prismaClient?.$disconnect();
    },
  };
}

export function generateAuthToken(
  user: { id: number; jwt_secret: string },
  clientApplicationId = 'dashboard',
) {
  const token = jwt.sign(
    {
      user_id: user.id,
      jwt_secret: user.jwt_secret,
      client_application_id: clientApplicationId,
      exp: Math.floor(Date.now() / 1000) + 100000000,
    },
    process.env.DEVISE_JWT_SECRET_KEY || '',
    { algorithm: 'HS256' },
  );
  return `Bearer ${token}`;
}

interface SeedUserParams {
  ctx: TestContext;
  admin?: boolean;
  email?: string;
  randomId?: string;
}

export async function seedUser({
  ctx,
  admin,
  email,
  randomId = randomUUID(),
}: SeedUserParams) {
  return ctx.prisma.users.upsert({
    create: {
      email: email || `${randomId}@example.com`,
      encrypted_password: await hash('password'),
      super_admin: true,
      jwt_secret: randomId,
      roles_mask: admin ? 1 : null,
      favorite_sites: '1,2,3',
      title: 'user title',
      read_only_admin: false,
      authentication_token: randomUUID().slice(0, 10),
    },
    update: {},
    where: { email: 'super-admin@example.com' },
  });
}

interface UpdateSiteSettingHStoreParams {
  ctx: TestContext;
  siteId: number;
  settings: SiteSettingsHStoreRaw;
}
export async function updateSiteSettingHStore({
  ctx,
  siteId,
  settings,
}: UpdateSiteSettingHStoreParams) {
  await ctx.prisma.$executeRaw`
    UPDATE sites
    SET settings = ${toHStore(settings)}::hstore
    WHERE id = ${siteId};
`;
}

interface UpdateSiteProfileHStoreParams {
  ctx: TestContext;
  siteId: number;
  profile: SiteProfileHStoreRaw;
}
export async function updateSiteProfileHStore({
  ctx,
  siteId,
  profile,
}: UpdateSiteProfileHStoreParams) {
  await ctx.prisma.$executeRaw`
    UPDATE sites
    SET profile = ${toHStore(profile)}::hstore
    WHERE id = ${siteId};
`;
}

interface SeedSiteParams {
  ctx: TestContext;
  siteData?: Partial<sites>;
  siteUsers?: { userId: number; roles: SiteUserRole[] }[];
  randomId?: string;
  profile?: SiteProfileHStoreRaw;
  settings?: SiteSettingsHStoreRaw;
  socialMedia?: SiteSocialMediaHStoreRaw;
  video_settings?: SiteVideoSettingsHStoreRaw | SiteVideoSettingsHStore;
}
export async function seedSite({
  ctx,
  siteData,
  siteUsers,
  profile,
  socialMedia = {},
  settings = {},
  video_settings = {},
  randomId = randomUUID(),
}: SeedSiteParams) {
  const site = await ctx.prisma.sites.create({
    data: {
      title: `Test title ${randomId}`,
      slug: `${randomId}`,
      created_at: new Date(),
      updated_at: new Date(),
      domain: `${randomId}.com`,
      adunit: `adunit${randomId}`,
      address: `1 ${randomId} Street, FL, USA`,
      mcp_debug_password: `mcp_debug_password ${randomId}`,
      category_id: 1,
      offering_id: 1,
      live_on: new Date('2023-01-01T00:00:00.000Z'),
      anniversary_on: new Date(),
      ...siteData,
    },
  });
  const profileHstore: SiteProfileHStoreRaw = {
    accepted_terms_of_service: 'true',
    accepted_terms_of_service_by: 'Nice Person',
    accepted_terms_of_service_on: '1683722258',
    site_image: `${randomId}-site_image`,
    author_bio: `${randomId}-author_bio`,
    author_image: `${randomId}-author_image`,
    author_name: `${randomId}-author_name`,
    phone_number: '1234567890',
    site_description: `${randomId}-site_description`,
    ...profile,
  };
  const settingsHStore: SiteSettingsHStoreRaw = {
    ccpa_link_loc: 'footer',
    content_cba_mobile_limit: '-1',
    content_cba_desktop_limit: '-1',
    desktop_inview: 'false',
    interscroller_desktop: 'false',
    interscroller_mobile: 'false',
    launch_mode: 'true',
    mobile_inview: 'false',
    ...settings,
  };
  const videoSettings: SiteVideoSettingsHStoreRaw | SiteVideoSettingsHStore = {
    mobile_popout_placement: 'bottom_left',
    ...video_settings,
  };

  await ctx.prisma.$executeRaw`
    UPDATE sites
    SET profile = ${toHStore(profileHstore)}::hstore,
        settings = ${toHStore(settingsHStore)}::hstore,
        social_media = ${toHStore(socialMedia)}::hstore,
        video_settings = ${toHStore(videoSettings)}::hstore
    WHERE id = ${site.id};
  `;
  let returnedSiteUsers: site_users[] = [];
  if (siteUsers) {
    await ctx.prisma.site_users.createMany({
      data: siteUsers.map((siteUser) => ({
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        site_id: site.id,
        user_id: siteUser.userId,
        roles_mask: convertRolesToMask(siteUser.roles),
      })),
    });
    const createdSiteUsers = await ctx.prisma.site_users.findMany({
      where: { site_id: site.id },
    });
    returnedSiteUsers = siteUsers
      .map((siteUser) => {
        return createdSiteUsers.find(
          (createdSiteUser) => createdSiteUser.user_id === siteUser.userId,
        );
      })
      .filter(isPresent);
  }
  return { site, siteUsers: returnedSiteUsers };
}

interface GetSiteHStoresParams {
  ctx: TestContext;
  siteId: number;
}
interface SiteHStores {
  profile: SiteProfileHStoreRaw;
  settings: SiteSettingsHStoreRaw;
  social_media: SiteSocialMediaHStoreRaw;
  video_settings: SiteVideoSettingsHStoreRaw;
}
export async function getSiteHStores({
  ctx,
  siteId,
}: GetSiteHStoresParams): Promise<SiteHStores> {
  const resp: SiteHStores[] = await ctx.prisma.$queryRaw`
    SELECT
      hstore_to_json(sites.profile) AS profile,
      hstore_to_json(sites.settings) AS settings,
      hstore_to_json(sites.social_media) AS social_media,
      hstore_to_json(sites.video_settings) AS video_settings
    FROM sites
    WHERE sites.id = ${siteId}
  `;
  return resp[0];
}

export async function seedProSite(params: SeedSiteParams) {
  return seedSite({
    ...params,
    settings: {
      pro_invited: 'true',
      pro_invited_on: '1664476538',
      pro_accepted: 'accepted',
      pro_accepted_on: '1664476539',
      pro_accepted_by: 'Pro Accepter',
      pro_last_audit: '2022-11-29',
      pro_last_inspected: '2022-11-29',
      mcm_email: 'mcm_email',
      ...params.settings,
    },
  });
}

export async function seedPremiereSite(params: SeedSiteParams) {
  return seedSite({
    ...params,
    settings: {
      premiere_invited: 'true',
      premiere_accepted: 'true',
      premiere_accepted_on: '1617758141',
      premiere_accepted_by: 'Premiere Accepter',
      premiere_manage_account: 'true',
      ...params.settings,
    },
  });
}

interface SeedPayeeParams {
  ctx: TestContext;
  payeeData?: Partial<payees>;
}
export async function seedPayee({ ctx, payeeData }: SeedPayeeParams) {
  return ctx.prisma.payees.create({
    data: {
      name: 'Test Payee',
      tipalti_completed: true,
      created_at: new Date(),
      updated_at: new Date(),
      ...payeeData,
    },
  });
}

interface SeedFeaturesParams {
  ctx: TestContext;
}
export async function seedFeatures({ ctx }: SeedFeaturesParams) {
  return ctx.prisma.flipper_features.createMany({
    data: [
      {
        id: 330,
        key: 'clickwrap_tos',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 328,
        key: 'ga4_settings_page',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 327,
        key: 'grow.me-show-gpp-cta',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ],
    skipDuplicates: true,
  });
}

interface SeedGA4PropertyParams {
  ctx: TestContext;
  siteId: number;
  userId: number;
}
export async function seedGA4Property({
  ctx,
  siteId,
  userId,
}: SeedGA4PropertyParams) {
  return ctx.prisma.analytics_connections.create({
    data: {
      site_id: siteId,
      created_at: new Date(),
      updated_at: new Date(),
      account_type: 'ga4',
      property: '111111111',
      status: 'connected',
      refresh_token: randomUUID(),
      user_id: userId,
    },
  });
}

interface SeedRevenueReportsParams {
  ctx: TestContext;
  siteId: number;
  startDate: Date;
  endDate: Date;
  generateItem: (params: {
    date: Date;
    index: number;
  }) => Partial<PrismaReporting.revenue_reportsCreateManyInput>;
}
export async function seedRevenueReports({
  ctx,
  siteId,
  startDate,
  endDate,
  generateItem,
}: SeedRevenueReportsParams) {
  const data: PrismaReporting.revenue_reportsCreateManyInput[] = [];
  let index = 0;
  let currentDate = startDate;
  while (currentDate <= endDate) {
    data.push({
      site_id: siteId,
      date: currentDate,
      ...generateItem({ date: currentDate, index }),
    });
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + 1);
    index++;
  }
  await ctx.reportingDb.revenue_reports.createMany({
    data,
  });
}

interface SeedHealthCheckParams {
  ctx: TestContext;
  siteId: number;
  data: Partial<PrismaReporting.health_checksCreateInput>;
}
export async function seedHealthCheck({
  ctx,
  siteId,
  data,
}: SeedHealthCheckParams) {
  await ctx.reportingDb.health_checks.create({
    data: {
      created_at: new Date(),
      updated_at: new Date(),
      site_id: siteId,
      ads_txt: 'ok',
      privacy_policy: 'ok',
      date: getYesterdayDateUtc(),
      desktop_ads: 3.297872340425532,
      mobile_ads: 8.841379310344827,
      sticky_sidebar_ads: 3.9,
      revenue_share: 7600,
      desktop_viewability: 90,
      mobile_viewability: 66.2,
      ...data,
    },
  });
}

interface SeedMcmChildPublisher {
  ctx: TestContext;
  data?: Partial<PrismaDashboard.mcm_child_publishersCreateInput>;
  randomId?: string;
}
export async function seedMcmChildPublisher({
  ctx,
  randomId = randomUUID(),
  data,
}: SeedMcmChildPublisher) {
  return ctx.prisma.mcm_child_publishers.create({
    data: {
      created_at: new Date(),
      updated_at: new Date(),
      company_id: parseInt(Math.random().toString().slice(2, 12)),
      email: `${randomId}@example.com`,
      name: `Person Name (Site ${randomId})`,
      network_code: '333333333333',
      status: 'approved',
      google_appealed: false,
      google_submit: true,
      approved_at: new Date('2022-05-02 08:45:12.014201'),
      seller_id: '11111111111111111111111111111111',
      offering_id: 1,
      business_name: `Site ${randomId} business name`,
      business_domain: `site${randomId}.com`,
      ...data,
    },
  });
}

interface SeedMcmGamSite {
  ctx: TestContext;
  data?: Partial<PrismaDashboard.mcm_gam_sitesCreateInput>;
  randomId?: string;
}
export async function seedMcmGamSite({
  ctx,
  randomId = randomUUID(),
  data,
}: SeedMcmGamSite) {
  return ctx.prisma.mcm_gam_sites.create({
    data: {
      gam_site_id: parseInt(Math.random().toString().slice(2, 12)),
      status: 'active',
      domain: `${randomId}.com`,
      created_at: new Date(),
      updated_at: new Date(),
      site_id: null,
      tagging_enabled_at: new Date(),
      disapproved_at: null,
      duplicate_at: null,
      invited_at: null,
      google_submit: true,
      seen: true,
      ...data,
    },
  });
}

interface SeedVideoParams {
  ctx: TestContext;
  site: { id?: number };
  video?: Partial<videos>;
}

export const seedVideo = async ({
  ctx,
  site = {},
  video = {},
}: SeedVideoParams) => {
  const slug = randomUUID().slice(0, 10);
  return await ctx.prisma.videos.create({
    data: {
      slug,
      site_id: site.id,
      duration: 50,
      height: 1080,
      width: 1920,
      status: 1,
      title: 'title',
      description: 'description',
      file: 'file',
      image: 'image',
      keywords: 'keywords',
      permalink: 'permalink',
      video_headline: 'video_headline',
      streaming_profile: 'video',
      created_at: new Date('2023-06-16T19:22:32.063Z'),
      updated_at: new Date('2023-06-16T19:22:32.064Z'),
      up_next_order: 0,
      ...video,
    },
  });
};

interface SeedVideoTrackParams {
  ctx: TestContext;
  video: { id: number; slug: string | null };
}

export const seedVideoTrack = async ({ ctx, video }: SeedVideoTrackParams) =>
  await ctx.prisma.video_tracks.create({
    data: {
      video_id: video.id,
      filetype: 'vtt',
      kind: 'captions',
      srclang: 'en',
      slug: randomUUID().slice(0, 10),
      created_at: new Date('2023-06-16T19:22:32.065Z'),
      updated_at: new Date('2023-06-16T19:22:32.066Z'),
      default: false,
    },
  });

interface SeedVideoChapterParams {
  ctx: TestContext;
  video: { id: number; slug: string | null };
}

export const seedVideoChapter = async ({
  ctx,
  video,
}: SeedVideoChapterParams) =>
  await ctx.prisma.video_chapters.create({
    data: {
      video_id: video.id,
      created_at: new Date('2023-06-16T19:22:32.067Z'),
      updated_at: new Date('2023-06-16T19:22:32.068Z'),
      description: 'description',
      time: 10,
    },
  });

export function replaceRandomId<T>(
  payload: T,
  randomId: string,
  replacement = '<randomId>',
): T {
  const payloadString = JSON.stringify(payload);
  return JSON.parse(
    payloadString.replace(new RegExp(randomId, 'g'), replacement),
  );
}

/** O(n) but we can afford it. */
export function replaceRandomIds<T>(payload: T, randomIds: Array<string>): T {
  return randomIds.reduce(
    (payload, id) => replaceRandomId(payload, id),
    payload,
  );
}

export const DATE_REGEX =
  /[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z/;
export const UUID_REGEX =
  /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;

export function normalizeDateTimeToUtc(date: null): null;
export function normalizeDateTimeToUtc(date: undefined): undefined;
export function normalizeDateTimeToUtc(date: string): string;
export function normalizeDateTimeToUtc(
  date: string | null | undefined,
): string | null | undefined;
export function normalizeDateTimeToUtc(
  dateTime: string | null | undefined,
): string | null | undefined {
  if (!dateTime) {
    return dateTime;
  }
  return new Date(dateTime).toISOString();
}

export const seedVideoCallback = async ({
  ctx,
  slug,
  overrides = {},
}: {
  ctx: TestContext;
  slug: string;
  overrides?: Partial<video_callbacks>;
}) =>
  await ctx.prisma.video_callbacks.create({
    data: {
      slug,
      ...overrides,
    },
  });

interface SeedPlaylistParams {
  ctx: TestContext;
  site?: sites;
  user?: users;
  videos?: videos[];
  playlistData?: Partial<playlists>;
}

export const seedPlaylist = async ({
  ctx,
  site,
  user,
  videos,
  playlistData,
}: SeedPlaylistParams) => {
  user = user || (await seedUser({ ctx }));
  site =
    site ||
    (
      await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      })
    ).site;
  videos = videos || [
    await seedVideo({ ctx, site }),
    await seedVideo({ ctx, site }),
  ];
  const playlist = await ctx.prisma.playlists.create({
    data: {
      site_id: site.id,
      created_at: new Date(),
      updated_at: new Date(),
      description: 'description',
      headline: 'headline',
      image: 'image',
      title: 'title',
      user_id: user.id,
      ...playlistData,
    },
  });

  for (const video of videos) {
    await ctx.prisma.playlist_videos.create({
      data: {
        playlist_id: playlist.id,
        position: 1,
        video_id: video.id,
      },
    });
  }

  return { playlist, user, site };
};
interface TestSiteUserRolesMakeRequestParams {
  user: users;
  siteId: number;
}
interface TestSiteUserRoleAccessParams {
  ctx: TestContext;
  makeRequest: (
    params: TestSiteUserRolesMakeRequestParams,
  ) => Promise<Response>;
  seedSiteParams?: Partial<Parameters<typeof seedSite>[0]>;
  expectedStatuses: Record<SiteUserRoleKey | 'admin', number>;
}

export async function testSiteUserRoleAccess({
  ctx,
  makeRequest,
  seedSiteParams,
  expectedStatuses,
}: TestSiteUserRoleAccessParams) {
  const siteUserRoles = Object.entries(SiteUserRole);
  for (const role of siteUserRoles) {
    const [roleName, roleValue] = role;
    if (typeof roleValue !== 'number') {
      continue;
    }

    it(`matches the status for a user with the ${roleName} role`, async () => {
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [roleValue] }],
        ...seedSiteParams,
      });
      const response = await makeRequest({ user, siteId: site.id });
      expect(response.status).toEqual(
        expectedStatuses[roleName as SiteUserRoleKey],
      );
    });
  }

  it(`matches the status for an admin`, async () => {
    const user = await seedUser({ ctx, admin: true });
    const { site } = await seedSite({
      ctx,
      ...seedSiteParams,
    });
    const response = await makeRequest({ user, siteId: site.id });
    expect(response.status).toEqual(expectedStatuses.admin);
  });
}

/**
 * Call before an outbound call. Await its promise after the call is made.
 * @example
 * const outboundRequestResult = captureOutboundRequest();
 * await fetch('https://example.com');
 * const { url, body } = await outboundRequestResult;
 */
export const captureOutboundRequest = <ResponseBody extends DefaultBodyType>(
  specificRequestUrl?: string,
) => {
  const server = setupServer();
  server.listen();
  server.resetHandlers();

  const promise = new Promise<{ url: string; body: ResponseBody }>(
    (resolve) => {
      const timeout = setTimeout(() => {
        resolve({ url: '', body: {} as ResponseBody });
      }, 1000);

      server.use(
        rest.all('*', async (req, res, ctx) => {
          const url = req.url.toString();
          if (specificRequestUrl && url !== specificRequestUrl) {
            return req.passthrough();
          }
          const body = req.body as ResponseBody;

          server.close();
          clearTimeout(timeout);
          resolve({ url, body });

          return res.once(ctx.json({ success: true }));
        }),
      );
    },
  );

  return promise;
};

export function normalizeVersionsObjectChanges(objectChanges: string) {
  try {
    return JSON.parse(objectChanges);
  } catch (e) {
    const blocks = [];
    let currentBlock: {
      fieldName: string;
      beforeValue?: unknown | null;
      afterValue?: unknown | null;
    } | null = null;
    let currentValue: string | null = '';

    const normalizeValue = (value: string | null) => {
      if (!value) {
        return value;
      } else if (value.includes('"=>"')) {
        const splitValue = value.slice(2, -2).split('", "');
        return splitValue
          .map((pair) => pair.split('"=>"'))
          .reduce<Record<string, string>>((prev, current) => {
            prev[current[0]] = current[1];
            return prev;
          }, {});
      } else if (value.match(/^\d+$/)) {
        return Number(value);
      }
      return value;
    };

    const addValueToBlock = (value: string | null) => {
      if (!currentBlock) {
        return;
      }
      if (currentBlock.beforeValue !== undefined) {
        currentBlock.afterValue = normalizeValue(value);
      } else {
        currentBlock.beforeValue = normalizeValue(value);
      }
      currentValue = '';
    };
    for (const line of objectChanges.split('\n')) {
      const startOfBlockMatch = line.match(/^([a-z_]+)\:$/);
      if (startOfBlockMatch) {
        const fieldName = startOfBlockMatch[1];
        if (currentBlock) {
          if (currentValue) {
            addValueToBlock(currentValue);
          }
          blocks.push(currentBlock);
        }
        currentValue = '';
        currentBlock = { fieldName };
      } else if (line === '---') {
        continue;
      } else if (line === '-' || line === '- ') {
        if (currentValue) {
          addValueToBlock(currentValue);
        }
        addValueToBlock(null);
      } else if (line.startsWith('- ')) {
        if (currentValue) {
          addValueToBlock(currentValue);
        }
        currentValue = line.slice(2);
      } else if (line.startsWith('  ')) {
        currentValue += ' ' + line.slice(2);
      }
    }
    if (currentBlock) {
      addValueToBlock(currentValue);
      blocks.push(currentBlock);
    }

    const normalized = blocks.reduce<Record<string, [unknown, unknown]>>(
      (prev, current) => {
        prev[current.fieldName] = [current.beforeValue, current.afterValue];
        return prev;
      },
      {},
    );
    return normalized;
  }
}
