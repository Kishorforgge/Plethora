"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalProtect = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const secret = process.env.JWT_SECRET;
            if (!secret) {
                res.status(500);
                return next(new Error('JWT_SECRET is missing in environment variables.'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            const user = await User_1.User.findById(decoded.id);
            if (!user) {
                res.status(401);
                return next(new Error('User not found. Authorization failed.'));
            }
            req.user = user;
            next();
        }
        catch (error) {
            res.status(401);
            return next(new Error('Not authorized, token validation failed.'));
        }
    }
    else {
        res.status(401);
        return next(new Error('Not authorized, no token provided.'));
    }
};
exports.protect = protect;
const optionalProtect = async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const secret = process.env.JWT_SECRET;
            if (secret) {
                const decoded = jsonwebtoken_1.default.verify(token, secret);
                const user = await User_1.User.findById(decoded.id);
                if (user) {
                    req.user = user;
                }
            }
        }
        catch (error) {
            // Quietly ignore token issues in optional protect to let anonymous users browse
        }
    }
    next();
};
exports.optionalProtect = optionalProtect;
//# sourceMappingURL=authMiddleware.js.map