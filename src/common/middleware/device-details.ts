import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils';

export const deviceDetailsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    'x-device-name': deviceName,
    'x-device-location': deviceLocation,
    'x-forwarded-for': forwardedFor,
  } = req.headers;

  if (!deviceName) {
    next(
      new AppError({
        statusCode: 422,
        message:
          'Please provide x-device-name and x-device-location in headers',
      })
    );
  } else {
    req.headers['x-device-name'] = deviceName as string;
    req.headers['x-device-location'] = (deviceLocation ||
      forwardedFor ||
      'unknown') as string;

    next();
  }
};
