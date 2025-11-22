import type { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser; // We will attach the Database User Model here
    }
  }
}

// Export empty object to make this a module
export {};