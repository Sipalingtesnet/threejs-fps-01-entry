import * as THREE from 'three';
import { getHex } from './palette.js';

export class TidewatchMap {
  constructor(scene) {
    this.scene = scene;
    this.colliders = []; // Array of {min: Vector3, max: Vector3, box: Box3}
    this.waypointGraph = {
      nodes: [],
      edges: []
    };
    this.spawnPoints = {
      attackers: [],
      defenders: []
    };
    this.siteA = null;
    this.siteB = null;
    this.buildMap();
  }

  addCollider(mesh, isFloor = false) {
    mesh.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(mesh);
    this.colliders.push({
      box: box,
      min: box.min,
      max: box.max,
      isFloor: isFloor,
      mesh: mesh
    });
  }

  buildMap() {
    // 1. Ground & Water
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: getHex('surface'),
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.addCollider(ground, true);

    // Water channel (Quay lane edge)
    const waterGeo = new THREE.PlaneGeometry(160, 40);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x071520,
      roughness: 0.1,
      metalness: 0.8
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -0.2, 70);
    this.scene.add(water);

    // Quay wall separating land and water
    const quayMat = new THREE.MeshStandardMaterial({ color: getHex('metal'), roughness: 0.6 });
    const quayGeo = new THREE.BoxGeometry(160, 3, 2);
    const quay = new THREE.Mesh(quayGeo, quayMat);
    quay.position.set(0, 1.4, 48);
    quay.castShadow = true;
    quay.receiveShadow = true;
    this.scene.add(quay);
    this.addCollider(quay);

    // Perimeter boundary walls
    const wallMat = new THREE.MeshStandardMaterial({ color: getHex('metal'), roughness: 0.7 });
    
