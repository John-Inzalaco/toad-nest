import { Transform, Type } from 'class-transformer';
import {
  stringSecondsTimestampToDate,
  stringToBoolean,
  stringToDate,
} from '../../utils/hstoreClassTransforms';

export class SiteProfileHStoreClass {
  car?: string | null = null;

  @Transform(stringToBoolean)
  influencer_optin?: boolean | null = null;

  site_description?: string | null = null;
  site_image?: string | null = null;
  slug_override?: string | null = null;
  author_name?: string | null = null;
  contact_email?: string | null = null;
  pinterest_email?: string | null = null;
  address1?: string | null = null;
  city?: string | null = null;
  state?: string | null = null;
  zipcode?: string | null = null;
  country?: string | null = null;

  @Transform(stringToDate)
  address_verified_at?: Date | null = null;
  phone_number?: string | null = null;
  author_bio?: string | null = null;
  author_image?: string | null = null;

  @Type(() => Number)
  screenshot_timestamp?: number | null = null;
  brands?: string | null = null;

  @Type(() => Number)
  post_rate?: string | null = null;

  @Type(() => Number)
  video_rate?: string | null = null;

  @Type(() => Number)
  social_rate?: string | null = null;

  @Type(() => Number)
  instagram_rate?: string | null = null;

  @Type(() => Number)
  fblr?: string | null = null;

  @Transform(stringToBoolean)
  given_notice?: boolean | null = null;

  @Transform(stringToDate)
  given_notice_on?: Date | null = null;

  @Transform(stringToDate)
  term_date?: Date | null = null;

  @Transform(stringToBoolean)
  accepted_terms_of_service?: boolean | null = null;

  @Transform(stringSecondsTimestampToDate)
  accepted_terms_of_service_on?: Date | null = null;
  accepted_terms_of_service_by?: string | null = null;

  country_of_operation?: string | null = null;
}

export type ProfileHStoreFieldName = keyof SiteProfileHStoreClass;

export const PROFILE_HSTORE_FIELD_NAMES = new Set(
  Object.keys(new SiteProfileHStoreClass()),
);

export type SiteProfileHStoreRaw = {
  [key in ProfileHStoreFieldName]?: string | null;
};
