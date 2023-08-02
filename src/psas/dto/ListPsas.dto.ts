/**
 * An ad category which publishers can opt out of
 */
class PsasDto {
  /**
   * PSA id
   * @example 1
   */
  id!: number;
  /**
   * PSAs title
   * @example "Dave Thomas Foundation For Adoption"
   */
  title!: string | null;
  /**
   * PSAs slug
   * @example "dtfa"
   */
  slug!: string | null;
  /**
   * PSAs Google Ad Manager Key
   * @example "18"
   */
  gam_key!: string | null;
  /**
   * PSAs description
   * @example "The Dave Thomas Foundation for Adoption is the only public nonprofit charity in the United States that is focused exclusively on foster care adoption. We have a foster care crisis in the United States. Opting into this PSA will help drive awareness to the crisis, and ways to help."
   */
  description!: string | null;
}

export class ListPsasResponseDto {
  readonly psas!: PsasDto[];
}
