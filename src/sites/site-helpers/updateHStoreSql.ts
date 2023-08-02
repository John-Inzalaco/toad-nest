import { Prisma } from '@prisma/dashboard';
import {
  PROFILE_HSTORE_FIELD_NAMES,
  ProfileHStoreFieldName,
} from '../hstore/SiteProfileHStore';
import {
  SETTINGS_HSTORE_FIELD_NAMES,
  SiteSettingsHStoreFieldName,
} from '../hstore/SiteSettingsHStore';
import {
  SOCIAL_MEDIA_HSTORE_FIELD_NAMES,
  SocialMediaHStoreFieldName,
} from '../hstore/SiteSocialMediaHStore';
import { isPresent } from '../../utils/isPresent';

function getHStoreSetStatement(
  hStoreName: string,
  fields: { key: string; value: string | null }[],
) {
  if (!fields.length) {
    return null;
  }
  const hstoreSetArray = fields.map(({ key, value }) => {
    if (value === null) {
      return `${key}=>NULL`;
    }
    return `"${key}"=>"${value}"`;
  });
  const hstoreValue = hstoreSetArray.join(',');
  const rawHStoreName = Prisma.raw(hStoreName);
  return Prisma.sql`${rawHStoreName} = ${rawHStoreName} || ${hstoreValue} :: hstore`;
}

export function updateHStoreSql(input: {
  [key in
    | ProfileHStoreFieldName
    | SiteSettingsHStoreFieldName
    | SocialMediaHStoreFieldName]?: unknown;
}) {
  const profileFields: { key: string; value: string | null }[] = [];
  const settingsFields: { key: string; value: string | null }[] = [];
  const socialMediaFields: { key: string; value: string | null }[] = [];
  Object.entries(input).forEach(([key, val]) => {
    if (val === undefined) {
      return;
    }
    const value = val === null ? null : String(val);
    if (PROFILE_HSTORE_FIELD_NAMES.has(key)) {
      profileFields.push({ key, value });
    }
    if (SETTINGS_HSTORE_FIELD_NAMES.has(key)) {
      settingsFields.push({ key, value });
    }
    if (SOCIAL_MEDIA_HSTORE_FIELD_NAMES.has(key)) {
      socialMediaFields.push({ key, value });
    }
  });

  const allSetStatements = [
    getHStoreSetStatement('profile', profileFields),
    getHStoreSetStatement('settings', settingsFields),
    getHStoreSetStatement('social_media', socialMediaFields),
  ];
  return allSetStatements.filter(isPresent);
}
