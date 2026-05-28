"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const curriculumService = __importStar(require("../services/curriculum.service"));
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const schoolId = String(req.query.schoolId || '');
        if (!schoolId) {
            return res.status(400).json({ error: 'schoolId is required' });
        }
        const curriculums = await curriculumService.listCurriculums(schoolId);
        return res.json({ data: curriculums });
    }
    catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to list curricula' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { schoolId, name, level, code, country, type, description, gradeLevelId } = req.body;
        if (!schoolId || !name || !level || !code || !country || !type) {
            return res.status(400).json({ error: 'Missing required curriculum fields' });
        }
        const curriculum = await curriculumService.createCurriculum({
            schoolId,
            name,
            level,
            code,
            country,
            type,
            description,
            gradeLevelId
        });
        return res.status(201).json({ data: curriculum });
    }
    catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create curriculum' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const curriculum = await curriculumService.getCurriculumById(req.params.id);
        if (!curriculum) {
            return res.status(404).json({ error: 'Curriculum not found' });
        }
        return res.json({ data: curriculum });
    }
    catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch curriculum' });
    }
});
router.patch('/:id', async (req, res) => {
    try {
        const curriculum = await curriculumService.updateCurriculum(req.params.id, req.body);
        return res.json({ data: curriculum });
    }
    catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update curriculum' });
    }
});
exports.default = router;
