import { Body, Controller, HttpException, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { ResSessionsSignInDto } from './dto/resSessionsSignIn.dto';
import { ReqSessionsSignInDto } from './dto/reqSessionsSignIn.dto';
import { SkipAuth } from '../auth/auth.guard';
import { PermissionsService } from '../permissions/permissions.service';

@SkipAuth()
@ApiBearerAuth()
@ApiTags('Sessions')
@Controller('api/v1/users')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly permissionsService: PermissionsService,
  ) {}

  @Post('sign_in')
  async signIn(
    @Body() { email, password }: ReqSessionsSignInDto,
  ): Promise<ResSessionsSignInDto> {
    this.permissionsService.assertNoPermissionPolicy();
    if (!email || !password) {
      throw new HttpException({ error: 'invalid_credentials' }, 401);
    }
    const validUser = await this.sessionsService.getValidatedUser(
      email,
      password,
    );
    if (!validUser) {
      throw new HttpException({ error: 'invalid_credentials' }, 401);
    }

    return this.sessionsService.createSessionDto(validUser);
  }
}
