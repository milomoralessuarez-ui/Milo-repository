/* Rope Cut — slice the ropes so the candy swings into the monster's mouth. */
(function () {
  'use strict';
  var W = 600, H = 720, STEP = 1 / 120, CR = 14, MOUTH = 38, STAR_R = 26;

  /**
   * Levels: candy position, ropes (anchor + optional slack length), stars,
   * bubbles, spikes (rects), monster. `sol` is a scripted solution used by the
   * authoring test harness to prove every level is beatable.
   */
  var LEVELS = [
    { name: 'Let go', candy: [300, 240], ropes: [[300, 90]], stars: [[300, 340], [300, 440], [300, 540]],
      monster: [300, 640], sol: [{ t: .3, cut: 0 }] },
    { name: 'Swing', candy: [330, 260], ropes: [[200, 80], [480, 110]],
      stars: [[276, 289], [200, 300], [124, 289]], monster: [96, 600],
      sol: [{ t: .2, cut: 1 }, { t: 1.7, cut: 0 }] },
    { name: 'Bubble lift', candy: [300, 260], ropes: [[150, 80], [380, 100]],
      stars: [[380, 279], [460, 380], [460, 480]], bubbles: [[460, 580, 34]], monster: [460, 80],
      sol: [{ t: .2, cut: 0 }, { t: .95, cut: 1 }] },
    { name: 'Pop it', candy: [300, 260], ropes: [[300, 80]], stars: [[300, 340], [300, 520], [300, 590]],
      bubbles: [[300, 420, 32]], monster: [300, 650],
      sol: [{ t: .2, cut: 0 }, { t: 1.6, pop: 0 }] },
    { name: 'Spike pit', candy: [330, 250], ropes: [[190, 80], [470, 100]],
      stars: [[270, 280], [190, 292], [110, 280]], spikes: [[250, 640, 350, 40]], monster: [90, 600],
      sol: [{ t: .2, cut: 1 }, { t: 1.6, cut: 0 }] },
    { name: 'Fling', candy: [120, 200], ropes: [[300, 80]], stars: [[300, 300], [430, 320], [500, 420]],
      spikes: [[0, 660, 300, 40]], monster: [520, 560],
      sol: [{ t: 1.0, cut: 0 }] },
    { name: 'Hand-off', candy: [300, 230], ropes: [[140, 70], [460, 70]], stars: [[300, 400], [300, 500], [300, 600]],
      spikes: [[0, 300, 90, 30], [510, 300, 90, 30]], monster: [300, 660],
      sol: [{ t: .2, cut: 0 }, { t: .22, cut: 1 }] },
    { name: 'Two bubbles', candy: [150, 240], ropes: [[150, 80]], stars: [[150, 340], [150, 460], [420, 300]],
      bubbles: [[150, 540, 32], [420, 420, 32]], monster: [420, 640],
      sol: [{ t: .2, cut: 0 }, { t: 2.2, pop: 0 }] },
    { name: 'Ceiling', candy: [300, 300], ropes: [[300, 120]], stars: [[300, 400], [300, 480], [300, 560]],
      bubbles: [[300, 620, 32]], spikes: [[200, 60, 200, 30]], monster: [120, 200],
      sol: [{ t: .2, cut: 0 }, { t: 3.0, pop: 0 }] },
    { name: 'Slack', candy: [300, 200], ropes: [[300, 60, 400], [300, 60]], stars: [[300, 330], [300, 440], [190, 420]],
      spikes: [[380, 560, 220, 40]], monster: [110, 620],
      sol: [{ t: .2, cut: 1 }, { t: 1.4, cut: 0 }] },
    { name: 'Needle', candy: [330, 250], ropes: [[190, 80], [470, 100]],
      stars: [[270, 280], [190, 292], [110, 280]], spikes: [[0, 560, 140, 40], [240, 560, 360, 40]], monster: [190, 660],
      sol: [{ t: .2, cut: 1 }, { t: 1.2, cut: 0 }] },
    { name: 'Triple', candy: [300, 300], ropes: [[100, 100], [300, 80], [500, 100]],
      stars: [[300, 420], [300, 520], [300, 600]], spikes: [[0, 450, 200, 30], [400, 450, 200, 30]], monster: [300, 660],
      sol: [{ t: .2, cut: 0 }, { t: .4, cut: 2 }, { t: .8, cut: 1 }] },
    { name: 'Long throw', candy: [90, 240], ropes: [[260, 60]], stars: [[260, 260], [400, 300], [500, 450]],
      spikes: [[0, 500, 380, 40], [560, 300, 40, 200]], monster: [500, 620],
      sol: [{ t: 1.0, cut: 0 }] },
    { name: 'Lift and drop', candy: [120, 260], ropes: [[120, 80]], stars: [[120, 400], [120, 520], [300, 200]],
      bubbles: [[120, 620, 32]], spikes: [[200, 60, 400, 30], [0, 660, 250, 40]], monster: [300, 600],
      sol: [{ t: .2, cut: 0 }, { t: 2.4, pop: 0 }] },
    { name: 'Corridor', candy: [300, 200], ropes: [[300, 60]], stars: [[300, 300], [300, 400], [300, 500]],
      spikes: [[0, 300, 260, 30], [340, 300, 260, 30], [0, 450, 260, 30], [340, 450, 260, 30]], monster: [300, 650],
      sol: [{ t: .3, cut: 0 }] },
    { name: 'Grand finale', candy: [330, 250], ropes: [[190, 80], [470, 100]],
      stars: [[270, 280], [110, 280], [300, 560]], bubbles: [[90, 520, 32]],
      spikes: [[0, 660, 200, 40], [380, 660, 220, 40]], monster: [300, 640],
      sol: [{ t: .2, cut: 1 }, { t: 1.6, cut: 0 }, { t: 3.5, pop: 0 }] }
  ];

  /* ------------------------------------------------------------ physics */
  var Sim = {
    make: function (L) {
      var s = {
        candy: { x: L.candy[0], y: L.candy[1], ox: L.candy[0], oy: L.candy[1], bubble: null },
        ropes: [], stars: [], bubbles: [], spikes: [], monster: { x: L.monster[0], y: L.monster[1] },
        time: 0, done: null, got: 0, chomp: 0
      };
      L.ropes.forEach(function (r) {
        var ax = r[0], ay = r[1], dist = Math.hypot(s.candy.x - ax, s.candy.y - ay);
        var len = Math.max(dist, r[2] || 0);
        var n = Math.max(3, Math.round(len / 12)), seg = len / n, pts = [];
        for (var i = 0; i < n; i++) {
          var f = i / n;
          if (len > dist + 1) {
            // slack rope: hang the extra length in a loose curve below the line
            var sag = Math.sin(f * Math.PI) * (len - dist) * .6;
            pts.push({ x: ax + (s.candy.x - ax) * f, y: ay + (s.candy.y - ay) * f + sag, ox: 0, oy: 0 });
          } else pts.push({ x: ax + (s.candy.x - ax) * f, y: ay + (s.candy.y - ay) * f, ox: 0, oy: 0 });
          pts[i].ox = pts[i].x; pts[i].oy = pts[i].y;
        }
        s.ropes.push({ pts: pts, seg: seg, cut: false, tail: null });
      });
      (L.stars || []).forEach(function (p) { s.stars.push({ x: p[0], y: p[1], got: false }); });
      (L.bubbles || []).forEach(function (b) { s.bubbles.push({ x: b[0], y: b[1], r: b[2], popped: false, held: false }); });
      (L.spikes || []).forEach(function (r) { s.spikes.push({ x: r[0], y: r[1], w: r[2], h: r[3] }); });
      return s;
    },

    step: function (s) {
      if (s.done) { s.time += STEP; return; }
      var c = s.candy, g = c.bubble ? -240 : 1000, damp = c.bubble ? .985 : .997;
      var vx = (c.x - c.ox) * damp, vy = (c.y - c.oy) * damp;
      c.ox = c.x; c.oy = c.y;
      c.x += vx; c.y += vy + g * STEP * STEP;
      if (c.bubble) { c.bubble.x = c.x; c.bubble.y = c.y; }

      s.ropes.forEach(function (r) {
        for (var i = 1; i < r.pts.length; i++) {
          var p = r.pts[i];
          var pvx = (p.x - p.ox) * .995, pvy = (p.y - p.oy) * .995;
          p.ox = p.x; p.oy = p.y;
          p.x += pvx; p.y += pvy + 1000 * STEP * STEP;
        }
        if (r.tail) for (var k = 0; k < r.tail.length; k++) {
          var q = r.tail[k];
          var qvx = (q.x - q.ox) * .995, qvy = (q.y - q.oy) * .995;
          q.ox = q.x; q.oy = q.y;
          q.x += qvx; q.y += qvy + 1000 * STEP * STEP;
        }
      });

      for (var it = 0; it < 12; it++) {
        s.ropes.forEach(function (r) {
          var pts = r.pts, n = pts.length;
          for (var i = 0; i < n; i++) {
            var a = pts[i], b, wb;
            if (i < n - 1) { b = pts[i + 1]; wb = .5; }
            else if (!r.cut) { b = c; wb = c.bubble ? .5 : .25; }
            else break;
            var dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy);
            if (dist <= r.seg || dist < .0001) continue;
            var diff = (dist - r.seg) / dist;
            if (i === 0) { b.x -= dx * diff; b.y -= dy * diff; }
            else {
              var wa = 1 - wb;
              a.x += dx * diff * wa; a.y += dy * diff * wa;
              b.x -= dx * diff * wb; b.y -= dy * diff * wb;
            }
          }
          if (r.tail) {
            // dangling piece hangs from the candy
            var t = r.tail;
            for (var k = 0; k < t.length; k++) {
              var p = k === 0 ? c : t[k - 1], q = t[k];
              var tdx = q.x - p.x, tdy = q.y - p.y, td = Math.hypot(tdx, tdy);
              if (td <= r.seg || td < .0001) continue;
              var tdiff = (td - r.seg) / td;
              q.x -= tdx * tdiff; q.y -= tdy * tdiff;
            }
          }
        });
      }

      s.time += STEP;
      // bubbles
      s.bubbles.forEach(function (b) {
        if (b.popped || b.held || c.bubble) return;
        if (Math.hypot(c.x - b.x, c.y - b.y) < b.r + CR - 8) { b.held = true; c.bubble = b; c.ox = c.x; c.oy = c.y; s.event = 'bubble'; }
      });
      s.stars.forEach(function (st) {
        if (!st.got && Math.hypot(c.x - st.x, c.y - st.y) < STAR_R) { st.got = true; s.got++; s.event = 'star'; }
      });
      for (var j = 0; j < s.spikes.length; j++) {
        var sp = s.spikes[j];
        var cx = Math.max(sp.x, Math.min(c.x, sp.x + sp.w)), cy = Math.max(sp.y, Math.min(c.y, sp.y + sp.h));
        if (Math.hypot(c.x - cx, c.y - cy) < CR - 2) { s.done = 'dead'; s.event = 'dead'; return; }
      }
      if (Math.hypot(c.x - s.monster.x, c.y - s.monster.y) < MOUTH) { s.done = 'eat'; s.event = 'eat'; return; }
      if (c.y > H + 40 || c.x < -40 || c.x > W + 40 || c.y < -60) { s.done = 'dead'; s.event = 'lost'; }
    },

    cut: function (s, ri, si) {
      var r = s.ropes[ri];
      if (!r || r.cut) return false;
      r.cut = true;
      var keep = r.pts.slice(0, si + 1);
      var rest = r.pts.slice(si + 1);
      r.pts = keep;
      r.tail = rest.length > 4 ? rest.slice(rest.length - 4) : rest;
      return true;
    },

    pop: function (s, bi) {
      var b = s.bubbles[bi];
      if (!b || b.popped) return false;
      b.popped = true;
      if (s.candy.bubble === b) { s.candy.bubble = null; s.candy.ox = s.candy.x; s.candy.oy = s.candy.y; }
      return true;
    },

    /** Run a scripted solution; returns the final state. */
    run: function (L, sol, maxT) {
      var s = Sim.make(L), k = 0;
      while (!s.done && s.time < (maxT || 12)) {
        while (k < sol.length && sol[k].t <= s.time) {
          var a = sol[k++];
          if (a.cut != null) Sim.cut(s, a.cut, Math.floor(s.ropes[a.cut].pts.length / 2));
          if (a.pop != null) Sim.pop(s, a.pop);
        }
        Sim.step(s);
      }
      return s;
    }
  };

  function segHit(ax, ay, bx, by, cx, cy, dx, dy) {
    var d = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx);
    if (Math.abs(d) < 1e-9) return false;
    var u = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / d;
    var v = ((cx - ax) * (by - ay) - (cy - ay) * (bx - ax)) / d;
    return u >= 0 && u <= 1 && v >= 0 && v <= 1;
  }

  /* --------------------------------------------------------------- game */
  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function loadLevel(g, n) {
      var d = g.data;
      d.level = n;
      d.sim = Sim.make(LEVELS[n]);
      d.acc = 0;
      d.intro = 1;
      d.wait = 0;
      d.slash = [];
      d.last = null;
      d.chomp = 0;
      g.set('Level', (n + 1) + '/' + LEVELS.length);
    }

    function reset(g) {
      var d = g.data;
      d.parts = [];
      d.shake = 0;
      d.stars = 0;
      d.tries = 0;
      d.flash = null;
      d.leaves = [];
      for (var i = 0; i < 18; i++) d.leaves.push({ x: Math.random() * W, y: Math.random() * H, s: U.rand(.5, 1.2), r: Math.random() * 6 });
      loadLevel(g, 0);
      g.set('Stars', 0);
      g.set('Score', 0);
    }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.283, s = U.rand(30, spd || 220);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .7), max: .7, col: col });
      }
    }

    function handleEvent(g, ev) {
      var d = g.data, c = d.sim.candy;
      if (ev === 'star') { burst(d, c.x, c.y, '#fde68a', 12, 200); Milo.sound.coin(); }
      else if (ev === 'bubble') { Milo.sound.tone({ f: 500, f2: 900, d: .15, v: .07, type: 'sine' }); }
      else if (ev === 'eat') {
        d.stars += d.sim.got;
        var pts = d.sim.got * 100 + 50 + (d.sim.got === 3 ? 100 : 0);
        g.score += pts;
        g.set('Stars', d.stars); g.set('Score', U.fmt(g.score));
        d.flash = { text: (d.sim.got === 3 ? 'PERFECT  ' : '') + '+' + pts, t: 1.2, col: '#fde68a' };
        burst(d, c.x, c.y, '#f9a8d4', 24, 260);
        d.chomp = 1; d.wait = 1.1; d.shake = 5;
        Milo.sound.tone({ f: 300, f2: 120, d: .2, v: .12, type: 'square' });
        setTimeout(function () { Milo.sound.win(); }, 150);
      } else if (ev === 'dead' || ev === 'lost') {
        burst(d, c.x, c.y, ev === 'dead' ? '#f87171' : '#a7f3d0', 20, 240);
        d.flash = { text: ev === 'dead' ? 'Ouch!' : 'Lost it!', t: 1, col: '#f87171' };
        d.wait = 1; d.tries++; d.shake = 8;
        Milo.sound.explode();
      }
    }

    function slice(g, x0, y0, x1, y1) {
      var d = g.data, s = d.sim;
      if (s.done) return;
      s.ropes.forEach(function (r, ri) {
        if (r.cut) return;
        var pts = r.pts, n = pts.length;
        for (var i = 0; i < n; i++) {
          var a = pts[i], b = i < n - 1 ? pts[i + 1] : s.candy;
          if (segHit(x0, y0, x1, y1, a.x, a.y, b.x, b.y)) {
            Sim.cut(s, ri, i);
            burst(d, a.x, a.y, '#fcd34d', 6, 120);
            Milo.sound.tone({ f: 900, f2: 300, d: .08, v: .08, type: 'sawtooth' });
            break;
          }
        }
      });
    }

    function tapBubble(g, x, y) {
      var d = g.data, s = d.sim;
      for (var i = 0; i < s.bubbles.length; i++) {
        var b = s.bubbles[i];
        if (!b.popped && Math.hypot(x - b.x, y - b.y) < b.r + 16) {
          Sim.pop(s, i);
          burst(d, b.x, b.y, '#bae6fd', 12, 160);
          Milo.sound.tone({ f: 1200, f2: 400, d: .1, v: .07, type: 'sine' });
          return true;
        }
      }
      return false;
    }

    return Milo.arcade(host, {
      id: 'rope-cut',
      w: W, h: H, bg: '#14532d',
      stats: ['Level', 'Stars', 'Score'],
      emo: '🍬',
      start: {
        title: 'Rope Cut',
        text: 'Swipe across a rope to slice it and get the candy into the monster’s mouth. ' +
          'Pass through stars on the way, tap a bubble to pop it, and stay clear of the spikes.',
        keys: ['Swipe to cut', 'Tap bubbles to pop']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (g.state !== 'play') return;
        if (type === 'down') {
          d.last = { x: x, y: y };
          if (d.intro <= 0 && !d.wait) tapBubble(g, x, y);
        } else if (type === 'move' && d.last && g.input.pdown) {
          if (d.intro <= 0 && !d.wait) slice(g, d.last.x, d.last.y, x, y);
          d.slash.push({ x0: d.last.x, y0: d.last.y, x1: x, y1: y, life: .25 });
          d.last = { x: x, y: y };
        } else if (type === 'up') d.last = null;
      },

      update: function (g, dt) {
        var d = g.data, s = d.sim;
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 30);
        d.parts = d.parts.filter(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt; p.life -= dt; return p.life > 0; });
        d.slash = d.slash.filter(function (sl) { sl.life -= dt; return sl.life > 0; });
        if (d.flash) { d.flash.t -= dt; if (d.flash.t <= 0) d.flash = null; }
        if (d.chomp > 0) d.chomp = Math.max(0, d.chomp - dt * 2);
        d.leaves.forEach(function (l) { l.y += 12 * l.s * dt; l.x += Math.sin(g.t + l.r) * 8 * dt; if (l.y > H + 10) l.y = -10; });

        if (d.intro > 0) { d.intro -= dt; return; }
        if (d.wait > 0) {
          d.wait -= dt;
          if (d.wait <= 0) {
            if (s.done === 'eat') {
              if (d.level + 1 >= LEVELS.length) {
                g.win({ emo: '🍬', title: 'Monster fed!', text: d.stars + ' of ' + LEVELS.length * 3 + ' stars in ' + (LEVELS.length + d.tries) + ' attempts.', score: g.score });
              } else loadLevel(g, d.level + 1);
            } else loadLevel(g, d.level);
          }
          return;
        }
        d.acc += dt;
        var guard = 0;
        while (d.acc >= STEP && guard++ < 8) {
          s.event = null;
          Sim.step(s);
          d.acc -= STEP;
          if (s.event) handleEvent(g, s.event);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, s = d.sim, L = LEVELS[d.level];
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#166534'); bg.addColorStop(1, '#052e16');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(134,239,172,.12)';
        d.leaves.forEach(function (l) { c.beginPath(); c.ellipse(l.x, l.y, 6 * l.s, 3 * l.s, l.r, 0, 7); c.fill(); });

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // spikes
        s.spikes.forEach(function (sp) {
          c.fillStyle = '#3f3f46';
          c.fillRect(sp.x, sp.y, sp.w, sp.h);
          c.fillStyle = '#d4d4d8';
          var horiz = sp.w >= sp.h;
          c.beginPath();
          if (horiz) {
            var up = sp.y > H / 2;
            for (var x = sp.x; x < sp.x + sp.w - 4; x += 14) {
              if (up) { c.moveTo(x, sp.y); c.lineTo(x + 7, sp.y - 16); c.lineTo(x + 14, sp.y); }
              else { c.moveTo(x, sp.y + sp.h); c.lineTo(x + 7, sp.y + sp.h + 16); c.lineTo(x + 14, sp.y + sp.h); }
            }
          } else {
            var left = sp.x > W / 2;
            for (var y = sp.y; y < sp.y + sp.h - 4; y += 14) {
              if (left) { c.moveTo(sp.x, y); c.lineTo(sp.x - 16, y + 7); c.lineTo(sp.x, y + 14); }
              else { c.moveTo(sp.x + sp.w, y); c.lineTo(sp.x + sp.w + 16, y + 7); c.lineTo(sp.x + sp.w, y + 14); }
            }
          }
          c.fill();
        });

        // monster
        var m = s.monster, open = s.done === 'eat' ? d.chomp * .2 : .55 + Math.sin(g.t * 3) * .1;
        c.fillStyle = '#65a30d';
        c.beginPath(); c.arc(m.x, m.y, 44, 0, 7); c.fill();
        c.fillStyle = '#365314';
        c.beginPath(); c.ellipse(m.x, m.y + 8, 28, 22 * open, 0, 0, 7); c.fill();
        c.fillStyle = '#f8fafc';
        for (var tI = -2; tI <= 2; tI++) { c.beginPath(); c.moveTo(m.x + tI * 11 - 4, m.y + 8 - 22 * open + 2); c.lineTo(m.x + tI * 11, m.y + 8 - 22 * open + 10); c.lineTo(m.x + tI * 11 + 4, m.y + 8 - 22 * open + 2); c.fill(); }
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(m.x - 14, m.y - 16, 10, 0, 7); c.arc(m.x + 14, m.y - 16, 10, 0, 7); c.fill();
        c.fillStyle = '#1c1917';
        var lx = U.clamp((s.candy.x - m.x) / 60, -4, 4), ly = U.clamp((s.candy.y - m.y) / 60, -4, 4);
        c.beginPath(); c.arc(m.x - 14 + lx, m.y - 16 + ly, 4.5, 0, 7); c.arc(m.x + 14 + lx, m.y - 16 + ly, 4.5, 0, 7); c.fill();

        // stars
        s.stars.forEach(function (st) {
          if (st.got) return;
          c.save(); c.translate(st.x, st.y); c.rotate(g.t);
          c.fillStyle = '#fde68a'; c.shadowColor = '#fde68a'; c.shadowBlur = 12;
          c.beginPath();
          for (var k = 0; k < 10; k++) { var rr = k % 2 ? 6 : 14, an = k * Math.PI / 5; c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
          c.closePath(); c.fill(); c.shadowBlur = 0;
          c.restore();
        });

        // ropes
        s.ropes.forEach(function (r) {
          c.fillStyle = '#78350f';
          c.beginPath(); c.arc(r.pts[0].x, r.pts[0].y, 7, 0, 7); c.fill();
          c.strokeStyle = '#d6a25e'; c.lineWidth = 3.5; c.lineCap = 'round'; c.lineJoin = 'round';
          c.beginPath();
          r.pts.forEach(function (p, i) { if (i) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); });
          if (!r.cut) c.lineTo(s.candy.x, s.candy.y);
          c.stroke();
          if (r.tail && r.tail.length) {
            c.beginPath(); c.moveTo(s.candy.x, s.candy.y);
            r.tail.forEach(function (p) { c.lineTo(p.x, p.y); });
            c.stroke();
          }
        });

        // candy
        var cd = s.candy;
        if (s.done !== 'dead' && s.done !== 'eat') {
          c.save(); c.translate(cd.x, cd.y); c.rotate((cd.x - cd.ox) * .3);
          c.fillStyle = '#f472b6';
          c.beginPath(); c.moveTo(-CR - 8, -8); c.lineTo(-CR, 0); c.lineTo(-CR - 8, 8); c.closePath(); c.fill();
          c.beginPath(); c.moveTo(CR + 8, -8); c.lineTo(CR, 0); c.lineTo(CR + 8, 8); c.closePath(); c.fill();
          c.fillStyle = '#ec4899'; c.shadowColor = '#f9a8d4'; c.shadowBlur = 10;
          c.beginPath(); c.arc(0, 0, CR, 0, 7); c.fill(); c.shadowBlur = 0;
          c.strokeStyle = '#fbcfe8'; c.lineWidth = 3;
          c.beginPath(); c.moveTo(-8, -8); c.lineTo(8, 8); c.moveTo(-9, 3); c.lineTo(-3, 9); c.moveTo(3, -9); c.lineTo(9, -3); c.stroke();
          c.restore();
        }
        // bubbles
        s.bubbles.forEach(function (b) {
          if (b.popped) return;
          c.strokeStyle = 'rgba(186,230,253,.9)'; c.lineWidth = 2.5;
          c.fillStyle = 'rgba(186,230,253,.18)';
          c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill(); c.stroke();
          c.fillStyle = 'rgba(255,255,255,.6)';
          c.beginPath(); c.ellipse(b.x - b.r * .4, b.y - b.r * .4, b.r * .22, b.r * .12, -.7, 0, 7); c.fill();
        });

        d.slash.forEach(function (sl) {
          c.globalAlpha = sl.life * 4; c.strokeStyle = '#fff'; c.lineWidth = 3;
          c.beginPath(); c.moveTo(sl.x0, sl.y0); c.lineTo(sl.x1, sl.y1); c.stroke();
        });
        c.globalAlpha = 1;
        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max); c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, 3, 0, 7); c.fill();
        });
        c.globalAlpha = 1;
        c.restore();

        if (d.intro > 0) {
          c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, H / 2 - 40, W, 80);
          c.fillStyle = '#fff'; c.font = '800 30px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('Level ' + (d.level + 1) + ' · ' + L.name, W / 2, H / 2 + 10);
        }
        if (d.flash) {
          c.globalAlpha = Math.min(1, d.flash.t * 2);
          c.fillStyle = d.flash.col; c.font = '800 32px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(d.flash.text, W / 2, 120);
          c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'rope-cut', title: 'Rope Cut', emo: '🍬', category: 'Puzzle',
    tagline: 'Slice ropes, swing candy into the mouth',
    description: 'A sweet hangs from real rope — cut one strand and it swings on the others, cut the ' +
      'last and it drops. Sixteen levels add bubbles that float the candy upward until you tap ' +
      'them, slack ropes that catch it mid-fall, and spike beds that end the attempt. Each level has ' +
      'three stars along the ideal path; a three-star feed is worth 450 points, a plain feed 50. ' +
      'Tip: cut a swinging rope at the bottom of the arc for maximum sideways speed, at the top for ' +
      'a straight drop.',
    controls: ['Swipe to cut', 'Tap bubbles'],
    colors: ['#166534', '#f472b6'],
    tags: ['physics', 'rope', 'levels', 'swing', 'puzzle'],
    tags2: null,
    _sim: Sim, _levels: LEVELS,
    mount: mount
  });
})();
