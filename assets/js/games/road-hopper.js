/* Road Hopper — cross the traffic and the river without getting squashed. */
(function () {
  'use strict';
  var COLS = 13, ROWS = 13, CELL = 44;
  var W = COLS * CELL, H = ROWS * CELL;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.lanes = [];
      for (var y = 0; y < ROWS; y++) {
        // 0 = safe verge, 1 = road, 2 = river.
        var kind = (y === 0 || y === 6 || y === ROWS - 1) ? 0 : (y < 6 ? 2 : 1);
        var lane = { kind: kind, y: y, items: [], speed: 0, dir: 1 };
        if (kind !== 0) {
          lane.dir = y % 2 ? 1 : -1;
          lane.speed = (60 + U.rand(20, 90)) * (1 + Math.abs(6 - y) * 0.05);
          var n = kind === 2 ? U.randInt(2, 3) : U.randInt(2, 4);
          var len = kind === 2 ? U.randInt(2, 3) : 1;
          for (var i = 0; i < n; i++) {
            lane.items.push({ x: (i * (COLS / n) + U.rand(0, 1)) * CELL, len: len });
          }
        }
        d.lanes.push(lane);
      }
      d.p = { x: (COLS >> 1) * CELL, y: (ROWS - 1) * CELL, onLog: null };
      d.lives = 3;
      d.home = [false, false, false, false, false];
      d.best = (ROWS - 1);
      d.time = 30;
      g.set('Score', 0);
      g.set('Lives', 3);
      g.set('Home', '0/5');
    }

    function hop(g, dx, dy) {
      var d = g.data;
      var nx = d.p.x + dx * CELL, ny = d.p.y + dy * CELL;
      if (nx < 0 || nx > W - CELL || ny < 0 || ny > H - CELL) return;
      d.p.x = nx; d.p.y = ny;
      Milo.sound.tone({ f: 480, f2: 620, d: .06, v: .05, type: 'triangle' });
      var row = Math.round(ny / CELL);
      if (row < d.best) {
        d.best = row;
        g.score += 10;
        g.set('Score', U.fmt(g.score));
      }
      if (row === 0) reachHome(g);
    }

    function reachHome(g) {
      var d = g.data;
      var slot = Math.round(d.p.x / CELL / (COLS / 5));
      slot = U.clamp(slot, 0, 4);
      if (d.home[slot]) { hurt(g, 'That bay is taken'); return; }
      d.home[slot] = true;
      g.score += 200 + Math.round(d.time) * 5;
      g.set('Score', U.fmt(g.score));
      g.set('Home', d.home.filter(Boolean).length + '/5');
      Milo.sound.win();
      respawn(d);
      if (d.home.every(Boolean)) {
        g.win({ score: g.score, emo: '🐸', title: 'All five home!', text: 'Every bay filled.' });
      }
    }

    function respawn(d) {
      d.p.x = (COLS >> 1) * CELL;
      d.p.y = (ROWS - 1) * CELL;
      d.best = ROWS - 1;
      d.time = 30;
    }

    function hurt(g, why) {
      var d = g.data;
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      Milo.sound.explode();
      if (d.lives <= 0) {
        g.gameOver({ text: why + '. ' + d.home.filter(Boolean).length + ' of 5 made it home.' });
        return;
      }
      respawn(d);
    }

    return Milo.arcade(host, {
      id: 'road-hopper',
      w: W, h: H, bg: '#0a1524',
      stats: ['Score', 'Lives', 'Home'],
      touch: 'dpad',
      emo: '🐸',
      start: {
        title: 'Road Hopper',
        text: 'Cross the traffic, then ride the logs across the river — the water itself ' +
          'is deadly. Fill all five bays at the top. You have thirty seconds per crossing.',
        keys: ['Arrow keys / WASD']
      },
      init: reset,

      onKey: function (g, e) {
        var m = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
          ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] }[e.code];
        if (m) { e.preventDefault(); hop(g, m[0], m[1]); }
      },

      update: function (g, dt) {
        var d = g.data;
        if (g.input.pressed('up')) hop(g, 0, -1);
        if (g.input.pressed('down')) hop(g, 0, 1);
        if (g.input.pressed('left')) hop(g, -1, 0);
        if (g.input.pressed('right')) hop(g, 1, 0);

        d.time -= dt;
        if (d.time <= 0) { hurt(g, 'Ran out of time'); return; }

        d.lanes.forEach(function (lane) {
          if (!lane.kind) return;
          lane.items.forEach(function (it) {
            it.x += lane.dir * lane.speed * dt;
            var span = it.len * CELL;
            if (it.x > W + span) it.x = -span;
            if (it.x < -span) it.x = W + span;
          });
        });

        var row = Math.round(d.p.y / CELL);
        var lane = d.lanes[row];
        if (lane && lane.kind === 1) {
          var squashed = lane.items.some(function (it) {
            return d.p.x + CELL - 8 > it.x && d.p.x + 8 < it.x + it.len * CELL;
          });
          if (squashed) { hurt(g, 'Flattened by traffic'); return; }
        } else if (lane && lane.kind === 2) {
          var log = lane.items.filter(function (it) {
            return d.p.x + CELL / 2 > it.x && d.p.x + CELL / 2 < it.x + it.len * CELL;
          })[0];
          if (!log) { hurt(g, 'Fell in the river'); return; }
          d.p.x += lane.dir * lane.speed * dt;
          if (d.p.x < -CELL / 2 || d.p.x > W - CELL / 2) { hurt(g, 'Carried off downstream'); return; }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;

        d.lanes.forEach(function (lane) {
          var y = lane.y * CELL;
          c.fillStyle = lane.kind === 0 ? '#1f6b3a' : lane.kind === 1 ? '#26262f' : '#123a6b';
          c.fillRect(0, y, W, CELL);
          if (lane.kind === 1) {
            c.strokeStyle = 'rgba(255,255,255,.2)';
            c.setLineDash([14, 14]); c.lineWidth = 2;
            c.beginPath(); c.moveTo(0, y + CELL / 2); c.lineTo(W, y + CELL / 2); c.stroke();
            c.setLineDash([]);
          }
        });

        // home bays
        for (var s = 0; s < 5; s++) {
          var bx = s * (W / 5) + (W / 5 - CELL) / 2;
          c.fillStyle = d.home[s] ? '#34d399' : '#0d3a20';
          U.roundRect(c, bx, 4, CELL, CELL - 8, 8); c.fill();
          if (d.home[s]) {
            c.fillStyle = '#062a1a';
            c.font = '700 20px Outfit, sans-serif';
            c.textAlign = 'center';
            c.fillText('🐸', bx + CELL / 2, CELL / 2 + 8);
          }
        }

        d.lanes.forEach(function (lane) {
          if (!lane.kind) return;
          var y = lane.y * CELL;
          lane.items.forEach(function (it) {
            if (lane.kind === 2) {
              c.fillStyle = '#6b4a26';
              U.roundRect(c, it.x, y + 6, it.len * CELL, CELL - 12, 8); c.fill();
              c.fillStyle = 'rgba(255,255,255,.12)';
              U.roundRect(c, it.x + 6, y + 10, it.len * CELL - 12, 5, 2.5); c.fill();
            } else {
              c.fillStyle = ['#fb7185', '#ffd257', '#a78bfa', '#38bdf8'][lane.y % 4];
              U.roundRect(c, it.x, y + 7, CELL - 4, CELL - 14, 6); c.fill();
              c.fillStyle = 'rgba(10,14,32,.6)';
              U.roundRect(c, it.x + 6, y + 12, CELL - 16, 9, 3); c.fill();
            }
          });
        });

        c.font = '28px serif';
        c.textAlign = 'center';
        c.fillText('🐸', d.p.x + CELL / 2, d.p.y + CELL / 2 + 10);

        // time bar
        c.fillStyle = 'rgba(0,0,0,.5)';
        c.fillRect(0, H - 8, W, 8);
        c.fillStyle = d.time < 8 ? '#fb7185' : '#34d399';
        c.fillRect(0, H - 8, W * U.clamp(d.time / 30, 0, 1), 8);
      }
    });
  }

  window.Milo.register({
    id: 'road-hopper', title: 'Road Hopper', emo: '🐸', category: 'Arcade',
    tagline: 'Cross the road, then the river',
    description: 'Hop across six lanes of traffic, then across a river where the water is ' +
      'the hazard and the logs are the only safe ground — and they carry you sideways while ' +
      'you stand on them. Fill all five bays at the top to win, with thirty seconds allowed ' +
      'for each crossing.',
    controls: ['Arrow keys', 'WASD', 'Touch pad'],
    colors: ['#123a6b', '#34d399'],
    tags: ['classic', 'arcade', 'timing', 'crossing'],
    mount: mount
  });
})();
