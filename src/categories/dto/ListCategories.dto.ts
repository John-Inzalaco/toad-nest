/**
 * An ad category. A publisher can designate an ad catgory most relevant to their site.
 */
class CategoryDto {
  /**
   * Category id
   * @example 1
   */
  id!: number;
  /**
   * Category title
   * @example "Arts & Entertainment"
   */
  title!: string | null;
  /**
   * Category slug
   * @example "arts-and-entertainment"
   */
  slug!: string | null;
}

export class ListCategoriesResponseDto {
  readonly categories!: CategoryDto[];
}
