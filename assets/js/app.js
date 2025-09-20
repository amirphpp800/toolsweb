const app = (() => {
  const modal = {
    el: document.getElementById('modal-auth'),
    open() { this.el.classList.remove('hidden'); },
    close() { this.el.classList.add('hidden'); },
  };

  const $ = (id) => document.getElementById(id);
  const msg = (t, type='') => { const el = $('auth-msg'); el.textContent = t || ''; el.style.color = type==='err' ? '#ff6b6b' : '#a0e7a0'; };

  // Captcha state
  let captcha = { text:null, ts:null, sig:null };

  async function api(path, opts={}){
    const res = await fetch(path, { headers:{'Content-Type':'application/json', ...(opts.headers||{})}, credentials:'include', ...opts });
    const text = await res.text();
    let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw:text } }
    if(!res.ok) throw Object.assign(new Error(data?.error||res.statusText), { status:res.status, data });
    return data;
  }

  async function loadCaptcha(){
    try{
      const c = await api('/api/auth/captcha');
      captcha = c;
      const el = $('captcha-text');
      if(el){ el.textContent = c.text; el.dataset.ts = c.ts; el.dataset.sig = c.sig; }
    }catch{
      // Fallback display
      const el = $('captcha-text');
      if(el) el.textContent = 'خطا در دریافت کپچا';
    }
  }

  async function syncUser(){
    try {
      const me = await api('/api/auth/me');
      const userState = document.getElementById('user-state');
      if(me?.username){
        userState.textContent = `وارد شده: ${me.username}`;
        document.getElementById('btn-auth').textContent = 'حساب کاربری';
        document.getElementById('btn-logout').style.display = '';
        // cache locally
        try{ localStorage.setItem('user', JSON.stringify({ username: me.username, at: Date.now() })); }catch{}
        // show profile
        const prof = document.getElementById('profile');
        if(prof){ prof.style.display = ''; $('profile-username').textContent = me.username; }
      } else {
        userState.textContent = 'مهمان';
        document.getElementById('btn-auth').textContent = 'ورود / ثبت‌نام';
        document.getElementById('btn-logout').style.display = 'none';
        // hide profile
        const prof = document.getElementById('profile');
        if(prof){ prof.style.display = 'none'; $('profile-username').textContent = '—'; }
        // soft fallback to local cache for UX
        try{
          const cached = JSON.parse(localStorage.getItem('user')||'null');
          if(cached?.username){ userState.textContent = `ورود اخیر: ${cached.username}`; }
        }catch{}
      }
    } catch {
      const userState = document.getElementById('user-state');
      userState.textContent = 'مهمان';
      document.getElementById('btn-logout').style.display = 'none';
    }
  }

  function openAuth(){ modal.open(); }
  function closeAuth(){ modal.close(); }

  async function handleAuthSubmit(e){
    e.preventDefault();
    const username = $('username').value.trim().toLowerCase();
    const password = $('password').value;
    const captchaInput = $('captcha-input')?.value?.trim();
    if(!username || !password) return;
    msg('در حال پردازش...');
    try{
      // Try login; if not exists, fallback to register
      await api('/api/auth/login', { method:'POST', body: JSON.stringify({ username, password }) });
      msg('ورود موفق');
    } catch(err){
      if(err.status === 404){
        // Require captcha for register
        if(!captchaInput){ msg('کپچا را وارد کنید', 'err'); return; }
        await api('/api/auth/register', { method:'POST', body: JSON.stringify({ username, password, captchaInput, captchaText: captcha.text, captchaTs: captcha.ts, captchaSig: captcha.sig }) });
        msg('ثبت‌نام و ورود انجام شد');
        // refresh captcha for next time
        loadCaptcha();
      } else if(err.status === 401){
        msg('نام کاربری یا رمز عبور اشتباه است', 'err');
        return;
      } else {
        msg('خطا؛ دوباره تلاش کنید', 'err');
        return;
      }
    }
    await syncUser();
    setTimeout(closeAuth, 400);
  }

  async function logout(){
    try { await api('/api/auth/logout', { method:'POST' }); } catch {}
    await syncUser();
    msg('خروج انجام شد');
    try{ localStorage.removeItem('user'); }catch{}
  }

  function init(){
    document.getElementById('year').textContent = new Date().getFullYear();
    document.getElementById('btn-auth').addEventListener('click', openAuth);
    document.getElementById('form-auth').addEventListener('submit', handleAuthSubmit);
    document.getElementById('btn-logout').addEventListener('click', logout);
    document.getElementById('btn-learn')?.addEventListener('click', () => location.hash = '#features');
    document.getElementById('btn-logout-profile')?.addEventListener('click', logout);
    document.getElementById('btn-refresh-captcha')?.addEventListener('click', () => { loadCaptcha(); $('captcha-input').value=''; });
    // Theme toggle
    const root = document.documentElement;
    const savedTheme = (()=>{ try{ return localStorage.getItem('theme'); }catch{ return null } })();
    if(savedTheme === 'light') root.setAttribute('data-theme','light');
    document.getElementById('btn-theme')?.addEventListener('click', () => {
      const isLight = root.getAttribute('data-theme') === 'light';
      if(isLight){
        root.removeAttribute('data-theme');
        try{ localStorage.setItem('theme','dark'); }catch{}
      } else {
        root.setAttribute('data-theme','light');
        try{ localStorage.setItem('theme','light'); }catch{}
      }
    });
    loadCaptcha();
    syncUser();
  }

  return { init, openAuth, closeAuth };
})();

window.addEventListener('DOMContentLoaded', app.init);
