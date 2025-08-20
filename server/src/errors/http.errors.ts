import { AppError } from "../types/error.types";

// errors/http.errors.ts
export class NotFoundError extends AppError {
  constructor(
    message: string = "Resource not found",
    meta?: Record<string, any>
  ) {
    super(message, 404, "NOT_FOUND", meta);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad request", meta?: Record<string, any>) {
    super(message, 400, "BAD_REQUEST", meta);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized", meta?: Record<string, any>) {
    super(message, 401, "UNAUTHORIZED", meta);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden", meta?: Record<string, any>) {
    super(message, 403, "FORBIDDEN", meta);
  }
}

export class ConflictError extends AppError {
  constructor(
    message: string = "Resource conflict",
    meta?: Record<string, any>
  ) {
    super(message, 409, "CONFLICT", meta);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string = "Validation failed",
    meta?: Record<string, any>
  ) {
    super(message, 422, "VALIDATION_ERROR", meta);
  }
}

export class InternalServerError extends AppError {
  constructor(
    message: string = "Internal server error",
    meta?: Record<string, any>
  ) {
    super(message, 500, "INTERNAL_SERVER_ERROR", meta);
  }
}
