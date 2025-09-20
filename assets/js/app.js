const app = (() => {
  const modal = {
    el: document.getElementById('modal-auth'),
    open() { this.el.classList.remove('hidden'); },
    close() { this.el.classList.add('hidden'); },
  };

  const $ = (id) => document.getElementById(id);
  const msg = (t, type='', targetId='login-msg') => { 
    const el = $(targetId); 
    if(el) {
      el.textContent = t || ''; 
      el.style.color = type==='err' ? '#ff6b6b' : '#a0e7a0'; 
    }
  };

  // Auth tab management
  let currentTab = 'login';
  
  function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => {
      form.classList.toggle('active', form.id === `${tabName}-form`);
    });
    
    currentTab = tabName;
    
    // Clear messages
    msg('', '', 'login-msg');
    msg('', '', 'register-msg');
  }

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
      if(el){ 
        el.textContent = c.text || '— — — —'; 
        el.dataset.ts = c.ts; 
        el.dataset.sig = c.sig; 
        el.style.color = 'var(--white)';
      }
    }catch{
      // Fallback display - don't show error, just show placeholder
      const el = $('captcha-text');
      if(el) {
        el.textContent = '— — — —';
        el.style.color = 'var(--muted)';
      }
    }
  }

  let isAuthed = false;
  let currentUser = null;

  async function syncUser(){
    try {
      const me = await api('/api/auth/me');
      const userState = document.getElementById('user-state');
      if(me?.username){
        isAuthed = true;
        currentUser = me;
        userState.textContent = `وارد شده: ${me.username}`;
        document.getElementById('btn-auth').textContent = 'داشبورد';
        
        // Update user info in modal
        const currentUsername = $('current-username');
        const currentUuid = $('current-uuid');
        const currentPlan = $('current-plan');
        if(currentUsername) currentUsername.textContent = me.username;
        if(currentUuid) currentUuid.textContent = me.userUUID || '--------';
        if(currentPlan) currentPlan.textContent = me.plan || 'رایگان';
        
        // Show logout section, hide auth forms
        const logoutSection = $('logout-section');
        const loginForm = $('login-form');
        const registerForm = $('register-form');
        if(logoutSection) logoutSection.style.display = 'block';
        if(loginForm) loginForm.style.display = 'none';
        if(registerForm) registerForm.style.display = 'none';
        
        // cache locally
        try{ localStorage.setItem('user', JSON.stringify({ username: me.username, userUUID: me.userUUID, plan: me.plan, at: Date.now() })); }catch{}
        
        // show profile
        const prof = document.getElementById('profile');
        if(prof){ prof.style.display = ''; $('profile-username').textContent = me.username; }
      } else {
        isAuthed = false;
        currentUser = null;
        userState.textContent = 'مهمان';
        document.getElementById('btn-auth').textContent = 'ورود / ثبت‌نام';
        
        // Show auth forms, hide logout section
        const logoutSection = $('logout-section');
        if(logoutSection) logoutSection.style.display = 'none';
        switchTab('login'); // Reset to login tab
        
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
      isAuthed = false;
      currentUser = null;
      const userState = document.getElementById('user-state');
      userState.textContent = 'مهمان';
      
      // Show auth forms, hide logout section
      const logoutSection = $('logout-section');
      if(logoutSection) logoutSection.style.display = 'none';
      switchTab('login');
    }
  }

  function openAuth(){ modal.open(); }
  function closeAuth(){ modal.close(); }

  async function handleLoginSubmit(e){
    e.preventDefault();
    const username = $('login-username').value.trim().toLowerCase();
    const password = $('login-password').value;
    if(!username || !password) return;
    
    msg('در حال پردازش...', '', 'login-msg');
    try{
      await api('/api/auth/login', { method:'POST', body: JSON.stringify({ username, password }) });
      msg('ورود موفق', '', 'login-msg');
      await syncUser();
      setTimeout(closeAuth, 400);
    } catch(err){
      if(err.status === 404){
        msg('کاربر یافت نشد. لطفا ثبت‌نام کنید.', 'err', 'login-msg');
      } else if(err.status === 401){
        msg('نام کاربری یا رمز عبور اشتباه است', 'err', 'login-msg');
      } else {
        msg('خطا؛ دوباره تلاش کنید', 'err', 'login-msg');
      }
    }
  }

  async function handleRegisterSubmit(e){
    e.preventDefault();
    const username = $('register-username').value.trim().toLowerCase();
    const password = $('register-password').value;
    const captchaInput = $('captcha-input')?.value?.trim();
    
    if(!username || !password) return;
    if(!captchaInput){ msg('کپچا را وارد کنید', 'err', 'register-msg'); return; }
    
    msg('در حال پردازش...', '', 'register-msg');
    try{
      await api('/api/auth/register', { 
        method:'POST', 
        body: JSON.stringify({ 
          username, 
          password, 
          captchaInput, 
          captchaText: captcha.text, 
          captchaTs: captcha.ts, 
          captchaSig: captcha.sig 
        }) 
      });
      msg('ثبت‌نام موفق انجام شد', '', 'register-msg');
      // refresh captcha for next time
      loadCaptcha();
      await syncUser();
      setTimeout(closeAuth, 400);
    } catch(err){
      if(err.status === 409){
        msg('این نام کاربری قبلا ثبت شده است', 'err', 'register-msg');
      } else {
        msg(err.message || 'خطا؛ دوباره تلاش کنید', 'err', 'register-msg');
      }
      // refresh captcha on error
      loadCaptcha();
    }
  }

  async function logout(){
    try { await api('/api/auth/logout', { method:'POST' }); } catch {}
    await syncUser();
    msg('خروج انجام شد');
    try{ localStorage.removeItem('user'); }catch{}
  }

  // Enhanced UX Features
  function initLoadingScreen(){
    const loadingScreen = document.getElementById('loading-screen');
    // Simulate loading time for better UX
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
      // Remove from DOM after animation
      setTimeout(() => loadingScreen.remove(), 500);
    }, 1500);
  }

  function initMobileMenu(){
    const toggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if(toggle && navLinks){
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        navLinks.classList.toggle('active');
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if(!toggle.contains(e.target) && !navLinks.contains(e.target)){
          toggle.classList.remove('active');
          navLinks.classList.remove('active');
        }
      });
    }
  }

  function initPricingToggle(){
    const toggle = document.getElementById('pricing-toggle');
    const monthlyPrices = document.querySelectorAll('.monthly-price');
    const yearlyPrices = document.querySelectorAll('.yearly-price');
    
    if(toggle){
      toggle.addEventListener('change', () => {
        const isYearly = toggle.checked;
        monthlyPrices.forEach(el => el.style.display = isYearly ? 'none' : 'block');
        yearlyPrices.forEach(el => el.style.display = isYearly ? 'block' : 'none');
      });
    }
  }

  function initPasswordToggle(){
    // Login password toggle
    const loginToggleBtn = document.getElementById('login-password-toggle');
    const loginPasswordInput = document.getElementById('login-password');
    
    if(loginToggleBtn && loginPasswordInput){
      loginToggleBtn.addEventListener('click', () => {
        const type = loginPasswordInput.type === 'password' ? 'text' : 'password';
        loginPasswordInput.type = type;
        loginToggleBtn.querySelector('.eye-icon').textContent = type === 'password' ? '👁️' : '🙈';
      });
    }

    // Register password toggle
    const registerToggleBtn = document.getElementById('register-password-toggle');
    const registerPasswordInput = document.getElementById('register-password');
    
    if(registerToggleBtn && registerPasswordInput){
      registerToggleBtn.addEventListener('click', () => {
        const type = registerPasswordInput.type === 'password' ? 'text' : 'password';
        registerPasswordInput.type = type;
        registerToggleBtn.querySelector('.eye-icon').textContent = type === 'password' ? '👁️' : '🙈';
      });
    }
  }

  function initPasswordStrength(){
    const passwordInput = document.getElementById('register-password');
    const strengthFill = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    
    if(passwordInput && strengthFill && strengthText){
      passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const strength = calculatePasswordStrength(password);
        
        strengthFill.style.width = `${strength.percentage}%`;
        strengthText.textContent = strength.text;
        strengthText.style.color = strength.color;
      });
    }
  }

  function calculatePasswordStrength(password){
    let score = 0;
    if(password.length >= 8) score += 25;
    if(password.match(/[a-z]/)) score += 25;
    if(password.match(/[A-Z]/)) score += 25;
    if(password.match(/[0-9]/)) score += 25;
    
    if(score <= 25) return {percentage: 25, text: 'ضعیف', color: '#f87171'};
    if(score <= 50) return {percentage: 50, text: 'متوسط', color: '#fbbf24'};
    if(score <= 75) return {percentage: 75, text: 'خوب', color: '#4ade80'};
    return {percentage: 100, text: 'عالی', color: '#10b981'};
  }

  function initFormValidation(){
    // Login form validation
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginUsernameFeedback = document.getElementById('login-username-feedback');
    const loginPasswordFeedback = document.getElementById('login-password-feedback');
    
    if(loginUsernameInput && loginUsernameFeedback){
      loginUsernameInput.addEventListener('blur', () => {
        const username = loginUsernameInput.value.trim();
        if(username.length < 3){
          showFeedback(loginUsernameFeedback, 'نام کاربری باید حداقل ۳ کاراکتر باشد', 'error');
        } else if(!/^[a-zA-Z0-9_]+$/.test(username)){
          showFeedback(loginUsernameFeedback, 'فقط حروف انگلیسی، اعداد و _ مجاز است', 'error');
        } else {
          showFeedback(loginUsernameFeedback, '', 'success');
        }
      });
    }
    
    // Register form validation
    const registerUsernameInput = document.getElementById('register-username');
    const registerPasswordInput = document.getElementById('register-password');
    const registerUsernameFeedback = document.getElementById('register-username-feedback');
    const registerPasswordFeedback = document.getElementById('register-password-feedback');
    
    if(registerUsernameInput && registerUsernameFeedback){
      registerUsernameInput.addEventListener('blur', () => {
        const username = registerUsernameInput.value.trim();
        if(username.length < 3){
          showFeedback(registerUsernameFeedback, 'نام کاربری باید حداقل ۳ کاراکتر باشد', 'error');
        } else if(!/^[a-zA-Z0-9_]+$/.test(username)){
          showFeedback(registerUsernameFeedback, 'فقط حروف انگلیسی، اعداد و _ مجاز است', 'error');
        } else {
          showFeedback(registerUsernameFeedback, 'نام کاربری معتبر است', 'success');
        }
      });
    }
    
    if(registerPasswordInput && registerPasswordFeedback){
      registerPasswordInput.addEventListener('blur', () => {
        const password = registerPasswordInput.value;
        if(password.length < 8){
          showFeedback(registerPasswordFeedback, 'رمز عبور باید حداقل ۸ کاراکتر باشد', 'error');
        } else {
          showFeedback(registerPasswordFeedback, '', 'success');
        }
      });
    }
  }

  function showFeedback(element, message, type){
    element.textContent = message;
    element.className = `input-feedback ${type}`;
  }

  function initScrollAnimations(){
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);
    
    // Observe all cards
    document.querySelectorAll('.card').forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(card);
    });
  }

  function init(){
    document.getElementById('year').textContent = new Date().getFullYear();
    
    // Initialize all enhanced features
    initLoadingScreen();
    initMobileMenu();
    initPricingToggle();
    initPasswordToggle();
    initPasswordStrength();
    initFormValidation();
    initScrollAnimations();
    
    // Auth tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        switchTab(tab.dataset.tab);
      });
    });

    // Original functionality
    document.getElementById('btn-auth').addEventListener('click', (e) => {
      if(isAuthed) {
        // Redirect to dashboard
        window.location.href = '/dashboard.html';
      } else {
        openAuth();
      }
    });
    
    // Separate form handlers
    const loginForm = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');
    if(loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
    if(registerForm) registerForm.addEventListener('submit', handleRegisterSubmit);
    
    // Logout buttons
    document.getElementById('btn-logout')?.addEventListener('click', logout);
    document.getElementById('btn-logout-profile')?.addEventListener('click', logout);
    
    // Dashboard button
    document.getElementById('btn-dashboard')?.addEventListener('click', () => {
      window.location.href = '/dashboard.html';
    });
    
    document.getElementById('btn-learn')?.addEventListener('click', () => location.hash = '#features');
    document.getElementById('btn-refresh-captcha')?.addEventListener('click', () => { loadCaptcha(); $('captcha-input').value=''; });
    
    // Enforce requires-auth on CTA buttons
    function bindAuthRequired(){
      document.querySelectorAll('.requires-auth').forEach(btn => {
        btn.addEventListener('click', (e) => {
          if(!isAuthed){ e.preventDefault(); openAuth(); }
          else { location.hash = '#profile'; }
        });
      });
    }
    
    loadCaptcha();
    syncUser();
    bindAuthRequired();
  }

  return { init, openAuth, closeAuth };
})();

window.addEventListener('DOMContentLoaded', app.init);
