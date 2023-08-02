import { createHmac } from 'crypto';

export const hashEmailForIntercom = (email: string) =>
  createHmac('sha256', process.env.INTERCOM_SECRET || '')
    .update(email)
    .digest('hex');
