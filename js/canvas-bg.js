(function () {
  'use strict';

  const MAROON = { r: 201, g: 168, b: 76 };
  const GOLD = { r: 201, g: 168, b: 76 };

  class ParticleNetwork {
    constructor(canvas, options) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.options = Object.assign({
        particleCount: 80,
        connectionDistance: 150,
        particleColor: 'rgba(201, 168, 76, 0.6)',
        lineColor: 'rgba(201, 168, 76, 0.08)',
        speed: 0.3,
        mouseRadius: 120,
        interactive: true
      }, options || {});

      this.particles = [];
      this.mouse = { x: null, y: null };
      this.animId = null;
      this.running = false;

      this._onResize = this.resize.bind(this);
      this._onMouseMove = this.onMouseMove.bind(this);
      this._onMouseLeave = this.onMouseLeave.bind(this);
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

      if (this.particles.length === 0) {
        this.initParticles();
      }
    }

    initParticles() {
      this.particles = [];
      const count = window.innerWidth < 768
        ? Math.floor(this.options.particleCount * 0.5)
        : this.options.particleCount;

      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * this.options.speed,
          vy: (Math.random() - 0.5) * this.options.speed,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.2
        });
      }
    }

    onMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    }

    onMouseLeave() {
      this.mouse.x = null;
      this.mouse.y = null;
    }

    draw() {
      this.ctx.clearRect(0, 0, this.width, this.height);

      const particles = this.particles;
      const len = particles.length;

      for (let i = 0; i < len; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > this.width) p.vx *= -1;
        if (p.y < 0 || p.y > this.height) p.vy *= -1;

        if (this.options.interactive && this.mouse.x !== null) {
          const dx = this.mouse.x - p.x;
          const dy = this.mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < this.options.mouseRadius) {
            const force = (this.options.mouseRadius - dist) / this.options.mouseRadius;
            p.x -= dx * force * 0.02;
            p.y -= dy * force * 0.02;
          }
        }

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = this.options.particleColor.replace(/[\d.]+\)$/, p.opacity + ')');
        this.ctx.fill();
      }

      for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < this.options.connectionDistance) {
            const opacity = (1 - dist / this.options.connectionDistance) * 0.15;
            this.ctx.beginPath();
            this.ctx.moveTo(particles[i].x, particles[i].y);
            this.ctx.lineTo(particles[j].x, particles[j].y);
            this.ctx.strokeStyle = this.options.lineColor.replace(/[\d.]+\)$/, opacity + ')');
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
          }
        }
      }

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
      if (this.options.interactive) {
        this.canvas.addEventListener('mousemove', this._onMouseMove);
        this.canvas.addEventListener('mouseleave', this._onMouseLeave);
      }
    }

    stop() {
      this.running = false;
      if (this.animId) cancelAnimationFrame(this.animId);
      window.removeEventListener('resize', this._onResize);
      this.canvas.removeEventListener('mousemove', this._onMouseMove);
      this.canvas.removeEventListener('mouseleave', this._onMouseLeave);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const speakingCanvas = document.getElementById('speaking-canvas');

    if (speakingCanvas) {
      const speakingNetwork = new ParticleNetwork(speakingCanvas, {
        particleCount: 40,
        connectionDistance: 120,
        particleColor: 'rgba(107, 28, 35, 0.4)',
        lineColor: 'rgba(107, 28, 35, 0.06)',
        speed: 0.15,
        interactive: false
      });

      const speakingObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            speakingNetwork.start();
          } else {
            speakingNetwork.stop();
          }
        });
      }, { threshold: 0.1 });

      speakingObserver.observe(speakingCanvas.closest('.speaking'));
    }
  });
})();
