import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  CloudinaryHeaders,
  MediaCloudService,
  VideoCallbackPayload,
} from '../mediaCloud/mediaCloud.service';
import {
  DASHBOARD_DB_CLIENT_TOKEN,
  DashboardDbService,
} from '../db/dashboardDb.service';
import { VideoStatus } from '../videos/enum/VideoStatus.enum';

@Injectable()
export class VideoCallbacksService {
  constructor(
    @Inject(DASHBOARD_DB_CLIENT_TOKEN)
    private readonly dashboardDbService: DashboardDbService,
    private readonly mediaCloudService: MediaCloudService,
  ) {}

  /**
   * Requests from Cloudinary to this endpoint will be signed with a SHA-1 hash
   */
  async createCallback({
    payload,
    headers,
  }: {
    payload: VideoCallbackPayload;
    headers: CloudinaryHeaders;
  }) {
    if (!this.mediaCloudService.validateSignature({ payload, headers })) {
      throw new UnauthorizedException('INVALID Signature');
    }

    if (payload.notification_type !== 'eager') {
      return;
    }

    const { public_id: slug } = payload;
    const video = await this.dashboardDbService.videos.findFirst({
      where: { slug },
    });

    if (video === null) {
      await this.dashboardDbService.video_callbacks.create({
        data: {
          slug,
          response: JSON.stringify(payload),
        },
      });

      return 'in progress, status: processing';
    }

    if (video.status === VideoStatus.deleted) {
      return 'will not process, status: deleted';
    }

    await this.mediaCloudService.removeTag(slug);
    return `complete ${video.title}, status: live`;
  }
}
