/**
 * ============================================================================
 * MIRO MINIMALIST CANVAS ENGINE (video_canvas.js)
 * Low-contrast subtle monochrome particle field (Linear/Keynote style)
 * Strictly <= 500 Lines (Conforms to Repository Rule)
 * ============================================================================
 */

(function (window) {
  'use strict';

  class NeuralCanvas {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.width = 1280;
      this.height = 720;
      this.particles = [];
      this.particleCount = 40;
      this.maxDistance = 130;
      this.mouse = { x: -1000, y: -1000, radius: 140 };
      this.isRunning = false;
      this.rafId = null;

      this.init();
    }

    init() {
      this.canvas.width = this.width;
      this.canvas.height = this.height;

      // Seed particles with monochrome silver/white tones
      this.particles = [];
      for (let i = 0; i < this.particleCount; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 1.5 + 1.0,
          color: 'rgba(255, 255, 255, ',
          baseAlpha: Math.random() * 0.35 + 0.15,
          phase: Math.random() * Math.PI * 2
        });
      }

      // Parallax listener on stage container
      const stage = document.getElementById('cinema-stage');
      if (stage) {
        stage.addEventListener('mousemove', (e) => {
          const rect = stage.getBoundingClientRect();
          this.mouse.x = (e.clientX - rect.left) * (this.width / rect.width);
          this.mouse.y = (e.clientY - rect.top) * (this.height / rect.height);
        });

        stage.addEventListener('mouseleave', () => {
          this.mouse.x = -1000;
          this.mouse.y = -1000;
        });
      }

      this.start();
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      const loop = (timestamp) => {
        if (!this.isRunning) return;
        this.render(timestamp);
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    }

    stop() {
      this.isRunning = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    render(timestamp) {
      this.ctx.clearRect(0, 0, this.width, this.height);
      const time = timestamp * 0.001;

      // Update and draw particles
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > this.width) p.vx *= -1;
        if (p.y < 0 || p.y > this.height) p.vy *= -1;

        // Gentle mouse repulsion
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.mouse.radius && dist > 0) {
          const force = (1 - dist / this.mouse.radius) * 1.5;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }

        // Draw particle dot
        const pulse = 0.85 + 0.15 * Math.sin(time + p.phase);
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color + (p.baseAlpha * pulse) + ')';
        this.ctx.fill();

        // Connect near neighbors with very faint monochrome lines
        for (let j = i + 1; j < this.particles.length; j++) {
          const p2 = this.particles[j];
          const ndx = p.x - p2.x;
          const ndy = p.y - p2.y;
          const nDist = Math.sqrt(ndx * ndx + ndy * ndy);

          if (nDist < this.maxDistance) {
            const lineAlpha = (1 - nDist / this.maxDistance) * 0.08;
            this.ctx.beginPath();
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;
            this.ctx.lineWidth = 0.8;
            this.ctx.stroke();
          }
        }
      }
    }
  }

  window.NeuralCanvas = NeuralCanvas;
})(window);
