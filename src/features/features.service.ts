import { Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_DB_CLIENT_TOKEN,
  DashboardDbService,
} from '../db/dashboardDb.service';

@Injectable()
export class FeaturesService {
  constructor(
    @Inject(DASHBOARD_DB_CLIENT_TOKEN)
    private readonly dashboardDb: DashboardDbService,
  ) {}

  async getFeaturesForSite(siteId: number) {
    const gates = await this.dashboardDb.flipper_gates.findMany({
      select: { feature_key: true },
      where: { OR: [{ value: 'true' }, { value: `Site:${siteId}` }] },
    });
    return gates.map(({ feature_key }) => feature_key);
  }
}
