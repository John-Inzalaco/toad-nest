import { Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_DB_CLIENT_TOKEN,
  DashboardDbService,
} from '../db/dashboardDb.service';

@Injectable()
export class PsasService {
  constructor(
    @Inject(DASHBOARD_DB_CLIENT_TOKEN)
    private readonly dashboardDb: DashboardDbService,
  ) {}

  findAll() {
    return this.dashboardDb.psas.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        gam_key: true,
      },
    });
  }
}
