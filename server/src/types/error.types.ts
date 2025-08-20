export interface ErrorResponse {
  status: number;
  message: string;
  code: string;
  meta?: Record<string, any>;
  stack?: string;
}

// errors/AppError.ts
export class AppError extends Error {
  status: number;
  code: string;
  meta?: Record<string, any>;

  constructor(
    message: string,
    status: number,
    code: string,
    meta?: Record<string, any>
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.meta = meta;
    Error.captureStackTrace(this, this.constructor);
  }
}
