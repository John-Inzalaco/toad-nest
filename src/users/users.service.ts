import { Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_DB_CLIENT_TOKEN,
  DashboardDbService,
} from '../db/dashboardDb.service';
import { Prisma } from '@prisma/dashboard';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DASHBOARD_DB_CLIENT_TOKEN)
    private readonly dashboardDbService: DashboardDbService,
  ) {}

  findOne(where: Prisma.usersWhereUniqueInput) {
    return this.dashboardDbService.users.findUnique({ where });
  }
}
