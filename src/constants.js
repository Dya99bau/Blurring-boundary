export const TRAITS = [
  {id:'solitude',l:'SOLITUDE',c:'#534AB7'},
  {id:'collective',l:'COLLECTIVE',c:'#1D9E75'},
  {id:'surveillance',l:'SURVEILLANCE',c:'#D85A30'},
  {id:'privacy',l:'PRIVACY',c:'#993556'},
  {id:'visibility',l:'VISIBILITY',c:'#BA7517'},
  {id:'anonymity',l:'ANONYMITY',c:'#185FA5'},
  {id:'ritual',l:'RITUAL',c:'#7F77DD'},
  {id:'disruption',l:'DISRUPTION',c:'#A32D2D'},
  {id:'memory',l:'MEMORY',c:'#0F6E56'},
  {id:'presence',l:'PRESENCE',c:'#854F0B'},
  {id:'refusal',l:'REFUSAL',c:'#888780'},
  {id:'consent',l:'CONSENT',c:'#5DCAA5'},
];

export const NAMES = ['Mira','Ezra','Sable','Cleo','Oren','Vex','Dara','Luca','Tove','Remy','Noel','Zuri','Kael','Pita','Soma','Riku','Asel','Brix'];
export const NCOLS = ['#534AB7','#D85A30','#185FA5','#854F0B','#3B6D11','#993556','#888780','#A32D2D','#0F6E56','#BA7517','#D4537E','#1D9E75','#7F77DD','#EF9F27','#5DCAA5','#E24B4A'];
export const WEATHERS = ['clear','fog','rain','wind'];

export const DAY_EVENTS = [
  {t:420,id:'morning_rush',msg:'Morning rush. Protocol density +40%.'},
  {t:720,id:'midday',msg:'Midday lull. Connections easier.'},
  {t:900,id:'afternoon',msg:'Afternoon heat. Pressure rises citywide.'},
  {t:1080,id:'evening',msg:'Evening drift. NPCs cluster near plaza.'},
  {t:1260,id:'night',msg:'Night mode. Surveillance protocols active.'},
];

