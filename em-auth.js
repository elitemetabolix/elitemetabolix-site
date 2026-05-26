/* ============================================================
   Elite Metabolix — shared client login + PWA + full-screen menu
   ------------------------------------------------------------
   Add ONE line to the <head> of every page:
       <script src="/em-auth.js" defer></script>
   On every page it will automatically:
     • replace the nav with a wordmark + ☰ that opens a
       full-screen overlay menu (same on desktop AND mobile)
     • add a "Log in" entry + magic-link login modal (no passwords)
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

  // ---------- 1) PWA ----------
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

  // ---------- 2) FULL-SCREEN MENU (all widths, rendered at <body>) ----------
  function injectMenuCSS(){
    if ($('em-menu-css')) return;
    var s = document.createElement('style');
    s.id = 'em-menu-css';
    s.textContent = [
      'html.em-open{overflow:hidden!important}',
      '#em-menu{display:none}',
      /* retire the horizontal nav at ALL widths; use the wordmark + burger + overlay */
      '.nav-links{display:none!important}',
      'nav .burger{display:block!important;position:relative;z-index:60;width:46px;height:46px;font-size:22px;line-height:1;border-radius:9px;color:var(--txt,#ECEFF3);transition:color .2s;-webkit-tap-highlight-color:transparent}',
      'html.em-open .burger{color:var(--orange,#F0852E)}',

      '#em-menu{display:flex;position:fixed;inset:0;z-index:40;flex-direction:column;align-items:flex-start;',
        'padding:calc(var(--em-navH,64px) + clamp(22px,4vh,46px)) clamp(24px,7vw,84px) calc(env(safe-area-inset-bottom,0px) + 34px);',
        'background:radial-gradient(120% 45% at 100% 0%,rgba(var(--orange-rgb,240,133,46),.12),transparent 60%),var(--bg,#0A0C10);',
        'overflow-y:auto;-webkit-overflow-scrolling:touch;',
        'opacity:0;visibility:hidden;pointer-events:none;transition:opacity .24s ease,visibility .24s ease}',
      'html.em-open #em-menu{opacity:1;visibility:visible;pointer-events:auto}',

      '#em-menu a.em-link{font-family:var(--fd,Georgia,serif);font-weight:500;font-size:clamp(28px,6vw,46px);line-height:1.08;letter-spacing:-.014em;',
        'color:var(--txt,#ECEFF3);text-decoration:none;width:max-content;max-width:100%;margin:0 0 clamp(14px,2.2vh,20px);position:relative;',
        'opacity:0;transform:translateY(10px)}',
      'html.em-open #em-menu a.em-link{animation:emRise .55s cubic-bezier(.2,.7,.2,1) forwards}',
      '@keyframes emRise{to{opacity:1;transform:none}}',
      '#em-menu a.em-link:nth-child(1){animation-delay:.05s}',
      '#em-menu a.em-link:nth-child(2){animation-delay:.09s}',
      '#em-menu a.em-link:nth-child(3){animation-delay:.13s}',
      '#em-menu a.em-link:nth-child(4){animation-delay:.17s}',
      '#em-menu a.em-link:nth-child(5){animation-delay:.21s}',
      '#em-menu a.em-link:nth-child(6){animation-delay:.25s}',
      '#em-menu a.em-link:nth-child(7){animation-delay:.29s}',
      '#em-menu a.em-link::after{content:"";position:absolute;left:0;bottom:-6px;height:2px;width:0;background:var(--orange,#F0852E);transition:width .28s ease}',
      '#em-menu a.em-link:hover::after,#em-menu a.em-link:active::after{width:100%}',
      '#em-menu a.em-link:hover,#em-menu a.em-link:active{color:var(--orange,#F0852E)}',

      '#em-menu .em-div{height:1px;width:min(86vw,340px);background:var(--line,#232a36);margin:clamp(26px,4vh,40px) 0 clamp(20px,3vh,26px)}',
      '#em-menu a.em-apply{display:inline-flex;align-items:center;justify-content:center;gap:9px;font-family:var(--fb,sans-serif);font-weight:600;font-size:15px;',
        'background:linear-gradient(135deg,var(--orange,#F0852E),#f5a059);color:#1a0f04;border-radius:11px;padding:15px 22px;margin:0 0 14px;',
        'width:min(86vw,340px);text-decoration:none;box-shadow:0 12px 30px rgba(var(--orange-rgb,240,133,46),.30);transition:transform .18s,box-shadow .18s}',
      '#em-menu a.em-apply:hover{transform:translateY(-2px);box-shadow:0 16px 40px rgba(var(--orange-rgb,240,133,46),.42)}',
      '#em-menu a.em-login{display:inline-flex;align-items:center;justify-content:center;font-family:var(--fb,sans-serif);font-weight:600;font-size:14px;',
        'color:var(--txt,#ECEFF3);background:transparent;border:1px solid var(--line2,#2c3543);border-radius:11px;padding:13px 22px;margin:0 0 18px;',
        'width:min(86vw,340px);text-decoration:none;cursor:pointer;transition:border-color .18s,color .18s}',
      '#em-menu a.em-login:hover{border-color:var(--orange,#F0852E);color:var(--orange,#F0852E)}',
      '#em-menu a.em-manage{font-family:var(--fb,sans-serif);font-size:13px;font-weight:500;text-align:left;color:var(--mut,#9aa4b2);text-decoration:none;margin:0;transition:color .18s}',
      '#em-menu a.em-manage:hover{color:var(--txt,#ECEFF3)}',
      '#em-menu .em-foot{font-family:var(--fm,monospace);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mut2,#6b7480);text-align:left;margin-top:20px}',
      '#em-menu .em-foot b{color:var(--green,#37B981);font-weight:500}'
    ].join('');
    document.head.appendChild(s);
  }

  function initMenu(){
    injectMenuCSS();
    var nav = document.querySelector('nav');
    var links = document.querySelector('.nav-links');
    var burger = document.querySelector('.burger');
    if (!nav || !burger) return;

    function setNavH(){ document.documentElement.style.setProperty('--em-navH', nav.offsetHeight + 'px'); }
    function openMenu(){ setNavH(); document.documentElement.classList.add('em-open'); burger.textContent = '\u2715'; burger.setAttribute('aria-expanded','true'); }
    function closeMenu(){ document.documentElement.classList.remove('em-open'); burger.textContent = '\u2630'; burger.setAttribute('aria-expanded','false'); }
    function toggle(){ document.documentElement.classList.contains('em-open') ? closeMenu() : openMenu(); }

    if (!$('em-menu')){
      var menu = el('<div id="em-menu" role="dialog" aria-label="Menu"></div>');
      var html = '';
      if (links){
        var as = links.querySelectorAll('a');
        for (var i = 0; i < as.length; i++){
          var a = as[i];
          if (a.classList.contains('nav-cta') || a.id === 'em-login-link') continue;
          html += '<a class="em-link" href="' + a.getAttribute('href') + '">' + a.textContent.trim() + '</a>';
        }
      }
      html += '<div class="em-div" aria-hidden="true"></div>';
      html += '<a class="em-apply" href="apply.html">Apply for coaching &rarr;</a>';
      html += '<a class="em-login" href="#">Log in</a>';
      var mgmt = links ? links.querySelector('a.nav-cta') : null;
      if (mgmt){ html += '<a class="em-manage" href="' + mgmt.getAttribute('href') + '">' + mgmt.textContent.trim() + '</a>'; }
      html += '<div class="em-foot">&#9679;&nbsp; Private &middot; <b>never sold</b></div>';
      menu.innerHTML = html;
      document.body.appendChild(menu);

      var lg = menu.querySelector('.em-login');
      if (lg) lg.addEventListener('click', function(e){ e.preventDefault(); closeMenu(); open(); });
      var navAnchors = menu.querySelectorAll('a:not(.em-login)');
      for (var j = 0; j < navAnchors.length; j++){ navAnchors[j].addEventListener('click', function(){ closeMenu(); }); }
    }

    burger.removeAttribute('onclick');
    burger.setAttribute('aria-label','Menu');
    burger.setAttribute('aria-expanded','false');
    burger.onclick = function(e){ e.preventDefault(); toggle(); };
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', function(){ if (document.documentElement.classList.contains('em-open')) setNavH(); });
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

  // ---------- 4) add "Log in" into the (now hidden) nav so the overlay builder + modal still work ----------
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
