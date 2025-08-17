import * as crypto from 'crypto';

export function verifyDodoWebhookSignature(payload: string, signature: string): boolean {
  if (!process.env.DODO_WEBHOOK_SECRET) {
    throw new Error('Missing DODO_WEBHOOK_SECRET environment variable');
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.DODO_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
