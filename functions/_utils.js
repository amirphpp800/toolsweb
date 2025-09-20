export const json = (data, init={}) => new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers||{}) }, ...init });
export const error = (status, message) => json({ error: message }, { status });

export const getBody = async (request) => {
  try { return await request.json(); } catch { return {}; }
};

export const setCookie = (name, value, { httpOnly=true, secure=true, maxAge=60*60*24*30, path='/', sameSite='Lax', domain }={}) => {
  const parts = [`${name}=${value}`];
  if (maxAge) parts.push(`Max-Age=${maxAge}`);
  if (path) parts.push(`Path=${path}`);
  if (sameSite) parts.push(`SameSite=${sameSite}`);
  if (secure) parts.push('Secure');
  if (httpOnly) parts.push('HttpOnly');
  if (domain) parts.push(`Domain=${domain}`);
  return parts.join('; ');
};

export const clearCookie = (name) => `${name}=; Max-Age=0; Path=/; SameSite=Lax`;

// Minimal JWT (HS256) for Workers
async function hmacSign(secret, data){
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return btoa(String.fromCharCode(...new Uint8Array(sig)) ).replaceAll('=','').replaceAll('+','-').replaceAll('/','_');
}
const b64url = (obj) => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(obj)))).replaceAll('=','').replaceAll('+','-').replaceAll('/','_');

export async function signJWT(secret, payload, expSec=60*60*24*7){
  const header = { alg:'HS256', typ:'JWT' };
  const now = Math.floor(Date.now()/1000);
  const body = { iat: now, exp: now + expSec, ...payload };
  const tokenUnsigned = `${b64url(header)}.${b64url(body)}`;
  const sig = await hmacSign(secret, new TextEncoder().encode(tokenUnsigned));
  return `${tokenUnsigned}.${sig}`;
}

export async function verifyJWT(secret, token){
  try{
    const [h,p,s] = token.split('.');
    const sig = await hmacSign(secret, new TextEncoder().encode(`${h}.${p}`));
    if(sig !== s) return null;
    const payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(p.replaceAll('-','+').replaceAll('_','/')), c=>c.charCodeAt(0))));
    if(payload.exp && Math.floor(Date.now()/1000) > payload.exp) return null;
    return payload;
  }catch{ return null }
}

export async function hashPassword(password, salt){
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

export const uid = () => crypto.randomUUID?.() || ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));

// Generate 8-digit user UUID
export const generateUserUUID = () => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

export const getCookie = (request, name) => {
  const cookie = request.headers.get('cookie') || '';
  for(const part of cookie.split(/;\s*/)){
    if (!part) continue; const [k,v] = part.split('='); if(k===name) return v;
  }
  return null;
};

export const USERS_KEY = (username) => `user:${username}`;

// HMAC helper (base64url output) for stateless tokens like captcha
export async function hmacB64(secret, message){
  const data = new TextEncoder().encode(message);
  return await hmacSign(secret, data);
}

// Simple random captcha text (A-Z, 0-9) length 4-5
export function randomCaptcha(len = 5){
  const L = Math.random() < 0.5 ? 4 : len; // randomly 4 or 5
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for(let i=0;i<L;i++) out += chars[Math.floor(Math.random()*chars.length)];
  return out;
}
