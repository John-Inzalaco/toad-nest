import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

const VIDEO_SORT_FIELDS = [
  'title',
  'duration',
  'created_at',
  'up_next_order',
] as const;

const VIDEO_SORT_ORDER = ['asc', 'desc'] as const;

export class GetVideosQueryDto {
  @IsOptional()
  @IsString()
  query?: string;
  @Type(() => Number)
  @IsInt()
  page: number = 1;
  @Type(() => Number)
  @IsInt()
  per_page: number = 25;
  @IsOptional()
  @IsString()
  priority?: string | null;
  @IsOptional()
  @IsEnum(VIDEO_SORT_FIELDS)
  @ApiProperty({
    enum: VIDEO_SORT_FIELDS,
  })
  sort?: (typeof VIDEO_SORT_FIELDS)[number];
  @IsEnum(VIDEO_SORT_ORDER)
  @ApiProperty({
    enum: VIDEO_SORT_ORDER,
  })
  sort_order: (typeof VIDEO_SORT_ORDER)[number] = 'asc';
}

export class GetVideosParamsDto {
  /**
   * The site id
   * @example 3567
   */
  @Type(() => Number)
  @IsInt()
  siteId!: number;
}

class VideoTrackDto {
  id!: number;
  video_id?: number | null;
  filetype?: string | null;
  kind?: string | null;
  srclang?: string | null;
  slug?: string | null;
  label?: string | null;
  default?: boolean | null = false;
  created_at?: Date | null;
  updated_at?: Date | null;
}

class VideoTracksDto {
  readonly tracks!: VideoTrackDto[];
}

class VideoChapterDto {
  id!: number;
  video_id?: number | null;
  time?: number | null;
  description?: string | null;
  created_at?: Date | null;
  updated_at?: Date | null;
}

class VideoChaptersDto {
  readonly chapters!: VideoChapterDto[];
}

class VideoDto {
  id!: number;
  created_at?: Date | null;
  description?: string | null;
  duration?: number | null;
  file?: string | null;
  height?: number | null;
  image?: string | null;
  keywords?: string | null;
  permalink?: string | null;
  site_id?: number | null;
  slug?: string | null;
  status?: string | null;
  title?: string | null;
  up_next_order?: string | null;
  updated_at?: Date | null;
  user_id?: number | null;
  video_number?: number | null;
  width?: number | null;
  aspect_ratio?: string | null;
  vtt?: VideoTracksDto;
  /** This is a typo in the API as it exists */
  video_chapers?: VideoChaptersDto;
}

export class GetVideosResponseDto {
  readonly videos!: VideoDto[];
  readonly total_count!: number;
}
