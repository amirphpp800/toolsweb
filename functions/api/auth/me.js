import { json, getCookie, verifyJWT, USERS_KEY } from '../../_utils';

export async function onRequest({ request, env }){
  const token = getCookie(request, 'session');
  if(!token) return json({ guest:true });
  const payload = await verifyJWT(env.JWT_SECRET, token);
  if(!payload) return json({ guest:true });
  
  // Get full user data from KV
  try {
    const userKey = USERS_KEY(payload.username);
    const user = await env.USERS_KV.get(userKey, { type: 'json' });
    if (user) {
      return json({ 
        username: user.username, 
        role: user.role,
        userUUID: user.userUUID,
        plan: user.plan || 'free',
        planFeatures: user.planFeatures,
        createdAt: user.createdAt,
        activatedAt: user.activatedAt
      });
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
  
  // Fallback to token data
  return json({ 
    username: payload.username, 
    role: payload.role,
    userUUID: payload.userUUID,
    plan: 'free'
  });
}
