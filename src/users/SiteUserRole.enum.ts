export enum SiteUserRole {
  ad_settings = 1,
  reporting = 2,
  video = 4,
  payment = 8,
  owner = 16,
  post_termination_new_owner = 32,
}

export type SiteUserRoleKey = keyof typeof SiteUserRole;
