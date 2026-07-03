(function () {
  'use strict';

  class AuthorTypeCanvas {
    constructor(canvas, options) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.options = Object.assign({
        phrases: [
          'Author',
          'Speaker',
          'Storyteller',
          'Keynote Speaker',
          'Leader',
          'Diplomat',
          'Counterterrorism Professional'
        ],
        staticLine: 'Robert W. Starnes',
        subLine: 'Inspirational',
        typeSpeed: 70,
        deleteSpeed: 40,
        pauseDuration: 2200,
        cursorBlink: 530
      }, options || {});

      this.phraseIndex = 0;
      this.charIndex = 0;
      this.state = 'typing';
      this.displayText = '';
      this.lastTick = 0;
      this.cursorVisible = true;
      this.lastCursorBlink = 0;
      this.running = false;
      this.animId = null;
      this.particles = [];
      this.onUpdate = null;

      this._onResize = this.resize.bind(this);
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
      this.initParticles();
    }

    initParticles() {
      this.particles = [];
      const count = this.isMobile ? 18 : 32;

      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          size: Math.random() * 1.5 + 0.5,
          speedX: (Math.random() - 0.5) * 0.25,
          speedY: (Math.random() - 0.5) * 0.25,
          opacity: Math.random() * 0.25 + 0.05
        });
      }
    }

    tick(now) {
      if (now - this.lastTick < (this.state === 'deleting' ? this.options.deleteSpeed : this.options.typeSpeed)) {
        return;
      }
      this.lastTick = now;

      const current = this.options.phrases[this.phraseIndex];

      if (this.state === 'typing') {
        this.charIndex++;
        this.displayText = current.slice(0, this.charIndex);
        if (this.charIndex === current.length) {
          this.state = 'pausing';
          this.pauseUntil = now + this.options.pauseDuration;
        }
      } else if (this.state === 'pausing') {
        if (now >= this.pauseUntil) {
          this.state = 'deleting';
        }
      } else if (this.state === 'deleting') {
        this.charIndex--;
        this.displayText = current.slice(0, this.charIndex);
        if (this.charIndex === 0) {
          this.state = 'typing';
          this.phraseIndex = (this.phraseIndex + 1) % this.options.phrases.length;
        }
      }

      if (this.onUpdate) {
        this.onUpdate(this.displayText || this.options.phrases[this.phraseIndex].charAt(0));
      }
    }

    blinkCursor(now) {
      if (now - this.lastCursorBlink >= this.options.cursorBlink) {
        this.cursorVisible = !this.cursorVisible;
        this.lastCursorBlink = now;
      }
    }

    drawParticles() {
      const particles = this.particles;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = this.width;
        if (p.x > this.width) p.x = 0;
        if (p.y < 0) p.y = this.height;
        if (p.y > this.height) p.y = 0;

        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(107, 28, 35, ' + p.opacity + ')';
        this.ctx.fill();
      }
    }

    draw() {
      const now = performance.now();
      this.tick(now);
      this.blinkCursor(now);

      this.ctx.clearRect(0, 0, this.width, this.height);

      this.drawParticles();

      const padX = this.isMobile ? 20 : 48;
      const padY = this.isMobile ? 24 : 40;
      const boxWidth = Math.min(this.width - padX * 2, 520);
      const boxHeight = this.isMobile ? 110 : 140;
      const boxX = padX;
      const boxY = padY;

      this.ctx.save();
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
      this.ctx.strokeStyle = 'rgba(107, 28, 35, 0.12)';
      this.ctx.lineWidth = 1;
      this.roundRect(boxX, boxY, boxWidth, boxHeight, 16);
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();

      const textX = boxX + (this.isMobile ? 20 : 28);
      let cursorY = boxY + (this.isMobile ? 34 : 42);

      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'alphabetic';

      this.ctx.font = '500 ' + (this.isMobile ? 11 : 12) + 'px Outfit, sans-serif';
      this.ctx.fillStyle = 'rgba(107, 28, 35, 0.65)';
      this.ctx.fillText(this.options.subLine.toUpperCase(), textX, cursorY);
      cursorY += this.isMobile ? 28 : 34;

      this.ctx.font = '700 ' + (this.isMobile ? 28 : 36) + 'px "Cormorant Garamond", Georgia, serif';
      this.ctx.fillStyle = '#4A1218';
      this.ctx.fillText(this.options.staticLine, textX, cursorY);
      cursorY += this.isMobile ? 30 : 38;

      this.ctx.font = 'italic 600 ' + (this.isMobile ? 22 : 28) + 'px "Cormorant Garamond", Georgia, serif';
      this.ctx.fillStyle = '#6B1C23';
      const typedWidth = this.ctx.measureText(this.displayText).width;
      this.ctx.fillText(this.displayText, textX, cursorY);

      if (this.cursorVisible) {
        this.ctx.fillStyle = '#C9A84C';
        this.ctx.fillRect(textX + typedWidth + 4, cursorY - (this.isMobile ? 20 : 24), 2, this.isMobile ? 22 : 28);
      }

      this.ctx.font = '400 ' + (this.isMobile ? 10 : 11) + 'px Outfit, sans-serif';
      this.ctx.fillStyle = 'rgba(107, 28, 35, 0.45)';
      this.ctx.fillText('Nobility Press', textX, boxY + boxHeight - (this.isMobile ? 14 : 18));

      if (this.running) {
        this.animId = requestAnimationFrame(this.draw.bind(this));
      }
    }

    roundRect(x, y, w, h, r) {
      this.ctx.beginPath();
      this.ctx.moveTo(x + r, y);
      this.ctx.lineTo(x + w - r, y);
      this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      this.ctx.lineTo(x + w, y + h - r);
      this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      this.ctx.lineTo(x + r, y + h);
      this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      this.ctx.lineTo(x, y + r);
      this.ctx.quadraticCurveTo(x, y, x + r, y);
      this.ctx.closePath();
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.resize();
      this.draw();
      window.addEventListener('resize', this._onResize);
    }

    stop() {
      this.running = false;
      if (this.animId) cancelAnimationFrame(this.animId);
      window.removeEventListener('resize', this._onResize);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('hero-type-canvas');
    const roleEl = document.getElementById('hero-type-role');
    const preloader = document.getElementById('preloader');

    if (!canvas) return;

    const typewriter = new AuthorTypeCanvas(canvas);

    if (roleEl) {
      typewriter.onUpdate = function (text) {
        roleEl.textContent = text;
      };
    }

    function beginTypewriter() {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          typewriter.start();
        });
      } else {
        typewriter.start();
      }
    }

    if (preloader && !preloader.classList.contains('hidden')) {
      const observer = new MutationObserver(function () {
        if (preloader.classList.contains('hidden')) {
          observer.disconnect();
          beginTypewriter();
        }
      });
      observer.observe(preloader, { attributes: true, attributeFilter: ['class'] });

      setTimeout(function () {
        if (!typewriter.running) beginTypewriter();
      }, 5500);
    } else {
      beginTypewriter();
    }

    const heroSection = canvas.closest('.hero');
    if (heroSection) {
      const heroObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (!typewriter.running) typewriter.start();
          } else {
            typewriter.stop();
          }
        });
      }, { threshold: 0.15 });

      heroObserver.observe(heroSection);
    }
  });
})();
