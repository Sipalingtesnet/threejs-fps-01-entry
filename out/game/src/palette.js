// TIDEWATCH Harbour Palette - Night industrial / naval tactical theme
export const PALETTE = {
  canvas: 0x090c10,       // Deep night sky / water backdrop
  surface: 0x161f28,      // Wet asphalt / concrete ground
  metal: 0x2b3844,        // Dark steel structures / walkways
  containerRed: 0x9c3d28, // Rust-orange shipping containers
  containerBlue: 0x245468,// Navy blue shipping containers
  containerGreen: 0x315438,// Olive cargo containers
  wood: 0x5c4033,         // Wooden crates / pallets
  accent: 0x00e5ff,       // Cyan tactical accent
  amber: 0xffaa00,        // Sodium flood lamps
  warning: 0xff3b30,      // Red bomb / danger flash
  ink: 0xe6edf3,          // HUD text
  muted: 0x8b949e,        // HUD secondary
};

export const COLOR_NAMES = {
  canvas: '#090c10',
  surface: '#161f28',
  metal: '#2b3844',
  containerRed: '#9c3d28',
  containerBlue: '#245468',
  containerGreen: '#315438',
  wood: '#5c4033',
  accent: '#00e5ff',
  amber: '#ffaa00',
  warning: '#ff3b30',
  ink: '#e6edf3',
  muted: '#8b949e',
};

export function getHex(name) {
  return PALETTE[name] !== undefined ? PALETTE[name] : 0xffffff;
}
