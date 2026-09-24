/* Traffic Control — tap a car to hold it, tap again to wave it through. */
(function () {
  'use strict';
  var W = 640, H = 640;
  var IL = 268, IR = 372, IT = 268, IB = 372;      // the intersection box
  var CARL = 30, CARW = 18;

  var LANES = [
    { sx: -50, sy: 346, dx: 1, dy: 0, len: W + 100, name: 'E' },
    { sx: W + 50, sy: 294, dx: -1, dy: 0, len: W + 100, name: 'W' },
    { sx: 294, sy: -50, dx: 0, dy: 1, len: H + 100, name: 'S' },
    { sx: 346, sy: H + 50, dx: 0, dy: -1, len: H + 100, name: 'N' }
  ];
  var CARCOL = ['#ef4444', '#38bdf8', '#facc15', '#4ade80', '#f472b6', '#c084fc', '#fb923c', '#e2e8f0'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.cars = [];
      d.parts = [];
      d.floats = [];
      d.skid = [];
      d.shake = 0;
      d.spawnT = 0.8;
      d.through = 0;
      d.nears = 0;
      d.rush = 0;
      d.rushT = 26;
      d.nextId = 1;
      d.dead = false;
      d.windows = [];
      for (var i = 0; i < 60; i++) d.windows.push(Math.random() < .55);
      g.score = 0;
      g.set('Score', 0);
      g.set('Cars', 0);
      g.set('Rush', '—');
    }

    function pos(car) {
      var L = LANES[car.lane];
      return { x: L.sx + L.dx * car.p, y: L.sy + L.dy * car.p };
    }

    function spawn(d) {
      var order = U.shuffle([0, 1, 2, 3]);
      for (var k = 0; k < order.length; k++) {
        var li = order[k], clear = true;
        for (var i = 0; i < d.cars.length; i++) {
          if (d.cars[i].lane === li && d.cars[i].p < 92) { clear = false; break; }
        }
        if (!clear) continue;
        d.cars.push({
          lane: li, p: 0, v: 96, hold: false, wait: 0, id: d.nextId++,
          col: U.choice(CARCOL), near: false, inBox: false, minGap: 999
        });
        return;
      }
    }

    function inBox(p) { return p.x > IL - 12 && p.x < IR + 12 && p.y > IT - 12 && p.y < IB + 12; }

    function crash(g, x, y) {
      var d = g.data;
      if (d.dead) return;
      d.dead = true;
      d.shake = 20;
      Milo.sound.explode();
      for (var i = 0; i < 40; i++) {
        var a = Math.random() * 6.283, s = U.rand(60, 340);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, max: 1,
          col: U.choice(['#fbbf24', '#f87171', '#f8fafc', '#94a3b8']) });
      }
      g.gameOver({
        emo: '🚦', title: 'Crunch',
        text: d.through + ' cars through the junction and ' + d.nears + ' near misses before that.'
      });
    }

    function float(d, x, y, text, col) {
      d.floats.push({ x: x, y: y, t: 1.1, text: text, col: col });
    }

    function toggleAt(g, x, y) {
      var d = g.data;
      if (d.dead) return;
      var best = null, bd = 30;
      for (var i = 0; i < d.cars.length; i++) {
        var p = pos(d.cars[i]);
        var dd = U.dist(x, y, p.x, p.y);
        if (dd < bd) { bd = dd; best = d.cars[i]; }
      }
      if (!best) return;
      best.hold = !best.hold;
      if (!best.hold) best.wait = 0;
      Milo.sound.tone({ f: best.hold ? 300 : 620, f2: best.hold ? 200 : 820, d: .07, v: .06,
        type: best.hold ? 'sawtooth' : 'square' });
    }

    function toggleLead(g, lane) {
      var d = g.data, best = null;
      for (var i = 0; i < d.cars.length; i++) {
        var c = d.cars[i];
        if (c.lane !== lane) continue;
        if (!best || c.p > best.p) best = c;
      }
      if (!best) return;
      best.hold = !best.hold;
      if (!best.hold) best.wait = 0;
      Milo.sound.tone({ f: best.hold ? 300 : 620, d: .07, v: .06, type: 'square' });
    }

    return Milo.arcade(host, {
      id: 'traffic-control',
      w: W, h: H, bg: '#0d1018',
      stats: ['Score', 'Cars', 'Rush'],
      emo: '🚦',
      start: {
        title: 'Traffic Control',
        text: 'Four roads, no lights, and one junction. Tap a car to hold it and tap again to ' +
          'let it go — the cars behind it queue up automatically. Threading two cars past each ' +
          'other with barely a gap pays a near-miss bonus, but a driver you leave sitting for ' +
          'eleven seconds gives up and gridlocks the lot.',
        keys: ['Click / tap a car', '1 2 3 4 hold each approach']
      },
      init: reset,
      onPointer: function (g, type, x, y) { if (type === 'down') toggleAt(g, x, y); },
      onKey: function (g, e) {
        var m = /^Digit([1-4])$/.exec(e.code);
        if (m) toggleLead(g, parseInt(m[1], 10) - 1);
      },

      update: function (g, dt) {
        var d = g.data, i, j;
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 30);
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(.25, dt); p.vy *= Math.pow(.25, dt);
          p.life -= dt;
          return p.life > 0;
        });
        d.floats = d.floats.filter(function (f) { f.y -= 26 * dt; f.t -= dt; return f.t > 0; });
        d.skid = d.skid.filter(function (s) { s.t -= dt * .3; return s.t > 0; });
        if (d.dead) return;

        // rush hour waves
        d.rushT -= dt;
        if (d.rush > 0) {
          d.rush -= dt;
          if (d.rush <= 0) { d.rushT = U.rand(22, 30); g.set('Rush', '—'); }
          else g.set('Rush', d.rush.toFixed(1) + 's');
        } else if (d.rushT <= 0) {
          d.rush = 7 + Math.min(6, d.through / 22);
          float(d, W / 2, 200, 'RUSH HOUR', '#fb923c');
          Milo.sound.tone({ f: 200, f2: 520, d: .3, v: .08, type: 'sawtooth' });
        }

        // spawning
        d.spawnT -= dt;
        if (d.spawnT <= 0) {
          var base = Math.max(0.62, 1.85 - d.through * 0.014);
          d.spawnT = d.rush > 0 ? base * 0.45 : base;
          spawn(d);
        }

        // drive
        for (i = d.cars.length - 1; i >= 0; i--) {
          var c = d.cars[i], L = LANES[c.lane], p = pos(c);
          var want = 96 + Math.min(40, d.through * 0.25);

          if (c.hold) {
            want = 0;
            c.wait += dt;
            if (c.wait > 11) {
              d.dead = true;
              Milo.sound.lose();
              g.gameOver({
                emo: '🚥', title: 'Gridlock',
                text: 'A driver gave up waiting after ' + d.through + ' cars had got through.'
              });
              return;
            }
          } else c.wait = Math.max(0, c.wait - dt * 2);

          // keep a gap behind the car in front
          for (j = 0; j < d.cars.length; j++) {
            var o = d.cars[j];
            if (o === c || o.lane !== c.lane) continue;
            var gap = o.p - c.p;
            if (gap > 0 && gap < 52) want = Math.min(want, Math.max(0, (gap - 34) * 6));
          }

          c.v += (want - c.v) * Math.min(1, (want < c.v ? 7 : 3.2) * dt);
          c.p += c.v * dt;

          var np = pos(c);
          var nowIn = inBox(np);
          if (nowIn && !c.inBox) { c.inBox = true; c.minGap = 999; }
          if (!nowIn && c.inBox) {
            c.inBox = false;
            if (c.minGap < 56) {
              d.nears++;
              g.score += 45;
              float(d, np.x, np.y, 'NEAR MISS +45', '#facc15');
              Milo.sound.tone({ f: 700, f2: 1100, d: .1, v: .06, type: 'square' });
            }
          }

          if (c.p > L.len) {
            d.cars.splice(i, 1);
            d.through++;
            g.score += 12;
            g.set('Cars', d.through);
            g.set('Score', U.fmt(g.score));
            Milo.sound.tone({ f: 520, d: .04, v: .035, type: 'triangle' });
          }
        }
        g.set('Score', U.fmt(g.score));

        // collisions between crossing traffic
        for (i = 0; i < d.cars.length; i++) {
          var a = d.cars[i], pa = pos(a);
          for (j = i + 1; j < d.cars.length; j++) {
            var b2 = d.cars[j];
            // only crossing traffic can meet: same-axis lanes never share a line
            if ((a.lane < 2) === (b2.lane < 2)) continue;
            var pb = pos(b2), dd = U.dist(pa.x, pa.y, pb.x, pb.y);
            if (a.inBox || b2.inBox) {
              if (dd < a.minGap) a.minGap = dd;
              if (dd < b2.minGap) b2.minGap = dd;
            }
            if (dd < 25) {
              d.skid.push({ x: pa.x, y: pa.y, t: 1 });
              crash(g, (pa.x + pb.x) / 2, (pa.y + pb.y) / 2);
              return;
            }
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#0b0e16'; c.fillRect(0, 0, W, H);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // corner blocks
        var blocks = [[0, 0, IL, IT], [IR, 0, W - IR, IT], [0, IB, IL, H - IB], [IR, IB, W - IR, H - IB]];
        blocks.forEach(function (b, bi) {
          c.fillStyle = '#161b28';
          U.roundRect(c, b[0] + 12, b[1] + 12, b[2] - 24, b[3] - 24, 10); c.fill();
          c.fillStyle = '#1e2536';
          U.roundRect(c, b[0] + 12, b[1] + 12, b[2] - 24, 18, 8); c.fill();
          for (var wy = 0; wy < 5; wy++) {
            for (var wx = 0; wx < 3; wx++) {
              var idx = (bi * 15 + wy * 3 + wx) % d.windows.length;
              c.fillStyle = d.windows[idx] ? 'rgba(250,204,21,.45)' : 'rgba(120,150,200,.12)';
              c.fillRect(b[0] + 34 + wx * 44, b[1] + 48 + wy * 38, 22, 20);
            }
          }
        });

        // roads
        c.fillStyle = '#20242e';
        c.fillRect(0, IT - 4, W, IB - IT + 8);
        c.fillRect(IL - 4, 0, IR - IL + 8, H);
        c.fillStyle = '#272c38';
        c.fillRect(IL - 4, IT - 4, IR - IL + 8, IB - IT + 8);

        // lane markings
        c.strokeStyle = 'rgba(250,250,250,.32)'; c.lineWidth = 2;
        c.setLineDash([16, 14]);
        c.beginPath(); c.moveTo(0, 320); c.lineTo(IL - 6, 320);
        c.moveTo(IR + 6, 320); c.lineTo(W, 320);
        c.moveTo(320, 0); c.lineTo(320, IT - 6);
        c.moveTo(320, IB + 6); c.lineTo(320, H);
        c.stroke();
        c.setLineDash([]);

        // crosswalks
        c.fillStyle = 'rgba(255,255,255,.22)';
        for (var s = 0; s < 6; s++) {
          c.fillRect(IL - 22, IT + 4 + s * 17, 14, 11);
          c.fillRect(IR + 8, IT + 4 + s * 17, 14, 11);
          c.fillRect(IL + 4 + s * 17, IT - 22, 11, 14);
          c.fillRect(IL + 4 + s * 17, IB + 8, 11, 14);
        }

        d.skid.forEach(function (sk) {
          c.globalAlpha = sk.t * .5;
          c.fillStyle = '#000';
          c.fillRect(sk.x - 16, sk.y - 4, 32, 8);
          c.globalAlpha = 1;
        });

        // cars
        d.cars.forEach(function (car) {
          var L = LANES[car.lane], p = pos(car);
          var ang = Math.atan2(L.dy, L.dx);
          c.save();
          c.translate(p.x, p.y);
          c.rotate(ang);
          // headlight cone
          if (!car.hold) {
            var hl = c.createLinearGradient(CARL / 2, 0, CARL / 2 + 60, 0);
            hl.addColorStop(0, 'rgba(255,245,200,.22)'); hl.addColorStop(1, 'rgba(255,245,200,0)');
            c.fillStyle = hl;
            c.beginPath();
            c.moveTo(CARL / 2, -CARW / 2 + 2); c.lineTo(CARL / 2 + 62, -22);
            c.lineTo(CARL / 2 + 62, 22); c.lineTo(CARL / 2, CARW / 2 - 2);
            c.closePath(); c.fill();
          }
          c.fillStyle = 'rgba(0,0,0,.45)';
          U.roundRect(c, -CARL / 2 + 2, -CARW / 2 + 3, CARL, CARW, 5); c.fill();
          c.fillStyle = car.col;
          U.roundRect(c, -CARL / 2, -CARW / 2, CARL, CARW, 5); c.fill();
          c.fillStyle = 'rgba(15,22,36,.8)';
          U.roundRect(c, -3, -CARW / 2 + 3, 11, CARW - 6, 3); c.fill();
          c.fillStyle = 'rgba(255,255,255,.3)';
          U.roundRect(c, -CARL / 2 + 4, -CARW / 2 + 3, 7, CARW - 6, 3); c.fill();
          c.fillStyle = car.hold ? '#ff3b3b' : '#7f1d1d';
          c.fillRect(-CARL / 2, -CARW / 2 + 2, 3, 4);
          c.fillRect(-CARL / 2, CARW / 2 - 6, 3, 4);
          c.fillStyle = '#fff7d6';
          c.fillRect(CARL / 2 - 3, -CARW / 2 + 2, 3, 4);
          c.fillRect(CARL / 2 - 3, CARW / 2 - 6, 3, 4);
          c.restore();

          if (car.hold) {
            var frac = Math.min(1, car.wait / 11);
            c.strokeStyle = frac > .7 ? '#ef4444' : frac > .4 ? '#f59e0b' : 'rgba(255,255,255,.55)';
            c.lineWidth = 3;
            c.beginPath();
            c.arc(p.x, p.y, 23, -Math.PI / 2, -Math.PI / 2 + frac * 6.283);
            c.stroke();
            if (frac > .75 && Math.floor(g.t * 6) % 2 === 0) {
              c.fillStyle = '#ef4444';
              c.font = '800 13px Outfit, system-ui, sans-serif';
              c.textAlign = 'center';
              c.fillText('!', p.x, p.y - 26);
            }
          }
        });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 3, p.y - 3, 6, 6);
        });
        c.globalAlpha = 1;

        d.floats.forEach(function (f) {
          c.globalAlpha = Math.min(1, f.t);
          c.fillStyle = f.col;
          c.font = '800 17px Outfit, system-ui, sans-serif';
          c.textAlign = 'center';
          c.fillText(f.text, f.x, f.y);
          c.globalAlpha = 1;
        });
        c.restore();

        // approach labels
        c.textAlign = 'center';
        c.fillStyle = 'rgba(255,255,255,.3)';
        c.font = '700 12px Outfit, system-ui, sans-serif';
        c.fillText('1', 22, 352);
        c.fillText('2', W - 22, 300);
        c.fillText('3', 300, 22);
        c.fillText('4', 352, H - 14);

        if (d.rush > 0) {
          c.fillStyle = 'rgba(251,146,60,' + (0.25 + Math.sin(g.t * 8) * 0.12) + ')';
          c.fillRect(0, 0, W, 6);
          c.fillRect(0, H - 6, W, 6);
        }
      }
    });
  }

  window.Milo.register({
    id: 'traffic-control', title: 'Traffic Control', emo: '🚦', category: 'Casual',
    tagline: 'No lights, four roads, one junction',
    description: 'Cars pour into an unsignalled crossroads from all four directions and the only ' +
      'control you have is tapping one to stop it dead and tapping it again to send it on — ' +
      'everything behind it queues up on its own. Squeeze two cars past each other inside the box ' +
      'and you get a near-miss bonus worth nearly four ordinary cars. Rush-hour waves double the ' +
      'flow every half minute, and any driver you leave parked for eleven seconds gives up and ' +
      'ends the shift.',
    controls: ['Click', 'Tap', '1 2 3 4'],
    colors: ['#0d1018', '#facc15'],
    tags: ['traffic', 'timing', 'tap', 'endless', 'management'],
    mount: mount
  });
})();
