import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class DeleteSiteUserParamsDto {
  @Type(() => Number)
  @IsInt()
  site_id!: number;

  @Type(() => Number)
  @IsInt()
  site_user_id!: number;
}
