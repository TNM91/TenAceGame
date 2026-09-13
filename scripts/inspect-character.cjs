// Read-only structural preflight. Does not establish visual quality, correct
// skin weights, licensing, or compatibility with TenAce's tennis animations.
const fs = require('node:fs');

function inspectCharacter(bytes) {
  if (bytes.length < 20 || bytes.toString('ascii', 0, 4) !== 'glTF') throw Error('Expected a GLB file.');
  if (bytes.readUInt32LE(4) !== 2) throw Error('Only GLB version 2 is supported.');
  if (bytes.readUInt32LE(8) !== bytes.length) throw Error('GLB length does not match the file.');
  let offset = 12, document;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) throw Error('Truncated chunk header.');
    const size = bytes.readUInt32LE(offset), type = bytes.readUInt32LE(offset + 4);
    if (size % 4 || offset + 8 + size > bytes.length) throw Error('Invalid chunk length.');
    if (offset === 12 && type !== 0x4e4f534a) throw Error('The first GLB chunk must be JSON.');
    if (type === 0x4e4f534a) {
      if (document) throw Error('Duplicate JSON chunk.');
      document = JSON.parse(bytes.toString('utf8', offset + 8, offset + 8 + size).trim());
    }
    offset += 8 + size;
  }
  if (!document || document.asset?.version !== '2.0') throw Error('Missing glTF 2.0 metadata.');
  const nodes = document.nodes || [], meshes = document.meshes || [], skins = document.skins || [];
  const materials = (document.materials || []).map((m, i) => m.name || `material_${i}`);
  const external = [...document.buffers || [], ...document.images || []].filter(r => r.uri && !r.uri.startsWith('data:'));
  const primitives = meshes.flatMap(m => m.primitives || []);
  const bound = nodes.filter(n => Number.isInteger(n.mesh) && Number.isInteger(n.skin));
  const issues = [];
  if (!meshes.length || !primitives.length) issues.push('No renderable mesh primitives.');
  if (external.length) issues.push('External resource references: request an export with embedded textures and buffers.');
  if (!bound.length) issues.push('No skinned mesh nodes: this is not yet an animated character.');
  for (const n of bound) {
    if (!skins[n.skin]?.joints?.length || !meshes[n.mesh]) {
      issues.push(`Invalid mesh/skin binding on ${n.name || 'unnamed node'}.`); continue;
    }
    for (const p of meshes[n.mesh].primitives || []) {
      if (p.attributes?.JOINTS_0 === undefined || p.attributes?.WEIGHTS_0 === undefined)
        issues.push(`Missing joint/weight attributes on ${n.name || 'unnamed node'}.`);
    }
  }
  const weighted = primitives.filter(p => p.attributes?.JOINTS_0 !== undefined && p.attributes?.WEIGHTS_0 !== undefined).length;
  const animations = (document.animations || []).map((a, i) => ({ name: a.name || `clip_${i}`, channels: a.channels?.length || 0 }));
  const review = [
    'Inspect resemblance, topology, hands, texture seams and every swing visually.',
    'Check body/garment separation and compatible skeletons before promising interchangeable outfits.',
    'Retarget tennis motion, verify racket contact and profile both players on a phone.',
    'Record model source, generation settings and usage rights before shipping.'
  ];
  if (!animations.length) review.push('No embedded animation clips; a skeleton alone does not provide tennis motion.');
  if (meshes.length === 1) review.push('Single mesh: hair and clothing may be fused. Verify whether customization requires rebuilding them.');
  if (materials.length < 2) review.push('Fewer than two materials: independent skin/hair/kit recoloring is not established.');
  if (document.extensionsRequired?.length) review.push(`Check loader support for required extensions: ${document.extensionsRequired.join(', ')}.`);
  return {
    status: issues.length ? 'needs-asset-work' : 'ready-for-manual-inspection',
    bytes: bytes.length, meshes: meshes.length, primitives: primitives.length,
    skinnedNodes: bound.length, weightedPrimitives: weighted,
    skeletons: skins.map((s, i) => ({ name: s.name || `skin_${i}`, joints: s.joints?.length || 0 })),
    materials, animations, issues, review
  };
}

if (require.main === module) {
  try {
    if (!process.argv[2]) throw Error('Usage: node scripts/inspect-character.cjs path/to/character.glb');
    const report = inspectCharacter(fs.readFileSync(process.argv[2]));
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    process.exitCode = report.issues.length ? 2 : 0;
  } catch (error) { process.stderr.write(error.message + '\n'); process.exitCode = 1; }
}
module.exports = { inspectCharacter };
