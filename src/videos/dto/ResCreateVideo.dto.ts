import { videos, video_chapters, video_tracks } from '@prisma/dashboard';
import { VideoUpNextOrder } from '../enum/VideoUpNextOrder.enum';
import { VideoStatus } from '../enum/VideoStatus.enum';
import { calculateAspectRatio } from '../../utils/calculateAspectRatio';
import { SiteVideoSettingsHStoreRaw } from '../../sites/hstore/SiteVideoSettingsHStore';
import { VideoChapterDto } from './videoChapter.dto';
import { VideoTrackDto } from './videoTrack.dto';

export class ResCreateVideoDto {
  aspect_ratio: string;
  created_at: Date | null;
  description: string | null;
  duration: number | null;
  file: string | null;
  has_unique_permalink: boolean;
  height: number | null;
  id: number | null;
  image: string | null;
  keywords: string | null;
  meta: Meta;
  permalink: string | null;
  site_id: number | null;
  slug: string | null;
  status: string | null;
  streaming_profile: string | null;
  title: string | null;
  up_next_order: string | null;
  updated_at: Date | null;
  user_id: number | null;
  video_chapters: VideoChapterDto[];
  video_headline: string | null;
  video_number: number | null;
  vtt: VideoTrackDto[];
  width: number | null;

  constructor(
    video: VideoWithTracksAndChapters,
    has_unique_permalink: boolean,
    meta: SiteVideoSettingsHStoreRaw,
  ) {
    this.aspect_ratio = calculateAspectRatio(video.width, video.height);
    this.created_at = video.created_at;
    this.description = video.description;
    this.duration = video.duration;
    this.file = video.file;
    this.height = video.height;
    this.id = video.id;
    this.meta = meta;
    this.permalink = video.permalink;
    this.has_unique_permalink = has_unique_permalink;
    this.site_id = video.site_id;
    this.slug = video.slug;
    this.streaming_profile = video.streaming_profile;
    this.image = video.image;
    this.keywords = video.keywords;
    this.status =
      video.status !== null
        ? (VideoStatus[video.status] as unknown as string)
        : null;
    this.title = video.title;
    this.up_next_order =
      video.up_next_order !== null
        ? (VideoUpNextOrder[video.up_next_order] as unknown as string)
        : null;
    this.updated_at = video.updated_at;
    this.user_id = video.user_id;
    this.video_chapters = video.video_chapters;
    this.video_headline = video.video_headline;
    this.video_number = video.video_number;
    this.vtt = video.video_tracks;
    this.width = video.width;
  }
}

export class ResCreateVideoWrapperDto {
  video!: ResCreateVideoDto;
}

type VideoWithTracksAndChapters = videos & {
  video_chapters: video_chapters[];
  video_tracks: video_tracks[];
};

export class Meta implements SiteVideoSettingsHStoreRaw {
  default_video_headline?: string | null;
  default_video_headline_el?: string | null;
  player_aspect_ratio?: string | null;
  /**?Disable overlay unit on sites */
  disable_overlay?: string | null;
  /**  Move first video to top of desktop pages and stick/autoplay it */
  hoist_first_video?: string | null;
  hoist_first_video_mobile?: string | null;
  hoist_first_video_desktop?: string | null;
  /**  Feature Video Type (none, playlist or video) */
  featured_video_type?: string | null;
  /**  Either a video id or a slug id */
  featured_video_id?: string | null;
  /**  Add featured video to desktop and sitck/autoplay it */
  auto_insert_sticky_video?: string | null;
  /**  Force sticky player to float alongside content instead of the sidebar */
  sticky_content_side?: string | null;
  /**  Position of popout on mobile */
  mobile_popout_placement?: string | null;
  mobile_popout_top_margin?: string | null;
  /**  custom CSS Target for hoistin; */
  custom_hoist_selector?: string | null;
  /**  Custom insertAdjacentHTML method for hoisting */
  custom_hoist_position?: string | null;
  /**  Buffer for hoisting / auto-insert */
  auto_insert_offset?: string | null;
  player_background?: string | null;
  /**  0: none, 1: music_only */
  default_vtt?: string | null;
  midroll_enabled?: string | null;
  featured_video_allow_selector?: string | null;
}
