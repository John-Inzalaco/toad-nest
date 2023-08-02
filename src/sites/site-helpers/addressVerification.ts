import { SiteProfileHStoreClass } from '../hstore/SiteProfileHStore';

export const ADDRESS_FIELDS = [
  'address1',
  'city',
  'state',
  'zipcode',
  'country',
];

export function getAddressExists(
  profile: Pick<
    SiteProfileHStoreClass,
    'address1' | 'city' | 'state' | 'zipcode' | 'country'
  >,
) {
  return Boolean(
    profile.address1 &&
      profile.city &&
      profile.state &&
      profile.zipcode &&
      profile.country,
  );
}

const ONE_YEAR_MILLISECONDS = 1000 * 3600 * 24 * 365;

export function getAddressExpired(
  profile: Pick<SiteProfileHStoreClass, 'address_verified_at'>,
) {
  return profile.address_verified_at
    ? Date.now() - Number(profile.address_verified_at) > ONE_YEAR_MILLISECONDS
    : null;
}
