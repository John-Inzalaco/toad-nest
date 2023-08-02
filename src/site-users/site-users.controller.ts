import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PDSHasAccess } from '../auth/auth.guard';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  DASHBOARD_DB_CLIENT_TOKEN,
  DashboardDbService,
} from '../db/dashboardDb.service';
import {
  ListSiteUsersParamsDto,
  ListSiteUsersResponseDto,
} from './dto/ListSiteUsers.dto';
import { PermissionsService } from '../permissions/permissions.service';
import {
  CreateSiteUserBodyDto,
  CreateSiteUserParamsDto,
  CreateSiteUserResponseDto,
} from './dto/CreateSiteUser.dto';
import {
  convertSiteUserKeysToMask,
  convertSiteUserRolesToStrings,
} from '../users/rolesUtilities';
import { SiteUsersService } from './site-users.service';
import {
  UpdateSiteUserBodyDto,
  UpdateSiteUserParamsDto,
  UpdateSiteUserResponseDto,
} from './dto/UpdateSiteUser.dto';
import { DeleteSiteUserParamsDto } from './dto/DeleteSiteUser.dto';
import { randomUUID } from 'crypto';

interface ValidateSiteAndSiteUserIdParams {
  siteId: number;
  siteUserId: number;
}

@ApiBearerAuth()
@ApiTags('Site Users')
@Controller('api/v1/sites/:site_id/site_users')
export class SiteUsersController {
  constructor(
    @Inject(DASHBOARD_DB_CLIENT_TOKEN)
    private readonly dashboardDbService: DashboardDbService,
    private readonly permissionsService: PermissionsService,
    private readonly siteUsersService: SiteUsersService,
  ) {}

  /**
   * List the site_users for a site, indicating which users have access to
   * the site and what roles they have for the site.
   */
  @Get()
  @ApiNotFoundResponse({ description: 'Site not found' })
  @ApiBadRequestResponse({ description: 'Site id invalid' })
  @PDSHasAccess()
  async findAll(
    @Param() params: ListSiteUsersParamsDto,
  ): Promise<ListSiteUsersResponseDto> {
    await this.permissionsService.assertCanManageSiteUsers(params.site_id);
    const siteUsers = await this.dashboardDbService.site_users.findMany({
      select: {
        id: true,
        user_id: true,
        site_id: true,
        roles_mask: true,
        users: { select: { email: true } },
      },
      where: { site_id: params.site_id },
    });
    return new ListSiteUsersResponseDto(siteUsers);
  }

  /**
   * Create a site_user for a site/user pair, giving access for
   * the user to access the site with the specifed roles.
   */
  @Post()
  @ApiNotFoundResponse({ description: 'Site not found' })
  @ApiBadRequestResponse({ description: 'Site id invalid' })
  async create(
    @Param() params: CreateSiteUserParamsDto,
    @Body() body: CreateSiteUserBodyDto,
  ): Promise<CreateSiteUserResponseDto> {
    await this.permissionsService.assertCanManageSiteUsers(params.site_id);
    if (body.email !== body.email_confirmation) {
      throw new UnprocessableEntityException({
        email_confirmation: ['email confirmation must match email address'],
      });
    }
    const siteUser = await this.siteUsersService.createSiteUser({
      siteId: params.site_id,
      body,
    });
    return {
      id: siteUser.id,
      created_at: siteUser.created_at,
      updated_at: siteUser.updated_at,
      site_id: siteUser.site_id,
      user_id: siteUser.user_id,
      roles: convertSiteUserRolesToStrings(siteUser.roles_mask),
    };
  }

  /**
   * Create a site_user for a site/user pair, giving access for
   * the user to access the site with the specifed roles.
   */
  @Patch(':site_user_id')
  @ApiNotFoundResponse({ description: 'site_user not found' })
  @ApiBadRequestResponse({ description: 'Request is not valid' })
  async update(
    @Param() params: UpdateSiteUserParamsDto,
    @Body() body: UpdateSiteUserBodyDto,
  ): Promise<UpdateSiteUserResponseDto> {
    await this.validateSiteAndSiteUserId({
      siteId: params.site_id,
      siteUserId: params.site_user_id,
    });
    const siteUser = await this.dashboardDbService.site_users.update({
      where: { id: params.site_user_id },
      data: {
        roles_mask: convertSiteUserKeysToMask(body.roles),
      },
    });
    return {
      id: siteUser.id,
      created_at: siteUser.created_at,
      updated_at: siteUser.updated_at,
      site_id: siteUser.site_id,
      user_id: siteUser.user_id,
      roles: convertSiteUserRolesToStrings(siteUser.roles_mask),
    };
  }

  /**
   * Delete a site_user, removing the ability for the user to access the site.
   */
  @Delete(':site_user_id')
  @HttpCode(204)
  @ApiNotFoundResponse({ description: 'site_user not found' })
  @ApiBadRequestResponse({ description: 'Request is not valid' })
  async destroy(@Param() params: DeleteSiteUserParamsDto): Promise<void> {
    const existingSiteUser = await this.validateSiteAndSiteUserId({
      siteId: params.site_id,
      siteUserId: params.site_user_id,
    });
    await this.dashboardDbService.site_users.delete({
      where: { id: params.site_user_id },
    });
    if (existingSiteUser.user_id) {
      await this.dashboardDbService.users.update({
        where: { id: existingSiteUser.user_id },
        data: { jwt_secret: randomUUID() },
      });
    }
  }

  private async validateSiteAndSiteUserId({
    siteId,
    siteUserId,
  }: ValidateSiteAndSiteUserIdParams) {
    await this.permissionsService.assertCanManageSiteUsers(siteId);
    const existingSiteUser =
      await this.dashboardDbService.site_users.findUnique({
        select: { id: true, site_id: true, user_id: true },
        where: { id: siteUserId },
      });
    if (!existingSiteUser) {
      throw new NotFoundException();
    } else if (existingSiteUser.site_id !== siteId) {
      throw new BadRequestException(
        'site_user_id does not match site_id of corresponding site_user',
      );
    }
    return existingSiteUser;
  }
}
