/* Memory Pack — fourteen memory trainers on one shared set of big, friendly
   tiles: themed pairs boards, triples, timed and peek variants, digit spans,
   pattern flashes, cup shuffles, path retracing and sound-only pairs. */
(function () {
  'use strict';

  var BASE = '#232a58';
  var GOOD = 'linear-gradient(140deg,#34d399,#22d3ee)';

  /* ------------------------------------------------------ shared helpers */

  function column(gap) {
    var el = document.createElement('div');
    el.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:' + gap + 'px';
    return el;
  }

  function mkMsg() {
    var el = document.createElement('div');
    el.style.cssText = 'min-height:24px;color:#a8b0d8;font-size:.96rem;font-weight:600;text-align:center';
    return el;
  }

  function hintEl(text) {
    var el = document.createElement('div');
    el.style.cssText = 'color:#a8b0d8;font-size:.84rem;text-align:center;max-width:min(92vw,560px)';
    el.textContent = text;
    return el;
  }

  function tileGrid(cols, cellW, gap) {
    var el = document.createElement('div');
    el.style.cssText = 'display:grid;gap:' + gap + 'px;' +
      'grid-template-columns:repeat(' + cols + ',1fr);' +
      'width:min(94vw,' + (cols * cellW) + 'px)';
    return el;
  }

  function tileBtn(css) {
    var b = document.createElement('button');
    b.type = 'button';
    b.style.cssText = css;
    return b;
  }

  /* --------------------------------------- pair / triple matching engine */
  /* Shared by the themed pairs boards, the triples board, the timed board,
     the limited-moves peek board and the sound-only board. Differs from
     memory-match: fixed themed boards, and the ramp is a shrinking flip-back
     window (or clock / move budget / peek time) rather than board growth. */

  function pairGame(opt) {
    var sets = (opt.cols * opt.rows) / opt.match;
    var cellW = opt.cols >= 6 ? 66 : opt.cols === 5 ? 76 : 90;
    var aspect = opt.cols >= 6 ? '1/1' : '3/4';
    var font = opt.cols >= 6 ? 'clamp(15px,3vw,26px)' :
      opt.cols === 5 ? 'clamp(17px,3.6vw,30px)' : 'clamp(20px,4.4vw,34px)';

    return function mount(host) {
      var Milo = window.Milo, U = Milo.util;
      var cards = [];

      function flipDelay(d) {
        if (opt.tones) return Math.max(.5, 1.0 - (d.round - 1) * .07);
        if (opt.match === 3) return Math.max(.4, 1.0 - (d.round - 1) * .09);
        return Math.max(.28, .8 - (d.round - 1) * .09);
      }

      function deal(g) {
        var d = g.data, vals, i, k;
        if (opt.tones) {
          vals = [];
          for (i = 0; i < sets; i++) vals.push(i);
          var st = Math.max(2, 6 - (d.round - 1));
          d.freqs = [];
          for (i = 0; i < sets; i++) d.freqs.push(Math.round(246.94 * Math.pow(2, (i * st) / 12)));
        } else {
          vals = U.shuffle(opt.icons.slice()).slice(0, sets);
        }
        var deck = [];
        for (i = 0; i < vals.length; i++)
          for (k = 0; k < opt.match; k++) deck.push(vals[i]);
        d.deck = U.shuffle(deck);
        d.flipped = [];
        d.found = [];
        d.moves = 0;
        d.time = 0;
        d.busyT = 0;
        d.done = false;
        d.peekT = opt.peek ? Math.max(1.2, opt.peek - (d.round - 1) * .35) : 0;
        d.movesLeft = opt.moveSlack ? sets + opt.moveSlack : null;
        build(g);
        g.set('Round', d.round);
        g.set('Moves', 0);
        g.set(opt.setLabel, '0/' + sets);
        if (d.movesLeft != null) g.set('Moves left', d.movesLeft);
      }

      function init(g) {
        var d = g.data;
        d.round = 1;
        d.totalSets = 0;
        if (opt.clock) { d.clockT = opt.clock; g.set('Time', opt.clock); }
        deal(g);
        g.set('Score', 0);
      }

      function build(g) {
        var d = g.data;
        var wrap = column(10);
        var grid = tileGrid(opt.cols, cellW, 8);
        cards = [];
        for (var i = 0; i < d.deck.length; i++) {
          var b = tileBtn('aspect-ratio:' + aspect + ';border:0;border-radius:10px;cursor:pointer;' +
            'padding:0;font-size:' + font + ';line-height:1;display:grid;place-items:center;' +
            'color:#fff;background:' + opt.back + ';' +
            'transition:background .18s,transform .15s,opacity .2s');
          b.dataset.i = i;
          grid.appendChild(b);
          cards.push(b);
        }
        grid.addEventListener('click', function (e) {
          var b = e.target.closest('button');
          if (b) flip(g, +b.dataset.i);
        });
        wrap.appendChild(grid);
        wrap.appendChild(hintEl(opt.hint));
        g.root.innerHTML = '';
        g.root.appendChild(wrap);
        paint(g);
      }

      function paint(g) {
        var d = g.data;
        for (var i = 0; i < d.deck.length; i++) {
          var b = cards[i];
          var matched = d.found.indexOf(i) !== -1;
          var open = matched || d.flipped.indexOf(i) !== -1 || d.peekT > 0;
          if (opt.tones) {
            b.textContent = open ? '♪' : '';
            b.style.background = matched ? 'hsl(' + (d.deck[i] * 45) + ',60%,42%)' :
              open ? BASE : opt.back;
          } else {
            b.textContent = open ? d.deck[i] : '';
            b.style.background = matched ? GOOD : open ? BASE : opt.back;
          }
          b.style.opacity = matched ? '.7' : '1';
          b.style.transform = open && !matched ? 'scale(1.04)' : 'scale(1)';
          b.style.cursor = open ? 'default' : 'pointer';
        }
      }

      function flip(g, i) {
        var d = g.data;
        if (g.state !== 'play' || d.done || d.busyT > 0 || d.peekT > 0) return;
        if (d.flipped.indexOf(i) !== -1 || d.found.indexOf(i) !== -1) return;
        if (d.flipped.length >= opt.match) return;
        d.flipped.push(i);
        if (opt.tones) Milo.sound.tone({ f: d.freqs[d.deck[i]], d: .38, v: .14, type: 'sine' });
        else Milo.sound.blip();
        paint(g);
        if (d.flipped.length < opt.match) return;

        d.moves++;
        g.set('Moves', d.moves);
        if (d.movesLeft != null) { d.movesLeft--; g.set('Moves left', d.movesLeft); }

        var v0 = d.deck[d.flipped[0]], ok = true;
        for (var k = 1; k < d.flipped.length; k++)
          if (d.deck[d.flipped[k]] !== v0) ok = false;

        if (ok) {
          d.found = d.found.concat(d.flipped);
          d.flipped = [];
          d.totalSets++;
          Milo.sound.coin();
          g.set(opt.setLabel, (d.found.length / opt.match) + '/' + sets);
          if (opt.clock) { g.score += 25; g.set('Score', U.fmt(g.score)); }
          paint(g);
          if (d.found.length === d.deck.length) cleared(g);
          else if (d.movesLeft != null && d.movesLeft <= 0) fail(g);
        } else {
          d.busyT = flipDelay(d);
          Milo.sound.tone({ f: 190, d: .12, v: .06, type: 'square' });
        }
      }

      function cleared(g) {
        var d = g.data;
        if (opt.clock) {
          g.score += 150;
          g.set('Score', U.fmt(g.score));
          Milo.sound.powerup();
          d.round++;
          deal(g);
          return;
        }
        d.done = true;
        var earned, txt;
        if (opt.moveSlack) {
          earned = 120 + d.movesLeft * 35 + (d.round - 1) * 40;
          txt = 'Cleared with ' + d.movesLeft + ' move' + (d.movesLeft === 1 ? '' : 's') +
            ' to spare — +' + U.fmt(earned) + ' points. Next peek is shorter.';
        } else {
          earned = Math.round(Math.max(sets * 8, sets * 60 - (d.moves - sets) * 15 - d.time * 2) *
            (1 + (d.round - 1) * .25));
          txt = d.moves + ' tries in ' + U.time(d.time) + ' — +' + U.fmt(earned) + ' points. ' +
            (opt.tones ? 'Next round the notes sit closer together.' :
              'Next round mismatches flip back faster.');
        }
        g.score += earned;
        g.set('Score', U.fmt(g.score));
        Milo.sound.win();
        var nb = Milo.store.setBest(opt.id, g.score);
        g.best = Milo.store.best(opt.id);
        d.round++;
        g.overlay({
          emo: opt.emo,
          title: opt.match === 3 ? 'All triples found!' : 'All pairs found!',
          text: txt,
          score: g.score,
          best: g.best,
          newBest: nb,
          actions: [
            { label: 'Round ' + d.round + ' →', primary: true, onClick: function () { g.clearOverlay(); deal(g); } },
            { label: 'Start over', onClick: function () { g.restart(); } }
          ]
        });
      }

      function fail(g) {
        var d = g.data;
        if (d.done) return;
        d.done = true;
        g.gameOver({
          emo: opt.emo, title: 'Out of moves',
          text: 'You matched ' + (d.found.length / opt.match) + ' of ' + sets +
            ' pairs on board ' + d.round + '.'
        });
      }

      function update(g, dt) {
        var d = g.data;
        if (d.done) return;
        d.time += dt;
        if (d.peekT > 0) {
          d.peekT -= dt;
          if (d.peekT <= 0) { Milo.sound.click(); paint(g); }
        }
        if (d.busyT > 0) {
          d.busyT -= dt;
          if (d.busyT <= 0) {
            d.flipped = [];
            paint(g);
            if (d.movesLeft != null && d.movesLeft <= 0) fail(g);
          }
        }
        if (opt.clock) {
          d.clockT -= dt;
          g.set('Time', Math.max(0, Math.ceil(d.clockT)));
          if (d.clockT <= 0) {
            d.done = true;
            g.gameOver({
              emo: opt.emo, title: 'Time\'s up!',
              text: 'You matched ' + d.totalSets + ' pair' + (d.totalSets === 1 ? '' : 's') +
                ' across ' + d.round + ' board' + (d.round === 1 ? '' : 's') + '.'
            });
          }
        }
      }

      return Milo.domGame(host, {
        id: opt.id,
        stats: opt.stats,
        bg: opt.bg || '#111536',
        emo: opt.emo,
        start: { title: opt.title, text: opt.startText, keys: ['Click a card'] },
        init: init,
        update: update
      });
    };
  }

  /* ------------------------------------------------- digit span engine */
  /* Number Recall (forward) and Backwards Digits (reversed) share this. */

  function digitGame(opt) {
    return function mount(host) {
      var Milo = window.Milo, U = Milo.util;
      var row, msg;

      function gen(len) {
        var s = '' + U.randInt(1, 9);
        while (s.length < len) {
          var c = '' + U.randInt(0, 9);
          if (c !== s.charAt(s.length - 1)) s += c;
        }
        return s;
      }
      function rev(s) { return s.split('').reverse().join(''); }

      function startRound(g) {
        var d = g.data;
        d.num = gen(d.len);
        d.typed = '';
        d.phase = 'flash';
        d.t = .5 + d.len * (opt.reverse ? .65 : .55);
        msg.textContent = 'Memorise…';
        msg.style.color = '#a8b0d8';
        renderRow(g);
        g.set('Span', d.len);
      }

      function renderRow(g) {
        var d = g.data;
        row.innerHTML = '';
        var target = opt.reverse ? rev(d.num) : d.num;
        var w = d.len > 8 ? 36 : d.len > 6 ? 42 : 50;
        for (var i = 0; i < d.len; i++) {
          var s = document.createElement('div');
          s.textContent = d.phase === 'flash' ? d.num.charAt(i) :
            d.phase === 'reveal' ? target.charAt(i) : (d.typed.charAt(i) || '');
          s.style.cssText = 'width:' + w + 'px;height:' + (w + 14) + 'px;border-radius:10px;' +
            'display:grid;place-items:center;font-weight:800;line-height:1;' +
            'font-size:' + Math.round(w * .56) + 'px;color:#fff;background:' +
            (d.phase === 'reveal' ? '#7f1d1d' :
              d.phase === 'flash' ? 'linear-gradient(140deg,#0e7490,#155e75)' : BASE);
          row.appendChild(s);
        }
      }

      function type(g, ch) {
        var d = g.data;
        if (g.state !== 'play' || d.phase !== 'input') return;
        if (ch === '<') {
          if (d.typed.length) {
            d.typed = d.typed.slice(0, -1);
            Milo.sound.click();
            renderRow(g);
          }
          return;
        }
        if (d.typed.length >= d.len) return;
        d.typed += ch;
        Milo.sound.tone({ f: 520 + (+ch) * 40, d: .07, v: .07, type: 'triangle' });
        renderRow(g);
        if (d.typed.length === d.len) check(g);
      }

      function check(g) {
        var d = g.data;
        var target = opt.reverse ? rev(d.num) : d.num;
        if (d.typed === target) {
          var pts = d.len * 10;
          g.score += pts;
          g.set('Score', U.fmt(g.score));
          Milo.sound.coin();
          msg.textContent = 'Correct! +' + pts;
          msg.style.color = '#34d399';
          d.best = Math.max(d.best, d.len);
          d.len++;
          d.phase = 'gap';
          d.t = .8;
        } else {
          d.lives--;
          g.set('Lives', Math.max(0, d.lives));
          Milo.sound.hit();
          d.phase = 'reveal';
          d.t = 2.0;
          msg.textContent = opt.reverse ? (d.num + ' backwards is ' + target) : ('It was ' + d.num);
          msg.style.color = '#fb7185';
          renderRow(g);
          if (d.lives <= 0) {
            d.phase = 'over';
            g.gameOver({
              emo: opt.emo, title: 'Memory full',
              text: 'Best span this run: ' + d.best + ' digit' + (d.best === 1 ? '' : 's') + '.'
            });
          }
        }
      }

      function build(g) {
        var wrap = column(14);
        msg = mkMsg();
        row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap;' +
          'min-height:66px;max-width:94vw';
        var pad = document.createElement('div');
        pad.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:8px;' +
          'width:min(78vw,260px)';
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '<', '0', ''].forEach(function (k) {
          var b = document.createElement('button');
          b.type = 'button';
          b.textContent = k === '<' ? '⌫' : k;
          b.style.cssText = 'height:56px;border:0;border-radius:12px;font-size:22px;' +
            'font-weight:800;color:#fff;cursor:pointer;background:' +
            (k === '' ? 'transparent' : k === '<' ? '#3b2f63' : '#252b57');
          if (k === '') b.disabled = true;
          else b.addEventListener('click', function () { type(g, k); });
          pad.appendChild(b);
        });
        wrap.appendChild(msg);
        wrap.appendChild(row);
        wrap.appendChild(pad);
        wrap.appendChild(hintEl(opt.hint));
        g.root.innerHTML = '';
        g.root.appendChild(wrap);
      }

      function init(g) {
        var d = g.data;
        d.len = opt.startLen;
        d.lives = 3;
        d.best = 0;
        build(g);
        startRound(g);
        g.set('Lives', 3);
        g.set('Score', 0);
      }

      return Milo.domGame(host, {
        id: opt.id,
        stats: ['Span', 'Lives', 'Score'],
        bg: '#101433',
        emo: opt.emo,
        start: { title: opt.title, text: opt.startText, keys: ['0–9', '⌫'] },
        init: init,
        onKey: function (g, e) {
          var m = /^(?:Digit|Numpad)(\d)$/.exec(e.code);
          if (m) type(g, m[1]);
          else if (e.code === 'Backspace') type(g, '<');
        },
        update: function (g, dt) {
          var d = g.data;
          if (d.phase === 'flash') {
            d.t -= dt;
            if (d.t <= 0) {
              d.phase = 'input';
              msg.textContent = opt.reverse ? 'Type it BACKWARDS' : 'Type it back';
              msg.style.color = '#dfe5ff';
              renderRow(g);
            }
          } else if (d.phase === 'gap' || d.phase === 'reveal') {
            d.t -= dt;
            if (d.t <= 0 && d.lives > 0) startRound(g);
          }
        }
      });
    };
  }

  /* ------------------------------------------------------- Grid Flash */
  /* Cells light up all at ONCE (a snapshot, not a sequence like Memory
     Sequence) and you tap them back in any order. */

  function gridFlashMount(host) {
    var Milo = window.Milo, U = Milo.util;
    var cells = [], msg;
    var LIT = 'linear-gradient(140deg,#f43f5e,#a855f7)';

    function sizeFor(level) { return level < 5 ? 3 : level < 10 ? 4 : 5; }

    function startRound(g) {
      var d = g.data;
      var N = sizeFor(d.level);
      var idx = [];
      for (var i = 0; i < N * N; i++) idx.push(i);
      d.pattern = U.shuffle(idx).slice(0, Math.min(N * N - 2, 2 + d.level));
      d.N = N;
      d.hits = [];
      d.phase = 'show';
      d.t = .8 + d.pattern.length * .14;
      build(g);
      msg.textContent = 'Memorise the pattern…';
    }

    function build(g) {
      var d = g.data;
      var wrap = column(12);
      msg = mkMsg();
      var cw = d.N === 5 ? 70 : d.N === 4 ? 80 : 92;
      var grid = tileGrid(d.N, cw, 8);
      cells = [];
      for (var i = 0; i < d.N * d.N; i++) {
        var b = tileBtn('aspect-ratio:1/1;border:0;border-radius:12px;cursor:pointer;' +
          'background:' + BASE + ';transition:background .12s,transform .12s');
        b.dataset.i = i;
        grid.appendChild(b);
        cells.push(b);
      }
      grid.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (b) tap(g, +b.dataset.i);
      });
      wrap.appendChild(msg);
      wrap.appendChild(grid);
      wrap.appendChild(hintEl('The pattern shows all at once. Tap every lit cell back — any order.'));
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
      paint(g);
    }

    function paint(g) {
      var d = g.data;
      for (var i = 0; i < cells.length; i++) {
        var lit = d.phase === 'show' && d.pattern.indexOf(i) !== -1;
        var hit = d.hits.indexOf(i) !== -1;
        cells[i].style.background = hit ? GOOD : lit ? LIT : BASE;
        cells[i].style.transform = lit || hit ? 'scale(1.05)' : 'scale(1)';
      }
    }

    function tap(g, i) {
      var d = g.data;
      if (g.state !== 'play' || d.phase !== 'input') return;
      if (d.hits.indexOf(i) !== -1) return;
      if (d.pattern.indexOf(i) !== -1) {
        d.hits.push(i);
        Milo.sound.tone({ f: 420 + d.hits.length * 60, d: .1, v: .08, type: 'sine' });
        paint(g);
        if (d.hits.length === d.pattern.length) {
          var pts = d.pattern.length * 10;
          g.score += pts;
          g.set('Score', U.fmt(g.score));
          Milo.sound.coin();
          d.level++;
          g.set('Level', d.level);
          d.phase = 'gap';
          d.t = .55;
          msg.textContent = 'Got it! +' + pts;
        }
      } else {
        d.lives--;
        g.set('Lives', Math.max(0, d.lives));
        Milo.sound.hit();
        cells[i].style.background = '#7f1d1d';
        if (d.lives <= 0) {
          d.phase = 'over';
          g.gameOver({
            emo: '💡', title: 'Pattern lost',
            text: 'You reached level ' + d.level + ' — ' + d.pattern.length + ' cells in one glance.'
          });
        } else {
          d.phase = 'show';
          d.t = .9 + d.pattern.length * .14;
          d.hits = [];
          msg.textContent = 'Watch again…';
          paint(g);
        }
      }
    }

    function init(g) {
      var d = g.data;
      d.level = 1;
      d.lives = 3;
      startRound(g);
      g.set('Level', 1);
      g.set('Lives', 3);
      g.set('Score', 0);
    }

    return Milo.domGame(host, {
      id: 'mem-grid-flash',
      stats: ['Level', 'Lives', 'Score'],
      bg: '#12102e',
      emo: '💡',
      start: {
        title: 'Grid Flash',
        text: 'A pattern of cells lights up all at once, then vanishes. Tap every lit cell ' +
          'back, in any order. The pattern grows each level — and so does the grid.',
        keys: ['Click the cells']
      },
      init: init,
      update: function (g, dt) {
        var d = g.data;
        if (d.phase === 'show') {
          d.t -= dt;
          if (d.t <= 0) {
            d.phase = 'input';
            msg.textContent = 'Tap every lit cell (any order)';
            paint(g);
          }
        } else if (d.phase === 'gap') {
          d.t -= dt;
          if (d.t <= 0) startRound(g);
        }
      }
    });
  }

  /* ----------------------------------------------------- What Changed? */

  var WCPOOL = ['🍎', '🚗', '🐸', '🎈', '⚽', '🌙', '🍩', '🦊', '🎧', '🌵',
    '🚀', '🐙', '🍕', '🔑', '🎲', '🌻', '🐝', '🧊', '🎁', '🐳',
    '🍇', '🛸', '🦋', '🍄', '⭐', '🧲', '🎪', '🎹', '🐢', '🌈',
    '🥨', '🔔', '🔭', '🦖', '🍦', '⚓', '🎯', '🧸', '🥝', '🌂'];

  function whatChangedMount(host) {
    var Milo = window.Milo, U = Milo.util;
    var cells = [], msg;

    function sizeFor(round) { return round < 4 ? 3 : round < 9 ? 4 : 5; }

    function startRound(g) {
      var d = g.data;
      d.N = sizeFor(d.round);
      var n = d.N * d.N;
      var pool = U.shuffle(WCPOOL.slice());
      d.board = pool.slice(0, n);
      d.newIcon = pool[n];
      d.changed = U.randInt(0, n - 1);
      d.phase = 'study';
      d.t = Math.max(1.2, 3.2 - (d.round - 1) * .2);
      d.findT = 0;
      d.flashI = null;
      d.flashT = 0;
      build(g);
      msg.textContent = 'Study the grid…';
    }

    function build(g) {
      var d = g.data;
      var wrap = column(12);
      msg = mkMsg();
      var cw = d.N === 5 ? 70 : d.N === 4 ? 80 : 92;
      var grid = tileGrid(d.N, cw, 8);
      cells = [];
      for (var i = 0; i < d.N * d.N; i++) {
        var b = tileBtn('aspect-ratio:1/1;border:0;border-radius:12px;cursor:pointer;' +
          'font-size:clamp(20px,4.4vw,34px);line-height:1;display:grid;place-items:center;' +
          'background:' + BASE + ';transition:background .12s');
        b.dataset.i = i;
        grid.appendChild(b);
        cells.push(b);
      }
      grid.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (b) tap(g, +b.dataset.i);
      });
      wrap.appendChild(msg);
      wrap.appendChild(grid);
      wrap.appendChild(hintEl('After the blink, exactly one picture is different. Tap it.'));
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
      paint(g);
    }

    function paint(g) {
      var d = g.data;
      for (var i = 0; i < cells.length; i++) {
        var b = cells[i];
        if (d.phase === 'blink') {
          b.textContent = '';
          b.style.background = 'linear-gradient(140deg,#3b2f63,#232a58)';
        } else {
          b.textContent = (d.phase === 'find' || d.phase === 'gap') && i === d.changed ?
            d.newIcon : d.board[i];
          b.style.background = d.phase === 'gap' && i === d.changed ? GOOD : BASE;
        }
      }
    }

    function tap(g, i) {
      var d = g.data;
      if (g.state !== 'play' || d.phase !== 'find') return;
      if (i === d.changed) {
        var pts = 40 + d.round * 10 + Math.max(0, 30 - Math.floor(d.findT * 5));
        g.score += pts;
        g.set('Score', U.fmt(g.score));
        Milo.sound.coin();
        d.phase = 'gap';
        d.t = 1.0;
        d.round++;
        g.set('Round', d.round);
        msg.textContent = '+' + pts + ' — the ' + d.board[d.changed] + ' became ' + d.newIcon;
        paint(g);
      } else {
        d.lives--;
        g.set('Lives', Math.max(0, d.lives));
        Milo.sound.hit();
        d.flashI = i;
        d.flashT = .35;
        cells[i].style.background = '#7f1d1d';
        if (d.lives <= 0) {
          d.phase = 'over';
          g.gameOver({
            emo: '👀', title: 'Missed it',
            text: 'The ' + d.board[d.changed] + ' had turned into ' + d.newIcon +
              '. You spotted ' + (d.round - 1) + ' change' + (d.round - 1 === 1 ? '' : 's') + '.'
          });
        }
      }
    }

    function init(g) {
      var d = g.data;
      d.round = 1;
      d.lives = 3;
      startRound(g);
      g.set('Round', 1);
      g.set('Lives', 3);
      g.set('Score', 0);
    }

    return Milo.domGame(host, {
      id: 'mem-what-changed',
      stats: ['Round', 'Lives', 'Score'],
      bg: '#171027',
      emo: '👀',
      start: {
        title: 'What Changed?',
        text: 'Study the pictures. The tiles blink face-down for a moment, and exactly one ' +
          'comes back different — tap it. Grids grow and study time shrinks as you go.',
        keys: ['Click the odd tile']
      },
      init: init,
      update: function (g, dt) {
        var d = g.data;
        if (d.flashT > 0) {
          d.flashT -= dt;
          if (d.flashT <= 0 && d.flashI != null) {
            if (d.phase === 'find') cells[d.flashI].style.background = BASE;
            d.flashI = null;
          }
        }
        if (d.phase === 'study') {
          d.t -= dt;
          if (d.t <= 0) {
            d.phase = 'blink';
            d.t = .7;
            msg.textContent = '…';
            paint(g);
          }
        } else if (d.phase === 'blink') {
          d.t -= dt;
          if (d.t <= 0) {
            d.phase = 'find';
            msg.textContent = 'One tile changed — tap it!';
            paint(g);
          }
        } else if (d.phase === 'find') {
          d.findT += dt;
        } else if (d.phase === 'gap') {
          d.t -= dt;
          if (d.t <= 0) startRound(g);
        }
      }
    });
  }

  /* ------------------------------------------------------- Cup Shuffle */

  function cupsMount(host) {
    var Milo = window.Milo, U = Milo.util;
    var area, cupEls = [], ballEl, msg;

    function cupCount(round) { return Math.min(5, 3 + (round >= 4 ? 1 : 0) + (round >= 8 ? 1 : 0)); }
    function leftPct(slot, count) { return ((slot + .5) / count * 100) + '%'; }

    function startRound(g) {
      var d = g.data;
      d.count = cupCount(d.round);
      d.swapsLeft = 3 + d.round;
      d.spd = Math.max(.18, .58 - d.round * .045);
      d.slotOf = [];
      for (var i = 0; i < d.count; i++) d.slotOf[i] = i;
      d.ballCup = U.randInt(0, d.count - 1);
      d.phase = 'reveal';
      d.t = 1.2;
      build(g);
      msg.textContent = 'Watch where the ball is…';
    }

    function setBall(g) {
      var d = g.data;
      ballEl.style.left = leftPct(d.slotOf[d.ballCup], d.count);
    }

    function liftCup(i, up) {
      cupEls[i].style.transform = up ? 'translate(-50%,-84px)' : 'translateX(-50%)';
    }

    function build(g) {
      var d = g.data;
      var wrap = column(10);
      msg = mkMsg();
      area = document.createElement('div');
      area.style.cssText = 'position:relative;width:min(94vw,560px);height:250px';
      var floor = document.createElement('div');
      floor.style.cssText = 'position:absolute;left:2%;right:2%;bottom:14px;height:10px;' +
        'border-radius:6px;background:' + BASE;
      area.appendChild(floor);
      ballEl = document.createElement('div');
      ballEl.style.cssText = 'position:absolute;bottom:26px;width:34px;height:34px;' +
        'border-radius:50%;transform:translateX(-50%);transition:opacity .2s;' +
        'background:radial-gradient(circle at 32% 30%,#fda4af,#e11d48 65%)';
      area.appendChild(ballEl);
      cupEls = [];
      var cw = d.count >= 5 ? 66 : 86;
      for (var i = 0; i < d.count; i++) {
        (function (ci) {
          var c = document.createElement('button');
          c.type = 'button';
          c.setAttribute('aria-label', 'Cup ' + (ci + 1));
          c.style.cssText = 'position:absolute;bottom:24px;width:' + cw + 'px;height:118px;' +
            'border:0;cursor:pointer;padding:0;left:' + leftPct(d.slotOf[ci], d.count) + ';' +
            'transform:translate(-50%,-84px);' +
            'background:linear-gradient(180deg,#d97706,#92400e 70%,#7c2d12);' +
            'clip-path:polygon(16% 0,84% 0,100% 100%,0 100%);' +
            'transition:left .5s ease-in-out,transform .28s ease';
          c.addEventListener('click', function () { guess(g, ci); });
          area.appendChild(c);
          cupEls.push(c);
        })(i);
      }
      setBall(g);
      ballEl.style.opacity = '1';
      wrap.appendChild(msg);
      wrap.appendChild(area);
      wrap.appendChild(hintEl('Track the cup with the ball. Shuffles get faster and longer each round.'));
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function doSwap(g) {
      var d = g.data;
      var i = U.randInt(0, d.count - 1), j = U.randInt(0, d.count - 1);
      while (j === i) j = U.randInt(0, d.count - 1);
      var t = d.slotOf[i]; d.slotOf[i] = d.slotOf[j]; d.slotOf[j] = t;
      var tr = 'left ' + d.spd + 's ease-in-out,transform .28s ease';
      cupEls[i].style.transition = tr;
      cupEls[j].style.transition = tr;
      cupEls[i].style.zIndex = 3;
      cupEls[j].style.zIndex = 2;
      cupEls[i].style.left = leftPct(d.slotOf[i], d.count);
      cupEls[j].style.left = leftPct(d.slotOf[j], d.count);
      Milo.sound.tone({ f: 240, d: .05, v: .045, type: 'triangle' });
    }

    function guess(g, ci) {
      var d = g.data;
      if (g.state !== 'play' || d.phase !== 'guess') return;
      d.phase = 'result';
      liftCup(ci, true);
      liftCup(d.ballCup, true);
      setBall(g);
      ballEl.style.opacity = '1';
      if (ci === d.ballCup) {
        var pts = 20 + d.round * 10;
        g.score += pts;
        g.set('Score', U.fmt(g.score));
        Milo.sound.coin();
        msg.textContent = 'Found it! +' + pts;
        d.round++;
        g.set('Round', d.round);
        d.t = 1.0;
      } else {
        d.lives--;
        g.set('Lives', Math.max(0, d.lives));
        Milo.sound.hit();
        msg.textContent = 'Empty — it was over there.';
        if (d.lives <= 0) {
          d.phase = 'over';
          g.gameOver({
            emo: '🥤', title: 'Lost the ball',
            text: 'You tracked it through ' + (d.round - 1) + ' round' +
              (d.round - 1 === 1 ? '' : 's') + ' of shuffling.'
          });
          return;
        }
        d.t = 1.4;
      }
    }

    function init(g) {
      var d = g.data;
      d.round = 1;
      d.lives = 3;
      startRound(g);
      g.set('Round', 1);
      g.set('Lives', 3);
      g.set('Score', 0);
    }

    return Milo.domGame(host, {
      id: 'mem-cups-shuffle',
      stats: ['Round', 'Lives', 'Score'],
      bg: '#1a1208',
      emo: '🥤',
      start: {
        title: 'Cup Shuffle',
        text: 'A ball goes under one cup, then the cups shuffle — faster and longer every ' +
          'round, with extra cups joining later. Click the cup hiding the ball.',
        keys: ['Click a cup']
      },
      init: init,
      update: function (g, dt) {
        var d = g.data;
        if (d.phase === 'reveal') {
          d.t -= dt;
          if (d.t <= 0) {
            d.phase = 'drop';
            d.t = .5;
            for (var i = 0; i < cupEls.length; i++) liftCup(i, false);
          }
        } else if (d.phase === 'drop') {
          d.t -= dt;
          if (d.t <= 0) {
            ballEl.style.opacity = '0';
            d.phase = 'shuffle';
            d.t = .2;
            msg.textContent = 'Keep your eye on it…';
          }
        } else if (d.phase === 'shuffle') {
          d.t -= dt;
          if (d.t <= 0) {
            if (d.swapsLeft > 0) {
              doSwap(g);
              d.swapsLeft--;
              d.t = d.spd + .08;
            } else {
              d.phase = 'guess';
              msg.textContent = 'Which cup hides the ball?';
            }
          }
        } else if (d.phase === 'result') {
          d.t -= dt;
          if (d.t <= 0) startRound(g);
        }
      }
    });
  }

  /* ------------------------------------------------------- Path Recall */

  function pathMount(host) {
    var Milo = window.Milo, U = Milo.util;
    var cells = [], msg;
    var TRAIL = 'linear-gradient(140deg,#14b8a6,#0d9488)';
    var HEAD = 'linear-gradient(140deg,#a3e635,#4ade80)';

    function sizeFor(level) { return level < 5 ? 4 : level < 10 ? 5 : 6; }

    function genPath(N, L) {
      for (var tries = 0; tries < 400; tries++) {
        var visited = {}, path = [];
        var x = U.randInt(0, N - 1), y = U.randInt(0, N - 1);
        path.push(y * N + x);
        visited[y * N + x] = 1;
        while (path.length < L) {
          var dirs = U.shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]]);
          var moved = false;
          for (var k = 0; k < 4; k++) {
            var nx = x + dirs[k][0], ny = y + dirs[k][1];
            if (nx < 0 || ny < 0 || nx >= N || ny >= N || visited[ny * N + nx]) continue;
            x = nx; y = ny;
            path.push(y * N + x);
            visited[y * N + x] = 1;
            moved = true;
            break;
          }
          if (!moved) break;
        }
        if (path.length === L) return path;
      }
      return null;
    }

    function startRound(g, replay) {
      var d = g.data;
      d.N = sizeFor(d.level);
      if (!replay) {
        var L = Math.min(2 + d.level, Math.floor(d.N * d.N * .7));
        var p = null;
        while (!p && L > 2) { p = genPath(d.N, L); if (!p) L--; }
        d.path = p || [0, 1, 2];
      }
      d.phase = 'draw';
      d.shown = 0;
      d.stepT = .25;
      d.step = Math.max(.22, .46 - d.level * .015);
      d.idx = 0;
      build(g);
      msg.textContent = 'Watch the path…';
    }

    function build(g) {
      var d = g.data;
      var wrap = column(12);
      msg = mkMsg();
      var cw = d.N === 6 ? 60 : d.N === 5 ? 70 : 84;
      var grid = tileGrid(d.N, cw, 7);
      cells = [];
      for (var i = 0; i < d.N * d.N; i++) {
        var b = tileBtn('aspect-ratio:1/1;border:0;border-radius:10px;cursor:pointer;' +
          'font-size:clamp(14px,3vw,22px);font-weight:800;color:#fff;line-height:1;' +
          'display:grid;place-items:center;background:' + BASE +
          ';transition:background .12s');
        b.dataset.i = i;
        grid.appendChild(b);
        cells.push(b);
      }
      grid.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (b) tap(g, +b.dataset.i);
      });
      wrap.appendChild(msg);
      wrap.appendChild(grid);
      wrap.appendChild(hintEl('Retrace the route in order, starting from the ringed cell.'));
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
      paint(g);
    }

    function paint(g) {
      var d = g.data, i, c;
      for (i = 0; i < cells.length; i++) {
        cells[i].textContent = '';
        cells[i].style.background = BASE;
        cells[i].style.boxShadow = 'none';
      }
      if (d.phase === 'draw') {
        for (i = 0; i < d.shown; i++) {
          c = cells[d.path[i]];
          c.style.background = i === d.shown - 1 ? HEAD : TRAIL;
        }
      } else if (d.phase === 'input' || d.phase === 'gap') {
        for (i = 0; i < d.idx; i++) {
          c = cells[d.path[i]];
          c.style.background = GOOD;
          c.textContent = i + 1;
        }
        if (d.phase === 'input' && d.idx === 0)
          cells[d.path[0]].style.boxShadow = 'inset 0 0 0 3px #34d399';
      }
    }

    function tap(g, i) {
      var d = g.data;
      if (g.state !== 'play' || d.phase !== 'input') return;
      var pos = d.path.indexOf(i);
      if (pos !== -1 && pos < d.idx) return;
      if (i === d.path[d.idx]) {
        d.idx++;
        Milo.sound.tone({ f: 360 + d.idx * 35, d: .09, v: .08, type: 'sine' });
        paint(g);
        if (d.idx === d.path.length) {
          var pts = d.path.length * 12;
          g.score += pts;
          g.set('Score', U.fmt(g.score));
          Milo.sound.coin();
          d.level++;
          g.set('Level', d.level);
          d.phase = 'gap';
          d.t = .7;
          msg.textContent = 'Path complete! +' + pts;
        }
      } else {
        d.lives--;
        g.set('Lives', Math.max(0, d.lives));
        Milo.sound.hit();
        if (d.lives <= 0) {
          d.phase = 'over';
          g.gameOver({
            emo: '🗺️', title: 'Lost the trail',
            text: 'You reached level ' + d.level + ' — a ' + d.path.length + '-step route.'
          });
        } else {
          msg.textContent = 'Wrong turn — watch it again…';
          startRound(g, true);
        }
      }
    }

    function init(g) {
      var d = g.data;
      d.level = 1;
      d.lives = 3;
      startRound(g);
      g.set('Level', 1);
      g.set('Lives', 3);
      g.set('Score', 0);
    }

    return Milo.domGame(host, {
      id: 'mem-path-recall',
      stats: ['Level', 'Lives', 'Score'],
      bg: '#0e1a1a',
      emo: '🗺️',
      start: {
        title: 'Path Recall',
        text: 'A route draws itself through the grid, step by step, then disappears. ' +
          'Retrace it in order from the ringed start cell. Wrong turns cost a life ' +
          'and replay the route.',
        keys: ['Click the cells']
      },
      init: init,
      update: function (g, dt) {
        var d = g.data;
        if (d.phase === 'draw') {
          d.stepT -= dt;
          if (d.stepT > 0) return;
          if (d.shown < d.path.length) {
            d.shown++;
            Milo.sound.tone({ f: 300 + d.shown * 26, d: .1, v: .06, type: 'sine' });
            d.stepT = d.shown === d.path.length ? .55 : d.step;
            paint(g);
          } else {
            d.phase = 'input';
            d.idx = 0;
            paint(g);
            msg.textContent = 'Retrace it — start at the ringed cell';
          }
        } else if (d.phase === 'gap') {
          d.t -= dt;
          if (d.t <= 0) startRound(g);
        }
      }
    });
  }

  /* ------------------------------------------------------ registrations */

  var ANIMALS = ['🐶', '🐱', '🦊', '🐸', '🐼', '🦁', '🐷', '🐵',
    '🐰', '🐨', '🐯', '🦉', '🐺', '🦒', '🐮', '🐔'];
  var FOOD = ['🍕', '🍔', '🍟', '🌮', '🍣', '🍩', '🍎', '🍓', '🥑', '🌽',
    '🧀', '🥐', '🍪', '🍿', '🥕', '🍇', '🍉', '🍋', '🍒', '🥞'];
  var SYMBOLS = ['★', '✦', '◆', '●', '▲', '■', '♠', '♣', '♥', '♦', '☯', '♻',
    '⚓', '❄', '✳', '⚙', '♞', '☂', '♬', '☾', '☀', '✿', '❖', '♛'];
  var TRAVEL = ['🗼', '🗽', '🚀', '✈️', '🚂', '🚗', '🚢', '⛵', '🎡', '🏰', '🗻',
    '⛺', '🌋', '🏖️', '🚁', '🛶', '🚠', '🎢', '🌁', '🗿', '🏝️', '🚲'];
  var TIMEDSET = ['💎', '🍒', '🔥', '🌟', '🍀', '⚡', '🎵', '❤️', '🔔', '🍇', '🌈', '🎲'];
  var TRIPLESET = ['🌟', '🍀', '🎈', '🐬', '🍭', '🚁', '🦋', '🍩',
    '🐢', '🎺', '🌵', '🛸', '🧸', '🍉', '⚡', '🎩'];
  var PEEKSET = ['🍯', '🦜', '⛄', '🎳', '🌮', '🚦', '🎪', '🧁', '🐞', '🌊', '🎹', '🔑'];

  var Milo = window.Milo;
  var ENDLESS = ['Round', 'Moves', 'Pairs', 'Score'];

  Milo.register({
    id: 'mem-animals', title: 'Animal Pairs', emo: '🐾', category: 'Casual',
    tagline: 'Eight animal pairs on a friendly 4×4',
    description: 'The classic pairs game with an all-animal deck: 16 cards, 8 pairs, drawn ' +
      'from a bigger pool so every board is a different zoo. It trains spatial location ' +
      'memory — remembering WHERE you saw a face, not just that you saw it. Rounds bank ' +
      'points for speed and accuracy, and mismatched cards flip back faster every round. ' +
      'Tip: when a pair misses, stare at both cards until they turn — that shrinking ' +
      'flip-back window is the whole difficulty curve.',
    controls: ['Click a card'],
    colors: ['#f59e0b', '#84cc16'],
    tags: ['memory', 'pairs', 'animals', 'relaxing'],
    mount: pairGame({
      id: 'mem-animals', emo: '🐾', title: 'Animal Pairs',
      cols: 4, rows: 4, match: 2, icons: ANIMALS, setLabel: 'Pairs',
      back: 'linear-gradient(140deg,#f59e0b,#b45309)', bg: '#171129',
      stats: ENDLESS,
      startText: 'Sixteen cards, eight animal pairs. Flip two at a time and remember where ' +
        'everyone lives — each cleared round, mismatches flip back a little faster.',
      hint: 'Match the animal pairs. Fewer moves score more.'
    })
  });

  Milo.register({
    id: 'mem-food', title: 'Food Pairs', emo: '🍔', category: 'Casual',
    tagline: 'Ten tasty pairs — capacity training',
    description: 'Twenty cards and ten food pairs push you past the seven-or-so locations ' +
      'most people can comfortably hold, so this board trains visual working-memory ' +
      'capacity. Rounds bank points for few moves and fast clears, and the flip-back ' +
      'window shrinks each round. Tip: sweep the board in the same fixed order every ' +
      'time — a consistent scan builds a mental map far faster than random flipping.',
    controls: ['Click a card'],
    colors: ['#ef4444', '#f97316'],
    tags: ['memory', 'pairs', 'food', 'brain'],
    mount: pairGame({
      id: 'mem-food', emo: '🍔', title: 'Food Pairs',
      cols: 5, rows: 4, match: 2, icons: FOOD, setLabel: 'Pairs',
      back: 'linear-gradient(140deg,#ef4444,#b91c1c)', bg: '#1a0f14',
      stats: ENDLESS,
      startText: 'Twenty cards, ten food pairs — just past what a memory holds comfortably. ' +
        'Clear the board; each new round the mismatches flip back faster.',
      hint: 'Match the food pairs. Fewer moves score more.'
    })
  });

  Milo.register({
    id: 'mem-symbols', title: 'Symbol Pairs', emo: '🔷', category: 'Casual',
    tagline: 'Fifteen abstract pairs you can\'t put names to',
    description: 'Thirty cards of abstract symbols — stars, glyphs and suits with no easy ' +
      'names. Most people secretly beat pairs games by naming cards in their head; symbols ' +
      'resist that, so this board trains pure visual memory instead of verbal labelling. ' +
      'Fifteen pairs, with a flip-back window that tightens every cleared round. Tip: ' +
      'invent a silly name for each symbol the moment you see it and the board gets ' +
      'dramatically easier — that IS the skill.',
    controls: ['Click a card'],
    colors: ['#8b5cf6', '#ec4899'],
    tags: ['memory', 'pairs', 'symbols', 'brain'],
    mount: pairGame({
      id: 'mem-symbols', emo: '🔷', title: 'Symbol Pairs',
      cols: 6, rows: 5, match: 2, icons: SYMBOLS, setLabel: 'Pairs',
      back: 'linear-gradient(140deg,#8b5cf6,#6d28d9)', bg: '#160f2c',
      stats: ENDLESS,
      startText: 'Thirty cards of abstract symbols with no easy names — pure visual memory, ' +
        'no naming tricks. Fifteen pairs to find.',
      hint: 'Match the symbol pairs. Fewer moves score more.'
    })
  });

  Milo.register({
    id: 'mem-travel', title: 'Travel Pairs', emo: '🧳', category: 'Casual',
    tagline: 'The 36-card marathon board',
    description: 'The marathon: 36 cards, 18 landmark-and-vehicle pairs, the biggest board ' +
      'in the pack. Sheer size is the difficulty — it trains sustained concentration and ' +
      'memory endurance, because the cards you saw first are twenty flips stale by the ' +
      'time you need them. Scoring rewards low move counts, and every cleared round speeds ' +
      'up the flip-back. Tip: clear the corners first, while your memory of them is fresh.',
    controls: ['Click a card'],
    colors: ['#0ea5e9', '#6366f1'],
    tags: ['memory', 'pairs', 'marathon', 'travel', 'brain'],
    mount: pairGame({
      id: 'mem-travel', emo: '🧳', title: 'Travel Pairs',
      cols: 6, rows: 6, match: 2, icons: TRAVEL, setLabel: 'Pairs',
      back: 'linear-gradient(140deg,#0ea5e9,#4338ca)', bg: '#0d1430',
      stats: ENDLESS,
      startText: 'The marathon board: 36 cards, 18 pairs of landmarks and vehicles. Pace ' +
        'yourself — endurance is the whole game here.',
      hint: 'The big one — 18 pairs. Fewer moves score more.'
    })
  });

  Milo.register({
    id: 'mem-pairs-timed', title: 'Pairs: 60 Seconds', emo: '⏱️', category: 'Casual',
    tagline: 'Clear boards against a hard 60-second clock',
    description: 'A 4×4 pairs board against a hard 60-second clock — no pauses, no time ' +
      'top-ups. Boards redeal instantly when cleared (+150 a board, +25 a pair), so the ' +
      'run is really about recall speed under pressure. Guessing costs nothing but time, ' +
      'which is the one thing you do not have. Tip: two deliberate flips beat three ' +
      'frantic ones — panic is what actually loses this game.',
    controls: ['Click a card'],
    colors: ['#dc2626', '#facc15'],
    tags: ['memory', 'pairs', 'timed', 'reflex'],
    mount: pairGame({
      id: 'mem-pairs-timed', emo: '⏱️', title: 'Pairs: 60 Seconds',
      cols: 4, rows: 4, match: 2, icons: TIMEDSET, setLabel: 'Pairs',
      clock: 60,
      back: 'linear-gradient(140deg,#dc2626,#7f1d1d)', bg: '#1c0d12',
      stats: ['Score', 'Time', 'Pairs'],
      startText: 'Sixty seconds on a hard clock. +25 a pair, +150 for every board you ' +
        'clear — boards redeal instantly, so keep matching until the buzzer.',
      hint: '60 seconds. Cleared boards redeal instantly — keep going.'
    })
  });

  Milo.register({
    id: 'mem-triples', title: 'Triple Match', emo: '🎴', category: 'Casual',
    tagline: 'Three of a kind or nothing',
    description: 'Twenty-four cards hiding eight sets of three — a set only stays up when ' +
      'all three match. Holding two open locations in mind while hunting a third trains ' +
      'multi-item binding: keeping several places active in working memory at once. A ' +
      'wrong third card flips all three back down, and the reveal window shortens each ' +
      'cleared round. Tip: don\'t chase a third card blind — spend your first flip of a ' +
      'turn exploring unknown cards, and only complete sets you already know.',
    controls: ['Click a card'],
    colors: ['#10b981', '#3b82f6'],
    tags: ['memory', 'triples', 'matching', 'brain'],
    mount: pairGame({
      id: 'mem-triples', emo: '🎴', title: 'Triple Match',
      cols: 6, rows: 4, match: 3, icons: TRIPLESET, setLabel: 'Triples',
      back: 'linear-gradient(140deg,#10b981,#047857)', bg: '#0d1a15',
      stats: ['Round', 'Moves', 'Triples', 'Score'],
      startText: 'Match THREE of a kind — all three cards of a turn must agree or they all ' +
        'flip back. Eight triples on the board.',
      hint: 'Flip three at a time. All three must match to stay.'
    })
  });

  Milo.register({
    id: 'mem-number-recall', title: 'Number Recall', emo: '🔢', category: 'Casual',
    tagline: 'How many digits can you hold?',
    description: 'A number flashes on screen, then disappears — type it back from memory. ' +
      'Every correct answer adds a digit, which makes this a straight digit-span test: it ' +
      'trains verbal working memory, the mental notepad you use for phone numbers and door ' +
      'codes. Three lives; a miss shows the answer and retries the same length. Tip: chunk ' +
      'the digits into pairs (say "forty-seven, twelve", not "4-7-1-2") — chunking is how ' +
      'memory athletes stretch their span.',
    controls: ['0–9', 'Backspace', 'Tap the keypad'],
    colors: ['#22d3ee', '#0f766e'],
    tags: ['memory', 'numbers', 'digit span', 'brain'],
    mount: digitGame({
      id: 'mem-number-recall', emo: '🔢', title: 'Number Recall',
      reverse: false, startLen: 3,
      startText: 'A number flashes, then vanishes — type it back. Each success adds a ' +
        'digit. Three lives; a miss shows the answer and retries the same length.',
      hint: 'Type on your keyboard or tap the pad. It checks when the last digit lands.'
    })
  });

  Milo.register({
    id: 'mem-backwards-digits', title: 'Backwards Digits', emo: '🔁', category: 'Casual',
    tagline: 'Type the number back — reversed',
    description: 'A number flashes, and you must type it back REVERSED — see 528, answer ' +
      '825. Reversing means storing the digits and mentally rewriting them, so this trains ' +
      'working-memory manipulation (executive function), not just storage — it is the ' +
      'harder half of a real cognitive test battery. Length grows with every success, ' +
      'three lives. Tip: picture the digits sitting on a shelf and read the shelf ' +
      'right-to-left — visualising beats juggling them verbally.',
    controls: ['0–9', 'Backspace', 'Tap the keypad'],
    colors: ['#7c3aed', '#22d3ee'],
    tags: ['memory', 'numbers', 'digit span', 'brain', 'hard'],
    mount: digitGame({
      id: 'mem-backwards-digits', emo: '🔁', title: 'Backwards Digits',
      reverse: true, startLen: 2,
      startText: 'A number flashes — type it back BACKWARDS. See 528, answer 825. Each ' +
        'success adds a digit; three lives.',
      hint: 'Reverse it in your head, then type. It checks when the last digit lands.'
    })
  });

  Milo.register({
    id: 'mem-grid-flash', title: 'Grid Flash', emo: '💡', category: 'Casual',
    tagline: 'One glance, then tap the pattern back',
    description: 'A set of cells lights up all at once — a snapshot, not a sequence — then ' +
      'vanishes; tap every lit cell back, in any order. That single-glance layout trains ' +
      'visuospatial snapshot memory, a different muscle from the one sequence games use. ' +
      'The pattern grows every level and the grid itself widens from 3×3 to 5×5, with ' +
      'three lives and a re-show after each miss. Tip: don\'t memorise cells, memorise the ' +
      'shape they make — an L, a zigzag, a smile.',
    controls: ['Click the cells'],
    colors: ['#f43f5e', '#a855f7'],
    tags: ['memory', 'pattern', 'grid', 'brain'],
    mount: gridFlashMount
  });

  Milo.register({
    id: 'mem-what-changed', title: 'What Changed?', emo: '👀', category: 'Casual',
    tagline: 'Blink and one tile is different',
    description: 'Study a grid of pictures, the tiles blink face-down for a moment, and ' +
      'exactly one comes back different — tap it. This trains change detection, the ' +
      'attention-to-detail skill that spots the moved coffee cup in puzzle pages. Grids ' +
      'grow from 3×3 to 5×5 and study time shrinks every round; wrong taps cost one of ' +
      'three lives. Tip: naming a few anchor tiles ("frog top-left, rocket centre") makes ' +
      'the odd one out jump straight at you.',
    controls: ['Click the odd tile'],
    colors: ['#fb923c', '#e11d48'],
    tags: ['memory', 'observation', 'spot the difference', 'brain'],
    mount: whatChangedMount
  });

  Milo.register({
    id: 'mem-cups-shuffle', title: 'Cup Shuffle', emo: '🥤', category: 'Casual',
    tagline: 'Follow the ball through the shuffle',
    description: 'A ball goes under one cup, the cups shuffle, and you point to where it ' +
      'ended up. Every round adds swaps and speeds them up, with a fourth and fifth cup ' +
      'joining later — pure object tracking and sustained visual attention, since blinking ' +
      'at the wrong moment is fatal. Three lives; a correct pick is worth more the deeper ' +
      'you get. Tip: lock your eyes on the ball\'s cup and let the others blur — tracking ' +
      'one thing is easy, tracking three is impossible.',
    controls: ['Click a cup'],
    colors: ['#b45309', '#fbbf24'],
    tags: ['memory', 'tracking', 'attention', 'classic'],
    mount: cupsMount
  });

  Milo.register({
    id: 'mem-path-recall', title: 'Path Recall', emo: '🗺️', category: 'Casual',
    tagline: 'Retrace the vanished route',
    description: 'A route draws itself step by step through the grid, then disappears — ' +
      'retrace it in order from the ringed start cell. Order is everything, so this trains ' +
      'sequential route memory, the skill that gets you back out of a multi-storey car ' +
      'park. Paths grow with your level and the grid widens from 4×4 to 6×6; a wrong turn ' +
      'costs a life and replays the route. Tip: memorise it as turns ("up, up, right, ' +
      'down"), not as squares.',
    controls: ['Click the cells'],
    colors: ['#14b8a6', '#84cc16'],
    tags: ['memory', 'path', 'route', 'grid', 'brain'],
    mount: pathMount
  });

  Milo.register({
    id: 'mem-tone-pairs', title: 'Tone Pairs', emo: '🎵', category: 'Casual',
    tagline: 'Match pairs by sound alone',
    description: 'Every card looks identical — flipping one plays a note, and pairs match ' +
      'by SOUND alone, so turn your volume on. This is auditory memory training: holding ' +
      'pitches in your head and binding them to places, with no pictures to lean on. Each ' +
      'cleared round squeezes the eight notes closer together in pitch, which is where it ' +
      'gets genuinely hard. Tip: hum the note you\'re hunting for while you search — ' +
      'matching a pitch you\'re producing is far easier than one you\'re remembering.',
    controls: ['Click a card', '🔊 sound on'],
    colors: ['#6d28d9', '#f472b6'],
    tags: ['memory', 'sound', 'audio', 'pairs', 'music'],
    mount: pairGame({
      id: 'mem-tone-pairs', emo: '🎵', title: 'Tone Pairs',
      cols: 4, rows: 4, match: 2, tones: true, setLabel: 'Pairs',
      back: 'linear-gradient(140deg,#6d28d9,#a21caf)', bg: '#160b26',
      stats: ENDLESS,
      startText: 'Turn your sound ON. Every card looks the same — each plays a note when ' +
        'flipped, and you match the pairs by ear. Later rounds move the notes closer ' +
        'together in pitch.',
      hint: 'Sound on! Cards are identical — match the notes by ear.'
    })
  });

  Milo.register({
    id: 'mem-card-peek', title: 'Card Peek', emo: '👁️', category: 'Casual',
    tagline: 'Three seconds to learn the whole board',
    description: 'Every card is dealt face-up for three seconds — memorise the layout — ' +
      'then they all flip down and you must clear the board on a strict move budget ' +
      '(pairs + 5 attempts). The peek makes it a test of deliberate encoding under a ' +
      'deadline: how much layout can you commit to memory on purpose, at speed? Each ' +
      'cleared round shortens the peek. Tip: spend the peek on positions, not pictures — ' +
      '"matching pair in the corners" survives the flip better than a list of icons.',
    controls: ['Click a card'],
    colors: ['#334155', '#38bdf8'],
    tags: ['memory', 'pairs', 'peek', 'brain', 'hard'],
    mount: pairGame({
      id: 'mem-card-peek', emo: '👁️', title: 'Card Peek',
      cols: 4, rows: 4, match: 2, icons: PEEKSET, setLabel: 'Pairs',
      peek: 3, moveSlack: 5,
      back: 'linear-gradient(140deg,#475569,#1e293b)', bg: '#0f1626',
      stats: ['Score', 'Moves left', 'Pairs'],
      startText: 'All sixteen cards show for three seconds — memorise everything — then ' +
        'they flip down and you get just 13 attempts to clear 8 pairs. The peek gets ' +
        'shorter every round.',
      hint: 'Memorise during the peek. Every two-card attempt spends one move.'
    })
  });
})();
