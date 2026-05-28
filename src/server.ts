import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import authRouter from './routes/auth.routes';
import curriculumRouter from './routes/curriculum.routes';
import syncRouter from './routes/sync.routes';
import { authenticate } from './middleware/auth.middleware';
import errorMiddleware from './middleware/error.middleware';

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const origin = process.env.ALLOWED_ORIGINS ?? 'http://localhost:4000';

app.use(cors({ origin }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/health', (_req: any, res: any) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/curricula', authenticate, curriculumRouter);
app.use('/api/sync', authenticate, syncRouter);

app.use(errorMiddleware.errorHandler);

app.listen(port, () => {
  console.log(`🚀 NeoClass API running on http://localhost:${port}`);
  console.log(`📚 Curriculum Management: http://localhost:${port}/api/curricula`);
  console.log(`🔄 Sync System: http://localhost:${port}/api/sync`);
});
