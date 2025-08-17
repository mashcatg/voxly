import { DODO_API_CONFIG } from '@/config/dodo';
import crypto from 'crypto';

export function verifyDodoWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}
