import { SiteSettingsHStore } from '../hstore/SiteSettingsHStore';

export function isPremiereInvited({
  premiere_accepted,
  premiere_invited,
}: Pick<
  SiteSettingsHStore,
  'premiere_invited' | 'premiere_accepted'
>): boolean {
  return !!premiere_invited && !premiere_accepted;
}

export function isPremiereAccepted({
  premiere_accepted,
}: SiteSettingsHStore): boolean {
  return !!premiere_accepted;
}

export function isProInvited({
  pro_invited,
  pro_accepted,
}: SiteSettingsHStore): boolean {
  return Boolean(pro_invited) && pro_accepted === 'na';
}

export function isProAccepted({ pro_accepted }: SiteSettingsHStore): boolean {
  return !!pro_accepted;
}

export function isEnterpriseSite({
  enterprise_tier,
}: SiteSettingsHStore): boolean {
  return !!enterprise_tier;
}
