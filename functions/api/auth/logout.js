import { json, clearCookie } from '../../_utils';

export async function onRequestPost(){
  return new Response(JSON.stringify({ ok:true }), { status:200, headers: { 'content-type': 'application/json', 'Set-Cookie': clearCookie('session') } });
}
