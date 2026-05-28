"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
exports.validateSchema = validateSchema;
const joi_1 = __importDefault(require("joi"));
exports.registerSchema = joi_1.default.object({
    schoolId: joi_1.default.string().required(),
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
    firstName: joi_1.default.string().required(),
    lastName: joi_1.default.string().required(),
    role: joi_1.default.string().valid('ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT').default('STUDENT')
});
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required()
});
function validateSchema(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            return res.status(400).json({ error: error.details.map((detail) => detail.message).join(', ') });
        }
        req.body = value;
        next();
    };
}
