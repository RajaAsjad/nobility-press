(function () {
  'use strict';

  class HeroCanvasFX {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.width = 0;
      this.height = 0;
      this.time = 0;
      this.running = false;
      this.animId = null;
      this.mouse = { x: 0.5, y: 0.5, active: false };
      this.particles = [];
      this.waves = [];
      this.ripples = [];

      this._onResize = this.resize.bind(this);
      this._onMouseMove = this.onMouseMove.bind(this);
      this._onMouseLeave = this.onMouseLeave.bind(this);
      this._onTouchMove = this.onTouchMove.bind(this);
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
      this.initWaves();
      this.initParticles();
    }

    initWaves() {
      this.waves = [
        { amplitude: 28, frequency: 0.004, speed: 0.35, yOffset: 0.42, opacity: 0.14, color: [201, 168, 76] },
        { amplitude: 22, frequency: 0.0055, speed: 0.28, yOffset: 0.48, opacity: 0.1, color: [107, 28, 35] },
        { amplitude: 18, frequency: 0.007, speed: 0.42, yOffset: 0.54, opacity: 0.08, color: [201, 168, 76] },
        { amplitude: 14, frequency: 0.003, speed: 0.22, yOffset: 0.36, opacity: 0.06, color: [250, 247, 242] }
      ];
    }

    initParticles() {
      this.particles = [];
      const count = this.isMobile ? 35 : 65;

      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          size: Math.random() * 2.2 + 0.6,
          speedX: (Math.random() - 0.5) * 0.35,
          speedY: (Math.random() - 0.5) * 0.35,
          opacity: Math.random() * 0.45 + 0.15,
          pulse: Math.random() * Math.PI * 2,
          gold: Math.random() > 0.35
        });
      }
    }

    onMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) / this.width;
      this.mouse.y = (e.clientY - rect.top) / this.height;
      this.mouse.active = true;

      if (Math.random() > 0.82) {
        this.ripples.push({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          radius: 0,
          maxRadius: 80 + Math.random() * 60,
          opacity: 0.25,
          life: 1
        });
      }
    }

    onTouchMove(e) {
      if (!e.touches.length) return;
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.mouse.x = (touch.clientX - rect.left) / this.width;
      this.mouse.y = (touch.clientY - rect.top) / this.height;
      this.mouse.active = true;
    }

    onMouseLeave() {
      this.mouse.active = false;
    }

    drawWaves() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;

      this.waves.forEach(function (wave, index) {
        ctx.beginPath();
        const baseY = h * wave.yOffset;
        const mx = (this.mouse.x - 0.5) * 40 * (index + 1);

        for (let x = 0; x <= w; x += 3) {
          const y = baseY +
            Math.sin(x * wave.frequency + this.time * wave.speed) * wave.amplitude +
            Math.sin(x * wave.frequency * 0.5 + this.time * wave.speed * 1.3) * (wave.amplitude * 0.4) +
            mx * Math.sin(x * 0.01);

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();

        const c = wave.color;
        ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + wave.opacity + ')';
        ctx.fill();
      }, this);
    }

    drawParticles() {
      const ctx = this.ctx;
      const len = this.particles.length;
      const connectDist = this.isMobile ? 100 : 130;
      const mouseX = this.mouse.x * this.width;
      const mouseY = this.mouse.y * this.height;

      for (let i = 0; i < len; i++) {
        const p = this.particles[i];
        p.pulse += 0.02;
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < -10) p.x = this.width + 10;
        if (p.x > this.width + 10) p.x = -10;
        if (p.y < -10) p.y = this.height + 10;
        if (p.y > this.height + 10) p.y = -10;

        if (this.mouse.active) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            const force = (140 - dist) / 140;
            p.x -= dx * force * 0.015;
            p.y -= dy * force * 0.015;
          }
        }

        const glow = p.opacity * (0.7 + Math.sin(p.pulse) * 0.3);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        if (p.gold) {
          ctx.fillStyle = 'rgba(201, 168, 76, ' + glow + ')';
        } else {
          ctx.fillStyle = 'rgba(107, 28, 35, ' + (glow * 0.5) + ')';
        }
        ctx.fill();
      }

      for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
          const dx = this.particles[i].x - this.particles[j].x;
          const dy = this.particles[i].y - this.particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectDist) {
            const alpha = (1 - dist / connectDist) * 0.12;
            ctx.beginPath();
            ctx.moveTo(this.particles[i].x, this.particles[i].y);
            ctx.lineTo(this.particles[j].x, this.particles[j].y);
            ctx.strokeStyle = 'rgba(201, 168, 76, ' + alpha + ')';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
    }

    drawRipples() {
      const ctx = this.ctx;

      for (let i = this.ripples.length - 1; i >= 0; i--) {
        const r = this.ripples[i];
        r.radius += 1.8;
        r.life -= 0.018;

        if (r.life <= 0) {
          this.ripples.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(201, 168, 76, ' + (r.opacity * r.life) + ')';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    drawShimmer() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      const shimmerX = ((this.time * 0.4) % (w + 200)) - 100;
      const grad = ctx.createLinearGradient(shimmerX, 0, shimmerX + 180, h);

      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    drawVignette() {
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.45, w * 0.2, w * 0.5, h * 0.45, w * 0.75);

      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(1, 'rgba(107, 28, 35, 0.06)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    draw() {
      this.time += 0.016;
      this.ctx.clearRect(0, 0, this.width, this.height);

      this.drawWaves();
      this.drawParticles();
      this.drawRipples();
      this.drawShimmer();
      this.drawVignette();

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
      this.canvas.addEventListener('mousemove', this._onMouseMove);
      this.canvas.addEventListener('mouseleave', this._onMouseLeave);
      this.canvas.addEventListener('touchmove', this._onTouchMove, { passive: true });
    }

    stop() {
      this.running = false;
      if (this.animId) cancelAnimationFrame(this.animId);
      window.removeEventListener('resize', this._onResize);
      this.canvas.removeEventListener('mousemove', this._onMouseMove);
      this.canvas.removeEventListener('mouseleave', this._onMouseLeave);
      this.canvas.removeEventListener('touchmove', this._onTouchMove);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('hero-canvas');
    const preloader = document.getElementById('preloader');

    if (!canvas) return;

    const fx = new HeroCanvasFX(canvas);

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
