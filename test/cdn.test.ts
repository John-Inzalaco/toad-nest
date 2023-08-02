import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { CDNService } from '../src/cdn/cdn.service';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../src/environment';

const server = setupServer();

describe('CDNService', () => {
  let configService: ConfigService<EnvironmentVariables>;
  let cdnService: CDNService;

  beforeAll(() => {
    server.listen();
    server.use(
      rest.post(
        `https://api.fastly.com/service/test/purge/video_sitemap/38`,
        async (req, res, ctx) => res(ctx.json({ success: true })),
      ),
    );
  });

  beforeEach(() => {
    process.env.FASTLY_SERVICE_ID = 'test';
    configService = new ConfigService<EnvironmentVariables>();
    cdnService = new CDNService(configService);
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe('in production env', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      configService = new ConfigService();
      cdnService = new CDNService(configService);
    });

    it('sends a purge request to fastly', async () => {
      const testKey = `video_sitemap/38`;
      const resp: { success?: boolean } = (await cdnService.softPurgeKey({
        key: testKey,
      })) as { success?: boolean };
      expect(resp.success).toEqual(true);
    });
  });

  describe('in non-production env', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
      configService = new ConfigService();
      cdnService = new CDNService(configService);
    });

    it('does not send a request if NODE_ENV is not production', async () => {
      const testKey = `video_sitemap/38`;
      const resp: { success?: boolean } = (await cdnService.softPurgeKey({
        key: testKey,
      })) as { success?: boolean };
      expect(resp.success).toEqual(false);
    });
  });
});
