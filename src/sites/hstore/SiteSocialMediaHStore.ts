import { Type } from 'class-transformer';

export class SiteSocialMediaHStoreClass {
  youtube: string | null = null;
  @Type(() => Number)
  youtube_count: number | null = null;
  snapchat: string | null = null;
  instagram: string | null = null;
  @Type(() => Number)
  instagram_count: number | null = null;
  pinterest: string | null = null;
  @Type(() => Number)
  pinterest_count: number | null = null;
  facebook: string | null = null;
  @Type(() => Number)
  facebook_count: number | null = null;
  tiktok: string | null = null;
  @Type(() => Number)
  tiktok_count: number | null = null;
  twitter: string | null = null;
  @Type(() => Number)
  twitter_count: number | null = null;
}

export type SocialMediaHStoreFieldName = keyof SiteSocialMediaHStoreClass;

export const SOCIAL_MEDIA_HSTORE_FIELD_NAMES = new Set(
  Object.keys(new SiteSocialMediaHStoreClass()),
);

export type SiteSocialMediaHStoreRaw = {
  [key in SocialMediaHStoreFieldName]?: string | null;
};
