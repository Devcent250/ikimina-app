import Joi from "joi";

export const createAttendanceSchema = Joi.object({
  date: Joi.date().required(),
  attendances: Joi.array().items(Joi.number()).required(),
  groupId: Joi.number().required(),
});

export const updateAttendanceSchema = createAttendanceSchema.fork(
  ["date", "attendances", "groupId"],
  (schema) => schema.optional()
);
