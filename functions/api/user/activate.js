import { json, error, getBody, verifyJWT, getCookie, USERS_KEY } from '../../_utils';

export async function onRequestPost({ request, env }) {
  const token = getCookie(request, 'session');
  if (!token) return error(401, 'غیر مجاز');
  
  const payload = await verifyJWT(env.JWT_SECRET, token);
  if (!payload) return error(401, 'توکن نامعتبر');
  
  const { activationCode } = await getBody(request);
  if (!activationCode || activationCode.length !== 4) {
    return error(400, 'کد فعالسازی باید 4 کاراکتر باشد');
  }
  
  // Get user data
  const userKey = USERS_KEY(payload.username);
  const user = await env.USERS_KV.get(userKey, { type: 'json' });
  if (!user) return error(404, 'کاربر یافت نشد');
  
  // Check activation codes
  let newPlan = null;
  let planFeatures = null;
  
  const normalCode = env.NORMAL_ACTIVATION_CODE;
  const proCode = env.PRO_ACTIVATION_CODE;
  const promaxCode = env.PROMAX_ACTIVATION_CODE;
  
  if (activationCode.toUpperCase() === normalCode) {
    newPlan = 'normal';
    planFeatures = {
      dnsRecords: 5,
      wireguardConfigs: 1,
      support: 'ticket',
      priority: 'normal'
    };
  } else if (activationCode.toUpperCase() === proCode) {
    newPlan = 'pro';
    planFeatures = {
      dnsRecords: 15,
      wireguardConfigs: 3,
      support: 'priority',
      priority: 'high'
    };
  } else if (activationCode.toUpperCase() === promaxCode) {
    newPlan = 'promax';
    planFeatures = {
      dnsRecords: -1, // unlimited
      wireguardConfigs: 10,
      support: '24/7',
      priority: 'highest'
    };
  } else {
    return error(400, 'کد فعالسازی نامعتبر');
  }
  
  // Update user with new plan
  const updatedUser = {
    ...user,
    plan: newPlan,
    planFeatures: planFeatures,
    activatedAt: Date.now()
  };
  
  await env.USERS_KV.put(userKey, JSON.stringify(updatedUser));
  
  return json({
    ok: true,
    message: 'حساب شما با موفقیت فعال شد',
    plan: newPlan,
    features: planFeatures
  });
}
