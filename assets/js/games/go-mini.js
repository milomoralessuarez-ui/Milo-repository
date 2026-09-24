/* Go on a 9x9 board — liberties, captures, the ko rule, passing, and
   Chinese (area) scoring at the end. Black is the player, komi 6.5. */
(function () {
  'use strict';

  var N = 9, SZ = 81, KOMI = 6.5;
  var BLACK = 1, WHITE = 2;

  // Orthogonal and diagonal neighbours of every point, precomputed once.
  var NB = [], DG = [], EDGE = [];
  (function () {
    for (var i = 0; i < SZ; i++) {
      var x = i % N, y = (i / N) | 0, a = [], b = [];
      if (x > 0) a.push(i - 1);
      if (x < N - 1) a.push(i + 1);
      if (y > 0) a.push(i - N);
      if (y < N - 1) a.push(i + N);
      var dx, dy;
      for (dx = -1; dx <= 1; dx += 2) {
        for (dy = -1; dy <= 1; dy += 2) {
          var nx = x + dx, ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < N && ny < N) b.push(ny * N + nx);
        }
      }
      NB.push(a); DG.push(b);
      EDGE.push(Math.min(x, y, N - 1 - x, N - 1 - y));
    }
  })();

  // Opening shape sense: the third line is the value line on a small board.
  var LINE = [-9, 2, 7, 5, 4];
  var STARS = [20, 24, 40, 56, 60];

  var mark = new Int32Array(SZ), markId = 0;

  /** The whole connected string containing `i`, plus its liberty count. */
  function group(b, i) {
    var who = b[i], stack = [i], out = [], libs = 0;
    markId += 2;
    var seen = markId, lib = markId + 1;
    mark[i] = seen;
    while (stack.length) {
      var p = stack.pop();
      out.push(p);
      var nb = NB[p];
      for (var k = 0; k < nb.length; k++) {
        var q = nb[k];
        if (b[q] === 0) {
          if (mark[q] !== lib && mark[q] !== seen) { mark[q] = lib; libs++; }
        } else if (b[q] === who && mark[q] !== seen) {
          mark[q] = seen; stack.push(q);
        }
      }
    }
    return { st: out, libs: libs };
  }


  /**
   * Try a stone for `who` at `i`. Returns null when the point is occupied,
   * forbidden by ko, or the move would be suicide; otherwise the new board,
   * the captured points, and the new ko point (-1 when there is none).
   */
  function tryPlay(b, i, who, koPt) {
    if (b[i] !== 0 || i === koPt) return null;
    var nb2 = Int8Array.from(b);
    nb2[i] = who;
    var opp = who === BLACK ? WHITE : BLACK, caps = [], nb = NB[i], k, m;
    for (k = 0; k < nb.length; k++) {
      var q = nb[k];
      if (nb2[q] === opp) {
        var gr = group(nb2, q);
        if (gr.libs === 0) {
          for (m = 0; m < gr.st.length; m++) { nb2[gr.st[m]] = 0; caps.push(gr.st[m]); }
        }
      }
    }
    var mine = group(nb2, i);
    if (mine.libs === 0) return null;
    // Standard ko: a single stone that captured a single stone and sits in atari.
    var ko = (caps.length === 1 && mine.st.length === 1 && mine.libs === 1) ? caps[0] : -1;
    return { b: nb2, caps: caps, ko: ko };
  }

  /** True when `i` is a proper eye for `who` — filling it is self-harm. */
  function isEye(b, i, who) {
    if (b[i] !== 0) return false;
    var k;
    for (k = 0; k < NB[i].length; k++) if (b[NB[i][k]] !== who) return false;
    var bad = 0, dg = DG[i];
    for (k = 0; k < dg.length; k++) if (b[dg[k]] !== who) bad++;
    return dg.length === 4 ? bad <= 1 : bad === 0;
  }

  /** Chinese area score: stones on the board plus the empty points they enclose. */
  function areaScore(b) {
    var blk = 0, wht = 0, dame = 0, seen = new Int8Array(SZ), i;
    for (i = 0; i < SZ; i++) {
      if (b[i] === BLACK) { blk++; continue; }
      if (b[i] === WHITE) { wht++; continue; }
      if (seen[i]) continue;
      var stack = [i], reg = [], touch = 0;
      seen[i] = 1;
      while (stack.length) {
        var p = stack.pop();
        reg.push(p);
        var nb = NB[p];
        for (var k = 0; k < nb.length; k++) {
          var q = nb[k];
          if (b[q] === 0) { if (!seen[q]) { seen[q] = 1; stack.push(q); } }
          else touch |= b[q];
        }
      }
      if (touch === BLACK) blk += reg.length;
      else if (touch === WHITE) wht += reg.length;
      else dame += reg.length;
    }
    return { black: blk, white: wht, dame: dame };
  }

  function mount(host) {
    var Milo = window.Milo;
    var NS = 'http://www.w3.org/2000/svg';
    var svg = null, stoneEls = [], hitEls = [], ghost = null, koMark = null, lastMark = null;
    var statusEl = null, undoBtn = null, passBtn = null;

    function sv(name, attrs) {
      var e = document.createElementNS(NS, name);
      for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
      return e;
    }
    function pos(k) { return 8 + k * 10.5; }

    function button(label, fn) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText = 'font:600 .82rem/1 Outfit,system-ui,sans-serif;padding:8px 14px;' +
        'border-radius:9px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.09);' +
        'color:#f2ecdc;cursor:pointer';
      b.addEventListener('click', fn);
      return b;
    }

    function build(g) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:10px';

      svg = sv('svg', { viewBox: '0 0 100 100' });
      svg.style.cssText = 'width:min(88vw,min(62vh,470px));aspect-ratio:1;' +
        'border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.45);touch-action:manipulation';
      svg.appendChild(sv('rect', { x: 0, y: 0, width: 100, height: 100, rx: 3, fill: '#d9ab63' }));
      var i, k;
      for (k = 0; k < N; k++) {
        svg.appendChild(sv('line', {
          x1: pos(0), y1: pos(k), x2: pos(N - 1), y2: pos(k),
          stroke: '#4a3010', 'stroke-width': .5
        }));
        svg.appendChild(sv('line', {
          x1: pos(k), y1: pos(0), x2: pos(k), y2: pos(N - 1),
          stroke: '#4a3010', 'stroke-width': .5
        }));
      }
      for (k = 0; k < STARS.length; k++) {
        svg.appendChild(sv('circle', {
          cx: pos(STARS[k] % N), cy: pos((STARS[k] / N) | 0), r: 1.1, fill: '#4a3010'
        }));
      }

      lastMark = sv('rect', { x: 0, y: 0, width: 3, height: 3, fill: 'none', stroke: '#ff5a5a', 'stroke-width': .7, opacity: 0 });
      koMark = sv('rect', { x: 0, y: 0, width: 4, height: 4, fill: 'none', stroke: '#2b2b2b', 'stroke-width': .8, opacity: 0 });
      ghost = sv('circle', { cx: 0, cy: 0, r: 4.6, fill: '#000', opacity: 0, 'pointer-events': 'none' });

      stoneEls = []; hitEls = [];
      for (i = 0; i < SZ; i++) {
        var c = sv('circle', { cx: pos(i % N), cy: pos((i / N) | 0), r: 4.6, fill: '#111', opacity: 0 });
        c.setAttribute('pointer-events', 'none');
        svg.appendChild(c);
        stoneEls.push(c);
      }
      svg.appendChild(lastMark);
      svg.appendChild(koMark);
      svg.appendChild(ghost);
      for (i = 0; i < SZ; i++) {
        var h = sv('circle', { cx: pos(i % N), cy: pos((i / N) | 0), r: 5.2, fill: 'transparent' });
        h.style.cursor = 'pointer';
        (function (idx) {
          h.addEventListener('click', function () { humanPlay(g, idx); });
          h.addEventListener('mouseenter', function () { hover(g, idx); });
        })(i);
        svg.appendChild(h);
        hitEls.push(h);
      }
      svg.addEventListener('mouseleave', function () { ghost.setAttribute('opacity', 0); });

      statusEl = document.createElement('div');
      statusEl.style.cssText = 'color:#f0e3cc;font:600 .86rem/1.35 Outfit,system-ui,sans-serif;' +
        'text-align:center;min-height:2.4em;max-width:30em';

      var bar = document.createElement('div');
      bar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;justify-content:center';
      passBtn = button('Pass', function () { humanPass(g); });
      undoBtn = button('Undo', function () { undo(g); });
      bar.appendChild(passBtn);
      bar.appendChild(undoBtn);

      wrap.appendChild(svg);
      wrap.appendChild(statusEl);
      wrap.appendChild(bar);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
    }

    function reset(g) {
      var d = g.data;
      d.b = new Int8Array(SZ);
      d.ko = -1;
      d.turn = BLACK;
      d.passes = 0;
      d.moveNo = 0;
      d.capB = 0;          // stones Black has captured
      d.capW = 0;
      d.last = -1;
      d.over = false;
      d.busy = false;
      d.hist = [];
      d.msg = 'Black to play. Surround empty points to make territory.';
      build(g);
      paint(g);
    }

    function snapshot(d) {
      return {
        b: Int8Array.from(d.b), ko: d.ko, passes: d.passes, moveNo: d.moveNo,
        capB: d.capB, capW: d.capW, last: d.last
      };
    }
    function restore(d, s) {
      d.b = Int8Array.from(s.b); d.ko = s.ko; d.passes = s.passes;
      d.moveNo = s.moveNo; d.capB = s.capB; d.capW = s.capW; d.last = s.last;
    }

    function hover(g, i) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.turn !== BLACK || d.busy) {
        ghost.setAttribute('opacity', 0);
        return;
      }
      var ok = !!tryPlay(d.b, i, BLACK, d.ko);
      ghost.setAttribute('cx', pos(i % N));
      ghost.setAttribute('cy', pos((i / N) | 0));
      ghost.setAttribute('fill', ok ? '#111' : '#d33');
      ghost.setAttribute('opacity', ok ? .45 : .3);
    }

    function paint(g) {
      var d = g.data, i;
      for (i = 0; i < SZ; i++) {
        var v = d.b[i], c = stoneEls[i];
        if (!v) { c.setAttribute('opacity', 0); continue; }
        c.setAttribute('opacity', 1);
        c.setAttribute('fill', v === BLACK ? '#14161c' : '#f7f3ea');
        c.setAttribute('stroke', v === BLACK ? '#000' : '#9a927f');
        c.setAttribute('stroke-width', .4);
      }
      if (d.last >= 0 && d.b[d.last]) {
        lastMark.setAttribute('x', pos(d.last % N) - 1.5);
        lastMark.setAttribute('y', pos((d.last / N) | 0) - 1.5);
        lastMark.setAttribute('opacity', .95);
      } else lastMark.setAttribute('opacity', 0);
      if (d.ko >= 0) {
        koMark.setAttribute('x', pos(d.ko % N) - 2);
        koMark.setAttribute('y', pos((d.ko / N) | 0) - 2);
        koMark.setAttribute('opacity', .9);
      } else koMark.setAttribute('opacity', 0);
      ghost.setAttribute('opacity', 0);

      var s = areaScore(d.b);
      g.set('Black', s.black);
      g.set('White', (s.white + KOMI).toFixed(1));
      g.set('Turn', d.over ? '—' : (d.turn === BLACK ? 'Yours' : 'CPU'));
      statusEl.textContent = d.msg;
      if (undoBtn) undoBtn.disabled = !d.hist.length || d.over;
      if (passBtn) passBtn.disabled = d.over || d.turn !== BLACK;
      if (undoBtn) undoBtn.style.opacity = undoBtn.disabled ? .45 : 1;
      if (passBtn) passBtn.style.opacity = passBtn.disabled ? .45 : 1;
    }

    function humanPlay(g, i) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.turn !== BLACK || d.busy) return;
      var r = tryPlay(d.b, i, BLACK, d.ko);
      if (!r) {
        d.msg = d.b[i] ? 'That point is taken.' :
          (i === d.ko ? 'Ko — you may not take straight back. Play elsewhere first.' :
            'Illegal: that stone would have no liberties.');
        Milo.sound.tone({ f: 150, d: .06, v: .05, type: 'square' });
        paint(g);
        return;
      }
      d.hist.push(snapshot(d));
      if (d.hist.length > 60) d.hist.shift();
      d.b = r.b; d.ko = r.ko; d.capB += r.caps.length; d.last = i;
      d.passes = 0; d.moveNo++;
      Milo.sound.tone({ f: 460, f2: 330, d: .07, v: .07, type: 'triangle' });
      if (r.caps.length) Milo.sound.hit();
      d.turn = WHITE;
      d.msg = r.caps.length ? ('You captured ' + r.caps.length + ' stone' + (r.caps.length > 1 ? 's' : '') + '.') : 'White is thinking…';
      d.busy = true;
      paint(g);
      setTimeout(function () { cpuTurn(g); }, 320);
    }

    function humanPass(g) {
      var d = g.data;
      if (g.state !== 'play' || d.over || d.turn !== BLACK || d.busy) return;
      d.hist.push(snapshot(d));
      d.passes++; d.last = -1; d.ko = -1; d.moveNo++;
      Milo.sound.blip();
      if (d.passes >= 2) { finish(g, 'Both players passed'); return; }
      d.turn = WHITE;
      d.msg = 'You passed. If White passes too, the game is scored.';
      d.busy = true;
      paint(g);
      setTimeout(function () { cpuTurn(g); }, 320);
    }

    function undo(g) {
      var d = g.data;
      if (g.state !== 'play' || d.over || !d.hist.length || d.busy) return;
      restore(d, d.hist.pop());
      d.turn = BLACK;
      d.msg = 'Took a move back.';
      Milo.sound.blip();
      paint(g);
    }

    /* ------------------------------------------------------------- the AI */

    /** Static value of White playing at `i`, before any reply is considered. */
    function moveValue(b, i, who, koPt, moveNo) {
      var r = tryPlay(b, i, who, koPt);
      if (!r) return null;
      var opp = who === BLACK ? WHITE : BLACK;
      var s = r.caps.length * 15;
      var mine = group(r.b, i);
      if (mine.libs === 1) s -= 24 + mine.st.length * 14;      // self-atari
      else if (mine.libs === 2) s -= 3;
      if (isEye(b, i, who)) s -= 70;                            // never fill your own eye
      var k, q, seenOpp = {}, seenMine = {};
      for (k = 0; k < NB[i].length; k++) {
        q = NB[i][k];
        if (r.b[q] === opp) {
          var og = group(r.b, q);
          if (!seenOpp[og.st[0]]) {
            seenOpp[og.st[0]] = 1;
            if (og.libs === 1) s += 9 + og.st.length * 6;       // atari
            else if (og.libs === 2) s += 4 + og.st.length;      // squeeze
            s += 2;
          }
        } else if (b[q] === who) {
          var mg = group(b, q);
          if (!seenMine[mg.st[0]]) {
            seenMine[mg.st[0]] = 1;
            if (mg.libs === 1) s += 12 + mg.st.length * 9;      // rescue
            else if (mg.libs === 2) s += 3;
            s += 3;                                             // stay connected
          }
        }
      }
      var open = moveNo < 24 ? 1 : (moveNo < 40 ? .5 : .2);
      s += LINE[EDGE[i]] * open;
      if (STARS.indexOf(i) !== -1) s += 3 * open;
      // Reward playing near the action rather than drifting off alone.
      var near = 0;
      for (k = 0; k < DG[i].length; k++) if (b[DG[i][k]]) near++;
      for (k = 0; k < NB[i].length; k++) if (b[NB[i][k]]) near += 2;
      if (moveNo > 6 && near === 0) s -= 4;
      return { s: s, r: r };
    }

    function cpuTurn(g) {
      var d = g.data;
      d.busy = false;
      if (g.state !== 'play' || d.over) return;

      var cands = [], i;
      for (i = 0; i < SZ; i++) {
        var v = moveValue(d.b, i, WHITE, d.ko, d.moveNo);
        if (v) cands.push({ i: i, s: v.s + Math.random() * 2.2, r: v.r });
      }
      cands.sort(function (a, b) { return b.s - a.s; });

      // Read one ply deeper on the short-list: reject moves that hand Black
      // a big capture or a killing atari in reply.
      var top = cands.slice(0, 12), best = null;
      for (i = 0; i < top.length; i++) {
        var c = top[i], worst = 0, j;
        for (j = 0; j < SZ; j++) {
          var rep = tryPlay(c.r.b, j, BLACK, c.r.ko);
          if (!rep) continue;
          var gain = rep.caps.length * 15;
          var mg2 = group(rep.b, j);
          if (mg2.libs === 1) gain -= 20;
          if (gain > worst) worst = gain;
        }
        var adj = c.s - worst * .85;
        if (!best || adj > best.adj) best = { c: c, adj: adj };
      }

      var sc = areaScore(d.b);
      var ahead = (sc.white + KOMI) - sc.black;
      // Pass when nothing is worth playing, or when Black passed and White leads.
      var shouldPass = !best || best.c.s < -12 || (d.passes === 1 && ahead > 0 && best.c.s < 8);

      if (shouldPass) {
        d.passes++;
        d.last = -1; d.ko = -1; d.moveNo++;
        Milo.sound.blip();
        if (d.passes >= 2) { finish(g, 'Both players passed'); return; }
        d.turn = BLACK;
        d.msg = 'White passes. Pass as well to score the game.';
        paint(g);
        return;
      }

      var mv = best.c;
      d.b = mv.r.b; d.ko = mv.r.ko; d.capW += mv.r.caps.length;
      d.last = mv.i; d.passes = 0; d.moveNo++;
      Milo.sound.tone({ f: 300, f2: 230, d: .07, v: .07, type: 'triangle' });
      if (mv.r.caps.length) Milo.sound.hit();
      d.turn = BLACK;
      d.msg = mv.r.caps.length
        ? ('White captured ' + mv.r.caps.length + ' of your stones.')
        : 'Your move.';
      // Warn the player about their own strings in danger.
      var atari = false, checked = new Int8Array(SZ);
      for (i = 0; i < SZ && !atari; i++) {
        if (d.b[i] !== BLACK || checked[i]) continue;
        var gg = group(d.b, i);
        for (var m = 0; m < gg.st.length; m++) checked[gg.st[m]] = 1;
        if (gg.libs === 1) atari = true;
      }
      if (atari) d.msg += ' You have stones in atari.';
      paint(g);
    }

    function finish(g, why) {
      var d = g.data;
      d.over = true;
      var s = areaScore(d.b);
      var w = s.white + KOMI;
      d.msg = why + '. Black ' + s.black + ' — White ' + w.toFixed(1) + ' (komi included).';
      paint(g);
      var diff = s.black - w;
      var line = 'Chinese scoring: Black ' + s.black + ', White ' + w.toFixed(1) +
        ' with 6.5 komi' + (s.dame ? ', ' + s.dame + ' neutral point' + (s.dame > 1 ? 's' : '') : '') + '.';
      if (diff > 0) {
        g.win({
          emo: '⚫',
          title: 'Black wins by ' + diff.toFixed(1),
          text: why + '. ' + line,
          score: Math.round(420 + diff * 22 + d.capB * 6)
        });
      } else {
        g.gameOver({
          emo: '⚪',
          title: 'White wins by ' + (-diff).toFixed(1),
          text: why + '. ' + line,
          score: Math.round(s.black * 6 + d.capB * 4)
        });
      }
    }

    return Milo.domGame(host, {
      id: 'go-mini',
      stats: ['Black', 'White', 'Turn'],
      bg: '#2f2216',
      emo: '⚫',
      start: {
        title: 'Go (9×9)',
        text: 'You are Black and move first. A stone with no empty point beside it is ' +
          'captured; you may not replay the point that would undo a ko capture. Pass twice ' +
          'to score — Chinese rules count your stones plus the empty points only you surround, ' +
          'and White gets 6.5 komi. Dead stones are not removed by agreement, so capture them.',
        keys: ['Click an intersection', 'Pass', 'Undo']
      },
      init: reset
    });
  }

  window.Milo.register({
    id: 'go-mini', title: 'Go (9×9)', emo: '⚫', category: 'Strategy',
    tagline: 'Real Go on a small board — liberties, ko and komi',
    description: 'Go with the full rules on a 9×9 board: a string with no liberties is ' +
      'lifted off, suicide is forbidden and the ko rule stops you taking straight back. ' +
      'The game ends when both players pass and is scored under Chinese (area) rules — ' +
      'your stones plus the empty points only you surround — with White receiving 6.5 komi ' +
      'for moving second. The CPU reads captures and ataris a move ahead, so a group with ' +
      'one liberty will not survive; give every group two eyes and it can never be taken.',
    controls: ['Click an intersection', 'Pass', 'Undo'],
    colors: ['#d9ab63', '#14161c'],
    tags: ['board game', 'go', 'baduk', 'vs cpu', 'strategy'],
    mount: mount
  });
})();
