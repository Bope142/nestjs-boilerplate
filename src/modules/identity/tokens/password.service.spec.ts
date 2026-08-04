import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes and verifies a password with argon2id', async () => {
    const hash = await service.hash('StrongPass1!');
    expect(hash).not.toEqual('StrongPass1!');
    await expect(service.verify(hash, 'StrongPass1!')).resolves.toBe(true);
    await expect(service.verify(hash, 'wrong-password')).resolves.toBe(false);
  });
});
