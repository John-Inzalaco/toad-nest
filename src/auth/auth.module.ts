import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
    }),
    UsersModule,
  ],
  providers: [{ provide: 'APP_GUARD', useClass: AuthGuard }],
})
export class AuthModule {}
