/**
 * Generates a signed JWT token containing the user's ID
 * @param id The user ID string to encode in the payload
 * @returns Signed JWT token
 */
export declare const generateToken: (id: string) => string;
