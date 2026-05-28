import Joi from 'joi';
import type { Request, Response, NextFunction } from 'express-serve-static-core';

export const registerSchema = Joi.object({
  schoolId: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().valid('ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT').default('STUDENT')
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export function validateSchema(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    if (error) {
      return res.status(400).json({ error: error.details.map((detail) => detail.message).join(', ') });
    }
    (req as any).body = value;
    next();
  };
}
