# MiConnects

> **Stop applying to 300 jobs into the void. Reach the vacancy owner with real proof.**

MiConnects connects verified candidate proof directly to the squad leads and engineering managers who are actively looking to hire—within 24 hours of vacancy posting.

---

## 🚀 Live Pages & Presentations

| Experience | Description | Path |
| :--- | :--- | :--- |
| **MiConnects Story Landing Page** | Minimalist, layman-friendly visual storytelling landing page | [`/index.html`](index.html) |
| **10-Deck Strategic Keynote Showcase** | Interactive keynote suite covering 10 strategic angles | [`/deck_gallery.html`](deck_gallery.html) |
| **Evidence-Backed Video Player** | 16:9 interactive cinema stage with live narration & canvas | [`/evidence_pipeline_video.html`](evidence_pipeline_video.html) |

---

## 🧱 Repository Architecture

```text
├── index.html                    # Primary high-conversion landing page (served at /)
├── landing_story_v2.css          # Core dark graphite monochrome design system
├── landing_mobile.css            # Responsive fluid typography & mobile touch ergonomics
├── deck_gallery.html             # Master Keynote Viewer & deck index
├── gallery_theme.css             # Gallery layout and responsive modal styling
├── evidence_pipeline_video.html  # Interactive 16:9 keynote video presentation
├── decks/                        # 10 strategic presentation decks
│   ├── deck_01_math_law.html
│   ├── deck_02_ats_autopsy.html
│   ├── deck_03_evidence_ledger.html
│   ├── ...
│   ├── deck_theme.css
│   └── deck_controller.js
├── evidence_video/               # Video canvas, components, and audio synthesizers
├── assets/                       # Official black-and-white MiConnects branding
└── vercel.json                   # Zero-config static edge deployment
```

---

## ⚡ Deployment

This repository is optimized for instant, zero-cost deployment on **Vercel**:
- Pure static HTML/CSS/JS (zero framework build overhead, instant edge delivery).
- Mobile-optimized responsive layout with zero clipping across any device width.
- Free hosting on Vercel Edge Network.

## Production configuration

Vercel project miroconnects_landing (prj_jWna6KT0AaZjJ6dIbCDK3NdVc7ji). Primary domain https://miconnects.in; www redirects to the apex. /activity serves the canonical Pipeline, Daybook and Ledger tracker from the existing backend. Preserve one-use handoff, account identity and session storage. Update tracker assets from packages/miro_outreach_extension-find_best_contacts/miro_outreach_extension/tester_portal in the main repo. Hostinger handles DNS and hello@miconnects.in.

The intake uses the canonical backend's existing owner-portal lead table;
requests do not grant or create beta accounts. /privacy and /support are public
Google app-domain links. /release.json records the client/backend alignment and
validation limits. Existing outreach without job links requires owner association.

Publish from this folder with `npx.cmd vercel --prod --yes`. Vercel GitHub access
was not broadened; this project currently uses authenticated CLI deployments.
After publishing, keep the original alias aligned with
`npx.cmd vercel alias set <production-deployment-url> miroconnects.vercel.app`.
