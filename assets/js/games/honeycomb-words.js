/* Honeycomb Words — build words from seven hex letters, centre letter compulsory. */
(function () {
  'use strict';

  /* Twelve hand-built hives. `l` is the seven letters (index 0 is the centre),
     `w` is the hand-checked answer list: every entry is at least four letters,
     uses only those seven letters and contains the centre. At least one entry
     in each hive is a pangram that uses all seven. */
  var HIVES = [
    { l: 'tclimae', w: ('talc tact tale teal tame team meat mate late malt melt time item emit mitt tile ' +
      'tilt till tall tell teat latte tacit attic title metal matte elate elite cattle tattle little ' +
      'millet mallet tamale tactic tactile lattice militate metallic climate').split(' ') },
    { l: 'apinter', w: ('aria anti apart rain rant rate rapt tear tare tarp part pair pain pane pant pare ' +
      'pear peat near neat tape pita tapir trait train attain attire entrap parent pirate retain retina ' +
      'trainer terrain painter repaint pertain intranet patient').split(' ') },
    { l: 'ahndles', w: ('alas ahead ashen dale dales dash dean deans deal deals head heads heal heals hale ' +
      'hales hand hands handle handles handed lane lanes land lands lash lead leads lean leans leash sale ' +
      'sales salad sand sands sandal sandals sane seal seals shade shale slash landed sanded').split(' ') },
    { l: 'omnster', w: ('moon moor moot more morn moss most mote nose note notes onto onset root roots roost ' +
      'rose rote rots snore snort some stone store storm smote torso tones toner tenor moron sermon mentor ' +
      'remote monster torment tremors monsters').split(' ') },
    { l: 'oflwers', w: ('flow flows flower flowers floor floors follow follows fellow fellows fool fools fore ' +
      'foes lore lose loser lower lowers lows owls owes role roles roll rolls rose rows slow slower sole ' +
      'solo sore swore wolf wool worse').split(' ') },
    { l: 'achpter', w: ('acre apart area cart care carat catch cater chart chat char chapter chatter cheat ' +
      'cheaper crate crater each earth hare harp hatch hate heap hearth heart heat heather parch part patch ' +
      'path pace pact peach preach race rate rather reach react recap tape tare teach tear theater threat ' +
      'trace trap hectare attach').split(' ') },
    { l: 'eplanst', w: ('ease east eaten elate lane lanes lapse late least pale pane panes peal peals peat ' +
      'pest plea pleas plate plates plane planes sale seal seat sent slate stale steal tale teal teas tease ' +
      'pastel petals staple pleats talent latent sealant planet planets pleasant').split(' ') },
    { l: 'nmachie', w: ('acne amen amine anime cane canine chain cinema henna inane inch main mane manic ' +
      'maniac manna mean menace mien mine name nice niche nine anemic machine mechanic').split(' ') },
    { l: 'dreaing', w: ('aide aided arid dare daring dead dean dear deed diner dine dined ding dire drag ' +
      'drain dread gander garden gardener grade grand grind idea indeed nadir raid read ride rind danger ' +
      'gained grained reading engaged').split(' ') },
    { l: 'astrnge', w: ('agent agents anger angers ants area arrange arrest aster gate gates gear gears ' +
      'grant grate great grease near neat rang rant rate rates rats sane sang snag stag stage star stare ' +
      'start tans target targets tear tears garnet strange stranger sergeant').split(' ') },
    { l: 'lbuider', w: ('bell bile bill billed bled blue bluer blur bridle bubble build builder bulb bull ' +
      'dribble drill drilled dull dulled duller idle idler libel lied lube lure lurid rebel rebuild riddle ' +
      'rubble rule ruler').split(' ') },
    { l: 'oshuted', w: ('dose dote doted dots douse hood hoods hoot hoots hose hosed host hosted house housed ' +
      'oust ousted outs shod shoe shoot shot shout shouted soothe soothed south stood those toes tooth ' +
      'toothed tote toted hothouse outhouse').split(' ') }
  ];

  var ROUNDS = 5;
  var ROUND_TIME = 100;
  var TARGET_PCT = [.22, .27, .32, .37, .42];

  function wordScore(w, letters) {
    var pts = w.length === 4 ? 10 : w.length * 10;
    var seen = Object.create(null);
    for (var i = 0; i < w.length; i++) seen[w.charAt(i)] = true;
    var all = true;
    for (i = 0; i < letters.length; i++) if (!seen[letters.charAt(i)]) { all = false; break; }
    return all ? pts + 70 : pts;
  }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var els = null, timers = [];

    function later(fn, ms) {
      var t = setTimeout(function () { var i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); fn(); }, ms);
      timers.push(t);
      return t;
    }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    /* Flat-top hexes: two vertical neighbours and four diagonals. */
    var SEATS = [
      [0, 0], [0, -1.06], [.795, -.53], [.795, .53], [0, 1.06], [-.795, .53], [-.795, -.53]
    ];

    function build(g) {
      var root = g.root;
      root.innerHTML = '';
      var style = document.createElement('style');
      style.textContent = [
        '.hc-wrap{--hw:clamp(54px,15vw,74px);--hh:calc(var(--hw)*.866);display:flex;gap:16px;',
        'align-items:flex-start;justify-content:center;flex-wrap:wrap;font-family:Outfit,sans-serif;',
        'margin:auto;max-width:640px;user-select:none;-webkit-user-select:none}',
        '.hc-main{display:flex;flex-direction:column;align-items:center;gap:10px;position:relative}',
        '.hc-typed{height:44px;display:flex;align-items:center;justify-content:center;font:800 clamp(20px,5vw,28px)/1 Outfit,sans-serif;',
        'letter-spacing:.06em;text-transform:uppercase;color:#ffe9a8;min-width:200px;border-bottom:3px solid #6b4a12;padding:0 14px}',
        '.hc-typed b{color:#ffc93c}.hc-typed i{color:#8a7043;font-style:normal}',
        '.hc-typed .cur{animation:hcBlink 1s steps(2) infinite;color:#ffc93c}',
        '@keyframes hcBlink{50%{opacity:0}}',
        '.hc-hive{position:relative;width:calc(var(--hw)*2.7);height:calc(var(--hh)*3.2)}',
        '.hc-hex{position:absolute;width:var(--hw);height:var(--hh);left:50%;top:50%;',
        'clip-path:polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%);',
        'background:#4a3a18;color:#ffeec2;display:grid;place-items:center;cursor:pointer;',
        'font:800 calc(var(--hw)*.42)/1 Outfit,sans-serif;text-transform:uppercase;transition:transform .12s,background .12s}',
        '.hc-hex.mid{background:#ffc93c;color:#301f04}',
        '.hc-hex:active{transform:translate(-50%,-50%) scale(.9)!important}',
        '.hc-btns{display:flex;gap:8px}',
        '.hc-b{border:2px solid #7a5c1e;background:#2a1f06;color:#ffe9a8;border-radius:22px;padding:7px 16px;',
        'font:700 .82rem Outfit,sans-serif;cursor:pointer}',
        '.hc-b:active{background:#7a5c1e}',
        '.hc-b.go{background:#ffc93c;color:#301f04;border-color:#ffc93c}',
        '.hc-side{flex:1 1 210px;min-width:190px;display:flex;flex-direction:column;gap:7px}',
        '.hc-prog{height:12px;border-radius:7px;background:#3a2c0d;overflow:hidden;border:1px solid #6b4a12}',
        '.hc-prog i{display:block;height:100%;background:linear-gradient(90deg,#ffc93c,#ffec9e);width:0;transition:width .35s}',
        '.hc-meta{display:flex;justify-content:space-between;font-size:.74rem;color:#c8a964;letter-spacing:.06em}',
        '.hc-found{background:#241a04;border:1px solid #5a4212;border-radius:9px;padding:7px 9px;',
        'max-height:210px;overflow:auto;display:flex;flex-wrap:wrap;gap:5px;align-content:flex-start;min-height:54px}',
        '.hc-w{background:#3d2d0a;color:#ffe9a8;border-radius:5px;padding:2px 7px;font-size:.76rem;text-transform:capitalize}',
        '.hc-w.pan{background:#ffc93c;color:#301f04;font-weight:800}',
        '.hc-msg{min-height:20px;font-size:.82rem;font-weight:700;color:#ffc93c;text-align:center}',
        '.hc-drop{position:absolute;width:9px;height:12px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;',
        'background:#ffc93c;pointer-events:none;animation:hcDrip 1.2s ease-in forwards}',
        '@keyframes hcDrip{0%{transform:translate(0,0) scale(.5);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1);opacity:0}}'
      ].join('');

      var wrap = document.createElement('div'); wrap.className = 'hc-wrap';
      var main = document.createElement('div'); main.className = 'hc-main';

      var typed = document.createElement('div'); typed.className = 'hc-typed';
      var hive = document.createElement('div'); hive.className = 'hc-hive';
      var hexes = [];
      for (var i = 0; i < 7; i++) {
        var hx = document.createElement('div');
        hx.className = 'hc-hex' + (i === 0 ? ' mid' : '');
        hx.style.transform = 'translate(-50%,-50%)';
        hx.style.left = 'calc(50% + var(--hw) * ' + SEATS[i][0] + ')';
        hx.style.top = 'calc(50% + var(--hh) * ' + SEATS[i][1] + ')';
        (function (node) {
          node.addEventListener('click', function () { typeCh(g, node.textContent.toLowerCase()); });
        })(hx);
        hive.appendChild(hx);
        hexes.push(hx);
      }

      var btns = document.createElement('div'); btns.className = 'hc-btns';
      var bDel = document.createElement('button'); bDel.type = 'button'; bDel.className = 'hc-b'; bDel.textContent = 'Delete';
      bDel.addEventListener('click', function () { back(g); });
      var bMix = document.createElement('button'); bMix.type = 'button'; bMix.className = 'hc-b'; bMix.textContent = 'Shuffle';
      bMix.addEventListener('click', function () { shuffle(g); });
      var bGo = document.createElement('button'); bGo.type = 'button'; bGo.className = 'hc-b go'; bGo.textContent = 'Enter';
      bGo.addEventListener('click', function () { submit(g); });
      btns.appendChild(bDel); btns.appendChild(bMix); btns.appendChild(bGo);

      var msg = document.createElement('div'); msg.className = 'hc-msg';
      main.appendChild(typed); main.appendChild(hive); main.appendChild(btns); main.appendChild(msg);

      var side = document.createElement('div'); side.className = 'hc-side';
      var meta = document.createElement('div'); meta.className = 'hc-meta';
      var mLeft = document.createElement('span'), mRight = document.createElement('span');
      meta.appendChild(mLeft); meta.appendChild(mRight);
      var prog = document.createElement('div'); prog.className = 'hc-prog';
      var bar = document.createElement('i'); prog.appendChild(bar);
      var found = document.createElement('div'); found.className = 'hc-found';
      side.appendChild(meta); side.appendChild(prog); side.appendChild(found);

      wrap.appendChild(main); wrap.appendChild(side);
      root.appendChild(style); root.appendChild(wrap);

      els = { wrap: wrap, main: main, typed: typed, hexes: hexes, msg: msg,
        mLeft: mLeft, mRight: mRight, bar: bar, found: found };
    }

    /* ------------------------------------------------------------ rounds */

    function reset(g) {
      var d = g.data;
      clearTimers();
      d.gen = (d.gen || 0) + 1;
      d.round = 0;
      d.order = U.shuffle(HIVES.slice());
      build(g);
      loadRound(g);
      g.set('Score', 0);
    }

    function loadRound(g) {
      var d = g.data;
      var h = d.order[d.round % d.order.length];
      d.hive = h;
      d.letters = h.l;
      d.centre = h.l.charAt(0);
      d.outer = h.l.slice(1).split('');
      d.valid = Object.create(null);
      d.max = 0;
      h.w.forEach(function (w) {
        d.valid[w] = wordScore(w, h.l);
        d.max += d.valid[w];
      });
      d.target = Math.ceil(d.max * TARGET_PCT[Math.min(d.round, TARGET_PCT.length - 1)]);
      d.got = Object.create(null);
      d.roundScore = 0;
      d.typed = '';
      d.time = ROUND_TIME;
      d.done = false;
      els.found.innerHTML = '';
      els.msg.textContent = 'Every word needs the gold letter.';
      layout(g);
      paintTyped(g);
      paintMeta(g);
      g.set('Hive', (d.round + 1) + ' / ' + ROUNDS);
      g.set('Time', Math.ceil(d.time));
    }

    function layout(g) {
      var d = g.data;
      els.hexes[0].textContent = d.centre.toUpperCase();
      for (var i = 0; i < 6; i++) els.hexes[i + 1].textContent = d.outer[i].toUpperCase();
    }

    function shuffle(g) {
      var d = g.data;
      if (g.state !== 'play' || d.done) return;
      U.shuffle(d.outer);
      layout(g);
      Milo.sound.click();
    }

    function paintTyped(g) {
      var d = g.data;
      els.typed.innerHTML = '';
      if (!d.typed) {
        var ph = document.createElement('i'); ph.textContent = 'type a word';
        els.typed.appendChild(ph);
      } else {
        for (var i = 0; i < d.typed.length; i++) {
          var ch = d.typed.charAt(i);
          var n = document.createElement(ch === d.centre ? 'b' : 'span');
          n.textContent = ch.toUpperCase();
          els.typed.appendChild(n);
        }
      }
      var car = document.createElement('span'); car.className = 'cur'; car.textContent = '|';
      els.typed.appendChild(car);
    }

    function paintMeta(g) {
      var d = g.data;
      var n = Object.keys(d.got).length;
      els.mLeft.textContent = n + ' / ' + d.hive.w.length + ' words';
      els.mRight.textContent = d.roundScore + ' / ' + d.target;
      els.bar.style.width = Math.min(100, (d.roundScore / d.target) * 100) + '%';
    }

    /* ------------------------------------------------------------- input */

    function typeCh(g, ch) {
      var d = g.data;
      if (g.state !== 'play' || d.done) return;
      if (d.letters.indexOf(ch) < 0) {
        els.msg.textContent = 'Letter not in the hive';
        Milo.sound.tone({ f: 170, d: .06, v: .05, type: 'square' });
        return;
      }
      if (d.typed.length >= 14) return;
      d.typed += ch;
      Milo.sound.tone({ f: 500 + d.typed.length * 22, d: .03, v: .05, type: 'sine' });
      paintTyped(g);
    }

    function back(g) {
      var d = g.data;
      if (g.state !== 'play' || d.done) return;
      d.typed = d.typed.slice(0, -1);
      Milo.sound.tone({ f: 260, d: .04, v: .05, type: 'triangle' });
      paintTyped(g);
    }

    function submit(g) {
      var d = g.data;
      if (g.state !== 'play' || d.done) return;
      var w = d.typed;
      d.typed = '';
      paintTyped(g);
      if (!w) return;
      if (w.length < 4) { reject(g, 'Too short — four letters minimum'); return; }
      if (w.indexOf(d.centre) < 0) { reject(g, 'Missing the ' + d.centre.toUpperCase()); return; }
      if (d.got[w]) { reject(g, 'Already found'); return; }
      if (!d.valid[w]) { reject(g, 'Not in this hive'); return; }

      var pts = d.valid[w];
      var pan = pts > w.length * 10;
      d.got[w] = true;
      d.roundScore += pts;
      g.score += pts;
      g.set('Score', U.fmt(g.score));

      var chip = document.createElement('span');
      chip.className = 'hc-w' + (pan ? ' pan' : '');
      chip.textContent = w;
      els.found.insertBefore(chip, els.found.firstChild);

      els.msg.textContent = (pan ? 'PANGRAM! +' : (w.length >= 7 ? 'Big one! +' : '+')) + pts;
      if (pan) { Milo.sound.powerup(); drip(g, 22); }
      else { Milo.sound.coin(); drip(g, 8); }
      paintMeta(g);

      if (d.roundScore >= d.target) clearRound(g);
    }

    function reject(g, why) {
      els.msg.textContent = why;
      Milo.sound.tone({ f: 150, d: .1, v: .07, type: 'square' });
    }

    function drip(g, n) {
      for (var i = 0; i < n; i++) {
        var p = document.createElement('div');
        p.className = 'hc-drop';
        p.style.left = (38 + Math.random() * 24) + '%';
        p.style.top = '42%';
        p.style.setProperty('--dx', (Math.random() * 180 - 90).toFixed(0) + 'px');
        p.style.setProperty('--dy', (70 + Math.random() * 130).toFixed(0) + 'px');
        p.style.animationDelay = (Math.random() * .2).toFixed(2) + 's';
        p.style.opacity = (.5 + Math.random() * .5).toFixed(2);
        els.main.appendChild(p);
        (function (node) { later(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 1500); })(p);
      }
    }

    function clearRound(g) {
      var d = g.data, gen = d.gen;
      d.done = true;
      var bonus = Math.ceil(d.time) * 4;
      g.score += bonus;
      g.set('Score', U.fmt(g.score));
      Milo.sound.win();
      drip(g, 30);
      els.msg.textContent = 'Hive cleared! Time bonus +' + bonus;
      later(function () {
        if (d.gen !== gen || g.state === 'over') return;
        d.round++;
        if (d.round >= ROUNDS) {
          g.win({
            emo: '🍯', title: 'Whole hive harvested',
            text: 'Five hives cleared for ' + U.fmt(g.score) + ' points.',
            score: g.score
          });
        } else loadRound(g);
      }, 1700);
    }

    function key(g, e) {
      var d = g.data;
      if (d.done) return;
      if (e.code === 'Enter' || e.code === 'NumpadEnter') { submit(g); return; }
      if (e.code === 'Backspace') { back(g); return; }
      if (e.code === 'Space') { shuffle(g); return; }
      if (/^[a-zA-Z]$/.test(e.key)) typeCh(g, e.key.toLowerCase());
    }

    return Milo.domGame(host, {
      id: 'honeycomb-words',
      bg: '#2a1f06',
      stats: ['Score', 'Hive', 'Time'],
      emo: '🍯',
      start: {
        title: 'Honeycomb Words',
        text: 'Seven letters, one gold centre. Build words of four letters or more that use the ' +
          'gold letter every time — letters may repeat. Longer words pay more and a pangram using ' +
          'all seven letters is worth a fat bonus. Reach the round target before the clock runs out ' +
          'and the next hive opens.',
        keys: ['Type letters', 'Enter', 'Backspace', 'Space = shuffle']
      },
      init: reset,
      destroy: function () { clearTimers(); },
      update: function (g, dt) {
        var d = g.data;
        if (d.done) return;
        d.time -= dt;
        g.set('Time', Math.max(0, Math.ceil(d.time)));
        if (d.time <= 0) {
          d.done = true;
          var missed = d.hive.w.filter(function (w) { return !d.got[w] && w.length >= 6; }).slice(0, 4);
          g.gameOver({
            emo: '⏳', title: 'Hive closed',
            text: 'Short of the target on hive ' + (d.round + 1) + '. You missed ' +
              (missed.length ? missed.join(', ').toUpperCase() : 'nothing long') + '.',
            score: g.score
          });
        }
      },
      preload: function (g) {
        var prev = g.input._onKey;
        g.input._onKey = function (e, name) {
          if (g.state === 'play' && e.code === 'KeyP') { key(g, e); return; }
          prev(e, name);
        };
      },
      onKey: key
    });
  }

  window.Milo.register({
    id: 'honeycomb-words', title: 'Honeycomb Words', emo: '🍯', category: 'Word',
    tagline: 'Seven letters, one compulsory gold centre',
    description: 'Twelve hand-built hives, five of them per run. Make words of four letters or more ' +
      'from the seven hex letters, and every single word must contain the gold centre letter — ' +
      'letters can be reused as often as you like. Four-letter words pay ten, longer ones pay ten a ' +
      'letter, and a pangram using all seven letters adds seventy on top. Each hive sets a higher ' +
      'score target than the last and the clock does not stop. Tip: when you stall, hit Shuffle — ' +
      'seeing the outer six in a new order shakes loose words you were staring straight past.',
    controls: ['Type letters', 'Enter', 'Backspace', 'Space to shuffle', 'Click hexes'],
    colors: ['#2a1f06', '#ffc93c'],
    tags: ['word', 'letters', 'anagram', 'spelling', 'timed'],
    mount: mount
  });
})();
