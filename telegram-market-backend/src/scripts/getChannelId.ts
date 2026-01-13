/**
 * Helper script to get Telegram Channel ID
 * 
 * Usage:
 * 1. Add your bot to a channel as admin
 * 2. Send a message in that channel
 * 3. Run: npm run get-channel-id
 * 4. The script will show the channel ID
 */

import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN not found in .env');
  process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

console.log('🤖 Bot started. Send a message in your channel...\n');
console.log('Waiting for channel messages...\n');

// Handle channel posts (when bot receives messages from channels)
bot.on('channel_post', async (ctx) => {
  const chatId = ctx.chat.id;
  const chatTitle = 'title' in ctx.chat ? ctx.chat.title || 'Unknown' : 'Unknown';
  
  console.log('✅ Channel detected!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Channel Name: ${chatTitle}`);
  console.log(`Channel ID: ${chatId}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📝 Add this to your .env file:');
  console.log(`STORAGE_CHAT_ID=${chatId}\n`);
  console.log('Press Ctrl+C to exit');
});

// Handle regular messages (for groups/supergroups that might be used)
bot.on('message', async (ctx) => {
  const chatType = ctx.chat.type;
  
  // Check if it's a group or supergroup (channels use channel_post, not message)
  if (chatType === 'group' || chatType === 'supergroup') {
    const chatId = ctx.chat.id;
    const chatTitle = 'title' in ctx.chat ? ctx.chat.title || 'Unknown' : 'Unknown';
    
    console.log('✅ Group/Supergroup detected!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Chat Name: ${chatTitle}`);
    console.log(`Chat ID: ${chatId}`);
    console.log(`Chat Type: ${chatType}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📝 Add this to your .env file:');
    console.log(`STORAGE_CHAT_ID=${chatId}\n`);
    console.log('Note: For channels, send a message in the channel to get the ID');
    console.log('Press Ctrl+C to exit');
  }
});

bot.launch().then(() => {
  console.log('✅ Bot is running. Send a message in your channel to get the ID.\n');
}).catch((error) => {
  console.error('❌ Failed to start bot:', error.message);
  process.exit(1);
});

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  bot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  process.exit(0);
});

