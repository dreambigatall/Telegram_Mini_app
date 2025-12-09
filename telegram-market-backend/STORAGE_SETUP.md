# Image Storage Setup Guide

This guide explains how to set up a private Telegram channel for storing product images.

## Why Use a Private Channel?

- Images are stored on the bot's channel, not your personal account
- Better organization and management
- No notifications to your personal account
- Can be accessed by multiple admins if needed

## Setup Steps

### Step 1: Create a Private Channel

1. Open Telegram
2. Click the menu (☰) → **New Channel**
3. Name it (e.g., "Marketplace Storage" or "Bot Storage")
4. Make it **Private** (not public)
5. Click **Create**

### Step 2: Add Your Bot as Admin

1. In the channel, click the channel name at the top
2. Click **Administrators** → **Add Administrator**
3. Search for your bot by username (e.g., `@YourBotName`)
4. Select your bot
5. Give it **Post Messages** permission (minimum required)
6. Click **Done**

### Step 3: Get the Channel ID

You have two options:

#### Option A: Using a Helper Bot (Easiest)

1. Forward any message from your private channel to [@userinfobot](https://t.me/userinfobot)
2. The bot will reply with the channel ID (looks like `-1001234567890`)

#### Option B: Using Your Bot (Programmatic)

1. Send a message to your private channel
2. Use this script to get the channel ID:

```javascript
// Add this temporarily to your bot.ts
bot.on('message', async (ctx) => {
  if (ctx.chat.type === 'channel') {
    console.log('Channel ID:', ctx.chat.id);
    await ctx.reply(`Channel ID: ${ctx.chat.id}`);
  }
});
```

Then send a message in the channel, and the bot will reply with the ID.

#### Option C: Using Telegram API

1. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
2. Send a message in your channel
3. Look for `"chat":{"id":-1001234567890}` in the response
4. The ID will be negative (e.g., `-1001234567890`)

### Step 4: Set Environment Variable

Add to your `.env` file:

```env
STORAGE_CHAT_ID=-1001234567890
```

Replace `-1001234567890` with your actual channel ID.

### Step 5: Test

1. Restart your backend server
2. Try uploading an image when creating a product
3. Check your private channel - you should see the uploaded image there

## Important Notes

- **Channel ID Format**: Channel IDs are negative numbers starting with `-100` (e.g., `-1001234567890`)
- **Bot Permissions**: The bot must be an admin with at least "Post Messages" permission
- **Privacy**: Keep the channel private - only admins should have access
- **No Notifications**: Images are uploaded with `disable_notification: true`, so you won't get spammed

## Troubleshooting

### Error: "STORAGE_CHAT_ID must be set"
- Make sure you've added `STORAGE_CHAT_ID` to your `.env` file
- Restart your server after adding the variable

### Error: "Chat not found" or "Forbidden"
- Make sure the bot is added as an admin in the channel
- Check that the channel ID is correct (must be negative, e.g., `-1001234567890`)
- Verify the bot has "Post Messages" permission

### Images not appearing in channel
- Check bot permissions in the channel
- Verify the channel ID is correct
- Check server logs for error messages

## Alternative: Use SUPER_ADMIN_ID (Not Recommended)

If you don't want to create a channel, you can use your personal Telegram ID:

```env
SUPER_ADMIN_ID=123456789
```

**Note**: This will send images to your personal account, which is not recommended for production.