export const SCENES = [
  {id:'transit',gx:0,gy:0,h:2,label:'Transit Node',col:'#534AB7',loc:'TRANSIT NODE · 07:43',
   story:`Every person shows a <em>mood aura</em> — visible to all nearby devices. Your profile is blank. Six strangers see the gap. A push: <b>"Enable mood sharing to reduce friction."</b>`,
   mem:`The city holds your last choice. Strangers already know your gap.`,
   choices:[
     {b:'COMPLY',t:'Enable aura · blend in',y:'g',c:`Amber aura blooms. Three strangers relax. You paid something nameless.`,dc:1,dr:0,ds:0,l:20,p:-10},
     {b:'REFUSE',t:'Stay blank · own the gap',y:'b',c:`Protocol flags you "unresolved presence." A stranger steps away.`,dc:0,dr:1,ds:0,l:-18,p:22},
     {b:'SUBVERT',t:'Mood: "fully absent"',y:'w',c:`A void-aura. Someone laughs. The system has no category for you.`,dc:0,dr:0,ds:1,l:8,p:8},
     {b:'OBSERVE',t:'Watch · decide nothing',y:'w',c:`The auras are honest in ways faces aren't. You haven't chosen.`,dc:0,dr:0,ds:0,l:0,p:-5},
   ]},
  {id:'park',gx:5,gy:-2,h:1,label:'Park Bench',col:'#1D9E75',loc:'PARK BENCH · 12:06',
   story:`9 minutes seated. At 10, a <em>territorial marker</em> blooms — your name on the shared map. Two people watch your timer. <b>"Why does that person own the bench?"</b>`,
   mem:`A ghost of your last visit lingers. The protocol hasn't cleared it.`,
   choices:[
     {b:'CLAIM',t:'Stay · earn territory',y:'g',c:`The marker appears. Satisfaction and shame in equal parts.`,dc:1,dr:0,ds:0,l:20,p:-8},
     {b:'LEAVE',t:'Stand up at 9:58',y:'b',c:`Timer resets. A stranger claims it later.`,dc:0,dr:1,ds:0,l:-15,p:-18},
     {b:'GIFT',t:'Give marker to a child',y:'w',c:`Her phone buzzes. She doesn't understand. Her mother smiles.`,dc:0,dr:0,ds:1,l:4,p:4},
     {b:'SIT',t:'Stay · ignore the circle',y:'w',c:`Marker appears. Nobody can read your relationship to it.`,dc:0,dr:0,ds:0,l:18,p:0},
   ]},
  {id:'cafe',gx:-4,gy:2,h:2,label:'Café Counter',col:'#BA7517',loc:'CAFÉ COUNTER · 14:20',
   story:`The 8-second gaze protocol active. The person opposite has looked your way for <em>6 seconds</em>. At 8, you receive one of their thoughts involuntarily. <b>"By entering, you participate."</b>`,
   mem:`Your previous choice left a trace. The café's model shifted 2% because of you.`,
   choices:[
     {b:'RECEIVE',t:'Hold gaze · accept thought',y:'w',c:`"I haven't spoken to anyone today." Something real moved between strangers.`,dc:1,dr:0,ds:0,l:22,p:-5},
     {b:'REFUSE',t:'Break at 7 sec',y:'b',c:`Protocol broadcasts: "opted out at this seat, 14:21."`,dc:0,dr:1,ds:0,l:-14,p:20},
     {b:'SEND FIRST',t:'Pre-load thought · control',y:'g',c:`You send: "this system is watching us." Reply: "I know. I use it anyway."`,dc:0,dr:0,ds:1,l:14,p:9},
     {b:'CLOSE EYES',t:'Make gaze impossible',y:'b',c:`30 seconds, eyes closed. Their thought is addressed to no one.`,dc:0,dr:0,ds:0,l:0,p:14},
   ]},
  {id:'market',gx:4,gy:4,h:2,label:'Market Square',col:'#D85A30',loc:'MARKET SQUARE · 11:30',
   story:`A cluster of 7 shows a <em>shared object</em> — a 1987 memory unlocked when 5+ gather. <b>"Come stand with us. Just be physically present."</b>`,
   mem:`Last time you stood here, you left before the object appeared.`,
   choices:[
     {b:'JOIN',t:'Step in · experience it',y:'g',c:`Market sounds from 1987. A child laughing. Five strangers share a stranger's memory.`,dc:1,dr:0,ds:0,l:24,p:-16},
     {b:'DECLINE',t:'Stay outside · watch',y:'b',c:`Their faces change. You are 3 metres away in a different experience of the same place.`,dc:0,dr:1,ds:0,l:-22,p:24},
     {b:'JOIN→LEAVE',t:'Enter · then step out',y:'w',c:`4 seconds of the shared object. Enough to know it's a memory, not a product.`,dc:0,dr:0,ds:1,l:9,p:9},
     {b:'DOCUMENT',t:'Photograph the group',y:'w',c:`5 people with the same stunned expression. The photo shows nothing they're seeing.`,dc:0,dr:0,ds:0,l:4,p:0},
   ]},
  {id:'plaza',gx:-1,gy:6,h:1,label:'Plaza · Dusk',col:'#7F77DD',loc:'RESIDENTIAL PLAZA · 19:55',
   story:`The plaza's <em>collective mood vote</em> open. Positive → lighting warms. Negative → dims. A teenager nearby, phone off: <b>"I stopped voting two months ago. I just watch it now."</b>`,
   mem:`The light is the same shade it was when you last voted. You made this.`,
   choices:[
     {b:'VOTE +',t:'Vote warmth · shape the space',y:'g',c:`Light shifts — barely warmer. A chord with no instrument plays 4 seconds.`,dc:1,dr:0,ds:0,l:18,p:-14},
     {b:'ABSTAIN',t:'Let window close',y:'b',c:`The atmosphere is someone else's feeling. Peaceful and not yours.`,dc:0,dr:1,ds:0,l:-18,p:10},
     {b:'VOTE −',t:'Vote disruption',y:'w',c:`Light dims. The teenager laughs — short, real.`,dc:0,dr:0,ds:1,l:9,p:19},
     {b:'ASK HER',t:'Ask what she sees now',y:'g',c:`"I see everyone else's feelings and none of mine. It's kind of beautiful."`,dc:0,dr:0,ds:0,l:0,p:-12},
   ]},
];

