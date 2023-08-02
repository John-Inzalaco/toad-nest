import {
  DASHBOARD_DB_CLIENT_TOKEN,
  DashboardDbService,
} from '../db/dashboardDb.service';
import {
  SiteProfileHStoreClass,
  SiteProfileHStoreRaw,
} from '../sites/hstore/SiteProfileHStore';
import {
  SiteSettingsHStore,
  SiteSettingsHStoreRaw,
} from '../sites/hstore/SiteSettingsHStore';
import { sites } from '@prisma/dashboard';
import { plainToInstance } from 'class-transformer';
import { GetProfileSettingsResponseDto } from './dto/GetProfileSetings.dto';
import { getMonthDayYearDateString, getTodayDateUtc } from '../utils/date';
import {
  SiteSocialMediaHStoreClass,
  SiteSocialMediaHStoreRaw,
} from '../sites/hstore/SiteSocialMediaHStore';
import { categories, Prisma } from '@prisma/dashboard';
import { ReportingDbService } from '../db/reportingDb.service';
import { roundToDecimalPlaces } from '../utils/numbers';
import * as siteHelpers from '../sites/site-helpers';
import { UpdateProfileSettingsReqBodyDto } from './dto/UpdateProfileSettings.dto';
import { SlackService } from '../slack/slack.service';
import { users } from '@prisma/dashboard';
import { Inject, Injectable } from '@nestjs/common';

interface UpdateProfileSettingsParams {
  siteId: number;
  body: UpdateProfileSettingsReqBodyDto;
  reqUser: users | undefined;
}

@Injectable()
export class SiteSettingsService {
  constructor(
    @Inject(DASHBOARD_DB_CLIENT_TOKEN)
    private readonly dashboardDb: DashboardDbService,
    private readonly reportingDb: ReportingDbService,
    private readonly slackService: SlackService,
  ) {}

  async getProfileSettings(
    siteId: number,
  ): Promise<GetProfileSettingsResponseDto['site']> {
    const [site, categories] = await Promise.all([
      this.loadSite(siteId),
      this.loadSiteCategories(siteId),
    ]);
    const { profile, settings, socialMedia } = site;

    let primaryCategory =
      categories.find((cat) => cat.id === site.category_id) || null;

    /**
     * Not expected to occur, but possible if somehow the sites_categories table
     * doesn't have a record for the category_id of the site.
     */
    if (!primaryCategory && site.category_id) {
      primaryCategory = await this.dashboardDb.categories.findUnique({
        where: { id: site.category_id },
      });
    }

    let contactEmail: string | null | undefined = profile.contact_email;
    if (!contactEmail) {
      const backupEmailUser = await this.dashboardDb.users.findFirst({
        select: { email: true },
        where: { site_users: { some: { site_id: siteId } } },
      });
      contactEmail = backupEmailUser?.email;
    }

    return {
      accepted_terms_of_service: profile.accepted_terms_of_service,
      accepted_terms_of_service_by: profile.accepted_terms_of_service_by,
      accepted_terms_of_service_on: profile.accepted_terms_of_service_on,
      address1: profile.address1,
      address_exists: siteHelpers.getAddressExists(profile),
      address_expired: siteHelpers.getAddressExpired(profile),
      address_verified_at: getMonthDayYearDateString(
        profile.address_verified_at,
      ),
      author_bio: profile.author_bio,
      author_image: profile.author_image,
      author_name: profile.author_name,
      brand_color: settings.brand_color,
      category_id: primaryCategory,
      category_ids: categories,
      city: profile.city,
      contact_email: contactEmail || null,
      country: profile.country,
      country_of_operation: profile.country_of_operation,
      facebook: socialMedia.facebook,
      influencer_non_profit_rate: settings.influencer_non_profit_rate,
      influencer_non_profit_work: settings.influencer_non_profit_work,
      instagram: socialMedia.instagram,
      phone_number: profile.phone_number,
      pinterest: socialMedia.pinterest,
      pinterest_email: profile.pinterest_email,
      premiere_accepted: settings.premiere_accepted,
      ...(settings.premiere_accepted
        ? {
            premiere_manage_account: settings.premiere_manage_account,
            premiere_net_difference: await this.loadPremiereNetDifference(
              siteId,
            ),
          }
        : {}),
      premiere_invited: settings.premiere_invited,
      pro_accepted: settings.pro_accepted,
      pro_invited: settings.pro_invited,
      site_description: profile.site_description,
      site_id: site.id,
      site_image: profile.site_image,
      site_title: site.title,
      snapchat: socialMedia.snapchat,
      state: profile.state,
      tiktok: socialMedia.tiktok,
      twitter: socialMedia.twitter,
      youtube: socialMedia.youtube,
      zipcode: profile.zipcode,
    };
  }

