import * as express from 'express';
import * as authService from '../services/authService';

const router = express.Router();

router.post('/register', async (req: any, res: any) => {
  try {
    const { schoolId, email, password, firstName, lastName, role } = req.body;
    if (!schoolId || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing registration fields' });
    }
    const result = await authService.registerUser({ schoolId, email, password, firstName, lastName, role });
    res.status(201).json({ data: result });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Registration failed' });
  }
});

router.post('/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
    const result = await authService.loginUser(email, password);
    res.json({ data: result });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Login failed' });
  }
});

export default router;
