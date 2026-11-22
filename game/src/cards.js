// Card instances and decks: every card in play is a fresh object built from the
// pool in config.js, so a game never shares state with another game.
import { CARD_POOL, DECK_LIST } from './config.js';
import { shuffle } from './random.js';

let nextUid = 1;

export function cardDef(id) {
  return CARD_POOL.find((c) => c.id === id);
}

/** A fresh, playable copy of a card definition. */
export function makeCard(id) {
  const def = cardDef(id);
  return {
    uid: nextUid++,
    id: def.id,
    name: def.name,
    house: def.house,
    kind: def.kind,
    cost: def.cost,
    atk: def.atk ?? 0,
    hp: def.hp ?? 0,
    maxHp: def.hp ?? 0,
    effect: def.effect ?? null,
    text: def.text,
    canAttack: false,
    hasAttacked: false,
    justPlayed: false,
  };
}

/** A fresh 24-card deck, shuffled with the game's random. */
export function makeDeck(random) {
  return shuffle(DECK_LIST, random).map((id) => makeCard(id));
}

/** A fresh board creature, ready to be placed (summoning sickness: it cannot
 *  attack on the turn it is played). */
export function summonCreature(card) {
  const c = { ...card };
  c.canAttack = false;
  c.hasAttacked = false;
  c.justPlayed = true;
  return c;
}
