/**
 * ============================================================================
 * MIRO DUAL AUDIO & NARRATION ENGINE (video_audio.js)
 * 1. Web Audio API Synthesizer (Zero asset dependencies, instant 0ms latency)
 * 2. Web Speech API Voiceover Narrator (Live voiceover synchronized with scenes)
 * Strictly <= 500 Lines (Conforms to Repository Rule)
 * ============================================================================
 */

(function (window) {
  'use strict';

  class VideoAudioEngine {
    constructor() {
      this.audioCtx = null;
      this.sfxEnabled = true;
      this.narrationEnabled = true;
      this.currentUtterance = null;
      this.selectedVoice = null;

      this.initVoices();
    }

    initAudioContext() {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    }

    initVoices() {
      if ('speechSynthesis' in window) {
        const load = () => {
          const voices = window.speechSynthesis.getVoices();
          // Pick the best natural English voice
          this.selectedVoice = voices.find(v => 
            v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
          ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
        };
        load();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = load;
        }
      }
    }

    // --- Web Audio SFX Generators ---
    tone(freq, type, duration, gainVal = 0.08) {
      if (!this.sfxEnabled) return;
      this.initAudioContext();
      if (!this.audioCtx) return;

      try {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
      } catch (e) {
        // Fallback silently if audio context locked
      }
    }

    playImpactBoom() {
      if (!this.sfxEnabled) return;
      this.initAudioContext();
      if (!this.audioCtx) return;

      try {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(95, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(32, this.audioCtx.currentTime + 0.7);

        gain.gain.setValueAtTime(0.22, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.7);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.7);
      } catch (e) {}
    }

    playHarmonicChime() {
      // 3-note harmonic shimmer (Aha discovery)
      this.tone(523.25, 'sine', 0.45, 0.10); // C5
      setTimeout(() => this.tone(659.25, 'sine', 0.50, 0.12), 90); // E5
      setTimeout(() => this.tone(783.99, 'sine', 0.60, 0.14), 180); // G5
      setTimeout(() => this.tone(1046.50, 'sine', 0.75, 0.10), 280); // C6
    }

    playSweepTransition() {
      this.tone(140, 'triangle', 0.35, 0.08);
      setTimeout(() => this.tone(280, 'sine', 0.28, 0.09), 80);
    }

    playLockIn() {
      // Crisp mechanical verification tone
      this.tone(440, 'sine', 0.12, 0.12);
      setTimeout(() => this.tone(659.25, 'sine', 0.18, 0.15), 65);
      setTimeout(() => this.tone(880, 'sine', 0.24, 0.14), 140);
    }

    playFanfareRise() {
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        setTimeout(() => this.tone(freq, 'sine', 0.55, 0.11), idx * 95);
      });
    }

    // --- Web Speech API Voiceover Synthesizer ---
    speakNarration(text) {
      if (!this.narrationEnabled || !('speechSynthesis' in window)) return;
      this.cancelNarration();

      try {
        const utt = new SpeechSynthesisUtterance(text);
        if (this.selectedVoice) utt.voice = this.selectedVoice;
        utt.rate = 1.05;
        utt.pitch = 1.0;
        utt.volume = 0.9;
        this.currentUtterance = utt;
        window.speechSynthesis.speak(utt);
      } catch (e) {}
    }

    cancelNarration() {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        this.currentUtterance = null;
      }
    }

    toggleSfx() {
      this.initAudioContext();
      this.sfxEnabled = !this.sfxEnabled;
      return this.sfxEnabled;
    }

    toggleNarration() {
      this.narrationEnabled = !this.narrationEnabled;
      if (!this.narrationEnabled) {
        this.cancelNarration();
      }
      return this.narrationEnabled;
    }
  }

  window.VideoAudioEngine = VideoAudioEngine;
})(window);
