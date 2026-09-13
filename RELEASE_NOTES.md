# TenAce releases

Live game: https://ten-ace-game.vercel.app/

## 0.14 — A unified playable venue

- Replaced the painted match backdrop with a modeled pavilion, timber canopy, glass frontage, tiered seating, planting, court surrounds, fences, benches and light fixtures under shared lighting. The original art remains available to the 2D fallback; 3D matches no longer combine incompatible flat and modeled backgrounds.
- Adult-sized head assemblies, facial details and clothing panels, with slightly larger player silhouettes for phone readability. Jax now wears a navy kit and coral racket to distinguish him from the player's default outfit.
- Footwork follows traveled distance; ready stance adds knee flex and split-step motion. Loaded swings lower the stance, serve preparation staggers the feet, and backhands use supporting-hand motion with a different follow-through direction. This remains authored procedural animation, not motion capture.
- HUD, clubhouse and customization previews use the actual 3D player model. Previews update on appearance or size changes and restore the court framebuffer after rendering; the 2D fallback still works when WebGL is unavailable.

Validation: 53 tests passed, including portrait rendering/restoration, ready/load/serve poses, contact and recovery continuity, gameplay, progression, and fallback checks. Phone-sized browser inspection verified the modeled venue, 3D portraits, clothing changes and cancellation, and a clean swipe return without console errors. A full match remains covered by game-loop tests; physical iPhone/Android playtesting and premium-art review remain outstanding. This release improves visual consistency and movement rather than claiming finished App Store quality.

## 0.13 — Distinct shot flight and continuous follow-through

- Shot height is now independent of horizontal flight duration. Arcade profiles give flat a low drive, slice a lower flight and skidding bounce, topspin more clearance and kick, and lob a deliberately high arc. Their nominal peaks from a low contact are 0.105, 0.085, 0.17 and 0.43 court-height units respectively. Contact above a nominal peak raises it just above the contact point.
- Separate per-flight vertical acceleration retains analytic net and landing checks. This is a controlled arcade trajectory model, not a real-world aerodynamic spin simulation. Slowing a drive no longer increases its apex. Bounce profiles reset vertical acceleration and control skid/kick independently.
- Removed the universal 0.85-second minimum for rally shots. Serves and practice feeds use the corrected trajectory system too. Opponent shots have their own explicit type; Mira uses occasional defensive lobs instead of labeling every return a lob.
- Replaced the sphere head, lathed torso and cylinder limbs with authored contour geometry. Added distinct continuous shot follow-through and recovery paths so the racket does not snap away when contact lock ends. Existing clothing, hair and racket personalization remains available. Character art is still procedural, with production-quality models and animation remaining an art gap.

Validation: 51 automated tests passed, including apex ordering, net clearance, bounce profiles, slower shots retaining their height, landing prediction, frame-size consistency, contour validity and racket continuity. Live phone-sized browser gestures produced clean flat and topspin contacts with 3D active and no console errors. These checks do not substitute for physical-device playtesting or an artistic quality review.

## 0.12 — Hold, load, swipe

- Removed the rally shot-selection buttons. Press anywhere on court to load power (capped at 900 ms), then swipe and release at contact. Idle time between touches does not build power.
- Upward strokes choose topspin, sideways strokes flat, downward strokes slice, and a long slow upward stroke chooses lob. Horizontal angle sets placement; upward stroke length also affects drive depth. Holding before a quick upward flick does not turn it into a lob.
- Charge increases pace and stamina cost. Timing, fatigue, reach, and control still determine execution; high charge adds pressure when mistimed. The short early-input buffer retains the complete gesture. Lifting without a swipe cancels; new presses, interruptions, and point endings clear stale input.
- Compact live power meter and gesture guide replace the button dock. Players visibly turn and load the racket while holding. Arrow keys remain a desktop fallback; the existing serve-placement and tap-timing interaction is unchanged.
- Closer court camera, smoother player geometry, revised head proportions, wind-up/body rotation, contact shadows, simpler courtside benches, a correctly oriented sponsor sign, and removal of placeholder crowd figures. These remain procedural characters, not finished production character assets.

Validation: 47 automated tests passed, including held-touch shot selection, charge/pace/stamina, cancellation, buffered shot preservation, all four gesture classifications, and existing physics/progression/pause/renderer checks. Actual browser swipes produced clean topspin and slice returns without shot selection; 3D reported no console errors. Hold duration is covered by simulated pointer tests rather than a physical phone benchmark.

## 0.11 — Phone comfort and reliable frame pacing

