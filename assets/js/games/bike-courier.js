/* Bike Courier — deliveries across a living city grid, tips against the clock. */
(function () {
  'use strict';
  var W = 900, H = 600, TAU = Math.PI * 2;
  var BLOCK = 210, RW = 32, G = 7;          // block size, road half-width, grid
  var WORLD = BLOCK * G;
  var CYCLE = 9;                            // traffic light cycle, seconds
  var SHIFT = 80;                           // opening shift clock

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    /* ------------------------------------------------------------ city */

    function alleyOf(i, j) {
      if (i < 0 || j < 0 || i >= G || j >= G) return 0;
      var h = U.hash2(i, j, 41);
      if (h < 0.42) return 0;
      return h > 0.72 ? 1 : 2;              // 1 = vertical alley, 2 = horizontal
    }

    // 0 = building, 1 = road, 2 = alley
    function surfaceAt(x, y) {
      if (x < -RW || y < -RW || x > WORLD + RW || y > WORLD + RW) return 0;
      var nx = Math.round(x / BLOCK) * BLOCK, ny = Math.round(y / BLOCK) * BLOCK;
      if (Math.abs(x - nx) <= RW || Math.abs(y - ny) <= RW) return 1;
      var i = Math.floor(x / BLOCK), j = Math.floor(y / BLOCK);
      var a = alleyOf(i, j);
      if (a === 1 && Math.abs(x - (i + .5) * BLOCK) <= 13) return 2;
      if (a === 2 && Math.abs(y - (j + .5) * BLOCK) <= 13) return 2;
      return 0;
    }

    function lightNS(t, i, j) {
      var p = (t + (i * 2.3 + j * 3.7)) % CYCLE;
      if (p < CYCLE * .46) return 'green';
      if (p < CYCLE * .52) return 'amber';
      return 'red';
    }

    function randRoadPoint() {
      for (var k = 0; k < 200; k++) {
        var i = U.randInt(0, G), j = U.randInt(0, G);
        var x, y;
        if (Math.random() < .5) { x = i * BLOCK; y = U.rand(0, WORLD); }
        else { x = U.rand(0, WORLD); y = j * BLOCK; }
        if (surfaceAt(x, y) === 1) return { x: x, y: y };
      }
      return { x: BLOCK, y: BLOCK };
    }

    /* ----------------------------------------------------------- state */

    function spawnCar(d, nearX, nearY) {
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var k = 0; k < 40; k++) {
        var dir = U.choice(dirs);
        var x, y;
        if (dir[0]) {
          y = Math.round(U.rand(0, G)) * BLOCK + (dir[0] > 0 ? 15 : -15);
          x = nearX + (Math.random() < .5 ? -1 : 1) * U.rand(520, 760);
        } else {
          x = Math.round(U.rand(0, G)) * BLOCK + (dir[1] > 0 ? -15 : 15);
          y = nearY + (Math.random() < .5 ? -1 : 1) * U.rand(460, 700);
        }
        if (x < -40 || y < -40 || x > WORLD + 40 || y > WORLD + 40) continue;
        if (surfaceAt(x, y) !== 1) continue;
        return {
          x: x, y: y, dx: dir[0], dy: dir[1], v: U.rand(64, 108),
          col: U.choice(['#fbbf24', '#4ade80', '#60a5fa', '#f472b6', '#e2e8f0', '#fb7185'])
        };
      }
      return null;
    }

    function spawnPed(d, nearX, nearY) {
      var p = null;
      for (var k = 0; k < 24 && !p; k++) {
        var q = randRoadPoint();
        if (Math.hypot(q.x - nearX, q.y - nearY) < 660) p = q;
      }
      if (!p) return null;
      var vert = Math.random() < .5;
      return {
        x: p.x, y: p.y, dx: vert ? 0 : (Math.random() < .5 ? -1 : 1),
        dy: vert ? (Math.random() < .5 ? -1 : 1) : 0,
        v: U.rand(22, 40), t: U.rand(3, 9),
        col: U.choice(['#fde68a', '#a7f3d0', '#bfdbfe', '#fecaca'])
      };
    }

    function newJob(g, first) {
      var d = g.data;
      var from = randRoadPoint(), to;
      var tries = 0;
      do { to = randRoadPoint(); tries++; }
      while (Math.hypot(to.x - from.x, to.y - from.y) < 420 && tries < 60);
      if (first) { from.x = d.x; from.y = d.y; }
      d.job = {
        from: from, to: to, stage: first ? 'drop' : 'pick',
        fresh: 1, limit: 7 + Math.hypot(to.x - from.x, to.y - from.y) / 40,
        base: 18 + Math.round(Math.hypot(to.x - from.x, to.y - from.y) / 34)
      };
      d.job.t = d.job.limit;
      if (first) d.job.stage = 'drop';
      d.flash = 'New job: ' + (d.job.stage === 'pick' ? 'collect the parcel' : 'deliver it');
      d.flashT = 2.4;
    }

    function reset(g) {
      var d = g.data;
      d.x = BLOCK * 2; d.y = BLOCK * 2;
      d.a = 0; d.v = 0;
      d.down = 0;
      d.tips = 0;
      d.made = 0;
      d.clock = SHIFT;
      d.redRuns = 0;
      d.t = 0;
      d.cars = [];
      d.peds = [];
      d.parts = [];
      d.flash = '';
      d.flashT = 0;
      d.camX = d.x - W / 2; d.camY = d.y - H / 2;
      for (var i = 0; i < 26; i++) {
        var c = spawnCar(d, d.x + U.rand(-500, 500), d.y + U.rand(-500, 500));
        if (c) d.cars.push(c);
      }
      for (i = 0; i < 16; i++) {
        var p = spawnPed(d, d.x, d.y);
        if (p) d.peds.push(p);
      }
      newJob(g, true);
      d.over = false;
      d.inJ = false;
      d.grace = 2.2;
      g.set('Tips', '$0');
      g.set('Shift', Math.ceil(SHIFT) + 's');
      g.set('Drops', 0);
      g.set('Speed', 0);
    }

    function crash(g, what) {
      var d = g.data;
      if (d.down > 0 || d.grace > 0) return;
      d.down = 1.9;
      d.v = 0;
      var lost = Math.min(d.tips, what === 'car' ? 14 : 6);
      d.tips -= lost;
      d.clock -= what === 'car' ? 4 : 2;
      d.flash = what === 'car' ? 'Hit by a car! −$' + lost + ' and 4s' : 'Knocked a pedestrian! −$' + lost;
      d.flashT = 2.2;
      Milo.sound.explode();
      for (var i = 0; i < 18; i++) {
        var a = Math.random() * TAU, s = U.rand(40, 200);
        d.parts.push({ x: d.x, y: d.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: U.rand(.3, .8), max: .8, col: '#ffd257' });
      }
    }

    return Milo.arcade(host, {
      id: 'bike-courier',
      w: W, h: H, bg: '#0d1018',
      stats: ['Tips', 'Shift', 'Drops', 'Speed'],
      touch: 'dpad',
      emo: '🚲',
      start: {
        title: 'Bike Courier',
        text: 'Pick up, drop off, keep the shift clock alive. Traffic does not care about you, ' +
          'the lights are only a suggestion if you are brave, and the alleys through the middle ' +
          'of each block cut corners the cars cannot. Every delivery buys you more time.',
        keys: ['↑ pedal', '↓ brake', '← → steer']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, inp = g.input, i;
        d.t += dt;
        if (d.flashT > 0) d.flashT -= dt;

        d.clock -= dt;
        if (d.clock <= 0) {
          d.clock = 0;
          g.gameOver({
            emo: '🕔', title: 'Shift over',
            text: d.made + ' deliveries made for $' + d.tips + ' in tips' +
              (d.redRuns ? ', ' + d.redRuns + ' reds run and got away with' : '') + '.',
            score: d.tips
          });
          return;
        }

        /* ---- bike ---- */
        if (d.grace > 0) d.grace -= dt;
        if (d.down > 0) {
          d.down -= dt;
        } else {
          var thr = inp.down('up') || inp.down('action');
          var brk = inp.down('down');
          var steer = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
          if (inp.pdown) {
            var tx = inp.px - W / 2, ty = inp.py - H / 2;
            var want = Math.atan2(ty, tx);
            var diff = wrap(want - d.a);
            steer = U.clamp(diff * 3, -1, 1);
            thr = true;
          }
          var onAlley = surfaceAt(d.x, d.y) === 2;
          var top = onAlley ? 168 : 232;
          if (thr) d.v += 250 * dt;
          else if (brk) d.v -= 420 * dt;
          else d.v -= 92 * dt;
          d.v = U.clamp(d.v, 0, top);
          d.a += steer * dt * (2.1 + 1.4 * (1 - d.v / 240));
        }

        var nx = d.x + Math.cos(d.a) * d.v * dt;
        var ny = d.y + Math.sin(d.a) * d.v * dt;
        if (surfaceAt(nx, ny)) { d.x = nx; d.y = ny; }
        else if (surfaceAt(nx, d.y)) { d.x = nx; d.v *= .72; }
        else if (surfaceAt(d.x, ny)) { d.y = ny; d.v *= .72; }
        else {
          if (d.v > 120) { Milo.sound.hit(); d.flash = 'Into a wall'; d.flashT = 1; }
          d.v *= .25;
        }

        /* ---- traffic ---- */
        for (i = d.cars.length - 1; i >= 0; i--) {
          var c = d.cars[i];
          // stop for a red at the next junction
          var stopFor = 0;
          var jx = Math.round(c.x / BLOCK), jy = Math.round(c.y / BLOCK);
          var ahead = c.dx ? (jx * BLOCK - c.x) * c.dx : (jy * BLOCK - c.y) * c.dy;
          if (ahead > 8 && ahead < 74) {
            var st = lightNS(d.t, jx, jy);
            var goNS = st === 'green';
            if (c.dy && !goNS) stopFor = 1;
            if (c.dx && st !== 'red') stopFor = 1;
          }
          var tv = stopFor ? 0 : c.v;
          c.cur = U.lerp(c.cur == null ? c.v : c.cur, tv, Math.min(1, dt * 4));
          c.x += c.dx * c.cur * dt;
          c.y += c.dy * c.cur * dt;
          if (Math.abs(c.x - d.x) > 900 || Math.abs(c.y - d.y) > 780 ||
            c.x < -60 || c.y < -60 || c.x > WORLD + 60 || c.y > WORLD + 60) {
            d.cars.splice(i, 1);
            var nc = spawnCar(d, d.x, d.y);
            if (nc) d.cars.push(nc);
            continue;
          }
          if (d.down <= 0 && Math.hypot(c.x - d.x, c.y - d.y) < 23) crash(g, 'car');
        }

        for (i = d.peds.length - 1; i >= 0; i--) {
          var p = d.peds[i];
          p.t -= dt;
          var px = p.x + p.dx * p.v * dt, py = p.y + p.dy * p.v * dt;
          if (surfaceAt(px, py)) { p.x = px; p.y = py; } else { p.dx = -p.dx; p.dy = -p.dy; }
          if (p.t <= 0 || Math.abs(p.x - d.x) > 700 || Math.abs(p.y - d.y) > 620) {
            d.peds.splice(i, 1);
            var np = spawnPed(d, d.x, d.y);
            if (np) d.peds.push(np);
            continue;
          }
          if (d.down <= 0 && Math.hypot(p.x - d.x, p.y - d.y) < 14) crash(g, 'ped');
        }

        /* ---- running a red ---- */
        var ix = Math.round(d.x / BLOCK), iy = Math.round(d.y / BLOCK);
        var inJunction = Math.abs(d.x - ix * BLOCK) < RW && Math.abs(d.y - iy * BLOCK) < RW;
        if (inJunction && !d.inJ) {
          d.inJ = true;
          var ns = lightNS(d.t, ix, iy) === 'green';
          var movingNS = Math.abs(Math.sin(d.a)) > .5;
          if (movingNS !== ns && d.v > 90) {
            d.redRuns++;
            d.tips += 4;
            d.flash = 'Ran the red — +$4 and your nerve';
            d.flashT = 1.4;
            Milo.sound.blip();
          }
        } else if (!inJunction) d.inJ = false;

        /* ---- the job ---- */
        var job = d.job;
        job.t -= dt;
        job.fresh = U.clamp(job.t / job.limit, 0, 1);
        var tgt = job.stage === 'pick' ? job.from : job.to;
        if (Math.hypot(tgt.x - d.x, tgt.y - d.y) < 30) {
          if (job.stage === 'pick') {
            job.stage = 'drop';
            d.flash = 'Parcel on board — go!';
            d.flashT = 1.6;
            Milo.sound.blip();
          } else {
            var tip = Math.round(job.base * (0.35 + 0.65 * job.fresh));
            d.tips += tip;
            d.made++;
            var bonus = 13 + Math.round(job.fresh * 9);
            d.clock = Math.min(SHIFT + 20, d.clock + bonus);
            d.flash = 'Delivered! +$' + tip + ' and +' + bonus + 's';
            d.flashT = 2.4;
            Milo.sound.coin();
            for (i = 0; i < 20; i++) {
              var a2 = Math.random() * TAU, s2 = U.rand(50, 190);
              d.parts.push({ x: d.x, y: d.y, vx: Math.cos(a2) * s2, vy: Math.sin(a2) * s2, t: U.rand(.4, .9), max: .9, col: '#4ade80' });
            }
            newJob(g, false);
          }
        } else if (job.t <= -6) {
          d.flash = 'Too slow — the job was cancelled';
          d.flashT = 2;
          Milo.sound.lose();
          newJob(g, false);
        }

        for (i = d.parts.length - 1; i >= 0; i--) {
          var pp = d.parts[i];
          pp.x += pp.vx * dt; pp.y += pp.vy * dt; pp.vx *= .93; pp.vy *= .93; pp.t -= dt;
          if (pp.t <= 0) d.parts.splice(i, 1);
        }

        d.camX = U.lerp(d.camX, U.clamp(d.x - W / 2, -60, WORLD - W + 60), Math.min(1, dt * 7));
        d.camY = U.lerp(d.camY, U.clamp(d.y - H / 2, -60, WORLD - H + 60), Math.min(1, dt * 7));

        g.score = d.tips;
        g.set('Tips', '$' + d.tips);
        g.set('Shift', Math.ceil(d.clock) + 's');
        g.set('Drops', d.made);
        g.set('Speed', Math.round(d.v * .18));
      },

      draw: function (g) { render(g, g.ctx, g.data); }
    });

    function wrap(a) { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; }

    /* ------------------------------------------------------------ paint */

    function render(g, c, d) {
      var i, j;
      c.fillStyle = '#0d1018'; c.fillRect(0, 0, W, H);
      c.save();
      c.translate(-d.camX, -d.camY);

      var i0 = Math.max(0, Math.floor(d.camX / BLOCK) - 1), i1 = Math.min(G, Math.ceil((d.camX + W) / BLOCK) + 1);
      var j0 = Math.max(0, Math.floor(d.camY / BLOCK) - 1), j1 = Math.min(G, Math.ceil((d.camY + H) / BLOCK) + 1);

      // blocks
      for (i = i0; i < i1; i++) {
        for (j = j0; j < j1; j++) {
          var bx = i * BLOCK + RW, by = j * BLOCK + RW;
          var bw = BLOCK - RW * 2, bh = BLOCK - RW * 2;
          c.fillStyle = '#161b26';
          c.fillRect(bx - 6, by - 6, bw + 12, bh + 12);      // pavement
          var al = alleyOf(i, j);
          var pieces = al === 1
            ? [[bx, by, (bw - 26) / 2, bh], [bx + (bw + 26) / 2, by, (bw - 26) / 2, bh]]
            : al === 2
              ? [[bx, by, bw, (bh - 26) / 2], [bx, by + (bh + 26) / 2, bw, (bh - 26) / 2]]
              : [[bx, by, bw, bh]];
          for (var k = 0; k < pieces.length; k++) {
            var pc = pieces[k];
            var shade = U.hash2(i * 7 + k, j, 13);
            c.fillStyle = ['#343d52', '#3e485f', '#2c3446', '#454f68'][(shade * 4) | 0];
            c.fillRect(pc[0], pc[1], pc[2], pc[3]);
            c.fillStyle = 'rgba(255,220,130,.72)';
            for (var wy = pc[1] + 12; wy < pc[1] + pc[3] - 8; wy += 22) {
              for (var wx = pc[0] + 10; wx < pc[0] + pc[2] - 8; wx += 20) {
                if (U.hash2(wx | 0, wy | 0, 3) > .58) c.fillRect(wx, wy, 8, 10);
              }
            }
          }
          if (al) {
            c.fillStyle = '#101520';
            if (al === 1) c.fillRect(bx + (bw - 26) / 2, by, 26, bh);
            else c.fillRect(bx, by + (bh - 26) / 2, bw, 26);
          }
        }
      }

      // roads
      c.fillStyle = '#1e242f';
      for (i = i0; i <= i1; i++) c.fillRect(i * BLOCK - RW, j0 * BLOCK - RW, RW * 2, (j1 - j0 + 1) * BLOCK);
      for (j = j0; j <= j1; j++) c.fillRect(i0 * BLOCK - RW, j * BLOCK - RW, (i1 - i0 + 1) * BLOCK, RW * 2);
      c.strokeStyle = 'rgba(255,255,255,.2)';
      c.lineWidth = 2; c.setLineDash([12, 14]);
      c.beginPath();
      for (i = i0; i <= i1; i++) { c.moveTo(i * BLOCK, j0 * BLOCK - RW); c.lineTo(i * BLOCK, (j1 + 1) * BLOCK); }
      for (j = j0; j <= j1; j++) { c.moveTo(i0 * BLOCK - RW, j * BLOCK); c.lineTo((i1 + 1) * BLOCK, j * BLOCK); }
      c.stroke();
      c.setLineDash([]);

      // junction boxes + lights
      for (i = i0; i <= i1; i++) {
        for (j = j0; j <= j1; j++) {
          var st = lightNS(d.t, i, j);
          c.fillStyle = '#232a36';
          c.fillRect(i * BLOCK - RW, j * BLOCK - RW, RW * 2, RW * 2);
          var cols = { green: '#22e07a', amber: '#ffb020', red: '#ff3b3b' };
          c.fillStyle = cols[st];
          c.fillRect(i * BLOCK - 4, j * BLOCK - RW - 7, 8, 5);
          c.fillRect(i * BLOCK - 4, j * BLOCK + RW + 2, 8, 5);
          c.fillStyle = cols[st === 'green' ? 'red' : st === 'red' ? 'green' : 'amber'];
          c.fillRect(i * BLOCK - RW - 7, j * BLOCK - 4, 5, 8);
          c.fillRect(i * BLOCK + RW + 2, j * BLOCK - 4, 5, 8);
        }
      }

      // markers
      var job = d.job;
      drawMarker(c, d, job.stage === 'pick' ? job.from : job.to, job.stage === 'pick' ? '#ffd257' : '#4ade80');

      // traffic
      for (i = 0; i < d.cars.length; i++) {
        var car = d.cars[i];
        c.save();
        c.translate(car.x, car.y);
        c.rotate(Math.atan2(car.dy, car.dx));
        c.fillStyle = 'rgba(0,0,0,.4)';
        U.roundRect(c, -20, -11, 42, 23, 5); c.fill();
        c.fillStyle = car.col;
        U.roundRect(c, -21, -12, 42, 24, 6); c.fill();
        c.fillStyle = 'rgba(12,16,26,.8)';
        U.roundRect(c, -8, -9, 16, 18, 3); c.fill();
        c.fillStyle = '#fff6c9';
        c.fillRect(18, -9, 4, 5); c.fillRect(18, 4, 4, 5);
        c.restore();
      }

      for (i = 0; i < d.peds.length; i++) {
        var p = d.peds[i];
        c.fillStyle = p.col;
        c.beginPath(); c.arc(p.x, p.y, 5.5, 0, TAU); c.fill();
        c.fillStyle = 'rgba(0,0,0,.35)';
        c.fillRect(p.x - 2, p.y + 3, 4, 4);
      }

      drawBike(c, d);

      for (i = 0; i < d.parts.length; i++) {
        var pp = d.parts[i];
        c.globalAlpha = Math.max(0, pp.t / pp.max);
        c.fillStyle = pp.col;
        c.fillRect(pp.x - 2, pp.y - 2, 5, 5);
      }
      c.globalAlpha = 1;
      c.restore();

      drawHud(g, c, d);
    }

    function drawMarker(c, d, p, col) {
      var pulse = 1 + Math.sin(d.t * 5) * .16;
      c.save();
      c.globalAlpha = .28;
      c.fillStyle = col;
      c.beginPath(); c.arc(p.x, p.y, 30 * pulse, 0, TAU); c.fill();
      c.globalAlpha = 1;
      c.strokeStyle = col; c.lineWidth = 3;
      c.beginPath(); c.arc(p.x, p.y, 15, 0, TAU); c.stroke();
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(p.x, p.y - 34 - Math.sin(d.t * 5) * 4);
      c.lineTo(p.x - 8, p.y - 48); c.lineTo(p.x + 8, p.y - 48);
      c.closePath(); c.fill();
      c.restore();
    }

    function drawBike(c, d) {
      c.save();
      c.translate(d.x, d.y);
      c.rotate(d.a);
      if (d.down > 0) c.rotate(Math.sin(d.down * 20) * .5);
      c.fillStyle = 'rgba(0,0,0,.45)';
      c.beginPath(); c.ellipse(0, 3, 16, 8, 0, 0, TAU); c.fill();
      c.strokeStyle = '#1b2030'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(-11, 0); c.lineTo(11, 0); c.stroke();
      c.fillStyle = '#14161f';
      c.beginPath(); c.arc(-11, 0, 5, 0, TAU); c.fill();
      c.beginPath(); c.arc(11, 0, 5, 0, TAU); c.fill();
      c.fillStyle = '#22d3ee';
      U.roundRect(c, -8, -6, 15, 12, 4); c.fill();
      c.fillStyle = '#f97316';
      U.roundRect(c, -12, -7, 9, 14, 3); c.fill();      // satchel
      c.fillStyle = '#fde68a';
      c.beginPath(); c.arc(3, 0, 4.5, 0, TAU); c.fill();
      c.restore();
    }

    function drawHud(g, c, d) {
      var job = d.job;
      // off-screen arrow to the target
      var tgt = job.stage === 'pick' ? job.from : job.to;
      var sx = tgt.x - d.camX, sy = tgt.y - d.camY;
      if (sx < 24 || sy < 110 || sx > W - 24 || sy > H - 24) {
        var ang = Math.atan2(tgt.y - d.y, tgt.x - d.x);
        var ax = W / 2 + Math.cos(ang) * 250, ay = H / 2 + Math.sin(ang) * 180;
        c.save();
        c.translate(U.clamp(ax, 30, W - 30), U.clamp(ay, 116, H - 30));
        c.rotate(ang);
        c.fillStyle = job.stage === 'pick' ? '#ffd257' : '#4ade80';
        c.beginPath(); c.moveTo(16, 0); c.lineTo(-10, -11); c.lineTo(-10, 11); c.closePath(); c.fill();
        c.restore();
      }

      // job panel
      c.fillStyle = 'rgba(8,10,20,.78)';
      U.roundRect(c, 16, H - 74, 300, 58, 10); c.fill();
      c.fillStyle = job.stage === 'pick' ? '#ffd257' : '#4ade80';
      c.font = 'bold 15px system-ui,sans-serif';
      c.fillText(job.stage === 'pick' ? 'COLLECT' : 'DELIVER', 30, H - 52);
      c.fillStyle = '#9fb0d8'; c.font = '13px system-ui,sans-serif';
      c.fillText(Math.round(Math.hypot(tgt.x - d.x, tgt.y - d.y) / 6) + ' m away  ·  worth $' +
        Math.round(job.base * (0.35 + 0.65 * job.fresh)), 110, H - 52);
      c.fillStyle = 'rgba(255,255,255,.15)';
      U.roundRect(c, 30, H - 40, 272, 10, 5); c.fill();
      c.fillStyle = job.fresh > .5 ? '#4ade80' : job.fresh > .2 ? '#ffd257' : '#fb7185';
      U.roundRect(c, 30, H - 40, 272 * job.fresh, 10, 5); c.fill();

      // shift clock bar
      c.fillStyle = 'rgba(8,10,20,.7)';
      U.roundRect(c, W - 206, H - 52, 190, 36, 10); c.fill();
      c.fillStyle = '#9fb0d8'; c.font = '11px system-ui,sans-serif';
      c.fillText('SHIFT', W - 194, H - 36);
      c.fillStyle = 'rgba(255,255,255,.15)';
      U.roundRect(c, W - 194, H - 32, 166, 10, 5); c.fill();
      var cl = U.clamp(d.clock / SHIFT, 0, 1);
      c.fillStyle = cl > .4 ? '#22d3ee' : cl > .18 ? '#ffd257' : '#fb7185';
      U.roundRect(c, W - 194, H - 32, 166 * cl, 10, 5); c.fill();

      if (d.flashT > 0) {
        c.textAlign = 'center';
        c.globalAlpha = Math.min(1, d.flashT);
        c.fillStyle = 'rgba(8,10,20,.82)';
        var tw = c.measureText(d.flash).width;
        U.roundRect(c, W / 2 - 170, 96, 340, 34, 8); c.fill();
        c.fillStyle = '#fff'; c.font = 'bold 16px system-ui,sans-serif';
        c.fillText(d.flash, W / 2, 118);
        c.globalAlpha = 1;
        c.textAlign = 'left';
      }
      if (d.down > 0) {
        c.textAlign = 'center';
        c.fillStyle = '#fb7185'; c.font = 'bold 22px system-ui,sans-serif';
        c.fillText('DOWN', W / 2, H / 2 - 40);
        c.textAlign = 'left';
      }
    }
  }

  window.Milo.register({
    id: 'bike-courier', title: 'Bike Courier', emo: '🚲', category: 'Racing',
    tagline: 'Beat the lights, keep the tips',
    description: 'A delivery shift across a seven-by-seven city block grid where the racing is ' +
      'against a shift clock rather than another rider. Collect a parcel, take it across town, and ' +
      'the tip shrinks the longer it takes — every drop buys back time on the clock, so a bad run ' +
      'ends the shift. Traffic obeys the lights and you do not have to: crossing a junction against ' +
      'a red pays a small bonus but the cross traffic is moving, and getting hit costs money and ' +
      'four seconds. Roughly half the blocks have an alley straight through the middle, slower to ' +
      'ride but a much shorter line than going round.',
    controls: ['↑ pedal', '↓ brake', '← → steer'],
    colors: ['#22d3ee', '#f97316'],
    tags: ['bike', 'delivery', 'city', 'traffic', 'timed'],
    scoreLabel: 'tips ($)',
    mount: mount
  });
})();
