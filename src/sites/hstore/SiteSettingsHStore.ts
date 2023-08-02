import { Transform, Type } from 'class-transformer';
import {
  stringSecondsTimestampToDate,
  stringToBoolean,
  stringToDate,
} from '../../utils/hstoreClassTransforms';

type CCPALinkLoc = 'left' | 'right' | 'footer' | 'none';

export class SiteSettingsHStore {
  @Transform(stringToBoolean)
  payee_name_updated: boolean | null = null;

  @Transform(stringToBoolean)
  enable_divbuster: boolean | null = null;

  divbuster_exclusions: string | null = null;

  // Google Analytics Profile Settings We Sync
  ga_timezone: string | null = null;
  ga_excluded_query: string | null = null;

  @Transform(stringToBoolean)
  adhesion_close: boolean | null = null;

  @Transform(stringToBoolean)
  optimize_mobile_pagespeed: boolean | null = null;
  @Transform(stringToBoolean)
  optimize_desktop_pagespeed: boolean | null = null;

  @Transform(stringToBoolean)
  psa: string | null = null;

  gumgum_id: string | null = null;
  @Transform(stringToBoolean)
  gumgum_skip_first_image: boolean | null = null;
  @Transform(stringToBoolean)
  gumgum_in_image: boolean | null = null;
  @Transform(stringToBoolean)
  gumgum_in_screen: boolean | null = null;

  youtube_channel_id: string | null = null;

  @Transform(stringToBoolean)
  disable_newrelic: boolean | null = null;

  @Type(() => Number)
  // 0: Non-Personalized, 1: Mediavine CMP, 2: Self CMP
  gdpr_compliance: number | null = null;

  custom_cmp_header: string | null = null;
  custom_cmp_color: string | null = null;
  brand_color: string | null = null;

  ccpa_link_loc: CCPALinkLoc | null = null;
  custom_ccpa_text: string | null = null;
  @Transform(stringToBoolean)
  ccpa_modal_enabled: boolean | null = null;

  @Transform(stringToBoolean)
  zergnet: string | null = null;
  @Type(() => Number)
  zergnet_id: string | null = null;
  @Type(() => Number)
  zergnet_traffic_id: string | null = null;
  zergnet_content_selector: string | null = null;
  zergnet_content_position: string | null = null;

  @Transform(stringToBoolean)
  blockthrough_enabled: boolean | null = null;

  @Type(() => Number)
  timeout_override: number | null = null;

  // Which email they granted it to
  ganalytics_id: string | null = null;
  ganalytics_issuer: string | null = null;
  ganalytics_profile_id: string | null = null;
  ganalytics_state: string | null = null;
  @Transform(stringSecondsTimestampToDate)
  ganalytics_refresh_token_expired_at: Date | null = null;

  // Duplicate settings for separate AMP profile. Damn you Google.
  ganalytics_amp_id: string | null = null;
  ganalytics_amp_issuer: string | null = null;

  // Sets a flag on the site that allows UI to prevent display of reporting data.
  // This can be useful when
  @Transform(stringToBoolean)
  disable_reporting: boolean | null = null;

  paypal_email: string | null = null;

  @Transform(stringToBoolean)
  killswitch: boolean | null = null;
  @Transform(stringToBoolean)
  mv_native_enabled: boolean | null = null;

  @Type(() => Number)
  floor_override: number | null = null;

  @Transform(stringToBoolean)
  chicory: boolean | null = null;

  @Transform(stringToBoolean)
  mediavine_comscore: boolean | null = null;
  @Transform(stringToBoolean)
  comscore_signed: boolean | null = null;
  @Transform(stringToBoolean)
  cfb: boolean | null = null;
  footer_selector: string | null = null;

  @Transform(stringToBoolean)
  display_ads: boolean | null = null;

  custom_css: string | null = null;

  @Transform(stringToBoolean)
  owned: boolean | null = false;

  @Transform(stringToBoolean)
  loyalty_bonus_disabled: boolean | null = null;

  @Type(() => Number)
  display_revenue_share_override: number | null = null;

  @Transform(stringToBoolean)
  net30_revenue_share_payments: boolean | null = null;
  @Transform(stringToBoolean)
  premiere_invited: boolean | null = null;
  @Transform(stringToBoolean)
  premiere_accepted: boolean | null = null;
  @Transform(stringSecondsTimestampToDate)
  premiere_accepted_on: Date | null = null;
  premiere_accepted_by: string | null = null;
  @Transform(stringToBoolean)
  premiere_manage_account: boolean | null = null;
  @Transform(stringToDate)
  premiere_manage_account_enabled_on: Date | null = null;
  @Transform(stringToDate)
  premiere_last_audit: Date | null = null;
  @Transform(stringToDate)
  premiere_last_inspected: Date | null = null;
  @Transform(stringToBoolean)
  enterprise_tier: boolean | null = null;
  // For Trellis sites
  @Transform(stringToBoolean)
  disable_local_model: boolean | null = null;

