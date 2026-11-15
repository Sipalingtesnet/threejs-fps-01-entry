// TIDEWATCH Weapons & Arsenal Definition (Revised)

export const WEAPONS = [
  {
    id: 'KR-12',
    name: 'KR-12 Carbine',
    slot: 0,
    price: 0,
    damage: 34, // Slightly tuned damage
    headshotMult: 2.5,
    fireRate: 0.11,
    mode: 'auto',
    magSize: 30,
    reserveMax: 90,
    reloadTime: 2.1,
    recoilPitch: 0.014,
    recoilYaw: 0.007,
    spreadBase: 0.007,
    spreadMax: 0.038,
    priceTag: '$0'
  },
  {
    id: 'Stingray-9',
    name: 'Stingray-9 SMG',
    slot: 1,
    price: 1250,
    damage: 25,
    headshotMult: 2.2,
    fireRate: 0.075,
    mode: 'auto',
    magSize: 32,
    reserveMax: 96,
    reloadTime: 1.7,
    recoilPitch: 0.009,
    recoilYaw: 0.011,
    spreadBase: 0.011,
    spreadMax: 0.055,
    priceTag: '$1,250'
  },
  {
    id: 'Deadeye-50',
    name: 'Deadeye-50 Sniper',
    slot: 2,
    price: 4750,
    damage: 110,
    headshotMult: 2.5,
    fireRate: 1.1,
    mode: 'single',
    magSize: 5,
    reserveMax: 15,
    reloadTime: 3.0,
    recoilPitch: 0.075,
    recoilYaw: 0.018,
    spreadBase: 0.0005,
    spreadMax: 0.075,
    priceTag: '$4,750',
    hasScope: true
  },
  {
    id: 'P12',
    name: 'P12 Sidearm',
    slot: 3,
    price: 0,
    damage: 28,
    headshotMult: 2.0,
    fireRate: 0.18,
    mode: 'single',
    magSize: 12,
    reserveMax: 36,
    reloadTime: 1.4,
    recoilPitch: 0.018,
    recoilYaw: 0.004,
    spreadBase: 0.009,
    spreadMax: 0.028,
    priceTag: '$0'
  }
];

export const GRENADE = {
  id: 'HE',
  name: 'Tideburst HE',
  price: 300,
  damage: 90,
  radius: 8.0,
  fuse: 2.5
};

export class WeaponManager {
  constructor(state, audioSys, hud) {
    this.state = state;
    this.audioSys = audioSys;
    this.hud = hud;

    this.currentIndex = 0;
    this.currentWeapon = WEAPONS[0];
    this.mag = this.currentWeapon.magSize;
    this.reserve = this.currentWeapon.reserveMax;

    this.fireTimer = 0;
    this.reloadTimer = 0;
    this.isReloading = false;
    this.isScoped = false;
    this.recoilOffset = { pitch: 0, yaw: 0 };
    this.currentSpread = this.currentWeapon.spreadBase;
  }

  selectWeapon(index) {
    if (index < 0 || index >= WEAPONS.length) return;
    if (index !== 3 && !this.state.weaponsOwned[index]) return;

    this.currentIndex = index;
    this.currentWeapon = WEAPONS[index];
    this.mag = this.currentWeapon.magSize;
    this.reserve = this.currentWeapon.reserveMax;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.isScoped = false;
    this.state.activeWeapon = this.currentWeapon.id;
    this.state.ammo.mag = this.mag;
    this.state.ammo.reserve = this.reserve;
  }

  update(dt, isFiring, isAiming) {
    if (this.fireTimer > 0) this.fireTimer -= dt;
    if (this.reloadTimer > 0) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.finishReload();
      }
    }

    if (this.currentWeapon.hasScope) {
      this.isScoped = isAiming;
    } else {
      this.isScoped = false;
    }

    this.recoilOffset.pitch *= Math.max(0, 1 - dt * 16);
    this.recoilOffset.yaw *= Math.max(0, 1 - dt * 16);
    this.currentSpread += (this.currentWeapon.spreadBase - this.currentSpread) * Math.min(1, dt * 9);

    this.state.ammo.mag = this.mag;
    this.state.ammo.reserve = this.reserve;
  }

  canFire() {
    return this.fireTimer <= 0 && !this.isReloading && this.mag > 0;
  }

  fire() {
    if (!this.canFire()) return false;

    this.fireTimer = this.currentWeapon.fireRate;
    this.mag--;
    this.state.ammo.mag = this.mag;

    this.recoilOffset.pitch += this.currentWeapon.recoilPitch;
    this.recoilOffset.yaw += (Math.random() - 0.5) * this.currentWeapon.recoilYaw;
    this.currentSpread = Math.min(this.currentWeapon.spreadMax, this.currentSpread + 0.012);

    if (this.audioSys) {
      this.audioSys.playGunshot(this.currentWeapon.id);
    }

    if (this.mag <= 0 && this.reserve > 0) {
      this.reload();
    }

    return true;
  }

  reload() {
    if (this.isReloading || this.mag >= this.currentWeapon.magSize || this.reserve <= 0) return;
    this.isReloading = true;
    this.reloadTimer = this.currentWeapon.reloadTime;
    if (this.audioSys) this.audioSys.playReload();
  }

  finishReload() {
    const needed = this.currentWeapon.magSize - this.mag;
    const take = Math.min(needed, this.reserve);
    this.mag += take;
    this.reserve -= take;
    this.isReloading = false;
    this.state.ammo.mag = this.mag;
    this.state.ammo.reserve = this.reserve;
  }
}
