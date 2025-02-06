import { AppError, IReturnValue } from '@/common/utils';
import { IController } from '@/types/global';
import { CookieOptions, NextFunction, Request, Response } from 'express';
import { ResponseCodes } from '@/common/enums';

export function requestHandlerWithCookie<T = unknown>(
  controller: IController<Promise<IReturnValue<T>>>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await controller.handle(req);

      if (!result.success) {
        next(
          result.error ??
            new AppError({ statusCode: 500, message: 'Internal server error' })
        );
      }

      const data = result?.data as any;

      if (!data?.requiresOtp && data?.refreshToken) {
        const cookieOptions: CookieOptions = {
          maxAge: new Date(data!.refreshToken!.expireAt).getTime(),
          httpOnly: true,
          sameSite: 'lax',
          // secure: false
        };

        res
          .cookie('refresh-token', data!.refreshToken!.value, cookieOptions)
          .status(ResponseCodes.Success)
          .json(result);
      } else {
        res.status(ResponseCodes.Success).json(result);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
