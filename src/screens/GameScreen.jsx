import { useRef, useState, useEffect, useCallback } from 'react';
import EncounterModal from '../components/EncounterModal';
import { TRAITS, SCENES, BRIDGE_SCENES, BLDGS, ARCHS, NAMES, NCOLS, WEATHERS, DAY_EVENTS, MOODS, BOND_DEPTHS, QUESTS, STAGES, DEFAULT_GRAFTS, GRAFT_MESSAGES } from '../constants';
import { initSound, playFootstep, playBridgeCross, playBondFormed, playBondClash, playCanalBloom, playZoneEnter, playNPCNear, playDawnChime, playNightFall, setCanalVolume, setEnvEmpathy, playBloomTone, playContractTone } from '../sound';
import { fetchVeniceWeather } from '../weather';

const TID = TRAITS.map(t => t.id);
const BRIDGE_GYS = new Set([-2, 2, 6]); // bridge crossings — canal open at these gy

// ── Safe spawn: find nearest open cell if spawn is inside a wall ──────────────
function findOpenSpawn(gx, gy, worldMap) {
  if(!worldMap.get(`${Math.floor(gx)},${Math.floor(gy)}`)) return {gx, gy};
  for(let r=1; r<=6; r++){
    for(let dx=-r; dx<=r; dx++){
      for(let dy=-r; dy<=r; dy++){
        if(Math.abs(dx)!==r && Math.abs(dy)!==r) continue;
        const cx=Math.floor(gx)+dx, cy=Math.floor(gy)+dy;
        if(!worldMap.get(`${cx},${cy}`)) return {gx:cx+0.5, gy:cy+0.5};
      }
    }
  }
  return {gx:0.5, gy:0.5};
}

// ── World map ────────────────────────────────────────────────────────────────
function buildWorldMap() {
  const map = new Map();
  BLDGS.forEach(b => map.set(`${b.gx},${b.gy}`, { solid:true, h:b.h, water:false }));
  // Canal walls at gx=1,2; open only at bridge gy values
  for(let gy=-7; gy<=10; gy++) {
    if(!BRIDGE_GYS.has(gy)) {
      if(!map.has(`1,${gy}`)) map.set(`1,${gy}`, { solid:true, h:1, water:true });
      if(!map.has(`2,${gy}`)) map.set(`2,${gy}`, { solid:true, h:1, water:true });
    }
  }
  return map;
}

// Neon wall color by district + atmospheric fog falloff
function wallCol(gx, gy, side, h, dist, dn) {
  const nightDim = Math.max(0.3, 1 - Math.max(0,(dn-0.6)*4)*0.5);
  const bright = Math.max(0.04, Math.min(1, (1.6 - dist/12)*nightDim));
  const shade = side === 1 ? 0.6 : 1.0;
  const hGlow = Math.min(1.2, 0.85 + h*0.06);
  let r,g,b;
  if(gx>=3){          r=255*bright*shade; g=120*bright*shade*hGlow; b=10*bright*shade; }
  else if(gx<=-3||gy<=-2){ r=5*bright*shade; g=255*bright*shade*hGlow; b=80*bright*shade; }
  else if(gy>=5){     r=0; g=200*bright*shade; b=255*bright*shade*hGlow; }
  else{               r=180*bright*shade*hGlow; g=60*bright*shade; b=255*bright*shade; }
  // Venice nebbia — neon purple mist eating distant buildings
  const fog = Math.max(0, Math.min(1, (dist-3.5)/9));
  r = r*(1-fog) + 12*fog;
  g = g*(1-fog) + 0*fog;
  b = b*(1-fog) + 38*fog;
  return `rgb(${r|0},${g|0},${b|0})`;
}

// ── DDA Raycaster + Venice Architecture ──────────────────────────────────────
function castRays(ctx, px, py, dirX, dirY, plX, plY, worldMap, CW, CH, dn, ts, emp=0.5) {
  const zBuf = new Float32Array(CW);
  const STEP = 1;
  for(let x=0; x<CW; x+=STEP) {
    const camX = 2*x/CW - 1;
    const rdX = dirX + plX*camX;
    const rdY = dirY + plY*camX;
    let mX=Math.floor(px), mY=Math.floor(py);
    const ddX = Math.abs(rdX)<1e-6 ? 1e30 : Math.abs(1/rdX);
    const ddY = Math.abs(rdY)<1e-6 ? 1e30 : Math.abs(1/rdY);
    let sdX,sdY,stX,stY;
    if(rdX<0){stX=-1;sdX=(px-mX)*ddX;}else{stX=1;sdX=(mX+1-px)*ddX;}
    if(rdY<0){stY=-1;sdY=(py-mY)*ddY;}else{stY=1;sdY=(mY+1-py)*ddY;}
    let side=0, hit=false, cell=null, safety=0;
    while(!hit&&safety++<80){
      if(sdX<sdY){sdX+=ddX;mX+=stX;side=0;}else{sdY+=ddY;mY+=stY;side=1;}
      if(mX<-11||mX>13||mY<-9||mY>13) break;
      const c=worldMap.get(`${mX},${mY}`);
      if(c){hit=true;cell=c;}
    }
    const perp = hit ? (side===0?sdX-ddX:sdY-ddY) : 999;
    zBuf[x]=perp;
    if(!hit||perp<=0) continue;

    // Horizontal texture coordinate (0–1) along the hit wall face
    let wallXFrac;
    if(side===0) wallXFrac = py + perp*rdY; else wallXFrac = px + perp*rdX;
    wallXFrac -= Math.floor(wallXFrac);
    if((side===0&&rdX>0)||(side===1&&rdY<0)) wallXFrac=1-wallXFrac;

    const bh=cell.h||1;
    // Environmental Empathy: contracted walls feel taller (claustrophobic), bloomed walls shorter (open)
    const heightBias = 1.18 - emp * 0.33; // contracted:1.18 neutral:~1.01 bloomed:0.85
    const wallH=Math.min(CH*3,Math.floor(CH/perp*bh*heightBias));
    const wTop=Math.max(0,(CH-wallH)>>1);
    const wBot=Math.min(CH,(CH+wallH)>>1);

    if(cell.water){
      const sh=0.6+0.4*Math.sin(ts*0.002+mX+mY*0.8);
      const bd=Math.max(0.08,Math.min(1,(1.4-perp/9)*sh));
      const nightD=Math.max(0.3,1-Math.max(0,(dn-0.6)*4)*0.4);
      // Canal surface shimmer bands
      ctx.fillStyle=`rgb(0,${(200*bd*nightD)|0},${(255*bd*nightD)|0})`;
      ctx.fillRect(x,wTop,STEP,wBot-wTop);
      if(perp<3){
        const wa=Math.max(0,0.55-perp*0.18);
        ctx.fillStyle=`rgba(0,255,230,${wa})`;
        ctx.fillRect(x,wTop,STEP,2);
      }
    } else {
      const col=wallCol(mX,mY,side,bh,perp,dn);
      // ── Base wall ──
      ctx.fillStyle=col;
      ctx.fillRect(x,wTop,STEP,wBot-wTop);

      if(wallH>12){
        const flH=wallH/bh; // pixels per floor

        // ── Gothic arch windows ──
        // 2.5 windows per cell width; window column occupies middle 44% of cycle
        const wxCycle=(wallXFrac*2.5)%1.0;
        const inWinCol=wxCycle>0.28&&wxCycle<0.72;
        if(inWinCol){
          for(let fl=0;fl<bh;fl++){
            const flTop=wTop+fl*flH;
            const winY=flTop+flH*0.2;
            const winH2=flH*0.5;
            const archH=Math.min(flH*0.12,6); // gothic pointed arch tip height
            if(winY+winH2>wBot||winH2<3) continue;
            const wd=Math.max(0,Math.min(0.95,1.35-perp*0.16));
            // Dark window interior
            ctx.fillStyle=`rgba(0,0,10,${wd})`;
            ctx.fillRect(x,winY,STEP,winH2);
            // Gothic pointed arch at top (slightly lighter cutout)
            if(archH>1){
              ctx.fillStyle=`rgba(0,0,10,${wd*0.6})`;
              ctx.fillRect(x,winY-archH,STEP,archH);
            }
            // Warm interior glow visible at close range
            if(perp<6&&flH>8){
              const gc=mX>=3?'255,160,40':mX<=-3||mY<=-2?'40,255,120':mY>=5?'0,200,255':'160,80,255';
              ctx.fillStyle=`rgba(${gc},${Math.min(0.35,wd*0.28)})`;
              ctx.fillRect(x,winY,STEP,2);
              ctx.fillRect(x,winY+winH2-2,STEP,2);
            }
          }
        }

        // ── Stone horizontal courses (floor-line seams) ──
        for(let fl=1;fl<bh;fl++){
          const lineY=(wTop+fl*flH)|0;
          if(lineY<wTop||lineY>=wBot) continue;
          ctx.fillStyle='rgba(255,255,255,0.07)';
          ctx.fillRect(x,lineY,STEP,1);
        }

        // ── Vertical pilasters every 1/3 cell ──
        const pCycle=(wallXFrac*3)%1.0;
        if(pCycle<0.055){
          ctx.fillStyle='rgba(255,255,255,0.05)';
          ctx.fillRect(x,wTop,STEP,wBot-wTop);
        }

        // ── Cornice at top (bright stone ledge) ──
        ctx.fillStyle='rgba(255,255,255,0.13)';
        ctx.fillRect(x,wTop,STEP,Math.max(2,flH*0.08)|0);

        // ── Rusticated shadow at base ──
        const baseH=Math.max(2,Math.min(12,flH*0.18))|0;
        ctx.fillStyle='rgba(0,0,0,0.5)';
        ctx.fillRect(x,wBot-baseH,STEP,baseH);
      }

      // Neon edge glow on very close walls
      if(perp<2.5){
        const ga=Math.max(0,0.5-perp*0.2);
        ctx.fillStyle=`rgba(255,255,255,${ga*0.14})`;
        ctx.fillRect(x,wTop,STEP,2);
        ctx.fillRect(x,wBot-2,STEP,2);
      }
    }
    // ── Empathy Bloom: bioluminescent moss + flower spores on walls (joyful) ──
    if(!cell.water && emp>0.62 && perp<5){
      const ma=(emp-0.62)*0.85*(0.5+0.5*Math.sin(ts*0.0011+mX*2.4+mY*1.1));
      const mh=Math.max(2,(wBot-wTop)*0.10);
      ctx.fillStyle=`rgba(0,210,130,${ma*0.6})`; ctx.fillRect(x,wBot-mh,STEP,mh);
      // Flower dots: deterministic per wall face so they stay fixed in world space
      if(ma>0.22&&Math.sin(mX*13.1+mY*7.7+x*0.09)>0.78){
        ctx.fillStyle=`rgba(255,210,55,${ma*0.85})`;
        ctx.beginPath(); ctx.arc(x,wBot-mh-2,1.4,0,Math.PI*2); ctx.fill();
      }
    }
    // ── Empathy Contract: shadow clutter + wall darkening (sad/anxious) ────────
    if(!cell.water && emp<0.38 && perp<8){
      const sh=(0.38-emp)*0.75;
      // Base shadow swallows wall bottom (rubble/clutter feel)
      ctx.fillStyle=`rgba(0,0,0,${sh*0.48})`; ctx.fillRect(x,wBot-Math.max(3,(wBot-wTop)*0.22),STEP,Math.max(3,(wBot-wTop)*0.22));
      // Ceiling darkens — walls lean in overhead
      ctx.fillStyle=`rgba(0,0,12,${sh*0.32})`; ctx.fillRect(x,wTop,STEP,Math.max(2,(wBot-wTop)*0.15));
    }
  }
  return zBuf;
}

