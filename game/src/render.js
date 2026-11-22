// Ember Court — everything the player sees. One canvas, one fixed 1280x720
// logical field, scaled to the window. All art is drawn in code: the Four
// Houses are told apart by colour and by a glyph shape on every card.
import { FIELD, HOUSES, PALETTE, FONT, RULES } from './config.js';
import { SCREEN_TITLE, SCREEN_WIN, SCREEN_LOSS } from './world.js';

export const SCREEN_PLAY = 'play';

const CARD_W = 112;
const CARD_H = 156;
const BOARD_W = 104;
const BOARD_H = 140;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx, text, maxWidth, size, weight) {
  let s = size;
  ctx.font = `${weight} ${s}px ${FONT}`;
  while (s > 8 && ctx.measureText(text).width > maxWidth) {
    s -= 1;
    ctx.font = `${weight} ${s}px ${FONT}`;
  }
  return s;
}

/** The four house glyphs, drawn as paths so no image file is needed. */
export function drawGlyph(ctx, glyph, cx, cy, size, colour) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = colour;
  ctx.strokeStyle = colour;
  ctx.lineWidth = size * 0.09;
  ctx.lineJoin = 'round';
  const s = size / 2;
  if (glyph === 'flame') {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.7, -s * 0.2, s * 0.9, s * 0.3, s * 0.45, s * 0.8);
    ctx.bezierCurveTo(s * 0.2, s, -s * 0.2, s, -s * 0.45, s * 0.8);
    ctx.bezierCurveTo(-s * 0.9, s * 0.3, -s * 0.7, -s * 0.2, 0, -s);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(0, s * 0.1);
    ctx.bezierCurveTo(s * 0.35, s * 0.35, s * 0.3, s * 0.7, 0, s * 0.75);
    ctx.bezierCurveTo(-s * 0.3, s * 0.7, -s * 0.35, s * 0.35, 0, s * 0.1);
    ctx.fill();
  } else if (glyph === 'wave') {
    ctx.beginPath();
    for (let i = 0; i <= 3; i += 1) {
      const y = -s * 0.5 + i * s * 0.55;
      ctx.moveTo(-s, y);
      ctx.quadraticCurveTo(-s * 0.5, y - s * 0.45, 0, y);
      ctx.quadraticCurveTo(s * 0.5, y + s * 0.45, s, y);
    }
    ctx.stroke();
  } else if (glyph === 'leaf') {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s, -s * 0.4, s * 0.8, s * 0.7, 0, s);
    ctx.bezierCurveTo(-s * 0.8, s * 0.7, -s, -s * 0.4, 0, -s);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.7);
    ctx.lineTo(0, s * 0.8);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.7);
    ctx.lineTo(-s * 0.35, -s * 0.5);
    ctx.lineTo(0, s * 0.05);
    ctx.lineTo(s * 0.35, -s * 0.8);
    ctx.lineTo(s, s * 0.7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawCostGem(ctx, x, y, r, cost) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#1971c2';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#a5d8ff';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(r * 1.1)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(cost), x, y + 1);
}

function drawStatBadge(ctx, x, y, r, value, kind) {
  ctx.beginPath();
  if (kind === 'atk') {
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y + r * 0.8);
    ctx.lineTo(x - r, y + r * 0.8);
    ctx.closePath();
    ctx.fillStyle = '#e8590c';
  } else {
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#e03131';
  }
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(r * 1.05)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), x, y + 1);
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

/**
 * One card. opts: faceDown, selected, playable (affordable), dimmed, targetable.
 */
