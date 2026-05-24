import { Request, Response, NextFunction } from 'express';

/**
 * Validator middleware for user registration.
 */
export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  const { username, email, password, fullName } = req.body;
  const errors: string[] = [];

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

/**
 * Validator middleware for user login.
 */
export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  const errors: string[] = [];

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

/**
 * Validator middleware for comments.
 */
export const validateComment = (req: Request, res: Response, next: NextFunction) => {
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

/**
 * Validator middleware for profiles.
 */
export const validateProfileUpdate = (req: Request, res: Response, next: NextFunction) => {
  const { fullName, bio } = req.body;
  const errors: string[] = [];

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
