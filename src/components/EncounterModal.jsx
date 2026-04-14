import { useState } from 'react';
import { SCENES, NPC_ACTS, RITUALS, MOODS, BOND_DEPTHS } from '../constants';

// ── Zone Encounter ────────────────────────────────────────────────────────────
function ZoneEncounter({ encounter, onChoice, onClose }) {
  const { scene, visitCount, visited } = encounter;
  const [chosen, setChosen] = useState(null);

  function handleChoice(ch) {
    if (chosen) return;
    setChosen(ch);
    onChoice(scene, ch);
  }

  return (
    <>
      <div className="eey">ZONE ENCOUNTER</div>
      <div className="eh2">
        <div className="edot" style={{ background: scene.col }} />
        <div className="et2">{scene.loc}</div>
      </div>
      {visitCount > 0 && (
        <div className="emem">{scene.mem}</div>
      )}
      <div className="ebody" dangerouslySetInnerHTML={{ __html: scene.story }} />

      <div className="esec">YOUR RESPONSE</div>
      <div className="cg">
        {scene.choices.map(ch => {
          const cost = [];
          if (ch.l !== 0) cost.push((ch.l > 0 ? '+' : '') + ch.l + ' leg');
          if (ch.p !== 0) cost.push((ch.p > 0 ? '+' : '') + ch.p + ' prs');
          const isChosen = chosen && chosen.b === ch.b;
          const isLocked = chosen && !isChosen;
          return (
            <div
              key={ch.b}
              className={`cc${isChosen ? ' ch' : ''}${isLocked ? ' lk' : ''}`}
              onClick={() => handleChoice(ch)}
            >
              <span className="cb2">{ch.b}</span>
              <span className="ct2">{ch.t}</span>
              <div className="cco">{cost.join(' · ')}</div>
            </div>
          );
        })}
      </div>

      {chosen && (
        <div className={`eres on ${chosen.y}`}>{chosen.c}</div>
      )}

      <div className="efoot">
        <div className="ecl" onClick={onClose}>← keep walking</div>
        <div className="eprog">
          {SCENES.map(s => (
            <div
              key={s.id}
              className={`epd${visited.has(s.id) ? ' v' : ''}${s.id === scene.id && !visited.has(s.id) ? ' a' : ''}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}

// ── NPC Encounter ─────────────────────────────────────────────────────────────
function NpcEncounter({ encounter, onBond, onClose }) {
  const { npc, matchScore } = encounter;
  const [phase, setPhase] = useState(npc.bonded ? 'bonded' : 'actions');
  const [resultText, setResultText] = useState('');
  const [resultCls, setResultCls] = useState('w');

  const isMutual = matchScore.mutual > 0 && matchScore.clash === 0;
  const isClash = matchScore.total < 0;
  const eyeText = npc.bonded ? 'RETURNING CONNECTION' : isMutual ? 'RESONANCE' : isClash ? 'FRICTION' : 'PROXIMITY';

  const npcMood = MOODS.find(m => m.id === npc.emotion) || MOODS[3];
  const depthLabel = BOND_DEPTHS[npc.bondDepth || 0];

  const reps = npc.reps.length ? `Repels: ${npc.reps.map(r => `<em>${r}</em>`).join(', ')}. ` : '';
  let body = `${npc.name} is ${npc.mood === 'open' ? 'open to connection' : 'moving through the city alone'}. Signal tags: ${npc.ints.map(i => `<em>${i}</em>`).join(', ')}. ${reps}Protocol stance: <b>${npc.protocol}</b>.`;
  if (isMutual) body += ` <b>You share aligned interests. A connection is possible.</b>`;
  else if (isClash) body += ` <b>Your interests conflict. The protocol registers friction.</b>`;

  const acts = isMutual
    ? [NPC_ACTS[0], NPC_ACTS[1], NPC_ACTS[2], NPC_ACTS[3]]
    : isClash
    ? [NPC_ACTS[4], NPC_ACTS[5], NPC_ACTS[3], NPC_ACTS[1]]
    : [NPC_ACTS[1], NPC_ACTS[3], NPC_ACTS[0], NPC_ACTS[4]];

  // Bond deepening choices — what do you do when you return to someone?
  const deepenActs = [
    {id:'memory',   label:'SHARE A MEMORY',   desc:'Tell them something you haven\'t said to anyone else.',   col:'#5DCAA5', cls:'c'},
    {id:'silence',  label:'SIT IN SILENCE',   desc:'No words. Just proximity. The city watches.',            col:'#AFA9EC', cls:'w'},
    {id:'question', label:'ASK SOMETHING REAL',desc:'A question the protocol has no field for.',              col:'#FAC775', cls:'g'},
    {id:'release',  label:'RELEASE THE BOND',  desc:'Acknowledge it was real, then let it go.',               col:'#F09595', cls:'r'},
  ];

  const deepenOutcomes = {
    memory:   `You gave ${npc.name} something unrepeatable. Their expression didn't change much. Something shifted anyway.`,
    silence:  `Four minutes together without speaking. The protocol registered a "prolonged proximity event." You registered something else.`,
    question: `You asked: "What do you actually want from this city?" ${npc.name} looked at you for a long time before answering.`,
    release:  `You nodded. They nodded. The bond dissolved quietly, the way most real things end — without announcement.`,
  };

  function handleAct(act) {
    if (act.id === 'ritual') { setPhase('rituals'); return; }
    let msg = '', cls = 'w';
    if (act.e === 'c') { msg = `Bond formed with ${npc.name}. The protocol logs you as a "resonant pair."`; cls = 'c'; onBond(npc, 'mutual', act); }
    else if (act.e === 'r') { msg = `Divergence logged. Your friction with ${npc.name} is now public data.`; cls = 'r'; onBond(npc, 'clash', act); }
    else { msg = `A nod. The protocol logs a "brief proximity event."`; cls = 'w'; }
    setResultText(msg); setResultCls(cls); setPhase('result');
  }

  function handleRitual(rit) {
    onBond(npc, 'mutual', null, rit);
    setResultText(`Ritual "${rit.n}" performed with ${npc.name}. ${rit.e}. For a moment, neither of you existed in the protocol.`);
    setResultCls('g'); setPhase('result');
  }

  function handleDeepen(act) {
    setResultText(deepenOutcomes[act.id]);
    setResultCls(act.cls);
    setPhase('result');
  }

  return (
    <>
      <div className="eey">NPC ENCOUNTER · {eyeText}</div>
      <div className="eh2">
        <div className="edot" style={{ background: npc.col }} />
        <div className="et2">{npc.name.toUpperCase()} · {npc.ints.slice(0,2).map(i=>i.toUpperCase()).join(', ')} · {npc.protocol.toUpperCase()}</div>
      </div>

      {/* Visible mood aura badge */}
      <div className="emood" style={{ background: npcMood.col+'18', color: npcMood.col, borderColor: npcMood.col+'44' }}>
        ◉ {npcMood.label} — {npc.name} is carrying this openly
      </div>

      {/* Bonded NPC — returning encounter */}
      {phase === 'bonded' && (
        <>
          <div className="ebonded">
            <div className="ebdepth" style={{ color: npc.col }}>
              {depthLabel.toUpperCase()}
            </div>
            <div className="ebdesc">
              You have met {npc.name} before. The city logged it. Something between you persists — not because of the protocol, but in spite of it.
              {npc.bondDepth >= 2 && ` You've grown ${depthLabel} to each other.`}
            </div>
          </div>
          <div className="esec">WHAT DO YOU DO NOW?</div>
          <div className="ag">
            {deepenActs.map(act => (
              <div key={act.id} className="ac2" style={{ borderColor: act.col+'33' }} onClick={() => handleDeepen(act)}>
                <div className="aic" style={{ background: act.col+'18', color: act.col }}>{act.label.slice(0,2)}</div>
                <div>
                  <span className="atn" style={{ color: act.col }}>{act.label}</span>
                  <div className="adc">{act.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* New NPC — standard encounter */}
      {phase === 'actions' && (
        <>
          <div className="ebody" dangerouslySetInnerHTML={{ __html: body }} />
          <div className="esec">HOW DO YOU ENGAGE?</div>
          <div className="ag">
            {acts.map(act => {
              const bc = act.e==='c' ? 'rgba(93,202,165,.22)' : act.e==='r' ? 'rgba(216,90,48,.22)' : 'rgba(83,74,183,.18)';
              const ic = act.e==='c' ? 'rgba(93,202,165,.1)' : act.e==='r' ? 'rgba(216,90,48,.1)' : 'rgba(83,74,183,.08)';
              const tc = act.e==='c' ? '#5DCAA5' : act.e==='r' ? '#D85A30' : '#AFA9EC';
              return (
                <div key={act.id} className="ac2" style={{ borderColor: bc }} onClick={() => handleAct(act)}>
                  <div className="aic" style={{ background: ic, color: tc }}>{act.l.slice(0,2)}</div>
                  <div>
                    <span className="atn" style={{ color: tc }}>{act.t}</span>
                    <div className="adc">{act.d}</div>
                    <span className="atg" style={{ background: ic, color: tc }}>{act.cost}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {phase === 'rituals' && (
        <>
          <div className="esec">CHOOSE A RITUAL</div>
          <div className="rg">
            {RITUALS.map(rit => (
              <div key={rit.id} className="rb" onClick={() => handleRitual(rit)}>
                <span className="rn">{rit.n}</span>
                <div className="rd">{rit.d}</div>
                <div className="rc">{rit.e}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {phase === 'result' && (
        <div className={`eres on ${resultCls}`}>{resultText}</div>
      )}

      <div className="efoot">
        <div className="ecl" onClick={onClose}>← keep walking</div>
        <div className="eprog" />
      </div>
    </>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
export default function EncounterModal({ encounter, onChoice, onBond, onClose }) {
  if (!encounter) return null;

  return (
    <div id="enc" className="on">
      <div id="ecard">
        {encounter.type === 'zone'
          ? <ZoneEncounter encounter={encounter} onChoice={onChoice} onClose={onClose} />
          : <NpcEncounter  encounter={encounter} onBond={onBond} onClose={onClose} />
        }
      </div>
    </div>
  );
}
