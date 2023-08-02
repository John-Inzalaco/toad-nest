import {
  createTestContext,
  generateAuthToken,
  seedSite,
  seedUser,
  testSiteUserRoleAccess,
} from './__helpers';
import { SiteUserRole } from '../src/users/SiteUserRole.enum';
import { GenerateSignatureResponseDto } from '../src/sites/dto/GenerateSignature.dto';
import { isPresent } from '../src/utils/isPresent';
import { createHash } from 'crypto';

const ctx = createTestContext();

describe('sites routes', () => {
  describe('GET /api/v1/sites/:site_id/generate_signature', () => {
    it('returns a cloudinary signature with no resource_type specified', async () => {
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const signature = await fetchGenerateSignatureJson({
        siteId: site.id,
        user,
      });
      expect(signature).toMatchInlineSnapshot(`
        {
          "image_metadata": true,
          "signature": "<signature>",
          "tags": "temp",
          "timestamp": "<timestamp>",
        }
      `);
    });

    it('returns a cloudinary signature with resource_type video specified', async () => {
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const signature = await fetchGenerateSignatureJson({
        siteId: site.id,
        user,
        resourceType: 'video',
      });
      expect(signature).toMatchInlineSnapshot(`
        {
          "signature": "<signature>",
          "source": "uw",
          "tags": "temp",
          "timestamp": "<timestamp>",
          "upload_preset": "video_transformation",
        }
      `);
    });

    it('returns a cloudinary signature with resource_type image specified', async () => {
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const signature = await fetchGenerateSignatureJson({
        siteId: site.id,
        user,
        resourceType: 'image',
      });
      expect(signature).toMatchInlineSnapshot(`
        {
          "image_metadata": true,
          "signature": "<signature>",
          "tags": "temp",
          "timestamp": "<timestamp>",
        }
      `);
    });

    it('returns a cloudinary signature with resource_type vtt specified', async () => {
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const signature = await fetchGenerateSignatureJson({
        siteId: site.id,
        user,
        resourceType: 'image',
      });
      expect(signature).toMatchInlineSnapshot(`
        {
          "image_metadata": true,
          "signature": "<signature>",
          "tags": "temp",
          "timestamp": "<timestamp>",
        }
      `);
    });

    it('returns a cloudinary signature with resource_type video specified for a pubnation offering site', async () => {
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteData: { offering_id: 2 },
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const signature = await fetchGenerateSignatureJson({
        siteId: site.id,
        user,
        resourceType: 'video',
      });
      expect(signature).toMatchInlineSnapshot(`
        {
          "signature": "<signature>",
          "source": "uw",
          "tags": "temp",
          "timestamp": "<timestamp>",
          "upload_preset": "pubnation_video_transformation",
        }
      `);
    });

    it('returns a cloudinary signature even if there is no site_user for the site', async () => {
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
      });
      const signature = await fetchGenerateSignatureJson({
        siteId: site.id,
        user,
        resourceType: 'video',
      });
      expect(signature).toMatchInlineSnapshot(`
        {
          "signature": "<signature>",
          "source": "uw",
          "tags": "temp",
          "timestamp": "<timestamp>",
          "upload_preset": "video_transformation",
        }
      `);
    });

    it('returns a cloudinary signature for an mcp token', async () => {
      const user = await seedUser({ ctx });
      const { site } = await seedSite({
        ctx,
        siteUsers: [{ userId: user.id, roles: [SiteUserRole.owner] }],
      });
      const signature = await fetchGenerateSignatureJson({
        siteId: site.id,
        user,
        clientApplicationId: 'mcp',
      });
      expect(signature).toMatchInlineSnapshot(`
        {
          "image_metadata": true,
          "signature": "<signature>",
          "tags": "temp",
          "timestamp": "<timestamp>",
        }
      `);
    });

    describe('User Role Access', () => {
      void testSiteUserRoleAccess({
        ctx,
        expectedStatuses: {
          ad_settings: 200,
          admin: 200,
          owner: 200,
          payment: 200,
          post_termination_new_owner: 200,
          reporting: 200,
          video: 200,
        },
        makeRequest: async ({ user, siteId }) => {
          return fetchGenerateSignature({
            siteId,
            user,
          });
        },
      });
    });
  });
});

interface FetchGenerateSignatureParams {
  siteId: number;
  user: { id: number; jwt_secret: string } | null;
  resourceType?: 'image' | 'video';
  clientApplicationId?: string;
}
async function fetchGenerateSignature({
  siteId,
  user,
  clientApplicationId,
  resourceType,
}: FetchGenerateSignatureParams) {
  const url = new URL(`${ctx.host}/api/v1/sites/${siteId}/generate_signature`);
  if (resourceType) {
    url.searchParams.set('resource_type', resourceType);
  }
  return fetch(url, {
    headers: user
      ? {
          Authorization: generateAuthToken(user, clientApplicationId),
        }
      : undefined,
  });
}

interface FetchGenerateSignatureJsonParams {
  siteId: number;
  user: { id: number; jwt_secret: string } | null;
  clientApplicationId?: string;
  resourceType?: 'image' | 'video';
}
async function fetchGenerateSignatureJson(
  params: FetchGenerateSignatureJsonParams,
) {
  const resp = await fetchGenerateSignature(params);
  const body = (await resp.json()) as GenerateSignatureResponseDto;
  const timestampDiff = Math.floor(Date.now() / 1000) - body.timestamp;
  const paramsString = Object.entries(body)
    .map(([key, value]) => {
      if (key === 'signature' || key === 'api_key') {
        return null;
      }
      return `${key}=${value}`;
    })
    .filter(isPresent)
    .sort()
    .join('&');
  const expectedSignature = createHash('sha1')
    .update(paramsString + 'api_secret')
    .digest('hex');
  if (process.env.USE_RAILS_API) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (body as any)['api_key'];
  }
  return {
    ...body,
    signature:
      body.signature === expectedSignature ? '<signature>' : body.signature,
    timestamp:
      timestampDiff >= 0 && timestampDiff < 10
        ? ('<timestamp>' as unknown as number)
        : body.timestamp,
  };
}
