import { json, hmacB64, randomCaptcha } from '../../_utils';

// GET /api/auth/captcha -> { text, ts, sig }
// sig = HMAC(JWT_SECRET, `${text}|${ts}`)
// Expire after 2 minutes on verification
export async function onRequest({ env }){
  const text = randomCaptcha();
  const ts = Date.now();
  const sig = await hmacB64(env.JWT_SECRET, `${text}|${ts}`);
  return json({ text, ts, sig });
}
