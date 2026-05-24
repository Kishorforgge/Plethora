"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateProfileUpdate = exports.validateComment = exports.validateLogin = exports.validateRegister = void 0;
/**
 * Validator middleware for user registration.
 */
const validateRegister = (req, res, next) => {
    const { username, email, password, fullName } = req.body;
    const errors = [];
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
        errors.push('Username must be at least 3 characters long.');
    }
    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push('Username can only contain alphanumeric characters and underscores.');
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('A valid email address is required.');
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
        errors.push('Password must be at least 6 characters long.');
    }
    if (fullName && typeof fullName !== 'string') {
        errors.push('Full name must be a text string.');
    }
    if (errors.length > 0) {
        return res.status(400).json({
            status: 'fail',
            message: 'Validation failed',
            errors,
        });
    }
    next();
};
exports.validateRegister = validateRegister;
/**
 * Validator middleware for user login.
 */
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('A valid email address is required.');
    }
    if (!password || typeof password !== 'string') {
        errors.push('Password is required.');
    }
    if (errors.length > 0) {
        return res.status(400).json({
            status: 'fail',
            message: 'Validation failed',
            errors,
        });
    }
    next();
};
exports.validateLogin = validateLogin;
/**
 * Validator middleware for comments.
 */
const validateComment = (req, res, next) => {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim() === '') {
        return res.status(400).json({
            status: 'fail',
            message: 'Comment text is required and cannot be empty.',
        });
    }
    if (text.length > 1000) {
        return res.status(400).json({
            status: 'fail',
            message: 'Comment text cannot exceed 1000 characters.',
        });
    }
    next();
};
exports.validateComment = validateComment;
/**
 * Validator middleware for profiles.
 */
const validateProfileUpdate = (req, res, next) => {
    const { fullName, bio } = req.body;
    const errors = [];
    if (fullName !== undefined && (typeof fullName !== 'string' || fullName.trim() === '')) {
        errors.push('Full name must be a non-empty string.');
    }
    if (bio !== undefined && typeof bio !== 'string') {
        errors.push('Bio must be a string.');
    }
    if (bio && bio.length > 500) {
        errors.push('Bio cannot exceed 500 characters.');
    }
    if (errors.length > 0) {
        return res.status(400).json({
            status: 'fail',
            message: 'Validation failed',
            errors,
        });
    }
    next();
};
exports.validateProfileUpdate = validateProfileUpdate;
//# sourceMappingURL=validateMiddleware.js.map