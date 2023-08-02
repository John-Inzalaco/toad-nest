import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';

export class ImageJson {
  @IsNotEmpty()
  version!: string;
  @IsNotEmpty()
  public_id!: string;
}

export class FileJson {
  @IsNotEmpty()
  public_id!: string;
  @IsInt()
  duration!: number;
  @IsInt()
  height!: number;
  @IsInt()
  width!: number;
  @IsNotEmpty()
  version!: string;
}

export class ReqCreateVideoDto {
  @IsNotEmpty()
  description!: string;
  @IsNotEmpty()
  @IsOptional()
  image!: string;
  @IsNotEmpty()
  keywords!: string;
  @IsNotEmpty()
  @IsOptional()
  permalink!: string;
  @IsNotEmpty()
  title!: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => VideoTracksAttributes)
  video_tracks_attributes?: VideoTracksAttributes[];
  @ValidateNested()
  @IsOptional()
  @Type(() => VideoChaptersAttributes)
  video_chapters_attributes?: VideoChaptersAttributes[];
  @IsInt()
  @IsOptional()
  up_next_order!: number;
  @IsNotEmpty()
  @IsOptional()
  video_headline!: string;
  @IsOptional()
  @IsInt()
  video_number!: number;
  @ValidateNested()
  @Type(() => FileJson)
  file_json!: FileJson;
  @IsOptional()
  @ValidateNested()
  @Type(() => ImageJson)
  image_json!: ImageJson;
}

class VideoTracksAttributes {
  @IsNotEmpty()
  filetype!: string;
  @IsNotEmpty()
  kind!: string;
  @IsNotEmpty()
  label!: string;
  @IsNotEmpty()
  slug!: string;
  @IsNotEmpty()
  srclang!: string;
}

class VideoChaptersAttributes {
  @IsNotEmpty()
  description!: string;
  @IsNotEmpty()
  time!: number;
}
