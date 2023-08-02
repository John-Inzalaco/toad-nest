import { ApiProperty } from '@nestjs/swagger';
import { VideoChapterDto } from './videoChapter.dto';
import { VideoTrackDto } from './videoTrack.dto';
import { VideoUpNextOrder } from '../enum/VideoUpNextOrder.enum';
import { VideoStatus } from '../enum/VideoStatus.enum';
import { getEnumKeys } from '../../utils/getEnumKeys';

export class VideoDto {
  /**
   * the video id
   * @example 5992
   */
  id!: number;
  /**
   * Video Description
   * @example "Fan favorite recipes based on traffic"
   */
  description?: string | null;
  /**
   * Video duration
   * @example 45
   */
  duration?: number | null;
  /**
   * Path to Cloudinary source
   * @example v1539731159/tsbqbu8ig3fva8dj8kte
   */
  file?: string | null;
  /**
   * Height of video
   * @example 1080
   */
  height?: number | null;
  /**
   * Path to video image in Cloudinary
   * @example v1682373571/ihpi9aaulsstnhxczqnt
   */
  image?: string | null;
  /**
   * Comma delimited string of video keywords
   * @example  fan favorite, recipe, popular
   */
  keywords?: string | null;
  /**
   * Permalink URL for Video metadata
   * @example https://melaniemakes.com/recipe-index/
   */
  permalink?: string | null;
  /**
   * ID of site who owns video
   * @example 138
   */
  site_id!: number | null;
  /**
   * Random string identifier for video. Commonly used in place of ID for referencing videos.
   * @example tsbqbu8ig3fva8dj8kte
   */
  slug?: string | null;
  /**
   * Upload status of video
   * @example live
   */
  /**
   * Title of video
   * @example Highlight Reel
   * */
  title?: string | null;
  @ApiProperty({
    description: 'Upload status of video',
    enum: getEnumKeys(VideoStatus),
    example: VideoStatus[0],
  })
  status?: string | null;
  @ApiProperty({
    description:
      'State which video should be valued in the up next ordering logic.',
    enum: getEnumKeys(VideoUpNextOrder),
    example: VideoUpNextOrder[0],
  })
  up_next_order?: string | null;
  /**
   * Id of the user who owns the site
   * @example 389
   */
  user_id!: number | null;
  /**
   * @example 6
   */
  video_number?: number | null;
  vtt!: VideoTrackDto[];
  video_chapters!: VideoChapterDto[];
  /**
   * Headline to use if video is dynamically inserted into page.
   * @example Californian Steak Sandwich
   */
  video_headline!: string | null;
  /**
   * Width of the video
   * @example 1920
   * */
  width!: number | null;

  created_at?: Date | null;
  updated_at?: Date | null;
}
