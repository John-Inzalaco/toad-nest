export class VideoChapterDto {
  /**
   * @example 8
   */
  id!: number;
  /**
   * Foreign key of associated video
   * @example 5992
   */
  video_id!: number | null;
  /**
   * Timestamp of where chapter begins.
   * @example 30
   */
  time?: number | null;
  /**
   * Description of video portion
   * @example River of Tears
   * */
  description?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
}
