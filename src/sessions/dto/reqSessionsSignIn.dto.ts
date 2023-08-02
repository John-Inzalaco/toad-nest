import { IsString } from 'class-validator';

export class ReqSessionsSignInDto {
  @IsString()
  email!: string;
  @IsString()
  password!: string;
}
