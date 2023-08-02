import { Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_DB_CLIENT_TOKEN,
  DashboardDbService,
} from '../db/dashboardDb.service';

@Injectable()
export class McmGamSitesService {
  constructor(
    @Inject(DASHBOARD_DB_CLIENT_TOKEN)
    private readonly dashboardDb: DashboardDbService,
  ) {}

  findById(id: number) {
    const results = this.dashboardDb.mcm_gam_sites.findFirst({
      select: {
        id: true,
        status: true,
        mcm_child_publishers: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      where: {
        id: id,
      },
    });
    if (!results) {
      return null;
    }
    return results;
  }
}
