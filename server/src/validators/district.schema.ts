import Joi from "joi";

export const createDistrictSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  description: Joi.string().optional().allow("").allow(null).max(500),
  location: Joi.string().optional().allow("").allow(null).max(200),
});

export const updateDistrictSchema = createDistrictSchema.fork(
  ["name", "description", "location"],
  (schema) => schema.optional()
); 