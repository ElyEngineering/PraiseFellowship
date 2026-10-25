// Praise Fellowship — small, gentle motion. Respects prefers-reduced-motion and pauses offscreen.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nav: solid background after the hero; mobile menu
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('solid', scrollY > innerHeight * 0.6);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const btn = document.querySelector('.menu-btn'), menu = document.getElementById('menu');
  btn.addEventListener('click', () => { const o = menu.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
  menu.addEventListener('click', e => { if (e.target.tagName === 'A') { menu.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } });

  // Reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Gentle parallax on photo bands
  const bands = [...document.querySelectorAll('.band img')];
  if (!reduce && bands.length) {
    let ticking = false;
    const par = () => { bands.forEach(img => { const r = img.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return; const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; img.style.transform = `translate3d(0,${(-8 + p * 14).toFixed(2)}%,0)`; }); ticking = false; };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(par); } }, { passive: true }); par();
  }

  // Hero canvas: soft points of light. Most descend slowly from the sky; a few rise like fireflies off the water.
  const cv = document.querySelector('.motes'); if (!cv) return;
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, motes = [], running = false, visible = true, raf = 0, t0 = performance.now();
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const sprite = (() => { // pre-rendered glow
    const s = document.createElement('canvas'); s.width = s.height = 64; const g = s.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,240,210,1)'); gr.addColorStop(0.18, 'rgba(255,214,150,.75)'); gr.addColorStop(0.5, 'rgba(241,170,100,.18)'); gr.addColorStop(1, 'rgba(241,170,100,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return s;
  })();
  const rnd = (a, b) => a + Math.random() * (b - a);
  function make(initial) {
    const rise = Math.random() < 0.28; // fireflies from the lake
    return {
      x: rnd(0, W), y: initial ? rnd(0, H) : (rise ? H + 20 : -20),
      z: rnd(0.35, 1),                    // depth: size, speed, parallax
      vy: (rise ? -1 : 1) * rnd(6, 16),   // px per second
      sway: rnd(8, 26), freq: rnd(0.08, 0.25), ph: rnd(0, Math.PI * 2),
      tw: rnd(0.3, 1.1), rise
    };
  }
  function resize() {
    const r = cv.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(90, Math.max(28, W * H / 16000)));
    motes = Array.from({ length: n }, () => make(true));
  }
  function draw(now) {
    const dt = Math.min(0.05, (now - t0) / 1000); t0 = now; const ts = now / 1000;
    mouse.x += (mouse.tx - mouse.x) * 0.04; mouse.y += (mouse.ty - mouse.y) * 0.04;
    ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
    for (const m of motes) {
      m.y += m.vy * m.z * dt;
      const x = m.x + Math.sin(ts * m.freq * 6.283 + m.ph) * m.sway + mouse.x * 18 * m.z;
      const y = m.y + mouse.y * 12 * m.z;
      if (m.y > H + 30 || m.y < -30) Object.assign(m, make(false));
      // fade near the top/bottom edges; fireflies only glow over the water (lower half)
      let a = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(ts * m.tw * 2 + m.ph))) * m.z;
      const edge = Math.min(1, (m.y + 30) / 120, (H + 30 - m.y) / 120); a *= Math.max(0, edge);
      if (m.rise) a *= Math.max(0, Math.min(1, (m.y - H * 0.45) / (H * 0.25)));
      if (a <= 0.01) continue;
      const s = (m.rise ? 10 : 14) * m.z + 4;
      ctx.globalAlpha = Math.min(1, a * 0.85);
      ctx.drawImage(sprite, x - s, y - s, s * 2, s * 2);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (running) raf = requestAnimationFrame(draw);
  }
  const start = () => { if (running || reduce || !visible || document.hidden) return; running = true; t0 = performance.now(); raf = requestAnimationFrame(draw); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  resize();
  if (reduce) { draw(performance.now()); return; } // one still frame
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(cv);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
  addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth - 0.5; mouse.ty = e.clientY / innerHeight - 0.5; }, { passive: true });
  start();
})();
