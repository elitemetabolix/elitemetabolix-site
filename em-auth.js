/* ============================================================
   Elite Metabolix — shared client login + PWA loader
   ------------------------------------------------------------
   Add ONE line to the <head> of every page:
       <script src="/em-auth.js" defer></script>
   It will, on every page automatically:
     • add a "Log in" link to your nav (works with either nav style)
     • show a magic-link login modal (no passwords)
     • send each logged-in client to THEIR dashboard
     • enable PWA install + register the service worker
   Edit THIS one file to change login behavior site-wide.
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

  // ---------- 2) login modal ----------
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

  // ---------- 3) add "Log in" to whichever nav this page has ----------
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
      var redirect = window.location.origin + window.location.pathname;
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
    loadSupabase(function(){
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      routeIfLoggedIn();
      sb.auth.onAuthStateChange(function(evt){ if (evt === 'SIGNED_IN') routeIfLoggedIn(); });
    });
  });
})();
