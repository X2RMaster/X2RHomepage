/*
 * X2R 모바일 메뉴 (햄버거)
 * - 화면 폭 768px 이하에서 상단 메뉴를 햄버거 버튼으로 접고, 누르면 전체 화면 메뉴가 열림
 * - 메뉴 항목 클릭, ESC, 화면 회전/확대 시 자동으로 닫힘
 * - 데스크톱 화면은 기존 메뉴 그대로
 */
(function () {
  var css = '' +
    '.nav-toggle{display:none;position:relative;z-index:102;width:44px;height:44px;margin-right:-8px;border:0;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '.nav-toggle span{position:absolute;left:11px;width:22px;height:2px;border-radius:2px;background:#fff;transition:transform .3s ease,opacity .2s ease,top .3s ease}' +
    '.nav-toggle span:nth-child(1){top:15px}.nav-toggle span:nth-child(2){top:21px}.nav-toggle span:nth-child(3){top:27px}' +
    'header.nav-open .nav-toggle span:nth-child(1){top:21px;transform:rotate(45deg)}' +
    'header.nav-open .nav-toggle span:nth-child(2){opacity:0}' +
    'header.nav-open .nav-toggle span:nth-child(3){top:21px;transform:rotate(-45deg)}' +
    '@media (max-width:768px){' +
      'header{padding:14px 20px!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(0,0,0,.82)!important}' +
      'header .logo{max-width:118px!important;position:relative;z-index:102}' +
      '.nav-toggle{display:block}' +
      'header .nav-links{position:fixed;inset:0;z-index:101;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:96px 36px 48px;background:rgba(0,0,0,.97);opacity:0;visibility:hidden;transition:opacity .3s ease,visibility .3s}' +
      'header.nav-open .nav-links{opacity:1;visibility:visible}' +
      'header .nav-links>a{margin:0!important;padding:12px 0;font-size:2rem!important;font-weight:800!important;letter-spacing:-1px;color:#777!important;transform:translateY(16px);opacity:0;transition:transform .4s ease,opacity .4s ease,color .2s}' +
      'header.nav-open .nav-links>a{transform:none;opacity:1}' +
      'header .nav-links>a.active{color:#fff!important}' +
      'header .nav-links>a.active::after{content:"";display:inline-block;width:8px;height:8px;margin-left:12px;border-radius:50%;background:#3b82f6;vertical-align:middle}' +
      'header.nav-open .nav-links>a:nth-child(2){transition-delay:.04s}header.nav-open .nav-links>a:nth-child(3){transition-delay:.08s}header.nav-open .nav-links>a:nth-child(4){transition-delay:.12s}' +
      'header .nav-links .lang-switch{margin:36px 0 0!important;padding-top:24px;border-top:1px solid rgba(255,255,255,.15);width:100%;font-size:1rem!important}' +
      'header .nav-links .lang-switch a{font-size:1rem!important;padding:6px 8px!important}' +
      'body.nav-lock{overflow:hidden}' +
    '}';
  var st = document.createElement('style');
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);

  function init() {
    var header = document.querySelector('header');
    var nav = header && header.querySelector('.nav-links');
    if (!nav || header.querySelector('.nav-toggle')) return;
    var en = document.documentElement.lang === 'en';
    var btn = document.createElement('button');
    btn.className = 'nav-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', en ? 'Open menu' : '메뉴 열기');
    btn.innerHTML = '<span></span><span></span><span></span>';
    header.appendChild(btn);

    function set(open) {
      header.classList.toggle('nav-open', open);
      document.body.classList.toggle('nav-lock', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? (en ? 'Close menu' : '메뉴 닫기') : (en ? 'Open menu' : '메뉴 열기'));
    }
    btn.addEventListener('click', function () { set(!header.classList.contains('nav-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 768) set(false); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
