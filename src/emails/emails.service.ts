import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../environment';
import { getEmailTemplate } from './compiled';

interface SendInviteExistingUserToSiteEmailParams {
  email: string;
  siteTitle: string;
}

interface SendInviteNewUserToSiteEmailParams {
  email: string;
  invitationTokenRaw: string;
  siteTitle: string;
}

interface SendEmailParams {
  html: string;
  subject: string;
  to: { email: string; name?: string | null };
}

@Injectable()
export class EmailsService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  async sendInviteExistingUserToSiteEmail({
    email,
    siteTitle,
  }: SendInviteExistingUserToSiteEmailParams) {
    const template = getEmailTemplate('InviteExistingUserToSite.hbs');
    const MAIL_HOST = this.configService.getOrThrow('MAIL_HOST', {
      infer: true,
    });
    const MAIL_PROTOCOL =
      this.configService.get('MAIL_PROTOCOL', { infer: true }) || 'https';
    const html = template({
      appRootUrl: `${MAIL_PROTOCOL}://${MAIL_HOST}`,
      email,
      siteTitle,
    });
    return this.sendEmail({
      html,
      subject: `You've been given access to ${siteTitle} in the Mediavine Dashboard.`,
      to: { email },
    });
  }

  async sendInviteNewUserToSiteEmail({
    email,
    invitationTokenRaw,
    siteTitle,
  }: SendInviteNewUserToSiteEmailParams) {
    const template = getEmailTemplate('InviteNewUserToSite.hbs');
    const MAIL_HOST = this.configService.getOrThrow('MAIL_HOST', {
      infer: true,
    });
    const MAIL_PROTOCOL =
      this.configService.get('MAIL_PROTOCOL', { infer: true }) || 'https';
    const html = template({
      email,
      invitationUrl: `${MAIL_PROTOCOL}://${MAIL_HOST}/users/invitation/accept?invitation_token=${invitationTokenRaw}`,
      siteTitle,
    });
    return this.sendEmail({
      html,
      subject: `${siteTitle} has invited you to their Mediavine Dashboard! Instructions inside!`,
      to: { email },
    });
  }

  private async sendEmail({ html, subject, to }: SendEmailParams) {
    const resp = await fetch('https://mandrillapp.com/api/1.0/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: this.configService.getOrThrow('MANDRILL_PASSWORD'),
        message: {
          html,
          auto_text: true,
          subject,
          from_email: 'publishers@mediavine.com',
          to: [to],
        },
      }),
    });
    if (!resp.ok) {
      throw new Error(`Sending email failed with status ${resp.status}`);
    }
    return resp;
  }
}
