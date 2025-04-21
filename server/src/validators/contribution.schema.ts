import Joi from "joi";

export const createContributionSchema = Joi.object({
  groupMemberId: Joi.number().required(),
  depositAmount: Joi.number().precision(2).positive().required(),
  contributionType: Joi.string().valid("solidarity", "saving").required(),
  paymentMethodId: Joi.number().required(),
  receivedById: Joi.number().required(),
});

export const updateContributionSchema = createContributionSchema.fork(
  [
    "groupMemberId",
    "depositAmount",
    "contributionType",
    "paymentMethodId",
    "receivedById",
  ],
  (schema) => schema.optional()
);
