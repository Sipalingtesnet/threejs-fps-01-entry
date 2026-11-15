import { resetRoundState } from './state.js';

export class RoundManager {
  constructor(state, audioSys, hud, botManager, player) {
    this.state = state;
    this.audioSys = audioSys;
    this.hud = hud;
    this.botManager = botManager;
    this.player = player;

    this.roundTimer = 15; // Start with buy phase
    this.bombPlanted = false;
  }

  update(dt) {
    if (this.state.phase === 'menu' || this.state.phase === 'roundEnd' || this.state.phase === 'matchEnd') {
      return;
    }

    this.roundTimer -= dt;
    this.state.timer = Math.max(0, Math.floor(this.roundTimer));

    if (this.state.phase === 'buy') {
      if (this.roundTimer <= 0) {
        this.startLivePhase();
      }
    } else if (this.state.phase === 'live') {
      // Check bomb timer if planted
      if (this.state.bomb.planted) {
        this.state.bomb.timer -= dt;
        if (this.state.bomb.timer <= 0) {
          // Attackers win via bomb explosion
          this.endRound('attackers', 'Bomb detonated!');
        }
      } else {
        if (this.roundTimer <= 0) {
          // Defenders win via time out
          this.endRound('defenders', 'Time expired! Defenders win.');
        }
      }

      // Check if all bots dead
      let enemyAlive = 0;
      let allyAlive = 0;
      this.botManager.bots.forEach(b => {
        if (b.alive) {
          if (b.isEnemy) enemyAlive++;
          else allyAlive++;
        }
      });

      if (enemyAlive === 0) {
        this.endRound(this.state.playerTeam, 'All enemies eliminated!');
      } else if (this.state.health <= 0) {
        const enemyTeam = this.state.playerTeam === 'attackers' ? 'defenders' : 'attackers';
        this.endRound(enemyTeam, 'Player eliminated!');
      }
    }
  }

  startLivePhase() {
    this.state.phase = 'live';
    this.roundTimer = 100; // 100 seconds live round
    this.hud.closeBuyMenu();
    if (this.audioSys) this.audioSys.playRoundStart();
  }

  plantBomb(siteName) {
    if (this.state.bomb.planted || this.state.phase !== 'live') return;
    this.state.bomb.planted = true;
    this.state.bomb.site = siteName;
    this.state.bomb.timer = 45.0; // 45s to defuse
    this.state.money += 300; // Bomb plant bonus
    if (this.audioSys) this.audioSys.playPlant();
    this.hud.showNotification('BOMB PLANTED AT SITE ' + siteName + '!');
  }

  endRound(winnerTeam, reason) {
    this.state.phase = 'roundEnd';
    if (winnerTeam === 'attackers') {
      this.state.scores.attackers++;
    } else {
      this.state.scores.defenders++;
    }

    // Money award
    if (winnerTeam === this.state.playerTeam) {
      this.state.money += 3250;
      if (this.audioSys) this.audioSys.playRoundWin();
    } else {
      this.state.money += 1400;
      if (this.audioSys) this.audioSys.playRoundLoss();
    }

    this.hud.showRoundEnd(winnerTeam === this.state.playerTeam, reason);

    // Check match win (first to 5)
    if (this.state.scores.attackers >= 5 || this.state.scores.defenders >= 5) {
      this.state.phase = 'matchEnd';
      const matchWinner = this.state.scores.attackers >= 5 ? 'Attackers' : 'Defenders';
      this.hud.showMatchEnd(matchWinner);
    } else {
      // Auto restart next round after 4 seconds
      setTimeout(() => {
        this.nextRound();
      }, 4000);
    }
  }

  nextRound() {
    this.state.round++;
    resetRoundState(false);
    this.roundTimer = 15; // 15s buy phase
    this.botManager.resetRound();

    // Teleport player & bots to spawn
    const spawnPos = this.botManager.map.getSpawnPoint(this.state.playerTeam);
    this.player.teleport(spawnPos);
    this.hud.hideOverlays();
  }
}
