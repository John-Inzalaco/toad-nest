import { randomUUID } from 'crypto';
import {
  createTestContext,
  generateAuthToken,
  replaceRandomId,
  seedMcmChildPublisher,
  seedUser,
} from './__helpers';
import { GetMcmChildPublisherResponseDto } from '../src/mcm-child-publishers/dto/GetMcmChildPublisher.dto';
import { users } from '@prisma/dashboard';

const ctx = createTestContext();

describe('McmChildPublishers', () => {
  describe('GET /api/v1/mcm_child_publishers/:id', () => {
    it('returns mcm child publisher', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      const childPublisher = await seedMcmChildPublisher({ ctx, randomId });
      const body = await fetchMcmChildPublisherJson({
        id: Number(childPublisher.id),
        user,
      });
      expect(body.id).toEqual(childPublisher.id);
      expect(replaceRandomId(body, randomId)).toMatchInlineSnapshot(
        { id: expect.any(Number) },
        `
        {
          "business_domain": "site<randomId>.com",
          "business_name": "Site <randomId> business name",
          "id": Any<Number>,
        }
      `,
      );
    });

    it('returns a 404 if passed in id does not exist', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      await seedMcmChildPublisher({ ctx, randomId });
      const resp = await fetchMcmChildPublisher({
        id: 10000000,
        user,
      });
      expect(resp.status).toEqual(404);
    });

    it('returns a 401 if the request is not authenticated', async () => {
      const randomId = randomUUID();
      const childPublisher = await seedMcmChildPublisher({ ctx, randomId });
      await seedMcmChildPublisher({ ctx, randomId });
      const resp = await fetchMcmChildPublisher({
        id: childPublisher.id,
        user: null,
      });
      expect(resp.status).toEqual(401);
    });

    it('returns a 400 if the id is not valid', async () => {
      const randomId = randomUUID();
      const user = await seedUser({ ctx });
      await seedMcmChildPublisher({ ctx, randomId });
      const resp = await fetchMcmChildPublisher({
        id: 'abc' as unknown as number,
        user,
      });
      /**
       * Rails returns a 404 in this case, but a 400 is more appropriate
       * and it's hard to imagine this being a problem.
       */
      expect(resp.status).toEqual(process.env.USE_RAILS_API ? 404 : 400);
    });
  });
});

interface FetchMcmChildPublisherParams {
  id: number;
  user: users | null;
}
async function fetchMcmChildPublisher({
  id,
  user,
}: FetchMcmChildPublisherParams) {
  const resp = await fetch(`${ctx.host}/api/v1/mcm_child_publishers/${id}`, {
    headers: user ? { Authorization: generateAuthToken(user) } : undefined,
  });
  return resp;
}

interface FetchMcmChildPublisherParams {
  id: number;
  user: users | null;
}
async function fetchMcmChildPublisherJson({
  id,
  user,
}: FetchMcmChildPublisherParams) {
  const resp = await fetchMcmChildPublisher({ id, user });
  const body = (await resp.json()) as GetMcmChildPublisherResponseDto;
  return body.mcm_child_publisher;
}
