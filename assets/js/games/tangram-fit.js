/* Tangram Fit — drag and rotate the seven tans to fill the silhouette. */
(function () {
  'use strict';
  var W = 760, H = 600, SC = 58;
  var H2 = Math.SQRT1_2, S2 = Math.SQRT2;
  // Canonical tans, unit = small-triangle leg. Right angle / corner at origin.
  var SHAPES = {
    s: [[0, 0], [1, 0], [0, 1]],
    m: [[0, 0], [S2, 0], [0, S2]],
    l: [[0, 0], [2, 0], [0, 2]],
    q: [[0, 0], [1, 0], [1, 1], [0, 1]],
    p: [[0, 0], [1, 0], [2, 1], [1, 1]]
  };
  // Each figure: 7 placements [type, x, y, rotation index (45° CCW), flip]. All verified
  // offline: exact piece set, no overlaps, total area 8.
  var FIGS = [
    { name: 'Square', pieces: [['l', 2 * H2, 2 * H2, 5], ['l', 2 * H2, 2 * H2, 3], ['m', 4 * H2, 4 * H2, 4], ['q', 2 * H2, 2 * H2, 7], ['s', 3 * H2, H2, 7], ['s', 2 * H2, 2 * H2, 1], ['p', 0, 4 * H2, 7]] },
    { name: 'House', pieces: [['l', 0, 0, 0], ['l', 2, 2, 4], ['q', 2, 0, 0], ['s', 2, 1, 0], ['s', 3, 2, 4], ['m', 1, 3, 5], ['p', 3, 2, 0, 1]] },
    { name: 'Rocket', pieces: [['l', 0, 2, 0], ['l', 2, 4, 4], ['q', 0, 1, 0], ['s', 1, 1, 0], ['s', 2, 2, 4], ['m', 1, 5, 5], ['p', 3, 0, 0, 1]] },
    { name: 'Sailboat', pieces: [['s', 1, 1, 4], ['q', 1, 0, 0], ['m', 3, 0, 1], ['s', 2, 0, 0], ['p', 3, 0, 0], ['l', 3, 1, 0], ['l', 3, 1, 2]] },
    { name: 'Arrow', pieces: [['l', 3, 2, 6], ['l', 3, 2, 0], ['q', 1, 1.5, 0], ['s', 2, 1.5, 0], ['s', 3, 2.5, 4], ['m', 0, 2, 7], ['p', 1, 4, 2, 1]] },
    { name: 'Fish', pieces: [['l', 1, 0, 0], ['l', 3, 2, 4], ['m', 4, 1, 3], ['s', 1, 0, 2], ['s', 1, 2, 4], ['p', 1, 2, 0], ['q', 2, -1, 0]] },
    { name: 'Mushroom', pieces: [['l', 2, 3, 2], ['l', 2, 3, 0], ['m', 1.5, 2, 1], ['p', 1.5, 2, 0], ['q', 1.5, 0, 0], ['s', 1.5, 1, 0], ['s', 2.5, 2, 4]] },
    { name: 'Cat', pieces: [['q', 2, 4, 1], ['s', 2 - H2, 4 + H2, 1], ['s', 2 + H2, 4 + H2, 1], ['m', 2, 4, 5], ['l', 1, 3, 6], ['l', 3, 1, 2], ['p', 3, 1, 6, 1]] },
    { name: 'Trophy', pieces: [['m', 1, 0, 1], ['p', 1, 0, 0], ['s', 0, 0, 0], ['s', 3, 0, 2], ['q', 1, -1, 0], ['l', 0.5, -3, 0], ['l', 2.5, -1, 4]] },
    { name: 'Dog', pieces: [['l', 1, 0, 0], ['l', 3, 2, 4], ['m', 4, 1, 3], ['s', 4, 2, 4], ['p', 2, 0, 4], ['q', 2, -1, 0], ['s', 1, 2, 4]] },
    { name: 'Ship', pieces: [['m', 1, 0, 1], ['p', 1, 0, 0], ['q', 0.5, 1, 0], ['s', 1.5, 1, 0], ['s', 2.5, 2, 4], ['l', 1.5, 2, 2], ['l', 1.5, 2, 0]] },
    { name: 'Rabbit', pieces: [['l', 0, 0, 0], ['l', 2, 2, 4], ['m', 1, 3, 5], ['p', 1, 3 + 2 * H2, 3, 1], ['s', 1, 3, 3], ['q', -1, 0, 0], ['s', 2, 0, 0]] },
    { name: 'Armchair', pieces: [['m', 1, 1, 1], ['p', 1, 1, 0], ['s', 0, 1, 0], ['s', 3, 1, 2], ['l', 0, 2, 0], ['l', 2, 4, 4], ['q', 2, 0, 0]] },
    { name: 'Fir Tree', pieces: [['l', 2, 2, 2], ['l', 2, 2, 0], ['s', 0, 3, 6], ['s', 4, 3, 4], ['q', 1.5, 1, 0], ['m', 1.5, 1, 5], ['p', 3.5, 0, 0, 1]] },
    { name: 'Waving', pieces: [['l', 2, 2, 6], ['l', 2, 2, 4], ['q', 1.5, 2, 0], ['s', 1.5, 3, 0], ['s', 2.5, 4, 4], ['m', 2, 5, 5], ['p', 2.5, 2, 6, 1]] },
    { name: 'Swan', pieces: [['l', 1, 0, 0], ['l', 3, 2, 4], ['s', 3, 2, 2], ['p', 2, 2, 1], ['s', 2 + H2, 2 + 3 * H2, 3], ['m', 0, 1, 7], ['q', 1, 2, 0]] },
    { name: 'Bird', pieces: [['q', 2, 2, 0], ['l', 2, 2, 2], ['l', 3, 3, 6], ['s', 2, 3, 0], ['p', 3, 3, 2], ['m', 1, 1, 1], ['s', 2, 2, 6]] },
    { name: 'Big Triangle', pieces: [['l', 2, 0, 2], ['l', 2, 0, 0], ['m', 2, 2, 3], ['q', 0, 1, 0], ['s', 0, 1, 6], ['s', 0, 2, 0], ['p', 0, 4, 6]] }
  ];
  var COLORS = { l: ['#f43f5e', '#f97316'], m: ['#facc15'], q: ['#22c55e'], s: ['#38bdf8', '#a78bfa'], p: ['#f472b6'] };

  function tanPoly(type, x, y, r, flip) {
    var base = SHAPES[type], a = r * Math.PI / 4, c = Math.cos(a), s = Math.sin(a), out = [];
    for (var i = 0; i < base.length; i++) {
      var px = flip ? -base[i][0] : base[i][0], py = base[i][1];
      out.push([x + px * c - py * s, y + px * s + py * c]);
    }
    return out;
  }
  function centroid(p) {
    var x = 0, y = 0;
    for (var i = 0; i < p.length; i++) { x += p[i][0]; y += p[i][1]; }
    return [x / p.length, y / p.length];
  }
  function inside(p, x, y, eps) {
    // convex polygon, CCW or CW: point is inside when on the same side of every edge (with tolerance).
    var sgn = 0;
    for (var i = 0; i < p.length; i++) {
      var a = p[i], b = p[(i + 1) % p.length];
      var ex = b[0] - a[0], ey = b[1] - a[1], len = Math.hypot(ex, ey);
      var cr = (ex * (y - a[1]) - ey * (x - a[0])) / len;
      if (Math.abs(cr) <= eps) continue;
      var s = cr > 0 ? 1 : -1;
      if (sgn === 0) sgn = s; else if (s !== sgn) return false;
    }
    return true;
  }
  function axes(p) {
    var out = [];
    for (var i = 0; i < p.length; i++) {
      var a = p[i], b = p[(i + 1) % p.length], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
      out.push([-dy / l, dx / l]);
    }
    return out;
  }
  function overlapDepth(a, b) {
    var ax = axes(a).concat(axes(b)), depth = Infinity;
    for (var k = 0; k < ax.length; k++) {
      var n = ax[k], amin = Infinity, amax = -Infinity, bmin = Infinity, bmax = -Infinity, i, d;
      for (i = 0; i < a.length; i++) { d = a[i][0] * n[0] + a[i][1] * n[1]; if (d < amin) amin = d; if (d > amax) amax = d; }
      for (i = 0; i < b.length; i++) { d = b[i][0] * n[0] + b[i][1] * n[1]; if (d < bmin) bmin = d; if (d > bmax) bmax = d; }
      d = Math.min(amax, bmax) - Math.max(amin, bmin);
      if (d < depth) depth = d;
      if (d <= 0) return d;
    }
    return depth;
  }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var lvl = 0;

    function reset(g) {
      var d = g.data;
      lvl = U.clamp(lvl | 0, 0, FIGS.length - 1);
      var fig = FIGS[lvl];
      d.fig = fig;
      d.sol = fig.pieces.map(function (p) { return tanPoly(p[0], p[1], p[2], p[3], p[4]); });
      // silhouette bounds and screen origin
      var minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
      d.sol.forEach(function (p) { p.forEach(function (v) { minx = Math.min(minx, v[0]); maxx = Math.max(maxx, v[0]); miny = Math.min(miny, v[1]); maxy = Math.max(maxy, v[1]); }); });
      d.ox = W / 2 - (minx + maxx) / 2 * SC;
      d.oy = H / 2 + 6 + (miny + maxy) / 2 * SC;
      d.bbox = [minx, miny, maxx, maxy];
      // anchors: every silhouette vertex
      d.anchors = [];
      d.sol.forEach(function (p) { p.forEach(function (v) { d.anchors.push(v); }); });
      // coverage samples (strictly inside the silhouette)
      d.samples = [];
      for (var sx = minx + .05; sx < maxx; sx += .1) for (var sy = miny + .05; sy < maxy; sy += .1) {
        for (var k = 0; k < d.sol.length; k++) if (inside(d.sol[k], sx, sy, -.03)) { d.samples.push([sx, sy]); break; }
      }
      // pieces scattered in two columns beside the silhouette
      var counts = { l: 0, s: 0 };
      var types = U.shuffle(['l', 'l', 'm', 'q', 's', 's', 'p']);
      d.pieces = [];
      var leftX = (minx - .4) - 2.6, rightX = (maxx + .4) + .8;
      var half = (H / 2 - 120) / SC;
      types.forEach(function (t, i) {
        var col = t === 'l' ? COLORS.l[counts.l++] : t === 's' ? COLORS.s[counts.s++] : COLORS[t][0];
        var side = i % 2 === 0 ? 0 : 1;
        var row = Math.floor(i / 2);
        var pc = { type: t, x: 0, y: 0, r: U.randInt(0, 7), flip: t === 'p' && Math.random() < .5, col: col, placed: false };
        pc.poly = tanPoly(t, 0, 0, pc.r, pc.flip);
        var c = centroid(pc.poly);
        var tx = (side ? rightX + 1.2 : leftX + 1.2) + U.rand(-.2, .2);
        var ty = half - 1.1 - row * 2.2 + (side ? .5 : 0) + U.rand(-.2, .2);
        // world y centre of view
        var cy = (H / 2 + 6 - d.oy) / -SC + (miny + maxy) / 2;
        pc.x = tx - c[0]; pc.y = cy + ty - c[1];
        clampInside(d, pc);
        d.pieces.push(pc);
      });
      d.sel = null;
      d.drag = null;
      d.moves = 0;
      d.time = 0;
      d.solved = false;
      d.glow = 0;
      d.parts = [];
      d.buttons = [];
      g.set('Figure', (lvl + 1) + '/' + FIGS.length);
      g.set('Moves', 0);
      g.set('Time', '0:00');
      g.set('Score', U.fmt(g.score));
    }

    function refresh(pc) { pc.poly = tanPoly(pc.type, pc.x, pc.y, pc.r, pc.flip); }
    function toScreen(d, v) { return [d.ox + v[0] * SC, d.oy - v[1] * SC]; }
    function toWorld(d, x, y) { return [(x - d.ox) / SC, (d.oy - y) / SC]; }
    function clampInside(d, pc) {
      refresh(pc);
      var minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
      pc.poly.forEach(function (v) { minx = Math.min(minx, v[0]); maxx = Math.max(maxx, v[0]); miny = Math.min(miny, v[1]); maxy = Math.max(maxy, v[1]); });
      var wl = (10 - d.ox) / SC, wr = (W - 10 - d.ox) / SC, wt = (d.oy - 96) / SC, wb = (d.oy - (H - 70)) / SC;
      if (minx < wl) pc.x += wl - minx; if (maxx > wr) pc.x -= maxx - wr;
      if (maxy > wt) pc.y -= maxy - wt; if (miny < wb) pc.y += wb - miny;
      refresh(pc);
    }
    function rotate(g, pc, dir) {
      var c = centroid(pc.poly);
      pc.r = (pc.r + dir + 8) % 8;
      refresh(pc);
      var c2 = centroid(pc.poly);
      pc.x += c[0] - c2[0]; pc.y += c[1] - c2[1];
      clampInside(g.data, pc);
      snap(g, pc);
      g.data.moves++;
      g.set('Moves', g.data.moves);
      Milo.sound.tone({ f: 520, f2: 640, d: .05, v: .06, type: 'triangle' });
      check(g);
    }
    function flip(g, pc) {
      if (pc.type !== 'p') { rotate(g, pc, 2); return; }
      var c = centroid(pc.poly);
      pc.flip = !pc.flip;
      refresh(pc);
      var c2 = centroid(pc.poly);
      pc.x += c[0] - c2[0]; pc.y += c[1] - c2[1];
      clampInside(g.data, pc);
      snap(g, pc);
      g.data.moves++;
      g.set('Moves', g.data.moves);
      Milo.sound.tone({ f: 420, f2: 300, d: .07, v: .06, type: 'square' });
      check(g);
    }
    /** Pull the piece onto the nearest silhouette or neighbour vertex if one is close. */
    function snap(g, pc) {
      var d = g.data, best = null, bd = .34;
      var anchors = d.anchors.slice();
      d.pieces.forEach(function (o) { if (o !== pc) o.poly.forEach(function (v) { anchors.push(v); }); });
      pc.poly.forEach(function (v) {
        anchors.forEach(function (a) {
          var dx = a[0] - v[0], dy = a[1] - v[1], dist = Math.hypot(dx, dy);
          if (dist < bd) { bd = dist; best = [dx, dy]; }
        });
      });
      if (!best) return false;
      var ox = pc.x, oy = pc.y;
      pc.x += best[0]; pc.y += best[1];
      refresh(pc);
      for (var i = 0; i < d.pieces.length; i++) {
        var o = d.pieces[i];
        if (o !== pc && overlapDepth(pc.poly, o.poly) > .08) { pc.x = ox; pc.y = oy; refresh(pc); return false; }
      }
      pc.snapT = g.t;
      return true;
    }
    function check(g) {
      var d = g.data;
      if (d.solved) return;
      var i, j;
      for (i = 0; i < d.pieces.length; i++) for (j = i + 1; j < d.pieces.length; j++) {
        if (overlapDepth(d.pieces[i].poly, d.pieces[j].poly) > .03) return;
      }
      for (i = 0; i < d.samples.length; i++) {
        var s = d.samples[i], ok = false;
        for (j = 0; j < d.pieces.length; j++) if (inside(d.pieces[j].poly, s[0], s[1], .04)) { ok = true; break; }
        if (!ok) return;
      }
      solved(g);
    }
    function solved(g) {
      var d = g.data;
      d.solved = true;
      d.sel = null;
      var earned = Math.max(150, 1000 - Math.floor(d.time * 4) - d.moves * 6);
      g.score += earned;
      g.set('Score', U.fmt(g.score));
      Milo.sound.win();
      var c = toScreen(d, [(d.bbox[0] + d.bbox[2]) / 2, (d.bbox[1] + d.bbox[3]) / 2]);
      for (var i = 0; i < 90; i++) {
        var a = U.rand(0, Math.PI * 2), sp = U.rand(80, 380);
        d.parts.push({ x: c[0], y: c[1], vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, life: U.rand(.8, 1.6), r: U.rand(3, 7), c: U.choice(['#f43f5e', '#f97316', '#facc15', '#22c55e', '#38bdf8', '#a78bfa', '#f472b6', '#fff']) });
      }
      var last = lvl >= FIGS.length - 1;
      Milo.store.set('tangram-fit:lvl', last ? 0 : lvl + 1);
      setTimeout(function () {
        if (last) {
          g.win({ emo: '🧩', title: 'Every figure solved!', text: 'All ' + FIGS.length + ' silhouettes filled. Last one took ' + U.time(d.time) + ' and ' + d.moves + ' moves.', score: g.score });
          return;
        }
        lvl++;
        g.overlay({
          emo: '🧩', title: d.fig.name + ' complete!',
          text: U.time(d.time) + ' and ' + d.moves + ' moves — worth ' + earned + ' points. Next up: ' + FIGS[lvl].name + '.',
          score: g.score, best: g.best, newBest: Milo.store.setBest('tangram-fit', g.score),
          actions: [
            { label: 'Next figure →', primary: true, onClick: function () { next(g); } },
            { label: 'Start over', onClick: function () { lvl = 0; Milo.store.set('tangram-fit:lvl', 0); g.restart(); } }
          ]
        });
      }, 1100);
    }
    function next(g) {
      g.clearOverlay();
      var keep = g.score;
      reset(g);
      g.score = keep;
      g.set('Score', U.fmt(keep));
      g.state = 'play';
      g.best = Milo.store.best('tangram-fit');
    }
    function hit(d, x, y) {
      var w = toWorld(d, x, y);
      for (var i = d.pieces.length - 1; i >= 0; i--) if (inside(d.pieces[i].poly, w[0], w[1], .02)) return d.pieces[i];
      return null;
    }
    function toFront(d, pc) {
      var i = d.pieces.indexOf(pc);
      if (i >= 0) { d.pieces.splice(i, 1); d.pieces.push(pc); }
    }

    function drawPiece(c, d, pc, lift) {
      var pts = pc.poly.map(function (v) { return toScreen(d, v); });
      c.save();
      if (lift) { c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 22; c.shadowOffsetY = 10; }
      c.beginPath();
      pts.forEach(function (p, i) { i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); });
      c.closePath();
      c.fillStyle = pc.col;
      c.fill();
      c.shadowColor = 'transparent';
      // bevel highlight
      var cx = 0, cy = 0; pts.forEach(function (p) { cx += p[0] / pts.length; cy += p[1] / pts.length; });
      var gr = c.createRadialGradient(cx - 10, cy - 14, 4, cx, cy, 80);
      gr.addColorStop(0, 'rgba(255,255,255,.28)'); gr.addColorStop(1, 'rgba(0,0,0,.18)');
      c.fillStyle = gr; c.fill();
      c.lineJoin = 'round';
      c.lineWidth = pc === d.sel ? 3.5 : 2;
      c.strokeStyle = pc === d.sel ? '#ffffff' : 'rgba(0,0,0,.45)';
      c.stroke();
      if (pc.snapT != null && g_t - pc.snapT < .3) {
        c.globalAlpha = 1 - (g_t - pc.snapT) / .3;
        c.strokeStyle = '#fff'; c.lineWidth = 5; c.stroke();
      }
      c.restore();
    }
    var g_t = 0;

    function button(c, d, x, y, w, label, key) {
      U.roundRect(c, x, y, w, 36, 10);
      c.fillStyle = 'rgba(255,255,255,.09)'; c.fill();
      c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1; c.stroke();
      c.fillStyle = '#e2e8f0'; c.font = '700 14px Outfit, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(label, x + w / 2, y + 18);
      d.buttons.push({ x: x, y: y, w: w, h: 36, key: key });
    }

    return Milo.arcade(host, {
      id: 'tangram-fit',
      w: W, h: H, bg: '#10232a',
      stats: ['Figure', 'Moves', 'Time', 'Score'],
      emo: '🧩',
      noContextMenu: true,
      start: {
        title: 'Tangram Fit',
        text: 'Seven tans, one silhouette. Drag pieces onto the dark shape, tap a piece to turn it ' +
          '45°, and flip the parallelogram when it will not fit. Pieces click into place when ' +
          'their corners line up; the figure is solved once the silhouette is completely covered.',
        keys: ['Drag', 'Tap / R rotate', 'F / right-click flip']
      },
      preload: function () { lvl = U.clamp(Milo.store.get('tangram-fit:lvl', 0) | 0, 0, FIGS.length - 1); },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        if (d.solved || !d.sel) return;
        if (e.code === 'KeyR' || e.code === 'Space') { e.preventDefault(); rotate(g, d.sel, 1); }
        if (e.code === 'KeyF') flip(g, d.sel);
      },

      onPointer: function (g, type, x, y, e) {
        var d = g.data;
        if (g.state !== 'play' || d.solved) return;
        if (type === 'down') {
          for (var i = 0; i < d.buttons.length; i++) {
            var b = d.buttons[i];
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
              if (d.sel) { if (b.key === 'rot') rotate(g, d.sel, 1); else flip(g, d.sel); }
              else Milo.sound.click();
              return;
            }
          }
          var pc = hit(d, x, y);
          if (!pc) { d.sel = null; return; }
          d.sel = pc;
          toFront(d, pc);
          if (e && e.button === 2) { flip(g, pc); return; }
          var w = toWorld(d, x, y);
          d.drag = { pc: pc, offx: pc.x - w[0], offy: pc.y - w[1], sx: x, sy: y, moved: false };
        } else if (type === 'move') {
          if (!d.drag) return;
          var dr = d.drag, ww = toWorld(d, x, y);
          if (!dr.moved && Math.hypot(x - dr.sx, y - dr.sy) > 6) dr.moved = true;
          if (dr.moved) { dr.pc.x = ww[0] + dr.offx; dr.pc.y = ww[1] + dr.offy; refresh(dr.pc); }
        } else if (type === 'up') {
          if (!d.drag) return;
          var dg = d.drag; d.drag = null;
          if (!dg.moved) { rotate(g, dg.pc, 1); return; }
          clampInside(d, dg.pc);
          if (snap(g, dg.pc)) Milo.sound.tone({ f: 740, f2: 980, d: .07, v: .07, type: 'sine' });
          else Milo.sound.click();
          d.moves++;
          g.set('Moves', d.moves);
          check(g);
        }
      },

      update: function (g, dt) {
        var d = g.data;
        g_t = g.t;
        if (!d.solved) { d.time += dt; g.set('Time', U.time(d.time)); }
        else d.glow = Math.min(1, d.glow + dt * 2);
        for (var i = d.parts.length - 1; i >= 0; i--) {
          var p = d.parts[i];
          p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          if (p.life <= 0) d.parts.splice(i, 1);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        // backdrop: soft vignette + faint grid
        var bg = c.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, 520);
        bg.addColorStop(0, '#173238'); bg.addColorStop(1, '#0b1a1f');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(255,255,255,.035)'; c.lineWidth = 1;
        for (var gx = 0; gx < W; gx += SC / 2) { c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, H); c.stroke(); }
        for (var gy = 0; gy < H; gy += SC / 2) { c.beginPath(); c.moveTo(0, gy); c.lineTo(W, gy); c.stroke(); }

        // silhouette
        c.save();
        c.fillStyle = d.solved ? 'rgba(255,255,255,' + (.12 * d.glow) + ')' : '#07141a';
        c.strokeStyle = d.solved ? 'rgba(255,255,255,.25)' : '#07141a';
        c.lineWidth = 2; c.lineJoin = 'round';
        if (!d.solved) { c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 24; }
        c.beginPath();
        d.sol.forEach(function (p) {
          p.forEach(function (v, i) { var s = toScreen(d, v); i ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); });
          c.closePath();
        });
        c.fill();
        c.restore();

        d.pieces.forEach(function (pc) { drawPiece(c, d, pc, d.drag && d.drag.pc === pc); });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.min(1, p.life);
          c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        // title + hint
        c.textBaseline = 'alphabetic';
        c.fillStyle = '#e2e8f0'; c.font = '800 20px Outfit, sans-serif'; c.textAlign = 'left';
        c.fillText(d.fig.name, 22, H - 38);
        c.fillStyle = 'rgba(255,255,255,.45)'; c.font = '600 12px Outfit, sans-serif';
        c.fillText('Drag a tan · tap it to rotate · F or right-click flips the parallelogram', 22, H - 16);

        d.buttons = [];
        button(c, d, W - 214, H - 62, 96, '↻ Rotate', 'rot');
        button(c, d, W - 110, H - 62, 96, '⇋ Flip', 'flip');
      }
    });
  }

  window.Milo.register({
    id: 'tangram-fit', title: 'Tangram Fit', emo: '🧩', category: 'Puzzle',
    tagline: 'Seven tans, one silhouette, no gaps',
    description: 'The classic Chinese dissection puzzle: two large triangles, one medium, two ' +
      'small, a square and a parallelogram, and a black silhouette they must fill exactly. Tap ' +
      'a piece to turn it in 45° steps, drag it into place and it snaps when its corners meet ' +
      'the outline or a neighbour. Eighteen figures from the plain square through a sailboat, ' +
      'cat, swan and rabbit; points fall with time and moves. Tip: place the two big triangles ' +
      'first — they fix where everything else can go.',
    controls: ['Drag', 'Tap rotate', 'R rotate', 'F flip'],
    colors: ['#f43f5e', '#facc15'],
    tags: ['tangram', 'shapes', 'classic', 'brain', 'levels'],
    mount: mount
  });
})();
