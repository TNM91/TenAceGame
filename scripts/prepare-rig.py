"""Prepare the CC0 Quaternius Standard downloads in .preview for TenAce.
Preserves source topology, skin weights and images. No paid assets are used.
"""
import copy, json, pathlib, struct, zipfile

OUT = pathlib.Path('assets/rigged'); OUT.mkdir(parents=True, exist_ok=True)
pack = zipfile.ZipFile('.preview/quaternius-base-standard.zip')
base = 'Universal Base Characters[Standard]/Base Characters/Godot - UE/'
g = json.loads(pack.read(base + 'Superhero_Male_FullBody.gltf'))
data = bytearray(pack.read(base + 'Superhero_Male_FullBody.bin'))

def append(raw):
    data.extend(b'\0' * (-len(data) % 4)); offset = len(data); data.extend(raw)
    g['bufferViews'].append({'buffer': 0, 'byteOffset': offset, 'byteLength': len(raw)})
    return len(g['bufferViews']) - 1

def accessor(raw, component, count, kind):
    g['accessors'].append({'bufferView': append(raw), 'componentType': component, 'count': count, 'type': kind})
    return len(g['accessors']) - 1

def read(index):
    a = g['accessors'][index]; v = g['bufferViews'][a['bufferView']]
    size = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
    fmt = {5126:'f', 5125:'I', 5123:'H', 5121:'B'}[a['componentType']]
    width = struct.calcsize('<' + fmt * size); stride = v.get('byteStride', width)
    offset = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    return [struct.unpack_from('<' + fmt * size, data, offset + i * stride) for i in range(a['count'])]

# Boundaries are assigned on existing triangles: a fitted jersey, shorts and shoes.
# Geometry and weights are retained; these are material regions, not sculpted garments.
for name, color in [('TenAce_Jersey',[.10,.36,.43,1]), ('TenAce_Shorts',[.025,.06,.09,1]), ('TenAce_Shoes',[.83,.88,.85,1])]:
    g['materials'].append({'name':name,'doubleSided':True,'pbrMetallicRoughness':{'baseColorFactor':color,'metallicFactor':0,'roughnessFactor':.85}})
body = g['meshes'][2]; p = body['primitives'][0]
positions = read(p['attributes']['POSITION']); indices = [i[0] for i in read(p['indices'])]
groups = {2:[],3:[],4:[],5:[]}
for i in range(0,len(indices),3):
    tri = indices[i:i+3]; center = [sum(positions[j][k] for j in tri)/3 for k in range(3)]
    x,y,z = center
    mat = 5 if y<.16 else 4 if .78<y<1.025 and abs(x)<.34 else 3 if 1.025<=y<1.575 and abs(x)<.47 and not (y>1.515 and abs(x)<.105) else 2
    groups[mat].extend(tri)
body['primitives'] = []
for mat, ids in groups.items():
    q = copy.deepcopy(p); q['material']=mat
    q['indices']=accessor(struct.pack('<'+'I'*len(ids),*ids),5125,len(ids),'SCALAR')
    body['primitives'].append(q)

