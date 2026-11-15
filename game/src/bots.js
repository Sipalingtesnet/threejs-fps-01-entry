import * as THREE from 'three';
import { getHex } from './palette.js';

export class BotManager {
  constructor(scene, map, audioSys, state) {
    this.scene = scene;
    this.map = map;
    this.audioSys = audioSys;
    this.state = state;

    this.bots = [];
    this.spawnBots();
  }

  spawnBots() {
    const botConfigs = [
      { id: 1, team: 'defenders', role: 'defender', name: 'Vanguard' },
      { id: 2, team: 'defenders', role: 'defender', name: 'Sentinel' },
      { id: 3, team: 'defenders', role: 'roamer', name: 'Sentry' },
      { id: 4, team: 'defenders', role: 'anchor', name: 'Bastion' },
      { id: 5, team: 'attackers', role: 'ally', name: 'Rook' },
      { id: 6, team: 'attackers', role: 'ally', name: 'Ghost' },
    ];

    const enemyColor = getHex('warning');
    const allyColor = getHex('accent');

    botConfigs.forEach((cfg, idx) => {
      const isEnemy = cfg.team !== this.state.playerTeam;
      const color = isEnemy ? enemyColor : allyColor;

      const group = new THREE.Group();
      
      const bodyGeo = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
      const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.5 });
      const bodyMesh = new THREE.Mesh(bodyGeo, mat);
      bodyMesh.position.y = 1.0;
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      const headGeo = new THREE.SphereGeometry(0.22, 8, 8);
      const headMesh = new THREE.Mesh(headGeo, mat);
      headMesh.position.y = 1.8;
      group.add(headMesh);

      const spawnPos = cfg.team === 'attackers' 
        ? this.map.spawnPoints.attackers[idx % this.map.spawnPoints.attackers.length].clone()
        : this.map.spawnPoints.defenders[idx % this.map.spawnPoints.defenders.length].clone();

      group.position.copy(spawnPos);
      this.scene.add(group);

      this.bots.push({
        id: cfg.id,
        name: cfg.name,
        team: cfg.team,
        role: cfg.role,
        isEnemy: isEnemy,
        mesh: group,
        position: spawnPos,
        velocity: new THREE.Vector3(),
        health: 100,
        alive: true,
        state: 'patrol',
        targetNode: null,
        pathIndex: 0,
        fireTimer: 0,
        reactionTimer: Math.random() * 0.4 + 0.15,
      });
    });
  }

  update(dt, playerPos) {
    this.bots.forEach(bot => {
      if (!bot.alive) return;

      const distToPlayer = bot.position.distanceTo(playerPos);

      if (bot.isEnemy && distToPlayer < 28 && this.state.phase === 'live') {
        bot.state = 'engage';
      } else if (bot.state === 'engage' && distToPlayer > 38) {
        bot.state = 'patrol';
      }

      if (bot.state === 'patrol' || bot.state === 'advance') {
        if (!bot.targetNode || bot.position.distanceTo(bot.targetNode) < 2) {
          const nodes = this.map.waypointGraph.nodes;
          const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
          bot.targetNode = randomNode.pos.clone();
        }

        if (bot.targetNode) {
          const dir = new THREE.Vector3().subVectors(bot.targetNode, bot.position);
          dir.y = 0;
          dir.normalize();
          bot.position.addScaledVector(dir, 3.4 * dt);
          bot.mesh.position.copy(bot.position);
          bot.mesh.lookAt(bot.targetNode.x, bot.position.y, bot.targetNode.z);
        }
      } else if (bot.state === 'engage') {
        bot.mesh.lookAt(playerPos.x, bot.position.y, playerPos.z);
        bot.fireTimer -= dt;
        if (bot.fireTimer <= 0) {
          bot.fireTimer = 0.35 + Math.random() * 0.35;
          if (this.audioSys) this.audioSys.playGunshot('KR-12');
          
          if (Math.random() < 0.4 && distToPlayer < 22) {
            this.state.health = Math.max(0, this.state.health - (Math.random() < 0.15 ? 30 : 10));
            if (this.audioSys) this.audioSys.playHitMarker();
          }
        }
      }
    });
  }

  resetRound() {
    this.bots.forEach((bot, idx) => {
      bot.alive = true;
      bot.health = 100;
      bot.mesh.visible = true;
      const spawnPos = bot.team === 'attackers'
        ? this.map.spawnPoints.attackers[idx % this.map.spawnPoints.attackers.length].clone()
        : this.map.spawnPoints.defenders[idx % this.map.spawnPoints.defenders.length].clone();
      bot.position.copy(spawnPos);
      bot.mesh.position.copy(spawnPos);
      bot.state = 'patrol';
    });
  }
}
