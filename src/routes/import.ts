import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuid } from 'uuid';
import importService from '../services/importService';

const router = express.Router();
const uploadDir = process.env.UPLOAD_DIR ?? 'uploads';
const storage = multer.diskStorage({
  destination: async (_req: any, _file: any, cb: any) => {
    await fs.mkdir(path.join(process.cwd(), uploadDir), { recursive: true });
    cb(null, path.join(process.cwd(), uploadDir));
  },
  filename: (_req: any, file: any, cb: any) => {
    const suffix = `${Date.now()}-${uuid()}`;
    cb(null, `${suffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

const acceptedMimeTypes = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/pdf',
  'text/plain'
];

router.post('/upload', upload.single('document'), async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Document is required' });
  }

  if (!acceptedMimeTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Unsupported file type. Use .docx, .pdf or .txt' });
  }

  const extension = path.extname(req.file.originalname).toLowerCase();
  const fileType = extension === '.docx' ? 'docx' : extension === '.pdf' ? 'pdf' : 'txt';

  const job = await importService.createImportJob(req.file.originalname, fileType);

  importService.processImportJob(job.id, req.file.path, fileType).catch((error) => {
    console.error('Import background failure:', error);
  });

  res.status(202).json({ jobId: job.id, status: job.status });
});

export default router;
