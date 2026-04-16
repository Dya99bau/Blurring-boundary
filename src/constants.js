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
  {id:'acqua_alta',gx:0,gy:0,h:2,label:'Acqua Alta Gate',col:'#534AB7',loc:'GRAND CANAL · 07:43',district:'San Marco',
   story:`The Acqua Alta transit gate requires a <em>mood aura pulse</em> — visible to all canal sensors. Your aura is blank. Six travellers see the gap. A push: <b>"Enable aura transit to reduce friction."</b>`,
   mem:`The canal holds your last crossing. The water remembers your gap.`,
   choices:[
     {b:'COMPLY',t:'Pulse aura · enter the canal',y:'g',c:`Amber aura blooms across the water. Three travellers relax. You gave something the canal now holds.`,dc:1,dr:0,ds:0,l:20,p:-10},
     {b:'REFUSE',t:'Stay dark · own the blank',y:'b',c:`The gate flags you "unresolved presence." A gondolier steers wide.`,dc:0,dr:1,ds:0,l:-18,p:22},
     {b:'SUBVERT',t:'Aura: "fully absent"',y:'w',c:`A void-signal on the water. Someone laughs from the fondamenta. The system has no category for you.`,dc:0,dr:0,ds:1,l:8,p:8},
     {b:'OBSERVE',t:'Watch · decide nothing',y:'w',c:`The auras on the water are honest in ways faces aren't. You haven't crossed yet.`,dc:0,dr:0,ds:0,l:0,p:-5},
   ]},
  {id:'arsenale_dock',gx:5,gy:-2,h:1,label:'Arsenale Dock',col:'#BA7517',loc:'ARSENALE DOCKS · 12:06',district:'Arsenale',
   story:`9 minutes at this worker's bench. At 10, a <em>territorial marker</em> blooms on the dock diagram — your name on the shared map. Two workers watch your timer. <b>"Why does that person own the bench?"</b>`,
   mem:`A ghost of your last shift lingers on the diagram. The protocol hasn't cleared it.`,
   choices:[
     {b:'CLAIM',t:'Stay · earn the position',y:'g',c:`The marker appears. Satisfaction and shame in equal parts.`,dc:1,dr:0,ds:0,l:20,p:-8},
     {b:'LEAVE',t:'Stand up at 9:58',y:'b',c:`Timer resets. A worker claims it later.`,dc:0,dr:1,ds:0,l:-15,p:-18},
     {b:'GIFT',t:'Transfer marker to apprentice',y:'w',c:`Their device buzzes. They don't understand. Their mentor smiles.`,dc:0,dr:0,ds:1,l:4,p:4},
     {b:'SIT',t:'Stay · ignore the marker',y:'w',c:`Marker appears. Nobody can read your relationship to it.`,dc:0,dr:0,ds:0,l:18,p:0},
   ]},
  {id:'cannaregio_campo',gx:-4,gy:2,h:2,label:'Cannaregio Campo',col:'#1D9E75',loc:'CANNAREGIO · 14:20',district:'Cannaregio',
   story:`The 8-second gaze protocol active. A neighbour across the campo has looked your way for <em>6 seconds</em>. At 8, you receive one of their thoughts involuntarily. <b>"By living here, you participate."</b>`,
   mem:`Your previous choice left a trace in the filament display. The campo shifted 2% because of you.`,
   choices:[
     {b:'RECEIVE',t:'Hold gaze · accept thought',y:'w',c:`"I haven't spoken to anyone today." Something real moved between neighbours.`,dc:1,dr:0,ds:0,l:22,p:-5},
     {b:'REFUSE',t:'Break at 7 sec',y:'b',c:`Protocol broadcasts: "opted out at this window, 14:21."`,dc:0,dr:1,ds:0,l:-14,p:20},
     {b:'SEND FIRST',t:'Pre-load thought · control',y:'g',c:`You send: "this campo is watching us." Reply: "I know. I live here anyway."`,dc:0,dr:0,ds:1,l:14,p:9},
     {b:'CLOSE EYES',t:'Make gaze impossible',y:'b',c:`30 seconds, eyes closed. Their thought is addressed to no one.`,dc:0,dr:0,ds:0,l:0,p:14},
   ]},
  {id:'smart_bridge',gx:4,gy:4,h:2,label:'Smart Bridge',col:'#D85A30',loc:'ARSENALE BRIDGE · 11:30',district:'Arsenale',
   story:`A cluster of 7 workers triggers a <em>shared memory object</em> — a 1797 vision unlocked when 5+ stand together on the bridge. <b>"Come stand with us. Just be physically here."</b>`,
   mem:`Last time you stood here, you left before the memory surfaced.`,
   choices:[
     {b:'JOIN',t:'Step on · experience it',y:'g',c:`Canal sounds from 1797. A shipwright hammering. Five strangers share a stranger's hands.`,dc:1,dr:0,ds:0,l:24,p:-16},
     {b:'DECLINE',t:'Stay on the bank · watch',y:'b',c:`Their faces change. You are 3 metres away in a different experience of the same bridge.`,dc:0,dr:1,ds:0,l:-22,p:24},
     {b:'JOIN→LEAVE',t:'Enter · then step off',y:'w',c:`4 seconds of the shared memory. Enough to know it's a life, not a spectacle.`,dc:0,dr:0,ds:1,l:9,p:9},
     {b:'DOCUMENT',t:'Photograph the group',y:'w',c:`5 people with the same stunned expression. The photo shows nothing they're seeing.`,dc:0,dr:0,ds:0,l:4,p:0},
   ]},
  {id:'dorsoduro_fondamenta',gx:-1,gy:6,h:1,label:'Dorsoduro Fondamenta',col:'#185FA5',loc:'DORSODURO · 19:55',district:'Dorsoduro',
   story:`The canal's <em>bioluminescent vote</em> is open. Positive → barnacles brighten the sunken fondamenta. Negative → dims. A teenager nearby, device off: <b>"I stopped voting two months ago. I just watch the water now."</b>`,
   mem:`The canal is the same shade it was when you last voted. You made this light.`,
   choices:[
     {b:'VOTE +',t:'Feed warmth · shape the water',y:'g',c:`Canal shifts — barely warmer. A deep chord plays through the stone for 4 seconds.`,dc:1,dr:0,ds:0,l:18,p:-14},
     {b:'ABSTAIN',t:'Let the window close',y:'b',c:`The bioluminescence is someone else's feeling. Peaceful and not yours.`,dc:0,dr:1,ds:0,l:-18,p:10},
     {b:'VOTE −',t:'Vote disruption',y:'w',c:`Canal dims. The teenager laughs — short, real.`,dc:0,dr:0,ds:1,l:9,p:19},
     {b:'ASK HER',t:'Ask what she sees now',y:'g',c:`"I see everyone else's feelings and none of mine. It's kind of beautiful."`,dc:0,dr:0,ds:0,l:0,p:-12},
   ]},
];

