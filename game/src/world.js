// Ember Court — the rules. A pure state machine: no drawing, no input here, so
// the screenshot stager and the play-tester can drive a whole game through the
// same calls a human player uses.
import { RULES } from './config.js';
import { makeCard, makeDeck, summonCreature } from './cards.js';
import { createRandom } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

export const EVENT_NONE = 0;
export const EVENT_WIN = 1;
export const EVENT_LOSS = 2;

const PLAYER_NAME = 'Keeper of the Ember Court';
const AI_NAME = 'Warden Ashkar';

function newSide(random) {
  return {
    life: RULES.startLife,
    mana: 0,
    maxMana: 0,
    deck: makeDeck(random),
    hand: [],
    board: [],
    fatigue: 0,
  };
}

/** A fresh world: title screen, no game yet. Call startGame to deal. */
export function createWorld(seed) {
  return {
    seed,
    random: createRandom(seed),
    screen: SCREEN_TITLE,
    turn: 'player',
    turnCount: 0,
    player: newSide(createRandom(seed + 11)),
    ai: newSide(createRandom(seed + 101)),
    log: [],
    stats: { cardsPlayed: 0, damageDealt: 0, turnsPlayed: 0 },
    selectedHand: null,
    selectedAttacker: null,
    message: '',
    best: 0,
  };
}

function say(world, line) {
  world.log.push(line);
  if (world.log.length > 5) world.log.shift();
}

export function sideOf(world, side) {
  return side === 'player' ? world.player : world.ai;
}

function otherSide(side) {
  return side === 'player' ? 'ai' : 'player';
}

function sideName(side) {
  return side === 'player' ? PLAYER_NAME : AI_NAME;
}

/** Draw one card; an empty deck deals rising fatigue damage instead. */
export function drawCard(world, side) {
  const s = sideOf(world, side);
  if (s.deck.length === 0) {
    s.fatigue += 1;
    s.life -= s.fatigue;
    say(world, `${sideName(side)} takes ${s.fatigue} fatigue damage.`);
    return checkEnd(world);
  }
  const card = s.deck.pop();
  if (s.hand.length < RULES.handMax) {
    s.hand.push(card);
  } else {
    say(world, `${sideName(side)}'s hand is full — a card burns away.`);
  }
  return EVENT_NONE;
}

/** Begin a side's turn: one more mana crystal, a refill, a card, fresh attacks. */
export function startTurn(world, side) {
  const s = sideOf(world, side);
  s.maxMana = Math.min(RULES.maxMana, s.maxMana + 1);
  s.mana = s.maxMana;
  for (const c of s.board) {
    c.canAttack = true;
    c.hasAttacked = false;
    c.justPlayed = false;
  }
  if (side === 'player') {
    world.turnCount += 1;
    world.stats.turnsPlayed += 1;
  }
  return drawCard(world, side);
}

/** Deal the opening hands and start the player's first turn. */
export function startGame(world) {
  world.screen = SCREEN_PLAY;
  world.turn = 'player';
  world.turnCount = 0;
  world.log = [];
  world.stats = { cardsPlayed: 0, damageDealt: 0, turnsPlayed: 0 };
  world.selectedHand = null;
  world.selectedAttacker = null;
  for (let i = 0; i < RULES.startHand; i += 1) {
    drawCard(world, 'player');
    drawCard(world, 'ai');
  }
  drawCard(world, 'ai');
  say(world, `${AI_NAME} stokes the court braziers. Your move.`);
  return startTurn(world, 'player');
}

function removeDead(world, side) {
  const s = sideOf(world, side);
  const before = s.board.length;
  s.board = s.board.filter((c) => c.hp > 0);
  if (s.board.length < before) say(world, `A creature falls from the ${side === 'player' ? 'your' : "Ashkar's"} board.`);
}

function damageHero(world, side, amount, byPlayer) {
  const s = sideOf(world, side);
  s.life -= amount;
  if (byPlayer) world.stats.damageDealt += amount;
  return checkEnd(world);
}

