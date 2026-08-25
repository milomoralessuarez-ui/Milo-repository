/* Box Push — Sokoban: shove every crate onto a target. */
(function () {
  'use strict';
  var W = 700, H = 620;
  var LEVELS = [
    ['#######', '#     #', '# .$@ #', '#     #', '#######'],
    ['########', '#      #', '# .$ $.#', '#  @   #', '#      #', '########'],
    ['#########', '#   #   #', '# $ $ . #', '# @ # . #', '#       #', '#########'],
    ['########', '#. #   #', '#  $   #', '#  #$# #', '#. @ . #', '#  $   #', '########'],
    ['#########', '#  .    #', '# $$$   #', '#  @  . #', '#    .  #', '#########'],
    ['##########', '#   #    #', '# $ $ .. #', '#  @#  . #', '# $      #', '#    #   #', '##########']
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.level = d.level || 0;
      load(d);
      g.set('Level', d.level + 1);
      g.set('Moves', 0);
      g.set('Crates', d.targets.length);
    }

    function load(d) {
      var map = LEVELS[d.level % LEVELS.length];
      d.rows = map.length;
      d.cols = Math.max.apply(null, map.map(function (r) { return r.length; }));
      d.wall = [];
      d.targets = [];
      d.boxes = [];
      for (var y = 0; y < d.rows; y++) {
        var row = [];
        for (var x = 0; x < d.cols; x++) {
          var ch = map[y][x] || ' ';
          row.push(ch === '#');
          if (ch === '.' || ch === '*') d.targets.push({ x: x, y: y });
          if (ch === '$' || ch === '*') d.boxes.push({ x: x, y: y });
          if (ch === '@') d.p = { x: x, y: y };
        }
        d.wall.push(row);
      }
      d.moves = 0;
      d.history = [];
      d.done = false;
      d.cell = Math.min(70, Math.floor(Math.min((W - 80) / d.cols, (H - 140) / d.rows)));
      d.ox = (W - d.cols * d.cell) / 2;
      d.oy = (H - d.rows * d.cell) / 2 + 10;
    }

    function boxAt(d, x, y) {
      for (var i = 0; i < d.boxes.length; i++) {
        if (d.boxes[i].x === x && d.boxes[i].y === y) return d.boxes[i];
      }
      return null;
    }
    function onTarget(d, b) {
      return d.targets.some(function (t) { return t.x === b.x && t.y === b.y; });
    }

    function move(g, dx, dy) {
      var d = g.data;
      if (d.done) return;
      var nx = d.p.x + dx, ny = d.p.y + dy;
      if (d.wall[ny] && d.wall[ny][nx]) return;
      var b = boxAt(d, nx, ny);
      if (b) {
        var bx = nx + dx, by = ny + dy;
        if ((d.wall[by] && d.wall[by][bx]) || boxAt(d, bx, by)) return;
        d.history.push({ p: { x: d.p.x, y: d.p.y }, box: b, from: { x: b.x, y: b.y } });
        b.x = bx; b.y = by;
        Milo.sound.tone({ f: 260, d: .06, v: .05, type: 'square' });
      } else {
        d.history.push({ p: { x: d.p.x, y: d.p.y } });
        Milo.sound.click();
      }
      d.p.x = nx; d.p.y = ny;
      d.moves++;
      g.set('Moves', d.moves);

      var placed = d.boxes.filter(function (q) { return onTarget(d, q); }).length;
      g.set('Crates', (d.targets.length - placed) + ' left');
      if (placed === d.boxes.length) {
        d.done = true;
        var earned = Math.max(80, 700 - d.moves * 8);
        g.score += earned;
        Milo.sound.win();
        d.level++;
        g.overlay({
          emo: '📦', title: 'Level solved!',
          text: d.moves + ' moves — worth ' + earned + ' points.',
          score: g.score,
          best: g.best,
          newBest: Milo.store.setBest('box-push', g.score),
          actions: [
            { label: 'Next level →', primary: true, onClick: function () { next(g); } },
            { label: 'Start over', onClick: function () { g.data.level = 0; g.restart(); } }
          ]
        });
      }
    }

    function undo(g) {
      var d = g.data;
      var last = d.history.pop();
      if (!last || d.done) return;
      d.p.x = last.p.x; d.p.y = last.p.y;
      if (last.box) { last.box.x = last.from.x; last.box.y = last.from.y; }
      d.moves++;
      g.set('Moves', d.moves);
    }

    function next(g) {
      g.clearOverlay();
      var keepScore = g.score, keepLevel = g.data.level;
      reset(g);
      g.data.level = keepLevel;
      g.score = keepScore;
      g.state = 'play';
      g.set('Level', keepLevel + 1);
      g.best = Milo.store.best('box-push');
    }

    return Milo.arcade(host, {
      id: 'box-push',
      w: W, h: H, bg: '#1c1508',
      stats: ['Level', 'Moves', 'Crates'],
      touch: 'dpad',
      emo: '📦',
      start: {
        title: 'Box Push',
        text: 'Push every crate onto a marked square. You can only push, never pull — so ' +
          'a crate shoved into a corner is stuck for good. Press U to undo, R to restart.',
        keys: ['Arrow keys / WASD', 'U undo', 'R restart']
      },
      preload: function (g) { g.data.level = 0; },
      init: reset,

      onKey: function (g, e) {
        var m = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
          ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] }[e.code];
        if (m) { e.preventDefault(); move(g, m[0], m[1]); return; }
        if (e.code === 'KeyU') undo(g);
        if (e.code === 'KeyR') { load(g.data); g.set('Moves', 0); }
      },

      update: function (g) {
        var i = g.input;
        if (i.pressed('up')) move(g, 0, -1);
        if (i.pressed('down')) move(g, 0, 1);
        if (i.pressed('left')) move(g, -1, 0);
        if (i.pressed('right')) move(g, 1, 0);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, s = d.cell;
        c.fillStyle = '#1c1508'; c.fillRect(0, 0, W, H);

        for (var y = 0; y < d.rows; y++) {
          for (var x = 0; x < d.cols; x++) {
            var px = d.ox + x * s, py = d.oy + y * s;
            if (d.wall[y][x]) {
              c.fillStyle = '#5a4023';
              U.roundRect(c, px + 1, py + 1, s - 2, s - 2, 4); c.fill();
              c.fillStyle = 'rgba(255,255,255,.06)';
              U.roundRect(c, px + 4, py + 4, s - 8, 5, 2); c.fill();
            } else {
              c.fillStyle = (x + y) % 2 ? '#2a2010' : '#241b0d';
              c.fillRect(px, py, s, s);
            }
          }
        }

        d.targets.forEach(function (t) {
          c.strokeStyle = '#34d399'; c.lineWidth = 3;
          c.beginPath();
          c.arc(d.ox + t.x * s + s / 2, d.oy + t.y * s + s / 2, s * .2, 0, 7);
          c.stroke();
        });

        d.boxes.forEach(function (b) {
          var ok = onTarget(d, b);
          var px = d.ox + b.x * s, py = d.oy + b.y * s;
          c.fillStyle = ok ? '#34d399' : '#c08040';
          U.roundRect(c, px + 6, py + 6, s - 12, s - 12, 6); c.fill();
          c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 2;
          c.beginPath();
          c.moveTo(px + 6, py + 6); c.lineTo(px + s - 6, py + s - 6);
          c.moveTo(px + s - 6, py + 6); c.lineTo(px + 6, py + s - 6);
          c.stroke();
        });

        var pp = { x: d.ox + d.p.x * s + s / 2, y: d.oy + d.p.y * s + s / 2 };
        c.fillStyle = '#22d3ee';
        c.beginPath(); c.arc(pp.x, pp.y, s * .28, 0, 7); c.fill();
        c.fillStyle = '#062a33';
        c.beginPath();
        c.arc(pp.x - s * .09, pp.y - s * .05, s * .05, 0, 7);
        c.arc(pp.x + s * .09, pp.y - s * .05, s * .05, 0, 7);
        c.fill();

        c.fillStyle = 'rgba(255,255,255,.4)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('U undoes · R restarts the level', W / 2, H - 16);
      }
    });
  }

  window.Milo.register({
    id: 'box-push', title: 'Box Push', emo: '📦', category: 'Puzzle',
    tagline: 'Sokoban — push, never pull',
    description: 'Shove every crate onto a green marker. The catch is that you can only ' +
      'push: once a crate is in a corner or flat against a wall in the wrong place, that ' +
      'level is unwinnable and you will have to undo. Six hand-built levels, each needing a ' +
      'different order of operations.',
    controls: ['Arrow keys', 'WASD', 'U undo', 'R restart'],
    colors: ['#5a4023', '#34d399'],
    tags: ['sokoban', 'logic', 'brain', 'levels'],
    mount: mount
  });
})();
