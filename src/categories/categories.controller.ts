import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ListCategoriesResponseDto } from './dto/ListCategories.dto';
import { PermissionsService } from '../permissions/permissions.service';

@ApiBearerAuth()
@ApiTags('Categories')
@Controller('/api/v1/categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  /**
   * List all available ad categories for a site's primary category
   */
  @Get()
  async findAll(): Promise<ListCategoriesResponseDto> {
    this.permissionsService.assertNoPermissionPolicy();
    const categories = await this.categoriesService.findAll();
    return { categories };
  }
}
