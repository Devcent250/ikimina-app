import Joi from "joi";

export const createGroupMemberSchema = Joi.object({
  memberId: Joi.number().required(),
  groupId: Joi.number().required(),
  loanEligibility: Joi.boolean().default(false),
  branchId: Joi.number().required(),
  numberOfShares: Joi.number().integer().min(0).default(0),
});

export const updateGroupMemberSchema = Joi.object({
  loanEligibility: Joi.boolean().optional(),
  branchId: Joi.number().optional(),
  numberOfShares: Joi.number().integer().min(0).optional(),
});
