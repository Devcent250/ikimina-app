import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/error.types";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    meta: (err as AppError).meta,
  });

  // Handle TypeORM errors
  if (err.name === "QueryFailedError") {
    return res.status(400).json({
      status: 400,
      code: "DATABASE_ERROR",
      message: "Database operation failed",
      meta: { originalError: err.message },
    });
  }

  // Handle validation errors from express-validator
  if (err.name === "ValidationError") {
    return res.status(422).json({
      status: 422,
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      meta: { errors: (err as any).errors },
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      status: 401,
      code: "INVALID_TOKEN",
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      status: 401,
      code: "TOKEN_EXPIRED",
      message: "Token expired",
    });
  }

  // Handle our custom AppError
  if (err instanceof AppError) {
    return res.status(err.status).json({
      status: err.status,
      code: err.code,
      message: err.message,
      meta: err.meta,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