// ── Sky + Floor ───────────────────────────────────────────────────────────────
function drawSkyFloor(ctx, CW, CH, dn, ts, angle, emp=0.5) {
  const nt=Math.max(0,Math.min(1,(dn-0.6)*4));
  const horiz=CH*0.5;
  const bloom2=Math.max(0,emp-0.5)*2;   // 0→1 only when emp>0.5
  const contract2=Math.max(0,0.5-emp)*2; // 0→1 only when emp<0.5

  // Sky gradient — bloomed: warm rose-violet | contracted: oppressive near-black
  const sg=ctx.createLinearGradient(0,0,0,horiz);
  if(bloom2>0.08){
    sg.addColorStop(0,`rgb(${2+Math.floor(bloom2*14)},0,${14+Math.floor(bloom2*10)})`);
    sg.addColorStop(1,`rgb(${7+Math.floor(bloom2*20)},${Math.floor(bloom2*4)},${50+Math.floor(bloom2*18)})`);
  } else if(contract2>0.08){
    sg.addColorStop(0,'#010005'); sg.addColorStop(1,'#030012');
  } else {
    sg.addColorStop(0, nt>0.4?'#02000e':'#05001c');
    sg.addColorStop(1, nt>0.4?'#07003a':'#0d0050');
  }
  ctx.fillStyle=sg; ctx.fillRect(0,0,CW,horiz);

  // Aurora glow near horizon
  ctx.save(); ctx.globalCompositeOperation='screen';
  const ag=ctx.createLinearGradient(0,horiz-50,0,horiz);
  const ac=nt>0.3?'0,160,255':'100,0,255';
  ag.addColorStop(0,`rgba(${ac},0)`); ag.addColorStop(1,`rgba(${ac},0.18)`);
  ctx.fillStyle=ag; ctx.fillRect(0,horiz-50,CW,50);
  ctx.restore();

  // Stars
  if(nt>0.08){
    for(let i=0;i<90;i++){
      const sx=((i*2371+17)%(CW*0.98));
      const sy=((i*1733+17)%(horiz*0.92));
      const tw=0.3+0.7*Math.abs(Math.sin(ts*0.0007+i*0.9));
      ctx.fillStyle=`rgba(200,160,255,${tw*nt*0.75})`;
      ctx.fillRect(sx,sy,1,1);
    }
  }

  // ── Venice skyline silhouettes ──────────────────────────────────────────────
  // Parallax offset based on player facing angle
  const pax = ((angle/(Math.PI*2))*CW*0.6)%CW;
  function skyX(base){ return ((base + pax % CW + CW) % CW); }

  ctx.save();
  ctx.fillStyle='rgba(8,0,22,0.72)';

  // Campanile 1 — tall narrow tower with pyramidal cap
  const t1x=skyX(CW*0.68);
  ctx.fillRect(t1x,horiz-90,9,90);
  ctx.beginPath(); ctx.moveTo(t1x-5,horiz-90); ctx.lineTo(t1x+14,horiz-90); ctx.lineTo(t1x+4.5,horiz-120); ctx.closePath(); ctx.fill();
  // Belfry arches (dark cutouts - lighter so leave as background)
  ctx.fillStyle='rgba(8,0,22,0.9)';
  ctx.fillRect(t1x+1,horiz-66,3,10); ctx.fillRect(t1x+5,horiz-66,3,10); // twin lancets

  // Campanile 2 — shorter west tower
  ctx.fillStyle='rgba(8,0,22,0.65)';
  const t2x=skyX(CW*0.2);
  ctx.fillRect(t2x,horiz-62,7,62);
  ctx.beginPath(); ctx.moveTo(t2x-4,horiz-62); ctx.lineTo(t2x+11,horiz-62); ctx.lineTo(t2x+3.5,horiz-84); ctx.closePath(); ctx.fill();

  // Santa Maria dome — low wide dome on a drum
  const dx=skyX(CW*0.44);
  ctx.fillStyle='rgba(8,0,22,0.7)';
  ctx.beginPath(); ctx.arc(dx, horiz+3, 38, Math.PI, 0); ctx.fill();
  // Drum base
  ctx.fillRect(dx-38, horiz-14, 76, 17);
  // Lantern on top
  ctx.fillRect(dx-4, horiz-55, 8, 26);
  ctx.beginPath(); ctx.arc(dx, horiz-55, 5, Math.PI, 0); ctx.fill();

  // Smaller church — right side
  const ch2x=skyX(CW*0.84);
  ctx.fillStyle='rgba(8,0,22,0.55)';
  ctx.fillRect(ch2x,horiz-40,28,40);
  // Facade pediment
  ctx.beginPath(); ctx.moveTo(ch2x-2,horiz-40); ctx.lineTo(ch2x+30,horiz-40); ctx.lineTo(ch2x+14,horiz-58); ctx.closePath(); ctx.fill();
  // Bell tower nub
  ctx.fillRect(ch2x+20,horiz-50,6,26);

  // Far roofline mass — horizon-hugging buildings
  ctx.fillStyle='rgba(8,0,22,0.42)';
  ctx.fillRect(skyX(0),horiz-20,CW*0.12,20);
  ctx.fillRect(skyX(CW*0.55),horiz-16,CW*0.08,16);
  ctx.fillRect(skyX(CW*0.9),horiz-24,CW*0.1,24);

  // Neon glow edge on top of campanile (illuminated by city neon)
  ctx.strokeStyle=nt>0.5?'rgba(80,60,200,0.35)':'rgba(120,80,255,0.28)';
  ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(t1x+4.5,horiz-120); ctx.lineTo(t1x-5,horiz-90); ctx.lineTo(t1x+18,horiz-90);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(dx,horiz-55); ctx.arc(dx,horiz+3,38,Math.PI,0);
  ctx.stroke();

  ctx.restore();

  // Floor — bloomed: bioluminescent teal shimmer | contracted: near void
  const fg=ctx.createLinearGradient(0,horiz,0,CH);
  if(bloom2>0.12){
    fg.addColorStop(0,`rgb(${4+Math.floor(bloom2*9)},${Math.floor(bloom2*18)},${30+Math.floor(bloom2*14)})`);
    fg.addColorStop(1,'#010008');
  } else if(contract2>0.12){
    fg.addColorStop(0,'#01000a'); fg.addColorStop(1,'#000004');
  } else {
    fg.addColorStop(0,'#04001e'); fg.addColorStop(1,'#010008');
  }
  ctx.fillStyle=fg; ctx.fillRect(0,horiz,CW,CH-horiz);

  // Stone floor tile grid — visible calle pattern receding to horizon
  ctx.save();
  const hw=CW/2;
  for(let row=1;row<22;row++){
    const t2=row/22;
    const y=horiz+(CH-horiz)*Math.pow(t2,1.75);
    const xsp=(CW/2)*(0.99-(1-t2)*0.46);
    const la = bloom2>0.08 ? 0.07+t2*0.18 : 0.04+t2*0.13;
    const col = bloom2>0.08 ? `rgba(0,200,140,${la})` : `rgba(70,55,155,${la})`;
    ctx.strokeStyle=col; ctx.lineWidth=t2<0.18?0.9:0.5;
    ctx.beginPath(); ctx.moveTo(hw-xsp,y); ctx.lineTo(hw+xsp,y); ctx.stroke();
  }
  for(let c=-10;c<=10;c++){
    const la = 0.05+0.06*(1-Math.abs(c)/10);
    ctx.strokeStyle=bloom2>0.08?`rgba(0,200,140,${la})`:`rgba(70,55,155,${la})`; ctx.lineWidth=0.5;
    ctx.beginPath(); ctx.moveTo(hw+c*(CW/16),horiz); ctx.lineTo(hw+c*(CW/1.9),CH); ctx.stroke();
  }
  // Near-floor shimmer strip (makes the ground feel immediate underfoot)
  const ny=horiz+(CH-horiz)*0.85;
  const sg2=ctx.createLinearGradient(hw-CW*0.5,ny,hw+CW*0.5,ny);
  const sc3=bloom2>0.08?'0,220,160':'80,60,200';
  sg2.addColorStop(0,`rgba(${sc3},0)`); sg2.addColorStop(0.5,`rgba(${sc3},${bloom2>0.08?0.12:0.06})`); sg2.addColorStop(1,`rgba(${sc3},0)`);
  ctx.fillStyle=sg2; ctx.fillRect(hw-CW*0.5,ny-1,CW,3);
  ctx.restore();
}

// ── Humanoid figure renderer ──────────────────────────────────────────────────
// feetY = screen Y of the ground contact point (feet on floor)
function drawHumanoid(ctx, sx, feetY, size, col, alpha, ts, phase) {
  ctx.save();
  const sway     = Math.sin(ts*0.0028+phase)*size*0.07;
  const legSwing = Math.sin(ts*0.005 +phase)*size*0.06;

  // All measurements built UPWARD from feetY
  const legH  = Math.max(2, size*0.52);
  const bodyH = Math.max(3, size*0.60);
  const headR = Math.max(2, size*0.27);
  const bodyW = Math.max(3, size*0.44);
  const legW  = Math.max(1, size*0.16);
  const armW  = Math.max(1, size*0.12);
  const armH  = Math.max(2, size*0.36);

  const legTop   = feetY - legH;
  const torsoBot = legTop;
  const torsoTop = torsoBot - bodyH;
  const headCY   = torsoTop - headR*0.9;
  // midpoint for aura centre
  const midY = feetY - (legH + bodyH + headR*2)*0.5;

  // Outer aura bloom centred on figure midpoint
  const gr = ctx.createRadialGradient(sx, midY, 0, sx, midY, size*3.0);
  gr.addColorStop(0, col+'30'); gr.addColorStop(1, col+'00');
  ctx.globalAlpha = alpha*0.75;
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.arc(sx, midY, size*3.0, 0, Math.PI*2); ctx.fill();

  ctx.globalAlpha = alpha;

  // Ghost body glow
  ctx.fillStyle = col+'18';
  ctx.fillRect(sx - bodyW*0.9 + sway, torsoTop, bodyW*1.8, bodyH + legH);

  // Arms
  ctx.fillStyle = col+'bb';
  ctx.fillRect(sx - bodyW/2 - armW + sway, torsoTop + bodyH*0.08, armW, armH);
  ctx.fillRect(sx + bodyW/2          + sway, torsoTop + bodyH*0.08, armW, armH);

  // Torso
  ctx.fillStyle = col+'ee';
  ctx.fillRect(sx - bodyW/2 + sway, torsoTop, bodyW, bodyH);

  // Legs — alternating walk cycle
  ctx.fillStyle = col+'cc';
  ctx.fillRect(sx - bodyW/2 + sway + legSwing,        legTop, legW, legH);
  ctx.fillRect(sx + bodyW/2 - legW + sway - legSwing, legTop, legW, legH);

  // Head
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(sx + sway, headCY, headR, 0, Math.PI*2); ctx.fill();

  // Neon halo ring
  ctx.strokeStyle = col;
  ctx.lineWidth = Math.max(0.5, size*0.04);
  ctx.globalAlpha = alpha*0.4;
  ctx.beginPath(); ctx.arc(sx + sway, headCY, headR*1.4, 0, Math.PI*2); ctx.stroke();

  ctx.restore();
}

// ── NPC Sprites ───────────────────────────────────────────────────────────────
function drawSprites(ctx, npcs, px, py, dirX, dirY, plX, plY, zBuf, CW, CH, ts) {
  const inv=1.0/(plX*dirY-dirX*plY);
  npcs.slice().sort((a,b)=>Math.hypot(b.gx-px,b.gy-py)-Math.hypot(a.gx-px,a.gy-py))
  .forEach(sp=>{
    const rx=sp.gx-px, ry=sp.gy-py;
    const tx2=inv*(dirY*rx-dirX*ry);
    const ty2=inv*(-plY*rx+plX*ry);
    if(ty2<=0.08) return;
    const sx=Math.floor((CW/2)*(1.0+tx2/ty2));
    if(sx<-80||sx>CW+80) return;
    if(sx>=0&&sx<CW&&zBuf[sx]<ty2) return;

    // Scale: sprite height on screen = CH / ty2 (same formula as wall height for h=1)
    const sprH = Math.min(CH*2, CH/ty2);
    const size  = Math.max(3, sprH * 0.22); // figure "unit" ≈ sprH * 0.22

    const alpha = Math.max(0.08, Math.min(0.95, 1.1 - ty2/14));

    // Feet land at horizon + half the sprite extent below it
    const feetY = CH*0.5 + sprH*0.5;

    if(size < 7){
      // Too distant — glowing dot at foot level
      const dotY = feetY - size;
      const gr = ctx.createRadialGradient(sx, dotY, 0, sx, dotY, size*2.2);
      gr.addColorStop(0, sp.col+'55'); gr.addColorStop(1, sp.col+'00');
      ctx.beginPath(); ctx.arc(sx, dotY, size*2.2, 0, Math.PI*2);
      ctx.fillStyle=gr; ctx.globalAlpha=alpha; ctx.fill();
      ctx.beginPath(); ctx.arc(sx, dotY, size, 0, Math.PI*2);
      ctx.fillStyle=sp.col; ctx.globalAlpha=alpha*0.9; ctx.fill();
      ctx.globalAlpha=1;
    } else {
      // Full humanoid — feet on the ground
      drawHumanoid(ctx, sx, feetY, size, sp.col, alpha, ts, sp.phase||0);
      ctx.globalAlpha=1;
    }

    // Name + mood label — floats just above the head
    if(ty2<5&&sp.name){
      const headTopY = feetY - size*(0.52+0.60) - size*0.27*1.9;
      const fs = Math.max(7, (18/ty2)|0);
      ctx.font=`700 ${fs}px 'Space Mono',monospace`;
      ctx.textAlign='center'; ctx.fillStyle=sp.col;
      ctx.globalAlpha=Math.min(1,(5-ty2)/3.5);
      ctx.fillText(sp.name.toUpperCase(), sx, headTopY - 6);
      if(sp.emotion){
        ctx.font=`400 ${Math.max(6,(12/ty2)|0)}px 'Space Mono',monospace`;
        ctx.fillStyle='rgba(200,190,255,0.6)';
        ctx.fillText('['+sp.emotion+']', sx, headTopY - 6 + fs + 2);
      }
      ctx.globalAlpha=1;
    }
  });
}

// ── Scene Marker Orbs ─────────────────────────────────────────────────────────
function drawSceneMarkers(ctx, scenes, px, py, dirX, dirY, plX, plY, zBuf, visited, ts, CW, CH) {
  const inv=1.0/(plX*dirY-dirX*plY);
  scenes.forEach(sc=>{
    const rx=sc.gx-px, ry=sc.gy-py;
    const tx2=inv*(dirY*rx-dirX*ry);
    const ty2=inv*(-plY*rx+plX*ry);
    if(ty2<=0.08) return;
    const sx=Math.floor((CW/2)*(1.0+tx2/ty2));
    if(sx<0||sx>=CW) return;
    if(zBuf[Math.max(0,Math.min(CW-1,sx))]<ty2) return;
    const size=Math.max(4,36/ty2);
    const pulse=0.65+0.35*Math.sin(ts*0.002+sc.gx*0.8);
    const sy2=CH*0.5-size*0.4;
    const visited2=visited.has(sc.id);
    const alpha=visited2?0.25:0.88;
    // Outer glow
    const gr=ctx.createRadialGradient(sx,sy2,0,sx,sy2,size*2.8*pulse);
    gr.addColorStop(0,(visited2?'#555555':sc.col)+'77');
    gr.addColorStop(1,sc.col+'00');
    ctx.beginPath(); ctx.arc(sx,sy2,size*2.8*pulse,0,Math.PI*2);
    ctx.fillStyle=gr; ctx.fill();
    // Core orb
    ctx.beginPath(); ctx.arc(sx,sy2,size*pulse,0,Math.PI*2);
    ctx.fillStyle=visited2?'#444':sc.col;
    ctx.globalAlpha=alpha; ctx.fill(); ctx.globalAlpha=1;
    // Label
    if(ty2<7){
      const fs=Math.max(7,(14/ty2)|0);
      ctx.font=`700 ${fs}px 'Space Mono',monospace`;
      ctx.textAlign='center'; ctx.fillStyle=visited2?'#555':sc.col;
      ctx.globalAlpha=Math.min(1,(7-ty2)/5);
      ctx.fillText(sc.label.toUpperCase(),sx,sy2-size-7);
      ctx.globalAlpha=1;
    }
  });
}

