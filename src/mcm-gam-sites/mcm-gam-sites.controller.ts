import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import {
  GetMcmGamSiteParamsDto,
  GetMcmGamSiteResponseDto,
} from './dto/GetMcmGamSite.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { McmGamSitesService } from './mcm-gam-sites.service';
import { PermissionsService } from '../permissions/permissions.service';

@ApiBearerAuth()
@ApiTags('MCM GAM Sites')
@Controller('api/v1/mcm_gam_sites')
export class McmGamSitesController {
  constructor(
    private readonly mcmGamSitesService: McmGamSitesService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get(':id')
  @ApiNotFoundResponse({ description: 'Site not found' })
  @ApiBadRequestResponse({ description: 'Invalid site id' })
  async findOne(
    @Param() params: GetMcmGamSiteParamsDto,
  ): Promise<GetMcmGamSiteResponseDto> {
    this.permissionsService.assertNoPermissionPolicy();
    const gamSite = await this.mcmGamSitesService.findById(params.id);
    if (!gamSite) {
      throw new NotFoundException('Not Found');
    }
    return {
      mcm_gam_site: {
        id: gamSite.id,
        status: gamSite.status,
        mcm_child_publisher: {
          id: gamSite.mcm_child_publishers?.id,
          status: gamSite.mcm_child_publishers?.status,
        },
      },
    };
  }
}
