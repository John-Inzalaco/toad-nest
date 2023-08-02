import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';
import { SiteUserRoleKey, SiteUserRole } from '../../users/SiteUserRole.enum';
import { site_users } from '@prisma/dashboard';
import { convertSiteUserRolesToStrings } from '../../users/rolesUtilities';
import { ApiProperty } from '@nestjs/swagger';

export class ListSiteUsersParamsDto {
  /**
   * The site id
   * @example 3567
   */
  @Type(() => Number)
  @IsInt()
  site_id!: number;
}

class SiteUserDto {
  /**
   * id of the site_user
   * @example 123
   */
  site_user_id!: number;
  /**
   * The user being associated with a site
   * @example 456
   */
  user_id?: number | null = null;
  /**
   * The site being associated with a user
   * @example 789
   */
  site_id?: number | null = null;
  /**
   * Email of the associated user
   * @example email@example.com
   */
  email?: string | null = null;
  @ApiProperty({
    description: 'The roles the user has for the site',
    example: ['owner', 'ad_settings'],
    enum: Object.keys(SiteUserRole).filter((v) => isNaN(Number(v))),
    isArray: true,
  })
  roles!: SiteUserRoleKey[];
}

export class ListSiteUsersResponseDto {
  site_users: SiteUserDto[];

  constructor(
    siteUsers: (Pick<
      site_users,
      'id' | 'site_id' | 'user_id' | 'roles_mask'
    > & { users: { email: string | null } | null })[],
  ) {
    this.site_users = siteUsers.map((siteUser) => ({
      site_user_id: siteUser.id,
      user_id: siteUser.user_id,
      site_id: siteUser.site_id,
      email: siteUser.users?.email,
      roles: convertSiteUserRolesToStrings(siteUser.roles_mask),
    }));
  }
}
