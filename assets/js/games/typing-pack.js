/* Typing Pack — ten keyboard games sharing one typing engine.
   Streams of hand-written words, proverbs, numbers, code and punctuation,
   plus an arcade mode where the words physically fall. All content lives in
   this file; the quotes are traditional public-domain proverbs. */
(function () {
  'use strict';

  /* ------------------------------------------------------------- content */

  // The 200 most common English words, hand-written, lowercase.
  var COMMON = [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
    'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
    'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
    'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
    'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
    'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said', 'did', 'each',
    'where', 'why', 'again', 'off', 'went', 'old', 'number', 'great', 'tell', 'men',
    'small', 'every', 'found', 'still', 'between', 'name', 'should', 'home', 'big', 'high',
    'different', 'follow', 'came', 'show', 'around', 'three', 'form', 'set', 'put', 'end',
    'does', 'another', 'must', 'while', 'before', 'here', 'through', 'long', 'much', 'both',
    'little', 'house', 'world', 'own', 'might', 'place', 'down', 'such', 'try', 'ask',
    'too', 'feel', 'seem', 'leave', 'call', 'keep', 'last', 'never', 'let', 'help',
    'talk', 'turn', 'start', 'play', 'run', 'move', 'live', 'believe', 'hold', 'bring',
    'happen', 'write', 'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue',
    'change', 'lead', 'understand', 'watch', 'together', 'until', 'children', 'side', 'face', 'week'
  ];

  // Thirty traditional proverbs — all long out of copyright.
  var QUOTES = [
    'Actions speak louder than words.',
    'A journey of a thousand miles begins with a single step.',
    'Practice makes perfect.',
    'The early bird catches the worm.',
    'Look before you leap.',
    'Slow and steady wins the race.',
    'A stitch in time saves nine.',
    'Many hands make light work.',
    'Where there is a will there is a way.',
    'Strike while the iron is hot.',
    'Fortune favours the bold.',
    'All that glitters is not gold.',
    'Rome was not built in a day.',
    'Better late than never.',
    'Every cloud has a silver lining.',
    'Do not count your chickens before they hatch.',
    'Two heads are better than one.',
    'The pen is mightier than the sword.',
    'When in Rome, do as the Romans do.',
    'Absence makes the heart grow fonder.',
    'An apple a day keeps the doctor away.',
    'Honesty is the best policy.',
    'If it is not broken, do not fix it.',
    'The grass is always greener on the other side.',
    'You cannot judge a book by its cover.',
    'Necessity is the mother of invention.',
    'A watched pot never boils.',
    'Birds of a feather flock together.',
    'Still waters run deep.',
    'Make hay while the sun shines.'
  ];

  // Code-ish lines, symbols and all. Hand-written, no external source.
  var CODE = [
    'var total = price * qty;',
    'if (x > 0 && y < 10) { return true; }',
    'for (var i = 0; i < n; i++) sum += a[i];',
    'function add(a, b) { return a + b; }',
    'let ok = list.length !== 0;',
    "const tag = user.name + '#' + user.id;",
    'items.filter(x => x.ok).map(x => x.id);',
    "console.log('done:', count);",
    "obj = { id: 7, tag: 'new', deep: false };",
    'return a === b ? 0 : a < b ? -1 : 1;',
    'arr.push({ x: 4, y: 9 });',
    'if (!done) retry(3);',
    's = s.trim().toLowerCase();',
    'total += Math.round(price * 1.2);',
    'grid[y][x] = grid[y][x] || 0;',
    'while (n % 2 === 0) n = n / 2;',
    "var hex = '#' + c.toString(16);",
    'map.set(key, (map.get(key) || 0) + 1);',
    'if (i >= 0 && i < len) swap(a, i, j);',
    'def area(r): return 3.14159 * r ** 2',
    "print('total =', total)",
    'x, y = y, x % y'
  ];

  // My own sentences, deliberately dense with punctuation. ASCII only, so
  // every character is on a normal keyboard.
  var PUNCT = [
    'Wait, wait - really? Yes; truly, one hundred percent!',
    'The list (a short one) read: eggs, milk, bread, and jam.',
    '"Hurry!" she said; nobody moved, though, did they?',
    "It's odd, isn't it, how 'quick' jobs never are?",
    'Rule one: check twice; type once - simple, right?',
    'Stop! Who goes there - friend, foe, or postman?',
    'First: stretch. Second: breathe. Third: type, type, type!',
    "He asked, 'Why me?' Nobody, sadly, had an answer.",
    'Commas, colons, dashes - punctuation, it turns out, is everywhere!',
    'Really? No. Surely? No! Fine; have it your way, then.',
    'Bring three things: patience, coffee, and (of course) more coffee.',
    "The sign said 'closed'; the door, oddly, said 'push'.",
    "One, two, three - go! Wait... where's everyone going?",
    "Yes, yes; I know, I know - you told me twice, didn't you?",
    'A semicolon; a colon: a dash - all in one line!',
    "Don't stop now; you're nearly there - honestly, truly, nearly!"
  ];

  // Only words of nine letters or more.
  var LONG = [
    'adventure', 'afternoon', 'agreement', 'beautiful', 'beginning', 'butterfly',
    'calculator', 'celebration', 'challenge', 'chocolate', 'classroom', 'community',
    'condition', 'confidence', 'countryside', 'dangerous', 'delicious', 'dictionary',
    'different', 'direction', 'discovery', 'education', 'equipment', 'everybody',
    'excellent', 'excitement', 'experience', 'fireworks', 'following', 'furniture',
    'generation', 'gentleman', 'government', 'happiness', 'important', 'impossible',
    'incredible', 'influence', 'information', 'landscape', 'lighthouse', 'machinery',
    'magnificent', 'mountains', 'mysterious', 'narrative', 'newspaper', 'obviously',
    'operation', 'paragraph', 'particular', 'photograph', 'playground', 'president',
    'professor', 'punctuation', 'remarkable', 'restaurant', 'scientific', 'signature',
    'somewhere', 'spectacular', 'strawberry', 'submarine', 'technology', 'telephone',
    'telescope', 'temperature', 'tournament', 'tradition', 'understand', 'university',
    'vegetable', 'volunteer', 'wonderful', 'xylophone', 'yesterday'
  ];

  // Middle-weight words for the endurance ramp (5–8 letters).
  var MEDIUM = [
    'people', 'little', 'world', 'school', 'water', 'sound', 'place', 'house',
    'again', 'before', 'follow', 'mother', 'father', 'picture', 'letter', 'animal',
    'always', 'together', 'morning', 'garden', 'window', 'market', 'silver', 'yellow',
    'orange', 'purple', 'summer', 'winter', 'spring', 'autumn', 'bridge', 'castle',
    'dragon', 'forest', 'kitten', 'ladder', 'meadow', 'needle', 'pepper', 'rabbit',
    'temple', 'valley', 'wizard', 'planet', 'rocket', 'spider', 'basket', 'bottle',
    'candle', 'corner', 'dinner', 'engine', 'finger', 'hammer', 'island', 'jacket',
    'jungle', 'magnet', 'number', 'pocket', 'puzzle', 'riddle', 'saddle', 'tunnel',
    'violin', 'whistle', 'thunder', 'blanket'
  ];

  // Short punchy words for the falling-word rain (3–6 letters).
  var FALL = [
    'cat', 'sun', 'run', 'jump', 'fast', 'word', 'play', 'star', 'rock', 'wave',
    'fire', 'mint', 'blue', 'gold', 'ship', 'tree', 'frog', 'lamp', 'moon', 'wind',
    'snow', 'rain', 'leaf', 'bird', 'fish', 'king', 'drum', 'bell', 'cake', 'door',
    'echo', 'flag', 'glow', 'hill', 'iron', 'jazz', 'kite', 'lion', 'maze', 'nest',
    'opal', 'pear', 'quiz', 'rose', 'sand', 'tent', 'vine', 'wolf', 'yarn', 'zero',
    'apple', 'brave', 'cloud', 'dance', 'eagle', 'flame', 'grape', 'happy', 'image',
    'juice', 'koala', 'lemon', 'magic', 'night', 'ocean', 'piano', 'queen', 'river',
    'stone', 'tiger', 'urban', 'vivid', 'whale', 'youth', 'zebra', 'breeze', 'candy',
    'dizzy', 'ember', 'frost', 'giant', 'honey', 'ivory', 'jolly', 'karma', 'lunar',
    'mango', 'noble', 'orbit', 'prism', 'quick', 'robot', 'solar', 'tulip', 'unity',
    'vapor', 'waltz', 'xenon', 'yacht', 'zesty'
  ];

  /* ------------------------------------------------------------- helpers */

  var OK = '#34d399', BAD = '#fb7185', DIM = 'rgba(233,238,255,.42)', ACC = '#22d3ee';
  var MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function group(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  function lineFrom(pool, min) {
    var out = '';
    while (out.length < min) {
      out += (out ? ' ' : '') + pool[(Math.random() * pool.length) | 0];
    }
    return out;
  }

  function pickLine(pool) {
    return function (d) {
      for (var i = 0; i < 6; i++) {
        var s = pool[(Math.random() * pool.length) | 0];
        if (s !== d.line && s !== d.next) return s;
      }
      return pool[(Math.random() * pool.length) | 0];
    };
  }

  function numToken(U) {
    var k = (Math.random() * 6) | 0;
    if (k === 0) return String(U.randInt(100, 99999));
    if (k === 1) return '$' + group(U.randInt(1, 99999)) + '.' + pad2(U.randInt(0, 99));
    if (k === 2) return U.randInt(1, 99) + '%';
    if (k === 3) return pad2(U.randInt(0, 23)) + ':' + pad2(U.randInt(0, 59));
    if (k === 4) return U.randInt(0, 99) + '.' + U.randInt(10, 999);
    return U.randInt(100, 999) + '-' + U.randInt(1000, 9999);
  }

  function tickSnd() { window.Milo.sound.tone({ f: 640, d: .02, v: .018, type: 'triangle' }); }
  function buzzSnd() { window.Milo.sound.tone({ f: 150, d: .07, v: .05, type: 'sawtooth' }); }

  function statBox(parent, size, color, label) {
    var box = document.createElement('div');
    box.style.cssText = 'display:flex;align-items:baseline;gap:6px';
    var v = document.createElement('div');
    v.style.cssText = 'font:800 ' + size + '/1 Outfit,sans-serif;color:' + color +
      ';font-variant-numeric:tabular-nums';
    v.textContent = '0';
    var l = document.createElement('div');
    l.style.cssText = 'font:600 11px/1 Outfit,sans-serif;color:rgba(233,238,255,.45);' +
      'text-transform:uppercase;letter-spacing:.09em';
    l.textContent = label;
    box.appendChild(v); box.appendChild(l);
    parent.appendChild(box);
    return v;
  }

  function touchHintEl() {
    if (!window.Milo.touchLayout()) return null;
    var t = document.createElement('div');
    t.style.cssText = 'color:#fbbf24;font:600 .85rem/1.4 Outfit,sans-serif;text-align:center';
    t.textContent = '📱 Heads up — this game really needs a physical keyboard.';
    return t;
  }

  /* ------------------------------------------- shared stream typing engine */

  var SPRINT = 10, REST = 3, ROUNDS = 5;

  function typingMount(spec) {
    return function (host) {
      var Milo = window.Milo, U = Milo.util;
      var els = {}, runner;

      function fmtClock(s) {
        s = Math.max(0, s);
        return (spec.time && spec.time > 90) || (spec.mode === 'quotes' && s > 90)
          ? U.time(s) : Math.ceil(s) + 's';
      }

      function setBar(f) {
        els.bar.style.width = (U.clamp(f, 0, 1) * 100) + '%';
      }

      function build(g) {
        var root = g.root;
        root.innerHTML = '';
        var wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;' +
          'gap:12px;width:min(94vw,780px);font-family:Outfit,sans-serif';

        var lr = document.createElement('div');
        lr.style.cssText = 'display:flex;align-items:baseline;gap:28px;justify-content:center';
        els.wpm = statBox(lr, '46px', ACC, 'wpm');
        els.acc = statBox(lr, '22px', OK, 'accuracy');
        els.time = statBox(lr, '22px', '#e6ecff', spec.mode === 'quotes' ? 'elapsed' : 'time');
        wrap.appendChild(lr);

        var bw = document.createElement('div');
        bw.style.cssText = 'width:100%;height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden';
        els.bar = document.createElement('div');
        els.bar.style.cssText = 'height:100%;width:100%;background:' + ACC + ';border-radius:3px';
        bw.appendChild(els.bar);
        wrap.appendChild(bw);

        els.sub = document.createElement('div');
        els.sub.style.cssText = 'color:#a8b0d8;font:600 .9rem/1.3 Outfit,sans-serif;min-height:1.2em;text-align:center';
        els.sub.textContent = spec.subText || '';
        wrap.appendChild(els.sub);

        var font = spec.mono ? MONO : 'Outfit,sans-serif';
        els.prompt = document.createElement('div');
        els.prompt.style.cssText = 'width:100%;box-sizing:border-box;background:rgba(255,255,255,.05);' +
          'border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:20px 24px;' +
          'font:600 clamp(17px,2.6vw,23px)/1.9 ' + font + ';letter-spacing:.03em;' +
          'white-space:pre-wrap;word-break:break-word;text-align:left;user-select:none;cursor:default';
        wrap.appendChild(els.prompt);

        els.prev = document.createElement('div');
        els.prev.style.cssText = 'width:100%;box-sizing:border-box;color:rgba(233,238,255,.3);' +
          'font:500 .95rem/1.4 ' + font + ';white-space:nowrap;overflow:hidden;' +
          'text-overflow:ellipsis;text-align:left;padding:0 8px';
        wrap.appendChild(els.prev);

        var hint = document.createElement('div');
        hint.style.cssText = 'color:rgba(233,238,255,.4);font:500 .82rem/1.4 Outfit,sans-serif;text-align:center';
        hint.textContent = spec.noBackspace
          ? 'No backspace here — every key is final.'
          : 'Backspace fixes mistakes · the run starts on your first key';
        wrap.appendChild(hint);

        var th = touchHintEl();
        if (th) wrap.appendChild(th);

        root.appendChild(wrap);
      }

      function paintChar(g, i) {
        var d = g.data, s = d.spans[i];
        if (!s) return;
        var f = d.flags[i];
        if (i === d.pos && !d.done) {
          s.style.color = '#fff';
          s.style.background = 'rgba(34,211,238,.14)';
          s.style.borderBottomColor = ACC;
        } else if (f === 1) {
          s.style.color = OK; s.style.background = 'transparent';
          s.style.borderBottomColor = 'transparent';
        } else if (f === 2) {
          s.style.color = BAD; s.style.background = 'rgba(251,113,133,.16)';
          s.style.borderBottomColor = 'transparent';
        } else {
          s.style.color = DIM; s.style.background = 'transparent';
          s.style.borderBottomColor = 'transparent';
        }
      }

      function renderLine(g) {
        var d = g.data;
        els.prompt.innerHTML = '';
        d.spans = [];
        for (var i = 0; i < d.line.length; i++) {
          var s = document.createElement('span');
          s.textContent = d.line.charAt(i);
          s.style.borderBottom = '2px solid transparent';
          s.style.borderRadius = '3px';
          els.prompt.appendChild(s);
          d.spans.push(s);
        }
        for (i = 0; i < d.line.length; i++) paintChar(g, i);
        els.prev.textContent = d.next || '';
      }

      function curWpm(d) {
        var t = d.elapsed;
        t = Math.max(t, spec.minTime || 4);
        return Math.round((d.chars / 5) / (t / 60));
      }
      function curAcc(d) {
        var total = d.hits + d.errs;
        return total ? Math.round(d.hits / total * 100) : 100;
      }

      function live(g) {
        var d = g.data, wpm, acc = curAcc(d);
        if (spec.mode === 'burst') {
          var went = SPRINT - d.roundT;
          wpm = Math.round((d.roundChars / 5) / (Math.max(went, 2) / 60));
          els.time.textContent = Math.ceil(Math.max(0, d.roundT)) + 's';
          setBar(d.roundT / SPRINT);
        } else if (spec.mode === 'quotes') {
          wpm = curWpm(d);
          els.time.textContent = fmtClock(d.elapsed);
          setBar(1);
        } else {
          wpm = curWpm(d);
          var left = Math.max(0, spec.time - d.elapsed);
          els.time.textContent = fmtClock(left);
          setBar(spec.time ? left / spec.time : 1);
        }
        els.wpm.textContent = wpm;
        els.acc.textContent = acc + '%';
        g.set('WPM', wpm);
        g.set('Accuracy', acc + '%');
        g.set('Time', els.time.textContent);
        if (spec.mode === 'accuracy') g.set('Chars', d.hits);
      }

      function endRun(g, win) {
        var d = g.data;
        if (d.done) return;
        d.done = true;
        var wpm = curWpm(d), acc = curAcc(d);
        var opt = {
          emo: spec.emo,
          title: (win && spec.winTitle) ? spec.winTitle : wpm + ' WPM',
          text: spec.endText
            ? spec.endText(d, wpm, acc)
            : d.hits + ' correct characters at ' + acc + '% accuracy.',
          score: wpm
        };
        if (win) g.win(opt); else g.gameOver(opt);
      }

      function fatal(g, want, got) {
        var d = g.data;
        d.done = true;
        Milo.sound.hit();
        function name(ch) { return ch === ' ' ? 'space' : "'" + esc(ch) + "'"; }
        g.gameOver({
          emo: '💥', title: 'One slip!',
          text: 'You hit ' + name(got) + ' where ' + name(want) + ' was needed — ' +
            d.hits + ' flawless characters in. WPM is measured over at least 15 ' +
            'seconds, so an early slip scores low.',
          score: curWpm(d)
        });
      }

      function lineDone(g) {
        var d = g.data;
        d.lines++;
        Milo.sound.blip();
        if (spec.mode === 'quotes') {
          if (d.lines >= 3) { endRun(g, true); return; }
          g.set('Quote', (d.lines + 1) + '/3');
          els.sub.textContent = 'Quote ' + (d.lines + 1) + ' of 3';
          d.line = d.queue[d.lines];
          d.next = d.queue[d.lines + 1] || '';
        } else {
          d.line = d.next;
          d.next = spec.nextLine(d);
        }
        d.pos = 0;
        d.flags = [];
        renderLine(g);
      }

      function typeChar(g, ch) {
        var d = g.data;
        if (d.done || d.resting) return;
        if (!d.started) {
          if (ch === ' ') return;   // the Space that restarted the run
          d.started = true;
        }
        if (d.pos >= d.line.length) return;
        var want = d.line.charAt(d.pos);
        var ok = ch === want;
        if (!ok && spec.strict) {
          d.errs++;
          d.flags[d.pos] = 2;
          paintChar(g, d.pos);
          fatal(g, want, ch);
          return;
        }
        d.flags[d.pos] = ok ? 1 : 2;
        if (ok) {
          d.hits++; d.chars++;
          if (spec.mode === 'burst') d.roundChars++;
          tickSnd();
        } else {
          d.errs++;
          buzzSnd();
        }
        d.pos++;
        paintChar(g, d.pos - 1);
        paintChar(g, d.pos);
        if (d.pos >= d.line.length) lineDone(g);
        if (!d.done) live(g);
      }

      function back(g) {
        var d = g.data;
        if (d.done || d.resting || spec.noBackspace || d.pos <= 0) return;
        d.pos--;
        if (d.flags[d.pos] === 1) {
          d.chars--;
          if (spec.mode === 'burst' && d.roundChars > 0) d.roundChars--;
        }
        d.flags[d.pos] = 0;
        paintChar(g, d.pos);
        paintChar(g, d.pos + 1);
        live(g);
      }

      /* burst rounds */
      function startRound(g) {
        var d = g.data;
        d.resting = false;
        d.round = d.roundsDone.length + 1;
        d.roundT = SPRINT;
        d.roundChars = 0;
        d.line = spec.nextLine(d);
        d.next = spec.nextLine(d);
        d.pos = 0; d.flags = [];
        renderLine(g);
        els.sub.textContent = 'Round ' + d.round + ' of ' + ROUNDS + ' — go!';
        g.set('Round', d.round + '/' + ROUNDS);
        Milo.sound.blip();
      }

      function endRound(g) {
        var d = g.data;
        var w = Math.round(d.roundChars * 1.2);   // chars/5 words in 1/6 min
        d.roundsDone.push(w);
        if (w > d.bestRound) d.bestRound = w;
        g.set('Best', d.bestRound);
        Milo.sound.coin();
        if (d.roundsDone.length >= ROUNDS) {
          d.done = true;
          g.gameOver({
            emo: '💨', title: d.bestRound + ' WPM sprint',
            text: 'Five sprints: ' + d.roundsDone.join(' · ') + ' WPM. ' +
              'Your best one is the score.',
            score: d.bestRound
          });
          return;
        }
        d.resting = true;
        d.restT = REST;
      }

      function phaseName(t) {
        for (var i = 0; i < spec.phases.length; i++) {
          if (t < spec.phases[i].until) return spec.phases[i].name;
        }
        return spec.phases[spec.phases.length - 1].name;
      }

      function update(g, dt) {
        var d = g.data;
        if (d.done) return;
        if (spec.mode === 'burst') {
          if (d.resting) {
            d.restT -= dt;
            els.sub.textContent = 'Round ' + (d.roundsDone.length + 1) + ' of ' + ROUNDS +
              ' starts in ' + Math.max(1, Math.ceil(d.restT)) + '…';
            els.time.textContent = Math.max(0, Math.ceil(d.restT)) + 's';
            setBar(Math.max(0, d.restT / REST));
            if (d.restT <= 0) startRound(g);
            return;
          }
          if (!d.started) return;
          d.elapsed += dt;
          d.roundT -= dt;
          live(g);
          if (d.roundT <= 0) endRound(g);
          return;
        }
        if (!d.started) return;
        d.elapsed += dt;
        if (spec.phases) {
          var nm = phaseName(d.elapsed);
          if (nm !== d.phase) {
            d.phase = nm;
            g.set('Phase', nm);
            els.sub.textContent = 'Phase: ' + nm;
            Milo.sound.blip();
          }
        }
        live(g);
        if (spec.mode === 'quotes') return;
        if (spec.time - d.elapsed <= 0) endRun(g, spec.mode === 'accuracy');
      }

      function reset(g) {
        var d = g.data;
        d.done = false; d.started = false; d.elapsed = 0;
        d.hits = 0; d.errs = 0; d.chars = 0; d.lines = 0;
        d.pos = 0; d.flags = []; d.phase = ''; d.resting = false;
        if (spec.mode === 'quotes') {
          d.queue = U.shuffle(QUOTES.slice()).slice(0, 3);
          d.line = d.queue[0];
          d.next = d.queue[1];
        } else if (spec.mode === 'burst') {
          d.round = 1; d.roundT = SPRINT; d.roundChars = 0;
          d.roundsDone = []; d.bestRound = 0; d.restT = 0;
          d.line = spec.nextLine(d);
          d.next = spec.nextLine(d);
        } else {
          d.line = spec.nextLine(d);
          d.next = spec.nextLine(d);
        }
        build(g);
        renderLine(g);
        g.set('WPM', 0);
        g.set('Accuracy', '100%');
        if (spec.mode === 'burst') { g.set('Round', '1/' + ROUNDS); g.set('Best', 0); }
        if (spec.mode === 'quotes') g.set('Quote', '1/3');
        if (spec.phases) { d.phase = phaseName(0); g.set('Phase', d.phase); }
        if (spec.mode === 'accuracy') g.set('Chars', 0);
        live(g);
      }

      function key(e) {
        if (!runner) return;
        var g = runner.g;
        if (g.state !== 'play') return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key === 'Backspace') { e.preventDefault(); back(g); return; }
        if (e.key == null || e.key.length !== 1) return;
        e.preventDefault();
        typeChar(g, e.key);
      }

      runner = Milo.domGame(host, {
        id: spec.id,
        bg: spec.bg,
        emo: spec.emo,
        stats: spec.stats,
        start: spec.start,
        init: reset,
        update: update,
        destroy: function () { window.removeEventListener('keydown', key); }
      });
      window.addEventListener('keydown', key);
      return runner;
    };
  }

  /* -------------------------------------------------- the nine stream games */

  window.Milo.register({
    id: 'type-common-words', title: 'Common Words', emo: '🔤', category: 'Word',
    tagline: 'Sixty seconds of the 200 words you type all day',
    description: 'A rolling stream built from the 200 most common English words, all ' +
      'lowercase, no punctuation — pure flow. You get sixty seconds from your first ' +
      'keystroke; every character is marked green or red as you hit it, and backspace ' +
      'undoes a slip. The score is standard WPM (five characters per word), so wrong ' +
      'keys cost you twice: the buzz, then the fix. Tip: rhythm beats bursts — a steady ' +
      '95% accuracy outruns frantic 80% every time.',
    controls: ['Type', 'Backspace'],
    colors: ['#101c3a', '#38bdf8'],
    scoreLabel: 'WPM',
    tags: ['typing', 'speed', 'words', 'wpm', 'skill'],
    mount: typingMount({
      id: 'type-common-words', emo: '🔤', bg: '#0d1530',
      mode: 'timed', time: 60,
      stats: ['WPM', 'Accuracy', 'Time'],
      subText: 'Everyday words only — find your rhythm.',
      start: {
        title: 'Common Words',
        text: 'Sixty seconds of the most common English words. The clock starts on ' +
          'your first keystroke; letters turn green when right and red when wrong, ' +
          'and backspace fixes them. Score is words per minute.',
        keys: ['Just type', 'Backspace to fix']
      },
      nextLine: function () { return lineFrom(COMMON, 46); },
      endText: function (d, wpm, acc) {
        return d.hits + ' correct characters at ' + acc + '% accuracy across ' +
          d.lines + ' completed lines.';
      }
    })
  });

  window.Milo.register({
    id: 'type-quotes', title: 'Quote Typer', emo: '📜', category: 'Word',
    tagline: 'Three proverbs, capitals and full stops included',
    description: 'Each run deals you three proverbs from a hand-picked set of thirty ' +
      'traditional sayings — "slow and steady wins the race" and its friends. Unlike ' +
      'the plain word drills these have capital letters, commas and full stops, so ' +
      'your shift-key hand finally has to earn its keep. The timer counts up and stops ' +
      'when the third quote is done; your score is the WPM over the whole run. Tip: the ' +
      'first letter of each sentence is where most people stumble.',
    controls: ['Type', 'Backspace'],
    colors: ['#241a3a', '#c084fc'],
    scoreLabel: 'WPM',
    tags: ['typing', 'quotes', 'proverbs', 'wpm'],
    mount: typingMount({
      id: 'type-quotes', emo: '📜', bg: '#170f2b',
      mode: 'quotes',
      stats: ['WPM', 'Accuracy', 'Quote'],
      subText: 'Quote 1 of 3',
      winTitle: null,
      start: {
        title: 'Quote Typer',
        text: 'Three classic proverbs, typed exactly — capitals, commas and full ' +
          'stops included. The clock counts up and stops when the last one is done. ' +
          'Score is your words per minute across all three.',
        keys: ['Type exactly what you see', 'Shift for capitals']
      },
      endText: function (d, wpm, acc) {
        return 'Three sayings in ' + Math.round(d.elapsed) + 's — ' + d.hits +
          ' characters at ' + acc + '% accuracy.';
      }
    })
  });

  window.Milo.register({
    id: 'type-numbers', title: 'Digit Dash', emo: '🔢', category: 'Word',
    tagline: 'Prices, times and phone digits — top row only',
    description: 'Sixty seconds of pure number-row work: plain digit strings, comma-' +
      'grouped prices like $4,182.09, percentages, 24-hour times and dashed number ' +
      'blocks. Nobody practises these, which is exactly why accountants type them ' +
      'faster than you. Every symbol — the dollar, the colon, the comma — counts as a ' +
      'character, and the score is WPM. Tip: keep your index fingers anchored on F and ' +
      'J and reach up; looking down at the number row is how the time disappears.',
    controls: ['Type', 'Backspace'],
    colors: ['#0d2430', '#2dd4bf'],
    scoreLabel: 'WPM',
    tags: ['typing', 'numbers', 'digits', 'wpm'],
    mount: typingMount({
      id: 'type-numbers', emo: '🔢', bg: '#0a1c26',
      mode: 'timed', time: 60, mono: true,
      stats: ['WPM', 'Accuracy', 'Time'],
      subText: 'Digits, prices, times — symbols count too.',
      start: {
        title: 'Digit Dash',
        text: 'Sixty seconds of numbers: digit strings, prices with commas and ' +
          'cents, percentages and clock times. Every symbol counts. The clock ' +
          'starts on your first keystroke.',
        keys: ['Number row', 'Shift for $ and %']
      },
      nextLine: function () {
        var Milo = window.Milo, t = [];
        for (var i = 0; i < 4; i++) t.push(numToken(Milo.util));
        return t.join(' ');
      },
      endText: function (d, wpm, acc) {
        return d.hits + ' correct characters of raw digits and symbols at ' +
          acc + '% accuracy.';
      }
    })
  });

  window.Milo.register({
    id: 'type-code', title: 'Code Typer', emo: '💻', category: 'Word',
    tagline: 'Brackets, arrows and semicolons at full speed',
    description: 'Sixty seconds of hand-written code-flavoured lines — loops, ' +
      'ternaries, arrow functions — rendered in a monospace font and typed character ' +
      'for character, semicolons and all. Case matters, so Math.round with a small m ' +
      'is a red letter. Symbols like {, ===, and => are worth the same as any letter, ' +
      'which makes this the highest-value practice per minute if you write code for a ' +
      'living. Tip: the shift-heavy clusters ({ } ( ) !) are where the WPM hides.',
    controls: ['Type', 'Backspace', 'Shift'],
    colors: ['#101418', '#4ade80'],
    scoreLabel: 'WPM',
    tags: ['typing', 'code', 'symbols', 'programming', 'wpm'],
    mount: typingMount({
      id: 'type-code', emo: '💻', bg: '#0b0f14',
      mode: 'timed', time: 60, mono: true,
      stats: ['WPM', 'Accuracy', 'Time'],
      subText: 'Exact characters — case and symbols matter.',
      start: {
        title: 'Code Typer',
        text: 'Sixty seconds of code-ish one-liners. Type them exactly — brackets, ' +
          'equals signs, semicolons, capital M in Math. The clock starts on your ' +
          'first keystroke.',
        keys: ['Type exactly', 'Shift for symbols']
      },
      nextLine: pickLine(CODE),
      endText: function (d, wpm, acc) {
        return d.lines + ' lines shipped, ' + d.hits + ' correct characters at ' +
          acc + '% accuracy.';
      }
    })
  });

  window.Milo.register({
    id: 'type-punctuation', title: 'Punctuation Panic', emo: '✒️', category: 'Word',
    tagline: 'Sentences stuffed with commas, colons and quotes',
    description: 'Sixty seconds of original sentences deliberately overloaded with ' +
      'punctuation — semicolons, parentheses, apostrophes, quoted speech, the lot. ' +
      'Every mark is a character you must hit exactly, and the apostrophe-comma-' +
      'quote cluster on the right of the keyboard gets a workout it never normally ' +
      'sees. Score is WPM. Tip: slow down INTO the punctuation and accelerate out of ' +
      'it — most errors come from carrying word-speed into a semicolon.',
    controls: ['Type', 'Backspace', 'Shift'],
    colors: ['#2a1626', '#f472b6'],
    scoreLabel: 'WPM',
    tags: ['typing', 'punctuation', 'symbols', 'wpm'],
    mount: typingMount({
      id: 'type-punctuation', emo: '✒️', bg: '#1c0f1a',
      mode: 'timed', time: 60,
      stats: ['WPM', 'Accuracy', 'Time'],
      subText: 'Every comma, colon and quote counts.',
      start: {
        title: 'Punctuation Panic',
        text: 'Sixty seconds of sentences crammed with punctuation. Every comma, ' +
          'semicolon, quote and bracket must be typed exactly. The clock starts ' +
          'on your first keystroke.',
        keys: ['Type exactly', "Don't skip the marks"]
      },
      nextLine: pickLine(PUNCT),
      endText: function (d, wpm, acc) {
        return d.hits + ' correct characters — punctuation and all — at ' +
          acc + '% accuracy.';
      }
    })
  });

  window.Milo.register({
    id: 'type-burst', title: 'Type Burst', emo: '💨', category: 'Word',
    tagline: 'Five 10-second sprints — only your best one counts',
    description: 'Five rounds of exactly ten seconds each, with a three-second breather ' +
      'between them. Each round is a fresh line of short common words and its own WPM ' +
      'reading; when the fifth sprint ends you keep the best of the five. Because ten ' +
      'seconds is too short to recover from a stumble, this is a very different skill ' +
      'from a sixty-second test — it rewards a clean explosive start. Tip: read the ' +
      'first three words during the countdown so your fingers launch instantly.',
    controls: ['Type', 'Backspace'],
    colors: ['#2b1a10', '#fb923c'],
    scoreLabel: 'WPM',
    tags: ['typing', 'sprint', 'reflex', 'wpm'],
    mount: typingMount({
      id: 'type-burst', emo: '💨', bg: '#1c1108',
      mode: 'burst',
      stats: ['WPM', 'Best', 'Round'],
      subText: 'Round 1 of 5 — starts on your first key.',
      start: {
        title: 'Type Burst',
        text: 'Five sprints of ten seconds, three seconds of rest between them. ' +
          'Each round gets a fresh line and its own WPM; your best round is the ' +
          'score. Round one starts on your first keystroke.',
        keys: ['Sprint!', 'Backspace to fix']
      },
      nextLine: function () { return lineFrom(COMMON, 40); }
    })
  });

  window.Milo.register({
    id: 'type-endurance', title: 'Type Marathon', emo: '🏃', category: 'Word',
    tagline: 'Three minutes — fatigue is the real boss',
    description: 'A full three-minute run where the words themselves get heavier as ' +
      'you tire: the first minute is easy common words, the second brings mid-length ' +
      'vocabulary, and the final Burnout minute is nothing but nine-plus-letter ' +
      'monsters. Your WPM is measured over the whole three minutes, so a fast first ' +
      'minute means nothing if your hands fall apart in the third. Tip: type the first ' +
      'minute at ninety percent effort — the players who sprint the Warm-up always ' +
      'crumble in Burnout.',
    controls: ['Type', 'Backspace'],
    colors: ['#1a2338', '#818cf8'],
    scoreLabel: 'WPM',
    tags: ['typing', 'endurance', 'marathon', 'stamina', 'wpm'],
    mount: typingMount({
      id: 'type-endurance', emo: '🏃', bg: '#10162b',
      mode: 'timed', time: 180,
      stats: ['WPM', 'Accuracy', 'Phase'],
      subText: 'Phase: Warm-up',
      phases: [
        { until: 60, name: 'Warm-up' },
        { until: 120, name: 'The grind' },
        { until: 1e9, name: 'Burnout' }
      ],
      start: {
        title: 'Type Marathon',
        text: 'Three minutes, three phases. Warm-up is easy words, The grind gets ' +
          'longer ones, and Burnout is all nine-letter-plus monsters. One WPM over ' +
          'the whole distance — pace yourself.',
        keys: ['Settle in', 'Backspace to fix']
      },
      nextLine: function (d) {
        var t = d.elapsed || 0;
        var pool = t < 60 ? COMMON : t < 120 ? MEDIUM : LONG;
        return lineFrom(pool, t < 60 ? 44 : 48);
      },
      endText: function (d, wpm, acc) {
        return 'The full three minutes: ' + d.hits + ' correct characters at ' + acc +
          '% accuracy. Surviving Burnout with your form intact is the real win.';
      }
    })
  });

  window.Milo.register({
    id: 'type-accuracy', title: 'One Mistake', emo: '🎯', category: 'Word',
    tagline: 'A single wrong key ends the run instantly',
    description: 'Sudden-death typing: common words stream past and one wrong ' +
      'character — any character — ends the run on the spot. There is no backspace, ' +
      'because there is nothing to fix. Survive two full minutes without a slip and ' +
      'you win outright; either way your score is WPM, measured over at least fifteen ' +
      'seconds so a lucky three-second burst cannot cheese the leaderboard. Tip: drop ' +
      'to about 70% of your normal speed — this game punishes confidence, not caution.',
    controls: ['Type'],
    colors: ['#2a1220', '#fb7185'],
    scoreLabel: 'WPM',
    tags: ['typing', 'accuracy', 'sudden death', 'precision', 'wpm'],
    mount: typingMount({
      id: 'type-accuracy', emo: '🎯', bg: '#1c0c15',
      mode: 'accuracy', time: 120, strict: true, noBackspace: true, minTime: 15,
      stats: ['WPM', 'Chars', 'Time'],
      subText: 'One wrong key ends everything. No backspace.',
      winTitle: 'Flawless!',
      start: {
        title: 'One Mistake',
        text: 'Type the stream — but a single wrong character ends the run ' +
          'immediately, and there is no backspace. Survive two flawless minutes ' +
          'to win. Score is WPM, measured over at least fifteen seconds.',
        keys: ['Precision over speed', 'One life']
      },
      nextLine: function () { return lineFrom(COMMON, 46); },
      endText: function (d, wpm, acc) {
        return 'Two full minutes without a single wrong key — ' + d.hits +
          ' flawless characters.';
      }
    })
  });

  window.Milo.register({
    id: 'type-long-words', title: 'Long Words', emo: '📏', category: 'Word',
    tagline: 'Nothing under nine letters allowed',
    description: 'Sixty seconds where every single word is nine letters or longer — ' +
      'punctuation, temperature, spectacular, xylophone. Long words break the ' +
      'letter-pair habits that carry you through normal text, so expect your WPM to ' +
      'drop twenty points and your accuracy to feel personally insulted. Same green/' +
      'red per-character marking, same five-characters-per-word scoring. Tip: read the ' +
      'whole word before your fingers start; mid-word course corrections are where ' +
      'these runs die.',
    controls: ['Type', 'Backspace'],
    colors: ['#16281c', '#a3e635'],
    scoreLabel: 'WPM',
    tags: ['typing', 'vocabulary', 'long words', 'wpm'],
    mount: typingMount({
      id: 'type-long-words', emo: '📏', bg: '#0f1c14',
      mode: 'timed', time: 60,
      stats: ['WPM', 'Accuracy', 'Time'],
      subText: 'Nine letters minimum, every word.',
      start: {
        title: 'Long Words',
        text: 'Sixty seconds, and every word is nine letters or more. Read ahead, ' +
          'keep your nerve through the middle syllables. The clock starts on your ' +
          'first keystroke.',
        keys: ['Type', 'Backspace to fix']
      },
      nextLine: function () { return lineFrom(LONG, 48); },
      endText: function (d, wpm, acc) {
        return d.hits + ' correct characters of heavyweight vocabulary at ' +
          acc + '% accuracy.';
      }
    })
  });

  /* ----------------------------------------------- arcade: falling words */

  function fallMount(host) {
    var Milo = window.Milo, U = Milo.util;
    var runner, lane, ground, accEl;

    function hearts(n) { return n <= 0 ? '—' : '♥♥♥'.slice(0, n); }

    function build(g) {
      var root = g.root;
      root.innerHTML = '';
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;' +
        'gap:10px;width:min(94vw,700px);font-family:Outfit,sans-serif';

      lane = document.createElement('div');
      lane.style.cssText = 'position:relative;width:100%;height:min(56vh,420px);' +
        'background:linear-gradient(180deg,#0e1c33,#080f1f);' +
        'border:1px solid rgba(255,255,255,.09);border-radius:14px;overflow:hidden';

      ground = document.createElement('div');
      ground.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:40px;' +
        'background:rgba(251,113,133,.08);border-top:1px dashed rgba(251,113,133,.45);' +
        'transition:background .25s;pointer-events:none';
      lane.appendChild(ground);
      wrap.appendChild(lane);

      var row = document.createElement('div');
      row.style.cssText = 'display:flex;justify-content:space-between;width:100%;' +
        'color:rgba(233,238,255,.45);font:600 .84rem/1.4 Outfit,sans-serif;padding:0 4px';
      var tip = document.createElement('div');
      tip.textContent = 'Type a word’s first letter to lock on · Backspace releases';
      accEl = document.createElement('div');
      accEl.textContent = 'accuracy 100%';
      row.appendChild(tip);
      row.appendChild(accEl);
      wrap.appendChild(row);

      var th = touchHintEl();
      if (th) wrap.appendChild(th);

      root.appendChild(wrap);
    }

    function paintWord(w) {
      for (var i = 0; i < w.spans.length; i++) {
        w.spans[i].style.color = i < w.matched ? OK : '#e6ecff';
      }
    }

    function setTargetStyle(w, on) {
      w.el.style.background = on ? 'rgba(34,211,238,.16)' : 'transparent';
      w.el.style.boxShadow = on ? '0 0 16px rgba(34,211,238,.4)' : 'none';
    }

    function spawn(g, y0) {
      var d = g.data;
      var used = {}, i;
      for (i = 0; i < d.words.length; i++) used[d.words[i].text.charAt(0)] = 1;
      var pick = null;
      for (i = 0; i < 24; i++) {
        var c = U.choice(FALL);
        if (!used[c.charAt(0)]) { pick = c; break; }
      }
      if (!pick) pick = U.choice(FALL);

      var el = document.createElement('div');
      el.style.cssText = 'position:absolute;top:0;white-space:nowrap;padding:4px 9px;' +
        'border-radius:8px;font:700 clamp(16px,2.4vw,22px)/1 Outfit,sans-serif;' +
        'letter-spacing:.06em;pointer-events:none';
      var spans = [];
      for (i = 0; i < pick.length; i++) {
        var s = document.createElement('span');
        s.textContent = pick.charAt(i);
        s.style.color = '#e6ecff';
        el.appendChild(s);
        spans.push(s);
      }
      var w = {
        text: pick, matched: 0, spans: spans, el: el,
        x: U.rand(12, 88),
        y: y0 == null ? -26 : y0,
        v: (36 + d.level * 9) * U.rand(.85, 1.25)
      };
      el.style.left = w.x + '%';
      el.style.transform = 'translate(-50%,' + w.y + 'px)';
      lane.appendChild(el);
      d.words.push(w);
    }

    function removeWord(d, w) {
      if (w.el.parentNode) w.el.parentNode.removeChild(w.el);
      var i = d.words.indexOf(w);
      if (i !== -1) d.words.splice(i, 1);
      if (d.target === w) d.target = null;
    }

    function updAcc(g) {
      var d = g.data;
      var total = d.hits + d.errs;
      accEl.textContent = 'accuracy ' + (total ? Math.round(d.hits / total * 100) : 100) + '%';
    }

    function clearWord(g, w) {
      var d = g.data;
      var pts = 10 + 2 * w.text.length + 3 * (d.level - 1);
      g.score += pts;
      g.set('Score', U.fmt(g.score));
      d.cleared++;

      var pop = document.createElement('div');
      pop.textContent = '+' + pts;
      pop.style.cssText = 'position:absolute;top:0;left:' + w.x + '%;' +
        'transform:translate(-50%,' + w.y + 'px);color:#facc15;' +
        'font:800 15px Outfit,sans-serif;transition:transform .5s ease,opacity .5s ease;' +
        'pointer-events:none';
      lane.appendChild(pop);
      (function (p, yy) {
        requestAnimationFrame(function () {
          p.style.transform = 'translate(-50%,' + (yy - 34) + 'px)';
          p.style.opacity = '0';
        });
        setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 550);
      })(pop, w.y);

      removeWord(d, w);
      Milo.sound.coin();
      if (d.cleared % 8 === 0) {
        d.level++;
        g.set('Level', d.level);
        Milo.sound.powerup();
      }
    }

    function land(g, w) {
      var d = g.data;
      removeWord(d, w);
      d.lives--;
      g.set('Lives', hearts(d.lives));
      Milo.sound.hit();
      d.flashT = .3;
      ground.style.background = 'rgba(251,113,133,.35)';
      if (d.lives <= 0) {
        g.gameOver({
          emo: '🌊', title: 'Swamped!',
          text: d.cleared + ' words cleared · reached level ' + d.level +
            ' · survived ' + Math.floor(d.t) + 's.',
          score: g.score
        });
      }
    }

    function key(e) {
      if (!runner) return;
      var g = runner.g;
      if (g.state !== 'play') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var d = g.data;
      if (e.key === 'Backspace') {
        e.preventDefault();
        var t0 = d.target;
        if (t0 && t0.matched > 0) {
          t0.matched--;
          paintWord(t0);
          if (t0.matched === 0) { setTargetStyle(t0, false); d.target = null; }
        }
        return;
      }
      if (e.key == null || e.key.length !== 1) return;
      if (e.key === ' ') { e.preventDefault(); return; }
      var ch = e.key.toLowerCase();
      if (!/^[a-z]$/.test(ch)) return;
      e.preventDefault();

      if (!d.target) {
        var best = null;
        for (var i = 0; i < d.words.length; i++) {
          var w = d.words[i];
          if (w.text.charAt(0) === ch && (!best || w.y > best.y)) best = w;
        }
        if (!best) { d.errs++; buzzSnd(); updAcc(g); return; }
        d.target = best;
        best.matched = 1;
        d.hits++;
        setTargetStyle(best, true);
        paintWord(best);
        tickSnd();
        updAcc(g);
        if (best.matched >= best.text.length) clearWord(g, best);
        return;
      }
      var t = d.target;
      if (t.text.charAt(t.matched) === ch) {
        t.matched++;
        d.hits++;
        paintWord(t);
        tickSnd();
        if (t.matched >= t.text.length) clearWord(g, t);
      } else {
        d.errs++;
        buzzSnd();
      }
      updAcc(g);
    }

    function update(g, dt) {
      var d = g.data;
      if (d.lives <= 0) return;
      d.t += dt;
      var mul = 1 + d.t / 80;   // everything creeps faster the longer you last

      d.spawnT -= dt;
      if (d.spawnT <= 0) {
        if (d.words.length < 9) spawn(g);
        d.spawnT = Math.max(.75, 2.4 - d.level * .14) * U.rand(.85, 1.2);
      }

      var laneH = lane.offsetHeight || 400;
      for (var i = d.words.length - 1; i >= 0; i--) {
        var w = d.words[i];
        w.y += w.v * mul * dt;
        w.el.style.transform = 'translate(-50%,' + w.y + 'px)';
        if (w.y >= laneH - 46) {
          land(g, w);
          if (d.lives <= 0) return;
        }
      }

      if (d.flashT > 0) {
        d.flashT -= dt;
        if (d.flashT <= 0) ground.style.background = 'rgba(251,113,133,.08)';
      }
    }

    function reset(g) {
      var d = g.data;
      d.words = []; d.target = null;
      d.cleared = 0; d.level = 1; d.lives = 3;
      d.t = 0; d.spawnT = .9;
      d.hits = 0; d.errs = 0; d.flashT = 0;
      build(g);
      spawn(g, 40); spawn(g, 140); spawn(g, 240);
      g.set('Score', 0);
      g.set('Lives', hearts(3));
      g.set('Level', 1);
      updAcc(g);
    }

    runner = Milo.domGame(host, {
      id: 'type-falling-words',
      bg: '#0a1222',
      stats: ['Score', 'Lives', 'Level'],
      emo: '🌧️',
      start: {
        title: 'Word Rain',
        text: 'Words fall down the lane. Type a word’s first letter to lock on ' +
          '(it glows), finish it to blast it before it hits the red line. Three ' +
          'landings and you’re swamped. It only gets faster.',
        keys: ['Type the words', 'Backspace releases a lock']
      },
      init: reset,
      update: update,
      destroy: function () { window.removeEventListener('keydown', key); }
    });
    window.addEventListener('keydown', key);
    return runner;
  }

  window.Milo.register({
    id: 'type-falling-words', title: 'Word Rain', emo: '🌧️', category: 'Word',
    tagline: 'Shoot the falling words out of the sky by typing them',
    description: 'Words drift down the lane and typing is your only weapon: hit a ' +
      'word’s first letter to lock on, finish its letters to blast it, and never ' +
      'let three reach the red line. Longer words are worth more, the level climbs ' +
      'every eight kills, and both the fall speed and the spawn rate climb with it — ' +
      'plus a slow global speed-up just for surviving. Your score is everything you ' +
      'destroyed before going under. Tip: always clear the lowest word first, even if ' +
      'a juicier one just spawned.',
    controls: ['Type', 'Backspace'],
    colors: ['#0b1c2c', '#facc15'],
    scoreLabel: 'pts',
    tags: ['typing', 'arcade', 'falling', 'survival', 'words'],
    mount: fallMount
  });

})();
