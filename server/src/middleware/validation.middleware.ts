import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";
import { ValidationError } from "../errors/http.errors";

export const validateSchema = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log("=== VALIDATION MIDDLEWARE ===");
    console.log("Validating schema:", schema.describe());
    console.log("Request body:", req.body);
    console.log("Request URL:", req.url);

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      console.log("Validation errors:", error.details);
      const validationErrors = error.details.reduce((acc, curr) => {
        const key = curr.path.join(".");
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(curr.message);
        return acc;
      }, {} as Record<string, string[]>);

      console.log("Processed validation errors:", validationErrors);
      throw new ValidationError("Validation failed", {
        errors: validationErrors,
      });
    }

    // Replace request body with validated and transformed value
    console.log("Validation passed, transformed body:", value);
    req.body = value;
    next();
  };
};
