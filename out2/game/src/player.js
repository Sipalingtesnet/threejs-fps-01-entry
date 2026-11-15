import * as THREE from 'three';

export class PlayerController {
  constructor(camera, map, audioSys) {
    this.camera = camera;
    this.map = map;
    this.audioSys = audioSys;

    this.position = new THREE.Vector3(0, 0, 38);
    this.velocity = new THREE.Vector3();
    this.camera.position.copy(this.position);
    this.camera.position.y += 1.6; // Eye height standing

    // Look angles
    this.pitch = 0;
    this.yaw = 0;

    // Movement parameters
    this.walkSpeed = 5.5;
    this.sprintSpeed = 8.5;
    this.crouchSpeed = 3.0;
    this.jumpForce = 7.0;
    this.gravity = 20.0;

    // States
    this.isGrounded = false;
    this.isCrouching = false;
    this.isSprinting = false;
    this.eyeHeight = 1.6;
    this.targetEyeHeight = 1.6;

    // Head bob & footsteps
    this.bobTimer = 0;
    this.footstepTimer = 0;

    // Input state tracking
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      sprint: false,
      crouch: false,
      reload: false,
      use: false,
      grenade: false
    };

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      this.handleKey(e, true);
    });
    window.addEventListener('keyup', (e) => {
      this.handleKey(e, false);
    });

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === document.body) {
        const sensitivity = 0.002;
        this.yaw -= e.movementX * sensitivity;
        this.pitch -= e.movementY * sensitivity;

        const maxPitch = Math.PI / 2 - 0.01;
        this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
      }
    });
  }

  handleKey(e, isDown) {
    const code = e.code;
    if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = isDown;
    if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = isDown;
    if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = isDown;
    if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = isDown;
    if (code === 'Space') {
      if (isDown && this.isGrounded && !this.isCrouching) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
      }
      this.keys.jump = isDown;
    }
    if (code === 'ShiftLeft' || code === 'ShiftRight') this.keys.sprint = isDown;
    if (code === 'ControlLeft' || code === 'KeyC') {
      this.keys.crouch = isDown;
      this.isCrouching = isDown;
    }
    if (code === 'KeyR' && isDown) this.keys.reload = true;
    if (code === 'KeyE' && isDown) this.keys.use = true;
    if (code === 'KeyG' && isDown) this.keys.grenade = true;
  }

  update(dt) {
    // 1. Crouch / Eye height interpolation
    this.targetEyeHeight = this.isCrouching ? 0.9 : 1.6;
    this.eyeHeight += (this.targetEyeHeight - this.eyeHeight) * Math.min(1, dt * 15);

    // 2. Determine speed
    let currentSpeed = this.walkSpeed;
    if (this.isCrouching) {
      currentSpeed = this.crouchSpeed;
      this.isSprinting = false;
    } else if (this.keys.sprint && this.keys.forward) {
      currentSpeed = this.sprintSpeed;
      this.isSprinting = true;
    } else {
      this.isSprinting = false;
    }

    // 3. Movement vector based on yaw
    const moveDir = new THREE.Vector3();
    const forwardVec = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const rightVec = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    if (this.keys.forward) moveDir.add(forwardVec);
    if (this.keys.backward) moveDir.sub(forwardVec);
    if (this.keys.right) moveDir.add(rightVec);
    if (this.keys.left) moveDir.sub(rightVec);
    moveDir.normalize();

    // Horizontal acceleration / damping
    const targetVelX = moveDir.x * currentSpeed;
    const targetVelZ = moveDir.z * currentSpeed;

    this.velocity.x += (targetVelX - this.velocity.x) * Math.min(1, dt * 12);
    this.velocity.z += (targetVelZ - this.velocity.z) * Math.min(1, dt * 12);

    // Vertical gravity
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * dt;
    }

    // 4. Step-by-step AABB collision resolution
    // X Axis movement & collision
    const radius = 0.4;
    const height = this.eyeHeight;

    this.position.x += this.velocity.x * dt;
    if (this.checkPlayerCollision(radius, height)) {
      this.position.x -= this.velocity.x * dt;
      this.velocity.x = 0;
    }

    // Z Axis movement & collision
    this.position.z += this.velocity.z * dt;
    if (this.checkPlayerCollision(radius, height)) {
      this.position.z -= this.velocity.z * dt;
      this.velocity.z = 0;
    }

    // Y Axis movement & collision
    this.position.y += this.velocity.y * dt;
    if (this.checkPlayerCollision(radius, height)) {
      if (this.velocity.y < 0) {
        // Landing
        this.isGrounded = true;
      }
      this.position.y -= this.velocity.y * dt;
      this.velocity.y = 0;
    } else {
      // Check ground just below
      const testBox = new THREE.Box3(
        new THREE.Vector3(this.position.x - radius, this.position.y - 0.1, this.position.z - radius),
        new THREE.Vector3(this.position.x + radius, this.position.y, this.position.z + radius)
      );
      if (this.map.checkCollision(testBox)) {
        this.isGrounded = true;
      } else {
        this.isGrounded = false;
      }
    }

    // Keep within world bounds
    this.position.x = Math.max(-78, Math.min(78, this.position.x));
    this.position.z = Math.max(-78, Math.min(78, this.position.z));

    // 5. Head Bob & Footsteps
    const horizSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    let bobOffset = 0;
    if (horizSpeed > 1.0 && this.isGrounded) {
      this.bobTimer += dt * (this.isSprinting ? 14 : 10);
      bobOffset = Math.sin(this.bobTimer) * (this.isCrouching ? 0.03 : 0.07);

      this.footstepTimer += dt * horizSpeed;
      if (this.footstepTimer > 4.5) {
        this.footstepTimer = 0;
        if (this.audioSys) this.audioSys.playFootstep();
      }
    }

    // 6. Update Camera Transform
    this.camera.position.copy(this.position);
    this.camera.position.y += this.eyeHeight + bobOffset;

    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  checkPlayerCollision(radius, height) {
    const box = new THREE.Box3(
      new THREE.Vector3(this.position.x - radius, this.position.y, this.position.z - radius),
      new THREE.Vector3(this.position.x + radius, this.position.y + height, this.position.z + radius)
    );
    return this.map.checkCollision(box);
  }

  teleport(pos) {
    this.position.copy(pos);
    this.velocity.set(0, 0, 0);
  }
}
