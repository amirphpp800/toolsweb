import { json, verifyJWT } from '../../_utils.js';

// GET /api/user/stats - Get user statistics
export async function onRequest({ request, env }) {
  try {
    // Verify JWT token
    const user = await verifyJWT(request, env.JWT_SECRET);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    // Get user data from KV
    const userData = await env.USERS_KV.get(`user:${user.username}`);
    if (!userData) {
      return json({ error: 'User not found' }, 404);
    }

    const userInfo = JSON.parse(userData);

    // Calculate statistics
    const stats = {
      activeServices: userInfo.services?.filter(s => s.status === 'active').length || 0,
      dnsRecords: userInfo.dnsRecords?.length || 0,
      wireGuardConfigs: userInfo.wireGuardConfigs?.filter(c => c.status === 'active').length || 0,
      remainingCredit: userInfo.balance || 0,
      totalServices: userInfo.services?.length || 0,
      monthlyUsage: userInfo.monthlyUsage || 0
    };

    return json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}
