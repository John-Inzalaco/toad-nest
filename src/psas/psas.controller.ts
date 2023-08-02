import { Controller, Get } from '@nestjs/common';
import { PsasService } from './psas.service';
import { ListPsasResponseDto } from './dto/ListPsas.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from '../permissions/permissions.service';

@ApiBearerAuth()
@ApiTags('PSAs')
@Controller('/api/v1/psas')
export class PsasController {
  constructor(
    private readonly psasService: PsasService,
    private readonly permissionsService: PermissionsService,
  ) {}

  /**
   * List all available Public Service Announcements (PSAs)
   */
  @Get()
  async findAll(): Promise<ListPsasResponseDto> {
    this.permissionsService.assertNoPermissionPolicy();
    const psas = await this.psasService.findAll();
    return { psas };
  }
}
