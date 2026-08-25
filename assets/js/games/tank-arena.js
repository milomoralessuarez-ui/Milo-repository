/* Tank Arena — top-down tank duel against hunting bots. */
(function () {
  'use strict';
  var W = 900, H = 620, TS = 60;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.cols = Math.floor(W / TS);
      d.rows = Math.floor(H / TS);
      d.walls = [];
      for (var y = 0; y < d.rows; y++) {
        var row = [];
        for (var x = 0; x < d.cols; x++) {
          var edge = x === 0 || y === 0 || x === d.cols - 1 || y === d.rows - 1;
          row.push(edge || (x % 2 === 0 && y % 2 === 0 && Math.random() < .7));
        }
        d.walls.push(row);
      }
      d.me = mkTank(TS * 1.5, TS * 1.5, '#22d3ee', false);
      d.bots = [];
      d.wave = 0;
      d.shots = [];
      d.parts = [];
      d.kills = 0;
      spawnWave(d);
      g.set('Score', 0);
      g.set('Wave', 1);
      g.set('Armour', 3);
    }

    function mkTank(x, y, col, bot) {
      return { x: x, y: y, a: 0, turret: 0, col: col, bot: bot, cool: 0, hp: bot ? 1 : 3, think: 0 };
    }

    function spawnWave(d) {
      d.wave++;
      var n = Math.min(6, 1 + d.wave);
      for (var i = 0; i < n; i++) {
        var x, y, tries = 0;
        do {
          x = U.rand(TS, W - TS); y = U.rand(TS, H - TS);
          tries++;
        } while ((wallAt(d, x, y) || U.dist(x, y, d.me.x, d.me.y) < 260) && tries < 80);
        var t = mkTank(x, y, U.choice(['#fb7185', '#facc15', '#a78bfa']), true);
        t.hp = 1 + Math.floor(d.wave / 4);
        d.bots.push(t);
      }
    }

    function wallAt(d, x, y) {
      var cx = Math.floor(x / TS), cy = Math.floor(y / TS);
      if (cx < 0 || cy < 0 || cx >= d.cols || cy >= d.rows) return true;
      return d.walls[cy][cx];
    }

    function moveTank(d, t, dist) {
      var nx = t.x + Math.cos(t.a) * dist, ny = t.y + Math.sin(t.a) * dist;
      if (!wallAt(d, nx + Math.sign(Math.cos(t.a)) * 13, t.y)) t.x = nx;
      if (!wallAt(d, t.x, ny + Math.sign(Math.sin(t.a)) * 13)) t.y = ny;
    }

    function shoot(d, t) {
      if (t.cool > 0) return;
      t.cool = t.bot ? U.rand(1.1, 2.2) : 0.42;
      d.shots.push({
        x: t.x + Math.cos(t.turret) * 22, y: t.y + Math.sin(t.turret) * 22,
        vx: Math.cos(t.turret) * 430, vy: Math.sin(t.turret) * 430,
        bot: t.bot, bounces: 2
      });
      Milo.sound.tone({ f: t.bot ? 240 : 420, f2: 150, d: .08, v: .05, type: 'square' });
    }

    function boom(d, x, y, col, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = U.rand(50, 260);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .7), max: .7, col: col });
      }
    }

    return Milo.arcade(host, {
      id: 'tank-arena',
      w: W, h: H, bg: '#12160f',
      stats: ['Score', 'Wave', 'Armour'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'FIRE' }],
      emo: '🛡️',
      start: {
        title: 'Tank Arena',
        text: 'Drive with WASD, aim the turret with the mouse, and fire. Shells bounce off ' +
          'walls twice — including your own, so mind the ricochet.',
        keys: ['WASD drive', 'Mouse aim', 'Click fire']
      },
      init: reset,

      onPointer: function (g, type) {
        if (type === 'down') g.data.firing = true;
        if (type === 'up') g.data.firing = false;
      },

      update: function (g, dt) {
        var d = g.data, i = g.input, me = d.me;

        me.turret = Math.atan2(i.py - me.y, i.px - me.x);
        var fwd = (i.down('up') ? 1 : 0) - (i.down('down') ? 1 : 0);
        var turn = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
        me.a += turn * 2.8 * dt;
        if (fwd) moveTank(d, me, fwd * 150 * dt);
        me.cool -= dt;
        if (i.down('action') || d.firing) shoot(d, me);

        d.bots.forEach(function (b) {
          b.cool -= dt;
          b.think -= dt;
          var toMe = Math.atan2(me.y - b.y, me.x - b.x);
          b.turret = toMe;
          if (b.think <= 0) {
            b.think = U.rand(.5, 1.4);
            var dist = U.dist(b.x, b.y, me.x, me.y);
            b.a = dist > 220 ? toMe + U.rand(-.5, .5) : toMe + Math.PI / 2 + U.rand(-.6, .6);
          }
          moveTank(d, b, 80 * dt);
          if (U.dist(b.x, b.y, me.x, me.y) < 500) shoot(d, b);
        });

        for (var k = d.shots.length - 1; k >= 0; k--) {
          var s = d.shots[k];
          var nx = s.x + s.vx * dt, ny = s.y + s.vy * dt;
          if (wallAt(d, nx, s.y)) { s.vx *= -1; s.bounces--; }
          else s.x = nx;
          if (wallAt(d, s.x, ny)) { s.vy *= -1; s.bounces--; }
          else s.y = ny;
          if (s.bounces < 0) { d.shots.splice(k, 1); continue; }

          if (s.bot) {
            if (U.dist(s.x, s.y, me.x, me.y) < 16) {
              d.shots.splice(k, 1);
              me.hp--;
              g.set('Armour', Math.max(0, me.hp));
              boom(d, me.x, me.y, '#22d3ee', 18);
              Milo.sound.explode();
              if (me.hp <= 0) {
                g.gameOver({ text: d.kills + ' tanks destroyed over ' + d.wave + ' waves.' });
                return;
              }
            }
          } else {
            for (var b2 = d.bots.length - 1; b2 >= 0; b2--) {
              var bot = d.bots[b2];
              if (U.dist(s.x, s.y, bot.x, bot.y) > 16) continue;
              d.shots.splice(k, 1);
              bot.hp--;
              boom(d, bot.x, bot.y, bot.col, 10);
              if (bot.hp <= 0) {
                d.bots.splice(b2, 1);
                d.kills++;
                g.score += 100 + d.wave * 10;
                g.set('Score', U.fmt(g.score));
                Milo.sound.explode();
              }
              break;
            }
          }
        }

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          return p.life > 0;
        });

        if (!d.bots.length) {
          spawnWave(d);
          g.set('Wave', d.wave);
          me.hp = Math.min(3, me.hp + 1);
          g.set('Armour', me.hp);
          Milo.sound.powerup();
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#1c2415'; c.fillRect(0, 0, W, H);

        for (var y = 0; y < d.rows; y++) {
          for (var x = 0; x < d.cols; x++) {
            if (!d.walls[y][x]) continue;
            c.fillStyle = '#4a5340';
            U.roundRect(c, x * TS + 1, y * TS + 1, TS - 2, TS - 2, 5); c.fill();
            c.fillStyle = 'rgba(255,255,255,.07)';
            U.roundRect(c, x * TS + 5, y * TS + 5, TS - 10, 8, 3); c.fill();
          }
        }

        function tank(t) {
          c.save();
          c.translate(t.x, t.y);
          c.rotate(t.a);
          c.fillStyle = 'rgba(0,0,0,.35)';
          U.roundRect(c, -16, -12, 32, 24, 5); c.fill();
          c.fillStyle = t.col;
          U.roundRect(c, -17, -13, 34, 26, 6); c.fill();
          c.fillStyle = 'rgba(0,0,0,.3)';
          c.fillRect(-17, -15, 34, 5);
          c.fillRect(-17, 10, 34, 5);
          c.restore();
          c.save();
          c.translate(t.x, t.y);
          c.rotate(t.turret);
          c.fillStyle = 'rgba(0,0,0,.55)';
          U.roundRect(c, 0, -4, 26, 8, 3); c.fill();
          c.beginPath(); c.arc(0, 0, 10, 0, 7); c.fill();
          c.restore();
        }
        d.bots.forEach(tank);
        tank(d.me);

        c.fillStyle = '#ffe066';
        d.shots.forEach(function (s) {
          c.beginPath(); c.arc(s.x, s.y, 4, 0, 7); c.fill();
        });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
        });
        c.globalAlpha = 1;
      }
    });
  }

  window.Milo.register({
    id: 'tank-arena', title: 'Tank Arena', emo: '🛡️', category: 'Action',
    tagline: 'Ricochet duels in a walled maze',
    description: 'Drive a tank around a walled arena while hunting bots close in. The hull ' +
      'and turret aim separately — drive with WASD, aim with the mouse — and shells bounce ' +
      'off walls twice, which cuts both ways: you can bank a shot round a corner, and so ' +
      'can your own ricochet come back at you. Each cleared wave repairs a point of armour.',
    controls: ['WASD drive', 'Mouse aim', 'Click fire'],
    colors: ['#4a5340', '#22d3ee'],
    tags: ['tanks', 'arena', 'shooter', 'action'],
    mount: mount
  });
})();
