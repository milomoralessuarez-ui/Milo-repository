/* Quoridor — race your pawn to the far side while fencing the other one in.
   A wall is only legal if both pawns still have a route home. */
(function () {
  'use strict';

  var N = 9, SZ = 81, WALLS = 10;
  var DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  /* Walls live on an 8x8 lattice of slots. A horizontal wall at slot (r,c)
     seals the gap between rows r and r+1 across columns c and c+1; a vertical
     one seals between columns c and c+1 across rows r and r+1. */
  function blocked(H, V, r, c, dr, dc) {
    if (dr === 1) return (c < 8 && H[r * 8 + c]) || (c > 0 && H[r * 8 + c - 1]);
    if (dr === -1) return (c < 8 && H[(r - 1) * 8 + c]) || (c > 0 && H[(r - 1) * 8 + c - 1]);
    if (dc === 1) return (r < 8 && V[r * 8 + c]) || (r > 0 && V[(r - 1) * 8 + c]);
    return (r < 8 && V[r * 8 + c - 1]) || (r > 0 && V[(r - 1) * 8 + c - 1]);
  }

  /** One step from p in direction d, or -1 off the board / through a wall. */
  function step(H, V, p, d) {
    var r = (p / N) | 0, c = p % N, nr = r + d[0], nc = c + d[1];
    if (nr < 0 || nc < 0 || nr >= N || nc >= N) return -1;
    if (blocked(H, V, r, c, d[0], d[1])) return -1;
    return nr * N + nc;
  }

  var bfsSeen = new Uint8Array(SZ), bfsQ = new Int16Array(SZ), bfsD = new Int16Array(SZ);

  /** Shortest number of steps from `from` to any square on `goalRow`, or -1. */
  function dist(H, V, from, goalRow) {
    bfsSeen.fill(0);
    var head = 0, tail = 0;
    bfsQ[tail++] = from; bfsSeen[from] = 1; bfsD[from] = 0;
    while (head < tail) {
      var p = bfsQ[head++];
      if (((p / N) | 0) === goalRow) return bfsD[p];
      for (var k = 0; k < 4; k++) {
        var n = step(H, V, p, DIRS[k]);
        if (n < 0 || bfsSeen[n]) continue;
        bfsSeen[n] = 1; bfsD[n] = bfsD[p] + 1; bfsQ[tail++] = n;
      }
    }
    return -1;
  }

  /** Every square the pawn may step or jump to, with the full jump rules. */
  function pawnMoves(st, who) {
    var me = who === 1 ? st.p : st.a, other = who === 1 ? st.a : st.p, out = [], k, j;
    for (k = 0; k < 4; k++) {
      var d = DIRS[k], n = step(st.H, st.V, me, d);
      if (n < 0) continue;
      if (n !== other) { out.push(n); continue; }
      var n2 = step(st.H, st.V, n, d);
      if (n2 >= 0) { out.push(n2); continue; }     // straight jump over
      for (j = 0; j < 4; j++) {                     // blocked behind: go diagonally
        var e = DIRS[j];
        if (e[0] === d[0] && e[1] === d[1]) continue;
        if (e[0] === -d[0] && e[1] === -d[1]) continue;
        var n3 = step(st.H, st.V, n, e);
        if (n3 >= 0 && n3 !== me) out.push(n3);
      }
    }
    return out;
  }

  /** Slot free of overlaps and crossings — geometry only, no path check. */
  function slotFree(st, r, c, horiz) {
    var i = r * 8 + c;
    if (r < 0 || c < 0 || r > 7 || c > 7) return false;
    if (st.H[i] || st.V[i]) return false;
    if (horiz) {
      if (c > 0 && st.H[i - 1]) return false;
      if (c < 7 && st.H[i + 1]) return false;
    } else {
      if (r > 0 && st.V[i - 8]) return false;
      if (r < 7 && st.V[i + 8]) return false;
    }
    return true;
  }

  /** The rule that makes Quoridor work: no wall may seal anyone in. */
  function wallLegal(st, r, c, horiz) {
    if (!slotFree(st, r, c, horiz)) return false;
    var arr = horiz ? st.H : st.V, i = r * 8 + c;
    arr[i] = 1;
    var okP = dist(st.H, st.V, st.p, 0) >= 0 && dist(st.H, st.V, st.a, 8) >= 0;
    arr[i] = 0;
    return okP;
  }

  function mount(host) {
    var Milo = window.Milo;
    var NS = 'http://www.w3.org/2000/svg';
    var CS = 8.62, GP = 1.8, ST = CS + GP, OR = 4;
    var svg, cellEls = [], wallEls = [], ghostWall, pawnYou, pawnCpu, statusEl, undoBtn;

    function sv(name, attrs) {
      var e = document.createElementNS(NS, name);
      for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
      return e;
    }
    function cx(c) { return OR + c * ST; }

    function wallRect(r, c, horiz) {
      return horiz
        ? { x: cx(c), y: cx(r) + CS, w: 2 * CS + GP, h: GP }
        : { x: cx(c) + CS, y: cx(r), w: GP, h: 2 * CS + GP };
    }

    function button(label, fn) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText = 'font:600 .82rem/1 Outfit,system-ui,sans-serif;padding:8px 14px;' +
        'border-radius:9px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.09);' +
        'color:#eaf2ff;cursor:pointer';
      b.addEventListener('click', fn);
      return b;
    }

    function build(g) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:9px';

      svg = sv('svg', { viewBox: '0 0 100 100' });
      svg.style.cssText = 'width:min(88vw,min(62vh,470px));aspect-ratio:1;border-radius:10px;' +
        'background:#10243a;box-shadow:0 8px 24px rgba(0,0,0,.45);touch-action:manipulation';

      // Goal strips, so it is obvious which way each pawn is running.
      svg.appendChild(sv('rect', { x: 2, y: 1.2, width: 96, height: 2, rx: 1, fill: '#3fa7ff', opacity: .55 }));
      svg.appendChild(sv('rect', { x: 2, y: 96.8, width: 96, height: 2, rx: 1, fill: '#ff7a59', opacity: .55 }));

      var r, c;
      cellEls = [];
      for (r = 0; r < N; r++) {
        for (c = 0; c < N; c++) {
          var cell = sv('rect', { x: cx(c), y: cx(r), width: CS, height: CS, rx: 1.4, fill: '#1d3b5c' });
          cell.style.cursor = 'pointer';
          (function (idx) {
            cell.addEventListener('click', function () { clickCell(g, idx); });
          })(r * N + c);
          svg.appendChild(cell);
          cellEls.push(cell);
        }
      }

      wallEls = [];
      for (r = 0; r < 8; r++) {
        for (c = 0; c < 8; c++) {
          var hb = wallRect(r, c, true), vb = wallRect(r, c, false);
          var hw = sv('rect', { x: hb.x, y: hb.y, width: hb.w, height: hb.h, rx: .8, fill: '#f2c14e', opacity: 0 });
          var vw = sv('rect', { x: vb.x, y: vb.y, width: vb.w, height: vb.h, rx: .8, fill: '#f2c14e', opacity: 0 });
          svg.appendChild(hw); svg.appendChild(vw);
          wallEls.push({ h: hw, v: vw });
        }
      }

      ghostWall = sv('rect', { x: 0, y: 0, width: 1, height: 1, rx: .8, fill: '#7ef0a0', opacity: 0 });
      ghostWall.setAttribute('pointer-events', 'none');
      svg.appendChild(ghostWall);

      pawnCpu = sv('circle', { cx: 0, cy: 0, r: 3.3, fill: '#ff7a59', stroke: '#2a0f0a', 'stroke-width': .6 });
      pawnYou = sv('circle', { cx: 0, cy: 0, r: 3.3, fill: '#3fa7ff', stroke: '#06203a', 'stroke-width': .6 });
      pawnCpu.setAttribute('pointer-events', 'none');
      pawnYou.setAttribute('pointer-events', 'none');
      svg.appendChild(pawnCpu);
      svg.appendChild(pawnYou);

      // Grooves last so they sit on top of the cells for clicking.
      for (r = 0; r < 8; r++) {
        for (c = 0; c < 8; c++) {
          var hh = sv('rect', { x: cx(c), y: cx(r) + CS - 1.3, width: CS - 1.4, height: GP + 2.6, fill: 'transparent' });
          var vh = sv('rect', { x: cx(c) + CS - 1.3, y: cx(r), width: GP + 2.6, height: CS - 1.4, fill: 'transparent' });
          hh.style.cursor = 'pointer'; vh.style.cursor = 'pointer';
          (function (rr, cc) {
            hh.addEventListener('click', function () { clickWall(g, rr, cc, true); });
            vh.addEventListener('click', function () { clickWall(g, rr, cc, false); });
            hh.addEventListener('mouseenter', function () { hoverWall(g, rr, cc, true); });
            vh.addEventListener('mouseenter', function () { hoverWall(g, rr, cc, false); });
          })(r, c);
          svg.appendChild(hh); svg.appendChild(vh);
        }
      }
      svg.addEventListener('mouseleave', function () { ghostWall.setAttribute('opacity', 0); });

      statusEl = document.createElement('div');
      statusEl.style.cssText = 'color:#dfeaff;font:600 .86rem/1.35 Outfit,system-ui,sans-serif;' +
        'text-align:center;min-height:2.4em;max-width:32em';

      var bar = document.createElement('div');
      bar.style.cssText = 'display:flex;gap:8px;justify-content:center';
      undoBtn = button('Undo', function () { undo(g); });
      bar.appendChild(undoBtn);

      wrap.appendChild(svg);
      wrap.appendChild(statusEl);
      wrap.appendChild(bar);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function reset(g) {
      var d = g.data;
      d.st = {
        H: new Uint8Array(64), V: new Uint8Array(64),
        p: 8 * N + 4, a: 0 * N + 4, pw: WALLS, aw: WALLS
      };
      d.turn = 1;
      d.over = false;
      d.busy = false;
      d.hist = [];
      d.moves = 0;
      d.msg = 'Your move: step to a highlighted square, or click a groove to drop a wall.';
      build(g);
      paint(g);
    }

    function clone(st) {
      return {
        H: Uint8Array.from(st.H), V: Uint8Array.from(st.V),
        p: st.p, a: st.a, pw: st.pw, aw: st.aw
      };
    }

    function paint(g) {
      var d = g.data, st = d.st, i, r, c;
      var moves = (d.over || d.turn !== 1 || g.state !== 'play') ? [] : pawnMoves(st, 1);
      for (i = 0; i < SZ; i++) {
        var hot = moves.indexOf(i) !== -1;
        cellEls[i].setAttribute('fill', hot ? '#2f7f5b' : '#1d3b5c');
      }
      for (r = 0; r < 8; r++) {
        for (c = 0; c < 8; c++) {
          i = r * 8 + c;
          wallEls[i].h.setAttribute('opacity', st.H[i] ? 1 : 0);
          wallEls[i].v.setAttribute('opacity', st.V[i] ? 1 : 0);
        }
      }
      pawnYou.setAttribute('cx', cx(st.p % N) + CS / 2);
      pawnYou.setAttribute('cy', cx((st.p / N) | 0) + CS / 2);
      pawnCpu.setAttribute('cx', cx(st.a % N) + CS / 2);
      pawnCpu.setAttribute('cy', cx((st.a / N) | 0) + CS / 2);
      ghostWall.setAttribute('opacity', 0);

      g.set('Your walls', st.pw);
      g.set('CPU walls', st.aw);
      g.set('Turn', d.over ? '—' : (d.turn === 1 ? 'Yours' : 'CPU'));
      statusEl.textContent = d.msg;
      if (undoBtn) {
        undoBtn.disabled = !d.hist.length || d.over;
        undoBtn.style.opacity = undoBtn.disabled ? .45 : 1;
      }
    }

    function hoverWall(g, r, c, horiz) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.turn !== 1 || d.busy) return;
      var b = wallRect(r, c, horiz);
      var ok = d.st.pw > 0 && wallLegal(d.st, r, c, horiz);
      ghostWall.setAttribute('x', b.x); ghostWall.setAttribute('y', b.y);
      ghostWall.setAttribute('width', b.w); ghostWall.setAttribute('height', b.h);
      ghostWall.setAttribute('fill', ok ? '#7ef0a0' : '#ff5f5f');
      ghostWall.setAttribute('opacity', ok ? .85 : .5);
    }

    function clickCell(g, i) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.turn !== 1 || d.busy) return;
      if (pawnMoves(d.st, 1).indexOf(i) === -1) {
        d.msg = 'You can only step (or jump) to a highlighted square.';
        paint(g);
        return;
      }
      d.hist.push(clone(d.st));
      d.st.p = i;
      Milo.sound.tone({ f: 470, f2: 620, d: .08, v: .07, type: 'triangle' });
      afterHuman(g);
    }

    function clickWall(g, r, c, horiz) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.turn !== 1 || d.busy) return;
      if (d.st.pw <= 0) { d.msg = 'You are out of walls — you can only run now.'; paint(g); return; }
      if (!slotFree(d.st, r, c, horiz)) {
        d.msg = 'A wall cannot overlap or cross another one.';
        Milo.sound.tone({ f: 150, d: .06, v: .05, type: 'square' });
        paint(g); return;
      }
      if (!wallLegal(d.st, r, c, horiz)) {
        d.msg = 'Illegal: that wall would seal a pawn off completely. Walls may slow a route, never close it.';
        Milo.sound.tone({ f: 150, d: .06, v: .05, type: 'square' });
        paint(g); return;
      }
      d.hist.push(clone(d.st));
      (horiz ? d.st.H : d.st.V)[r * 8 + c] = 1;
      d.st.pw--;
      Milo.sound.tone({ f: 240, f2: 180, d: .1, v: .08, type: 'square' });
      afterHuman(g);
    }

    function afterHuman(g) {
      var d = g.data;
      d.moves++;
      if (((d.st.p / N) | 0) === 0) {
        d.over = true;
        paint(g);
        g.win({
          emo: '🏁',
          title: 'You got across!',
          text: 'Your pawn reached the far row in ' + d.moves + ' moves with ' +
            d.st.pw + ' wall' + (d.st.pw === 1 ? '' : 's') + ' still in hand.',
          score: Math.max(80, 700 + d.st.pw * 25 - d.moves * 6)
        });
        return;
      }
      d.turn = 2;
      d.busy = true;
      d.msg = 'CPU thinking…';
      paint(g);
      setTimeout(function () { cpuTurn(g); }, 300);
    }

    function undo(g) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.busy || !d.hist.length) return;
      d.st = d.hist.pop();
      d.turn = 1;
      d.moves = Math.max(0, d.moves - 1);
      d.msg = 'Took your last move back.';
      Milo.sound.blip();
      paint(g);
    }

    /* ------------------------------------------------------------- the AI */

    /** Positive is good for the CPU. */
    function evaluate(st) {
      var dp = dist(st.H, st.V, st.p, 0), da = dist(st.H, st.V, st.a, 8);
      if (da === 0) return 1e6;
      if (dp === 0) return -1e6;
      if (dp < 0 || da < 0) return 0;
      return (dp - da) * 10 + (st.aw - st.pw) * 1.2;
    }

    function applyPawn(st, who, to) {
      var c = clone(st);
      if (who === 1) c.p = to; else c.a = to;
      return c;
    }
    function applyWall(st, who, r, c, horiz) {
      var s = clone(st);
      (horiz ? s.H : s.V)[r * 8 + c] = 1;
      if (who === 1) s.pw--; else s.aw--;
      return s;
    }

    /** The best `limit` wall slots for `who`, judged by the resulting position. */
    function wallCandidates(st, who, limit) {
      if ((who === 2 ? st.aw : st.pw) <= 0) return [];
      var out = [], r, c, o;
      for (r = 0; r < 8; r++) {
        for (c = 0; c < 8; c++) {
          for (o = 0; o < 2; o++) {
            var horiz = o === 0;
            if (!slotFree(st, r, c, horiz)) continue;
            var arr = horiz ? st.H : st.V, i = r * 8 + c;
            arr[i] = 1;
            var dp = dist(st.H, st.V, st.p, 0), da = dist(st.H, st.V, st.a, 8);
            arr[i] = 0;
            if (dp < 0 || da < 0) continue;            // would seal someone in
            var v = who === 2 ? (dp - da) : (da - dp);
            out.push({ r: r, c: c, horiz: horiz, v: v });
          }
        }
      }
      out.sort(function (a, b) { return b.v - a.v; });
      return out.slice(0, limit);
    }

    function bestReply(st, who) {
      var best = null, i, mv;
      var pm = pawnMoves(st, who);
      for (i = 0; i < pm.length; i++) {
        var s = applyPawn(st, who, pm[i]);
        var v = evaluate(s);
        if (best === null || (who === 2 ? v > best : v < best)) best = v;
      }
      var wc = wallCandidates(st, who, 8);
      for (i = 0; i < wc.length; i++) {
        mv = wc[i];
        var s2 = applyWall(st, who, mv.r, mv.c, mv.horiz);
        var v2 = evaluate(s2);
        if (best === null || (who === 2 ? v2 > best : v2 < best)) best = v2;
      }
      return best === null ? evaluate(st) : best;
    }

    function cpuTurn(g) {
      var d = g.data;
      d.busy = false;
      if (g.state !== 'play' || d.over) return;
      var st = d.st, cands = [], i;

      var pm = pawnMoves(st, 2);
      for (i = 0; i < pm.length; i++) cands.push({ kind: 'move', to: pm[i], st: applyPawn(st, 2, pm[i]) });
      var wc = wallCandidates(st, 2, 14);
      for (i = 0; i < wc.length; i++) {
        cands.push({ kind: 'wall', w: wc[i], st: applyWall(st, 2, wc[i].r, wc[i].c, wc[i].horiz) });
      }
      if (!cands.length) { d.turn = 1; d.msg = 'CPU has nowhere to go.'; paint(g); return; }

      var best = null;
      for (i = 0; i < cands.length; i++) {
        var c = cands[i], v;
        if (evaluate(c.st) >= 1e6) { best = { c: c, v: 1e9 }; break; }   // winning step
        v = bestReply(c.st, 1) + (Math.random() * 1.4 - .7);
        // A wall spent for nothing is worse than simply running.
        if (c.kind === 'wall' && c.w.v <= 0) v -= 6;
        if (!best || v > best.v) best = { c: c, v: v };
      }

      var pick = best.c;
      d.st = pick.st;
      if (pick.kind === 'move') {
        Milo.sound.tone({ f: 320, f2: 400, d: .08, v: .06, type: 'triangle' });
        d.msg = 'CPU advanced its pawn.';
      } else {
        Milo.sound.tone({ f: 200, f2: 150, d: .1, v: .07, type: 'square' });
        d.msg = 'CPU dropped a wall in your way — ' + d.st.aw + ' left.';
      }

      if (((d.st.a / N) | 0) === 8) {
        d.over = true;
        paint(g);
        g.gameOver({
          emo: '🚧',
          title: 'The CPU got across first',
          text: 'Its pawn reached your baseline. Walls buy you time — spend them when ' +
            'the CPU is close and the detour is long.',
          score: Math.max(0, 300 - dist(d.st.H, d.st.V, d.st.p, 0) * 18)
        });
        return;
      }
      d.turn = 1;
      var dp = dist(d.st.H, d.st.V, d.st.p, 0), da = dist(d.st.H, d.st.V, d.st.a, 8);
      d.msg += '  You need ' + dp + ' steps, the CPU needs ' + da + '.';
      paint(g);
    }

    function keyMove(g, e) {
      var d = g.data;
      if (d.over || d.turn !== 1 || d.busy) return;
      var map = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      var dir = map[e.code];
      if (!dir) return;
      var st = d.st, n = step(st.H, st.V, st.p, dir);
      if (n < 0) return;
      if (n === st.a) {
        var n2 = step(st.H, st.V, n, dir);
        if (n2 < 0) return;
        n = n2;
      }
      if (pawnMoves(st, 1).indexOf(n) === -1) return;
      clickCell(g, n);
    }

    return Milo.domGame(host, {
      id: 'quoridor',
      stats: ['Your walls', 'CPU walls', 'Turn'],
      bg: '#0a1826',
      emo: '🚧',
      start: {
        title: 'Quoridor',
        text: 'You are the blue pawn on the near side; get to the far row before the ' +
          'red one reaches yours. Each turn: step one square, or spend one of your ten ' +
          'walls by clicking a groove between squares. A wall may slow someone down but ' +
          'never seal them in — the board checks every placement.',
        keys: ['Click a square', 'Click a groove', 'Arrow keys']
      },
      init: reset,
      onKey: keyMove
    });
  }

  window.Milo.register({
    id: 'quoridor', title: 'Quoridor', emo: '🚧', category: 'Strategy',
    tagline: 'Run for the far side, fence in the other pawn',
    description: 'A race across a 9×9 board where every turn is a choice: take a step, ' +
      'or spend one of your ten two-square walls to lengthen your opponent’s route. The ' +
      'one rule that makes it a game rather than a maze is that no wall may completely ' +
      'seal a pawn off — every placement is pathfound before it is allowed, and illegal ' +
      'grooves light up red. Pawns that meet head-on jump over each other, sideways if ' +
      'something is behind. The CPU compares both shortest paths a move deep, so walls ' +
      'thrown early are usually walls wasted.',
    controls: ['Click a square', 'Click a groove', 'Arrow keys', 'Undo'],
    colors: ['#2d6a8f', '#f2c14e'],
    tags: ['board game', 'maze', 'vs cpu', 'strategy', 'abstract'],
    mount: mount
  });
})();
