export class VideoTrackDto {
  id!: number;
  /**
   * Foreign key of video association
   * @example 5992
   */
  video_id!: number | null;
  /**
   * @example vtt
   */
  filetype?: string | null;
  /**
   * Type of video track
   * ie. captions, descriptions, subtitles
   * @example captions
   */
  kind?: string | null;

  /**
   * Two character language code.
   * @example en
   */
  srclang?: string | null;
  /**
   * Unique string identifier.
   * @example xe34rdzakqm8g3iideel
   */
  slug?: string | null;
  /**
   * Full name of track language.
   * @example English
   */
  label?: string | null;
  /**
   * @example false
   */
  default?: boolean | null = false;
  created_at?: Date | null;
  updated_at?: Date | null;
}
