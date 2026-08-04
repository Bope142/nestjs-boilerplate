import {
  createHash,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { getAuthConfig } from '../../../config/auth.config';

@Injectable()
export class TokenEncryptionService {
  private readonly algorithm = 'aes-256-gcm' as const;

  encrypt(plaintext: string): string {
    const key = this.resolveKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64url');
  }

  decrypt(envelope: string): string {
    try {
      const key = this.resolveKey();
      const payload = Buffer.from(envelope, 'base64url');
      if (payload.length < 28) {
        throw new Error('Envelope too short');
      }
      const iv = payload.subarray(0, 12);
      const authTag = payload.subarray(12, 28);
      const encrypted = payload.subarray(28);
      const decipher = createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN_ENVELOPE',
        message: 'Enveloppe de jeton invalide ou corrompue',
      });
    }
  }

  private resolveKey(): Buffer {
    const raw = getAuthConfig().tokenEncryptionKey;
    return createHash('sha256').update(raw).digest();
  }
}
