import Joi from "joi";

export const createPaymentMethodSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional().allow("").allow(null),
  accountNumber: Joi.string().optional().allow("").allow(null),
});

export const updatePaymentMethodSchema = createPaymentMethodSchema.fork(
  ["name", "description", "accountNumber"],
  (schema) => schema.optional()
);
