import { useState, useRef, useEffect, useCallback } from 'react';
import { DISTRICTS } from '../constants';

const CONNECTIONS = [[0,2],[0,5],[5,3],[2,5],[5,4],[3,4],[1,3],[1,5],[0,1]];

export default function MapScreen({ visible, onSelect }) {
  const [sel, setSel] = useState(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const selRef = useRef(null);

  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if(!cv) return;
    const ctx = cv.getContext('2d');
    const W = cv.offsetWidth, H = cv.offsetHeight;
    if(!W||!H) return;
    const dpr = window.devicePixelRatio||1;
    if(cv.width !== W*dpr){ cv.width=W*dpr; cv.height=H*dpr; ctx.scale(dpr,dpr); }
    ctx.clearRect(0,0,W,H);

    // Background
    ctx.fillStyle='#03030e'; ctx.fillRect(0,0,W,H);

    // Grid lines
    ctx.strokeStyle='rgba(83,74,183,.06)'; ctx.lineWidth=.5;
    const gs=Math.min(W,H)/14;
    for(let x=0;x<W;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    // Roads
    ctx.strokeStyle='rgba(83,74,183,.12)'; ctx.lineWidth=2;
    [[.5,0,.5,1],[0,.42,1,.42],[0,.65,1,.65],[.35,0,.35,1],[.68,0,.68,.42]].forEach(([x1,y1,x2,y2])=>{
      ctx.beginPath(); ctx.moveTo(x1*W,y1*H); ctx.lineTo(x2*W,y2*H); ctx.stroke();
    });

    // Canal band
    ctx.fillStyle='rgba(0,180,255,.06)';
    ctx.fillRect(W*.38,0,W*.06,H);

    // Glow zones
    DISTRICTS.forEach(d=>{
      const x=d.mapX*W, y=d.mapY*H, r=d.radius*(W/400)*1.8;
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,d.col+'2a'); g.addColorStop(1,d.col+'00');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    });

    // Connection lines
    const now=Date.now()*.001;
    ctx.setLineDash([3,6]); ctx.strokeStyle='rgba(83,74,183,.18)'; ctx.lineWidth=.8;
    CONNECTIONS.forEach(([a,b])=>{
      if(a>=DISTRICTS.length||b>=DISTRICTS.length) return;
      ctx.beginPath();
      ctx.moveTo(DISTRICTS[a].mapX*W,DISTRICTS[a].mapY*H);
      ctx.lineTo(DISTRICTS[b].mapX*W,DISTRICTS[b].mapY*H);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Nodes
    DISTRICTS.forEach(d=>{
      const x=d.mapX*W, y=d.mapY*H, r=d.radius*(W/400);
      const isSel = selRef.current?.id===d.id;
      const pulse = r*(1+.14*Math.sin(now*2+d.mapX*9));

      ctx.beginPath(); ctx.arc(x,y,pulse,0,Math.PI*2);
      ctx.strokeStyle=d.col+(isSel?'cc':'44'); ctx.lineWidth=isSel?2:1; ctx.stroke();

      ctx.beginPath(); ctx.arc(x,y,r*.62,0,Math.PI*2);
      ctx.fillStyle=isSel?d.col+'55':d.col+'1e'; ctx.fill();

      if(d.resonanceHotspot){
        ctx.beginPath(); ctx.arc(x,y,r*.26,0,Math.PI*2);
        ctx.fillStyle='#FF88CC'+(isSel?'99':'44'); ctx.fill();
      }

      ctx.font=`700 ${Math.round(r*.26+7)}px 'Space Mono',monospace`;
      ctx.textAlign='center';
      ctx.fillStyle=isSel?d.col:'rgba(175,169,236,.7)';
      ctx.fillText(d.name,x,y+r*.88+13*(W/400));

      ctx.font=`400 ${Math.round(r*.15+5)}px 'Space Mono',monospace`;
      ctx.fillStyle=d.col+'88';
      ctx.fillText('['+d.vibe+']',x,y+r*.88+24*(W/400));
    });

    // Selection ring
    if(selRef.current){
      const d=selRef.current, x=d.mapX*W, y=d.mapY*H, r=d.radius*(W/400);
      ctx.beginPath(); ctx.arc(x,y,r*1.25+4*Math.sin(now*3),0,Math.PI*2);
      ctx.strokeStyle='#5DCAA5'; ctx.lineWidth=1.5;
      ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]);
    }

    if(visible) animRef.current=requestAnimationFrame(draw);
  }, [visible]);

  useEffect(()=>{
    if(!visible){ cancelAnimationFrame(animRef.current); return; }
    selRef.current=null; setSel(null);
    animRef.current=requestAnimationFrame(draw);
    return()=>cancelAnimationFrame(animRef.current);
  },[visible,draw]);

  function onCanvasClick(e){
    const cv=canvasRef.current; if(!cv) return;
    const rect=cv.getBoundingClientRect();
    const mx=e.clientX-rect.left, my=e.clientY-rect.top;
    const W=cv.offsetWidth, H=cv.offsetHeight;
    DISTRICTS.forEach(d=>{
      const x=d.mapX*W, y=d.mapY*H, r=d.radius*(W/400)*1.5;
      if(Math.hypot(mx-x,my-y)<r){ selectDistrict(d); }
    });
  }

  function selectDistrict(d){
    selRef.current=d; setSel(d);
  }

  return (
    <div className={`scr${visible?' on':''}`} id="scr-map">
      <div id="map-header">
        <div>
          <div className="map-title">NEO-VENEZIA · DISTRICT MAP</div>
          <div className="map-sub">Select a starting district · then enter the city</div>
        </div>
        <button className="map-enter-btn" disabled={!sel} onClick={()=>sel&&onSelect(sel)}>
          Enter {sel?sel.name:'a district'} →
        </button>
      </div>

      <div id="map-body">
        <div id="map-canvas-wrap">
          <canvas ref={canvasRef} id="mapC" onClick={onCanvasClick}/>
        </div>
        <div id="map-sidebar">
          <div className="map-hint">CLICK A DISTRICT ON THE MAP OR SELECT BELOW</div>
          {DISTRICTS.map(d=>(
            <div key={d.id}
              className={`district-card${sel?.id===d.id?' selected':''}`}
              onClick={()=>selectDistrict(d)}>
              <div className="dc-dot-row">
                <div className="dc-dot" style={{background:d.col}}/>
                <span className="dc-name">{d.name}</span>
                {d.resonanceHotspot&&<span className="dc-vibe" style={{background:'#FF88CC18',color:'#FF88CC'}}>✦ resonance</span>}
              </div>
              <div className="dc-desc">{d.desc}</div>
              <div className="dc-tags">
                {d.tags.map(t=><span key={t} className="dc-tag">{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="map-footer">
        <div className="mf-sel">Selected: <b>{sel?sel.name:'—'}</b></div>
        <div className="mf-legend">
          <div className="mfl-item"><div className="mfl-dot" style={{background:'#534AB7'}}/> Protocol zones</div>
          <div className="mfl-item"><div className="mfl-dot" style={{background:'#5DCAA5'}}/> Canal districts</div>
          <div className="mfl-item"><div className="mfl-dot" style={{background:'#FF88CC'}}/> Resonance hotspot</div>
        </div>
      </div>
    </div>
  );
}
