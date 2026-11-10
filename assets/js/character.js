// Talking character on the hero cover: poses, speech bubble, conversation, reactions.
// Art lives in assets/character/ (poses) and assets/character/fx/ (effects).

// ── Hero: blinking (only for poses that have a closed-eyes frame) ──
(() => {
  const hero = document.getElementById('top');
  if (!hero || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const blink = () => {
    if (hero.classList.contains('can-blink')) {
      hero.classList.add('blinking');
      setTimeout(() => hero.classList.remove('blinking'), 130);
      if (Math.random() < 0.25) setTimeout(() => {            // occasional double blink
        hero.classList.add('blinking');
        setTimeout(() => hero.classList.remove('blinking'), 110);
      }, 260);
    }
    setTimeout(blink, 2500 + Math.random() * 3000);
  };
  setTimeout(blink, 2000);
})();

// ── Hero: talking character (a short conversation the visitor steers) ──
(() => {
  const hero = document.getElementById('top');
  const bubble = document.getElementById('heroBubble');
  const textEl = bubble && bubble.querySelector('.hero-bubble-text');
  const choicesEl = bubble && bubble.querySelector('.hero-bubble-choices');
  const body = hero && hero.querySelector('.hero-char-img');
  if (!bubble || !body) return;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── The conversation (edit freely) ──
  // Each step: t = what he says (text, or a function returning text), pose = which image, then ONE of:
  //   next: step to play automatically afterwards
  //   options: [['button label', 'step'], ...] for the visitor to choose
  //            + auto: step he continues with if nobody answers (AUTO_MS)
  //   go: '#section' to scroll to (then the chat rests until they come back)
  //   end: true to stop talking after this line
  const CUTIN_MS = 5000;     // how long the despair close-up stays on screen
  const SAD_MS = 5000;       // then how long he stands there disappointed
  const HIRE_ASK_ON = false;   // KIV: "Um… so… will you hire me?" moment switched off (true to bring it back)
  const WAKE_ASK_CHANCE = 0.5; // after waking up, chance he asks "will you hire me?"
  const JOKE_MS = 10000;     // each joke stays up this long
  const MASTER_VOLUME = 1;   // overall volume of all his sounds (try 0.6–1.5)
  const VOICE = 'typing';    // how he "talks": 'typing' (keyboard clicks) or 'blip' (retro game voice)
  const TYPING_VOLUME = 0.5; // keyboard clicks
  const BLIP_VOLUME = 0.3;   // typing blips while he talks
  const RAGE_VOLUME = 0.8;  // the shout at 20+ clicks (0–1)
  const CRY_VOLUME = 0.6;   // rejection music volume (0–1)
  const ROSE_HOLD_MS = 2500; // the thrown rose stays in front of the viewer this long
  const ROSE_LINE_MS = 4300; // his rose line stays up until the rose has dropped (fly 1.05s + hold + drop 0.45s + a beat)
  const AUTO_MS = 20000;     // unanswered question: wait this long, then he gets sleepy and dozes off
  const phone = matchMedia('(max-width: 640px)').matches;
  const h = new Date().getHours();
  const hello =
    h < 5  ? "Up this late? Same. I'm Amin." :
    h < 12 ? "Good morning! I'm Amin." :
    h < 18 ? "Hi there! I'm Amin." :
    h < 22 ? "Good evening! I'm Amin." :
             "Late-night browsing? Respect. I'm Amin.";
  // Returning visitor? (counted in their own browser only)
  let visits = 0;
  try { visits = +localStorage.getItem('heroVisits') || 0; localStorage.setItem('heroVisits', visits + 1); } catch (e) {}

  const JOKES = [
    'Why do programmers prefer dark mode? Because light attracts bugs.',
    "There are 10 kinds of people: those who understand binary, and those who don't.",
    "A SQL query walks into a bar, goes up to two tables and asks: 'Can I join you?'",
    'Why did the developer go broke? He used up all his cache.',
    "My code doesn't have bugs. It has surprise features.",
    "I'd tell you a UDP joke, but you might not get it."
  ];
  // Shuffled once; each joke is told at most once per visit
  const jokeBag = JOKES.slice();
  for (let k = jokeBag.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [jokeBag[k], jokeBag[j]] = [jokeBag[j], jokeBag[k]]; }
  let jokesTold = 0;
  const jokesLeft = () => jokesTold < jokeBag.length;
  const nextJoke = () => jokeBag[jokesTold++];

  const MENU = [['Projects', 'toWork'], ['Art', 'toArt'], ['Contact', 'toContact'], ['Tell me a joke', 'joke']];
  // The visitor's reasons for being here (first question, and whenever he asks again)
  const REASONS = [["You're hired!", 'hired'], ["I'm hiring", 'hiring'], ['I need a website', 'site'], ['I like your art', 'artLike'],
                   ['Just looking around', 'browse'], ['Who are you?', 'about'], ["You talk, I'll listen", 'listen']];
  const STEPS = {
    hello:    { t: hello, pose: 'wave', next: 'ask' },
    welcome:  { t: "Hey, you're back! Good to see you again.", pose: 'wave', next: 'ask' },
    ask:      { t: 'What brings you here?', pose: 'look', auto: 'solo', options: REASONS },

    // Nobody answered (or they asked him to talk): he introduces himself
    solo:     { t: "Not much of a talker? No worries, I'll do the talking.", pose: 'look', next: 'solo2' },
    listen:   { t: 'Alright, story time.', pose: 'look', next: 'solo2' },
    solo2:    { t: 'I work as an IT manager, so I wear a lot of hats.', pose: 'look', next: 'solo3' },
    solo3:    { t: "I build things with PHP and Laravel. Hire me, and you'll unlock my full potential.", pose: 'excited', next: 'solo4' },
    solo4:    { t: 'The bandage? I fought a bug. The bug won.', pose: 'laugh', next: 'solo5' },
    solo5:    { t: "When I'm not coding, I'm leveling up in real life: learning new things, calisthenics… and a healthy amount of games and Netflix.", pose: 'laugh', next: 'solo6' },
    solo6:    { t: phone ? 'On your phone? Scroll down and swipe through my projects.'
                         : "Scroll down whenever you're ready. The projects are right below.", pose: 'point', next: 'solo7' },
    solo7:    { t: "Or pick one and I'll take you there.", pose: 'look', auto: 'signoff', options: MENU },

    hiring:   { t: 'Oh! Give me a second… *fixes tie*', pose: 'fix', next: 'hiring2' },
    hiring2:  { t: "I build web apps with Laravel and PHP, and I'm open to full-time or freelance work.", pose: 'look', auto: 'solo6',
                options: [['Show me your work', 'toWork'], ['How do I reach you?', 'toContact']] },

    site:     { t: 'You came to the right guy.', pose: 'wave', next: 'site2' },
    site2:    { t: "I've built barbershop sites, homestay bookings and auction platforms.", pose: 'look', next: 'site3' },
    site3:    { t: "Here are a few. Then let's talk.", pose: 'point', auto: 'solo7',
                options: [['See projects', 'toWork'], ['Contact', 'toContact']] },

    artLike:  { t: "Oh, you noticed! …this one's for you.", pose: 'rose', fx: 'rose', next: 'artLike2', wait: ROSE_LINE_MS },
    artLike2: { t: "Those are from my drawing days. I've hung up the pencil since, but I'm still proud of them.", pose: 'laugh', next: 'artLike3' },
    artLike3: { t: "There's more further down.", pose: 'point', auto: 'solo7', options: [['Show me', 'toArt']] },

    browse:   { t: 'Make yourself at home.', pose: 'look', next: 'browse2' },
    browse2:  { t: "I code, I design, and if it's new, I want to learn it. Want to see my work, or my old drawings?", pose: 'think', auto: 'solo6',
                options: [['The code', 'toWork'], ['The drawings', 'toArt']] },

    about:    { t: 'I work as an IT manager, so I wear a lot of hats.', pose: 'look', next: 'about2' },
    about2:   { t: 'The bandage? I fought a bug. The bug won.', pose: 'laugh', next: 'about3' },
    about3:   { t: "Too many hats to fit in this bubble. Email me and let's set up an interview for the full story.", pose: 'point', auto: 'solo5',
                options: [['Email me', 'toContact'], ['See my work', 'toWork']] },

    joke:     { t: nextJoke, pose: 'laugh', next: 'joke2', wait: JOKE_MS, redirect: () => (jokesLeft() ? null : 'noJokes') },
    joke2:    { t: () => (jokesLeft() ? 'Another one?' : 'That was my last one, by the way.'), pose: 'look', auto: 'signoff',
                options: () => (jokesLeft()
                  ? [['Another one', 'joke'], ['Projects', 'toWork'], ['Contact', 'toContact']]
                  : [['Projects', 'toWork'], ['Art', 'toArt'], ['Contact', 'toContact']]) },
    noJokes:  { t: "I'm out of jokes. That was my whole collection.", pose: 'think', auto: 'signoff',
                options: [['Projects', 'toWork'], ['Art', 'toArt'], ['Contact', 'toContact']] },

    // Typed "hire" anywhere on the page
    hire:     { t: 'I heard that!', pose: 'wave', next: 'hire2' },
    hire2:    { t: 'Shall I take you to my contact details?', pose: 'look', options: [['Yes!', 'toContact'], ['Just testing', 'hireNo']] },
    hireNo:   { t: "Ha. Okay, I'll be right here.", pose: 'laugh', end: true },

    // On the page 5+ minutes
    long:     { t: "Still here? I'm flattered.", pose: 'laugh', next: 'long2' },
    long2:    { t: 'Should we make it official?', pose: 'look', options: [['Contact me already', 'toContact'], ['Keep browsing', 'longNo']] },
    longNo:   { t: 'Take all the time you need.', pose: 'look', end: true },

    toWork:   { t: 'Right this way!', pose: 'point', go: '#work' },
    toArt:    { t: 'Throwback time. Down here!', pose: 'point', go: '#art' },
    toContact:{ t: "Can't wait to hear from you~", pose: 'rose', fx: 'rose', next: 'toContact2', wait: ROSE_LINE_MS },
    toContact2:{ t: "Email works best. I'll take you there.", pose: 'point', go: '#contact' },
    // Typed "rose" or "love"
    roseEgg:  { t: 'For you~', pose: 'rose', fx: 'rose', next: 'roseEnd', wait: ROSE_LINE_MS },
    roseEnd:  { t: '…too much? Okay, too much.', pose: 'laugh', end: true },

    // Asked once per visit at a random quiet moment
    // "You're hired!" button
    hired:    { t: 'W-wait… really?!', pose: 'excited', auto: 'hiredJoke',
                options: [['Yes!', 'willYes'], ['No', 'willNo']] },
    hiredJoke:{ t: "…you're joking, right? Ha… ha…", pose: 'laugh', end: true },
    wakeAsk:  { t: 'Since you woke me up anyway…', pose: 'shy', next: 'askHireWake' },
    askHireWake:{ t: 'Um… so… will you hire me?', pose: 'shy', auto: 'willSkip',
                options: [['Yes!', 'willYes'], ['No', 'willNo'], ['Go back to sleep', 'backToSleep']] },
    backToSleep:{ t: 'Oh… thank you… goodnight…', pose: 'sleep', doSleep: true },
    wakeMenu: { t: 'Anyway… what brings you here?', pose: 'look', auto: 'signoff', options: REASONS },
    askHire:  { t: 'Um… so… will you hire me?', pose: 'shy', auto: 'willSkip',
                options: [['Yes!', 'willYes'], ['No', 'willNo']] },
    willYes:  { t: "R-really?! You won't regret it!", pose: 'excited', next: 'willYes2',
                run: () => { hireAsked = true; try { localStorage.setItem('heroHired', 'yes'); } catch (e) {} } },
    willYes2: { t: "Let's make it official?", pose: 'look', auto: 'signoff',
                options: [['Contact me', 'toContact'], ['Later', 'willLater']] },
    willLater:{ t: "Okay! I'll be right here, smiling.", pose: 'excited', end: true },
    willNo:   { t: '…why, universe… WHY…', pose: 'sad', fx: 'cutin', mood: 'sad', next: 'willNoSad', wait: CUTIN_MS },
    willNoSad:{ t: '…oh. Okay.', pose: 'sad', mood: 'sad', next: 'willNo2', wait: SAD_MS },
    willNo2:  { t: "*sniff*… it's fine… I'm fine…", pose: 'think', next: 'willNo3', wait: 3500 },
    willNo3:  { t: 'Maybe my projects can change your mind?', pose: 'look', auto: 'signoff',
                options: [['Show me', 'toWork'], ['Okay, fine, yes', 'willYes']] },
    willSkip: { t: '…forget I asked.', pose: 'shy', end: true },

    back:     { t: 'Welcome back! Anything else?', pose: 'wave', auto: 'signoff', options: [...REASONS, ['Tell me a joke', 'joke']] },
    again:    { t: 'Need something?', pose: 'look', auto: 'signoff', options: [...REASONS, ['Tell me a joke', 'joke'], ['Go to sleep', 'goSleep']] },
    goSleep:  { t: '*yawn*… okay, just a quick nap…', pose: 'sleep', doSleep: true },

    // Asides: short interruptions, then he picks up where he was
    poke1:    { t: 'Hey, that tickles.', pose: 'laugh' },              // 2 quick clicks
    poke2:    { t: 'Okay, stop it.', pose: 'annoyed' },                 // 3
    angry:    { t: "That's it. I'm not talking to you.", pose: 'annoyed' }, // 5: sulks
    rage:     { t: 'ARGHHHHH!! STOP POKING ME!!', pose: 'rage', mood: 'rage' },      // 20: meltdown
    calmDown: { t: "…okay. I'm calm. I'm fine. Totally fine.", pose: 'look' },
    signoff:  { t: "No pressure. I'll be right here if you need me.", pose: 'look', end: true },
    forgive:  { t: '…fine. I forgive you.', pose: 'look' },
    sleepy:   { t: 'You make me sleepy waiting for you…', pose: 'think' },
    wake:     { t: "WAH?! I'm up! I'm up!", pose: 'shock' },
    wake2:    { t: "I wasn't sleeping. I was… debugging with my eyes closed.", pose: 'laugh' },
    tabBack:  { t: "Oh, you're back. I was just… fixing my tie.", pose: 'fix' }
  };
  const ASIDES = new Set(['poke1', 'poke2', 'rage', 'calmDown', 'angry', 'forgive', 'sleepy', 'wake', 'wake2', 'tabBack']);
  const COFFEE_CHANCE = 0;   // KIV: coffee break switched off for now (set 0.5 to bring it back)
  const POKES_TO_ANGRY = 5;  // clicks until he gets angry and sulks
  const POKES_TO_RAGE = 20;  // clicks until he completely loses it
  const FORGIVE_MS = 5000;   // stop clicking this long and he forgives you
  const HIRE_ASK_MIN_MS = 40000, HIRE_ASK_MAX_MS = 80000; // when he asks "will you hire me?"
  const SLEEP_MS = 30000;    // no activity this long → he dozes off
  const SLEEPY_HOLD_MS = 5000; // "You make me sleepy…" stays up this long before he falls asleep

  // ── Poses ──
  // Each image: same 1024x1024 canvas and framing, transparent background.
  // 'fix' is the idle pose. A pose whose file is missing falls back to 'look', then 'fix'.
  const POSES = {
    smile:   { src: 'assets/character/idle-smile.png', blink: 'assets/character/idle-smile-blink.png' }, // resting: hands in pockets
    phone:   { src: 'assets/character/idle-phone.png', blink: 'assets/character/idle-phone-blink.png' }, // resting: on his phone
    fix:     { src: 'assets/character/idle.png', blink: 'assets/character/idle-blink.png' },   // fixing his tie
    look:    { src: 'assets/character/look.png',      blink: 'assets/character/look-blink.png' },
    wave:    { src: 'assets/character/wave.png',      blink: 'assets/character/wave-blink.png' },
    point:   { src: 'assets/character/point.png',     blink: 'assets/character/point-blink.png' },
    laugh:   { src: 'assets/character/laugh.png' },
    annoyed: { src: 'assets/character/annoyed.png',   blink: 'assets/character/annoyed-blink.png' },
    think:   { src: 'assets/character/think.png',     blink: 'assets/character/think-blink.png' },
    sleep:   { src: 'assets/character/sleep.png' },            // eyes already closed, no blink frame
    shock:   { src: 'assets/character/shock.png' },            // woken up; too brief to need blinking
    coffee:  { src: 'assets/character/coffee-hold.png', blink: 'assets/character/coffee-hold-blink.png' },
    sip:     { src: 'assets/character/coffee-drink.png' },    // eyes closed while sipping
    rage:    { src: 'assets/character/rage.png', fallback: 'annoyed' }, // 20+ clicks
    rose:    { src: 'assets/character/rose-throw.png', fallback: 'wave' },     // just threw a rose (winking)
    shy:     { src: 'assets/character/shy.png',   fallback: 'laugh' },   // "will you hire me?"
    excited: { src: 'assets/character/excited.png', fallback: 'laugh' }, // star eyes, jumping for joy
    sad:     { src: 'assets/character/sad.png',   fallback: 'think' },   // "…oh. Okay."
  };
  const blinkImg = hero.querySelector('.hero-blink');
  const charLayer = hero.querySelector('.hero-char');
  // Preloaded images are kept in KEEP so the browser can't drop them (dropping them caused a blank frame on swap)
  const KEEP = [];
  const load = (src) => { const im = new Image(); im.src = src; KEEP.push(im); return im.decode().then(() => true, () => false); };
  Object.values(POSES).forEach(p => {
    load(p.src).then(ok => p.ok = ok);
    if (p.blink) load(p.blink).then(ok => p.blinkOk = ok);
  });
  let pose = 'smile';                                         // matches the image in index.html
  // Resting look: picked at random each time he goes quiet
  const IDLE_POSES = ['smile', 'phone'];
  const restPose = () => IDLE_POSES[Math.floor(Math.random() * IDLE_POSES.length)];
  const setPose = (name) => {
    const p = [name, POSES[name] && POSES[name].fallback, 'look', 'fix'].map(n => POSES[n]).find(p => p && p.ok);
    if (!p || p === POSES[pose]) return;
    pose = Object.keys(POSES).find(k => POSES[k] === p);
    // No-flicker swap: keep the old pose painted underneath until the new one has drawn
    const prev = body.currentSrc || body.src;
    body.style.background = `url("${prev}") center / 100% 100% no-repeat`;
    body.src = p.src;
    const clear = () => { if (body.src.endsWith(p.src)) body.style.background = ''; };
    if (body.complete && body.naturalWidth) requestAnimationFrame(clear);
    else body.addEventListener('load', () => requestAnimationFrame(clear), { once: true });
    if (blinkImg && blinkImg.isConnected && p.blinkOk) { blinkImg.src = p.blink; hero.classList.add('can-blink'); }
    else hero.classList.remove('can-blink');
    hero.classList.remove('blinking');
    if (!calm) { charLayer.classList.remove('pop'); void charLayer.offsetWidth; charLayer.classList.add('pop'); }
  };

  // Head position inside the pose images, as fractions of the image
  const HEAD = { right: 0.64, top: 0.08, centerX: 0.5, ear: 0.2 };
  const place = () => {
    const hr = hero.getBoundingClientRect(), r = body.getBoundingClientRect();
    const bw = bubble.offsetWidth, bh = bubble.offsetHeight, pad = 16;
    let x = r.left - hr.left + r.width * HEAD.right;
    let y = r.top - hr.top + r.height * HEAD.ear;           // bubble's bottom edge
    if (x + bw > hr.width - pad) {                           // no room on the right: go above the head
      x = r.left - hr.left + r.width * HEAD.centerX - 20;
      y = r.top - hr.top + r.height * HEAD.top - 16;
    }
    // Phones: centered above his head
    const centered = innerWidth <= 640;
    bubble.classList.toggle('centered', centered);
    if (centered) {
      x = (hr.width - bw) / 2;
      y = r.top - hr.top + r.height * HEAD.top - 12;
    }
    x = Math.max(pad, Math.min(x, hr.width - bw - pad));
    bubble.style.left = `${x}px`;
    // Phones during the despair close-up: below the panel, in the black letterbox
    if (centered && hero.classList.contains('cutin')) {
      const panel = cutin.querySelector('img').getBoundingClientRect();
      bubble.style.top = `${Math.min(panel.bottom - hr.top + 20, hr.height - bh - pad)}px`;
      return;
    }
    bubble.style.top = `${Math.max(pad + 60, y - bh)}px`;   // stay below the nav
  };

  // ── Interaction hint: fades in after the greeting, hides after a while or when dismissed ──
  // It also comes back whenever he has nothing more to say, and hides when he talks again.
  const hint = document.getElementById('heroHint');
  let hintOff = false, hintIntro = false;
  try { hintOff = localStorage.getItem('heroHintOff') === '1'; } catch (e) {}
  const showHint = () => { if (hint && !hintOff) hint.classList.add('show'); };
  const hideHint = () => { if (hint && !hintIntro) hint.classList.remove('show'); };
  if (hint) {
    hint.querySelector('.hero-hint-close').addEventListener('click', (e) => {
      e.stopPropagation(); hintOff = true; hintIntro = false; hint.classList.remove('show');
      try { localStorage.setItem('heroHintOff', '1'); } catch (err) {}
    });
    if (!hintOff) {
      setTimeout(() => { hintIntro = true; showHint(); }, 6000);              // first look, while he talks
      setTimeout(() => { hintIntro = false; if (!resting) hideHint(); }, 26000);
    }
  }

  // ── Voice: tiny generated blips, off until the visitor turns it on ──
  const PITCH = { fix: 400, look: 440, wave: 520, point: 480, laugh: 620, annoyed: 300, think: 380 };
  const soundBtn = bubble.querySelector('.hero-sound');
  let soundOn = false, ctx = null;
  try { soundOn = localStorage.getItem('heroSound') === 'on'; } catch (e) {}
  // All sounds go through one master volume and a compressor, so quiet blips stay audible on laptop speakers
  let master = null;
  const audio = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -24; comp.ratio.value = 4;
      master = ctx.createGain(); master.gain.value = MASTER_VOLUME;
      master.connect(comp).connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  // one short tone: frequency glides from f0 to f1 over `dur` seconds
  const tone = (f0, f1, dur, vol = 0.05, type = 'triangle', lowpass = 0) => {
    if (!soundOn) return;
    const a = audio(); if (!a || a.state !== 'running') return;
    const t = a.currentTime, o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.setValueAtTime(vol, t + dur * 0.6);               // hold, then fade: fuller than a pure ping
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (lowpass) { const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lowpass; node = o.connect(f); }
    node.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  };
  // Typing sound: a short burst of filtered noise, like a mechanical keyboard key.
  // 'key' for letters, 'space' for a deeper spacebar thock. Each click is slightly different.
  let noiseBuf = null;
  const keyClick = (kind = 'key') => {
    if (!soundOn) return;
    const a = audio(); if (!a || a.state !== 'running') return;
    if (!noiseBuf) {
      noiseBuf = a.createBuffer(1, Math.floor(a.sampleRate * 0.05), a.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    }
    const t = a.currentTime, src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    src.buffer = noiseBuf;
    src.playbackRate.value = 0.85 + Math.random() * 0.3;
    f.type = 'bandpass';
    f.frequency.value = kind === 'space' ? 900 : 2200 + Math.random() * 1400;
    f.Q.value = kind === 'space' ? 1.2 : 2.5;
    const vol = TYPING_VOLUME * (kind === 'space' ? 1.3 : 0.8 + Math.random() * 0.4);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'space' ? 0.06 : 0.035));
    src.connect(f).connect(g).connect(master);
    src.start(t); src.stop(t + 0.07);
  };
  const blip = () => {
    const f = (PITCH[pose] || 440) * (0.92 + Math.random() * 0.16);
    // a soft square wave through a low-pass filter: the classic retro "talking" blip, clear on small speakers
    tone(f, f * 0.9, pose === 'annoyed' ? 0.08 : 0.065, BLIP_VOLUME, 'square', pose === 'annoyed' ? 1400 : 2200);
  };
  const popSound = () => tone(280, 620, 0.1, 0.25, 'sine');
  const clickSound = () => tone(900, 700, 0.04, 0.2, 'sine');
  const shockSound = () => tone(300, 1200, 0.18, 0.2, 'square', 2500); // startled "boing"
  const whooshSound = () => tone(900, 250, 0.35, 0.2, 'sine');       // rose flying past

  // ── Rose throw: the rose flies from his hand straight at the viewer ──
  const throwRose = () => {
    if (calm) return;                                         // no flying objects for reduced motion
    const r = body.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    const rose = document.createElement('img');
    rose.src = 'assets/character/fx/rose.png'; rose.alt = ''; rose.className = 'hero-rose-fly';
    const x0 = r.left - hr.left + r.width * 0.17, y0 = r.top - hr.top + r.height * 0.52; // his open hand
    rose.style.left = `${x0}px`; rose.style.top = `${y0}px`;
    hero.appendChild(rose);
    const dx = hr.width / 2 - x0, dy = hr.height * 0.45 - y0;  // toward the middle of the screen
    whooshSound();
    // Original fast throw (~1s to reach you), then it hangs in front of the viewer for ROSE_HOLD_MS, then drops
    const FLY = 1050, DROP = 450, total = FLY + ROSE_HOLD_MS + DROP;
    const at = (ms) => ms / total;
    const held = (y, r) => `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + y}px)) scale(2.6) rotate(${r}deg)`;
    rose.animate([
      { transform: 'translate(-50%,-50%) scale(.2) rotate(-40deg)', opacity: 0 },
      { transform: 'translate(-50%,-50%) scale(.35) rotate(0deg)', opacity: 1, offset: at(150) },
      { transform: held(0, 380), opacity: 1, offset: at(FLY), easing: 'ease-in-out' },          // arrives
      { transform: held(-8, 374), offset: at(FLY + ROSE_HOLD_MS * .35), easing: 'ease-in-out' }, // gentle float
      { transform: held(6, 386), offset: at(FLY + ROSE_HOLD_MS * .7), easing: 'ease-in-out' },
      { transform: held(0, 380), opacity: 1, offset: at(FLY + ROSE_HOLD_MS), easing: 'cubic-bezier(.5,0,.9,.6)' },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + hr.height * 0.6}px)) scale(2.4) rotate(420deg)`, opacity: 0 }
    ], { duration: total }).onfinish = () => rose.remove();
  };
  // ── Cut-in: full-screen dramatic close-up (manga panel) for CUTIN_MS ──
  const cutin = hero.querySelector('.hero-cutin');
  const showCutin = () => {
    hero.classList.remove('cutin'); void cutin.offsetWidth; hero.classList.add('cutin');
    playCry();                                                // sad trombone as the close-up cuts in
    setTimeout(() => { hero.classList.remove('cutin'); if (bubble.classList.contains('show')) place(); }, CUTIN_MS);
  };
  const FX = { rose: throwRose, cutin: showCutin };

  // ── Rejection sound: sad trombone when the close-up cuts in (fades out if the sad part is cut short) ──
  let cry = null, cryFade = null;
  const playCry = () => {
    if (!soundOn) return;
    clearInterval(cryFade);
    if (!cry) { cry = new Audio('assets/character/fx/sad-trombone.mp3'); cry.preload = 'auto'; }
    cry.volume = CRY_VOLUME; cry.currentTime = 0;
    cry.play().catch(() => {});
  };
  const stopCry = () => {
    if (!cry || cry.paused) return;
    clearInterval(cryFade);
    cryFade = setInterval(() => {                               // ~0.6s fade out
      cry.volume = Math.max(0, cry.volume - CRY_VOLUME / 12);
      if (cry.volume <= 0.001) { clearInterval(cryFade); cry.pause(); cry.volume = CRY_VOLUME; }
    }, 50);
  };
  const syncSoundBtn = () => {
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.setAttribute('aria-label', soundOn ? 'Mute his voice' : 'Turn on his voice');
    soundBtn.firstElementChild.className = `fas ${soundOn ? 'fa-volume-high' : 'fa-volume-xmark'}`;
  };
  syncSoundBtn();
  soundBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    soundOn = !soundOn;
    try { localStorage.setItem('heroSound', soundOn ? 'on' : 'off'); } catch (err) {}
    syncSoundBtn();
    if (soundOn) { audio(); setTimeout(clickSound, 30); } else stopCry();
  });
  // Browsers only allow audio after an interaction; unlock it on the first one
  window.addEventListener('pointerdown', () => { if (soundOn) audio(); }, { once: true, capture: true });

  // ── Playback ──
  let current = null, timer = null, typing = null, idleT = null;
  let lastActive = Date.now(), visible = true, leftOnce = false, resting = false, pendingLong = false;
  let coffeeT = [], onCoffee = false;
  const stopCoffee = () => { coffeeT.forEach(clearTimeout); coffeeT = []; onCoffee = false; };
  const clearTimers = () => { clearTimeout(timer); clearInterval(typing); clearTimeout(idleT); stopCoffee(); };

  // skipTo: where the "Skip" button goes (same as not answering, minus the wait)
  let justWoke = false;      // the first question after a wake-up also offers "Go back to sleep"
  // Skip = he talks by himself (his intro, once per visit; after that he signs off).
  // The "will you hire me?" questions keep their own reply to a skip.
  let soloDone = false;
  const OWN_SKIP = new Set(['askHire', 'askHireWake', 'hired']);
  const skipTarget = (id) => (OWN_SKIP.has(id) ? STEPS[id].auto : soloDone ? 'signoff' : 'solo');

  // Answers are shown PER_PAGE at a time; "More" / "Back" flip pages (Skip is always there)
  const PER_PAGE = 4;
  const renderChoices = (options, skipTo) => {
    let list = options ? [...options] : [];
    if (options && justWoke) {
      if (!list.some(([, to]) => to === 'backToSleep')) list.push(['Go back to sleep', 'backToSleep']);
      justWoke = false;
    }
    choicesEl.hidden = !options;
    if (!options) { choicesEl.replaceChildren(); return; }
    const pages = Math.ceil(list.length / PER_PAGE);
    const mk = (label, cls, onClick) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'hero-choice' + (cls ? ' ' + cls : ''); b.textContent = label;
      b.addEventListener('click', (e) => { e.stopPropagation(); lastActive = Date.now(); clickSound(); onClick(); });
      return b;
    };
    const showPage = (n) => {
      const btns = list.slice(n * PER_PAGE, n * PER_PAGE + PER_PAGE).map(([label, to]) => mk(label, '', () => play(to)));
      const turn = (to) => {                                     // flipping pages isn't an answer:
        showPage(to); place();                                   // keep the question up, restart its timer
        if (shown && shown.s.auto && current) { clearTimeout(timer); autoFrom(current); }
      };
      if (n > 0) btns.push(mk('Back', 'hero-nav', () => turn(n - 1)));
      if (n < pages - 1) btns.push(mk('More', 'hero-nav', () => turn(n + 1)));
      btns.push(mk('Skip', 'hero-skip', () => play(skipTo || 'signoff')));
      choicesEl.replaceChildren(...btns);
    };
    showPage(0);
  };

  // "Talk to me" button: sits where his speech bubble would be, while he's quiet
  const talkBtn = document.getElementById('heroTalk');
  const placeTalk = () => {};                                 // positioned by CSS: bottom center, above the hint
  const showTalk = () => { if (!talkBtn) return; placeTalk(); talkBtn.classList.add('show'); };
  const hideTalk = () => { if (talkBtn) talkBtn.classList.remove('show'); };
  if (talkBtn) {
    talkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      lastActive = Date.now();
      clickSound();
      if (sleeping) wakeUp(); else play('again');
    });
    window.addEventListener('resize', () => { if (talkBtn.classList.contains('show')) placeTalk(); });
  }

  // Stop talking: bubble away, back to fixing the tie
  let idleOk = false;        // true while he's just waiting on the visitor (safe to doze off)
  const rest = () => {
    clearTimers();
    resting = true; idleOk = true; justWoke = false;
    bubble.classList.remove('show');
    showHint();                                               // nothing more to say: remind how to interact
    showTalk();
    setTimeout(() => { if (resting) setPose(restPose()); }, 450);
  };

  let currentText = '';
  let shown = null;
  // then: called once the line has finished typing (used by asides)
  // hold: how long the line stays up before `then` runs (ms)
  const play = (id, { keepChoices = false, text: forced, then, hold = 1600 } = {}) => {
    const s = STEPS[id]; if (!s) return;
    if (s.redirect && !forced) { const r = s.redirect(); if (r) return play(r, { keepChoices, then }); }
    const text = forced || (typeof s.t === 'function' ? s.t() : s.t);
    const options = typeof s.options === 'function' ? s.options() : s.options;
    clearTimers();
    shown = { s, then };                                      // what's on screen now (for click-to-skip)
    if (s.fx === 'cutin' && !forced) showCutin();            // cut in instantly, before anything else changes
    hero.dataset.mood = s.mood || '';                         // red when raging, black when rejected
    if (s.mood !== 'sad') stopCry();                          // sad part over: music fades out
    if (sleeping) { sleeping = false; hero.classList.remove('sleeping'); } // talking means he's awake
    if (id !== 'sleepy') drowsy = false;
    if (id === 'solo2') soloDone = true;                      // he has introduced himself                      // interrupted while getting sleepy
    if (!ASIDES.has(id)) { current = id; currentText = text; } // asides don't move the conversation
    resting = false; idleOk = false;
    hideHint(); hideTalk();
    setPose(s.pose);
    // measure the full bubble first so it doesn't jump while typing
    textEl.style.minWidth = ''; textEl.textContent = text;
    if (!keepChoices) renderChoices(options, skipTarget(id));
    place();
    if (s.fx && s.fx !== 'cutin' && FX[s.fx] && !forced) setTimeout(FX[s.fx], 150); // special effect (not again on a resume)
    if (s.run && !forced) s.run();
    if (!bubble.classList.contains('show')) popSound();
    bubble.classList.add('show');
    const after = () => {
      if (then) { timer = setTimeout(then, hold); return; }
      if (!keepChoices && options) {
        choicesEl.classList.add('show');
        if (s.auto) autoFrom(id);                             // no answer? he carries on
        else idleOk = true;                                   // no answer? eventually he dozes off
      }
      if (s.next) timer = setTimeout(() => play(s.next), s.wait || 1400 + text.length * 25);
      if (s.end) timer = setTimeout(rest, 2500 + text.length * 25);
      if (s.doSleep) timer = setTimeout(() => sleep(), 2000);   // dozes right back off
      if (s.go) timer = setTimeout(() => {
        resting = true;
        document.querySelector(s.go)?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });
      }, 900);
    };
    if (!keepChoices) choicesEl.classList.remove('show');
    if (calm) { for (let k = 0; k < Math.min(6, Math.ceil(text.length / 6)); k++) setTimeout(VOICE === 'typing' ? keyClick : blip, k * 70); return after(); }
    textEl.style.minWidth = `${textEl.offsetWidth}px`;
    let n = 0; textEl.textContent = '';
    typing = setInterval(() => {
      textEl.textContent = text.slice(0, ++n);
      if (VOICE === 'typing') { const ch = text[n - 1]; if (ch === ' ') keyClick('space'); else if (/\S/.test(ch)) keyClick(); }
      else if (n % 2 === 0 && /[a-z0-9]/i.test(text[n - 1])) blip(); // retro voice: every other letter
      if (n >= text.length) { clearInterval(typing); after(); }
    }, 26);
  };

  // A short interruption, then he picks up where he left off (same words, not a new joke)
  const aside = (id) => {
    if (sulking) return;                                       // he's not talking to you
    const resume = resting ? null : current, resumeText = currentText;
    play(id, { then: () => (resume ? play(resume, { text: resumeText }) : rest()) });
  };

  // Unanswered question: continue alone, but never while the pointer is on the bubble
  let hovering = false;
  bubble.addEventListener('pointerenter', () => { hovering = true; });
  bubble.addEventListener('pointerleave', () => { hovering = false; });
  const autoFrom = (id) => {
    timer = setTimeout(function tick() {
      if (current !== id || !visible) return;
      if (hovering) { timer = setTimeout(tick, 1500); return; }
      getSleepy();                                              // nobody answered: he gets sleepy, then dozes off
    }, AUTO_MS);
  };

  // ── Sleep: nobody has done anything for SLEEP_MS ──
  let sleeping = false, sulking = false;
  const zzz = hero.querySelector('.hero-zzz');
  const shockEl = hero.querySelector('.hero-shock');
  // First he says he's getting sleepy; if the visitor still does nothing, he dozes off
  let drowsy = false;
  const getSleepy = () => {
    drowsy = true;
    const resume = resting ? null : current, resumeText = currentText, saidAt = Date.now();
    play('sleepy', { keepChoices: true, hold: SLEEPY_HOLD_MS, then: () => {
      drowsy = false;
      if (lastActive > saidAt) return resume ? play(resume, { text: resumeText }) : rest(); // they moved: stay awake
      sleep();
    } });
  };
  // No interaction and not dozing off this time: a quiet coffee break (hold → sip → hold → back)
  const coffeeBreak = () => {
    onCoffee = true;
    const back = resting ? restPose() : (STEPS[current] && STEPS[current].pose) || restPose();
    const seq = [['coffee', 0], ['sip', 2200], ['coffee', 4600], ['sip', 7000], ['coffee', 9000], [back, 11500]];
    seq.forEach(([p, ms], i) => coffeeT.push(setTimeout(() => {
      if (p === 'sip') tone(300, 260, 0.25, 0.1, 'sine');    // soft slurp
      setPose(p);
      if (i === seq.length - 1) { onCoffee = false; lastActive = Date.now(); } // restart the idle clock
    }, ms)));
  };
  const sleep = () => {
    sleeping = true;
    clearTimers();
    bubble.classList.remove('show');
    setPose('sleep');
    const hr = hero.getBoundingClientRect(), r = body.getBoundingClientRect();
    zzz.style.left = `${r.left - hr.left + r.width * 0.6}px`;
    zzz.style.top = `${r.top - hr.top + r.height * 0.12}px`;
    hero.classList.add('sleeping');
    showTalk();
  };
  // Woken by a click: he jolts up in shock, then makes excuses
  const wakeUp = () => {
    if (!sleeping) return;
    sleeping = false;
    hero.classList.remove('sleeping');
    const resume = resting ? null : current, resumeText = currentText;
    shockSound();
    if (!calm) { charLayer.classList.remove('jolt'); void charLayer.offsetWidth; charLayer.classList.add('jolt'); }
    const r = body.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    shockEl.style.left = `${r.left - hr.left + r.width * 0.3}px`;
    shockEl.style.top = `${r.top - hr.top + r.height * 0.06}px`;
    hero.classList.remove('shocked'); void shockEl.offsetWidth; hero.classList.add('shocked');
    setTimeout(() => hero.classList.remove('shocked'), 1400);
    justWoke = true;
    // Back to the question he was asking; otherwise ask what brings them here
    const carryOn = () => (resume && STEPS[resume].options ? play(resume, { text: resumeText }) : play('wakeMenu'));
    // Sometimes, while he's flustered anyway, he pops the question
    const askNow = HIRE_ASK_ON && !hireAsked && Math.random() < WAKE_ASK_CHANCE;
    if (askNow) hireAsked = true;
    play('wake', { then: () => play('wake2', { then: () => (askNow ? play('wakeAsk') : carryOn()) }) });
  };
  // "Will you hire me?": once per visit, at a random quiet moment, never again after a yes
  let hireAsked = false;
  try { hireAsked = localStorage.getItem('heroHired') === 'yes'; } catch (e) {}
  const hireAskAt = Date.now() + HIRE_ASK_MIN_MS + Math.random() * (HIRE_ASK_MAX_MS - HIRE_ASK_MIN_MS);
  setInterval(() => {
    if (HIRE_ASK_ON && !hireAsked && Date.now() > hireAskAt && (idleOk || resting) && visible && !sleeping && !drowsy && !sulking
        && !onCoffee && !document.hidden && !hovering && !hero.classList.contains('cutin')) { hireAsked = true; play('askHire'); }
  }, 1500);
  setInterval(() => {
    if (idleOk && visible && !sleeping && !drowsy && !sulking && !onCoffee && !document.hidden && Date.now() - lastActive > SLEEP_MS) {
      if (Math.random() < COFFEE_CHANCE) coffeeBreak(); else getSleepy();
    }
  }, 2000);

  // First words: a returning visitor gets a "welcome back" instead of the intro
  const start = () => setTimeout(() => play(visits > 0 ? 'welcome' : 'hello'), 1900);
  if (hero.classList.contains('is-layered')) start();
  else body.addEventListener('load', start, { once: true });

  // ── Clicking him: reopen the menu, or react if poked repeatedly ──
  const shake = () => {
    if (calm) return;
    charLayer.classList.remove('shake'); void charLayer.offsetWidth; charLayer.classList.add('shake');
  };
  // Every click gives a little squish, so it always feels like you poked him
  const squish = () => {
    if (calm) return;
    charLayer.classList.remove('squish'); void charLayer.offsetWidth; charLayer.classList.add('squish');
  };
  let pokes = 0, forgiveT = null, raging = false, sulkResume = null, sulkResumeText = '';

  // Stop clicking for FORGIVE_MS and he calms down, then carries on where he was
  const scheduleForgive = () => {
    clearTimeout(forgiveT);
    forgiveT = setTimeout(() => {
      const wasRaging = raging, wasSulking = sulking;
      pokes = 0; sulking = false; raging = false;
      hero.classList.remove('raging'); hero.dataset.mood = '';
      if (!wasSulking) return;                                  // only tickled: nothing to forgive
      const resume = sulkResume, resumeText = sulkResumeText;
      play(wasRaging ? 'calmDown' : 'forgive',
           { then: () => (resume ? play(resume, { text: resumeText }) : rest()) });
    }, FORGIVE_MS);
  };
  // POKES_TO_ANGRY clicks: he sulks and ignores you
  const getAngry = () => {
    sulking = true;
    sulkResume = resting ? null : current; sulkResumeText = currentText;
    shake();
    play('angry', { then: () => { if (!raging) bubble.classList.remove('show'); } });
  };
  // POKES_TO_RAGE clicks: full meltdown, giant ARGH behind him
  // Rage shout: a short clip, played only when sound is on
  let rageAudio = null;
  const playRage = () => {
    if (!soundOn) return;
    if (!rageAudio) { rageAudio = new Audio('assets/character/fx/rage-shout.mp3'); rageAudio.preload = 'auto'; }
    rageAudio.volume = RAGE_VOLUME; rageAudio.currentTime = 0;
    rageAudio.play().catch(() => tone(140, 70, 0.5, 0.25, 'sawtooth', 900));
  };
  const rage = () => {
    raging = true;
    hero.classList.add('raging');
    shake();
    playRage();                                                // "I'm very angry!" shout (growl if it can't play)
    play('rage');
  };

  // Listen on the whole character layer, so clicks count even when the blink frame is on top
  charLayer.addEventListener('click', (e) => {
    lastActive = Date.now();
    // Clicked the empty space around him: skip the current line instead of poking him
    if (!e.target.closest('.hero-char-img') || !onBody(e.clientX, e.clientY)) return skipLine();
    if (sleeping) return wakeUp();                             // only a click/tap wakes him
    pokes++;
    scheduleForgive();
    if (raging) { shake(); return; }                           // already furious
    if (pokes >= POKES_TO_RAGE) return rage();
    if (sulking) { shake(); return; }                          // ignoring you, getting madder
    if (pokes >= POKES_TO_ANGRY) return getAngry();
    squish(); tone(500 + pokes * 60, 380, 0.07, 0.2, 'sine');  // "boop", higher each poke
    if (pokes === 3) aside('poke2');
    else if (pokes === 2) aside('poke1');
  });
  // Is (x, y) on his drawn body, or on the transparent space around him? (checks the pixel)
  const hitMaps = {};
  const onBody = (x, y) => {
    const src = body.getAttribute('src'), N = 256;
    let map = hitMaps[src];
    if (!map) {
      if (!body.complete || !body.naturalWidth) return true;   // pose still loading: count it as him (don't cache)
      try {
        const c = document.createElement('canvas'); c.width = c.height = N;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(body, 0, 0, N, N);
        map = hitMaps[src] = g.getImageData(0, 0, N, N).data;
      } catch (err) { return true; }                            // can't read pixels (e.g. file://): treat as body
    }
    const r = body.getBoundingClientRect();
    const px = Math.floor((x - r.left) / r.width * N), py = Math.floor((y - r.top) / r.height * N);
    if (px < 0 || py < 0 || px >= N || py >= N) return false;
    return map[(py * N + px) * 4 + 3] > 40;                     // alpha channel
  };
  // Click-to-skip: jump past whatever line is showing
  const skipLine = () => {
    if (sleeping || sulking || raging || !shown || !bubble.classList.contains('show')) return;
    const { s, then } = shown;
    clearTimers();
    clickSound();
    if (then) return then();
    if (s.options) return play(skipTarget(current));
    if (s.next) return play(s.next);
    if (s.doSleep) return sleep();
    if (s.go) { resting = true; document.querySelector(s.go)?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' }); return; }
    rest();
  };
  // Any sign of life keeps him from dozing off (but once asleep, only a click wakes him)
  const activity = () => { lastActive = Date.now(); };
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev =>
    window.addEventListener(ev, activity, { passive: true, capture: true }));
  document.addEventListener('scroll', activity, { passive: true, capture: true });

  // Switched tabs and came back
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (hiddenAt && Date.now() - hiddenAt > 4000 && visible && !sleeping) setTimeout(() => aside('tabBack'), 400);
  });

  // Typed words anywhere on the page (Easter eggs): word → step
  const EGGS = { hire: 'hire', rose: 'roseEgg', love: 'roseEgg' };
  let typed = '';
  window.addEventListener('keydown', (e) => {
    const t = e.target;
    if (e.ctrlKey || e.metaKey || e.altKey || (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))) return;
    typed = (typed + (e.key.length === 1 ? e.key.toLowerCase() : ' ')).slice(-4);
    const step = EGGS[typed];
    if (!step || sulking) return;
    typed = '';
    if (sleeping) { sleeping = false; hero.classList.remove('sleeping'); }
    if (visible) return play(step);
    leftOnce = false;                                          // skip the "welcome back"
    hero.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });
    setTimeout(() => play(step), 800);
  });

  // Still here after 5 minutes
  const quiet = () => (idleOk || resting) && visible && !sleeping && !drowsy && !sulking && !onCoffee
                      && !document.hidden && !hovering && !hero.classList.contains('cutin');
  setTimeout(() => {
    const iv = setInterval(() => {
      if (!visible) { pendingLong = true; clearInterval(iv); return; }  // say it when they scroll back
      if (quiet()) { clearInterval(iv); play('long'); }
    }, 2000);
  }, 5 * 60 * 1000);

  // Scrolled away and came back
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!visible) {
      if (current) leftOnce = true;
      if (sleeping) { sleeping = false; hero.classList.remove('sleeping'); }
      clearTimers(); stopCry(); hero.dataset.mood = ''; bubble.classList.remove('show'); setPose(restPose());
    } else if (leftOnce || pendingLong) {
      const next = pendingLong ? 'long' : 'back';
      leftOnce = pendingLong = false;
      setTimeout(() => { if (visible) play(next); }, 500);
    }
  }, { threshold: 0.5 }).observe(hero);
  window.addEventListener('resize', () => { if (bubble.classList.contains('show')) place(); });
})();
