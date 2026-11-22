// Ember Court — mouse and keyboard. Clicks are resolved against the same
// layout the renderer draws, so what you see is what you can click.
import { FIELD } from './config.js';
import {
  SCREEN_TITLE, SCREEN_WIN, SCREEN_LOSS,
  canPlayCard, playCard, canAttack, attack, endTurn, startGame, restart,
} from './world.js';
import { layout } from './render.js';

function inside(x, y, r) {
  return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function findHandCard(world, handIndex) {
  return world.player.hand[handIndex] ?? null;
}

/** Play a hand card the way a click would: creatures and instant spells go at
 *  once; Spark Bolt waits for a target instead. */
function tryPlayHandCard(world, handIndex) {
  const card = findHandCard(world, handIndex);
  if (!card) return;
  if (!canPlayCard(world, 'player', handIndex)) {
    world.message = `${card.name} costs ${card.cost} — not enough mana.`;
    return;
  }
  if (card.kind === 'spell' && card.effect === 'bolt') {
    world.selectedHand = card.uid;
    world.selectedAttacker = null;
    world.message = 'Spark Bolt — click an enemy creature or Warden Ashkar.';
    return;
  }
  world.selectedHand = null;
  playCard(world, 'player', handIndex, null);
}

/** A click at logical field coordinates (x, y). */
export function handleClick(world, x, y) {
  if (world.screen === SCREEN_TITLE) {
    startGame(world);
    return;
  }
  if (world.screen === SCREEN_WIN || world.screen === SCREEN_LOSS) return;
  if (world.turn !== 'player') return;
  const lay = layout(world);

  // A selected Spark Bolt is waiting for its target.
  if (world.selectedHand !== null) {
    const card = world.player.hand.find((c) => c.uid === world.selectedHand);
    if (card && card.effect === 'bolt') {
      if (inside(x, y, lay.aiHero)) {
        const index = world.player.hand.indexOf(card);
        world.selectedHand = null;
        playCard(world, 'player', index, { kind: 'hero', side: 'ai' });
        return;
      }
      for (let i = 0; i < world.ai.board.length; i += 1) {
        const creature = world.ai.board[i];
        if (inside(x, y, lay.aiBoard[i].rect)) {
          const index = world.player.hand.indexOf(card);
          world.selectedHand = null;
          playCard(world, 'player', index, { kind: 'creature', side: 'ai', uid: creature.uid });
          return;
        }
      }
    }
    world.selectedHand = null;
    world.message = '';
  }

  // A selected attacker is waiting for its target.
  if (world.selectedAttacker !== null) {
    const attacker = world.player.board.find((c) => c.uid === world.selectedAttacker);
    if (attacker) {
      if (inside(x, y, lay.aiHero)) {
        world.selectedAttacker = null;
        attack(world, 'player', attacker.uid, { kind: 'hero', side: 'ai' });
        return;
      }
      for (let i = 0; i < world.ai.board.length; i += 1) {
        const creature = world.ai.board[i];
        if (inside(x, y, lay.aiBoard[i].rect)) {
          world.selectedAttacker = null;
          attack(world, 'player', attacker.uid, { kind: 'creature', side: 'ai', uid: creature.uid });
          return;
        }
      }
    }
    world.selectedAttacker = null;
  }

  // End turn.
  if (inside(x, y, lay.endTurn)) {
    endTurn(world);
    return;
  }
  // Own hand.
  for (const h of lay.playerHand) {
    if (inside(x, y, h.rect)) {
      tryPlayHandCard(world, h.index);
      return;
    }
  }
  // Own board: select a creature that can attack.
  for (let i = 0; i < world.player.board.length; i += 1) {
    const creature = world.player.board[i];
    if (inside(x, y, lay.playerBoard[i].rect)) {
      if (canAttack(world, 'player', creature.uid)) {
        world.selectedAttacker = creature.uid;
        world.message = `${creature.name} — click an enemy to attack.`;
      } else {
        world.message = `${creature.name} cannot attack yet.`;
      }
      return;
    }
  }
}

/** A key press. Keys are the same on every keyboard layout. */
export function handleKey(world, key) {
  if (world.screen === SCREEN_TITLE) {
    if (key === 'Enter' || key === ' ') startGame(world);
    return;
  }
  if (world.screen === SCREEN_WIN || world.screen === SCREEN_LOSS) {
    if (key === 'r' || key === 'R' || key === 'Enter') restart(world, (Math.random() * 1e9) | 0);
    return;
  }
  if (key === 'r' || key === 'R') {
    restart(world, (Math.random() * 1e9) | 0);
    return;
  }
  if (key === 'Escape') {
    world.selectedHand = null;
    world.selectedAttacker = null;
    world.message = '';
    return;
  }
  if (world.turn !== 'player') return;
  if (key === ' ' || key === 'Enter') {
    if (world.selectedHand === null && world.selectedAttacker === null) endTurn(world);
    return;
  }
  const n = Number(key);
  if (Number.isInteger(n) && n >= 1 && n <= 7) {
    tryPlayHandCard(world, n - 1);
  }
}

export { FIELD };
