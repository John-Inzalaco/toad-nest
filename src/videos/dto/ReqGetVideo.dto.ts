import { Type } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';

export class ReqGetVideoDto {
  @IsString()
  slug!: string;

  @Type(() => Number)
  @IsInt()
  siteId!: number;
}
