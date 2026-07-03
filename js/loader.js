(function () {
  'use strict';

  const preloader = document.getElementById('preloader');
  const progressBar = document.getElementById('loader-progress');
  const percentEl = document.getElementById('loader-percent');
  const statusEl = document.getElementById('loader-status');
  const loaderCanvas = document.getElementById('loader-canvas');

  const statuses = [
    'Initializing...',
    'Loading assets...',
    'Preparing experience...',
    'Almost ready...'
  ];

  let progress = 0;
  let loaderAnimId = null;

  function initLoaderCanvas() {
    if (!loaderCanvas) return;
    const ctx = loaderCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 300;
    loaderCanvas.width = size * dpr;
    loaderCanvas.height = size * dpr;
    loaderCanvas.style.width = size + 'px';
    loaderCanvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const particles = [];
    const count = 40;
    const cx = size / 2;
    const cy = size / 2;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const radius = 80 + Math.random() * 40;
      particles.push({
        angle,
        radius,
        speed: 0.003 + Math.random() * 0.004,
        size: 1.5 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.5
      });
    }

    let rotation = 0;

    function draw() {
      ctx.clearRect(0, 0, size, size);

      ctx.beginPath();
      ctx.arc(cx, cy, 90, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(201, 168, 76, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(201, 168, 76, 0.06)';
      ctx.stroke();

      rotation += 0.008;

      particles.forEach(function (p, i) {
        p.angle += p.speed;
        const r = p.radius + Math.sin(rotation * 2 + i) * 8;
        const x = cx + Math.cos(p.angle + rotation) * r;
        const y = cy + Math.sin(p.angle + rotation) * r;

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(201, 168, 76, ' + p.opacity + ')';
        ctx.fill();

        const next = particles[(i + 1) % count];
        const nx = cx + Math.cos(next.angle + rotation) * (next.radius + Math.sin(rotation * 2 + i + 1) * 8);
        const ny = cy + Math.sin(next.angle + rotation) * (next.radius + Math.sin(rotation * 2 + i + 1) * 8);

        if (i % 3 === 0) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(nx, ny);
          ctx.strokeStyle = 'rgba(201, 168, 76, 0.08)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });

      loaderAnimId = requestAnimationFrame(draw);
    }

    draw();
  }

  function updateProgress(value) {
    progress = Math.min(value, 100);
    if (progressBar) progressBar.style.width = progress + '%';
    if (percentEl) percentEl.textContent = Math.round(progress) + '%';

    const statusIndex = Math.min(
      Math.floor((progress / 100) * statuses.length),
      statuses.length - 1
    );
    if (statusEl) statusEl.textContent = statuses[statusIndex];
  }

  function hidePreloader() {
    updateProgress(100);
    if (statusEl) statusEl.textContent = 'Welcome';

    setTimeout(function () {
      if (loaderAnimId) cancelAnimationFrame(loaderAnimId);
      preloader.classList.add('hidden');
      document.body.style.overflow = '';
    }, 600);
  }

  document.body.style.overflow = 'hidden';
  initLoaderCanvas();

  let simulated = 0;
  const interval = setInterval(function () {
    simulated += Math.random() * 15 + 5;
    if (simulated >= 90) {
      clearInterval(interval);
      updateProgress(90);
    } else {
      updateProgress(simulated);
    }
  }, 120);

  window.addEventListener('load', function () {
    clearInterval(interval);
    updateProgress(100);
    hidePreloader();
  });

  setTimeout(function () {
    if (!preloader.classList.contains('hidden')) {
      clearInterval(interval);
      hidePreloader();
    }
  }, 5000);
})();
