import { Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  GetProfileSettingsParamsDto,
  GetProfileSettingsResponseDto,
} from './dto/GetProfileSetings.dto';
import { PermissionsService } from '../permissions/permissions.service';
import { SiteSettingsService } from './site-settings.service';
import {
  UpdateProfileSettingsReqBodyDto,
  UpdateProfileSettingsParamsDto,
} from './dto/UpdateProfileSettings.dto';
import { Request } from 'express';

@ApiBearerAuth()
@ApiTags('Site Settings')
@Controller('api/v1/sites/:site_id/site_settings')
export class SiteSettingsController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly siteSettingsService: SiteSettingsService,
  ) {}

  /**
   * Get Profile Settings
   */
  @Get('profile_settings')
  async getProfileSettings(
    @Param() params: GetProfileSettingsParamsDto,
  ): Promise<GetProfileSettingsResponseDto> {
    await this.permissionsService.assertCanManageSiteSettings(params.site_id);
    const profileSettings = await this.siteSettingsService.getProfileSettings(
      params.site_id,
    );
    return { site: profileSettings };
  }

  /**
   * Update Profile Settings
   */
  @Patch('profile_settings')
  async updateProfileSettings(
    @Param() params: UpdateProfileSettingsParamsDto,
    @Body() body: UpdateProfileSettingsReqBodyDto,
    @Req() req: Request,
  ): Promise<GetProfileSettingsResponseDto> {
    await this.permissionsService.assertCanManageSiteSettings(params.site_id);
    await this.siteSettingsService.updateProfileSettings({
      siteId: params.site_id,
      body,
      reqUser: req.user,
    });
    const profileSettings = await this.siteSettingsService.getProfileSettings(
      params.site_id,
    );
    return { site: profileSettings };
  }
}
