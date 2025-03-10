import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils';
import { ResponseCodes } from '../enums';
import { TokenManagerToken } from '../jwt';
import Container from 'typedi';
import { Cache } from '../cache/redis-cache';
import { User } from '../entities';
import { UserRepository } from '@/modules/auth/infrastructure/repositories/user.repository';
import { JsonWebTokenError } from 'jsonwebtoken';

export default function authenticateRequest(
  tokenType: JwtType = 'ACCESS_TOKEN'
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tokenManager = Container.get(TokenManagerToken);
      const cacheFactory = Container.get(Cache);
      const userRepository = Container.get(UserRepository);

      let token = req.headers.authorization;

      if (!token || !token.startsWith('Bearer ')) {
        throw new AppError({
          statusCode: ResponseCodes.UnAuthorised,
          message: 'Not authorised',
        });
      }

      token = token.split(' ')?.pop()?.trim();

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

      const cacheKey = `user:${verifiedToken.userId}`;

      let user = await cacheFactory.get<User>(cacheKey);

      if (!user) {
        user = await userRepository.findOne({
          where: { id: verifiedToken.userId },
          relations: ['roles', 'roles.permissions'],
        });

        if (user) {
          await cacheFactory.set(cacheKey, JSON.stringify(user));
        }
      }

      if (!user) {
        throw new AppError({
          statusCode: ResponseCodes.UnAuthorised,
          message: 'Not Authorised',
        });
      }
      // Add user related data to request headers
      req.headers['x-user-id'] = verifiedToken.userId;
      req.headers['x-user-roles'] = verifiedToken.roles?.join(',');
      req.headers['x-user-groups'] = verifiedToken.groups?.join(',');

      // Set request user
      req.user = user;

      next();
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        next(
          new AppError({
            statusCode: ResponseCodes.UnAuthorised,
            message: 'Unauthorised',
          })
        );
      }
      next(error);
    }
  };
}
