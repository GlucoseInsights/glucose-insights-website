/* Page-local code for the Glucose Insights homepage (variant A).
   The scroll-craft engine is untouched; this file only reads --sc-p where it
   needs to and draws the real race data. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* phones: give the hero more scroll so the copy fades over a real distance */
  var heroAct = document.querySelector('.hero[data-sc-act]');
  if (heroAct && window.matchMedia('(max-width: 700px)').matches) {
    heroAct.setAttribute('data-sc-span', '2.6');
    var heroCopy = heroAct.querySelector('.hero__copy'); if (heroCopy) heroCopy.setAttribute('data-sc-cue', '0 0.9 0 0.85');
  }

  /* ---- device readout, only with ?scdebug in the URL: y, hero p, copy opacity,
     scroll events per second. For checking a real phone; never on by default. */
  if (/[?&]scdebug/.test(location.search)) {
    var box = document.createElement('pre');
    box.style.cssText = 'position:fixed;left:8px;top:72px;z-index:9999;margin:0;padding:6px 8px;background:rgba(0,0,0,.75);color:#5BE0A9;font:12px/1.4 ui-monospace,Menlo,monospace;border-radius:6px;pointer-events:none;white-space:pre';
    document.body.appendChild(box);
    var evts = 0, lastT = performance.now(), rate = 0;
    addEventListener('scroll', function () { evts++; }, { passive: true });
    (function dbg() {
      var now = performance.now();
      if (now - lastT > 1000) { rate = evts; evts = 0; lastT = now; }
      var hc = document.querySelector('.hero__copy'), hero = document.querySelector('.hero');
      box.textContent = 'y ' + Math.round(scrollY) + '  vh ' + innerHeight + '\np ' + (getComputedStyle(hero).getPropertyValue('--sc-p') || '?').trim().slice(0, 5) + '  op ' + (hc ? getComputedStyle(hc).opacity.slice(0, 5) : '?') + '\nscroll/s ' + rate + '  ' + (navigator.userAgent.match(/OS \d+_\d+/) || [''])[0];
      requestAnimationFrame(dbg);
    })();
  }

  /* ------------------------------------------ rotating noun in the pain act */
  var rot = document.querySelector('[data-rot]');
  if (rot && !reduce) {
    var words = rot.querySelectorAll('.rot__w'), idx = 0, timer = null;
    function step() {
      words[idx].classList.remove('is-on'); words[idx].classList.add('is-past');
      idx = (idx + 1) % words.length;
      words[idx].classList.remove('is-past'); words[idx].classList.add('is-on');
      // the word two ahead resets below, off screen, with no transition
      var next = words[(idx + 1) % words.length];
      next.style.transition = 'none'; next.classList.remove('is-past'); void next.offsetWidth; next.style.transition = '';
    }
    function start() { if (!timer) timer = setInterval(step, 500); }
    function stop() { clearInterval(timer); timer = null; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }, { threshold: 0.2 }).observe(rot);
    } else start();
  }

  /* ---------------------------------------------------- hero loop video */
  var video = document.querySelector('.hero__video');
  var pause = document.querySelector('.hero__pause');
  if (video && !reduce) {
    var mobile = window.matchMedia('(max-width: 700px)').matches;
    video.src = mobile ? video.getAttribute('data-src-mobile') : video.getAttribute('data-src');
    video.addEventListener('playing', function () { video.classList.add('is-live'); }, { once: true });
    var p = video.play(); if (p && p.catch) p.catch(function () {});
    pause.addEventListener('click', function () {
      var paused = pause.getAttribute('aria-pressed') === 'true';
      if (paused) { video.play(); } else { video.pause(); }
      pause.setAttribute('aria-pressed', paused ? 'false' : 'true');
      pause.setAttribute('aria-label', paused ? 'Pause background video' : 'Play background video');
    });
  } else if (pause) { pause.hidden = true; }

  /* ------------------------------------------------- the real marathon */
  var ARROWS = { Flat: '→', FortyFiveUp: '↗', SingleUp: '↑', DoubleUp: '↑↑', FortyFiveDown: '↘', SingleDown: '↓', DoubleDown: '↓↓' };
  var svg = document.getElementById('raceChart');
  var cardsHost = document.getElementById('raceCards');
  var labelsHost = document.getElementById('raceLabels');
  var board = document.getElementById('raceBoard');
  if (!svg) return;

  fetch('assets/malaga.json').then(function (r) { return r.json(); }).then(draw).catch(function (e) { console.warn('race data', e); });

  var W = 1000, H = 400, BASE = 350, TOP = 40;
  var T0 = 0, T1;
  function x(min) { return (min - T0) / (T1 - T0) * W; }
  function yG(v) { return BASE - (v - 3) / (12 - 3) * (BASE - TOP); }
  function yH(b) { return BASE - (b - 80) / (180 - 80) * (BASE - TOP); }
  function fmt(min) { var m = Math.round(min); return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); }

  function draw(d) {
    T1 = d.durationSec / 60;
    var g = d.glucose.filter(function (p) { return p[0] >= T0 && p[0] <= T1; });
    var hr = d.hr.filter(function (p) { return p[0] >= T0 && p[0] <= T1; });
    var ns = 'http://www.w3.org/2000/svg';
    function el(n, a) { var e = document.createElementNS(ns, n); for (var k in a) e.setAttribute(k, a[k]); return e; }
    // in-range band 3.9 to 10
    svg.appendChild(el('rect', { x: 0, y: yG(10), width: W, height: yG(3.9) - yG(10), 'class': 'race__band' }));
    // ticks: every 5 min minor, every 30 major
    for (var m = 0; m <= T1; m += 5) {
      var major = m % 30 === 0;
      svg.appendChild(el('line', { x1: x(m), x2: x(m), y1: BASE, y2: BASE + (major ? 14 : 7), 'class': 'race__tick' + (major ? ' race__tick--major' : '') }));
    }
    svg.appendChild(el('line', { x1: 0, x2: W, y1: BASE, y2: BASE, 'class': 'race__base' }));
    // heart rate, faint
    var hp = hr.map(function (p, i) { return (i ? 'L' : 'M') + x(p[0]).toFixed(1) + ' ' + yH(p[1]).toFixed(1); }).join(' ');
    svg.appendChild(el('path', { d: hp, 'class': 'race__hr' }));
    // glucose
    var gp = g.map(function (p, i) { return (i ? 'L' : 'M') + x(p[0]).toFixed(1) + ' ' + yG(p[1]).toFixed(1); }).join(' ');
    svg.appendChild(el('path', { d: gp, 'class': 'race__gl' }));

    // time labels along the ruler
    for (var t = 0; t <= T1; t += 30) { var l = document.createElement('span'); l.className = 'race__lbl'; l.style.left = (x(t) / W * 100) + '%'; l.textContent = fmt(t); labelsHost.appendChild(l); }
    var fin = document.createElement('span'); fin.className = 'race__lbl'; fin.style.left = '100%'; fin.textContent = 'Finish'; labelsHost.appendChild(fin);
    // y axis marks for glucose
    [4, 6, 8, 10].forEach(function (v) { var a = document.createElement('span'); a.className = 'race__axis'; a.style.top = (yG(v) / H * 100) + '%'; a.textContent = v; labelsHost.appendChild(a); });

    // the four real moments
    var first = g[0], last = g[g.length - 1];
    var hi = g.reduce(function (a, b) { return b[1] > a[1] ? b : a; });
    var lo = g.reduce(function (a, b) { return b[1] < a[1] ? b : a; });
    var moments = [
      { t: 'The gun', p: first, h: 110 },
      { t: 'Lowest', p: lo, h: 70 },
      { t: 'Highest', p: hi, h: 96 },
      { t: 'The finish', p: last, h: 120 }
    ];
    moments.forEach(function (mo) {
      var c = document.createElement('div'); c.className = 'card'; c.setAttribute('data-min', mo.p[0]); c.setAttribute('data-val', mo.p[1]); c.style.setProperty('--h', mo.h + 'px'); c.setAttribute('data-h', mo.h);
      c.innerHTML = '<b>' + mo.t + '</b><span><em>' + mo.p[1].toFixed(1) + '</em> mmol/L ' + (ARROWS[mo.p[2]] || '') + ' · ' + fmt(mo.p[0]) + '</span><i aria-hidden="true"></i>';
      cardsHost.appendChild(c);
    });
    if (cardsHost.classList.contains('sc-in')) Array.prototype.forEach.call(cardsHost.children, function (k) { k.classList.add('sc-in'); });
    place(); window.addEventListener('resize', place);
  }
  function place() {
    var r = board.getBoundingClientRect(); var Wp = r.width, Hp = r.height;
    var cards = cardsHost.querySelectorAll('.card');
    var stack = window.matchMedia('(max-width: 700px)').matches;
    cardsHost.classList.toggle('race__cards--stack', stack);
    var marks = labelsHost.querySelector('.race__marks');
    if (stack) {
      Array.prototype.forEach.call(cards, function (c) { c.style.left = ''; c.style.bottom = ''; var sc = c.querySelector('i'); if (sc) sc.style.left = ''; });
      if (!marks) {
        marks = document.createElement('div'); marks.className = 'race__marks'; labelsHost.appendChild(marks);
        Array.prototype.forEach.call(cards, function (c, k) {
          var m = document.createElement('span'); m.className = 'race__pin'; m.textContent = k + 1;
          m.style.left = (x(+c.getAttribute('data-min')) / W * 100) + '%'; m.style.top = (yG(+c.getAttribute('data-val')) / H * 100) + '%';
          marks.appendChild(m);
          if (!c.querySelector('.card__n')) { var n = document.createElement('span'); n.className = 'card__n'; n.textContent = k + 1; c.insertBefore(n, c.firstChild); }
        });
      }
      return;
    }
    if (marks) marks.remove();
    Array.prototype.forEach.call(cards, function (c, i) {
      var min = +c.getAttribute('data-min'), v = +c.getAttribute('data-val'), h = +c.getAttribute('data-h');
      var px = x(min) / W * Wp, py = yG(v) / H * Hp;
      var cw = c.offsetWidth || 196;
      var left = Math.min(Math.max(px - 12, 0), Wp - cw);
      c.style.left = left + 'px';
      c.style.bottom = (Hp - py + h) + 'px';
      // keep the sceptre on the data point even when the card is shoved from the edge
      var sc = c.querySelector('i'); if (sc) sc.style.left = (px - left) + 'px';
    });
  }
})();
