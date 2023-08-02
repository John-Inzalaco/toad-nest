import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class GenerateSignatureParamsDto {
  /**
   * The site id
   * @example 3567
   */
  @Type(() => Number)
  @IsInt()
  site_id!: number;
}

export class GenerateSignatureQueryDto {
  @IsOptional()
  @IsString()
  resource_type?: string;
}

export class GenerateSignatureResponseDto {
  image_metadata?: boolean;
  signature!: string;
  source?: string;
  tags!: string;
  timestamp!: number;
  upload_preset?: string;
}
