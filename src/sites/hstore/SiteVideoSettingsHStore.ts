import { Transform, Type } from 'class-transformer';
import { stringToBoolean } from '../../utils/hstoreClassTransforms';

type MobilePopoutPlacement = `${'top' | 'bottom'}_${
  | 'left'
  | 'center'
  | 'right'}`;

export class SiteVideoSettingsHStore {
  default_video_headline: string | null = null;
  default_video_headline_el: string | null = null;

  player_aspect_ratio: string | null = null;

  // Disable overlay unit on sites
  @Transform(stringToBoolean)
  disable_overlay: boolean | null = null;

  // Move first video to top of desktop pages and stick/autoplay it
  @Transform(stringToBoolean)
  hoist_first_video: boolean | null = null;
  @Transform(stringToBoolean)
  hoist_first_video_mobile: boolean | null = null;
  @Transform(stringToBoolean)
  hoist_first_video_desktop: boolean | null = null;

  // Feature Video Type (none, playlist or video)
  featured_video_type: string | null = null;

  // Either a video id or a slug id
  featured_video_id: string | null = null;

  // Add featured video to desktop and sitck/autoplay it
  @Transform(stringToBoolean)
  auto_insert_sticky_video: boolean | null = null;

  // Force sticky player to float alongside content instead of the sidebar
  @Transform(stringToBoolean)
  sticky_content_side: boolean | null = null;

  // Position of popout on mobile
  mobile_popout_placement: MobilePopoutPlacement = `bottom_left`;
  @Type(() => Number)
  mobile_popout_top_margin: number | null = null;

  // Custom CSS Target for hoisting
  custom_hoist_selector: string | null = null;

  // Custom insertAdjacentHTML method for hoisting
  custom_hoist_position: string | null = null;

  // Buffer for hoisting / auto-insert
  @Type(() => Number)
  auto_insert_offset: number | null = null;

  player_background: string | null = null;
  @Type(() => Number)
  // 0: none, 1: music_only
  default_vtt: number | null = null;

  @Transform(stringToBoolean)
  midroll_enabled: boolean | null = null;

  featured_video_allow_selector: string | null = null;
}

export type SiteVideoSettingsHStoreRaw = {
  [key in keyof SiteVideoSettingsHStore]?: string | null;
};
