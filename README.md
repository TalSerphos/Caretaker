# Caretaker

Web-first 2D game prototype using Phaser 3 + TypeScript + Vite.

## Scripts

- `npm run dev` — start local dev server
- `npm run lint` — run ESLint
- `npm run build` — typecheck + production build
- `npm run preview` — preview production build

## Current state

This repository now contains **M2 (Vertical Slice + Movement Feel)**:

- One playable home room and a tiny forest stub in a scrolling scene
- One ingredient pickup interaction in the forest area
- One kitchen deposit interaction back in the home area
- Local save/load for player position and simple bag ingredient state
- Movement-feel pass: jump buffer, coyote time, variable jump height, and acceleration/drag tuning
- Movement and feature flags centralized in `src/core/config.ts`
This repository now contains **M0 Bootstrap**:

- Vite + TypeScript project setup
- Phaser game boot with a placeholder bootstrap scene
- ESLint + Prettier configuration
- GitHub Actions CI workflow for lint + build