# Merge authored hair and bind its vertices to the existing head joint.
hairpath='Universal Base Characters[Standard]/Hairstyles/Origin at 0/glTF (Godot)/'
hair=json.loads(pack.read(hairpath+'Hair_SimpleParted.gltf'))
hb=pack.read(hairpath+'Hair_SimpleParted.bin'); view_map={}
for i,v in enumerate(hair['bufferViews']):
    view_map[i]=append(hb[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']])
    if 'byteStride' in v: g['bufferViews'][-1]['byteStride']=v['byteStride']
amap={}
for i,a in enumerate(hair['accessors']):
    q=copy.deepcopy(a); q['bufferView']=view_map[a['bufferView']]; amap[i]=len(g['accessors']);g['accessors'].append(q)
hp=copy.deepcopy(hair['meshes'][0]['primitives'][0]);hp['attributes']={k:amap[v] for k,v in hp['attributes'].items()};hp['indices']=amap[hp['indices']];hp['material']=0
count=g['accessors'][hp['attributes']['POSITION']]['count']; head=g['skins'][0]['joints'].index(0)
hp['attributes']['JOINTS_0']=accessor(struct.pack('<4H',head,0,0,0)*count,5123,count,'VEC4')
hp['attributes']['WEIGHTS_0']=accessor(struct.pack('<4f',1,0,0,0)*count,5126,count,'VEC4')
g['nodes'].append({'name':'TenAce_AuthoredHair','mesh':len(g['meshes']),'skin':0});g['nodes'][68]['children'].append(len(g['nodes'])-1)
g['meshes'].append({'name':'TenAce_AuthoredHair','primitives':[hp]})

# Keep body normal detail and authored color maps. Constant roughness avoids a 3 MB map.
g['materials'][0].pop('normalTexture',None)
g['materials'][1].pop('normalTexture',None)
g['materials'][2]['pbrMetallicRoughness'].pop('metallicRoughnessTexture',None)
g['materials'][2]['pbrMetallicRoughness']['roughnessFactor']=.72
used=set()
for m in g['materials']:
    for block in [m,m.get('pbrMetallicRoughness',{})]:
        for k,v in block.items():
            if k.endswith('Texture'):used.add(v['index'])
textures=[]; images=[]; tm={}
for t in sorted(used):
    tex=copy.deepcopy(g['textures'][t]); im=copy.deepcopy(g['images'][tex['source']]); name=im.pop('uri')
    if base+name not in pack.namelist():name=name.replace('_png.png','.png')
    im['bufferView']=append(pack.read(base+name));tex['source']=len(images);images.append(im);tm[t]=len(textures);textures.append(tex)
for m in g['materials']:
    for block in [m,m.get('pbrMetallicRoughness',{})]:
        for k,v in block.items():
            if k.endswith('Texture'):v['index']=tm[v['index']]
g['textures']=textures;g['images']=images;g['buffers']=[{'byteLength':len(data)}]
g['asset']['copyright']='Base mesh, hair and textures: Quaternius, CC0. Tennis material regions: TenAce.'
def glb(doc, binary, dest):
    j=json.dumps(doc,separators=(',',':')).encode();j+=b' '*(-len(j)%4);binary+=b'\0'*(-len(binary)%4)
    dest.write_bytes(struct.pack('<III',0x46546c67,2,28+len(j)+len(binary))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(binary),0x004e4942)+binary)
glb(g,data,OUT/'tenace-athlete.glb')
(OUT/'LICENSE-character.txt').write_bytes(pack.read('Universal Base Characters[Standard]/License_Standard.txt'))

animations=zipfile.ZipFile('.preview/quaternius-animation-standard.zip')
source=animations.read('Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb')
jlen=struct.unpack_from('<I',source,12)[0];a=json.loads(source[20:20+jlen]);binary=bytearray(source[28+jlen:])
print('Available animation clips:',[x['name'] for x in a.get('animations',[])])
# Deliver only locomotion clips and their data, not the library's mannequin or combat clips.
keep=[x for x in a['animations'] if x['name'] in ['Idle_Loop','Jog_Fwd_Loop','Walk_Loop']]
ids=sorted({s[k] for clip in keep for s in clip['samplers'] for k in ['input','output']})
small=bytearray(); accessors=[]; views=[]; remap={}
for index in ids:
    old=copy.deepcopy(a['accessors'][index]);v=a['bufferViews'][old['bufferView']]
    small.extend(b'\0'*(-len(small)%4));offset=len(small)
    small.extend(binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']])
    nv={'buffer':0,'byteOffset':offset,'byteLength':v['byteLength']}
    if 'byteStride' in v:nv['byteStride']=v['byteStride']
    old['bufferView']=len(views);views.append(nv);remap[index]=len(accessors);accessors.append(old)
for clip in keep:
    for sampler in clip['samplers']:
        for k in ['input','output']:sampler[k]=remap[sampler[k]]
for node in a['nodes']:
    node.pop('mesh',None);node.pop('skin',None)
doc={'asset':a['asset'],'scene':a.get('scene',0),'scenes':a['scenes'],'nodes':a['nodes'],'animations':keep,'accessors':accessors,'bufferViews':views,'buffers':[{'byteLength':len(small)}]}
glb(doc,small,OUT/'locomotion.glb')
(OUT/'LICENSE-animation.txt').write_bytes(animations.read('Universal Animation Library[Standard]/License.txt'))
print('Character bytes:',(OUT/'tenace-athlete.glb').stat().st_size)
