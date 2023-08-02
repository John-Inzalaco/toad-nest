import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { EnvironmentVariables } from '../environment';
import { videos } from '@prisma/dashboard';
import { createHash } from 'crypto';
import { IsNumber, IsString } from 'class-validator';

interface GenerateSignatureParams {
  resourceType?: string;
  siteOfferingId: number | null;
}

@Injectable()
export class MediaCloudService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  removeTag(publicId: string): Promise<void> {
    return new Promise(async (res, rej) => {
      await cloudinary.uploader.remove_tag('temp', [publicId], res).catch(rej);
    });
  }

  explicitTransform(slug: string) {
    return cloudinary.uploader.explicit(slug, {
      type: 'upload',
      resource_type: 'video',
      eager: [
        { format: 'm3u8', streaming_profile: 'video_hd_h265' },
        { format: 'mpd', streaming_profile: 'video_hd_vp9' },
        { format: 'm3u8', streaming_profile: 'video_hd_h264' },
        { format: 'm3u8', streaming_profile: 'hd' },
        { transformation: 'original', format: 'mp4' },
      ],
      eager_async: true,
      eager_notification_url: this.configService.get(
        'CLOUDINARY_NOTIFICATION_URL',
      ),
    });
  }

  generateScreenshotUrl({
    domain,
    screenshotTimestamp,
  }: CloudinaryScreenshotUrlParams): string | null {
    if (!domain) {
      return null;
    }
    return cloudinary.url(
      `http://${domain}/${encodeURIComponent(
        `?t=${screenshotTimestamp || ''}&test=killswitch`,
      )}/url2png/fullpage=false|thumbnail_max_width=600|viewport=1200x800`,
      {
        type: 'url2png',
        width: 600,
        height: 400,
        crop: 'fill',
        gravity: 'north',
        sign_url: true,
      },
    );
  }

  generateSignature({ resourceType, siteOfferingId }: GenerateSignatureParams) {
    const apiSecret = cloudinary.config()?.api_secret;
    if (!apiSecret) {
      throw new Error("cloudinary api_secret isn't set");
    }
    const params = {
      timestamp: Math.floor(Date.now() / 1000),
      ...(resourceType === 'video'
        ? {
            source: 'uw',
            upload_preset:
              siteOfferingId === 2
                ? 'pubnation_video_transformation'
                : 'video_transformation',
            tags: 'temp',
          }
        : {
            tags: 'temp',
            image_metadata: true,
          }),
    };
    const signature = cloudinary.utils.api_sign_request(params, apiSecret);
    return { ...params, signature };
  }

  getImageUrl(path?: string | null): string | null {
    if (!path) {
      return null;
    }
    return `https://mediavine-res.cloudinary.com/${path}.jpg`;
  }

  generateThumbnailPath(
    video: Partial<Pick<videos, 'image' | 'file'>> | null,
    options: GenerateThumbnailOptions = {},
  ) {
    if (!video || (!video.image && !video.file)) {
      return '';
    }
    options.format ||= 'jpg';
    options.fetch_format ||= 'auto';
    options.quality ||= 'auto';
    options.flags ||= 'lossy';
    options.width ||= 1920;
    options.height ||= 1080;
    options.crop ||= 'limit';
    options.resource_type = video.image ? options.resource_type : 'video';
    options.sign_url = true;
    return cloudinary.utils.video_thumbnail_url(
      video.image || video.file || '',
      options,
    );
  }

  validateSignature({
    headers,
    payload,
  }: {
    headers: CloudinaryHeaders;
    payload: VideoCallbackPayload;
  }): boolean {
    return (
      headers['x-cld-signature'] ===
      generateCloudinarySignature({ headers, payload })
    );
  }
}

interface CloudinaryScreenshotUrlParams {
  domain?: string | null;
  screenshotTimestamp: number | null | undefined;
}

interface GenerateThumbnailOptions {
  format?: 'jpg';
  fetch_format?: string;
  quality?: string;
  gravity?: string;
  flags?: string;
  width?: number;
  height?: number;
  crop?: string;
  resource_type?: string;
  sign_url?: boolean;
}

export function generateCloudinarySignature({
  payload,
  headers,
}: {
  payload: VideoCallbackPayload;
  headers: CloudinaryHeaders;
}) {
  const timestamp = headers['x-cld-timestamp'];
  const secret = cloudinary.config().api_secret as string;
  const signRequest = createHash('sha1')
    .update(JSON.stringify(payload) + timestamp + secret)
    .digest('hex');

  return signRequest;
}

export class VideoCallbackPayload {
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

export class CloudinaryHeaders {
  'x-cld-timestamp'!: string;
  'x-cld-signature'!: string;
}
