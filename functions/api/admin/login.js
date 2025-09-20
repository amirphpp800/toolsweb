import { json, error, getBody, setCookie, signJWT } from '../../_utils';

export async function onRequestPost({ request, env }){
  const { username, password } = await getBody(request);
  if(!username || !password) return error(400, 'نام کاربری/رمز وارد شود');
  if(username !== env.ADMIN_USERNAME || password !== env.ADMIN_PASSWORD){
    return error(401, 'عدم دسترسی');
  }
  const token = await signJWT(env.JWT_SECRET, { role:'admin', username });
  const headers = { 'Set-Cookie': setCookie('admin_session', token, { httpOnly:true, secure:true, sameSite:'Lax', path:'/' }) };
  return json({ ok:true }, { headers });
}
