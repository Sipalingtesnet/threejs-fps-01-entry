// TIDEWATCH Central Game State Store
export const GameState = {
  phase: 'menu', // menu, buy, live, roundEnd, matchEnd
  round: 1,
  maxRounds: 9,
  scores: {
    attackers: 0, // Team T (Tidewatch Raiders / Attackers)
    defenders: 0, // Team CT (Harbour Security / Defenders)
  },
  playerTeam: 'attackers', // 'attackers' or 'defenders'
  money: 800,
  health: 100,
  maxHealth: 100,
  armor: 100,
  weaponIndex: 0, // 0: Carbine KR-12, 1: SMG Stingray-9, 2: Sniper Deadeye-50, 3: Pistol P12
  weaponsOwned: [true, false, false, true], // Pistol and default rifle owned or starting
  ammo: {
    mag: 30,
    reserve: 90,
  },
  grenades: 1,
  timer: 15, // buy phase timer or live round timer
  bomb: {
    planted: false,
    site: null, // 'A' or 'B'
    timer: 45.0, // detonation countdown
    carrier: null, // 'player' or bot id
    defusing: false,
    defuseProgress: 0.0,
    planting: false,
    plantProgress: 0.0,
    pos: { x: 0, y: 0, z: 0 },
  },
  kills: 0,
  deaths: 0,
  assists: 0,
  shotMode: null, // 'start', 'play', 'buy', 'end', or null
  activeWeapon: 'KR-12',
  viewMode: 'firstPerson', // firstPerson or freecam
};

export function resetRoundState(isNewMatch = false) {
  if (isNewMatch) {
    GameState.round = 1;
    GameState.scores.attackers = 0;
    GameState.scores.defenders = 0;
    GameState.money = 800;
  }
  GameState.health = 100;
  GameState.armor = 100;
  GameState.phase = 'buy';
  GameState.timer = 15;
  GameState.bomb.planted = false;
  GameState.bomb.site = null;
  GameState.bomb.defusing = false;
  GameState.bomb.defuseProgress = 0.0;
  GameState.bomb.planting = false;
  GameState.bomb.plantProgress = 0.0;
  GameState.grenades = GameState.weaponsOwned[4] ? 1 : 0; // if HE bought
}
