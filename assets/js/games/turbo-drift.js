/* Turbo Drift — top-down circuit racing against three rivals, three laps. */
(function () {
  'use strict';
  var W = 900, H = 600;
  var ROAD = 96, LAPS = 3;

  // Closed circuit, in world coordinates.
  var TRACK = [
    [220, 200], [430, 140], [660, 170], [880, 260], [1030, 430], [1000, 640],
    [820, 760], [600, 780], [420, 720], [330, 560], [200, 480], [130, 330]
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.cars = [];
      for (var i = 0; i < 4; i++) {
        var p = startPos(i);
        d.cars.push({
          x: p.x, y: p.y, a: p.a, v: 0,
          ai: i > 0,
          wp: 1, lap: 0, prog: 0,
          col: ['#22d3ee', '#fb7185', '#ffd257', '#a78bfa'][i],
          name: ['You', 'Rossi', 'Vega', 'Kade'][i],
          skill: i === 0 ? 1 : U.rand(.88, .99),
          drift: 0
        });
      }
      d.me = d.cars[0];
      d.time = 0;
      d.finished = false;
      d.place = 1;
      d.smoke = [];
      d.countdown = 3;
      g.set('Lap', '0/' + LAPS);
      g.set('Place', '1st');
      g.set('Speed', '0');
    }

    function startPos(i) {
      var a = Math.atan2(TRACK[1][1] - TRACK[0][1], TRACK[1][0] - TRACK[0][0]);
      var nx = -Math.sin(a), ny = Math.cos(a);
      var lane = (i % 2 ? 1 : -1) * 26;
      var back = Math.floor(i / 2) * 46;
      return {
        x: TRACK[0][0] + nx * lane - Math.cos(a) * back,
        y: TRACK[0][1] + ny * lane - Math.sin(a) * back,
        a: a
      };
    }

    /** Distance from a point to the nearest point on the track centreline. */
    function trackDist(x, y) {
      var best = 1e9;
      for (var i = 0; i < TRACK.length; i++) {
        var a = TRACK[i], b = TRACK[(i + 1) % TRACK.length];
        var vx = b[0] - a[0], vy = b[1] - a[1];
        var t = U.clamp(((x - a[0]) * vx + (y - a[1]) * vy) / (vx * vx + vy * vy), 0, 1);
        var dx = a[0] + vx * t - x, dy = a[1] + vy * t - y;
        best = Math.min(best, Math.hypot(dx, dy));
      }
      return best;
    }

    function advanceWaypoints(g, car) {
      var d = g.data;
      var wp = TRACK[car.wp];
      if (U.dist(car.x, car.y, wp[0], wp[1]) < 92) {
        car.wp = (car.wp + 1) % TRACK.length;
        car.prog++;
        if (car.wp === 1) {
          car.lap++;
          if (!car.ai) {
            g.set('Lap', Math.min(car.lap, LAPS) + '/' + LAPS);
            if (car.lap <= LAPS) Milo.sound.powerup();
          }
          if (car.lap >= LAPS && !d.finished && !car.ai) finish(g);
          else if (car.lap >= LAPS && car.ai) car.done = true;
        }
      }
    }

    function finish(g) {
      var d = g.data;
      d.finished = true;
      var ahead = d.cars.filter(function (c) {
        return c.ai && (c.lap * TRACK.length + c.prog) > (d.me.lap * TRACK.length + d.me.prog);
      }).length;
      var place = ahead + 1;
      var bonus = [3000, 1800, 900, 400][place - 1] || 200;
      var score = Math.max(100, bonus + Math.round(Math.max(0, 180 - d.time) * 20));
      var suffix = ['st', 'nd', 'rd', 'th'][place - 1] || 'th';
      g.win({
        emo: place === 1 ? '🏆' : '🏁',
        title: place === 1 ? 'You won!' : 'Finished ' + place + suffix,
        text: LAPS + ' laps in ' + d.time.toFixed(1) + 's.',
        score: score
      });
    }

    return Milo.arcade(host, {
      id: 'turbo-drift',
      w: W, h: H, bg: '#0d1226',
      stats: ['Lap', 'Place', 'Speed'],
      touch: 'dpad',
      emo: '🏎️',
      start: {
        title: 'Turbo Drift',
        text: 'Three laps against three rivals. Stay on the tarmac — the grass ' +
          'will scrub your speed off in a hurry.',
        keys: ['↑ accelerate', '↓ brake', '← → steer']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input;

        if (d.countdown > 0) {
          d.countdown -= dt;
          if (d.countdown <= 0) Milo.sound.win();
          return;
        }

        d.time += dt;

        d.cars.forEach(function (car) {
          if (car.done) return;
          var throttle = 0, steer = 0;

          if (car.ai) {
            var wp = TRACK[car.wp];
            var want = Math.atan2(wp[1] - car.y, wp[0] - car.x);
            var diff = ((want - car.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
            steer = U.clamp(diff * 2.4, -1, 1);
            throttle = 1 - Math.min(.55, Math.abs(diff) * .7);
          } else {
            throttle = (i.down('up') ? 1 : 0) - (i.down('down') ? 1 : 0);
            steer = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
            if (i.pdown) {
              // Pointer steering: left/right half of the screen.
              throttle = 1;
              steer = i.px < W / 2 ? -1 : 1;
            }
          }

          var onRoad = trackDist(car.x, car.y) < ROAD / 2;
          var maxV = (onRoad ? 330 : 145) * car.skill;
          var accel = throttle > 0 ? 260 : (throttle < 0 ? -320 : -70);
          car.v += accel * dt;
          car.v = U.clamp(car.v, -80, maxV);
          if (!onRoad) car.v = Math.min(car.v, maxV);

          // Steering authority scales with speed, so you can't spin on the spot.
          var grip = U.clamp(car.v / 140, 0, 1);
          car.a += steer * 2.5 * grip * dt * (car.v < 0 ? -1 : 1);
          car.drift = Math.abs(steer) * grip * (car.v / maxV);

          car.x += Math.cos(car.a) * car.v * dt;
          car.y += Math.sin(car.a) * car.v * dt;

          if (car.drift > .55 && Math.random() < .5) {
            d.smoke.push({ x: car.x, y: car.y, life: .5, max: .5 });
          }

          advanceWaypoints(g, car);
        });

        // Nudge cars apart so they don't stack on top of each other.
        for (var a = 0; a < d.cars.length; a++) {
          for (var b = a + 1; b < d.cars.length; b++) {
            var c1 = d.cars[a], c2 = d.cars[b];
            var dist = U.dist(c1.x, c1.y, c2.x, c2.y);
            if (dist < 34 && dist > 0.01) {
              var push = (34 - dist) / 2;
              var nx = (c2.x - c1.x) / dist, ny = (c2.y - c1.y) / dist;
              c1.x -= nx * push; c1.y -= ny * push;
              c2.x += nx * push; c2.y += ny * push;
              c1.v *= .93; c2.v *= .93;
              if (!c1.ai || !c2.ai) Milo.sound.hit();
            }
          }
        }

        d.smoke = d.smoke.filter(function (s) { s.life -= dt; return s.life > 0; });

        var ahead = d.cars.filter(function (c) {
          return c.ai && (c.lap * TRACK.length + c.prog) > (d.me.lap * TRACK.length + d.me.prog);
        }).length;
        d.place = ahead + 1;
        g.set('Place', d.place + (['st', 'nd', 'rd', 'th'][d.place - 1] || 'th'));
        g.set('Speed', Math.round(Math.abs(d.me.v) * 0.6));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, me = d.me;
        c.fillStyle = '#12331f'; c.fillRect(0, 0, W, H);

        var camX = U.clamp(me.x - W / 2, -120, 1160 - W + 120);
        var camY = U.clamp(me.y - H / 2, -120, 900 - H + 120);
        c.save();
        c.translate(-camX, -camY);

        // grass texture
        c.strokeStyle = 'rgba(255,255,255,.03)';
        c.lineWidth = 1;
        c.beginPath();
        for (var gx = -100; gx < 1200; gx += 40) { c.moveTo(gx, -100); c.lineTo(gx, 900); }
        for (var gy = -100; gy < 900; gy += 40) { c.moveTo(-100, gy); c.lineTo(1200, gy); }
        c.stroke();

        function path() {
          c.beginPath();
          c.moveTo(TRACK[0][0], TRACK[0][1]);
          for (var i = 1; i < TRACK.length; i++) c.lineTo(TRACK[i][0], TRACK[i][1]);
          c.closePath();
        }

        c.lineJoin = 'round'; c.lineCap = 'round';
        c.strokeStyle = '#e2e8f0'; c.lineWidth = ROAD + 10; path(); c.stroke();
        c.strokeStyle = '#26293f'; c.lineWidth = ROAD; path(); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.30)';
        c.lineWidth = 3; c.setLineDash([16, 22]); path(); c.stroke();
        c.setLineDash([]);

        // start/finish line
        var sa = Math.atan2(TRACK[1][1] - TRACK[0][1], TRACK[1][0] - TRACK[0][0]);
        c.save();
        c.translate(TRACK[0][0], TRACK[0][1]);
        c.rotate(sa);
        for (var r = 0; r < 6; r++) {
          for (var col = 0; col < 2; col++) {
            c.fillStyle = (r + col) % 2 ? '#fff' : '#1a1c2e';
            c.fillRect(col * 9 - 9, -ROAD / 2 + r * (ROAD / 6), 9, ROAD / 6);
          }
        }
        c.restore();

        d.smoke.forEach(function (s) {
          c.globalAlpha = s.life / s.max * .32;
          c.fillStyle = '#dfe6ff';
          c.beginPath(); c.arc(s.x, s.y, 9 * (1.6 - s.life / s.max), 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        d.cars.forEach(function (car) {
          c.save();
          c.translate(car.x, car.y);
          c.rotate(car.a);
          c.fillStyle = 'rgba(0,0,0,.35)';
          U.roundRect(c, -15, -9, 32, 18, 4); c.fill();
          c.fillStyle = car.col;
          if (!car.ai) { c.shadowColor = car.col; c.shadowBlur = 14; }
          U.roundRect(c, -16, -10, 32, 20, 5); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = 'rgba(10,14,32,.75)';
          U.roundRect(c, -4, -7, 11, 14, 3); c.fill();
          c.fillStyle = '#0b0e1a';
          c.fillRect(-13, -12, 7, 4); c.fillRect(-13, 8, 7, 4);
          c.fillRect(8, -12, 7, 4); c.fillRect(8, 8, 7, 4);
          c.restore();
        });
        c.restore();

        if (d.countdown > 0) {
          c.fillStyle = 'rgba(4,6,18,.55)';
          c.fillRect(0, 0, W, H);
          c.fillStyle = '#fff';
          c.font = '800 96px Outfit, sans-serif';
          c.textAlign = 'center';
          var n = Math.ceil(d.countdown);
          c.fillText(n > 0 ? n : 'GO!', W / 2, H / 2 + 30);
        }

        // mini leaderboard
        c.font = '700 12px Outfit, sans-serif';
        c.textAlign = 'left';
        var order = d.cars.slice().sort(function (a, b) {
          return (b.lap * TRACK.length + b.prog) - (a.lap * TRACK.length + a.prog);
        });
        order.forEach(function (car, i) {
          c.fillStyle = 'rgba(8,10,26,.6)';
          U.roundRect(c, 12, H - 96 + i * 21, 118, 18, 5); c.fill();
          c.fillStyle = car.col;
          c.fillRect(17, H - 92 + i * 21, 8, 10);
          c.fillStyle = car.ai ? '#c7cff0' : '#fff';
          c.fillText((i + 1) + '. ' + car.name + '  L' + Math.min(LAPS, car.lap + 1),
            31, H - 83 + i * 21);
        });
      }
    });
  }

  window.Milo.register({
    id: 'turbo-drift', title: 'Turbo Drift', emo: '🏎️', category: 'Racing',
    tagline: 'Three laps, three rivals, one line',
    description: 'A top-down circuit race. Your car steers better the faster it goes, ' +
      'but leave the tarmac and the grass will drag you down to a crawl. Three rivals ' +
      'race the same line — finishing first is worth far more than finishing fast.',
    controls: ['↑ accelerate', '↓ brake', '← → steer'],
    colors: ['#22d3ee', '#ef4444'],
    featured: true,
    tags: ['racing', 'cars', 'laps', 'ai opponents'],
    mount: mount
  });
})();
