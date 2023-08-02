import { Request } from 'express';

export function getRequestIp(req: Request) {
  const xForwardedFor = req.headers['x-forwarded-for'];
  const xForwardedForString = Array.isArray(xForwardedFor)
    ? xForwardedFor[0]
    : xForwardedFor;
  const ipAddress = xForwardedForString?.split(',')[0] ?? null;
  return ipAddress;
}
