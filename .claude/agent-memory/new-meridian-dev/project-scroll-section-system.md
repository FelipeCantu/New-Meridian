---
name: Scroll Section Visibility System
description: How applyScroll(), CSS custom properties, and .on class work together after the cinematic-transitions refactor
type: project
---

## Section Opacity System (post-cinematic-transitions refactor)

Sections no longer snap on/off via a single `.on` class toggle. Instead, `applyScroll()` in Scene3D.tsx injects two CSS custom properties directly onto each section element every animation frame:

- `--sect-opacity` (0–1): drives `opacity: var(--sect-opacity, 0)` on the `.section` wrapper
- `--sect-ty` (0–16px): drives `transform: translateY(var(--sect-ty, 18px))` on the wrapper

The fade uses a smoothstep ramp (`softRamp()`) over the first and last 18% of each section's scroll range (clamped to max 0.04 of total scroll range). This gives a soft cinematic blend instead of hard cuts.

**Special case:** sections with `s === 0` (only the Hero) skip the fade-in ramp entirely — they start at `fadeIn = 1` so they're visible on page load.

## The `.on` Class

`.on` is still toggled, but now represents "section is solidly in view" (past the fade-in threshold). It activates child stagger animations in CSS — headings, body text, buttons, tour rows all slide up with cascading `transition-delay` values. The `.on` window is `[s + span*0.18, e - span*0.18]`.

For the Hero (`s=0`), `midStart = s = 0`, so `.on` is applied from scroll=0 onwards.

## Camera Lerp

- Scroll smoothT lerp: adaptive — 0.072 when delta > 0.12, 0.036 when close (prevents sluggishness on fast scroll, maintains glide when settling)
- Camera position lerp: 0.055 (down from 0.07)
- Look target lerp: 0.048 (down from 0.06)

## Child Animation Architecture

```css
.section > * { opacity: 0; transform: translateY(12px); transition: 0.70s; }
.section > *:nth-child(n) { transition-delay: n*0.12s; }
.section.on > * { opacity: 1; transform: translateY(0); }
```

Hero children (`.hero-band`, `.hero-tag`) use `!important` on their transitions to override the section-level stagger delays with their own longer, custom timings (1.4s and 1.2s with expo easing).

Threshold section (`.big-text`) uses `scale(0.92)` → `scale(1)` instead of pure translateY for an expansive reveal matching the interior glow moment.

Tour rows are grandchildren (inside a wrapper `<div>`), so `.section > *:nth-child` doesn't stagger them individually — they have their own `.tour-row` base styles and `.section.on .tour-row:nth-child(n)` stagger rules.

**Why:** The goal was cinematic high-end music artist feel — no snapping, everything breathes in and out with the camera movement.
**How to apply:** When adding new sections, follow this pattern: place content as direct children of `.section` (or inside a single named wrapper block like `.album-block`), rely on the existing stagger ladder, and only use `!important` overrides for elements needing truly custom timing (hero title scale, threshold glow reveal).
