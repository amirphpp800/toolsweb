import { json, verifyJWT } from '../../_utils.js';

// GET /api/user/dns - Get user DNS records
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
    const dnsRecords = userInfo.dnsRecords || [];

    return json(dnsRecords);
  } catch (error) {
    console.error('DNS get error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}

// POST /api/user/dns - Create new DNS record
export async function onRequestPost({ request, env }) {
  try {
    // Verify JWT token
    const user = await verifyJWT(request, env.JWT_SECRET);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { name, type, value, ttl } = await request.json();

    // Validate input
    if (!name || !type || !value) {
      return json({ error: 'Name, type, and value are required' }, 400);
    }

    const validTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS'];
    if (!validTypes.includes(type.toUpperCase())) {
      return json({ error: 'Invalid DNS record type' }, 400);
    }

    // Get user data from KV
    const userData = await env.USERS_KV.get(`user:${user.username}`);
    if (!userData) {
      return json({ error: 'User not found' }, 404);
    }

    const userInfo = JSON.parse(userData);
    if (!userInfo.dnsRecords) {
      userInfo.dnsRecords = [];
    }

    // Create new DNS record
    const newRecord = {
      id: Date.now().toString(),
      name: name.toLowerCase(),
      type: type.toUpperCase(),
      value,
      ttl: ttl || 3600,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    userInfo.dnsRecords.push(newRecord);

    // Save updated user data
    await env.USERS_KV.put(`user:${user.username}`, JSON.stringify(userInfo));

    // Add activity
    const { addActivity } = await import('./activities.js');
    await addActivity(env, user.username, 'dns_added', `رکورد DNS جدید "${name}" اضافه شد`);

    return json(newRecord, 201);
  } catch (error) {
    console.error('DNS create error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}

// PUT /api/user/dns/:id - Update DNS record
export async function onRequestPut({ request, env }) {
  try {
    // Verify JWT token
    const user = await verifyJWT(request, env.JWT_SECRET);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const url = new URL(request.url);
    const recordId = url.pathname.split('/').pop();
    
    const { name, type, value, ttl } = await request.json();

    // Get user data from KV
    const userData = await env.USERS_KV.get(`user:${user.username}`);
    if (!userData) {
      return json({ error: 'User not found' }, 404);
    }

    const userInfo = JSON.parse(userData);
    const recordIndex = userInfo.dnsRecords?.findIndex(r => r.id === recordId);
    
    if (recordIndex === -1) {
      return json({ error: 'DNS record not found' }, 404);
    }

    // Update record
    const record = userInfo.dnsRecords[recordIndex];
    if (name) record.name = name.toLowerCase();
    if (type) record.type = type.toUpperCase();
    if (value) record.value = value;
    if (ttl) record.ttl = ttl;
    record.updatedAt = new Date().toISOString();

    // Save updated user data
    await env.USERS_KV.put(`user:${user.username}`, JSON.stringify(userInfo));

    // Add activity
    const { addActivity } = await import('./activities.js');
    await addActivity(env, user.username, 'dns_updated', `رکورد DNS "${record.name}" بروزرسانی شد`);

    return json(record);
  } catch (error) {
    console.error('DNS update error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}

// DELETE /api/user/dns/:id - Delete DNS record
export async function onRequestDelete({ request, env }) {
  try {
    // Verify JWT token
    const user = await verifyJWT(request, env.JWT_SECRET);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const url = new URL(request.url);
    const recordId = url.pathname.split('/').pop();

    // Get user data from KV
    const userData = await env.USERS_KV.get(`user:${user.username}`);
    if (!userData) {
      return json({ error: 'User not found' }, 404);
    }

    const userInfo = JSON.parse(userData);
    const recordIndex = userInfo.dnsRecords?.findIndex(r => r.id === recordId);
    
    if (recordIndex === -1) {
      return json({ error: 'DNS record not found' }, 404);
    }

    // Remove record
    const deletedRecord = userInfo.dnsRecords.splice(recordIndex, 1)[0];

    // Save updated user data
    await env.USERS_KV.put(`user:${user.username}`, JSON.stringify(userInfo));

    // Add activity
    const { addActivity } = await import('./activities.js');
    await addActivity(env, user.username, 'dns_deleted', `رکورد DNS "${deletedRecord.name}" حذف شد`);

    return json({ message: 'DNS record deleted successfully' });
  } catch (error) {
    console.error('DNS delete error:', error);
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
    case 'PUT':
      return onRequestPut({ request, env });
    case 'DELETE':
      return onRequestDelete({ request, env });
    default:
      return json({ error: 'Method not allowed' }, 405);
  }
}
