import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { GetPayeeParamsDto, GetPayeeResponseDto } from './dto/GetPayee.dto';
import { PayeesService } from './payees.service';
import { Request } from 'express';
import { PermissionsService } from '../permissions/permissions.service';
import {
  CreatePayeeBodyDto,
  CreatePayeeParamsDto,
} from './dto/CreatePayee.dto';
import {
  GetExistingPayeesParamsDto,
  GetExistingPayeesResponseDto,
} from './dto/GetExistingPayees.dto';
import { ConfirmPayeeNameParamsDto } from './dto/ConfirmPayeeName.dto';
import { ConfirmPayeeParamsDto } from './dto/ConfirmPayee.dto';
import {
  ChoosePayeeBodyDto,
  ChoosePayeeParamsDto,
} from './dto/ChoosePayee.dto';

@ApiBearerAuth()
@ApiTags('Payees')
@Controller('api/v1/sites/:site_id/site_settings/payees')
export class PayeesController {
  constructor(
    private payeesService: PayeesService,
    private permissionsService: PermissionsService,
  ) {}

  /**
   * Returns the payee for a site
   */
  @Get()
  @ApiNotFoundResponse({ description: 'Site not found' })
  async getPayee(
    @Param() params: GetPayeeParamsDto,
    @Req() req: Request,
  ): Promise<GetPayeeResponseDto> {
    await this.permissionsService.assertCanManagePayees(params.site_id);
    return this.payeesService.getSitePayeeSettings(
      params.site_id,
      req.headers.referer || `${req.protocol}://${req.hostname}`,
    );
  }

  /**
   * Creates a new payee and associates it with a site
   */
  @Post()
  @ApiNotFoundResponse({ description: 'Site not found' })
  @ApiUnprocessableEntityResponse({
    description:
      'Payee cannot be created for a site (potentially because it is a test_site)',
  })
  async createPayee(
    @Param() params: CreatePayeeParamsDto,
    @Body() body: CreatePayeeBodyDto,
    @Req() req: Request,
  ): Promise<GetPayeeResponseDto> {
    await this.permissionsService.assertCanManagePayees(params.site_id);
    await this.payeesService.createPayeeForSite({
      siteId: params.site_id,
      name: body.name,
    });
    return this.payeesService.getSitePayeeSettings(
      params.site_id,
      req.headers.referer || `${req.protocol}://${req.hostname}`,
    );
  }

  /**
   * Returns a list of payees associated with sites the user has access to
   */
  @Get('existing_payees')
  @ApiNotFoundResponse({ description: 'Site not found' })
  async getExistingPayees(
    @Param() params: GetExistingPayeesParamsDto,
    @Req() req: Request,
  ): Promise<GetExistingPayeesResponseDto> {
    await this.permissionsService.assertCanManagePayees(params.site_id);
    if (!req.user) {
      throw new Error('User not found');
    }
    const payees = await this.payeesService.getExistingPayees(req.user);
    return { payees };
  }

  /**
   * Sets payee_name_updated on the site to true
   */
  @Patch('confirm_payee_name')
  @ApiNotFoundResponse({ description: 'Site not found' })
  async confirmPayeeName(
    @Param() params: ConfirmPayeeNameParamsDto,
    @Req() req: Request,
  ): Promise<GetPayeeResponseDto> {
    await this.permissionsService.assertCanManagePayees(params.site_id);
    await this.payeesService.confirmPayeeName(params.site_id);
    return this.payeesService.getSitePayeeSettings(
      params.site_id,
      req.headers.referer || `${req.protocol}://${req.hostname}`,
    );
  }

  /**
   * Sets tipalti_completed to true on the payee
   */
  @Patch('confirm')
  @ApiNotFoundResponse({ description: 'Site not found' })
  @ApiUnprocessableEntityResponse({ description: 'Site has no payee' })
  async confirmPayee(
    @Param() params: ConfirmPayeeParamsDto,
    @Req() req: Request,
  ): Promise<GetPayeeResponseDto> {
    await this.permissionsService.assertCanManagePayees(params.site_id);
    await this.payeesService.confirmPayee(params.site_id);
    return this.payeesService.getSitePayeeSettings(
      params.site_id,
      req.headers.referer || `${req.protocol}://${req.hostname}`,
    );
  }

  /**
   * Choose an existing payee for a site
   */
  @Patch('choose')
  @ApiNotFoundResponse({ description: 'Site or payee not found' })
  async choosePayee(
    @Param() params: ChoosePayeeParamsDto,
    @Body() body: ChoosePayeeBodyDto,
    @Req() req: Request,
  ): Promise<GetPayeeResponseDto> {
    if (!req.user) {
      throw new UnauthorizedException();
    }
    await this.permissionsService.assertCanManagePayees(params.site_id);
    await this.payeesService.choosePayee({
      siteId: params.site_id,
      payeeId: body.payee_id,
      currentUser: req.user,
    });
    return this.payeesService.getSitePayeeSettings(
      params.site_id,
      req.headers.referer || `${req.protocol}://${req.hostname}`,
    );
  }
}
