import { useState } from 'react';
import Slider from '../components/Slider';
import { TRAITS } from '../constants';

export default function IntroScreen({ visible, onStart }) {
  // Each trait cycles: 0=neutral, 1=align, 2=repel
  const [traitStates, setTraitStates] = useState(() => {
    const s = {};
    TRAITS.forEach(t => { s[t.id] = 0; });
    return s;
  });

  const [pop, setPop] = useState(16);
  const [prt, setPrt] = useState(63);
  const [spd, setSpd] = useState(4);
  const [socR, setSocR] = useState(2);

  function toggleTrait(id) {
    setTraitStates(prev => ({ ...prev, [id]: (prev[id] + 1) % 3 }));
  }

  function traitClass(id) {
    const s = traitStates[id];
    return 'tp' + (s === 1 ? ' a' : s === 2 ? ' r' : '');
  }

  function traitStyle(tr) {
    const s = traitStates[tr.id];
    if (s === 1) return { borderColor: tr.c, color: tr.c };
    if (s === 2) return { borderColor: 'rgba(216,90,48,.45)', color: '#F0997B' };
    return {};
  }

  function handleStart() {
    const al = TRAITS.filter(t => traitStates[t.id] === 1).map(t => t.id);
    const rp = TRAITS.filter(t => traitStates[t.id] === 2).map(t => t.id);
    onStart({ pop, prt, spd, socR, traits: { al, rp } });
  }

  return (
    <div className={`scr${visible ? ' on' : ''}`} id="scr-intro">
      <div className="gl">NEO-VENEZIA · SOCIAL SIMULATION</div>
      <div className="ttl">Neo-Venezia</div>
      <div className="sub">live simulation · the city breathes with you · bio-digital baroque</div>
      <div className="desc">
        A futuristic Venice where <em>the city reacts to your mood</em>. NPCs bond, cluster, argue, drift.
        Canal water shifts with your aura. Protocols activate and collapse. Walk through it — or watch it happen.
      </div>

      <div className="tsec">
        <div className="tsl">PICK YOUR SIGNAL TAGS · once = align · twice = repel</div>
        <div className="tg">
          {TRAITS.map(tr => (
            <div
              key={tr.id}
              className={traitClass(tr.id)}
              style={traitStyle(tr)}
              onClick={() => toggleTrait(tr.id)}
            >
              {tr.l}
            </div>
          ))}
        </div>
      </div>

      <div className="slw">
        <Slider label="POPULATION" min={4} max={28} step={2} initial={16}
          fillColor="#534AB7" thumbColor="#7F77DD"
          format={v => v} onChange={setPop} />
        <Slider label="PROTOCOL %" min={10} max={100} step={5} initial={63}
          fillColor="#534AB7" thumbColor="#7F77DD"
          format={v => v + '%'} onChange={setPrt} />
        <Slider label="SIM SPEED" min={1} max={10} step={1} initial={4}
          fillColor="#1D9E75" thumbColor="#5DCAA5"
          format={v => v} onChange={setSpd} />
        <Slider label="SOCIAL RANGE" min={1} max={3} step={1} initial={2}
          fillColor="#993556" thumbColor="#D4537E"
          format={v => ['Sm','Med','Lg'][v-1]} onChange={setSocR} />
      </div>

      <button className="go" onClick={handleStart}>Enter the city →</button>
    </div>
  );
}
