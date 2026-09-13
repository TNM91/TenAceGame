# Character prototype assets

Original models, textures and locomotion animations by Quaternius, used under CC0 1.0. The publisher's bundled license notices are preserved alongside these files.

- Character: https://quaternius.com/packs/universalbasecharacters.html — free Standard edition, Superhero Male FullBody and Hair SimpleParted.
- Animation: https://quaternius.com/packs/universalanimationlibrary.html — free Standard edition, Idle_Loop, Jog_Fwd_Loop and Walk_Loop.

TenAce modifications: split body triangles into jersey, shorts, shoe and skin material regions; attach the supplied hair to the head joint; embed selected original textures; remove unused texture maps; extract locomotion tracks. Clothing regions are fitted surface materials, not separate sculpted garments. Runtime tennis arm poses use two-bone inverse kinematics; tennis swings are not supplied motion-capture clips. The first character has a fixed face and hairstyle. Shoes and racket are added by the game.

`tenace-athlete.glb` is 8,189,400 bytes; `locomotion.glb` is 522,484 bytes. Assets load only in the character studio or with `?rigged=1`. Standard matches retain the existing lightweight player and WebGL fallback behavior.

To reproduce, download the free Standard ZIPs from the publisher into `.preview/quaternius-base-standard.zip` and `.preview/quaternius-animation-standard.zip`, then run `python scripts/prepare-rig.py` from the repository root. Source downloads are ignored by Git. Three.js loader and skeleton utilities are vendored at version 0.180.0 under MIT.
