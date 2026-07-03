(function () {
  'use strict';

  class HeroSilkCanvas {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.width = 0;
      this.height = 0;
      this.time = 0;
      this.running = false;
      this.animId = null;
      this.mouse = { x: 0.5, y: 0.5 };
      this.ribbons = [];
      this.sparkles = [];

      this._onResize = this.resize.bind(this);
      this._onMouseMove = this.onMouseMove.bind(this);
    }

    resize() {
      const parent = this.canvas.parentElement;
      if (!parent) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = parent.getBoundingClientRect();
      this.width = rect.width;
      this.height = rect.height;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.canvas.style.width = this.width + 'px';
      this.canvas.style.height = this.height + 'px';
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      this.isMobile = this.width < 768;
      this.initRibbons();
      this.initSparkles();
    }

    initRibbons() {
      this.ribbons = [
        { y: 0.38, amp: 42, freq: 0.0022, speed: 0.18, width: 1.4, color: 'rgba(107, 28, 35, 0.14)', phase: 0 },
        { y: 0.44, amp: 34, freq: 0.003, speed: 0.24, width: 1.1, color: 'rgba(201, 168, 76, 0.18)', phase: 1.2 },
        { y: 0.50, amp: 28, freq: 0.0026, speed: 0.15, width: 0.9, color: 'rgba(107, 28, 35, 0.1)', phase: 2.4 },
        { y: 0.56, amp: 22, freq: 0.0038, speed: 0.28, width: 0.8, color: 'rgba(201, 168, 76, 0.12)', phase: 0.8 },
        { y: 0.32, amp: 18, freq: 0.0045, speed: 0.2, width: 0.7, color: 'rgba(255, 255, 255, 0.35)', phase: 3.1 }
      ];
    }

    initSparkles() {
      this.sparkles = [];
      const count = this.isMobile ? 12 : 22;

      for (let i = 0; i < count; i++) {
        this.sparkles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height * 0.75,
          size: Math.random() * 1.4 + 0.4,
          speed: Math.random() * 0.15 + 0.05,
          phase: Math.random() * Math.PI * 2,
          gold: Math.random() > 0.4
        });
      }
    }

    onMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) / this.width;
      this.mouse.y = (e.clientY - rect.top) / this.height;
    }

    drawRibbons() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      const parallaxX = (this.mouse.x - 0.5) * 24;
      const parallaxY = (this.mouse.y - 0.5) * 16;

      this.ribbons.forEach(function (ribbon) {
        ctx.beginPath();
        ctx.lineWidth = ribbon.width;
        ctx.strokeStyle = ribbon.color;
        ctx.lineCap = 'round';

        for (let x = -20; x <= w + 20; x += 4) {
          const t = this.time * ribbon.speed + ribbon.phase;
          const y = h * ribbon.y +
            Math.sin(x * ribbon.freq + t) * ribbon.amp +
            Math.sin(x * ribbon.freq * 1.7 + t * 1.3) * (ribbon.amp * 0.35) +
            parallaxY * Math.sin(x * 0.008 + ribbon.phase) +
            parallaxX * 0.15;

          if (x === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.stroke();
      }, this);
    }

    drawSparkles() {
      const ctx = this.ctx;

      this.sparkles.forEach(function (s) {
        s.phase += s.speed * 0.05;
        s.y -= s.speed * 0.12;

        if (s.y < -10) {
          s.y = this.height * 0.75 + 10;
          s.x = Math.random() * this.width;
        }

        const alpha = 0.15 + Math.sin(s.phase) * 0.12;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.gold
          ? 'rgba(201, 168, 76, ' + alpha + ')'
          : 'rgba(107, 28, 35, ' + (alpha * 0.6) + ')';
        ctx.fill();
      }, this);
    }

    drawLightWash() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      const x = w * (0.55 + Math.sin(this.time * 0.12) * 0.08);
      const grad = ctx.createRadialGradient(x, h * 0.35, 0, x, h * 0.35, w * 0.45);

      grad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    draw() {
      this.time += 0.016;
      this.ctx.clearRect(0, 0, this.width, this.height);

      this.drawLightWash();
      this.drawRibbons();
      this.drawSparkles();

      if (this.running) {
        this.animId = requestAnimationFrame(this.draw.bind(this));
      }
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.resize();
      this.draw();
      window.addEventListener('resize', this._onResize);
      window.addEventListener('mousemove', this._onMouseMove, { passive: true });
    }

    stop() {
      this.running = false;
      if (this.animId) cancelAnimationFrame(this.animId);
      window.removeEventListener('resize', this._onResize);
      window.removeEventListener('mousemove', this._onMouseMove);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('hero-canvas');
    const preloader = document.getElementById('preloader');

    if (!canvas) return;

    const fx = new HeroSilkCanvas(canvas);

    function beginFX() {
      fx.start();
    }

    if (preloader && !preloader.classList.contains('hidden')) {
      const observer = new MutationObserver(function () {
        if (preloader.classList.contains('hidden')) {
          observer.disconnect();
          beginFX();
        }
      });
      observer.observe(preloader, { attributes: true, attributeFilter: ['class'] });

      setTimeout(function () {
        if (!fx.running) beginFX();
      }, 5500);
    } else {
      beginFX();
    }

    const hero = canvas.closest('.hero');
    if (hero) {
      const heroObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (!fx.running) fx.start();
          } else {
            fx.stop();
          }
        });
      }, { threshold: 0.1 });

      heroObserver.observe(hero);
    }
  });
})();