// ── Mini-map ──────────────────────────────────────────────────────────────────
function drawMinimap(ctx, px, py, angle, worldMap, npcs, scenes, visited, CW, CH) {
  const MM=130, mmX=CW-MM-8, mmY=40; // moved to top-right
  const sc2=MM/22, offX=px-11, offY=py-11;
  ctx.save(); ctx.globalAlpha=0.92;
  // Background
  ctx.fillStyle='rgba(2,0,18,0.95)';
  ctx.beginPath();
  if(ctx.roundRect) ctx.roundRect(mmX,mmY,MM,MM,6); else ctx.rect(mmX,mmY,MM,MM);
  ctx.fill();

  // Canal — draw as a thick blue stripe at gx=1,2
  for(let gy2=-7;gy2<=10;gy2++){
    const my2a=(gy2-offY)*sc2;
    if(my2a<0||my2a>=MM) continue;
    ctx.fillStyle='rgba(0,170,255,0.45)';
    const cxA=(1-offX)*sc2, cxB=(2-offX)*sc2;
    if(cxA>=0&&cxA<MM) ctx.fillRect(mmX+cxA,mmY+my2a,sc2,sc2);
    if(cxB>=0&&cxB<MM) ctx.fillRect(mmX+cxB,mmY+my2a,sc2,sc2);
  }

  // Walls
  worldMap.forEach((cell,key)=>{
    if(cell.water) return; // already drawn canal above
    const [gx2,gy2]=key.split(',').map(Number);
    const mx2=(gx2-offX)*sc2, my2=(gy2-offY)*sc2;
    if(mx2<0||mx2>=MM||my2<0||my2>=MM) return;
    ctx.fillStyle='rgba(255,255,255,0.18)';
    ctx.fillRect(mmX+mx2,mmY+my2,sc2,sc2);
  });

  // Scene markers — bigger, with short name labels
  scenes.forEach(sc=>{
    const mx2=(sc.gx-offX)*sc2+sc2/2, my2=(sc.gy-offY)*sc2+sc2/2;
    if(mx2<-4||mx2>MM+4||my2<-4||my2>MM+4) return;
    const vis=visited.has(sc.id);
    ctx.globalAlpha=vis?0.3:0.9;
    ctx.fillStyle=vis?'#555':sc.col;
    ctx.beginPath(); ctx.arc(mmX+mx2,mmY+my2,3.5,0,Math.PI*2); ctx.fill();
    // Outer ring on unvisited
    if(!vis){
      ctx.strokeStyle=sc.col; ctx.lineWidth=0.8; ctx.globalAlpha=0.4;
      ctx.beginPath(); ctx.arc(mmX+mx2,mmY+my2,6,0,Math.PI*2); ctx.stroke();
    }
    // Short label
    if(mx2>=0&&mx2<=MM&&my2>=0&&my2<=MM){
      ctx.globalAlpha=vis?0.2:0.65;
      ctx.font=`500 5px 'Space Mono',monospace`; ctx.textAlign='center';
      ctx.fillStyle=vis?'#555':sc.col;
      const short=sc.label.split(' ')[0];
      ctx.fillText(short,mmX+mx2,mmY+my2-7);
    }
  });

  // NPCs
  npcs.forEach(n=>{
    const mx2=(n.gx-offX)*sc2, my2=(n.gy-offY)*sc2;
    if(mx2<0||mx2>=MM||my2<0||my2>=MM) return;
    ctx.fillStyle=n.col; ctx.globalAlpha=0.5;
    ctx.beginPath(); ctx.arc(mmX+mx2,mmY+my2,1.8,0,Math.PI*2); ctx.fill();
  });

  // Navigation target marker
  // (drawn from outside via navTarget — just skip here, beacon handles it)

  // Player dot + direction cone
  const pmx=(px-offX)*sc2, pmy=(py-offY)*sc2;
  // Direction cone
  ctx.globalAlpha=0.18; ctx.fillStyle='#00ffcc';
  ctx.beginPath();
  ctx.moveTo(mmX+pmx,mmY+pmy);
  ctx.arc(mmX+pmx,mmY+pmy,18,angle-0.55,angle+0.55);
  ctx.closePath(); ctx.fill();
  // Player dot
  ctx.fillStyle='#00ffcc'; ctx.globalAlpha=1;
  ctx.beginPath(); ctx.arc(mmX+pmx,mmY+pmy,3.5,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#fff'; ctx.lineWidth=0.8; ctx.globalAlpha=0.7;
  ctx.beginPath(); ctx.arc(mmX+pmx,mmY+pmy,3.5,0,Math.PI*2); ctx.stroke();

  // "YOU" label
  ctx.font=`700 5px 'Space Mono',monospace`; ctx.textAlign='center';
  ctx.fillStyle='#00ffcc'; ctx.globalAlpha=0.7;
  ctx.fillText('YOU',mmX+pmx,mmY+pmy-7);

  // Border
  ctx.strokeStyle='rgba(0,220,180,0.35)'; ctx.lineWidth=0.8; ctx.globalAlpha=0.9;
  ctx.beginPath();
  if(ctx.roundRect) ctx.roundRect(mmX,mmY,MM,MM,6); else ctx.rect(mmX,mmY,MM,MM);
  ctx.stroke();

  // "MAP" label
  ctx.font=`700 5.5px 'Space Mono',monospace`; ctx.textAlign='left';
  ctx.fillStyle='rgba(0,220,180,0.5)'; ctx.globalAlpha=1;
  ctx.fillText('MAP',mmX+4,mmY+8);
  ctx.textAlign='right'; ctx.fillStyle='rgba(0,220,180,0.3)';
  ctx.fillText('TAP TO NAVIGATE',mmX+MM-4,mmY+8);

  ctx.restore();
}

// ── Environmental Empathy Overlay (Vibe Mesh) ─────────────────────────────────
// emp: 0=fully contracted (sad/anxious), 0.5=neutral, 1=fully bloomed (joyful)
// clash: 0-1 strength of aura collision with nearby opposite-mood NPCs
function drawEnvOverlay(ctx, CW, CH, emp, ts, clash) {
  const contracted = Math.max(0, 0.5 - emp) * 2;  // 1 when emp=0, 0 when emp>=0.5
  const bloomed    = Math.max(0, emp - 0.5)  * 2;  // 0 when emp<=0.5, 1 when emp=1

  // ── Contraction vignette: heavy dark edges, walls lean inward ───────────────
  if(contracted > 0.04){
    const vStr = contracted * 0.72;
    const vg = ctx.createRadialGradient(CW/2, CH/2, CW*0.13, CW/2, CH/2, CW*0.76);
    vg.addColorStop(0, `rgba(0,0,0,0)`);
    vg.addColorStop(1, `rgba(3,0,12,${vStr})`);
    ctx.fillStyle=vg; ctx.fillRect(0,0,CW,CH);
    // Corner shadow tendrils — the alley literally narrows
    if(contracted > 0.45){
      const ta=(contracted-0.45)*0.65;
      ctx.fillStyle=`rgba(1,0,8,${ta})`;
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(CW*0.2,0); ctx.lineTo(0,CH*0.22); ctx.fill();
      ctx.beginPath(); ctx.moveTo(CW,0); ctx.lineTo(CW-CW*0.2,0); ctx.lineTo(CW,CH*0.22); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0,CH); ctx.lineTo(CW*0.2,CH); ctx.lineTo(0,CH*0.78); ctx.fill();
      ctx.beginPath(); ctx.moveTo(CW,CH); ctx.lineTo(CW-CW*0.2,CH); ctx.lineTo(CW,CH*0.78); ctx.fill();
    }
  }

  // ── Bloom warm glow: city breathes open ────────────────────────────────────
  if(bloomed > 0.04){
    ctx.save(); ctx.globalCompositeOperation='screen';
    const bg = ctx.createRadialGradient(CW/2, CH*0.62, 0, CW/2, CH*0.62, CW*0.52);
    bg.addColorStop(0, `rgba(255,220,80,${bloomed*0.055})`);
    bg.addColorStop(0.5, `rgba(100,60,200,${bloomed*0.03})`);
    bg.addColorStop(1, `rgba(0,0,0,0)`);
    ctx.fillStyle=bg; ctx.fillRect(0,0,CW,CH);
    ctx.restore();
  }

  // ── Dust motes + shadow wisps (contracted) ──────────────────────────────────
  if(contracted > 0.18){
    const count = Math.floor(contracted * 20);
    for(let i=0; i<count; i++){
      const bx = ((i*2137 + ts*0.0028) % (CW*0.90)) + CW*0.05;
      const by = ((i*1571 + ts*0.0012) % CH);
      const ba = contracted * 0.42 * Math.abs(Math.sin(ts*0.00038 + i*1.27));
      ctx.fillStyle=`rgba(75,45,120,${ba})`;
      ctx.beginPath(); ctx.arc(bx, by, 1.0 + Math.abs(Math.sin(i))*0.6, 0, Math.PI*2); ctx.fill();
    }
    // Flickering shadow bands — lights flicker, alley closes
    if(contracted > 0.55 && Math.random() > 0.956){
      const flA = (contracted-0.55) * Math.random() * 0.11;
      ctx.fillStyle=`rgba(0,0,0,${flA})`;
      ctx.fillRect(0, Math.random()*CH, CW, 2+Math.random()*6);
    }
  }

  // ── Rising bloom petals + bioluminescent spores (joyful) ────────────────────
  if(bloomed > 0.18){
    const count = Math.floor(bloomed * 24);
    for(let i=0; i<count; i++){
      const px2 = ((i*1987 + ts*0.0075) % (CW*0.86)) + CW*0.07;
      const py2 = CH - ((ts*0.021 + i*1750) % (CH*1.45));
      if(py2 < -12 || py2 > CH+12) continue;
      const pa = bloomed * 0.68 * Math.max(0, 1 - py2/CH) * Math.abs(Math.sin(ts*0.00028 + i*1.1));
      if(pa < 0.015) continue;
      const cols = [`rgba(255,200,55,${pa})`, `rgba(70,255,155,${pa})`, `rgba(210,90,255,${pa})`];
      ctx.fillStyle = cols[i%3];
      const ps = 1.1 + Math.abs(Math.sin(ts*0.00048 + i)) * 1.5;
      ctx.beginPath(); ctx.arc(px2, py2, ps, 0, Math.PI*2); ctx.fill();
      // Leaf shimmer — tiny fleck above dot
      if(pa > 0.28 && Math.sin(i*7.3 + ts*0.0001) > 0.62){
        ctx.fillStyle=`rgba(50,220,115,${pa*0.55})`;
        ctx.fillRect(px2-1, py2-3, 2, 5);
      }
    }
  }

  // ── Vibe Clash: chromatic edge split (aura collision with opposite moods) ────
  // The city struggles between states — red/cyan split at screen edges
  if(clash > 0.12){
    const ca = clash * 0.08;
    const cw2 = Math.max(1, Math.floor(clash * 5));
    ctx.fillStyle=`rgba(255,0,55,${ca})`; ctx.fillRect(0,0,cw2,CH); ctx.fillRect(CW-cw2,0,cw2,CH);
    ctx.fillStyle=`rgba(0,255,195,${ca})`; ctx.fillRect(cw2,0,cw2,CH); ctx.fillRect(CW-cw2*2,0,cw2,CH);
  }
}

// ── Navigation Trail — glowing floor dots leading toward target ───────────────
function drawNavTrail(ctx, px, py, dirX, dirY, plX, plY, targetGx, targetGy, targetCol, ts, CW, CH) {
  const dx = targetGx - px, dy = targetGy - py;
  const dist = Math.hypot(dx, dy);
  if(dist < 1.2) return;
  const nx = dx/dist, ny = dy/dist;
  const inv = 1.0/(plX*dirY - dirX*plY);
  // 5 stepping-stone dots at increasing distances toward target
  [0.7, 1.4, 2.2, 3.2, 4.4].forEach((step, i) => {
    const wx = px + nx*step, wy = py + ny*step;
    const rx = wx-px, ry = wy-py;
    const tx2 = inv*(dirY*rx - dirX*ry);
    const ty2 = inv*(-plY*rx + plX*ry);
    if(ty2 <= 0.06) return;
    const sx = Math.floor((CW/2)*(1.0 + tx2/ty2));
    const sy = CH/2*(1 + 1/ty2); // floor projection
    if(sx < 4 || sx > CW-4 || sy > CH-2 || sy < CH/2+4) return;
    const a = (0.75 - i*0.1)*(0.55 + 0.45*Math.sin(ts*0.004 - i*1.1 + dist*0.3));
    const r = Math.max(1.5, 5.5 - i*0.7);
    ctx.save();
    const gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, r*3.5);
    gr.addColorStop(0, targetCol+'bb'); gr.addColorStop(1, targetCol+'00');
    ctx.fillStyle = gr; ctx.globalAlpha = a*0.7;
    ctx.beginPath(); ctx.arc(sx, sy, r*3.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = targetCol; ctx.globalAlpha = a;
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  });
}

