import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class ConfirmPayeeParamsDto {
  /**
   * The site id to associate the newly created payee with
   */
  @Type(() => Number)
  @IsInt()
  site_id!: number;
}
