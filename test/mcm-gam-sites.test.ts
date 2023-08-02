import { GetMcmGamSiteResponseDto } from '../src/mcm-gam-sites/dto/GetMcmGamSite.dto';
import { SerializeDto } from '../src/utils/serializeDto';
import {
  createTestContext,
  generateAuthToken,
  seedMcmChildPublisher,
  seedMcmGamSite,
  seedUser,
} from './__helpers';
import { users, mcm_gam_sites, mcm_child_publishers } from '@prisma/dashboard';

const ctx = createTestContext();

describe('MCM GAM Sites API', () => {
  let user: users;
  let gamSite1: mcm_gam_sites;
  let childPub1: mcm_child_publishers;

  beforeAll(async () => {
    user = await seedUser({ ctx });
    childPub1 = await seedMcmChildPublisher({ ctx });
    gamSite1 = await seedMcmGamSite({ ctx });
    await ctx.prisma.mcm_gam_sites.update({
      where: {
        id: gamSite1.id,
      },
      data: {
        mcm_child_publisher_id: childPub1.id,
      },
    });
  });

  it('returns an MCM GAM SITE object when fetched', async () => {
    const resp = await fetch(
      `${ctx.host}/api/v1/mcm_gam_sites/${gamSite1.id}`,
      {
        headers: {
          Authorization: generateAuthToken(user),
        },
      },
    );
    expect(resp.status).toEqual(200);
    const body = (await resp.json()) as SerializeDto<GetMcmGamSiteResponseDto>;
    expect(body.mcm_gam_site?.id).toEqual(gamSite1.id);
    expect(body.mcm_gam_site?.status).toEqual(gamSite1.status);
    expect(body.mcm_gam_site?.mcm_child_publisher?.id).toEqual(childPub1.id);
    expect(body.mcm_gam_site?.mcm_child_publisher?.status).toEqual(
      childPub1.status,
    );
  });

  it('returns a 404 when an ID cannot be located', async () => {
    const resp = await fetch(`${ctx.host}/api/v1/mcm_gam_sites/0`, {
      headers: {
        Authorization: generateAuthToken(user),
      },
    });
    expect(resp.status).toEqual(404);
    expect(resp.statusText).toEqual('Not Found');
  });

  it('disallows a non-authenticated user request', async () => {
    const resp = await fetch(
      `${ctx.host}/api/v1/mcm_gam_sites/${gamSite1.id}`,
      {
        headers: {
          Authorization: generateAuthToken({
            id: 0,
            jwt_secret: 'thisIsAnInvalidJwtToken',
          }),
        },
      },
    );
    expect(resp.status).toEqual(process.env.USE_RAILS_API ? 500 : 401);
  });
});
