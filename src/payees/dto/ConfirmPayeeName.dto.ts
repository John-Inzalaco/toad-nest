import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class ConfirmPayeeNameParamsDto {
  /**
   * The site id to associate the newly created payee with
   */
  @Type(() => Number)
  @IsInt()
  site_id!: number;
}
