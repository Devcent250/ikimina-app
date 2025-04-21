import Joi from "joi";

export const createLoanPaymentSchema = Joi.object({
  loanId: Joi.number().required(),
  date: Joi.date().required(),
  amount: Joi.number().precision(2).positive().required(),
  paymentMethodId: Joi.number().required(),
  receivedById: Joi.number().required(),
  referenceNumber: Joi.string().optional().allow("").allow(null),
  groupId: Joi.number().required(),
  seasonId: Joi.number().required(),
});

export const updateLoanPaymentSchema = createLoanPaymentSchema.fork(
  [
    "loanId",
    "date",
    "amount",
    "paymentMethodId",
    "receivedById",
    "referenceNumber",
    "groupId",
    "seasonId",
  ],
  (schema) => schema.optional()
);
