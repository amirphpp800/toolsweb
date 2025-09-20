import { json, error, getBody, setCookie, signJWT, hashPassword, USERS_KEY } from '../../_utils';

export async function onRequestPost({ request, env }){
  const { username, password } = await getBody(request);
  if(!username || !password) return error(400, 'درخواست نامعتبر');
  const key = USERS_KEY(username.toLowerCase());
  const user = await env.USERS_KV.get(key, { type:'json' });
  if(!user) return error(404, 'کاربر یافت نشد');
  const passHash = await hashPassword(password, user.salt);
  if(passHash !== user.passHash) return error(401, 'رمز نادرست');
  const token = await signJWT(env.JWT_SECRET, { sub: user.id, username: user.username, role: user.role, userUUID: user.userUUID });
  const headers = { 'Set-Cookie': setCookie('session', token, { httpOnly:true, secure:true, sameSite:'Lax', path:'/' }) };
  return json({ ok:true, username: user.username, userUUID: user.userUUID, plan: user.plan }, { headers });
}
