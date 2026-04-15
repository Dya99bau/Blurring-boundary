import { useState } from 'react';
import { PLAYER_TYPES } from '../constants';

const STAT_ROWS = [
  { key: 'legibility', label: 'LEG', col: '#AFA9EC' },
  { key: 'social',     label: 'SOC', col: '#5DCAA5' },
  { key: 'pressure',   label: 'PRS', col: '#F09595' },
  { key: 'subvert',    label: 'SUB', col: '#7F77DD' },
];

export default function PlayerSelectScreen({ visible, onSelect }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className={`scr${visible ? ' on' : ''}`} id="scr-psel">
      <div className="gl">NEO-VENEZIA · IDENTITY SELECTION</div>
      <div className="ttl" style={{ fontSize: 'clamp(20px,3.5vw,36px)' }}>Who are you in this city?</div>
      <div className="sub" style={{ marginBottom: 16 }}>
        your presence shapes the protocols · choose your signal identity
      </div>

      <div className="psg">
        {PLAYER_TYPES.map(pt => {
          const isSel = selected?.id === pt.id;
          return (
            <div
              key={pt.id}
              className={`psc${isSel ? ' pssel' : ''}`}
              style={isSel ? {
                borderColor: pt.col + '66',
                background: pt.col + '0d',
                boxShadow: `0 0 20px ${pt.col}14`,
              } : {}}
              onClick={() => setSelected(pt)}
            >
              {/* Avatar glow circle */}
              <div
                className="psav"
                style={{ background: pt.col + '1c', boxShadow: `0 0 18px ${pt.col}1e` }}
              >
                <div
                  className="psaura"
                  style={{ background: pt.aura, boxShadow: `0 0 10px ${pt.aura}88` }}
                />
              </div>

              {/* Name */}
              <div
                className="psname"
                style={{ color: isSel ? pt.col : undefined }}
              >
                {pt.name}
              </div>

              {/* Tagline */}
              <div className="pstag">{pt.tagline}</div>

              {/* Stat bars */}
              <div className="psstats">
                {STAT_ROWS.map(({ key, label, col }) => (
                  <div key={key} className="pssrow">
                    <span className="pssl">{label}</span>
                    <div className="pssbar">
                      <div
                        className="pssfill"
                        style={{ width: pt.stats[key] + '%', background: col }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Ability */}
              <div
                className="psabil"
                style={{ borderColor: pt.col + '28', color: pt.col + 'cc' }}
              >
                {pt.ability}
              </div>
            </div>
          );
        })}
      </div>

      {/* Description shown when a card is selected */}
      {selected && (
        <div
          className="psdesc"
          style={{ borderColor: selected.col + '33', color: selected.col + 'bb' }}
        >
          {selected.desc}
        </div>
      )}

      <button
        className="go"
        style={
          selected
            ? { borderColor: selected.col + '88', color: selected.col }
            : { opacity: 0.35, cursor: 'not-allowed' }
        }
        onClick={() => selected && onSelect(selected)}
      >
        {selected ? `Enter as ${selected.name} →` : 'Select an identity →'}
      </button>
    </div>
  );
}
