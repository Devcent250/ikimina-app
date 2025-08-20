import Joi from "joi";

export const createExpenseCategorySchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional().allow("").allow(null),
});

export const updateExpenseCategorySchema = createExpenseCategorySchema.fork(
  ["name", "description"],
  (schema) => schema.optional()
);
