import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateProfileSettingsParamsDto {
  @Type(() => Number)
  @IsInt()
  site_id!: number;
}

export class UpdateProfileSettingsReqBodyDto {
  @IsOptional()
  @IsString()
  site_description?: string;
  @IsOptional()
  @IsString()
  site_image?: string;
  @IsOptional()
  @IsString()
  slug_override?: string;
  @IsOptional()
  @IsString()
  author_name?: string;
  @IsOptional()
  @IsString()
  contact_email?: string;
  @IsOptional()
  @IsString()
  pinterest_email?: string;
  @IsOptional()
  @IsString()
  facebook?: string;
  @IsOptional()
  @IsString()
  snapchat?: string;
  @IsOptional()
  @IsString()
  instagram?: string;
  @IsOptional()
  @IsString()
  tiktok?: string;
  @IsOptional()
  @IsString()
  twitter?: string;
  @IsOptional()
  @IsString()
  youtube?: string;
  @IsOptional()
  @IsString()
  pinterest?: string;
  @IsOptional()
  @IsString()
  address1?: string;
  @IsOptional()
  @IsString()
  city?: string;
  @IsOptional()
  @IsString()
  state?: string;
  @IsOptional()
  @IsString()
  zipcode?: string;
  @IsOptional()
  @IsString()
  country?: string;
  @IsOptional()
  @IsString()
  author_bio?: string;
  @IsOptional()
  @IsString()
  author_image?: string;
  @IsOptional()
  @IsInt()
  screenshot_timestamp?: number;
  @IsOptional()
  @IsBoolean()
  given_notice?: boolean;
  @IsOptional()
  @IsString()
  phone_number?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  category_id?: number;
  @IsOptional()
  @IsInt({ each: true })
  category_ids?: number[];
  @IsOptional()
  @IsString()
  country_of_operation?: string;
  @IsOptional()
  @IsString()
  brand_color?: string;
  @IsOptional()
  @IsBoolean()
  accepted_terms_of_service?: boolean;
  @IsOptional()
  @IsString()
  pro_accepted?: string;
  @IsOptional()
  @IsBoolean()
  premiere_accepted?: boolean;
  @IsOptional()
  @IsBoolean()
  premiere_manage_account?: boolean;
  @IsOptional()
  @IsBoolean()
  verify_address?: boolean;
}
