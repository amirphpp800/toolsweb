import { json, getCookie, verifyJWT } from '../../_utils';

export async function onRequest({ request, env }){
  const token = getCookie(request, 'session');
  if(!token) return json({ guest:true });
  const payload = await verifyJWT(env.JWT_SECRET, token);
  if(!payload) return json({ guest:true });
  return json({ username: payload.username, role: payload.role });
}
