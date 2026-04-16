# Neo-Venezia: Blurring Boundaries

A first-person walk through a protocol-governed future Venice where social bonds reshape the city's visible soul.

---

## Author & course

**Author:** Divya Venkatraman
**Studio:** Prompt City — Urban Vision Wolfsburg 2026
**Course:** IUDD Master, SoSe 2026
**Chair:** Informatics in Architecture and Urbanism (InfAU), Faculty of Architecture and Urbanism, Bauhaus-Universität Weimar
**Teaching staff:** Reinhard König, Martin Bielik, Sven Schneider, Egor Gaydukov, Egor Gavrilov
**Exercise:** Urban Absurdities (Nonsense Project)
**Submission date:** 2026-04-16

---

## Links

- **Live app (GitHub Pages):** https://Dya99bau.github.io/Blurring-boundary/
- **Source repo:** https://github.com/Dya99bau/Blurring-boundary
- **Miro frame:** https://miro.com/app/board/uXjVGCtKivA=/?moveToWidget=[YOUR-FRAME-ID]
- **60 s showreel:** embedded on the Miro frame above

---

## The task

Nonsense Project is a two-weeks long task designed to get familiar with application of coding agents in building apps, tools and projects that investigate unique ways of working with urban context. I was randomly assigned one urban paradox and one constraint from the studio's Nonsense Ideas deck and built a working web app that answers this combination. The process is documented here and in a 60-second showreel.

---

## Theme & constraint

**Theme (Urban Absurdity):**
[Paste the theme exactly as drawn.]

**Constraint (Playful Limitation):**
[Paste the constraint exactly as drawn.]

---

## Concept and User Story

### Concept

Neo-Venezia: Blurring Boundaries is a first-person walking simulation set in a speculative near-future Venice where every public space is governed by social protocols — invisible rules about gaze, presence, movement, and consent. The player chooses an archetype (Shade, Weaver, Herald, Glitch, Watcher, or Broker) and walks through five districts along a Grand Canal, encountering NPCs and zone events that demand a response: COMPLY, REFUSE, SUBVERT, or OBSERVE. Each choice shifts the city's collective empathy score, which is rendered visually — the world contracts into claustrophobic neon tunnels when empathy is low, and blooms into open, iridescent light when it is high. The constraint bites in the navigation itself: the player has no map they can fully trust, only a glowing aura trail of where they have been and lit pathway tiles pointing toward what the city thinks they should do next. Venice's real-time weather is pulled live from the Open-Meteo API, so fog, rain, and wind in the actual lagoon bleed into the simulation. The city is always slightly more real than it should be.

### User story