export const BLDGS = [
  {gx:-3,gy:-2,h:5,t:'#1e1e40',s:'#10102a',d:'#0c0c1e'},
  {gx:1,gy:-4,h:7,t:'#141430',s:'#0d0d25',d:'#090918'},
  {gx:6,gy:0,h:3,t:'#1a2a1a',s:'#111f11',d:'#0d160d'},
  {gx:-5,gy:3,h:4,t:'#2a1a10',s:'#1e1208',d:'#150d05'},
  {gx:2,gy:7,h:3,t:'#1e1e3a',s:'#141430',d:'#0e0e22'},
  {gx:-3,gy:6,h:2,t:'#181828',s:'#101020',d:'#0c0c18'},
  {gx:7,gy:-2,h:5,t:'#121f12',s:'#0c180c',d:'#09110c'},
  {gx:-6,gy:5,h:3,t:'#281a0c',s:'#1c1208',d:'#130d05'},
  {gx:3,gy:-3,h:4,t:'#1c1c38',s:'#12122a',d:'#0e0e1e'},
  {gx:-2,gy:4,h:3,t:'#201820',s:'#181018',d:'#100c10'},
];

// Pre-compute ground tiles (excludes building & scene positions)
const _bkSet = new Set([
  ...BLDGS.map(b=>`${b.gx},${b.gy}`),
  ...SCENES.map(s=>`${s.gx},${s.gy}`),
]);
export const GND = [];
for (let gx=-9;gx<=10;gx++) for (let gy=-7;gy<=10;gy++) {
  GND.push({gx,gy,bk:_bkSet.has(`${gx},${gy}`)});
}

export const NPC_ACTS = [
  {id:'bond',l:'RESONATE',t:'Form a resonant bond',d:'Share your aligned interest. The city logs you as a pair.',e:'c',cost:'−5 pressure'},
  {id:'exchange',l:'EXCHANGE',t:'Trade interest tags',d:'Offer one of your tags. Take one of theirs.',e:'c',cost:'+8 legibility'},
  {id:'ritual',l:'RITUAL',t:'Invite to a collective ritual',d:'Perform an unverified act together. No protocol.',e:'c',cost:'opens ritual menu'},
  {id:'pass',l:'PASS',t:'Acknowledge and move on',d:'A nod. No record.',e:'n',cost:'no change'},
  {id:'diverge',l:'DIVERGE',t:'Perform a divergence ritual',d:'Acknowledge conflicting interests and move apart.',e:'r',cost:'+1 subvert'},
  {id:'challenge',l:'CHALLENGE',t:'Challenge their protocol stance',d:'Ask why they comply or refuse.',e:'r',cost:'+10 pressure'},
];

export const RITUALS = [
  {id:'silence',n:'SILENCE ZONE',d:'Both go dark for 10 seconds. No broadcast.',e:'Pressure −12'},
  {id:'broadcast',n:'OPEN BROADCAST',d:'Announce your interests to everyone within 5 tiles.',e:'Legibility +15'},
  {id:'aura_swap',n:'AURA SWAP',d:"Wear each other's mood aura for 60 seconds.",e:'Subvert +1, pressure −6'},
  {id:'void_walk',n:'VOID WALK',d:'Both disable signals and walk together.',e:'Refuse +1, legibility −10'},
];

export const ARCHS = {
  glitch:{n:'THE GLITCH',c:'#5DCAA5',s:'You found the cracks.',m:"You participated on your own terms — made the system briefly contain things it wasn't designed for. Glitches are temporary. But they're the only proof a system has limits."},
  legible:{n:'THE LEGIBLE ONE',c:'#AFA9EC',s:'The system always knew where you were.',m:"You stayed visible throughout. In return, the system made space for you. What you gave up was the right to be unread."},
  ghost:{n:'THE GHOST',c:'#F09595',s:'Your absence was its own signal.',m:"You refused consistently. Your gap became visible — the most conspicuous presence in a city of legible people."},
  neg:{n:'THE NEGOTIATOR',c:'#FAC775',s:'Honest, exhausting, human.',m:"You moved between positions. The system is not one thing and neither are you. Negotiation gets harder the longer the protocol runs."},
};
