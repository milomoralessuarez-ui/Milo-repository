/* Number Link — join matching numbers with non-crossing paths that fill every cell. */
(function () {
  'use strict';
  // [size, pairs [x1,y1,x2,y2]] — generator-built and solver-verified to have exactly one solution.
  var LEVELS = [
    [5, [[1,3,4,3],[0,3,4,2],[4,1,1,0],[0,4,4,4],[0,0,3,1]]],
    [5, [[4,4,3,3],[0,0,3,1],[1,2,2,0],[3,2,3,0],[0,4,3,4]]],
    [5, [[0,0,3,4],[4,4,2,1],[0,4,2,4],[2,2,2,0],[3,0,4,1]]],
    [5, [[4,1,1,3],[0,0,4,4],[3,2,2,0],[4,0,2,1]]],
    [5, [[4,3,1,1],[3,0,3,3],[2,0,0,1],[3,1,2,2],[0,2,1,4]]],
    [6, [[2,2,5,5],[4,0,5,2],[1,1,1,4],[4,3,5,0],[0,2,2,1],[1,5,0,3]]],
    [6, [[1,1,2,4],[5,0,3,5],[2,5,1,3],[3,3,0,5],[0,1,4,1]]],
    [6, [[3,3,0,5],[1,5,5,2],[0,3,4,1],[5,1,3,0],[2,4,4,4],[4,3,1,1]]],
    [6, [[2,5,1,2],[0,0,3,3],[3,5,4,0],[2,3,3,2],[0,1,2,1],[1,3,4,4]]],
    [6, [[0,0,5,3],[5,5,0,2],[4,1,1,0],[5,1,4,0],[3,4,0,3],[0,5,4,5]]],
    [6, [[5,5,1,4],[0,2,5,0],[5,3,1,2],[1,3,0,4],[3,3,4,5],[2,5,0,5]]],
    [7, [[3,0,2,2],[5,1,4,4],[0,0,0,5],[2,1,2,4],[4,2,6,4],[6,5,0,6],[1,5,2,3],[2,5,5,4]]],
    [7, [[0,4,2,6],[5,2,0,2],[3,3,6,6],[1,2,5,5],[6,5,5,0],[1,5,0,3],[2,2,3,6]]],
    [7, [[1,3,5,0],[5,2,3,6],[1,2,6,0],[2,4,2,2],[1,4,1,6],[1,5,2,6],[6,2,5,5],[6,4,4,3]]],
    [7, [[1,3,3,2],[1,5,5,0],[4,0,1,2],[0,5,6,4],[4,1,2,2],[0,4,0,0],[6,0,5,4],[6,6,3,6]]],
    [7, [[6,6,4,2],[2,4,0,1],[4,5,5,6],[6,2,1,2],[3,2,5,1],[5,5,3,6],[4,3,1,5],[1,1,0,0]]],
    [7, [[3,6,6,3],[3,3,1,4],[5,4,5,6],[5,2,1,1],[2,0,5,1],[0,4,2,6],[2,4,0,3],[6,4,6,6]]],
    [8, [[2,5,4,4],[6,2,0,1],[0,7,1,3],[6,4,3,3],[5,6,4,5],[7,7,5,0],[3,5,5,2],[0,4,3,1],[2,7,1,6]]],
    [8, [[0,4,5,2],[1,1,3,7],[4,5,2,2],[3,0,7,1],[3,6,6,5],[6,1,4,4],[1,6,2,4],[5,5,6,6],[6,3,3,2]]],
    [8, [[4,2,5,6],[2,4,1,1],[6,5,1,6],[5,4,3,5],[0,1,7,3],[6,1,5,3],[0,6,7,7],[1,4,2,1]]],
    [8, [[5,4,1,1],[7,4,4,7],[3,7,1,4],[1,7,2,2],[5,2,4,4],[7,1,6,0],[6,3,3,6],[6,1,7,3],[4,1,5,3]]],
    [8, [[5,5,2,0],[1,1,5,7],[0,4,2,5],[5,6,7,7],[1,0,4,3],[3,7,1,4],[6,0,7,6],[1,6,3,4]]]
  ];
  var COLS = ['#f43f5e', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#eab308', '#14b8a6'];
  var C = 50;
  var NS = 'http://www.w3.org/2000/svg';

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var lvl = 0, svg = null, ro = null, fx = null, hdr = null;

    function el(tag, attrs, parent) {
      var n = document.createElementNS(NS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    }
    function makeFx() {
      var cv = document.createElement('canvas');
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5';
      host.appendChild(cv);
      var ctx = cv.getContext('2d'), parts = [], raf = 0, last = 0;
      function size() {
        var r = host.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
        cv.width = Math.max(1, r.width * d); cv.height = Math.max(1, r.height * d); ctx.setTransform(d, 0, 0, d, 0, 0);
      }
      function tick(now) {
        var dt = Math.min(.05, (now - last) / 1000); last = now;
        ctx.clearRect(0, 0, cv.width, cv.height);
        for (var i = parts.length - 1; i >= 0; i--) {
          var p = parts[i]; p.t += dt;
          if (p.t > p.life) { parts.splice(i, 1); continue; }
          var k = p.t / p.life;
          p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .97; p.vy *= .97;
          ctx.globalAlpha = 1 - k; ctx.strokeStyle = p.c; ctx.lineWidth = 3 * (1 - k) + .5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * .04, p.y - p.vy * .04); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        if (parts.length) raf = requestAnimationFrame(tick); else { raf = 0; ctx.clearRect(0, 0, cv.width, cv.height); }
      }
      return {
        burst: function (x, y, n, c, spd) {
          size();
          for (var i = 0; i < n; i++) { var a = U.rand(0, 6.283), s = U.rand(60, spd || 260); parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, c: c, t: 0, life: U.rand(.35, .8) }); }
          if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
        },
        destroy: function () { cancelAnimationFrame(raf); cv.remove(); }
      };
    }

    function load(g) {
      var d = g.data, L = LEVELS[lvl];
      d.n = L[0];
      d.pairs = L[1].map(function (p, i) { return { i: i, a: p[1] * d.n + p[0], b: p[3] * d.n + p[2], path: [], done: false }; });
      d.ends = {};
      d.pairs.forEach(function (p) { d.ends[p.a] = p; d.ends[p.b] = p; });
      d.cell = [];
      for (var i = 0; i < d.n * d.n; i++) d.cell.push(-1);
      d.drag = null;
      d.moves = 0;
      d.time = 0;
      d.done = false;
      build(g);
      paint(g);
      g.set('Level', (lvl + 1) + '/' + LEVELS.length);
      g.set('Moves', 0);
      g.set('Score', U.fmt(g.score));
    }

    function build(g) {
      var d = g.data, n = d.n;
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;height:100%;justify-content:center';
      hdr = document.createElement('div');
      hdr.style.cssText = 'color:#cbd5e1;font:600 .88rem Outfit,sans-serif;text-align:center';
      wrap.appendChild(hdr);
      svg = el('svg', { viewBox: '0 0 ' + n * C + ' ' + n * C });
      svg.style.cssText = 'display:block;border-radius:14px;background:#0d1226;box-shadow:0 18px 40px rgba(0,0,0,.5), inset 0 0 0 2px #262c52;touch-action:none;user-select:none;-webkit-user-select:none';
      var cellG = el('g', {}, svg);
      for (var i = 0; i < n * n; i++) {
        el('rect', { x: (i % n) * C + 2, y: ((i / n) | 0) * C + 2, width: C - 4, height: C - 4, rx: 8, fill: '#161c3a' }, cellG);
      }
      d.fillG = el('g', {}, svg);
      d.pathG = el('g', {}, svg);
      d.endG = el('g', {}, svg);
      d.pairs.forEach(function (p) {
        p.fills = [];
        p.line = el('path', { fill: 'none', stroke: COLS[p.i], 'stroke-width': C * .38, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: .95 }, d.pathG);
        [p.a, p.b].forEach(function (c) {
          var cx = (c % n) * C + C / 2, cy = ((c / n) | 0) * C + C / 2;
          var circ = el('circle', { cx: cx, cy: cy, r: C * .34, fill: COLS[p.i], stroke: 'rgba(255,255,255,.25)', 'stroke-width': 2 }, d.endG);
          var t = el('text', { x: cx, y: cy + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': 'Outfit, sans-serif', 'font-weight': 800, 'font-size': C * .4, fill: '#fff' }, d.endG);
          t.textContent = p.i + 1;
          p.fills.push(circ);
        });
      });
      svg.addEventListener('pointerdown', function (e) { onDown(g, e); });
      svg.addEventListener('pointermove', function (e) { onMove(g, e); });
      svg.addEventListener('pointerup', function (e) { onUp(g, e); });
      svg.addEventListener('pointercancel', function (e) { onUp(g, e); });
      wrap.appendChild(svg);
      var tip = document.createElement('div');
      tip.style.cssText = 'color:#64748b;font:600 .8rem Outfit,sans-serif;text-align:center';
      tip.textContent = 'Drag from a number to its twin · every cell must end up covered · dragging through a path cuts it';
      wrap.appendChild(tip);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
      fit(g);
      if (!ro && window.ResizeObserver) { ro = new ResizeObserver(function () { fit(g); }); ro.observe(g.root); }
    }
    function fit(g) {
      if (!svg) return;
      var r = g.root.getBoundingClientRect();
      var size = Math.max(160, Math.min(r.width - 40, r.height - 76 - 30 - 30 - 16, 520));
      svg.style.width = size + 'px';
      svg.style.height = size + 'px';
    }

    function cellAt(g, e) {
      var d = g.data, r = svg.getBoundingClientRect();
      var x = Math.floor((e.clientX - r.left) / r.width * d.n), y = Math.floor((e.clientY - r.top) / r.height * d.n);
      if (x < 0 || y < 0 || x >= d.n || y >= d.n) return -1;
      return y * d.n + x;
    }
    function recompute(d) {
      for (var i = 0; i < d.cell.length; i++) d.cell[i] = -1;
      d.pairs.forEach(function (p) { p.path.forEach(function (c) { d.cell[c] = p.i; }); });
    }

    function onDown(g, e) {
      var d = g.data;
      if (g.state !== 'play' || d.done) return;
      var c = cellAt(g, e);
      if (c < 0) return;
      var p = d.ends[c];
      if (p) {
        // start (or restart) this colour's path from this endpoint
        p.path = [c]; p.done = false;
      } else if (d.cell[c] >= 0) {
        p = d.pairs[d.cell[c]];
        p.path = p.path.slice(0, p.path.indexOf(c) + 1); p.done = false;
      } else return;
      d.drag = { p: p, changed: true };
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      e.preventDefault();
      Milo.sound.tone({ f: 380 + p.i * 40, d: .05, v: .05, type: 'triangle' });
      recompute(d);
      paint(g);
    }
    function onMove(g, e) {
      var d = g.data;
      if (!d.drag) return;
      var target = cellAt(g, e);
      if (target < 0) return;
      var p = d.drag.p, guard = 0;
      while (guard++ < 30) {
        var head = p.path[p.path.length - 1];
        if (head === target || p.done) break;
        var hx = head % d.n, hy = (head / d.n) | 0, tx = target % d.n, ty = (target / d.n) | 0;
        var dx = tx - hx, dy = ty - hy, nx = hx, ny = hy;
        if (Math.abs(dx) >= Math.abs(dy)) nx += Math.sign(dx); else ny += Math.sign(dy);
        if (!extend(g, p, ny * d.n + nx)) break;
      }
    }
    function onUp(g) {
      var d = g.data;
      if (!d.drag) return;
      d.drag = null;
      d.moves++;
      g.set('Moves', d.moves);
      paint(g);
      checkWin(g);
    }
    /** Grow path p into cell c (adjacent to its head). Returns false when blocked. */
    function extend(g, p, c) {
      var d = g.data;
      var head = p.path[p.path.length - 1];
      if (p.path.length > 1 && p.path[p.path.length - 2] === c) { p.path.pop(); recompute(d); paint(g); return true; }
      var end = d.ends[c];
      if (end === p && c !== head && p.path.indexOf(c) === -1) {
        p.path.push(c); p.done = true; recompute(d); paint(g);
        Milo.sound.tone({ f: 620 + p.i * 30, f2: 900 + p.i * 30, d: .12, v: .07, type: 'triangle' });
        var r = svg.getBoundingClientRect(), hr = host.getBoundingClientRect();
        fx.burst(r.left - hr.left + ((c % d.n) + .5) / d.n * r.width, r.top - hr.top + (((c / d.n) | 0) + .5) / d.n * r.height, 16, COLS[p.i], 220);
        d.drag = null; d.moves++; g.set('Moves', d.moves);
        checkWin(g);
        return false;
      }
      if (end) return false;                      // someone else's endpoint
      var owner = d.cell[c];
      if (owner === p.i) return false;            // would loop onto itself
      if (owner >= 0) {                           // cut the other path here
        var o = d.pairs[owner];
        o.path = o.path.slice(0, o.path.indexOf(c));
        o.done = false;
        Milo.sound.tone({ f: 240, f2: 160, d: .07, v: .05, type: 'square' });
      }
      p.path.push(c);
      recompute(d);
      paint(g);
      return true;
    }

    function paint(g) {
      var d = g.data, n = d.n, flows = 0;
      // clear fills
      while (d.fillG.firstChild) d.fillG.removeChild(d.fillG.firstChild);
      d.pairs.forEach(function (p) {
        if (p.done) flows++;
        var pts = p.path.map(function (c) { return ((c % n) * C + C / 2) + ' ' + (((c / n) | 0) * C + C / 2); });
        p.line.setAttribute('d', pts.length ? 'M' + pts.join(' L') : '');
        p.line.setAttribute('opacity', d.drag && d.drag.p === p ? 1 : p.done ? .95 : .8);
        p.path.forEach(function (c) {
          el('rect', { x: (c % n) * C + 2, y: ((c / n) | 0) * C + 2, width: C - 4, height: C - 4, rx: 8, fill: COLS[p.i], opacity: .22 }, d.fillG);
        });
        p.fills.forEach(function (circ) { circ.setAttribute('stroke', p.done ? '#fff' : 'rgba(255,255,255,.25)'); circ.setAttribute('stroke-width', p.done ? 3 : 2); });
      });
      var filled = 0;
      for (var i = 0; i < d.cell.length; i++) if (d.cell[i] >= 0 || d.ends[i]) filled++;
      g.set('Flows', flows + '/' + d.pairs.length);
      hdr.innerHTML = '<b style="color:#fff">Level ' + (lvl + 1) + '</b> · ' + n + '×' + n + ' · ' + d.pairs.length + ' pairs · <span style="color:#7dd3fc">' + filled + '/' + n * n + ' cells covered</span>';
    }

    function checkWin(g) {
      var d = g.data;
      if (d.done) return;
      for (var i = 0; i < d.pairs.length; i++) if (!d.pairs[i].done) return;
      for (var c = 0; c < d.cell.length; c++) if (d.cell[c] < 0 && !d.ends[c]) return;
      d.done = true;
      var earned = Math.max(100, 400 + d.n * 40 - d.moves * 8 - Math.floor(d.time) * 2);
      g.score += earned;
      g.set('Score', U.fmt(g.score));
      Milo.sound.win();
      var r = svg.getBoundingClientRect(), hr = host.getBoundingClientRect();
      d.pairs.forEach(function (p, k) {
        setTimeout(function () {
          p.path.forEach(function (c, j) {
            if (j % 2) return;
            fx.burst(r.left - hr.left + ((c % d.n) + .5) / d.n * r.width, r.top - hr.top + (((c / d.n) | 0) + .5) / d.n * r.height, 4, COLS[p.i], 160);
          });
        }, k * 70);
      });
      var last = lvl >= LEVELS.length - 1;
      Milo.store.set('number-link:lvl', last ? 0 : lvl + 1);
      setTimeout(function () {
        if (last) {
          g.win({ emo: '🔗', title: 'Every grid linked!', text: 'All ' + LEVELS.length + ' levels solved. The last one took ' + d.moves + ' drags and ' + U.time(d.time) + '.', score: g.score });
          return;
        }
        lvl++;
        g.overlay({
          emo: '🔗', title: 'Grid complete!',
          text: d.moves + ' drags in ' + U.time(d.time) + ' — worth ' + earned + ' points. Next: ' + LEVELS[lvl][0] + '×' + LEVELS[lvl][0] + ' with ' + LEVELS[lvl][1].length + ' pairs.',
          score: g.score, best: g.best, newBest: Milo.store.setBest('number-link', g.score),
          actions: [
            { label: 'Next level →', primary: true, onClick: function () { next(g); } },
            { label: 'Start over', onClick: function () { lvl = 0; Milo.store.set('number-link:lvl', 0); g.restart(); } }
          ]
        });
      }, 900);
    }
    function next(g) {
      g.clearOverlay();
      var keep = g.score;
      reset(g);
      g.score = keep;
      g.set('Score', U.fmt(keep));
      g.state = 'play';
      g.best = Milo.store.best('number-link');
    }
    function reset(g) {
      lvl = U.clamp(lvl | 0, 0, LEVELS.length - 1);
      if (!fx) fx = makeFx();
      load(g);
    }

    var saved = Milo.store.get('number-link:lvl', 0) | 0;
    return Milo.domGame(host, {
      id: 'number-link',
      stats: ['Level', 'Flows', 'Moves', 'Score'],
      bg: '#080b1c',
      emo: '🔗',
      start: {
        title: 'Number Link',
        text: 'Drag a path from each number to its matching number. Paths cannot cross, ' +
          'and the level is only solved when every cell of the grid is covered by a path. ' +
          'Drag back along a path to shorten it; drag through another path to cut it.' +
          (saved > 0 ? ' Resuming at level ' + (saved + 1) + '.' : ''),
        keys: ['Drag between numbers']
      },
      preload: function () { lvl = U.clamp(saved, 0, LEVELS.length - 1); },
      init: reset,
      update: function (g, dt) {
        var d = g.data;
        if (d.done) return;
        d.time += dt;
      },
      destroy: function () {
        if (ro) { ro.disconnect(); ro = null; }
        if (fx) { fx.destroy(); fx = null; }
      }
    });
  }

  window.Milo.register({
    id: 'number-link', title: 'Number Link', emo: '🔗', category: 'Puzzle',
    tagline: 'Join the pairs, cross nothing, fill every cell',
    description: 'Each number appears twice and you draw a path between the two copies. ' +
      'Paths may never cross or touch another number, and — the rule that makes it a real ' +
      'puzzle — the grid must be completely full when you finish, so a short lazy route ' +
      'usually strands a corner. Twenty-two levels from 5×5 with four pairs to 8×8 with ' +
      'nine, every one checked by a solver to have a single answer. Tip: the pair whose ' +
      'twins sit on the same edge almost always hugs that edge.',
    controls: ['Drag'],
    colors: ['#3b82f6', '#f43f5e'],
    tags: ['flow', 'paths', 'logic', 'brain', 'levels'],
    mount: mount
  });
})();