  // CSS selector used to determine what recipe to jump to when users click
  // the "jump to recipe" button placed by the web-wrapper.
  jtr_selector: string | null = null;
  // If set, the web-wrapper will place an ad unit immediately before the
  // recipe when the "jump to recipe" button is clicked.
  @Transform(stringToBoolean)
  jtr_arrival_unit_enabled: boolean | null = null;
  // Selector for custom Jump to Recipe button. Enables us to get Arrival ad unit working with custom JTR buttons.
  jtr_button_selector: string | null = null;
  // WP Recipe Maker and Tasty Recipes cards containing step-by-step instructions are now eligible for additional
  // ads per the Coalition for Better Ads Standards. Control how often they appear with this setting.
  // values - default | medium | low | none
  recipe_instruction_density: string | null = null;
  // By default, WPRM and Tasty Recipe cards will be targeted for 2 ads on desktop and 3 ads on mobile.
  // You can adjust down the number of ads using this setting. If you have custom targeting or run a different
  // recipe card, this will have no effect.
  // values - default | medium | low | none
  recipe_slot_density: string | null = null;

  adhesion_allow_selector: string | null = null;

  universal_player_allow_selector: string | null = null;

  @Type(() => Number)
  sidebar_minimum_width: number | null = null;

  @Type(() => Number)
  lazy_offset: number | null = null;

  outstream_density: string | null = null;

  sidebar_atf_selector: string | null = null;
  sidebar_atf_position: string | null = null;

  sidebar_btf_selector: string | null = null;
  sidebar_btf_position: string | null = null;
  sidebar_btf_stop_selector: string | null = null;
  @Transform(stringToBoolean)
  sidebar_btf_disable_sticky: boolean | null = null;
  @Type(() => Number)
  sb_so: number | null = null;
  @Type(() => Number)
  mobile_header_offset: number | null = null;

  feed_selector: string | null = null;
  feed_position: string | null = null;

  @Transform(stringToBoolean)
  optimize_short_form_content: boolean | null = null;

  content_selector: string | null = null;
  content_selector_mobile: string | null = null;
  @Transform(stringToBoolean)
  content_desktop: boolean | null = null;

  // Optional CSS selector to stop inserting ads after (useful for recipe sites)
  content_stop_selector: string | null = null;

  @Type(() => Number)
  content_cba_mobile_percentage: number | null = null;
  @Type(() => Number)
  content_cba_desktop_percentage: number | null = null;

  @Type(() => Number)
  content_cba_mobile_buffer: number | null = null;
  @Type(() => Number)
  content_cba_desktop_buffer: number | null = null;

  @Type(() => Number)
  content_cba_mobile_limit: number | null = null;
  @Type(() => Number)
  content_cba_desktop_limit: number | null = null;

  @Transform(stringToBoolean)
  cb_dn: boolean | null = null;

  @Transform(stringToBoolean)
  content_mobile: boolean | null = null;

  @Type(() => Number)
  content_require_text: number | null = null;

  @Type(() => Number)
  content_buffer_end: number | null = null;
  @Type(() => Number)
  content_buffer_begin: number | null = null;

  @Transform(stringToBoolean)
  enable_listbuster: boolean | null = null;

  @Transform(stringToBoolean)
  leaderboard: boolean | null = null;
  leaderboard_atf_selector: string | null = null;
  leaderboard_atf_position: string | null = null;
  @Transform(stringToBoolean)
  leaderboard_atf_disable_billboard: boolean | null = null;

  leaderboard_btf_selector: string | null = null;
  leaderboard_btf_position: string | null = null;

  comments_selector: string | null = null;
  comments_position: string | null = null;

  recipe_selector: string | null = null;
  recipe_position: string | null = null;
  @Transform(stringToBoolean)
  recipe_float: boolean | null = null;

  // Allows recipe ads to run in instructions for WPRM/Tasty recipe cards.
  @Transform(stringToBoolean)
  dynamic_recipe_slots: boolean | null = null;
  // Makes web-wrapper insert predefined static ads into WPRM/Tasty recipe cards.
  @Transform(stringToBoolean)
  enable_automatic_recipe_selectors: boolean | null = null;

  recipe_mobile_selector: string | null = null;
  recipe_mobile_position: string | null = null;

  @Transform(stringToBoolean)
  adhesion_mobile: boolean | null = null;
  @Transform(stringToBoolean)
  adhesion_tablet: boolean | null = null;
  @Transform(stringToBoolean)
  adhesion_desktop: boolean | null = null;
  @Transform(stringToBoolean)
  adhesion_light: boolean | null = null;
  // adhesion_video, but for desktop
  @Transform(stringToBoolean)
  universal_player_desktop: boolean | null = null;
  @Transform(stringToBoolean)
  universal_player_mobile: boolean | null = null;

  video_adhesion_color: string | null = null;
  video_adhesion_video_id: string | null = null;

  @Transform(stringToBoolean)
  amazon: boolean | null = null;
  @Transform(stringToBoolean)
  appnexus: boolean | null = null;
  @Transform(stringToBoolean)
  brealtime: boolean | null = null;
  @Transform(stringToBoolean)
  brightcom: boolean | null = null;
  @Transform(stringToBoolean)
  index: boolean | null = null;
  @Transform(stringToBoolean)
  google: boolean | null = null;
  @Transform(stringToBoolean)
  sovrn: boolean | null = null;
  @Transform(stringToBoolean)
  triplelift: boolean | null = null;
  @Transform(stringToBoolean)
  verizon: boolean | null = null;