[YOUR USER STORY — 100–200 words. Write it as a small narrative about one imagined user.

- **Who are they?** Name, age-ish, role in the city (commuter, night-shift worker, tourist, planner, pigeon, sensor — pick someone specific, not "a user").
- **Why do they open the app?** What pulls them in — curiosity, a task, a friend's link, boredom?
- **What do they do, step by step?** Their first few moves inside the app.
- **What do they experience?** What do they see, hear, notice?
- **What do they feel?** Confused, amused, unsettled, seen, ignored?
- **What do they take away?** Something they learned, noticed, or changed their mind about.

Be concrete. A good user story makes the absurdity land through someone's eyes.]

---

## How to use it

1. Open the live app. You land on the **player select screen** — six coloured archetypes are listed. Each has different social tendencies (the Watcher's pressure drops under surveillance; the Glitch resists all categories). Pick one and press **START**.
2. A **tutorial overlay** explains the controls. Press **START EXPLORING** to dismiss it.
3. **Move** with `W` / `S` (forward / back), `Q` / `E` (strafe left / right), `A` / `D` (turn). On mobile, use the D-pad at the bottom of the screen.
4. Walk toward **glowing coloured orbs** in the distance — these are zone encounters (Acqua Alta Gate, Arsenale Dock, Cannaregio Campo, Smart Bridge, Dorsoduro Fondamenta). When you step into one a dialogue panel opens asking: COMPLY, REFUSE, SUBVERT, or OBSERVE.
5. Walk toward **glowing humanoid figures** (NPCs). If their mood is open, an encounter triggers and you can RESONATE or CLASH. Bonding raises the city's empathy and pushes the environment toward its **BLOOMED** state — the world visibly opens up.
6. **Tap the minimap** (top-right corner of the canvas) to open a navigation panel. Select a destination and lit pathway tiles will guide your steps toward it.
7. Walk into the **blue canal water** at the centre of the map to trigger bridge encounter events.
8. Open **☰ QUESTS** (bottom-left) at any time to see your current objectives and progress.
9. Toggle **AURA** (bottom-right, or press `Tab`) to reveal mood halos around all NPCs.
10. For the most interesting behaviour: form three or more bonds while ENV shows **BLOOMED**, then walk to four zone orbs — this unlocks the Architect's Vision quest.

---

## Technical implementation

**Frontend:** React 18 + Vite. The entire 3D world renders inside a single HTML5 `<canvas>` using a hand-written DDA raycaster — no WebGL, no game engine. Sprites, floor tile grids, player aura trails, and particle effects are all 2D canvas draw calls projected onto the floor/wall planes using the raycaster camera matrix.

**Hosting & build:** GitHub Pages, built via GitHub Actions on every push to `main` (workflow: `.github/workflows/deploy.yml`, deployer: `peaceiris/actions-gh-pages@v4`).

**Data sources / APIs:**
- [Open-Meteo](https://open-meteo.com/) — free, no-key weather API. Fetches current Venice (45.44 °N, 12.31 °E) conditions at startup; WMO weather codes are mapped to four in-game weather states (clear / fog / rain / wind).
- `localStorage` — persists player-written grafts (text annotations left in the world) across sessions.

**Models at runtime:** None.

**Notable libraries:**
- `react` / `react-dom` — component tree and HUD overlay
- Web Audio API (browser built-in) — all sound is procedurally synthesised at runtime; zero audio files are shipped
- No Three.js, D3, Leaflet, or external rendering library — raycaster and all draw calls are written from scratch

**Run locally:**
```bash
git clone https://github.com/Dya99bau/Blurring-boundary.git
cd Blurring-boundary
npm install
npm run dev
# open http://localhost:5173/Blurring-boundary/
```

---

## Working with AI

**Coding agent used:** Claude Code
**Model:** claude-sonnet-4-6

**Key prompts (prompts that actually moved the project):**

> "Build a first-person raycaster in React using only HTML5 Canvas — no WebGL, no libraries. The world is a neon Venice with canal water, bridge crossings, and district colour zones. NPCs wander and have moods. The player leaves a glowing aura trail on the floor."

> "Add an Environmental Empathy system (0–1 float) that bends the raycaster visually: contracted (≈0) = tall claustrophobic walls, muted purple; bloomed (≈1) = open FOV, teal shimmer, bright canal. All colour and FOV changes derive from a single empathy value updated by player choices."

> "The game is very difficult to navigate. Add a visible floor tile grid with lit pathway tiles toward objectives, click on the minimap to choose a navigation destination, move the minimap to the top so it doesn't overlap the D-pad arrows, and add a quest tab button."

> "Sync the in-game weather to real Venice conditions using the Open-Meteo API. Map WMO codes to the four existing weather states and update the ambient sound filter accordingly."

> [ADD YOUR OWN — one prompt that surprised you or changed the direction of the project]

**Reflection (≤ 150 words):**

[YOUR REFLECTION — What unlocked progress? Where did the agent get stuck or go sideways? What is one thing you would do differently next time?]

---

## Credits, assets, licenses

**Fonts:** Space Mono — Google Fonts, SIL Open Font License

**Data:** Open-Meteo live weather API — open-source, [CC BY 4.0](https://open-meteo.com/en/terms)

**Images / sounds:** None — all visuals are canvas draw calls; all audio is procedurally generated via Web Audio API at runtime. No external assets are bundled.

**Third-party code:**
- `react` / `react-dom` — MIT
- `vite` — MIT
- `@vitejs/plugin-react` — MIT
- `peaceiris/actions-gh-pages` (GitHub Action) — MIT

**This repo:** MIT