- Match simulation uses small substeps so slower rendering does not slow ball travel. Long active-frame stalls pause safely; backgrounding or losing focus also pauses.
- A three-second resume countdown keeps the point frozen. Interrupting the countdown requires a deliberate resume, with pending serve/drill/point deadlines preserved.
- Auto, Quality, and Performance graphics presets. Auto drops to reduced pixel density and disables dynamic shadows after sustained slow frames. Explicit presets persist, with no gameplay or progression changes. Menu previews render at 10 fps and hidden pages skip rendering.
- Court gestures track their owning pointer so another finger cannot steal or cancel aim. Lost capture clears queued input. Menu scrolling is separated from court gestures, toolbar targets are at least 44 pixels tall, and Challenge is presented earlier in the clubhouse.
- Collapsible practice/display sections, persisted advanced-shot preference, and optional touch feedback where vibration is supported.

Validation: 42 automated tests passed, including renderer presets, multi-touch ownership, interrupted resume, slow-frame adaptation, frame-rate consistency, and career regressions. Browser checks at 390×844 and 375×667 verified 3D, settings persistence, the resume countdown, a clean touch return after resuming, no horizontal overflow, and no console errors. This is browser verification, not a physical iPhone/Android frame-rate, thermal, or battery benchmark. Bespoke character art and authored animation remain future work; this release does not claim App Store readiness.

## 0.10 — Skill and player identity

- Phone controls start with topspin, slice, and lob. Flat shots can be enabled as an advanced option. A tap makes a center return; dragging sets direction. Buttons now work with keyboard activation as well as touch.
- Guided rally drill with preparation/release cues and live aiming. Practice continues awarding no XP; incomplete matches do not pay rewards.
- Deterministic rally-shot quality: timing, reach, stamina, control, and power determine pace and placement. A pressured safe shot becomes a shorter, slower defensive ball; a badly forced flat can miss. Player rally shots no longer use random out rolls. Serving and opponent errors retain their existing rules.
- Completed matches award +3 XP per clean contact (cap 30), plus 15 for reaching an eight-shot rally. Results report technique XP and level-ups. First-win rewards still apply once.
- Level 3 unlocks freely selectable specializations between matches: Striker (+8% pace), Tactician (+0.012 timing window), Retriever (+12% positioning speed and −15% rally stamina cost). Speed 5 adds three stamina recovery per point. Saves migrate to Balanced and preserve earned progress.
- XP bar, player rank titles, specialization descriptions, and clearer upgrade milestones.
- 3D visual refinement: shaped shirt silhouettes, collars, articulated knees and shorts, textured court/grass, corrected banner text, revised framing, and a simpler backdrop composition. Characters remain procedural; bespoke modeled characters and authored animation are still needed to reach the intended premium visual quality.

Validation: 36 automated tests pass. Live WebGL rendering, a successful clean-contact swipe, guided practice, pause/leave, and locked specialization UI were verified in the browser at phone sizes (390 × 844 and 375 × 667). This release also includes the previously unpublished 0.9 renderer.

## 0.9 — First playable 3D court (included in 0.10)

- Added a Three.js WebGL renderer with a perspective camera, lit court materials, directional shadows, a 3D net, trees, clubhouse, crowd, and courtside furniture. The illustrated club asset remains a distant backdrop.
- Procedural 3D athletes retain saved skin, hair, clothing, and racket choices. Articulated arms/legs animate footwork, preparation, shots, serves, and celebrations. Racket contact uses the actual physics contact position.
- Incoming landing markers and drag-to-aim targets; slice, topspin, flat, lob, and serve sounds now differ. Optional sound remains off by default.
- The 2D view remains available through the toolbar and is selected automatically when WebGL creation or rendering fails. View changes preserve the current match; pause stops both simulation and 3D animation.
- Career data, scoring, rival unlocks, and practice rules are unchanged. These are procedural character models, not motion-captured or externally modeled assets. Replays and a broader presentation overhaul are future work.

Validation: 32 automated tests pass. Tests exercise the real Three.js scene graph, all appearance silhouettes, racket/ball contact alignment, live aiming state, pause/view changes, failure fallback, and existing game rules. Camera framing was inspected using a software projection of the same scene. Live WebGL rendering remains unverified because the browser connector is unavailable; this build is not yet published.

## 0.8 — Illustrated clubhouse

- Reference-inspired illustrated clubhouse, foliage, spectators, and navy windscreen art with a procedural fallback when the asset is unavailable. The court and line calls remain independent of the scenery.
- Deeper blue Riverdale surface, green surrounds, branded courtside boxes, a finer net mesh, and a lower court composition. Solstice retains a warm terracotta surface.
- Rebuilt athletic player proportions with longer limbs, bent knees, outlined clothing, headbands, detailed racket strings, and animated front/back poses. All existing character choices are retained; HUD portraits reflect them.
- Portrait scorecards and circular, color-coded shot buttons. Serve controls now sit above the court to keep the near player visible.
- This is an interpretation of the user's reference, with simpler animated characters and existing first-to-seven scoring.

