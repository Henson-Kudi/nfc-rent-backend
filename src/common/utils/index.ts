export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};:'",.<>?/])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};:'",.<>?/]+$/;

export class IReturnValue<Data = unknown> {
  success: boolean;
  message: string;
  data?: Data;
  error?: AppError;

  constructor(data: {
    success: boolean;
    message: string;
    data?: Data;
    error?: AppError;
  }) {
    this.data = data?.data;
    this.error = data?.error
      ? data?.error instanceof AppError
        ? data?.error
        : new AppError(data?.error)
      : undefined;
    this.message = data?.message;
    this.success = data.success;
  }
}

export class IReturnValueWithPagination<Data = unknown> {
  success: boolean;
  message: string;
  data: Data[];
  error?: AppError;
  total: number;
  page: number;
  limit: number;

  constructor(data: {
    success: boolean;
    message: string;
    data: Data[];
    error?: AppError;
    total: number;
    page: number;
    limit: number;
  }) {
    this.success = data.success;
    this.message = data.message;
    this.data = data.data;
    this.error = data?.error
      ? data?.error instanceof AppError
        ? data?.error
        : new AppError(data?.error)
      : undefined;
    this.total = data.total;
    this.page = data.page;
    this.limit = data.limit;
  }
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data: unknown;

  constructor(data: { statusCode: number; message: string; data?: unknown }) {
    super(data.message);
    this.statusCode = data.statusCode;
    this.message = data.message;
    this.data = data?.data;

    // Capture stack trace
    this.stack = this.stack ?? new Error(data.message).stack;
  }

  toJSON() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
    };
  }
}
