import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordHasherService {
  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64MB
      timeCost: 3,
      parallelism: 4,
    });
  }

  async verify(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false;

    if (this.isBcryptHash(hash)) {
      try {
        return await bcrypt.compare(password, hash);
      } catch (err) {
        return false;
      }
    }

    try {
      return await argon2.verify(hash, password);
    } catch (err) {
      return false;
    }
  }

  isBcryptHash(hash: string): boolean {
    return typeof hash === 'string' && (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$'));
  }

  needsRehash(hash: string): boolean {
    return this.isBcryptHash(hash);
  }
}
