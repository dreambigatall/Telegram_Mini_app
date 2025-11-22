import crypto from 'crypto';

interface UserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export const validateTelegramData = (initData: string): UserData | null => {
  if (!process.env.BOT_TOKEN) throw new Error('BOT_TOKEN is missing');

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');

  if (!hash) return null;

  // 1. Sort keys alphabetically
  urlParams.delete('hash');
  const dataCheckString = Array.from(urlParams.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // 2. Create Secret Key using HMAC-SHA256 on Bot Token
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(process.env.BOT_TOKEN)
    .digest();

  // 3. Generate Hash using the Secret Key and dataCheckString
  const generatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // 4. Compare
  if (generatedHash === hash) {
    // Valid! Parse the user object
    const userStr = urlParams.get('user');
    if (userStr) {
      return JSON.parse(userStr) as UserData;
    }
  }
  
  return null;
};