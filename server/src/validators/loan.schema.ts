import Joi from "joi";

export const createLoanSchema = Joi.object({
  groupMemberId: Joi.number().required(),
  loanType: Joi.string().optional().allow(""), // Now optional
  amount: Joi.number().precision(2).positive().required(),
  loanTerms: Joi.string().required(),
  interestRate: Joi.number().precision(2).min(0).max(100).required(),
  paymentFrequency: Joi.string().valid("Monthly", "Weekly", "Daily").required(),
  createdById: Joi.number().required(),
  attachments: Joi.array().items(Joi.string()).optional(),
  groupId: Joi.number().required(),
  branchId: Joi.number().required(),
});

export const updateLoanSchema = createLoanSchema
  .fork(
    [
      "groupMemberId",
      "loanType",
      "amount",
      "loanTerms",
      "interestRate",
      "paymentFrequency",
      "createdById",
      "attachments",
      "groupId",
      "branchId",
    ],
    (schema) => schema.optional()
  )
  .keys({
    completedAt: Joi.date().optional().allow(null),
  });

export const approveLoanSchema = Joi.object({
  status: Joi.string().valid("Approved", "Rejected").required(),
  notes: Joi.string().optional().allow("", null),
});
