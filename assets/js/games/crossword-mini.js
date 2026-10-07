/* Mini Crossword — hand-built 5x5 grids, every crossing checked, against the clock. */
(function () {
  'use strict';

  /* Twenty hand-clued 5x5 grids. `g` is the answer grid ('#' is a block);
     `a` holds the across clues in row order and `d` the down clues in column
     order, which is exactly the order the slot scanner below produces. Every
     letter is shared by one across and one down entry, so a crossing that
     disagreed would show up as a misspelt word the moment you read the grid. */
  var PUZZLES = [
    /* ---- tier 1: gentle ---- */
    { t: 0, g: ['##hay', '#tote', 'throw', 'wasp#', 'one##'],
      a: ['Barn bale contents', 'Carry, as luggage', 'Pitch, as a ball', 'Stinger with a papery nest', 'Lowest counting number'],
      d: ['Pair’s count', 'Comparison word', 'Derby runner', 'Sitting on', 'Dark churchyard evergreen'] },
    { t: 0, g: ['##eel', '#race', 'sight', 'polo#', 'ate##'],
      a: ['Snakelike fish', 'Sprint for the tape', 'One of the five senses', 'Sport played on horseback', 'Had dinner'],
      d: ['Place for massages and mud baths', 'Unruly crowd scene', 'Two under par in golf', 'Canyon repeat', 'Allow'] },
    { t: 0, g: ['ant##', 'loom#', 'enter', '#ease', '##lad'],
      a: ['Picnic-raiding insect', 'Weaver’s frame', 'Key that starts a new line', 'Make less painful', 'Young fellow'],
      d: ['Pub pint, often', 'Not a single one', 'Sum of the column', 'Flat-topped desert hill', 'Colour of a stop sign'] },
    { t: 0, g: ['feast', 'earth', 'error', '##one', '##wee'],
      a: ['Banquet fit for a king', 'Third rock from the sun', 'Mistake in the ledger', 'Loneliest number, they say', 'Tiny, in Scotland'],
      d: ['Charge for a service', 'Where the lobe hangs', 'Bow’s companion', 'Skimmed across the pond', 'Musketeers’ number'] },
    { t: 0, g: ['coo##', 'owl##', 'unite', 'level', 'dream'],
      a: ['Pigeon’s soft call', 'Bird that seems to ask “who?”', 'Bring together', 'Flat, or a stage of a game', 'What you have while asleep'],
      d: ['Was able to', 'Person named on the deeds', 'Martini garnish', 'Four o’clock brew', 'Tall shade tree'] },
    { t: 0, g: ['##ado', '##per', 'stand', 'horse', 'enter'],
      a: ['Much ___ About Nothing', 'For each', 'Get to your feet', 'Stable dweller', 'Walk into the room'],
      d: ['Pronoun for a girl', 'Two thousand pounds', 'Separated', 'Thick as a jungle', 'What the waiter takes'] },
    { t: 0, g: ['carve', 'ocean', 'dealt', '##cue', '##her'],
      a: ['Slice the Sunday roast', 'Salt water on a huge scale', 'Passed out the cards', 'Snooker stick, or an actor’s signal', 'Belonging to that woman'],
      d: ['Fish in the chip shop', 'Card above the king', 'Stretch out for', 'What a thing is worth', 'Go in'] },

    /* ---- tier 2: middling ---- */
    { t: 1, g: ['##jet', '#dude', 'reign', 'once#', 'dye##'],
      a: ['Coal-black, or a fast plane', 'Guy, casually', 'Monarch’s time on the throne', 'A single time', 'Colour fabric with'],
      d: ['Fishing pole', 'Refuse to admit', 'Orange squeezings', 'Border of a table', 'Digits on two hands'] },
    { t: 1, g: ['pew##', 'ices#', 'thief', '#oral', '##dry'],
      a: ['Church bench', 'Frosts, as a cake', 'One who steals', 'Spoken, not written', 'Like a desert'],
      d: ['Peach centre', 'Sound bouncing off a cliff', 'Strange and hard to explain', 'Brown quickly in a hot pan', 'Travel by plane'] },
    { t: 1, g: ['#tad#', 'three', 'organ', 'would', '#wet#'],
      a: ['A little bit', 'Sides on a triangle', 'Cathedral pipe instrument', '“I ___ if I could”', 'Soaked by the rain'],
      d: ['Haul a broken-down car', 'Hurl', 'Take the other side loudly', 'Handed out, as cards', 'Final part'] },
    { t: 1, g: ['#put#', 'final', 'alike', 'noted', '#ten#'],
      a: ['Place down', 'Last round of the tournament', 'Much the same', 'Jotted down, or famous', 'Perfect score in gymnastics'],
      d: ['Cooling blade spinner', 'Cockpit boss', 'Join into one', 'Already claimed', 'Was out in front'] },
    { t: 1, g: ['#stew', 'stove', 'taken', 'agent', 'bent#'],
      a: ['Slow-cooked pot of meat and veg', 'Hob and oven unit', 'No longer available', 'Spy, or a star’s rep', 'No longer straight'],
      d: ['Quick attempt, informally', 'Boards the actors tread', 'Arcade coin substitute', 'Item on the programme', 'Departed'] },
    { t: 1, g: ['treat', 'hence', 'often', 'see##', 'err##'],
      a: ['Halloween’s other option', 'For this reason', 'Many a time', 'Spot with the eyes', 'Slip up'],
      d: ['Not these, but ___', 'Point a patient to a specialist', 'Type your password and press this', 'Unreturnable serve', 'Bowling pin count'] },
    { t: 1, g: ['brave', 'relax', 'adopt', '##nor', '##era'],
      a: ['Facing danger without flinching', 'Put your feet up', 'Take in as your own', 'Neither’s partner', 'Long stretch of history'],
      d: ['Undergarment with cups', 'Colour of a ripe tomato', 'With no one else', 'Steam, in US spelling', 'Film crowd member'] },

    /* ---- tier 3: sharper ---- */
    { t: 2, g: ['#map#', 'minus', 'angle', 'worse', '#rye#'],
      a: ['Atlas page', 'Take-away sign', 'What a protractor measures', 'More rotten than bad', 'Grain in some whiskey'],
      d: ['Gaping mouth of a beast', 'Not the major key', 'Steaming mad', 'Beat felt at the wrist', 'Take in with the eyes'] },
    { t: 2, g: ['dart#', 'aware', 'fatal', 'trick', '#does'],
      a: ['Pub board projectile', 'Clued in', 'Deadly', 'Halloween alternative to treat', 'Female deer, plural'],
      d: ['Silly, in British slang', 'Trophy handed out', 'Three-to-one, for one', 'Faint remaining amount', 'Big antlered deer, plural'] },
    { t: 2, g: ['lisp#', 'uncle', 'sneak', 'hence', '#reed'],
      a: ['Trouble with the letter S', 'Your parent’s brother', 'Move without a sound', 'Therefore', 'Clarinet’s vibrating strip'],
      d: ['Thick and green, as a lawn', 'Furthest from the edge', 'Chunk of a play', 'Spot on the map', '___ out a living'] },
    { t: 2, g: ['#sect', 'spare', 'tiger', 'ocean', 'perm#'],
      a: ['Breakaway religious group', 'All ten down on the second roll', 'Striped big cat', 'Pacific or Atlantic', 'Salon curl treatment'],
      d: ['Red octagon’s command', 'Cinnamon or cumin', 'Keen as mustard', 'Poured on strawberries', 'Seabird with a forked tail'] },
    { t: 2, g: ['##saw', '##ego', 'never', 'event', 'tenth'],
      a: ['Toothed cutting blade', 'Sense of self-importance', 'Not at any time', 'Race on the athletics card', 'Place after ninth'],
      d: ['Tennis court divider', 'Night before the big day', 'Days in a week', 'Undercover operative', 'Value in pounds'] },
    { t: 2, g: ['van##', 'ago##', 'label', 'villa', 'enemy'],
      a: ['Delivery vehicle', 'In the past', 'Sticker on a jam jar', 'Holiday house in Tuscany', 'Sworn foe'],
      d: ['Part that controls flow', 'One more time', 'Honourable, or aristocratic', 'Tree hit by Dutch disease', 'Put down flat'] }
  ];

  var N = 5;
  var ROUNDS = 6;
  var TIMES = [200, 190, 180, 170, 160, 150];

  /* Scan a grid into across (row order) then down (column order) slots — the
     exact order the clue arrays above are written in. */
  function slotsOf(grid) {
    var out = [], r, c, s;
    for (r = 0; r < N; r++) {
      c = 0;
      while (c < N) {
        if (grid[r].charAt(c) === '#') { c++; continue; }
        s = c;
        while (c < N && grid[r].charAt(c) !== '#') c++;
        if (c - s >= 2) out.push({ dir: 'A', r: r, c: s, len: c - s });
      }
    }
    for (c = 0; c < N; c++) {
      r = 0;
      while (r < N) {
        if (grid[r].charAt(c) === '#') { r++; continue; }
        s = r;
        while (r < N && grid[r].charAt(c) !== '#') r++;
        if (r - s >= 2) out.push({ dir: 'D', r: s, c: c, len: r - s });
      }
    }
    return out;
  }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var els = null, timers = [];
    var pools = [[], [], []];
    PUZZLES.forEach(function (p) { pools[p.t].push(p); });

    function later(fn, ms) {
      var t = setTimeout(function () { var i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); fn(); }, ms);
      timers.push(t);
      return t;
    }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    var KB = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

    function build(g) {
      var root = g.root;
      root.innerHTML = '';
      var style = document.createElement('style');
      style.textContent = [
        '.xw-page{display:flex;gap:18px;align-items:flex-start;justify-content:center;flex-wrap:wrap;',
        'background:#f3ecdb;color:#181410;border-radius:6px;padding:16px 18px 14px;margin:auto;',
        'box-shadow:0 18px 44px rgba(0,0,0,.5);max-width:720px;font-family:Georgia,"Times New Roman",serif;',
        'border:1px solid #cdbf9f;position:relative;overflow:hidden}',
        '.xw-left{display:flex;flex-direction:column;gap:9px;align-items:center}',
        '.xw-head{width:100%;border-bottom:2px solid #181410;padding-bottom:4px;margin-bottom:2px;',
        'display:flex;justify-content:space-between;align-items:baseline;letter-spacing:.04em}',
        '.xw-head b{font-size:1.02rem;text-transform:uppercase}',
        '.xw-head span{font-size:.7rem;color:#6d6047;letter-spacing:.14em;text-transform:uppercase}',
        '.xw-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:0;background:#181410;',
        'border:3px solid #181410;width:clamp(210px,58vw,270px);aspect-ratio:1}',
        '.xw-c{position:relative;background:#fffdf6;display:grid;place-items:center;cursor:pointer;',
        'border:1px solid #181410;font:700 clamp(17px,4.6vw,25px)/1 Georgia,serif;color:#181410;text-transform:uppercase;user-select:none}',
        '.xw-c.blk{background:#181410;cursor:default}',
        '.xw-c.inword{background:#cfe6fb}',
        '.xw-c.sel{background:#ffd84d}',
        '.xw-c.bad{background:#ffb3ae;animation:xwWob .4s}',
        '.xw-c.good{background:#b7edb2}',
        '@keyframes xwWob{25%{transform:rotate(-3deg)}75%{transform:rotate(3deg)}}',
        '.xw-n{position:absolute;top:1px;left:3px;font:700 9px/1 Georgia,serif;color:#7a6c52}',
        '.xw-clue{width:clamp(210px,58vw,270px);min-height:46px;background:#fffdf6;border:1px solid #cdbf9f;',
        'border-left:4px solid #b4452e;padding:6px 9px;font-size:.86rem;line-height:1.25}',
        '.xw-clue i{display:block;font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;color:#962f1c;font-style:normal;margin-bottom:2px}',
        '.xw-kb{display:flex;flex-direction:column;gap:4px;align-items:center;width:clamp(210px,58vw,270px)}',
        '.xw-kr{display:flex;gap:3px;justify-content:center;width:100%}',
        '.xw-k{flex:1 1 0;height:30px;border:1px solid #b9ab8c;border-radius:3px;background:#fffdf6;color:#181410;',
        'font:700 .8rem Georgia,serif;text-transform:uppercase;cursor:pointer;padding:0}',
        '.xw-k:active{background:#ffd84d}',
        '.xw-list{flex:1 1 240px;min-width:196px;max-height:330px;overflow:auto;font-size:.8rem;line-height:1.3}',
        '.xw-list h4{margin:0 0 3px;font-size:.66rem;letter-spacing:.16em;text-transform:uppercase;color:#962f1c;border-bottom:1px solid #cdbf9f;padding-bottom:2px}',
        '.xw-list ol{list-style:none;margin:0 0 10px;padding:0}',
        '.xw-list li{padding:2px 5px;border-radius:3px;cursor:pointer;display:flex;gap:6px}',
        '.xw-list li b{min-width:14px;text-align:right;color:#7a6c52}',
        '.xw-list li.on{background:#ffd84d}',
        '.xw-list li.done{color:#8b8272;text-decoration:line-through}',
        '.xw-bar{display:flex;gap:8px;align-items:center;justify-content:center;width:100%;flex-wrap:wrap}',
        '.xw-btn{border:1px solid #181410;background:#fffdf6;color:#181410;border-radius:3px;padding:5px 12px;',
        'font:700 .74rem Georgia,serif;letter-spacing:.1em;text-transform:uppercase;cursor:pointer}',
        '.xw-btn:active{background:#181410;color:#fffdf6}',
        '.xw-msg{font-size:.76rem;color:#6d6047;min-height:16px;letter-spacing:.04em}',
        '.xw-ink{position:absolute;border-radius:50%;pointer-events:none;animation:xwInk 1.1s ease-out forwards}',
        '@keyframes xwInk{0%{transform:translate(0,0) scale(.3);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1.15);opacity:0}}'
      ].join('');

      var page = document.createElement('div'); page.className = 'xw-page';
      var left = document.createElement('div'); left.className = 'xw-left';

      var head = document.createElement('div'); head.className = 'xw-head';
      var htitle = document.createElement('b'); htitle.textContent = 'The Mini';
      var hsub = document.createElement('span');
      head.appendChild(htitle); head.appendChild(hsub);

      var grid = document.createElement('div'); grid.className = 'xw-grid';
      var cells = [];
      for (var i = 0; i < N * N; i++) {
        var cel = document.createElement('div'); cel.className = 'xw-c';
        var num = document.createElement('span'); num.className = 'xw-n';
        var lt = document.createElement('u'); lt.style.textDecoration = 'none';
        cel.appendChild(num); cel.appendChild(lt);
        (function (idx) {
          cel.addEventListener('click', function () { pick(g, (idx / N) | 0, idx % N); });
        })(i);
        grid.appendChild(cel);
        cells.push({ el: cel, num: num, lt: lt });
      }

      var clue = document.createElement('div'); clue.className = 'xw-clue';
      var clueDir = document.createElement('i');
      var clueTx = document.createElement('span');
      clue.appendChild(clueDir); clue.appendChild(clueTx);

      var kb = document.createElement('div'); kb.className = 'xw-kb';
      KB.forEach(function (line, li) {
        var kr = document.createElement('div'); kr.className = 'xw-kr';
        if (li === 2) kr.appendChild(mkKey(g, '⌫'));
        line.split('').forEach(function (ch) { kr.appendChild(mkKey(g, ch)); });
        if (li === 2) kr.appendChild(mkKey(g, '⇆'));
        kb.appendChild(kr);
      });

      var bar = document.createElement('div'); bar.className = 'xw-bar';
      var bCheck = document.createElement('button'); bCheck.type = 'button';
      bCheck.className = 'xw-btn'; bCheck.textContent = 'Check (−bonus)';
      bCheck.addEventListener('click', function () { doCheck(g); });
      var bDir = document.createElement('button'); bDir.type = 'button';
      bDir.className = 'xw-btn'; bDir.textContent = 'Across ⇆ Down';
      bDir.addEventListener('click', function () { flip(g); });
      bar.appendChild(bDir); bar.appendChild(bCheck);

      var msg = document.createElement('div'); msg.className = 'xw-msg';

      left.appendChild(head); left.appendChild(grid); left.appendChild(clue);
      left.appendChild(kb); left.appendChild(bar); left.appendChild(msg);

      var list = document.createElement('div'); list.className = 'xw-list';
      var hA = document.createElement('h4'); hA.textContent = 'Across';
      var olA = document.createElement('ol');
      var hD = document.createElement('h4'); hD.textContent = 'Down';
      var olD = document.createElement('ol');
      list.appendChild(hA); list.appendChild(olA); list.appendChild(hD); list.appendChild(olD);

      page.appendChild(left); page.appendChild(list);
      root.appendChild(style); root.appendChild(page);

      els = { page: page, cells: cells, clueDir: clueDir, clueTx: clueTx, hsub: hsub,
        olA: olA, olD: olD, msg: msg, bCheck: bCheck };
    }

    function mkKey(g, ch) {
      var k = document.createElement('button');
      k.type = 'button'; k.className = 'xw-k'; k.textContent = ch;
      k.addEventListener('click', function () {
        if (ch === '⌫') erase(g);
        else if (ch === '⇆') flip(g);
        else typeLetter(g, ch);
      });
      return k;
    }

    /* ------------------------------------------------------------ rounds */

    function reset(g) {
      var d = g.data;
      clearTimers();
      d.gen = (d.gen || 0) + 1;
      d.round = 0;
      d.seen = Object.create(null);
      build(g);
      loadRound(g);
      g.set('Score', 0);
    }

    function pickPuzzle(d) {
      var tier = d.round < 2 ? 0 : d.round < 4 ? 1 : 2;
      var pool = pools[tier].filter(function (p) { return !d.seen[p.g.join('')]; });
      if (!pool.length) pool = pools[tier];
      var p = U.choice(pool);
      d.seen[p.g.join('')] = true;
      return p;
    }

    function loadRound(g) {
      var d = g.data;
      d.puz = pickPuzzle(d);
      d.slots = slotsOf(d.puz.g);
      d.fill = [];
      for (var i = 0; i < N * N; i++) d.fill.push('');
      d.checked = false;
      d.solved = false;
      d.time = TIMES[Math.min(d.round, TIMES.length - 1)];

      /* Standard crossword numbering, scanned row by row. */
      d.num = [];
      for (i = 0; i < N * N; i++) d.num.push(0);
      var n = 1;
      for (var r = 0; r < N; r++) {
        for (var c = 0; c < N; c++) {
          if (d.puz.g[r].charAt(c) === '#') continue;
          var startA = (c === 0 || d.puz.g[r].charAt(c - 1) === '#') && c + 1 < N && d.puz.g[r].charAt(c + 1) !== '#';
          var startD = (r === 0 || d.puz.g[r - 1].charAt(c) === '#') && r + 1 < N && d.puz.g[r + 1].charAt(c) !== '#';
          if (startA || startD) d.num[r * N + c] = n++;
        }
      }
      d.slots.forEach(function (s, i2) {
        s.n = d.num[s.r * N + s.c];
        s.clue = (s.dir === 'A' ? d.puz.a : d.puz.d)[countBefore(d.slots, i2, s.dir)];
        s.cells = [];
        for (var k = 0; k < s.len; k++) {
          s.cells.push(s.dir === 'A' ? s.r * N + s.c + k : (s.r + k) * N + s.c);
        }
      });
      d.cur = d.slots[0];
      d.pos = d.cur.cells[0];

      buildClueList(g);
      paint(g);
      g.set('Puzzle', (d.round + 1) + ' / ' + ROUNDS);
      g.set('Time', fmtTime(d.time));
      els.hsub.textContent = 'No. ' + (d.round + 1) + ' of ' + ROUNDS;
      els.msg.textContent = 'Type a letter · arrows move · space swaps direction';
      els.bCheck.textContent = 'Check (−bonus)';
    }

    function countBefore(slots, idx, dir) {
      var n = 0;
      for (var i = 0; i < idx; i++) if (slots[i].dir === dir) n++;
      return n;
    }

    function fmtTime(t) {
      t = Math.max(0, Math.ceil(t));
      var m = (t / 60) | 0, s = t % 60;
      return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function buildClueList(g) {
      var d = g.data;
      els.olA.innerHTML = ''; els.olD.innerHTML = '';
      d.slots.forEach(function (s) {
        var li = document.createElement('li');
        var b = document.createElement('b'); b.textContent = s.n;
        var sp = document.createElement('span'); sp.textContent = s.clue;
        li.appendChild(b); li.appendChild(sp);
        li.addEventListener('click', function () {
          d.cur = s; d.pos = firstBlank(d, s); paint(g);
        });
        s.li = li;
        (s.dir === 'A' ? els.olA : els.olD).appendChild(li);
      });
    }

    function firstBlank(d, s) {
      for (var i = 0; i < s.cells.length; i++) if (!d.fill[s.cells[i]]) return s.cells[i];
      return s.cells[0];
    }

    function slotDone(d, s) {
      return s.cells.every(function (i) { return !!d.fill[i]; });
    }

    /* ----------------------------------------------------------- painting */

    function paint(g) {
      var d = g.data;
      var inWord = Object.create(null);
      d.cur.cells.forEach(function (i) { inWord[i] = true; });
      for (var i = 0; i < N * N; i++) {
        var r = (i / N) | 0, c = i % N;
        var blk = d.puz.g[r].charAt(c) === '#';
        var cell = els.cells[i];
        var cls = 'xw-c' + (blk ? ' blk' : '');
        if (!blk) {
          if (i === d.pos) cls += ' sel';
          else if (inWord[i]) cls += ' inword';
          if (d.flags && d.flags[i]) cls += ' ' + d.flags[i];
        }
        cell.el.className = cls;
        cell.num.textContent = d.num[i] ? d.num[i] : '';
        cell.lt.textContent = blk ? '' : d.fill[i];
      }
      els.clueDir.textContent = d.cur.n + (d.cur.dir === 'A' ? ' Across' : ' Down');
      els.clueTx.textContent = d.cur.clue;
      d.slots.forEach(function (s) {
        s.li.className = (s === d.cur ? 'on' : '') + (slotDone(d, s) ? ' done' : '');
      });
    }

    /* ------------------------------------------------------------- input */

    function pick(g, r, c) {
      var d = g.data;
      if (g.state !== 'play' || d.solved) return;
      if (d.puz.g[r].charAt(c) === '#') return;
      var i = r * N + c;
      if (i === d.pos) { flip(g); return; }
      var same = d.slots.filter(function (s) { return s.cells.indexOf(i) >= 0; });
      var keep = null;
      for (var k = 0; k < same.length; k++) if (same[k].dir === d.cur.dir) keep = same[k];
      d.cur = keep || same[0];
      d.pos = i;
      Milo.sound.tone({ f: 520, d: .03, v: .05, type: 'sine' });
      paint(g);
    }

    function flip(g) {
      var d = g.data;
      if (g.state !== 'play' || d.solved) return;
      var alt = d.slots.filter(function (s) {
        return s.dir !== d.cur.dir && s.cells.indexOf(d.pos) >= 0;
      })[0];
      if (alt) { d.cur = alt; Milo.sound.click(); paint(g); }
    }

    function advance(d) {
      var idx = d.cur.cells.indexOf(d.pos);
      for (var k = idx + 1; k < d.cur.cells.length; k++) {
        if (!d.fill[d.cur.cells[k]]) { d.pos = d.cur.cells[k]; return; }
      }
      if (idx + 1 < d.cur.cells.length) d.pos = d.cur.cells[idx + 1];
    }

    function typeLetter(g, ch) {
      var d = g.data;
      if (g.state !== 'play' || d.solved) return;
      d.flags = null;
      d.fill[d.pos] = ch.toUpperCase();
      Milo.sound.tone({ f: 700, d: .025, v: .05, type: 'square' });
      advance(d);
      paint(g);
      if (d.fill.every(function (v, i) { return d.puz.g[(i / N) | 0].charAt(i % N) === '#' || v; })) {
        tryFinish(g);
      }
    }

    function erase(g) {
      var d = g.data;
      if (g.state !== 'play' || d.solved) return;
      d.flags = null;
      if (d.fill[d.pos]) { d.fill[d.pos] = ''; }
      else {
        var idx = d.cur.cells.indexOf(d.pos);
        if (idx > 0) { d.pos = d.cur.cells[idx - 1]; d.fill[d.pos] = ''; }
      }
      Milo.sound.tone({ f: 260, d: .04, v: .05, type: 'triangle' });
      paint(g);
    }

    function move(g, dr, dc) {
      var d = g.data;
      if (g.state !== 'play' || d.solved) return;
      var r = (d.pos / N) | 0, c = d.pos % N;
      for (var k = 0; k < N; k++) {
        r += dr; c += dc;
        if (r < 0 || r >= N || c < 0 || c >= N) return;
        if (d.puz.g[r].charAt(c) !== '#') {
          var want = dr ? 'D' : 'A';
          var s = d.slots.filter(function (sl) { return sl.dir === want && sl.cells.indexOf(r * N + c) >= 0; })[0];
          if (s) d.cur = s;
          d.pos = r * N + c;
          paint(g);
          return;
        }
      }
    }

    function doCheck(g) {
      var d = g.data;
      if (g.state !== 'play' || d.solved) return;
      d.checked = true;
      els.bCheck.textContent = 'Checked';
      var wrong = 0;
      d.flags = Object.create(null);
      for (var i = 0; i < N * N; i++) {
        var r = (i / N) | 0, c = i % N;
        if (d.puz.g[r].charAt(c) === '#' || !d.fill[i]) continue;
        if (d.fill[i].toLowerCase() === d.puz.g[r].charAt(c)) d.flags[i] = 'good';
        else { d.flags[i] = 'bad'; wrong++; }
      }
      els.msg.textContent = wrong ? wrong + ' letter' + (wrong === 1 ? '' : 's') + ' wrong — bonus forfeited'
        : 'All correct so far — bonus forfeited';
      Milo.sound.tone({ f: wrong ? 200 : 620, d: .12, v: .08, type: 'triangle' });
      paint(g);
    }

    function tryFinish(g) {
      var d = g.data;
      var ok = true;
      for (var i = 0; i < N * N; i++) {
        var r = (i / N) | 0, c = i % N;
        if (d.puz.g[r].charAt(c) === '#') continue;
        if (d.fill[i].toLowerCase() !== d.puz.g[r].charAt(c)) { ok = false; break; }
      }
      if (!ok) {
        els.msg.textContent = 'Grid is full but something is off — keep hunting.';
        Milo.sound.hit();
        return;
      }
      solved(g);
    }

    function solved(g) {
      var d = g.data, gen = d.gen;
      d.solved = true;
      var left = Math.max(0, Math.ceil(d.time));
      var bonus = d.checked ? 0 : 250;
      var pts = 400 + left * 4 + bonus;
      g.score += pts;
      g.set('Score', U.fmt(g.score));
      Milo.sound.win();
      inkBurst(g);
      els.msg.textContent = 'Solved! +' + pts + (bonus ? ' (clean solve +250)' : '');
      d.flags = Object.create(null);
      for (var i = 0; i < N * N; i++) {
        var r = (i / N) | 0;
        if (d.puz.g[r].charAt(i % N) !== '#') d.flags[i] = 'good';
      }
      paint(g);
      later(function () {
        if (d.gen !== gen || g.state === 'over') return;
        d.round++;
        if (d.round >= ROUNDS) {
          g.win({
            emo: '✍️', title: 'Full set solved!',
            text: 'Six minis cleared with ' + U.fmt(g.score) + ' points.',
            score: g.score
          });
        } else {
          loadRound(g);
        }
      }, 1500);
    }

    function inkBurst(g) {
      var cols = ['#181410', '#962f1c', '#2f5d7c', '#6d6047'];
      for (var i = 0; i < 26; i++) {
        var p = document.createElement('div');
        p.className = 'xw-ink';
        var sz = 4 + Math.random() * 9;
        p.style.width = sz + 'px'; p.style.height = sz + 'px';
        p.style.background = cols[(Math.random() * cols.length) | 0];
        p.style.left = '50%'; p.style.top = '46%';
        p.style.setProperty('--dx', (Math.random() * 300 - 150).toFixed(0) + 'px');
        p.style.setProperty('--dy', (Math.random() * 260 - 150).toFixed(0) + 'px');
        p.style.animationDelay = (Math.random() * .15).toFixed(2) + 's';
        els.page.appendChild(p);
        (function (node) { later(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 1400); })(p);
      }
    }

    var ARROWS = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };

    function key(g, e) {
      var d = g.data;
      if (d.solved) return;
      if (ARROWS[e.code]) { move(g, ARROWS[e.code][0], ARROWS[e.code][1]); return; }
      if (e.code === 'Backspace' || e.code === 'Delete') { erase(g); return; }
      if (e.code === 'Space' || e.code === 'Tab' || e.code === 'Enter') { flip(g); return; }
      if (/^[a-zA-Z]$/.test(e.key)) typeLetter(g, e.key);
    }

    return Milo.domGame(host, {
      id: 'crossword-mini',
      bg: '#241f18',
      stats: ['Score', 'Puzzle', 'Time'],
      emo: '✏️',
      start: {
        title: 'Mini Crossword',
        text: 'Six hand-clued 5×5 grids, one after another. Click a square and type; ' +
          'space or Tab swaps between Across and Down. Every second left on the clock is worth ' +
          'four points, and solving without pressing Check pays a 250 bonus.',
        keys: ['Type letters', 'Arrows', 'Space = swap', 'Click']
      },
      init: reset,
      destroy: function () { clearTimers(); },
      update: function (g, dt) {
        var d = g.data;
        if (d.solved) return;
        d.time -= dt;
        g.set('Time', fmtTime(d.time));
        if (d.time <= 0) {
          d.solved = true;
          var ans = [];
          d.slots.forEach(function (s) {
            ans.push(s.cells.map(function (i) { return d.puz.g[(i / N) | 0].charAt(i % N); }).join('').toUpperCase());
          });
          g.gameOver({
            emo: '⏰', title: 'Out of time',
            text: 'Grid ' + (d.round + 1) + ' beat you. The answers were ' + ans.slice(0, 5).join(', ') + '.',
            score: g.score
          });
        }
      },
      preload: function (g) {
        /* The shared key wiring swallows KeyP for pause, which domGame does not
           use — take it back so P can be typed into the grid. */
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
    id: 'crossword-mini', title: 'Mini Crossword', emo: '✏️', category: 'Word',
    tagline: 'Six 5×5 grids, one ticking clock',
    description: 'Twenty hand-built 5×5 grids with hand-written clues, six of them per run and ' +
      'getting tougher as you go. Click a square and type; space swaps between Across and Down, and ' +
      'the clue list marks off entries as you fill them. Each solve pays 400 plus four points per ' +
      'second still on the clock, and finishing a grid without touching the Check button adds 250 ' +
      'more. Tip: fill the three-letter entries first — they hand you starting letters for every ' +
      'long word that crosses them.',
    controls: ['Type letters', 'Arrow keys', 'Space to swap', 'Click a square'],
    colors: ['#f3ecdb', '#962f1c'],
    tags: ['word', 'crossword', 'clues', 'puzzle', 'timed'],
    mount: mount
  });
})();
