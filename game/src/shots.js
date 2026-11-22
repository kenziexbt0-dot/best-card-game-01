// The screenshot scenes behind ?shot=start|play|win|loss. Each one plays the
// real rules forward from a fresh world, steered by a simple autopilot, so the
// frame is what a real game looks like and the same seed always gives the same
// frame. The win scene's pilot attacks the hero every turn while the Warden
// only defends; the loss scene is the mirror image.
import { SCREEN_PLAY, SCREEN_WIN, SCREEN_LOSS, startGame, startTurn, canPlayCard, playCard, canAttack, attack } from './world.js';

/** One side's pilot turn: play what it can afford, then attack. When
 *  `aggressive` is false the side plays creatures but never attacks. */
function pilotTurn(world, side, aggressive) {
  const s = side === 'player' ? world.player : world.ai;
  const foeSide = side === 'player' ? 'ai' : 'player';
  const foe = side === 'player' ? world.ai : world.player;
  let guard = 0;
  while (guard < 40) {
    guard += 1;
    if (world.screen !== SCREEN_PLAY) return;
    const playable = s.hand
      .map((card, index) => ({ card, index }))
      .filter(({ index }) => canPlayCard(world, side, index));
    if (playable.length === 0) break;
    const creatures = playable.filter((p) => p.card.kind === 'creature');
    const spells = playable.filter((p) => p.card.kind === 'spell');
    let pick = null;
    let target = null;
    if (creatures.length > 0) {
      creatures.sort((a, b) => b.card.cost - a.card.cost);
      pick = creatures[0];
    } else {
      for (const p of spells) {
        if (p.card.effect === 'mend' && s.life <= 18) { pick = p; break; }
        if (p.card.effect === 'draw' && s.hand.length <= 3) { pick = p; break; }
        if (p.card.effect === 'quake' && foe.board.length >= 2) { pick = p; break; }
        if (p.card.effect === 'bolt') {
          const threat = foe.board.slice().sort((a, b) => b.atk - a.atk)[0];
          if (threat && threat.hp <= 3) { pick = p; target = { kind: 'creature', side: foeSide, uid: threat.uid }; break; }
          if (foe.life <= 3) { pick = p; target = { kind: 'hero', side: foeSide }; break; }
        }
      }
      if (!pick) break;
    }
    playCard(world, side, pick.index, target);
  }
  if (!aggressive) return;
  for (const c of s.board.slice()) {
    if (world.screen !== SCREEN_PLAY) return;
    if (!canAttack(world, side, c.uid)) continue;
    if (c.atk >= foe.life) {
      attack(world, side, c.uid, { kind: 'hero', side: foeSide });
      continue;
    }
    const prey = foe.board
      .filter((e) => e.hp <= c.atk && e.atk < c.hp)
      .sort((a, b) => b.atk - a.atk)[0];
    if (prey) {
      attack(world, side, c.uid, { kind: 'creature', side: foeSide, uid: prey.uid });
    } else {
      attack(world, side, c.uid, { kind: 'hero', side: foeSide });
    }
  }
}

/** Play full rounds (player turn, then Warden turn) until `stop` says enough. */
function playRounds(world, playerAggressive, aiAggressive, stop) {
  let rounds = 0;
  while (world.screen === SCREEN_PLAY && rounds < 40) {
    pilotTurn(world, 'player', playerAggressive);
    if (world.screen !== SCREEN_PLAY || stop(world, rounds)) return;
    startTurn(world, 'ai');
    pilotTurn(world, 'ai', aiAggressive);
    if (world.screen !== SCREEN_PLAY || stop(world, rounds)) return;
    startTurn(world, 'player');
    rounds += 1;
  }
}

/**
 * Set `world` to the named scene (start, play, win or loss) and return the
 * screen to draw over it.
 */
export function stageShot(name, world) {
  if (name === 'start') {
    return { screen: 'title' };
  }
  startGame(world);
  if (name === 'play') {
    // A mid-game table: both sides have creatures out and cards in hand.
    playRounds(world, true, true, (w, rounds) => rounds >= 3 && w.player.board.length > 0 && w.ai.board.length > 0);
    pilotTurn(world, 'player', true);
    return { screen: SCREEN_PLAY };
  }
  if (name === 'win') {
    // The Keeper presses every turn; the Warden only summons and never strikes.
    playRounds(world, true, false, () => false);
    return { screen: world.screen === SCREEN_WIN ? SCREEN_WIN : SCREEN_PLAY };
  }
  if (name === 'loss') {
    // The mirror: the Keeper never acts, the Warden presses every turn.
    playRounds(world, false, true, () => false);
    return { screen: world.screen === SCREEN_LOSS ? SCREEN_LOSS : SCREEN_PLAY };
  }
  return { screen: 'title' };
}
