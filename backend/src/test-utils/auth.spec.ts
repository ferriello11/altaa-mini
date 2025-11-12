import { hashPassword, verifyPassword } from '../lib/crypto';

describe('Password hashing utilities', () => {
  it('should correctly hash and verify a password', async () => {
    const plain = 'SuperSecret123';
    const hash = await hashPassword(plain);

    expect(typeof hash).toBe('string');
    expect(hash).not.toBe(plain);

    const isValid = await verifyPassword(plain, hash);
    expect(isValid).toBe(true);
  });

  it('should return false for invalid password comparison', async () => {
    const plain = 'SuperSecret123';
    const hash = await hashPassword(plain);

    const isValid = await verifyPassword('WrongPassword', hash);
    expect(isValid).toBe(false);
  });
});
