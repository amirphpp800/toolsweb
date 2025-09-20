import { json, verifyJWT } from '../../_utils.js';

// GET /api/user/activities - Get user recent activities
export async function onRequest({ request, env }) {
  try {
    // Verify JWT token
    const user = await verifyJWT(request, env.JWT_SECRET);
    if (!user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    // Get user activities from KV
    const activitiesData = await env.USERS_KV.get(`activities:${user.username}`);
    let activities = [];
    
    if (activitiesData) {
      activities = JSON.parse(activitiesData);
    }

    // Sort by timestamp (newest first) and limit to 10
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    activities = activities.slice(0, 10);

    return json(activities);
  } catch (error) {
    console.error('Activities error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
}

// Helper function to add activity (can be called from other endpoints)
export async function addActivity(env, username, type, description) {
  try {
    const activitiesData = await env.USERS_KV.get(`activities:${username}`);
    let activities = [];
    
    if (activitiesData) {
      activities = JSON.parse(activitiesData);
    }

    // Add new activity
    activities.unshift({
      id: Date.now().toString(),
      type,
      description,
      timestamp: new Date().toISOString()
    });

    // Keep only last 50 activities
    activities = activities.slice(0, 50);

    // Save back to KV
    await env.USERS_KV.put(`activities:${username}`, JSON.stringify(activities));
  } catch (error) {
    console.error('Add activity error:', error);
  }
}
