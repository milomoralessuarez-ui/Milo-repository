/* Domino Run — lay dominoes, stairs and springs to link the push to the bell. */
(function () {
  'use strict';
  var W = 900, H = 560, STEP = 1 / 120, DH = 44, DW = 10, BALL_R = 12, G = 900, SW = 36, SH = 28, TR = 24, PLAT_T = 16;

  /**
   * plats: [x, topY, width]. doms: fixed dominoes [x, y]; the first one gets the push.
   * target: [x, floorY] — the bell hangs just above that point. sol: a placement that the
   * authoring harness runs through the physics to prove the level is solvable.
   */
  var LEVELS = [
    { name: 'Nudge', plats: [[24, 480, 852]], doms: [[140, 480]], target: [420, 480], inv: { dom: 10 },
      sol: [172, 204, 236, 268, 300, 332, 364, 396].map(function (x) { return { t: 'dom', x: x, y: 480 }; }) },
    { name: 'Long line', plats: [[24, 480, 852]], doms: [[100, 480]], target: [700, 480], inv: { dom: 20 },
      sol: [134, 168, 202, 236, 270, 304, 338, 372, 406, 440, 474, 508, 542, 576, 610, 644, 676].map(function (x) { return { t: 'dom', x: x, y: 480 }; }) },
    { name: 'Step down', plats: [[24, 380, 336], [360, 480, 516]], doms: [[100, 380]], target: [600, 480], inv: { dom: 12, stair: 1 },
      sol: [134, 168, 202, 236, 270, 304, 338].map(function (x) { return { t: 'dom', x: x, y: 380 }; })
        .concat([{ t: 'stair', x: 360, y: 380, dir: 1 }], [486, 518, 550, 582].map(function (x) { return { t: 'dom', x: x, y: 480 }; })) },
    { name: 'Spring up', plats: [[24, 480, 440], [464, 380, 412]], doms: [[100, 480]], balls: [[300, 468]], target: [780, 380], inv: { dom: 12, spring: 1 },
      sol: [134, 168, 202, 236, 270].map(function (x) { return { t: 'dom', x: x, y: 480 }; })
        .concat([{ t: 'spring', x: 430, y: 480 }], [660, 694, 728].map(function (x) { return { t: 'dom', x: x, y: 380 }; })) },
    { name: 'Double drop', plats: [[24, 300, 220], [244, 390, 220], [464, 480, 412]], doms: [[80, 300]], target: [720, 480], inv: { dom: 14, stair: 2 },
      sol: [116, 152, 188, 224].map(function (x) { return { t: 'dom', x: x, y: 300 }; })
        .concat([{ t: 'stair', x: 244, y: 300, dir: 1 }], [372, 408, 444].map(function (x) { return { t: 'dom', x: x, y: 390 }; }),
          [{ t: 'stair', x: 464, y: 390, dir: 1 }], [592, 628, 664, 700].map(function (x) { return { t: 'dom', x: x, y: 480 }; })) },
    { name: 'Ball drop', plats: [[24, 300, 260], [24, 480, 852]], doms: [[100, 300]], balls: [[250, 288]], target: [560, 480], inv: { dom: 10 },
      sol: [134, 168, 202].map(function (x) { return { t: 'dom', x: x, y: 300 }; })
        .concat([420, 454, 488, 522].map(function (x) { return { t: 'dom', x: x, y: 480 }; })) },
    { name: 'Pit jump', plats: [[24, 480, 300], [400, 480, 476]], doms: [[80, 480]], balls: [[200, 468]], target: [640, 480], inv: { dom: 10, spring: 1 },
      sol: [114, 148].map(function (x) { return { t: 'dom', x: x, y: 480 }; })
        .concat([{ t: 'spring', x: 300, y: 480 }], [540, 574, 608].map(function (x) { return { t: 'dom', x: x, y: 480 }; })) },
    { name: 'About face', plats: [[24, 480, 852]], doms: [[450, 480]], push: -1, target: [120, 480], inv: { dom: 12 },
      sol: [418, 386, 354, 322, 290, 258, 226, 194, 162].map(function (x) { return { t: 'dom', x: x, y: 480 }; }) },
    { name: 'Valley', plats: [[24, 280, 200], [224, 380, 160], [384, 480, 492]], doms: [[70, 280]], target: [800, 480], inv: { dom: 18, stair: 2 },
      sol: [104, 138, 172, 206].map(function (x) { return { t: 'dom', x: x, y: 280 }; })
        .concat([{ t: 'stair', x: 224, y: 280, dir: 1 }], [352].map(function (x) { return { t: 'dom', x: x, y: 380 }; }),
          [{ t: 'stair', x: 384, y: 380, dir: 1 }], [512, 546, 580, 614, 648, 682, 716, 750, 784].map(function (x) { return { t: 'dom', x: x, y: 480 }; })) },
    { name: 'Bounce house', plats: [[24, 480, 852], [520, 330, 356]], doms: [[80, 480]], balls: [[240, 468]], target: [800, 330], inv: { dom: 12, spring: 1 },
      sol: [114, 148, 182, 216].map(function (x) { return { t: 'dom', x: x, y: 480 }; })
        .concat([{ t: 'spring', x: 440, y: 480 }], [600, 636, 672, 708, 744].map(function (x) { return { t: 'dom', x: x, y: 330 }; })) },
    { name: 'Pinball', plats: [[24, 480, 300], [420, 400, 180], [700, 480, 176]], doms: [[80, 480]], balls: [[210, 468]], target: [800, 480], inv: { dom: 8, spring: 2 },
      sol: [114, 148, 182].map(function (x) { return { t: 'dom', x: x, y: 480 }; })
        .concat([{ t: 'spring', x: 290, y: 480 }, { t: 'spring', x: 580, y: 400 }], [760].map(function (x) { return { t: 'dom', x: x, y: 480 }; })) },
    { name: 'Grand finale', plats: [[24, 300, 240], [264, 390, 236], [500, 480, 376]], doms: [[70, 300]], balls: [[640, 468]], target: [830, 480], inv: { dom: 16, stair: 2 },
      sol: [104, 138, 172, 206, 240].map(function (x) { return { t: 'dom', x: x, y: 300 }; })
        .concat([{ t: 'stair', x: 264, y: 300, dir: 1 }], [392, 426, 460, 486].map(function (x) { return { t: 'dom', x: x, y: 390 }; }),
          [{ t: 'stair', x: 500, y: 390, dir: 1 }]) }
  ];

  /* ---------------------------------------------------------- geometry */
  function ptIn(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }
  function segHit(ax, ay, bx, by, cx, cy, dx, dy) {
    var d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
    if (Math.abs(d) < 1e-9) return false;
    var u = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d;
    var v = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d;
    return u >= 0 && u <= 1 && v >= 0 && v <= 1;
  }
  function segRect(ax, ay, bx, by, r) {
    if (ptIn(ax, ay, r) || ptIn(bx, by, r)) return true;
    return segHit(ax, ay, bx, by, r.x, r.y, r.x + r.w, r.y) || segHit(ax, ay, bx, by, r.x + r.w, r.y, r.x + r.w, r.y + r.h) ||
      segHit(ax, ay, bx, by, r.x, r.y + r.h, r.x + r.w, r.y + r.h) || segHit(ax, ay, bx, by, r.x, r.y, r.x, r.y + r.h);
  }
  function segDist(ax, ay, bx, by, px, py) {
    var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    var t = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)) : 0;
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }
  function rectsOverlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function circleRect(cx, cy, r, rc) {
    var x = Math.max(rc.x, Math.min(cx, rc.x + rc.w)), y = Math.max(rc.y, Math.min(cy, rc.y + rc.h));
    return Math.hypot(cx - x, cy - y) < r;
  }
  function domRect(o) { return { x: o.x - DW / 2, y: o.y - DH, w: DW, h: DH }; }

  /* ------------------------------------------------------------ physics */
  var Sim = {
    make: function (L, placed) {
      var s = {
        plats: L.plats.map(function (p) { return { x: p[0], y: p[1], w: p[2] }; }),
        doms: [], balls: [], springs: [], debris: [], stairs: [],
        target: { x: L.target[0], y: L.target[1] - 22 }, push: L.push || 1,
        t: 0, won: false, idle: 0, started: false, done: null, event: null
      };
      function mkDom(x, y, fixed, stair) { return { x: x, y: y, a: 0, dir: 0, om: 0, rest: Math.PI / 2, state: 'up', fixed: fixed, stair: stair, kicked: {} }; }
      L.doms.forEach(function (dm) { s.doms.push(mkDom(dm[0], dm[1], true)); });
      (L.balls || []).forEach(function (b) { s.balls.push({ x: b[0], y: b[1], vx: 0, vy: 0, r: BALL_R, grounded: false, boings: 0 }); });
      (L.springs || []).forEach(function (sp) { s.springs.push({ x: sp[0], y: sp[1], sq: 0, cd: 0 }); });
      (placed || []).forEach(function (p) {
        if (p.t === 'dom') s.doms.push(mkDom(p.x, p.y, false));
        else if (p.t === 'spring') s.springs.push({ x: p.x, y: p.y, sq: 0, cd: 0, placed: true });
        else if (p.t === 'stair') {
          s.stairs.push(p);
          for (var k = 0; k < 3; k++) {
            var sx = p.dir > 0 ? p.x + k * SW : p.x - (k + 1) * SW, sy = p.y + (k + 1) * SH;
            s.plats.push({ x: sx, y: sy, w: SW, stair: true });
            s.doms.push(mkDom(sx + SW / 2, sy, false, true));
          }
        }
      });
      return s;
    },

    topple: function (s, o, dir, om) {
      if (o.state !== 'up') return;
      o.state = 'fall'; o.dir = dir; o.om = Math.max(o.om, om);
      s.event = 'topple';
    },

    push: function (s) { Sim.topple(s, s.doms[0], s.push, 1.6); s.started = true; },

    step: function (s) {
      if (!s.started || s.done) return;
      var dt = STEP, active = false, tg = s.target;
      s.t += dt; s.event = null;

      s.doms.forEach(function (o) {
        if (o.state !== 'fall') return;
        active = true;
        o.om += (9 + 16 * Math.sin(o.a)) * dt;
        o.a += o.om * dt;
        var landed = false;
        if (o.a >= o.rest) { o.a = o.rest; o.state = 'rest'; landed = true; }
        var tipx = o.x + o.dir * DH * Math.sin(o.a), tipy = o.y - DH * Math.cos(o.a);
        s.doms.forEach(function (q) {
          if (q === o || q.state !== 'up') return;
          var r = domRect(q); r.x -= 3; r.w += 6; r.y -= 3; r.h += 3;
          if (ptIn(tipx, tipy, r) || segRect(o.x, o.y, tipx, tipy, r)) {
            Sim.topple(s, q, o.dir, .9 + o.om * .4);
            if (o.state === 'fall') o.rest = Math.min(Math.PI / 2, o.a + .35);
          }
        });
        s.balls.forEach(function (b, bi) {
          if (o.kicked[bi]) return;
          if (segDist(o.x, o.y, tipx, tipy, b.x, b.y) < b.r + 4) {
            // A clean, predictable shove: dominoes always send the ball off at the same pace.
            b.vx = o.dir * 240; b.vy = -60; b.grounded = false;
            o.kicked[bi] = true; s.event = 'kick';
          }
        });
        if (Math.hypot(tipx - tg.x, tipy - tg.y) < TR + 2) s.won = true;
        if (landed && o.a >= Math.PI / 2 - .01) {
          // Lying flat with most of its length past the edge: it goes over.
          var under = s.plats.some(function (p) { return tipx >= p.x - 2 && tipx <= p.x + p.w + 2 && Math.abs(p.y - o.y) < 3; });
          if (!under) {
            var edge = null;
            s.plats.forEach(function (p) { if (Math.abs(p.y - o.y) < 3 && o.x >= p.x - 2 && o.x <= p.x + p.w + 2) edge = o.dir > 0 ? p.x + p.w : p.x; });
            if (edge != null && Math.abs(tipx - edge) > DH * .45) {
              o.state = 'gone';
              s.debris.push({ x: o.x + o.dir * DH * .5, y: o.y - DW / 2 - 2, w: DH, h: DW, vx: o.dir * 70, vy: 0, dir: o.dir, rot: 0, done: false, kicked: {} });
              s.event = 'drop';
            }
          }
        }
      });

      s.debris.forEach(function (db) {
        if (db.done) return;
        active = true;
        var py = db.y;
        db.vy += G * dt; db.x += db.vx * dt; db.y += db.vy * dt; db.rot += db.dir * 3 * dt;
        s.plats.forEach(function (p) {
          if (db.vy <= 0) return;
          if (db.x + db.w / 2 > p.x && db.x - db.w / 2 < p.x + p.w && db.y + db.h / 2 >= p.y && py + db.h / 2 <= p.y + 6) {
            db.y = p.y - db.h / 2; db.vy = 0; db.vx *= .3;
            if (Math.abs(db.vx) < 20) db.done = true;
          }
        });
        var rc = { x: db.x - db.w / 2, y: db.y - db.h / 2, w: db.w, h: db.h };
        s.doms.forEach(function (q) { if (q.state === 'up' && rectsOverlap(rc, domRect(q))) Sim.topple(s, q, db.dir, 1.2); });
        s.balls.forEach(function (b, bi) {
          if (!db.kicked[bi] && circleRect(b.x, b.y, b.r, rc)) { b.vx += db.dir * 180; b.vy -= 160; b.grounded = false; db.kicked[bi] = true; }
        });
        if (Math.hypot(db.x - tg.x, db.y - tg.y) < TR + 14) s.won = true;
        if (db.y > 700) db.done = true;
      });

      s.balls.forEach(function (b) {
        var py = b.y;
        b.vy += G * dt; b.x += b.vx * dt; b.y += b.vy * dt;
        var grounded = false;
        s.springs.forEach(function (sp) {
          // Fires whether the ball drops onto the pad or rolls into it along the floor.
          var top = sp.y - 14;
          if (sp.cd > 0) { sp.cd -= dt; return; }
          if (b.vy > -50 && Math.abs(b.x - sp.x) < 20 && b.y + b.r >= top - 2 && b.y + b.r <= sp.y + 6 && b.boings < 6) {
            b.y = top - b.r; b.vy = -640; sp.sq = 1; sp.cd = .4; b.boings++; s.event = 'spring';
            if (Math.abs(b.vx) < 40) b.vx = 80 * (b.vx < 0 ? -1 : 1);
          }
        });
        s.plats.forEach(function (p) {
          var rc = { x: p.x, y: p.y, w: p.w, h: PLAT_T };
          var qx = Math.max(rc.x, Math.min(b.x, rc.x + rc.w)), qy = Math.max(rc.y, Math.min(b.y, rc.y + rc.h));
          var dx = b.x - qx, dy = b.y - qy, dist = Math.hypot(dx, dy);
          if (dist >= b.r + .5) return;
          var nx, ny;
          if (dist < 1e-4) { nx = 0; ny = -1; } else { nx = dx / dist; ny = dy / dist; }
          if (dist < b.r) { b.x += nx * (b.r - dist); b.y += ny * (b.r - dist); }
          if (ny < -.5) { grounded = true; if (b.vy > 0) b.vy = b.vy > 90 ? -b.vy * .25 : 0; }
          else if (Math.abs(nx) > .5) { if ((b.vx > 0) === (nx < 0)) b.vx *= -.5; }
          else if (b.vy < 0) b.vy = -b.vy * .2;
        });
        if (grounded) b.vx *= Math.pow(.5, dt);
        b.grounded = grounded;
        s.doms.forEach(function (q) {
          if (q.state !== 'up') return;
          if (circleRect(b.x, b.y, b.r, domRect(q))) { Sim.topple(s, q, b.vx >= 0 ? 1 : -1, .7 + Math.abs(b.vx) / 220); b.vx *= .6; }
        });
        if (Math.hypot(b.x - tg.x, b.y - tg.y) < TR + b.r) s.won = true;
        if (Math.abs(b.vx) > 6 || !grounded) active = true;
        if (b.y > 700) b.gone = true;
      });
      s.balls = s.balls.filter(function (b) { return !b.gone; });
      s.springs.forEach(function (sp) { sp.sq = Math.max(0, sp.sq - dt * 3); });

      if (s.won) { s.done = 'win'; s.event = 'win'; return; }
      if (!active) { s.idle += dt; if (s.idle > .7) s.done = 'fail'; } else s.idle = 0;
    },

    run: function (L, placed, maxT) {
      var s = Sim.make(L, placed);
      Sim.push(s);
      while (!s.done && s.t < (maxT || 20)) Sim.step(s);
      return s;
    }
  };

  /* --------------------------------------------------------------- game */
  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var TOOLS = [{ t: 'dom', label: 'Domino', key: '1' }, { t: 'stair', label: 'Stairs', key: '2' }, { t: 'spring', label: 'Spring', key: '3' }];

    function loadLevel(g, n) {
      var d = g.data, L = LEVELS[n];
      d.level = n; d.L = L;
      d.inv = { dom: L.inv.dom || 0, stair: L.inv.stair || 0, spring: L.inv.spring || 0 };
      d.placed = [];
      d.sim = Sim.make(L, d.placed);
      d.mode = 'edit';
      d.tool = 'dom';
      d.attempts = 0;
      d.intro = 1.2;
      d.wait = 0;
      d.acc = 0;
      d.ghost = null;
      d.hover = null;
      g.set('Level', (n + 1) + '/' + LEVELS.length);
      updatePieces(g);
    }

    function updatePieces(g) {
      var d = g.data;
      g.set('Pieces', d.inv.dom + d.inv.stair + d.inv.spring);
    }

    function reset(g) {
      var d = g.data;
      d.parts = []; d.shake = 0; d.flash = null; d.bell = 0;
      loadLevel(g, 0);
      g.set('Score', 0);
    }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = U.rand(30, spd || 200);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 50, life: U.rand(.3, .7), max: .7, col: col });
      }
    }

    /** Snap a pointer position to a valid placement for the current tool, or null. */
    function snap(d, px, py) {
      var L = d.L, best = null;
      L.plats.forEach(function (p) {
        var x0 = p[0], y0 = p[1], w = p[2];
        if (px < x0 - 40 || px > x0 + w + 40) return;
        var dy = Math.abs(py - y0);
        if (dy > 90) return;
        if (!best || dy < best.dy) best = { x: x0, y: y0, w: w, dy: dy };
      });
      if (!best) return null;
      var tool = d.tool;
      if (tool === 'dom') {
        var x = U.clamp(px, best.x + 8, best.x + best.w - 8);
        var ok = !d.sim.doms.some(function (o) { return Math.abs(o.y - best.y) < 2 && Math.abs(o.x - x) < 18; }) &&
          !d.sim.springs.some(function (sp) { return Math.abs(sp.y - best.y) < 2 && Math.abs(sp.x - x) < 28; }) &&
          !d.sim.stairs.some(function (st) { return st.y === best.y && ((st.dir > 0 && x > st.x - 8 && x < st.x + 3 * SW) || (st.dir < 0 && x < st.x + 8 && x > st.x - 3 * SW)); });
        return { t: 'dom', x: x, y: best.y, ok: ok };
      }
      if (tool === 'spring') {
        var sx = U.clamp(px, best.x + 22, best.x + best.w - 22);
        var sok = !d.sim.doms.some(function (o) { return Math.abs(o.y - best.y) < 2 && Math.abs(o.x - sx) < 28; }) &&
          !d.sim.springs.some(function (sp) { return Math.abs(sp.y - best.y) < 2 && Math.abs(sp.x - sx) < 40; });
        return { t: 'spring', x: sx, y: best.y, ok: sok };
      }
      // stairs hang off whichever edge of the platform is nearer
      var right = px > best.x + best.w / 2;
      var ex = right ? best.x + best.w : best.x, dir = right ? 1 : -1;
      var near = Math.abs(px - ex) < 90;
      var clash = d.sim.stairs.some(function (st) { return st.x === ex && st.y === best.y; });
      return { t: 'stair', x: ex, y: best.y, dir: dir, ok: near && !clash };
    }

    function rebuild(d) { d.sim = Sim.make(d.L, d.placed); }

    function place(g, gh) {
      var d = g.data;
      if (!gh || !gh.ok || d.inv[gh.t] <= 0) { Milo.sound.tone({ f: 200, f2: 150, d: .08, v: .06, type: 'square' }); return; }
      d.inv[gh.t]--;
      d.placed.push({ t: gh.t, x: gh.x, y: gh.y, dir: gh.dir });
      rebuild(d);
      updatePieces(g);
      burst(d, gh.x, gh.y - 10, '#fde68a', 5, 90);
      Milo.sound.click();
    }

    function removeAt(g, px, py) {
      var d = g.data;
      for (var i = d.placed.length - 1; i >= 0; i--) {
        var p = d.placed[i], hit = false;
        if (p.t === 'dom') hit = Math.abs(px - p.x) < 12 && py < p.y + 4 && py > p.y - DH - 6;
        else if (p.t === 'spring') hit = Math.abs(px - p.x) < 24 && py < p.y + 4 && py > p.y - 30;
        else hit = px > Math.min(p.x, p.x + p.dir * 3 * SW) && px < Math.max(p.x, p.x + p.dir * 3 * SW) && py > p.y - DH && py < p.y + 3 * SH + 8;
        if (hit) {
          d.placed.splice(i, 1); d.inv[p.t]++;
          rebuild(d); updatePieces(g);
          Milo.sound.tone({ f: 500, f2: 300, d: .08, v: .06, type: 'triangle' });
          return true;
        }
      }
      return false;
    }

    function run(g) {
      var d = g.data;
      if (d.mode !== 'edit') return;
      rebuild(d);
      Sim.push(d.sim);
      d.mode = 'run'; d.attempts++;
      d.acc = 0;
      Milo.sound.tone({ f: 300, f2: 500, d: .1, v: .08, type: 'square' });
    }

    function stop(g) {
      var d = g.data;
      rebuild(d);
      d.mode = 'edit';
      Milo.sound.blip();
    }

    function toolbar() {
      var items = [];
      TOOLS.forEach(function (t, i) { items.push({ x: 20 + i * 150, y: H - 52, w: 140, h: 42, t: t.t, label: t.label, key: t.key }); });
      items.push({ x: W - 300, y: H - 52, w: 130, h: 42, act: 'reset', label: '↺ Reset' });
      items.push({ x: W - 160, y: H - 52, w: 140, h: 42, act: 'push', label: '▶ PUSH' });
      return items;
    }

    function handleEvent(g, ev) {
      var d = g.data, s = d.sim;
      if (ev === 'topple') Milo.sound.tone({ f: 900 + Math.random() * 300, f2: 400, d: .04, v: .05, type: 'square' });
      else if (ev === 'kick') Milo.sound.tone({ f: 300, f2: 180, d: .08, v: .07, type: 'triangle' });
      else if (ev === 'spring') Milo.sound.tone({ f: 250, f2: 950, d: .18, v: .09, type: 'square' });
      else if (ev === 'drop') Milo.sound.tone({ f: 200, f2: 90, d: .12, v: .06, type: 'sawtooth' });
      else if (ev === 'win') {
        var unused = d.inv.dom + d.inv.stair + d.inv.spring;
        var pts = Math.max(80, 200 + unused * 30 + (d.attempts === 1 ? 100 : 0) - (d.attempts - 1) * 50);
        g.score += pts; g.set('Score', U.fmt(g.score));
        d.mode = 'won'; d.wait = 1.9; d.bell = 1;
        d.flash = { text: 'Ding! +' + pts + (d.attempts === 1 ? '  first try' : ''), t: 1.9, col: '#fde68a' };
        burst(d, s.target.x, s.target.y, '#fde68a', 30, 260);
        d.shake = 5;
        Milo.sound.tone({ f: 1320, d: .5, v: .1, type: 'sine' });
        setTimeout(function () { Milo.sound.win(); }, 200);
      }
    }

    return Milo.arcade(host, {
      id: 'domino-run',
      w: W, h: H, bg: '#2b2f3a',
      stats: ['Level', 'Pieces', 'Score'],
      emo: '🁫',
      start: {
        title: 'Domino Run',
        text: 'Lay dominoes (and stairs, and springs) so one push at the arrow ends with the bell ' +
          'ringing. Click to place, click a piece to take it back, then hit PUSH. Spare pieces and ' +
          'first-try solutions score extra.',
        keys: ['Click to place / remove', '1 2 3 pick a piece · Space to push · R to reset']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (g.state !== 'play') return;
        d.hover = { x: x, y: y };
        if (type !== 'down') return;
        var items = toolbar();
        for (var i = 0; i < items.length; i++) {
          var it = items[i];
          if (x >= it.x && x <= it.x + it.w && y >= it.y && y <= it.y + it.h) {
            if (it.act === 'push') run(g);
            else if (it.act === 'reset') { if (d.mode === 'run' || d.mode === 'fail') stop(g); }
            else { d.tool = it.t; Milo.sound.blip(); }
            return;
          }
        }
        if (d.mode !== 'edit' || d.intro > 0) return;
        if (y > H - 64) return;
        if (removeAt(g, x, y)) return;
        place(g, snap(d, x, y));
      },
      onKey: function (g, e) {
        var d = g.data;
        if (e.code === 'Digit1') d.tool = 'dom';
        if (e.code === 'Digit2') d.tool = 'stair';
        if (e.code === 'Digit3') d.tool = 'spring';
        if (e.code === 'Space' || e.code === 'Enter') { if (d.mode === 'edit') run(g); else if (d.mode === 'fail') stop(g); }
        if (e.code === 'KeyR') { if (d.mode === 'run' || d.mode === 'fail') stop(g); }
      },

      update: function (g, dt) {
        var d = g.data, s = d.sim;
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 30);
        d.parts = d.parts.filter(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 600 * dt; p.life -= dt; return p.life > 0; });
        if (d.flash) { d.flash.t -= dt; if (d.flash.t <= 0) d.flash = null; }
        if (d.bell > 0) d.bell = Math.max(0, d.bell - dt * .8);
        if (d.intro > 0) { d.intro -= dt; return; }

        if (d.mode === 'edit') {
          d.ghost = d.hover ? snap(d, d.hover.x, d.hover.y) : null;
        } else if (d.mode === 'run') {
          d.acc += dt;
          var guard = 0;
          while (d.acc >= STEP && guard++ < 10 && d.mode === 'run') {
            Sim.step(s); d.acc -= STEP;
            if (s.event) handleEvent(g, s.event);
            if (s.done === 'fail') {
              d.mode = 'fail'; d.wait = 1.6;
              d.flash = { text: 'Not quite — tweak and push again', t: 1.6, col: '#fca5a5' };
              Milo.sound.tone({ f: 260, f2: 160, d: .3, v: .08, type: 'triangle' });
            }
          }
        } else if (d.mode === 'fail') {
          d.wait -= dt;
          if (d.wait <= 0) stop(g);
        } else if (d.mode === 'won') {
          d.wait -= dt;
          if (d.wait <= 0) {
            if (d.level + 1 >= LEVELS.length) {
              g.win({ emo: '🁫', title: 'Every bell rung!', text: LEVELS.length + ' chain reactions built. ' + U.fmt(g.score) + ' points.', score: g.score });
            } else loadLevel(g, d.level + 1);
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, s = d.sim, L = d.L;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#343a48'); bg.addColorStop(1, '#1f2330');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(255,255,255,.04)'; c.lineWidth = 1;
        for (var gx = 0; gx < W; gx += 30) { c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, H); c.stroke(); }
        for (var gy = 0; gy < H; gy += 30) { c.beginPath(); c.moveTo(0, gy); c.lineTo(W, gy); c.stroke(); }

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // platforms + stairs
        s.plats.forEach(function (p) {
          c.fillStyle = p.stair ? '#d6a25e' : '#a16207';
          c.fillRect(p.x, p.y, p.w, PLAT_T);
          c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(p.x, p.y, p.w, 3);
          c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(p.x, p.y + PLAT_T - 4, p.w, 4);
          if (!p.stair && p.y < 470) {
            c.fillStyle = '#5b3a12';
            c.fillRect(p.x + 6, p.y + PLAT_T, 8, 480 - p.y - PLAT_T); c.fillRect(p.x + p.w - 14, p.y + PLAT_T, 8, 480 - p.y - PLAT_T);
          }
        });
        s.stairs.forEach(function (st) {
          c.fillStyle = 'rgba(214,162,94,.25)';
          c.beginPath();
          if (st.dir > 0) { c.moveTo(st.x, st.y); c.lineTo(st.x + 3 * SW, st.y + 3 * SH + PLAT_T); c.lineTo(st.x, st.y + 3 * SH + PLAT_T); }
          else { c.moveTo(st.x, st.y); c.lineTo(st.x - 3 * SW, st.y + 3 * SH + PLAT_T); c.lineTo(st.x, st.y + 3 * SH + PLAT_T); }
          c.closePath(); c.fill();
        });

        // springs
        s.springs.forEach(function (sp) {
          var h = 14 - sp.sq * 7;
          c.strokeStyle = '#ef4444'; c.lineWidth = 3; c.lineJoin = 'round';
          c.beginPath();
          for (var k = 0; k <= 6; k++) c.lineTo(sp.x + (k % 2 ? 12 : -12), sp.y - k * h / 6);
          c.stroke();
          c.fillStyle = '#fca5a5'; U.roundRect(c, sp.x - 20, sp.y - h - 5, 40, 6, 3); c.fill();
        });

        // target bell
        var tg = s.target;
        c.strokeStyle = '#94a3b8'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(tg.x, tg.y - 60); c.lineTo(tg.x, tg.y - 24); c.stroke();
        c.fillStyle = '#64748b'; c.fillRect(tg.x - 22, tg.y - 64, 44, 6);
        c.save(); c.translate(tg.x, tg.y - 24); c.rotate(Math.sin(g.t * 20) * .3 * d.bell);
        c.fillStyle = '#fbbf24'; c.shadowColor = '#fbbf24'; c.shadowBlur = 10 + d.bell * 20;
        c.beginPath(); c.moveTo(-14, 22); c.quadraticCurveTo(-16, -2, 0, -4); c.quadraticCurveTo(16, -2, 14, 22); c.closePath(); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = '#d97706'; c.fillRect(-16, 20, 32, 4);
        c.fillStyle = '#78350f'; c.beginPath(); c.arc(0, 26, 4, 0, 7); c.fill();
        c.restore();
        c.strokeStyle = 'rgba(251,191,36,' + (.25 + .15 * Math.sin(g.t * 4)) + ')'; c.lineWidth = 2;
        c.beginPath(); c.arc(tg.x, tg.y, TR, 0, 7); c.stroke();

        // dominoes
        s.doms.forEach(function (o) {
          if (o.state === 'gone') return;
          c.save(); c.translate(o.x, o.y); c.rotate(o.dir * o.a);
          c.fillStyle = o.fixed ? '#e2e8f0' : '#fef3c7';
          U.roundRect(c, -DW / 2, -DH, DW, DH, 3); c.fill();
          c.fillStyle = '#0f172a';
          c.fillRect(-DW / 2 + 1, -DH / 2 - 1, DW - 2, 2);
          c.beginPath(); c.arc(0, -DH * .75, 2, 0, 7); c.arc(0, -DH * .25, 2, 0, 7); c.fill();
          c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; U.roundRect(c, -DW / 2, -DH, DW, DH, 3); c.stroke();
          c.restore();
        });
        s.debris.forEach(function (db) {
          c.save(); c.translate(db.x, db.y); c.rotate(db.rot);
          c.fillStyle = '#fef3c7'; U.roundRect(c, -db.w / 2, -db.h / 2, db.w, db.h, 3); c.fill();
          c.restore();
        });
        // balls
        s.balls.forEach(function (b) {
          var grd = c.createRadialGradient(b.x - 4, b.y - 4, 2, b.x, b.y, b.r);
          grd.addColorStop(0, '#e2e8f0'); grd.addColorStop(1, '#475569');
          c.fillStyle = grd; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill();
        });

        // push arrow at the first domino
        if (d.mode === 'edit' && s.doms[0]) {
          var f = s.doms[0], ax = f.x - s.push * 40, bob = Math.sin(g.t * 5) * 4;
          c.fillStyle = '#4ade80'; c.font = '800 20px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(s.push > 0 ? '➜' : '⬅', ax + bob * s.push, f.y - 22);
        }

        // ghost
        if (d.mode === 'edit' && d.ghost && d.intro <= 0 && d.hover && d.hover.y < H - 64) {
          var gh = d.ghost, okc = gh.ok && d.inv[gh.t] > 0;
          c.globalAlpha = .55; c.fillStyle = okc ? '#4ade80' : '#f87171';
          if (gh.t === 'dom') { U.roundRect(c, gh.x - DW / 2, gh.y - DH, DW, DH, 3); c.fill(); }
          else if (gh.t === 'spring') { U.roundRect(c, gh.x - 20, gh.y - 20, 40, 20, 4); c.fill(); }
          else for (var k = 0; k < 3; k++) {
            var sx = gh.dir > 0 ? gh.x + k * SW : gh.x - (k + 1) * SW;
            c.fillRect(sx, gh.y + (k + 1) * SH, SW, PLAT_T);
            U.roundRect(c, sx + SW / 2 - DW / 2, gh.y + (k + 1) * SH - DH, DW, DH, 3); c.fill();
          }
          c.globalAlpha = 1;
        }

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max); c.fillStyle = p.col;
          c.fillRect(p.x - 2, p.y - 2, 4, 4);
        });
        c.globalAlpha = 1;
        c.restore();

        // toolbar
        c.fillStyle = 'rgba(10,12,20,.85)'; c.fillRect(0, H - 64, W, 64);
        toolbar().forEach(function (it) {
          var count = it.t ? d.inv[it.t] : null;
          var sel = it.t && d.tool === it.t;
          c.fillStyle = it.act === 'push' ? (d.mode === 'edit' ? '#22c55e' : '#334155') : it.act === 'reset' ? '#475569' : sel ? '#fde68a' : '#334155';
          U.roundRect(c, it.x, it.y, it.w, it.h, 10); c.fill();
          c.fillStyle = sel ? '#1e293b' : '#fff'; c.font = '800 16px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(it.label + (count != null ? '  ×' + count : ''), it.x + it.w / 2, it.y + 27);
          if (it.key) { c.fillStyle = sel ? 'rgba(0,0,0,.5)' : 'rgba(255,255,255,.45)'; c.font = '700 10px Outfit, sans-serif'; c.fillText(it.key, it.x + 12, it.y + 13); }
        });

        c.textAlign = 'center';
        if (d.intro > 0) {
          c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, H / 2 - 40, W, 80);
          c.fillStyle = '#fff'; c.font = '800 30px Outfit, sans-serif';
          c.fillText('Level ' + (d.level + 1) + ' · ' + L.name, W / 2, H / 2 + 10);
        }
        if (d.flash) {
          c.globalAlpha = Math.min(1, d.flash.t * 1.5); c.fillStyle = d.flash.col; c.font = '800 28px Outfit, sans-serif';
          c.fillText(d.flash.text, W / 2, 100); c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'domino-run', title: 'Domino Run', emo: '🁫', category: 'Puzzle',
    tagline: 'Link the push to the bell with dominoes, stairs and springs',
    description: 'Each level gives you a push arrow, a bell, and a handful of pieces. Dominoes topple ' +
      'the next one if it is within about a domino-length; stairs carry the chain down a ledge; springs ' +
      'bounce a rolling steel ball up to a higher platform. Click to place a piece where the ghost turns ' +
      'green, click it again to take it back, then hit PUSH and watch the whole chain run in real physics. ' +
      'Twelve layouts, each solved by a chain that reaches the bell — a first-try solve pays 100 extra ' +
      'and every unused piece 30. Tip: dominoes spaced 34 pixels apart never miss; wider gaps are a ' +
      'gamble.',
    controls: ['Click to place / remove', '1 2 3 pick piece', 'Space push', 'R reset'],
    colors: ['#343a48', '#fbbf24'],
    tags: ['physics', 'dominoes', 'chain reaction', 'levels', 'puzzle'],
    _sim: Sim, _levels: LEVELS,
    mount: mount
  });
})();
