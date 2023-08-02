import {
  FactoryProvider,
  INestApplication,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/dashboard';
import { CLS_REQ, ClsService } from 'nestjs-cls';
import { Request } from 'express';
import { getRequestIp } from '../utils/getRequestIp';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: process.env.LOG_LEVEL
        ? [process.env.LOG_LEVEL as Prisma.LogLevel]
        : undefined,
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}

const OPERATIONS_TO_TRACK = [
  // Site is updated with $executeRaw
  '$executeRaw',
  'create',
  'createMany',
  'delete',
  'deleteMany',
  'update',
  'updateMany',
  'upsert',
];

const MODELS_TO_TRACK: Prisma.ModelName[] = [
  'optouts',
  'payees',
  'sites',
  'site_users',
  'users',
];

const useFactory = (prisma: PrismaService, cls: ClsService) => {
  return prisma.$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        const req: Request = cls.get(CLS_REQ);
        // null model for $executeRaw
        const modelShouldBeTracked =
          !model || MODELS_TO_TRACK.includes(model as Prisma.ModelName);
        const operationShouldBeTracked =
          OPERATIONS_TO_TRACK.includes(operation);

        if (!req.user || !modelShouldBeTracked || !operationShouldBeTracked) {
          return query(args);
        }
        const ipAddress = getRequestIp(req);
        const [, , result] = await prisma.$transaction([
          prisma.$executeRaw`SELECT set_config('app.current_user_id', ${req.user.id.toString()}, TRUE)`,
          prisma.$executeRaw`SELECT set_config('app.current_user_ip', ${ipAddress}, TRUE)`,
          query(args),
        ]);
        return result;
      },
    },
  });
};

export type DashboardDbService = PrismaClient;

export const DASHBOARD_DB_CLIENT_TOKEN = Symbol('DASHBOARD_DB_CLIENT');

export const DashboardDbClientProvider: FactoryProvider = {
  provide: DASHBOARD_DB_CLIENT_TOKEN,
  inject: [PrismaService, ClsService],
  useFactory,
};
