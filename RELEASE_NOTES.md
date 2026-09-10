# TenAce releases

Live game: https://ten-ace-game.vercel.app/

## 0.4 — Your court. Your style.

- Player studio with a live animated preview: name, five skin tones, five hairstyles, five hair colors, shirt and shorts palettes, racket color, and three frame shapes.
- Save applies your player to the clubhouse portrait, scoreboard name, and on-court character. Cancel discards the draft. Cosmetics have no stat advantage.
- Existing 0.3 careers acquire a default appearance without losing XP, upgrades, or records. Appearance saves in the same browser-local career.
- Shared vector character rig with a ready stance, moving legs, serve pose, directional return swings, and raised-arm point celebrations.
- New textured teal court with garden canopy, paths, fencing, benches, afternoon shading, and net mesh. Static court art is cached per resize; no external image requests are required.
- Colored ball trails, ball shadows and visual lift, contact sparks, and celebratory particles. Ball-height cues are cosmetic; this release does not add physical bounce or net collision simulation.
- Verified creator save/cancel and reload, on-court appearance, and phone layouts at 390×844 and 375×667.

Run all tests: `node --test --test-isolation=none progression.test.cjs game.test.cjs character.test.cjs`.

## 0.3 — Build your player

## Progression

- Completed wins award 120 XP; losses award 60 XP. Every 100 cumulative XP earns one upgrade point and one level.
- Spend points after a match or from Player upgrades in the clubhouse. Each stat caps at 10 upgrades; unspent points remain available.
- Power increases shot and serve pace by 2.5% per upgrade.
- Control widens timing windows and reduces shot risk. The serve meter shows its actual timing window.
- Speed improves movement and recovery toward the center.
- Tennis IQ improves anticipation of the incoming ball's path.
- XP, match record, upgrades, best rally, and best serve drill save automatically in this browser. This is not an account or a cloud save; another phone/browser starts its own career. Clearing site data removes the save. In-progress matches do not resume after reload.
- Invalid save data is validated. If browser storage is unavailable, the game stays playable and displays a warning that progress is temporary.

## Practice and controls

- Ten-serve practice drill with accuracy feedback, final average, and saved personal best. Practice does not award XP.
- Pause/resume and leave-to-clubhouse controls. Switching tabs pauses automatically. Leaving an unfinished match grants no reward.
- Highlighted contact zone, match-point/server labels, and keyboard returns using Left / Up / Right arrows. Escape pauses or resumes.
- Pointer capture keeps swipe returns working when a drag leaves the canvas.
- Flexible court layout keeps the shot buttons visible on shorter phone screens.
- Unreturned shots aimed in bounds now score as winners instead of being incorrectly called long.

## Validation

Run `node --test --test-isolation=none progression.test.cjs game.test.cjs`.

Tests cover match completion and duplicate reward prevention, earned upgrade budgets and caps, gameplay effects, save round trips, corrupt/blocked storage, pause/leave, and practice records without XP rewards. The game tests run the shipped game loop with a deterministic clock and minimal DOM adapter; browser checks supplement them.

Real bounce/net physics, cloud saves, extra rivals, audio, and offline support remain future work.
