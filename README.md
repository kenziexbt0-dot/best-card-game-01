[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/kenziexbt0-dot/best-card-game-01/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/kenziexbt0-dot/best-card-game-01/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# Ember Court — a duel of the Four Houses

You are the Keeper of the Ember Court. Warden Ashkar holds the court, and only
a duel of cards will settle it. Spend mana, summon creatures of the Four
Houses — Ember, Tide, Leaf and Stone — cast spells, and bring his 30 life to
zero before he brings yours to zero.

Built for the [make.fun best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826) — try make.fun yourself with my referral link: https://make.fun/r/2e09z4yn

## How to play

- **Click a card in your hand** to play it (creatures take the board, spells
  resolve at once). Spark Bolt asks you to click its target first.
- **Click one of your creatures, then an enemy creature or Warden Ashkar** to
  attack. Creatures strike back when they fight each other, and a creature
  cannot attack on the turn it is summoned.
- **END TURN** (or Space) passes to the Warden. Each turn you gain a mana
  crystal (up to 10), refill your mana, and draw a card. An empty deck deals
  rising fatigue damage instead.
- **Keys:** 1–7 play a hand card · Space ends the turn · Esc cancels a
  selection · R restarts.

Win by bringing Ashkar's life to 0. Lose yours and the court stays his.

## The Four Houses

Every card belongs to a House, told apart by colour and by the shape drawn on
the card: **Ember** (flame, orange), **Tide** (wave, blue), **Leaf** (leaf,
green) and **Stone** (peak, grey). The pool holds 14 original creatures and 4
original spells, from the 1-cost Cinder Pup to the 7-cost Storm Dragon, plus
Spark Bolt, Mendroot Tea, Gale Draw and Quake Slam.

## Play it

No build step, no network. Serve `game/` with any static server and open
`game/index.html`:

```sh
node serve.ts
# then open http://localhost:8080
```

`main.ts` (Node 22) hands the game in: it copies `game/` and `screenshots/`
to `/output` and writes `/output/dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=2e09z4yn&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
