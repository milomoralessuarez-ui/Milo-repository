/* Barrel Climb — up the girders, under the barrels, to the top. */
(function () {
  'use strict';
  var W = 640, H = 640;
  var FLOORS = 5, FLOOR_H = 108, GROUND = H - 40;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.level = 1;
      startLevel(d);
      d.lives = 3;
      g.set('Score', 0);
      g.set('Lives', 3);
      g.set('Level', 1);
    }

    function startLevel(d) {
      d.floors = [];
      for (var f = 0; f < FLOORS; f++) {
        var y = GROUND - f * FLOOR_H;
        var tilt = f % 2 ? -1 : 1;                  // girders slope alternately
        d.floors.push({ y: y, tilt: tilt });
      }
      d.ladders = [];
      for (var k = 0; k < FLOORS - 1; k++) {
        var x = k % 2 ? U.rand(90, 190) : U.rand(W - 200, W - 100);
        d.ladders.push({ x: x, y: GROUND - k * FLOOR_H, h: FLOOR_H });
      }
      d.p = { x: 70, y: GROUND - 20, vy: 0, onGround: true, onLadder: false, face: 1 };
      d.barrels = [];
      d.spawn = 1.4;
      d.goal = { x: W - 90, y: GROUND - (FLOORS - 1) * FLOOR_H - 22 };
      d.hammer = { x: W / 2, y: GROUND - 2 * FLOOR_H - 20, taken: false };
      d.hammerT = 0;
      d.parts = [];
    }

    function floorYAt(d, x, idx) {
      var f = d.floors[idx];
      if (!f) return null;
      return f.y - f.tilt * (x - W / 2) * 0.06;
    }

    function floorUnder(d, x, y) {
      for (var i = 0; i < d.floors.length; i++) {
        var fy = floorYAt(d, x, i);
        if (y >= fy - 26 && y <= fy + 16) return { idx: i, y: fy };
      }
      return null;
    }

    function onLadder(d, x, y) {
      return d.ladders.some(function (l) {
        return Math.abs(x - l.x) < 18 && y <= l.y + 6 && y >= l.y - l.h - 6;
      });
    }

    function hurt(g) {
      var d = g.data;
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      Milo.sound.explode();
      for (var i = 0; i < 20; i++) {
        var a = Math.random() * 6.28, s = U.rand(50, 240);
        d.parts.push({ x: d.p.x, y: d.p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .6, max: .6, col: '#22d3ee' });
      }
      if (d.lives <= 0) {
        g.gameOver({ text: 'You reached level ' + d.level + '.' });
        return;
      }
      d.p.x = 70;
      d.p.y = GROUND - 20;
      d.p.vy = 0;
      d.barrels = [];
    }

    return Milo.arcade(host, {
      id: 'barrel-climb',
      w: W, h: H, bg: '#12081a',
      stats: ['Score', 'Lives', 'Level'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'JUMP' }],
      emo: '🦍',
      start: {
        title: 'Barrel Climb',
        text: 'Climb the girders to the top while barrels roll down at you. Jump them for ' +
          'points, or grab the hammer and smash them.',
        keys: ['← → move', '↑ ↓ ladders', 'Space jump']
      },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        if ((e.code === 'Space') && d.p.onGround && !d.p.onLadder) {
          d.p.vy = -420;
          d.p.onGround = false;
          Milo.sound.jump();
        }
      },

      update: function (g, dt) {
        var d = g.data, p = d.p, i = g.input;

        p.onLadder = onLadder(d, p.x, p.y);
        var move = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
        if (move) p.face = move;
        p.x = U.clamp(p.x + move * 150 * dt, 16, W - 16);

        if (p.onLadder && (i.down('up') || i.down('down'))) {
          p.y += ((i.down('up') ? -1 : 1)) * 120 * dt;
          p.vy = 0;
          p.onGround = true;
        } else {
          if (i.down('action') && p.onGround) { p.vy = -420; p.onGround = false; Milo.sound.jump(); }
          p.vy += 1200 * dt;
          p.y += p.vy * dt;
          var f = floorUnder(d, p.x, p.y);
          if (f && p.vy >= 0) { p.y = f.y; p.vy = 0; p.onGround = true; }
          else if (!p.onLadder) p.onGround = false;
        }
        if (p.y > GROUND) { p.y = GROUND; p.vy = 0; p.onGround = true; }

        d.hammerT = Math.max(0, d.hammerT - dt);
        if (!d.hammer.taken && U.dist(p.x, p.y - 12, d.hammer.x, d.hammer.y) < 26) {
          d.hammer.taken = true;
          d.hammerT = 8;
          Milo.sound.powerup();
        }

        d.spawn -= dt;
        if (d.spawn <= 0) {
          d.spawn = Math.max(0.7, 1.8 - d.level * 0.12);
          d.barrels.push({ x: 60, y: GROUND - (FLOORS - 1) * FLOOR_H - 16, vx: 90, vy: 0, floor: FLOORS - 1, spin: 0 });
        }

        for (var b = d.barrels.length - 1; b >= 0; b--) {
          var br = d.barrels[b];
          br.vy += 900 * dt;
          br.x += br.vx * dt;
          br.y += br.vy * dt;
          br.spin += br.vx * dt * 0.06;
          var bf = floorUnder(d, br.x, br.y);
          if (bf && br.vy >= 0) {
            br.y = bf.y;
            br.vy = 0;
            // Roll downhill along whichever way the girder tilts.
            br.vx = d.floors[bf.idx].tilt > 0 ? 110 : -110;
            br.floor = bf.idx;
          }
          if (br.x < -40 || br.x > W + 40 || br.y > H + 60) { d.barrels.splice(b, 1); continue; }

          var dist = U.dist(br.x, br.y - 10, p.x, p.y - 14);
          if (dist < 24) {
            if (d.hammerT > 0) {
              d.barrels.splice(b, 1);
              g.score += 150;
              g.set('Score', U.fmt(g.score));
              Milo.sound.explode();
              continue;
            }
            hurt(g);
            return;
          }
          // Points for jumping one cleanly.
          if (!br.scored && Math.abs(br.x - p.x) < 16 && p.y < br.y - 18) {
            br.scored = true;
            g.score += 100;
            g.set('Score', U.fmt(g.score));
            Milo.sound.coin();
          }
        }

        if (U.dist(p.x, p.y - 14, d.goal.x, d.goal.y) < 34) {
          d.level++;
          g.score += 500;
          g.set('Score', U.fmt(g.score));
          g.set('Level', d.level);
          Milo.sound.win();
          startLevel(d);
        }

        d.parts = d.parts.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 600 * dt; q.life -= dt;
          return q.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1f0f2e'); bg.addColorStop(1, '#0a0512');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        d.floors.forEach(function (f, i) {
          c.strokeStyle = '#e5484d'; c.lineWidth = 10; c.lineCap = 'round';
          c.beginPath();
          c.moveTo(0, floorYAt(d, 0, i) + 8);
          c.lineTo(W, floorYAt(d, W, i) + 8);
          c.stroke();
          c.strokeStyle = 'rgba(255,255,255,.10)'; c.lineWidth = 2;
          c.beginPath();
          for (var x = 10; x < W; x += 30) {
            c.moveTo(x, floorYAt(d, x, i) + 4);
            c.lineTo(x + 14, floorYAt(d, x + 14, i) + 12);
          }
          c.stroke();
        });

        d.ladders.forEach(function (l) {
          c.strokeStyle = '#38bdf8'; c.lineWidth = 4;
          c.beginPath();
          c.moveTo(l.x - 12, l.y); c.lineTo(l.x - 12, l.y - l.h);
          c.moveTo(l.x + 12, l.y); c.lineTo(l.x + 12, l.y - l.h);
          c.stroke();
          c.lineWidth = 3;
          c.beginPath();
          for (var y = l.y - 10; y > l.y - l.h; y -= 18) {
            c.moveTo(l.x - 12, y); c.lineTo(l.x + 12, y);
          }
          c.stroke();
        });

        if (!d.hammer.taken) {
          c.font = '26px serif';
          c.textAlign = 'center';
          c.fillText('🔨', d.hammer.x, d.hammer.y);
        }

        c.font = '30px serif';
        c.textAlign = 'center';
        c.fillText('🦍', 60, GROUND - (FLOORS - 1) * FLOOR_H - 14);
        c.fillText('🏆', d.goal.x, d.goal.y + 10);

        d.barrels.forEach(function (br) {
          c.save();
          c.translate(br.x, br.y - 10);
          c.rotate(br.spin);
          c.fillStyle = '#b45309';
          U.roundRect(c, -13, -10, 26, 20, 6); c.fill();
          c.strokeStyle = '#78350f'; c.lineWidth = 2;
          c.beginPath();
          c.moveTo(-13, -3); c.lineTo(13, -3);
          c.moveTo(-13, 4); c.lineTo(13, 4);
          c.stroke();
          c.restore();
        });

        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.fillRect(q.x - 3, q.y - 3, 6, 6);
        });
        c.globalAlpha = 1;

        var p = d.p;
        c.fillStyle = d.hammerT > 0 ? '#ffd257' : '#22d3ee';
        U.roundRect(c, p.x - 10, p.y - 28, 20, 28, 6); c.fill();
        c.fillStyle = '#e9f4ff';
        c.beginPath(); c.arc(p.x, p.y - 22, 6, 0, 7); c.fill();
        if (d.hammerT > 0) {
          c.font = '18px serif';
          c.fillText('🔨', p.x + p.face * 14, p.y - 22);
          c.fillStyle = '#ffd257';
          c.font = '700 12px Outfit, sans-serif';
          c.fillText(d.hammerT.toFixed(1) + 's', p.x, p.y - 36);
        }
      }
    });
  }

  window.Milo.register({
    id: 'barrel-climb', title: 'Barrel Climb', emo: '🦍', category: 'Action',
    tagline: 'Up the girders, under the barrels',
    description: 'Climb five sloping girders to the trophy at the top while barrels roll ' +
      'down from the ape. Girders tilt alternately, so barrels zig-zag down the level rather ' +
      'than falling straight. Jumping a barrel cleanly is worth 100; grabbing the hammer ' +
      'lets you smash them for 150 apiece, but only for eight seconds.',
    controls: ['← → move', '↑ ↓ ladders', 'Space jump'],
    colors: ['#12081a', '#e5484d'],
    tags: ['classic', 'platformer', 'climbing', 'arcade'],
    mount: mount
  });
})();
