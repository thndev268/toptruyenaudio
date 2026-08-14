import { PasswordHasherService } from './password-hasher.service';
import * as bcrypt from 'bcrypt';

describe('PasswordHasherService', () => {
  let passwordHasher: PasswordHasherService;

  beforeEach(() => {
    passwordHasher = new PasswordHasherService();
  });

  it('should hash password using Argon2id', async () => {
    const rawPassword = 'SecurePassword123!';
    const hash = await passwordHasher.hash(rawPassword);

    expect(hash).toBeDefined();
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(passwordHasher.isBcryptHash(hash)).toBe(false);
  });

  it('should verify correct Argon2id password', async () => {
    const rawPassword = 'SecurePassword123!';
    const hash = await passwordHasher.hash(rawPassword);

    const isValid = await passwordHasher.verify(rawPassword, hash);
    expect(isValid).toBe(true);

    const isInvalid = await passwordHasher.verify('WrongPassword', hash);
    expect(isInvalid).toBe(false);
  });

  it('should fallback and verify legacy bcrypt hash', async () => {
    const rawPassword = 'LegacyBcryptPassword123!';
    const legacyBcryptHash = await bcrypt.hash(rawPassword, 10);

    expect(passwordHasher.isBcryptHash(legacyBcryptHash)).toBe(true);
    expect(passwordHasher.needsRehash(legacyBcryptHash)).toBe(true);

    const isValid = await passwordHasher.verify(rawPassword, legacyBcryptHash);
    expect(isValid).toBe(true);

    const isInvalid = await passwordHasher.verify('WrongPassword', legacyBcryptHash);
    expect(isInvalid).toBe(false);
  });
});
