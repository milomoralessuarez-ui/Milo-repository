/* Bridges — hashiwokakero: link every numbered island with 1–2 bridges, no crossings. */
(function () {
  'use strict';
  // [width, height, islands [x, y, bridges]] — every puzzle generator-verified to have exactly one solution.
  var PUZZLES = [
    [7, 7, [[6,5,3],[4,5,1],[6,1,3],[2,1,3],[2,4,1],[0,1,2],[0,5,1]]],
    [7, 7, [[3,2,4],[5,2,3],[5,4,5],[2,4,3],[5,6,2],[1,2,2],[0,4,2],[3,0,1]]],
    [7, 7, [[1,0,1],[4,0,4],[4,2,5],[1,2,2],[4,5,3],[6,0,1],[0,5,3],[0,1,2],[6,5,1]]],
    [8, 8, [[6,7,3],[6,4,1],[4,7,5],[4,2,3],[0,7,3],[2,2,3],[0,3,2],[0,0,3],[2,0,4],[7,2,1]]],
    [8, 8, [[0,7,3],[2,7,5],[2,2,1],[7,7,3],[7,3,5],[4,3,2],[7,1,3],[5,1,1],[0,2,3],[0,0,3],[4,0,1]]],
    [8, 8, [[2,0,3],[6,0,2],[6,2,4],[6,5,3],[2,4,3],[4,2,1],[4,5,4],[1,5,2],[0,0,1],[5,4,2],[1,3,1],[4,7,2]]],
    [9, 9, [[6,8,4],[2,8,4],[2,4,5],[8,8,2],[2,2,1],[4,4,2],[8,3,3],[6,5,1],[4,6,1],[5,3,2],[0,4,1],[3,3,1],[8,1,1]]],
    [9, 9, [[6,3,4],[2,3,4],[6,6,2],[2,5,2],[2,1,4],[5,1,4],[0,1,1],[7,1,2],[8,3,5],[4,6,1],[8,5,4],[2,8,1],[8,8,2],[8,0,2]]],
    [9, 9, [[0,0,4],[4,0,6],[0,3,3],[0,6,2],[4,2,5],[1,2,2],[7,2,2],[1,7,1],[7,0,2],[7,7,2],[3,7,2],[3,3,1],[4,5,1],[0,8,3],[4,8,2]]],
    [10, 10, [[0,9,2],[5,9,5],[0,7,3],[0,5,5],[4,5,5],[7,9,4],[5,6,2],[7,5,4],[9,5,3],[4,7,4],[4,3,1],[0,0,2],[2,0,3],[2,3,2],[9,1,1],[2,7,2]]],
    [10, 10, [[3,5,6],[6,5,1],[3,0,3],[9,0,3],[9,3,5],[5,3,2],[9,5,3],[0,5,4],[0,1,3],[3,7,3],[8,7,2],[2,1,1],[9,8,3],[3,9,3],[8,4,1],[5,8,1],[1,9,2]]],
    [10, 10, [[6,2,4],[8,2,3],[6,8,4],[2,2,6],[2,7,2],[2,0,1],[9,8,2],[6,0,3],[3,8,5],[8,4,4],[8,0,1],[3,5,2],[1,8,3],[1,4,1],[8,7,2],[0,2,4],[4,0,1],[0,6,2]]],
    [11, 11, [[10,7,3],[10,10,3],[4,7,6],[1,7,3],[4,5,6],[2,5,2],[6,10,3],[4,10,3],[4,3,2],[2,1,3],[8,5,2],[6,3,1],[10,3,3],[5,1,4],[8,3,1],[10,1,3],[6,8,2],[1,2,1],[9,8,1],[2,10,2]]],
    [11, 11, [[1,10,3],[6,10,4],[1,6,3],[1,3,2],[7,3,4],[6,5,3],[4,5,2],[7,7,3],[7,1,4],[4,1,2],[0,1,3],[4,7,3],[9,10,1],[7,9,3],[10,9,3],[10,3,1],[0,5,3],[9,7,3],[2,7,2],[10,1,1],[9,2,2],[0,9,1]]],
    [12, 12, [[0,3,2],[2,3,5],[2,8,5],[7,8,4],[2,0,3],[2,10,2],[4,3,4],[11,8,5],[7,11,4],[11,4,4],[7,0,2],[7,2,3],[7,4,2],[9,11,3],[5,2,3],[11,11,2],[0,11,2],[3,2,1],[0,8,1],[0,6,1],[9,9,2],[6,3,1],[4,7,2],[7,6,1]]],
    [12, 12, [[11,11,1],[8,11,2],[2,11,3],[2,7,5],[2,3,4],[8,7,5],[10,7,2],[8,9,3],[11,9,2],[4,3,4],[11,6,4],[9,3,1],[11,3,2],[4,5,2],[2,1,4],[6,5,2],[5,6,2],[0,1,3],[4,9,1],[9,1,1],[8,5,2],[11,1,1],[10,5,3],[10,0,3],[4,0,1],[0,3,1]]],
    [13, 13, [[12,5,4],[6,5,4],[6,0,4],[6,11,3],[12,0,2],[10,0,3],[12,10,5],[11,11,1],[4,0,4],[4,2,2],[10,10,3],[2,11,3],[2,8,5],[2,4,2],[10,3,4],[12,12,3],[4,5,1],[4,8,2],[2,2,1],[5,12,2],[7,3,3],[5,4,3],[7,1,1],[3,12,1],[5,1,2],[2,0,1],[10,6,3],[7,6,2]]],
    [13, 13, [[11,10,4],[5,10,3],[11,5,6],[8,5,7],[5,8,4],[3,5,5],[1,5,1],[7,8,3],[1,10,2],[11,1,3],[1,7,1],[8,7,1],[7,1,5],[9,8,2],[8,2,4],[2,8,2],[3,1,4],[0,1,3],[5,1,2],[7,3,3],[0,6,2],[7,6,1],[9,6,1],[4,3,1],[5,6,1],[11,12,3],[10,2,2],[6,12,3],[3,12,3],[1,12,2]]]
  ];
  var C = 60; // svg cell size
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

    /* ---- ripple / spark overlay ---- */
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
          if (p.kind === 'ring') {
            ctx.globalAlpha = (1 - k) * .8; ctx.strokeStyle = p.c; ctx.lineWidth = 3 * (1 - k) + 1;
            ctx.beginPath(); ctx.arc(p.x, p.y, 6 + k * p.r, 0, 7); ctx.stroke();
          } else {
            p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
            ctx.globalAlpha = 1 - k; ctx.fillStyle = p.c;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
        if (parts.length) raf = requestAnimationFrame(tick); else { raf = 0; ctx.clearRect(0, 0, cv.width, cv.height); }
      }
      function go() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
      return {
        ring: function (x, y, c) { size(); parts.push({ kind: 'ring', x: x, y: y, r: 44, c: c, t: 0, life: .55 }); go(); },
        burst: function (x, y, n, cols) {
          size();
          for (var i = 0; i < n; i++) { var a = U.rand(0, 6.283), s = U.rand(90, 360); parts.push({ kind: 'dot', x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 150, r: U.rand(3, 7), c: U.choice(cols), t: 0, life: U.rand(.7, 1.4) }); }
          go();
        },
        destroy: function () { cancelAnimationFrame(raf); cv.remove(); }
      };
    }

    /* ---- puzzle model ---- */
    function load(g) {
      var d = g.data, P = PUZZLES[lvl];
      d.w = P[0]; d.h = P[1];
      d.isl = P[2].map(function (a, i) { return { i: i, x: a[0], y: a[1], n: a[2], have: 0 }; });
      var at = {};
      d.isl.forEach(function (s) { at[s.x + ',' + s.y] = s; });
      d.edges = [];
      d.isl.forEach(function (a) {
        var x, y, b;
        for (x = a.x + 1; x < d.w; x++) { b = at[x + ',' + a.y]; if (b) { d.edges.push(mkEdge(a, b)); break; } }
        for (y = a.y + 1; y < d.h; y++) { b = at[a.x + ',' + y]; if (b) { d.edges.push(mkEdge(a, b)); break; } }
      });
      d.used = {};          // cell -> edge using it
      d.sel = null;
      d.time = 0;
      d.mistakes = 0;
      d.done = false;
      build(g);
      g.set('Puzzle', (lvl + 1) + '/' + PUZZLES.length);
      g.set('Time', '0:00');
      g.set('Score', U.fmt(g.score));
      updateLeft(g);
    }
    function mkEdge(a, b) {
      var cells = [], dx = Math.sign(b.x - a.x), dy = Math.sign(b.y - a.y), x = a.x + dx, y = a.y + dy;
      while (x !== b.x || y !== b.y) { cells.push(x + ',' + y); x += dx; y += dy; }
      return { a: a, b: b, n: 0, cells: cells, horiz: a.y === b.y };
    }
    function updateLeft(g) {
      var d = g.data, left = 0;
      d.isl.forEach(function (s) { if (s.have !== s.n) left++; });
      g.set('Islands', left + ' left');
      return left;
    }
    function connected(d) {
      var seen = {}, st = [d.isl[0]], c = 0;
      seen[0] = true;
      while (st.length) {
        var u = st.pop(); c++;
        d.edges.forEach(function (e) {
          if (!e.n) return;
          var v = e.a === u ? e.b : e.b === u ? e.a : null;
          if (v && !seen[v.i]) { seen[v.i] = true; st.push(v); }
        });
      }
      return c === d.isl.length;
    }

    /* ---- DOM ---- */
    function build(g) {
      var d = g.data;
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;height:100%;justify-content:center';
      hdr = document.createElement('div');
      hdr.style.cssText = 'color:#bfdbfe;font:600 .86rem Outfit,sans-serif;text-align:center';
      hdr.innerHTML = '<b style="color:#fff">Puzzle ' + (lvl + 1) + '</b> · ' + d.w + '×' + d.h + ' · ' + d.isl.length + ' islands · ' +
        '<span style="color:#7dd3fc">tap two islands in line, or a bridge, to cycle 1 → 2 → none</span>';
      wrap.appendChild(hdr);

      svg = el('svg', { viewBox: '0 0 ' + (d.w * C) + ' ' + (d.h * C), preserveAspectRatio: 'xMidYMid meet' });
      svg.style.cssText = 'display:block;border-radius:16px;background:radial-gradient(circle at 30% 20%,#0f4c81,#0a2a4a 70%);box-shadow:0 18px 40px rgba(0,0,0,.45);touch-action:none;user-select:none;-webkit-user-select:none;overflow:visible';
      // faint water grid
      var defs = el('defs', {}, svg);
      var pat = el('pattern', { id: 'hashi-water', width: C, height: C, patternUnits: 'userSpaceOnUse' }, defs);
      el('path', { d: 'M0 ' + (C / 2) + ' q' + (C / 4) + ' -8 ' + (C / 2) + ' 0 t' + (C / 2) + ' 0', fill: 'none', stroke: 'rgba(255,255,255,.07)', 'stroke-width': 2 }, pat);
      el('rect', { x: 0, y: 0, width: d.w * C, height: d.h * C, fill: 'url(#hashi-water)', rx: 16 }, svg);

      var candG = el('g', {}, svg), bridgeG = el('g', {}, svg), hitG = el('g', {}, svg), islG = el('g', {}, svg);
      d.edges.forEach(function (e) {
        var ax = e.a.x * C + C / 2, ay = e.a.y * C + C / 2, bx = e.b.x * C + C / 2, by = e.b.y * C + C / 2;
        e.cand = el('line', { x1: ax, y1: ay, x2: bx, y2: by, stroke: 'rgba(255,255,255,.10)', 'stroke-width': 2, 'stroke-dasharray': '3 7', 'stroke-linecap': 'round' }, candG);
        e.l1 = el('line', { x1: ax, y1: ay, x2: bx, y2: by, stroke: '#d9a066', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0 }, bridgeG);
        e.l2 = el('line', { x1: ax, y1: ay, x2: bx, y2: by, stroke: '#d9a066', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0 }, bridgeG);
        e.hit = el('line', { x1: ax, y1: ay, x2: bx, y2: by, stroke: 'rgba(0,0,0,0)', 'stroke-width': 22 }, hitG);
        e.hit.style.cursor = 'pointer';
        e.hit.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); ev.preventDefault(); if (g.state === 'play' && !d.done) { d.sel = null; paintSel(d); cycle(g, e); } });
      });
      d.isl.forEach(function (s) {
        var cx = s.x * C + C / 2, cy = s.y * C + C / 2;
        s.g = el('g', {}, islG);
        s.g.style.cursor = 'pointer';
        el('circle', { cx: cx, cy: cy + 3, r: 23, fill: 'rgba(0,0,0,.35)' }, s.g);
        s.ring = el('circle', { cx: cx, cy: cy, r: 23, fill: '#f3e3bd', stroke: '#a16207', 'stroke-width': 3 }, s.g);
        s.txt = el('text', { x: cx, y: cy + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': 'Outfit, sans-serif', 'font-weight': 800, 'font-size': 24, fill: '#3f2a0a' }, s.g);
        s.txt.textContent = s.n;
        var hit = el('circle', { cx: cx, cy: cy, r: 29, fill: 'rgba(0,0,0,0)' }, s.g);
        hit.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); ev.preventDefault(); onIsland(g, s); });
      });
      svg.addEventListener('pointerdown', function () { if (d.sel) { d.sel = null; paintSel(d); } });

      wrap.appendChild(svg);
      g.root.innerHTML = '';
      g.root.appendChild(wrap);
      fit(g);
      if (!ro && window.ResizeObserver) { ro = new ResizeObserver(function () { fit(g); }); ro.observe(g.root); }
      paintAll(d);
    }
    function fit(g) {
      if (!svg) return;
      var d = g.data, r = g.root.getBoundingClientRect();
      var aw = r.width - 40, ah = r.height - 76 - 40;
      var s = Math.max(16, Math.min(aw / d.w, ah / d.h, 64));
      svg.style.width = (s * d.w) + 'px';
      svg.style.height = (s * d.h) + 'px';
    }
    function paintSel(d) {
      d.isl.forEach(function (s) { s.ring.setAttribute('stroke', s === d.sel ? '#38bdf8' : s.have === s.n ? '#16a34a' : '#a16207'); s.ring.setAttribute('stroke-width', s === d.sel ? 5 : 3); });
    }
    function paintAll(d) {
      d.edges.forEach(function (e) {
        var off = e.n === 2 ? 5 : 0;
        var ax = e.a.x * C + C / 2, ay = e.a.y * C + C / 2, bx = e.b.x * C + C / 2, by = e.b.y * C + C / 2;
        var ox = e.horiz ? 0 : off, oy = e.horiz ? off : 0;
        e.l1.setAttribute('opacity', e.n ? 1 : 0);
        e.l2.setAttribute('opacity', e.n === 2 ? 1 : 0);
        e.l1.setAttribute('x1', ax - ox); e.l1.setAttribute('y1', ay - oy); e.l1.setAttribute('x2', bx - ox); e.l1.setAttribute('y2', by - oy);
        e.l2.setAttribute('x1', ax + ox); e.l2.setAttribute('y1', ay + oy); e.l2.setAttribute('x2', bx + ox); e.l2.setAttribute('y2', by + oy);
        e.cand.setAttribute('opacity', e.n ? 0 : 1);
      });
      d.isl.forEach(function (s) {
        var full = s.have === s.n;
        s.ring.setAttribute('fill', full ? '#bbf7d0' : '#f3e3bd');
        s.txt.setAttribute('fill', full ? '#14532d' : '#3f2a0a');
      });
      paintSel(d);
    }

    function svgPoint(d, x, y) {
      var r = svg.getBoundingClientRect(), hr = host.getBoundingClientRect();
      return [r.left - hr.left + (x / (d.w * C)) * r.width, r.top - hr.top + (y / (d.h * C)) * r.height];
    }

    function onIsland(g, s) {
      var d = g.data;
      if (g.state !== 'play' || d.done) return;
      if (d.sel && d.sel !== s) {
        var e = null;
        d.edges.forEach(function (q) { if ((q.a === d.sel && q.b === s) || (q.a === s && q.b === d.sel)) e = q; });
        if (e) { cycle(g, e); d.sel = null; paintSel(d); return; }
        Milo.sound.tone({ f: 200, f2: 160, d: .1, v: .06, type: 'square' });
      }
      d.sel = d.sel === s ? null : s;
      if (d.sel) Milo.sound.click();
      paintSel(d);
    }

    function cycle(g, e) {
      var d = g.data;
      var next = (e.n + 1) % 3;
      if (next === 1) {
        // crossing or capacity check
        for (var i = 0; i < e.cells.length; i++) if (d.used[e.cells[i]]) return fail(g, e, 'crossing');
        if (e.a.have >= e.a.n || e.b.have >= e.b.n) return fail(g, e, 'full');
      } else if (next === 2) {
        if (e.a.have >= e.a.n || e.b.have >= e.b.n) next = 0;
      }
      var delta = next - e.n;
      e.n = next;
      e.a.have += delta; e.b.have += delta;
      if (next) e.cells.forEach(function (c) { d.used[c] = e; }); else e.cells.forEach(function (c) { delete d.used[c]; });
      var mx = (e.a.x + e.b.x) / 2 * C + C / 2, my = (e.a.y + e.b.y) / 2 * C + C / 2, p = svgPoint(d, mx, my);
      if (next) { fx.ring(p[0], p[1], '#7dd3fc'); Milo.sound.tone({ f: next === 2 ? 520 : 400, f2: next === 2 ? 700 : 520, d: .09, v: .07, type: 'triangle' }); }
      else Milo.sound.tone({ f: 300, f2: 200, d: .08, v: .05, type: 'triangle' });
      paintAll(d);
      var left = updateLeft(g);
      if (!left && connected(d)) solved(g);
    }
    function fail(g, e, why) {
      var d = g.data;
      d.mistakes++;
      Milo.sound.tone({ f: 160, f2: 90, d: .16, v: .08, type: 'sawtooth' });
      var line = e.cand;
      line.setAttribute('stroke', '#fb7185'); line.setAttribute('stroke-dasharray', '');
      line.setAttribute('opacity', 1);
      setTimeout(function () { line.setAttribute('stroke', 'rgba(255,255,255,.10)'); line.setAttribute('stroke-dasharray', '3 7'); }, 350);
      hdr.innerHTML = '<span style="color:#fb7185;font-weight:700">' + (why === 'crossing' ? 'Bridges cannot cross.' : 'That island already has all its bridges.') + '</span>';
      return false;
    }

    function solved(g) {
      var d = g.data;
      d.done = true;
      var earned = Math.max(120, 300 + d.isl.length * 30 - Math.floor(d.time) * 3 - d.mistakes * 15);
      g.score += earned;
      g.set('Score', U.fmt(g.score));
      Milo.sound.win();
      d.isl.forEach(function (s, i) {
        setTimeout(function () { var p = svgPoint(d, s.x * C + C / 2, s.y * C + C / 2); fx.burst(p[0], p[1], 10, ['#fde68a', '#7dd3fc', '#fff', '#86efac']); }, i * 40);
      });
      var last = lvl >= PUZZLES.length - 1;
      Milo.store.set('bridges-hashi:lvl', last ? 0 : lvl + 1);
      setTimeout(function () {
        if (last) {
          g.win({ emo: '🌉', title: 'Every archipelago linked!', text: 'All ' + PUZZLES.length + ' puzzles solved. Last one: ' + U.time(d.time) + ' with ' + d.mistakes + ' slips.', score: g.score });
          return;
        }
        lvl++;
        g.overlay({
          emo: '🌉', title: 'All islands connected!',
          text: U.time(d.time) + ', ' + d.mistakes + ' rejected bridges — worth ' + earned + ' points. Next: ' + PUZZLES[lvl][0] + '×' + PUZZLES[lvl][1] + ' with ' + PUZZLES[lvl][2].length + ' islands.',
          score: g.score, best: g.best, newBest: Milo.store.setBest('bridges-hashi', g.score),
          actions: [
            { label: 'Next puzzle →', primary: true, onClick: function () { next(g); } },
            { label: 'Start over', onClick: function () { lvl = 0; Milo.store.set('bridges-hashi:lvl', 0); g.restart(); } }
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
      g.best = Milo.store.best('bridges-hashi');
    }
    function reset(g) {
      lvl = U.clamp(lvl | 0, 0, PUZZLES.length - 1);
      if (!fx) fx = makeFx();
      load(g);
    }

    var saved = Milo.store.get('bridges-hashi:lvl', 0) | 0;
    return Milo.domGame(host, {
      id: 'bridges-hashi',
      stats: ['Puzzle', 'Islands', 'Time', 'Score'],
      bg: '#071c33',
      emo: '🌉',
      start: {
        title: 'Bridges',
        text: 'Each island shows how many bridges must reach it. Bridges run straight ' +
          'horizontally or vertically, at most two between the same pair, never crossing, ' +
          'and when you are done every island must be reachable from every other.' +
          (saved > 0 ? ' Resuming at puzzle ' + (saved + 1) + '.' : ''),
        keys: ['Tap island → island', 'Tap a bridge to cycle']
      },
      preload: function () { lvl = U.clamp(saved, 0, PUZZLES.length - 1); },
      init: reset,
      update: function (g, dt) {
        var d = g.data;
        if (d.done) return;
        d.time += dt;
        g.set('Time', U.time(d.time));
      },
      destroy: function () {
        if (ro) { ro.disconnect(); ro = null; }
        if (fx) { fx.destroy(); fx = null; }
      }
    });
  }

  window.Milo.register({
    id: 'bridges-hashi', title: 'Bridges', emo: '🌉', category: 'Puzzle',
    tagline: 'Hashiwokakero — link the islands, never cross',
    description: 'Numbered islands sit in the sea and the number is how many bridges must ' +
      'touch that island. Tap two islands in a straight line to build one, tap again for a ' +
      'double, once more to clear it. Bridges may not cross and the finished network has to ' +
      'be one connected whole. Eighteen puzzles from a 7×7 with seven islands to a 13×13 with ' +
      'thirty, each checked to have exactly one solution. Tip: start with the 1s and 2s in ' +
      'corners — they usually have only one place to go.',
    controls: ['Tap two islands', 'Tap a bridge'],
    colors: ['#0f4c81', '#d9a066'],
    tags: ['hashi', 'logic', 'islands', 'brain', 'levels'],
    mount: mount
  });
})();
