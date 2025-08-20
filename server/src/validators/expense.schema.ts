import Joi from "joi";

export const createExpenseSchema = Joi.object({
  amount: Joi.number().required(),
  name: Joi.string().required(),
  attachment: Joi.any().optional(),
  groupId: Joi.string().required(),
  expenseCategoryId: Joi.string().required(),
  paymentMethodId: Joi.string().required(),
  notes: Joi.string().optional(),
});

export const updateExpenseSchema = createExpenseSchema.fork(
  [
    "amount",
    "name",
    "attachment",
    "groupId",
    "expenseCategoryId",
    "paymentMethodId",
    "notes",
  ],
  (schema) => schema.optional()
);
