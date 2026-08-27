/* Ski Slalom — 40 gates, glare ice, and trees that do not move for anyone. */
(function () {
  'use strict';
  var W = 560, H = 740, TAU = Math.PI * 2;
  var SY = 230;                       // skier's fixed screen row
  var GATES = 40, GATE_STEP = 300, FIRST = 500;
  var PAR = 56;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function pisteX(d, s) {
      return W / 2 + (U.noise2(s * .0009, 4.7, d.seed) - .5) * 280;
    }
    function finishS() { return FIRST + GATES * GATE_STEP + 420; }

    function reset(g) {
      var d = g.data;
      d.seed = (Math.random() * 9999) | 0;
      d.s = 0;
      d.x = pisteX(d, 0);
      d.a = 0;              // ski facing (radians off the fall line)
      d.va = 0;             // actual velocity direction (lags on ice)
      d.v = 0;
      d.time = 0;
      d.hits = 0;
      d.onIce = false;
      d.gates = [];
      for (var i = 0; i < GATES; i++) {
        var sg = FIRST + i * GATE_STEP;
        var side = i % 2 ? 1 : -1;
        var off = side * (50 + U.hash2(i, 9, d.seed) * (50 + i * 2.2));
        d.gates.push({
          s: sg, x: pisteX(d, sg) + off,
          col: i % 2 ? '#3b82f6' : '#ef4444',
          state: 0                            // 0 ahead, 1 hit, 2 missed
        });
      }
      d.ice = [];
      for (var s2 = 900; s2 < finishS() - 400; s2 += 520) {
        if (U.hash2(s2, 21, d.seed) < .45) continue;
        d.ice.push({
          s: s2 + U.hash2(s2, 22, d.seed) * 260,
          x: pisteX(d, s2) + (U.hash2(s2, 23, d.seed) - .5) * 280,
          w: 90 + U.hash2(s2, 24, d.seed) * 90,
          h: 60 + U.hash2(s2, 25, d.seed) * 50
        });
      }
      d.trees = [];
      for (var row = 4; row < finishS() / 90; row++) {
        var hsh = U.hash2(row, 31, d.seed);
        if (hsh < .52) continue;
        var sr = row * 90;
        var margin = sr < FIRST + 15 * GATE_STEP ? 165 : sr < FIRST + 28 * GATE_STEP ? 115 : 78;
        var lat = (U.hash2(row, 33, d.seed) - .5) * 2;
        var tx = pisteX(d, sr) + lat * 265;
        if (Math.abs(tx - pisteX(d, sr)) < margin) continue;
        d.trees.push({ s: sr, x: tx, big: hsh > .8 });
      }
      d.trail = [];
      d.parts = [];
      d.floats = [];
      d.dying = 0;
      d.done = false;
      g.set('Gates', '0/' + GATES);
      g.set('Time', '0.0');
      g.set('Speed', 0);
    }

    function crash(g, what) {
      var d = g.data;
      if (d.dying > 0) return;
      d.dying = 1.1;
      d.deadWhy = what;
      Milo.sound.explode();
      for (var i = 0; i < 24; i++) {
        var a = Math.random() * TAU, sp = U.rand(50, 260);
        d.parts.push({
          x: d.x, y: SY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          t: U.rand(.4, .9), max: .9, col: U.choice(['#fff', '#dbeafe', '#fb7185'])
        });
      }
    }

    return Milo.arcade(host, {
      id: 'ski-slalom',
      w: W, h: H, bg: '#dfe9f5',
      stats: ['Gates', 'Time', 'Speed'],
      touch: 'dpad',
      emo: '⛷️',
      start: {
        title: 'Ski Slalom',
        text: 'Forty gates down the mountain: pass between each pair of flags. Glare-ice ' +
          'patches let the skis slide wide of where you point them, and the trees are ' +
          'exactly as solid as they look. Beat ' + PAR + 's for a time bonus.',
        keys: ['← → carve', '↓ tuck for speed']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, inp = g.input;
        if (d.done) return;

        if (d.dying > 0) {
          d.dying -= dt;
          d.v *= 1 - 3 * dt;
          d.s += Math.max(0, d.v) * dt;
          stepFx(d, dt);
          if (d.dying <= 0) {
            g.gameOver({
              emo: '🌲',
              title: 'Into the ' + (d.deadWhy === 'tree' ? 'trees!' : 'snow!'),
              text: d.hits + '/' + GATES + ' gates before the crash.',
              score: d.hits * 100
            });
          }
          return;
        }

        d.time += dt;
        var steer = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
        if (inp.pdown) steer = inp.px < W / 2 ? -1 : 1;
        var tuck = inp.down('down') || inp.down('up');

        // Ice check.
        var wasIce = d.onIce;
        d.onIce = false;
        for (var ii = 0; ii < d.ice.length; ii++) {
          var ice = d.ice[ii];
          var dx = (d.x - ice.x) / ice.w, ds = (d.s - ice.s) / ice.h;
          if (dx * dx + ds * ds < 1) { d.onIce = true; break; }
        }
        if (d.onIce && !wasIce) Milo.sound.tone({ f: 1400, f2: 900, d: .18, v: .07, type: 'sine' });

        var grip = d.onIce ? .16 : 1;
        d.a = U.clamp(d.a + steer * 3.1 * grip * dt, -1.15, 1.15);
        if (!steer) d.a *= 1 - 1.6 * grip * dt;
        // Velocity direction chases the skis — barely, on ice.
        d.va += (d.a - d.va) * Math.min(1, dt * (d.onIce ? 1.4 : 9));

        var carve = Math.abs(Math.sin(d.va));
        var target = (tuck ? 445 : 345) * (1 - (d.onIce ? .1 : .5) * carve) + Math.min(70, d.s * .006);
        d.v += (target - d.v) * Math.min(1, dt * 1.1);

        d.s += Math.cos(d.va) * d.v * dt;
        d.x += Math.sin(d.va) * d.v * dt;

        // Off-piste netting.
        var cx = pisteX(d, d.s);
        if (Math.abs(d.x - cx) > 262) {
          d.x = U.clamp(d.x, cx - 262, cx + 262);
          if (d.v > 180) { crash(g, 'net'); return; }
          d.v = Math.min(d.v, 120);
        }

        // Trail + spray.
        d.trail.push({ x: d.x, s: d.s, a: d.va });
        if (d.trail.length > 70) d.trail.shift();
        if (carve > .35 && !d.onIce && Math.random() < .8) {
          var side3 = Math.sign(Math.sin(d.va));
          d.parts.push({
            x: d.x - side3 * 10, y: SY + 12,
            vx: -side3 * U.rand(50, 150), vy: U.rand(-60, 10),
            t: U.rand(.25, .5), max: .5, col: '#fff'
          });
        }

        // Gates.
        d.gates.forEach(function (gt) {
          if (gt.state || gt.s > d.s) return;
          if (Math.abs(d.x - gt.x) < 45) {
            gt.state = 1;
            d.hits++;
            Milo.sound.coin();
            d.floats.push({ x: gt.x, y: SY - 40, txt: '✓', col: '#22c55e', t: 1 });
          } else {
            gt.state = 2;
            Milo.sound.tone({ f: 200, f2: 120, d: .2, v: .1, type: 'sawtooth' });
            d.floats.push({ x: gt.x, y: SY - 40, txt: 'MISSED', col: '#fb7185', t: 1.1 });
          }
          g.set('Gates', d.hits + '/' + GATES);
        });

        // Trees.
        for (var ti = 0; ti < d.trees.length; ti++) {
          var tr = d.trees[ti];
          if (Math.abs(tr.s - d.s) > 30) continue;
          if (Math.abs(tr.x - d.x) < (tr.big ? 20 : 15) && Math.abs(tr.s - d.s) < 20) {
            crash(g, 'tree');
            return;
          }
        }

        stepFx(d, dt);

        if (d.s >= finishS()) {
          d.done = true;
          var bonus = Math.round(Math.max(0, PAR - d.time) * 30);
          var perfect = d.hits === GATES;
          g.win({
            emo: perfect ? '🏆' : '⛷️',
            title: perfect ? 'Flawless run!' : 'Finish!',
            text: d.hits + '/' + GATES + ' gates in ' + d.time.toFixed(1) + 's' +
              (bonus ? ' — +' + bonus + ' time bonus.' : '.'),
            score: d.hits * 100 + bonus + (perfect ? 600 : 0)
          });
          return;
        }

        g.score = d.hits * 100;
        g.set('Time', d.time.toFixed(1));
        g.set('Speed', Math.round(d.v * .28));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;

        // Snow with a cool sheen.
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#f4f8fd');
        sky.addColorStop(1, '#d5e3f2');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        // Sparkle grains keyed to world position.
        c.fillStyle = 'rgba(255,255,255,.85)';
        for (var gi = 0; gi < 40; gi++) {
          var gs = (Math.floor(d.s / 60) + gi) * 60;
          var gy = SY + (gs - d.s);
          if (gy < 0 || gy > H) continue;
          var gx = U.hash2(gs, 41, d.seed) * W;
          c.fillRect(gx, gy, 2, 2);
        }

        // Off-piste shading + safety nets.
        c.fillStyle = 'rgba(160,185,215,.35)';
        function offP(side) {
          c.beginPath();
          c.moveTo(side < 0 ? -10 : W + 10, -10);
          for (var y2 = -10; y2 <= H + 20; y2 += 20) {
            c.lineTo(pisteX(d, d.s + (y2 - SY)) + side * 268, y2);
          }
          c.lineTo(side < 0 ? -10 : W + 10, H + 20);
          c.closePath(); c.fill();
        }
        offP(-1); offP(1);
        c.strokeStyle = '#fb923c'; c.lineWidth = 3;
        [-1, 1].forEach(function (side) {
          c.beginPath();
          for (var y3 = -10; y3 <= H + 20; y3 += 20) {
            var ex = pisteX(d, d.s + (y3 - SY)) + side * 265;
            if (y3 === -10) c.moveTo(ex, y3); else c.lineTo(ex, y3);
          }
          c.stroke();
        });

        // Ice patches.
        d.ice.forEach(function (ice) {
          var iy = SY + (ice.s - d.s);
          if (iy < -120 || iy > H + 120) return;
          c.fillStyle = 'rgba(147,197,253,.55)';
          c.beginPath(); c.ellipse(ice.x, iy, ice.w, ice.h, 0, 0, TAU); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2;
          c.beginPath(); c.ellipse(ice.x - ice.w * .2, iy - ice.h * .25, ice.w * .35, ice.h * .2, -.5, 0, TAU); c.stroke();
        });

        // Carve trails.
        c.strokeStyle = 'rgba(148,170,200,.6)'; c.lineWidth = 2;
        [-1, 1].forEach(function (ski) {
          c.beginPath();
          d.trail.forEach(function (p, i) {
            var px = p.x + Math.cos(p.a) * ski * 6;
            var py = SY + (p.s - d.s);
            if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
          });
          c.stroke();
        });

        // Gates (flags on poles).
        d.gates.forEach(function (gt) {
          var y4 = SY + (gt.s - d.s);
          if (y4 < -60 || y4 > H + 60) return;
          [-1, 1].forEach(function (side) {
            var px = gt.x + side * 45;
            c.strokeStyle = '#64748b'; c.lineWidth = 3;
            c.beginPath(); c.moveTo(px, y4); c.lineTo(px, y4 - 30); c.stroke();
            c.fillStyle = gt.state === 2 ? '#94a3b8' : gt.col;
            var wave = Math.sin(g.t * 5 + gt.s) * 2;
            c.beginPath();
            c.moveTo(px, y4 - 30);
            c.lineTo(px + side * (16 + wave), y4 - 25);
            c.lineTo(px, y4 - 18);
            c.closePath(); c.fill();
          });
          if (gt.state === 1) {
            c.fillStyle = 'rgba(34,197,94,.16)';
            c.fillRect(gt.x - 41, y4 - 4, 82, 8);
          }
        });

        // Finish banner.
        var fy = SY + (finishS() - d.s);
        if (fy > -80 && fy < H + 60) {
          var fx = pisteX(d, finishS());
          c.strokeStyle = '#334155'; c.lineWidth = 5;
          c.beginPath(); c.moveTo(fx - 130, fy); c.lineTo(fx - 130, fy - 56); c.stroke();
          c.beginPath(); c.moveTo(fx + 130, fy); c.lineTo(fx + 130, fy - 56); c.stroke();
          c.fillStyle = '#dc2626';
          c.fillRect(fx - 134, fy - 62, 268, 22);
          c.fillStyle = '#fff';
          c.font = '800 14px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('FINISH', fx, fy - 46);
        }

        // Trees.
        d.trees.forEach(function (tr) {
          var ty = SY + (tr.s - d.s);
          if (ty < -60 || ty > H + 60) return;
          var sc = tr.big ? 1.35 : 1;
          c.fillStyle = 'rgba(30,58,50,.25)';
          c.beginPath(); c.ellipse(tr.x + 4, ty + 4, 16 * sc, 7 * sc, 0, 0, TAU); c.fill();
          c.fillStyle = '#14532d';
          c.beginPath();
          c.moveTo(tr.x, ty - 44 * sc);
          c.lineTo(tr.x - 17 * sc, ty + 4);
          c.lineTo(tr.x + 17 * sc, ty + 4);
          c.closePath(); c.fill();
          c.fillStyle = '#f0f6fc';
          c.beginPath();
          c.moveTo(tr.x, ty - 44 * sc);
          c.lineTo(tr.x - 9 * sc, ty - 24 * sc);
          c.lineTo(tr.x + 9 * sc, ty - 24 * sc);
          c.closePath(); c.fill();
        });

        // Spray.
        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.t / p.max);
          c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, 3, 0, TAU); c.fill();
        });
        c.globalAlpha = 1;

        // Skier (top-down) or tumble.
        c.save();
        c.translate(d.x, SY);
        if (d.dying > 0) {
          c.rotate(g.t * 12);
          c.fillStyle = '#dc2626';
          U.roundRect(c, -8, -10, 16, 20, 6); c.fill();
          c.fillStyle = '#fde68a';
          c.beginPath(); c.arc(0, -14, 6, 0, TAU); c.fill();
        } else {
          c.rotate(d.va);
          // skis
          c.strokeStyle = '#f59e0b'; c.lineWidth = 4; c.lineCap = 'round';
          c.beginPath(); c.moveTo(-6, 16); c.lineTo(-6, -18); c.stroke();
          c.beginPath(); c.moveTo(6, 16); c.lineTo(6, -18); c.stroke();
          // poles
          c.strokeStyle = '#475569'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(-10, -2); c.lineTo(-16, 12); c.stroke();
          c.beginPath(); c.moveTo(10, -2); c.lineTo(16, 12); c.stroke();
          // body
          c.fillStyle = '#dc2626';
          U.roundRect(c, -8, -8, 16, 18, 7); c.fill();
          c.fillStyle = '#fff';
          c.fillRect(-8, -2, 16, 4);
          c.fillStyle = '#0ea5e9';
          c.beginPath(); c.arc(0, -10, 6.5, 0, TAU); c.fill();
          c.fillStyle = 'rgba(255,255,255,.75)';
          c.beginPath(); c.arc(-2, -12, 2.4, 0, TAU); c.fill();
        }
        c.restore();

        // Floats.
        c.textAlign = 'center';
        c.font = '800 17px Outfit, sans-serif';
        d.floats.forEach(function (f) {
          c.globalAlpha = Math.min(1, f.t);
          c.fillStyle = f.col;
          c.fillText(f.txt, f.x, f.y - (1.1 - f.t) * 26);
        });
        c.globalAlpha = 1;

        if (d.onIce && d.dying <= 0) {
          c.fillStyle = '#3b82f6';
          c.font = '800 16px Outfit, sans-serif';
          c.fillText('ICE!', d.x, SY - 34);
        }
      }
    });

    function stepFx(d, dt) {
      var i;
      for (i = d.parts.length - 1; i >= 0; i--) {
        var p = d.parts[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt;
        if (p.t <= 0) d.parts.splice(i, 1);
      }
      for (i = d.floats.length - 1; i >= 0; i--) {
        d.floats[i].t -= dt;
        if (d.floats[i].t <= 0) d.floats.splice(i, 1);
      }
    }
  }

  window.Milo.register({
    id: 'ski-slalom', title: 'Ski Slalom', emo: '⛷️', category: 'Sports',
    tagline: 'Forty gates, glare ice, real trees',
    description: 'Carve between forty pairs of slalom flags that swing further off the ' +
      'racing line the lower you get. Pale-blue glare ice barely answers the skis — you ' +
      'keep sliding the way you were already going — so set your line before a patch, ' +
      'not on it. Every clean gate pays 100, finishing under ' + PAR + ' seconds pays a ' +
      'time bonus, and a tree ends the run with whatever you have banked.',
    controls: ['← → carve', '↓ tuck'],
    colors: ['#dfe9f5', '#3b82f6'],
    tags: ['skiing', 'slalom', 'winter', 'time trial', 'downhill'],
    mount: mount
  });
})();
