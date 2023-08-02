import { createHmac, pbkdf2 } from 'crypto';

const cachedKeys: { [key: string]: Buffer } = {};

/**
 * Based on https://github.com/rails/rails/blob/e88857bbb9d4e1dd64555c34541301870de4a45b/activesupport/lib/active_support/key_generator.rb#L39
 */
export async function generateKey(salt: string) {
  if (cachedKeys[salt]) {
    return cachedKeys[salt];
  }
  const SECRET_KEY_BASE = process.env.SECRET_KEY_BASE;
  if (!SECRET_KEY_BASE) {
    throw new Error('SECRET_KEY_BASE is not set');
  }
  return new Promise<Buffer>((resolve, reject) => {
    pbkdf2(SECRET_KEY_BASE, salt, Math.pow(2, 16), 64, 'sha1', (err, key) => {
      if (err) {
        reject(err);
      } else {
        cachedKeys[salt] = key;
        resolve(key);
      }
    });
  });
}

export async function hashInvitationToken(token: string) {
  const key = await generateKey('Devise invitation_token');
  const hmac = createHmac('sha256', key);
  hmac.update(token);
  return hmac.digest('hex');
}
