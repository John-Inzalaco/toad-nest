import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class GetProfileSettingsParamsDto {
  @Type(() => Number)
  @IsInt()
  site_id!: number;
}

class ProfileSettingsSiteDto {
  /**
   * Whether or not someone has accepted the Mediavine ToS for the site
   */
  accepted_terms_of_service?: boolean | null;
  /**
   * The nme of the person who accepted the terms of service for the site
   * @example First Middle Last
   */
  accepted_terms_of_service_by?: string | null;
  /**
   * The date the terms of service was accepted
   */
  accepted_terms_of_service_on?: Date | null;
  /**
   * Address Line 1 for the site
   */
  address1?: string | null;
  /**
   * Whether or not all address fields are complete or not
   */
  address_exists?: boolean | null;
  /**
   * Whether or not the address is expired, meaning the address was last verified more than a year ago
   */
  address_expired?: boolean | null;
  @ApiProperty({
    format: 'date',
    description: 'The date the address was last verified',
  })
  address_verified_at?: string | null;
  /**
   * Author bio for the site
   */
  author_bio?: string | null;
  /**
   * Author image for the site
   */
  author_image?: string | null;
  /**
   * Author name for the site
   */
  author_name?: string | null;
  /**
   * Site's brand color as a hex value
   * @example #000000
   */
  brand_color?: string | null;
  /**
   * Primary category for the site
   */
  category_id?: ProfileSettingsCategoryDto | null;
  /**
   * All categories a site belongs to
   */
  category_ids?: ProfileSettingsCategoryDto[];
  /**
   * City address field
   */
  city?: string | null;
  /**
   * Contact email to use for site communication
   */
  contact_email?: string | null;
  /**
   * Country address field
   */
  country?: string | null;
  /**
   * Country the site operates in
   */
  country_of_operation?: string | null;
  /**
   * Facebook username
   */
  facebook?: string | null;
  influencer_non_profit_rate?: number | null;
  influencer_non_profit_work?: boolean | null;
  /**
   * Instagram username
   */
  instagram?: string | null;
  /**
   * Phone number for the site
   */
  phone_number?: string | null;
  /**
   * Pinterest username
   */
  pinterest?: string | null;
  /**
   * Pinterest email
   */
  pinterest_email?: string | null;
  /**
   * Whether or not the site has accepted a premiere invite
   */
  premiere_accepted?: boolean | null;
  /**
   * Whether or not the site has been invited to premiere
   */
  premiere_invited?: boolean | null;
  /**
   * Indicates if a site has accepted a pro invite or not
   */
  pro_accepted?: string | null;
  /**
   * Whether or not the site has been invited to pro
   */
  pro_invited?: boolean | null;
  /**
   * Description of the site
   */
  site_description?: string | null;
  /**
   * Siete id
   */
  site_id?: number;
  /**
   * Site's image
   */
  site_image?: string | null;
  /**
   * Site's title
   */
  site_title?: string | null;
  /**
   * Snapchat username
   */
  snapchat?: string | null;
  /**
   * State address field
   */
  state?: string | null;
  /**
   * tiktok username
   */
  tiktok?: string | null;
  /**
   * twitter username
   */
  twitter?: string | null;
  /**
   * Youtube channel name
   */
  youtube?: string | null;
  /**
   * Zipcode address field
   */
  zipcode?: string | null;
}

class ProfileSettingsCategoryDto {
  created_at!: Date;
  iab_code?: string | null;
  /**
   * Category id
   * @example 1
   */
  id!: number;
  /**
   * Parent category id
   * @example 2
   */
  parent_id?: number | null;
  /**
   * Category slug
   * @example "arts-and-entertainment"
   */
  slug?: string | null;
  /**
   * Category title
   * @example "Arts & Entertainment"
   */
  title?: string | null;
  updated_at!: Date;
}

export class GetProfileSettingsResponseDto {
  site!: ProfileSettingsSiteDto;
}
