import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class GetPayeeParamsDto {
  /**
   * The site id
   */
  @Type(() => Number)
  @IsInt()
  site_id!: number;
}

class PayeeFramesDto {
  /**
   * HTML iframe for Tipalti history page
   */
  history!: string | null;
  /**
   * HTML iframe for Tipalti profile page
   */
  edit_profile!: string | null;
}

class PayeeDto {
  id!: number;
  name!: string | null;
  /**
   * Tracks if the payee has been confirmed for the site
   */
  tipalti_completed!: boolean | null;
  /**
   * Payee uuid, generated at creation time
   */
  uuid!: string | null;
  created_at!: Date;
  updated_at!: Date;
}

class GetPayeeResponseSiteDto {
  frames!: PayeeFramesDto;
  /**
   * Has a site user confirmed their payee name
   */
  payee_name_updated!: boolean | null;
  payee!: PayeeDto | null;
  site!: number;
}

export class GetPayeeResponseDto {
  site!: GetPayeeResponseSiteDto;
}
