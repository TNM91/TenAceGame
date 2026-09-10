# Standalone TenAceGame deployment

This project belongs to https://github.com/TNM91/TenAceGame and has no dependency on TNM91/tennis-data. Create a separate Vercel project for this repository.

## Run locally

With Node.js installed, run `node serve.cjs` from this repository root and open http://127.0.0.1:8080/.

Alternatively, run `python3 -m http.server 8080 --bind 127.0.0.1` and open http://127.0.0.1:8080/.

The original README is preserved from the ZIP. Its nested `/tenace-prototype-0.2/` URL does not apply because these files are now at the repository root.

## Deploy on Vercel

1. Add a new Vercel project and import `TNM91/TenAceGame`.
2. Name the project `tenacegame` (or another available, separate name).
3. Use the repository root (`.`), Framework Preset **Other**, and production branch **main**.
4. `vercel.json` sets empty build and install commands and serves the root directory. No dependencies, backend, environment variables, or tennis-data resources are needed.
5. Deploy, then verify the challenge screen, serve button, shot controls, and match results on the generated HTTPS URL.

Vercel reference: https://vercel.com/docs/builds/configure-a-build

The manifest requests standalone portrait display. Offline play is not configured.

## Import notes

All five original files are retained at the root. The logo, manifest, README, and design bible are byte-for-byte identical to the ZIP. `index.html` has two integration fixes: the intro now uses the existing `show` class so Challenge Jax can dismiss it, and the page links the supplied manifest.

Version 0.3 adds browser-local career saves, functional upgrades, and serve practice. See RELEASE_NOTES.md. The original README and design bible remain historical references for the imported 0.2 prototype; index.html now contains the current game.
