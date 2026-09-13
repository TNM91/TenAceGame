"""Build lightweight garment shells and transfer the base character's skin weights."""
import math, struct

def build(g, read, accessor, body_primitive):
    body = read(body_primitive['attributes']['POSITION'])
    joints = read(body_primitive['attributes']['JOINTS_0'])
    weights = read(body_primitive['attributes']['WEIGHTS_0'])
    trim = len(g['materials'])
    g['materials'].append({'name':'TenAce_Trim','doubleSided':True,'pbrMetallicRoughness':{'baseColorFactor':[.84,.91,.84,1],'roughnessFactor':.9,'metallicFactor':0}})

    def shell(name, rings, material, segments=32):
        # A ring is (center, horizontal axis, vertical axis, two radii).
        points=[]; ids=[]; js=[]; ws=[]
        for center,u,v,rx,rz in rings:
            for i in range(segments):
                a=2*math.pi*i/segments
                point=tuple(center[k]+rx*math.cos(a)*u[k]+rz*math.sin(a)*v[k] for k in range(3))
                points.append(point)
                nearest=sorted(range(len(body)),key=lambda n:sum((body[n][k]-point[k])**2 for k in range(3)))[:3]
                merged={}
                for n in nearest:
                    influence=1/max(.00005,sum((body[n][k]-point[k])**2 for k in range(3)))
                    for joint,weight in zip(joints[n],weights[n]):merged[joint]=merged.get(joint,0)+weight*influence
                top=sorted(merged.items(),key=lambda x:-x[1])[:4];total=sum(x[1] for x in top)
                js.extend([x[0] for x in top]+[0]*(4-len(top)));ws.extend([x[1]/total for x in top]+[0]*(4-len(top)))
        for row in range(len(rings)-1):
            for i in range(segments):
                a=row*segments+i;b=row*segments+(i+1)%segments;c=a+segments;d=b+segments
                ids.extend([a,c,b,b,c,d])
        normals=[[0.,0.,0.] for _ in points]
        for i in range(0,len(ids),3):
            a,b,c=[points[n] for n in ids[i:i+3]];u=[b[k]-a[k] for k in range(3)];v=[c[k]-a[k] for k in range(3)]
            n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]]
            for index in ids[i:i+3]:
                for k in range(3):normals[index][k]+=n[k]
        ns=[]
        for n in normals:
            length=math.sqrt(sum(x*x for x in n));ns.extend(x/max(length,1e-8) for x in n)
        def attr(values,fmt,component,kind,count):return accessor(struct.pack('<'+fmt*len(values),*values),component,count,kind)
        attributes={'POSITION':attr([x for p in points for x in p],'f',5126,'VEC3',len(points)), 'NORMAL':attr(ns,'f',5126,'VEC3',len(points)), 'JOINTS_0':attr(js,'H',5123,'VEC4',len(points)), 'WEIGHTS_0':attr(ws,'f',5126,'VEC4',len(points))}
        pa=g['accessors'][attributes['POSITION']];pa['min']=[min(p[k] for p in points) for k in range(3)];pa['max']=[max(p[k] for p in points) for k in range(3)]
        g['nodes'].append({'name':name,'mesh':len(g['meshes']),'skin':0});g['nodes'][68]['children'].append(len(g['nodes'])-1)
        g['meshes'].append({'name':name,'primitives':[{'attributes':attributes,'indices':attr(ids,'I',5125,'SCALAR',len(ids)),'material':material}]})

    def horizontal(x,y,z,rx,rz):return ((x,y,z),(1,0,0),(0,0,1),rx,rz)
    torso=[(1.005,.184,.143),(1.035,.181,.14),(1.12,.172,.139),(1.22,.186,.15),(1.34,.222,.172),(1.43,.26,.164),(1.49,.255,.142),(1.535,.185,.108),(1.575,.091,.081)]
    shell('TenAce_ShirtShell',[horizontal(0,y,-.029,rx,rz) for y,rx,rz in torso],3)
    shell('TenAce_Collar',[horizontal(0,y,-.029,rx,rz) for y,rx,rz in [(1.57,.099,.087),(1.581,.093,.082)]],trim)
    shell('TenAce_ShirtHem',[horizontal(0,y,-.029,.186,.145) for y in [1.008,1.022]],trim)
    for side in [-1,1]:
        # Sleeves overlap the shoulder shell; each has a rounded, continuous cuff.
        rings=[]
        for t,r in [(0,.107),(.3,.108),(.65,.102),(1,.091)]:
            rings.append(((side*(.245+.20*t),1.47-.10*t,-.045),(side*.438,.899,0),(0,0,1),r,r))
        shell('TenAce_Sleeve_'+str(side),rings,3)
        c,u,v,rx,rz=rings[-1]
        shell('TenAce_Cuff_'+str(side),[(c,u,v,rx+.002,rz+.002),((c[0]+side*.012,c[1]-.006,c[2]),u,v,rx+.002,rz+.002)],trim)
        shell('TenAce_ShortsShell_'+str(side),[horizontal(side*x,y,-.029,rx,rz) for y,x,rx,rz in [(.73,.113,.112,.126),(.76,.113,.115,.13),(.85,.108,.124,.148),(.94,.095,.132,.153),(1.01,.081,.115,.142)]],4)
        shell('TenAce_ShortsHem_'+str(side),[horizontal(side*.113,y,-.029,.114,.128) for y in [.73,.743]],trim)
