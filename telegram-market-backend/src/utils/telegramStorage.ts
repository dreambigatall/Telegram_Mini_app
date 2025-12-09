import bot from '../bot';
import logger from './logger';

/**
 * Uploads an image buffer to Telegram and returns the file_id
 * @param fileBuffer - The image file buffer
 * @param filename - Original filename (for logging)
 * @returns The Telegram file_id
 * @throws Error if upload fails
 */
export async function uploadImageToTelegram(
  fileBuffer: Buffer,
  filename?: string
): Promise<string> {
  try {
    // Use STORAGE_CHAT_ID (recommended: private channel ID) or SUPER_ADMIN_ID as fallback
    // STORAGE_CHAT_ID should be a private channel where the bot is an admin
    const storageChatId = process.env.STORAGE_CHAT_ID || process.env.SUPER_ADMIN_ID;
    
    if (!storageChatId) {
      throw new Error('STORAGE_CHAT_ID must be set for image uploads. Create a private channel, add your bot as admin, and set the channel ID in .env');
    }

    // Upload photo to Telegram - Telegraf accepts buffer directly
    // We'll send it to a storage chat and get the file_id
    const message = await bot.telegram.sendPhoto(storageChatId, { source: fileBuffer }, {
      caption: `Storage: ${filename || 'uploaded-image'}`,
      disable_notification: true // Don't notify on storage uploads
    });

    // Extract file_id from the sent photo
    // Telegram sends multiple photo sizes, get the largest one
    const photo = message.photo;
    if (!photo || photo.length === 0) {
      throw new Error('No photo returned from Telegram');
    }

    // Get the largest photo (last in array)
    const largestPhoto = photo[photo.length - 1];
    const fileId = largestPhoto.file_id;

    logger.info('Image uploaded to Telegram', {
      fileId,
      filename,
      chatId: storageChatId
    });

    return fileId;
  } catch (error) {
    logger.error('Failed to upload image to Telegram', {
      error,
      filename
    });
    throw new Error(`Failed to upload image to Telegram: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Uploads multiple images to Telegram
 * @param files - Array of file objects with buffer and filename
 * @returns Array of file_ids
 */
export async function uploadMultipleImagesToTelegram(
  files: Array<{ buffer: Buffer; filename?: string }>
): Promise<string[]> {
  const uploadPromises = files.map(file => 
    uploadImageToTelegram(file.buffer, file.filename)
  );

  try {
    const fileIds = await Promise.all(uploadPromises);
    return fileIds;
  } catch (error) {
    logger.error('Failed to upload multiple images', { error });
    throw error;
  }
}

