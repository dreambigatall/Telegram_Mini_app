import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User, { UserRole } from '../models/User';
import connectDB from '../config/db';

dotenv.config();

const seedSuperAdmin = async () => {
  await connectDB();

  const superAdminId = process.env.SUPER_ADMIN_ID;

  if (!superAdminId) {
    console.error('❌ SUPER_ADMIN_ID is missing in .env file');
    process.exit(1);
  }

  // Check if admin already exists
  const exists = await User.findOne({ telegramId: superAdminId });
  if (exists) {
    console.log('⚠️ Super Admin already exists.');
    process.exit();
  }

  // Create Super Admin
  await User.create({
    telegramId: superAdminId,
    role: UserRole.SUPER_ADMIN,
    username: 'SystemAdmin', // You can change this later
    isBanned: false
  });

  console.log('✅ Super Admin Created Successfully!');
  process.exit();
};

seedSuperAdmin();