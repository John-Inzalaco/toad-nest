import { CloudinaryHeaders } from '../../mediaCloud/mediaCloud.service';

export class CreateVideoCbReqHeadersDto implements CloudinaryHeaders {
  /**
   * Timestamp of when signature was generated. Ensures signature is unique.
   */
  'x-cld-timestamp'!: string;
  /**
   * Signature created with our API secret from Cloudinary. Ensures request is from Cloudinary.
   */
  'x-cld-signature'!: string;
}