function damageCreature(world, side, uid, amount) {
  const s = sideOf(world, side);
  const c = s.board.find((x) => x.uid === uid);
  if (!c) return EVENT_NONE;
  c.hp -= amount;
  removeDead(world, side);
  return checkEnd(world);
}

/** 0 when the game goes on, EVENT_WIN / EVENT_LOSS when a hero falls. */
export function checkEnd(world) {
  if (world.screen !== SCREEN_PLAY) return EVENT_NONE;
  if (world.ai.life <= 0) {
    world.screen = SCREEN_WIN;
    say(world, `${AI_NAME} is defeated. The Ember Court is yours!`);
    return EVENT_WIN;
  }
  if (world.player.life <= 0) {
    world.screen = SCREEN_LOSS;
    say(world, `Your flame gutters out. ${AI_NAME} keeps the court.`);
    return EVENT_LOSS;
  }
  return EVENT_NONE;
}

/** Can this side play this hand card right now? */
export function canPlayCard(world, side, handIndex) {
  const s = sideOf(world, side);
  const card = s.hand[handIndex];
  if (!card) return false;
  if (card.cost > s.mana) return false;
  if (card.kind === 'creature' && s.board.length >= RULES.boardMax) return false;
  return true;
}

/**
 * Play a hand card. Spells that need a target take one:
 * { kind: 'hero', side } or { kind: 'creature', side, uid }.
 * Returns EVENT_NONE / EVENT_WIN / EVENT_LOSS.
 */
export function playCard(world, side, handIndex, target) {
  const s = sideOf(world, side);
  if (!canPlayCard(world, side, handIndex)) return EVENT_NONE;
  const card = s.hand[handIndex];
  if (card.kind === 'spell' && card.effect === 'bolt' && !target) return EVENT_NONE;
  s.mana -= card.cost;
  s.hand.splice(handIndex, 1);
  world.stats.cardsPlayed += 1;
  if (card.kind === 'creature') {
    s.board.push(summonCreature(card));
    say(world, `${sideName(side)} summons ${card.name} (${card.atk}/${card.hp}).`);
    return EVENT_NONE;
  }
  if (card.effect === 'bolt') {
    say(world, `${sideName(side)} hurls a Spark Bolt.`);
    if (target.kind === 'hero') return damageHero(world, target.side, 3, side === 'player');
    return damageCreature(world, target.side, target.uid, 3);
  }
  if (card.effect === 'mend') {
    s.life = Math.min(RULES.startLife, s.life + 6);
    say(world, `${sideName(side)} sips Mendroot Tea (+6 life).`);
    return EVENT_NONE;
  }
  if (card.effect === 'draw') {
    say(world, `${sideName(side)} reads the Gale Draw.`);
    drawCard(world, side);
    drawCard(world, side);
    return checkEnd(world);
  }
  if (card.effect === 'quake') {
    say(world, `${sideName(side)} slams the table — Quake Slam!`);
    const foe = sideOf(world, otherSide(side));
    for (const c of foe.board.slice()) damageCreature(world, otherSide(side), c.uid, 4);
    return checkEnd(world);
  }
  return EVENT_NONE;
}

/** Can this board creature attack right now? */
export function canAttack(world, side, uid) {
  const s = sideOf(world, side);
  const c = s.board.find((x) => x.uid === uid);
  return Boolean(c && c.canAttack && !c.hasAttacked);
}

/**
 * One creature attacks. Target: { kind: 'hero', side } or
 * { kind: 'creature', side, uid }. Both creatures strike back.
 */
export function attack(world, side, uid, target) {
  const s = sideOf(world, side);
  const attacker = s.board.find((x) => x.uid === uid);
  if (!attacker || !canAttack(world, side, uid)) return EVENT_NONE;
  attacker.hasAttacked = true;
  attacker.canAttack = false;
  if (target.kind === 'hero') {
    say(world, `${attacker.name} strikes ${sideName(target.side)} for ${attacker.atk}.`);
    return damageHero(world, target.side, attacker.atk, side === 'player');
  }
  const foe = sideOf(world, target.side).board.find((x) => x.uid === target.uid);
  if (!foe) return EVENT_NONE;
  say(world, `${attacker.name} (${attacker.atk}/${attacker.hp}) meets ${foe.name} (${foe.atk}/${foe.hp}).`);
  foe.hp -= attacker.atk;
  attacker.hp -= foe.atk;
  removeDead(world, 'player');
  removeDead(world, 'ai');
  return checkEnd(world);
}

