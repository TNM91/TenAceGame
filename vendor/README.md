# Three.js

Version: 0.180.0, fetched from the official npm `three` package.
Files: unmodified `build/three.module.min.js` and `build/three.core.min.js`.
Also includes `GLTFLoader.js`, `SkeletonUtils.js`, and `BufferGeometryUtils.js` from the same package's `examples/jsm` directory. Only their import paths are changed to resolve the local vendored modules.
License: MIT; see `THREE-LICENSE.txt`.

The game serves these files locally. It has no runtime CDN dependency or build step.
Renderer reference: https://threejs.org/docs/pages/WebGLRenderer.html
