import { Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_DB_CLIENT_TOKEN,
  DashboardDbService,
} from '../db/dashboardDb.service';

@Injectable()
export class OptoutsService {
  constructor(
    @Inject(DASHBOARD_DB_CLIENT_TOKEN)
    private readonly dashboardDb: DashboardDbService,
  ) {}

  findAll() {
    return this.dashboardDb.optouts.findMany({
      select: { id: true, title: true, description: true, slug: true },
      orderBy: { id: 'asc' },
    });
  }
}
