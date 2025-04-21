import Joi from "joi";

export const createFineSchema = Joi.object({
  groupMemberId: Joi.number().required(),
  reason: Joi.string()
    .valid("Late Contribution", "Absenteeism", "Loan Default", "Other")
    .required(),
  amount: Joi.number().precision(2).positive().required(),
  groupId: Joi.number().required(),
  branchId: Joi.number().required(),
  notes: Joi.string().optional(),
});

export const updateFineSchema = createFineSchema.fork(
  ["groupMemberId", "reason", "amount", "branchId", "groupId", "notes"],
  (schema) => schema.optional()
);
