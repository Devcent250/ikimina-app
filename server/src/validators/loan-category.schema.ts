import Joi from "joi";

export const createLoanCategorySchema = Joi.object({
    name: Joi.string().required().min(1).max(100),
    description: Joi.string().required().min(1),
    defaultAmount: Joi.number().required().min(0),
    interestRate: Joi.number().required().min(0).max(100),
    minAmount: Joi.number().optional().min(0).allow(null, ''),
    maxAmount: Joi.number().optional().min(0).allow(null, ''),
    branchId: Joi.number().optional().allow(null, ''),
}).custom((obj, helpers) => {
    if (obj.minAmount && obj.maxAmount && obj.minAmount > obj.maxAmount) {
        return helpers.error("minAmount cannot be greater than maxAmount");
    }
    if (obj.defaultAmount && obj.minAmount && obj.defaultAmount < obj.minAmount) {
        return helpers.error("defaultAmount cannot be less than minAmount");
    }
    if (obj.defaultAmount && obj.maxAmount && obj.defaultAmount > obj.maxAmount) {
        return helpers.error("defaultAmount cannot be greater than maxAmount");
    }
    return obj;
});

export const updateLoanCategorySchema = Joi.object({
    name: Joi.string().optional().min(1).max(100),
    description: Joi.string().optional().min(1),
    defaultAmount: Joi.number().optional().min(0),
    interestRate: Joi.number().optional().min(0).max(100),
    minAmount: Joi.number().optional().min(0),
    maxAmount: Joi.number().optional().min(0),
    isActive: Joi.boolean().optional(),
}).custom((obj, helpers) => {
    if (obj.minAmount && obj.maxAmount && obj.minAmount > obj.maxAmount) {
        return helpers.error("minAmount cannot be greater than maxAmount");
    }
    if (obj.defaultAmount && obj.minAmount && obj.defaultAmount < obj.minAmount) {
        return helpers.error("defaultAmount cannot be less than minAmount");
    }
    if (obj.defaultAmount && obj.maxAmount && obj.defaultAmount > obj.maxAmount) {
        return helpers.error("defaultAmount cannot be greater than maxAmount");
    }
    return obj;
}); 