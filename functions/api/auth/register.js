import { json, error, getBody, setCookie, signJWT, hashPassword, uid, generateUserUUID, USERS_KEY, hmacB64 } from '../../_utils';

export async function onRequestPost({ request, env }){
  const { username, password, captchaInput, captchaText, captchaTs, captchaSig } = await getBody(request);
  if(!username || !password || password.length < 8) return error(400, 'نام کاربری یا رمز نامعتبر');
  // Verify captcha (stateless)
  if(!captchaInput || !captchaText || !captchaTs || !captchaSig) return error(400, 'کپچا نامعتبر');
  const now = Date.now();
  const tsNum = Number(captchaTs);
  if(!Number.isFinite(tsNum) || now - tsNum > 2*60*1000) return error(400, 'کپچا منقضی شده است');
  const expected = await hmacB64(env.JWT_SECRET, `${captchaText}|${captchaTs}`);
  if(expected !== captchaSig) return error(400, 'کپچا نامعتبر');
  if(String(captchaInput).toUpperCase() !== String(captchaText).toUpperCase()) return error(400, 'کپچا اشتباه است');
  const key = USERS_KEY(username.toLowerCase());
  const existed = await env.USERS_KV.get(key, { type:'json' });
  if(existed) return error(409, 'کاربر موجود است');
  const salt = uid();
  const passHash = await hashPassword(password, salt);
  const userUUID = generateUserUUID();
  const user = { 
    id: uid(), 
    userUUID: userUUID,
    username: username.toLowerCase(), 
    salt, 
    passHash, 
    role:'user', 
    plan: 'free',
    planFeatures: {
      dnsRecords: 1,
      wireguardConfigs: 0,
      support: 'ticket',
      priority: 'low'
    },
    createdAt: Date.now(),
    activatedAt: null
  };
  await env.USERS_KV.put(key, JSON.stringify(user));
  const token = await signJWT(env.JWT_SECRET, { sub: user.id, username: user.username, role: user.role, userUUID: user.userUUID });
  const headers = { 'Set-Cookie': setCookie('session', token, { httpOnly:true, secure:true, sameSite:'Lax', path:'/' }) };
  return json({ ok:true, username: user.username, userUUID: user.userUUID }, { headers });
}
