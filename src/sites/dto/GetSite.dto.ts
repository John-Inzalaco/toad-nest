import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class GetSiteParamsDto {
  /**
   * The site id
   * @example 3567
   */
  @Type(() => Number)
  @IsInt()
  id!: number;
}

class SiteLoyaltyDto {
  @ApiProperty({ format: 'date' })
  anniversary_on?: string | null;
  @ApiProperty({ format: 'date' })
  live_on?: string | null;
  /**
   * Loyalty bonus added to revenue_share as a reward for being with Mediavine for at least a year
   * @example 0.02
   */
  loyalty_bonus?: number | null;
  /**
   * Revenue share without loyalty bonus applied
   * @example 0.75
   */
  revenue_share?: number | null;
  /**
   * Number of impressions for the past month (between 32 days ago and 2 days ago, inclusive)
   * @example 10000000
   */
  impressions?: number | null;
  /**
   * Number of impressions needed to qualify for the 80% Pro tier
   * @example 5000000
   */
  impressions_for_eighty?: number | null;
  /**
   * Number of impressions needed to qualify for the 82.5% Pro tier
   * @example 10000000
   */
  impressions_for_eightytwofive?: number | null;
  /**
   * Number of impressions needed to qualify for the 85% Pro tier
   * @example 15000000
   */
  impressions_for_eightyfive?: number | null;
}

class SiteDto {
  /**
   * The site id
   * @example 3567
   */
  id!: number;
  deactivated!: boolean;
  title: string | null = null;
  slug: string | null = null;
  domain: string | null = null;
  test_site: boolean | null = null;
  do_not_pay: boolean | null = null;
  created_at!: Date;
  offering_id: number | null = null;
  opt_in_to_beta_center: boolean | null = null;
  killswitch?: boolean | null;
  disable_reporting?: boolean | null;
  owned?: boolean | null;
  chicory_enabled?: boolean | null;
  zergnet_enabled?: boolean | null;
  loyalty_bonus_disabled?: boolean | null;
  enable_automatic_recipe_selectors?: boolean | null;
  given_notice?: boolean | null;
  images!: {
    screenshot?: string | null;
    site_logo?: string | null;
    avatar?: string | null;
  };
  loyalty?: SiteLoyaltyDto;
  needs_payment!: boolean;
  tipalti_completed?: boolean | null;
  payee_name_updated?: boolean | null;
  premiere_invited?: boolean | null;
  premiere_accepted?: boolean | null;
  premiere_accepted_on?: Date | null;
  premiere_accepted_by?: string | null;
  premiere_manage_account?: boolean | null;
  accepted_terms_of_service?: boolean | null;
  accepted_terms_of_service_by?: string | null;
  accepted_terms_of_service_on?: Date | null;
  @ApiProperty({ format: 'date' })
  address_verified_at?: string | null;
  address_exists?: boolean | null;
  address_expired?: boolean | null;
  /**
   * Feature enabled for the site
   * @example ["clickwrap_tos", "ga4_settings_page", "grow.me-show-gpp-cta"]
   */
  features!: string[];
  ganalytics_state?: string | null;
  ganalytics_refresh_token_expired_at?: Date | null;
  grow_site_id?: string | null;
  pro_invited?: boolean | null;
  pro_invited_on?: Date | null;
  revenue_share_pro?: number | null;
  pro_accepted?: string | null;
  pro_accepted_on?: Date | null;
  pro_accepted_by?: string | null;
  @ApiProperty({ format: 'date' })
  pro_last_audit?: string | null;
  @ApiProperty({ format: 'date' })
  pro_last_inspected?: string | null;
  uuid?: string | null;
  disable_onboarding_wizard?: boolean | null;
  ga4_live_on?: Date | null;
  ga4_settings_page?: boolean | null;
  ga4_property_connected?: boolean | null;
  analytics_connection_status?: string | null;
  gutter_enable?: boolean | null;
}

export class GetSiteResponseDto {
  site!: SiteDto;
}
