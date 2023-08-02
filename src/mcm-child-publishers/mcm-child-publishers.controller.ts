import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
} from '@nestjs/common';
import {
  DASHBOARD_DB_CLIENT_TOKEN,
  DashboardDbService,
} from '../db/dashboardDb.service';
import {
  GetMcmChildPublisherParamsDto,
  GetMcmChildPublisherResponseDto,
} from './dto/GetMcmChildPublisher.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionsService } from '../permissions/permissions.service';

@ApiBearerAuth()
@ApiTags('MCM Child Publishers')
@Controller('api/v1/mcm_child_publishers')
export class McmChildPublishersController {
  constructor(
    @Inject(DASHBOARD_DB_CLIENT_TOKEN)
    private readonly dashboardDbService: DashboardDbService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Get(':id')
  @ApiNotFoundResponse({ description: 'Site not found' })
  @ApiBadRequestResponse({ description: 'Invalid site id' })
  async findOne(
    @Param() params: GetMcmChildPublisherParamsDto,
  ): Promise<GetMcmChildPublisherResponseDto> {
    this.permissionsService.assertNoPermissionPolicy();
    const childPublisher =
      await this.dashboardDbService.mcm_child_publishers.findUnique({
        select: { id: true, business_domain: true, business_name: true },
        where: { id: params.id },
      });
    if (!childPublisher) {
      throw new NotFoundException();
    }
    return { mcm_child_publisher: childPublisher };
  }
}
