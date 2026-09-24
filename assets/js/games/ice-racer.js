/* Ice Racer — an oval with no grip: the whole game is managing the slide. */
(function () {
  'use strict';
  var W = 900, H = 600, TAU = Math.PI * 2;
  var N = 200, TRACKW = 48, LAPS = 6;
  var CX = 450, CY = 324;

  var RIVALS = [
    { name: 'Vika', col: '#60a5fa', skill: .93, line: -18 },
    { name: 'Brandt', col: '#4ade80', skill: .96, line: 10 },
    { name: 'Oksana', col: '#fbbf24', skill: .99, line: -6 },
    { name: 'Teppo', col: '#f472b6', skill: 1.02, line: 20 }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    /* Centre line: an oval with one end tightened so the line matters. */
    var PATH = [];
    (function () {
      for (var i = 0; i < N; i++) {
        var th = i / N * TAU;
        var rx = 320 + 14 * Math.cos(th * 2);
        var ry = 196 + 10 * Math.sin(th * 3 + 1.1);
        PATH.push({ x: CX + Math.cos(th) * rx, y: CY + Math.sin(th) * ry });
      }
    })();

    function nearestIdx(x, y, from) {
      var best = from, bd = 1e9;
      for (var k = -14; k <= 26; k++) {
        var i = ((from + k) % N + N) % N;
        var dx = PATH[i].x - x, dy = PATH[i].y - y;
        var dd = dx * dx + dy * dy;
        if (dd < bd) { bd = dd; best = i; }
      }
      return { i: best, d: Math.sqrt(bd) };
    }

    function mkCar(i, spec) {
      var p = PATH[(N - 6 - i * 5) % N];
      var nx = PATH[(N - 5 - i * 5) % N];
      var a = Math.atan2(nx.y - p.y, nx.x - p.x);
      var side = (i % 2 ? 1 : -1) * 22;
      return {
        x: p.x - Math.sin(a) * side, y: p.y + Math.cos(a) * side,
        a: a, vx: 0, vy: 0, spin: 0, av: 0,
        idx: (N - 6 - i * 5) % N, lap: -1, prog: 0, place: 0, done: false, finishT: 0,
        ai: i > 0, name: spec.name, col: spec.col, skill: spec.skill, line: spec.line,
        nitro: 0
      };
    }

    function reset(g) {
      var d = g.data;
      d.cars = [mkCar(0, { name: 'You', col: '#ff4f79', skill: 1, line: 0 })];
      for (var i = 0; i < RIVALS.length; i++) d.cars.push(mkCar(i + 1, RIVALS[i]));
      d.me = d.cars[0];
      d.marks = [];
      d.parts = [];
      d.time = 0;
      d.phase = 'count';
      d.count = 3.2;
      d.finished = 0;
      d.lapT = 0;
      d.bestLap = 0;
      d.msg = '';
      d.msgT = 0;
      g.set('Lap', '1/' + LAPS);
      g.set('Pos', '5th');
      g.set('Time', '0.0');
      g.set('Speed', '0');
    }

    function ord(n) { return n + (['st', 'nd', 'rd'][n - 1] || 'th'); }

    function place(d, car) {
      var better = 1;
      for (var i = 0; i < d.cars.length; i++) {
        var o = d.cars[i];
        if (o === car) continue;
        if (o.done && !car.done) { better++; continue; }
        if (o.done && car.done) { if (o.finishT < car.finishT) better++; continue; }
        if (!car.done && (o.lap * N + o.prog) > (car.lap * N + car.prog)) better++;
      }
      return better;
    }

    function scoreOf(d) {
      var p = place(d, d.me);
      return Math.max(0, (6 - p) * 60000 + Math.max(0, 240000 - Math.round(d.time * 1000)));
    }

    function say(d, txt) { d.msg = txt; d.msgT = 2; }

    return Milo.arcade(host, {
      id: 'ice-racer',
      w: W, h: H, bg: '#0a1526',
      stats: ['Lap', 'Pos', 'Time', 'Speed'],
      touch: 'dpad',
      emo: '🧊',
      start: {
        title: 'Ice Racer',
        text: 'Studded tyres on a frozen oval: there is almost no grip, so the car is ' +
          'sideways from the first corner to the flag. Steer into the slide, not away from ' +
          'it, and lift before you turn — six laps, four rivals, and any contact spins you.',
        keys: ['↑ throttle', '↓ brake', '← → steer']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i, j;

        if (d.phase === 'count') {
          d.count -= dt;
          if (d.count <= 0) {
            d.phase = 'race';
            Milo.sound.tone({ f: 880, d: .3, v: .12 });
          } else if (Math.ceil(d.count) !== d.lastBeep) {
            d.lastBeep = Math.ceil(d.count);
            Milo.sound.tone({ f: 440, d: .12, v: .1 });
          }
          return;
        }
        if (d.phase === 'over') return;

        d.time += dt;
        d.lapT += dt;
        if (d.msgT > 0) d.msgT -= dt;

        for (i = 0; i < d.cars.length; i++) step(g, d, d.cars[i], dt);

        // contact
        for (i = 0; i < d.cars.length; i++) {
          for (j = i + 1; j < d.cars.length; j++) {
            var A = d.cars[i], B = d.cars[j];
            var dx = B.x - A.x, dy = B.y - A.y;
            var dist = Math.hypot(dx, dy);
            if (dist > 30 || dist < .001) continue;
            var nx = dx / dist, ny = dy / dist;
            var push = (30 - dist) * .5;
            A.x -= nx * push; A.y -= ny * push;
            B.x += nx * push; B.y += ny * push;
            var rel = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
            if (rel < 0) {
              A.vx += nx * rel * .6; A.vy += ny * rel * .6;
              B.vx -= nx * rel * .6; B.vy -= ny * rel * .6;
              var force = Math.abs(rel);
              if (force > 55) {
                A.spin = Math.max(A.spin, .85); B.spin = Math.max(B.spin, .85);
                A.av += (Math.random() - .5) * 9; B.av += (Math.random() - .5) * 9;
                Milo.sound.hit();
                spray(d, (A.x + B.x) / 2, (A.y + B.y) / 2, 12, '#dbeafe');
                if (A === d.me || B === d.me) say(d, 'Contact! Catch it with opposite lock');
              }
            }
          }
        }

        for (i = d.parts.length - 1; i >= 0; i--) {
          var p = d.parts[i];
          p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .94; p.vy *= .94; p.t -= dt;
          if (p.t <= 0) d.parts.splice(i, 1);
        }
        if (d.marks.length > 520) d.marks.splice(0, d.marks.length - 520);

        var me = d.me;
        g.set('Lap', Math.min(LAPS, Math.max(1, me.lap + 1)) + '/' + LAPS);
        g.set('Pos', ord(place(d, me)));
        g.set('Time', d.time.toFixed(1));
        g.set('Speed', Math.round(Math.hypot(me.vx, me.vy) * .55));
        g.score = scoreOf(d);

        if (me.done && d.phase !== 'over') {
          d.phase = 'over';
          var p2 = place(d, me);
          var txt = 'Finished ' + ord(p2) + ' of 5 in ' + d.time.toFixed(2) + 's' +
            (d.bestLap ? ', best lap ' + d.bestLap.toFixed(2) + 's.' : '.');
          if (p2 === 1) g.win({ emo: '🥇', title: 'Won on the ice', text: txt, score: scoreOf(d) });
          else g.gameOver({ emo: p2 <= 3 ? '🥉' : '🏁', title: ord(p2) + ' place', text: txt, score: scoreOf(d) });
        }
      },

      draw: function (g) { render(g, g.ctx, g.data); }
    });

    /* ---------------------------------------------------------- physics */

    function step(g, d, car, dt) {
      if (car.done) { car.vx *= Math.pow(.2, dt); car.vy *= Math.pow(.2, dt); car.x += car.vx * dt; car.y += car.vy * dt; return; }
      var inp = g.input;
      var thr = 0, steer = 0, brake = 0;

      if (!car.ai) {
        thr = (inp.down('up') || inp.down('action')) ? 1 : 0;
        brake = inp.down('down') ? 1 : 0;
        steer = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
        if (inp.pdown) {
          thr = 1;
          steer = inp.px < W * .4 ? -1 : inp.px > W * .6 ? 1 : 0;
        }
      } else {
        // Aim at a point up the road, offset onto its own line.
        var look = 8 + Math.round(Math.hypot(car.vx, car.vy) * .05);
        var t = PATH[(car.idx + look) % N];
        var t2 = PATH[(car.idx + look + 4) % N];
        var ta = Math.atan2(t2.y - t.y, t2.x - t.x);
        var tx = t.x - Math.sin(ta) * car.line, ty = t.y + Math.cos(ta) * car.line;
        var want = Math.atan2(ty - car.y, tx - car.x);
        var diff = wrap(want - car.a);
        steer = U.clamp(diff * 2.4, -1, 1);
        // ease off when the car is already crossed up
        var slip = Math.abs(wrap(Math.atan2(car.vy, car.vx) - car.a));
        thr = slip > 0.85 ? 0 : 1;
        brake = slip > 1.25 ? 1 : 0;
      }

      var sp = Math.hypot(car.vx, car.vy);
      var near = nearestIdx(car.x, car.y, car.idx);
      var onIce = near.d < TRACKW;

      if (car.spin > 0) {
        car.spin -= dt;
        car.a += car.av * dt;
        car.av *= Math.pow(.35, dt);
        thr = 0; steer = 0;
      } else {
        car.a += steer * dt * 2.35 * Math.min(1, sp / 70) * (car.ai ? car.skill : 1);
      }

      var ca = Math.cos(car.a), sa = Math.sin(car.a);
      // decompose into the tyre frame
      var vf = car.vx * ca + car.vy * sa;
      var vl = -car.vx * sa + car.vy * ca;

      var grip = onIce ? 1.35 : 5.5;            // lateral friction rate (1/s)
      var roll = onIce ? .35 : 3.4;
      if (thr && car.spin <= 0) vf += (onIce ? 165 : 70) * dt * (car.ai ? car.skill : 1);
      if (brake) vf -= 130 * dt;
      vf -= roll * vf * dt;
      vl -= grip * vl * dt;
      var maxv = onIce ? 330 : 150;
      if (vf > maxv) vf = maxv;

      car.vx = vf * ca - vl * sa;
      car.vy = vf * sa + vl * ca;
      car.x += car.vx * dt;
      car.y += car.vy * dt;

      // snowbank: shove back toward the track and bleed speed
      if (!onIce) {
        var p = PATH[near.i];
        var bx = (p.x - car.x), by = (p.y - car.y);
        var bl = Math.hypot(bx, by) || 1;
        car.vx += bx / bl * 90 * dt;
        car.vy += by / bl * 90 * dt;
        if (sp > 110 && car.spin <= 0 && Math.random() < dt * 4) {
          car.spin = .7; car.av = (Math.random() - .5) * 8;
          if (!car.ai) { say(d, 'Into the bank!'); Milo.sound.hit(); }
        }
        if (g.frame % 2 === 0) spray(d, car.x, car.y, 2, '#e8f2ff');
      } else if (Math.abs(vl) > 40 && g.frame % 2 === 0) {
        d.marks.push({ x: car.x, y: car.y, a: car.a, t: 1 });
        spray(d, car.x - ca * 14, car.y - sa * 14, 1, '#bfe3ff');
      }

      // progress
      var prev = car.idx;
      car.idx = near.i;
      car.prog = near.i;
      if (prev > N - 22 && car.idx < 22) {
        car.lap++;
        if (!car.ai) {
          // the very first crossing is the start of lap 1, not a completed lap
          if (car.lap >= 1 && (!d.bestLap || d.lapT < d.bestLap)) d.bestLap = d.lapT;
          d.lapT = 0;
          if (car.lap < LAPS) { say(d, 'Lap ' + (car.lap + 1) + ' of ' + LAPS); Milo.sound.blip(); }
        }
        if (car.lap >= LAPS) {
          car.done = true;
          car.finishT = d.time;
          d.finished++;
          car.place = d.finished;
          if (!car.ai) Milo.sound.win();
        }
      } else if (prev < 22 && car.idx > N - 22) {
        car.lap = Math.max(-1, car.lap - 1);     // reversed over the line
      }

      if (!car.ai && g.frame % 6 === 0 && sp > 20) {
        Milo.sound.tone({ f: 60 + sp * .55, d: .06, v: .035, type: 'sawtooth' });
      }
    }

    function wrap(a) { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; }

    function spray(d, x, y, n, col) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * TAU, s = U.rand(20, 90);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: U.rand(.3, .8), max: .8, col: col });
      }
      if (d.parts.length > 260) d.parts.splice(0, d.parts.length - 260);
    }

    /* ------------------------------------------------------------ paint */

    function render(g, c, d) {
      var i;
      c.fillStyle = '#0a1526'; c.fillRect(0, 0, W, H);

      // snow field
      c.fillStyle = '#e8eef8';
      c.beginPath();
      strokePath(c, TRACKW + 30);
      c.lineWidth = (TRACKW + 30) * 2; c.strokeStyle = '#dce6f5';
      c.lineJoin = 'round'; c.lineCap = 'round';
      c.stroke();

      // banks
      c.lineWidth = (TRACKW + 12) * 2; c.strokeStyle = '#f7fbff'; c.stroke();
      // ice
      c.lineWidth = TRACKW * 2;
      var ice = c.createLinearGradient(0, 0, W, H);
      ice.addColorStop(0, '#9dc7e8'); ice.addColorStop(.5, '#b9dcf4'); ice.addColorStop(1, '#8fbcdf');
      c.strokeStyle = ice; c.stroke();

      // ice sheen
      c.save();
      c.globalAlpha = .18;
      c.lineWidth = TRACKW * .8; c.strokeStyle = '#ffffff';
      c.stroke();
      c.restore();

      // skid marks
      c.strokeStyle = 'rgba(70,110,150,.5)'; c.lineWidth = 3;
      for (i = 0; i < d.marks.length; i++) {
        var m = d.marks[i];
        c.globalAlpha = .28 * (i / d.marks.length);
        c.beginPath();
        c.moveTo(m.x - Math.cos(m.a) * 9 - Math.sin(m.a) * 7, m.y - Math.sin(m.a) * 9 + Math.cos(m.a) * 7);
        c.lineTo(m.x + Math.cos(m.a) * 9 - Math.sin(m.a) * 7, m.y + Math.sin(m.a) * 9 + Math.cos(m.a) * 7);
        c.moveTo(m.x - Math.cos(m.a) * 9 + Math.sin(m.a) * 7, m.y - Math.sin(m.a) * 9 - Math.cos(m.a) * 7);
        c.lineTo(m.x + Math.cos(m.a) * 9 + Math.sin(m.a) * 7, m.y + Math.sin(m.a) * 9 - Math.cos(m.a) * 7);
        c.stroke();
      }
      c.globalAlpha = 1;

      // start / finish
      var s0 = PATH[0], s1 = PATH[3];
      var sa = Math.atan2(s1.y - s0.y, s1.x - s0.x);
      c.save();
      c.translate(s0.x, s0.y); c.rotate(sa);
      for (i = 0; i < 8; i++) {
        c.fillStyle = i % 2 ? '#1b2030' : '#fff';
        c.fillRect(-6, -TRACKW + i * (TRACKW * 2 / 8), 12, TRACKW * 2 / 8);
      }
      c.restore();

      // particles
      for (i = 0; i < d.parts.length; i++) {
        var p = d.parts[i];
        c.globalAlpha = Math.max(0, p.t / p.max) * .8;
        c.fillStyle = p.col;
        c.fillRect(p.x - 2, p.y - 2, 4, 4);
      }
      c.globalAlpha = 1;

      for (i = d.cars.length - 1; i >= 0; i--) drawCar(c, d.cars[i], d.cars[i] === d.me);

      drawHud(g, c, d);
    }

    function strokePath(c, r) {
      c.beginPath();
      c.moveTo(PATH[0].x, PATH[0].y);
      for (var i = 1; i <= N; i++) c.lineTo(PATH[i % N].x, PATH[i % N].y);
      c.closePath();
    }

    function drawCar(c, car, mine) {
      c.save();
      c.translate(car.x, car.y);
      c.rotate(car.a);
      c.fillStyle = 'rgba(20,40,60,.3)';
      U.roundRect(c, -16, -9, 32, 18, 5); c.fill();
      c.fillStyle = car.col;
      U.roundRect(c, -17, -11, 34, 22, 6); c.fill();
      if (mine) { c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); }
      c.fillStyle = 'rgba(12,20,36,.82)';
      U.roundRect(c, -5, -8, 13, 16, 3); c.fill();
      c.fillStyle = '#12161f';
      c.fillRect(-14, -13, 8, 4); c.fillRect(-14, 9, 8, 4);
      c.fillRect(8, -13, 8, 4); c.fillRect(8, 9, 8, 4);
      c.fillStyle = '#fff6c9';
      c.fillRect(15, -8, 3, 5); c.fillRect(15, 3, 3, 5);
      c.restore();
      c.textAlign = 'center';
      c.fillStyle = mine ? '#fff' : 'rgba(20,35,60,.75)';
      c.font = 'bold 11px system-ui,sans-serif';
      c.fillText(car.name, car.x, car.y - 18);
      c.textAlign = 'left';
    }

    function drawHud(g, c, d) {
      var i;
      // standings
      var order = d.cars.slice().sort(function (a, b) { return place(d, a) - place(d, b); });
      c.fillStyle = 'rgba(8,16,32,.7)';
      U.roundRect(c, W - 168, H - 206, 152, 22 * order.length + 14, 10); c.fill();
      c.font = '13px system-ui,sans-serif';
      for (i = 0; i < order.length; i++) {
        var o = order[i];
        c.fillStyle = o.col;
        c.fillRect(W - 158, H - 194 + i * 22, 8, 12);
        c.fillStyle = o === d.me ? '#fff' : '#b9c9e6';
        c.fillText((i + 1) + '. ' + o.name + (o.done ? ' ✓' : ' · L' + Math.min(LAPS, Math.max(1, o.lap + 1))),
          W - 144, H - 184 + i * 22);
      }

      if (d.bestLap) {
        c.fillStyle = '#9fb0d8'; c.font = '13px system-ui,sans-serif';
        c.fillText('Best lap ' + d.bestLap.toFixed(2) + 's', 18, H - 18);
      }

      var me = d.me;
      var slip = Math.abs(wrap(Math.atan2(me.vy, me.vx) - me.a));
      if (Math.hypot(me.vx, me.vy) > 40) {
        c.fillStyle = 'rgba(8,16,32,.7)';
        U.roundRect(c, 18, H - 66, 176, 34, 8); c.fill();
        c.fillStyle = '#9fb0d8'; c.font = '11px system-ui,sans-serif';
        c.fillText('SLIP ANGLE', 28, H - 50);
        c.fillStyle = 'rgba(255,255,255,.15)';
        U.roundRect(c, 28, H - 44, 156, 8, 4); c.fill();
        var t = U.clamp(slip / 1.4, 0, 1);
        c.fillStyle = t > .8 ? '#fb7185' : t > .45 ? '#ffd257' : '#4ade80';
        U.roundRect(c, 28, H - 44, 156 * t, 8, 4); c.fill();
      }

      if (d.msgT > 0) {
        c.textAlign = 'center';
        c.fillStyle = 'rgba(8,16,32,.78)';
        U.roundRect(c, W / 2 - 160, H - 76, 320, 32, 8); c.fill();
        c.fillStyle = '#ffd257'; c.font = 'bold 16px system-ui,sans-serif';
        c.fillText(d.msg, W / 2, H - 54);
        c.textAlign = 'left';
      }

      if (d.phase === 'count') {
        c.textAlign = 'center';
        c.fillStyle = 'rgba(8,16,32,.55)'; c.fillRect(0, H / 2 - 70, W, 140);
        c.fillStyle = '#fff'; c.font = 'bold 74px system-ui,sans-serif';
        c.fillText(d.count > 1 ? String(Math.ceil(d.count - .2)) : 'GO!', W / 2, H / 2 + 12);
        c.fillStyle = '#bfe3ff'; c.font = '16px system-ui,sans-serif';
        c.fillText('Six laps. Steer into the slide.', W / 2, H / 2 + 48);
        c.textAlign = 'left';
      }
    }
  }

  window.Milo.register({
    id: 'ice-racer', title: 'Ice Racer', emo: '🧊', category: 'Racing',
    tagline: 'No grip, six laps, four rivals',
    description: 'A frozen oval where the tyres barely bite, so the car spends the whole race ' +
      'sideways and your job is to manage the slide rather than avoid it. Turning in does almost ' +
      'nothing at speed; you set the car up early, lift, and then hold opposite lock through the ' +
      'corner while a slip-angle meter shows how close you are to spinning it. Four AI rivals run ' +
      'their own lines and any real contact spins both of you into the banks. Tip: the fast line ' +
      'is wide and early — the tighter you try to turn, the further out you finish.',
    controls: ['↑ throttle', '↓ brake', '← → steer'],
    colors: ['#9dc7e8', '#ff4f79'],
    tags: ['ice', 'drift', 'oval', 'racing', 'physics'],
    scoreLabel: 'pts',
    mount: mount
  });
})();