    // North wall
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(160, 8, 2), wallMat);
    northWall.position.set(0, 4, -80);
    northWall.castShadow = true;
    this.scene.add(northWall);
    this.addCollider(northWall);

    // South wall (near quay)
    const southWall = new THREE.Mesh(new THREE.BoxGeometry(160, 8, 2), wallMat);
    southWall.position.set(0, 4, 50);
    southWall.castShadow = true;
    this.scene.add(southWall);
    this.addCollider(southWall);

    // East wall
    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 160), wallMat);
    eastWall.position.set(80, 4, 0);
    eastWall.castShadow = true;
    this.scene.add(eastWall);
    this.addCollider(eastWall);

    // West wall
    const westWall = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 160), wallMat);
    westWall.position.set(-80, 4, 0);
    westWall.castShadow = true;
    this.scene.add(westWall);
    this.addCollider(westWall);

    // 2. Shipping Containers & Stacks (Mid & Sites)
    const redMat = new THREE.MeshStandardMaterial({ color: getHex('containerRed'), roughness: 0.5, metalness: 0.4 });
    const blueMat = new THREE.MeshStandardMaterial({ color: getHex('containerBlue'), roughness: 0.5, metalness: 0.4 });
    const greenMat = new THREE.MeshStandardMaterial({ color: getHex('containerGreen'), roughness: 0.5, metalness: 0.4 });

    // Helper to spawn container
    const addContainer = (x, y, z, rotY = 0, mat = redMat, length = 12, width = 3, height = 3) => {
      const geo = new THREE.BoxGeometry(length, height, width);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y + height / 2, z);
      mesh.rotation.y = rotY;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      this.addCollider(mesh);
      return mesh;
    };

    // Site A: Crane Deck (North-West area, x: -45 to -15, z: -50 to -20)
    addContainer(-40, 0, -35, 0, redMat, 12, 3, 3);
    addContainer(-40, 3, -35, 0, blueMat, 12, 3, 3);
    addContainer(-25, 0, -42, Math.PI / 2, greenMat, 10, 3, 3);
    addContainer(-50, 0, -20, 0, blueMat, 12, 3, 3);

    // Site A Bomb Zone Marker (Floor Decal / Platform)
    const siteAGeo = new THREE.BoxGeometry(10, 0.1, 10);
    const siteAMat = new THREE.MeshStandardMaterial({ color: getHex('accent'), roughness: 0.3, emissive: getHex('accent'), emissiveIntensity: 0.2 });
    const siteAMesh = new THREE.Mesh(siteAGeo, siteAMat);
    siteAMesh.position.set(-35, 0.01, -35);
    this.scene.add(siteAMesh);
    this.siteA = { x: -35, y: 0, z: -35, radius: 8 };

    // Site B: Warehouse (North-East area, x: 25 to 55, z: -50 to -20)
    const whGeo = new THREE.BoxGeometry(26, 10, 20);
    const whMat = new THREE.MeshStandardMaterial({ color: getHex('metal'), roughness: 0.6 });
    const warehouse = new THREE.Mesh(whGeo, whMat);
    warehouse.position.set(40, 5, -35);
    warehouse.castShadow = true;
    warehouse.receiveShadow = true;
    this.scene.add(warehouse);
    this.addCollider(warehouse);

    // Warehouse interior obstacles / site B bomb zone
    const siteBGeo = new THREE.BoxGeometry(10, 0.1, 10);
    const siteBMat = new THREE.MeshStandardMaterial({ color: getHex('accent'), roughness: 0.3, emissive: getHex('accent'), emissiveIntensity: 0.2 });
    const siteBMesh = new THREE.Mesh(siteBGeo, siteBMat);
    siteBMesh.position.set(40, 0.01, -35);
    this.scene.add(siteBMesh);
    this.siteB = { x: 40, y: 0, z: -35, radius: 8 };

    // Mid Container Stack (x: -10 to 10, z: -20 to 10)
    addContainer(0, 0, -10, 0, greenMat, 12, 3, 3);
    addContainer(0, 3, -10, 0, redMat, 12, 3, 3);
    addContainer(-8, 0, 2, Math.PI / 2, blueMat, 10, 3, 3);
    addContainer(8, 0, -2, Math.PI / 2, redMat, 10, 3, 3);

    // Covered Alley & Obstacles
    const woodMat = new THREE.MeshStandardMaterial({ color: getHex('wood'), roughness: 0.8 });
    for (let i = 0; i < 6; i++) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), woodMat);
      crate.position.set(-65 + i * 4, 1, 15 + (i % 2) * 3);
      crate.rotation.y = i * 0.5;
      crate.castShadow = true;
      crate.receiveShadow = true;
      this.scene.add(crate);
      this.addCollider(crate);
    }

    // 3. Spawns
    // Attackers (Tidewatch Raiders) spawn near South Quay (z: 35)
    this.spawnPoints.attackers = [
      new THREE.Vector3(-10, 0, 38),
      new THREE.Vector3(0, 0, 38),
      new THREE.Vector3(10, 0, 38),
      new THREE.Vector3(-20, 0, 38),
      new THREE.Vector3(20, 0, 38),
    ];

    // Defenders (Harbour Security) spawn near North / inside sites (z: -65)
    this.spawnPoints.defenders = [
      new THREE.Vector3(-35, 0, -65),
      new THREE.Vector3(-25, 0, -65),
      new THREE.Vector3(35, 0, -65),
      new THREE.Vector3(45, 0, -65),
      new THREE.Vector3(0, 0, -60),
    ];

    // 4. Waypoint Graph for Bots
    this.buildWaypointGraph();
  }

  buildWaypointGraph() {
    const rawNodes = [
      // South / Attacker spawn & approach
      { id: 0, pos: new THREE.Vector3(0, 0, 35) },
      { id: 1, pos: new THREE.Vector3(-25, 0, 30) },
      { id: 2, pos: new THREE.Vector3(25, 0, 30) },
      // Mid court
      { id: 3, pos: new THREE.Vector3(0, 0, 5) },
      { id: 4, pos: new THREE.Vector3(-12, 0, 0) },
      { id: 5, pos: new THREE.Vector3(12, 0, 0) },
      // Site A approaches & hold points
      { id: 6, pos: new THREE.Vector3(-35, 0, -15) },
      { id: 7, pos: new THREE.Vector3(-35, 0, -35), site: 'A' }, // Site A
      { id: 8, pos: new THREE.Vector3(-55, 0, -25) },
      // Site B approaches & hold points
      { id: 9, pos: new THREE.Vector3(35, 0, -15) },
      { id: 10, pos: new THREE.Vector3(40, 0, -35), site: 'B' }, // Site B
      { id: 11, pos: new THREE.Vector3(60, 0, -25) },
      // Defender spawn / back
      { id: 12, pos: new THREE.Vector3(-35, 0, -60) },
      { id: 13, pos: new THREE.Vector3(40, 0, -60) },
    ];

    this.waypointGraph.nodes = rawNodes;

    // Connect edges
    const connections = [
      [0, 1], [0, 2], [0, 3],
      [1, 4], [2, 5],
      [3, 4], [3, 5], [3, 6], [3, 9],
      [4, 6], [6, 7], [6, 8], [7, 8],
      [5, 9], [9, 10], [9, 11], [10, 11],
      [7, 12], [10, 13],
      [12, 6], [13, 9]
    ];

    this.waypointGraph.edges = connections;
  }

  checkCollision(box3) {
    for (let c of this.colliders) {
      if (c.box.intersectsBox(box3)) {
        return true;
      }
    }
    return false;
  }

  getSpawnPoint(team) {
    const list = this.spawnPoints[team] || this.spawnPoints.attackers;
    const idx = Math.floor(Math.random() * list.length);
    return list[idx].clone();
  }
}
