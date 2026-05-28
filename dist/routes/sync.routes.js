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
const syncService = __importStar(require("../services/sync.service"));
const router = express_1.default.Router();
router.post('/:id', async (req, res) => {
    try {
        const curriculumId = req.params.id;
        const schoolIds = Array.isArray(req.body.schoolIds) ? req.body.schoolIds.map(String) : [];
        const syncedBy = String(req.body.syncedBy || 'system');
        if (!schoolIds.length) {
            return res.status(400).json({ error: 'schoolIds must be a non-empty array' });
        }
        const syncRecords = await syncService.initiateCurriculumSync(curriculumId, schoolIds, syncedBy);
        return res.status(202).json({ data: syncRecords });
    }
    catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to initiate sync' });
    }
});
router.get('/:id/status', async (req, res) => {
    try {
        const curriculumId = req.params.id;
        const items = await syncService.getSyncStatus(curriculumId);
        return res.json({ data: items });
    }
    catch (error) {
        return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch sync status' });
    }
});
exports.default = router;
