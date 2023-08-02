import { playlists, videos } from '@prisma/dashboard';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { IsStringLiteral } from '../../utils/custom-validators';

export class ListPlaylistsResponseDto {
  playlists!: Playlist[];
  total_count!: number;
}

class Playlist implements playlists {
  created_at!: Date;
  description!: string | null;
  headline!: string | null;
  id!: number;
  image!: string | null;
  site_id!: number | null;
  title!: string | null;
  updated_at!: Date;
  user_id!: number | null;
  videos!: (Video | null)[];
}

class Video implements Partial<Pick<videos, 'image' | 'slug' | 'title'>> {
  image?: string | null;
  slug?: string | null;
  title?: string | null;
}

export class ListPlaylistsQueryParams {
  /** String to search playlist titles */
  @IsOptional()
  @IsString()
  query?: string;
  /** Pagination value */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;
  /** Pagination results per page */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  per_page: number = 25;
  /** Sort by any key of a playlist */
  @IsOptional()
  @IsStringLiteral(['created_at', 'title'])
  sort: 'created_at' | 'title' = 'created_at';
  /** Sort order */
  @IsOptional()
  @IsString()
  direction: 'desc' | 'asc' = 'desc';
}
