import { NextFunction, Request, Response } from 'express';
import { ResponseCodes } from '../enums';

function requestHandler<Output>(
  controller: IController<Output>
): (req: Request, res: Response, next: NextFunction) => void {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await controller.handle(req);

      res.status(ResponseCodes.Success).json(result);

      // next();
    } catch (err) {
      next(err);
    }
  };
}

export default requestHandler;
