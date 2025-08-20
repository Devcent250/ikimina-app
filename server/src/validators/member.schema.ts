import Joi from "joi";

export const createMemberSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  fullNames: Joi.string().required(),
  gender: Joi.string().valid("Male", "Female", "Other").required(),
  phone: Joi.string().optional().allow("").allow(null),
  marriageStatus: Joi.string()
    .valid("Single", "Married", "Divorced", "Widowed")
    .required(),
  idNumber: Joi.string().required(),
  country: Joi.string().optional().allow("").allow(null),
  currentAddress: Joi.string().optional().allow("").allow(null),
  joinedAt: Joi.date().required(),
  sourceOfIncome: Joi.string()
    .valid("Employment", "Business", "Farming", "Freelance", "Other")
    .required(),
  branchId: Joi.number().required(),
  districtId: Joi.number().required(),
  groupIds: Joi.array().items(Joi.string()).optional().allow(null).default([]),
  // Role assignment (admin can assign member as leader during creation)
  roleAssignments: Joi.array().items(
    Joi.object({
      groupId: Joi.number().required(),
      role: Joi.string().valid("President", "Accountant", "Secretary").required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
    })
  ).optional().default([])
});

export const updateMemberSchema = createMemberSchema.fork(
  [
    "firstName",
    "lastName",
    "fullNames",
    "gender",
    "phone",
    "marriageStatus",
    "idNumber",
    "country",
    "currentAddress",
    "joinedAt",
    "sourceOfIncome",
    "branchId",
    "groupIds",
  ],
  (schema) => schema.optional()
);
