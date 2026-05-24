"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Generates a signed JWT token containing the user's ID
 * @param id The user ID string to encode in the payload
 * @returns Signed JWT token
 */
const generateToken = (id) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured in the environment variables.');
    }
    return jsonwebtoken_1.default.sign({ id }, secret, {
        expiresIn: (process.env.JWT_EXPIRE || '7d'),
    });
};
exports.generateToken = generateToken;
//# sourceMappingURL=generateToken.js.map