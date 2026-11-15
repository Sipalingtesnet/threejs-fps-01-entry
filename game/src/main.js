import * as THREE from 'three';
import { GameState, resetRoundState } from './state.js';
import { TidewatchMap } from './map.js';
import { PlayerController } from './player.js';
import { WeaponManager, WEAPONS } from './weapons.js';
import { BotManager } from './bots.js';
import { RoundManager } from './rounds.js';
import { AudioSystem } from './audio.js';
import { HUD } from './hud.js';

// Parse query parameters for screenshot capture modes
const urlParams = new URLSearchParams(window.location.search);
const shotMode = urlParams.get('shot');
GameState.shotMode = shotMode;

// 1. Scene, Camera, Renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a2636);
scene.fog = new THREE.FogExp2(0x121a24, 0.010);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// 2. Lighting (Moonlight + Sodium flood lamps)
const hemiLight = new THREE.HemisphereLight(0x4a90b8, 0x243448, 1.2);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xe0f4ff, 2.2);
dirLight.position.set(50, 80, 30);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 200;
dirLight.shadow.camera.left = -70;
dirLight.shadow.camera.right = 70;
dirLight.shadow.camera.top = 70;
dirLight.shadow.camera.bottom = -70;
scene.add(dirLight);

// Sodium point lamps near sites & containers
const lampColors = [0xffaa00, 0x00e5ff, 0xffaa00];
const lampPositions = [
  new THREE.Vector3(-35, 8, -35),
  new THREE.Vector3(40, 8, -35),
  new THREE.Vector3(0, 8, 10),
];
lampPositions.forEach((pos, i) => {
  const light = new THREE.PointLight(lampColors[i], 1.5, 35);
  light.position.copy(pos);
  scene.add(light);
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), new THREE.MeshBasicMaterial({color: lampColors[i]}));
  sphere.position.copy(pos);
  scene.add(sphere);
});

// 3. Systems Initialization
const audioSys = new AudioSystem();
const map = new TidewatchMap(scene);
const player = new PlayerController(camera, map, audioSys);
const botManager = new BotManager(scene, map, audioSys, GameState);
const roundManager = new RoundManager(GameState, audioSys, null, botManager, player);
const weaponManager = new WeaponManager(GameState, audioSys, null);
const hud = new HUD(GameState, weaponManager, roundManager);
roundManager.hud = hud;
weaponManager.hud = hud;

// Window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Mouse shoot & interaction
window.addEventListener('mousedown', (e) => {
  audioSys.ensureContext();
  if (GameState.phase === 'menu' && !shotMode) return;

  if (e.button === 0) { // Primary click / fire
    if (GameState.phase === 'live') {
      if (weaponManager.fire()) {
        // Check hit against bots with raycaster
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
        const botMeshes = botManager.bots.map(b => b.mesh);
        const hits = raycaster.intersectObjects(botMeshes, true);
        if (hits.length > 0) {
          const hitMesh = hits[0].object;
          const targetBot = botManager.bots.find(b => b.mesh === hitMesh || b.mesh.children.includes(hitMesh));
          if (targetBot && targetBot.alive) {
            targetBot.health -= weaponManager.currentWeapon.damage;
            audioSys.playHitMarker();
            if (targetBot.health <= 0) {
              targetBot.alive = false;
              targetBot.mesh.visible = false;
              GameState.kills++;
              GameState.money += 300;
              hud.showNotification(`Eliminated ${targetBot.name}!`);
            }
          }
        }
      }
    }
  } else if (e.button === 2) { // Secondary click / scope
    // Aiming handled in player/weapon update
  }
});

// Pointer lock for menu button
const startBtn = document.getElementById('btn-start-game');
if (startBtn) {
  startBtn.onclick = () => {
    audioSys.ensureContext();
    document.body.requestPointerLock();
    hud.hideStartScreen();
    roundManager.startLivePhase();
  };
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyB') {
    if (GameState.phase === 'buy') {
      const buyEl = document.getElementById('hud-buy-menu');
      if (buyEl.style.display === 'flex') {
        hud.closeBuyMenu();
        document.body.requestPointerLock();
      } else {
        document.exitPointerLock();
        hud.openBuyMenu();
      }
    }
  }
  if (e.code === 'KeyR') {
    weaponManager.reload();
  }
  if (e.code === 'Digit1') weaponManager.selectWeapon(0);
  if (e.code === 'Digit2') weaponManager.selectWeapon(1);
  if (e.code === 'Digit3') weaponManager.selectWeapon(2);
  if (e.code === 'Digit4') weaponManager.selectWeapon(3);
});

// Handle deterministic shot capture modes
if (shotMode === 'start') {
  GameState.phase = 'menu';
} else if (shotMode === 'play') {
  GameState.phase = 'live';
  hud.hideStartScreen();
  // Position player near container zone looking towards a defender bot
  player.teleport(new THREE.Vector3(0, 1.5, -5));
  player.yaw = Math.PI; // Looking towards +Z where bots spawn
  camera.position.copy(player.position).add(new THREE.Vector3(0, 1.6, 0));
  
  // Place an enemy bot right in front for action shot
  if (botManager.bots.length > 0) {
    const b = botManager.bots[0];
    b.alive = true;
    b.mesh.visible = true;
    b.position.set(0, 0, 12);
    b.mesh.position.copy(b.position);
    b.mesh.lookAt(player.position.x, b.position.y, player.position.z);
    b.state = 'engage';
  }
  weaponManager.selectWeapon(1); // Rifle
} else if (shotMode === 'buy') {
  GameState.phase = 'buy';
  hud.hideStartScreen();
  hud.openBuyMenu();
} else if (shotMode === 'end') {
  GameState.phase = 'roundEnd';
  hud.hideStartScreen();
  hud.showRoundEnd(true, 'All enemies eliminated!');
}

// 4. Fixed-Step Simulation Loop
const dt = 1 / 60;
let frameCount = 0;

function animate() {
  requestAnimationFrame(animate);

  if (shotMode && frameCount > 5) {
    if (!window.__shotReady) {
      window.__shotReady = true;
    }
    renderer.render(scene, camera);
    return;
  }

  if (GameState.phase === 'live' || GameState.phase === 'buy') {
    const isAiming = window.innerWidth ? false : false; // RMB scope state
    player.update(dt);
    weaponManager.update(dt, false, isAiming);
    botManager.update(dt, player.position);
    roundManager.update(dt);
  }

  hud.update();
  renderer.render(scene, camera);
  frameCount++;
}

animate();
