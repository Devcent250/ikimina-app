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
  joinedAt: Joi.alternatives().try(Joi.date(), Joi.string().isoDate()).required(),
  sourceOfIncome: Joi.string()
    .valid("Employment", "Business", "Farming", "Freelance", "Other")
    .required(),
  branchId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^[\d]+$/)).required(),
  districtId: Joi.alternatives().try(Joi.number(), Joi.string().pattern(/^[\d]+$/)).required(),
  memberCode: Joi.string().length(4).pattern(/^\d{4}$/).required().messages({
    'string.length': 'Member code must be exactly 4 characters',
    'string.pattern.base': 'Member code must contain only digits',
    'any.required': 'Member code is required'
  }),
  groupIds: Joi.array().items(Joi.string()).optional().allow(null).default([]),
  role: Joi.string().valid("President", "Secretary", "Accountant", "Member").optional(),
  email: Joi.string().email().optional().allow(null).allow(""),
  password: Joi.string().min(6).optional().allow(null).allow("")
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
    "memberCode",
    "groupIds",
    "role",
    "email",
    "password"
  ],
  (schema) => schema.optional()
);
