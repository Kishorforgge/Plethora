import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';

// Extend Express Request interface to include the user property
export interface AuthRequest extends Request {
  user?: IUser;
}

interface JwtPayload {
  id: string;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET;
      
      if (!secret) {
        res.status(500);
        return next(new Error('JWT_SECRET is missing in environment variables.'));
      }

      const decoded = jwt.verify(token, secret) as JwtPayload;
      
      const user = await User.findById(decoded.id);
      if (!user) {
        res.status(401);
        return next(new Error('User not found. Authorization failed.'));
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401);
      return next(new Error('Not authorized, token validation failed.'));
    }
  } else {
    res.status(401);
    return next(new Error('Not authorized, no token provided.'));
  }
};

export const optionalProtect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const secret = process.env.JWT_SECRET;
      
      if (secret) {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
        }
      }
    } catch (error) {
      // Quietly ignore token issues in optional protect to let anonymous users browse
    }
  }
  next();
};
