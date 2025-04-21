import Joi from "joi";

export const createGroupSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional().allow("").allow(null),
  presidentId: Joi.number().optional(),
  accountantId: Joi.number().optional(),
  secretaryId: Joi.number().optional(),
  meetingFrequency: Joi.string()
    .valid("Weekly", "Bi-weekly", "Monthly", "Quarterly")
    .default("Monthly"),
  location: Joi.string().optional().allow("").allow(null),
  pricePerShare: Joi.number().precision(2).positive().required(),
  minShares: Joi.number().integer().min(0).required(),
  maxShares: Joi.number().integer().min(1).required(),
  branchId: Joi.number().required(),
  solidarityAmount: Joi.number().integer().min(0).required(),
});

export const updateGroupSchema = createGroupSchema.fork(
  [
    "name",
    "description",
    "presidentId",
    "accountantId",
    "secretaryId",
    "meetingFrequency",
    "location",
    "pricePerShare",
    "minShares",
    "maxShares",
    "branchId",
    "solidarityAmount",
  ],
  (schema) => schema.optional()
);
