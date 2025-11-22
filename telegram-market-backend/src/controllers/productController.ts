import { Request, Response } from 'express';
import axios from 'axios';
import Product, { ProductStatus } from '../models/Product';
import bot from '../bot'; // Import the bot instance
import dotenv from 'dotenv';

dotenv.config();

// @desc    Submit a new product for review
// @route   POST /api/products
// @access  Private (User)
export const submitProduct = async (req: Request, res: Response) => {
  try {
    const { title, description, originalPrice, mediaFileId } = req.body;

    // 1. Basic Validation
    if (!title || !originalPrice) {
      res.status(400).json({ message: 'Title and Price are required' });
      return;
    }

    // 2. Create the Product in DB (Status defaults to PENDING)
    const product = await Product.create({
      seller: req.user?._id, // Linked to the logged-in user
      title,
      description,
      originalPrice,
      mediaFileId, // The Telegram File ID (passed from frontend)
      status: ProductStatus.PENDING
    });

    // 3. NOTIFY THE ADMIN (The Interception)
    // We send a message to the Super Admin defined in .env
    const adminId = process.env.SUPER_ADMIN_ID;
    
    if (adminId) {
      const sellerName = req.user?.username || req.user?.firstName || 'Unknown User';
      
      const message = `
🔔 <b>New Submission Received!</b>

<b>Seller:</b> @${sellerName}
<b>Item:</b> ${title}
<b>Price:</b> $${originalPrice}
<b>Status:</b> ⏳ Pending Review

<i>Use the Admin Dashboard to approve or reject.</i>
      `;

      try {
        // Send text notification
        await bot.telegram.sendMessage(adminId, message, { parse_mode: 'HTML' });
        
        // Optional: If there is a photo (mediaFileId), forward it to Admin too
        if (mediaFileId) {
             // Note: This assumes mediaFileId is a valid Telegram file_id
             // If it's a URL, use sendPhoto({ url: ... })
             await bot.telegram.sendPhoto(adminId, mediaFileId, { 
               caption: `Photo for item: ${title}` 
             });
        }
      } catch (botError) {
        console.error("Failed to send Admin notification:", botError);
        // We don't stop the request if the bot fails, just log it
      }
    }

    res.status(201).json({
      success: true,
      message: 'Item submitted for review',
      product
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getPendingProducts = async (req: Request, res: Response) => {
    try {
      // Fetch items with status PENDING
      // .populate('seller', 'username firstName telegramId') allows you to see WHO is selling it
      const products = await Product.find({ status: ProductStatus.PENDING })
        .populate('seller', 'username firstName telegramId')
        .sort({ createdAt: -1 });
  
      res.status(200).json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  };
  
  // @desc    Approve and Publish a product
  // @route   PATCH /api/products/:id/approve
  // @access  Private (Admin/SuperAdmin)
  export const approveProduct = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { finalPrice, adminUsername, adminPhone } = req.body;
  
      const product = await Product.findById(id).populate('seller');
  
      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }
  
      if (product.status !== ProductStatus.PENDING) {
        res.status(400).json({ message: 'Product is not pending review' });
        return;
      }
  
      // 1. Update the Product Fields
      product.status = ProductStatus.PUBLISHED;
      product.approvedBy = req.user?._id; // You approved it
      product.finalPrice = finalPrice || product.originalPrice; // Optional price adjustment
      
      // 2. THE MASKING: Set the Admin's contact info
      product.adminContact = {
        username: adminUsername || req.user?.username || process.env.BOT_USERNAME || 'Admin',
        phoneNumber: adminPhone || '' // Optional
      };
  
      await product.save();
  
      // 3. Notify the Original Seller via Bot
      // We access the seller's telegramId via the populated field
      const seller = product.seller as any; 
      
      if (seller && seller.telegramId) {
          try {
              await bot.telegram.sendMessage(
                  seller.telegramId, 
                  `🎉 <b>Good News!</b>\n\nYour item "<b>${product.title}</b>" has been approved and is now live on the marketplace.`
              , { parse_mode: 'HTML' });
          } catch (err) {
              console.log("Could not notify seller (maybe blocked bot).");
          }
      }
  
      res.status(200).json({ success: true, message: 'Product Published', product });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  };
  
  // @desc    Reject a product
  // @route   PATCH /api/products/:id/reject
  // @access  Private (Admin/SuperAdmin)
  export const rejectProduct = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
  
      const product = await Product.findById(id).populate('seller');
  
      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }
  
      product.status = ProductStatus.REJECTED;
      await product.save();
  
      // Notify Seller
      const seller = product.seller as any;
      if (seller && seller.telegramId) {
          await bot.telegram.sendMessage(
              seller.telegramId, 
              `❌ <b>Update on your item</b>\n\nYour item "${product.title}" was declined.\nReason: ${reason || 'Does not meet guidelines.'}`
          , { parse_mode: 'HTML' });
      }
  
      res.status(200).json({ success: true, message: 'Product Rejected' });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  };

  // @desc    Get the public feed (Buyers View)
// @route   GET /api/products/feed
// @access  Private (Any Logged in User)
export const getPublicFeed = async (req: Request, res: Response) => {
    try {
      // 1. Find ONLY Published items
      const products = await Product.find({ status: ProductStatus.PUBLISHED })
        // 2. SORT: Show recently updated/approved items first
        .sort({ updatedAt: -1 })
        // 3. PROJECTION (The Safety Filter):
        // We explicitly EXCLUDE (-) the seller, originalPrice, and internal logs.
        // We only keep: title, description, mediaFileId, finalPrice, adminContact
        .select('-originalPrice -approvedBy -__v');
  
      res.status(200).json({
        success: true,
        count: products.length,
        data: products
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  };


  // @desc    Proxy Telegram Image
// @route   GET /api/products/image/:fileId
export const getProductImage = async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;

    // 1. Get the download URL from Telegram API
    // This generates a URL like: https://api.telegram.org/file/bot<TOKEN>/...
    const fileLink = await bot.telegram.getFileLink(fileId);

    // 2. Fetch the actual image data from Telegram
    const response = await axios({
      url: fileLink.href,
      method: 'GET',
      responseType: 'stream', // Important: We want the raw image data
    });

    // 3. Pipe the image data directly to the Frontend
    // This way, the Frontend gets the image, but NEVER sees your Bot Token
    response.data.pipe(res);

  } catch (error) {
    console.error('Image Proxy Error:', error);
    res.status(404).send('Image not found');
  }
};