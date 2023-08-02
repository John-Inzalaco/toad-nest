import { Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_DB_CLIENT_TOKEN,
  DashboardDbService,
} from '../db/dashboardDb.service';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(DASHBOARD_DB_CLIENT_TOKEN)
    private readonly dashboardDb: DashboardDbService,
  ) {}

  findAll() {
    return this.dashboardDb.categories.findMany({
      select: { id: true, slug: true, title: true },
      orderBy: { id: 'asc' },
    });
  }
}