export function drawCard(ctx, card, x, y, w, h, opts = {}) {
  ctx.save();
  if (opts.selected) {
    ctx.shadowColor = PALETTE.gold;
    ctx.shadowBlur = 18;
  }
  roundRect(ctx, x, y, w, h, 10);
  if (opts.faceDown) {
    ctx.fillStyle = PALETTE.cardBack;
    ctx.fill();
    ctx.strokeStyle = PALETTE.goldDim;
    ctx.lineWidth = 2;
    ctx.stroke();
    roundRect(ctx, x + 8, y + 8, w - 16, h - 16, 6);
    ctx.strokeStyle = 'rgba(233,196,106,0.7)';
    ctx.stroke();
    drawGlyph(ctx, 'flame', x + w / 2, y + h / 2, Math.min(w, h) * 0.42, PALETTE.gold);
    ctx.restore();
    return;
  }
  const house = HOUSES[card.house];
  ctx.fillStyle = PALETTE.cardFace;
  ctx.fill();
  ctx.strokeStyle = opts.targetable ? PALETTE.gold : house.colour;
  ctx.lineWidth = opts.selected || opts.targetable ? 4 : 2.5;
  ctx.stroke();
  if (opts.dimmed) {
    ctx.fillStyle = 'rgba(11,15,26,0.45)';
    ctx.fill();
  }
  const pad = w * 0.07;
  drawCostGem(ctx, x + 15, y + 15, 13, card.cost);
  ctx.fillStyle = house.dark;
  ctx.font = `bold ${Math.round(w * 0.1)}px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(house.name.toUpperCase(), x + w - pad, y + 15);
  // Name.
  ctx.fillStyle = PALETTE.ink;
  const nameSize = fitText(ctx, card.name, w - pad * 2, Math.round(w * 0.115), 'bold');
  ctx.font = `bold ${nameSize}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(card.name, x + w / 2, y + h * 0.27);
  // Art box with the house glyph.
  const artY = y + h * 0.32;
  const artH = h * 0.34;
  roundRect(ctx, x + pad, artY, w - pad * 2, artH, 6);
  const grad = ctx.createLinearGradient(0, artY, 0, artY + artH);
  grad.addColorStop(0, house.light);
  grad.addColorStop(1, house.colour);
  ctx.fillStyle = grad;
  ctx.fill();
  drawGlyph(ctx, house.glyph, x + w / 2, artY + artH / 2, artH * 0.62, 'rgba(255,255,255,0.92)');
  // Text.
  ctx.fillStyle = '#495057';
  ctx.font = `italic ${Math.round(w * 0.082)}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const lines = wrapText(ctx, card.text, w - pad * 2);
  lines.forEach((line, i) => ctx.fillText(line, x + w / 2, y + h * 0.74 + i * Math.round(w * 0.1)));
  // Attack / health, or the spell's effect line.
  if (card.kind === 'creature') {
    drawStatBadge(ctx, x + 18, y + h - 18, 13, card.atk, 'atk');
    drawStatBadge(ctx, x + w - 18, y + h - 18, 13, card.hp, 'hp');
  } else {
    ctx.fillStyle = house.dark;
    ctx.font = `bold ${Math.round(w * 0.09)}px ${FONT}`;
    ctx.fillText('SPELL', x + w / 2, y + h - 14);
  }
  ctx.restore();
}

function drawMana(ctx, x, y, current, max) {
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `bold 13px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('MANA', x, y);
  for (let i = 0; i < RULES.maxMana; i += 1) {
    const cx = x + 52 + i * 18;
    ctx.save();
    ctx.translate(cx, y);
    ctx.rotate(Math.PI / 4);
    const size = 6;
    ctx.fillStyle = i < max ? (i < current ? PALETTE.mana : '#33415e') : 'rgba(51,65,94,0.35)';
    ctx.fillRect(-size, -size, size * 2, size * 2);
    ctx.strokeStyle = '#a5d8ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-size, -size, size * 2, size * 2);
    ctx.restore();
  }
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 15px ${FONT}`;
  ctx.fillText(`${current}/${max}`, x + 52 + RULES.maxMana * 18 + 6, y);
}

function drawHero(ctx, world, side, x, y) {
  const s = side === 'player' ? world.player : world.ai;
  const isPlayer = side === 'player';
  const colour = isPlayer ? PALETTE.player : PALETTE.enemy;
  const name = isPlayer ? 'KEEPER' : 'WARDEN ASHKAR';
  const sub = isPlayer ? 'You' : 'Rival';
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 34, 0, Math.PI * 2);
  ctx.fillStyle = isPlayer ? '#2b3a55' : '#4a1d1d';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = colour;
  ctx.stroke();
  ctx.fillStyle = colour;
  ctx.font = `bold 26px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isPlayer ? 'K' : 'A', x, y + 1);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 15px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(name, x + 46, y - 16);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `13px ${FONT}`;
  ctx.fillText(sub, x + 46, y + 2);
  // Life total: big, with a heart.
  ctx.fillStyle = PALETTE.life;
  ctx.beginPath();
  ctx.arc(x + 56, y + 24, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 24px ${FONT}`;
  ctx.fillText(String(Math.max(0, s.life)), x + 70, y + 24);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `12px ${FONT}`;
  ctx.fillText('LIFE', x + 100, y + 24);
  ctx.restore();
  return { x: x - 34, y: y - 34, w: 68, h: 68 };
}

/** Geometry the input layer shares: every clickable rect this frame. */
export function layout(world) {
  const out = { aiHero: { x: 32, y: 12, w: 68, h: 68 }, playerHero: { x: 32, y: 606, w: 68, h: 68 }, aiHand: [], playerHand: [], aiBoard: [], playerBoard: [], endTurn: null, deck: null };
  const handW = CARD_W;
  const handH = CARD_H;
  const handY = 548;
  const spacing = Math.min(118, (FIELD.width - 320) / Math.max(1, world.player.hand.length));
  const handTotal = spacing * (world.player.hand.length - 1) + handW;
  const handX = (FIELD.width - handTotal) / 2 + 40;
  world.player.hand.forEach((card, i) => {
    const selected = world.selectedHand === card.uid;
    out.playerHand.push({
      rect: { x: handX + i * spacing, y: handY - (selected ? 26 : 0), w: handW, h: handH },
      card,
      index: i,
    });
  });
  const aiHandW = 46;
  const aiHandH = 64;
  world.ai.hand.forEach((card, i) => {
    out.aiHand.push({
      rect: { x: FIELD.width - 300 + i * 34, y: 12, w: aiHandW, h: aiHandH },
      card,
    });
  });
  const boardGap = 16;
  const boardTotal = BOARD_W * 5 + boardGap * 4;
  const boardX = (FIELD.width - boardTotal) / 2;
  for (let i = 0; i < 5; i += 1) {
    out.aiBoard.push({ rect: { x: boardX + i * (BOARD_W + boardGap), y: 148, w: BOARD_W, h: BOARD_H }, slot: i });
    out.playerBoard.push({ rect: { x: boardX + i * (BOARD_W + boardGap), y: 372, w: BOARD_W, h: BOARD_H }, slot: i });
  }
  out.endTurn = { x: 1120, y: 600, w: 130, h: 52 };
  out.deck = { x: 1120, y: 548, w: 56, h: 44 };
  return out;
}

function drawBoardSlots(ctx, slots, highlight) {
  for (const slot of slots) {
    roundRect(ctx, slot.rect.x, slot.rect.y, slot.rect.w, slot.rect.h, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (highlight) {
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }
}

function drawTable(ctx, world) {
  const lay = layout(world);
  // Felt.
  ctx.fillStyle = PALETTE.table;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  roundRect(ctx, 16, 92, FIELD.width - 32, 440, 18);
  ctx.fillStyle = PALETTE.felt;
  ctx.fill();
  ctx.strokeStyle = PALETTE.feltEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Centre line.
  ctx.strokeStyle = 'rgba(233,196,106,0.35)';
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(40, 336);
  ctx.lineTo(FIELD.width - 40, 336);
  ctx.stroke();
  ctx.setLineDash([]);
  // Heroes.
  drawHero(ctx, world, 'ai', 66, 46);
  drawHero(ctx, world, 'player', 66, 640);
  // AI mana + deck.
  drawMana(ctx, 300, 30, world.ai.mana, world.ai.maxMana);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `13px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(`Deck ${world.ai.deck.length}`, 300, 56);
  // AI hand, face down.
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `bold 12px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText("ASHKAR'S HAND", FIELD.width - 300, 84);
  for (const h of lay.aiHand) drawCard(ctx, h.card, h.rect.x, h.rect.y, h.rect.w, h.rect.h, { faceDown: true });
  // Boards.
  const targeting = world.selectedHand !== null || world.selectedAttacker !== null;
  drawBoardSlots(ctx, lay.aiBoard, targeting);
  drawBoardSlots(ctx, lay.playerBoard, false);
  world.ai.board.forEach((card, i) => {
    const r = lay.aiBoard[i].rect;
    drawCard(ctx, card, r.x, r.y, r.w, r.h, { targetable: targeting });
  });
  world.player.board.forEach((card, i) => {
    const r = lay.playerBoard[i].rect;
    const ready = card.canAttack && !card.hasAttacked;
    drawCard(ctx, card, r.x, r.y, r.w, r.h, { selected: world.selectedAttacker === card.uid, dimmed: !ready });
  });
  // Turn banner + log.
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 15px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const banner = world.turn === 'player' ? 'YOUR TURN — play a card, attack, then end your turn' : 'WARDEN ASHKAR IS THINKING…';
  ctx.fillText(banner, FIELD.width / 2, 352);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `13px ${FONT}`;
  const last = world.log[world.log.length - 1] || '';
  ctx.fillText(last, FIELD.width / 2, 378);
  // Player mana + deck.
  drawMana(ctx, 300, 640, world.player.mana, world.player.maxMana);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `13px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(`Deck ${world.player.deck.length}  ·  Turn ${world.turnCount}`, 300, 666);
  // Player hand.
  world.player.hand.forEach((card, i) => {
    const h = lay.playerHand[i];
    const affordable = card.cost <= world.player.mana;
    drawCard(ctx, card, h.rect.x, h.rect.y, h.rect.w, h.rect.h, {
      selected: world.selectedHand === card.uid,
      playable: affordable,
      dimmed: !affordable,
    });
  });
  // End turn button.
  const b = lay.endTurn;
  const myTurn = world.turn === 'player';
  roundRect(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.fillStyle = myTurn ? PALETTE.button : '#343a40';
  ctx.fill();
  ctx.strokeStyle = myTurn ? PALETTE.buttonEdge : '#495057';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `bold 17px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(myTurn ? 'END TURN ⏎' : 'WAIT…', b.x + b.w / 2, b.y + b.h / 2 + 1);
  ctx.textBaseline = 'alphabetic';
  // Hint line.
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `12px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('Click a card to play it · Click your creature, then an enemy, to attack · 1–7 select · Space ends turn · R restarts', FIELD.width / 2, 712);
  return lay;
}

function drawTitle(ctx, world) {
  ctx.fillStyle = '#0b0f1a';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // Ember glow.
  const glow = ctx.createRadialGradient(640, 260, 40, 640, 260, 420);
  glow.addColorStop(0, 'rgba(232,89,12,0.35)');
  glow.addColorStop(1, 'rgba(232,89,12,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // Decorative fanned cards.
  const deco = [
    { id: 'ember-knight', name: 'Ember Knight', house: 'ember', kind: 'creature', cost: 4, atk: 4, hp: 3, text: 'Sworn to the flame.' },
    { id: 'storm-dragon', name: 'Storm Dragon', house: 'tide', kind: 'creature', cost: 7, atk: 7, hp: 6, text: 'The weather, with opinions.' },
    { id: 'elder-treant', name: 'Elder Treant', house: 'leaf', kind: 'creature', cost: 6, atk: 4, hp: 7, text: 'Its roots hold the court up.' },
  ];
  deco.forEach((card, i) => {
    ctx.save();
    ctx.translate(400 + i * 240, 470);
    ctx.rotate((i - 1) * 0.14);
    drawCard(ctx, card, -56, -78, CARD_W, CARD_H, {});
    ctx.restore();
  });
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 84px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('EMBER COURT', FIELD.width / 2, 210);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `28px ${FONT}`;
  ctx.fillText('A duel of the Four Houses', FIELD.width / 2, 258);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `17px ${FONT}`;
  ctx.fillText('You are the Keeper. Warden Ashkar holds the court. Spend mana, summon creatures,', FIELD.width / 2, 330);
  ctx.fillText('cast spells, and bring his 30 life to zero before he brings yours to zero.', FIELD.width / 2, 356);
  // Houses row.
  const houses = ['ember', 'tide', 'leaf', 'stone'];
  houses.forEach((h, i) => {
    const cx = 430 + i * 150;
    drawGlyph(ctx, HOUSES[h].glyph, cx, 620, 34, HOUSES[h].light);
    ctx.fillStyle = HOUSES[h].light;
    ctx.font = `bold 15px ${FONT}`;
    ctx.fillText(HOUSES[h].name, cx, 652);
  });
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 22px ${FONT}`;
  ctx.fillText('Click or press Enter to begin', FIELD.width / 2, 580);
  if (world.best > 0) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `15px ${FONT}`;
    ctx.fillText(`Best result so far: won in ${world.best} turns`, FIELD.width / 2, 690);
  }
}

function drawEnd(ctx, world, won) {
  drawTable(ctx, world);
  ctx.fillStyle = 'rgba(5,8,14,0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  roundRect(ctx, 340, 190, 600, 330, 16);
  ctx.fillStyle = '#1a2233';
  ctx.fill();
  ctx.strokeStyle = won ? PALETTE.gold : PALETTE.enemy;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = won ? PALETTE.gold : PALETTE.enemy;
  ctx.font = `bold 64px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(won ? 'VICTORY' : 'DEFEAT', FIELD.width / 2, 300);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `20px ${FONT}`;
  ctx.fillText(
    won ? 'Warden Ashkar falls. The Ember Court is yours!' : 'Your flame gutters out. Warden Ashkar keeps the court.',
    FIELD.width / 2,
    344,
  );
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `17px ${FONT}`;
  ctx.fillText(`Turns played: ${world.stats.turnsPlayed}   ·   Cards played: ${world.stats.cardsPlayed}   ·   Damage dealt: ${world.stats.damageDealt}`, FIELD.width / 2, 396);
  ctx.fillText(`Your life: ${Math.max(0, world.player.life)}   ·   Ashkar's life: ${Math.max(0, world.ai.life)}`, FIELD.width / 2, 426);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 20px ${FONT}`;
  ctx.fillText('Press R to play again', FIELD.width / 2, 478);
}

/** Draw the current screen; returns the layout for the input layer. */
export function render(ctx, world) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  if (world.screen === SCREEN_TITLE) {
    drawTitle(ctx, world);
    return null;
  }
  if (world.screen === SCREEN_WIN) {
    drawEnd(ctx, world, true);
    return null;
  }
  if (world.screen === SCREEN_LOSS) {
    drawEnd(ctx, world, false);
    return null;
  }
  return drawTable(ctx, world);
}
