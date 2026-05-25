import { IUser } from '../../models/User';

declare global {
  namespace Express {
    // Extend Passport's User interface with our mongoose IUser interface
    interface User extends IUser {}
  }
}
