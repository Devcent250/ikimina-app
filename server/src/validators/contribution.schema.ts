import Joi from "joi";

export const createContributionSchema = Joi.object({
  groupMemberId: Joi.number().required(),
  depositAmount: Joi.number().min(0).required(),
  solidarityAmount: Joi.number().min(0).required(),
  paymentMethodId: Joi.number().required(),
  receivedById: Joi.number().required(),
  branchId: Joi.number().required(),
}).custom((obj, helpers) => {
  if (obj.depositAmount === 0 && obj.solidarityAmount === 0) {
    return helpers.error("any.invalid", {
      message: "At least one of depositAmount or solidarityAmount must be greater than 0",
    });
  }
  return obj;
});

export const updateContributionSchema = Joi.object({
  groupMemberId: Joi.number(),
  depositAmount: Joi.number().min(0),
  solidarityAmount: Joi.number().min(0),
  paymentMethodId: Joi.number(),
  receivedById: Joi.number(),
  branchId: Joi.number(),
}).custom((obj, helpers) => {
  if (obj.depositAmount === 0 && obj.solidarityAmount === 0) {
    return helpers.error("any.invalid", {
      message: "At least one of depositAmount or solidarityAmount must be greater than 0",
    });
  }
  return obj;
});
