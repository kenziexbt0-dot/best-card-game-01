// Ember Court — every tuning number, colour and card definition in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

export const RULES = {
  startLife: 30,
  startMana: 1,
  maxMana: 10,
  startHand: 3,
  handMax: 7,
  boardMax: 5,
  deckSize: 24,
};

/** The four Houses of the Ember Court. A card's house is its suit: told apart by
 *  colour and by the shape drawn on the card, never by text alone. */
export const HOUSES = {
  ember: { name: 'Ember', colour: '#e8590c', light: '#ffa94d', dark: '#7f2d00', glyph: 'flame' },
  tide: { name: 'Tide', colour: '#1971c2', light: '#74c0fc', dark: '#0b3a66', glyph: 'wave' },
  leaf: { name: 'Leaf', colour: '#2f9e44', light: '#8ce99a', dark: '#144d22', glyph: 'leaf' },
  stone: { name: 'Stone', colour: '#868e96', light: '#ced4da', dark: '#343a40', glyph: 'peak' },
};

/**
 * The card pool. A creature has cost / attack / health; a spell has cost and an
 * effect. Every name, line of flavour text and number is original to this game.
 * kind: 'creature' | 'spell'. spell effect: 'bolt' | 'mend' | 'draw' | 'quake'.
 */
export const CARD_POOL = [
  { id: 'cinder-pup', name: 'Cinder Pup', house: 'ember', kind: 'creature', cost: 1, atk: 2, hp: 1, text: 'It fetches sparks and brings back smoke.' },
  { id: 'tide-sprite', name: 'Tide Sprite', house: 'tide', kind: 'creature', cost: 1, atk: 1, hp: 2, text: 'She hums, and the puddles hum back.' },
  { id: 'mossback', name: 'Mossback', house: 'leaf', kind: 'creature', cost: 2, atk: 1, hp: 4, text: 'Older than the court. Slower, too.' },
  { id: 'ember-squire', name: 'Ember Squire', house: 'ember', kind: 'creature', cost: 2, atk: 2, hp: 2, text: 'Polishes the court torches. Dreams of knighthood.' },
  { id: 'dawn-cleric', name: 'Dawn Cleric', house: 'leaf', kind: 'creature', cost: 2, atk: 1, hp: 3, text: 'Mends what the night unpicked.' },
  { id: 'storm-crow', name: 'Storm Crow', house: 'tide', kind: 'creature', cost: 3, atk: 3, hp: 2, text: 'Its caw arrives before the rain does.' },
  { id: 'thorn-wolf', name: 'Thorn Wolf', house: 'leaf', kind: 'creature', cost: 3, atk: 3, hp: 3, text: 'Runs the hedgerows at dusk.' },
  { id: 'ember-knight', name: 'Ember Knight', house: 'ember', kind: 'creature', cost: 4, atk: 4, hp: 3, text: 'Sworn to the flame. Never yet singed.' },
  { id: 'stone-golem', name: 'Stone Golem', house: 'stone', kind: 'creature', cost: 4, atk: 3, hp: 5, text: 'It was a garden wall, once. It remembers.' },
  { id: 'gloom-serpent', name: 'Gloom Serpent', house: 'tide', kind: 'creature', cost: 5, atk: 5, hp: 4, text: 'Slides between the lanterns, unseen.' },
  { id: 'ash-phoenix', name: 'Ash Phoenix', house: 'ember', kind: 'creature', cost: 5, atk: 5, hp: 3, text: 'Burns brightest the morning after.' },
  { id: 'elder-treant', name: 'Elder Treant', house: 'leaf', kind: 'creature', cost: 6, atk: 4, hp: 7, text: 'Its roots hold the whole court up.' },
  { id: 'mountain-king', name: 'Mountain King', house: 'stone', kind: 'creature', cost: 6, atk: 6, hp: 5, text: 'Crowns himself with snow every winter.' },
  { id: 'storm-dragon', name: 'Storm Dragon', house: 'tide', kind: 'creature', cost: 7, atk: 7, hp: 6, text: 'The weather, with opinions.' },
  { id: 'spark-bolt', name: 'Spark Bolt', house: 'ember', kind: 'spell', cost: 2, effect: 'bolt', text: 'Deal 3 damage to any target.' },
  { id: 'mendroot-tea', name: 'Mendroot Tea', house: 'leaf', kind: 'spell', cost: 2, effect: 'mend', text: 'Restore 6 life to your hero.' },
  { id: 'gale-draw', name: 'Gale Draw', house: 'tide', kind: 'spell', cost: 1, effect: 'draw', text: 'Draw 2 cards.' },
  { id: 'quake-slam', name: 'Quake Slam', house: 'stone', kind: 'spell', cost: 4, effect: 'quake', text: 'Deal 4 damage to all enemy creatures.' },
];

/** The deck: two copies of the eight cheapest creatures, one of each big
 *  creature and one of each spell — 24 cards, shuffled by the seeded random. */
export const DECK_LIST = [
  'cinder-pup', 'cinder-pup', 'tide-sprite', 'tide-sprite',
  'mossback', 'mossback', 'ember-squire', 'ember-squire',
  'dawn-cleric', 'dawn-cleric', 'storm-crow', 'storm-crow',
  'thorn-wolf', 'thorn-wolf', 'ember-knight', 'stone-golem',
  'gloom-serpent', 'ash-phoenix', 'elder-treant', 'mountain-king',
  'storm-dragon', 'spark-bolt', 'mendroot-tea', 'gale-draw',
];

export const PALETTE = {
  felt: '#123527',
  feltDark: '#0d2a1e',
  feltEdge: '#1e5c40',
  table: '#0b0f1a',
  panel: '#1a2233',
  panelEdge: '#33415e',
  gold: '#e9c46a',
  goldDim: '#a98f4e',
  text: '#f1f3f5',
  muted: '#9aa5b5',
  mana: '#4dabf7',
  life: '#fa5252',
  player: '#ffd43b',
  enemy: '#ff8787',
  button: '#2b8a3e',
  buttonEdge: '#69db7c',
  cardBack: '#5c3d99',
  cardFace: '#f8f5ec',
  ink: '#212529',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best result is kept between visits (this browser only). */
export const BEST_KEY = 'ember-court.best';
