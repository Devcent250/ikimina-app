import Joi from "joi";

export const createSeasonSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional().allow("").allow(null),
  start: Joi.date().required(),
  end: Joi.date().required(),
  status: Joi.string().valid("active", "completed").default("active"),
});

export const updateSeasonSchema = createSeasonSchema.fork(
  ["name", "description", "start", "end", "status"],
  (schema) => schema.optional()
);
