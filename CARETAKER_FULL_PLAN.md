# Caretaker — actionable development plan (web-first)

I’m locking the stack to **Phaser 3 + TypeScript + Vite + Zustand (or tiny custom store)**.
Why: fastest path to browser + Android, strong 2D tooling, easy static hosting, and good PWA fit.

---

## 1) Phase 0 decisions (lock these immediately)

- **Engine:** Phaser 3 (WebGL + Canvas fallback)
- **Language:** TypeScript strict mode
- **Physics:** Arcade Physics (custom movement controller for “feel”)
- **Data:** JSON catalogs in `src/content/*.json` (items, species, biomes, spawn tables)
- **Save:** `localStorage` v1 schema (upgrade hooks for later)
- **Build/deploy:** Vite build → static host (Cloudflare Pages recommended)
- **Tile size:** **32px** (better performance on Android than 64px, still readable)
- **Target perf budget:** 60 FPS mid-range Android, max ~80 draw calls per frame in forest chunks

---

## 2) Proposed repo layout

```txt
caretaker/
  src/
    core/              # boot, config, scene routing, save manager
    game/
      player/          # movement controller, input adapter
      inventory/       # bag mutex logic
      home/            # room instancing, kitchen, pen states
      healing/         # request logic, room timers
      world/           # chunk streamer, biome resolver, spawners
      ui/              # speech bubbles, HUD, bag/kitchen panels
    content/
      items.json
      species.json
      biomes.json
      spawn_tables.json
      healing_requests.json
      palettes.json
    assets/
      art/
      audio/
      ATTRIBUTION.md
  docs/
    TECHNICAL_DESIGN.md
    CONTENT_SCHEMA.md
    CONTROLS.md
    BALANCE_SHEET.csv
    MILESTONES.md
```

---

## 3) Systems blueprint (the critical rules encoded)

### A) Inventory mutex (non-negotiable)
- `bag.mode = "forage" | "sick_animal" | "empty"`
- If mode is `sick_animal`, no forage slots allowed.
- If mode is `forage`, max 4 slots.
- Water occupies one slot with `item_kind = water`.

### B) Healing validation
For each pen room:
- required: `flower_id`, `water_id`, `ingredient_id`
- tracked:
  - `vase.flowerItemId + expiresAt`
  - `tray.waterItemId + expiresAt`
  - `tray.ingredientItemId` (no expiry by default)
- Heal triggers if all match at same evaluation tick.

### C) Dynamic house generation
- Read `animal_room_count` from config.
- Instantiate room prefab N times.
- Rightmost room includes kitchen anchor + east forest door.
- Room manager owns timers and state, not scene globals.

### D) Forest scaling
- 1D chunk bands with vertical sub-platform detail.
- Door origin at x=0; stream chunks by camera x.
- Target one-way traverse: >=5 minutes.
  - Example: speed ~4.0 m/s, one-way world half-width ~1200 m equivalent.
  - Tune via spreadsheet (not by feel only).

---

## 4) Milestones (8, improved from your draft)

## M0 — Foundation (3–4 days)
- Phaser+TS scaffold, lint/format, scene boot
- Save system v1 (`CharacterAppearance`, settings)
- Config + feature flags
- Deploy first blank build URL

**Exit:** build works on desktop + Android browser.

## M1 — Vertical slice (4–6 days)
- One home room + tiny forest strip
- Pick up one ingredient, deposit interaction
- Basic UI prompt + save/load loop

**Exit:** tiny but complete loop at public URL.

## M2 — Movement feel pass (5–7 days)
- Coyote time, jump buffer, variable jump height, air accel/decel
- Optional wall-jump/wall-slide flags
- Camera follow + look-ahead
- Keyboard + gamepad

**Exit:** movement benchmark scene with tweakable constants.

## M3 — Inventory + kitchen (4–5 days)
- Full bag mutex
- Kitchen deposit/withdraw UI
- Ingredient-only kitchen storage enforced
- Persistence tests (reload mid-loop)

**Exit:** can’t violate inventory rules even with edge actions.

## M4 — Dynamic home + care rooms (4–6 days)
- `animal_room_count` procedural instancing
- Pen, tray, vase, table in each
- Rightmost kitchen + forest door wiring

**Exit:** room count changes via config only.

