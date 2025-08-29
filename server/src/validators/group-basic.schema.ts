import Joi from "joi";

// Schema for basic group creation by admins
export const createBasicGroupSchema = Joi.object({
  name: Joi.string().required().min(2),
  description: Joi.string().optional().allow("").allow(null),
  branchId: Joi.number().required(),
  isActive: Joi.boolean().default(true),
  additionalNotes: Joi.string().optional().allow("").allow(null),
  // Optional initial president (member ID)
  presidentId: Joi.number().optional(),
  // If president is provided, require credentials
  presidentEmail: Joi.string().email().optional(),
  presidentPassword: Joi.string().optional(),
}).custom((obj, helpers) => {
  // If presidentId is provided, email and password are required
  if (obj.presidentId && (!obj.presidentEmail || !obj.presidentPassword)) {
    return helpers.error('any.invalid', { 
      message: 'Email and password are required when assigning a president' 
    });
  }
  return obj;
});

// Schema for assigning president to existing group
export const assignPresidentSchema = Joi.object({
  presidentId: Joi.number().required(),
  presidentEmail: Joi.string().email().required(),
  presidentPassword: Joi.string().required().min(6),
});

// Schema for completing group details by group leaders
export const completeGroupSchema = Joi.object({
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
    .optional(),
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
  pricePerShare: Joi.number().precision(2).positive().optional(),
  minShares: Joi.number().integer().min(0).optional(),
  maxShares: Joi.number().integer().min(1).optional(),
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
