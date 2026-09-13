# Original stylized players — 0.18

The user chose colorful, expressive, anime-adjacent sports characters over lifelike stock models. Clash Royale is a reference for silhouette clarity and playful character appeal, not a source of copied characters or assets.

`original-player.js` contains new editable Three.js geometry: sculpted head contours, large eyes and brows, tapered hair locks, sportswear, an emblem, shoes and racket. Meshes, colors and articulated transforms are created locally. No downloaded character model, paid asset or generated character bitmap is used. Three.js remains the MIT-licensed rendering dependency.

Movement combines a loaded stance, torso preparation, lateral steps, contact alignment and recovery. The face blinks and brows respond to load; hair reacts to motion. This is procedural character animation, not motion capture or a finished production animation set. All existing saved hairstyle, skin, clothing and racket options remain supported.

This is now the default 3D character in matches, portraits and customization, with the original-character studio at `rig-preview.html`. `?classic=1` retains the previous lightweight procedural player for comparison. The old imported mesh and its CC0 licenses remain in source history/files, but the default game and studio no longer download those character assets.

Next art refinements should be judged against this direction: more distinctive face shapes, more expressive winning/losing reactions and improved hand/foot articulation. Phone frame-rate and thermal testing still require physical devices; browser viewport tests do not establish App Store performance.
