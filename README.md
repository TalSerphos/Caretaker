# Caretaker

Web-first 2D game prototype using Phaser 3 + TypeScript + Vite.

## Scripts

- `npm run dev` — start local dev server
- `npm run lint` — run ESLint
- `npm run build` — typecheck + production build
- `npm run preview` — preview production build

## Current state

This repository now contains **M3 (Inventory + Kitchen persistence)**:

- One playable home room and a tiny forest stub in a scrolling scene
- Movement-feel pass: jump buffer, coyote time, variable jump height, and accel/drag tuning
- Bag model with mutex-ready modes (`empty`, `forage`, `sick_animal`) and up to 4 forage slots
- Ingredient pickup in forest and deterministic kitchen interactions:
  - `[E]` in kitchen deposits all storable herbs from bag
  - `[Q]` in kitchen withdraws one herb back into bag (if capacity allows)
- Local save/load for player position, bag state, and kitchen inventory
- Movement and feature flags centralized in `src/core/config.ts`
