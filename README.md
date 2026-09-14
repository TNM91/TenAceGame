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


## 0.21 serve controls

Swipe upward anywhere on court to serve. Angle the swipe to move the landing target sideways; longer swipes go deeper, faster swipes produce more pace. Keep the target inside the highlighted diagonal service box. A tap or downward gesture cancels without spending a serve. The Safe serve button and Space key provide a conservative alternative. Release commits the serve, followed by a short toss and strike; pause freezes that sequence.

Serve practice now scores real landings (percentage in), with no career XP. In-box personal best is tracked separately; the older timing-drill record is preserved in the save.

Interaction reference: Apple's Tennis Clash guide, https://apps.apple.com/nz/iphone/story/id1500619989 . TenAce's deterministic targeting and gesture tuning are its own implementation.


## 0.22 character motion

The sculpted-player playtest now includes a closed-hand corrective, aligned grip and distinct tennis motion curves in `tennis-motion.js`. The studio adds slow motion, flat/slice shots, a contact-ball visualization and hand inspection. Original GLB bytes are preserved; instance geometry is corrected once on construction, keeping UVs and skin weights.

The generated Meshy serve is still separate. This release uses authored pose curves with runtime contact solving, not a motion-capture library. The player retains a fixed appearance pending modular customization.
