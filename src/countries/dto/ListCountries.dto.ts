import { IsOptional, IsString } from 'class-validator';

export class ListCountriesQueryDto {
  /**
   * Filter to a single country by name (exact match)
   */
  @IsString()
  @IsOptional()
  name?: string;
  /**
   * Filter to a single country by code (exact match)
   */
  @IsString()
  @IsOptional()
  code?: string;
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

export class ListCountriesResponseDto {
  readonly country!: CountryDto[];
}
