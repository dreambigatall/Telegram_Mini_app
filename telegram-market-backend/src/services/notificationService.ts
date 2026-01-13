import bot from '../bot';
import logger from '../utils/logger';

export class NotificationService {
  static async notifyAdminNewProduct(data: {
    sellerName: string;
    title: string;
    price: number;
    mediaFileId?: string;
  }): Promise<void> {
    const adminId = process.env.SUPER_ADMIN_ID;
    
    if (!adminId) {
      logger.warn('SUPER_ADMIN_ID not set, skipping admin notification');
      return;
    }

    const message = `
🔔 <b>New Submission Received!</b>

<b>Seller:</b> @${data.sellerName}
<b>Item:</b> ${data.title}
<b>Price:</b> $${data.price}
<b>Status:</b> ⏳ Pending Review

<i>Use the Admin Dashboard to approve or reject.</i>
    `;

    try {
      await bot.telegram.sendMessage(adminId, message, { parse_mode: 'HTML' });
      
      if (data.mediaFileId) {
        await bot.telegram.sendPhoto(adminId, data.mediaFileId, { 
          caption: `Photo for item: ${data.title}` 
        });
      }
    } catch (error) {
      logger.error("Failed to send Admin notification", { error });
      // Don't throw - notification failure shouldn't break the request
    }
  }

  static async notifySellerProductApproved(
    telegramId: string,
    productTitle: string
  ): Promise<void> {
    try {
      await bot.telegram.sendMessage(
        telegramId, 
        `🎉 <b>Good News!</b>\n\nYour item "<b>${productTitle}</b>" has been approved and is now live on the marketplace.`,
        { parse_mode: 'HTML' }
      );
    } catch (error) {
      logger.error("Could not notify seller", { error, telegramId });
      // Don't throw - notification failure shouldn't break the request
    }
  }

  static async notifySellerProductRejected(
    telegramId: string,
    productTitle: string,
    reason?: string
  ): Promise<void> {
    try {
      await bot.telegram.sendMessage(
        telegramId, 
        `❌ <b>Update on your item</b>\n\nYour item "${productTitle}" was declined.\nReason: ${reason || 'Does not meet guidelines.'}`,
        { parse_mode: 'HTML' }
      );
    } catch (error) {
      logger.error("Could not notify seller", { error, telegramId });
      // Don't throw - notification failure shouldn't break the request
    }
  }
}