  @Type(() => Number)
  url_expires_on_default: number | null = null;

  privacy_policy_link: string | null = null;
  @Transform(stringToBoolean)
  privacy_policy_support_override: boolean | null = null;

  custom_adstxt: string | null = null;

  notes: string | null = null;
  @Transform(stringToBoolean)
  influencer_poc_optout: boolean | null = null;
  @Transform(stringToBoolean)
  influencer_poc: boolean | null = null;
  @Transform(stringToBoolean)
  influencer_non_profit_work: boolean | null = null;
  @Type(() => Number)
  influencer_non_profit_rate: number | null = null;
  @Transform(stringToBoolean)
  below_content: boolean | null = null;
  @Transform(stringToBoolean)
  less_lazy_mode: boolean | null = null;
  @Transform(stringToBoolean)
  lgbtq_community_member: boolean | null = null;
  @Transform(stringToBoolean)
  woman_owned_business: boolean | null = null;
  @Transform(stringToBoolean)
  intercom_report_privacy_policy_ad_partners: boolean | null = null;
  @Transform(stringToBoolean)
  intercom_report_privacy_policy_liveramp: boolean | null = null;
  @Transform(stringToBoolean)
  intercom_report_privacy_policy_non_teal: boolean | null = null;
  @Transform(stringToBoolean)
  intercom_report_privacy_policy_mpa: boolean | null = null;
  @Transform(stringToBoolean)
  enable_mvp_branding: boolean | null = null;
  @Transform(stringToBoolean)
  enable_interstitial_ads: boolean | null = null;
  @Transform(stringToBoolean)
  enable_desktop_interstitial_ads: boolean | null = null;

  // CLS/Ad Box
  @Transform(stringToBoolean)
  ad_box: boolean | null = null;
  ad_box_bg_color: string | null = null;
  @Transform(stringToBoolean)
  ad_box_placeholder_text: boolean | null = null;
  @Transform(stringToBoolean)
  optimize_sticky_sidebar_cls: boolean | null = null;
  @Transform(stringToBoolean)
  mobile_inview: boolean | null = null;
  @Transform(stringToBoolean)
  desktop_inview: boolean | null = null;

  // MCM defaults
  @Transform(stringToBoolean)
  launch_mode: boolean | null = null;
  @Transform(stringToBoolean)
  mcm_tagging: boolean | null = null;
  @Transform(stringToBoolean)
  spm_approval: boolean | null = null;
  @Transform(stringToBoolean)
  verification_mode: boolean | null = null;

  // MCM AdSense Modal
  mcm_email: string | null = null;
  @Transform(stringToBoolean)
  mcm_eligible: boolean | null = null;

  // Interscroller
  @Transform(stringToBoolean)
  interscroller_desktop: boolean | null = null;
  @Transform(stringToBoolean)
  interscroller_mobile: boolean | null = null;

  @Transform(stringToBoolean)
  url_change_reload: boolean | null = null;
  @Transform(stringToBoolean)
  auto_enable_new_settings: boolean | null = null;

  @Transform(stringToBoolean)
  display_content_after_flex: boolean | null = null;

  // Selector for uninsertable_classes for in-content ad placement, before the content
  content_skip_before_selector: string | null = null;
  // Selector for uninsertable_classes for in-content ad placement, after the content
  content_skip_after_selector: string | null = null;

  // Mediavine Programmatic Advertising privacy policy mode
  @Transform(stringToBoolean)
  enable_mpa_privacy_policy_requirement: boolean | null = null;

  // Allow Terms of Service Acceptance
  @Transform(stringToBoolean)
  allow_tos_acceptance: boolean | null = null;

  // Pro tier settings
  pro_accepted: string | null = null;
  pro_accepted_by: string | null = null;
  @Transform(stringSecondsTimestampToDate)
  pro_accepted_on: Date | null = null;
  @Transform(stringToBoolean)
  pro_invited: boolean | null = null;
  @Transform(stringSecondsTimestampToDate)
  pro_invited_on: Date | null = null;
  @Transform(stringToDate)
  pro_last_audit: Date | null = null;
  @Transform(stringToDate)
  pro_last_inspected: Date | null = null;

  // Disable Onboarding Wizard
  @Transform(stringToBoolean)
  disable_onboarding_wizard: boolean | null = null;

  // Experimental Custom Model Feature Setting
  custom_model: string | null = null;

  // Gutter and content settings
  @Transform(stringToBoolean)
  gutter_enable: boolean | null = null;
  @Type(() => Number)
  gutter_offset: number | null = null;
  total_content_selector: string | null = null;
}

export type SiteSettingsHStoreFieldName = keyof SiteSettingsHStore;

export const SETTINGS_HSTORE_FIELD_NAMES = new Set(
  Object.keys(new SiteSettingsHStore()),
);

export type SiteSettingsHStoreRaw = {
  [key in SiteSettingsHStoreFieldName]?: string | null;
};
