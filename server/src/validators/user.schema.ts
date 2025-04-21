import Joi from "joi";

export const createUserSchema = Joi.object({
  first_name: Joi.string(),
  last_name: Joi.string(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required().min(6),
  phone: Joi.string().optional().allow("").allow(null),
  profileUrl: Joi.string().optional().allow("").allow(null),
  role: Joi.number().required(),
  branchId: Joi.number().required(),
  groupId:Joi.number().required()
});

export const updateUserSchema = createUserSchema.fork(
  [
    "name",
    "first_name",
    "last_name",
    "email",
    "password",
    "phone",
    "profileUrl",
    "role",
    "branchId",
    "groupId",
  ],
  (schema) => schema.optional()
);
