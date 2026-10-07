/* Cannon Golf — blast a ball through bouncy caves; fewest shots wins. */
(function () {
  'use strict';
  var W = 900, H = 560, R = 9, G = 900, STEP = 1 / 120;

  /** Walls are [x, y, w, h]; every hole also gets a ceiling and two side walls. */
  var HOLES = [
    { name: 'Warm-up', par: 2, tee: [120, 520], cup: [760, 520], walls: [[0, 520, 900, 40]] },
    { name: 'The step', par: 2, tee: [120, 520], cup: [760, 430], walls: [[0, 520, 900, 40], [460, 430, 440, 90]] },
    { name: 'Stalactite', par: 2, tee: [120, 520], cup: [780, 520], walls: [[0, 520, 900, 40], [430, 48, 36, 230]] },
    { name: 'The wall', par: 2, tee: [120, 520], cup: [740, 520], walls: [[0, 520, 900, 40], [520, 330, 28, 190]] },
    { name: 'The slot', par: 3, tee: [120, 520], cup: [780, 520], walls: [[0, 520, 900, 40], [440, 48, 30, 190], [440, 340, 30, 180]] },
    { name: 'Bumpers', par: 3, tee: [120, 520], cup: [800, 520], walls: [[0, 520, 900, 40], [700, 470, 22, 50]], bumpers: [[380, 300, 26], [520, 380, 26], [640, 260, 26]] },
    { name: 'The pit', par: 2, tee: [120, 520], cup: [760, 520], walls: [[0, 520, 320, 40], [430, 520, 470, 40]] },
    { name: 'The shelf', par: 3, tee: [120, 520], cup: [780, 300], walls: [[0, 520, 900, 40], [560, 300, 340, 24]] },
    { name: 'Zigzag', par: 3, tee: [120, 520], cup: [800, 520], walls: [[0, 520, 900, 40], [300, 48, 26, 340], [580, 220, 26, 300]] },
    { name: 'Ricochet', par: 3, tee: [120, 520], cup: [800, 520], walls: [[0, 520, 900, 40], [420, 300, 24, 220], [560, 48, 24, 260]], bumpers: [[700, 400, 26]] },
    { name: 'The chimney', par: 3, tee: [120, 520], cup: [700, 300], walls: [[0, 520, 900, 40], [200, 300, 700, 22]] },
    { name: 'The gauntlet', par: 3, tee: [120, 520], cup: [830, 520], walls: [[0, 520, 260, 40], [360, 520, 540, 40], [500, 48, 28, 250], [640, 380, 24, 140]], bumpers: [[760, 300, 24]] }
  ];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ------------------------------------------------------------ physics */
  var Sim = {
    make: function (L) {
      var walls = [[0, 0, W, 48], [0, 0, 24, H], [W - 24, 0, 24, H]].concat(L.walls).map(function (w) {
        return { x: w[0], y: w[1], w: w[2], h: w[3] };
      });
      return {
        walls: walls,
        bumpers: (L.bumpers || []).map(function (b) { return { x: b[0], y: b[1], r: b[2], hot: 0 }; }),
        cup: { x: L.cup[0], y: L.cup[1] },
        ball: { x: L.tee[0], y: L.tee[1] - R, vx: 0, vy: 0 },
        last: { x: L.tee[0], y: L.tee[1] - R },
        moving: false, t: 0, rest: 0, event: null, done: null
      };
    },
    fire: function (s, ang, pow) {
      var sp = 240 + pow * 720;
      s.ball.vx = Math.cos(ang) * sp; s.ball.vy = -Math.sin(ang) * sp;
      s.last = { x: s.ball.x, y: s.ball.y };
      s.moving = true; s.t = 0; s.rest = 0; s.done = null;
    },
    step: function (s) {
      if (!s.moving) return;
      var b = s.ball, dt = STEP;
      s.t += dt; s.event = null;
      b.vy += G * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      var grounded = false;
      for (var k = 0; k < 2; k++) {
        for (var i = 0; i < s.walls.length; i++) {
          var w = s.walls[i];
          var cx = clamp(b.x, w.x, w.x + w.w), cy = clamp(b.y, w.y, w.y + w.h);
          var dx = b.x - cx, dy = b.y - cy, dist = Math.hypot(dx, dy);
          if (dist >= R) continue;
          var nx, ny;
          if (dist < 1e-4) { nx = 0; ny = -1; dist = 0; } else { nx = dx / dist; ny = dy / dist; }
          b.x += nx * (R - dist); b.y += ny * (R - dist);
          var vn = b.vx * nx + b.vy * ny;
          if (vn < 0) {
            if (ny < -.7 && -vn < 90) { b.vx -= vn * nx; b.vy -= vn * ny; }
            else {
              b.vx -= 1.72 * vn * nx; b.vy -= 1.72 * vn * ny;
              if (-vn > 120) s.event = 'bounce';
            }
            var tx = -ny, ty = nx, vt = b.vx * tx + b.vy * ty;
            vt *= ny < -.7 ? .995 : .96;
            var vn2 = b.vx * nx + b.vy * ny;
            b.vx = vn2 * nx + vt * tx; b.vy = vn2 * ny + vt * ty;
          }
          if (ny < -.7) grounded = true;
        }
      }
      if (grounded) b.vx *= Math.pow(.38, dt);
      for (i = 0; i < s.bumpers.length; i++) {
        var bp = s.bumpers[i];
        var bdx = b.x - bp.x, bdy = b.y - bp.y, bd = Math.hypot(bdx, bdy);
        if (bd >= bp.r + R || bd < 1e-4) continue;
        var bnx = bdx / bd, bny = bdy / bd;
        b.x = bp.x + bnx * (bp.r + R); b.y = bp.y + bny * (bp.r + R);
        var bvn = b.vx * bnx + b.vy * bny;
        if (bvn < 0) {
          b.vx -= 2.2 * bvn * bnx; b.vy -= 2.2 * bvn * bny;
          var bs = Math.hypot(b.vx, b.vy);
          if (bs < 380) { b.vx *= 380 / bs; b.vy *= 380 / bs; }
          bp.hot = 1; s.event = 'bumper';
        }
      }
      var sp = Math.hypot(b.vx, b.vy);
      if (Math.hypot(b.x - s.cup.x, b.y - s.cup.y) < 13 && sp < 330) { s.moving = false; s.done = 'holed'; s.event = 'holed'; return; }
      if (b.y > H + 40 || b.x < -40 || b.x > W + 40) { s.moving = false; s.done = 'oob'; s.event = 'oob'; return; }
      if (grounded && sp < 9) s.rest += dt; else s.rest = 0;
      if (s.rest > .3 || s.t > 14) { b.vx = b.vy = 0; s.moving = false; s.done = 'stop'; s.event = 'stop'; }
    }
  };

  /* --------------------------------------------------------------- game */
  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function startHole(g, n) {
      var d = g.data;
      d.hole = n;
      d.sim = Sim.make(HOLES[n]);
      d.strokes = 0;
      d.phase = 'aim';
      d.drag = null; d.aimAng = .7; d.aimPow = 0;
      d.trail = [];
      d.intro = 1.3;
      d.result = null;
      d.cannon = { x: d.sim.ball.x, y: d.sim.ball.y, alpha: 1, recoil: 0 };
      d.acc = 0;
      g.set('Hole', (n + 1) + '/' + HOLES.length);
      g.set('Strokes', '0 / par ' + HOLES[n].par);
    }

    function reset(g) {
      var d = g.data;
      d.toPar = 0; d.aces = 0;
      d.parts = []; d.shake = 0; d.flash = null;
      d.crystals = [];
      for (var i = 0; i < 40; i++) d.crystals.push({ x: U.rand(30, W - 30), y: U.rand(52, 70), s: U.rand(.5, 1.2), h: U.rand(170, 300) });
      startHole(g, 0);
      g.set('Score', 0);
      g.set('To Par', 'E');
    }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = U.rand(30, spd || 200);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.25, .6), max: .6, col: col });
      }
    }

    function parStr(n) { return n === 0 ? 'E' : (n > 0 ? '+' + n : '' + n); }

    function fire(g) {
      var d = g.data;
      if (d.aimPow < .05) return;
      d.strokes++;
      Sim.fire(d.sim, d.aimAng, d.aimPow);
      d.phase = 'fly';
      d.trail = [];
      d.cannon.recoil = 1;
      d.shake = 5;
      burst(d, d.sim.ball.x + Math.cos(d.aimAng) * 26, d.sim.ball.y - Math.sin(d.aimAng) * 26, '#fde68a', 12, 260);
      Milo.sound.tone({ f: 120, f2: 30, d: .22, v: .14, type: 'square' });
      Milo.sound.noise(.25, .14, 700);
      g.set('Strokes', d.strokes + ' / par ' + HOLES[d.hole].par);
    }

    function finishHole(g, holed) {
      var d = g.data, par = HOLES[d.hole].par;
      var pts = Math.max(0, par + 2 - d.strokes) * 100 + (holed && d.strokes === 1 ? 250 : 0);
      var diff = d.strokes - par;
      d.toPar += diff;
      g.score += pts;
      var label = !holed ? 'Picked up · +0' :
        d.strokes === 1 ? 'HOLE IN ONE! +' + pts :
          diff <= -2 ? 'Eagle! +' + pts : diff === -1 ? 'Birdie! +' + pts : diff === 0 ? 'Par · +' + pts :
            diff === 1 ? 'Bogey · +' + pts : 'Double bogey+ · +' + pts;
      if (holed && d.strokes === 1) d.aces++;
      d.result = { text: label, good: diff <= 0 };
      d.phase = 'result'; d.t = 2;
      g.set('Score', U.fmt(g.score));
      g.set('To Par', parStr(d.toPar));
      if (holed) { burst(d, d.sim.cup.x, d.sim.cup.y - 6, '#fde68a', 26, 280); }
      if (diff <= -1 && holed) Milo.sound.win(); else if (holed) Milo.sound.powerup(); else Milo.sound.lose();
    }

    function handle(g, ev) {
      var d = g.data, s = d.sim, b = s.ball;
      if (ev === 'bounce') {
        burst(d, b.x, b.y, '#fb923c', 5, 120);
        Milo.sound.tone({ f: 420 + Math.random() * 120, f2: 240, d: .06, v: .06, type: 'triangle' });
      } else if (ev === 'bumper') {
        burst(d, b.x, b.y, '#f472b6', 10, 220);
        Milo.sound.tone({ f: 700, f2: 1100, d: .1, v: .08, type: 'square' });
        d.shake = 4;
      } else if (ev === 'holed') {
        finishHole(g, true);
      } else if (ev === 'oob') {
        d.strokes++;
        d.flash = { text: 'Lost ball · +1 stroke', t: 1.4 };
        b.x = s.last.x; b.y = s.last.y; b.vx = b.vy = 0;
        Milo.sound.lose();
        afterShot(g);
      } else if (ev === 'stop') {
        afterShot(g);
      }
    }

    function afterShot(g) {
      var d = g.data, par = HOLES[d.hole].par;
      g.set('Strokes', d.strokes + ' / par ' + par);
      if (d.strokes >= par + 4) { finishHole(g, false); return; }
      d.phase = 'aim'; d.drag = null; d.aimPow = 0;
      d.cannon = { x: d.sim.ball.x, y: d.sim.ball.y, alpha: 0, recoil: 0 };
      burst(d, d.sim.ball.x, d.sim.ball.y, '#a8a29e', 8, 90);
      Milo.sound.click();
    }

    function preview(d) {
      var s = d.sim;
      var p = { walls: s.walls, bumpers: s.bumpers.map(function (b) { return { x: b.x, y: b.y, r: b.r, hot: 0 }; }),
        cup: s.cup, ball: { x: s.ball.x, y: s.ball.y, vx: 0, vy: 0 }, last: s.last, moving: false, t: 0, rest: 0 };
      Sim.fire(p, d.aimAng, d.aimPow);
      var pts = [];
      for (var i = 0; i < 70 && p.moving; i++) {
        Sim.step(p);
        if (i % 3 === 0) pts.push({ x: p.ball.x, y: p.ball.y });
      }
      return pts;
    }

    return Milo.arcade(host, {
      id: 'cannon-golf',
      w: W, h: H, bg: '#12100e',
      stats: ['Score', 'Hole', 'Strokes', 'To Par'],
      emo: '💣',
      start: {
        title: 'Cannon Golf',
        text: 'Twelve cave holes, one cannon. Drag from anywhere to aim — further means harder — and ' +
          'release to fire. The walls are bouncy, the pink bumpers are bouncier, and every shot counts ' +
          'as a stroke. Sink it under par for the big points.',
        keys: ['Drag to aim, release to fire', 'Watch the dotted preview']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (g.state !== 'play' || d.phase !== 'aim' || d.intro > 0) return;
        var b = d.sim.ball;
        if (type === 'down') d.drag = { x: x, y: y };
        if (d.drag && (type === 'down' || type === 'move')) {
          var dx = x - b.x, dy = y - b.y, m = Math.hypot(dx, dy);
          d.aimAng = Math.atan2(-dy, dx);
          d.aimPow = U.clamp((m - 18) / 210, 0, 1);
        }
        if (type === 'up' && d.drag) { fire(g); d.drag = null; }
      },

      update: function (g, dt) {
        var d = g.data, s = d.sim;
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 30);
        d.parts = d.parts.filter(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt; return p.life > 0; });
        if (d.flash) { d.flash.t -= dt; if (d.flash.t <= 0) d.flash = null; }
        if (d.intro > 0) d.intro -= dt;
        d.cannon.alpha = Math.min(1, d.cannon.alpha + dt * 4);
        d.cannon.recoil = Math.max(0, d.cannon.recoil - dt * 4);
        s.bumpers.forEach(function (b) { b.hot = Math.max(0, b.hot - dt * 3); });

        if (d.phase === 'fly') {
          d.acc += dt;
          var guard = 0;
          while (d.acc >= STEP && guard++ < 10 && d.phase === 'fly') {
            Sim.step(s); d.acc -= STEP;
            if (s.event) handle(g, s.event);
          }
          d.trail.push({ x: s.ball.x, y: s.ball.y });
          if (d.trail.length > 60) d.trail.shift();
        } else if (d.phase === 'result') {
          d.t -= dt;
          if (d.t <= 0) {
            if (d.hole + 1 >= HOLES.length) {
              g.win({
                emo: '💣', title: 'Round complete',
                text: 'Twelve holes at ' + parStr(d.toPar) + (d.aces ? ' with ' + d.aces + ' hole-in-one' + (d.aces > 1 ? 's' : '') : '') + '. ' + U.fmt(g.score) + ' points.',
                score: g.score
              });
            } else startHole(g, d.hole + 1);
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, s = d.sim, b = s.ball, L = HOLES[d.hole];
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1c1917'); bg.addColorStop(1, '#0c0a09');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        // faint glow blobs
        c.fillStyle = 'rgba(56,189,248,.05)';
        c.beginPath(); c.arc(s.cup.x, s.cup.y - 40, 120, 0, 7); c.fill();

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // walls
        s.walls.forEach(function (w) {
          c.fillStyle = '#3f3a36'; c.fillRect(w.x, w.y, w.w, w.h);
          c.fillStyle = '#5c534c'; c.fillRect(w.x, w.y, w.w, 4);
          c.fillStyle = '#2a2521'; c.fillRect(w.x, w.y + w.h - 4, w.w, 4);
          c.fillStyle = 'rgba(0,0,0,.25)';
          for (var px = w.x + 8; px < w.x + w.w - 8; px += 26) c.fillRect(px, w.y + 8 + ((px / 26) % 3) * 6, 10, 3);
        });
        // crystals on the ceiling
        d.crystals.forEach(function (cr) {
          c.fillStyle = 'hsla(' + cr.h + ',80%,65%,.7)';
          c.beginPath(); c.moveTo(cr.x - 5 * cr.s, cr.y - 4); c.lineTo(cr.x + 5 * cr.s, cr.y - 4); c.lineTo(cr.x, cr.y + 12 * cr.s); c.closePath(); c.fill();
        });

        // bumpers
        s.bumpers.forEach(function (bp) {
          c.shadowColor = '#f472b6'; c.shadowBlur = 14 + bp.hot * 20;
          c.fillStyle = bp.hot > 0 ? '#fbcfe8' : '#db2777';
          c.beginPath(); c.arc(bp.x, bp.y, bp.r + bp.hot * 4, 0, 7); c.fill();
          c.shadowBlur = 0;
          c.strokeStyle = '#fce7f3'; c.lineWidth = 3; c.beginPath(); c.arc(bp.x, bp.y, bp.r * .6, 0, 7); c.stroke();
        });

        // cup + flag
        c.fillStyle = '#050505';
        c.beginPath(); c.ellipse(s.cup.x, s.cup.y, 13, 6, 0, 0, 7); c.fill();
        c.strokeStyle = '#e7e5e4'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(s.cup.x, s.cup.y - 2); c.lineTo(s.cup.x, s.cup.y - 58); c.stroke();
        c.fillStyle = '#fde047';
        c.beginPath(); c.moveTo(s.cup.x, s.cup.y - 58); c.lineTo(s.cup.x + 26, s.cup.y - 48 + Math.sin(g.t * 5) * 3); c.lineTo(s.cup.x, s.cup.y - 38); c.closePath(); c.fill();

        // trail
        if (d.trail.length > 1) {
          c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.setLineDash([4, 6]);
          c.beginPath(); d.trail.forEach(function (p, k) { if (k) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); }); c.stroke();
          c.setLineDash([]);
        }

        // cannon
        var cn = d.cannon;
        if (d.phase === 'aim' || d.phase === 'fly') {
          c.globalAlpha = cn.alpha;
          c.save(); c.translate(cn.x, cn.y + 4);
          c.fillStyle = '#292524'; c.beginPath(); c.arc(0, 0, 11, 0, 7); c.fill();
          c.strokeStyle = '#78716c'; c.lineWidth = 2; c.stroke();
          c.rotate(-(d.phase === 'aim' ? d.aimAng : d.aimAng));
          c.fillStyle = '#44403c';
          U.roundRect(c, -8 - cn.recoil * 8, -8, 36, 16, 4); c.fill();
          c.fillStyle = '#a8a29e'; c.fillRect(20 - cn.recoil * 8, -9, 6, 18);
          c.restore();
          c.globalAlpha = 1;
        }

        // ball
        if (d.phase !== 'result' || d.result && !d.result.good && d.strokes >= L.par + 4) {
          c.fillStyle = '#f5f5f4'; c.shadowColor = '#fff'; c.shadowBlur = 8;
          c.beginPath(); c.arc(b.x, b.y, R, 0, 7); c.fill(); c.shadowBlur = 0;
          c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.arc(b.x + 3, b.y + 3, R * .55, 0, 7); c.fill();
        }

        // aim preview
        if (d.phase === 'aim' && d.drag && d.aimPow > .05 && d.intro <= 0) {
          var pts = preview(d);
          c.fillStyle = '#fde68a';
          pts.forEach(function (p, i) {
            c.globalAlpha = .9 - i / pts.length * .7;
            c.beginPath(); c.arc(p.x, p.y, 3.2, 0, 7); c.fill();
          });
          c.globalAlpha = 1;
          c.fillStyle = 'rgba(0,0,0,.5)'; U.roundRect(c, b.x - 40, b.y - 44, 80, 12, 6); c.fill();
          c.fillStyle = d.aimPow > .85 ? '#ef4444' : d.aimPow > .5 ? '#fbbf24' : '#4ade80';
          U.roundRect(c, b.x - 40, b.y - 44, 80 * d.aimPow, 12, 6); c.fill();
        }

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max); c.fillStyle = p.col;
          c.fillRect(p.x - 2, p.y - 2, 4, 4);
        });
        c.globalAlpha = 1;
        c.restore();

        // hole label
        c.fillStyle = 'rgba(0,0,0,.45)'; U.roundRect(c, W / 2 - 150, 56, 300, 28, 14); c.fill();
        c.fillStyle = '#e7e5e4'; c.font = '700 14px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillText('Hole ' + (d.hole + 1) + ' · ' + L.name + ' · par ' + L.par, W / 2, 75);

        if (d.intro > 0) {
          c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, H / 2 - 40, W, 80);
          c.fillStyle = '#fff'; c.font = '800 32px Outfit, sans-serif';
          c.fillText('Hole ' + (d.hole + 1) + ' — ' + L.name, W / 2, H / 2 + 11);
        } else if (d.phase === 'aim' && !d.drag && d.strokes === 0) {
          c.fillStyle = 'rgba(255,255,255,.6)'; c.font = '600 15px Outfit, sans-serif';
          c.fillText('drag to aim · release to fire', W / 2, H - 14);
        }
        if (d.flash) {
          c.globalAlpha = Math.min(1, d.flash.t); c.fillStyle = '#fca5a5'; c.font = '800 24px Outfit, sans-serif';
          c.fillText(d.flash.text, W / 2, 130); c.globalAlpha = 1;
        }
        if (d.phase === 'result' && d.result) {
          c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, H / 2 - 40, W, 80);
          c.fillStyle = d.result.good ? '#fde68a' : '#fca5a5'; c.font = '800 30px Outfit, sans-serif';
          c.fillText(d.result.text, W / 2, H / 2 + 11);
        }
      }
    });
  }

  window.Milo.register({
    id: 'cannon-golf', title: 'Cannon Golf', emo: '💣', category: 'Casual',
    tagline: 'Golf, but the club is a cannon and the course is a cave',
    description: 'Twelve cave holes played with a cannon that trundles along to wherever your ball ' +
      'stops. Drag from anywhere to set angle and power, watch the dotted preview bounce off the ' +
      'first wall, and fire. Rock walls return most of your speed, pink bumpers fling you out faster ' +
      'than you arrived, and pits swallow the ball for a one-stroke penalty. Every hole has a par: ' +
      'par pays 200, a birdie 300, and a hole-in-one 650. Tip: the ball only drops when it crosses the ' +
      'cup slowly, so a soft roll along the floor beats a hard shot at the flag.',
    controls: ['Drag to aim', 'Release to fire', 'Touch'],
    colors: ['#1c1917', '#fde047'],
    tags: ['golf', 'physics', 'aiming', 'cave', 'bounce'],
    _sim: Sim, _holes: HOLES,
    mount: mount
  });
})();
