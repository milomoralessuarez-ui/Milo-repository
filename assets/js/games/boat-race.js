/* Boat Race — thread the buoy gates down a narrowing river before the clock dies. */
(function () {
  'use strict';
  var W = 560, H = 740, TAU = Math.PI * 2;
  var BY = H - 170;               // the boat's fixed screen row
  var GATES = 26, GATE_GAP = 420, FIRST_GATE = 620;
  var TIME_LIMIT = 80, MISS_COST = 4;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function riverX(d, s) {
      return W / 2 +
        Math.sin(s * .0016 + d.seed) * 62 +
        (U.noise2(s * .0011, 5.3, d.seed) - .5) * 190;
    }
    function riverW(d, s) {
      var t = U.clamp(s / (FIRST_GATE + GATES * GATE_GAP), 0, 1);
      return 236 - t * 92 + (U.noise2(s * .002, 9.1, d.seed) - .5) * 30;
    }
    function finishS() { return FIRST_GATE + GATES * GATE_GAP + 260; }

    function reset(g) {
      var d = g.data;
      d.seed = (Math.random() * 9999) | 0;
      d.s = 0;
      d.x = riverX(d, 0);
      d.a = 0;                    // heading relative to downriver
      d.v = 0;
      d.lvx = 0;                  // lateral slide (wake feel)
      d.timeLeft = TIME_LIMIT;
      d.elapsed = 0;
      d.hits = 0; d.misses = 0;
      d.gates = [];
      for (var i = 0; i < GATES; i++) {
        var sg = FIRST_GATE + i * GATE_GAP;
        var wd = riverW(d, sg);
        var gap = 116 - i * 1.2;
        var off = (U.hash2(i, 3, d.seed) - .5) * (wd - gap - 46);
        d.gates.push({ s: sg, x: riverX(d, sg) + off, gap: gap, state: 0 }); // 0 ahead, 1 hit, 2 miss
      }
      d.parts = [];
      d.floats = [];
      d.rings = [];
      d.go = 2.6;
      d.done = false;
      g.set('Gates', '0/' + GATES);
      g.set('Time', TIME_LIMIT.toFixed(1));
      g.set('Speed', 0);
    }

    function addFloat(d, x, y, txt, col) {
      d.floats.push({ x: x, y: y, txt: txt, col: col, t: 1.3 });
    }

    function finish(g) {
      var d = g.data;
      d.done = true;
      var bonus = Math.round(Math.max(0, d.timeLeft) * 25);
      g.win({
        emo: '🚤',
        title: d.misses === 0 ? 'Perfect run!' : 'Finish!',
        text: d.hits + '/' + GATES + ' gates, ' + d.timeLeft.toFixed(1) + 's to spare.',
        score: d.hits * 100 + bonus + (d.misses === 0 ? 500 : 0)
      });
    }

    return Milo.arcade(host, {
      id: 'boat-race',
      w: W, h: H, bg: '#0b4f6c',
      stats: ['Gates', 'Time', 'Speed'],
      touch: 'dpad',
      emo: '🚤',
      start: {
        title: 'Boat Race',
        text: 'A winding river, ' + GATES + ' buoy gates, one clock. Steer between each ' +
          'red-and-green pair — every miss costs ' + MISS_COST + ' seconds, and the river ' +
          'narrows all the way to the finish line.',
        keys: ['← → steer', '↓ ease off']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, inp = g.input;
        if (d.done) return;

        if (d.go > 0) {
          var b4 = Math.ceil(d.go);
          d.go -= dt;
          if (Math.ceil(d.go) !== b4 && d.go > 0) Milo.sound.tone({ f: 440, d: .1, v: .09, type: 'square' });
          if (d.go <= 0) Milo.sound.tone({ f: 880, d: .25, v: .12, type: 'square' });
          return;
        }

        var steer = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
        if (inp.pdown) steer = inp.px < W / 2 ? -1 : 1;
        var ease = inp.down('down');

        // Rudder with lag; the hull slides before the wake catches up.
        d.a += (steer * .62 - d.a) * Math.min(1, dt * 3.2);
        var maxV = ease ? 220 : 350 + Math.min(90, d.s * .004);
        d.v += (maxV - d.v) * Math.min(1, dt * .9);

        var targetLat = Math.sin(d.a) * d.v * 1.35;
        d.lvx += (targetLat - d.lvx) * Math.min(1, dt * 2.4);

        d.s += Math.cos(d.a) * d.v * dt;
        d.x += d.lvx * dt;

        // Bank scrape.
        var cx = riverX(d, d.s), wd = riverW(d, d.s);
        var lim = wd / 2 - 20;
        if (d.x < cx - lim || d.x > cx + lim) {
          d.x = U.clamp(d.x, cx - lim, cx + lim);
          if (d.v > 120) {
            Milo.sound.hit();
            for (var i = 0; i < 10; i++) {
              d.parts.push({
                x: d.x + (d.x > cx ? 18 : -18), y: BY + U.rand(-16, 8),
                vx: (d.x > cx ? -1 : 1) * U.rand(30, 120), vy: U.rand(-90, -20),
                t: U.rand(.25, .5), max: .5, col: U.choice(['#dff6ff', '#9adbe8', '#fff'])
              });
            }
          }
          d.v *= Math.pow(.28, dt * 3);
          d.lvx *= .4;
        }

        // Clock.
        d.timeLeft -= dt;
        d.elapsed += dt;
        if (d.timeLeft <= 0) {
          d.timeLeft = 0;
          g.set('Time', '0.0');
          Milo.sound.explode();
          g.gameOver({
            emo: '⏱️',
            title: 'Out of time',
            text: d.hits + '/' + GATES + ' gates made it.',
            score: d.hits * 100
          });
          return;
        }

        // Gates.
        d.gates.forEach(function (gt) {
          if (gt.state || gt.s > d.s) return;
          if (Math.abs(d.x - gt.x) < gt.gap / 2) {
            gt.state = 1;
            d.hits++;
            Milo.sound.coin();
            addFloat(d, gt.x, BY - 60, '✓ +100', '#4ade80');
            d.rings.push({ x: gt.x, s: gt.s, t: .5 });
          } else {
            gt.state = 2;
            d.misses++;
            d.timeLeft -= MISS_COST;
            Milo.sound.tone({ f: 220, f2: 110, d: .3, v: .13, type: 'sawtooth' });
            addFloat(d, gt.x, BY - 60, 'MISS  −' + MISS_COST + 's', '#fb7185');
          }
          g.set('Gates', d.hits + '/' + GATES);
        });

        // Wake foam.
        if (d.v > 80) {
          for (var k = -1; k <= 1; k += 2) {
            d.parts.push({
              x: d.x - Math.sin(d.a) * 26 + k * 12, y: BY + 26,
              vx: k * U.rand(14, 44) - d.lvx * .3, vy: U.rand(40, 90),
              t: U.rand(.5, .95), max: .95, col: 'rgba(233,248,255,.9)'
            });
          }
        }

        for (var pi = d.parts.length - 1; pi >= 0; pi--) {
          var p = d.parts[pi];
          p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt;
          if (p.t <= 0) d.parts.splice(pi, 1);
        }
        for (pi = d.floats.length - 1; pi >= 0; pi--) {
          d.floats[pi].t -= dt;
          if (d.floats[pi].t <= 0) d.floats.splice(pi, 1);
        }
        for (pi = d.rings.length - 1; pi >= 0; pi--) {
          d.rings[pi].t -= dt;
          if (d.rings[pi].t <= 0) d.rings.splice(pi, 1);
        }

        if (d.s >= finishS()) { finish(g); return; }

        g.score = d.hits * 100;
        g.set('Time', d.timeLeft.toFixed(1));
        g.set('Speed', Math.round(d.v * .3));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;

        // Water.
        var wat = c.createLinearGradient(0, 0, 0, H);
        wat.addColorStop(0, '#0d6486');
        wat.addColorStop(1, '#0a4258');
        c.fillStyle = wat; c.fillRect(0, 0, W, H);

        // Shimmer rows tied to world distance, so they stream past the hull.
        c.strokeStyle = 'rgba(255,255,255,.10)'; c.lineWidth = 2;
        for (var row = 0; row < 22; row++) {
          var ws = (Math.floor(d.s / 46) + row) * 46;
          var y = BY - (ws - d.s);
          if (y < -20 || y > H + 20) continue;
          var cxr = riverX(d, ws);
          var off = (U.noise2(ws * .01, 3, d.seed) - .5) * 120;
          c.beginPath();
          c.moveTo(cxr + off - 20, y);
          c.quadraticCurveTo(cxr + off, y + 5, cxr + off + 22, y);
          c.stroke();
        }

        // Banks as polygons sampled down the screen.
        function bank(side) {
          c.beginPath();
          c.moveTo(side < 0 ? -10 : W + 10, -10);
          for (var y2 = -10; y2 <= H + 20; y2 += 16) {
            var s2 = d.s + (BY - y2);
            var e = riverX(d, s2) + side * riverW(d, s2) / 2;
            c.lineTo(e, y2);
          }
          c.lineTo(side < 0 ? -10 : W + 10, H + 20);
          c.closePath();
        }
        // Sand lip then grass.
        c.fillStyle = '#d9c087';
        bank(-1); c.save(); c.translate(-12, 0); c.fill(); c.restore();
        bank(1); c.save(); c.translate(12, 0); c.fill(); c.restore();
        c.fillStyle = '#2e7d4f';
        bank(-1); c.save(); c.translate(-26, 0); c.fill(); c.restore();
        bank(1); c.save(); c.translate(26, 0); c.fill(); c.restore();

        // Reeds and pines along the banks.
        for (var ti = Math.floor(d.s / 150) - 1; ti < Math.floor(d.s / 150) + 8; ti++) {
          var hsh = U.hash2(ti, 17, d.seed);
          var ts = ti * 150 + hsh * 90;
          var ty = BY - (ts - d.s);
          if (ty < -40 || ty > H + 40) continue;
          var side2 = hsh > .5 ? 1 : -1;
          var ex = riverX(d, ts) + side2 * (riverW(d, ts) / 2 + 34 + hsh * 40);
          if (hsh > .35) {
            c.fillStyle = '#1d5c38';
            c.beginPath();
            c.moveTo(ex, ty - 34); c.lineTo(ex - 13, ty + 6); c.lineTo(ex + 13, ty + 6);
            c.closePath(); c.fill();
            c.fillStyle = '#5b3a21'; c.fillRect(ex - 2, ty + 6, 4, 7);
          } else {
            c.strokeStyle = '#7fb069'; c.lineWidth = 2;
            for (var r2 = -1; r2 <= 1; r2++) {
              c.beginPath();
              c.moveTo(ex + r2 * 5, ty + 8);
              c.quadraticCurveTo(ex + r2 * 8, ty - 6, ex + r2 * 11, ty - 14);
              c.stroke();
            }
          }
        }

        // Gate rings (splash on a made gate).
        d.rings.forEach(function (r) {
          var y3 = BY - (r.s - d.s);
          c.globalAlpha = r.t * 2;
          c.strokeStyle = '#4ade80'; c.lineWidth = 3;
          c.beginPath(); c.arc(r.x, y3, (0.5 - r.t) * 140 + 20, 0, TAU); c.stroke();
          c.globalAlpha = 1;
        });

        // Buoy gates.
        d.gates.forEach(function (gt) {
          var y4 = BY - (gt.s - d.s);
          if (y4 < -60 || y4 > H + 60) return;
          var bob = Math.sin(g.t * 2.4 + gt.s) * 3;
          function buoy(bx, col, dark) {
            c.fillStyle = 'rgba(6,26,36,.4)';
            c.beginPath(); c.ellipse(bx, y4 + bob + 10, 14, 5, 0, 0, TAU); c.fill();
            c.fillStyle = col;
            c.beginPath(); c.arc(bx, y4 + bob, 12, 0, TAU); c.fill();
            c.fillStyle = dark;
            c.beginPath(); c.arc(bx, y4 + bob, 12, Math.PI * .1, Math.PI * .9); c.fill();
            c.fillStyle = '#fff';
            c.fillRect(bx - 2, y4 + bob - 17, 4, 8);
          }
          var faded = gt.state === 2;
          c.globalAlpha = faded ? .45 : 1;
          buoy(gt.x - gt.gap / 2, '#ef4444', '#9f1d1d');
          buoy(gt.x + gt.gap / 2, '#22c55e', '#166534');
          if (gt.state === 0 && y4 < BY) {
            c.strokeStyle = 'rgba(255,255,255,.22)';
            c.setLineDash([4, 8]); c.lineWidth = 2;
            c.beginPath();
            c.moveTo(gt.x - gt.gap / 2 + 16, y4 + bob);
            c.lineTo(gt.x + gt.gap / 2 - 16, y4 + bob);
            c.stroke();
            c.setLineDash([]);
          }
          c.globalAlpha = 1;
        });

        // Finish banner.
        var fy = BY - (finishS() - d.s);
        if (fy > -80 && fy < H + 40) {
          var fcx = riverX(d, finishS()), fw = riverW(d, finishS());
          for (var ch = 0; ch < Math.floor(fw / 16); ch++) {
            c.fillStyle = ch % 2 ? '#fff' : '#16283a';
            c.fillRect(fcx - fw / 2 + ch * 16, fy - 8, 16, 16);
          }
          c.fillStyle = '#fff';
          c.font = '800 15px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('FINISH', fcx, fy - 18);
        }

        // Foam.
        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.t / p.max) * .9;
          c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, 3.4, 0, TAU); c.fill();
        });
        c.globalAlpha = 1;

        // The boat.
        var bobb = Math.sin(g.t * 3.1) * 1.6;
        c.save();
        c.translate(d.x, BY + bobb);
        c.rotate(d.a * .85 + d.lvx * .0006);
        c.fillStyle = 'rgba(6,26,36,.4)';
        c.beginPath(); c.ellipse(3, 8, 18, 30, 0, 0, TAU); c.fill();
        // hull
        c.fillStyle = '#f4f6fb';
        c.beginPath();
        c.moveTo(0, -34);
        c.quadraticCurveTo(17, -16, 15, 20);
        c.quadraticCurveTo(8, 28, 0, 28);
        c.quadraticCurveTo(-8, 28, -15, 20);
        c.quadraticCurveTo(-17, -16, 0, -34);
        c.closePath(); c.fill();
        c.fillStyle = '#e04848';
        c.beginPath();
        c.moveTo(0, -34);
        c.quadraticCurveTo(12, -18, 11, 0);
        c.lineTo(-11, 0);
        c.quadraticCurveTo(-12, -18, 0, -34);
        c.closePath(); c.fill();
        c.fillStyle = '#173042';
        U.roundRect(c, -8, 0, 16, 14, 5); c.fill();
        c.fillStyle = '#ffd257';
        c.beginPath(); c.arc(0, 7, 4.4, 0, TAU); c.fill();
        c.fillStyle = '#22303c';
        U.roundRect(c, -5, 22, 10, 8, 3); c.fill();
        c.restore();

        // Floating text.
        c.textAlign = 'center';
        c.font = '800 17px Outfit, sans-serif';
        d.floats.forEach(function (f) {
          c.globalAlpha = Math.min(1, f.t);
          c.fillStyle = f.col;
          c.fillText(f.txt, f.x, f.y - (1.3 - f.t) * 30);
        });
        c.globalAlpha = 1;

        // Course progress strip.
        var pw = 8, px2 = W - 22, py2 = 70, ph = H - 160;
        c.fillStyle = 'rgba(6,26,36,.5)';
        U.roundRect(c, px2 - 2, py2 - 2, pw + 4, ph + 4, 5); c.fill();
        c.fillStyle = '#1d7a9c';
        U.roundRect(c, px2, py2, pw, ph, 4); c.fill();
        var prog = U.clamp(d.s / finishS(), 0, 1);
        c.fillStyle = '#ffd257';
        c.beginPath(); c.arc(px2 + pw / 2, py2 + ph - prog * ph, 6, 0, TAU); c.fill();

        // Low-clock warning.
        if (d.timeLeft < 12 && !d.done && d.go <= 0 && Math.sin(g.t * 8) > 0) {
          c.fillStyle = '#fb7185';
          c.font = '800 20px Outfit, sans-serif';
          c.fillText('HURRY!', W / 2, 96);
        }

        if (d.go > 0) {
          c.fillStyle = 'rgba(5,18,26,.5)'; c.fillRect(0, 0, W, H);
          c.fillStyle = '#fff';
          c.font = '800 84px Outfit, sans-serif';
          var n = Math.ceil(d.go - .4);
          c.fillText(n > 0 ? n : 'GO!', W / 2, H / 2 + 20);
        }
      }
    });
  }

  window.Milo.register({
    id: 'boat-race', title: 'Boat Race', emo: '🚤', category: 'Racing',
    tagline: 'Buoy gates against the clock',
    description: 'Race a speedboat down a winding river and thread all 26 red-and-green ' +
      'buoy gates before an 80-second clock runs out. The hull slides on its wake, so ' +
      'start turning before the gate, not at it — every miss costs 4 seconds and the ' +
      'river narrows as the gates drift further off the racing line. Scraping a bank ' +
      'kills nearly all your speed, which is usually worse than a miss.',
    controls: ['← → steer', '↓ ease off'],
    colors: ['#0d6486', '#22c55e'],
    tags: ['boat', 'slalom', 'time trial', 'water', 'racing'],
    mount: mount
  });
})();
