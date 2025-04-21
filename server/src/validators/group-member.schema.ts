import Joi from "joi";

export const createGroupMemberSchema = Joi.object({
  memberId: Joi.number().required(),
  groupId: Joi.number().required(),
  loanEligibility: Joi.boolean().default(false),
  branchId: Joi.number().required(),
  numberOfShares: Joi.number().integer().min(0).default(0),
});

export const updateGroupMemberSchema = createGroupMemberSchema.fork(
  ["memberId", "groupId", "loanEligibility", "branchId", "numberOfShares"],
  (schema) => schema.optional()
);
