import { Injectable, Logger } from '@nestjs/common';
import { FastlyClient } from './fastlyClient';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../environment';

@Injectable()
export class CDNService {
  private readonly purgingEnabled: boolean = false;
  private readonly cdnClient: FastlyClient;
  private readonly logger = new Logger(CDNService.name);
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {
    const serviceId = encodeURIComponent(
      this.configService.getOrThrow('FASTLY_SERVICE_ID'),
    );
    const apiKey = encodeURIComponent(
      this.configService.getOrThrow('FASTLY_API_KEY'),
    );

    this.cdnClient = new FastlyClient(serviceId, apiKey);

    if (configService.get('NODE_ENV') === 'production') {
      this.purgingEnabled = true;
    }
  }

  async softPurgeKey({ key }: { key: string }): Promise<unknown> {
    if (this.purgingEnabled) {
      return this.cdnClient.purgeKey({ key });
    }

    this.logger.log(
      `CDN Purge request made for ${key} but ignored in current ENV: ${this.configService.get(
        'NODE_ENV',
      )}`,
    );

    return { success: false };
  }
}
