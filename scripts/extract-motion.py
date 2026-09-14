"""Extract animation tracks and node hierarchy from a Meshy GLB.

Usage: python scripts/extract-motion.py source.glb destination.glb
Does not alter source files or retarget joint transforms.
"""
import json
import struct
import sys
from pathlib import Path

def extract(source, destination):
    if source.resolve() == destination.resolve():
        raise ValueError('Use a separate output file')
    b = source.read_bytes()
    magic, version, total = struct.unpack_from('<III', b)
    if magic != 0x46546c67 or version != 2 or total != len(b):
        raise ValueError('Invalid GLB')
    jlen = struct.unpack_from('<I', b, 12)[0]
    g = json.loads(b[20:20+jlen])
    data = b[28+jlen:]
    if not g.get('animations'):
        raise ValueError('No animations')
    used = sorted({s[k] for a in g['animations'] for s in a['samplers'] for k in ['input', 'output']})
    amap = {n:i for i,n in enumerate(used)}
    views = sorted({g['accessors'][i]['bufferView'] for i in used})
    vmap = {n:i for i,n in enumerate(views)}
    binary, outviews = bytearray(), []
    for n in views:
        v = g['bufferViews'][n]
        off = v.get('byteOffset', 0)
        if v['buffer'] != 0 or off + v['byteLength'] > len(data):
            raise ValueError('Unsupported buffer')
        outviews.append({**v, 'buffer':0, 'byteOffset':len(binary)})
        binary += data[off:off+v['byteLength']]
        binary += b'\0' * ((-len(binary)) % 4)
    acc = [{**g['accessors'][n], 'bufferView':vmap[g['accessors'][n]['bufferView']]} for n in used]
    for a in g['animations']:
        for s in a['samplers']:
            for k in ['input', 'output']:
                s[k] = amap[s[k]]
    for n in g['nodes']:
        n.pop('mesh', None)
        n.pop('skin', None)
    out = {k:g[k] for k in ['asset', 'scene', 'scenes', 'nodes', 'animations'] if k in g}
    out.update(accessors=acc, bufferViews=outviews, buffers=[{'byteLength':len(binary)}])
    j = json.dumps(out, separators=(',', ':')).encode()
    j += b' ' * ((-len(j)) % 4)
    destination.write_bytes(struct.pack('<III', magic, 2, 28+len(j)+len(binary)) + struct.pack('<II', len(j), 0x4e4f534a) + j + struct.pack('<II', len(binary), 0x004e4942) + binary)
    print(f'{destination}: {destination.stat().st_size} bytes')

if __name__ == '__main__':
    extract(Path(sys.argv[1]), Path(sys.argv[2]))
