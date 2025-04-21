import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";
import { ValidationError } from "../errors/http.errors";

export const validateSchema = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const validationErrors = error.details.reduce((acc, curr) => {
        const key = curr.path.join(".");
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(curr.message);
        return acc;
      }, {} as Record<string, string[]>);

      throw new ValidationError("Validation failed", {
        errors: validationErrors,
      });
    }

    // Replace request body with validated and transformed value
    req.body = value;
    next();
  };
};
