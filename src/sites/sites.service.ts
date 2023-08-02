import { Inject, Injectable } from '@nestjs/common';
import { GetSiteResponseDto } from './dto/GetSite.dto';
import {
  DASHBOARD_DB_CLIENT_TOKEN,
  DashboardDbService,
} from '../db/dashboardDb.service';
import { sites } from '@prisma/dashboard';
import { plainToInstance } from 'class-transformer';
import {
  SiteProfileHStoreClass,
  SiteProfileHStoreRaw,
} from './hstore/SiteProfileHStore';
import {
  SiteSettingsHStore,
  SiteSettingsHStoreRaw,
} from './hstore/SiteSettingsHStore';
import {
  IMPRESSIONS_FOR_80,
  IMPRESSIONS_FOR_825,
  IMPRESSIONS_FOR_85,
  RevenueShareService,
} from '../revenue-share/revenue-share.service';
import { getMonthDayYearDateString, getYesterdayDateUtc } from '../utils/date';
import { FeaturesService } from '../features/features.service';
import { roundToDecimalPlaces } from '../utils/numbers';
import { getAddressExists, getAddressExpired } from './site-helpers';
import { MediaCloudService } from '../mediaCloud/mediaCloud.service';

interface FindOneParams {
  siteId: number;
  showReportData: boolean;
}

interface GenerateSignatureParams {
  resourceType?: string;
  siteId: number;
}

@Injectable()
export class SitesService {
  constructor(
    @Inject(DASHBOARD_DB_CLIENT_TOKEN)
    private readonly dashboardDbService: DashboardDbService,
    private revenueShare: RevenueShareService,
    private featuresService: FeaturesService,
    private mediaCloudService: MediaCloudService,
  ) {}

  async findOne({
    siteId,
    showReportData,
  }: FindOneParams): Promise<GetSiteResponseDto> {
    const targetDate = getYesterdayDateUtc();
    const [siteData, featureKeys, impressionCount] = await Promise.all([
      this.loadSite(siteId),
      this.featuresService.getFeaturesForSite(siteId),
      this.revenueShare.getRevenueShareImpressionCount({ siteId, targetDate }),
    ]);
    const { site, profile, settings } = siteData;
    const {
      analytics_connection_id,
      analytics_connection_status,
      payee_id,
      live_on,
      anniversary_on,
      id,
      domain,
      title,
      deactivated,
      slug,
      grow_site_id,
      test_site,
      do_not_pay,
      created_at,
      offering_id,
      opt_in_to_beta_center,
      ga4_live_on,
      uuid,
      tipalti_completed,
    } = site;

    const revenueSharePro = this.revenueShare.getProModalRevenueShare({
      anniversaryOn: site.anniversary_on,
      displayRevenueShareOverride: settings.display_revenue_share_override,
      loyaltyBonusDisabled: Boolean(settings.loyalty_bonus_disabled),
      net30RevenueSharePayments: Boolean(settings.net30_revenue_share_payments),
      owned: Boolean(settings.owned),
      premiereAccepted: Boolean(settings.premiere_accepted),
      siteId,
      targetDate,
      impressionCount,
    });

    const getLoyalty = async () => {
      const { loyaltyRevenueShare, revenueShareWithoutLoyalty } =
        await this.revenueShare.getDisplayRevenueShare({
          anniversaryOn: site.anniversary_on,
          displayRevenueShareOverride: settings.display_revenue_share_override,
          loyaltyBonusDisabled: Boolean(settings.loyalty_bonus_disabled),
          net30RevenueSharePayments: Boolean(
            settings.net30_revenue_share_payments,
          ),
          targetDate,
          owned: Boolean(settings.owned),
          premiereAccepted: Boolean(settings.premiere_accepted),
          proAccepted: settings.pro_accepted,
          impressionCount,
          siteId,
        });
      return {
        live_on: getMonthDayYearDateString(live_on),
        anniversary_on: getMonthDayYearDateString(anniversary_on),
        revenue_share: roundToDecimalPlaces(revenueShareWithoutLoyalty, 3),
        loyalty_bonus: loyaltyRevenueShare,
        impressions: impressionCount,
        impressions_for_eighty: IMPRESSIONS_FOR_80,
        impressions_for_eightyfive: IMPRESSIONS_FOR_85,
        impressions_for_eightytwofive: IMPRESSIONS_FOR_825,
      };
    };

    return {
      site: {
        id,
        domain,
        title,
        deactivated,
        slug,
        grow_site_id,
        test_site,
        do_not_pay,
        created_at,
        offering_id,
        opt_in_to_beta_center,
        uuid,
        tipalti_completed,
        killswitch: settings.killswitch,
        disable_reporting: settings.disable_reporting,
        owned: settings.owned,
        chicory_enabled: Boolean(
          settings.recipe_selector || settings.recipe_mobile_selector,
        ),
        zergnet_enabled: Boolean(settings.zergnet_id),
        loyalty_bonus_disabled: settings.loyalty_bonus_disabled,
        enable_automatic_recipe_selectors:
          settings.enable_automatic_recipe_selectors,
        images: {
          screenshot: this.mediaCloudService.generateScreenshotUrl({
            domain: site.domain,
            screenshotTimestamp: profile.screenshot_timestamp,
          }),
          avatar: this.mediaCloudService.getImageUrl(profile.author_image),
          site_logo: this.mediaCloudService.getImageUrl(profile.site_image),
        },
        ...(showReportData
          ? {
              given_notice: profile.given_notice,
              loyalty: await getLoyalty(),
            }
          : {}),
        needs_payment: !payee_id,
        payee_name_updated: settings.payee_name_updated,
        premiere_invited: settings.premiere_invited,
        ...(settings.premiere_accepted && {
          premiere_accepted: settings.premiere_accepted,
          premiere_accepted_on: settings.premiere_accepted_on,
          premiere_accepted_by: settings.premiere_accepted_by,
          premiere_manage_account: settings.premiere_manage_account,
        }),
        accepted_terms_of_service: profile.accepted_terms_of_service,
        accepted_terms_of_service_by: profile.accepted_terms_of_service_by,
        accepted_terms_of_service_on: profile.accepted_terms_of_service_on,
        address_verified_at: getMonthDayYearDateString(
          profile.address_verified_at,
        ),
        address_exists: getAddressExists(profile),
        address_expired: getAddressExpired(profile),
        features: featureKeys,
        ganalytics_state: settings.ganalytics_state,
        ganalytics_refresh_token_expired_at:
          settings.ganalytics_refresh_token_expired_at,
        pro_invited: settings.pro_invited,
        pro_invited_on: settings.pro_invited_on,
        revenue_share_pro: roundToDecimalPlaces(revenueSharePro, 3),
        ...(settings.pro_accepted && {
          pro_accepted: settings.pro_accepted,
          pro_accepted_on: settings.pro_accepted_on,
          pro_accepted_by: settings.pro_accepted_by,
          pro_last_audit: getMonthDayYearDateString(settings.pro_last_audit),
          pro_last_inspected: getMonthDayYearDateString(
            settings.pro_last_inspected,
          ),
        }),
        disable_onboarding_wizard: settings.disable_onboarding_wizard,
        analytics_connection_status,
        ga4_live_on: ga4_live_on,
        ga4_property_connected: Boolean(analytics_connection_id),
        ga4_settings_page: featureKeys.includes('ga4_settings_page'),
        gutter_enable: settings.gutter_enable,
      },
    };
  }

