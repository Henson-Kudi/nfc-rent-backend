import { ErrorRequestHandler } from 'express';
import Joi from 'joi';
import { AppError, IReturnValue } from '../utils';
import { ResponseCodes } from '../enums';

const globalErrorHandler: ErrorRequestHandler = (err, _, res, __) => {
  if (err instanceof AppError) {
    res
      .status(err.statusCode)
      .json(
        new IReturnValue({ success: false, message: err.message, error: err })
      );
  } else if (err instanceof Joi.ValidationError) {
    res.status(ResponseCodes.ValidationError).json(
      new IReturnValue({
        success: false,
        message: err.message,
        error: new AppError({
          statusCode: ResponseCodes.ValidationError,
          message: err.message,
          data: err.details,
        }),
      })
    );
  } else {
    // if not app error or validation error, then just return an internal server error
    res.status(500).json(
      new IReturnValue({
        success: false,
        message: err?.message || 'Internal server error',
        error: new AppError({
          statusCode: 500,
          message: err?.message || 'Internal server error',
          data: err,
        }),
      })
    );
  }
};

export default globalErrorHandler;
