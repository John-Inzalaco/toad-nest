import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class GetMcmGamSiteParamsDto {
  /**
   * The MCM GAM Site ID
   * @example 3567
   */
  @Type(() => Number)
  @IsInt()
  id!: number;
}

class GetMcmChildPublisherCondensedDto {
  /**
   * The MCM Child Publisher id
   * @example 7180
   */
  id!: number | undefined;
  /**
   * Status
   * @example approved
   */
  status!: string | null | undefined;
}

class GetMcmGamSiteCondensedDto {
  /**
   * The MCM Child Publisher id
   * @example 8225
   */
  id!: number;
  /**
   * Status
   * @example approved
   */
  status!: string | null | undefined;
  mcm_child_publisher!: GetMcmChildPublisherCondensedDto;
}

export class GetMcmGamSiteResponseDto {
  mcm_gam_site!: GetMcmGamSiteCondensedDto;
}