  async updateProfileSettings({
    siteId,
    body,
    reqUser,
  }: UpdateProfileSettingsParams) {
    const bodyWithExtra: UpdateProfileSettingsReqBodyDto & {
      address_verified_at?: string | null;
      pro_accepted_by?: string | null;
      pro_accepted_on?: number | null;
      premiere_accepted_by?: string | null;
      premiere_accepted_on?: number | null;
      premiere_manage_account_enabled_on?: string | null;
      accepted_terms_of_service_by?: string | null;
      accepted_terms_of_service_on?: number | null;
      given_notice_on?: string | null;
    } = { ...body };
    const site = await this.loadSite(siteId);
    if (body.pro_accepted && !site.settings.pro_invited) {
      delete bodyWithExtra.pro_accepted;
    } else if (
      site.settings.pro_invited &&
      body.pro_accepted === 'accepted' &&
      site.settings.pro_accepted !== 'accepted'
    ) {
      bodyWithExtra.pro_accepted_by = reqUser?.title;
      bodyWithExtra.pro_accepted_on = Math.floor(Date.now() / 1000);
      await this.slackService.sendProAcceptedMessage(site.title);
    }

    if (body.premiere_accepted && !site.settings.premiere_invited) {
      delete bodyWithExtra.premiere_accepted;
    } else if (
      site.settings.premiere_invited &&
      body.premiere_accepted &&
      !site.settings.premiere_accepted
    ) {
      bodyWithExtra.premiere_accepted_by = reqUser?.title;
      bodyWithExtra.premiere_accepted_on = Math.floor(Date.now() / 1000);
      await this.slackService.sendPremiereAcceptedMessage(site.title);
    }

    if (
      body.verify_address ||
      (body.address1 && site.profile.address1 !== body.address1) ||
      (body.city && site.profile.city !== body.city) ||
      (body.state && site.profile.state !== body.state) ||
      (body.zipcode && site.profile.zipcode !== body.zipcode) ||
      (body.country && site.profile.country !== body.country)
    ) {
      bodyWithExtra.address_verified_at = getMonthDayYearDateString(
        getTodayDateUtc(),
      );
    }

    if (
      body.premiere_manage_account &&
      !site.settings.premiere_manage_account
    ) {
      bodyWithExtra.premiere_manage_account_enabled_on =
        getMonthDayYearDateString(getTodayDateUtc());
    }

    if (
      body.accepted_terms_of_service &&
      !site.profile.accepted_terms_of_service
    ) {
      bodyWithExtra.accepted_terms_of_service_by = reqUser?.title;
      bodyWithExtra.accepted_terms_of_service_on = Math.floor(
        Date.now() / 1000,
      );
    }

    if (body.given_notice && !site.profile.given_notice) {
      bodyWithExtra.given_notice_on = getMonthDayYearDateString(
        getTodayDateUtc(),
      );
    }

    const allSetStatements = siteHelpers.updateHStoreSql(bodyWithExtra);
    if (body.category_id) {
      allSetStatements.push(Prisma.sql`category_id = ${body.category_id}`);
    }

    if (allSetStatements.length) {
      allSetStatements.push(Prisma.sql`updated_at = current_timestamp`);
      await this.dashboardDb.$executeRaw`
        UPDATE sites
        SET ${Prisma.join(allSetStatements, ', ')}
        WHERE id = ${siteId}
      `;
    }

    if (body.category_ids) {
      await this.reconcileSiteCategories({
        siteId,
        categoryIds: body.category_ids,
      });
    }
  }

