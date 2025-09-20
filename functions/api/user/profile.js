import { json, verifyJWT, hashPassword } from '../../_utils.js';

// GET /api/user/profile - Get user profile
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
    
    // Return profile data (without password)
    const profile = {
      username: userInfo.username,
      displayName: userInfo.displayName || userInfo.username,
      email: userInfo.email || '',
      phone: userInfo.phone || '',
      bio: userInfo.bio || '',
      createdAt: userInfo.createdAt,
      lastLogin: userInfo.lastLogin,
      avatar: userInfo.avatar || null,
      settings: userInfo.settings || {}
    };

    return json(profile);
  } catch (error) {
    console.error('Profile get error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}

// PUT /api/user/profile - Update user profile
export async function onRequestPut({ request, env }) {
  try {
    // Verify JWT token
    const user = await verifyJWT(request, env.JWT_SECRET);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const updates = await request.json();

    // Get user data from KV
    const userData = await env.USERS_KV.get(`user:${user.username}`);
    if (!userData) {
      return json({ error: 'User not found' }, 404);
    }

    const userInfo = JSON.parse(userData);

    // Update allowed fields
    const allowedFields = ['displayName', 'email', 'phone', 'bio'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        userInfo[field] = updates[field];
      }
    });

    // Update timestamp
    userInfo.updatedAt = new Date().toISOString();

    // Save updated user data
    await env.USERS_KV.put(`user:${user.username}`, JSON.stringify(userInfo));

    // Add activity
    const { addActivity } = await import('./activities.js');
    await addActivity(env, user.username, 'profile_updated', 'اطلاعات پروفایل بروزرسانی شد');

    return json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}

// POST /api/user/profile/password - Change password
export async function onRequestPost({ request, env }) {
  try {
    // Verify JWT token
    const user = await verifyJWT(request, env.JWT_SECRET);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return json({ error: 'Current and new passwords are required' }, 400);
    }

    if (newPassword.length < 6) {
      return json({ error: 'New password must be at least 6 characters' }, 400);
    }

    // Get user data from KV
    const userData = await env.USERS_KV.get(`user:${user.username}`);
    if (!userData) {
      return json({ error: 'User not found' }, 404);
    }

    const userInfo = JSON.parse(userData);

    // Verify current password
    const currentHash = await hashPassword(currentPassword, userInfo.salt);
    if (currentHash !== userInfo.password) {
      return json({ error: 'Current password is incorrect' }, 400);
    }

    // Generate new salt and hash new password
    const newSalt = crypto.getRandomValues(new Uint8Array(16));
    const newHash = await hashPassword(newPassword, newSalt);

    // Update password
    userInfo.password = newHash;
    userInfo.salt = Array.from(newSalt);
    userInfo.passwordChangedAt = new Date().toISOString();

    // Save updated user data
    await env.USERS_KV.put(`user:${user.username}`, JSON.stringify(userInfo));

    // Add activity
    const { addActivity } = await import('./activities.js');
    await addActivity(env, user.username, 'password_changed', 'رمز عبور تغییر کرد');

    return json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}

export async function onRequest({ request, env }) {
  const method = request.method;
  const url = new URL(request.url);
  
  if (url.pathname.endsWith('/password')) {
    if (method === 'POST') {
      return onRequestPost({ request, env });
    }
  } else {
    switch (method) {
      case 'GET':
        return onRequestGet({ request, env });
      case 'PUT':
        return onRequestPut({ request, env });
    }
  }
  
  return json({ error: 'Method not allowed' }, 405);
}
