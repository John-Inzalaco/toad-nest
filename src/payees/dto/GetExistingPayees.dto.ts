import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class GetExistingPayeesParamsDto {
  /**
   * The site id
   */
  @Type(() => Number)
  @IsInt()
  site_id!: number;
}

class ExistingPayeeDto {
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
}

export class GetExistingPayeesResponseDto {
  payees!: ExistingPayeeDto[];
}
