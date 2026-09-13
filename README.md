# TenAce Prototype 0.2

Playable portrait web prototype.

New in 0.2:
- Player serving timing mini-game
- Alternating server
- Named story rival: Jax Mercer
- Improved semi-auto positioning
- More differentiated shot risk/pacing
- Haptic hooks where browser/device permits
- Rival dialogue and match framing
- Upgrade selection after the match
- Exact production TenAceIQ PNG included
- Mobile web app manifest

Run:
python3 -m http.server 8080
Open http://localhost:8080/


## Sculpted character preview - September 13, 2026

Open `/meshy-preview.html` for the actual Meshy character: textured GLB, 28-joint skeleton and running animation. Drag to rotate; inspect the face, reference pose or skeleton. The clubhouse links to the preview. Gameplay remains version 0.20 with its existing customizable player.

The candidate is about 12 MB plus a 73 KB motion file. It is a single combined mesh/material: modular appearance, tennis strokes and mobile performance acceptance are still pending. See `assets/meshy/CREDITS.md` and `art-direction/MODEL_BUILD_HANDOFF.md`.


## On-court playtest

`index.html?player=meshy` loads the sculpted character for court and portraits. The preview now includes ready, lateral steps, forehand, backhand and serve. Two-bone arm solving targets the ball and keeps the racket anchored at the wrist; contact is tested on both court sides. Unreachable targets clamp to the arm's actual reach instead of detaching the racket.

This is an opt-in fixed-appearance playtest. Existing appearance saves are preserved, but hair/skin/kit choices are not represented by this fused asset. The base game retains the original customizable player. Finger articulation, closed grip, refined lateral footwork and mobile device performance certification remain outstanding. The tennis motion is procedural over the real skeleton, not authored tennis motion capture.
