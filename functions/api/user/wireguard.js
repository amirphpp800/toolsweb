import { json, verifyJWT } from '../../_utils.js';

// GET /api/user/wireguard - Get user WireGuard configs
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
    const wireGuardConfigs = userInfo.wireGuardConfigs || [];

    // Return configs without private keys for security
    const safeConfigs = wireGuardConfigs.map(config => ({
      id: config.id,
      name: config.name,
      clientIP: config.clientIP,
      serverEndpoint: config.serverEndpoint,
      status: config.status,
      createdAt: config.createdAt,
      expiresAt: config.expiresAt,
      bytesUsed: config.bytesUsed || 0,
      lastHandshake: config.lastHandshake
    }));

    return json(safeConfigs);
  } catch (error) {
    console.error('WireGuard get error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}

// POST /api/user/wireguard - Create new WireGuard config
export async function onRequestPost({ request, env }) {
  try {
    // Verify JWT token
    const user = await verifyJWT(request, env.JWT_SECRET);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { name, serverLocation } = await request.json();

    // Validate input
    if (!name) {
      return json({ error: 'Config name is required' }, 400);
    }

    // Get user data from KV
    const userData = await env.USERS_KV.get(`user:${user.username}`);
    if (!userData) {
      return json({ error: 'User not found' }, 404);
    }

    const userInfo = JSON.parse(userData);
    if (!userInfo.wireGuardConfigs) {
      userInfo.wireGuardConfigs = [];
    }

    // Generate WireGuard keys (simplified for demo)
    const privateKey = generateWireGuardKey();
    const publicKey = generateWireGuardKey();
    const clientIP = generateClientIP(userInfo.wireGuardConfigs.length);

    // Create new WireGuard config
    const newConfig = {
      id: Date.now().toString(),
      name,
      privateKey,
      publicKey,
      clientIP,
      serverEndpoint: getServerEndpoint(serverLocation || 'default'),
      serverPublicKey: 'SERVER_PUBLIC_KEY_PLACEHOLDER',
      allowedIPs: '0.0.0.0/0',
      dns: '1.1.1.1, 8.8.8.8',
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      bytesUsed: 0,
      lastHandshake: null
    };

    userInfo.wireGuardConfigs.push(newConfig);

    // Save updated user data
    await env.USERS_KV.put(`user:${user.username}`, JSON.stringify(userInfo));

    // Add activity
    const { addActivity } = await import('./activities.js');
    await addActivity(env, user.username, 'wireguard_created', `کانفیگ WireGuard جدید "${name}" ایجاد شد`);

    // Return config without private key
    const { privateKey: _, ...safeConfig } = newConfig;
    return json(safeConfig, 201);
  } catch (error) {
    console.error('WireGuard create error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}

// GET /api/user/wireguard/:id/config - Download WireGuard config file
export async function onRequestGetConfig({ request, env }) {
  try {
    // Verify JWT token
    const user = await verifyJWT(request, env.JWT_SECRET);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const url = new URL(request.url);
    const configId = url.pathname.split('/')[4]; // /api/user/wireguard/:id/config

    // Get user data from KV
    const userData = await env.USERS_KV.get(`user:${user.username}`);
    if (!userData) {
      return json({ error: 'User not found' }, 404);
    }

    const userInfo = JSON.parse(userData);
    const config = userInfo.wireGuardConfigs?.find(c => c.id === configId);
    
    if (!config) {
      return json({ error: 'WireGuard config not found' }, 404);
    }

    // Generate WireGuard config file content
    const configContent = `[Interface]
PrivateKey = ${config.privateKey}
Address = ${config.clientIP}/24
DNS = ${config.dns}

[Peer]
PublicKey = ${config.serverPublicKey}
Endpoint = ${config.serverEndpoint}
AllowedIPs = ${config.allowedIPs}
PersistentKeepalive = 25`;

    return new Response(configContent, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${config.name}.conf"`
      }
    });
  } catch (error) {
    console.error('WireGuard config download error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}

// DELETE /api/user/wireguard/:id - Delete WireGuard config
export async function onRequestDelete({ request, env }) {
  try {
    // Verify JWT token
    const user = await verifyJWT(request, env.JWT_SECRET);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const url = new URL(request.url);
    const configId = url.pathname.split('/').pop();

    // Get user data from KV
    const userData = await env.USERS_KV.get(`user:${user.username}`);
    if (!userData) {
      return json({ error: 'User not found' }, 404);
    }

    const userInfo = JSON.parse(userData);
    const configIndex = userInfo.wireGuardConfigs?.findIndex(c => c.id === configId);
    
    if (configIndex === -1) {
      return json({ error: 'WireGuard config not found' }, 404);
    }

    // Remove config
    const deletedConfig = userInfo.wireGuardConfigs.splice(configIndex, 1)[0];

    // Save updated user data
    await env.USERS_KV.put(`user:${user.username}`, JSON.stringify(userInfo));

    // Add activity
    const { addActivity } = await import('./activities.js');
    await addActivity(env, user.username, 'wireguard_deleted', `کانفیگ WireGuard "${deletedConfig.name}" حذف شد`);

    return json({ message: 'WireGuard config deleted successfully' });
  } catch (error) {
    console.error('WireGuard delete error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}

// Helper functions
function generateWireGuardKey() {
  // This is a simplified key generation for demo purposes
  // In production, use proper WireGuard key generation
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateClientIP(index) {
  // Generate IP in 10.0.0.x range
  return `10.0.0.${index + 2}`;
}

function getServerEndpoint(location) {
  const endpoints = {
    'default': '185.143.223.123:51820',
    'germany': '185.143.223.124:51820',
    'netherlands': '185.143.223.125:51820',
    'usa': '185.143.223.126:51820'
  };
  return endpoints[location] || endpoints['default'];
}

export async function onRequest({ request, env }) {
  const method = request.method;
  const url = new URL(request.url);
  
  // Handle config download endpoint
  if (url.pathname.includes('/config')) {
    if (method === 'GET') {
      return onRequestGetConfig({ request, env });
    }
  } else {
    switch (method) {
      case 'GET':
        return onRequestGet({ request, env });
      case 'POST':
        return onRequestPost({ request, env });
      case 'DELETE':
        return onRequestDelete({ request, env });
    }
  }
  
  return json({ error: 'Method not allowed' }, 405);
}