// ── Player Trail — aura glows left on the floor as the player walks ───────────
function drawPlayerTrail(ctx, trail, px, py, dirX, dirY, plX, plY, auraCol, ts, CW, CH) {
  if(trail.length < 2) return;
  const inv = 1.0/(plX*dirY - dirX*plY);
  const n = trail.length;
  trail.forEach((pt, i) => {
    const age = (i + 1) / n;           // 0 = oldest, 1 = most recent
    const rx = pt.gx - px, ry = pt.gy - py;
    const tx2 = inv*(dirY*rx - dirX*ry);
    const ty2 = inv*(-plY*rx + plX*ry);
    if(ty2 <= 0.06) return;
    const sx = Math.floor((CW/2)*(1.0 + tx2/ty2));
    const sy = (CH/2)*(1 + 1/ty2);    // floor projection (below horizon)
    if(sx < 0 || sx > CW || sy > CH - 1 || sy < CH/2 + 2) return;
    const pulse = 0.72 + 0.28*Math.sin(ts*0.003 + i*0.55);
    const a = age * 0.52 * pulse;
    const r = Math.max(1, 4.5 - (1 - age)*3.5);
    ctx.save();
    // Outer glow
    const gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, r*4);
    gr.addColorStop(0, auraCol+'99'); gr.addColorStop(1, auraCol+'00');
    ctx.fillStyle = gr; ctx.globalAlpha = a * 0.45;
    ctx.beginPath(); ctx.arc(sx, sy, r*4, 0, Math.PI*2); ctx.fill();
    // Core dot
    ctx.fillStyle = auraCol; ctx.globalAlpha = a;
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  });
}

// ── Floor Tile Grid — lit pathway tiles projected onto the floor plane ────────
function drawFloorGrid(ctx, px, py, dirX, dirY, plX, plY, navTarget, ts, CW, CH) {
  const inv = 1.0/(plX*dirY - dirX*plY);
  const horiz = CH * 0.5;
  const ox = Math.round(px), oy = Math.round(py);

  for(let gi = -5; gi <= 6; gi++) {
    for(let gj = -5; gj <= 6; gj++) {
      const wx = ox + gi + 0.5, wy = oy + gj + 0.5;
      const rx = wx - px, ry = wy - py;
      const dist = Math.hypot(rx, ry);
      if(dist > 7) continue;
      const tx2 = inv*(dirY*rx - dirX*ry);
      const ty2 = inv*(-plY*rx + plX*ry);
      if(ty2 <= 0.05) continue;
      const sx = (CW/2)*(1.0 + tx2/ty2);
      const sy = horiz*(1 + 1/ty2);
      if(sy < horiz+1 || sy > CH-1) continue;

      const tW = Math.min(55, (CW*0.36)/ty2);
      const tH = tW * 0.5;
      const a = Math.max(0, 0.5 - dist*0.065);

      // Determine if this tile is along the nav path
      let isPath = false, pulse = 1;
      if(navTarget) {
        const ddx=navTarget.gx-px, ddy=navTarget.gy-py, dlen=Math.hypot(ddx,ddy);
        if(dlen > 0.5){
          const t=Math.max(0,Math.min(1,((wx-px)*ddx+(wy-py)*ddy)/(dlen*dlen)));
          const nx=px+t*ddx, ny2=py+t*ddy;
          if(Math.hypot(wx-nx,wy-ny2)<0.9) { isPath=true; pulse=0.55+0.45*Math.sin(ts*0.006-dist*0.6); }
        }
      }

      ctx.save();
      if(isPath) {
        const col = navTarget.col||'#5DCAA5';
        ctx.globalAlpha = a * pulse * 0.42;
        ctx.fillStyle = col+'55';
        ctx.fillRect(sx-tW*0.5, sy-tH*0.5, tW, tH);
        ctx.globalAlpha = a * pulse * 0.85;
        ctx.strokeStyle = col; ctx.lineWidth = 1.1;
        ctx.strokeRect(sx-tW*0.5, sy-tH*0.5, tW, tH);
        // Corner accent dots
        ctx.fillStyle = col; ctx.globalAlpha = a * pulse;
        [[-.49,-.48],[.49,-.48],[-.49,.48],[.49,.48]].forEach(([dx2,dy2]) => {
          ctx.beginPath(); ctx.arc(sx+dx2*tW, sy+dy2*tH, Math.max(0.8,tW*0.045),0,Math.PI*2); ctx.fill();
        });
      } else {
        ctx.globalAlpha = a * 0.22;
        ctx.strokeStyle='rgba(83,74,183,0.9)'; ctx.lineWidth=0.5;
        ctx.strokeRect(sx-tW*0.5, sy-tH*0.5, tW, tH);
      }
      ctx.restore();
    }
  }
}

// ── Navigation Beacon — screen-edge arrow pointing to target ──────────────────
function drawNavBeacon(ctx, CW, CH, angle, px, py, targetGx, targetGy, targetName, targetCol, dist, ts) {
  if(dist < 1.2) return;
  const targetAngle = Math.atan2(targetGy - py, targetGx - px);
  let rel = targetAngle - angle;
  while(rel > Math.PI)  rel -= Math.PI*2;
  while(rel < -Math.PI) rel += Math.PI*2;

  // Place beacon: left/right screen edge or top center
  let bx, by;
  const pulse = 0.8 + 0.2*Math.sin(ts*0.004);
  if(Math.abs(rel) < 0.35) {
    bx = CW/2; by = 46;
  } else if(rel < 0) {
    bx = 38; by = CH/2;
  } else {
    bx = CW-38; by = CH/2;
  }

  ctx.save();
  // Outer glow
  const gr = ctx.createRadialGradient(bx, by, 0, bx, by, 26*pulse);
  gr.addColorStop(0, targetCol+'55'); gr.addColorStop(1, targetCol+'00');
  ctx.fillStyle = gr; ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.arc(bx, by, 26*pulse, 0, Math.PI*2); ctx.fill();

  // Arrow body (pointing toward rel direction)
  ctx.translate(bx, by);
  ctx.rotate(rel + Math.PI/2);
  ctx.fillStyle = targetCol; ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.moveTo(0, -15); ctx.lineTo(8, 5); ctx.lineTo(0, 1); ctx.lineTo(-8, 5); ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Label + distance below beacon
  ctx.save();
  ctx.font = `700 7px 'Space Mono',monospace`;
  ctx.textAlign = 'center'; ctx.fillStyle = targetCol; ctx.globalAlpha = 0.85;
  const short = targetName.length>11 ? targetName.slice(0,11) : targetName;
  const lblY = (by > CH/2) ? by+28 : by+28;
  ctx.fillText(short.toUpperCase(), bx, lblY);
  ctx.font = `400 6px 'Space Mono',monospace`; ctx.globalAlpha = 0.6;
  ctx.fillText(Math.round(dist)+' tiles', bx, lblY+10);
  ctx.restore();
}

// ── District Sign labels floating in world-space ──────────────────────────────
const DISTRICT_SIGNS = [
  {gx:5,   gy:0,   label:'ARSENALE',    col:'#ff8800'},
  {gx:-5,  gy:1,   label:'CANNAREGIO',  col:'#00ff88'},
  {gx:-1,  gy:7,   label:'DORSODURO',   col:'#00ccff'},
  {gx:1.5, gy:-3,  label:'GRAND CANAL', col:'#00aaff'},
  {gx:-1,  gy:2,   label:'SAN MARCO',   col:'#cc88ff'},
];
function drawDistrictSigns(ctx, px, py, dirX, dirY, plX, plY, zBuf, CW, CH, ts) {
  const inv = 1.0/(plX*dirY - dirX*plY);
  DISTRICT_SIGNS.forEach(s => {
    const rx = s.gx-px, ry = s.gy-py;
    const tx2 = inv*(dirY*rx - dirX*ry);
    const ty2 = inv*(-plY*rx + plX*ry);
    if(ty2 <= 0.1 || ty2 > 14) return;
    const sx = Math.floor((CW/2)*(1.0+tx2/ty2));
    if(sx < 0 || sx > CW) return;
    const a = Math.max(0, Math.min(0.85, (1 - ty2/12)));
    const sy = CH/2 - 38/ty2;
    const pulse = 0.7 + 0.3*Math.sin(ts*0.0007+sx*0.01);
    ctx.save();
    ctx.globalAlpha = a * pulse;
    ctx.font = `700 ${Math.max(7, Math.min(13, (28/ty2)|0))}px 'Space Mono',monospace`;
    ctx.textAlign = 'center';
    // Background pill
    const fw = ctx.measureText(s.label).width;
    ctx.fillStyle = 'rgba(2,0,18,0.7)';
    ctx.fillRect(sx-fw/2-5, sy-11, fw+10, 13);
    // Text
    ctx.fillStyle = s.col;
    ctx.fillText(s.label, sx, sy);
    ctx.restore();
  });
}

// ── Aura Vision Overlay ────────────────────────────────────────────────────────
// Paints radial mood halos over NPC projected positions — diegetic emotion map
function drawAuraVision(ctx, npcs, px, py, dirX, dirY, plX, plY, zBuf, CW, CH, ts) {
  const inv = 1.0 / (plX*dirY - dirX*plY);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  npcs.forEach(n => {
    const rx = n.gx-px, ry = n.gy-py;
    const tx2 = inv*(dirY*rx - dirX*ry);
    const ty2 = inv*(-plY*rx + plX*ry);
    if(ty2 <= 0.1) return;
    const sx = Math.floor((CW/2)*(1.0+tx2/ty2));
    if(sx < -80 || sx > CW+80) return;
    const dist = Math.hypot(rx, ry);
    const r = Math.max(18, Math.min(120, 180/ty2));
    const a = Math.max(0.04, Math.min(0.22, 0.28 - dist*0.012)) * (0.7+0.3*Math.sin(ts*0.0012+n.phase));
    const sy2 = CH*0.5;
    const gr = ctx.createRadialGradient(sx, sy2, 0, sx, sy2, r);
    gr.addColorStop(0, n.col+'55');
    gr.addColorStop(0.5, n.col+'22');
    gr.addColorStop(1, n.col+'00');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(sx, sy2, r, 0, Math.PI*2); ctx.fill();
  });
  ctx.restore();
}

