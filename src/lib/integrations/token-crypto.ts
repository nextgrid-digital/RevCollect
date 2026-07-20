import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const raw = process.env.EMAIL_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('EMAIL_ENCRYPTION_KEY is not configured');
  }

  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('EMAIL_ENCRYPTION_KEY must be 32 bytes (base64-encoded)');
  }

  return key;
}

export interface EncryptedPayload {
  ciphertext: string;
  nonce: string;
}

export function encryptSecret(plaintext: string): EncryptedPayload {
  const key = getEncryptionKey();
  const nonce = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, nonce);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: Buffer.concat([encrypted, authTag]).toString('base64'),
    nonce: nonce.toString('base64')
  };
}

export function decryptSecret(payload: EncryptedPayload): string {
  const key = getEncryptionKey();
  const nonce = Buffer.from(payload.nonce, 'base64');
  const data = Buffer.from(payload.ciphertext, 'base64');
  const authTag = data.subarray(data.length - 16);
  const ciphertext = data.subarray(0, data.length - 16);

  const decipher = createDecipheriv(ALGORITHM, key, nonce);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}
