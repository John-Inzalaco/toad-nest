import { NextFunction, Request, Response } from 'express';

export function setCacheControlHeader(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.setHeader('cache-control', 'no-cache');
  next();
}
