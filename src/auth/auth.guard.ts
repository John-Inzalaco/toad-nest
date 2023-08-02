import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../environment';
import isKeyOfObject from '../utils/isKeyOfObject';
import { Reflector } from '@nestjs/core';
import { hasAllRoles } from '../users/rolesUtilities';
import { UserRole } from '../users/UserRole.enum';

/**
 * Can be used to bypass authentication for a route. The route will be publicly accessible.
 */
const SKIP_AUTH_KEY = 'skipAuth';
export const SkipAuth = () => SetMetadata(SKIP_AUTH_KEY, true);

/**
 * PDS: Product Data Sync. https://github.com/mediavine/product-data-sync
 */
const PDS_KEY = 'pdsHasAccess';
/**
 * This decorator can be used to give PDS access to a route.
 * The PDS token cannot access any route other than these ones explicitly marked with this decorator.
 */
export const PDSHasAccess = () => SetMetadata(PDS_KEY, true);

/**
 * MCP Mediavine Control Panel https://github.com/mediavine/mediavine-control-panel
 */
const MCP_KEY = 'mcpHasAccess';
/**
 * This decorator can be used to give MCP access to a route.
 * An MCP token cannot access any route other than these ones explicitly marked with this decorator.
 */
export const MCPHasAccess = () => SetMetadata(MCP_KEY, true);

const CLIENT_APPLICATION_ID_TO_AUTH_KEY = {
  mcp: MCP_KEY,
  pds: PDS_KEY,
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private configService: ConfigService<EnvironmentVariables>,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const shouldSkipAuth = this.reflector.getAllAndOverride<boolean>(
      SKIP_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (shouldSkipAuth) {
      return true;
    }
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow('DEVISE_JWT_SECRET_KEY'),
        algorithms: ['HS256'],
        clockTolerance: 10,
      });
      const userId = payload.user_id;
      const clientApplicationId = payload.client_application_id;
      if (typeof userId !== 'number') {
        throw new UnauthorizedException();
      }
      if (
        typeof clientApplicationId === 'string' &&
        isKeyOfObject(clientApplicationId, CLIENT_APPLICATION_ID_TO_AUTH_KEY)
      ) {
        const hasAccess = this.reflector.getAllAndOverride<boolean>(
          CLIENT_APPLICATION_ID_TO_AUTH_KEY[clientApplicationId],
          [context.getHandler(), context.getClass()],
        );
        if (!hasAccess) {
          throw new UnauthorizedException();
        }
      }
      const user = await this.usersService.findOne({ id: userId });
      if (
        !user ||
        (user.jwt_secret !== payload.jwt_secret &&
          clientApplicationId !== 'mcp')
      ) {
        throw new UnauthorizedException();
      }
      request['user'] = {
        ...user,
        isAdmin: hasAllRoles(user.roles_mask, [UserRole.admin]),
      };
    } catch (e) {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
