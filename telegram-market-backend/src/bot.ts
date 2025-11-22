// import { Telegraf } from 'telegraf';
// import dotenv from 'dotenv';

// dotenv.config();

// if (!process.env.BOT_TOKEN) {
//   throw new Error("BOT_TOKEN must be provided!");
// }

// const bot = new Telegraf(process.env.BOT_TOKEN);

// // Basic test command to verify it works
// bot.command('ping', (ctx) => {
//   ctx.reply('Pong! Backend is running.');
// });

// // We will add the invite logic here in Day 4
// // bot.start((ctx) => ... )

// // Graceful stop
// process.once('SIGINT', () => bot.stop('SIGINT'));
// process.once('SIGTERM', () => bot.stop('SIGTERM'));

// export default bot;

import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import Invite from './models/Invite';
import User, { UserRole } from './models/User';
import mongoose from 'mongoose';
import { message } from 'telegraf/filters';

dotenv.config();

if (!process.env.BOT_TOKEN) {
  throw new Error("BOT_TOKEN must be provided!");
}

const bot = new Telegraf(process.env.BOT_TOKEN);

// Handle /start command
bot.start(async (ctx) => {
  try {
    const telegramId = ctx.from.id.toString();
    const username = ctx.from.username;
    const firstName = ctx.from.first_name;
    
    // The payload is the text AFTER "start "
    // Example: https://t.me/bot?start=a1b2c3d4 -> payload = "a1b2c3d4"
    const code = ctx.payload; 

    // 1. Check if User already exists
    const existingUser = await User.findOne({ telegramId });
    
    if (existingUser) {
      // If they exist, just say hi
      ctx.reply(`Welcome back, ${firstName}! You are already registered.`);
      return;
    }

    // 2. If no code provided and no user exists -> Reject
    if (!code) {
      ctx.reply("⛔ Access Denied. You need an invite link to join this marketplace.");
      return;
    }

    // 3. Validate the Invite Code
    const invite = await Invite.findOne({ code, isUsed: false });

    if (!invite) {
      ctx.reply("❌ Invalid or expired invite code.");
      return;
    }

    // 4. Create the New User
    const newUser = await User.create({
      telegramId,
      username,
      firstName,
      role: invite.roleToAssign, // Assigns 'USER' or 'ADMIN' based on invite
      isBanned: false
    });

    // 5. Mark Invite as Used
    invite.isUsed = true;
    invite.usedBy = newUser._id as mongoose.Types.ObjectId;
    await invite.save();

    // 6. Success Message
    ctx.reply(`✅ Access Granted!\n\nRole: ${newUser.role}\n\nYou can now open the Mini App.`);
    
    // Optional: Notify the Admin who created the invite
    // bot.telegram.sendMessage(invite.createdBy.toString(), `Your invite was used by ${username}`);

  } catch (error) {
    console.error('Bot Error:', error);
    ctx.reply("An error occurred processing your request.");
  }
});

// Listen for any photo sent to the bot
bot.on(message('photo'), (ctx) => {
  // Telegram sends multiple sizes. The last one is the highest quality.
  const bestPhoto = ctx.message.photo.pop(); 
  
  if (bestPhoto) {
    const fileId = bestPhoto.file_id;
    
    // Reply with the code so the user can copy it
    ctx.reply(
      `📸 <b>Image Received!</b>\n\nCopy this code below and paste it in the "Image Code" field in the app:\n\n<code>${fileId}</code>`,
      { parse_mode: 'HTML' }
    );
  }
});

// Keep the graceful stops
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export default bot;