import { json, verifyJWT } from '../../_utils.js';

// GET /api/user/services - Get user services
export async function onRequestGet({ request, env }) {
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
    const services = userInfo.services || [];

    // Return basic service info for dashboard
    const basicServices = services.map(service => ({
      id: service.id,
      name: service.name,
      type: service.type,
      status: service.status,
      createdAt: service.createdAt
    }));

    return json(basicServices);
  } catch (error) {
    console.error('Services error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}

// POST /api/user/services - Create new service
export async function onRequestPost({ request, env }) {
  try {
    // Verify JWT token
    const user = await verifyJWT(request, env.JWT_SECRET);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { name, type, config } = await request.json();

    // Validate input
    if (!name || !type) {
      return json({ error: 'Name and type are required' }, 400);
    }

    // Get user data from KV
    const userData = await env.USERS_KV.get(`user:${user.username}`);
    if (!userData) {
      return json({ error: 'User not found' }, 404);
    }

    const userInfo = JSON.parse(userData);
    if (!userInfo.services) {
      userInfo.services = [];
    }

    // Create new service
    const newService = {
      id: Date.now().toString(),
      name,
      type,
      config: config || {},
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };

    userInfo.services.push(newService);

    // Save updated user data
    await env.USERS_KV.put(`user:${user.username}`, JSON.stringify(userInfo));

    // Add activity
    const { addActivity } = await import('./activities.js');
    await addActivity(env, user.username, 'service_created', `سرویس جدید "${name}" ایجاد شد`);

    return json(newService, 201);
  } catch (error) {
    console.error('Create service error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}

export async function onRequest({ request, env }) {
  const method = request.method;
  
  switch (method) {
    case 'GET':
      return onRequestGet({ request, env });
    case 'POST':
      return onRequestPost({ request, env });
    default:
      return json({ error: 'Method not allowed' }, 405);
  }
}
