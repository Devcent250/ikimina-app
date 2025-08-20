import Joi from "joi";

export const createRoleSchema = Joi.object({
  name: Joi.string().required(),
  permissions: Joi.object().optional().allow(null),
});

export const updateRoleSchema = createRoleSchema.fork(
  ["name", "permissions"],
  (schema) => schema.optional()
);
