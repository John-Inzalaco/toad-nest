import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsEmail, IsInt } from 'class-validator';
import { SiteUserRole, SiteUserRoleKey } from '../../users/SiteUserRole.enum';
import { getEnumKeys } from '../../utils/getEnumKeys';
import { IsStringLiteral } from '../../utils/custom-validators';

export class CreateSiteUserParamsDto {
  /**
   * The site id
   * @example 3567
   */
  @Type(() => Number)
  @IsInt()
  site_id!: number;
}

const siteUserRoleKeys = getEnumKeys(SiteUserRole);

export class CreateSiteUserBodyDto {
  @IsEmail()
  email!: string;

  @IsEmail()
  email_confirmation!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsStringLiteral(siteUserRoleKeys, { each: true })
  @ApiProperty({
    description: 'Roles to assign the user for the site.',
    enum: siteUserRoleKeys,
    isArray: true,
    minItems: 1,
  })
  roles!: SiteUserRoleKey[];
}

export class CreateSiteUserResponseDto {
  id!: number;
  created_at!: Date;
  updated_at!: Date;
  @ApiProperty({
    enum: siteUserRoleKeys,
    isArray: true,
  })
  roles!: SiteUserRoleKey[];
  site_id!: number | null;
  user_id!: number | null;
}
