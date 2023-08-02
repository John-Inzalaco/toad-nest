import { createTestContext } from './__helpers';

if (!process.env.USE_RAILS_API) {
  const ctx = createTestContext();

  describe('/health', () => {
    it('returns a 200 if the service is healthy', async () => {
      const resp = await fetch(`${ctx.host}/health`);
      const body = await resp.json();
      expect(resp.status).toEqual(200);
      expect(body).toMatchInlineSnapshot(`
        {
          "details": {
            "dashboardDb": {
              "status": "up",
            },
            "reportingDb": {
              "status": "up",
            },
          },
          "error": {},
          "info": {
            "dashboardDb": {
              "status": "up",
            },
            "reportingDb": {
              "status": "up",
            },
          },
          "status": "ok",
        }
      `);
    });
  });
}
