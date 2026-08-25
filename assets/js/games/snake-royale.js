/* Snake Royale — slither-style arena: grow longest, don't hit anyone. */
(function () {
  'use strict';
  var AW = 2000, AH = 1500;
  var SEG = 6;                    // spacing between body points
  var NAMES = ['Coil', 'Fang', 'Bolt', 'Mamba', 'Slink', 'Viper', 'Noodle', 'Zigzag', 'Hiss'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function mkSnake(name, x, y, hue, bot) {
      var s = {
        name: name, hue: hue, bot: bot,
        x: x, y: y, a: Math.random() * 6.28,
        len: 30, pts: [], dead: false,
        boost: false, boostFuel: 1, turnBias: 0, retarget: 0
      };
      for (var i = 0; i < 30; i++) s.pts.push({ x: x, y: y });
      return s;
    }

    function reset(g) {
      var d = g.data;
      d.me = mkSnake('You', AW / 2, AH / 2, 190, false);
      d.snakes = [d.me];
      for (var i = 0; i < 7; i++) {
        d.snakes.push(mkSnake(NAMES[i % NAMES.length],
          U.rand(160, AW - 160), U.rand(160, AH - 160), U.randInt(0, 359), true));
      }
      d.orbs = [];
      for (var k = 0; k < 420; k++) d.orbs.push(mkOrb());
      d.cam = { x: 0, y: 0 };
      d.eaten = 0;
      d.kills = 0;
      d.parts = [];
      g.set('Length', 30);
      g.set('Rank', '1/8');
      g.set('Kills', 0);
    }

    function mkOrb(x, y, big) {
      return {
        x: x == null ? U.rand(30, AW - 30) : x,
        y: y == null ? U.rand(30, AH - 30) : y,
        r: big ? U.rand(6, 9) : U.rand(3.5, 5.5),
        hue: U.randInt(0, 359),
        v: big ? 4 : 1,
        t: Math.random() * 6
      };
    }

    function radius(s) { return 5 + Math.min(11, s.len / 42); }

    return Milo.arcade(host, {
      id: 'snake-royale',
      fit: 'resize',
      bg: '#05071a',
      stats: ['Length', 'Rank', 'Kills'],
      touchButtons: [{ key: 'action', label: 'BOOST' }],
      emo: '👑',
      start: {
        title: 'Snake Royale',
        text: 'Eight snakes, one arena. Eat the orbs to grow and steer with your ' +
          'mouse. Run into another snake’s body and you burst — make them run into yours.',
        keys: ['Mouse / touch to steer', 'Click or Space to boost']
      },
      init: reset,

      onPointer: function (g, type) {
        if (type === 'down') g.data.boosting = true;
        if (type === 'up') g.data.boosting = false;
      },

      update: function (g, dt) {
        var d = g.data, me = d.me, i = g.input;

        // Steer toward the pointer.
        var wx = i.px + d.cam.x, wy = i.py + d.cam.y;
        var want = Math.atan2(wy - me.y, wx - me.x);
        turnToward(me, want, dt, 5.5);
        me.boost = (i.down('action') || d.boosting) && me.len > 40 && me.boostFuel > 0;

        d.snakes.forEach(function (s) {
          if (s.dead) return;
          if (s.bot) botThink(d, s, dt);
          step(d, s, dt);
        });

        // Eat orbs.
        d.snakes.forEach(function (s) {
          if (s.dead) return;
          var r = radius(s) + 14;
          for (var k = d.orbs.length - 1; k >= 0; k--) {
            var o = d.orbs[k];
            if (Math.abs(o.x - s.x) > r || Math.abs(o.y - s.y) > r) continue;
            if (U.dist(o.x, o.y, s.x, s.y) < r) {
              s.len += o.v * 3;
              d.orbs.splice(k, 1);
              d.orbs.push(mkOrb());
              if (!s.bot) {
                d.eaten++;
                g.score = Math.floor(s.len);
                g.set('Length', Math.floor(s.len));
                Milo.sound.tone({ f: 600 + Math.min(600, s.len), d: .04, v: .04, type: 'square' });
              }
            }
          }
        });

        // Head-to-body collisions.
        d.snakes.forEach(function (s) {
          if (s.dead) return;
          var r = radius(s);
          for (var j = 0; j < d.snakes.length; j++) {
            var o = d.snakes[j];
            if (o === s || o.dead) continue;
            var orad = radius(o);
            // Skip the first few points so near-misses at the head aren't fatal.
            for (var p = 6; p < o.pts.length; p += 2) {
              var pt = o.pts[p];
              if (Math.abs(pt.x - s.x) > 40 || Math.abs(pt.y - s.y) > 40) continue;
              if (U.dist(pt.x, pt.y, s.x, s.y) < r + orad * .8) {
                kill(g, s, o);
                return;
              }
            }
          }
          // Walls are lethal too.
          if (s.x < 8 || s.y < 8 || s.x > AW - 8 || s.y > AH - 8) kill(g, s, null);
        });

        // Keep the field populated.
        for (var b = d.snakes.length - 1; b >= 0; b--) {
          if (d.snakes[b].dead) d.snakes.splice(b, 1);
        }
        while (d.snakes.length < 8 && !me.dead) {
          d.snakes.push(mkSnake(U.choice(NAMES),
            U.rand(160, AW - 160), U.rand(160, AH - 160), U.randInt(0, 359), true));
        }

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          return p.life > 0;
        });

        if (!me.dead) {
          var rank = 1 + d.snakes.filter(function (s) { return !s.dead && s.len > me.len; }).length;
          g.set('Rank', rank + '/' + d.snakes.length);
          me.boostFuel = me.boost ? Math.max(0, me.boostFuel - dt * .5) : Math.min(1, me.boostFuel + dt * .22);
        }

        d.cam.x = U.clamp(me.x - g.W / 2, 0, Math.max(0, AW - g.W));
        d.cam.y = U.clamp(me.y - g.H / 2, 0, Math.max(0, AH - g.H));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#05071a'; c.fillRect(0, 0, g.W, g.H);
        c.save();
        c.translate(-d.cam.x, -d.cam.y);

        c.fillStyle = '#0a0e26';
        c.fillRect(0, 0, AW, AH);
        c.strokeStyle = 'rgba(124,92,255,.10)'; c.lineWidth = 1;
        c.beginPath();
        var gx0 = Math.floor(d.cam.x / 70) * 70, gy0 = Math.floor(d.cam.y / 70) * 70;
        for (var x = gx0; x < d.cam.x + g.W + 70; x += 70) { c.moveTo(x, d.cam.y); c.lineTo(x, d.cam.y + g.H); }
        for (var y = gy0; y < d.cam.y + g.H + 70; y += 70) { c.moveTo(d.cam.x, y); c.lineTo(d.cam.x + g.W, y); }
        c.stroke();
        c.strokeStyle = '#fb7185'; c.lineWidth = 6;
        c.strokeRect(0, 0, AW, AH);

        d.orbs.forEach(function (o) {
          if (o.x < d.cam.x - 20 || o.x > d.cam.x + g.W + 20 ||
            o.y < d.cam.y - 20 || o.y > d.cam.y + g.H + 20) return;
          var pulse = 1 + Math.sin(g.t * 3 + o.t) * .18;
          c.fillStyle = 'hsl(' + o.hue + ',90%,65%)';
          c.shadowColor = 'hsl(' + o.hue + ',90%,65%)';
          c.shadowBlur = 10;
          c.beginPath(); c.arc(o.x, o.y, o.r * pulse, 0, 7); c.fill();
        });
        c.shadowBlur = 0;

        d.snakes.forEach(function (s) {
          if (s.dead) return;
          var r = radius(s);
          c.lineCap = 'round'; c.lineJoin = 'round';
          // Outline then body, so overlapping snakes stay readable.
          c.strokeStyle = 'hsl(' + s.hue + ',80%,26%)';
          c.lineWidth = r * 2 + 4;
          strokePts(c, s.pts);
          c.strokeStyle = 'hsl(' + s.hue + ',85%,' + (s.bot ? 55 : 62) + '%)';
          c.lineWidth = r * 2;
          if (!s.bot) { c.shadowColor = 'hsl(' + s.hue + ',90%,60%)'; c.shadowBlur = s.boost ? 26 : 12; }
          strokePts(c, s.pts);
          c.shadowBlur = 0;

          c.fillStyle = '#fff';
          var ex = Math.cos(s.a), ey = Math.sin(s.a);
          var nx = -ey, ny = ex;
          c.beginPath();
          c.arc(s.x + nx * r * .5 + ex * r * .35, s.y + ny * r * .5 + ey * r * .35, r * .38, 0, 7);
          c.arc(s.x - nx * r * .5 + ex * r * .35, s.y - ny * r * .5 + ey * r * .35, r * .38, 0, 7);
          c.fill();
          c.fillStyle = '#0a0e26';
          c.beginPath();
          c.arc(s.x + nx * r * .5 + ex * r * .5, s.y + ny * r * .5 + ey * r * .5, r * .18, 0, 7);
          c.arc(s.x - nx * r * .5 + ex * r * .5, s.y - ny * r * .5 + ey * r * .5, r * .18, 0, 7);
          c.fill();

          c.fillStyle = s.bot ? 'rgba(255,255,255,.6)' : '#fff';
          c.font = '600 12px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(s.name + ' · ' + Math.floor(s.len), s.x, s.y - r - 10);
        });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, 3, 0, 7); c.fill();
        });
        c.globalAlpha = 1;
        c.restore();

        // leaderboard
        var board = d.snakes.filter(function (s) { return !s.dead; })
          .sort(function (a, b) { return b.len - a.len; }).slice(0, 6);
        c.font = '700 12px Outfit, sans-serif'; c.textAlign = 'left';
        board.forEach(function (s, i) {
          c.fillStyle = 'rgba(8,10,26,.6)';
          U.roundRect(c, g.W - 152, 68 + i * 22, 138, 19, 5); c.fill();
          c.fillStyle = s.bot ? '#c7cff0' : '#22d3ee';
          c.fillText((i + 1) + '. ' + s.name, g.W - 145, 82 + i * 22);
          c.textAlign = 'right';
          c.fillText(Math.floor(s.len), g.W - 20, 82 + i * 22);
          c.textAlign = 'left';
        });

        if (!d.me.dead) {
          var bf = d.me.boostFuel;
          c.fillStyle = 'rgba(8,10,26,.6)';
          U.roundRect(c, 14, g.H - 34, 128, 16, 6); c.fill();
          c.fillStyle = bf > .25 ? '#ffd257' : '#fb7185';
          U.roundRect(c, 17, g.H - 31, 122 * bf, 10, 4); c.fill();
          c.fillStyle = 'rgba(255,255,255,.65)';
          c.font = '600 10px Outfit, sans-serif';
          c.fillText('BOOST', 20, g.H - 40);
        }
      }
    });

    function strokePts(c, pts) {
      c.beginPath();
      c.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
      c.stroke();
    }

    function turnToward(s, want, dt, rate) {
      var diff = ((want - s.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      s.a += U.clamp(diff, -rate * dt, rate * dt);
    }

    function step(d, s, dt) {
      var speed = (s.boost ? 285 : 155) + Math.min(30, s.len / 30);
      s.x += Math.cos(s.a) * speed * dt;
      s.y += Math.sin(s.a) * speed * dt;

      // Boosting burns length, and the burnt tail drops back as orbs.
      if (s.boost && s.len > 40) {
        s.len -= dt * 14;
        if (Math.random() < dt * 8) {
          var tail = s.pts[s.pts.length - 1];
          d.orbs.push(mkOrb(tail.x + U.rand(-6, 6), tail.y + U.rand(-6, 6), false));
        }
      }

      // Body follows the head at fixed spacing.
      s.pts.unshift({ x: s.x, y: s.y });
      var want = Math.max(12, Math.floor(s.len));
      while (s.pts.length > want) s.pts.pop();

      // Resample so segments stay evenly spread regardless of speed.
      for (var i = 1; i < s.pts.length; i++) {
        var a = s.pts[i - 1], b = s.pts[i];
        var dx = b.x - a.x, dy = b.y - a.y;
        var dist = Math.hypot(dx, dy) || 1;
        if (dist > SEG) {
          b.x = a.x + dx / dist * SEG;
          b.y = a.y + dy / dist * SEG;
        }
      }
    }

    function botThink(d, s, dt) {
      s.retarget -= dt;
      if (s.retarget <= 0) {
        s.retarget = U.rand(.3, .9);
        // Head for the nearest decent orb.
        var best = null, bestD = 1e9;
        for (var i = 0; i < d.orbs.length; i += 3) {
          var o = d.orbs[i];
          var dist = U.dist(o.x, o.y, s.x, s.y);
          if (dist < bestD) { bestD = dist; best = o; }
        }
        s.target = best;
      }

      var want = s.target ? Math.atan2(s.target.y - s.y, s.target.x - s.x) : s.a;

      // Steer away from walls and from other snakes' bodies just ahead.
      var lookX = s.x + Math.cos(s.a) * 90, lookY = s.y + Math.sin(s.a) * 90;
      var avoid = 0;
      if (lookX < 120) avoid += 1;
      if (lookX > AW - 120) avoid -= 1;
      if (lookY < 120) want = 1.57;
      if (lookY > AH - 120) want = -1.57;
      if (avoid) want = avoid > 0 ? 0 : Math.PI;

      for (var j = 0; j < d.snakes.length; j++) {
        var o2 = d.snakes[j];
        if (o2 === s || o2.dead) continue;
        for (var p = 0; p < o2.pts.length; p += 6) {
          var pt = o2.pts[p];
          if (U.dist(pt.x, pt.y, lookX, lookY) < 60) {
            want = s.a + (U.hash2(Math.floor(s.x), p, 3) > .5 ? 1.4 : -1.4);
            p = o2.pts.length;
            j = d.snakes.length;
          }
        }
      }

      turnToward(s, want, dt, 3.2);
      s.boost = s.len > 90 && Math.random() < dt * 0.4;
    }

    function kill(g, s, by) {
      var d = g.data;
      s.dead = true;
      // The dead snake's body becomes food.
      for (var i = 0; i < s.pts.length; i += 3) {
        d.orbs.push(mkOrb(s.pts[i].x + U.rand(-8, 8), s.pts[i].y + U.rand(-8, 8), true));
      }
      for (var k = 0; k < 20; k++) {
        var a = Math.random() * 6.28, sp = U.rand(50, 260);
        d.parts.push({
          x: s.x, y: s.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          life: U.rand(.3, .7), max: .7, col: 'hsl(' + s.hue + ',85%,62%)'
        });
      }
      if (by && by === d.me) {
        d.kills++;
        g.set('Kills', d.kills);
        Milo.sound.powerup();
      }
      if (s === d.me) {
        Milo.sound.explode();
        var rank = 1 + d.snakes.filter(function (x) { return !x.dead && x.len > s.len; }).length;
        g.gameOver({
          score: Math.floor(s.len),
          text: 'Length ' + Math.floor(s.len) + ' · ranked ' + rank +
            ' · ' + d.kills + ' snake' + (d.kills === 1 ? '' : 's') + ' taken out.'
        });
      } else {
        Milo.sound.hit();
      }
    }
  }

  window.Milo.register({
    id: 'snake-royale', title: 'Snake Royale', emo: '👑', category: 'Action',
    tagline: 'Eight snakes, one arena',
    description: 'A big open arena shared with seven rival snakes. Eat orbs to grow, ' +
      'steer with your mouse, and boost to close a gap — boosting burns length and leaves ' +
      'a trail of orbs behind you. Touch another snake’s body and you burst into food; ' +
      'cut in front of them and they do. Longest snake tops the board.',
    controls: ['Mouse to steer', 'Click / Space boost'],
    colors: ['#34d399', '#fbbf24'],
    featured: true,
    tags: ['io-style', 'snake', 'arena', 'multiplayer-feel', 'action'],
    mount: mount
  });
})();
