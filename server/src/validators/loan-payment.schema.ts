import Joi from "joi";

export const createLoanPaymentSchema = Joi.object({
  amount: Joi.number().precision(2).positive().required(),
  paymentMethodId: Joi.number().required(),
  notes: Joi.string().optional().allow("").allow(null),
  referenceNumber: Joi.string().optional().allow("").allow(null),
});

export const updateLoanPaymentSchema = createLoanPaymentSchema.fork(
  [
    "amount",
    "paymentMethodId",
    "notes",
    "referenceNumber",
  ],
  (schema) => schema.optional()
);
