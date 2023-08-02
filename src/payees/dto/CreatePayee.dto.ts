import { Type } from 'class-transformer';
import { IsInt, IsString, Length } from 'class-validator';

export class CreatePayeeParamsDto {
  /**
   * The site id to associate the newly created payee with
   */
  @Type(() => Number)
  @IsInt()
  site_id!: number;
}

export class CreatePayeeBodyDto {
  @IsString()
  @Length(1)
  name!: string;
}
