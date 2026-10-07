/* Parking Draw — draw every car a route, then watch them all drive it at once. */
(function () {
  'use strict';
  var W = 640, H = 700;
  var FX = 20, FY = 96, FW = 600, FH = 528;           // playfield rect
  var CARL = 36, CARW = 22, SPEED = 132, HITR = 27;
  var CARCOL = ['#ef4444', '#38bdf8', '#facc15', '#4ade80', '#f472b6', '#c084fc'];

  /* Levels are authored in playfield coordinates.
     cars/spots: [x, y, headingDeg, colourIndex]   walls: [x, y, w, h] */
  var LEVELS = [
    { cars: [[110, 560, -90, 0]], spots: [[530, 170, -90, 0]], walls: [] },
    { cars: [[110, 560, -90, 0], [530, 560, -90, 1]],
      spots: [[110, 170, -90, 0], [530, 170, -90, 1]],
      walls: [[290, 290, 60, 160]] },
    { cars: [[110, 560, -90, 0], [530, 560, -90, 1]],
      spots: [[530, 170, -90, 0], [110, 170, -90, 1]],
      walls: [[280, 300, 80, 130]] },
    { cars: [[120, 560, -90, 0], [320, 560, -90, 1], [520, 560, -90, 2]],
      spots: [[120, 160, -90, 2], [320, 160, -90, 0], [520, 160, -90, 1]],
      walls: [[20, 330, 220, 36], [400, 330, 220, 36]] },
    { cars: [[80, 190, 0, 0], [80, 360, 0, 1], [80, 530, 0, 2]],
      spots: [[560, 190, 0, 1], [560, 360, 0, 2], [560, 530, 0, 0]],
      walls: [[300, 110, 40, 150], [300, 440, 40, 170]] },
    { cars: [[110, 560, -90, 0], [530, 560, -90, 1], [320, 560, -90, 2]],
      spots: [[320, 160, -90, 2], [110, 350, 180, 1], [530, 350, 0, 0]],
      walls: [[230, 250, 180, 40], [230, 420, 180, 40]] },
    { cars: [[90, 150, 90, 0], [550, 150, 90, 1], [90, 580, -90, 2], [550, 580, -90, 3]],
      spots: [[550, 580, -90, 0], [90, 580, -90, 1], [550, 150, 90, 2], [90, 150, 90, 3]],
      walls: [[260, 280, 120, 160]] },
    { cars: [[120, 570, -90, 0], [250, 570, -90, 1], [390, 570, -90, 2], [520, 570, -90, 3]],
      spots: [[120, 150, -90, 3], [250, 150, -90, 2], [390, 150, -90, 1], [520, 150, -90, 0]],
      walls: [[180, 320, 36, 120], [320, 320, 36, 120], [460, 320, 36, 120]] },
    { cars: [[320, 570, -90, 0], [90, 360, 0, 1], [550, 360, 180, 2]],
      spots: [[320, 150, -90, 0], [550, 190, 0, 1], [90, 190, 180, 2]],
      walls: [[20, 280, 210, 40], [410, 280, 210, 40], [290, 400, 60, 180]] },
    { cars: [[110, 180, 90, 0], [530, 180, 90, 1], [320, 180, 90, 2]],
      spots: [[110, 570, -90, 1], [530, 570, -90, 2], [320, 570, -90, 0]],
      walls: [[20, 300, 160, 36], [240, 300, 160, 36], [460, 300, 160, 36],
              [130, 430, 160, 36], [350, 430, 160, 36]] },
    { cars: [[90, 570, -90, 0], [230, 570, -90, 1], [410, 570, -90, 2], [550, 570, -90, 3]],
      spots: [[90, 150, -90, 2], [230, 150, -90, 3], [410, 150, -90, 0], [550, 150, -90, 1]],
      walls: [[150, 250, 340, 36], [150, 440, 340, 36]] },
    { cars: [[320, 360, 0, 0], [90, 150, 90, 1], [550, 150, 90, 2], [90, 570, -90, 3], [550, 570, -90, 4]],
      spots: [[320, 150, -90, 0], [550, 570, -90, 1], [90, 570, -90, 2], [550, 150, 90, 3], [90, 150, 90, 4]],
      walls: [[200, 260, 240, 30], [200, 430, 240, 30]] },
    { cars: [[110, 180, 90, 0], [530, 180, 90, 1], [110, 570, -90, 2], [530, 570, -90, 3]],
      spots: [[320, 180, 90, 0], [320, 300, 90, 1], [320, 430, 90, 2], [320, 560, 90, 3]],
      walls: [[210, 240, 30, 250], [400, 240, 30, 250]] },
    { cars: [[90, 360, 0, 0], [550, 360, 180, 1], [320, 570, -90, 2], [320, 150, 90, 3]],
      spots: [[550, 360, 180, 0], [90, 360, 0, 1], [320, 150, 90, 2], [320, 570, -90, 3]],
      walls: [[250, 290, 140, 140], [20, 110, 30, 110], [590, 110, 30, 110],
              [20, 500, 30, 110], [590, 500, 30, 110]] },
    { cars: [[90, 160, 90, 0], [230, 160, 90, 1], [410, 160, 90, 2], [550, 160, 90, 3], [320, 580, -90, 4]],
      spots: [[90, 580, -90, 3], [230, 580, -90, 2], [410, 580, -90, 1], [550, 580, -90, 0], [320, 160, 90, 4]],
      walls: [[150, 260, 60, 200], [430, 260, 60, 200], [270, 330, 100, 30], [270, 420, 100, 30]] },
    { cars: [[90, 150, 90, 0], [550, 150, 90, 1], [90, 580, -90, 2], [550, 580, -90, 3],
             [320, 150, 90, 4], [320, 580, -90, 5]],
      spots: [[550, 580, -90, 0], [90, 580, -90, 1], [550, 150, 90, 2], [90, 150, 90, 3],
              [320, 580, -90, 4], [320, 150, 90, 5]],
      walls: [[180, 280, 100, 34], [360, 280, 100, 34], [180, 410, 100, 34], [360, 410, 100, 34],
              [305, 320, 30, 84]] }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.level = 0;
      d.lives = 3;
      d.parts = [];
      d.shake = 0;
      d.banner = null;
      g.score = 0;
      g.set('Score', 0);
      loadLevel(g);
    }

    function loadLevel(g) {
      var d = g.data, L = LEVELS[d.level % LEVELS.length];
      d.walls = L.walls.map(function (w) { return { x: w[0], y: w[1], w: w[2], h: w[3] }; });
      d.spots = L.spots.map(function (s) { return { x: s[0], y: s[1], a: s[2] * Math.PI / 180, c: s[3] }; });
      d.cars = L.cars.map(function (cc) {
        return {
          sx: cc[0], sy: cc[1], sa: cc[2] * Math.PI / 180, c: cc[3],
          x: cc[0], y: cc[1], a: cc[2] * Math.PI / 180,
          path: null, len: 0, prog: 0, done: false, smoke: 0
        };
      });
      d.phase = 'draw';
      d.drawing = null;
      d.timer = 0;
      d.pauseT = 0;
      g.set('Level', (d.level % LEVELS.length) + 1);
      g.set('Lives', d.lives);
    }

    function inWall(d, x, y, pad) {
      pad = pad == null ? 13 : pad;
      for (var i = 0; i < d.walls.length; i++) {
        var w = d.walls[i];
        if (x > w.x - pad && x < w.x + w.w + pad && y > w.y - pad && y < w.y + w.h + pad) return true;
      }
      return false;
    }

    function inField(x, y) {
      return x > FX + 10 && x < FX + FW - 10 && y > FY + 10 && y < FY + FH - 10;
    }

    function spotFor(d, c) {
      for (var i = 0; i < d.spots.length; i++) if (d.spots[i].c === c) return d.spots[i];
      return null;
    }

    function measure(pts) {
      var L = 0;
      for (var i = 1; i < pts.length; i++) L += U.dist(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
      return L;
    }

    function along(pts, dist) {
      var acc = 0;
      for (var i = 1; i < pts.length; i++) {
        var seg = U.dist(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
        if (acc + seg >= dist || i === pts.length - 1) {
          var t = seg > 0 ? U.clamp((dist - acc) / seg, 0, 1) : 1;
          return {
            x: U.lerp(pts[i - 1].x, pts[i].x, t),
            y: U.lerp(pts[i - 1].y, pts[i].y, t),
            a: Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x)
          };
        }
        acc += seg;
      }
      var last = pts[pts.length - 1];
      return { x: last.x, y: last.y, a: 0 };
    }

    function startDrive(g) {
      var d = g.data;
      if (d.phase !== 'draw') return;
      for (var i = 0; i < d.cars.length; i++) if (!d.cars[i].path) return;
      d.phase = 'drive';
      d.drawing = null;
      d.timer = 0;
      Milo.sound.tone({ f: 420, f2: 680, d: .16, v: .07, type: 'square' });
    }

    function crash(g, x, y) {
      var d = g.data;
      d.phase = 'crash';
      d.pauseT = 1.3;
      d.shake = 14;
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      Milo.sound.explode();
      for (var i = 0; i < 26; i++) {
        var a = Math.random() * 6.283, s = U.rand(60, 280);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .7, max: .7,
          col: U.choice(['#fca5a5', '#fbbf24', '#f8fafc']) });
      }
    }

    function clearLevel(g) {
      var d = g.data;
      var bonus = 150 + Math.max(0, Math.round((26 - d.timer) * 8)) + d.cars.length * 25;
      g.score += bonus;
      g.set('Score', U.fmt(g.score));
      d.banner = { text: 'All parked  +' + bonus, t: 1.5 };
      d.phase = 'clear';
      d.pauseT = 1.4;
      Milo.sound.win();
      d.spots.forEach(function (s) {
        for (var i = 0; i < 10; i++) {
          var a = Math.random() * 6.283;
          d.parts.push({ x: s.x, y: s.y, vx: Math.cos(a) * U.rand(30, 150), vy: Math.sin(a) * U.rand(30, 150),
            life: .8, max: .8, col: CARCOL[s.c] });
        }
      });
    }

    function goHit(x, y) {
      return x > W / 2 - 84 && x < W / 2 + 84 && y > 638 && y < 682;
    }

    return Milo.arcade(host, {
      id: 'parking-draw',
      w: W, h: H, bg: '#171a21',
      stats: ['Score', 'Level', 'Lives'],
      emo: '🅿️',
      start: {
        title: 'Parking Draw',
        text: 'Drag from each car to its own colour of bay to draw the route it will take. ' +
          'Hit GO and every car drives its line at once — routes that cross at the wrong ' +
          'moment end in a bent bumper. Loop the long way round to buy yourself a gap.',
        keys: ['Drag from a car', 'Space = GO']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (d.phase !== 'draw') return;
        if (type === 'down') {
          if (goHit(x, y)) { startDrive(g); return; }
          var best = -1, bd = 34;
          for (var i = 0; i < d.cars.length; i++) {
            var dd = U.dist(x, y, d.cars[i].sx, d.cars[i].sy);
            if (dd < bd) { bd = dd; best = i; }
          }
          if (best >= 0) {
            d.cars[best].path = null;
            d.drawing = { i: best, pts: [{ x: d.cars[best].sx, y: d.cars[best].sy }], bad: false };
            Milo.sound.tone({ f: 300, f2: 420, d: .05, v: .045, type: 'triangle' });
          }
        } else if (type === 'move' && d.drawing) {
          var pts = d.drawing.pts, last = pts[pts.length - 1];
          if (U.dist(x, y, last.x, last.y) < 7) return;
          if (!inField(x, y)) { d.drawing.bad = true; return; }
          if (inWall(d, x, y)) d.drawing.bad = true;
          if (pts.length < 420) pts.push({ x: x, y: y });
        } else if (type === 'up' && d.drawing) {
          var dr = d.drawing, car = d.cars[dr.i], sp = spotFor(d, car.c);
          var end = dr.pts[dr.pts.length - 1];
          var ok = !dr.bad && sp && U.dist(end.x, end.y, sp.x, sp.y) < 42 && dr.pts.length > 2;
          if (ok) {
            dr.pts.push({ x: sp.x, y: sp.y });
            car.path = dr.pts;
            car.len = measure(dr.pts);
            car.prog = 0;
            Milo.sound.blip();
          } else {
            Milo.sound.tone({ f: 190, f2: 110, d: .12, v: .06, type: 'sawtooth' });
          }
          d.drawing = null;
        }
      },

      onKey: function (g, e) { if (e.code === 'Space') startDrive(g); },

      update: function (g, dt) {
        var d = g.data;
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 34);
        if (d.banner) { d.banner.t -= dt; if (d.banner.t <= 0) d.banner = null; }
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(.2, dt); p.vy += 120 * dt; p.life -= dt;
          return p.life > 0;
        });

        if (d.phase === 'crash') {
          d.pauseT -= dt;
          if (d.pauseT <= 0) {
            if (d.lives <= 0) {
              g.gameOver({ emo: '💥', title: 'Bent bumpers',
                text: 'You cleared ' + d.level + ' car park' + (d.level === 1 ? '' : 's') + '.' });
            } else loadLevel(g);
          }
          return;
        }
        if (d.phase === 'clear') {
          d.pauseT -= dt;
          if (d.pauseT <= 0) {
            d.level++;
            if (d.level >= LEVELS.length) {
              g.win({ score: g.score, emo: '🅿️', title: 'Every bay filled',
                text: 'All ' + LEVELS.length + ' car parks cleared without a scratch to spare.' });
            } else loadLevel(g);
          }
          return;
        }
        if (d.phase !== 'drive') return;

        d.timer += dt;
        var i, j, moving = false;
        for (i = 0; i < d.cars.length; i++) {
          var car = d.cars[i];
          if (car.done) continue;
          moving = true;
          car.prog += SPEED * dt;
          if (car.prog >= car.len) {
            car.prog = car.len;
            car.done = true;
            var sp = spotFor(d, car.c);
            car.x = sp.x; car.y = sp.y; car.a = sp.a;
            g.score += 40;
            g.set('Score', U.fmt(g.score));
            Milo.sound.coin();
            for (var k = 0; k < 8; k++) {
              d.parts.push({ x: car.x, y: car.y, vx: U.rand(-70, 70), vy: U.rand(-70, 70),
                life: .5, max: .5, col: CARCOL[car.c] });
            }
            continue;
          }
          var p = along(car.path, car.prog);
          car.x = p.x; car.y = p.y; car.a = p.a;
          car.smoke -= dt;
          if (car.smoke <= 0) {
            car.smoke = .06;
            d.parts.push({ x: car.x - Math.cos(car.a) * 18, y: car.y - Math.sin(car.a) * 18,
              vx: U.rand(-14, 14), vy: U.rand(-14, 14), life: .45, max: .45, col: 'rgba(200,210,230,.5)' });
          }
        }

        for (i = 0; i < d.cars.length; i++) {
          for (j = i + 1; j < d.cars.length; j++) {
            var a = d.cars[i], b = d.cars[j];
            if (a.done && b.done) continue;
            if (U.dist(a.x, a.y, b.x, b.y) < HITR) {
              crash(g, (a.x + b.x) / 2, (a.y + b.y) / 2);
              return;
            }
          }
        }
        for (i = 0; i < d.cars.length; i++) {
          if (!d.cars[i].done && inWall(d, d.cars[i].x, d.cars[i].y, 9)) {
            crash(g, d.cars[i].x, d.cars[i].y);
            return;
          }
        }

        if (!moving) clearLevel(g);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#12151b'; c.fillRect(0, 0, W, H);
        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // tarmac
        var grd = c.createLinearGradient(0, FY, 0, FY + FH);
        grd.addColorStop(0, '#31353f'); grd.addColorStop(1, '#23262e');
        c.fillStyle = grd;
        U.roundRect(c, FX, FY, FW, FH, 14); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 2;
        for (var gx = FX + 40; gx < FX + FW; gx += 40) {
          c.beginPath(); c.moveTo(gx, FY + 6); c.lineTo(gx, FY + FH - 6); c.stroke();
        }

        // bays
        d.spots.forEach(function (s) {
          c.save();
          c.translate(s.x, s.y); c.rotate(s.a);
          c.strokeStyle = CARCOL[s.c]; c.lineWidth = 3;
          c.setLineDash([9, 6]);
          U.roundRect(c, -CARL / 2 - 7, -CARW / 2 - 6, CARL + 14, CARW + 12, 6);
          c.stroke();
          c.setLineDash([]);
          c.globalAlpha = .16; c.fillStyle = CARCOL[s.c];
          U.roundRect(c, -CARL / 2 - 7, -CARW / 2 - 6, CARL + 14, CARW + 12, 6); c.fill();
          c.globalAlpha = 1;
          c.restore();
          c.fillStyle = CARCOL[s.c];
          c.font = '800 12px Outfit, system-ui, sans-serif';
          c.textAlign = 'center';
          c.fillText('P', s.x, s.y + 4);
        });

        // walls
        d.walls.forEach(function (w) {
          c.fillStyle = '#4b5160';
          U.roundRect(c, w.x, w.y, w.w, w.h, 5); c.fill();
          c.fillStyle = 'rgba(0,0,0,.28)';
          U.roundRect(c, w.x + 3, w.y + w.h - 6, w.w - 6, 5, 3); c.fill();
          c.save();
          c.beginPath(); U.roundRect(c, w.x, w.y, w.w, w.h, 5); c.clip();
          c.strokeStyle = 'rgba(250,204,21,.28)'; c.lineWidth = 7;
          for (var s = -w.h; s < w.w; s += 18) {
            c.beginPath(); c.moveTo(w.x + s, w.y + w.h); c.lineTo(w.x + s + w.h, w.y); c.stroke();
          }
          c.restore();
        });

        // committed routes
        d.cars.forEach(function (car) {
          if (!car.path) return;
          c.strokeStyle = CARCOL[car.c]; c.lineWidth = 4; c.globalAlpha = .55;
          c.setLineDash([10, 7]); c.lineCap = 'round';
          c.beginPath();
          c.moveTo(car.path[0].x, car.path[0].y);
          for (var i = 1; i < car.path.length; i++) c.lineTo(car.path[i].x, car.path[i].y);
          c.stroke();
          c.setLineDash([]); c.globalAlpha = 1;
        });

        // the route being drawn
        if (d.drawing) {
          var dr = d.drawing;
          c.strokeStyle = dr.bad ? '#ef4444' : CARCOL[d.cars[dr.i].c];
          c.lineWidth = 5; c.lineCap = 'round';
          c.beginPath();
          c.moveTo(dr.pts[0].x, dr.pts[0].y);
          for (var k = 1; k < dr.pts.length; k++) c.lineTo(dr.pts[k].x, dr.pts[k].y);
          c.stroke();
        }

        // cars
        d.cars.forEach(function (car) {
          var x = d.phase === 'draw' ? car.sx : car.x;
          var y = d.phase === 'draw' ? car.sy : car.y;
          var a = d.phase === 'draw' ? car.sa : car.a;
          c.save();
          c.translate(x, y); c.rotate(a);
          c.fillStyle = 'rgba(0,0,0,.35)';
          U.roundRect(c, -CARL / 2 + 2, -CARW / 2 + 4, CARL, CARW, 6); c.fill();
          c.fillStyle = CARCOL[car.c];
          U.roundRect(c, -CARL / 2, -CARW / 2, CARL, CARW, 6); c.fill();
          c.fillStyle = 'rgba(12,18,30,.75)';
          U.roundRect(c, -2, -CARW / 2 + 3, 13, CARW - 6, 3); c.fill();
          c.fillStyle = 'rgba(255,255,255,.28)';
          U.roundRect(c, -CARL / 2 + 5, -CARW / 2 + 3, 9, CARW - 6, 3); c.fill();
          c.fillStyle = '#fff7d6';
          c.fillRect(CARL / 2 - 3, -CARW / 2 + 3, 3, 4);
          c.fillRect(CARL / 2 - 3, CARW / 2 - 7, 3, 4);
          c.restore();
        });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
        });
        c.globalAlpha = 1;
        c.restore();

        // header + footer UI
        c.textAlign = 'center';
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.font = '700 13px Outfit, system-ui, sans-serif';
        var routed = d.cars.filter(function (cc) { return !!cc.path; }).length;
        var msg = d.phase === 'draw'
          ? 'Routes drawn ' + routed + ' / ' + d.cars.length + '  —  drag from a car to its bay'
          : d.phase === 'drive' ? 'Driving…'
          : d.phase === 'clear' ? 'Level clear' : 'Crash!';
        c.fillText(msg, W / 2, FY - 16);

        if (d.phase === 'draw') {
          var ready = routed === d.cars.length;
          c.fillStyle = ready ? '#22c55e' : 'rgba(255,255,255,.12)';
          U.roundRect(c, W / 2 - 84, 638, 168, 44, 12); c.fill();
          c.fillStyle = ready ? '#052e13' : 'rgba(255,255,255,.35)';
          c.font = '800 20px Outfit, system-ui, sans-serif';
          c.fillText(ready ? 'GO' : 'DRAW ROUTES', W / 2, 667);
        }

        if (d.banner) {
          c.globalAlpha = Math.min(1, d.banner.t);
          c.fillStyle = '#4ade80';
          c.font = '800 30px Outfit, system-ui, sans-serif';
          c.fillText(d.banner.text, W / 2, FY + FH / 2);
          c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'parking-draw', title: 'Parking Draw', emo: '🅿️', category: 'Casual',
    tagline: 'Draw the routes, then hope they miss each other',
    description: 'Every car needs a hand-drawn line from where it sits to the bay painted in ' +
      'its own colour, and a line that clips a concrete block is rejected on the spot. Press GO ' +
      'and all of them set off together at the same speed, so the only way to keep two cars out ' +
      'of the same square metre is to send one the long way round. Sixteen car parks, three ' +
      'bumpers, and a bonus for every second you did not waste.',
    controls: ['Drag', 'Space', 'Tap'],
    colors: ['#23262e', '#38bdf8'],
    tags: ['drawing', 'routes', 'cars', 'levels', 'puzzle'],
    mount: mount
  });
})();