// ── Digital Grafts ─────────────────────────────────────────────────────────────
// Renders ghost memory marks left by players (and seeded defaults) in world space
function drawGrafts(ctx, grafts, px, py, dirX, dirY, plX, plY, zBuf, emp, ts, CW, CH) {
  const inv = 1.0 / (plX*dirY - dirX*plY);
  grafts.forEach(g => {
    const rx = g.gx-px, ry = g.gy-py;
    const tx2 = inv*(dirY*rx - dirX*ry);
    const ty2 = inv*(-plY*rx + plX*ry);
    if(ty2 <= 0.1) return;
    const sx = Math.floor((CW/2)*(1.0+tx2/ty2));
    if(sx < 0 || sx > CW) return;
    if(sx >= 0 && sx < CW && zBuf[sx] < ty2) return;
    const a = Math.max(0.05, Math.min(0.75, 1.0 - ty2/8)) * (0.6+0.4*Math.sin(ts*0.00065+rx));
    const sy2 = CH*0.5 - 4/ty2;
    // Floating orb
    ctx.save();
    ctx.globalAlpha = a;
    const gr2 = ctx.createRadialGradient(sx, sy2, 0, sx, sy2, 12/ty2);
    gr2.addColorStop(0, g.col+'cc');
    gr2.addColorStop(1, g.col+'00');
    ctx.fillStyle = gr2;
    ctx.beginPath(); ctx.arc(sx, sy2, 12/ty2, 0, Math.PI*2); ctx.fill();
    // Text label when close
    if(ty2 < 4.5) {
      const fs = Math.max(6, Math.min(11, (20/ty2)|0));
      ctx.font = `400 ${fs}px 'Space Mono',monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = g.col;
      ctx.globalAlpha = a * 0.88;
      ctx.fillText(g.msg, sx, sy2 - 14/ty2 - 2);
    }
    ctx.restore();
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function GameScreen({ visible, config, onEnd }) {
  const canvasRef = useRef(null);

  const [hud, setHud] = useState({
    time:'06:00',zones:'0/5',bonds:0,pressure:30,legibility:50,events:0,
    comply:0,refuse:0,subvert:0,archetype:'THE WANDERER',archetypeColor:'rgba(175,169,236,.5)',
    dayPct:0,dayColor:'#534AB7',compPct:0,refPct:0,subPct:0,
    cityEmotion:'LONELY',cityEmotionCol:'#534AB7',
    district:'SAN MARCO',districtCol:'#AFA9EC',
    playerTypeName:null,playerTypeColor:'#7F77DD',
    empState:'NEUTRAL',empCol:'#5DCAA5',
  });
  const [encounter, setEncounter] = useState(null);
  const [feed, setFeed] = useState([]);
  const [bonds, setBonds] = useState([]);
  const [keysDown, setKeysDown] = useState({w:false,a:false,s:false,d:false,q:false,e:false});
  const [ambientMsg, setAmbientMsg] = useState(null);
  // ── New level systems ──────────────────────────────────────────────────────
  const [auraVision, setAuraVision] = useState(false);
  const [waterMirror, setWaterMirror] = useState(false);
  const [questStatus, setQuestStatus] = useState(QUESTS.map(q=>({id:q.id,done:false})));
  const [playerStage, setPlayerStage] = useState('wanderer');
  const [veniceSync, setVeniceSync] = useState(null); // {weather, temp, live}
  const [showTutorial, setShowTutorial] = useState(true);
  const [hint, setHint] = useState('Use W/S to move forward/back · Q/E or A/D to turn');
  const [navChoices, setNavChoices] = useState([]);
  const [showNavPanel, setShowNavPanel] = useState(false);
  const [showQuestTab, setShowQuestTab] = useState(false);
  const auraVisionRef = useRef(false);
  const manualNavRef = useRef(null); // set from UI to override auto-navigation

  const cbRef = useRef({ handleChoice:()=>{}, handleBond:()=>{}, closeEncounter:()=>{} });
  const onChoice  = useCallback((sc,ch)   => cbRef.current.handleChoice(sc,ch), []);
  const onBond    = useCallback((n,t,a,r) => cbRef.current.handleBond(n,t,a,r), []);
  const onClose   = useCallback(()        => cbRef.current.closeEncounter(), []);
  const onEndRef  = useRef(onEnd);
  useEffect(()=>{ onEndRef.current=onEnd; },[onEnd]);
  const encOpenRef = useRef(false);
  useEffect(()=>{ encOpenRef.current=encounter!==null; },[encounter]);

  // ── Game loop ────────────────────────────────────────────────────────────────
  useEffect(()=>{
    if(!visible) return;
    const canvas=canvasRef.current;
    const ctx=canvas.getContext('2d');
    let CW=0, CH=0;

    function rsz(){
      const dpr=window.devicePixelRatio||1;
      CW=canvas.offsetWidth; CH=canvas.offsetHeight;
      canvas.width=CW*dpr; canvas.height=CH*dpr;
      ctx.scale(dpr,dpr);
    }
    rsz(); window.addEventListener('resize',rsz);

    const worldMap=buildWorldMap();

    const _pt=config.playerType||{id:'none',mods:{},startTraits:{al:[],rp:[]}};
    const mergedTraits={
      al:[...new Set([...config.traits.al,..._pt.startTraits.al])],
      rp:[...new Set([...config.traits.rp,..._pt.startTraits.rp])],
    };

    const startGX=config?.district?.spawnGX??0;
    const startGY=config?.district?.spawnGY??0;
    const GS={comply:0,refuse:0,subvert:0,
      leg:Math.max(0,Math.min(100,50+(_pt.mods.legibility||0))),
      prs:Math.max(0,Math.min(100,30+(_pt.mods.pressure||0))),
      visited:new Set(),visitCount:{},bonds:[],rituals:[],events:0,gameOver:false,
      prt:config.prt,simSpd:config.spd,
      socR:Math.max(1,Math.min(4,config.socR+(_pt.mods.socRBonus||0))),
      bloomedZones:new Set()}; // zones visited while ENV=BLOOMED (for Architect's Vision)
    // Player: gx/gy = float world position, angle = facing direction in radians
    // findOpenSpawn ensures the player never starts inside a wall
    const sp=findOpenSpawn(startGX+0.5, startGY+0.5, worldMap);
    const PL={gx:sp.gx, gy:sp.gy, angle:0.3};
    const K={w:false,a:false,s:false,d:false,q:false,e:false};
    let npcs=[],rings=[],sparks=[],floats=[];
    let dayMinutes=360,weather='clear',wTimer=0,wNext=600,rainD=[];
    let firedEvs=new Set(),evCount=0,nearCool=0,lastNear=null,frameCount=0;
    let bridgeCool=0,wasInCanal=false,canalBloomCool=0;
    // Environmental Empathy state (0=contracted/sad, 0.5=neutral, 1=bloomed/joyful)
    let envEmpathy=0.5,bloomBridgeOpen=false,shadowGateActive=false;
    let vibeClashVal=0,lastEmpMilestone='neutral';
    // New level systems
    let currentStage='wanderer';
    let questCompleted=new Set();
    let wmNearCanal=false;
    let loopGrafts=[...DEFAULT_GRAFTS,...JSON.parse(localStorage.getItem('nv_grafts')||'[]')];
    let graftCool=0;
    let navTarget=null; // {gx,gy,name,col} — recomputed each frame
    let playerTrail=[]; // ring buffer of past {gx,gy} — rendered as floor aura trail
    let trailSampleT=0; // counts frames between trail samples
    let camBob=0,bobPhase=0; // camera vertical bob when walking

    for(let i=0;i<config.pop;i++) npcs.push(mkNPC(i));

    // Fetch live Venice weather on init
    fetchVeniceWeather().then(w=>{
      if(w.live){
        setVeniceSync({weather:w.gameWeather,temp:Math.round(w.temp)});
        if(w.gameWeather==='rain'&&weather==='clear'){weather='rain';initRain();}
        else if(w.gameWeather==='fog') weather='fog';
      }
    });

    // World→screen projection using first-person camera
    function w2s(gx,gy){
      const rx=gx-PL.gx,ry=gy-PL.gy;
      const dx=Math.cos(PL.angle),dy=Math.sin(PL.angle);
      const px2=Math.sin(PL.angle)*0.66,py2=-Math.cos(PL.angle)*0.66;
      const inv=1.0/(px2*dy-dx*py2);
      const tx2=inv*(dy*rx-dx*ry);
      const ty2=inv*(-py2*rx+px2*ry);
      if(ty2<=0.05) return {x:CW/2,y:CH/2};
      return {x:Math.floor((CW/2)*(1.0+tx2/ty2)),y:Math.max(10,CH/2-20/ty2)|0};
    }

    function getDistrict(gx,gy){
      if(gx>=1&&gx<=2)  return {n:'GRAND CANAL',c:'#00ccff'};
      if(gx>=3)         return {n:'ARSENALE',c:'#ff8800'};
      if(gx<=-3||gy<=-2)return {n:'CANNAREGIO',c:'#00ff88'};
      if(gy>=5)         return {n:'DORSODURO',c:'#00ccff'};
      return {n:'SAN MARCO',c:'#cc88ff'};
    }

    function addRings(sx,sy,col,n){for(let i=0;i<(n||2);i++) rings.push({x:sx+(Math.random()-.5)*14,y:sy+(Math.random()-.5)*6,r:4+i*7,mR:55+i*12,a:.7,col,sp:1.3+Math.random()*.6});}
    function addSparks(sx,sy,col){for(let i=0;i<5;i++) sparks.push({x:sx,y:sy,vx:(Math.random()-.5)*2,vy:-Math.random()*2-.4,a:.9,r:1+Math.random()*1.5,col});}
    function addFloat(sx,sy,txt,col){floats.push({x:sx,y:sy,txt,col,a:1,vy:-.7,life:110});}
    function pushFeed(txt){setFeed(p=>[{id:Date.now()+Math.random(),txt},...p].slice(0,7));}
    function showAmbient(txt){setAmbientMsg(txt);setTimeout(()=>setAmbientMsg(null),2200);}
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
      const c={};npcs.forEach(n=>{c[n.emotion]=(c[n.emotion]||0)+1;});
      const top=Object.entries(c).sort((a,b)=>b[1]-a[1])[0];
      return top?top[0]:'calm';
    }
    function matchScore(npc){
      const pt=mergedTraits;let m=0,cl=0;
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
    function buildHud(){
      const{comply:c,refuse:r,subvert:s}=GS,mx=Math.max(c,r,s,1),arch=getArch();
      const tp=dayMinutes/1440;
      let tc='#534AB7';
      if(tp<.25)tc='#3C3489';else if(tp<.5)tc='#00ffcc';else if(tp<.75)tc='#ff8800';
      const ce=getCityEmotion(),cmood=MOODS.find(m=>m.id===ce)||MOODS[3];
      const ec={};npcs.forEach(n=>{ec[n.emotion]=(ec[n.emotion]||0)+1;});
      const tn=npcs.length||1;
      const d=getDistrict(PL.gx,PL.gy);
      return{time:timeStr(dayMinutes),zones:GS.visited.size+'/5',bonds:GS.bonds.length,
        pressure:Math.round(GS.prs),legibility:Math.round(GS.leg),events:evCount,
        comply:c,refuse:r,subvert:s,archetype:arch.n,archetypeColor:arch.c,
        dayPct:tp*100,dayColor:tc,
        compPct:Math.round(c/mx*100),refPct:Math.round(r/mx*100),subPct:Math.round(s/mx*100),
        cityEmotion:cmood.label,cityEmotionCol:cmood.col,
        playerTypeName:_pt.id!=='none'?_pt.name:null,playerTypeColor:_pt.col||'#7F77DD',
        district:d.n,districtCol:d.c,
        empState:envEmpathy>0.72?'BLOOMED':envEmpathy<0.28?'CONTRACTED':'NEUTRAL',
        empCol:envEmpathy>0.72?'#FAC775':envEmpathy<0.28?'#534AB7':'#5DCAA5'};
    }

    function addBond(npc,type){
      if(!GS.bonds.find(b=>b.id===npc.id)){
        GS.bonds.push({id:npc.id,name:npc.name,col:npc.col,type,depth:0,emotion:npc.emotion});
        npc.bonded=true;npc.bondWith='player';npc.bondType=type;npc.bondDepth=0;
        setBonds([...GS.bonds]);
        if(type==='mutual') playBondFormed(); else playBondClash();
      }
    }
    function closeEncounter(){setEncounter(null);nearCool=120;}
    function handleChoice(sc,ch){
      let dl=ch.l,dp=ch.p;
      if(_pt.id==='herald'&&ch.dc>0) dl+=8;
      if((_pt.id==='shade'||_pt.id==='glitch')&&ch.ds>0) dp-=5;
      if(_pt.id==='broker'){dl+=2;dp-=2;}
      GS.comply+=ch.dc;GS.refuse+=ch.dr;GS.subvert+=ch.ds;
      GS.leg=Math.max(0,Math.min(100,GS.leg+dl));
      GS.prs=Math.max(0,Math.min(100,GS.prs+dp));
      GS.visitCount[sc.id]=(GS.visitCount[sc.id]||0)+1;
      npcs.filter(n=>Math.hypot(n.gx-sc.gx,n.gy-sc.gy)<3).slice(0,3).forEach(n=>{n.react=true;n.reactT=performance.now();});
      const pp=w2s(sc.gx,sc.gy);
      addRings(pp.x,pp.y,sc.col,ch.y==='b'?4:2);
      addFloat(pp.x,pp.y-20,ch.b,ch.y==='b'?'#ff4488':ch.y==='g'?'#00ffcc':'#aa88ff');
      pushFeed(sc.label+': '+ch.b);
      setHud(buildHud());
      setEncounter(prev=>prev?{...prev,visited:new Set(GS.visited)}:null);
      if(GS.visited.size>=SCENES.length&&!GS.gameOver){
        setTimeout(()=>{closeEncounter();endGame();},2400);
      }
    }
    function handleBond(npc,type,act,ritual){
      if(act&&act.e==='c'){GS.prs=Math.max(0,GS.prs-(_pt.id==='weaver'?10:5));addBond(npc,'mutual');}
      else if(act&&act.e==='r'){GS.subvert++;addBond(npc,'clash');}
      if(ritual){
        if(ritual.id==='silence')   GS.prs=Math.max(0,GS.prs-12);
        if(ritual.id==='broadcast') GS.leg=Math.min(100,GS.leg+15);
        if(ritual.id==='aura_swap'){GS.subvert++;GS.prs=Math.max(0,GS.prs-6);}
        if(ritual.id==='void_walk'){GS.refuse++;GS.leg=Math.max(0,GS.leg-10);}
        GS.rituals.push(ritual.id);addBond(npc,'mutual');
        const pp=w2s(npc.gx,npc.gy);
        addRings(pp.x,pp.y,'#7F77DD',4);addSparks(pp.x,pp.y,'#7F77DD');
        addFloat(pp.x,pp.y-25,ritual.n,'#aa88ff');
        pushFeed('Ritual: '+ritual.n+' with '+npc.name);
      }
      npc.react=true;npc.reactT=performance.now();nearCool=150;setHud(buildHud());
    }
    function endGame(){
      GS.gameOver=true;
      onEndRef.current({arch:getArch(),comply:GS.comply,refuse:GS.refuse,subvert:GS.subvert,
        bonds:GS.bonds,rituals:GS.rituals.length,events:evCount});
    }
    function openZone(sc){
      if(encOpenRef.current||GS.gameOver) return;
      GS.visited.add(sc.id);
      // Track for Architect's Vision quest — count only if currently BLOOMED
      if(envEmpathy>0.65&&!GS.bloomedZones.has(sc.id)){
        GS.bloomedZones.add(sc.id);
        const bz=GS.bloomedZones.size;
        if(bz<4) showAmbient(`Architect's Vision: ${bz}/4 zones while BLOOMED ✓`);
        pushFeed(`BLOOM ZONE ${bz}/4: ${sc.label}`);
      } else if(envEmpathy<=0.65&&!questCompleted.has('architects_vision')){
        showAmbient('Tip: ENV is not BLOOMED — bond more NPCs first, then visit zones for Architect\'s Vision.');
      }
      setEncounter({type:'zone',scene:sc,visitCount:GS.visitCount[sc.id]||0,visited:new Set(GS.visited)});
      const pp=w2s(sc.gx,sc.gy);
      addRings(pp.x,pp.y,sc.col,3);addSparks(pp.x,pp.y,sc.col);
      pushFeed('Entered: '+sc.label);nearCool=200;playZoneEnter();
    }
    function openBridgeEncounter(){
      if(encOpenRef.current||GS.gameOver) return;
      const scene=BRIDGE_SCENES.find(s=>dayMinutes>=s.timeRange[0]&&dayMinutes<s.timeRange[1])
        ||BRIDGE_SCENES[Math.floor(dayMinutes/480)%BRIDGE_SCENES.length];
      const positioned={...scene,gx:Math.round(PL.gx),gy:Math.round(PL.gy)};
      const pp=w2s(1.5,PL.gy);
      addRings(pp.x,pp.y,'#00ccff',3);addSparks(pp.x,pp.y,'#00ccff');
      setEncounter({type:'bridge',scene:positioned});
      pushFeed('Crossing the Grand Canal…');nearCool=200;playBridgeCross();
    }
    function clickNPC(npc){
      if(encOpenRef.current||GS.gameOver) return;
      setEncounter({type:'npc',npc,matchScore:matchScore(npc),district:getDistrict(npc.gx,npc.gy)});
      const pp=w2s(npc.gx,npc.gy);
      addRings(pp.x,pp.y,npc.col,2);pushFeed('Nearby: '+npc.name);nearCool=200;
    }
    cbRef.current={handleChoice,handleBond,closeEncounter};

    // Keyboard
    function onKD(e){
      const k=e.key.toLowerCase();
      if(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright','q','e','tab'].includes(k)) e.preventDefault();
      if(k==='w'||k==='arrowup')    K.w=true;
      if(k==='s'||k==='arrowdown')  K.s=true;
      if(k==='a')                   K.a=true;
      if(k==='d')                   K.d=true;
      if(k==='q'||k==='arrowleft')  K.q=true;
      if(k==='e'||k==='arrowright') K.e=true;
      if(k==='tab'){ auraVisionRef.current=!auraVisionRef.current; setAuraVision(auraVisionRef.current); }
      setKeysDown({...K});
    }
    function onKU(e){
      const k=e.key.toLowerCase();
      if(k==='w'||k==='arrowup')    K.w=false;
      if(k==='s'||k==='arrowdown')  K.s=false;
      if(k==='a')                   K.a=false;
      if(k==='d')                   K.d=false;
      if(k==='q'||k==='arrowleft')  K.q=false;
      if(k==='e'||k==='arrowright') K.e=false;
      setKeysDown({...K});
    }
    window.addEventListener('keydown',onKD);
    window.addEventListener('keyup',onKU);
    window.addEventListener('keydown',()=>initSound(),{once:true});
    canvas.addEventListener('click',()=>initSound(),{once:true});
    // Minimap click → offer navigation choices
    function onMapClick(e){
      const rect=canvas.getBoundingClientRect();
      const cx=(e.clientX-rect.left)*(CW/rect.width);
      const cy=(e.clientY-rect.top)*(CH/rect.height);
      const MM=130, mmX=CW-MM-8, mmY=40;
      if(cx>=mmX&&cx<=mmX+MM&&cy>=mmY&&cy<=mmY+MM){
        const sc2=MM/22, offX=PL.gx-11, offY=PL.gy-11;
        const wX=(cx-mmX)/sc2+offX, wY=(cy-mmY)/sc2+offY;
        const choices=[];
        SCENES.forEach(sc=>{if(Math.hypot(sc.gx-wX,sc.gy-wY)<4) choices.push({label:sc.label,gx:sc.gx,gy:sc.gy,col:sc.col});});
        npcs.filter(n=>n.bonded&&n.bondWith==='player').forEach(n=>{if(Math.hypot(n.gx-wX,n.gy-wY)<3) choices.push({label:n.name,gx:n.gx,gy:n.gy,col:n.col});});
        if(!choices.length) choices.push({label:'Walk here',gx:Math.round(wX)+0.5,gy:Math.round(wY)+0.5,col:'#00ffcc'});
        setNavChoices(choices);
        setShowNavPanel(true);
      }
    }
    canvas.addEventListener('click',onMapClick);

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
          if(shared.length>0){const bt=Math.random()>.3?'mutual':'clash';n.bonded=true;n.bondWith=other.id;n.bondType=bt;other.bonded=true;other.bondWith=n.id;other.bondType=bt;pushFeed((bt==='mutual'?'Bond':'Clash')+': '+n.name+'+'+other.name);}}
      }
      n.tagT++;if(n.tagT>320)n.tagT=0;
      n.moodTimer=(n.moodTimer||0)+dt;
      if(n.moodTimer>3500+Math.random()*3000){
        n.moodTimer=0;
        const pd=Math.hypot(PL.gx-n.gx,PL.gy-n.gy);
        if(pd<2.5){
          const pe=getPlayerEmotion();
          if(pe!==n.emotion&&Math.random()>.5){
            n.emotion=pe;
            const pp=w2s(n.gx,n.gy);
            const mc=MOODS.find(m=>m.id===pe);
            addFloat(pp.x,pp.y-28,mc?mc.label:pe,mc?mc.col:'#aa88ff');
          }
        } else if(pd>4&&Math.random()>.68){
          n.emotion=MOODS[Math.floor(Math.random()*MOODS.length)].id;
        }
      }
      if(n.bonded&&n.bondWith==='player'&&Math.hypot(PL.gx-n.gx,PL.gy-n.gy)<1.8){
        if(Math.random()>.9995&&n.bondDepth<3){
          n.bondDepth=Math.min(3,n.bondDepth+1);
          const pp=w2s(n.gx,n.gy);
          addFloat(pp.x,pp.y-28,BOND_DEPTHS[n.bondDepth],'#00ffcc');
          pushFeed(n.name+' → '+BOND_DEPTHS[n.bondDepth]);
          const gb=GS.bonds.find(b=>b.id===n.id);if(gb) gb.depth=n.bondDepth;
          setBonds([...GS.bonds]);
        }
      }
    }

    let lastT=0,rafId,lastDn=-1,footTimer=0;
    function loop(ts){
      rafId=requestAnimationFrame(loop);
      const dt=Math.min(ts-lastT,50);lastT=ts;frameCount++;
      const dayRate=GS.simSpd/4*.0004;
      dayMinutes=(dayMinutes+dt*dayRate*20)%1440;
      const dn=dayMinutes/1440;
      if(lastDn>=0){
        if(lastDn<0.25&&dn>=0.25) playDawnChime();
        if(lastDn<0.875&&dn>=0.875) playNightFall();
      }
      lastDn=dn;

      // ── Environmental Empathy — city morphs to player psyche ──────────────
      const _empTargets={joyful:0.95,calm:0.75,curious:0.65,lonely:0.22,anxious:0.10,melancholic:0.18};
      const _targetEmp=_empTargets[getPlayerEmotion()]??0.5;
      envEmpathy+= (_targetEmp - envEmpathy) * Math.min(1, dt*0.00042);
      envEmpathy = Math.max(0, Math.min(1, envEmpathy));

      // Milestone messages when empathy crosses thresholds
      const _curMilestone = envEmpathy>0.72?'bloom':envEmpathy<0.28?'contract':'neutral';
      if(_curMilestone !== lastEmpMilestone){
        lastEmpMilestone = _curMilestone;
        if(_curMilestone==='bloom'){
          showAmbient('The city opens to you. Bioluminescent moss blooms on the stones.');
          pushFeed('ENV: City morphs → BLOOMED');
          playBloomTone();
        } else if(_curMilestone==='contract'){
          showAmbient('The alley narrows. The lights above flicker and dim.');
          pushFeed('ENV: City morphs → CONTRACTED');
          playContractTone();
        }
      }

      // ── Dynamic canal gates (Vibe Mesh navigation) ────────────────────────
      // Bloom Crossing (gy=4): opens when joyful — new canal passage appears
      if(envEmpathy>0.70 && !bloomBridgeOpen){
        bloomBridgeOpen=true;
        worldMap.delete('1,4'); worldMap.delete('2,4');
        const _bp=w2s(1.5,4);
        addRings(_bp.x,_bp.y,'#FAC775',3); addFloat(_bp.x,_bp.y-24,'BLOOM CROSSING','#FAC775');
        pushFeed('A new canal crossing blooms near Dorsoduro.');
      } else if(envEmpathy<=0.70 && bloomBridgeOpen){
        bloomBridgeOpen=false;
        if(!worldMap.has('1,4')) worldMap.set('1,4',{solid:true,h:1,water:true});
        if(!worldMap.has('2,4')) worldMap.set('2,4',{solid:true,h:1,water:true});
        pushFeed('Bloom crossing fades into the canal.');
      }

      // Shadow Gate (gy=6): seals south bridge when contracted
      if(envEmpathy<0.28 && !shadowGateActive){
        shadowGateActive=true;
        worldMap.set('1,6',{solid:true,h:1,water:true,shadowGate:true});
        worldMap.set('2,6',{solid:true,h:1,water:true,shadowGate:true});
        const _sg=w2s(1.5,6);
        addRings(_sg.x,_sg.y,'#534AB7',2); addFloat(_sg.x,_sg.y-20,'SHADOW GATE','#534AB7');
        pushFeed('South canal crossing sealed by shadow.');
      } else if(envEmpathy>=0.28 && shadowGateActive){
        shadowGateActive=false;
        const _sgc=worldMap.get('1,6');
        if(_sgc&&_sgc.shadowGate){ worldMap.delete('1,6'); worldMap.delete('2,6'); }
        pushFeed('South crossing reopens.');
      }

      // ── Vibe Clash: aura collision with nearby opposite-mood NPCs ─────────
      {
        const _peVal=_empTargets[getPlayerEmotion()]??0.5;
        let _clashSum=0;
        npcs.filter(n=>Math.hypot(n.gx-PL.gx,n.gy-PL.gy)<3).forEach(n=>{
          const _neVal=_empTargets[n.emotion]??0.5;
          _clashSum+=Math.abs(_peVal-_neVal)*(1-Math.hypot(n.gx-PL.gx,n.gy-PL.gy)/3);
        });
        vibeClashVal+=( Math.min(1,_clashSum/2) - vibeClashVal)*Math.min(1,dt*0.002);
      }

      // Shape ambient sound to match empathy (every 60 frames)
      if(frameCount%60===0) setEnvEmpathy(envEmpathy);

      // ── Quest progress check (every 30 frames) ────────────────────────────
      if(frameCount%30===0){
        let changed=false;
        QUESTS.forEach(q=>{
          if(!questCompleted.has(q.id)&&q.check(GS,npcs,PL.gx,PL.gy,envEmpathy)){
            questCompleted.add(q.id);
            changed=true;
            showAmbient(q.reward);
            pushFeed('QUEST: '+q.name+' — COMPLETE');
          }
        });
        // Always update to include progress data
        setQuestStatus(QUESTS.map(q=>{
          let progress='';
          if(q.id==='architects_vision') progress=`${GS.bloomedZones.size}/4`;
          if(q.id==='melancholic_masquerade'){
            const cnt=npcs.filter(n=>n.emotion==='melancholic'&&Math.abs(n.gx-1.5)<4&&Math.hypot(n.gx-PL.gx,n.gy-PL.gy)<6).length;
            progress=`${Math.min(cnt,3)}/3`;
          }
          if(q.id==='canal_choir'){
            const cnt=GS.bonds.filter(b=>{const n=npcs.find(x=>x.id===b.id);return n&&n.emotion==='joyful'&&Math.abs(n.gx-1.5)<5;}).length;
            progress=`${Math.min(cnt,2)}/2`;
          }
          return {id:q.id,done:questCompleted.has(q.id),progress};
        }));
      }

      // ── Stage progression (every 60 frames) ──────────────────────────────
      if(frameCount%60===0){
        const bonds4=GS.bonds.length>=4,zones4=GS.visited.size>=4;
        const quest1=questCompleted.size>=1;
        let newStage='wanderer';
        if(bonds4&&zones4&&quest1) newStage='architect';
        else if(GS.bonds.length>=2||GS.visited.size>=3||lastEmpMilestone!=='neutral') newStage='catalyst';
        if(newStage!==currentStage){
          currentStage=newStage;
          setPlayerStage(newStage);
          const st=STAGES[newStage];
          showAmbient(st.desc);
          pushFeed('STAGE: '+st.label);
        }
      }

      // ── Contextual hint + turn instruction (every 60 frames) ────────────
      if(frameCount%60===0){
        const zv=GS.visited.size, bn=GS.bonds.length;
        let h='';
        // Check active quests for specific guidance (use loop var questCompleted, not React state)
        const mMasq=!questCompleted.has('melancholic_masquerade');
        const cChoir=!questCompleted.has('canal_choir');
        const aVis=!questCompleted.has('architects_vision');
        if(zv===0&&bn===0){
          h='Walk toward the glowing COLORED ORBS in the world — those are zone encounters. Press W to move.';
        } else if(zv===0){
          h='Find a glowing orb: walk straight ahead using W. Colored light = a zone encounter.';
        } else if(bn===0){
          h='QUEST: Canal Choir — walk toward glowing FIGURES (NPCs). Get close and choose RESONATE to bond.';
        } else if(zv<3&&bn<2){
          h='Keep exploring! Walk to unvisited orbs. Each zone choice shapes your ARCHETYPE.';
        } else if(mMasq&&zv>=1){
          h='QUEST: Melancholic Masquerade — walk toward the blue canal water (center of map) and find 3 glowing NPCs labeled [melancholic].';
        } else if(cChoir&&bn>=1){
          h='QUEST: Canal Choir — bond with 2 joyful NPCs near the canal. Walk toward [joyful] figures close to the blue water.';
        } else if(aVis){
          const bz=GS.bloomedZones.size;
          if(envEmpathy<0.45){
            h=`ARCHITECT'S VISION [${bz}/4] — Step 1: Your ENV is ${envEmpathy>0.35?'NEUTRAL':'CONTRACTED'}. Walk toward glowing FIGURES and choose RESONATE to bond. Each bond raises your empathy toward BLOOM.`;
          } else if(envEmpathy<0.65){
            h=`ARCHITECT'S VISION [${bz}/4] — Step 2: Getting closer! ENV is NEUTRAL. Bond 1-2 more NPCs or COMPLY at a zone encounter to push ENV to BLOOMED (you need >65%).`;
          } else if(bz===0){
            h=`ARCHITECT'S VISION [0/4] — Step 3: ENV is BLOOMED! NOW walk to any glowing colored ORB in the world and enter it. Each zone visited while BLOOMED counts. Find orbs ahead of you!`;
          } else if(bz<4){
            h=`ARCHITECT'S VISION [${bz}/4] — Keep going! Stay BLOOMED (bond NPCs if ENV drops) and walk to ${4-bz} more glowing ORB${4-bz>1?'s':''}. Look for colored lights in the distance.`;
          }
        } else if(envEmpathy<0.3){
          h='Your city feels contracted. Form a bond or COMPLY at a zone to raise your empathy and unlock BLOOM.';
        } else if(envEmpathy>0.7){
          h='City BLOOMED! Walk to the Grand Canal (blue water, center) — a new BLOOM CROSSING passage has opened.';
        } else if(Math.abs(PL.gx-1.5)<3){
          h='You\'re near the Grand Canal. Walk INTO the blue water to trigger a bridge encounter. Tab = Aura Vision.';
        } else if(bn>=2&&zv>=3){
          h='You\'re progressing well. Visit remaining zones (orbs) and bond more NPCs to reach ARCHITECT stage.';
        } else {
          h='Explore freely. Walk to glowing orbs (zones) or glowing figures (NPCs). The canal is at center.';
        }
        // Prepend turn direction if navTarget is known
        if(navTarget){
          const tAngle=Math.atan2(navTarget.gy-PL.gy,navTarget.gx-PL.gx);
          let rel=tAngle-PL.angle;
          while(rel>Math.PI)  rel-=Math.PI*2;
          while(rel<-Math.PI) rel+=Math.PI*2;
          const tdist=Math.round(Math.hypot(navTarget.gx-PL.gx,navTarget.gy-PL.gy));
          const dir=Math.abs(rel)<0.3?'↑ STRAIGHT AHEAD':rel<0?'← TURN LEFT':'→ TURN RIGHT';
          h=`${dir} · ${navTarget.name.toUpperCase()} (${tdist} tiles)  ·  ${h}`;
        }
        if(h) setHint(h);
      }

      // ── Water Mirror proximity (every 20 frames) ──────────────────────────
      if(frameCount%20===0){
        const nearCanal=Math.abs(PL.gx-1.5)<2.2&&Math.abs(PL.gy-3)<3;
        if(nearCanal!==wmNearCanal){ wmNearCanal=nearCanal; setWaterMirror(nearCanal); }
      }

      // ── Auto-graft placement (every 150 frames, catalyst+ stage) ─────────
      if(frameCount%150===0&&currentStage!=='wanderer'&&graftCool<=0){
        const msg=GRAFT_MESSAGES[Math.floor(Math.random()*GRAFT_MESSAGES.length)];
        const mood=MOODS.find(m=>m.id===getPlayerEmotion());
        const newGraft={id:'pg'+frameCount,gx:PL.gx+(Math.random()-.5)*0.6,gy:PL.gy+(Math.random()-.5)*0.6,
          msg,col:mood?mood.col:'#5DCAA5'};
        loopGrafts=[...loopGrafts,newGraft];
        // Persist player grafts to localStorage (keep last 20)
        const saved=JSON.parse(localStorage.getItem('nv_grafts')||'[]');
        saved.push(newGraft);
        localStorage.setItem('nv_grafts',JSON.stringify(saved.slice(-20)));
        graftCool=300;
      }
      if(graftCool>0) graftCool--;

      DAY_EVENTS.forEach(ev=>{if(!firedEvs.has(ev.id)&&dayMinutes>=ev.t&&dayMinutes<ev.t+5){firedEvs.add(ev.id);pushFeed(ev.msg);showAmbient(ev.msg);evCount++;if(_pt.id==='watcher')GS.prs=Math.max(0,GS.prs-4);}});
      if(dayMinutes<5&&firedEvs.size>0) firedEvs.clear();
      wTimer+=dt;if(wTimer>wNext){wTimer=0;wNext=8000+Math.random()*15000;const wl=WEATHERS.filter(w=>w!==weather);weather=wl[Math.floor(Math.random()*wl.length)];pushFeed('Weather: '+weather.toUpperCase());if(weather==='rain')initRain();}
      if(frameCount%30===0) setCanalVolume(1-Math.min(1,Math.abs(PL.gx-1.5)/5));

      // ── Movement ──
      if(!encOpenRef.current){
        // dt-scaled speeds — responsive regardless of frame rate
        const moveSpd = dt * 0.0025;   // ~2.2 units/sec at 60fps
        const turnSpd = dt * 0.0019;   // ~110°/sec — comfortable FPS turning
        const dx=Math.cos(PL.angle),dy=Math.sin(PL.angle);
        const perpX=-dy,perpY=dx;
        if(K.a) PL.angle-=turnSpd;
        if(K.d) PL.angle+=turnSpd;
        let nx=PL.gx,ny=PL.gy;
        if(K.w){nx+=dx*moveSpd;ny+=dy*moveSpd;}
        if(K.s){nx-=dx*moveSpd*0.65;ny-=dy*moveSpd*0.65;}
        if(K.q){nx-=perpX*moveSpd*.8;ny-=perpY*moveSpd*.8;}
        if(K.e){nx+=perpX*moveSpd*.8;ny+=perpY*moveSpd*.8;}
        // Wall-sliding collision (separate X and Y axes) — 0.20 gives wider-feeling passages
        const mg=0.20;
        const nxS=nx>PL.gx?nx+mg:nx-mg, nyS=ny>PL.gy?ny+mg:ny-mg;
        if(!worldMap.get(`${Math.floor(nxS)},${Math.floor(PL.gy)}`)?.solid) PL.gx=nx;
        if(!worldMap.get(`${Math.floor(PL.gx)},${Math.floor(nyS)}`)?.solid) PL.gy=ny;
        PL.gx=Math.max(-8,Math.min(9,PL.gx));PL.gy=Math.max(-6,Math.min(9,PL.gy));
        const moving=K.w||K.s||K.q||K.e;
        if(moving){footTimer+=dt;if(footTimer>320){footTimer=0;playFootstep(PL.gx>0.4&&PL.gx<2.6);}}
        else footTimer=0;
        // Camera bob — oscillates while moving, decays to zero when still
        if(moving){ bobPhase+=dt*0.007; camBob=Math.sin(bobPhase)*5; }
        else{ camBob*=0.80; if(Math.abs(camBob)<0.15) camBob=0; }
        // Trail sampling — one point every 4 frames while moving
        if(moving){ if(++trailSampleT>=4){ trailSampleT=0; playerTrail.push({gx:PL.gx,gy:PL.gy}); if(playerTrail.length>80) playerTrail.shift(); } }

        if(nearCool>0){nearCool--;}else{
          for(const sc of SCENES){if(GS.visited.has(sc.id)||GS.gameOver)continue;if(Math.hypot(PL.gx-sc.gx,PL.gy-sc.gy)<1.6&&lastNear!==sc.id){lastNear=sc.id;openZone(sc);break;}}
          const sr=GS.socR===1?2:GS.socR===3?4:3;
          for(const n of npcs){if(!n.bonded&&n.mood==='open'&&Math.hypot(PL.gx-n.gx,PL.gy-n.gy)<sr*.65&&Math.random()>.988){playNPCNear();clickNPC(n);break;}}
        }

        // Canal vibe match
        if(canalBloomCool<=0){
          const pEmo=getPlayerEmotion(),cMood=MOODS.find(m=>m.id===pEmo);
          if(Math.abs(PL.gx-1.5)<2.5&&cMood){
            const cMatch=npcs.find(n=>n.emotion===pEmo&&Math.abs(n.gx-1.5)<2.5&&Math.hypot(n.gx-PL.gx,n.gy-PL.gy)<4&&!n.bonded);
            if(cMatch){
              canalBloomCool=240;
              const mp=w2s(1.5,(PL.gy+cMatch.gy)/2);
              addRings(mp.x,mp.y,cMood.col,5);addSparks(mp.x,mp.y,cMood.col);
              addFloat(mp.x,mp.y-24,'CANAL RESONANCE',cMood.col);
              pushFeed('Canal: '+pEmo+' resonance with '+cMatch.name);playCanalBloom();
            }
          }
        }
        if(canalBloomCool>0) canalBloomCool--;

        // Bridge crossing
        const inCanalNow=PL.gx>0.5&&PL.gx<2.5;
        if(inCanalNow&&!wasInCanal&&bridgeCool===0&&!GS.gameOver) openBridgeEncounter();
        if(bridgeCool>0) bridgeCool--;
        wasInCanal=inCanalNow;
      }

      npcs.forEach(n=>tickNPC(n,dt));

      // ── Navigation target — manual (minimap click) takes priority ────────
      {
        const mn=manualNavRef.current;
        if(mn){
          if(Math.hypot(mn.gx-PL.gx,mn.gy-PL.gy)<1.5){ manualNavRef.current=null; navTarget=null; }
          else navTarget={gx:mn.gx,gy:mn.gy,name:mn.label||mn.name||'TARGET',col:mn.col||'#00ffcc'};
        } else {
          const avDone=questCompleted.has('architects_vision');
          if(!avDone && envEmpathy<0.65 && GS.bonds.length<5){
            const nearest=npcs.filter(n=>!n.bonded&&n.mood==='open')
              .sort((a,b)=>Math.hypot(a.gx-PL.gx,a.gy-PL.gy)-Math.hypot(b.gx-PL.gx,b.gy-PL.gy))[0];
            navTarget=nearest?{gx:nearest.gx,gy:nearest.gy,name:nearest.name,col:nearest.col}:null;
          } else {
            const nearest=SCENES.filter(s=>!GS.visited.has(s.id))
              .sort((a,b)=>Math.hypot(a.gx-PL.gx,a.gy-PL.gy)-Math.hypot(b.gx-PL.gx,b.gy-PL.gy))[0];
            navTarget=nearest?{gx:nearest.gx,gy:nearest.gy,name:nearest.label,col:nearest.col}:null;
          }
        }
      }

      // ── Render ──
      ctx.clearRect(0,0,CW,CH);
      const dirX=Math.cos(PL.angle),dirY=Math.sin(PL.angle);
      // FOV scales with empathy: contracted=tunnel vision (0.58), bloomed=expansive (0.74)
      const fovFactor=0.66+(envEmpathy-0.5)*0.16;
      const plX=Math.sin(PL.angle)*fovFactor,plY=-Math.cos(PL.angle)*fovFactor;

      // Camera bob — shift entire 3D view for walking feel; minimap/overlay stay fixed
      ctx.save();
      if(camBob) ctx.translate(0, camBob|0);

      drawSkyFloor(ctx,CW,CH,dn,ts,PL.angle,envEmpathy);
      drawFloorGrid(ctx,PL.gx,PL.gy,dirX,dirY,plX,plY,navTarget,ts,CW,CH);

      const zBuf=castRays(ctx,PL.gx,PL.gy,dirX,dirY,plX,plY,worldMap,CW,CH,dn,ts,envEmpathy);

      // Player aura trail — glowing footprints on the floor
      drawPlayerTrail(ctx,playerTrail,PL.gx,PL.gy,dirX,dirY,plX,plY,_pt.aura||'#5DCAA5',ts,CW,CH);
      // Navigation trail on the floor (before sprites so it's under figures)
      if(navTarget) drawNavTrail(ctx,PL.gx,PL.gy,dirX,dirY,plX,plY,navTarget.gx,navTarget.gy,navTarget.col,ts,CW,CH);

      drawDistrictSigns(ctx,PL.gx,PL.gy,dirX,dirY,plX,plY,zBuf,CW,CH,ts);
      drawSceneMarkers(ctx,SCENES,PL.gx,PL.gy,dirX,dirY,plX,plY,zBuf,GS.visited,ts,CW,CH);
      drawSprites(ctx,npcs,PL.gx,PL.gy,dirX,dirY,plX,plY,zBuf,CW,CH,ts);
      drawGrafts(ctx,loopGrafts,PL.gx,PL.gy,dirX,dirY,plX,plY,zBuf,envEmpathy,ts,CW,CH);
      if(auraVisionRef.current) drawAuraVision(ctx,npcs,PL.gx,PL.gy,dirX,dirY,plX,plY,zBuf,CW,CH,ts);

      // Particle effects (bob with the world)
      rings=rings.filter(rg=>{rg.r+=rg.sp;rg.a-=.017;if(rg.a<=0||rg.r>=rg.mR)return false;
        ctx.beginPath();ctx.arc(rg.x,rg.y,rg.r,0,Math.PI*2);
        ctx.strokeStyle=rg.col;ctx.lineWidth=.8;ctx.globalAlpha=rg.a;ctx.stroke();ctx.globalAlpha=1;return true;});
      sparks=sparks.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.07;p.a-=.03;if(p.a<=0)return false;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=p.col;ctx.globalAlpha=p.a;ctx.fill();ctx.globalAlpha=1;return true;});
      floats=floats.filter(f=>{f.y+=f.vy;f.a-=.013;f.life--;if(f.a<=0||f.life<=0)return false;
        ctx.font=`700 8px 'Space Mono',monospace`;ctx.textAlign='center';
        ctx.fillStyle=f.col;ctx.globalAlpha=f.a;ctx.fillText(f.txt,f.x,f.y);ctx.globalAlpha=1;return true;});

      // Ambient scene pulses
      if(Math.random()>.994){const sc=SCENES[Math.floor(Math.random()*SCENES.length)];
        if(!GS.visited.has(sc.id)){const pp=w2s(sc.gx,sc.gy);addRings(pp.x,pp.y,sc.col,1);}}

      ctx.restore(); // end camera bob

      drawMinimap(ctx,PL.gx,PL.gy,PL.angle,worldMap,npcs,SCENES,GS.visited,CW,CH);
      // Navigation beacon (screen-edge arrow)
      if(navTarget){
        const nd=Math.hypot(navTarget.gx-PL.gx,navTarget.gy-PL.gy);
        drawNavBeacon(ctx,CW,CH,PL.angle,PL.gx,PL.gy,navTarget.gx,navTarget.gy,navTarget.name,navTarget.col,nd,ts);
      }
      // Environmental Empathy overlay — vignette, petals, dust, vibe clash
      drawEnvOverlay(ctx,CW,CH,envEmpathy,ts,vibeClashVal);

      // Rain overlay
      if(weather==='rain'){
        rainD.forEach(rd=>{ctx.beginPath();ctx.moveTo(rd.x,rd.y);ctx.lineTo(rd.x-1,rd.y+8);
          ctx.strokeStyle='rgba(80,120,255,.15)';ctx.lineWidth=1;ctx.globalAlpha=rd.a;ctx.stroke();ctx.globalAlpha=1;
          rd.y+=rd.spd*2;rd.x-=.5;if(rd.y>CH){rd.y=0;rd.x=Math.random()*CW;}});
      }
      // Fog
      if(weather==='fog'||(dn<.1||dn>.88)){
        const al=weather==='fog'?.14:(dn>.88||dn<.1)?.08:0;
        if(al>0){ctx.fillStyle=`rgba(40,0,100,${al})`;ctx.fillRect(0,0,CW,CH);}
      }

      if(frameCount%8===0) setHud(buildHud());
    }

    rafId=requestAnimationFrame(loop);
    return()=>{
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize',rsz);
      window.removeEventListener('keydown',onKD);
      window.removeEventListener('keyup',onKU);
      canvas.removeEventListener('click',onMapClick);
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
          <div style={{display:'flex',flexDirection:'column',gap:3}}>
            <div className="hp">
              <span style={{display:'inline-block',width:5,height:5,borderRadius:'50%',background:'#00ffcc',marginRight:4,verticalAlign:'middle',animation:'blink 1.5s infinite'}}/>
              NEO-VENEZIA
            </div>
            <div className="hp" style={{borderColor:hud.districtCol+'44'}}>
              <b style={{color:hud.districtCol}}>{hud.district}</b>
            </div>
            <div className="hp" style={{borderColor:hud.empCol+'55'}}>
              ENV <b style={{color:hud.empCol}}>{hud.empState}</b>
            </div>
            <div className="hp" style={{borderColor:STAGES[playerStage].col+'55'}}>
              <b style={{color:STAGES[playerStage].col}}>{STAGES[playerStage].label}</b>
            </div>
            {hud.playerTypeName&&(
              <div className="hp" style={{borderColor:hud.playerTypeColor+'44'}}>
                <b style={{color:hud.playerTypeColor}}>{hud.playerTypeName}</b>
              </div>
            )}
          </div>
          <div style={{display:'flex',gap:4,flexWrap:'wrap',justifyContent:'flex-end'}}>
            <div className="hp ev">TIME <b>{hud.time}</b></div>
            <div className="hp">ZONES <b>{hud.zones}</b></div>
            <div className="hp">BONDS <b>{hud.bonds}</b></div>
            <div className="hp wr">PRESSURE <b>{hud.pressure}%</b></div>
            <div className="hp">LEG <b>{hud.legibility}%</b></div>
            <div className="hp ev">EVENTS <b>{hud.events}</b></div>
            <div className="hp" style={{borderColor:hud.cityEmotionCol+'55'}}>CITY <b style={{color:hud.cityEmotionCol}}>{hud.cityEmotion}</b></div>
            {veniceSync&&(
              <div className="hp" style={{borderColor:'#00ccff44'}}>
                VCE <b style={{color:'#00ccff'}}>{veniceSync.weather?.toUpperCase()||'—'} {veniceSync.temp}°</b>
              </div>
            )}
          </div>
        </div>

        {/* Day progress bar */}
        <div id="tbar"><div id="tfill" style={{width:`${hud.dayPct}%`,background:hud.dayColor}}/></div>

        {/* Left stat bars */}
        <div id="lstats">
          <div className="sb"><span className="sbl">COMPLY</span><div className="sbt"><div className="sbf" style={{width:`${hud.compPct}%`,background:'#aa88ff'}}/></div></div>
          <div className="sb"><span className="sbl">REFUSE</span><div className="sbt"><div className="sbf" style={{width:`${hud.refPct}%`,background:'#ff4488'}}/></div></div>
          <div className="sb"><span className="sbl">SUBVERT</span><div className="sbt"><div className="sbf" style={{width:`${hud.subPct}%`,background:'#00ffcc'}}/></div></div>
        </div>

        {/* Social graph */}
        <div id="sgraph">
          <div className="sgt">SOCIAL GRAPH</div>
          {bonds.slice(-5).map(b=>(
            <div key={b.id} className="brow">
              <div className="bd" style={{background:b.col}}/>
              <span className="bn">{b.name}</span>
              <span className={`btp ${b.type==='mutual'?'m':'c'}`}>{BOND_DEPTHS[b.depth||0]}</span>
            </div>
          ))}
        </div>

        {/* Bottom archetype bar */}
        <div id="abar">
          <div className="abi">
            <div className="anm" style={{color:hud.archetypeColor}}>{hud.archetype}</div>
            <div className="atr">
              <div className="at2"><span className="atl">COMPLY</span><div className="atb"><div className="atf" style={{width:`${hud.compPct}%`,background:'#aa88ff'}}/></div><span className="ats">{hud.comply}</span></div>
              <div className="at2"><span className="atl">REFUSE</span><div className="atb"><div className="atf" style={{width:`${hud.refPct}%`,background:'#ff4488'}}/></div><span className="ats">{hud.refuse}</span></div>
              <div className="at2"><span className="atl">SUBVERT</span><div className="atb"><div className="atf" style={{width:`${hud.subPct}%`,background:'#00ffcc'}}/></div><span className="ats">{hud.subvert}</span></div>
            </div>
          </div>
        </div>

        {/* Quest tracker */}
        <div id="quest-tracker">
          <div className="qt-title">QUESTS</div>
          {questStatus.map((q,i)=>(
            <div key={q.id} className={`qt-item${q.done?' qt-done':''}`}>
              <div className="qt-row">
                <span className="qt-dot">{q.done?'✓':'·'}</span>
                <span className="qt-name">{QUESTS[i].name}</span>
                {q.progress&&!q.done&&<span className="qt-prog">{q.progress}</span>}
              </div>
              {!q.done&&<div className="qt-desc">{QUESTS[i].desc}</div>}
            </div>
          ))}
        </div>

        {/* Architect's Vision step-by-step guide panel */}
        {!questStatus.find(q=>q.id==='architects_vision')?.done&&(
          <div id="arch-guide">
            <div className="ag-title">ARCHITECT'S VISION</div>
            <div className={`ag-step${hud.empState==='BLOOMED'?'':' ag-active'}`}>
              <span className="ag-num">1</span>
              <div className="ag-body">
                <b>Get BLOOMED</b>
                <span>Bond NPCs (choose RESONATE) · comply at zones · ENV pill must show <b style={{color:'#FAC775'}}>BLOOMED</b></span>
              </div>
              {hud.empState==='BLOOMED'&&<span className="ag-check">✓</span>}
            </div>
            <div className={`ag-step${hud.empState==='BLOOMED'?' ag-active':''}`}>
              <span className="ag-num">2</span>
              <div className="ag-body">
                <b>Visit 4 zone orbs while BLOOMED</b>
                <span>Walk to glowing colored spheres · progress: <b style={{color:'#FAC775'}}>{questStatus.find(q=>q.id==='architects_vision')?.progress||'0/4'}</b></span>
              </div>
            </div>
            <div className="ag-step">
              <span className="ag-num">3</span>
              <div className="ag-body">
                <b>If ENV drops back to NEUTRAL</b>
                <span>Bond another NPC to re-bloom before entering the next zone</span>
              </div>
            </div>
          </div>
        )}

        {/* Water Mirror — diegetic panel near canal */}
        {waterMirror&&(
          <div id="water-mirror">
            <div className="wm-title">WATER MIRROR</div>
            <div className="wm-row"><span className="wm-l">AURA</span><span className="wm-v" style={{color:hud.empCol}}>{hud.empState}</span></div>
            <div className="wm-row"><span className="wm-l">MOOD</span><span className="wm-v" style={{color:hud.cityEmotionCol}}>{hud.cityEmotion}</span></div>
            <div className="wm-row"><span className="wm-l">STAGE</span><span className="wm-v" style={{color:STAGES[playerStage].col}}>{STAGES[playerStage].label}</span></div>
            <div className="wm-row"><span className="wm-l">BONDS</span><span className="wm-v">{hud.bonds}</span></div>
            <div className="wm-sub">the canal reflects what you carry</div>
          </div>
        )}

        {/* Aura Vision toggle */}
        <button id="aura-btn" className={auraVision?'on':''} onClick={()=>{
          const next=!auraVision;
          auraVisionRef.current=next;
          setAuraVision(next);
        }} title="Toggle Aura Vision (Tab)">
          {auraVision?'AURA ON':'AURA'}
        </button>

        {/* On-screen D-pad — works for both touch and mouse */}
        <div id="dpad">
          {[
            ['q','⟵','strafe L'],['w','▲','fwd'],['e','⟶','strafe R'],
            ['a','↺','turn L'], ['s','▼','back'],['d','↻','turn R'],
          ].map(([key,icon,label])=>(
            <button
              key={key}
              className={`dp${keysDown[key]?' on':''}`}
              title={label}
              onPointerDown={e=>{e.preventDefault();window.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));}}
              onPointerUp={e=>{e.preventDefault();window.dispatchEvent(new KeyboardEvent('keyup',{key,bubbles:true}));}}
              onPointerLeave={()=>window.dispatchEvent(new KeyboardEvent('keyup',{key,bubbles:true}))}
              onPointerCancel={()=>window.dispatchEvent(new KeyboardEvent('keyup',{key,bubbles:true}))}
            >{icon}</button>
          ))}
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

        {/* Step-by-step hint bar */}
        <div id="hint-bar">
          <span className="hint-icon">→</span>
          <span className="hint-text">{hint}</span>
        </div>

        {/* Tutorial overlay — shown on first entry */}
        {showTutorial&&(
          <div id="tutorial-overlay">
            <div id="tutorial-box">
              <div className="tut-title">HOW TO PLAY</div>
              <div className="tut-section">
                <div className="tut-head">MOVE</div>
                <div className="tut-row"><kbd>W</kbd> forward &nbsp;·&nbsp; <kbd>S</kbd> backward</div>
                <div className="tut-row"><kbd>Q</kbd> strafe left &nbsp;·&nbsp; <kbd>E</kbd> strafe right</div>
                <div className="tut-row"><kbd>A</kbd> turn left &nbsp;·&nbsp; <kbd>D</kbd> turn right</div>
                <div className="tut-row tut-note">On mobile: use the D-pad buttons at the bottom</div>
              </div>
              <div className="tut-section">
                <div className="tut-head">WHAT TO DO</div>
                <div className="tut-row">Walk toward <b style={{color:'#FAC775'}}>glowing colored orbs</b> — these are zone encounters</div>
                <div className="tut-row">Walk toward <b style={{color:'#5DCAA5'}}>glowing humanoid figures</b> — these are NPCs you can bond with</div>
                <div className="tut-row">Choose <b style={{color:'#00ffcc'}}>RESONATE</b> in NPC interactions to form bonds</div>
                <div className="tut-row">Walk into the <b style={{color:'#00aaff'}}>blue canal water</b> at the center of the map for bridge events</div>
              </div>
              <div className="tut-section">
                <div className="tut-head">SPECIAL</div>
                <div className="tut-row"><kbd>Tab</kbd> toggle Aura Vision — see NPC mood halos</div>
                <div className="tut-row">Walk near the canal to open the <b style={{color:'#00ccff'}}>Water Mirror</b></div>
                <div className="tut-row">The <b style={{color:'#FAC775'}}>→ hint bar</b> at the bottom always tells you your next step</div>
              </div>
              <button className="tut-btn" onClick={()=>setShowTutorial(false)}>START EXPLORING</button>
            </div>
          </div>
        )}

        {/* Quest tab toggle button */}
        <button id="quest-tab-btn" onClick={()=>setShowQuestTab(v=>!v)} title="Quest log">
          {showQuestTab?'✕ QUESTS':'☰ QUESTS'}
        </button>

        {/* Quest tab panel — expanded quest log */}
        {showQuestTab&&(
          <div id="quest-tab-panel">
            <div className="qtp-title">QUEST LOG</div>
            {questStatus.map((q,i)=>(
              <div key={q.id} className={`qtp-item${q.done?' qtp-done':''}`}>
                <div className="qtp-row">
                  <span className="qtp-dot">{q.done?'✓':'·'}</span>
                  <span className="qtp-name">{QUESTS[i].name}</span>
                  {q.progress&&!q.done&&<span className="qtp-prog">{q.progress}</span>}
                </div>
                <div className="qtp-desc">{QUESTS[i].desc}</div>
              </div>
            ))}
            <div className="qtp-hint">TAP MAP TO SET NAVIGATION</div>
          </div>
        )}

        {/* Nav destination panel — appears after tapping minimap */}
        {showNavPanel&&(
          <div id="nav-panel">
            <div className="np-title">GO TO</div>
            {navChoices.map((ch,i)=>(
              <button key={i} className="np-btn" style={{'--nc':ch.col||'#00ffcc'}} onClick={()=>{
                manualNavRef.current=ch;
                setShowNavPanel(false);
              }}>
                <span className="np-dot" style={{background:ch.col||'#00ffcc'}}/>
                {ch.label}
              </button>
            ))}
            <button className="np-close" onClick={()=>setShowNavPanel(false)}>CANCEL</button>
          </div>
        )}

        <EncounterModal encounter={encounter} onChoice={onChoice} onBond={onBond} onClose={onClose}/>
      </div>
    </div>
  );
}
