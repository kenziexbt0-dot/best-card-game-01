// Ember Court — entry point. Owns the canvas, the animation loop and the
// wiring between the world, the renderer and the input layer. A ?shot=
// query stages one screenshot scene instead of a live game.
import { FIELD } from './config.js';
import { createWorld, SCREEN_TITLE } from './world.js';
import { render } from './render.js';
import { handleClick, handleKey } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') ?? '7') || 7;

const world = createWorld(seed);
try {
  const saved = Number(window.localStorage.getItem('ember-court.best') ?? '0');
  world.best = Number.isFinite(saved) ? saved : 0;
} catch {
  world.best = 0;
}
window.__world = world;

function resize() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;
  canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
}

function announce() {
  const lines = {
    title: 'Ember Court. Title screen. Press Enter to begin.',
    play: `Your life ${world.player.life}, Warden Ashkar's life ${world.ai.life}. ${world.turn === 'player' ? 'Your turn.' : "Ashkar's turn."}`,
    win: 'Victory. The Ember Court is yours.',
    loss: 'Defeat. Warden Ashkar keeps the court.',
  };
  status.textContent = lines[world.screen] ?? '';
}

function frame() {
  render(ctx, world);
  announce();
  if (world.screen === 'win' && world.best === 0) {
    try {
      window.localStorage.setItem('ember-court.best', String(world.stats.turnsPlayed));
      world.best = world.stats.turnsPlayed;
    } catch {
      /* best score is a nicety, never a failure */
    }
  }
}

function toLogical(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * FIELD.width,
    y: ((event.clientY - rect.top) / rect.height) * FIELD.height,
  };
}

canvas.addEventListener('click', (event) => {
  const p = toLogical(event);
  handleClick(world, p.x, p.y);
  frame();
});

window.addEventListener('keydown', (event) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
  handleKey(world, event.key);
  frame();
});

window.addEventListener('resize', () => {
  resize();
  frame();
});

resize();
if (shot) {
  stageShot(shot, world);
  frame();
  window.__shotReady = true;
} else {
  const loop = () => {
    frame();
    window.requestAnimationFrame(loop);
  };
  loop();
}
