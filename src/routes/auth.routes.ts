import express from 'express';
import type { Request, Response } from 'express-serve-static-core';
import * as authService from '../services/auth.service';
import { validateSchema, loginSchema, registerSchema } from '../validations/auth.validation';

const router = express.Router();

router.post('/register', validateSchema(registerSchema), async (req: Request, res: Response) => {
  try {
    const { schoolId, email, password, firstName, lastName, role } = req.body;
    const result = await authService.registerUser({ schoolId, email, password, firstName, lastName, role });
    return res.status(201).json({ data: result });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
  }
});

router.post('/login', validateSchema(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    return res.json({ data: result });
  } catch (error) {
    return res.status(401).json({ error: error instanceof Error ? error.message : 'Invalid credentials' });
  }
});

export default router;
