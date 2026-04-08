import { useState, useRef } from 'react';
import IntroScreen from './screens/IntroScreen';
import GameScreen from './screens/GameScreen';
import EndScreen from './screens/EndScreen';

export default function App() {
  const [screen, setScreen] = useState('intro'); // 'intro' | 'game' | 'end'
  const [veilOn, setVeilOn] = useState(false);
  const [titleData, setTitleData] = useState(null); // { title, sub, eye } | null
  const [config, setConfig] = useState(null);
  const [endData, setEndData] = useState(null);

  // Mirrors the original showScr() transition logic
  function showScreen(id, title, sub, eye) {
    setVeilOn(true);
    setTimeout(() => {
      setScreen(id);
      if (title) {
        setTitleData({ title, sub, eye });
        setTimeout(() => {
          setTitleData(null);
          setTimeout(() => setVeilOn(false), 60);
        }, 880);
      } else {
        setTimeout(() => setVeilOn(false), 60);
      }
    }, 440);
  }

  function handleStart(cfg) {
    setConfig(cfg);
    setEndData(null);
    showScreen('game', 'Protocol City', 'Live simulation. Walk through it.', 'ENTERING');
  }

  function handleEnd(data) {
    setEndData(data);
    showScreen('end', data.arch.n, data.arch.s, 'SESSION COMPLETE');
  }

  function handleRestart() {
    showScreen('game', 'Protocol City', 'The city remembers.', 'RETURNING');
  }

  function handleReconfigure() {
    showScreen('intro');
  }

  return (
    <div id="app">
      <IntroScreen visible={screen === 'intro'} onStart={handleStart} />

      {config && (
        <GameScreen
          visible={screen === 'game'}
          config={config}
          onEnd={handleEnd}
        />
      )}

      <EndScreen
        visible={screen === 'end'}
        endData={endData}
        onRestart={handleRestart}
        onReconfigure={handleReconfigure}
      />

      {/* Veil overlay for transitions */}
      <div id="veil" className={veilOn ? 'on' : ''} />
      <div id="vttl" className={titleData ? 'on' : ''}>
        <div className="ve">{titleData?.eye}</div>
        <div className="vm">{titleData?.title}</div>
        <div className="vs2">{titleData?.sub}</div>
      </div>
    </div>
  );
}
