import { json, error, getCookie, verifyJWT } from '../../_utils';

export async function onRequestGet({ request, env }){
  const token = getCookie(request, 'admin_session');
  const payload = token ? await verifyJWT(env.JWT_SECRET, token) : null;
  const authed = !!(payload && payload.role === 'admin');

  let kvOk = false; let userCount = 0;
  try{
    const list = await env.USERS_KV.list({ prefix:'user:' });
    kvOk = true;
    userCount = list.keys.length;
  }catch{
    kvOk = false;
  }

  const adminConfigured = !!(env.ADMIN_USERNAME && env.ADMIN_PASSWORD);
  return json({
    authed,
    kv: kvOk ? 'connected' : 'disconnected',
    adminConfigured,
    userCount,
    service: 'active'
  });
}
