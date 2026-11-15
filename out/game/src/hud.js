import { COLOR_NAMES } from './palette.js';
import { WEAPONS } from './weapons.js';

export class HUD {
  constructor(state, weaponManager, roundManager) {
    this.state = state;
    this.weaponManager = weaponManager;
    this.roundManager = roundManager;

    this.container = document.createElement('div');
    this.container.id = 'hud-root';
    this.container.style.cssText = `
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none;
      font-family: monospace, sans-serif;
      color: ${COLOR_NAMES.ink};
      user-select: none;
      box-sizing: border-box;
      z-index: 10;
    `;
    document.body.appendChild(this.container);

    this.buildHTML();
  }

  buildHTML() {
    this.container.innerHTML = `
      <!-- Top Bar: Scores & Timer -->
      <div style="position: absolute; top: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 24px; align-items: center; background: rgba(9,12,16,0.85); padding: 8px 20px; border-radius: 6px; border: 1px solid ${COLOR_NAMES.hairline || '#2c323a'}; font-size: 16px; font-weight: bold;">
        <span id="hud-score-att" style="color: ${COLOR_NAMES.warning};">ATT 0</span>
        <span id="hud-timer" style="color: ${COLOR_NAMES.accent}; font-size: 20px;">1:15</span>
        <span id="hud-score-def" style="color: ${COLOR_NAMES.accent};">DEF 0</span>
      </div>

      <!-- Bottom Right: Ammo & Weapon -->
      <div style="position: absolute; bottom: 24px; right: 24px; text-align: right; background: rgba(9,12,16,0.85); padding: 12px 20px; border-radius: 6px; border: 1px solid #2c323a;">
        <div id="hud-weapon-name" style="font-size: 14px; color: ${COLOR_NAMES.muted}; margin-bottom: 4px;">KR-12 Carbine</div>
        <div style="font-size: 28px; font-weight: bold;"><span id="hud-ammo-mag">30</span><span style="color: ${COLOR_NAMES.muted}; font-size: 20px;"> / <span id="hud-ammo-res">90</span></span></div>
      </div>

      <!-- Bottom Left: Health, Armor, Money -->
      <div style="position: absolute; bottom: 24px; left: 24px; display: flex; gap: 20px; background: rgba(9,12,16,0.85); padding: 12px 20px; border-radius: 6px; border: 1px solid #2c323a;">
        <div>
          <div style="font-size: 11px; color: ${COLOR_NAMES.muted};">HEALTH</div>
          <div id="hud-health" style="font-size: 24px; font-weight: bold; color: ${COLOR_NAMES.accent};">100</div>
        </div>
        <div>
          <div style="font-size: 11px; color: ${COLOR_NAMES.muted};">ARMOR</div>
          <div id="hud-armor" style="font-size: 24px; font-weight: bold;">100</div>
        </div>
        <div>
          <div style="font-size: 11px; color: ${COLOR_NAMES.muted};">MONEY</div>
          <div id="hud-money" style="font-size: 24px; font-weight: bold; color: ${COLOR_NAMES.amber};">$800</div>
        </div>
      </div>

      <!-- Center Crosshair -->
      <div id="hud-crosshair" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; border: 2px solid rgba(0,229,255,0.8); border-radius: 50%; transition: width 0.1s, height 0.1s;"></div>

      <!-- Scope Overlay -->
      <div id="hud-scope" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle, transparent 30%, #000 70%); display: none; pointer-events: none;">
        <div style="position: absolute; top: 50%; left: 0; width: 100%; height: 2px; background: #000;"></div>
        <div style="position: absolute; top: 0; left: 50%; width: 2px; height: 100%; background: #000;"></div>
      </div>

      <!-- Notification Banner -->
      <div id="hud-notification" style="position: absolute; top: 80px; left: 50%; transform: translateX(-50%); font-size: 18px; font-weight: bold; color: ${COLOR_NAMES.amber}; text-shadow: 0 2px 4px rgba(0,0,0,0.8); opacity: 0; transition: opacity 0.3s;"></div>

      <!-- Buy Menu Overlay -->
      <div id="hud-buy-menu" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(9,12,16,0.9); display: none; pointer-events: auto; justify-content: center; align-items: center; z-index: 20;">
        <div style="background: #161f28; border: 2px solid ${COLOR_NAMES.accent}; padding: 30px; border-radius: 8px; width: 450px; text-align: center;">
          <h2 style="margin-top: 0; color: ${COLOR_NAMES.accent};">TIDEWATCH BUY MENU</h2>
          <p style="color: ${COLOR_NAMES.muted}; font-size: 13px;">Press B to close | Select weapon with 1-4</p>
          <div id="buy-items-list" style="margin: 20px 0; text-align: left; display: flex; flex-direction: column; gap: 10px;"></div>
        </div>
      </div>

      <!-- Round / Match End Overlay -->
      <div id="hud-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(9,12,16,0.8); display: none; pointer-events: auto; justify-content: center; align-items: center; z-index: 30; flex-direction: column;">
        <h1 id="hud-overlay-title" style="font-size: 48px; color: ${COLOR_NAMES.accent}; margin: 0 0 10px 0;">ROUND WON</h1>
        <p id="hud-overlay-subtitle" style="font-size: 18px; color: ${COLOR_NAMES.muted}; margin: 0;">Preparing next round...</p>
      </div>

      <!-- Start / Menu Overlay -->
      <div id="hud-start-screen" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #090c10; display: flex; pointer-events: auto; justify-content: center; align-items: center; z-index: 40; flex-direction: column;">
        <h1 style="font-size: 64px; color: ${COLOR_NAMES.accent}; margin: 0 0 10px 0; letter-spacing: 4px;">TIDEWATCH</h1>
        <p style="font-size: 18px; color: ${COLOR_NAMES.muted}; margin: 0 0 30px 0;">Tactical Round-Based FPS · Harbour Port</p>
        <button id="btn-start-game" style="background: ${COLOR_NAMES.accent}; color: #090c10; border: none; padding: 16px 36px; font-size: 18px; font-weight: bold; border-radius: 6px; cursor: pointer;">DEPLOY TO HARBOUR</button>
        <div style="margin-top: 30px; color: ${COLOR_NAMES.muted}; font-size: 13px; text-align: center; line-height: 1.6;">
          WASD: Move | Shift: Sprint | Ctrl: Crouch | Space: Jump<br>
          LMB: Fire | RMB: Scope | R: Reload | B: Buy Menu | G: Grenade
        </div>
      </div>
    `;

    // Populate buy items
    const buyList = this.container.querySelector('#buy-items-list');
    WEAPONS.forEach((w, idx) => {
      const div = document.createElement('div');
      div.style.cssText = `display: flex; justify-content: space-between; padding: 10px; background: #1e2228; border-radius: 4px; cursor: pointer;`;
      div.innerHTML = `<span>[${idx + 1}] ${w.name}</span><span style="color: ${COLOR_NAMES.amber};">${w.priceTag}</span>`;
      div.onclick = () => {
        if (this.state.money >= w.price) {
          this.state.money -= w.price;
          this.state.weaponsOwned[idx] = true;
          this.weaponManager.selectWeapon(idx);
          this.updateBuyMenu();
        }
      };
      buyList.appendChild(div);
    });
  }