/** End the current side's turn and start the next side's. */
export function endTurn(world) {
  if (world.screen !== SCREEN_PLAY) return EVENT_NONE;
  world.selectedHand = null;
  world.selectedAttacker = null;
  world.turn = otherSide(world.turn);
  const event = startTurn(world, world.turn);
  if (event !== EVENT_NONE) return event;
  if (world.turn === 'ai') return aiTakeTurn(world);
  return EVENT_NONE;
}

/** The Warden's turn: a small, readable heuristic — play what it can afford,
 *  spend removal on the biggest threat, trade up, otherwise go for the hero. */
export function aiTakeTurn(world) {
  const s = world.ai;
  let guard = 0;
  while (guard < 40) {
    guard += 1;
    const playable = s.hand
      .map((card, index) => ({ card, index }))
      .filter(({ card, index }) => canPlayCard(world, 'ai', index));
    if (playable.length === 0) break;
    // Creatures first, most expensive first; spells when they make sense.
    const creatures = playable.filter((p) => p.card.kind === 'creature');
    const spells = playable.filter((p) => p.card.kind === 'spell');
    let pick = null;
    let target = null;
    if (creatures.length > 0) {
      creatures.sort((a, b) => b.card.cost - a.card.cost);
      pick = creatures[0];
    } else if (spells.length > 0) {
      for (const p of spells) {
        if (p.card.effect === 'mend' && s.life <= 18) { pick = p; break; }
        if (p.card.effect === 'draw' && s.hand.length <= 3) { pick = p; break; }
        if (p.card.effect === 'quake' && world.player.board.length >= 2) { pick = p; break; }
        if (p.card.effect === 'bolt') {
          const threat = world.player.board.slice().sort((a, b) => b.atk - a.atk)[0];
          if (threat && threat.hp <= 3) { pick = p; target = { kind: 'creature', side: 'player', uid: threat.uid }; break; }
          if (world.player.life <= 3) { pick = p; target = { kind: 'hero', side: 'player' }; break; }
        }
      }
      if (!pick) break;
    }
    if (!pick) break;
    const event = playCard(world, 'ai', pick.index, target);
    if (event !== EVENT_NONE) return event;
  }
  for (const c of s.board.slice()) {
    if (world.screen !== SCREEN_PLAY) break;
    if (!canAttack(world, 'ai', c.uid)) continue;
    // Lethal first.
    if (c.atk >= world.player.life) {
      const event = attack(world, 'ai', c.uid, { kind: 'hero', side: 'player' });
      if (event !== EVENT_NONE) return event;
      continue;
    }
    // Trade up: kill a stronger enemy creature and survive it.
    const prey = world.player.board
      .filter((e) => e.hp <= c.atk && e.atk < c.hp)
      .sort((a, b) => b.atk - a.atk)[0];
    if (prey) {
      const event = attack(world, 'ai', c.uid, { kind: 'creature', side: 'player', uid: prey.uid });
      if (event !== EVENT_NONE) return event;
      continue;
    }
    const event = attack(world, 'ai', c.uid, { kind: 'hero', side: 'player' });
    if (event !== EVENT_NONE) return event;
  }
  if (world.screen !== SCREEN_PLAY) return EVENT_NONE;
  world.turn = 'player';
  return startTurn(world, 'player');
}

/** Restart from the title screen with a fresh seed. */
export function restart(world, seed) {
  const fresh = createWorld(seed);
  world.seed = fresh.seed;
  world.random = fresh.random;
  world.screen = fresh.screen;
  world.turn = fresh.turn;
  world.turnCount = fresh.turnCount;
  world.player = fresh.player;
  world.ai = fresh.ai;
  world.log = fresh.log;
  world.stats = fresh.stats;
  world.selectedHand = null;
  world.selectedAttacker = null;
  world.message = '';
  return world;
}
