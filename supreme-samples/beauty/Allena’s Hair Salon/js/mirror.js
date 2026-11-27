/* ==========================================================================
   MIRROR
   Hero mirror: ~130 flowing strands drawn on a canvas that take on the
   shade chosen in the swatch picker. Pauses when off-screen, when the tab
   is hidden, or when the visitor prefers reduced motion (a still frame is
   drawn instead).

   Expects in the page:
     #strands          <canvas>
     #glass            the arched mirror wrapper (sets --mirror background)
     #shade-caption    live caption under the mirror
     input[name="shade"]  radios carrying data-hex and data-name
   ========================================================================== */

(function () {
  'use strict';

  var radios = Array.prototype.slice.call(document.querySelectorAll('input[name="shade"]'));
  var canvas = document.getElementById('strands');
  var glass = document.getElementById('glass');
  var caption = document.getElementById('shade-caption');

  if (!(canvas && canvas.getContext && glass && radios.length)) return;

  var ctx = canvas.getContext('2d');
  var motion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  var toRgb = function (hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  var lin = function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  var lum = function (c) { return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]); };
  var mix = function (a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; };

  var start = radios.filter(function (r) { return r.checked; })[0] || radios[0];
  var target = toRgb(start.getAttribute('data-hex'));
  var current = target.slice();

  // Seeded PRNG so the strands look the same on every load.
  var seed = 11;
  var rand = function () {
    seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  var COUNT = 132, strands = [];
  for (var i = 0; i < COUNT; i++) {
    strands.push({
      u: (i / (COUNT - 1)) * 2 - 1 + (rand() - 0.5) * 0.02,
      ph: i * 0.028 + rand() * 0.5,
      amp: 0.7 + rand() * 0.6,
      tone: rand(),
      alpha: 0.5 + rand() * 0.4,
      w: 0.7 + rand() * 0.8,
      sheen: i % 11 === 5
    });
  }

  var W = 0, H = 0, dpr = 1, STEPS = 48;
  var size = function () {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = glass.clientWidth; H = glass.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  var draw = function (time) {
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (var s = 0; s < strands.length; s++) {
      var st = strands[s];
      var c = st.sheen ? mix(current, [255, 248, 235], 0.45)
            : st.tone > 0.5 ? mix(current, [255, 246, 232], (st.tone - 0.5) * 0.7)
            : mix(current, [10, 4, 10], (0.5 - st.tone) * 0.8);
      ctx.strokeStyle = 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (st.sheen ? 0.55 : st.alpha) + ')';
      ctx.lineWidth = st.sheen ? 2.2 : st.w;
      ctx.beginPath();
      for (var k = 0; k <= STEPS; k++) {
        var t = k / STEPS;
        var spread = 0.10 + 0.62 * Math.pow(t, 0.85);
        var sway = Math.sin(t * 3.1 + 0.6 + time * 0.22) * 0.11 * Math.min(1, t * 1.6);
        var ripple = Math.sin(t * 8 + st.ph * 2 + time * 0.5) * 0.014 * st.amp * t
                   + Math.sin(t * 14 + st.ph * 3 - time * 0.4) * 0.006 * st.amp * t;
        var x = (0.5 + sway + st.u * 0.5 * spread + ripple) * W;
        var y = (-0.04 + t * 1.1) * H;
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  };

  var STILL = 2.2, t0 = performance.now(), last = 0, running = false, visible = true;
  var frame = function (now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (now - last < 33) return; // ~30fps cap
    last = now;
    for (var j = 0; j < 3; j++) current[j] += (target[j] - current[j]) * 0.12;
    draw((now - t0) / 1000);
  };
  var play = function () {
    var want = !motion.matches && visible && !document.hidden;
    if (want && !running) { running = true; requestAnimationFrame(frame); }
    if (!want) { running = false; }
  };
  var still = function () { current = target.slice(); draw(STILL); };

  size();
  if (motion.matches) still(); else draw(STILL);

  if (window.ResizeObserver) {
    new ResizeObserver(function () { size(); if (!running) { if (motion.matches) still(); else draw(STILL); } }).observe(glass);
  }
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; play(); }).observe(glass);
  }
  document.addEventListener('visibilitychange', play);
  if (motion.addEventListener) motion.addEventListener('change', function () { if (motion.matches) { running = false; still(); } else { play(); } });
  play();

  var pick = function (r) {
    target = toRgb(r.getAttribute('data-hex'));
    glass.style.setProperty('--mirror', lum(target) > 0.26 ? '#34203A' : '#E8D9E2');
    caption.textContent = 'Level ' + r.value + ', ' + r.getAttribute('data-name');
    if (motion.matches) still();
  };
  radios.forEach(function (r) { r.addEventListener('change', function () { if (r.checked) pick(r); }); });
  pick(start);
})();
