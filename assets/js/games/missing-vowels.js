/* Missing Vowels — every vowel is gone and the spaces have moved. */
(function () {
  'use strict';

  /* 128 hand-written phrases across eight themed categories. Entries are plain
     strings unless they need extra accepted spellings, in which case they are
     {p: canonical, alt: [...]}. Answer checking ignores case, punctuation,
     spacing and a leading article, and forgives one typo on anything long. */
  var CATS = [
    { name: 'At the Movies', emo: '🎬', list: [
      'The Lion King',
      'Jurassic Park',
      'Back to the Future',
      'Finding Nemo',
      'The Wizard of Oz',
      'Star Wars',
      'Toy Story',
      'The Godfather',
      'Forrest Gump',
      'The Sound of Music',
      'Raiders of the Lost Ark',
      'The Shawshank Redemption',
      'Home Alone',
      'The Matrix',
      'Pirates of the Caribbean',
      'Groundhog Day'
    ] },
    { name: 'Sayings and Idioms', emo: '💬', list: [
      'Piece of Cake',
      'Break the Ice',
      'Raining Cats and Dogs',
      'Once in a Blue Moon',
      'The Ball is in Your Court',
      'Bite the Bullet',
      'Let the Cat Out of the Bag',
      'Under the Weather',
      'Costs an Arm and a Leg',
      'Burn the Midnight Oil',
      'Hit the Nail on the Head',
      'A Blessing in Disguise',
      'The Best of Both Worlds',
      'Spill the Beans',
      'Barking Up the Wrong Tree',
      'When Pigs Fly'
    ] },
    { name: 'On the Plate', emo: '🍽️', list: [
      'Fish and Chips',
      { p: 'Spaghetti Bolognese', alt: ['spaghetti bolognaise', 'spag bol'] },
      'Chocolate Brownie',
      { p: 'Shepherds Pie', alt: ["shepherd's pie"] },
      'Roast Potatoes',
      'Strawberry Milkshake',
      'Chicken Tikka Masala',
      'Banana Split',
      'Toad in the Hole',
      'Scrambled Eggs',
      'Peanut Butter',
      'Apple Crumble',
      'Caesar Salad',
      'Mushroom Risotto',
      'Lemon Meringue Pie',
      'Full English Breakfast'
    ] },
    { name: 'Around the Globe', emo: '🌍', list: [
      'Buenos Aires',
      'The Great Barrier Reef',
      { p: 'Mount Kilimanjaro', alt: ['kilimanjaro'] },
      'New Zealand',
      { p: 'The Sahara Desert', alt: ['sahara'] },
      'Rio de Janeiro',
      'The Panama Canal',
      'South Korea',
      'The Black Sea',
      'Kuala Lumpur',
      'The Grand Canyon',
      { p: 'Saint Petersburg', alt: ['st petersburg'] },
      { p: 'The River Nile', alt: ['nile', 'the nile'] },
      'Costa Rica',
      { p: 'The Rocky Mountains', alt: ['the rockies', 'rockies'] },
      { p: 'Czech Republic', alt: ['czechia'] }
    ] },
    { name: 'Creature Feature', emo: '🐾', list: [
      'Giant Panda',
      'Komodo Dragon',
      'Emperor Penguin',
      'Bottlenose Dolphin',
      'Praying Mantis',
      'Snow Leopard',
      'Great White Shark',
      'Honey Badger',
      'Arctic Fox',
      { p: 'Duck Billed Platypus', alt: ['platypus', 'duck-billed platypus'] },
      'Mountain Gorilla',
      'Bumblebee',
      'Golden Eagle',
      'Sea Otter',
      'Tasmanian Devil',
      'Humpback Whale'
    ] },
    { name: 'Space and Science', emo: '🔭', list: [
      'The Solar System',
      'The Milky Way',
      'Black Hole',
      'Periodic Table',
      'The Speed of Light',
      { p: 'Halleys Comet', alt: ["halley's comet"] },
      { p: 'The International Space Station', alt: ['iss'] },
      'Photosynthesis',
      'Gravity',
      { p: 'The Hubble Telescope', alt: ['hubble space telescope', 'hubble'] },
      'Double Helix',
      { p: 'Saturns Rings', alt: ["saturn's rings", 'the rings of saturn'] },
      'The Big Bang',
      'Absolute Zero',
      { p: 'Northern Lights', alt: ['aurora borealis'] },
      { p: 'Carbon Dioxide', alt: ['co2'] }
    ] },
    { name: 'Sporting Life', emo: '🏆', list: [
      'The World Cup',
      'Penalty Shootout',
      'The Olympic Games',
      'Tennis Racket',
      'Home Run',
      'Slam Dunk',
      'The Tour de France',
      'Hole in One',
      'The High Jump',
      { p: 'Formula One', alt: ['formula 1', 'f1'] },
      'Table Tennis',
      'Hat Trick',
      'The Marathon',
      'Ice Hockey',
      { p: 'Synchronised Swimming', alt: ['synchronized swimming'] },
      { p: 'The Hundred Metres', alt: ['the hundred meters', '100 metres', '100 meters', '100m'] }
    ] },
    { name: 'Around the House', emo: '🏠', list: [
      'Washing Machine',
      'Chest of Drawers',
      { p: 'Vacuum Cleaner', alt: ['hoover'] },
      'Kitchen Sink',
      'Garden Shed',
      'Alarm Clock',
      { p: 'Tumble Dryer', alt: ['tumble drier'] },
      'Front Door',
      'Coffee Table',
      'Toothbrush',
      'Remote Control',
      'Light Switch',
      'Ironing Board',
      'Bedside Lamp',
      'Frying Pan',
      { p: 'Washing Up Liquid', alt: ['washing-up liquid'] }
    ] }
  ];

  var LIVES = 3;
  var HINT_COST = 40;
  var KEYROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var els = null, timers = [];

    function later(fn, ms) {
      var t = setTimeout(function () {
        var i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); fn();
      }, ms);
      timers.push(t);
      return t;
    }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    /* ------------------------------------------------- answer comparison */

    function strip(s) {
      return String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    }
    function core(s) {
      return strip(s).replace(/^(the|a|an) /, '').replace(/ /g, '');
    }
    /** Plain Levenshtein — the strings here are never longer than ~30 chars. */
    function lev(a, b) {
      var prev = [], cur = [], i, j;
      for (j = 0; j <= b.length; j++) prev[j] = j;
      for (i = 1; i <= a.length; i++) {
        cur[0] = i;
        for (j = 1; j <= b.length; j++) {
          cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1,
            prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
        }
        for (j = 0; j <= b.length; j++) prev[j] = cur[j];
      }
      return prev[b.length];
    }
    function accepts(typed, item) {
      var t = core(typed);
      if (!t) return false;
      var cands = [item.p].concat(item.alt || []);
      for (var i = 0; i < cands.length; i++) {
        var c = core(cands[i]);
        if (t === c) return true;
        if (c.length >= 10 && Math.abs(t.length - c.length) <= 2 && lev(t, c) <= 1) return true;
        if (c.length >= 17 && Math.abs(t.length - c.length) <= 3 && lev(t, c) <= 2) return true;
      }
      return false;
    }

    /* ------------------------------------------------- puzzle generation */

    function consonants(s) {
      return s.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/[AEIOU]/g, '');
    }
    /** Re-chunk the consonant run so the original word breaks are destroyed. */
    function regroup(str, hard) {
      if (str.length < 5) return str;
      if (hard && Math.random() < .3) return str;          // no spaces at all
      var out = [], i = 0, min = hard ? 2 : 3, max = hard ? 5 : 4;
      while (i < str.length) {
        var n = U.randInt(min, max);
        if (str.length - i - n === 1) n++;
        out.push(str.slice(i, i + n));
        i += n;
      }
      return out.join(' ');
    }

    /* --------------------------------------------------------------- DOM */

    function build(g) {
      var root = g.root;
      root.innerHTML = '';
      var style = document.createElement('style');
      style.textContent = [
        '.mv-wrap{display:flex;flex-direction:column;align-items:center;gap:10px;position:relative;',
        'font-family:Outfit,sans-serif;width:100%;max-width:560px;margin:auto;',
        'user-select:none;-webkit-user-select:none}',
        '.mv-cat{font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;color:#7ee3d0;font-weight:800}',
        '.mv-puz{font:900 clamp(20px,6.2vw,38px)/1.25 "Courier New",ui-monospace,monospace;',
        'color:#eafff9;letter-spacing:.14em;text-align:center;word-break:break-word;',
        'text-shadow:0 0 26px rgba(45,212,191,.55);min-height:48px;padding:2px 4px}',
        '.mv-puz.shake{animation:mvShake .32s}',
        '@keyframes mvShake{25%{transform:translateX(-7px)}50%{transform:translateX(7px)}75%{transform:translateX(-4px)}}',
        '.mv-bar{width:100%;height:9px;border-radius:6px;background:#0d3b39;overflow:hidden}',
        '.mv-bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#2dd4bf,#facc15);',
        'transition:background .3s}',
        '.mv-bar i.low{background:linear-gradient(90deg,#f97316,#fb7185)}',
        '.mv-in{width:100%;min-height:52px;border-radius:14px;border:2px solid #1c5f5c;background:#08302f;',
        'display:flex;align-items:center;justify-content:center;padding:8px 12px;',
        'font:800 clamp(16px,4.6vw,25px)/1.2 Outfit,sans-serif;color:#5eead4;text-align:center;',
        'word-break:break-word}',
        '.mv-in.empty{color:rgba(190,240,232,.32)}',
        '.mv-hint{font:700 clamp(13px,3.6vw,17px)/1.4 "Courier New",ui-monospace,monospace;',
        'color:#fcd34d;letter-spacing:.16em;min-height:20px;text-align:center;word-break:break-word}',
        '.mv-note{min-height:20px;text-align:center;font-size:.86rem;font-weight:700;color:#c9fff4}',
        '.mv-note.bad{color:#fda4af}',
        '.mv-note.good{color:#6ee7b7}',
        '.mv-row{display:flex;gap:6px;justify-content:center;width:100%;flex-wrap:wrap}',
        '.mv-b{border:1px solid #1e6a66;background:#0c3f3d;color:#d7fff6;border-radius:9px;',
        'padding:7px 12px;font:700 .8rem Outfit,sans-serif;cursor:pointer;transition:transform .08s,background .15s}',
        '.mv-b:hover{background:#12524f}',
        '.mv-b:active{transform:scale(.95)}',
        '.mv-b.warn{border-color:#a16207;background:#3f2e06;color:#fde68a}',
        '.mv-b.go{border-color:#0f766e;background:#0f766e;color:#eafff9}',
        '.mv-kb{display:flex;flex-direction:column;gap:5px;width:100%;align-items:center}',
        '.mv-kr{display:flex;gap:4px;justify-content:center;width:100%}',
        '.mv-k{flex:1 1 0;min-width:0;max-width:40px;border:1px solid #17514f;background:#0a3937;',
        'color:#cffdf3;border-radius:7px;padding:8px 0;font:700 .82rem Outfit,sans-serif;cursor:pointer}',
        '.mv-k:active{background:#18706c;transform:scale(.94)}',
        '.mv-foot{display:flex;justify-content:space-between;width:100%;font-size:.76rem;color:#79b8b1}',
        '.mv-foot b{color:#fde68a}',
        '.mv-sp{position:absolute;width:7px;height:7px;border-radius:50%;pointer-events:none;',
        'animation:mvSp .95s ease-out forwards}',
        '@keyframes mvSp{0%{transform:translate(0,0) scale(1);opacity:1}',
        '100%{transform:translate(var(--dx),var(--dy)) scale(0);opacity:0}}'
      ].join('');

      var wrap = document.createElement('div'); wrap.className = 'mv-wrap';
      var cat = document.createElement('div'); cat.className = 'mv-cat';
      var puz = document.createElement('div'); puz.className = 'mv-puz';
      var bar = document.createElement('div'); bar.className = 'mv-bar';
      var fill = document.createElement('i'); bar.appendChild(fill);
      var box = document.createElement('div'); box.className = 'mv-in empty';
      var hint = document.createElement('div'); hint.className = 'mv-hint';
      var note = document.createElement('div'); note.className = 'mv-note';

      var row = document.createElement('div'); row.className = 'mv-row';
      function mkBtn(label, cls, fn) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'mv-b' + (cls ? ' ' + cls : ''); b.textContent = label;
        b.addEventListener('click', function () { fn(g); });
        row.appendChild(b);
        return b;
      }
      mkBtn('Hint (−' + HINT_COST + ')', 'warn', hintNow);
      mkBtn('Submit', 'go', submit);
      mkBtn('Skip', '', skip);

      var kb = document.createElement('div'); kb.className = 'mv-kb';
      KEYROWS.forEach(function (rowStr) {
        var kr = document.createElement('div'); kr.className = 'mv-kr';
        rowStr.split('').forEach(function (ch) {
          var k = document.createElement('button');
          k.type = 'button'; k.className = 'mv-k'; k.textContent = ch;
          k.addEventListener('click', function () { typeCh(g, ch.toLowerCase()); });
          kr.appendChild(k);
        });
        kb.appendChild(kr);
      });
      var last = document.createElement('div'); last.className = 'mv-kr';
      [['SPACE', function () { typeCh(g, ' '); }], ['DEL', function () { back(g); }]]
        .forEach(function (def) {
          var k = document.createElement('button');
          k.type = 'button'; k.className = 'mv-k'; k.textContent = def[0];
          k.style.maxWidth = '110px'; k.style.flex = '2 1 0';
          k.addEventListener('click', def[1]);
          last.appendChild(k);
        });
      kb.appendChild(last);

      var foot = document.createElement('div'); foot.className = 'mv-foot';
      var fL = document.createElement('span'), fR = document.createElement('span');
      foot.appendChild(fL); foot.appendChild(fR);

      wrap.appendChild(cat); wrap.appendChild(puz); wrap.appendChild(bar);
      wrap.appendChild(box); wrap.appendChild(hint); wrap.appendChild(note);
      wrap.appendChild(row); wrap.appendChild(kb); wrap.appendChild(foot);
      root.appendChild(style); root.appendChild(wrap);

      els = { wrap: wrap, cat: cat, puz: puz, fill: fill, box: box, hint: hint,
        note: note, fL: fL, fR: fR };
    }

    function spark(node, colour, n) {
      if (!els) return;
      var r = node.getBoundingClientRect(), w = els.wrap.getBoundingClientRect();
      for (var i = 0; i < n; i++) {
        var p = document.createElement('div');
        p.className = 'mv-sp';
        p.style.background = colour;
        p.style.left = (r.left - w.left + r.width * Math.random()) + 'px';
        p.style.top = (r.top - w.top + r.height / 2) + 'px';
        var a = Math.random() * Math.PI * 2, dist = 26 + Math.random() * 78;
        p.style.setProperty('--dx', (Math.cos(a) * dist).toFixed(0) + 'px');
        p.style.setProperty('--dy', (Math.sin(a) * dist - 22).toFixed(0) + 'px');
        els.wrap.appendChild(p);
        (function (node2) {
          later(function () { if (node2.parentNode) node2.parentNode.removeChild(node2); }, 1050);
        })(p);
      }
    }

    /* ------------------------------------------------------------- rounds */

    function pools() {
      var all = [];
      CATS.forEach(function (c) {
        c.list.forEach(function (it) {
          var item = typeof it === 'string' ? { p: it } : { p: it.p, alt: it.alt };
          item.cat = c.name; item.emo = c.emo;
          item.cons = consonants(item.p);
          all.push(item);
        });
      });
      var tiers = [[], [], []];
      all.forEach(function (it) {
        tiers[it.cons.length <= 9 ? 0 : it.cons.length <= 13 ? 1 : 2].push(it);
      });
      tiers.forEach(function (t) { U.shuffle(t); });
      return tiers;
    }

    function reset(g) {
      var d = g.data;
      clearTimers();
      d.gen = (d.gen || 0) + 1;
      d.tiers = pools();
      d.idx = [0, 0, 0];
      d.round = 0;
      d.lives = LIVES;
      d.streak = 0;
      d.bestStreak = 0;
      d.solved = 0;
      d.hints = 0;
      d.owed = 0;
      d.locked = true;
      build(g);
      nextPhrase(g);
      g.set('Score', 0);
      g.set('Lives', LIVES);
      g.set('Time', Math.ceil(d.limit));
    }

    function draw(d) {
      var r = d.round;
      var tier = r < 4 ? 0 : r < 10 ? (r % 3 === 2 ? 2 : 1) : (r % 4 === 1 ? 1 : 2);
      var pool = d.tiers[tier];
      if (!pool.length) { tier = 0; pool = d.tiers[0]; }
      if (d.idx[tier] >= pool.length) { U.shuffle(pool); d.idx[tier] = 0; }
      return pool[d.idx[tier]++];
    }

    function nextPhrase(g) {
      var d = g.data;
      var item = draw(d);
      d.item = item;
      d.puzzle = regroup(item.cons, d.round >= 6);
      d.limit = Math.max(13, 30 - d.round * 1.15);
      d.left = d.limit;
      d.typed = '';
      d.reveal = 0;
      d.owed = 0;
      d.locked = false;
      els.cat.textContent = item.emo + '  ' + item.cat;
      els.puz.textContent = d.puzzle;
      els.puz.className = 'mv-puz';
      els.hint.textContent = '';
      els.note.textContent = '';
      els.note.className = 'mv-note';
      els.fill.style.width = '100%';
      els.fill.className = '';
      paint(g);
      paintFoot(g);
      g.set('Time', Math.ceil(d.limit));
    }

    function paintFoot(g) {
      var d = g.data;
      els.fL.textContent = 'Phrase ' + (d.round + 1) + ' · ' + d.item.cons.length + ' consonants';
      els.fR.innerHTML = '';
      var b = document.createElement('b');
      b.textContent = d.owed ? 'Hints −' + d.owed
        : d.streak > 1 ? 'Streak ×' + d.streak
          : (d.round >= 6 ? 'hard spacing' : 'warm-up');
      els.fR.appendChild(b);
    }

    function paint(g) {
      var d = g.data;
      els.box.textContent = d.typed ? d.typed.toUpperCase() : 'TYPE THE PHRASE';
      els.box.className = 'mv-in' + (d.typed ? '' : ' empty');
    }

    function typeCh(g, ch) {
      var d = g.data;
      if (g.state !== 'play' || d.locked) return;
      if (d.typed.length >= 40) return;
      if (ch === ' ' && (!d.typed || d.typed.charAt(d.typed.length - 1) === ' ')) return;
      d.typed += ch;
      paint(g);
      Milo.sound.tone({ f: 520, d: .025, v: .03, type: 'square' });
    }

    function back(g) {
      var d = g.data;
      if (g.state !== 'play' || d.locked) return;
      d.typed = d.typed.slice(0, -1);
      paint(g);
    }

    function hintNow(g) {
      var d = g.data;
      if (g.state !== 'play' || d.locked) return;
      var letters = d.item.p.replace(/[^A-Za-z0-9]/g, '').length;
      if (d.reveal >= letters) return;
      d.reveal++;
      d.hints++;
      d.owed += HINT_COST;
      paintHint(g);
      paintFoot(g);
      Milo.sound.click();
    }

    function paintHint(g) {
      var d = g.data, out = '', seen = 0;
      if (!d.reveal) { els.hint.textContent = ''; return; }
      for (var i = 0; i < d.item.p.length; i++) {
        var ch = d.item.p.charAt(i);
        if (/[A-Za-z0-9]/.test(ch)) {
          seen++;
          out += seen <= d.reveal ? ch.toUpperCase() : '·';
        } else out += ' ';
      }
      els.hint.textContent = out;
    }

    function submit(g) {
      var d = g.data;
      if (g.state !== 'play' || d.locked) return;
      if (!d.typed.trim()) return;
      if (accepts(d.typed, d.item)) {
        d.locked = true;
        d.solved++;
        d.streak++;
        if (d.streak > d.bestStreak) d.bestStreak = d.streak;
        var mult = 1 + Math.min(1.5, (d.streak - 1) * .18);
        var pts = Math.round((70 + Math.round(d.left * 7) + d.item.cons.length * 4) * mult) - d.owed;
        g.score = Math.max(0, g.score + pts);
        g.set('Score', U.fmt(g.score));
        els.note.className = 'mv-note good';
        els.note.textContent = '“' + d.item.p + '”  ' + (pts < 0 ? '' : '+') + pts +
          (d.owed ? '  (after −' + d.owed + ' of hints)'
            : d.streak > 1 ? '  (streak ×' + mult.toFixed(2) + ')' : '');
        els.puz.textContent = d.item.p.toUpperCase();
        spark(els.puz, '#34d399', 20);
        Milo.sound.coin();
        advance(g, 1500);
      } else {
        d.streak = 0;
        d.left = Math.max(1, d.left - 4);
        els.note.className = 'mv-note bad';
        els.note.textContent = 'Not it — four seconds gone.';
        els.puz.className = 'mv-puz shake';
        Milo.sound.hit();
        paintFoot(g);
        var gen = d.gen;
        later(function () {
          if (d.gen === gen && els) els.puz.className = 'mv-puz';
        }, 340);
      }
    }

    function miss(g, why) {
      var d = g.data;
      if (d.locked) return;
      d.locked = true;
      d.streak = 0;
      d.lives--;
      if (d.owed) { g.score = Math.max(0, g.score - d.owed); g.set('Score', U.fmt(g.score)); }
      g.set('Lives', Math.max(0, d.lives));
      els.note.className = 'mv-note bad';
      els.note.textContent = why + ' It was “' + d.item.p + '”.';
      els.puz.textContent = d.item.p.toUpperCase();
      spark(els.puz, '#fb7185', 14);
      Milo.sound.lose();
      advance(g, 1700);
    }

    function skip(g) { miss(g, 'Skipped.'); }

    function advance(g, ms) {
      var d = g.data, gen = d.gen;
      later(function () {
        if (d.gen !== gen || g.state === 'over') return;
        if (d.lives <= 0) {
          g.gameOver({
            emo: '🔤', title: 'Out of lives',
            text: d.solved + ' solved, best streak ' + d.bestStreak +
              (d.hints ? ', ' + d.hints + ' hint' + (d.hints > 1 ? 's' : '') + ' bought' : ', no hints'),
            score: g.score
          });
          return;
        }
        d.round++;
        nextPhrase(g);
      }, ms);
    }

    function key(g, e) {
      var d = g.data;
      if (d.locked) return;
      if (e.code === 'Enter' || e.code === 'NumpadEnter') { submit(g); return; }
      if (e.code === 'Backspace') { back(g); return; }
      if (e.code === 'Space') { typeCh(g, ' '); return; }
      if (e.code === 'Tab') { skip(g); return; }
      if (/^[a-zA-Z0-9]$/.test(e.key)) typeCh(g, e.key.toLowerCase());
    }

    return Milo.domGame(host, {
      id: 'missing-vowels',
      bg: '#03211f',
      stats: ['Score', 'Lives', 'Time'],
      emo: '🔤',
      start: {
        title: 'Missing Vowels',
        text: 'Every vowel has been deleted and the spaces have been moved to the wrong ' +
          'places. Type what the phrase really says before the bar empties. Spelling is ' +
          'forgiven, three misses are not, and a hint buys you one letter for forty points.',
        keys: ['Type', 'Enter', 'Tab to skip']
      },
      init: reset,
      destroy: function () { clearTimers(); els = null; },
      update: function (g, dt) {
        var d = g.data;
        if (d.locked) return;
        d.left -= dt;
        var frac = Math.max(0, d.left / d.limit);
        els.fill.style.width = (frac * 100) + '%';
        els.fill.className = frac < .3 ? 'low' : '';
        g.set('Time', Math.max(0, Math.ceil(d.left)));
        if (d.left <= 0) miss(g, 'Out of time.');
      },
      onKey: key
    });
  }

  window.Milo.register({
    id: 'missing-vowels',
    title: 'Missing Vowels',
    emo: '🔤',
    category: 'Word',
    tagline: 'THSPHRSMKSSNSVNTLLY',
    description: 'One hundred and twenty-eight hand-written phrases across eight themes — films, ' +
      'idioms, food, places, animals, science, sport and the contents of your house — with every ' +
      'vowel stripped out and the word breaks deliberately moved to the wrong letters. Type what it ' +
      'actually says: matching is loose, so case, punctuation, a leading "the" and one typo are all ' +
      'forgiven. Solving fast pays more, consecutive solves stack a multiplier up to 2.5x, and a hint ' +
      'reveals the next letter for forty points. The clock shortens with every phrase and from the ' +
      'seventh onward the spacing turns nasty — sometimes the consonants arrive as one unbroken run. ' +
      'Tip: count the consonants in the footer first, then say the chunks aloud; THWZRDFZ only ' +
      'resolves once you stop reading the fake word breaks.',
    controls: ['Type', 'Enter', 'Tab to skip', 'Click'],
    colors: ['#03211f', '#2dd4bf'],
    tags: ['word', 'phrases', 'timed', 'puzzle', 'typing'],
    mount: mount
  });
})();
