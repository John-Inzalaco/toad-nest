import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class ChoosePayeeParamsDto {
  /**
   * The site id to associate the existing payee with
   */
  @Type(() => Number)
  @IsInt()
  site_id!: number;
}

export class ChoosePayeeBodyDto {
  /**
   * The payee id to associate with the site
   */
  @Type(() => Number)
  @IsInt()
  payee_id!: number;
}
