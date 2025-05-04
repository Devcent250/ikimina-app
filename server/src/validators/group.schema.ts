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
  meetingDay: Joi.string()
    .valid("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
    .required(),
  meetingStartTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'Meeting start time must be in HH:mm format (24-hour)',
    }),
  meetingEndTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      'string.pattern.base': 'Meeting end time must be in HH:mm format (24-hour)',
    }),
  meetingLocation: Joi.string().required(),
  meetingLocationDetails: Joi.string().optional().allow("").allow(null),
  meetingDurationMinutes: Joi.number().integer().min(15).max(480).required(),
  isActive: Joi.boolean().default(true),
  pricePerShare: Joi.number().precision(2).positive().required(),
  minShares: Joi.number().integer().min(0).required(),
  maxShares: Joi.number().integer().min(1).required(),
  branchId: Joi.number().required(),
  solidarityAmount: Joi.number().integer().min(0).required(),
  additionalNotes: Joi.string().optional().allow("").allow(null),
}).custom((obj, helpers) => {
  // Validate that end time is after start time
  const start = new Date(`2000-01-01T${obj.meetingStartTime}`);
  const end = new Date(`2000-01-01T${obj.meetingEndTime}`);
  
  if (end <= start) {
    return helpers.error('any.invalid', { message: 'Meeting end time must be after start time' });
  }
  
  // Validate that duration matches start and end times
  const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  if (durationMinutes !== obj.meetingDurationMinutes) {
    return helpers.error('any.invalid', { message: 'Meeting duration must match start and end times' });
  }
  
  return obj;
});

export const updateGroupSchema = createGroupSchema.fork(
  [
    "name",
    "description",
    "presidentId",
    "accountantId",
    "secretaryId",
    "meetingFrequency",
    "meetingDay",
    "meetingStartTime",
    "meetingEndTime",
    "meetingLocation",
    "meetingLocationDetails",
    "meetingDurationMinutes",
    "isActive",
    "pricePerShare",
    "minShares",
    "maxShares",
    "branchId",
    "solidarityAmount",
    "additionalNotes",
  ],
  (schema) => schema.optional()
);
