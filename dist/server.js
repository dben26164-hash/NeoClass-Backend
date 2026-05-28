"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const curriculum_routes_1 = __importDefault(require("./routes/curriculum.routes"));
const sync_routes_1 = __importDefault(require("./routes/sync.routes"));
const auth_middleware_1 = require("./middleware/auth.middleware");
const error_middleware_1 = __importDefault(require("./middleware/error.middleware"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
const origin = process.env.ALLOWED_ORIGINS ?? 'http://localhost:4000';
app.use((0, cors_1.default)({ origin }));
app.use(body_parser_1.default.json({ limit: '10mb' }));
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/curricula', auth_middleware_1.authenticate, curriculum_routes_1.default);
app.use('/api/sync', auth_middleware_1.authenticate, sync_routes_1.default);
app.use(error_middleware_1.default.errorHandler);
app.listen(port, () => {
    console.log(`🚀 NeoClass API running on http://localhost:${port}`);
    console.log(`📚 Curriculum Management: http://localhost:${port}/api/curricula`);
    console.log(`🔄 Sync System: http://localhost:${port}/api/sync`);
});