Validation: 27 automated tests passed, including image-loaded/fallback rendering and all character silhouettes. Native Canvas renders of both themes were inspected. The browser loaded the new UI, but automated browser clicks timed out, so full browser interaction verification was unavailable for this release.

## 0.7 — Court depth and rally training

- Rebuilt both courts with a receding perspective, sky, layered trees and skyline, textured surfaces, fencing, spectator benches, floodlights, and directional shading. Players, ball trails, bounce markers, service targets, and hitting zones follow the court projection.
- Larger players scale with depth. Added back-facing match poses, shirt shading, preparation poses, body rotation, stronger footwork, and distinct slice, flat, topspin, and lob swing arcs. Creator previews retain the player's face and appearance.
- Refined scoreboard, shot controls, and clubhouse styling. This remains a lightweight Canvas game with simulated depth, rather than a full 3D engine.
- Relaxed, Standard, and Competitive difficulty adjust opponent pace/recovery and the player's timing/input buffer. Standard retains the original gameplay parameters. The setting persists separately from career data; rewards and unlocks remain the same at each difficulty.
- Rally practice sends twelve repeatable center/left/right feeds. Return after one bounce using a swipe or arrow key; a return counts when it lands legally across the net. The drill reports successful returns, supports pause/leave, and awards no XP.
- Clearer early-swing and expired-input messages. Existing career progress, appearance, serve practice, and chapter rewards are preserved.

Validation: 25 automated tests cover full matches, all difficulty settings, drill completion and pause/leave, plus existing physics, save, chapter, creator, and audio behavior. Browser checks include 390 × 844 and 375 × 667 layouts.

## 0.6 — The local circuit

- Career map with illustrated venue cards, rival introductions, unlock requirements, and next milestones. Reach it from the clubhouse or match results; practice and rematches remain available.
- First Jax victory unlocks Mira Sol at Solstice Terrace and awards +80 bonus XP in addition to the normal win reward.
- Mira is a defensive rival with quicker recovery, slower/deeper returns, fewer placement errors, and better stamina conservation. Her character, dialogue, scoreboard, and venue replace Jax's when selected.
- First Mira victory awards +100 bonus XP and unlocks the Champion gold shirt in Customize player. Cosmetics remain stat-neutral. First-win bonuses cannot be farmed through rematches.
- New terrace art: warm terracotta surface, sunset sky and skyline, planters, lamps, and spectator seats. Riverdale also gains court-side details. Both surfaces use the same physics in this release.
- Older saves with wins receive credit for beating Jax, since he was the only opponent; no retroactive bonus XP is granted. Career, appearance, and upgrades are preserved.
- Completing both rivals finishes the current local circuit. There is no third chapter yet.

Validation: `node --test --test-isolation=none chapters.test.cjs physics.test.cjs progression.test.cjs character.test.cjs game.test.cjs sound.test.cjs`.

## 0.5 — Find your rhythm

- Ball flight now has height, gravity, surface rebounds, and net collision. Line calls use the first landing position inside the painted singles lines. A second bounce awards the hitter the point.
- Service landings must be in the diagonal service box. Player faults get a second serve; double faults lose the point. Server still alternates each point under the prototype's first-to-seven rules. Each server switches court sides on their next service turn.
- Wide, Body, and Down the T placement controls with a visible target on court. The existing practice drill remains a timing exercise.
- Return after one bounce. A 200 ms input buffer accepts slightly early swings; the contact zone follows your player. Arrow-key and swipe controls remain supported.
- Both players anticipate landing positions and adjust depth. Jax recovers more quickly and attacks the open court in longer rallies, with placement errors increasing under pressure and fatigue.
- Ball shadows and height now follow simulation. Bounce rings, contact feedback, and shot-specific rebounds make rallies easier to read.
- Optional synthesized hit, bounce, net, footstep, and point sounds. Sound starts off; toggle it in the court toolbar. Mute preference persists separately from career data. Browser audio support and device volume still apply.
- Arcade simplifications: no volleys, service lets, spin aerodynamics, or regulation game/set scoring. This release retains one rival and the existing court.

Tests: `node --test --test-isolation=none physics.test.cjs progression.test.cjs character.test.cjs game.test.cjs sound.test.cjs`.

Coverage includes line/net calls at multiple frame rates, service boxes, double faults, legal return windows, sustained rallies, sound mute behavior, and earlier progression/customization checks.

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
