export default function EndScreen({ visible, endData, onReconfigure, onRestart }) {
  if (!endData) return <div className={`scr${visible ? ' on' : ''}`} id="scr-end" />;

  const { arch, comply, refuse, subvert, bonds, rituals, events } = endData;
  const mutual = bonds.filter(b => b.type === 'mutual').length;
  const clashes = bonds.filter(b => b.type !== 'mutual').length;

  let msg = arch.m;
  if (mutual > 0) msg += ` You formed ${mutual} resonant bond${mutual > 1 ? 's' : ''} — people whose signals aligned with yours inside a city designed to keep you strangers.`;
  if (clashes > 0) msg += ` ${clashes} friction event${clashes > 1 ? 's' : ''} — clashes the protocol logged as data, not meaning.`;
  if (rituals > 0) msg += ` ${rituals} ritual${rituals > 1 ? 's' : ''} — collective acts the system had no category for.`;

  const stats = [
    { n: comply,  label: 'complied', col: '#AFA9EC' },
    { n: refuse,  label: 'refused',  col: '#F09595' },
    { n: subvert, label: 'subverted',col: '#5DCAA5' },
    { n: mutual,  label: 'bonds',    col: '#5DCAA5' },
    { n: clashes, label: 'clashes',  col: '#D85A30' },
    { n: rituals, label: 'rituals',  col: '#7F77DD' },
    { n: events,  label: 'city events', col: '#FAC775' },
  ];

  return (
    <div className={`scr${visible ? ' on' : ''}`} id="scr-end">
      <div className="eey2">SESSION COMPLETE · PROTOCOL CITY SIMULATION</div>
      <div className="ea" style={{ color: arch.c }}>{arch.n}</div>
      <div className="es2">{arch.s}</div>

      <div className="eg">
        {stats.map(s => (
          <div key={s.label} className="est">
            <span className="esn" style={{ color: s.col }}>{s.n}</span>
            <span className="esl">{s.label}</span>
          </div>
        ))}
      </div>

      {bonds.length > 0 && (
        <div className="ebw">
          <div className="ebt">SOCIAL GRAPH · YOUR BONDS</div>
          {bonds.map((b, i) => (
            <div key={i} className="ebr">
              <div className="ebd" style={{ background: b.col }} />
              <span className="ebn" style={{ color: b.type === 'mutual' ? '#5DCAA5' : '#D85A30' }}>{b.name}</span>
              <span className={`ebtp ${b.type === 'mutual' ? 'm' : 'r'}`}>
                {b.type === 'mutual' ? 'resonant' : 'friction'}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="em">{msg}</div>

      <div className="ebtns">
        <button className="endb" style={{ color: '#AFA9EC', borderColor: 'rgba(175,169,236,.28)' }} onClick={onReconfigure}>
          Reconfigure ↺
        </button>
        <button className="endb" style={{ color: '#5DCAA5', borderColor: 'rgba(93,202,165,.32)' }} onClick={onRestart}>
          Play again →
        </button>
      </div>
    </div>
  );
}
