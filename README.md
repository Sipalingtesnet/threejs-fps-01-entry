[![make.fun · threejs-fps-01](https://make.fun/badge/threejs-fps-01.svg)](https://make.fun/bounty/threejs-fps-01?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-01)
[![rank](https://make.fun/badge/threejs-fps-01/Sipalingtesnet/threejs-fps-01-entry/rank.svg)](https://make.fun/bounty/threejs-fps-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-01)
[![reward](https://make.fun/badge/threejs-fps-01/Sipalingtesnet/threejs-fps-01-entry/reward.svg)](https://make.fun/bounty/threejs-fps-01/reward?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-01)

# TIDEWATCH — Tactical Round-Based FPS

TIDEWATCH is a tactical round-based first-person shooter set in a dark industrial container harbour ("Tidewatch Harbour"). Featuring round economies, buy phases, tactical weapons (KR-12 Carbine, Stingray-9 SMG, Deadeye-50 Sniper, P12 Sidearm), bomb plant/defuse objectives, and coordinated AI bots.

## Features
- **Original Map**: Tidewatch Harbour night port with Site A (Crane Deck) & Site B (Warehouse), quay lane, and container stacks.
- **Tactical Economy & Buy Menu**: Earn money through kills and round wins, buy weapons and grenades during the 15s buy phase.
- **Advanced AI Bots**: Coordinated enemy and friendly bots with waypoint navigation, combat engagement, and objective play.
- **Synthesized WebAudio**: Immersive gunfire, reloads, hit markers, footsteps, and harbour foghorn ambiance.

## Controls
- **WASD**: Move
- **Shift**: Sprint
- **Ctrl / C**: Crouch
- **Space**: Jump
- **LMB**: Fire weapon
- **RMB**: Scope (Sniper)
- **R**: Reload
- **B**: Toggle Buy Menu (during buy phase)
- **G**: Throw Grenade

## How to Run
```bash
node serve.ts --port 8080
```
Then open `http://localhost:8080` in your browser.

## How to Build Dossier
```bash
MAKEFUN_OUTPUT_DIR=out node main.ts
```
