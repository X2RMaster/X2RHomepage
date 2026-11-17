/*
 * X2R 언어 자동 전환 스크립트
 * - 한국어 페이지(루트)에서: 방문자 IP 국가가 KR이 아니면 /en/ 페이지로 이동
 * - 사용자가 KO/EN 토글을 누르면 그 선택을 저장하고 이후 자동 판별보다 우선
 * - 주소 뒤에 ?lang=ko 또는 ?lang=en 을 붙이면 강제로 해당 언어로 고정 (QR코드 등에 활용)
 * - 검색엔진 봇은 이동시키지 않음 (각 언어 페이지가 따로 색인되도록)
 */
(function () {
  var PREF_KEY = 'x2r_lang';          // 사용자가 직접 고른 언어 ('ko' | 'en')
  var GEO_KEY = 'x2r_geo';            // IP 국가 조회 결과 캐시
  var GEO_TTL = 7 * 24 * 3600 * 1000; // 캐시 유지 기간: 7일
  var GEO_TIMEOUT = 1500;             // 국가 조회 최대 대기 시간(ms)
  var GEO_API = 'https://api.country.is/';

  var path = location.pathname;
  var isEn = /\/en\/[^\/]*$/.test(path);
  var doc = document.documentElement;

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function pageName() {
    var m = path.match(/([^\/]+\.html)$/);
    return m ? m[1] : 'index.html';
  }
  function enUrl() {
    return path.replace(/[^\/]*$/, '') + 'en/' + pageName() + location.search.replace(/[?&]lang=\w+/, '') + location.hash;
  }
  function reveal() { doc.classList.remove('x2r-lang-check'); }
  function goEn() { location.replace(enUrl()); }

  // 1) 토글 클릭 시 선택 저장
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-lang]') : null;
    if (a) set(PREF_KEY, a.getAttribute('data-lang'));
  });

  // 2) ?lang= 파라미터로 강제 지정
  var q = location.search.match(/[?&]lang=(ko|en)\b/);
  if (q) set(PREF_KEY, q[1]);

  // 영어 페이지에서는 자동 이동하지 않음
  if (isEn) return;

  var pref = get(PREF_KEY);
  if (pref === 'ko') return;
  if (pref === 'en') { goEn(); return; }

  // 검색엔진/미리보기 봇은 이동시키지 않음
  if (/bot|crawl|spider|slurp|facebookexternalhit|kakaotalk-scrap|lighthouse/i.test(navigator.userAgent)) return;

  function decide(country) {
    if (country && country !== 'KR') goEn(); else reveal();
  }

  // 캐시된 국가 정보가 있으면 바로 판단
  try {
    var cached = JSON.parse(get(GEO_KEY) || 'null');
    if (cached && Date.now() - cached.t < GEO_TTL) { decide(cached.c); return; }
  } catch (e) {}

  // 판별하는 동안 한국어 화면이 잠깐 보였다 넘어가는 것 방지
  doc.classList.add('x2r-lang-check');
  var style = document.createElement('style');
  style.textContent = 'html.x2r-lang-check body{visibility:hidden}';
  (document.head || doc).appendChild(style);

  var done = false;
  function finish(country) {
    if (done) return;
    done = true;
    decide(country);
  }
  // 조회 실패/지연 시: 브라우저 언어로 판단
  function fallback() {
    var langs = navigator.languages || [navigator.language || ''];
    var ko = false;
    for (var i = 0; i < langs.length; i++) if (/^ko/i.test(langs[i])) ko = true;
    finish(ko ? 'KR' : 'XX');
  }
  setTimeout(fallback, GEO_TIMEOUT);

  if (window.fetch) {
    fetch(GEO_API, { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var c = (d && d.country || '').toUpperCase();
        if (!c) return fallback();
        set(GEO_KEY, JSON.stringify({ c: c, t: Date.now() }));
        finish(c);
      })
      .catch(fallback);
  } else {
    fallback();
  }
})();
