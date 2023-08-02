import { Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { compare } from '../utils/passwords';
import {
  DASHBOARD_DB_CLIENT_TOKEN,
  DashboardDbService,
} from '../db/dashboardDb.service';
import { ResSessionsSignInDto } from './dto/resSessionsSignIn.dto';
import { JwtService } from '@nestjs/jwt';
import { SiteSettingsHStore } from '../sites/hstore/SiteSettingsHStore';
import { plainToInstance } from 'class-transformer';
import { ConfigService } from '@nestjs/config';
import { users, site_users, sites, payees } from '@prisma/dashboard';

@Injectable()
export class SessionsService {
  constructor(
    private usersService: UsersService,
    @Inject(DASHBOARD_DB_CLIENT_TOKEN)
    private dashboardDbService: DashboardDbService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async getValidatedUser(
    email: string,
    password: string,
  ): Promise<users | null> {
    const user: users | null = await this.usersService.findOne({ email });
    if (!user) {
      return null;
    }

    if (await compare(password, user.encrypted_password)) {
      return user;
    }

    return null;
  }

  async createSessionDto(
    user: users,
    clientApplicationId: string = 'dashboard',
  ) {
    const token = this.jwtService.sign(
      {
        user_id: user.id,
        jwt_secret: user.jwt_secret,
        client_application_id: clientApplicationId,
      },
      {
        secret: this.configService.getOrThrow('DEVISE_JWT_SECRET_KEY'),
        expiresIn: '1y',
      },
    );

    const userDataResp = await this.getUserData(user.id);

    return new ResSessionsSignInDto(token, user, userDataResp);
  }

  async getUserData(userId: number): Promise<SessionSitesData[]> {
    const sessionSiteResp: SessionSitesData[] = await this.dashboardDbService
      .$queryRaw<SessionSitesData[]>`
    SELECT 
      su.id as site_user_id,
      su.roles_mask as site_users_roles_mask,
      su.site_id as site_users_site_id,
      su.user_id as site_users_user_id,
      s.id as site_id,
      hstore_to_json(s.settings) as settings,
      s.grow_site_id as grow_site_id,
      p.id as payee_id,
      p.name as payee_name,
      p.tipalti_completed as tipalti_completed,
      p.uuid as payee_uuid
    FROM
      site_users su
    INNER JOIN sites s
        ON s.id = su.site_id
    LEFT JOIN payees p
        ON p.id = s.payee_id
    WHERE 
      su.user_id = ${userId}
    `;

    sessionSiteResp.forEach((res) => {
      res.settings = plainToInstance(SiteSettingsHStore, res.settings);
    });

    return sessionSiteResp;
  }
}

export type SessionSitesData = {
  site_user_id: site_users['id'];
  site_users_roles_mask: site_users['roles_mask'];
  site_users_site_id: site_users['site_id'];
  site_users_user_id: site_users['user_id'];
  site_id: sites['id'];
  settings: SiteSettingsHStore;
  grow_site_id: sites['grow_site_id'];
  payee_id: payees['id'];
  payee_name: payees['name'];
  tipalti_completed: payees['tipalti_completed'];
  payee_uuid: payees['uuid'];
};
