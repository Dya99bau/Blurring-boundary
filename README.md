# Protocol City · Simulation

An interactive isometric city simulation where autonomous agents form bonds, cluster, argue, and drift. Day cycles into night. Protocols activate and collapse. Walk through it — or watch it happen.

## Setup

**Requirements:** Node.js 18+ and npm

```bash
# Install dependencies
npm install

# Start the development server (opens at http://localhost:5173)
npm run dev
```

## Build for production

```bash
npm run build
```

The built files go into `dist/`. You can preview locally with `npm run preview`.

## Deploy to GitHub Pages

1. Push this project to a GitHub repository
2. In **Settings → Pages**, set source to **GitHub Actions**
3. Edit `vite.config.js` — change `/protocol-city-sim/` to match your exact repo name:
   ```js
   base: '/your-repo-name/',
   ```
4. Push to `main` — the site deploys automatically

## How to play

- **WASD** or **arrow keys** to move your character
- **Click** anywhere on the map to walk there
- **Click NPCs** to interact with them
- Walk into glowing zones to encounter them
- Visit all 5 zones to complete the simulation

## Project structure

```
src/
  App.jsx              — Screen routing + transition effects
  main.jsx             — React entry point
  index.css            — All styles
  constants.js         — Game data (zones, traits, NPCs, etc.)
  screens/
    IntroScreen.jsx    — Config screen (trait tags + sliders)
    GameScreen.jsx     — Main game canvas + HUD
    EndScreen.jsx      — Results + archetype reveal
  components/
    Slider.jsx         — Draggable range control
    EncounterModal.jsx — Zone and NPC interaction overlay
```
