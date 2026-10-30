<div align="center">

# New Meridian

**Progressive post-hardcore — at the collision point of raw aggression and oceanic atmosphere.**
An immersive, scroll-driven 3D website for the band New Meridian.

![Next.js](https://img.shields.io/badge/Next.js-000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000?style=flat-square&logo=threedotjs&logoColor=white)

</div>

<!-- Add a screenshot or GIF: save one to public/screenshot.png and uncomment the line below -->
<!-- ![New Meridian site](public/screenshot.png) -->

## The idea

Instead of a normal band page, the whole site is a single 3D scene. Scrolling drives the camera down through the "abyss" — each section (About, Music, Tour, Connect) is a stop on the way, with progress dots showing where you are.

## Features

- **Scroll-driven camera** — a hidden scroll track moves the Three.js camera through six scenes
- **Custom loading screen** — progress bar while the 3D assets load ("Loading the abyss")
- **Film-style overlays** — vignette, grain and scanlines layered over the canvas
- **Client-only 3D** — the scene is loaded with `next/dynamic` and `ssr: false` so the page shell renders instantly
- **Typography** — Cinzel and Raleway via `next/font`

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router), React, TypeScript |
| 3D | Three.js |
| Styling | CSS |

## Getting started

```bash
git clone https://github.com/FelipeCantu/New-Meridian.git
cd New-Meridian
npm install
npm run dev   # http://localhost:3000
```

## Author

Built by **Felipe Cantu Jr** — [felipecantujr.com](https://felipecantujr.com) · [LinkedIn](https://www.linkedin.com/in/felipe-cantu-jr/) · [GitHub](https://github.com/FelipeCantu)
