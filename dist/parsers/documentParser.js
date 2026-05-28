"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDocument = parseDocument;
const promises_1 = __importDefault(require("fs/promises"));
const mammoth_1 = __importDefault(require("mammoth"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
async function parseDocument(filePath, fileType) {
    switch (fileType) {
        case 'docx':
            return parseDocx(filePath);
        case 'pdf':
            return parsePdf(filePath);
        case 'txt':
            return parseText(filePath);
        default:
            throw new Error(`Unsupported file type: ${fileType}`);
    }
}
async function parseDocx(filePath) {
    const buffer = await promises_1.default.readFile(filePath);
    const result = await mammoth_1.default.extractRawText({ buffer });
    return result.value.trim();
}
async function parsePdf(filePath) {
    const buffer = await promises_1.default.readFile(filePath);
    const result = await (0, pdf_parse_1.default)(buffer);
    return result.text.trim();
}
async function parseText(filePath) {
    return (await promises_1.default.readFile(filePath, 'utf8')).trim();
}