// Bldg colors — visible Venice stone palette per district.
// t=top face, s=right face (lighter), d=left face (shadow)
export const BLDGS = [
  // San Marco / center — warm Istrian limestone
  {gx:-1,gy:1, h:4,t:'#4a3e2c',s:'#5c4e38',d:'#332b1e'}, // Palazzo central
  {gx:3,gy:1, h:3,t:'#3e3828',s:'#4c4530',d:'#2a251a'}, // San Marco wing
  {gx:-2,gy:3, h:3,t:'#453c2a',s:'#564b34',d:'#2e281c'}, // South plaza
  {gx:-2,gy:1, h:5,t:'#4a3c28',s:'#5c4c32',d:'#32281a'}, // West alley face (tall)
  {gx:0, gy:2, h:4,t:'#3e3424',s:'#4c4030',d:'#2a2418'}, // Calle connector
  {gx:-1,gy:-1,h:4,t:'#453c2c',s:'#564a38',d:'#2e281e'}, // North end
  {gx:0, gy:-1,h:3,t:'#3c3222',s:'#4a3e2c',d:'#28221a'}, // Canal-side north
  {gx:0, gy:3, h:3,t:'#3a3020',s:'#483c28',d:'#261e14'}, // South calle
  {gx:3, gy:0, h:4,t:'#3e3828',s:'#4c4530',d:'#2a2518'}, // East calle north
  {gx:3, gy:2, h:4,t:'#3a3424',s:'#483e30',d:'#28231a'}, // East calle south

  // Cannaregio — moss-warm ochre, narrow streets
  {gx:-3,gy:-2,h:5,t:'#4a3e1e',s:'#5a4c26',d:'#332b14'}, // Tall Cannaregio tower
  {gx:-5,gy:3, h:4,t:'#3e3820',s:'#4c4528',d:'#2a2515'}, // Cannaregio palazzo
  {gx:-4,gy:0, h:3,t:'#423618',s:'#524422',d:'#2c2410'}, // North alley block
  {gx:-6,gy:2, h:2,t:'#382e14',s:'#463a1c',d:'#261e0d'}, // Low fondamenta
  {gx:-2,gy:-1,h:4,t:'#4a3e1c',s:'#5a4c24',d:'#332b12'}, // Calle entrance
  {gx:-3,gy:0, h:5,t:'#483c1c',s:'#584a24',d:'#312912'}, // Tall alley wall
  {gx:-3,gy:3, h:4,t:'#3e3218',s:'#4c3e20',d:'#2a2210'}, // South Cannaregio
  {gx:-4,gy:-3,h:4,t:'#423818',s:'#524620',d:'#2c2610'}, // North quarter
  {gx:-5,gy:-1,h:3,t:'#3c3216',s:'#4a3e1e',d:'#28220e'}, // West alley
  {gx:-5,gy:1, h:4,t:'#403618',s:'#4e4220',d:'#2a2410'}, // Canal parallel
  {gx:-6,gy:0, h:3,t:'#3a2e12',s:'#463a1a',d:'#261e0a'}, // Far west
  {gx:-6,gy:4, h:2,t:'#362a10',s:'#423418',d:'#221a08'}, // Low west block

  // Arsenale — cool blue-grey slate, dock compound
  {gx:6, gy:0, h:3,t:'#2c3840',s:'#38464e',d:'#1e262c'}, // Arsenale workshop
  {gx:7, gy:-2,h:6,t:'#283040',s:'#333c4e',d:'#1c2230'}, // Tall foundry campanile
  {gx:5, gy:2, h:4,t:'#243038',s:'#2e3c46',d:'#182028'}, // Arsenal dock block
  {gx:3, gy:-3,h:4,t:'#2a3440',s:'#36404c',d:'#1c2430'}, // Arsenale tech block
  {gx:8, gy:1, h:2,t:'#222c34',s:'#2c3840',d:'#161e24'}, // Low guard house
  {gx:4, gy:-1,h:4,t:'#263240',s:'#323e4c',d:'#1a222c'}, // Dock north wall
  {gx:4, gy:1, h:3,t:'#243040',s:'#2e3c4c',d:'#181e28'}, // Dock south wall
  {gx:4, gy:3, h:3,t:'#22303e',s:'#2c3c4a',d:'#161e28'}, // Inner compound
  {gx:6, gy:-1,h:4,t:'#2a3640',s:'#36424c',d:'#1c2428'}, // North tower base
  {gx:6, gy:2, h:3,t:'#243440',s:'#30404c',d:'#182028'}, // South dock wall
  {gx:5, gy:3, h:3,t:'#223040',s:'#2e3c4c',d:'#161e28'}, // Compound close

  // Dorsoduro — lagoon teal-grey, fondamenta row
  {gx:2, gy:7, h:3,t:'#1e3038',s:'#263c48',d:'#142028'}, // Dorsoduro fondamenta
  {gx:-3,gy:6, h:2,t:'#1a2c34',s:'#223844',d:'#101e26'}, // Low canal ruin
  {gx:-5,gy:8, h:3,t:'#1c2e38',s:'#243a46',d:'#121e28'}, // Far Dorsoduro
  {gx:4, gy:8, h:2,t:'#182830',s:'#20343e',d:'#0e1c24'}, // South lagoon block
  {gx:0, gy:5, h:3,t:'#1e3038',s:'#263c48',d:'#142028'}, // Canal south approach
  {gx:3, gy:5, h:3,t:'#1c2e36',s:'#243a44',d:'#121e24'}, // East fondamenta
  {gx:-4,gy:5, h:3,t:'#1a2c34',s:'#223844',d:'#101e26'}, // West fondamenta
  {gx:1, gy:7, h:2,t:'#182a32',s:'#20363e',d:'#0e1c22'}, // South calle
  {gx:-2,gy:7, h:3,t:'#1c3038',s:'#243c46',d:'#121e26'}, // West canal block
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

// Visible emotional states — broadcast as aura color in the city
export const MOODS = [
  {id:'joyful',     col:'#FAC775', label:'JOYFUL'},
  {id:'melancholic',col:'#AFA9EC', label:'MELANCHOLIC'},
  {id:'anxious',    col:'#F09595', label:'ANXIOUS'},
  {id:'calm',       col:'#5DCAA5', label:'CALM'},
  {id:'lonely',     col:'#534AB7', label:'LONELY'},
  {id:'curious',    col:'#1D9E75', label:'CURIOUS'},
];

// Bond depth labels — how a connection evolves over encounters
export const BOND_DEPTHS = ['acquaintance','familiar','close','bonded'];

// ── Smart Bridge crossing encounters (Grand Canal gx 1–2) ─────────────────────
// Three scenes selected by time-of-day. Choices share the same dc/dr/ds/l/p format.
export const BRIDGE_SCENES = [
  {
    id:'bridge_morning',gx:1,gy:2,h:1,
    col:'#185FA5',loc:'GRAND CANAL · BRIDGE · MORNING',
    timeRange:[360,840],
    story:`You step onto the Smart Bridge. The piezoelectric mesh reads your step — adds your weight to the data. The handrail warms the moment you touch it. A counter materialises above the arch: <em>847 crossings today</em>. You are not the first. <b>The bridge asks: register this crossing?</b>`,
    choices:[
      {b:'REGISTER',t:'Log the crossing · be counted',y:'g',c:`Your crossing joins the record. The handrail glows briefly in your Aura color. You gave the canal something it will keep.`,dc:1,dr:0,ds:0,l:12,p:-6},
      {b:'CROSS DARK',t:'No signal · just walk',y:'b',c:`The counter doesn't change. A gap appears in the data. You made it across as no one.`,dc:0,dr:1,ds:0,l:-10,p:8},
      {b:'PAUSE',t:'Stand mid-bridge · look at the water',y:'w',c:`The canal below shows three layers of history. You can almost read them. The bridge waits.`,dc:0,dr:0,ds:0,l:3,p:-4},
    ],
  },
  {
    id:'bridge_echo',gx:1,gy:2,h:1,
    col:'#185FA5',loc:'GRAND CANAL · BRIDGE · MIDDAY',
    timeRange:[840,1200],
    story:`Halfway across. The bridge's resonance mesh detects two matched Aura fields — yours, and someone approaching from the other side. They slow down. You're both aware. <b>The bridge has already logged it as a Vibe Match. You haven't spoken yet.</b>`,
    choices:[
      {b:'ACKNOWLEDGE',t:'Turn and hold the moment',y:'g',c:`A stranger. Your emotion, different face. You nod. The bridge glow beneath the arch lasts 30 seconds after you both leave.`,dc:0,dr:0,ds:0,l:8,p:-10},
      {b:'KEEP WALKING',t:'Let the match pass unacknowledged',y:'b',c:`The bridge records a matched crossing with no social contact. A Vibe Match with no witness.`,dc:0,dr:1,ds:0,l:-5,p:4},
      {b:'SUBVERT',t:'Shift your Aura · break the match',y:'w',c:`The reading changes mid-bridge. The other person looks briefly confused. You kept the moment for yourself.`,dc:0,dr:0,ds:1,l:5,p:6},
    ],
  },
  {
    id:'bridge_night',gx:1,gy:2,h:1,
    col:'#185FA5',loc:'GRAND CANAL · BRIDGE · NIGHT',
    timeRange:[1200,1440],
    story:`Night. The bridge's daytime protocol goes dark — reading suspended. Below, the canal bioluminescence is all that's visible: teal and indigo, slow-moving. <b>One of the few moments in Neo-Venezia when the city doesn't know exactly where you are.</b>`,
    choices:[
      {b:'CROSS DARK',t:'Walk untracked · be briefly free',y:'w',c:`30 seconds of being unlocated. The canal holds your reflection anyway. You made it.`,dc:0,dr:1,ds:0,l:-8,p:-14},
      {b:'ENABLE AURA',t:'Light yourself up anyway',y:'g',c:`Your Aura on the night water. You chose visibility when you didn't have to. The city noted this.`,dc:1,dr:0,ds:0,l:16,p:-8},
      {b:'STAY',t:'Sit on the bridge · wait',y:'w',c:`You stay until the protocol reactivates. For a few minutes the bridge belonged to you and no record.`,dc:0,dr:0,ds:1,l:4,p:-10},
    ],
  },
];

// ── NPC Dialogue System ────────────────────────────────────────────────────────
// Lines are selected deterministically from the NPC's id so each person
// always says the same thing — they have a consistent voice.

export const NPC_DIALOGUE = {
  openings: {
    joyful: [
      "The water's doing something today. Come look.",
      "Someone returned my canal-signal from last week. I didn't think anyone would.",
      "I don't usually talk to strangers but today feels different.",
      "The barnacles outside my building have been glowing since morning.",
    ],
    melancholic: [
      "The filament display on my street has been blue for three weeks.",
      "I've been watching the same bridge for an hour. I don't know why.",
      "The canal was cleaner when I first moved here. Or maybe I just remember it that way.",
      "I keep thinking about a conversation I had here months ago. I can't remember what we said.",
    ],
    anxious: [
      "Have you counted the sensors on this corner? I get to seven.",
      "My pressure index hit 84 this morning. I'm trying to walk it down.",
      "The protocol sent me three nudges before I left the house.",
      "I don't know who's reading my aura right now. That's not a small thing.",
    ],
    calm: [
      "I get here before the morning rush. It's a different city at this hour.",
      "I turned my aura broadcast off last year. The city gets quieter without it.",
      "There's a kind of peace in being unread.",
      "I come here most days. Nothing ever happens. That's why I come.",
    ],
    lonely: [
      "I haven't had a real conversation in four days. The protocol doesn't count.",
      "Everyone I knew has left this district. The buildings still have their old filament colors.",
      "I keep walking the same route. I think I'm looking for something.",
      "The city knows I'm here. That's not the same as anyone knowing I'm here.",
    ],
    curious: [
      "I found something in the canal sediment yesterday. Still trying to understand it.",
      "Have you watched how the water changes near the Smart Bridge? It's not random.",
      "I've been mapping the Protocol Barnacle clusters. There's a pattern nobody's named yet.",
      "I've been coming here for weeks trying to understand why this corner feels different.",
    ],
  },
  traits: {
    solitude:    ["I work best when nobody can find me.", "The unregistered quarter exists for people like me."],
    collective:  ["Eight of us eat here every day. The protocol calls it a cluster.", "I believe in shared space — not the protocol's version. The older kind."],
    surveillance:["I've been watching this corner for months. The patterns are interesting.", "I don't mind being seen. I just want to choose what they see."],
    privacy:     ["I disabled my aura broadcast two years ago. People still notice the gap.", "I keep my signal tags to myself. That's the point of having them."],
    visibility:  ["I want the city to know I'm here. I want it on record.", "Full broadcast, all day. I have nothing to hide and several things to prove."],
    anonymity:   ["I have three registered personas. None of them are me.", "The void-signal is a legitimate choice. The protocol just doesn't know what to do with it."],
    ritual:      ["We do a silence zone every Tuesday on the Smart Bridge. Ten seconds. It's enough.", "Rituals are the city's immune system. Without them, protocol is everything."],
    disruption:  ["I put a false mood tag in the canal data last week. Nothing happened. That was the point.", "The glitch is a form of communication. I'm still figuring out the message."],
    memory:      ["I've lived here 40 years. The city has a different shape in my head than on the map.", "My grandmother's aura data is in the canal sediment somewhere. I think about that."],
    presence:    ["I'm here because I chose to be here. That's different from just showing up.", "I log my location every hour. Not for the protocol. For myself."],
    refusal:     ["I say no to about 70% of what the protocol asks. The other 30% I haven't decided.", "The city functions fine without my compliance. It just pretends otherwise."],
    consent:     ["I read every agreement before signing. People think that's strange.", "Consent means I could have said no. The protocol doesn't always offer that option."],
  },
  districts: {
    'san marco':  ["The Piazza knows when it's being used. The stones hold it.", "I've watched the Campanile broadcast a color I didn't recognize. Someone feels something I don't have a word for."],
    'arsenale':   ["The foundry runs on three shifts. I've worked all of them.", "We built the city's nervous system here. Now it builds ours."],
    'cannaregio': ["My neighbour's display has been amber for a week. Something good happened.", "The calli here are narrow enough that you hear everything. I've stopped minding."],
    'dorsoduro':  ["I moved here because the city reads poorly in this district. Fewer nudges.", "There's a room below the waterline two buildings over. I found it on a dive."],
    'grand canal':["The water carries old signals. You can feel it if you're in it long enough.", "I watched someone's aura dissolve into the canal once. Like dye. Like it was glad to be water."],
  },
  protocol: {
    comply: ["The system works if you let it. I let it.", "I comply where it costs me little. I've made my peace with that.", "My legibility is 87. The city offers real things in return."],
    refuse: ["I haven't updated my aura profile in two years. They can work with what they have.", "Refusal is a form of communication. I'm communicating constantly.", "My pressure is high. My legibility is low. I consider that a success."],
  },
  match: {
    mutual:  ["I noticed your signal before you got close. That doesn't happen often.", "We have overlapping tags. The protocol already knows. We don't have to let that be the whole story.", "Something between your signal and mine — the city registers it. I prefer to call it something else."],
    clash:   ["Our tags conflict. The protocol has already logged it.", "I don't dislike you for having different signals. I just don't know what to do with the gap.", "The friction is real. We could ignore it, or we could look at it directly."],
    neutral: ["You're here. I'm here. The protocol notes it as proximity.", "I don't know what to make of you yet. That's honest.", "We haven't said enough to be anything to each other yet."],
  },
};

// Returns composed dialogue for an NPC encounter.
// Selection is deterministic per NPC so each person has a consistent voice.
export function pickNPCDialogue(npc, matchScore, districtName) {
  const h = parseInt(npc.id.replace('n','')) || 0;
  const pick = (arr, offset=0) => (arr && arr.length) ? arr[(h + offset) % arr.length] : '';

  const opening  = pick(NPC_DIALOGUE.openings[npc.emotion] || NPC_DIALOGUE.openings.calm);
  const traitLine = pick(NPC_DIALOGUE.traits[npc.ints[0]] || [], 1);
  const distKey  = (districtName || 'san marco').toLowerCase();
  const distLine  = pick(NPC_DIALOGUE.districts[distKey] || NPC_DIALOGUE.districts['san marco'], 2);
  const protLine  = pick(NPC_DIALOGUE.protocol[npc.protocol] || NPC_DIALOGUE.protocol.comply, 1);
  const mt = matchScore.total > 0 ? 'mutual' : matchScore.total < 0 ? 'clash' : 'neutral';
  const matchLine = pick(NPC_DIALOGUE.match[mt], 2);

  // Voice: their opening feeling + either a trait reveal or district observation
  const voice = opening + ' ' + (traitLine || distLine);

  return { voice, protLine, matchLine, matchType: mt };
}

// ── Playable character identities ──────────────────────────────────────────────
// Each type starts with preset trait alignments and stat modifiers.
// mods apply on top of the player's own intro settings.
// ── District Map (shown before game entry) ────────────────────────────────────
export const DISTRICTS = [
  {id:'acqua_alta',name:'Acqua Alta Gate',col:'#534AB7',
   spawnGX:-1,spawnGY:-1,mapX:0.40,mapY:0.32,radius:26,
   desc:'The canal transit gate. Mood auras broadcast at peak density at dawn. Every crossing is logged.',
   vibe:'high protocol',tags:['transit','canal','aura'],resonanceHotspot:false},
  {id:'arsenale',name:'Arsenale Docks',col:'#BA7517',
   spawnGX:4,spawnGY:-3,mapX:0.68,mapY:0.22,radius:28,
   desc:'The data foundry runs on three shifts. Territorial markers bloom on the shared dock diagrams at 10 minutes.',
   vibe:'industrial',tags:['work','territory','forge'],resonanceHotspot:false},
  {id:'cannaregio',name:'Cannaregio Campo',col:'#1D9E75',
   spawnGX:-5,spawnGY:1,mapX:0.21,mapY:0.47,radius:24,
   desc:'8-second gaze protocol active. Thought pools form between neighbours. The campo shifted 2% because of you.',
   vibe:'intimate',tags:['gaze','thought','field'],resonanceHotspot:false},
  {id:'smart_bridge',name:'Smart Bridge',col:'#D85A30',
   spawnGX:3,spawnGY:3,mapX:0.63,mapY:0.59,radius:24,
   desc:'Piezoelectric arch over the Grand Canal. A shared memory object unlocks when five or more gather here.',
   vibe:'collective',tags:['crossing','memory','cluster'],resonanceHotspot:true},
  {id:'dorsoduro',name:'Dorsoduro Fondamenta',col:'#185FA5',
   spawnGX:-2,spawnGY:7,mapX:0.37,mapY:0.82,radius:26,
   desc:'Bioluminescent vote on the canal surface. The light shifts with collective feeling. A teenager watches and refuses.',
   vibe:'civic',tags:['vote','water','dusk'],resonanceHotspot:true},
  {id:'san_marco',name:'San Marco',col:'#AFA9EC',
   spawnGX:-1,spawnGY:3,mapX:0.42,mapY:0.59,radius:30,
   desc:'The city\'s ancient centre. Protocol density at maximum. The Campanile broadcasts colours you haven\'t named.',
   vibe:'surveillance',tags:['visible','broadcast','centre'],resonanceHotspot:false},
];

// ── Vibe Synthesis Quests ─────────────────────────────────────────────────────
export const QUESTS = [
  {
    id:'melancholic_masquerade',
    name:'MELANCHOLIC MASQUERADE',
    desc:'Find three melancholic souls lingering near the canal.',
    check:(gs,npcs,plGx,plGy,emp)=>
      npcs.filter(n=>n.emotion==='melancholic'&&Math.abs(n.gx-1.5)<4&&Math.hypot(n.gx-plGx,n.gy-plGy)<6).length>=3,
    reward:'Your aura absorbs their blue — the canal deepens.',
  },
  {
    id:'canal_choir',
    name:'CANAL CHOIR',
    desc:'Form bonds with two joyful strangers near the water.',
    check:(gs,npcs)=>
      gs.bonds.filter(b=>{const n=npcs.find(x=>x.id===b.id);return n&&n.emotion==='joyful'&&Math.abs(n.gx-1.5)<5;}).length>=2,
    reward:'The canal hums back. A resonance only you can hear.',
  },
  {
    id:'architects_vision',
    name:"ARCHITECT'S VISION",
    desc:'Visit 4 zone orbs while ENV shows BLOOMED. Bond NPCs first to bloom.',
    check:(gs)=>gs.bloomedZones&&gs.bloomedZones.size>=4,
    reward:"The city recognises you as a builder, not just a visitor.",
  },
];

// ── Progression Stages ────────────────────────────────────────────────────────
export const STAGES = {
  wanderer:{id:'wanderer',label:'WANDERER',col:'#888780',desc:'You are learning the shape of this city.'},
  catalyst:{id:'catalyst',label:'CATALYST',col:'#1D9E75',desc:'You are changing the city around you.'},
  architect:{id:'architect',label:'ARCHITECT',col:'#FAC775',desc:"You are building the city's future."},
};

// ── Digital Grafting — ghost memory marks left by past players ────────────────
export const GRAFT_MESSAGES = [
  'the water here holds old songs',
  'i stopped at this corner for an hour once',
  'someone waved from that window every morning',
  'the protocol forgot us here for a while',
  'three of us sat in silence. it was enough',
  'the canal was different before the sensors came',
  'i left a signal here that nobody answered',
  'my grandmother crossed this bridge every week',
  'this is where i decided to stay',
];

export const DEFAULT_GRAFTS = [
  {id:'g0',gx:-0.5,gy:3.5,msg:'the water here holds old songs',col:'#AFA9EC'},
  {id:'g1',gx:1.5, gy:2.5,msg:'i stopped at this corner for an hour once',col:'#5DCAA5'},
  {id:'g2',gx:-4,  gy:1.5,msg:'the protocol forgot us here for a while',col:'#534AB7'},
  {id:'g3',gx:4,   gy:-1.5,msg:"we built the city's nervous system here",col:'#BA7517'},
  {id:'g4',gx:-1,  gy:6.5,msg:'the canal was different before the sensors came',col:'#185FA5'},
];

export const PLAYER_TYPES = [
  {
    id:'shade',
    name:'THE SHADE',
    tagline:'You exist in the gaps.',
    desc:'Protocols can\'t name what they can\'t see. You move through the city\'s cracks — low legibility, high pressure tolerance.',
    col:'#534AB7', aura:'#AFA9EC',
    startTraits:{al:['anonymity','solitude','refusal'],rp:['surveillance','visibility']},
    mods:{legibility:-22,pressure:-14},
    ability:'GHOST WALK · Subvert choices remove −6 extra pressure',
    stats:{legibility:18,social:32,pressure:18,subvert:88},
  },
  {
    id:'weaver',
    name:'THE WEAVER',
    tagline:'Every person is a thread.',
    desc:'You pull people together. Bonding actions reduce twice the pressure. The city\'s social fabric is yours to shape.',
    col:'#1D9E75', aura:'#5DCAA5',
    startTraits:{al:['collective','consent','ritual'],rp:['solitude']},
    mods:{legibility:10,pressure:5,socRBonus:1},
    ability:'RESONANCE · Bond actions reduce −10 pressure (default −5)',
    stats:{legibility:65,social:90,pressure:55,subvert:30},
  },
  {
    id:'herald',
    name:'THE HERALD',
    tagline:'Visibility is your shield.',
    desc:'You broadcast openly. High legibility is your advantage. Compliance earns extra legibility — the city rewards your transparency.',
    col:'#BA7517', aura:'#FAC775',
    startTraits:{al:['visibility','presence'],rp:['anonymity']},
    mods:{legibility:28,pressure:-8},
    ability:'BROADCAST · Comply choices give +8 extra legibility',
    stats:{legibility:90,social:65,pressure:38,subvert:15},
  },
  {
    id:'glitch',
    name:'THE GLITCH',
    tagline:'You are the error.',
    desc:'You found the cracks and made them wider. Every subversion resonates harder. The system flags you — you flag back.',
    col:'#A32D2D', aura:'#F09595',
    startTraits:{al:['disruption','memory'],rp:['surveillance','consent']},
    mods:{legibility:-14,pressure:18},
    ability:'CASCADE · Subvert choices remove −5 extra pressure',
    stats:{legibility:28,social:42,pressure:72,subvert:95},
  },
  {
    id:'watcher',
    name:'THE WATCHER',
    tagline:'You see everything. You record it.',
    desc:'Observation is action. Your detachment accumulates knowledge while others accumulate exposure. Each city event cools your pressure.',
    col:'#185FA5', aura:'#5DCAA5',
    startTraits:{al:['surveillance','memory'],rp:['ritual']},
    mods:{legibility:0,pressure:-20},
    ability:'ARCHIVE · Each city event removes −4 pressure',
    stats:{legibility:50,social:35,pressure:14,subvert:50},
  },
  {
    id:'broker',
    name:'THE BROKER',
    tagline:'Everything is negotiable.',
    desc:'You move between positions. No preset alignments — every action gives a small bonus across the board.',
    col:'#7F77DD', aura:'#7F77DD',
    startTraits:{al:[],rp:[]},
    mods:{legibility:5,pressure:0},
    ability:'ADAPT · All actions give +2 legibility and −2 pressure',
    stats:{legibility:55,social:60,pressure:50,subvert:55},
  },
];
