/* Night Rider — a neon motorbike weaving through night traffic. */
(function () {
  'use strict';
  var W = 480, H = 720;
  var ROAD_L = 68, ROAD_R = 412, LANES = 4;
  var LANE_W = (ROAD_R - ROAD_L) / LANES;
  var CAR_COLS = ['#f43f5e', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6'];

  function laneX(i) { return ROAD_L + LANE_W * (i + .5); }

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.bike = { x: laneX(1), y: 570, vx: 0, w: 24, h: 52 };
      d.v = 320;
      d.dist = 0;
      d.cars = [];
      d.spawnT = 1.1;
      d.sinceWall = 0;
      d.near = 0;
      d.bonus = 0;
      d.parts = [];
      d.texts = [];
      d.shake = 0;
      d.dead = false;
      d.boostGlow = 0;
      g.set('Score', 0);
      g.set('Near', 0);
      g.set('Best', U.fmt(g.best));
    }

    function spawnCar(d, lane, y, extraV) {
      d.cars.push({
        lane: lane, x: laneX(lane), y: y,
        v: U.rand(140, 300) + (extraV || 0),
        w: 52, h: 86,
        col: U.choice(CAR_COLS),
        nm: false, dead: false
      });
    }

    function spawnWave(d) {
      // either a lone car or a wall with one gap
      d.sinceWall += 1;
      var wallChance = Math.min(.4, .12 + d.dist / 30000);
      if (d.sinceWall > 2 && Math.random() < wallChance) {
        d.sinceWall = 0;
        var gap = U.randInt(0, LANES - 1);
        var v = U.rand(150, 220);
        for (var i = 0; i < LANES; i++) {
          if (i !== gap) spawnCar(d, i, U.rand(-260, -160), v - U.rand(130, 300));
        }
        // wall cars roll together
        for (var k = d.cars.length - 3; k < d.cars.length; k++) {
          if (d.cars[k]) d.cars[k].v = v;
        }
      } else {
        var lane = U.randInt(0, LANES - 1);
        // avoid stacking directly on a fresh car in the same lane
        for (var j = 0; j < d.cars.length; j++) {
          if (d.cars[j].lane === lane && d.cars[j].y < -20) { lane = (lane + 1) % LANES; break; }
        }
        spawnCar(d, lane, U.rand(-200, -120));
      }
    }

    function crash(g) {
      var d = g.data;
      d.dead = true;
      d.shake = 16;
      for (var k = 0; k < 30; k++) {
        var a = Math.random() * 6.283, s = U.rand(60, 380);
        d.parts.push({
          x: d.bike.x, y: d.bike.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60,
          life: U.rand(.4, .9), max: .9,
          col: Math.random() < .4 ? '#fff' : (Math.random() < .5 ? '#f472b6' : '#22d3ee')
        });
      }
      Milo.sound.hit();
      Milo.sound.explode();
      g.gameOver({
        text: U.fmt(Math.floor(d.dist / 10)) + ' m through traffic, ' +
          d.near + ' near-miss' + (d.near === 1 ? '' : 'es') + '.'
      });
    }

    return Milo.arcade(host, {
      id: 'night-rider',
      w: W, h: H, bg: '#070912',
      stats: ['Score', 'Near', 'Best'],
      touch: 'dpad',
      emo: '🏍️',
      start: {
        title: 'Night Rider',
        text: 'Weave the bike through night traffic. Skimming past a car without ' +
          'touching it scores a near-miss bonus — the closer the call, the better ' +
          'you’ll feel about it. Traffic packs tighter the further you ride.',
        keys: ['← → weave', '↑ throttle  ↓ brake']
      },
      init: reset,
      onPointer: function (g, type, x) {
        g.data.ptr = type === 'up' ? null : x;
      },

      update: function (g, dt) {
        var d = g.data, b = d.bike, i = g.input, k;
        if (d.dead) {
          for (k = d.parts.length - 1; k >= 0; k--) {
            var q = d.parts[k];
            q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
            if (q.life <= 0) d.parts.splice(k, 1);
          }
          d.shake = Math.max(0, d.shake - dt * 40);
          return;
        }

        // speed: ramps on its own, throttle/brake tweak it
        var base = 320 + Math.min(400, d.dist / 55);
        var adj = (i.down('up') ? 150 : 0) - (i.down('down') ? 130 : 0);
        d.v += ((base + adj) - d.v) * Math.min(1, 3 * dt);
        d.dist += d.v * dt;
        d.boostGlow = i.down('up') ? Math.min(1, d.boostGlow + 4 * dt) : Math.max(0, d.boostGlow - 3 * dt);

        // steering
        var steer = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
        if (d.ptr != null) {
          b.x += (U.clamp(d.ptr, ROAD_L + 16, ROAD_R - 16) - b.x) * Math.min(1, 12 * dt);
          b.vx = 0;
        } else {
          b.vx += steer * 2600 * dt;
          b.vx *= Math.pow(.002, dt);
          b.vx = U.clamp(b.vx, -430, 430);
          b.x += b.vx * dt;
        }
        b.x = U.clamp(b.x, ROAD_L + 14, ROAD_R - 14);

        // traffic
        d.spawnT -= dt;
        if (d.spawnT <= 0) {
          spawnWave(d);
          d.spawnT = Math.max(.34, 1.05 - d.dist / 26000) * U.rand(.8, 1.2);
        }

        for (k = d.cars.length - 1; k >= 0; k--) {
          var car = d.cars[k];
          car.y += (d.v - car.v) * dt;
          // collision
          if (Math.abs(car.x - b.x) < (car.w + b.w) / 2 - 6 &&
            Math.abs(car.y - b.y) < (car.h + b.h) / 2 - 8) {
            crash(g);
            return;
          }
          // near miss: front of car has just passed the bike's rear
          if (!car.nm && car.y - car.h / 2 > b.y + b.h / 2) {
            car.nm = true;
            var dx = Math.abs(car.x - b.x);
            if (dx < (car.w + b.w) / 2 + 18) {
              d.near++;
              d.bonus += 50;
              g.set('Near', d.near);
              d.texts.push({ x: b.x, y: b.y - 46, t: 'NEAR MISS +50', life: .8, max: .8 });
              for (var s = 0; s < 8; s++) {
                d.parts.push({
                  x: (b.x + car.x) / 2, y: b.y, vx: U.rand(-140, 140), vy: U.rand(-220, -60),
                  life: .4, max: .4, col: '#fef08a'
                });
              }
              Milo.sound.tone({ f: 900, f2: 1500, d: .09, v: .09, type: 'square' });
            }
          }
          if (car.y > H + 140) d.cars.splice(k, 1);
        }

        // taillight trail
        d.parts.push({
          x: b.x + U.rand(-5, 5), y: b.y + 28, vx: 0, vy: d.v * .55,
          life: .3, max: .3, col: d.boostGlow > .5 ? '#67e8f9' : '#fb7185'
        });

        for (k = d.parts.length - 1; k >= 0; k--) {
          var p = d.parts[k];
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          if (p.life <= 0) d.parts.splice(k, 1);
        }
        for (k = d.texts.length - 1; k >= 0; k--) {
          d.texts[k].y -= 40 * dt; d.texts[k].life -= dt;
          if (d.texts[k].life <= 0) d.texts.splice(k, 1);
        }

        g.score = Math.floor(d.dist / 10) + d.bonus;
        g.set('Score', U.fmt(g.score));
        d.shake = Math.max(0, d.shake - dt * 40);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, k;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // night sky strip + skyline behind the road
        c.fillStyle = '#070912'; c.fillRect(-20, -20, W + 40, H + 40);
        var scroll = d.dist;

        // buildings either side, parallax windows
        for (var side = 0; side < 2; side++) {
          var bx = side === 0 ? 0 : ROAD_R + 20;
          var bw = side === 0 ? ROAD_L - 20 : W - bx;
          c.fillStyle = '#0b0e1e';
          c.fillRect(bx, 0, bw, H);
          for (var wy = 0; wy < 15; wy++) {
            for (var wx = 0; wx < 3; wx++) {
              var gy = ((wy * 52 + scroll * .35) % (H + 60)) - 30;
              var hsh = U.hash2(wx + side * 7, wy + Math.floor((scroll * .35 + wy * 52) / (H + 60)) * 31, 5);
              if (hsh < .4) continue;
              c.fillStyle = hsh < .6 ? 'rgba(103,232,249,.5)' : (hsh < .8 ? 'rgba(244,114,182,.5)' : 'rgba(254,240,138,.45)');
              c.fillRect(bx + 8 + wx * (bw / 3), gy, 7, 10);
            }
          }
        }

        // road
        c.fillStyle = '#0c0f1e';
        c.fillRect(ROAD_L - 12, 0, ROAD_R - ROAD_L + 24, H);
        // edge glow lines
        c.shadowColor = '#f472b6'; c.shadowBlur = 10;
        c.fillStyle = '#f472b6';
        c.fillRect(ROAD_L - 8, 0, 3, H);
        c.fillRect(ROAD_R + 5, 0, 3, H);
        c.shadowBlur = 0;
        // lane dashes
        c.fillStyle = 'rgba(34,211,238,.55)';
        for (var l = 1; l < LANES; l++) {
          var lx = ROAD_L + LANE_W * l;
          var off = (scroll * .9) % 64;
          for (var yy = -64; yy < H + 64; yy += 64) {
            c.fillRect(lx - 2, yy + off, 4, 30);
          }
        }

        // headlight cone from the bike
        if (!d.dead) {
          var hg = c.createLinearGradient(0, d.bike.y - 300, 0, d.bike.y);
          hg.addColorStop(0, 'rgba(224,242,254,0)');
          hg.addColorStop(1, 'rgba(224,242,254,.12)');
          c.fillStyle = hg;
          c.beginPath();
          c.moveTo(d.bike.x - 60, d.bike.y - 300);
          c.lineTo(d.bike.x + 60, d.bike.y - 300);
          c.lineTo(d.bike.x + 10, d.bike.y - 10);
          c.lineTo(d.bike.x - 10, d.bike.y - 10);
          c.closePath(); c.fill();
        }

        // cars (seen from behind: taillights face us)
        for (k = 0; k < d.cars.length; k++) {
          var car = d.cars[k];
          c.save();
          c.translate(car.x, car.y);
          c.shadowColor = car.col; c.shadowBlur = 14;
          c.fillStyle = car.col;
          U.roundRect(c, -car.w / 2, -car.h / 2, car.w, car.h, 10); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = 'rgba(0,0,0,.35)';
          U.roundRect(c, -car.w / 2 + 6, -car.h / 2 + 12, car.w - 12, 26, 6); c.fill();
          c.fillStyle = '#fecdd3';
          c.shadowColor = '#f43f5e'; c.shadowBlur = 8;
          c.fillRect(-car.w / 2 + 5, car.h / 2 - 9, 12, 5);
          c.fillRect(car.w / 2 - 17, car.h / 2 - 9, 12, 5);
          c.shadowBlur = 0;
          c.restore();
        }

        // particles under the bike layer
        for (k = 0; k < d.parts.length; k++) {
          var p = d.parts[k];
          c.globalAlpha = Math.max(0, p.life / p.max) * .9;
          c.fillStyle = p.col;
          c.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
        }
        c.globalAlpha = 1;

        // bike
        if (!d.dead) {
          var b = d.bike;
          c.save();
          c.translate(b.x, b.y);
          c.rotate(U.clamp(b.vx * .0006, -.3, .3));
          c.shadowColor = '#f472b6'; c.shadowBlur = 18;
          c.fillStyle = '#f472b6';
          U.roundRect(c, -9, -26, 18, 52, 8); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#22d3ee';
          U.roundRect(c, -6, -12, 12, 20, 5); c.fill();
          // rider helmet
          c.fillStyle = '#0f172a';
          c.beginPath(); c.arc(0, -4, 7, 0, 7); c.fill();
          c.fillStyle = '#e0f2fe';
          c.shadowColor = '#e0f2fe'; c.shadowBlur = 12;
          c.fillRect(-5, -26, 10, 4);
          c.shadowBlur = 0;
          c.restore();
        }

        // floating texts
        c.font = '800 16px Outfit, sans-serif';
        c.textAlign = 'center';
        for (k = 0; k < d.texts.length; k++) {
          var tx = d.texts[k];
          c.globalAlpha = Math.max(0, tx.life / tx.max);
          c.fillStyle = '#fef08a';
          c.fillText(tx.t, tx.x, tx.y);
        }
        c.globalAlpha = 1;
        c.restore();
      }
    });
  }

  window.Milo.register({
    id: 'night-rider', title: 'Night Rider', emo: '🏍️', category: 'Arcade',
    tagline: 'Thread the neon bike through traffic',
    description: 'Ride a neon motorbike up a four-lane night highway that never ends. ' +
      'Every car you skim past without touching pays a 50-point near-miss bonus, so the ' +
      'best line is always the scariest one. Traffic arrives in walls with a single gap ' +
      'more and more often as your speed climbs — a dab of brake (↓) buys you time to ' +
      'read the gap, but distance is money.',
    controls: ['← →', '↑ ↓', 'Drag to steer'],
    colors: ['#111633', '#f472b6'],
    tags: ['endless', 'dodge', 'driving', 'near miss', 'neon'],
    mount: mount
  });
})();
