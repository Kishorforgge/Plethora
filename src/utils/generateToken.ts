import jwt from 'jsonwebtoken';

/**
 * Generates a signed JWT token containing the user's ID
 * @param id The user ID string to encode in the payload
 * @returns Signed JWT token
 */
export const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in the environment variables.');
  }

  return jwt.sign({ id }, secret, {
    expiresIn: (process.env.JWT_EXPIRE || '7d') as any,
  });
};
