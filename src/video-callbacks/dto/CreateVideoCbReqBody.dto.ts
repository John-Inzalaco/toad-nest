import { IsString, IsNumber } from 'class-validator';
import { VideoCallbackPayload } from '../../mediaCloud/mediaCloud.service';

export class CreateVideoCbReqBodyDto implements VideoCallbackPayload {
  /** Equivalent to video.slug */
  @IsString()
  public_id!: string;
  @IsNumber()
  version!: number;
  @IsNumber()
  width!: number;
  @IsNumber()
  height!: number;
  @IsString()
  format!: string;
  @IsString()
  resource_type!: string;
  @IsString()
  created_at!: string;
  @IsNumber()
  bytes!: number;
  @IsString()
  notification_type!: string;
  @IsString()
  url!: string;
  @IsString()
  secure_url!: string;
}
