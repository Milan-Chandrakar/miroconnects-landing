/**
 * ============================================================================
 * MiConnects VIDEO SCENES — MINIMALIST TEXT SLIDE ORCHESTRATION (video_scenes.js)
 * Clean, Punchy, High-Impact Statements & Subdued Ambient Lighting
 * Strictly <= 500 Lines (Conforms to Repository Rule)
 * ============================================================================
 */

(function (window) {
  'use strict';

  // 7 Minimalist Text Slide Definitions
  const SCENE_CONFIGS = [
    {
      id: 'act1',
      title: '01 The Fallacy',
      duration: 5500,
      orbLeft: 'rgba(255, 255, 255, 0.04)',
      orbRight: 'rgba(255, 255, 255, 0.03)',
      sfx: 'boom',
      narration: 'Four hundred applications. Zero human replies. The volume trap is mathematically broken.'
    },
    {
      id: 'act2',
      title: '02 Principle',
      duration: 5500,
      orbLeft: 'rgba(255, 255, 255, 0.05)',
      orbRight: 'rgba(255, 255, 255, 0.03)',
      sfx: 'chime',
      narration: 'Our core principle: One candidate. One suitable vacancy. One real reason to talk.'
    },
    {
      id: 'act3',
      title: '03 The Law',
      duration: 5500,
      orbLeft: 'rgba(255, 255, 255, 0.04)',
      orbRight: 'rgba(255, 255, 255, 0.04)',
      sfx: 'lock',
      narration: 'Hiring progress is multiplicative. If any single factor is zero, the outcome is zero.'
    },
    {
      id: 'act4',
      title: '04 Evidence',
      duration: 5500,
      orbLeft: 'rgba(255, 255, 255, 0.05)',
      orbRight: 'rgba(255, 255, 255, 0.03)',
      sfx: 'whoosh',
      narration: 'Proof beats keywords. An evidence ledger of verified code, not inflated titles.'
    },
    {
      id: 'act5',
      title: '05 The 3 Lanes',
      duration: 5500,
      orbLeft: 'rgba(255, 255, 255, 0.04)',
      orbRight: 'rgba(255, 255, 255, 0.04)',
      sfx: 'lock',
      narration: 'Never email the CTO. Reach the requisition recruiter, squad manager, or peer referrer.'
    },
    {
      id: 'act6',
      title: '06 The Filter',
      duration: 5500,
      orbLeft: 'rgba(255, 255, 255, 0.04)',
      orbRight: 'rgba(255, 255, 255, 0.03)',
      sfx: 'whoosh',
      narration: 'The fifty-company test: If an email can be sent to fifty companies, it is spam.'
    },
    {
      id: 'act7',
      title: '07 North Star',
      duration: 5500,
      orbLeft: 'rgba(255, 255, 255, 0.06)',
      orbRight: 'rgba(255, 255, 255, 0.04)',
      sfx: 'fanfare',
      narration: 'Right Job. Right Evidence. Right Person. Right Time. MiConnects.'
    }
  ];

  class VideoSceneDirector {
    constructor(audioEngine) {
      this.audio = audioEngine;
      this.scenes = SCENE_CONFIGS;
      this.currentActIndex = -1;
      this.orbLeft = document.getElementById('orb-left');
      this.orbRight = document.getElementById('orb-right');
    }

    animateCounter(element, target, suffix = '', duration = 900) {
      if (!element) return;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(ease * target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    activateAct(index) {
      if (index === this.currentActIndex || index < 0 || index >= this.scenes.length) return;
      const config = this.scenes[index];
      const previousLayer = document.querySelector('.scene-layer.active');

      if (previousLayer) {
        previousLayer.classList.remove('active');
        previousLayer.classList.add('exit-up');
        setTimeout(() => previousLayer.classList.remove('exit-up'), 400);
      }

      const newLayer = document.getElementById(config.id);
      if (newLayer) {
        newLayer.classList.add('active');
      }

      this.currentActIndex = index;

      // Ambient Orbs
      if (this.orbLeft) this.orbLeft.style.background = config.orbLeft;
      if (this.orbRight) this.orbRight.style.background = config.orbRight;

      // Subtle Audio Cues
      if (this.audio) {
        if (config.sfx === 'boom') this.audio.playImpactBoom();
        else if (config.sfx === 'chime') this.audio.playHarmonicChime();
        else if (config.sfx === 'lock') this.audio.playLockIn();
        else if (config.sfx === 'whoosh') this.audio.playSweepTransition();
        else if (config.sfx === 'fanfare') this.audio.playFanfareRise();

        this.audio.speakNarration(config.narration);
      }

      // Simple number animation for Act 1
      if (config.id === 'act1') {
        const c1 = document.getElementById('num-450');
        const c2 = document.getElementById('num-0');
        if (c1) this.animateCounter(c1, 450, '', 800);
        if (c2) this.animateCounter(c2, 0, '%', 600);
      }
    }

    reset() {
      if (this.audio) this.audio.cancelNarration();
      document.querySelectorAll('.scene-layer').forEach(l => l.classList.remove('active', 'exit-up'));
      this.currentActIndex = -1;
    }
  }

  window.SCENE_CONFIGS = SCENE_CONFIGS;
  window.VideoSceneDirector = VideoSceneDirector;
})(window);
