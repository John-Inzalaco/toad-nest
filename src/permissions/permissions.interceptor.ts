import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { permissionsMetadataKey } from './constants';
import { Request } from 'express';

@Injectable()
export class PermissionsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap(() => {
        const http = context.switchToHttp();
        const request: Request = http.getRequest();
        const permissionsSet = request[permissionsMetadataKey];

        if (!permissionsSet) {
          const route = request.route.path;
          http
            .getResponse()
            .status(500)
            .send(
              JSON.stringify({
                message: `Permissions have not been set for this route : ${route}`,
              }),
            );

          throw new Error(
            `Permissions have not been set for this route: ${route}`,
          );
        }
      }),
    );
  }
}
