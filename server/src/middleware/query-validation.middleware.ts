import { Request, Response, NextFunction } from "express";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { ValidationError } from "../errors/http.errors";

export const validateQuery = (type: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const queryInstance = plainToInstance(type, req.query);

    // @ts-ignore
    const errors = await validate(queryInstance);

    if (errors.length > 0) {
      throw new ValidationError("Validation failed", {
        errors: errors.map((error) => ({
          property: error.property,
          constraints: error.constraints,
        })),
      });
    }

    if (req) {
      // @ts-ignore
      req.query = queryInstance;
    }
    next();
  };
};
