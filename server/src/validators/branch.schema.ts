import Joi from "joi";

export const createBranchSchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.string().required(),
  description: Joi.string().optional().allow("").allow(null),
  districtId: Joi.number().required(),
});

export const updateBranchSchema = createBranchSchema.fork(
  ["name", "address", "description","districtId"],
  (schema) => schema.optional()
);
