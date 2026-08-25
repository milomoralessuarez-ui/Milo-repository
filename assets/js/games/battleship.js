/* Battleship — place your fleet, then hunt theirs. */
(function () {
  'use strict';
  var N = 10, W = 900, H = 620, CELL = 40;
  var SHIPS = [
    { name: 'Carrier', len: 5 }, { name: 'Battleship', len: 4 },
    { name: 'Cruiser', len: 3 }, { name: 'Submarine', len: 3 }, { name: 'Destroyer', len: 2 }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function emptyGrid() { return { cells: new Int8Array(N * N), ships: [] }; }

    function reset(g) {
      var d = g.data;
      d.you = emptyGrid();
      d.foe = emptyGrid();
      d.phase = 'place';
      d.placing = 0;
      d.horiz = true;
      d.hover = null;
      d.msg = 'Place your ' + SHIPS[0].name + ' (' + SHIPS[0].len + ')';
      d.youShots = new Int8Array(N * N);   // 1 miss, 2 hit
      d.foeShots = new Int8Array(N * N);
      d.hunt = [];
      d.turn = 'you';
      d.thinking = 0;
      d.shots = 0;
      randomFleet(d.foe);
      g.set('Shots', 0);
      g.set('Sunk', '0/5');
      g.set('Lost', '0/5');
    }

    function fits(grid, x, y, len, horiz) {
      for (var i = 0; i < len; i++) {
        var cx = x + (horiz ? i : 0), cy = y + (horiz ? 0 : i);
        if (cx >= N || cy >= N) return false;
        if (grid.cells[cy * N + cx]) return false;
      }
      return true;
    }

    function put(grid, x, y, len, horiz, name) {
      var cells = [];
      for (var i = 0; i < len; i++) {
        var cx = x + (horiz ? i : 0), cy = y + (horiz ? 0 : i);
        grid.cells[cy * N + cx] = grid.ships.length + 1;
        cells.push(cy * N + cx);
      }
      grid.ships.push({ name: name, cells: cells, hits: 0, len: len });
    }

    function randomFleet(grid) {
      SHIPS.forEach(function (s) {
        for (var tries = 0; tries < 400; tries++) {
          var horiz = Math.random() < .5;
          var x = U.randInt(0, N - 1), y = U.randInt(0, N - 1);
          if (fits(grid, x, y, s.len, horiz)) { put(grid, x, y, s.len, horiz, s.name); return; }
        }
      });
    }

    function boardX(which) { return which === 'you' ? 40 : W - 40 - N * CELL; }
    var BOARD_Y = 90;

    function cellAt(which, px, py) {
      var bx = boardX(which);
      var x = Math.floor((px - bx) / CELL), y = Math.floor((py - BOARD_Y) / CELL);
      if (x < 0 || y < 0 || x >= N || y >= N) return null;
      return { x: x, y: y };
    }

    function sunkCount(grid) {
      return grid.ships.filter(function (s) { return s.hits >= s.len; }).length;
    }

    function fire(g, at) {
      var d = g.data;
      var idx = at.y * N + at.x;
      if (d.youShots[idx]) return;
      d.shots++;
      g.set('Shots', d.shots);
      var shipId = d.foe.cells[idx];
      if (shipId) {
        d.youShots[idx] = 2;
        var ship = d.foe.ships[shipId - 1];
        ship.hits++;
        Milo.sound.explode();
        d.msg = ship.hits >= ship.len ? 'You sank their ' + ship.name + '!' : 'Hit!';
        g.set('Sunk', sunkCount(d.foe) + '/5');
        if (sunkCount(d.foe) === 5) {
          g.win({
            emo: '🚢', title: 'Fleet destroyed!',
            text: 'You won in ' + d.shots + ' shots.',
            score: Math.max(200, 3000 - d.shots * 12)
          });
          d.phase = 'over';
          return;
        }
      } else {
        d.youShots[idx] = 1;
        d.msg = 'Miss.';
        Milo.sound.tone({ f: 200, f2: 120, d: .12, v: .06, type: 'sawtooth' });
      }
      d.turn = 'foe';
      d.thinking = 0.7;
    }

    function foeFire(g) {
      var d = g.data;
      var idx;
      // Hunt mode: after a hit, work outward from it before going random again.
      if (d.hunt.length) {
        idx = d.hunt.pop();
        if (d.foeShots[idx]) { foeFire(g); return; }
      } else {
        var free = [];
        for (var i = 0; i < N * N; i++) {
          // Checkerboard search finds ships faster than pure random.
          if (!d.foeShots[i] && ((i % N) + Math.floor(i / N)) % 2 === 0) free.push(i);
        }
        if (!free.length) {
          for (var j = 0; j < N * N; j++) if (!d.foeShots[j]) free.push(j);
        }
        if (!free.length) return;
        idx = U.choice(free);
      }

      var shipId = d.you.cells[idx];
      if (shipId) {
        d.foeShots[idx] = 2;
        var ship = d.you.ships[shipId - 1];
        ship.hits++;
        Milo.sound.hit();
        d.msg = ship.hits >= ship.len ? 'They sank your ' + ship.name + '!' : 'They hit you.';
        var x = idx % N, y = Math.floor(idx / N);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (o) {
          var nx = x + o[0], ny = y + o[1];
          if (nx >= 0 && ny >= 0 && nx < N && ny < N && !d.foeShots[ny * N + nx]) {
            d.hunt.push(ny * N + nx);
          }
        });
        g.set('Lost', sunkCount(d.you) + '/5');
        if (sunkCount(d.you) === 5) {
          g.gameOver({
            emo: '🚢', title: 'Your fleet is gone',
            text: 'You sank ' + sunkCount(d.foe) + ' of theirs in ' + d.shots + ' shots.',
            score: sunkCount(d.foe) * 200
          });
          d.phase = 'over';
          return;
        }
      } else {
        d.foeShots[idx] = 1;
        d.msg = 'They missed.';
        Milo.sound.click();
      }
      d.turn = 'you';
    }

    return Milo.arcade(host, {
      id: 'battleship',
      w: W, h: H, bg: '#0a1d33',
      stats: ['Shots', 'Sunk', 'Lost'],
      emo: '🚢',
      start: {
        title: 'Battleship',
        text: 'Place five ships, then take turns firing. Press R to rotate while placing, ' +
          'or hit Random to have the fleet laid out for you.',
        keys: ['Click to place / fire', 'R to rotate']
      },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        if (e.code === 'KeyR' && d.phase === 'place') d.horiz = !d.horiz;
      },

      onPointer: function (g, type, px, py) {
        var d = g.data;
        if (type === 'move') {
          d.hover = cellAt(d.phase === 'place' ? 'you' : 'foe', px, py);
          return;
        }
        if (type !== 'down' || g.state !== 'play') return;

        if (d.phase === 'place') {
          if (px > 40 && px < 200 && py > BOARD_Y + N * CELL + 16 && py < BOARD_Y + N * CELL + 56) {
            d.you = emptyGrid();
            randomFleet(d.you);
            d.phase = 'fight';
            d.msg = 'Fire at will';
            return;
          }
          var at = cellAt('you', px, py);
          if (!at) return;
          var s = SHIPS[d.placing];
          if (!fits(d.you, at.x, at.y, s.len, d.horiz)) {
            Milo.sound.tone({ f: 140, d: .08, v: .05, type: 'square' });
            return;
          }
          put(d.you, at.x, at.y, s.len, d.horiz, s.name);
          Milo.sound.click();
          d.placing++;
          if (d.placing >= SHIPS.length) {
            d.phase = 'fight';
            d.msg = 'Fire at will';
          } else {
            d.msg = 'Place your ' + SHIPS[d.placing].name + ' (' + SHIPS[d.placing].len + ')';
          }
          return;
        }

        if (d.phase === 'fight' && d.turn === 'you') {
          var t = cellAt('foe', px, py);
          if (t) fire(g, t);
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.thinking > 0) {
          d.thinking -= dt;
          if (d.thinking <= 0 && d.turn === 'foe' && d.phase === 'fight') foeFire(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0e2a4a'); bg.addColorStop(1, '#061424');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        function grid(which, shots, showShips) {
          var bx = boardX(which);
          c.fillStyle = 'rgba(255,255,255,.55)';
          c.font = '700 13px Outfit, sans-serif';
          c.textAlign = 'left';
          c.fillText(which === 'you' ? 'YOUR WATERS' : 'ENEMY WATERS', bx, BOARD_Y - 14);

          for (var y = 0; y < N; y++) {
            for (var x = 0; x < N; x++) {
              var idx = y * N + x;
              var px = bx + x * CELL, py = BOARD_Y + y * CELL;
              c.fillStyle = (x + y) % 2 ? 'rgba(30,80,140,.55)' : 'rgba(24,66,118,.55)';
              c.fillRect(px, py, CELL - 2, CELL - 2);

              var grid2 = which === 'you' ? d.you : d.foe;
              var shipId = grid2.cells[idx];
              var sunk = shipId && grid2.ships[shipId - 1].hits >= grid2.ships[shipId - 1].len;
              if (shipId && (showShips || sunk)) {
                c.fillStyle = sunk ? '#7d2f3d' : '#4a5570';
                U.roundRect(c, px + 3, py + 3, CELL - 8, CELL - 8, 4); c.fill();
              }
              if (shots[idx] === 1) {
                c.fillStyle = 'rgba(255,255,255,.5)';
                c.beginPath(); c.arc(px + CELL / 2 - 1, py + CELL / 2 - 1, 5, 0, 7); c.fill();
              } else if (shots[idx] === 2) {
                c.fillStyle = '#ff5b7f';
                c.font = '800 20px Outfit, sans-serif';
                c.textAlign = 'center';
                c.fillText('✕', px + CELL / 2 - 1, py + CELL / 2 + 6);
                c.textAlign = 'left';
              }
            }
          }
        }

        grid('you', d.foeShots, true);
        grid('foe', d.youShots, false);

        // placement preview
        if (d.phase === 'place' && d.hover) {
          var s = SHIPS[d.placing];
          var ok = fits(d.you, d.hover.x, d.hover.y, s.len, d.horiz);
          c.fillStyle = ok ? 'rgba(52,211,153,.5)' : 'rgba(251,113,133,.5)';
          for (var i = 0; i < s.len; i++) {
            var cx = d.hover.x + (d.horiz ? i : 0), cy = d.hover.y + (d.horiz ? 0 : i);
            if (cx >= N || cy >= N) continue;
            c.fillRect(boardX('you') + cx * CELL, BOARD_Y + cy * CELL, CELL - 2, CELL - 2);
          }
          c.fillStyle = 'rgba(255,255,255,.14)';
          U.roundRect(c, 40, BOARD_Y + N * CELL + 16, 160, 40, 9); c.fill();
          c.fillStyle = '#fff';
          c.font = '700 13px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('Random placement', 120, BOARD_Y + N * CELL + 41);
        } else if (d.phase === 'fight' && d.hover && d.turn === 'you') {
          c.strokeStyle = '#ffd257'; c.lineWidth = 2;
          c.strokeRect(boardX('foe') + d.hover.x * CELL, BOARD_Y + d.hover.y * CELL, CELL - 2, CELL - 2);
        }

        c.fillStyle = '#e6ecff';
        c.font = '700 17px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(d.msg, W / 2, H - 26);
        if (d.phase === 'place') {
          c.fillStyle = 'rgba(255,255,255,.5)';
          c.font = '600 12px Outfit, sans-serif';
          c.fillText('Press R to rotate — currently ' + (d.horiz ? 'horizontal' : 'vertical'), W / 2, H - 8);
        }
      }
    });
  }

  window.Milo.register({
    id: 'battleship', title: 'Battleship', emo: '🚢', category: 'Strategy',
    tagline: 'Place your fleet, then hunt theirs',
    description: 'Lay out five ships — press R to rotate, or let the game place them — ' +
      'then trade shots. The computer searches in a checkerboard pattern until it lands a ' +
      'hit, then works outward from it, so a wounded ship rarely survives long. Sink all ' +
      'five to win.',
    controls: ['Click to place', 'R to rotate', 'Click to fire'],
    colors: ['#0a1d33', '#38bdf8'],
    tags: ['board game', 'vs cpu', 'strategy', 'classic'],
    mount: mount
  });
})();
