/* ============================================================
   Elite Metabolix — shared client login + PWA + mobile menu
   ------------------------------------------------------------
   Add ONE line to the <head> of every page:
       <script src="/em-auth.js" defer></script>
   It will, on every page automatically:
     • upgrade the mobile nav into a full-height overlay menu
     • add a "Log in" link to your nav
     • show a magic-link login modal (no passwords)
     • send each logged-in client to THEIR dashboard
     • enable PWA install + register the service worker
   Edit THIS one file to change login/menu behavior site-wide.
   ============================================================ */
(function () {
  // ---------- CONFIG ----------
  var SUPABASE_URL = 'https://idazmldyntjfqgfbaifu.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_Yftt89TJlR0ES5NZBlCyxg_vPU-KgPQ';
  var SUPABASE_LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

  // ---------- tiny helpers ----------
  function $(id){ return document.getElementById(id); }
  function ready(fn){ document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn); }
  function el(html){ var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  function msg(t, isErr){ var m = $('em-auth-msg'); if (m){ m.textContent = t; m.style.color = isErr ? 'var(--red,#E45D54)' : 'var(--green,#37B981)'; } }

  // ---------- 1) PWA: inject head tags + register service worker ----------
  function initPWA(){
    var head = document.head;
    function once(sel, node){ if (!document.querySelector(sel)) head.appendChild(node); }
    once('link[rel="manifest"]',                          el('<link rel="manifest" href="/manifest.webmanifest">'));
    once('meta[name="theme-color"]',                      el('<meta name="theme-color" content="#0A0C10">'));
    once('meta[name="apple-mobile-web-app-capable"]',     el('<meta name="apple-mobile-web-app-capable" content="yes">'));
    once('meta[name="apple-mobile-web-app-status-bar-style"]', el('<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">'));
    once('meta[name="apple-mobile-web-app-title"]',       el('<meta name="apple-mobile-web-app-title" content="Elite Metabolix">'));
    once('link[rel="apple-touch-icon"]',                  el('<link rel="apple-touch-icon" href="/icon-192.png">'));
    if ('serviceWorker' in navigator){
      window.addEventListener('load', function(){ navigator.serviceWorker.register('/service-worker.js').catch(function(){}); });
    }
  }

  // ---------- 2) MOBILE MENU: full-height overlay ----------
  function injectMenuCSS(){
    if ($('em-menu-css')) return;
    var s = document.createElement('style');
    s.id = 'em-menu-css';
    s.textContent = [
      'html.em-lock,body.em-lock{overflow:hidden!important}',
      '#em-apply-cta,#em-menu-foot,#em-menu-div{display:none}',
      '@media(max-width:900px){',
        'nav .burger{display:block;position:relative;z-index:60;width:44px;height:44px;font-size:21px;line-height:1;border-radius:9px;color:var(--txt,#ECEFF3);transition:color .2s;-webkit-tap-highlight-color:transparent}',
        'nav.em-open .burger{color:var(--orange,#F0852E)}',
        'nav.em-open .nav-links{',
          'display:flex!important;position:fixed;top:var(--em-navH,60px);left:0;right:0;bottom:0;z-index:55;',
          'flex-direction:column;align-items:stretch;justify-content:flex-start;gap:0;margin:0;',
          'border:none!important;box-shadow:none!important;',
          'padding:clamp(24px,4.5vh,42px) clamp(24px,8vw,46px) calc(env(safe-area-inset-bottom,0px) + 30px);',
          'background:radial-gradient(125% 55% at 100% 0%,rgba(var(--orange-rgb,240,133,46),.12),transparent 58%),var(--bg,#0A0C10);',
          'overflow-y:auto;-webkit-overflow-scrolling:touch;animation:emFade .24s ease both}',
        '@keyframes emFade{from{opacity:0}to{opacity:1}}',
        'nav.em-open .nav-links>a:not(.nav-cta):not(#em-login-link):not(.em-extra){',
          'font-family:var(--fd,Georgia,serif)!important;font-weight:500;font-size:clamp(26px,7.4vw,34px);',
          'line-height:1.1;letter-spacing:-.012em;color:var(--txt,#ECEFF3)!important;text-decoration:none;',
          'width:max-content;max-width:100%;border:none!important;padding:0!important;',
          'margin:0 0 clamp(15px,2.7vh,24px)!important;position:relative;',
          'opacity:0;transform:translateY(10px);animation:emRise .5s cubic-bezier(.2,.7,.2,1) forwards}',
        '@keyframes emRise{to{opacity:1;transform:none}}',
        'nav.em-open .nav-links>a:nth-child(1){animation-delay:.05s}',
        'nav.em-open .nav-links>a:nth-child(2){animation-delay:.09s}',
        'nav.em-open .nav-links>a:nth-child(3){animation-delay:.13s}',
        'nav.em-open .nav-links>a:nth-child(4){animation-delay:.17s}',
        'nav.em-open .nav-links>a:nth-child(5){animation-delay:.21s}',
        'nav.em-open .nav-links>a:nth-child(6){animation-delay:.25s}',
        'nav.em-open .nav-links>a:nth-child(7){animation-delay:.29s}',
        'nav.em-open .nav-links>a:not(.nav-cta):not(#em-login-link):not(.em-extra)::after{',
          'content:"";position:absolute;left:0;bottom:-5px;height:2px;width:0;background:var(--orange,#F0852E);transition:width .28s ease}',
        'nav.em-open .nav-links>a:not(.nav-cta):not(#em-login-link):not(.em-extra):active{color:var(--orange,#F0852E)!important}',
        'nav.em-open .nav-links>a:not(.nav-cta):not(#em-login-link):not(.em-extra):active::after{width:100%}',
        'nav.em-open .nav-links #em-menu-div{display:block;order:89;height:1px;width:100%;background:var(--line,#232a36);margin:auto 0 clamp(20px,3vh,26px)}',
        'nav.em-open .nav-links a#em-apply-cta{order:90;display:inline-flex!important;align-items:center;justify-content:center;gap:9px;',
          'font-family:var(--fb,sans-serif)!important;font-weight:600;font-size:15px;letter-spacing:0;text-transform:none!important;',
          'background:linear-gradient(135deg,var(--orange,#F0852E),#f5a059);color:#1a0f04!important;border:none!important;',
          'border-radius:11px;padding:15px 22px!important;margin:0 0 14px!important;width:100%;text-decoration:none;',
          'box-shadow:0 12px 30px rgba(var(--orange-rgb,240,133,46),.30)}',
        'nav.em-open .nav-links a#em-login-link{order:91;display:inline-flex!important;align-items:center;justify-content:center;',
          'font-family:var(--fb,sans-serif)!important;font-weight:600;font-size:14px;letter-spacing:0;text-transform:none!important;',
          'color:var(--txt,#ECEFF3)!important;background:transparent;border:1px solid var(--line2,#2c3543)!important;',
          'border-radius:11px;padding:13px 22px!important;margin:0 0 18px!important;width:100%;text-decoration:none}',
        'nav.em-open .nav-links a.nav-cta{order:92;font-family:var(--fb,sans-serif)!important;font-size:13px!important;font-weight:500;',
          'letter-spacing:.01em!important;text-transform:none!important;text-align:center;color:var(--mut,#9aa4b2)!important;',
          'background:none!important;border:none!important;padding:0!important;margin:0 auto!important;width:max-content}',
        'nav.em-open .nav-links #em-menu-foot{display:block;order:93;font-family:var(--fm,monospace);font-size:10.5px;',
          'letter-spacing:.14em;text-transform:uppercase;color:var(--mut2,#6b7480);text-align:center;margin-top:18px}',
        'nav.em-open .nav-links #em-menu-foot b{color:var(--green,#37B981);font-weight:500}',
      '}'
    ].join('');
    document.head.appendChild(s);
  }

  function initMenu(){
    injectMenuCSS();
    var nav = document.querySelector('nav');
    var links = document.querySelector('.nav-links');
    var burger = document.querySelector('.burger');
    if (!nav || !links || !burger) return;

    if (!$('em-apply-cta')){
      links.appendChild(el('<div id="em-menu-div" aria-hidden="true"></div>'));
      links.appendChild(el('<a id="em-apply-cta" class="em-extra" href="apply.html">Apply for coaching &rarr;</a>'));
      links.appendChild(el('<div id="em-menu-foot" class="em-extra">&#9679;&nbsp; Private &middot; <b>never sold</b></div>'));
    }

    function setNavH(){ document.documentElement.style.setProperty('--em-navH', nav.offsetHeight + 'px'); }
    function openMenu(){ setNavH(); nav.classList.add('em-open'); document.documentElement.classList.add('em-lock'); burger.textContent = '\u2715'; burger.setAttribute('aria-expanded','true'); }
    function closeMenu(){ nav.classList.remove('em-open'); document.documentElement.classList.remove('em-lock'); burger.textContent = '\u2630'; burger.setAttribute('aria-expanded','false'); }
    function toggle(){ nav.classList.contains('em-open') ? closeMenu() : openMenu(); }

    burger.removeAttribute('onclick');
    burger.setAttribute('aria-label','Menu');
    burger.setAttribute('aria-expanded','false');
    burger.onclick = function(e){ e.preventDefault(); toggle(); };

    links.addEventListener('click', function(e){ if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', function(){
      if (window.innerWidth > 900) closeMenu();
      else if (nav.classList.contains('em-open')) setNavH();
    });
  }

  // ---------- 3) login modal ----------
  function injectModal(){
    if ($('em-auth-overlay')) return;
    var style = document.createElement('style');
    style.textContent =
      '#em-auth-overlay{display:none;position:fixed;inset:0;z-index:9999;background:rgba(5,7,10,.82);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);align-items:center;justify-content:center;padding:24px}' +
      '#em-auth-overlay .em-card{width:100%;max-width:400px;background:var(--card,#171C26);border:1px solid var(--line,#232a36);border-radius:18px;padding:30px;box-shadow:0 30px 80px rgba(0,0,0,.6)}' +
      '#em-auth-overlay input{width:100%;padding:13px 14px;border-radius:10px;border:1px solid var(--line2,#2c3543);background:var(--bg2,#0E1117);color:var(--txt,#ECEFF3);font-size:15px;font-family:var(--fb,sans-serif);margin-bottom:12px;outline:none}' +
      '#em-auth-overlay .em-send{width:100%;padding:13px;border-radius:10px;border:none;cursor:pointer;font-family:var(--fb,sans-serif);font-weight:600;font-size:15px;background:linear-gradient(135deg,var(--orange,#F0852E),var(--orange-lt,#f7a864));color:#1a0f04}' +
      '#em-login-link{cursor:pointer}';
    document.head.appendChild(style);

    var overlay = el(
      '<div id="em-auth-overlay">' +
        '<div class="em-card">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
            '<span style="font-family:var(--fm,monospace);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--orange,#F0852E)">Client Login</span>' +
            '<button id="em-auth-x" style="background:none;border:none;color:var(--mut,#9aa4b2);font-size:24px;cursor:pointer;line-height:1">&times;</button>' +
          '</div>' +
          '<h3 style="font-family:var(--fd,Georgia,serif);font-weight:500;font-size:22px;margin:0 0 6px;color:var(--txt,#ECEFF3)">Welcome back</h3>' +
          '<p style="font-size:14px;color:var(--mut,#9aa4b2);margin:0 0 18px;line-height:1.5">Enter your email and we&rsquo;ll send a secure sign-in link &mdash; no password needed.</p>' +
          '<input id="em-auth-email" type="email" placeholder="you@email.com" autocomplete="email">' +
          '<button class="em-send" id="em-auth-send">Send me a link</button>' +
          '<p id="em-auth-msg" style="font-size:13px;margin:14px 0 0;min-height:18px;line-height:1.5;color:var(--mut,#9aa4b2)"></p>' +
          '<p style="font-size:12px;color:var(--mut2,#6b7480);margin:16px 0 0;line-height:1.5">New here? <a href="apply.html" style="color:var(--orange,#F0852E);text-decoration:none">Apply for coaching &rarr;</a></p>' +
        '</div>' +
      '</div>'
    );
    document.body.appendChild(overlay);
    $('em-auth-x').addEventListener('click', close);
    $('em-auth-send').addEventListener('click', send);
    $('em-auth-email').addEventListener('keydown', function(e){ if (e.key === 'Enter') send(); });
    overlay.addEventListener('click', function(e){ if (e.target === overlay) close(); });
  }

  // ---------- 4) add "Log in" to whichever nav this page has ----------
  function injectNavLink(){
    if ($('em-login-link')) return;
    var nav = document.querySelector('.nav-right') || document.querySelector('.nav-links');
    if (!nav) return;
    var a = el('<a href="#" id="em-login-link">Log in</a>');
    a.addEventListener('click', function(e){ e.preventDefault(); open(); });
    nav.appendChild(a);
  }

  // ---------- modal controls ----------
  function open(){ var o = $('em-auth-overlay'); if (o){ o.style.display = 'flex'; setTimeout(function(){ var e = $('em-auth-email'); if (e) e.focus(); }, 50); } }
  function close(){ var o = $('em-auth-overlay'); if (o) o.style.display = 'none'; }

  // ---------- Supabase ----------
  var sb = null;
  function loadSupabase(cb){
    if (window.supabase && window.supabase.createClient){ cb(); return; }
    var s = document.createElement('script');
    s.src = SUPABASE_LIB; s.onload = cb; s.onerror = function(){ /* offline / blocked */ };
    document.head.appendChild(s);
  }
  async function send(){
    if (!sb){ msg('Still loading — try again in a second.', true); return; }
    var email = (($('em-auth-email').value) || '').trim();
    if (!email || email.indexOf('@') < 1){ msg('Please enter a valid email.', true); return; }
    var btn = $('em-auth-send'); btn.disabled = true; var orig = btn.textContent; btn.textContent = 'Sending…';
    try {
      var redirect = 'https://app.elitemetabolixhq.com/';
      var res = await sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: redirect, shouldCreateUser: false } });
      if (res.error){ msg("We couldn't find an account for that email. Apply for coaching to get started.", true); }
      else { msg('Check your email — we sent you a secure sign-in link.', false); }
    } catch (e){ msg('Something went wrong. Please try again.', true); }
    btn.disabled = false; btn.textContent = orig;
  }
  async function routeIfLoggedIn(){
    if (!sb) return;
    try {
      var s = await sb.auth.getSession();
      var session = s && s.data && s.data.session;
      if (!session) return;
      var q = await sb.from('clients').select('dashboard_url').eq('id', session.user.id).single();
      if (q.data && q.data.dashboard_url){ window.location.href = q.data.dashboard_url; }
      else { open(); msg("You're signed in, but your plan is still being built. We'll email you when it's ready.", false); }
    } catch (e){ /* stay on page */ }
  }

  // ---------- boot ----------
  ready(function(){
    initPWA();
    injectModal();
    injectNavLink();
    initMenu();
    loadSupabase(function(){
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      routeIfLoggedIn();
      sb.auth.onAuthStateChange(function(evt){ if (evt === 'SIGNED_IN') routeIfLoggedIn(); });
    });
  });
})();
