import Joi from "joi";

export const createGroupSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional().allow("").allow(null),
  presidentId: Joi.number().optional(),
  presidentEmail: Joi.string().email().optional(),
  presidentPassword: Joi.string().optional(),
  accountantId: Joi.number().optional(),
  accountantEmail: Joi.string().email().optional(),
  accountantPassword: Joi.string().optional(),
  secretaryId: Joi.number().optional(),
  secretaryEmail: Joi.string().email().optional(),
  secretaryPassword: Joi.string().optional(),
  meetingFrequency: Joi.string()
    .valid("Weekly", "Bi-weekly", "Monthly", "Quarterly")
    .optional()
    .default("Monthly"),
  meetingDay: Joi.string()
    .valid("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
    .optional(),
  meetingStartTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
      'string.pattern.base': 'Meeting start time must be in HH:mm format (24-hour)',
    }),
  meetingEndTime: Joi.string()
    .pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .messages({
      'string.pattern.base': 'Meeting end time must be in HH:mm format (24-hour)',
    }),
  meetingLocation: Joi.string().optional(),
  meetingLocationDetails: Joi.string().optional().allow("").allow(null),
  meetingDurationMinutes: Joi.number().integer().min(15).max(480).optional(),
  isActive: Joi.boolean().default(true),
  pricePerShare: Joi.number().precision(2).positive().optional(),
  minShares: Joi.number().integer().min(0).optional(),
  maxShares: Joi.number().integer().min(1).optional(),
  branchId: Joi.number().required(),
  solidarityAmount: Joi.number().integer().min(0).optional(),
  additionalNotes: Joi.string().optional().allow("").allow(null),
}).custom((obj, helpers) => {
  // Only validate meeting times if both are provided
  if (obj.meetingStartTime && obj.meetingEndTime) {
    const start = new Date(`2000-01-01T${obj.meetingStartTime}`);
    const end = new Date(`2000-01-01T${obj.meetingEndTime}`);

    if (end <= start) {
      return helpers.error('any.invalid', { message: 'Meeting end time must be after start time' });
    }

    // Validate duration if provided
    if (obj.meetingDurationMinutes) {
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      if (durationMinutes !== obj.meetingDurationMinutes) {
        return helpers.error('any.invalid', { message: 'Meeting duration must match start and end times' });
      }
    }
  }

  // Validate shares if provided
  if (obj.minShares !== undefined && obj.maxShares !== undefined && obj.minShares > obj.maxShares) {
    return helpers.error('any.invalid', { message: 'Minimum shares cannot be greater than maximum shares' });
  }

  return obj;
});

export const updateGroupSchema = createGroupSchema.fork(
  [
    "name",
    "description",
    "presidentId",
    "presidentEmail",
    "presidentPassword",
    "accountantId",
    "accountantEmail",
    "accountantPassword",
    "secretaryId",
    "secretaryEmail",
    "secretaryPassword",
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