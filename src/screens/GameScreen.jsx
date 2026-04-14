import { useRef, useState, useEffect, useCallback } from 'react';
import EncounterModal from '../components/EncounterModal';
import { TRAITS, SCENES, BLDGS, GND, ARCHS, NAMES, NCOLS, WEATHERS, DAY_EVENTS, MOODS, BOND_DEPTHS } from '../constants';

const TID = TRAITS.map(t => t.id);
const T = 40; // isometric tile size

// ── Pure drawing helpers ──────────────────────────────────────────────────────

function s2w(gx, gy, CW, CH) {
  return { x: CW/2 + (gx - gy)*T, y: CH*0.4 + (gx + gy)*T*0.5 };
}
function lhx(a, b, t) {
  const ah=[parseInt(a.slice(1,3),16),parseInt(a.slice(3,5),16),parseInt(a.slice(5,7),16)];
  const bh=[parseInt(b.slice(1,3),16),parseInt(b.slice(3,5),16),parseInt(b.slice(5,7),16)];
  return '#'+ah.map((v,i)=>Math.round(v+(bh[i]-v)*t).toString(16).padStart(2,'0')).join('');
}
function gcol(gx, gy, dn) {
  const nt=Math.max(0,Math.min(1,(dn-.6)*4));
  const v=(Math.sin(gx*1.4+gy*.8)*.5+.5)*.05;
  const b=Math.round((12+v*8)*(1-nt*.35));
  return `rgb(${b},${b},${Math.round(b*1.8-nt*2)})`;
}
function skyCol(dn) {
  const h=dn*24;
  if(h<6)  return['#01010a','#03031a'];
  if(h<8)  {const f=(h-6)/2; return[lhx('#01010a','#0a0818',f),lhx('#03031a','#121030',f)];}
  if(h<12) {const f=(h-8)/4; return[lhx('#0a0818','#06060e',f),lhx('#121030','#0e0d20',f)];}
  if(h<18) return['#06060e','#0e0d20'];
  if(h<20) {const f=(h-18)/2; return[lhx('#06060e','#08061a',f),lhx('#0e0d20','#110e2a',f)];}
  return['#08061a','#110e2a'];
}
function face(ctx, pts, f) {
  ctx.beginPath();
  pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
  ctx.closePath(); ctx.fillStyle=f; ctx.fill();
}
function dTile(ctx, gx, gy, tc, sc, dc, h, CW, CH) {
  const HH=(h||0)*14, p=s2w(gx,gy,CW,CH);
  const top=[{x:p.x,y:p.y-HH},{x:p.x+T,y:p.y+T*.5-HH},{x:p.x,y:p.y+T-HH},{x:p.x-T,y:p.y+T*.5-HH}];
  const rt= [{x:p.x+T,y:p.y+T*.5-HH},{x:p.x,y:p.y+T-HH},{x:p.x,y:p.y+T},{x:p.x+T,y:p.y+T*.5}];
  const lt= [{x:p.x-T,y:p.y+T*.5-HH},{x:p.x,y:p.y+T-HH},{x:p.x,y:p.y+T},{x:p.x-T,y:p.y+T*.5}];
  face(ctx,lt,dc||'#0a0a18'); face(ctx,rt,sc||'#0e0e22'); face(ctx,top,tc||'#181830');
  ctx.strokeStyle='rgba(83,74,183,.05)'; ctx.lineWidth=.4;
  ctx.beginPath(); top.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)); ctx.closePath(); ctx.stroke();
}
function dGnd(ctx, gx, gy, dn, CW, CH) {
  const p=s2w(gx,gy,CW,CH);
  const pts=[{x:p.x,y:p.y},{x:p.x+T,y:p.y+T*.5},{x:p.x,y:p.y+T},{x:p.x-T,y:p.y+T*.5}];
  ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
  ctx.closePath(); ctx.fillStyle=gcol(gx,gy,dn); ctx.fill();
  ctx.strokeStyle='rgba(83,74,183,.04)'; ctx.lineWidth=.3; ctx.stroke();
}
function dScene(ctx, sc, ts, dn, visited, prt, CW, CH) {
  const HH=sc.h*14, p=s2w(sc.gx,sc.gy,CW,CH), cx=p.x, cy=p.y+T*.5-HH;
  dTile(ctx,sc.gx,sc.gy,sc.col+'55',sc.col+'33',sc.col+'22',sc.h,CW,CH);
  if(!visited.has(sc.id)){
    const pulse=.45+.36*Math.sin(ts*.0018+sc.gx);
    ctx.beginPath(); ctx.arc(cx,cy,22+3*Math.sin(ts*.0022),0,Math.PI*2);
    ctx.fillStyle=sc.col; ctx.globalAlpha=pulse*.2*(prt/80); ctx.fill(); ctx.globalAlpha=1;
    ctx.font=`700 8px 'Space Mono',monospace`; ctx.textAlign='center';
    ctx.fillStyle=sc.col; ctx.globalAlpha=.82; ctx.fillText(sc.label,cx,cy-22); ctx.globalAlpha=1;
  } else {
    ctx.font=`400 7px 'Space Mono',monospace`; ctx.textAlign='center';
    ctx.fillStyle='rgba(83,74,183,.32)'; ctx.fillText('visited',cx,cy-8);
  }
}
function dNPC(ctx, n, ts, dn, npcs, PL, socR, prt, matchScoreFn, CW, CH) {
  const p=s2w(n.gx,n.gy,CW,CH), sx=p.x, sy=p.y+T*.5-3, sc=.7;
  const pulse=Math.sin(ts*.001+n.phase), nd=dn>.7||dn<.1?.6:1;
  if(n.bonded&&n.bondWith&&n.bondWith!=='player'){
    const other=npcs.find(o=>o.id===n.bondWith);
    if(other){
      const op=s2w(other.gx,other.gy,CW,CH);
      ctx.beginPath(); ctx.moveTo(sx,sy-10); ctx.lineTo(op.x,op.y+T*.5-10);
      const lg=ctx.createLinearGradient(sx,sy,op.x,op.y);
      const lc=n.bondType==='mutual'?'rgba(93,202,165,':'rgba(216,90,48,';
      lg.addColorStop(0,lc+'.22)'); lg.addColorStop(1,lc+'.04)');
      ctx.strokeStyle=lg; ctx.lineWidth=.7;
      ctx.setLineDash(n.bondType==='mutual'?[3,3]:[2,4]); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  // Visible emotion aura — the city's mood layer
  dMoodAura(ctx, sx, sy-8*sc, n.emotion||'calm', ts, 26*sc);
  const aCol=n.bonded?(n.bondType==='mutual'?'#5DCAA5':'#D85A30'):n.col;
  ctx.beginPath(); ctx.ellipse(sx,sy+17*sc,13*sc,5.5*sc,0,0,Math.PI*2);
  ctx.fillStyle=aCol; ctx.globalAlpha=nd*(.09+pulse*.04*(prt/80)); ctx.fill(); ctx.globalAlpha=1;
  const ms=matchScoreFn(n), sr=socR===1?2:socR===3?4:3;
  if(Math.hypot(PL.gx-n.gx,PL.gy-n.gy)<sr&&!n.bonded){
    const mc=ms.total;
    if(Math.abs(mc)>0){
      ctx.beginPath(); ctx.arc(sx,sy-8,16+4*pulse,0,Math.PI*2);
      ctx.strokeStyle=mc>0?'rgba(93,202,165,.25)':'rgba(216,90,48,.25)'; ctx.lineWidth=1; ctx.stroke();
    }
  }
  ctx.fillStyle=n.col; ctx.globalAlpha=nd;
  ctx.beginPath(); ctx.arc(sx,sy-18*sc,5*sc,0,Math.PI*2); ctx.fill();
  ctx.fillRect(sx-4.5*sc,sy-13*sc,9*sc,16*sc);
  ctx.fillRect(sx-5.5*sc,sy+3*sc,4*sc,9*sc);
  ctx.fillRect(sx+1.5*sc,sy+3*sc,4*sc,9*sc);
  ctx.globalAlpha=1;
  if(n.tag&&n.tagT>210){
    const tw=n.tag.length*5+10;
    ctx.globalAlpha=.88; ctx.fillStyle='rgba(2,2,10,.9)';
    if(ctx.roundRect) ctx.roundRect(sx-tw/2,sy-32,tw,11,3); else ctx.rect(sx-tw/2,sy-32,tw,11);
    ctx.fill(); ctx.fillStyle=n.col; ctx.font=`700 6.5px 'Space Mono',monospace`;
    ctx.textAlign='center'; ctx.fillText(n.tag,sx,sy-24); ctx.globalAlpha=1;
  }
  if(n.react){
    const prg=Math.min((ts-n.reactT)/700,1);
    ctx.beginPath(); ctx.arc(sx,sy-8,8+18*prg,0,Math.PI*2);
    ctx.strokeStyle=n.col; ctx.lineWidth=.8; ctx.globalAlpha=(1-prg)*.5; ctx.stroke(); ctx.globalAlpha=1;
    if(prg>=1) n.react=false;
  }
}
function dPlayer(ctx, PL, ts, traits, playerEmotion, CW, CH) {
  const p=s2w(PL.gx,PL.gy,CW,CH), sx=p.x, sy=p.y+T*.5-3;
  dMoodAura(ctx, sx, sy-10, playerEmotion||'lonely', ts, 36);
  PL.tr.push({x:sx,y:sy,a:.5});
  if(PL.tr.length>16) PL.tr.shift();
  PL.tr.forEach((t,i)=>{
    ctx.beginPath(); ctx.arc(t.x,t.y,2,0,Math.PI*2);
    ctx.fillStyle='#5DCAA5'; ctx.globalAlpha=t.a*(i/PL.tr.length)*.4; ctx.fill(); ctx.globalAlpha=1;
    t.a*=.86;
  });
  const pl=.92+.08*Math.sin(ts*.003);
  ctx.beginPath(); ctx.ellipse(sx,sy+20,18,8,0,0,Math.PI*2);
  ctx.fillStyle='rgba(93,202,165,0.15)'; ctx.fill();
  ctx.fillStyle='#5DCAA5';
  ctx.beginPath(); ctx.arc(sx,sy-21,8*pl,0,Math.PI*2); ctx.fill();
  ctx.fillRect(sx-9,sy-14,18,22); ctx.fillRect(sx-10,sy+8,7,13); ctx.fillRect(sx+3,sy+8,7,13);
  ctx.fillStyle='rgba(2,2,10,.9)'; ctx.font=`700 7px 'Space Mono',monospace`;
  ctx.textAlign='center'; ctx.fillText('YOU',sx,sy-33);
  if(traits.al.length>0){
    ctx.fillStyle='rgba(93,202,165,.55)'; ctx.font=`400 6px 'Space Mono',monospace`;
    ctx.fillText(traits.al[0].toUpperCase(),sx,sy-25);
  }
}
function mkNPC(i) {
  const ints=TID.filter(()=>Math.random()>.55).slice(0,3);
  const reps=TID.filter(x=>!ints.includes(x)&&Math.random()>.7).slice(0,2);
  const gx=-6+Math.random()*12, gy=-5+Math.random()*11;
  return{id:'n'+i,name:NAMES[i%NAMES.length],gx,gy,tx:gx+(Math.random()-.5)*4,ty:gy+(Math.random()-.5)*4,
    spd:.004+Math.random()*.004,col:NCOLS[i%NCOLS.length],ints,reps,tag:ints[0]||null,tagT:Math.floor(Math.random()*200),
    react:false,reactT:0,bonded:false,bondWith:null,bondType:null,state:'wander',stateT:0,
    mood:Math.random()>.5?'open':'closed',protocol:Math.random()>.4?'comply':'refuse',
    emotion:MOODS[Math.floor(Math.random()*MOODS.length)].id,moodTimer:Math.floor(Math.random()*2000),
    phase:Math.random()*Math.PI*2,clusterTarget:null,bondDepth:0};
}
function timeStr(m){const h=Math.floor(m/60)%24,mm=Math.floor(m%60);return String(h).padStart(2,'0')+':'+String(mm).padStart(2,'0');}

// Soft radial glow representing a person's visible emotional state
function dMoodAura(ctx, sx, sy, emotionId, ts, radius) {
  const mood = MOODS.find(m=>m.id===emotionId);
  if(!mood) return;
  const pulse = 0.5+0.5*Math.sin(ts*.0009+sx*.05);
  const r = radius*(0.85+0.15*pulse);
  const grd = ctx.createRadialGradient(sx,sy,r*.08,sx,sy,r);
  grd.addColorStop(0, mood.col+'44');
  grd.addColorStop(.5, mood.col+'1a');
  grd.addColorStop(1,  mood.col+'00');
  ctx.beginPath(); ctx.arc(sx,sy,r,0,Math.PI*2);
  ctx.fillStyle=grd; ctx.fill();
}

// Vibe heatmap — soft mood glow pooling on the ground where emotions cluster
function dVibeHeatmap(ctx, npcs, ts, CW, CH) {
  ctx.save(); ctx.globalCompositeOperation='screen';
  npcs.forEach(n=>{
    const mood=MOODS.find(m=>m.id===n.emotion); if(!mood)return;
    const p=s2w(n.gx,n.gy,CW,CH),cx=p.x,cy=p.y+T*.5,r=T*3.8;
    const pulse=.6+.4*Math.sin(ts*.0006+n.phase);
    const grd=ctx.createRadialGradient(cx,cy,0,cx,cy,r*pulse);
    grd.addColorStop(0,mood.col+'22'); grd.addColorStop(.55,mood.col+'0b'); grd.addColorStop(1,mood.col+'00');
    ctx.beginPath(); ctx.arc(cx,cy,r*pulse,0,Math.PI*2); ctx.fillStyle=grd; ctx.fill();
  });
  ctx.restore();
}

// Resonance clusters — visible ring when 3+ people share the same mood nearby
function dResonanceClusters(ctx, npcs, ts, CW, CH) {
  const seen=new Set();
  npcs.forEach(anchor=>{
    if(seen.has(anchor.id))return;
    const cluster=npcs.filter(n=>n.emotion===anchor.emotion&&Math.hypot(n.gx-anchor.gx,n.gy-anchor.gy)<3.2);
    if(cluster.length<3)return;
    cluster.forEach(n=>seen.add(n.id));
    const cgx=cluster.reduce((s,n)=>s+n.gx,0)/cluster.length;
    const cgy=cluster.reduce((s,n)=>s+n.gy,0)/cluster.length;
    const mood=MOODS.find(m=>m.id===anchor.emotion); if(!mood)return;
    const pp=s2w(cgx,cgy,CW,CH),r=24+cluster.length*6;
    const pulse=.5+.5*Math.abs(Math.sin(ts*.0009+cgx));
    ctx.beginPath(); ctx.arc(pp.x,pp.y+T*.5,r,0,Math.PI*2);
    ctx.strokeStyle=mood.col; ctx.lineWidth=1.2; ctx.globalAlpha=pulse*.38; ctx.stroke();
    ctx.globalAlpha=pulse*.05; ctx.fillStyle=mood.col; ctx.fill(); ctx.globalAlpha=1;
    ctx.font=`700 6px 'Space Mono',monospace`; ctx.textAlign='center';
    ctx.fillStyle=mood.col; ctx.globalAlpha=pulse*.62;
    ctx.fillText(mood.label+' ×'+cluster.length,pp.x,pp.y+T*.5-r-5); ctx.globalAlpha=1;
  });
}

// Small compass cell helper
function CompassCell({d,a}){
  if(!d)return <div className="vcx"/>;
  return(<div className="vcd" style={{background:d.col+'14',color:d.col,borderColor:d.col+'2e'}}><span className="vca">{a}</span><span className="vcl">{d.label.slice(0,3)}</span></div>);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GameScreen({ visible, config, onEnd }) {
  const canvasRef = useRef(null);

  // React state — UI only
  const [hud, setHud] = useState({
    time:'06:00',zones:'0/5',bonds:0,pressure:30,legibility:50,events:0,
    comply:0,refuse:0,subvert:0,archetype:'THE WANDERER',archetypeColor:'rgba(175,169,236,.5)',
    dayPct:0,dayColor:'#534AB7',compPct:0,refPct:0,subPct:0,
    cityEmotion:'LONELY',cityEmotionCol:'#534AB7',
    vibeDist:[],vibeCompass:{n:null,s:null,e:null,w:null},
  });
  const [encounter, setEncounter] = useState(null);
  const [feed, setFeed] = useState([]);
  const [bonds, setBonds] = useState([]);
  const [keysDown, setKeysDown] = useState({w:false,a:false,s:false,d:false});
  const [ambientMsg, setAmbientMsg] = useState(null);
  const [heatmapOn, setHeatmapOn] = useState(true);
  const heatmapRef = useRef(true);

  // Stable ref so modal callbacks always call current loop functions
  const cbRef = useRef({ handleChoice:()=>{}, handleBond:()=>{}, closeEncounter:()=>{} });

  // Stable callbacks to pass to modal (don't change reference)
  const onChoice  = useCallback((sc,ch)      => cbRef.current.handleChoice(sc,ch), []);
  const onBond    = useCallback((n,t,a,r)    => cbRef.current.handleBond(n,t,a,r), []);
  const onClose   = useCallback(()           => cbRef.current.closeEncounter(), []);

  const onEndRef = useRef(onEnd);
  useEffect(()=>{ onEndRef.current=onEnd; },[onEnd]);

  // encOpen mirror
  const encOpenRef = useRef(false);
  useEffect(()=>{ encOpenRef.current = encounter!==null; },[encounter]);

  // ── Game loop (runs once when visible) ────────────────────────────────────
  useEffect(()=>{
    if(!visible) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let CW=0, CH=0;

    function rsz(){
      const dpr=window.devicePixelRatio||1;
      CW=canvas.offsetWidth; CH=canvas.offsetHeight;
      canvas.width=CW*dpr; canvas.height=CH*dpr;
      ctx.scale(dpr,dpr);
    }
    rsz();
    window.addEventListener('resize',rsz);

    // Mutable game state
    const GS={comply:0,refuse:0,subvert:0,leg:50,prs:30,visited:new Set(),visitCount:{},
      bonds:[],rituals:[],events:0,gameOver:false,prt:config.prt,simSpd:config.spd,socR:config.socR};
    const PL={gx:0,gy:0,tx:0,ty:0,mv:false,tr:[],spd:.1};
    const K={w:false,a:false,s:false,d:false};
    const cam={x:0,y:0};
    let npcs=[],rings=[],sparks=[],floats=[];
    let dayMinutes=360,weather='clear',wTimer=0,wNext=600,rainD=[];
    let firedEvs=new Set(),evCount=0,nearCool=0,lastNear=null,frameCount=0;

    for(let i=0;i<config.pop;i++) npcs.push(mkNPC(i));

    // Helpers
    function addRings(sx,sy,col,n){for(let i=0;i<(n||2);i++) rings.push({x:sx+(Math.random()-.5)*14,y:sy+(Math.random()-.5)*6,r:4+i*7,mR:55+i*12,a:.7,col,sp:1.3+Math.random()*.6});}
    function addSparks(sx,sy,col){for(let i=0;i<5;i++) sparks.push({x:sx,y:sy,vx:(Math.random()-.5)*2,vy:-Math.random()*2-.4,a:.9,r:1+Math.random()*1.5,col});}
    function addFloat(sx,sy,txt,col){floats.push({x:sx,y:sy,txt,col,a:1,vy:-.7,life:110});}
    function pushFeed(txt){setFeed(p=>[{id:Date.now()+Math.random(),txt},...p].slice(0,7));}
    function showAmbient(txt){setAmbientMsg(txt); setTimeout(()=>setAmbientMsg(null),2200);}
    function initRain(){rainD=[];for(let i=0;i<60;i++) rainD.push({x:Math.random()*CW,y:Math.random()*CH,spd:3+Math.random()*2,a:Math.random()*.4+.1});}

    function getPlayerEmotion(){
      if(GS.bonds.length>=3) return 'joyful';
      if(GS.prs>70) return 'anxious';
      if(GS.refuse>GS.comply+GS.subvert&&GS.refuse>2) return 'melancholic';
      if(GS.subvert>GS.comply+GS.refuse&&GS.subvert>1) return 'curious';
      if(GS.comply>GS.refuse+GS.subvert&&GS.comply>1) return 'calm';
      return 'lonely';
    }
    function getCityEmotion(){
      const counts={};
      npcs.forEach(n=>{counts[n.emotion]=(counts[n.emotion]||0)+1;});
      const top=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
      return top?top[0]:'calm';
    }

    function matchScore(npc){
      const pt=config.traits; let m=0,cl=0;
      npc.ints.forEach(i=>{if(pt.al.includes(i))m++;if(pt.rp.includes(i))cl++;});
      npc.reps.forEach(r=>{if(pt.al.includes(r))cl++;if(pt.rp.includes(r))m++;});
      return{mutual:m,clash:cl,total:m-cl};
    }
    function getArch(){
      const{comply:c,refuse:r,subvert:s}=GS,total=c+r+s||1;
      if(s/total>.45) return ARCHS.glitch;
      if(c/total>.5)  return ARCHS.legible;
      if(r/total>.45) return ARCHS.ghost;
      return ARCHS.neg;
    }
    function computeVibeCompass(){
      const dirs={n:[],s:[],e:[],w:[]};
      npcs.forEach(n=>{
        const dx=n.gx-PL.gx,dy=n.gy-PL.gy,dist=Math.hypot(dx,dy);
        if(dist<0.5||dist>12)return;
        if(Math.abs(dy)>Math.abs(dx)){if(dy<0)dirs.n.push(n.emotion);else dirs.s.push(n.emotion);}
        else{if(dx>0)dirs.e.push(n.emotion);else dirs.w.push(n.emotion);}
      });
      function dom(arr){
        if(!arr.length)return null;
        const c={};arr.forEach(e=>{c[e]=(c[e]||0)+1;});
        const top=Object.entries(c).sort((a,b)=>b[1]-a[1])[0];
        const mood=MOODS.find(m=>m.id===top[0]);
        return mood?{col:mood.col,label:mood.label,count:top[1]}:null;
      }
      return{n:dom(dirs.n),s:dom(dirs.s),e:dom(dirs.e),w:dom(dirs.w)};
    }
    function buildHud(){
      const{comply:c,refuse:r,subvert:s}=GS,mx=Math.max(c,r,s,1),arch=getArch();
      const tp=dayMinutes/1440;
      let tc='#534AB7';
      if(tp<.25)tc='#3C3489';else if(tp<.5)tc='#5DCAA5';else if(tp<.75)tc='#BA7517';
      const ce=getCityEmotion(), cmood=MOODS.find(m=>m.id===ce)||MOODS[3];
      const ec={};npcs.forEach(n=>{ec[n.emotion]=(ec[n.emotion]||0)+1;});
      const tn=npcs.length||1;
      const vibeDist=MOODS.map(m=>({...m,pct:Math.round(((ec[m.id]||0)/tn)*100)})).filter(m=>m.pct>0).sort((a,b)=>b.pct-a.pct).slice(0,5);
      return{time:timeStr(dayMinutes),zones:GS.visited.size+'/5',bonds:GS.bonds.length,
        pressure:Math.round(GS.prs),legibility:Math.round(GS.leg),events:evCount,
        comply:c,refuse:r,subvert:s,archetype:arch.n,archetypeColor:arch.c,
        dayPct:tp*100,dayColor:tc,compPct:Math.round(c/mx*100),refPct:Math.round(r/mx*100),subPct:Math.round(s/mx*100),
        cityEmotion:cmood.label,cityEmotionCol:cmood.col,vibeDist,vibeCompass:computeVibeCompass()};
    }

    function addBond(npc,type){
      if(!GS.bonds.find(b=>b.id===npc.id)){
        GS.bonds.push({id:npc.id,name:npc.name,col:npc.col,type,depth:0,emotion:npc.emotion});
        npc.bonded=true; npc.bondWith='player'; npc.bondType=type; npc.bondDepth=0;
        setBonds([...GS.bonds]);
      }
    }

    function closeEncounter(){setEncounter(null); nearCool=120;}

    function handleChoice(sc,ch){
      GS.comply+=ch.dc; GS.refuse+=ch.dr; GS.subvert+=ch.ds;
      GS.leg=Math.max(0,Math.min(100,GS.leg+ch.l));
      GS.prs=Math.max(0,Math.min(100,GS.prs+ch.p));
      GS.visitCount[sc.id]=(GS.visitCount[sc.id]||0)+1;
      npcs.filter(n=>Math.hypot(n.gx-sc.gx,n.gy-sc.gy)<3).slice(0,3).forEach(n=>{n.react=true;n.reactT=performance.now();});
      const pp=s2w(sc.gx,sc.gy,CW,CH);
      addRings(pp.x,pp.y+T*.5-sc.h*14,sc.col,ch.y==='b'?4:2);
      addFloat(pp.x,pp.y+T*.5-sc.h*14-20,ch.b,ch.y==='b'?'#F09595':ch.y==='g'?'#9FE1CB':'#AFA9EC');
      pushFeed(sc.label+': '+ch.b);
      setHud(buildHud());
      setEncounter(prev=>prev?{...prev,visited:new Set(GS.visited)}:null);
      if(GS.visited.size>=SCENES.length&&!GS.gameOver){
        setTimeout(()=>{closeEncounter(); endGame();},2400);
      }
    }

    function handleBond(npc,type,act,ritual){
      if(act&&act.e==='c'){GS.prs=Math.max(0,GS.prs-5); addBond(npc,'mutual');}
      else if(act&&act.e==='r'){GS.subvert++; addBond(npc,'clash');}
      if(ritual){
        if(ritual.id==='silence')   GS.prs=Math.max(0,GS.prs-12);
        if(ritual.id==='broadcast') GS.leg=Math.min(100,GS.leg+15);
        if(ritual.id==='aura_swap'){GS.subvert++;GS.prs=Math.max(0,GS.prs-6);}
        if(ritual.id==='void_walk'){GS.refuse++;GS.leg=Math.max(0,GS.leg-10);}
        GS.rituals.push(ritual.id);
        addBond(npc,'mutual');
        const pp=s2w(npc.gx,npc.gy,CW,CH);
        addRings(pp.x,pp.y+T*.5,'#7F77DD',4);
        addSparks(pp.x,pp.y+T*.5,'#7F77DD');
        addFloat(pp.x,pp.y+T*.5-25,ritual.n,'#AFA9EC');
        pushFeed('Ritual: '+ritual.n+' with '+npc.name);
      }
      npc.react=true; npc.reactT=performance.now();
      nearCool=150;
      setHud(buildHud());
    }

    function endGame(){
      GS.gameOver=true;
      onEndRef.current({arch:getArch(),comply:GS.comply,refuse:GS.refuse,subvert:GS.subvert,
        bonds:GS.bonds,rituals:GS.rituals.length,events:evCount});
    }

    function openZone(sc){
      if(encOpenRef.current||GS.gameOver) return;
      GS.visited.add(sc.id);
      setEncounter({type:'zone',scene:sc,visitCount:GS.visitCount[sc.id]||0,visited:new Set(GS.visited)});
      const pp=s2w(sc.gx,sc.gy,CW,CH);
      addRings(pp.x,pp.y+T*.5-sc.h*14,sc.col,3);
      addSparks(pp.x,pp.y+T*.5-sc.h*14,sc.col);
      pushFeed('Entered: '+sc.label);
      nearCool=200;
    }

    function clickNPC(npc){
      if(encOpenRef.current||GS.gameOver) return;
      setEncounter({type:'npc',npc,matchScore:matchScore(npc)});
      const pp=s2w(npc.gx,npc.gy,CW,CH);
      addRings(pp.x,pp.y+T*.5,npc.col,2);
      pushFeed('Nearby: '+npc.name);
      nearCool=200;
    }

    // Expose callbacks to modal via stable ref
    cbRef.current = { handleChoice, handleBond, closeEncounter };

    // Keyboard
    function onKD(e){
      const k=e.key.toLowerCase();
      if(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].includes(k)) e.preventDefault();
      if(k==='w'||k==='arrowup')   K.w=true;
      if(k==='a'||k==='arrowleft') K.a=true;
      if(k==='s'||k==='arrowdown') K.s=true;
      if(k==='d'||k==='arrowright')K.d=true;
      if(k==='h'){heatmapRef.current=!heatmapRef.current;setHeatmapOn(heatmapRef.current);}
      setKeysDown({...K});
    }
    function onKU(e){
      const k=e.key.toLowerCase();
      if(k==='w'||k==='arrowup')   K.w=false;
      if(k==='a'||k==='arrowleft') K.a=false;
      if(k==='s'||k==='arrowdown') K.s=false;
      if(k==='d'||k==='arrowright')K.d=false;
      setKeysDown({...K});
    }
    window.addEventListener('keydown',onKD);
    window.addEventListener('keyup',onKU);

    function onCanvasClick(e){
      if(encOpenRef.current) return;
      const r=canvas.getBoundingClientRect();
      const mx=e.clientX-r.left-cam.x, my=e.clientY-r.top-cam.y;
      for(const sc of SCENES){
        const p=s2w(sc.gx,sc.gy,CW,CH);
        if(Math.hypot(mx-p.x,my-(p.y+T*.5-sc.h*14))<T*1.5){PL.tx=sc.gx;PL.ty=sc.gy;PL.mv=true;return;}
      }
      for(const n of npcs){
        const p=s2w(n.gx,n.gy,CW,CH);
        if(Math.hypot(mx-p.x,my-(p.y+T*.5))<20){clickNPC(n);return;}
      }
      const ix=(mx-CW/2)/T, iy=(my-CH*.4)/(T*.5);
      PL.tx=Math.round((ix+iy)/2); PL.ty=Math.round((iy-ix)/2); PL.mv=true;
    }
    canvas.addEventListener('click',onCanvasClick);

    function tickNPC(n,dt){
      n.stateT+=dt;
      if(n.state==='wander'){if(n.stateT>2000+Math.random()*3000){n.tx=-6+Math.random()*12;n.ty=-5+Math.random()*11;n.stateT=0;if(Math.random()>.7)n.state='cluster';}}
      else if(n.state==='cluster'){const near=npcs.filter(o=>o.id!==n.id&&Math.hypot(o.gx-n.gx,o.gy-n.gy)<5);if(near.length>0&&!n.clusterTarget){const tgt=near[Math.floor(Math.random()*near.length)];n.clusterTarget=tgt.id;n.tx=tgt.gx+(Math.random()-.5)*.8;n.ty=tgt.gy+(Math.random()-.5)*.8;}if(n.stateT>4000){n.state='wander';n.stateT=0;n.clusterTarget=null;}}
      else if(n.state==='idle'){if(n.stateT>1500+Math.random()*2000){n.state='wander';n.stateT=0;}}
      const dx=n.tx-n.gx,dy=n.ty-n.gy,dist=Math.hypot(dx,dy);
      const spd=n.spd*(1+(GS.prt-50)/200)*(GS.simSpd/4);
      if(dist>.15){n.gx+=dx*spd;n.gy+=dy*spd;}else{n.stateT+=2000;}
      n.gx=Math.max(-8,Math.min(9,n.gx));n.gy=Math.max(-6,Math.min(9,n.gy));
      if(!n.bonded&&Math.random()>.998){
        const near=npcs.filter(o=>o.id!==n.id&&!o.bonded&&Math.hypot(o.gx-n.gx,o.gy-n.gy)<1.5);
        if(near.length){const other=near[0];const shared=n.ints.filter(i=>other.ints.includes(i));
          if(shared.length>0){const btype=Math.random()>.3?'mutual':'clash';n.bonded=true;n.bondWith=other.id;n.bondType=btype;other.bonded=true;other.bondWith=n.id;other.bondType=btype;pushFeed((btype==='mutual'?'Bond':'Clash')+': '+n.name+'+'+other.name);}}
      }
      n.tagT++;if(n.tagT>320)n.tagT=0;
      // Mood spreading — player's emotion ripples outward to nearby people
      n.moodTimer=(n.moodTimer||0)+dt;
      if(n.moodTimer>3500+Math.random()*3000){
        n.moodTimer=0;
        const pd=Math.hypot(PL.gx-n.gx,PL.gy-n.gy);
        if(pd<2.5){
          const pe=getPlayerEmotion();
          if(pe!==n.emotion&&Math.random()>.5){
            n.emotion=pe;
            const pp=s2w(n.gx,n.gy,CW,CH);
            const mc=MOODS.find(m=>m.id===pe);
            addFloat(pp.x,pp.y+T*.5-28,mc?mc.label:pe,mc?mc.col:'#AFA9EC');
          }
        } else if(pd>4&&Math.random()>.68){
          // Emotions drift when far from player
          n.emotion=MOODS[Math.floor(Math.random()*MOODS.length)].id;
        }
      }
      // Deepen bond when player stays near a bonded NPC
      if(n.bonded&&n.bondWith==='player'&&Math.hypot(PL.gx-n.gx,PL.gy-n.gy)<1.8){
        if(Math.random()>.9995&&n.bondDepth<3){
          n.bondDepth=Math.min(3,n.bondDepth+1);
          const pp=s2w(n.gx,n.gy,CW,CH);
          addFloat(pp.x,pp.y+T*.5-28,BOND_DEPTHS[n.bondDepth],'#5DCAA5');
          pushFeed(n.name+' → '+BOND_DEPTHS[n.bondDepth]);
          // Update bond depth in GS.bonds
          const gb=GS.bonds.find(b=>b.id===n.id);
          if(gb) gb.depth=n.bondDepth;
          setBonds([...GS.bonds]);
        }
      }
    }

    function dRain(){
      if(weather!=='rain') return;
      ctx.strokeStyle='rgba(150,160,255,.18)';ctx.lineWidth=1;
      rainD.forEach(rd=>{ctx.beginPath();ctx.moveTo(rd.x,rd.y);ctx.lineTo(rd.x-1,rd.y+8);ctx.globalAlpha=rd.a;ctx.stroke();ctx.globalAlpha=1;rd.y+=rd.spd*2;rd.x-=.5;if(rd.y>CH){rd.y=0;rd.x=Math.random()*CW;}});
    }
    function dFog(dn){
      if(weather!=='fog'&&dn<.6&&dn>.12) return;
      const al=weather==='fog'?.16:(dn>.7||dn<.1)?.1:0;
      if(al>0){ctx.fillStyle=`rgba(80,70,160,${al})`;ctx.fillRect(0,0,CW,CH);}
    }

    let lastT=0, rafId;
    function loop(ts){
      rafId=requestAnimationFrame(loop);
      const dt=Math.min(ts-lastT,50); lastT=ts; frameCount++;
      const dayRate=GS.simSpd/4*.0004;
      dayMinutes=(dayMinutes+dt*dayRate*20)%1440;
      const dn=dayMinutes/1440;
      DAY_EVENTS.forEach(ev=>{if(!firedEvs.has(ev.id)&&dayMinutes>=ev.t&&dayMinutes<ev.t+5){firedEvs.add(ev.id);pushFeed(ev.msg);showAmbient(ev.msg);evCount++;}});
      if(dayMinutes<5&&firedEvs.size>0) firedEvs.clear();
      wTimer+=dt;if(wTimer>wNext){wTimer=0;wNext=8000+Math.random()*15000;const wl=WEATHERS.filter(w=>w!==weather);weather=wl[Math.floor(Math.random()*wl.length)];pushFeed('Weather: '+weather.toUpperCase());if(weather==='rain')initRain();}
      if(!encOpenRef.current){
        const spd=GS.simSpd*.007;
        if(K.w){PL.gx-=spd;PL.gy-=spd;}if(K.s){PL.gx+=spd;PL.gy+=spd;}
        if(K.a){PL.gx-=spd;PL.gy+=spd;}if(K.d){PL.gx+=spd;PL.gy-=spd;}
        if(PL.mv){const dx=PL.tx-PL.gx,dy=PL.ty-PL.gy,d2=Math.hypot(dx,dy);if(d2<.15){PL.gx=PL.tx;PL.gy=PL.ty;PL.mv=false;}else{PL.gx+=dx*PL.spd*(GS.simSpd/5);PL.gy+=dy*PL.spd*(GS.simSpd/5);}}
        PL.gx=Math.max(-8,Math.min(9,PL.gx));PL.gy=Math.max(-6,Math.min(9,PL.gy));
        if(nearCool>0){nearCool--;}else{
          for(const sc of SCENES){if(GS.visited.has(sc.id)||GS.gameOver)continue;if(Math.hypot(PL.gx-sc.gx,PL.gy-sc.gy)<1.6&&lastNear!==sc.id){lastNear=sc.id;openZone(sc);break;}}
          const sr=GS.socR===1?2:GS.socR===3?4:3;
          for(const n of npcs){if(!n.bonded&&n.mood==='open'&&Math.hypot(PL.gx-n.gx,PL.gy-n.gy)<sr*.65&&Math.random()>.988){clickNPC(n);break;}}
        }
      }
      npcs.forEach(n=>tickNPC(n,dt));
      const tp=s2w(PL.gx,PL.gy,CW,CH);
      cam.x+=(CW/2-tp.x-cam.x)*.08; cam.y+=(CH*.4-tp.y-cam.y)*.08;
      // ── Draw ──
      ctx.clearRect(0,0,CW,CH);
      const sky=skyCol(dn),grd=ctx.createLinearGradient(0,0,0,CH);
      grd.addColorStop(0,sky[0]);grd.addColorStop(1,sky[1]);ctx.fillStyle=grd;ctx.fillRect(0,0,CW,CH);
      ctx.save(); ctx.translate(cam.x,cam.y);
      [...GND].sort((a,b)=>(a.gx+a.gy)-(b.gx+b.gy)).forEach(t=>{if(!t.bk)dGnd(ctx,t.gx,t.gy,dn,CW,CH);});
      if(heatmapRef.current) dVibeHeatmap(ctx,npcs,ts,CW,CH);
      [...BLDGS].sort((a,b)=>(a.gx+a.gy)-(b.gx+b.gy)).forEach(b=>{
        dTile(ctx,b.gx,b.gy,b.t,b.s,b.d,b.h,CW,CH);
        if((dn>.6||dn<.1)&&Math.random()>.994){const pp=s2w(b.gx,b.gy,CW,CH);ctx.fillStyle=`rgba(255,220,100,${.12+Math.random()*.18})`;ctx.fillRect(pp.x+(Math.random()-.5)*T*1.5,pp.y+T*.5-b.h*14-Math.random()*b.h*14,3,5);}
      });
      [...SCENES].sort((a,b)=>(a.gx+a.gy)-(b.gx+b.gy)).forEach(sc=>dScene(ctx,sc,ts,dn,GS.visited,GS.prt,CW,CH));
      dResonanceClusters(ctx,npcs,ts,CW,CH);
      const objs=[...npcs.map(n=>({...n,_p:false})),{gx:PL.gx,gy:PL.gy,_p:true}];
      objs.sort((a,b)=>(a.gx+a.gy)-(b.gx+b.gy)).forEach(o=>{
        if(o._p) dPlayer(ctx,PL,ts,config.traits,getPlayerEmotion(),CW,CH);
        else dNPC(ctx,o,ts,dn,npcs,PL,GS.socR,GS.prt,matchScore,CW,CH);
      });
      rings=rings.filter(rg=>{rg.r+=rg.sp;rg.a-=.017;if(rg.a<=0||rg.r>=rg.mR)return false;ctx.beginPath();ctx.arc(rg.x,rg.y,rg.r,0,Math.PI*2);ctx.strokeStyle=rg.col;ctx.lineWidth=.8;ctx.globalAlpha=rg.a;ctx.stroke();ctx.globalAlpha=1;return true;});
      sparks=sparks.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.07;p.a-=.03;if(p.a<=0)return false;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=p.col;ctx.globalAlpha=p.a;ctx.fill();ctx.globalAlpha=1;return true;});
      floats=floats.filter(f=>{f.y+=f.vy;f.a-=.013;f.life--;if(f.a<=0||f.life<=0)return false;ctx.font=`700 8px 'Space Mono',monospace`;ctx.textAlign='center';ctx.fillStyle=f.col;ctx.globalAlpha=f.a;ctx.fillText(f.txt,f.x,f.y);ctx.globalAlpha=1;return true;});
      if(Math.random()>.993){const sc=SCENES[Math.floor(Math.random()*5)];if(!GS.visited.has(sc.id)){const pp=s2w(sc.gx,sc.gy,CW,CH);addRings(pp.x,pp.y+T*.5-sc.h*14,sc.col,1);}}
      npcs.forEach(n=>{if(Math.abs(n.gx)>8||Math.abs(n.gy)>8){n.gx=Math.max(-8,Math.min(8,n.gx));n.gy=Math.max(-7,Math.min(8,n.gy));n.tx=(Math.random()-.5)*7;n.ty=(Math.random()-.5)*6;}});
      ctx.restore();
      dRain(); dFog(dn);
      if(frameCount%8===0) setHud(buildHud());
    }

    rafId=requestAnimationFrame(loop);
    return()=>{
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize',rsz);
      window.removeEventListener('keydown',onKD);
      window.removeEventListener('keyup',onKU);
      canvas.removeEventListener('click',onCanvasClick);
    };
  },[visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Feed auto-cleanup
  useEffect(()=>{
    if(feed.length===0) return;
    const t=setTimeout(()=>setFeed(f=>f.slice(0,-1)),3500);
    return()=>clearTimeout(t);
  },[feed]);

  return (
    <div className={`scr${visible?' on':''}`} id="scr-game">
      <div id="world">
        <canvas id="C" ref={canvasRef} />

        {/* HUD top bar */}
        <div id="htop">
          <div className="hp">
            <span style={{display:'inline-block',width:5,height:5,borderRadius:'50%',background:'#5DCAA5',marginRight:4,verticalAlign:'middle',animation:'blink 1.5s infinite'}}/>
            PROTOCOL CITY
          </div>
          <div style={{display:'flex',gap:4,flexWrap:'wrap',justifyContent:'flex-end'}}>
            <div className="hp ev">TIME <b>{hud.time}</b></div>
            <div className="hp">ZONES <b>{hud.zones}</b></div>
            <div className="hp">BONDS <b>{hud.bonds}</b></div>
            <div className="hp wr">PRESSURE <b>{hud.pressure}%</b></div>
            <div className="hp">LEG <b>{hud.legibility}%</b></div>
            <div className="hp ev">EVENTS <b>{hud.events}</b></div>
            <div className="hp" style={{borderColor:hud.cityEmotionCol+'66'}}>CITY <b style={{color:hud.cityEmotionCol}}>{hud.cityEmotion}</b></div>
          </div>
        </div>

        {/* Day progress bar */}
        <div id="tbar"><div id="tfill" style={{width:`${hud.dayPct}%`,background:hud.dayColor}}/></div>

        {/* Left stat bars */}
        <div id="lstats">
          <div className="sb"><span className="sbl">COMPLY</span><div className="sbt"><div className="sbf" style={{width:`${hud.compPct}%`,background:'#AFA9EC'}}/></div></div>
          <div className="sb"><span className="sbl">REFUSE</span><div className="sbt"><div className="sbf" style={{width:`${hud.refPct}%`,background:'#F09595'}}/></div></div>
          <div className="sb"><span className="sbl">SUBVERT</span><div className="sbt"><div className="sbf" style={{width:`${hud.subPct}%`,background:'#5DCAA5'}}/></div></div>
        </div>

        {/* Social graph + City mood distribution */}
        <div id="sgraph">
          <div className="sgt">SOCIAL GRAPH</div>
          {bonds.slice(-5).map(b=>(
            <div key={b.id} className="brow">
              <div className="bd" style={{background:b.col}}/>
              <span className="bn">{b.name}</span>
              <span className={`btp ${b.type==='mutual'?'m':'c'}`}>{BOND_DEPTHS[b.depth||0]}</span>
            </div>
          ))}
          {hud.vibeDist.length>0&&(
            <>
              <div className="sgt" style={{marginTop:7}}>CITY MOOD</div>
              {hud.vibeDist.map(m=>(
                <div key={m.id} className="vmrow">
                  <span className="vmn" style={{color:m.col}}>{m.label.slice(0,3)}</span>
                  <div className="vmbar"><div className="vmfill" style={{width:`${m.pct}%`,background:m.col}}/></div>
                  <span className="vmp">{m.pct}%</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Vibe Compass */}
        <div id="vcompass">
          <div className="vct">VIBE MAP <span className={`vhbtn${heatmapOn?' on':''}`} onClick={()=>{heatmapRef.current=!heatmapRef.current;setHeatmapOn(v=>!v);}} style={{pointerEvents:'all',cursor:'pointer'}}>{heatmapOn?'ON':'OFF'}</span></div>
          <div className="vcg">
            <div className="vcx"/>
            <CompassCell d={hud.vibeCompass.n} a="↑"/>
            <div className="vcx"/>
            <CompassCell d={hud.vibeCompass.w} a="←"/>
            <div className="vcc">●</div>
            <CompassCell d={hud.vibeCompass.e} a="→"/>
            <div className="vcx"/>
            <CompassCell d={hud.vibeCompass.s} a="↓"/>
            <div className="vcx"/>
          </div>
        </div>

        {/* Bottom archetype bar */}
        <div id="abar">
          <div className="abi">
            <div className="anm" style={{color:hud.archetypeColor}}>{hud.archetype}</div>
            <div className="atr">
              <div className="at2"><span className="atl">COMPLY</span><div className="atb"><div className="atf" style={{width:`${hud.compPct}%`,background:'#AFA9EC'}}/></div><span className="ats">{hud.comply}</span></div>
              <div className="at2"><span className="atl">REFUSE</span><div className="atb"><div className="atf" style={{width:`${hud.refPct}%`,background:'#F09595'}}/></div><span className="ats">{hud.refuse}</span></div>
              <div className="at2"><span className="atl">SUBVERT</span><div className="atb"><div className="atf" style={{width:`${hud.subPct}%`,background:'#5DCAA5'}}/></div><span className="ats">{hud.subvert}</span></div>
            </div>
          </div>
        </div>

        {/* WASD hints */}
        <div id="kh">
          <div/><div className={`k${keysDown.w?' on':''}`}>W</div><div/>
          <div className={`k${keysDown.a?' on':''}`}>A</div>
          <div className={`k${keysDown.s?' on':''}`}>S</div>
          <div className={`k${keysDown.d?' on':''}`}>D</div>
        </div>

        {/* Event feed */}
        <div id="efeed">
          {feed.map(f=><div key={f.id} className="ei">{f.txt}</div>)}
        </div>

        {/* Ambient toast */}
        {ambientMsg&&(
          <div id="ambient" style={{display:'flex'}}>
            <div className="ambi">{ambientMsg}</div>
          </div>
        )}

        {/* Encounter modal */}
        <EncounterModal encounter={encounter} onChoice={onChoice} onBond={onBond} onClose={onClose}/>
      </div>
    </div>
  );
}
