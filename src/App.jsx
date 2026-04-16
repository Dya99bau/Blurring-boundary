import { useState, useRef } from 'react';
import IntroScreen from './screens/IntroScreen';
import MapScreen from './screens/MapScreen';
import PlayerSelectScreen from './screens/PlayerSelectScreen';
import GameScreen from './screens/GameScreen';
import EndScreen from './screens/EndScreen';

export default function App() {
  const [screen, setScreen] = useState('intro'); // 'intro' | 'map' | 'playerSelect' | 'game' | 'end'
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
    showScreen('map', 'Neo-Venezia', 'Choose your district.', 'MAP');
  }

  function handleMapSelect(district) {
    setConfig(prev => ({ ...prev, district }));
    showScreen('playerSelect', 'Neo-Venezia', 'Choose your presence.', 'IDENTITY');
  }

  function handlePlayerSelect(playerType) {
    setConfig(prev => ({ ...prev, playerType }));
    showScreen('game', 'Neo-Venezia', 'The city breathes with you.', 'ENTERING');
  }

  function handleEnd(data) {
    setEndData(data);
    showScreen('end', data.arch.n, data.arch.s, 'SESSION COMPLETE');
  }

  function handleRestart() {
    showScreen('game', 'Neo-Venezia', 'The water remembers.', 'RETURNING');
  }

  function handleReconfigure() {
    showScreen('intro');
  }

  return (
    <div id="app">
      <IntroScreen visible={screen === 'intro'} onStart={handleStart} />

      <MapScreen visible={screen === 'map'} onSelect={handleMapSelect} />

      <PlayerSelectScreen visible={screen === 'playerSelect'} onSelect={handlePlayerSelect} />

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
