# First character: model build handoff

Status: first textured Meshy 7 model generated on 2026-09-12. GLB export is blocked by the Free plan; no new model has been downloaded, rigged or integrated. The live game remains 0.20.

## Generation input

Use `player-model-reference-v1.png`, not the multi-character concept board. It shows one approved-style athlete in an A-pose with empty separated hands, visible feet and no racket. Built-in image generation produced the reference; the exact prompt is below. This is a modeling aid, not an orthographically measured source mesh.

The first target is visual resemblance plus usable anatomy. Check the back against `create-your-player-v1.png`. Do not assume one image can specify an accurate back view, rig or modular clothing.

## Proposed service route

Meshy's documented workflow supports image-to-3D, rigging and GLB export:
- https://docs.meshy.ai/en/webapp/getting-started
- https://docs.meshy.ai/en/api/image-to-3d
- https://help.meshy.ai/en/articles/16231707-how-to-create-3d-animation-with-auto-rigging

Check the signed-in generation cost and export eligibility before starting. Public Free-plan help pages differ on which model versions can be downloaded; do not promise a free export. No subscription, generation purchase or paid commission has been authorized. Do not put API credentials in this repository or the browser game.

## Inspection and integration

1. Generate the initial mesh, inspect resemblance and hands, and retain the original source export.
2. Inspect whether hair, body and kit are fused into one mesh/texture. A fused output is an art starting point, not the promised modular creator. Separate and retopologize those parts as needed, then bind compatible variants to the shared skeleton.
3. Rig the candidate and export a self-contained GLB. Capture generator/version, task ID, source image, export settings and applicable license alongside it.
4. Run `node scripts/inspect-character.cjs path/to/candidate.glb`. The checker only examines container structure and metadata: exit 1 means malformed input/read failure; exit 2 means required asset work; exit 0 means ready for manual inspection, NOT approved for gameplay. It does not validate vertex data or prove correct deformation.
5. Inspect the real mesh under game lighting, map its bones and contact anchors, and adapt the tennis animations to its proportions. Keep it in a candidate preview until contact, clothing fit, personalization, saves and phone performance pass the acceptance gate in `PLAYER_JOURNEY_BRIEF.md`.

The existing stock GLB is only a fixture for exercising the inspector. It is not a substitute for the approved new character.

## Reference prompt

Using the approved TenAce concept board as the visual identity reference, create ONE clean 3D-modeling reference render of ONLY the main male athlete from the left turnaround. Keep exactly that character's appealing stylized face, warm medium skin, dark sculpted curly hair, confident strong brows, compact adult athletic proportions, teal jersey with navy raglan sleeves and lime piping, navy tennis shorts, white socks, chunky white/navy/lime tennis shoes. Retain the premium sculpted cartoon 3D rendering, do not make it more realistic. Full body perfectly centered, straight-on front view, orthographic modeling camera, entire head and both shoes inside frame with margin. Place him in a neutral symmetrical A-pose: upper arms angled approximately 40 degrees away from the torso, elbows straight but relaxed, both hands empty and clearly visible, palms facing forward, five distinct naturally spaced fingers on each hand, no objects, no wristbands. Legs straight, feet separated by hip width and both feet flat pointing forward. Calm neutral closed-mouth face. Smooth matte light gray background, even soft neutral illumination from both sides, minimal contact shadow, no cast shadows across body, no depth of field. This is a single image-to-3D input, so absolutely no racket, trophy, extra characters, extra views, thumbnails, accessories, text, borders, labels or logos. Fit jersey and shorts to the body with clean visible boundaries for later modular garment creation, no loose cloth obscuring anatomy. This is an original young adult tennis athlete, not a child and not a copied game character.

## First generation result — 2026-09-12

- Input: `player-model-reference-v1.png`.
- Meshy 7 Flagship, High Detail, Standard resolution, Texture on, Image Enhancement off, Multi-view off, Split off, Pose transformation off (reference already in A-pose).
- Generation quoted 30 existing credits. Meshy displayed account/reward changes during processing; the final observed balance was 100. No subscription or extra-credit purchase was made.
- License selection during generation: CC BY 4.0. Preserve this provenance; do not assume a later subscription retroactively changes the asset's license.
- A geometry candidate and textured derivative are visible in the account's workspace under 09/12/2026. The textured candidate visually retains the teal/navy kit, sculpted dark hair, separated hands and athletic silhouette.
- Viewer reports 1,937,350 triangle faces and 999,983 vertices for the textured source. This is a high-resolution source asset, not a mobile-ready model. Retopology/decimation, skinning, contact tests and modular garment inspection remain necessary.
- Attempting the GLB Download opened a subscription gate. The Pro Monthly option shown is $10 for the first month, then $20/month. The alternative selected by default was annual billing ($120 today); monthly was selected for review only. Subscribe Now was not clicked.
- Awaiting explicit purchase authorization or a user-completed plan upgrade. Do not bypass the download restriction by extracting viewer resources.
