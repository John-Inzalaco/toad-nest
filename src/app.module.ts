import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CountriesModule } from './countries/countries.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { PermissionsModule } from './permissions/permissions.module';
import { SessionsModule } from './sessions/sessions.module';
import { SitesModule } from './sites/sites.module';
import { RevenueShareModule } from './revenue-share/revenue-share.module';
import { LoggerModule } from 'nestjs-pino';
import { OptoutsModule } from './optouts/optouts.module';
import { CategoriesModule } from './categories/categories.module';
import { PsasModule } from './psas/psas.module';
import { HealthModule } from './health/health.module';
import { SiteUsersModule } from './site-users/site-users.module';
import { ReportMetricsModule } from './report-metrics/report-metrics.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { VideosModule } from './videos/videos.module';
import { McmChildPublishersModule } from './mcm-child-publishers/mcm-child-publishers.module';
import { McmGamSitesModule } from './mcm-gam-sites/mcm-gam-sites.module';
import { SiteSettingsModule } from './site-settings/site-settings.module';
import { SlackModule } from './slack/slack.module';
import { EmailsModule } from './emails/emails.module';
import { PayeesModule } from './payees/payees.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PermissionsInterceptor } from './permissions/permissions.interceptor';
import { VideoCallbacksModule } from './video-callbacks/video-callbacks.module';
import { ClsModule } from 'nestjs-cls';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true, saveReq: true },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        enabled: process.env.NODE_ENV !== 'test',
        redact: ['req.headers.authorization'],
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    PermissionsModule,
    CountriesModule,
    UsersModule,
    SessionsModule,
    SitesModule,
    RevenueShareModule,
    OptoutsModule,
    CategoriesModule,
    PsasModule,
    HealthModule,
    SiteUsersModule,
    ReportMetricsModule,
    PlaylistsModule,
    VideosModule,
    McmChildPublishersModule,
    McmGamSitesModule,
    SiteSettingsModule,
    SlackModule,
    EmailsModule,
    PayeesModule,
    VideoCallbacksModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: PermissionsInterceptor,
    },
  ],
})
export class AppModule {}
