/**
 * An ad category which publishers can opt out of
 */
class OptoutDto {
  /**
   * Optout id
   * @example 1
   */
  id!: number;
  /**
   * Optout title
   * @example "Meat & Poultry"
   */
  title!: string | null;
  /**
   * Optout description
   * @example "Beef, pork, poultry and other meats."
   */
  description!: string | null;
  /**
   * Optout slug
   * @example "meat"
   */
  slug!: string | null;
}

export class ListOptoutsResponseDto {
  readonly optouts!: OptoutDto[];
}
