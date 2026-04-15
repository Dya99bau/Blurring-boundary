# Neo-Venezia · Social Simulation

An interactive isometric city simulation set in Neo-Venezia — a future Venice where bioluminescent canals run with data, ancient stone carries living memory, and every social interaction is logged by the Aura Protocol. Walk through it. Form bonds. Cross the bridge. Watch the water remember you.

---

## The World: Neo-Venezia

Neo-Venezia is a near-future city built on the bones of Venice. The Grand Canal still divides it — but now it pulses with emotional data. Four districts define the city's character:

| District | Location | Atmosphere |
|---|---|---|
| **San Marco** | Center | Limestone plazas, civic surveillance, the Protocol's heartland |
| **Arsenale** | East (gx ≥ 3) | Former shipyards turned data foundries, amber-lit, industrial memory |
| **Cannaregio** | North-West (gx ≤ −3 or gy ≤ −2) | Moss-warm alleys, resistance culture, low-protocol living |
| **Dorsoduro** | South (gy ≥ 5) | Lagoon-facing, bioluminescent after dark, artists and ghosts |
| **Grand Canal** | gx = 1–2 | The city's spine — every crossing is recorded |

The **Aura Protocol** classifies each resident by emotional state, social pressure, and legibility score. Complying raises legibility. Resisting lowers it. Neither path is neutral.

---

## Player Types

Choose your presence at the start of each session:

| Type | Role | Starting Advantage |
|---|---|---|
| **The Architect** | Urban planner | High legibility, reads zone histories |
| **The Drifter** | Unregistered wanderer | Low pressure, invisible to most sensors |
| **The Liaison** | Social connector | Bonus social resonance on all bonds |
| **The Archivist** | Memory keeper | Sees NPC histories faster |
| **The Agitator** | Protocol disruptor | High subversion, builds tension in zones |
| **The Witness** | Passive observer | Balanced stats, sees more NPC internal states |

Each type modifies your starting **Legibility**, **Pressure**, traits, and grants a special ability that changes how the city responds to you.

---

## Mechanics

### Moving through the city
- **WASD** or **arrow keys** to walk
- **Click** anywhere on the map to move there
- **Click NPCs** to initiate an encounter directly

### Zone encounters
Walk into glowing zones to encounter them. Each zone has a narrative moment and choices that affect your Legibility and Pressure stats. Visiting all 5 zones ends the session.

### NPC encounters
NPCs roam the city with their own emotions, traits, and protocol stances. When you get close, an encounter opens:
- **Resonate** — form a bond if your Auras align
- **Clash** — register divergence (public data)
- **Perform a ritual** — a wordless act that the protocol cannot categorize

Bonded NPCs can be revisited. Return encounters unlock deeper choices: share a memory, sit in silence, ask something real, or release the bond.

### Canal Vibe Match
When your Aura matches an NPC's emotion and both of you stand near the Grand Canal, the water blooms with your shared color. The protocol logs it as a "resonant proximity event." The canal remembers longer than either of you will.

### Smart Bridge
Every time you cross the Grand Canal, the bridge reads you. A contextual encounter fires based on the time of day:
- **Morning** — the city is still deciding what it wants from you
- **Midday** — the bridge is busy, the data is loud
- **Night** — the canal is quieter; something crosses with you

### Dorsoduro Bioluminescence
After dark, Dorsoduro's ground tiles glow faintly — bio-digital organisms embedded in the stone respond to accumulated social heat. The glow is not controlled by the protocol. It just happens.

### Day cycle
Time moves continuously. The city's mood shifts from morning clarity through midday friction into late-night drift. NPC behavior, canal shimmer, and glow intensity all respond to the current hour.

---

## Setup

**Requirements:** Node.js 18+ and npm

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Opens at `http://localhost:5173`

## Build for production

```bash
npm run build
```

Built files go into `dist/`. Preview locally with `npm run preview`.

## Deploy to GitHub Pages

1. Push this project to a GitHub repository
2. In **Settings → Pages**, set source to **GitHub Actions**
3. Edit `vite.config.js` — change the base path to match your repo name:
   ```js
   base: '/your-repo-name/',
   ```
4. Push to `main` — the site deploys automatically via the included workflow

---

## Project structure

```
src/
  App.jsx                — Screen routing + transition effects
  main.jsx               — React entry point
  index.css              — All styles
  constants.js           — All game data (zones, NPCs, rituals, dialogue, player types)
  screens/
    IntroScreen.jsx      — Configure traits and session parameters
    PlayerSelectScreen.jsx — Choose your player type
    GameScreen.jsx       — Main game canvas, HUD, game loop
    EndScreen.jsx        — Results + archetype reveal
  components/
    Slider.jsx           — Draggable range control
    EncounterModal.jsx   — Zone, NPC, and bridge encounter overlays
```

---

## Tech stack

- **Vite** — build tool and dev server
- **React 18** — UI layer (canvas rendered via useEffect, not React state)
- **HTML5 Canvas** — isometric rendering at 60fps
- **GitHub Actions** — automatic deployment to GitHub Pages on push to `main`