  update() {
    // Update texts
    this.container.querySelector('#hud-score-att').innerText = `ATT ${this.state.scores.attackers}`;
    this.container.querySelector('#hud-score-def').innerText = `DEF ${this.state.scores.defenders}`;
    
    const mins = Math.floor(this.state.timer / 60);
    const secs = this.state.timer % 60;
    this.container.querySelector('#hud-timer').innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    this.container.querySelector('#hud-weapon-name').innerText = this.weaponManager.currentWeapon.name;
    this.container.querySelector('#hud-ammo-mag').innerText = this.state.ammo.mag;
    this.container.querySelector('#hud-ammo-res').innerText = this.state.ammo.reserve;

    this.container.querySelector('#hud-health').innerText = this.state.health;
    this.container.querySelector('#hud-armor').innerText = this.state.armor;
    this.container.querySelector('#hud-money').innerText = `$${this.state.money}`;

    // Scope overlay toggle
    const scopeEl = this.container.querySelector('#hud-scope');
    scopeEl.style.display = this.weaponManager.isScoped ? 'block' : 'none';

    // Crosshair spread
    const crossEl = this.container.querySelector('#hud-crosshair');
    const spreadSize = 8 + this.weaponManager.currentSpread * 200;
    crossEl.style.width = `${spreadSize}px`;
    crossEl.style.height = `${spreadSize}px`;
  }

  openBuyMenu() {
    this.container.querySelector('#hud-buy-menu').style.display = 'flex';
    this.updateBuyMenu();
  }

  closeBuyMenu() {
    this.container.querySelector('#hud-buy-menu').style.display = 'none';
  }

  updateBuyMenu() {
    // Could refresh items status
  }

  showNotification(text) {
    const el = this.container.querySelector('#hud-notification');
    el.innerText = text;
    el.style.opacity = '1';
    setTimeout(() => {
      el.style.opacity = '0';
    }, 3500);
  }

  showRoundEnd(won, reason) {
    const overlay = this.container.querySelector('#hud-overlay');
    const title = this.container.querySelector('#hud-overlay-title');
    const subtitle = this.container.querySelector('#hud-overlay-subtitle');

    title.innerText = won ? 'ROUND WON' : 'ROUND LOST';
    title.style.color = won ? COLOR_NAMES.accent : COLOR_NAMES.warning;
    subtitle.innerText = reason;
    overlay.style.display = 'flex';
  }

  showMatchEnd(winnerName) {
    const overlay = this.container.querySelector('#hud-overlay');
    const title = this.container.querySelector('#hud-overlay-title');
    const subtitle = this.container.querySelector('#hud-overlay-subtitle');

    title.innerText = `${winnerName.toUpperCase()} WIN MATCH!`;
    title.style.color = COLOR_NAMES.amber;
    subtitle.innerText = 'Final score reached. Match complete.';
    overlay.style.display = 'flex';
  }

  hideOverlays() {
    this.container.querySelector('#hud-overlay').style.display = 'none';
  }

  hideStartScreen() {
    this.container.querySelector('#hud-start-screen').style.display = 'none';
  }
}
