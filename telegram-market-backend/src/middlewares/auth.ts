import { Request, Response, NextFunction } from 'express';
import { validateTelegramData } from '../utils/validateTelegramData';
import User from '../models/User';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Get the token from Headers
    // Frontend should send: Authorization: "query_id=..." (The raw initData string)
    const initData = req.headers.authorization;

    if (!initData) {
      res.status(401).json({ message: 'Not authorized, no token' });
      return;
    }

    // 2. Validate Telegram Signature
    const telegramUser = validateTelegramData(initData);

    if (!telegramUser) {
      res.status(401).json({ message: 'Invalid Telegram Data' });
      return;
    }

    // 3. Check if User exists in our Database
    // Since this is an Invite-Only app, if they aren't in DB, we block them.
    let user = await User.findOne({ telegramId: telegramUser.id.toString() });

    if (!user) {
      res.status(403).json({ message: 'Access Denied. You need an invite.' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ message: 'You are banned.' });
      return;
    }

    // 4. Sync Data (Optional but recommended)
    // If they changed their username on Telegram, update it in our DB automatically.
    if (user.username !== telegramUser.username || user.firstName !== telegramUser.first_name) {
      user.username = telegramUser.username || '';
      user.firstName = telegramUser.first_name || '';
      await user.save();
    }

    // 5. Attach to Request
    req.user = user;
    next();

  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// import { Request, Response, NextFunction } from 'express';
// import User, { UserRole } from '../models/User'; // Import UserRole

// // TEMPORARY DEV VERSION
// export const protect = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     // --- BYPASS START ---
//     // For testing Day 6, we force the system to think you are the Super Admin.
//     // validation logic is skipped.
    
//     // 1. Find your Super Admin User in DB
//     // Make sure this telegramID matches what you put in your Seed script/Database
//     const devAdminId = process.env.SUPER_ADMIN_ID; 
    
//     const user = await User.findOne({ telegramId: devAdminId });

//     if (!user) {
//         res.status(404).json({ message: 'Dev User not found in DB. Did you run npm run seed?' });
//         return;
//     }

//     // 2. Attach user to request
//     req.user = user;
    
//     console.log(`🔓 DEV MODE: Authenticated as ${user.username} (${user.role})`);
//     next(); 
//     return; 
//     // --- BYPASS END ---

//     /* 
//     // ORIGINAL CODE (UNCOMMENT THIS WHEN MOVING TO PRODUCTION/FRONTEND)
//     const initData = req.headers.authorization;
//     if (!initData) {
//       res.status(401).json({ message: 'Not authorized, no token' });
//       return;
//     }
//     // ... rest of validation logic
//     */

//   } catch (error) {
//     console.error(error);
//     res.status(401).json({ message: 'Auth Failed' });
//   }
// };


// import { Request, Response, NextFunction } from 'express';
// import { validateTelegramData } from '../utils/validateTelegramData';
// import User from '../models/User';

// export const protect = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     // 1. Get the token (initData) from Headers
//     const initData = req.headers.authorization;

//     if (!initData) {
//       res.status(401).json({ message: 'Not authorized, no token' });
//       return;
//     }

//     // 2. Validate Telegram Signature
//     const telegramUser = validateTelegramData(initData);

//     if (!telegramUser) {
//       res.status(401).json({ message: 'Invalid Telegram Data' });
//       return;
//     }

//     // 3. Find User in DB
//     let user = await User.findOne({ telegramId: telegramUser.id.toString() });

//     if (!user) {
//       // Allow Super Admin to bypass "Invite Only" check if they are the first user
//       if (telegramUser.id.toString() === process.env.SUPER_ADMIN_ID) {
//          // (Optional logic to auto-create super admin if missing, but usually we seed)
//       } else {
//          res.status(403).json({ message: 'Access Denied. You need an invite.' });
//          return;
//       }
//     }

//     // 4. Attach to Request
//     req.user = user;
//     next();

//   } catch (error) {
//     console.error(error);
//     res.status(401).json({ message: 'Not authorized, token failed' });
//   }
// };

