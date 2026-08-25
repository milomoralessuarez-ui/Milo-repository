/* Tower Defence — build along the path, stop the waves. */
(function () {
  'use strict';
  var COLS = 15, ROWS = 10, CELL = 54;
  var W = COLS * CELL, H = ROWS * CELL + 70;
  var PATH = [[0, 5], [3, 5], [3, 2], [7, 2], [7, 8], [11, 8], [11, 4], [14, 4]];

  var TOWERS = {
    gun: { name: 'Gun', cost: 40, range: 130, rate: 0.5, dmg: 10, col: '#22d3ee' },
    frost: { name: 'Frost', cost: 60, range: 110, rate: 1.1, dmg: 4, slow: 0.5, col: '#a78bfa' },
    cannon: { name: 'Cannon', cost: 90, range: 160, rate: 1.5, dmg: 34, splash: 60, col: '#fb923c' }
  };

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.pathCells = {};
      d.waypoints = [];
      for (var i = 0; i < PATH.length - 1; i++) {
        var a = PATH[i], b = PATH[i + 1];
        var dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]);
        var x = a[0], y = a[1];
        while (x !== b[0] || y !== b[1]) {
          d.pathCells[y * COLS + x] = true;
          d.waypoints.push({ x: x, y: y });
          x += dx; y += dy;
        }
      }
      d.pathCells[PATH[PATH.length - 1][1] * COLS + PATH[PATH.length - 1][0]] = true;
      d.waypoints.push({ x: PATH[PATH.length - 1][0], y: PATH[PATH.length - 1][1] });

      d.towers = [];
      d.enemies = [];
      d.shots = [];
      d.money = 120;
      d.lives = 20;
      d.wave = 0;
      d.spawnQueue = 0;
      d.spawnT = 0;
      d.between = 3;
      d.pick = 'gun';
      d.hover = null;
      g.set('Money', 120);
      g.set('Lives', 20);
      g.set('Wave', 0);
    }

    function startWave(d) {
      d.wave++;
      d.spawnQueue = 5 + d.wave * 2;
      d.spawnT = 0;
    }

    function spawn(d) {
      var hp = 22 + d.wave * 14;
      var fast = d.wave > 2 && Math.random() < .3;
      d.enemies.push({
        wp: 0, t: 0, hp: fast ? hp * .6 : hp, max: fast ? hp * .6 : hp,
        speed: fast ? 3.4 : 2.0, slow: 0, fast: fast,
        x: d.waypoints[0].x, y: d.waypoints[0].y
      });
    }

    function cellFree(d, x, y) {
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
      if (d.pathCells[y * COLS + x]) return false;
      return !d.towers.some(function (t) { return t.x === x && t.y === y; });
    }

    return Milo.arcade(host, {
      id: 'tower-defence',
      w: W, h: H, bg: '#12301c',
      stats: ['Money', 'Lives', 'Wave'],
      emo: '🏰',
      start: {
        title: 'Tower Defence',
        text: 'Build towers beside the path and stop the waves before twenty of them get ' +
          'through. Guns fire fast, frost towers slow the wave down, cannons hit a whole group.',
        keys: ['1 2 3 pick a tower', 'Click to build']
      },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        if (e.code === 'Digit1') d.pick = 'gun';
        if (e.code === 'Digit2') d.pick = 'frost';
        if (e.code === 'Digit3') d.pick = 'cannon';
        if (e.code === 'Space' && !d.spawnQueue && !d.enemies.length) { d.between = 0; }
      },

      onPointer: function (g, type, px, py) {
        var d = g.data;
        var x = Math.floor(px / CELL), y = Math.floor(py / CELL);
        if (type === 'move') { d.hover = { x: x, y: y }; return; }
        if (type !== 'down') return;

        if (py > ROWS * CELL) {
          var keys = Object.keys(TOWERS);
          for (var i = 0; i < keys.length; i++) {
            if (px > 20 + i * 150 && px < 20 + i * 150 + 140) { d.pick = keys[i]; return; }
          }
          return;
        }
        var def = TOWERS[d.pick];
        if (!cellFree(d, x, y)) { Milo.sound.tone({ f: 150, d: .08, v: .05, type: 'square' }); return; }
        if (d.money < def.cost) { Milo.sound.tone({ f: 150, d: .08, v: .05, type: 'square' }); return; }
        d.money -= def.cost;
        g.set('Money', d.money);
        d.towers.push({ x: x, y: y, kind: d.pick, cool: 0 });
        Milo.sound.coin();
      },

      update: function (g, dt) {
        var d = g.data;

        if (d.spawnQueue > 0) {
          d.spawnT -= dt;
          if (d.spawnT <= 0) { d.spawnT = Math.max(0.28, 0.8 - d.wave * 0.03); spawn(d); d.spawnQueue--; }
        } else if (!d.enemies.length) {
          d.between -= dt;
          if (d.between <= 0) {
            d.between = 6;
            d.money += 30 + d.wave * 4;
            g.set('Money', d.money);
            startWave(d);
            g.set('Wave', d.wave);
            Milo.sound.powerup();
          }
        }

        for (var i = d.enemies.length - 1; i >= 0; i--) {
          var e = d.enemies[i];
          var slowFactor = e.slow > 0 ? 0.5 : 1;
          e.slow = Math.max(0, e.slow - dt);
          e.t += dt * e.speed * slowFactor;
          while (e.t >= 1 && e.wp < d.waypoints.length - 1) { e.t -= 1; e.wp++; }
          var a = d.waypoints[e.wp], b = d.waypoints[Math.min(e.wp + 1, d.waypoints.length - 1)];
          e.x = a.x + (b.x - a.x) * e.t;
          e.y = a.y + (b.y - a.y) * e.t;

          if (e.wp >= d.waypoints.length - 1) {
            d.enemies.splice(i, 1);
            d.lives--;
            g.set('Lives', Math.max(0, d.lives));
            Milo.sound.hit();
            if (d.lives <= 0) {
              g.gameOver({ emo: '🏰', title: 'They broke through', text: 'You held ' + (d.wave - 1) + ' waves.', score: (d.wave - 1) * 150 });
              return;
            }
          }
        }

        d.towers.forEach(function (t) {
          var def = TOWERS[t.kind];
          t.cool -= dt;
          if (t.cool > 0) return;
          var tx = t.x + .5, ty = t.y + .5;
          var target = null, bestProgress = -1;
          d.enemies.forEach(function (e) {
            var dist = U.dist(e.x + .5, e.y + .5, tx, ty) * CELL;
            if (dist > def.range) return;
            var prog = e.wp + e.t;
            if (prog > bestProgress) { bestProgress = prog; target = e; }
          });
          if (!target) return;
          t.cool = def.rate;
          d.shots.push({ x: tx * CELL, y: ty * CELL, target: target, def: def, life: .18 });
          Milo.sound.tone({ f: t.kind === 'cannon' ? 200 : 700, d: .05, v: .035, type: 'square' });

          var victims = def.splash
            ? d.enemies.filter(function (e) {
              return U.dist(e.x, e.y, target.x, target.y) * CELL < def.splash;
            })
            : [target];
          victims.forEach(function (e) {
            e.hp -= def.dmg;
            if (def.slow) e.slow = 1.2;
            if (e.hp <= 0) {
              var idx = d.enemies.indexOf(e);
              if (idx >= 0) {
                d.enemies.splice(idx, 1);
                d.money += 8 + Math.floor(d.wave * 1.5);
                g.score += 20;
                g.set('Money', d.money);
              }
            }
          });
        });

        d.shots = d.shots.filter(function (s) { s.life -= dt; return s.life > 0; });

        if (d.wave >= 20 && !d.enemies.length && !d.spawnQueue) {
          g.win({ score: g.score + d.lives * 100, emo: '🏰', title: 'Twenty waves held!' });
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#173c22'; c.fillRect(0, 0, W, ROWS * CELL);

        for (var y = 0; y < ROWS; y++) {
          for (var x = 0; x < COLS; x++) {
            if (d.pathCells[y * COLS + x]) {
              c.fillStyle = '#8a7048';
              c.fillRect(x * CELL, y * CELL, CELL, CELL);
            } else if ((x + y) % 2) {
              c.fillStyle = 'rgba(255,255,255,.025)';
              c.fillRect(x * CELL, y * CELL, CELL, CELL);
            }
          }
        }

        var def = TOWERS[d.pick];
        if (d.hover && d.hover.y < ROWS) {
          var ok = cellFree(d, d.hover.x, d.hover.y) && d.money >= def.cost;
          c.fillStyle = ok ? 'rgba(52,211,153,.28)' : 'rgba(251,113,133,.28)';
          c.fillRect(d.hover.x * CELL, d.hover.y * CELL, CELL, CELL);
          c.strokeStyle = 'rgba(255,255,255,.25)';
          c.beginPath();
          c.arc(d.hover.x * CELL + CELL / 2, d.hover.y * CELL + CELL / 2, def.range, 0, 7);
          c.stroke();
        }

        d.towers.forEach(function (t) {
          var td = TOWERS[t.kind];
          c.fillStyle = td.col;
          U.roundRect(c, t.x * CELL + 8, t.y * CELL + 8, CELL - 16, CELL - 16, 7); c.fill();
          c.fillStyle = 'rgba(0,0,0,.4)';
          c.beginPath(); c.arc(t.x * CELL + CELL / 2, t.y * CELL + CELL / 2, 7, 0, 7); c.fill();
        });

        d.enemies.forEach(function (e) {
          var ex = e.x * CELL + CELL / 2, ey = e.y * CELL + CELL / 2;
          c.fillStyle = e.slow > 0 ? '#a78bfa' : e.fast ? '#facc15' : '#e5484d';
          c.beginPath(); c.arc(ex, ey, e.fast ? 11 : 14, 0, 7); c.fill();
          c.fillStyle = 'rgba(0,0,0,.5)';
          c.fillRect(ex - 15, ey - 22, 30, 4);
          c.fillStyle = '#34d399';
          c.fillRect(ex - 15, ey - 22, 30 * Math.max(0, e.hp / e.max), 4);
        });

        c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2;
        d.shots.forEach(function (s) {
          c.globalAlpha = s.life / .18;
          c.beginPath();
          c.moveTo(s.x, s.y);
          c.lineTo(s.target.x * CELL + CELL / 2, s.target.y * CELL + CELL / 2);
          c.stroke();
        });
        c.globalAlpha = 1;

        // build bar
        c.fillStyle = '#0d1a12';
        c.fillRect(0, ROWS * CELL, W, 70);
        Object.keys(TOWERS).forEach(function (k, i) {
          var t = TOWERS[k];
          var x = 20 + i * 150;
          c.fillStyle = d.pick === k ? t.col : 'rgba(255,255,255,.08)';
          U.roundRect(c, x, ROWS * CELL + 12, 140, 46, 9); c.fill();
          c.fillStyle = d.pick === k ? '#06121a' : '#dfe5ff';
          c.font = '700 14px Outfit, sans-serif';
          c.textAlign = 'left';
          c.fillText((i + 1) + '. ' + t.name, x + 12, ROWS * CELL + 32);
          c.font = '600 11px Outfit, sans-serif';
          c.fillText('$' + t.cost, x + 12, ROWS * CELL + 48);
        });
        c.fillStyle = 'rgba(255,255,255,.45)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'right';
        c.fillText(d.spawnQueue || d.enemies.length ? 'Wave in progress'
          : 'Next wave in ' + Math.ceil(d.between) + 's (Space to rush)', W - 20, ROWS * CELL + 42);
      }
    });
  }

  window.Milo.register({
    id: 'tower-defence', title: 'Tower Defence', emo: '🏰', category: 'Strategy',
    tagline: 'Build the line, hold twenty waves',
    description: 'Enemies follow a fixed path from one side to the other; you build towers ' +
      'on the ground beside it. Guns are cheap and fast, frost towers halve enemy speed, and ' +
      'cannons hit everything within a blast radius — the answer is usually a mix. Towers ' +
      'target whichever enemy is furthest along, so leaks get punished. Twenty lives.',
    controls: ['1 2 3 to pick', 'Click to build', 'Space to rush'],
    colors: ['#173c22', '#22d3ee'],
    featured: true,
    tags: ['strategy', 'defence', 'waves', 'building'],
    mount: mount
  });
})();