  private async loadSiteCategories(siteId: number) {
    const categories: categories[] = await this.dashboardDb.$queryRaw`
      SELECT categories.id, categories.created_at, categories.updated_at, categories.iab_code, categories.parent_id, categories.slug, categories.title
        FROM categories 
          INNER JOIN categories_sites ON categories.id = categories_sites.category_id 
        WHERE categories_sites.site_id = ${siteId}
    `;
    return categories;
  }

  private async loadSite(siteId: number) {
    const siteQueryResp: (Pick<sites, 'id' | 'category_id' | 'title'> & {
      analytics_connection_id: number | null;
      analytics_connection_status: string | null;
      tipalti_completed: boolean | null;
      profile: SiteProfileHStoreRaw;
      settings: SiteSettingsHStoreRaw;
      social_media: SiteSocialMediaHStoreRaw;
    })[] = await this.dashboardDb.$queryRaw`
      SELECT 
        sites.id AS id,
        sites.title AS title,
        sites.category_id AS category_id,
        hstore_to_json(sites.profile) AS profile,
        hstore_to_json(sites.settings) AS settings,
        hstore_to_json(sites.social_media) AS social_media
      FROM sites
      WHERE sites.id = ${siteId} 
    `;
    const site = siteQueryResp[0];
    return {
      ...site,
      profile: plainToInstance(SiteProfileHStoreClass, site.profile),
      settings: plainToInstance(SiteSettingsHStore, site.settings),
      socialMedia: plainToInstance(
        SiteSocialMediaHStoreClass,
        site.social_media,
      ),
    };
  }

  private async loadPremiereNetDifference(siteId: number) {
    const resp: [{ net_premiere_difference: number }] | [] = await this
      .reportingDb.$queryRaw`
        SELECT net_premiere_difference FROM mat_premiere_revenue_summaries WHERE site_id = ${siteId}
    `;
    return resp[0]?.net_premiere_difference
      ? roundToDecimalPlaces(Number(resp[0]?.net_premiere_difference), 2)
      : 0;
  }

  private async reconcileSiteCategories({
    siteId,
    categoryIds,
  }: ReconcileSiteCategoriesParams) {
    const categoriesResp: { category_id: number }[] = await this.dashboardDb
      .$queryRaw`
      SELECT category_id FROM categories_sites WHERE site_id = ${siteId}
    `;
    const existingCategories = categoriesResp.map((cat) => cat.category_id);
    const categoriesToCreate = categoryIds.filter(
      (inputId) => !existingCategories.includes(inputId),
    );
    const categoriesToDelete = existingCategories.filter(
      (existingId) => !categoryIds.includes(existingId),
    );

    if (!categoriesToCreate.length && !categoriesToDelete.length) {
      return;
    }

    let deleteCategoriesPromise;
    if (categoriesToDelete.length) {
      const deleteSql = Prisma.join(categoriesToDelete, ',');
      deleteCategoriesPromise = this.dashboardDb
        .$executeRaw`DELETE FROM categories_sites 
          WHERE site_id = ${siteId} AND category_id IN (${deleteSql})`;
    }

    let createCategoriesPromise;
    if (categoriesToCreate.length) {
      const createSql = categoriesToCreate.map(
        (cateogryId) =>
          Prisma.sql`(${siteId}, ${cateogryId}, current_timestamp, current_timestamp)`,
      );
      createCategoriesPromise = this.dashboardDb
        .$executeRaw`INSERT INTO categories_sites (site_id, category_id, created_at, updated_at) 
          VALUES ${Prisma.join(createSql, ', ')}
        `;
    }
    await Promise.all([createCategoriesPromise, deleteCategoriesPromise]);
  }
}

interface ReconcileSiteCategoriesParams {
  siteId: number;
  categoryIds: number[];
}
