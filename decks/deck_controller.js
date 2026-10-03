/**
 * ============================================================================
 * MIRO KEYNOTE DECK CONTROLLER (deck_controller.js)
 * High-performance keyboard & touch navigation for 16:9 presentation slides
 * Strictly <= 500 Lines (Conforms to Repository Rule)
 * ============================================================================
 */

(function (window) {
  'use strict';

  class DeckController {
    constructor() {
      this.slides = Array.from(document.querySelectorAll('.slide'));
      this.currentIndex = 0;
      this.progressFill = document.querySelector('.deck-progress-fill');
      this.progressTrack = document.querySelector('.deck-progress-track');
      this.pageReadout = document.querySelector('.deck-page-readout');
      this.fullscreenBtn = document.getElementById('btn-fullscreen');
      this.prevBtn = document.getElementById('btn-prev');
      this.nextBtn = document.getElementById('btn-next');

      this.init();
    }

    init() {
      if (this.slides.length === 0) return;

      this.updateView();
      this.bindEvents();
    }

    bindEvents() {
      // Keyboard Navigation
      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.code === 'ArrowRight' || e.code === 'Space') {
          e.preventDefault();
          this.next();
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          this.prev();
        } else if (e.code === 'Home') {
          e.preventDefault();
          this.goTo(0);
        } else if (e.code === 'End') {
          e.preventDefault();
          this.goTo(this.slides.length - 1);
        } else if (e.code === 'KeyF') {
          e.preventDefault();
          this.toggleFullscreen();
        }
      });

      // Controls
      if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.next());
      if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prev());
      if (this.fullscreenBtn) this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

      // Progress Track Click
      if (this.progressTrack) {
        this.progressTrack.addEventListener('click', (e) => {
          const rect = this.progressTrack.getBoundingClientRect();
          const clickFraction = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
          const targetIndex = Math.min(Math.floor(clickFraction * this.slides.length), this.slides.length - 1);
          this.goTo(targetIndex);
        });
      }
    }

    next() {
      if (this.currentIndex < this.slides.length - 1) {
        this.goTo(this.currentIndex + 1);
      }
    }

    prev() {
      if (this.currentIndex > 0) {
        this.goTo(this.currentIndex - 1);
      }
    }

    goTo(index) {
      if (index === this.currentIndex || index < 0 || index >= this.slides.length) return;

      const prevSlide = this.slides[this.currentIndex];
      const nextSlide = this.slides[index];

      prevSlide.classList.remove('active');
      prevSlide.classList.add('exit-up');
      setTimeout(() => prevSlide.classList.remove('exit-up'), 450);

      nextSlide.classList.add('active');
      this.currentIndex = index;

      this.updateView();
    }

    updateView() {
      // Progress Fill
      if (this.progressFill) {
        const pct = ((this.currentIndex + 1) / this.slides.length) * 100;
        this.progressFill.style.width = `${pct}%`;
      }

      // Page Readout
      if (this.pageReadout) {
        const cur = String(this.currentIndex + 1).padStart(2, '0');
        const tot = String(this.slides.length).padStart(2, '0');
        this.pageReadout.textContent = `SLIDE ${cur} / ${tot}`;
      }
    }

    toggleFullscreen() {
      const stage = document.querySelector('.deck-canvas');
      if (!document.fullscreenElement) {
        if (stage && stage.requestFullscreen) stage.requestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    }
  }

  window.DeckController = DeckController;

  window.addEventListener('DOMContentLoaded', () => {
    new DeckController();
  });
})(window);
