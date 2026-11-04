/* 脑智融合实验室 · 全站脚本 / Site script */
(function () {
  var root = document.documentElement;
  var KEY = 'bifl-lang';

  /* ---------- 中英切换 language switch ---------- */
  function applyLang(lang) {
    root.setAttribute('data-lang', lang);
    root.lang = lang === 'en' ? 'en' : 'zh-CN';
    var t = document.querySelector('title');
    if (t && t.getAttribute('data-' + lang)) document.title = t.getAttribute('data-' + lang);
    var btns = document.querySelectorAll('.lang-switch');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('title', lang === 'en' ? '切换到中文' : 'Switch to English');
    }
    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }

  applyLang(root.getAttribute('data-lang') === 'en' ? 'en' : 'zh');

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.lang-switch') : null;
    if (!btn) return;
    applyLang(root.getAttribute('data-lang') === 'en' ? 'zh' : 'en');
  });

  /* ---------- 当前栏目高亮 current nav item ---------- */
  var page = document.body.getAttribute('data-page');
  if (page) {
    var cur = document.querySelector('.nav li[data-nav="' + page + '"]');
    if (cur) cur.classList.add('current');
  }

  /* ---------- 返回顶部 back to top ---------- */
  var toTop = document.querySelector('.to-top');
  if (toTop) {
    var onScroll = function () {
      toTop.classList.toggle('show', window.pageYOffset > 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    toTop.addEventListener('click', function (e) {
      e.preventDefault();
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 首页图片轮播 hero carousel ---------- */
  var car = document.querySelector('.hero-carousel');
  if (car) {
    var INTERVAL = 6000;
    var track = car.querySelector('.hc-track');
    var slides = car.querySelectorAll('.hc-slide');
    var dots = car.querySelectorAll('.hc-dot');
    var pauseBtn = car.querySelector('.hc-pause');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var idx = 0, timer = null, paused = reduce, holding = false;
    if (reduce && pauseBtn) pauseBtn.setAttribute('aria-pressed', 'true');

    var schedule = function () {
      clearTimeout(timer);
      car.classList.remove('is-timing');
      void car.offsetWidth;                      // restart the progress-bar animation
      if (paused || holding || document.hidden) return;
      car.classList.add('is-timing');
      timer = setTimeout(function () { go(idx + 1); }, INTERVAL);
    };
    var go = function (n) {
      idx = (n + slides.length) % slides.length;
      track.style.transform = 'translateX(' + (-idx * 100) + '%)';
      for (var i = 0; i < slides.length; i++) {
        var on = i === idx;
        slides[i].classList.toggle('is-active', on);
        if (on) slides[i].removeAttribute('aria-hidden'); else slides[i].setAttribute('aria-hidden', 'true');
        var link = slides[i].querySelector('a');
        if (link) link.tabIndex = on ? 0 : -1;
        dots[i].classList.toggle('is-active', on);
        if (on) dots[i].setAttribute('aria-current', 'true'); else dots[i].removeAttribute('aria-current');
      }
      schedule();
    };

    car.querySelector('.hc-prev').addEventListener('click', function () { go(idx - 1); });
    car.querySelector('.hc-next').addEventListener('click', function () { go(idx + 1); });
    for (var d = 0; d < dots.length; d++) {
      dots[d].addEventListener('click', (function (k) { return function () { go(k); }; })(d));
    }
    if (pauseBtn) pauseBtn.addEventListener('click', function () {
      paused = !paused;
      pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      schedule();
    });
    var hold = function (v) { return function () { holding = v; schedule(); }; };
    car.addEventListener('mouseenter', hold(true));
    car.addEventListener('mouseleave', hold(false));
    car.addEventListener('focusin', hold(true));
    car.addEventListener('focusout', function (e) { if (!car.contains(e.relatedTarget)) { holding = false; schedule(); } });
    car.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') go(idx - 1);
      if (e.key === 'ArrowRight') go(idx + 1);
    });
    document.addEventListener('visibilitychange', schedule);
    var x0 = null;
    car.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
    });
    go(0);
  }

  /* ---------- 联系方式图标 contact icons ----------
     点图标在下方展开小框，再点一次或按 Esc 收起 */
  var KINDS = {
    email:    { zh: '邮箱', en: 'Email', go: ['发送邮件', 'Send email'] },
    linkedin: { zh: '领英', en: 'LinkedIn', go: ['打开', 'Open'] },
    homepage: { zh: '个人主页', en: 'Homepage', go: ['打开', 'Open'] },
    phone:    { zh: '电话', en: 'Phone', go: ['拨打', 'Call'] },
    fax:      { zh: '传真', en: 'Fax', go: null }
  };
  var bi = function (tag, zh, en) {
    var el = document.createElement(tag);
    el.innerHTML = '<span class="zh"></span><span class="en"></span>';
    el.firstChild.textContent = zh; el.lastChild.textContent = en;
    return el;
  };
  var contacts = document.querySelectorAll('[data-contact]');
  for (var c = 0; c < contacts.length; c++) (function (box) {
    var btns = box.querySelectorAll('.ci');
    var panel = document.createElement('div');
    panel.className = 'contact-panel';
    panel.innerHTML = '<div><div class="cp-box" role="region" aria-live="polite"></div></div>';
    box.appendChild(panel);
    var inner = panel.querySelector('.cp-box');
    var current = null;

    var close = function () {
      if (!current) return;
      current.setAttribute('aria-expanded', 'false');
      current = null;
      panel.classList.remove('open');
    };
    var open = function (btn) {
      if (current) current.setAttribute('aria-expanded', 'false');
      current = btn;
      btn.setAttribute('aria-expanded', 'true');
      var k = KINDS[btn.getAttribute('data-kind')] || { zh: '', en: '', go: ['打开', 'Open'] };
      var value = btn.getAttribute('data-value') || '';
      var href = btn.getAttribute('data-href');
      inner.innerHTML = '';
      var label = bi('span', k.zh, k.en); label.className = 'cp-label';
      var val = document.createElement('span'); val.className = 'cp-value'; val.textContent = value;
      var acts = document.createElement('span'); acts.className = 'cp-actions';
      if (href && k.go) {
        var a = bi('a', k.go[0], k.go[1]); a.href = href;
        if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
        acts.appendChild(a);
      }
      var copy = bi('button', '复制', 'Copy'); copy.type = 'button';
      copy.addEventListener('click', function () {
        var done = function () { copy.firstChild.textContent = '已复制'; copy.lastChild.textContent = 'Copied'; };
        try { navigator.clipboard.writeText(value).then(done, function () {}); } catch (e) {}
      });
      acts.appendChild(copy);
      inner.appendChild(label); inner.appendChild(val); inner.appendChild(acts);
      panel.classList.add('open');
    };

    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-expanded', 'false');
      btns[i].addEventListener('click', function () { if (current === this) close(); else open(this); });
    }
    box.addEventListener('keydown', function (e) { if (e.key === 'Escape' && current) { var b = current; close(); b.focus(); } });
    document.addEventListener('click', function (e) { if (!box.contains(e.target)) close(); });
  })(contacts[c]);

  /* ---------- 论文筛选 publication filters ----------
     左侧按 类型 / 方向 / 年份 筛选（每组单选，再点一次取消），可加搜索；
     网址 publications.html#dir=nr&year=2026 会自动套用筛选 */
  var pubs = document.querySelector('[data-pubs]');
  if (pubs) {
    var items = pubs.querySelectorAll('.pub');
    var years = pubs.querySelectorAll('.pub-year');
    var yearList = pubs.querySelector('[data-filter="year"]');
    for (var y = 0; y < years.length; y++) {
      var yv = years[y].getAttribute('data-year');
      for (var p = 0; p < years[y].querySelectorAll('.pub').length; p++) years[y].querySelectorAll('.pub')[p].setAttribute('data-year', yv);
      var li = document.createElement('li');
      li.innerHTML = '<button type="button"></button>';
      li.firstChild.setAttribute('data-v', yv); li.firstChild.textContent = yv;
      yearList.appendChild(li);
    }
    var state = { type: '', dir: '', year: '', q: '' };
    var qInput = pubs.querySelector('[data-q]');
    var clearBtn = pubs.querySelector('[data-clear]');
    var countEl = pubs.querySelector('.pub-count');
    var emptyEl = pubs.querySelector('.pub-empty');
    var fbtns = pubs.querySelectorAll('[data-filter] button');

    var matches = function (el, skip) {
      if (state.type && skip !== 'type' && el.getAttribute('data-type') !== state.type) return false;
      if (state.dir && skip !== 'dir' && (' ' + el.getAttribute('data-dir') + ' ').indexOf(' ' + state.dir + ' ') < 0) return false;
      if (state.year && skip !== 'year' && el.getAttribute('data-year') !== state.year) return false;
      if (state.q && el.textContent.toLowerCase().indexOf(state.q) < 0) return false;
      return true;
    };
    var apply = function () {
      var shown = 0;
      for (var i = 0; i < items.length; i++) {
        var ok = matches(items[i]);
        items[i].hidden = !ok;
        if (ok) shown++;
      }
      for (var j = 0; j < years.length; j++) years[j].hidden = !years[j].querySelector('.pub:not([hidden])');
      for (var k = 0; k < fbtns.length; k++) {
        var b = fbtns[k], group = b.parentNode.parentNode.getAttribute('data-filter'), v = b.getAttribute('data-v');
        var n = 0;
        for (var m = 0; m < items.length; m++) {
          var it = items[m];
          var hit = group === 'dir' ? (' ' + it.getAttribute('data-dir') + ' ').indexOf(' ' + v + ' ') >= 0 : it.getAttribute('data-' + group) === v;
          if (hit && matches(it, group)) n++;
        }
        var on = state[group] === v;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.disabled = !n && !on;
        var badge = b.querySelector('.n');
        if (group !== 'year') {
          if (!badge) { badge = document.createElement('span'); badge.className = 'n'; b.appendChild(badge); }
          badge.textContent = n;
        }
      }
      countEl.innerHTML = '<span class="zh">共 ' + shown + ' 篇</span><span class="en">' + shown + (shown === 1 ? ' publication' : ' publications') + '</span>';
      emptyEl.hidden = shown > 0;
      var active = state.type || state.dir || state.year || state.q;
      clearBtn.hidden = !active;
      var h = [];
      if (state.type) h.push('type=' + state.type);
      if (state.dir) h.push('dir=' + state.dir);
      if (state.year) h.push('year=' + state.year);
      try { history.replaceState(null, '', h.length ? '#' + h.join('&') : location.pathname + location.search); } catch (e) {}
    };
    var readHash = function () {
      state.type = state.dir = state.year = '';
      location.hash.replace(/^#/, '').split('&').forEach(function (pair) {
        var kv = pair.split('=');
        if (kv[0] in state && kv[0] !== 'q') state[kv[0]] = decodeURIComponent(kv[1] || '');
      });
      apply();
    };
    for (var f = 0; f < fbtns.length; f++) fbtns[f].addEventListener('click', function () {
      var group = this.parentNode.parentNode.getAttribute('data-filter'), v = this.getAttribute('data-v');
      state[group] = state[group] === v ? '' : v;
      apply();
    });
    qInput.addEventListener('input', function () { state.q = qInput.value.trim().toLowerCase(); apply(); });
    clearBtn.addEventListener('click', function () { state = { type: '', dir: '', year: '', q: '' }; qInput.value = ''; apply(); });
    window.addEventListener('hashchange', readHash);
    readHash();

    // 摘要 / BibTeX 展开
    pubs.addEventListener('click', function (e) {
      var t = e.target.closest('[data-more]');
      if (t) {
        var panel = t.closest('.pub').querySelector('[data-panel="' + t.getAttribute('data-more') + '"]');
        var open = !panel.classList.contains('open');
        panel.classList.toggle('open', open);
        t.setAttribute('aria-expanded', open ? 'true' : 'false');
        return;
      }
      var c = e.target.closest('[data-copy]');
      if (c) {
        var text = c.parentNode.querySelector('pre').textContent;
        try { navigator.clipboard.writeText(text).then(function () { c.firstChild.textContent = '已复制'; c.lastChild.textContent = 'Copied'; }, function () {}); } catch (err) {}
      }
    });
  }

  /* ---------- 移动端菜单 mobile menu ---------- */
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  if (header && toggle) {
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    var links = header.querySelectorAll('.nav a');
    for (var j = 0; j < links.length; j++) {
      links[j].addEventListener('click', function () {
        header.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    }
  }
})();
