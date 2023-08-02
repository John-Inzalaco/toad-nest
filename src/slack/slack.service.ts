import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../environment';
import { Logger } from '@nestjs/common';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);

  constructor(private configService: ConfigService<EnvironmentVariables>) {}

  async sendSlackMessage(url: string, text: string) {
    if (this.configService.get<string>('NODE_ENV') !== 'production') {
      return;
    }
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
        }),
      });
      if (!resp.ok) {
        throw new Error(`Slack message failed with status ${resp.status}`);
      }
    } catch (e) {
      this.logger.error({ error: e }, 'SLACK_MESSAGE_ERROR');
    }
  }

  async sendProAcceptedMessage(siteTitle: string | null) {
    const proSlackUrl = this.configService.get<string>('PRO_SLACK_TOKEN');
    if (!proSlackUrl) {
      return;
    }
    return this.sendSlackMessage(
      proSlackUrl,
      `${siteTitle} has accepted their pro invite!`,
    );
  }

  async sendPremiereAcceptedMessage(siteTitle: string | null) {
    const premiereSlackUrl = this.configService.get<string>(
      'PREMIERE_SLACK_TOKEN',
    );
    if (!premiereSlackUrl) {
      return;
    }
    return this.sendSlackMessage(
      premiereSlackUrl,
      `${siteTitle} has accepted their premiere invite!`,
    );
  }
}
