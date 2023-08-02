import { Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_DB_CLIENT_TOKEN,
  DashboardDbService,
} from '../db/dashboardDb.service';
import { Prisma } from '@prisma/dashboard';

@Injectable()
export class CountriesService {
  constructor(
    @Inject(DASHBOARD_DB_CLIENT_TOKEN)
    private readonly dashboardDb: DashboardDbService,
  ) {}

  country(where: Prisma.countriesWhereUniqueInput) {
    return this.dashboardDb.countries.findUnique({ where });
  }

  countries({ name, code }: { name?: string; code?: string }) {
    return this.dashboardDb.countries.findMany({
      where: {
        name: name || undefined,
        code: code || undefined,
      },
    });
  }
}
