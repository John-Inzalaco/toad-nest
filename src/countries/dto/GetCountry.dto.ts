import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class GetCountryParamsDto {
  /**
   * Country id
   * @example 6
   */
  @Type(() => Number)
  @IsInt()
  id!: number;
}

class CountryDto {
  /**
   * ISO Alpha-2 country code
   * @example "US"
   */
  code!: string | null;
  /**
   * id of the country
   * @example 6
   */
  id!: number;
  /**
   * English name of the country
   * @example "United States"
   */
  name!: string | null;
}

export class GetCountryResponseDto {
  readonly country!: CountryDto;
}
