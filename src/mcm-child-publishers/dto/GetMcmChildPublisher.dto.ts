import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class GetMcmChildPublisherParamsDto {
  /**
   * The MCM Child Publisher id
   * @example 3567
   */
  @Type(() => Number)
  @IsInt()
  id!: number;
}

/**
 * Information about an MCM Child Publisher. See https://support.google.com/admanager/answer/11130475?sjid=14529796708747083932-NA
 */
export class McmChildPublisherDto {
  /**
   * The MCM Child Publisher id
   * @example 3567
   */
  id!: number;
  /**
   * The domain of the publisher's site from MCM
   * @example The Culinary Compass
   */
  business_domain?: string | null;
  /**
   * The name of the publisher's business from MCM
   * @example The Culinary Compass
   */
  business_name?: string | null;
}

export class GetMcmChildPublisherResponseDto {
  mcm_child_publisher!: McmChildPublisherDto;
}
