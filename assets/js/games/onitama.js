/* Onitama — 5x5, five movement cards, and the card you use is the card you
   hand over. Take the master or reach their temple arch. */
(function () {
  'use strict';

  var N = 5;
  /* The full 16-card base deck. Offsets are [dx, dy] seen from the blue
     player at the bottom of the board; dy is negative going forward. */
  var DECK = [
    { n: 'Tiger',    m: [[0, -2], [0, 1]] },
    { n: 'Dragon',   m: [[-2, -1], [2, -1], [-1, 1], [1, 1]] },
    { n: 'Frog',     m: [[-2, 0], [-1, -1], [1, 1]] },
    { n: 'Rabbit',   m: [[1, -1], [2, 0], [-1, 1]] },
    { n: 'Crab',     m: [[0, -1], [-2, 0], [2, 0]] },
    { n: 'Elephant', m: [[-1, -1], [1, -1], [-1, 0], [1, 0]] },
    { n: 'Goose',    m: [[-1, -1], [-1, 0], [1, 0], [1, 1]] },
    { n: 'Rooster',  m: [[1, -1], [1, 0], [-1, 0], [-1, 1]] },
    { n: 'Monkey',   m: [[-1, -1], [1, -1], [-1, 1], [1, 1]] },
    { n: 'Mantis',   m: [[-1, -1], [1, -1], [0, 1]] },
    { n: 'Horse',    m: [[0, -1], [-1, 0], [0, 1]] },
    { n: 'Ox',       m: [[0, -1], [1, 0], [0, 1]] },
    { n: 'Crane',    m: [[0, -1], [-1, 1], [1, 1]] },
    { n: 'Boar',     m: [[0, -1], [-1, 0], [1, 0]] },
    { n: 'Eel',      m: [[-1, -1], [-1, 1], [1, 0]] },
    { n: 'Cobra',    m: [[1, -1], [1, 1], [-1, 0]] }
  ];

  // 1 = blue student, 2 = blue master, 3 = red student, 4 = red master.
  var BLUE = 1, RED = 2;
  function side(v) { return v === 0 ? 0 : (v <= 2 ? BLUE : RED); }
  function isMaster(v) { return v === 2 || v === 4; }
  // The arch each side is trying to reach: blue runs at red's, and vice versa.
  var ARCH = {};
  ARCH[BLUE] = 0 * N + 2;
  ARCH[RED] = 4 * N + 2;

  /** Every legal move for `who`, as {from, to, card} (card = index in hand). */
  function moves(b, hand, who) {
    var out = [], i, k, c;
    var flip = who === BLUE ? 1 : -1;
    for (i = 0; i < 25; i++) {
      if (side(b[i]) !== who) continue;
      var x = i % N, y = (i / N) | 0;
      for (c = 0; c < hand.length; c++) {
        var mv = DECK[hand[c]].m;
        for (k = 0; k < mv.length; k++) {
          var nx = x + mv[k][0] * flip, ny = y + mv[k][1] * flip;
          if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
          var t = ny * N + nx;
          if (side(b[t]) === who) continue;
          out.push({ from: i, to: t, card: c });
        }
      }
    }
    return out;
  }

  /** Apply a move in place on a copy; returns {b, win} where win is 0/BLUE/RED. */
  function apply(b, mv, who) {
    var nb = Int8Array.from(b);
    var taken = nb[mv.to];
    nb[mv.to] = nb[mv.from];
    nb[mv.from] = 0;
    var win = 0;
    if (isMaster(taken)) win = who;                       // Way of the Stone
    else if (isMaster(nb[mv.to]) && mv.to === ARCH[who]) win = who;  // Way of the Stream
    return { b: nb, win: win, taken: taken };
  }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var cellEls = [], cardEls = { blue: [], red: [], mid: null }, statusEl, undoBtn;

    function elm(tag, css, txt) {
      var e = document.createElement(tag);
      if (css) e.style.cssText = css;
      if (txt != null) e.textContent = txt;
      return e;
    }

    function button(label, fn) {
      var b = elm('button', 'font:600 .82rem/1 Outfit,system-ui,sans-serif;padding:8px 14px;' +
        'border-radius:9px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.09);' +
        'color:#fbeee0;cursor:pointer', label);
      b.type = 'button';
      b.addEventListener('click', fn);
      return b;
    }

    /** A little 5x5 pictogram of a card's moves. */
    function cardFace(idx, forWho) {
      var wrap = elm('div', 'display:grid;grid-template-columns:repeat(5,1fr);gap:1px;width:52px');
      var mv = DECK[idx].m, flip = forWho === BLUE ? 1 : -1, i, marks = {};
      for (i = 0; i < mv.length; i++) {
        var x = 2 + mv[i][0] * flip, y = 2 + mv[i][1] * flip;
        if (x >= 0 && y >= 0 && x < 5 && y < 5) marks[y * 5 + x] = 1;
      }
      for (i = 0; i < 25; i++) {
        var on = i === 12 ? 2 : (marks[i] ? 1 : 0);
        wrap.appendChild(elm('div', 'aspect-ratio:1;border-radius:1px;background:' +
          (on === 2 ? '#2a2018' : on ? (forWho === BLUE ? '#4db5ff' : '#ff7a59') : 'rgba(255,255,255,.12)')));
      }
      return wrap;
    }

    function cardBox(idx, forWho, onClick) {
      var box = elm('div', 'display:flex;flex-direction:column;align-items:center;gap:4px;' +
        'padding:6px 7px;border-radius:9px;border:2px solid transparent;' +
        'background:rgba(255,255,255,.07);min-width:64px');
      box.appendChild(cardFace(idx, forWho));
      box.appendChild(elm('div', 'font:700 .68rem/1 Outfit,system-ui,sans-serif;color:#f3e5d4', DECK[idx].n));
      if (onClick) { box.style.cursor = 'pointer'; box.addEventListener('click', onClick); }
      return box;
    }

    function build(g) {
      var wrap = elm('div', 'display:flex;flex-direction:column;align-items:center;gap:8px');

      var redRow = elm('div', 'display:flex;gap:8px;align-items:center');
      var mid = elm('div', 'display:flex;flex-direction:column;align-items:center;gap:4px');
      var boardRow = elm('div', 'display:flex;gap:10px;align-items:center');
      var blueRow = elm('div', 'display:flex;gap:8px;align-items:center');

      var board = elm('div', 'display:grid;grid-template-columns:repeat(5,1fr);gap:3px;' +
        'background:#3a2a1c;padding:6px;border-radius:10px;width:min(76vw,min(44vh,330px));aspect-ratio:1');
      cellEls = [];
      for (var i = 0; i < 25; i++) {
        var c = elm('button', 'border:0;padding:0;border-radius:4px;cursor:pointer;' +
          'display:grid;place-items:center;font-size:1.3rem;transition:background .12s');
        c.type = 'button';
        (function (idx) { c.addEventListener('click', function () { clickCell(g, idx); }); })(i);
        board.appendChild(c);
        cellEls.push(c);
      }

      cardEls.red = elm('div', 'display:flex;gap:8px');
      cardEls.blue = elm('div', 'display:flex;gap:8px');
      cardEls.mid = mid;
      redRow.appendChild(cardEls.red);
      blueRow.appendChild(cardEls.blue);
      boardRow.appendChild(board);
      boardRow.appendChild(mid);

      statusEl = elm('div', 'color:#f6e7d4;font:600 .85rem/1.35 Outfit,system-ui,sans-serif;' +
        'text-align:center;min-height:2.3em;max-width:30em');
      var bar = elm('div', 'display:flex;gap:8px');
      undoBtn = button('Undo', function () { undo(g); });
      bar.appendChild(undoBtn);

      wrap.appendChild(redRow);
      wrap.appendChild(boardRow);
      wrap.appendChild(blueRow);
      wrap.appendChild(statusEl);
      wrap.appendChild(bar);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function reset(g) {
      var d = g.data;
      var pick = U.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]).slice(0, 5);
      d.b = new Int8Array(25);
      var i;
      for (i = 0; i < 5; i++) { d.b[i] = i === 2 ? 4 : 3; }          // red back row
      for (i = 20; i < 25; i++) { d.b[i] = i === 22 ? 2 : 1; }        // blue back row
      d.hand = {};
      d.hand[BLUE] = [pick[0], pick[1]];
      d.hand[RED] = [pick[2], pick[3]];
      d.mid = pick[4];
      d.turn = (pick[4] % 2 === 0) ? BLUE : RED;                      // the fifth card's stamp
      d.sel = null;
      d.selCard = null;
      d.over = false;
      d.busy = false;
      d.hist = [];
      d.msg = d.turn === BLUE
        ? 'The ' + DECK[d.mid].n + ' card is stamped blue — you start. Pick a card, then a piece.'
        : 'The ' + DECK[d.mid].n + ' card is stamped red — the CPU starts.';
      build(g);
      paint(g);
      if (d.turn === RED) {
        d.busy = true;
        setTimeout(function () { cpuTurn(g); }, 500);
      }
    }

    function legalNow(d) {
      if (d.over || d.turn !== BLUE) return [];
      var all = moves(d.b, d.hand[BLUE], BLUE);
      if (d.selCard === null) return all;
      return all.filter(function (m) { return m.card === d.selCard; });
    }

    function paint(g) {
      var d = g.data, i;
      var legal = legalNow(d);
      var targets = d.sel === null ? [] : legal.filter(function (m) { return m.from === d.sel; })
        .map(function (m) { return m.to; });
      var movable = {};
      legal.forEach(function (m) { movable[m.from] = 1; });

      for (i = 0; i < 25; i++) {
        var v = d.b[i], c = cellEls[i];
        var light = ((i % N) + ((i / N) | 0)) % 2 === 0;
        var bg = light ? '#6f5537' : '#5c4429';
        if (i === ARCH[BLUE]) bg = '#7a4a4a';
        if (i === ARCH[RED]) bg = '#3f5a7a';
        if (targets.indexOf(i) !== -1) bg = '#2f9c68';
        else if (i === d.sel) bg = '#b58a2b';
        else if (movable[i] && d.sel === null) bg = light ? '#7d613f' : '#6a4f30';
        c.style.background = bg;
        c.textContent = v === 1 ? '🔵' : v === 2 ? '🔷' : v === 3 ? '🔴' : v === 4 ? '🔶' : '';
        c.style.cursor = (movable[i] || targets.indexOf(i) !== -1) ? 'pointer' : 'default';
      }

      cardEls.red.innerHTML = '';
      d.hand[RED].forEach(function (ci) { cardEls.red.appendChild(cardBox(ci, RED, null)); });
      cardEls.blue.innerHTML = '';
      d.hand[BLUE].forEach(function (ci, k) {
        var box = cardBox(ci, BLUE, function () { pickCard(g, k); });
        if (d.selCard === k) box.style.borderColor = '#ffd257';
        cardEls.blue.appendChild(box);
      });
      cardEls.mid.innerHTML = '';
      var lab = elm('div', 'font:700 .62rem/1 Outfit,system-ui,sans-serif;color:#c9b69c;text-align:center', 'NEXT');
      cardEls.mid.appendChild(lab);
      cardEls.mid.appendChild(cardBox(d.mid, d.turn, null));

      g.set('Turn', d.over ? '—' : (d.turn === BLUE ? 'Yours' : 'CPU'));
      g.set('Your pieces', countSide(d.b, BLUE));
      g.set('CPU pieces', countSide(d.b, RED));
      statusEl.textContent = d.msg;
      if (undoBtn) {
        undoBtn.disabled = !d.hist.length || d.over;
        undoBtn.style.opacity = undoBtn.disabled ? .45 : 1;
      }
    }

    function countSide(b, who) {
      var n = 0;
      for (var i = 0; i < 25; i++) if (side(b[i]) === who) n++;
      return n;
    }

    function pickCard(g, k) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.turn !== BLUE || d.busy) return;
      d.selCard = d.selCard === k ? null : k;
      d.sel = null;
      d.msg = d.selCard === null ? 'Pick a card, then a piece.'
        : DECK[d.hand[BLUE][d.selCard]].n + ' selected — now pick a piece.';
      Milo.sound.blip();
      paint(g);
    }

    function clickCell(g, i) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.turn !== BLUE || d.busy) return;
      var legal = legalNow(d);
      if (d.sel !== null) {
        var hit = null;
        legal.forEach(function (m) { if (m.from === d.sel && m.to === i && hit === null) hit = m; });
        if (hit) { doMove(g, hit, BLUE); return; }
      }
      if (side(d.b[i]) === BLUE) {
        var any = legal.some(function (m) { return m.from === i; });
        if (!any) {
          d.msg = 'That piece has no move with ' +
            (d.selCard === null ? 'either card' : 'the ' + DECK[d.hand[BLUE][d.selCard]].n) + '.';
        } else {
          d.sel = i;
          d.msg = 'Green squares are where it can go.';
          Milo.sound.blip();
        }
      } else {
        d.sel = null;
      }
      paint(g);
    }

    function snapshot(d) {
      return {
        b: Int8Array.from(d.b), blue: d.hand[BLUE].slice(), red: d.hand[RED].slice(),
        mid: d.mid, turn: d.turn
      };
    }

    function doMove(g, mv, who) {
      var d = g.data;
      if (who === BLUE) {
        d.hist.push(snapshot(d));
        if (d.hist.length > 40) d.hist.shift();
      }
      var res = apply(d.b, mv, who);
      var used = d.hand[who][mv.card];
      d.b = res.b;
      d.hand[who][mv.card] = d.mid;
      d.mid = used;
      d.sel = null; d.selCard = null;
      Milo.sound.tone({ f: who === BLUE ? 480 : 300, f2: who === BLUE ? 360 : 240, d: .08, v: .07, type: 'triangle' });
      if (res.taken) Milo.sound.hit();

      if (res.win) { finish(g, res.win, isMaster(res.taken) ? 'stone' : 'stream'); return; }

      d.turn = who === BLUE ? RED : BLUE;
      if (who === BLUE) {
        d.msg = 'You played the ' + DECK[used].n + '. It goes to the CPU after its turn.';
        d.busy = true;
        paint(g);
        setTimeout(function () { cpuTurn(g); }, 340);
      } else {
        d.msg = 'CPU played the ' + DECK[used].n + '.' + (res.taken ? ' It took a piece.' : '');
        paint(g);
        checkStuck(g);
      }
    }

    /** With no legal move a player must still pass a card to the opponent. */
    function checkStuck(g) {
      var d = g.data;
      d.busy = false;
      if (g.state !== 'play' || d.over) return;
      if (moves(d.b, d.hand[d.turn], d.turn).length) return;
      var who = d.turn;
      var swap = 0;                                  // hand over the lower-value card
      var used = d.hand[who][swap];
      d.hand[who][swap] = d.mid;
      d.mid = used;
      d.turn = who === BLUE ? RED : BLUE;
      d.msg = (who === BLUE ? 'You have' : 'The CPU has') + ' no legal move, so the ' +
        DECK[used].n + ' is passed over instead.';
      Milo.sound.tone({ f: 180, d: .1, v: .06, type: 'square' });
      paint(g);
      if (d.turn === RED) {
        d.busy = true;
        setTimeout(function () { cpuTurn(g); }, 340);
      } else if (!moves(d.b, d.hand[BLUE], BLUE).length) {
        d.busy = true;
        setTimeout(function () { checkStuck(g); }, 340);
      }
    }

    function undo(g) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.busy || !d.hist.length) return;
      var s = d.hist.pop();
      d.b = Int8Array.from(s.b);
      d.hand[BLUE] = s.blue; d.hand[RED] = s.red;
      d.mid = s.mid; d.turn = s.turn;
      d.sel = null; d.selCard = null;
      d.msg = 'Took a move back.';
      Milo.sound.blip();
      paint(g);
    }

    function finish(g, winner, how) {
      var d = g.data;
      d.over = true;
      paint(g);
      var why = how === 'stone'
        ? 'Way of the Stone — the master was captured.'
        : 'Way of the Stream — the master reached the opposing temple arch.';
      if (winner === BLUE) {
        d.msg = 'You win. ' + why;
        paint(g);
        g.win({ emo: '🔷', title: 'You win — ' + (how === 'stone' ? 'Way of the Stone' : 'Way of the Stream'),
          text: why, score: 600 + countSide(d.b, BLUE) * 40 });
      } else {
        d.msg = 'CPU wins. ' + why;
        paint(g);
        g.gameOver({ emo: '🔶', title: 'CPU wins — ' + (how === 'stone' ? 'Way of the Stone' : 'Way of the Stream'),
          text: why, score: countSide(d.b, BLUE) * 45 });
      }
    }

    /* ------------------------------------------------------------- the AI */

    var CENTRE = [
      0, 1, 2, 1, 0,
      1, 3, 4, 3, 1,
      2, 4, 5, 4, 2,
      1, 3, 4, 3, 1,
      0, 1, 2, 1, 0
    ];

    /** Positive favours RED (the CPU). */
    function evaluate(b) {
      var s = 0, i, redMaster = -1, blueMaster = -1;
      for (i = 0; i < 25; i++) {
        var v = b[i];
        if (!v) continue;
        if (v === 1) { s -= 100 + CENTRE[i] * 3 + (4 - ((i / N) | 0)) * 2; }
        else if (v === 2) { blueMaster = i; s -= CENTRE[i]; }
        else if (v === 3) { s += 100 + CENTRE[i] * 3 + (((i / N) | 0)) * 2; }
        else { redMaster = i; s += CENTRE[i]; }
      }
      if (blueMaster < 0) return 9000;
      if (redMaster < 0) return -9000;
      // How close is each master to the arch it is aiming at?
      var rm = { x: redMaster % N, y: (redMaster / N) | 0 };
      var bm = { x: blueMaster % N, y: (blueMaster / N) | 0 };
      s += (4 - Math.max(Math.abs(rm.x - 2), Math.abs(rm.y - 4))) * 4;
      s -= (4 - Math.max(Math.abs(bm.x - 2), Math.abs(bm.y - 0))) * 4;
      return s;
    }

    function terminal(b) {
      var blue = false, red = false;
      for (var i = 0; i < 25; i++) {
        if (b[i] === 2) blue = true;
        if (b[i] === 4) red = true;
      }
      if (!blue) return RED;
      if (!red) return BLUE;
      if (b[ARCH[BLUE]] === 2) return BLUE;
      if (b[ARCH[RED]] === 4) return RED;
      return 0;
    }

    function search(b, hand, who, depth, alpha, beta, deadline) {
      var t = terminal(b);
      if (t === RED) return 9000 + depth;
      if (t === BLUE) return -9000 - depth;
      if (depth <= 0) return evaluate(b);
      if (Date.now() > deadline) return evaluate(b);

      var ms = moves(b, hand[who], who);
      if (!ms.length) {
        // Forced card pass.
        var nh = { };
        nh[BLUE] = hand[BLUE].slice(); nh[RED] = hand[RED].slice();
        var passed = nh[who][0];
        nh[who][0] = hand.mid;
        nh.mid = passed;
        return search(b, nh, who === BLUE ? RED : BLUE, depth - 1, alpha, beta, deadline);
      }
      // Captures first: cheap but effective ordering.
      ms.sort(function (p, q) { return (b[q.to] ? 1 : 0) - (b[p.to] ? 1 : 0); });

      var best = who === RED ? -1e9 : 1e9, i;
      for (i = 0; i < ms.length; i++) {
        var res = apply(b, ms[i], who);
        var nh2 = {};
        nh2[BLUE] = hand[BLUE].slice(); nh2[RED] = hand[RED].slice();
        var used = nh2[who][ms[i].card];
        nh2[who][ms[i].card] = hand.mid;
        nh2.mid = used;
        var v = search(res.b, nh2, who === BLUE ? RED : BLUE, depth - 1, alpha, beta, deadline);
        if (who === RED) {
          if (v > best) best = v;
          if (best > alpha) alpha = best;
        } else {
          if (v < best) best = v;
          if (best < beta) beta = best;
        }
        if (alpha >= beta) break;
      }
      return best;
    }

    function cpuTurn(g) {
      var d = g.data;
      d.busy = false;
      if (g.state !== 'play' || d.over) return;
      var ms = moves(d.b, d.hand[RED], RED);
      if (!ms.length) { checkStuck(g); return; }

      var deadline = Date.now() + 380;
      var best = null, depth;
      for (depth = 2; depth <= 5; depth++) {
        var localBest = null, i;
        for (i = 0; i < ms.length; i++) {
          var res = apply(d.b, ms[i], RED);
          var nh = {};
          nh[BLUE] = d.hand[BLUE].slice(); nh[RED] = d.hand[RED].slice();
          var used = nh[RED][ms[i].card];
          nh[RED][ms[i].card] = d.mid;
          nh.mid = used;
          var v = res.win === RED ? 9999 : search(res.b, nh, BLUE, depth - 1, -1e9, 1e9, deadline);
          v += Math.random() * .4;
          if (!localBest || v > localBest.v) localBest = { mv: ms[i], v: v };
        }
        if (localBest) best = localBest;
        if (Date.now() > deadline || (best && best.v > 8000)) break;
      }
      doMove(g, best.mv, RED);
    }

    return Milo.domGame(host, {
      id: 'onitama',
      stats: ['Turn', 'Your pieces', 'CPU pieces'],
      bg: '#2a1d12',
      emo: '🔷',
      start: {
        title: 'Onitama',
        text: 'Five cards are dealt from a deck of sixteen: two to you, two to the CPU, ' +
          'one in the middle. A card is a movement pattern — play it, then hand it over ' +
          'and take the middle card in its place. Win by capturing the enemy master or ' +
          'walking your own master onto their temple arch.',
        keys: ['Click a card', 'Click a piece', 'Click a green square']
      },
      init: reset
    });
  }

  window.Milo.register({
    id: 'onitama', title: 'Onitama', emo: '🔷', category: 'Strategy',
    tagline: 'Five cards, no hidden information, no luck after the deal',
    description: 'A 5×5 duel with the full 16-card base deck. Each side holds two ' +
      'movement cards and a fifth sits between you; the card you play is given to your ' +
      'opponent and you pick up the middle one, so every move arms the other side. Win ' +
      'the Way of the Stone by capturing the enemy master, or the Way of the Stream by ' +
      'landing your master on their temple arch. The CPU searches several moves deep with ' +
      'alpha-beta, and it will happily trade a student to open a lane to your arch — watch ' +
      'which card you are about to hand over.',
    controls: ['Click a card', 'Click a piece', 'Click a square', 'Undo'],
    colors: ['#6f5537', '#4db5ff'],
    tags: ['board game', 'cards', 'vs cpu', 'strategy', 'abstract'],
    mount: mount
  });
})();