  async generateSignature({ resourceType, siteId }: GenerateSignatureParams) {
    const site = await this.dashboardDbService.sites.findUniqueOrThrow({
      select: { offering_id: true },
      where: { id: siteId },
    });
    return this.mediaCloudService.generateSignature({
      resourceType,
      siteOfferingId: site.offering_id,
    });
  }

  private async loadSite(siteId: number) {
    const siteQueryResp: (Pick<
      sites,
      | 'id'
      | 'title'
      | 'deactivated'
      | 'slug'
      | 'domain'
      | 'grow_site_id'
      | 'test_site'
      | 'do_not_pay'
      | 'created_at'
      | 'anniversary_on'
      | 'live_on'
      | 'offering_id'
      | 'opt_in_to_beta_center'
      | 'ga4_live_on'
      | 'payee_id'
      | 'uuid'
    > & {
      analytics_connection_id: number | null;
      analytics_connection_status: string | null;
      tipalti_completed: boolean | null;
      profile: SiteProfileHStoreRaw;
      settings: SiteSettingsHStoreRaw;
    })[] = await this.dashboardDbService.$queryRaw`
      SELECT 
        sites.id AS id,
        sites.deactivated AS deactivated,
        sites.title AS title,
        sites.slug AS slug,
        sites.domain AS domain,
        sites.grow_site_id AS grow_site_id,
        sites.test_site AS test_site,
        sites.do_not_pay AS do_not_pay,
        sites.created_at as created_at,
        sites.offering_id AS offering_id,
        sites.opt_in_to_beta_center AS opt_in_to_beta_center,
        sites.ga4_live_on AS ga4_live_on,
        sites.live_on AS live_on,
        sites.anniversary_on AS anniversary_on,
        sites.uuid AS uuid,
        payees.id AS payee_id,
        payees.tipalti_completed AS tipalti_completed,
        analytics_connections.id AS analytics_connection_id,
        analytics_connections.status AS analytics_connection_status,
        hstore_to_json(sites.profile) AS profile,
        hstore_to_json(sites.settings) AS settings
      FROM sites
        LEFT JOIN payees ON sites.payee_id = payees.id
        LEFT JOIN analytics_connections ON sites.id = analytics_connections.site_id AND analytics_connections.account_type = 'ga4'
      WHERE sites.id = ${siteId} 
    `;
    const site = siteQueryResp[0];
    const profile = plainToInstance(SiteProfileHStoreClass, site.profile);
    const settings = plainToInstance(SiteSettingsHStore, site.settings);
    return {
      site,
      profile,
      settings,
    };
  }
}
