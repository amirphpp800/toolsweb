import { json, error, getCookie, verifyJWT } from '../../_utils';

export async function onRequestGet({ request, env }){
  const token = getCookie(request, 'admin_session');
  if(!token) return error(401, 'Unauthorized');
  const payload = await verifyJWT(env.JWT_SECRET, token);
  if(!payload || payload.role !== 'admin') return error(401, 'Unauthorized');
  const list = await env.USERS_KV.list({ prefix: 'user:' });
  const users = [];
  for(const k of list.keys){
    const u = await env.USERS_KV.get(k.name, { type:'json' });
    if(u) users.push({ username: u.username, createdAt: u.createdAt, role: u.role });
  }
  return json({ count: users.length, users });
}
