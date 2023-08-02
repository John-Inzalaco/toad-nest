import { Controller, Get, Param, Query } from '@nestjs/common';
import { SitesService } from './sites.service';
import { GetSiteParamsDto, GetSiteResponseDto } from './dto/GetSite.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionsService } from '../permissions/permissions.service';
import { MCPHasAccess, PDSHasAccess } from '../auth/auth.guard';
import {
  GenerateSignatureParamsDto,
  GenerateSignatureQueryDto,
  GenerateSignatureResponseDto,
} from './dto/GenerateSignature.dto';

@ApiBearerAuth()
@ApiTags('Sites')
@Controller('api/v1/sites')
export class SitesController {
  constructor(
    private readonly sitesService: SitesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  /**
   * WIP: Placeholder for auth logic
   */
  @Get()
  @MCPHasAccess()
  async findAll() {
    return [];
  }

  /**
   * Get a site by id
   */
  @Get(':id')
  @PDSHasAccess()
  @ApiNotFoundResponse({ description: 'Site not found' })
  @ApiBadRequestResponse({ description: 'Invalid site id' })
  async findOne(
    @Param() params: GetSiteParamsDto,
  ): Promise<GetSiteResponseDto> {
    const { showReportData } =
      await this.permissionsService.assertCanAccessSite(params.id);
    return this.sitesService.findOne({ siteId: params.id, showReportData });
  }

  /**
   * WIP: Placeholder for auth logic
   */
  @Get('light_search')
  @PDSHasAccess()
  async lightSearch() {
    return {
      sites: [],
      total_count: 0,
    };
  }

  /**
   * Generate a cloudinary signature for uploading media to cloudinary
   */
  @Get('/:site_id/generate_signature')
  @MCPHasAccess()
  generateSignature(
    @Param() params: GenerateSignatureParamsDto,
    @Query() query: GenerateSignatureQueryDto,
  ): Promise<GenerateSignatureResponseDto> {
    this.permissionsService.assertNoPermissionPolicy();
    return this.sitesService.generateSignature({
      resourceType: query.resource_type,
      siteId: params.site_id,
    });
  }
}
