const {test}=require('node:test');
const assert=require('node:assert/strict');
const Character=require('./character.js');
const Progress=require('./progression.js');
test('0.3 saves acquire an appearance while retaining earned progression',()=>{
 const old={version:1,xp:380,matches:4,wins:2,bestRally:9,bestServe:87,stats:{power:1,control:1,speed:0,iq:0}};
 const updated=Progress.normalize(old);
 assert.deepEqual(updated,{...old,character:Character.fresh()});
 assert.equal(Progress.points(updated),1);
});
test('all supported appearance options round-trip and invalid values fall back',()=>{
 for(const [key,values] of Object.entries(Character.palettes))for(const value of values)assert.equal(Character.normalize({[key]:value})[key],value);
 for(const style of Character.styles)assert.equal(Character.normalize({style}).style,style);
 for(const frame of Character.rackets)assert.equal(Character.normalize({frame}).frame,frame);
 const invalid=Character.normalize({name:' <>\u0000 ',shirt:'url(evil)',style:'invalid',skin:123});
 assert.deepEqual(invalid,Character.fresh());
 assert.equal(Character.normalize({name:'A'.repeat(99)}).name.length,18);
});
