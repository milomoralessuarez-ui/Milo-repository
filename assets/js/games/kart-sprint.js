/* Kart Sprint — a three-circuit cup: drift the hairpins, bank the boost. */
(function () {
  'use strict';
  var W = 900, H = 600;
  var ROAD = 92, LAPS = 3, TAU = Math.PI * 2;
  var PTS = [10, 7, 4, 2];

  // Three hand-made circuits in world coordinates.
  var CUPS = [
    {
      name: 'Sunny Loop',
      pts: [[230, 210], [470, 150], [740, 180], [960, 300], [1030, 500],
      [940, 690], [700, 770], [430, 750], [230, 640], [150, 430]]
    },
    {
      name: 'Snake Valley',
      pts: [[180, 170], [430, 130], [660, 200], [700, 360], [520, 430],
      [370, 520], [460, 660], [720, 620], [950, 680], [1000, 820],
      [780, 890], [430, 870], [190, 780], [130, 560], [200, 360]]
    },
    {
      name: 'Hairpin Ridge',
      pts: [[170, 200], [520, 140], [900, 160], [1030, 260], [960, 380],
      [620, 400], [430, 430], [420, 540], [640, 560], [930, 580],
      [1010, 690], [880, 800], [520, 830], [230, 790], [140, 620],
      [230, 470], [150, 330]]
    }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function track(d) { return CUPS[d.race].pts; }

    function startPos(d, i) {
      var T = track(d);
      var a = Math.atan2(T[1][1] - T[0][1], T[1][0] - T[0][0]);
      var nx = -Math.sin(a), ny = Math.cos(a);
      var lane = (i % 2 ? 1 : -1) * 24;
      var back = 40 + Math.floor(i / 2) * 44;
      return {
        x: T[0][0] + nx * lane - Math.cos(a) * back,
        y: T[0][1] + ny * lane - Math.sin(a) * back,
        a: a
      };
    }

    function trackDist(d, x, y) {
      var T = track(d), best = 1e9;
      for (var i = 0; i < T.length; i++) {
        var a = T[i], b = T[(i + 1) % T.length];
        var vx = b[0] - a[0], vy = b[1] - a[1];
        var t = U.clamp(((x - a[0]) * vx + (y - a[1]) * vy) / (vx * vx + vy * vy), 0, 1);
        best = Math.min(best, Math.hypot(a[0] + vx * t - x, a[1] + vy * t - y));
      }
      return best;
    }

    function setupRace(g) {
      var d = g.data;
      d.karts = [];
      for (var i = 0; i < 4; i++) {
        var p = startPos(d, i);
        d.karts.push({
          x: p.x, y: p.y, a: p.a, v: 0, slide: 0,
          ai: i > 0, wp: 1, lap: 0, prog: 0, done: false, place: 0,
          col: ['#ff4f79', '#4fc3f7', '#ffd257', '#9ccc65'][i],
          helm: ['#ffd257', '#ff8a65', '#7e57c2', '#26a69a'][i],
          name: ['You', 'Bip', 'Zola', 'Rex'][i],
          skill: i === 0 ? 1 : U.rand(.9, .985) + d.race * .015,
          charge: 0, boost: 0, drifting: false, driftDir: 0
        });
      }
      d.me = d.karts[0];
      d.phase = 'count';
      d.countdown = 3.4;
      d.time = 0;
      d.finished = 0;
      d.finishT = 0;
      d.parts = [];
      g.set('Race', (d.race + 1) + '/3');
      g.set('Lap', '1/' + LAPS);
      g.set('Pos', '1st');
    }

    function reset(g) {
      var d = g.data;
      d.race = 0;
      d.cupPts = [0, 0, 0, 0];
      d.firsts = 0;
      setupRace(g);
    }

    function ord(n) { return n + (['st', 'nd', 'rd', 'th'][n - 1] || 'th'); }

    function raceOver(g) {
      var d = g.data, T = track(d);
      // Rank: finished karts by finish order, the rest by progress.
      var order = d.karts.slice().sort(function (a, b) {
        if (a.done !== b.done) return a.done ? -1 : 1;
        if (a.done) return a.place - b.place;
        return (b.lap * T.length + b.prog) - (a.lap * T.length + a.prog);
      });
      d.results = order.map(function (k, i) {
        var idx = d.karts.indexOf(k);
        d.cupPts[idx] += PTS[i];
        return { kart: k, pts: PTS[i], total: d.cupPts[idx] };
      });
      if (order[0] === d.me) d.firsts++;
      d.phase = 'results';
      d.resultsT = 6;
      Milo.sound.win();
    }

    function cupOver(g) {
      var d = g.data;
      var idx = [0, 1, 2, 3].sort(function (a, b) { return d.cupPts[b] - d.cupPts[a]; });
      var myPlace = idx.indexOf(0) + 1;
      var score = d.cupPts[0] * 150 + d.firsts * 300 + (myPlace === 1 ? 500 : 0);
      var txt = 'Cup points: ' + d.cupPts[0] + ' · race wins: ' + d.firsts + '.';
      if (myPlace === 1) g.win({ emo: '🏆', title: 'Cup champion!', text: txt, score: score });
      else g.gameOver({ emo: '🏁', title: ord(myPlace) + ' in the cup', text: txt, score: score });
    }

    return Milo.arcade(host, {
      id: 'kart-sprint',
      w: W, h: H, bg: '#7ac74f',
      stats: ['Race', 'Lap', 'Pos'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'DRIFT' }],
      emo: '🏁',
      start: {
        title: 'Kart Sprint',
        text: 'A three-race cup against Bip, Zola and Rex. Hold DRIFT through tight ' +
          'corners to charge sparks — cyan, then orange, then purple — and release ' +
          'for a boost. Most cup points after three circuits wins.',
        keys: ['↑ gas', '← → steer', 'Space drift']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, inp = g.input;

        if (d.phase === 'count') {
          var before = Math.ceil(d.countdown);
          d.countdown -= dt;
          var after = Math.ceil(d.countdown);
          if (after !== before && after > 0) Milo.sound.tone({ f: 440, d: .12, v: .1, type: 'square' });
          if (d.countdown <= 0) { d.phase = 'race'; Milo.sound.tone({ f: 880, d: .3, v: .12, type: 'square' }); }
          return;
        }
        if (d.phase === 'results') {
          d.resultsT -= dt;
          if (d.resultsT <= 0 || inp.ptap || inp.pressed('action')) {
            if (d.race >= 2) { cupOver(g); return; }
            d.race++;
            setupRace(g);
          }
          return;
        }
        if (d.phase === 'finish') {
          d.finishT -= dt;
          if (d.finishT <= 0) raceOver(g);
          return;
        }

        d.time += dt;
        var T = track(d);

        d.karts.forEach(function (k) {
          if (k.done) { k.v *= 1 - dt; k.x += Math.cos(k.a) * k.v * dt; k.y += Math.sin(k.a) * k.v * dt; return; }
          var throttle = 0, steer = 0, drift = false;

          if (k.ai) {
            var wp = T[k.wp];
            var want = Math.atan2(wp[1] - k.y, wp[0] - k.x);
            var diff = ((want - k.a + Math.PI * 3) % TAU) - Math.PI;
            steer = U.clamp(diff * 2.6, -1, 1);
            throttle = 1 - Math.min(.5, Math.abs(diff) * .6);
            // Gentle rubber band keeps the pack in sight.
            var gap = (d.me.lap * T.length + d.me.prog) - (k.lap * T.length + k.prog);
            k.band = U.clamp(1 + gap * .012, .92, 1.1);
          } else {
            throttle = inp.down('up') ? 1 : (inp.down('down') ? -1 : 0);
            steer = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
            drift = inp.down('action');
            if (inp.pdown) { throttle = 1; steer = inp.px < W / 2 ? -1 : 1; }
            k.band = 1;
          }

          var onRoad = trackDist(d, k.x, k.y) < ROAD / 2 + 8;
          var boosting = k.boost > 0;
          var maxV = (onRoad ? 350 : 150) * k.skill * (k.band || 1) + (boosting ? 130 : 0);
          var accel = throttle > 0 ? (boosting ? 520 : 310) : (throttle < 0 ? -340 : -80);
          k.v = U.clamp(k.v + accel * dt, -70, maxV);
          if (k.v > maxV) k.v = maxV;

          // Drift: extra steering authority, the kart slides wide, sparks charge.
          var wasDrifting = k.drifting;
          k.drifting = !k.ai && drift && Math.abs(steer) > 0 && k.v > 150 && onRoad;
          if (k.drifting) {
            if (!wasDrifting) { k.driftDir = steer > 0 ? 1 : -1; k.charge = 0; }
            k.charge += dt * (1 + Math.abs(steer) * .6);
            k.slide += (k.driftDir * .5 - k.slide) * Math.min(1, dt * 6);
            k.a += steer * 3.4 * dt;
          } else {
            if (wasDrifting && !k.ai) {
              // Release: cash the sparks in for a boost.
              var t2 = k.charge >= 2 ? 1.5 : k.charge >= 1 ? .95 : k.charge >= .45 ? .5 : 0;
              if (t2 > 0) { k.boost = t2; Milo.sound.powerup(); }
              k.charge = 0;
            }
            k.slide += (0 - k.slide) * Math.min(1, dt * 8);
            var grip = U.clamp(k.v / 130, 0, 1);
            k.a += steer * 2.4 * grip * dt * (k.v < 0 ? -1 : 1);
          }
          if (k.boost > 0) k.boost -= dt;

          var move = k.a - k.slide;
          k.x += Math.cos(move) * k.v * dt;
          k.y += Math.sin(move) * k.v * dt;

          // Spark + boost flame particles.
          if (k.drifting && Math.random() < .8) {
            var sc = k.charge >= 2 ? '#c084fc' : k.charge >= 1 ? '#fb923c' : '#22d3ee';
            d.parts.push({
              x: k.x - Math.cos(k.a) * 16, y: k.y - Math.sin(k.a) * 16,
              vx: U.rand(-40, 40), vy: U.rand(-40, 40), t: .3, max: .3, r: 3, col: sc
            });
          }
          if (k.boost > 0 && Math.random() < .9) {
            d.parts.push({
              x: k.x - Math.cos(k.a) * 20, y: k.y - Math.sin(k.a) * 20,
              vx: -Math.cos(k.a) * 120 + U.rand(-30, 30), vy: -Math.sin(k.a) * 120 + U.rand(-30, 30),
              t: .25, max: .25, r: 4, col: U.choice(['#ffd257', '#fb923c', '#fff'])
            });
          }
          if (!onRoad && k.v > 60 && Math.random() < .4) {
            d.parts.push({
              x: k.x, y: k.y, vx: U.rand(-30, 30), vy: U.rand(-50, -10),
              t: .4, max: .4, r: 3, col: '#a3d977'
            });
          }

          // Waypoints and laps.
          var wpt = T[k.wp];
          if (U.dist(k.x, k.y, wpt[0], wpt[1]) < 95) {
            k.wp = (k.wp + 1) % T.length;
            k.prog++;
            if (k.wp === 1) {
              k.lap++;
              if (!k.ai) {
                g.set('Lap', Math.min(k.lap + 1, LAPS) + '/' + LAPS);
                if (k.lap < LAPS) Milo.sound.coin();
              }
              if (k.lap >= LAPS) {
                k.done = true;
                k.place = ++d.finished;
                if (!k.ai) { d.phase = 'finish'; d.finishT = 1.3; Milo.sound.win(); }
              }
            }
          }
        });

        // Bumper-car separation.
        for (var a2 = 0; a2 < 4; a2++) {
          for (var b2 = a2 + 1; b2 < 4; b2++) {
            var k1 = d.karts[a2], k2 = d.karts[b2];
            var dd = U.dist(k1.x, k1.y, k2.x, k2.y);
            if (dd < 32 && dd > .01) {
              var push = (32 - dd) / 2, nx = (k2.x - k1.x) / dd, ny = (k2.y - k1.y) / dd;
              k1.x -= nx * push; k1.y -= ny * push;
              k2.x += nx * push; k2.y += ny * push;
              k1.v *= .94; k2.v *= .94;
              if (!k1.ai || !k2.ai) Milo.sound.click();
            }
          }
        }

        for (var pi = d.parts.length - 1; pi >= 0; pi--) {
          var p = d.parts[pi];
          p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt;
          if (p.t <= 0) d.parts.splice(pi, 1);
        }

        var Tl = T.length;
        var ahead = d.karts.filter(function (k) {
          return k !== d.me && (k.lap * Tl + k.prog) > (d.me.lap * Tl + d.me.prog);
        }).length;
        g.set('Pos', ord(ahead + 1));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, T = track(d), me = d.me;
        var camX = U.clamp(me.x - W / 2, -140, 1180 - W + 140);
        var camY = U.clamp(me.y - H / 2, -140, 1030 - H + 140);

        // Mowed-stripe grass.
        c.fillStyle = '#7ac74f'; c.fillRect(0, 0, W, H);
        c.save();
        c.translate(-camX, -camY);
        c.fillStyle = '#6fb944';
        for (var sy = -200; sy < 1100; sy += 120) c.fillRect(-200, sy, 1500, 60);
        // Flowers.
        for (var fi = 0; fi < 70; fi++) {
          var fx = U.hash2(fi, 1, d.race) * 1400 - 100, fy = U.hash2(fi, 7, d.race) * 1200 - 100;
          if (trackDist(d, fx, fy) < ROAD / 2 + 30) continue;
          c.fillStyle = ['#fff', '#ffd6e8', '#ffe9a8'][fi % 3];
          c.beginPath(); c.arc(fx, fy, 4, 0, TAU); c.fill();
          c.fillStyle = '#ffb703';
          c.beginPath(); c.arc(fx, fy, 1.6, 0, TAU); c.fill();
        }

        function path() {
          c.beginPath();
          c.moveTo(T[0][0], T[0][1]);
          for (var i = 1; i < T.length; i++) c.lineTo(T[i][0], T[i][1]);
          c.closePath();
        }
        c.lineJoin = 'round'; c.lineCap = 'round';
        c.strokeStyle = '#f4ede1'; c.lineWidth = ROAD + 14; path(); c.stroke();
        c.strokeStyle = '#8d93a8'; c.lineWidth = ROAD; path(); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.5)';
        c.lineWidth = 3; c.setLineDash([2, 26]); path(); c.stroke();
        c.setLineDash([]);

        // Red/white curbs at each corner.
        T.forEach(function (pt, i) {
          var prev = T[(i - 1 + T.length) % T.length], next = T[(i + 1) % T.length];
          var a1 = Math.atan2(pt[1] - prev[1], pt[0] - prev[0]);
          var a2 = Math.atan2(next[1] - pt[1], next[0] - pt[0]);
          var turn = ((a2 - a1 + Math.PI * 3) % TAU) - Math.PI;
          if (Math.abs(turn) < .5) return;
          var side = turn > 0 ? -1 : 1;
          var mid = a1 + turn / 2;
          var cx = pt[0] + Math.cos(mid + side * Math.PI / 2) * (ROAD / 2 + 2);
          var cy = pt[1] + Math.sin(mid + side * Math.PI / 2) * (ROAD / 2 + 2);
          c.save();
          c.translate(cx, cy);
          c.rotate(mid);
          for (var s2 = -3; s2 < 3; s2++) {
            c.fillStyle = s2 % 2 ? '#ff5252' : '#fff';
            c.fillRect(s2 * 14, -6, 14, 12);
          }
          c.restore();
        });

        // Start / finish checker.
        var sa = Math.atan2(T[1][1] - T[0][1], T[1][0] - T[0][0]);
        c.save();
        c.translate(T[0][0], T[0][1]);
        c.rotate(sa);
        for (var r = 0; r < 6; r++) {
          for (var col2 = 0; col2 < 2; col2++) {
            c.fillStyle = (r + col2) % 2 ? '#fff' : '#23253a';
            c.fillRect(col2 * 9 - 9, -ROAD / 2 + r * (ROAD / 6), 9, ROAD / 6);
          }
        }
        c.restore();

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.t / p.max);
          c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, p.r, 0, TAU); c.fill();
        });
        c.globalAlpha = 1;

        // Karts: stubby bodies, fat tyres, helmeted drivers.
        d.karts.forEach(function (k) {
          c.save();
          c.translate(k.x, k.y);
          c.rotate(k.a + k.slide * .7);
          c.fillStyle = 'rgba(0,0,0,.3)';
          U.roundRect(c, -13, -10, 28, 20, 6); c.fill();
          c.fillStyle = '#23253a';
          c.fillRect(-14, -13, 9, 6); c.fillRect(-14, 7, 9, 6);
          c.fillRect(6, -13, 9, 6); c.fillRect(6, 7, 9, 6);
          c.fillStyle = k.col;
          if (!k.ai) { c.shadowColor = k.col; c.shadowBlur = 12; }
          U.roundRect(c, -14, -9, 30, 18, 7); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#fff';
          c.fillRect(10, -6, 5, 12);
          c.fillStyle = k.helm;
          c.beginPath(); c.arc(-1, 0, 6.5, 0, TAU); c.fill();
          c.fillStyle = 'rgba(20,22,40,.85)';
          c.fillRect(2, -3, 4, 6);
          c.restore();
        });
        c.restore();

        // Minimap.
        var mm = { x: W - 130, y: 14, s: .095 };
        c.fillStyle = 'rgba(12,16,30,.45)';
        U.roundRect(c, mm.x - 8, mm.y - 4, 124, 112, 10); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 3; c.lineJoin = 'round';
        c.beginPath();
        c.moveTo(mm.x + T[0][0] * mm.s, mm.y + T[0][1] * mm.s);
        for (var mi = 1; mi < T.length; mi++) c.lineTo(mm.x + T[mi][0] * mm.s, mm.y + T[mi][1] * mm.s);
        c.closePath(); c.stroke();
        d.karts.forEach(function (k) {
          c.fillStyle = k.col;
          c.beginPath(); c.arc(mm.x + k.x * mm.s, mm.y + k.y * mm.s, k.ai ? 3 : 4.5, 0, TAU); c.fill();
        });

        // Drift charge meter.
        if (me.drifting || me.boost > 0) {
          var cw = 110, cx2 = W / 2 - cw / 2, cy2 = H - 46;
          c.fillStyle = 'rgba(12,16,30,.5)';
          U.roundRect(c, cx2 - 6, cy2 - 5, cw + 12, 20, 8); c.fill();
          var f = me.boost > 0 ? 1 : Math.min(1, me.charge / 2);
          c.fillStyle = me.boost > 0 ? '#ffd257' : (me.charge >= 2 ? '#c084fc' : me.charge >= 1 ? '#fb923c' : '#22d3ee');
          U.roundRect(c, cx2, cy2, Math.max(4, cw * f), 10, 5); c.fill();
          c.fillStyle = 'rgba(255,255,255,.85)';
          c.font = '800 10px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(me.boost > 0 ? 'BOOST!' : 'DRIFT', W / 2, cy2 + 24);
        }

        // Track name during countdown.
        if (d.phase === 'count') {
          c.fillStyle = 'rgba(10,14,28,.45)'; c.fillRect(0, 0, W, H);
          c.textAlign = 'center';
          c.fillStyle = '#ffd257';
          c.font = '800 26px Outfit, sans-serif';
          c.fillText('Race ' + (d.race + 1) + ' — ' + CUPS[d.race].name, W / 2, H / 2 - 70);
          c.fillStyle = '#fff';
          c.font = '800 96px Outfit, sans-serif';
          var n = Math.ceil(d.countdown - .4);
          c.fillText(n > 0 ? n : 'GO!', W / 2, H / 2 + 40);
        }

        if (d.phase === 'finish') {
          c.textAlign = 'center';
          c.fillStyle = '#fff';
          c.font = '800 64px Outfit, sans-serif';
          c.fillText('FINISH!', W / 2, H / 2);
        }

        if (d.phase === 'results') {
          c.fillStyle = 'rgba(10,14,28,.72)'; c.fillRect(0, 0, W, H);
          c.textAlign = 'center';
          c.fillStyle = '#ffd257';
          c.font = '800 30px Outfit, sans-serif';
          c.fillText(CUPS[d.race].name + ' — results', W / 2, 150);
          c.font = '700 22px Outfit, sans-serif';
          d.results.forEach(function (row, i) {
            var y = 210 + i * 52;
            c.fillStyle = 'rgba(255,255,255,.08)';
            U.roundRect(c, W / 2 - 220, y - 30, 440, 42, 10); c.fill();
            c.fillStyle = row.kart.col;
            c.beginPath(); c.arc(W / 2 - 185, y - 9, 9, 0, TAU); c.fill();
            c.fillStyle = row.kart.ai ? '#c7cff0' : '#fff';
            c.textAlign = 'left';
            c.fillText(ord(i + 1) + '  ' + row.kart.name, W / 2 - 160, y);
            c.textAlign = 'right';
            c.fillText('+' + row.pts + '  (' + row.total + ')', W / 2 + 200, y);
            c.textAlign = 'center';
          });
          c.fillStyle = 'rgba(255,255,255,.7)';
          c.font = '700 15px Outfit, sans-serif';
          c.fillText(d.race >= 2 ? 'Tap for the final standings' : 'Tap for the next circuit', W / 2, 460);
        }

        // Mini standings during race.
        if (d.phase === 'race') {
          var Tl = T.length;
          var order = d.karts.slice().sort(function (a, b) {
            return (b.lap * Tl + b.prog) - (a.lap * Tl + a.prog);
          });
          c.font = '700 12px Outfit, sans-serif';
          c.textAlign = 'left';
          order.forEach(function (k, i) {
            c.fillStyle = 'rgba(12,16,30,.5)';
            U.roundRect(c, 12, H - 100 + i * 22, 108, 19, 6); c.fill();
            c.fillStyle = k.col;
            c.fillRect(17, H - 95 + i * 22, 8, 9);
            c.fillStyle = k.ai ? '#e6e9f8' : '#fff';
            c.fillText((i + 1) + '. ' + k.name, 31, H - 86 + i * 22);
          });
        }
      }
    });
  }

  window.Milo.register({
    id: 'kart-sprint', title: 'Kart Sprint', emo: '🏁', category: 'Racing',
    tagline: 'Drift-charge a three-race cup',
    description: 'A candy-bright cup over three hand-made circuits — Sunny Loop, Snake ' +
      'Valley and the drift-happy Hairpin Ridge — three laps each against Bip, Zola and ' +
      'Rex. Hold Space through a corner to drift: the sparks charge cyan, orange, then ' +
      'purple, and releasing pays out a matching speed boost. Cup points are 10-7-4-2 a ' +
      'race, so one bad finish can be clawed back on the next circuit.',
    controls: ['↑ gas', '↓ brake', '← → steer', 'Space drift'],
    colors: ['#7ac74f', '#ff4f79'],
    tags: ['karting', 'drift', 'racing', 'cup', 'ai opponents'],
    mount: mount
  });
})();
