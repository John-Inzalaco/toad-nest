import { SiteUserRole } from './SiteUserRole.enum';
import { UserRole } from './UserRole.enum';

/**
 * Heavy influenced from:
 * https://javascript.plainenglish.io/a-practical-use-for-bitmasks-in-javascript-a96a24d743ad
 */
export const hasAllRoles = (
  roleMask: number | null | undefined,
  roles: number[],
): boolean => {
  return roles.reduce(
    (acc, role) => acc && ((roleMask || 0) & role) === role,
    true,
  );
};

export const hasAnyRole = (
  roleMask: number | null | undefined,
  roles: number[],
): boolean => {
  if (roles.length === 0) {
    return true;
  }
  return roles.reduce(
    (acc, role) => acc || ((roleMask || 0) & role) === role,
    false,
  );
};

export const convertRolesToMask = (roles: number[]): number => {
  return roles.reduce((acc, role) => acc | role, 0);
};

export function convertMaskToStrings<T extends string>(
  possibleValue: {
    [key in T]: number;
  },
  mask: number,
): T[] {
  const keys = Object.keys(possibleValue) as T[];
  return keys.filter(
    (key) => (possibleValue[key] & mask) === possibleValue[key],
  );
}

export function convertSiteUserRolesToStrings(mask: number | null | undefined) {
  if (!mask) {
    return [];
  }
  return convertMaskToStrings(SiteUserRole, mask);
}

export function convertUserRolesToStrings(mask: number) {
  return convertMaskToStrings(UserRole, mask);
}

export function convertSiteUserKeysToMask(
  roles: (keyof typeof SiteUserRole)[],
): number {
  return convertRolesToMask(roles.map((role) => SiteUserRole[role]));
}
