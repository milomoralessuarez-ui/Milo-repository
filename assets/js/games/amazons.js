/* Game of the Amazons — move a queen, then burn a square with an arrow.
   Run your opponent out of moves. */
(function () {
  'use strict';

  var N = 10, SZ = 100;
  var EMPTY = 0, YOU = 1, CPU = 2, FIRE = 3;
  var DIR = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

  function startBoard() {
    var b = new Int8Array(SZ), i;
    var you = [[9, 3], [9, 6], [6, 0], [6, 9]];     // d1, g1, a4, j4
    var cpu = [[0, 3], [0, 6], [3, 0], [3, 9]];     // d10, g10, a7, j7
    for (i = 0; i < 4; i++) b[you[i][0] * N + you[i][1]] = YOU;
    for (i = 0; i < 4; i++) b[cpu[i][0] * N + cpu[i][1]] = CPU;
    return b;
  }

  /** Every square a queen at `from` can slide to, treating `ignore` as empty. */
  function rays(b, from, ignore) {
    var out = [], x = from % N, y = (from / N) | 0, k;
    for (k = 0; k < 8; k++) {
      var cx = x + DIR[k][0], cy = y + DIR[k][1];
      while (cx >= 0 && cy >= 0 && cx < N && cy < N) {
        var i = cy * N + cx;
        if (b[i] !== EMPTY && i !== ignore) break;
        out.push(i);
        cx += DIR[k][0]; cy += DIR[k][1];
      }
    }
    return out;
  }

  function amazons(b, who) {
    var out = [];
    for (var i = 0; i < SZ; i++) if (b[i] === who) out.push(i);
    return out;
  }

  /** True when `who` still has a queen that can move at all. */
  function hasMove(b, who) {
    var qs = amazons(b, who), i;
    for (i = 0; i < qs.length; i++) if (rays(b, qs[i], -1).length) return true;
    return false;
  }

  function mobility(b, who) {
    var qs = amazons(b, who), n = 0, i;
    for (i = 0; i < qs.length; i++) n += rays(b, qs[i], -1).length;
    return n;
  }

  /* Queen-move distance from every amazon of one side to every empty square.
     This is the classic Amazons territory measure: whoever reaches a square in
     fewer moves owns it. */
  var distBuf = [new Int8Array(SZ), new Int8Array(SZ)];
  function fillDist(b, who, buf) {
    buf.fill(127);
    var q = [], i, k, qs = amazons(b, who);
    for (i = 0; i < qs.length; i++) { buf[qs[i]] = 0; q.push(qs[i]); }
    var head = 0;
    while (head < q.length) {
      var p = q[head++], d = buf[p];
      var x = p % N, y = (p / N) | 0;
      for (k = 0; k < 8; k++) {
        var cx = x + DIR[k][0], cy = y + DIR[k][1];
        while (cx >= 0 && cy >= 0 && cx < N && cy < N) {
          var t = cy * N + cx;
          if (b[t] !== EMPTY) break;
          if (buf[t] > d + 1) { buf[t] = d + 1; q.push(t); }
          cx += DIR[k][0]; cy += DIR[k][1];
        }
      }
    }
  }

  /** Positive favours the CPU. */
  function evaluate(b) {
    fillDist(b, CPU, distBuf[0]);
    fillDist(b, YOU, distBuf[1]);
    var terr = 0, i;
    for (i = 0; i < SZ; i++) {
      if (b[i] !== EMPTY) continue;
      var a = distBuf[0][i], d = distBuf[1][i];
      if (a < d) terr += 1;
      else if (d < a) terr -= 1;          // squares both reach together count for neither
    }
    var mc = mobility(b, CPU), my = mobility(b, YOU);
    return terr * 12 + (mc - my) * 0.8;
  }

  function applyTurn(b, from, to, shot) {
    var nb = Int8Array.from(b);
    nb[to] = nb[from];
    nb[from] = EMPTY;
    nb[shot] = FIRE;
    return nb;
  }

  function mount(host) {
    var Milo = window.Milo;
    var cellEls = [], statusEl, undoBtn;

    function elm(tag, css, txt) {
      var e = document.createElement(tag);
      if (css) e.style.cssText = css;
      if (txt != null) e.textContent = txt;
      return e;
    }
    function button(label, fn) {
      var b = elm('button', 'font:600 .82rem/1 Outfit,system-ui,sans-serif;padding:8px 14px;' +
        'border-radius:9px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.09);' +
        'color:#f4e9ff;cursor:pointer', label);
      b.type = 'button';
      b.addEventListener('click', fn);
      return b;
    }

    function build(g) {
      var wrap = elm('div', 'display:flex;flex-direction:column;align-items:center;gap:9px');
      var board = elm('div', 'display:grid;grid-template-columns:repeat(10,1fr);gap:2px;' +
        'background:#2a1c3d;padding:5px;border-radius:10px;' +
        'width:min(90vw,min(58vh,470px));aspect-ratio:1');
      cellEls = [];
      for (var i = 0; i < SZ; i++) {
        var c = elm('button', 'border:0;padding:0;border-radius:3px;cursor:pointer;' +
          'display:grid;place-items:center;font:700 clamp(10px,2.6vw,22px)/1 Outfit,system-ui,sans-serif;' +
          'transition:background .1s');
        c.type = 'button';
        (function (idx) { c.addEventListener('click', function () { clickCell(g, idx); }); })(i);
        board.appendChild(c);
        cellEls.push(c);
      }
      statusEl = elm('div', 'color:#efe4ff;font:600 .85rem/1.35 Outfit,system-ui,sans-serif;' +
        'text-align:center;min-height:2.4em;max-width:32em');
      var bar = elm('div', 'display:flex;gap:8px');
      undoBtn = button('Undo', function () { undo(g); });
      bar.appendChild(undoBtn);
      wrap.appendChild(board);
      wrap.appendChild(statusEl);
      wrap.appendChild(bar);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function reset(g) {
      var d = g.data;
      d.b = startBoard();
      d.turn = YOU;
      d.sel = null;
      d.moved = null;        // the square the queen has just landed on, awaiting its arrow
      d.over = false;
      d.busy = false;
      d.hist = [];
      d.plies = 0;
      d.msg = 'Pick one of your amazons. You move it like a queen, then shoot an arrow.';
      build(g);
      paint(g);
    }

    function paint(g) {
      var d = g.data, i;
      var mine = !d.over && d.turn === YOU && !d.busy && g.state === 'play';
      var targets = [];
      if (mine) {
        if (d.moved !== null) targets = rays(d.b, d.moved, -1);
        else if (d.sel !== null) targets = rays(d.b, d.sel, -1);
      }
      var movable = {};
      if (mine && d.sel === null && d.moved === null) {
        var qs = amazons(d.b, YOU);
        for (i = 0; i < qs.length; i++) if (rays(d.b, qs[i], -1).length) movable[qs[i]] = 1;
      }

      for (i = 0; i < SZ; i++) {
        var v = d.b[i], c = cellEls[i];
        var light = ((i % N) + ((i / N) | 0)) % 2 === 0;
        var bg = light ? '#4a3766' : '#3d2c57';
        if (v === FIRE) bg = '#1a1320';
        if (targets.indexOf(i) !== -1) bg = d.moved !== null ? '#a13b5e' : '#2f8f62';
        else if (i === d.sel || i === d.moved) bg = '#c99a2e';
        else if (movable[i]) bg = light ? '#5b4480' : '#4d3a6e';
        c.style.background = bg;
        c.textContent = v === YOU ? '♛' : v === CPU ? '♛' : v === FIRE ? '✖' : '';
        c.style.color = v === YOU ? '#6fe3ff' : v === CPU ? '#ff9a6f' : '#6b5580';
        c.style.cursor = (movable[i] || targets.indexOf(i) !== -1) ? 'pointer' : 'default';
      }
      g.set('Your moves', mobility(d.b, YOU));
      g.set('CPU moves', mobility(d.b, CPU));
      g.set('Turn', d.over ? '—' : (d.turn === YOU ? 'Yours' : 'CPU'));
      statusEl.textContent = d.msg;
      if (undoBtn) {
        undoBtn.disabled = !d.hist.length || d.over;
        undoBtn.style.opacity = undoBtn.disabled ? .45 : 1;
      }
    }

    function clickCell(g, i) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.busy || d.turn !== YOU) return;

      if (d.moved !== null) {                       // second half of the turn: the arrow
        if (rays(d.b, d.moved, -1).indexOf(i) === -1) {
          d.msg = 'The arrow flies like a queen from the amazon you just moved. Pick a red square.';
          paint(g);
          return;
        }
        d.b[i] = FIRE;
        d.moved = null;
        Milo.sound.tone({ f: 620, f2: 180, d: .14, v: .07, type: 'sawtooth' });
        finishTurn(g, YOU);
        return;
      }

      if (d.sel !== null && rays(d.b, d.sel, -1).indexOf(i) !== -1) {
        d.hist.push(Int8Array.from(d.b));
        if (d.hist.length > 30) d.hist.shift();
        d.b[i] = YOU;
        d.b[d.sel] = EMPTY;
        d.sel = null;
        d.moved = i;
        d.msg = 'Now shoot: pick a red square for the arrow. It burns away for good.';
        Milo.sound.tone({ f: 440, f2: 520, d: .08, v: .06, type: 'triangle' });
        paint(g);
        return;
      }

      if (d.b[i] === YOU) {
        if (!rays(d.b, i, -1).length) {
          d.msg = 'That amazon is walled in — she has nowhere to go.';
        } else {
          d.sel = i;
          d.msg = 'Green squares are where she can go.';
          Milo.sound.blip();
        }
      } else {
        d.sel = null;
        d.msg = 'Pick one of your own amazons.';
      }
      paint(g);
    }

    function finishTurn(g, who) {
      var d = g.data;
      d.plies++;
      var next = who === YOU ? CPU : YOU;
      if (!hasMove(d.b, next)) { finish(g, who); return; }
      d.turn = next;
      d.msg = (who === YOU ? 'You shot. ' : 'CPU moved and shot. ') +
        'You have ' + mobility(d.b, YOU) + ' moves, the CPU ' + mobility(d.b, CPU) + '.';
      paint(g);
      if (next === CPU) {
        d.busy = true;
        setTimeout(function () { cpuTurn(g); }, 300);
      }
    }

    function undo(g) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.busy || !d.hist.length) return;
      d.b = d.hist.pop();
      d.turn = YOU;
      d.sel = null;
      d.moved = null;
      d.msg = 'Took your turn back.';
      Milo.sound.blip();
      paint(g);
    }

    function finish(g, winner) {
      var d = g.data;
      d.over = true;
      var loser = winner === YOU ? 'The CPU' : 'You';
      var why = loser + ' had no amazon left that could move, and in Amazons the player ' +
        'who cannot move loses.';
      d.msg = why;
      paint(g);
      var burnt = 0;
      for (var i = 0; i < SZ; i++) if (d.b[i] === FIRE) burnt++;
      if (winner === YOU) {
        g.win({ emo: '🏹', title: 'The CPU is walled in — you win', text: why,
          score: Math.max(200, 900 - burnt * 6) });
      } else {
        g.gameOver({ emo: '🏹', title: 'You have nowhere left to go', text: why,
          score: Math.max(0, mobility(d.b, YOU) * 5 + burnt * 4) });
      }
    }

    /* ------------------------------------------------------------- the AI */

    /** Generate turns, roughly ranked, keeping the list small enough to score. */
    function candidates(b, who, keep, dStep, sStep) {
      var qs = amazons(b, who), out = [], i, j, k;
      dStep = dStep || 1; sStep = sStep || 1;
      for (i = 0; i < qs.length; i++) {
        var dests = rays(b, qs[i], -1);
        for (j = 0; j < dests.length; j += dStep) {
          var to = dests[j];
          var nb = Int8Array.from(b);
          nb[to] = nb[qs[i]];
          nb[qs[i]] = EMPTY;
          var shots = rays(nb, to, -1);
          for (k = 0; k < shots.length; k += sStep) {
            out.push({ f: qs[i], t: to, s: shots[k] });
          }
        }
      }
      // Cheap first pass: how much room the move leaves each side.
      var them = who === YOU ? CPU : YOU, scored = [];
      for (i = 0; i < out.length; i++) {
        var c = out[i];
        var nb2 = applyTurn(b, c.f, c.t, c.s);
        var v = mobility(nb2, who) - mobility(nb2, them) * 1.15;
        scored.push({ c: c, v: v });
      }
      scored.sort(function (p, q) { return q.v - p.v; });
      return scored.slice(0, keep).map(function (e) { return e.c; });
    }

    function cpuTurn(g) {
      var d = g.data;
      d.busy = false;
      if (g.state !== 'play' || d.over) return;
      var cands = candidates(d.b, CPU, 22, 1, 2), i, best = null;
      if (!cands.length) { finish(g, YOU); return; }

      var deadline = Date.now() + 500;
      for (i = 0; i < cands.length; i++) {
        var nb = applyTurn(d.b, cands[i].f, cands[i].t, cands[i].s);
        var v;
        if (!hasMove(nb, YOU)) v = 1e6;                       // an immediate win
        else {
          v = evaluate(nb);
          if (Date.now() < deadline) {
            // Let the player answer with their best few and take the worst case.
            var reply = candidates(nb, YOU, 6, 3, 4), worst = null, j;
            for (j = 0; j < reply.length; j++) {
              var rb = applyTurn(nb, reply[j].f, reply[j].t, reply[j].s);
              var rv = hasMove(rb, CPU) ? evaluate(rb) : -1e6;
              if (worst === null || rv < worst) worst = rv;
            }
            if (worst !== null) v = (v + worst * 2) / 3;
          }
        }
        v += Math.random() * 1.5;
        if (!best || v > best.v) best = { v: v, c: cands[i] };
      }

      var c2 = best.c;
      d.b = applyTurn(d.b, c2.f, c2.t, c2.s);
      Milo.sound.tone({ f: 300, f2: 380, d: .08, v: .06, type: 'triangle' });
      Milo.sound.tone({ f: 520, f2: 160, d: .13, v: .06, type: 'sawtooth' });
      finishTurn(g, CPU);
    }

    return Milo.domGame(host, {
      id: 'amazons',
      stats: ['Your moves', 'CPU moves', 'Turn'],
      bg: '#180f26',
      emo: '🏹',
      start: {
        title: 'Game of the Amazons',
        text: 'Each turn has two halves: move one of your four amazons like a chess queen, ' +
          'then shoot a burning arrow from where she landed, also like a queen. The square ' +
          'it hits is destroyed for the rest of the game. Nothing is ever captured — you ' +
          'win by walling the other side in until they cannot move at all.',
        keys: ['Click an amazon', 'Click a green square', 'Click a red square']
      },
      init: reset
    });
  }

  window.Milo.register({
    id: 'amazons', title: 'Game of the Amazons', emo: '🏹', category: 'Strategy',
    tagline: 'Move like a queen, then burn a square away forever',
    description: 'A 10×10 game with four amazons a side and no captures at all. Move one ' +
      'amazon any distance along a queen line, then fire an arrow from her new square along ' +
      'another queen line; wherever it lands is burned out permanently and blocks everything ' +
      'from then on. The board shrinks every single turn, and the player who cannot move ' +
      'loses. The CPU judges positions the way strong Amazons programs do — counting which ' +
      'empty squares each side can reach first — so it will quietly fence off a region and ' +
      'leave you rattling around in a smaller one.',
    controls: ['Click an amazon', 'Click a green square', 'Click a red square', 'Undo'],
    colors: ['#4a3766', '#6fe3ff'],
    tags: ['board game', 'abstract', 'vs cpu', 'territory', 'strategy'],
    mount: mount
  });
})();
