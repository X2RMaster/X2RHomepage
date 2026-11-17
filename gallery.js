/*
 * X2R 메인 프로젝트 갤러리 (슬라이드)
 * - 프로젝트 CSV의 대표 이미지(Title Image)를 읽어 자동으로 슬라이드 구성
 * - 여러 프로젝트가 같은 이미지를 쓰는 경우(기본 이미지)는 제외
 * - 자동 넘김(5초), 좌우 버튼, 키보드 ←/→, 터치·마우스 드래그 지원
 * - 슬라이드 클릭 시 Projects 페이지에서 해당 프로젝트 상세가 열림
 *
 * 사용: <section id="x2r-gallery" data-csv="X2R Projects.csv" data-prefix="" data-link="projects.html" data-lang="ko"></section>
 */
(function () {
  var root = document.getElementById('x2r-gallery');
  if (!root || !window.Papa) return;

  var CSV = root.getAttribute('data-csv');
  var PREFIX = root.getAttribute('data-prefix') || '';
  var LINK = root.getAttribute('data-link') || 'projects.html';
  var EN = root.getAttribute('data-lang') === 'en';
  var INTERVAL = 5000;
  var TXT = EN ? { more: 'View Project', prev: 'Previous', next: 'Next', label: 'FEATURED PROJECTS' }
               : { more: '프로젝트 보기', prev: '이전', next: '다음', label: 'FEATURED PROJECTS' };

  var css = '' +
    '.x2r-gallery{position:relative;height:100vh;min-height:520px;overflow:hidden;background:#000;user-select:none;touch-action:pan-y}' +
    '.x2r-gallery .g-track{display:flex;height:100%;will-change:transform;transition:transform .8s cubic-bezier(.65,0,.35,1)}' +
    '.x2r-gallery .g-track.no-anim{transition:none}' +
    '.x2r-gallery .g-slide{position:relative;flex:0 0 100%;height:100%;overflow:hidden;cursor:pointer}' +
    '.x2r-gallery .g-slide img{width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.06);transition:transform 6s ease-out,opacity .6s;opacity:0}' +
    '.x2r-gallery .g-slide img.loaded{opacity:1}' +
    '.x2r-gallery .g-slide.active img{transform:scale(1)}' +
    '.x2r-gallery .g-slide::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.65) 0%,rgba(0,0,0,.25) 45%,rgba(0,0,0,0) 70%),linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,0) 22%,rgba(0,0,0,.2) 50%,rgba(0,0,0,.92) 100%);pointer-events:none}' +
    '.x2r-gallery .g-cap{position:absolute;left:0;right:0;bottom:110px;z-index:2;max-width:1200px;margin:0 auto;padding:0 40px;opacity:0;transform:translateY(20px);transition:all .8s ease .3s}' +
    '.x2r-gallery .g-slide.active .g-cap{opacity:1;transform:none}' +
    '.x2r-gallery .g-tag{display:inline-block;font-size:.8rem;font-weight:700;letter-spacing:2px;color:#3b82f6;margin-bottom:12px}' +
    '.x2r-gallery .g-title{text-shadow:0 2px 16px rgba(0,0,0,.6);font-size:clamp(1.6rem,3.6vw,3rem);font-weight:800;line-height:1.2;letter-spacing:-1px;max-width:900px;margin-bottom:12px;color:#fff}' +
    '.x2r-gallery .g-desc{text-shadow:0 1px 8px rgba(0,0,0,.7);font-size:1.05rem;color:#ccc;max-width:760px;line-height:1.6;margin-bottom:22px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
    '.x2r-gallery .g-more{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border:1px solid rgba(255,255,255,.4);border-radius:999px;color:#fff;font-size:.95rem;font-weight:600;background:rgba(255,255,255,.06);backdrop-filter:blur(6px);transition:background .3s}' +
    '.x2r-gallery .g-more:hover{background:rgba(255,255,255,.18);opacity:1}' +
    '.x2r-gallery .g-nav{position:absolute;top:50%;z-index:3;width:56px;height:56px;margin-top:-28px;border-radius:50%;border:1px solid rgba(255,255,255,.3);background:rgba(0,0,0,.35);color:#fff;font-size:1.4rem;cursor:pointer;backdrop-filter:blur(6px);transition:background .3s}' +
    '.x2r-gallery .g-nav:hover{background:rgba(255,255,255,.2)}' +
    '.x2r-gallery .g-prev{left:28px}.x2r-gallery .g-next{right:28px}' +
    '.x2r-gallery .g-bar{position:absolute;left:0;right:0;bottom:44px;z-index:3;max-width:1200px;margin:0 auto;padding:0 40px;display:flex;align-items:center;gap:18px;color:#aaa;font-size:.9rem;font-variant-numeric:tabular-nums}' +
    '.x2r-gallery .g-count b{color:#fff;font-weight:700}' +
    '.x2r-gallery .g-progress{flex:1;height:2px;background:rgba(255,255,255,.2);overflow:hidden}' +
    '.x2r-gallery .g-progress i{display:block;height:100%;width:0;background:#3b82f6}' +
    '.x2r-gallery .g-label{position:absolute;top:110px;left:0;right:0;z-index:2;max-width:1200px;margin:0 auto;padding:0 40px;font-size:.85rem;letter-spacing:3px;color:rgba(255,255,255,.6);font-weight:600}' +
    '@media (max-width:768px){.x2r-gallery{height:78vh}.x2r-gallery .g-nav{display:none}.x2r-gallery .g-cap,.x2r-gallery .g-bar,.x2r-gallery .g-label{padding:0 20px}.x2r-gallery .g-cap{bottom:90px}.x2r-gallery .g-label{top:90px}}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  function imgUrl(u) {
    if (!u) return '';
    u = u.trim();
    var m = u.match(/wix:image:\/\/v1\/([^/]+)\//);
    if (m) return 'https://static.wixstatic.com/media/' + m[1];
    if (/^https?:/.test(u)) return u;
    return PREFIX + u.replace(/^\.\//, '');
  }
  function esc(s) {
    return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  Papa.parse(CSV, {
    download: true, header: true, skipEmptyLines: true,
    complete: function (res) {
      var rows = res.data.filter(function (r) { return r['Project Name'] && r['Project Name'].trim(); });
      // 여러 프로젝트가 공유하는 이미지는 기본 이미지로 보고 제외
      var cnt = {};
      rows.forEach(function (r) { var u = imgUrl(r['Title Image']); if (u) cnt[u] = (cnt[u] || 0) + 1; });
      var items = [];
      rows.forEach(function (r, idx) {
        var u = imgUrl(r['Title Image']);
        if (!u || cnt[u] > 1) return;
        var cust = '';
        for (var k in r) if (/Customers/.test(k)) cust = r[k];
        items.push({ idx: idx, img: u, title: r['Project Name'], desc: r['Short Description'], tag: (cust || '').replace(/[\[\]]/g, '').trim(), year: (r['\bYear'] || r['Year'] || '').replace('년', '') });
      });
      if (items.length) build(items);
    }
  });

  function build(items) {
    var n = items.length;
    var html = '<div class="g-label">' + TXT.label + '</div><div class="g-track">';
    // 앞뒤로 복제 슬라이드를 붙여 무한 루프
    var seq = [items[n - 1]].concat(items, [items[0]]);
    seq.forEach(function (it) {
      html += '<div class="g-slide" data-idx="' + it.idx + '">' +
        '<img data-src="' + esc(it.img) + '" alt="' + esc(it.title) + '">' +
        '<div class="g-cap"><span class="g-tag">' + esc([it.year, it.tag].filter(Boolean).join(' · ')) + '</span>' +
        '<h2 class="g-title">' + esc(it.title) + '</h2>' +
        '<p class="g-desc">' + esc(it.desc) + '</p>' +
        '<a class="g-more" href="' + LINK + '#p' + it.idx + '">' + TXT.more + ' &rarr;</a></div></div>';
    });
    html += '</div>' +
      '<button class="g-nav g-prev" aria-label="' + TXT.prev + '">&#8249;</button>' +
      '<button class="g-nav g-next" aria-label="' + TXT.next + '">&#8250;</button>' +
      '<div class="g-bar"><span class="g-count"><b class="g-cur">01</b> / ' + String(n).padStart(2, '0') + '</span><div class="g-progress"><i></i></div></div>';
    root.innerHTML = html;

    var track = root.querySelector('.g-track');
    var slides = root.querySelectorAll('.g-slide');
    var cur = root.querySelector('.g-cur');
    var bar = root.querySelector('.g-progress i');
    var pos = 1, timer = null, busy = false;

    function load(i) {
      var s = slides[i]; if (!s) return;
      var img = s.querySelector('img');
      if (img.getAttribute('src')) return;
      img.onload = function () { img.classList.add('loaded'); };
      img.onerror = function () { img.classList.add('loaded'); };
      img.src = img.getAttribute('data-src');
    }
    function render(anim) {
      track.classList.toggle('no-anim', !anim);
      track.style.transform = 'translateX(' + (-pos * 100) + '%)';
      slides.forEach(function (s, i) { s.classList.toggle('active', i === pos); });
      var real = (pos - 1 + n) % n;
      cur.textContent = String(real + 1).padStart(2, '0');
      [pos - 1, pos, pos + 1, pos + 2].forEach(load);
      restartBar();
    }
    function go(d) {
      if (busy) return;
      busy = true;
      pos += d;
      render(true);
    }
    track.addEventListener('transitionend', function (e) {
      if (e.target !== track) return;
      busy = false;
      if (pos === 0) { pos = n; render(false); }
      else if (pos === n + 1) { pos = 1; render(false); }
    });
    function restartBar() {
      bar.style.transition = 'none'; bar.style.width = '0';
      void bar.offsetWidth;
      if (!timer) return;
      bar.style.transition = 'width ' + INTERVAL + 'ms linear'; bar.style.width = '100%';
    }
    function play() { stop(); timer = setInterval(function () { go(1); }, INTERVAL); restartBar(); }
    function stop() { if (timer) clearInterval(timer); timer = null; bar.style.transition = 'none'; bar.style.width = '0'; }

    root.querySelector('.g-prev').addEventListener('click', function (e) { e.stopPropagation(); go(-1); play(); });
    root.querySelector('.g-next').addEventListener('click', function (e) { e.stopPropagation(); go(1); play(); });
    document.addEventListener('keydown', function (e) {
      var r = root.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      if (e.key === 'ArrowRight') { go(1); play(); }
      if (e.key === 'ArrowLeft') { go(-1); play(); }
    });
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', play);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : play(); });

    // 터치·마우스 드래그로 넘기기
    var sx = null, dx = 0, dragged = false;
    function down(x) { if (busy) return; sx = x; dx = 0; dragged = false; track.classList.add('no-anim'); }
    function move(x) {
      if (sx === null) return;
      dx = x - sx; if (Math.abs(dx) > 6) dragged = true;
      track.style.transform = 'translateX(calc(' + (-pos * 100) + '% + ' + dx + 'px))';
    }
    function up() {
      if (sx === null) return;
      sx = null;
      if (Math.abs(dx) > root.clientWidth * 0.12) go(dx < 0 ? 1 : -1); else render(true);
      play();
    }
    root.addEventListener('touchstart', function (e) { down(e.touches[0].clientX); }, { passive: true });
    root.addEventListener('touchmove', function (e) { move(e.touches[0].clientX); }, { passive: true });
    root.addEventListener('touchend', up);
    root.addEventListener('mousedown', function (e) { if (e.target.closest('.g-nav,.g-more')) return; e.preventDefault(); down(e.clientX); });
    window.addEventListener('mousemove', function (e) { move(e.clientX); });
    window.addEventListener('mouseup', up);

    // 슬라이드 클릭 → 해당 프로젝트 상세
    root.addEventListener('click', function (e) {
      if (dragged) { dragged = false; return; }
      if (e.target.closest('.g-nav,.g-more')) return;
      var s = e.target.closest('.g-slide');
      if (s) location.href = LINK + '#p' + s.getAttribute('data-idx');
    });

    render(false);
    play();
  }
})();
