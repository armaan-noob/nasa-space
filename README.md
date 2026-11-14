# Space Mission Design Game

A browser-based, single-page mission design game for the NASA Space Apps Challenge 2026. Players design, validate and simulate mission architectures for several realistic NASA-inspired scenarios while balancing cost, mass, power, communications, reliability and science return.

## Project status

Playable prototype v1.0
- Includes 4 scenario-driven mission briefs
- Solo and 1-4 player team play mode
- Mission validation and simulation loop
- Randomized event system and debrief scoring
- Sandbox mode for unrestricted exploration
- Short tutorial and educational concept cards
- Responsive HTML/CSS/JavaScript UI with no install required

## Game concept

The player acts as a mission architecture team. They select a science objective, choose hardware components and trajectories, then run a mission readiness check before launch. Shortfalls in power, mass, communications or reliability are immediately visible. During the simulated mission, real-world disturbances such as solar flare, dust storm, antenna drift or budget cuts create a second layer of engineering pressure. The game rewards scientific return, efficient resource use and design robustness rather than one single perfect build.

This is deliberately designed to teach the real trade-offs of aerospace engineering:
- More instruments can improve science value but increase mass, power draw and data volume.
- Solar power is more reliable near Earth but falls significantly with increasing distance from the Sun.
- Communication systems and storage onboard are both part of the science pipeline.
- Every design has a cost and reliability penalty.
- Mission success depends on system-level thinking, not one subsystem alone.

## Architecture

The project is intentionally split into three layers to keep the simulation deterministic and easy to extend:

1. Data layer
   - `data.js` stores the scenarios, parts catalog, event library and educational content.
   - Every scenario is modular and can be extended without editing the simulation.

2. Simulation logic layer
   - `gameLogic.js` contains the pure calculation functions for mission metrics, readiness checks and simulation results.
   - This logic is designed to be testable and deterministic using a seeded pseudo-random generator.

3. UI layer
   - `app.js` manages mission state, DOM rendering and user interactions.
   - `index.html` and `styles.css` provide the browser interface and responsive layout.

## Scenario list

1. Moon South Pole Ice Prospecting
   - Goal: map ancient ice deposits and surface hazard conditions.
   - Difficulty: Medium
   - Main constraints: low temperature, power, thermal cycling, lunar darkness.

2. Mars Surface Geology Campaign
   - Goal: characterize weather, subsurface chemistry and terrain.
   - Difficulty: High
   - Main constraints: dust, long signal delay, lower solar flux, communication delay.

3. Asteroid Survey and Resource Mapping
   - Goal: map an NEO surface and determine spin, mineral content and hazards.
   - Difficulty: Medium
   - Main constraints: microgravity, deep-space communication, limited power.

4. Earth Observation Orbit
   - Goal: monitor atmosphere and surface changes with a balanced multi-instrument payload.
   - Difficulty: Low
   - Main constraints: imaging throughput, downlink bandwidth, orbital operations.

## Gameplay loop

1. Select a mission scenario.
2. Choose a team or solo mode.
3. Select spacecraft, instruments, launch vehicle, power system, communications and trajectory.
4. Run the validity check and inspect warnings.
5. Launch the mission simulation.
6. Review the event timeline and score.
7. Redesign and compare alternative strategies.

## Controls

- Mission Brief panel: pick the mission objective.
- Mission Design Lab: select the architecture and set up the mission.
- Launch Readiness: check pass/fail margins and explanations.
- Mission Debrief: view the final score, mission timeline and design explanations.
- Tutorial button: open a quick game intro.
- Reset Mission: restore the default starting design.

## How to play

### 30-second quick start

1. Open `index.html` in a browser.
2. Choose a scenario.
3. Pick any launch vehicle and spacecraft combination.
4. Add 2-3 instruments.
5. Click Validate Mission.
6. Click Simulate Mission.
7. Read the debrief and redesign.

### 3-5 minute mission experience

1. Select a more complex scenario such as Mars Surface.
2. Switch to Team mode with 2-4 players.
3. Assign roles such as Mission Director, Systems Engineer, Science Lead and Flight Operations.
4. Choose a balanced design: one or two science instruments, a power system with sufficient margin, and a communications architecture that matches the mission.
5. Run the readiness check.
6. Add a design change that addresses the warnings and simulate again.
7. Compare the score and discuss which subsystem caused the result.

## Educational concepts covered

- Delta-v and trajectory trade-offs
- Solar power falloff with distance from the Sun
- Mass constraints and launch capability
- Power generation versus consumption
- Data volume and communication bottlenecks
- Storage limits and onboard processing
- Reliability and redundancy
- Lifecycle and mission duration design

## Data sources and realism notes

This game uses NASA/JPL-inspired mission patterns and simplified engineering values to make the design metaphors understandable. Values are not full mission-accurate hardware specs; instead they are representative, intentionally tuned to teach trade-offs while remaining playable.

Reference inspirations include:
- NASA Mars missions and power system design trade-offs
- Lunar ice prospecting and south-pole mission concepts
- Earth observation satellite mission design patterns
- Deep-space communications and signal delay behavior
- Near-Earth asteroid survey mission planning

## File structure

- `index.html` – app shell and UI layout
- `styles.css` – responsive interface styling
- `data.js` – modular scenario, hardware and event data
- `gameLogic.js` – deterministic mission simulation logic
- `app.js` – UI orchestration and interactions
- `README.md` – project documentation and play instructions

## Local run instructions

Because this is a static browser game, there is no package installation step.

Option A: open the file directly
- Double-click `index.html` in a browser

Option B: run a local static server
- Use a local HTTP server if available, for example:
  - `python -m http.server 8000`
  - then open `http://localhost:8000/`

## Notes for other AI models and future extension

This project is intentionally simple to extend:
- Add more scenarios by editing the `scenarios` array in `data.js`
- Add new hardware by extending the reusable part categories
- Add new random events by editing the `eventLibrary`
- Adjust scoring or mission parameters in `gameLogic.js`
- Update the educational cards in the `education` array

## Conclusion

The game is designed to teach mission design as a systems problem, not a single-component challenge. A mission can succeed in many ways, but each successful architecture reflects a real trade-off in cost, mass, power, communications and lifetime. This is the core lesson of modern space systems engineering.
