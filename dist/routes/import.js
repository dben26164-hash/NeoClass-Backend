"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const uuid_1 = require("uuid");
const importService_1 = __importDefault(require("../services/importService"));
const router = express_1.default.Router();
const uploadDir = process.env.UPLOAD_DIR ?? 'uploads';
const storage = multer_1.default.diskStorage({
    destination: async (_req, _file, cb) => {
        await promises_1.default.mkdir(path_1.default.join(process.cwd(), uploadDir), { recursive: true });
        cb(null, path_1.default.join(process.cwd(), uploadDir));
    },
    filename: (_req, file, cb) => {
        const suffix = `${Date.now()}-${(0, uuid_1.v4)()}`;
        cb(null, `${suffix}-${file.originalname}`);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }
});
const acceptedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'text/plain'
];
router.post('/upload', upload.single('document'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Document is required' });
    }
    if (!acceptedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Unsupported file type. Use .docx, .pdf or .txt' });
    }
    const extension = path_1.default.extname(req.file.originalname).toLowerCase();
    const fileType = extension === '.docx' ? 'docx' : extension === '.pdf' ? 'pdf' : 'txt';
    const job = await importService_1.default.createImportJob(req.file.originalname, fileType);
    importService_1.default.processImportJob(job.id, req.file.path, fileType).catch((error) => {
        console.error('Import background failure:', error);
    });
    res.status(202).json({ jobId: job.id, status: job.status });
});
exports.default = router;
