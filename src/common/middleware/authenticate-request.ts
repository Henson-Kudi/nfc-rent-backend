import { JwtType } from '@/types/global';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils';
import { ResponseCodes } from '../enums';
import tokenManager from '../jwt';

export default function authenticateRequest(
  tokenType: JwtType = 'ACCESS_TOKEN'
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      let token = req.headers.authorization;

      if (!token || !token.startsWith('Bearer ')) {
        throw new AppError({
          statusCode: ResponseCodes.UnAuthorised,
          message: 'Not authorised',
        });
      }

      token = token.split(' ')[1]?.trim();

      if (!token) {
        throw new AppError({
          message: 'Invalid token',
          statusCode: ResponseCodes.UnAuthorised,
        });
      }

      // Verify token
      const verifiedToken = tokenManager.verifyJwtToken(
        tokenType || 'ACCESS_TOKEN',
        token
      );

      // Add user related data to request headers
      req.headers['user-id'] = verifiedToken.userId;
      req.headers['user-roles'] = verifiedToken.roles?.join(',');
      req.headers['user-groups'] = verifiedToken.groups?.join(',');

      next();
    } catch (error) {
      next(error);
    }
  };
}
