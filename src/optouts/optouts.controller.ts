import { Controller, Get } from '@nestjs/common';
import { OptoutsService } from './optouts.service';
import { ListOptoutsResponseDto } from './dto/ListOptouts.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from '../permissions/permissions.service';

@ApiBearerAuth()
@ApiTags('Optouts')
@Controller('/api/v1/optouts')
export class OptoutsController {
  constructor(
    private readonly optoutsService: OptoutsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  /**
   * List all available ad category optouts
   */
  @Get()
  async findAll(): Promise<ListOptoutsResponseDto> {
    this.permissionsService.assertNoPermissionPolicy();
    const optouts = await this.optoutsService.findAll();

    return { optouts };
  }
}