## M5 — Heal gameplay loop (6–8 days)
- Sick animal rarity spawn + pickup + pen placement
- Speech UI with 3-part request
- Flower/water expiry timers (45–90s tunable)
- Heal state, thanks line, journal entry, pen release delay

**Exit:** full intended loop end-to-end, saved state resilient.

## M6 — Large forest world (6–9 days)
- Chunk streamer
- 3 biomes + weighted spawn tables
- Traverse telemetry log and validation
- Graceful LOD/perf fallback switches

**Exit:** verified >=5 min one-way traversal.

## M7 — Art/audio/polish + PWA (7–10 days)
- Replace placeholders with licensed assets
- Palette grading + particles + ambience
- Touch controls for Android
- PWA manifest + service worker
- Accessibility/UI clarity pass

**Exit:** shippable beta URL, attribution complete.

---

## 5) Content spreadsheet schema (copy directly to CSV)

Columns:
- `id`
- `display_name`
- `kind` (`ingredient|flower|water|sick_animal|tool`)
- `biome_id`
- `spawn_weight`
- `storable_in_kitchen` (bool)
- `ephemeral_in_room` (bool)
- `rarity_tier`
- `asset_sprite_id`
- `sfx_id`
- `notes`

For healing requests:
- `species_id`
- `required_flower_id`
- `required_water_id`
- `required_ingredient_id`
- `thanks_line`
- `reward_tag` (optional)

---

## 6) Asset shortlist (free, downloadable, style-fit candidates)

I prioritized sources with clear license metadata.

### Environment / Tiles / UI
1. **Kenney – New Platformer Pack** (CC0, large 2D pack)
   https://kenney.nl/assets/new-platformer-pack
2. **Kenney – Input Prompts** (CC0; keyboard/gamepad/touch glyphs)
   https://kenney.nl/assets/input-prompts
3. **Kenney – Mobile Controls** (CC0; Android touch HUD)
   https://kenney.nl/assets/mobile-controls
4. **OpenGameArt – Ink hand drawn forest tileset** (CC0; closer to hand-drawn mood)
   https://opengameart.org/content/ink-hand-drawn-forest-tileset
5. **OpenGameArt – Forest Pass** (CC0; sidescroll/metroidvania-friendly)
   https://opengameart.org/content/forest-pass

### Character pipeline
6. **Universal LPC Character Generator** (modular character generation pipeline; attribution-heavy but powerful)
   https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator

### Audio starter
7. **Kenney – Interface Sounds** (CC0 UI SFX)
   https://kenney.nl/assets/interface-sounds
8. **Kenney – Impact Sounds** (CC0 feedback SFX)
   https://kenney.nl/assets/impact-sounds
9. **Kenney – Music Jingles** (CC0 short music cues)
   https://kenney.nl/assets/music-jingles

---

## 7) Art direction decisions to hit “Ghibli mood + Silksong readability”

- Use **painted backgrounds + clean silhouette foreground gameplay layer**
- Palette sets (lock early):
  - **Rust Canopy:** `#8A4B2A #B96A3B #304A32 #6F8B5A #E8D9B5`
  - **Moss Hollow:** `#223127 #35543D #6A8A5B #A3B18A #EDE6D3`
  - **Spore Dusk:** `#2F2438 #4E3D5E #7A6B8F #B7A7C8 #F1EAF7`
- Gameplay objects (water/flower/ingredient) get high-contrast outline tint for readability on phones.

---

## 8) Definition of Done (production-ready checklist)

- Public playable URL (desktop + Android browser)
- Optional installable PWA
- Character customization persists after reload
- 3+ dynamic rooms generated from config
- Bag mutex strictly enforced
- Full heal loop (with flower/water expiry) works
- Forest traversal >=5 min one-way measured & documented
- Catalog-driven content (no hardcoded IDs in logic)
- `assets/art/ATTRIBUTION.md` complete per file/license/source

---

## 9) First 10 execution tasks (next week sprint)

1. Create project scaffold + CI + deploy preview.
2. Write `TECHNICAL_DESIGN.md` and lock schema.
3. Implement config + feature flags.
4. Build player controller test scene.
5. Implement bag domain model + mutex rules.
6. Add room prefab + N-instance spawner.
7. Add kitchen store/withdraw interactions.
8. Implement healing request evaluator + timers.
9. Integrate first asset batch + attribution file.
10. Add Android touch controls + performance counters.
