/**
 * ============================================================================
 * MIRO VIDEO TRANSPORT ENGINE (video_engine.js)
 * Master Timeline Controller, Transport Controls, Scrubbing & Keyboard Shortcuts
 * Strictly <= 500 Lines (Conforms to Repository Rule)
 * ============================================================================
 */

(function (window) {
  'use strict';

  class VideoTransportEngine {
    constructor(director, audioEngine, neuralCanvas) {
      this.director = director;
      this.audio = audioEngine;
      this.canvas = neuralCanvas;

      this.scenes = window.SCENE_CONFIGS || [];
      this.totalDuration = this.scenes.reduce((sum, s) => sum + s.duration, 0);

      this.currentTime = 0;
      this.isPlaying = false;
      this.playbackRate = 1.0;
      this.lastTimestamp = null;
      this.rafId = null;

      // DOM Elements
      this.scrubberFill = document.getElementById('scrubber-fill');
      this.scrubberTrack = document.getElementById('scrubber-track');
      this.timerReadout = document.getElementById('timer-readout');
      this.playPauseBtn = document.getElementById('btn-play-pause');
      this.replayBtn = document.getElementById('btn-replay');
      this.speedBtn = document.getElementById('btn-speed');
      this.sfxToggleBtn = document.getElementById('btn-sfx-toggle');
      this.narrateToggleBtn = document.getElementById('btn-narrate-toggle');
      this.fullscreenBtn = document.getElementById('btn-fullscreen');
      this.chapterPills = document.querySelectorAll('.chap-pill');

      this.bindEvents();
      this.updateScrubber();
    }

    bindEvents() {
      // Play/Pause button
      if (this.playPauseBtn) {
        this.playPauseBtn.addEventListener('click', () => this.togglePlay());
      }

      // Replay button
      if (this.replayBtn) {
        this.replayBtn.addEventListener('click', () => this.seek(0, true));
      }

      // Speed selector
      if (this.speedBtn) {
        this.speedBtn.addEventListener('click', () => {
          const rates = [1.0, 1.25, 1.5, 2.0];
          const currIdx = rates.indexOf(this.playbackRate);
          this.playbackRate = rates[(currIdx + 1) % rates.length];
          this.speedBtn.textContent = `${this.playbackRate}x`;
        });
      }

      // Audio SFX toggle
      if (this.sfxToggleBtn) {
        this.sfxToggleBtn.addEventListener('click', () => {
          const enabled = this.audio.toggleSfx();
          this.sfxToggleBtn.classList.toggle('active', enabled);
          this.sfxToggleBtn.textContent = enabled ? '🔊 SFX: On' : '🔇 SFX: Off';
        });
      }

      // Voiceover Narrator toggle
      if (this.narrateToggleBtn) {
        this.narrateToggleBtn.addEventListener('click', () => {
          const enabled = this.audio.toggleNarration();
          this.narrateToggleBtn.classList.toggle('active', enabled);
          this.narrateToggleBtn.textContent = enabled ? '🎙️ Voice: On' : '🔇 Voice: Off';
        });
      }

      // Fullscreen button
      if (this.fullscreenBtn) {
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
      }

      // Timeline Scrubber Click & Drag
      if (this.scrubberTrack) {
        const onScrub = (e) => {
          const rect = this.scrubberTrack.getBoundingClientRect();
          const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
          const targetTime = (clickX / rect.width) * this.totalDuration;
          this.seek(targetTime, this.isPlaying);
        };

        this.scrubberTrack.addEventListener('click', onScrub);
      }

      // Chapter Jump Pills
      this.chapterPills.forEach((pill, idx) => {
        pill.addEventListener('click', () => {
          const targetTime = this.getStartTimeForAct(idx);
          this.seek(targetTime, true);
        });
      });

      // Global Keyboard Shortcuts
      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.code === 'Space') {
          e.preventDefault();
          this.togglePlay();
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          this.seek(this.currentTime + 3000, this.isPlaying);
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          this.seek(this.currentTime - 3000, this.isPlaying);
        } else if (e.code === 'KeyM') {
          if (this.sfxToggleBtn) this.sfxToggleBtn.click();
        } else if (e.code === 'KeyV') {
          if (this.narrateToggleBtn) this.narrateToggleBtn.click();
        } else if (e.code === 'KeyF') {
          this.toggleFullscreen();
        }
      });
    }

    getStartTimeForAct(index) {
      let t = 0;
      for (let i = 0; i < index && i < this.scenes.length; i++) {
        t += this.scenes[i].duration;
      }
      return t;
    }

    getCurrentActIndex() {
      let accumulated = 0;
      for (let i = 0; i < this.scenes.length; i++) {
        accumulated += this.scenes[i].duration;
        if (this.currentTime < accumulated) return i;
      }
      return this.scenes.length - 1;
    }

    togglePlay() {
      if (this.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    }

    play() {
      if (this.currentTime >= this.totalDuration) {
        this.currentTime = 0;
        this.director.reset();
      }
      this.audio.initAudioContext();
      this.isPlaying = true;
      this.lastTimestamp = performance.now();
      if (this.playPauseBtn) this.playPauseBtn.textContent = '⏸ Pause';
      this.tick(this.lastTimestamp);
    }

    pause() {
      this.isPlaying = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      if (this.playPauseBtn) this.playPauseBtn.textContent = '▶ Play';
      this.audio.cancelNarration();
    }

    seek(targetMs, resumePlaying = false) {
      this.currentTime = Math.max(0, Math.min(targetMs, this.totalDuration));
      const targetAct = this.getCurrentActIndex();

      this.director.activateAct(targetAct);
      this.updateScrubber();

      if (resumePlaying) {
        this.play();
      } else {
        this.pause();
      }
    }

    tick(timestamp) {
      if (!this.isPlaying) return;

      const delta = (timestamp - this.lastTimestamp) * this.playbackRate;
      this.lastTimestamp = timestamp;
      this.currentTime += delta;

      if (this.currentTime >= this.totalDuration) {
        this.currentTime = this.totalDuration;
        this.updateScrubber();
        this.pause();
        return;
      }

      const actIdx = this.getCurrentActIndex();
      this.director.activateAct(actIdx);
      this.updateScrubber();

      this.rafId = requestAnimationFrame((ts) => this.tick(ts));
    }

    updateScrubber() {
      const progress = (this.currentTime / this.totalDuration) * 100;
      if (this.scrubberFill) {
        this.scrubberFill.style.width = `${progress}%`;
      }

      // Format Timer: MM:SS / MM:SS
      if (this.timerReadout) {
        const curSec = Math.floor(this.currentTime / 1000);
        const totSec = Math.floor(this.totalDuration / 1000);
        const curFmt = `${Math.floor(curSec / 60)}:${(curSec % 60).toString().padStart(2, '0')}`;
        const totFmt = `${Math.floor(totSec / 60)}:${(totSec % 60).toString().padStart(2, '0')}`;
        this.timerReadout.textContent = `${curFmt} / ${totFmt}`;
      }

      // Update Chapter Pills highlight
      const activeIdx = this.getCurrentActIndex();
      this.chapterPills.forEach((pill, idx) => {
        pill.classList.toggle('active', idx === activeIdx);
      });
    }

    toggleFullscreen() {
      const stage = document.getElementById('cinema-stage');
      if (!document.fullscreenElement) {
        if (stage.requestFullscreen) stage.requestFullscreen();
      } else {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    }
  }

  window.VideoTransportEngine = VideoTransportEngine;
})(window);
