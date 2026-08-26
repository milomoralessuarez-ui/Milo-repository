/* Roll Block — tip a 1x1x2 block end over end and drop it into the hole. */
(function () {
  'use strict';
  var W = 780, H = 620, TILE = 46, DEPTH = 18;
  var OX = W / 2, OY = 150;

  // Board glyphs: . floor, space void, O goal, X fragile (a standing block breaks it),
  // B bridge tile (starts off), s switch (toggles bridges).
  var LEVELS = [
    {
      name: 'First Tip',
      grid: [
        '  ....  ',
        ' .....  ',
        ' ..O..  ',
        ' .....  ',
        '  ....  '
      ],
      start: [2, 2]
    },
    {
      name: 'The Gap',
      grid: [
        '....    ',
        '....    ',
        '..... ..',
        '  ...O..',
        '  ......'
      ],
      start: [1, 1]
    },
    {
      name: 'Thin Ice',
      grid: [
        '.....   ',
        '.XXX.   ',
        '.XXX....',
        '.....O..',
        '    ....'
      ],
      start: [1, 0]
    },
    {
      name: 'Switchback',
      grid: [
        '..s..   ',
        '.....   ',
        '..BBB...',
        '.....O..',
        '.....  .'
      ],
      start: [1, 3]
    },
    {
      name: 'Far Side',
      grid: [
        '...  ...',
        '...BB...',
        '...  ..O',
        '...  ...',
        '..s  ...'
      ],
      start: [0, 0]
    }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function tileAt(d, x, y) {
      if (y < 0 || y >= d.grid.length) return ' ';
      var row = d.grid[y];
      if (x < 0 || x >= row.length) return ' ';
      return row[x];
    }

    /**
     * The block is stored as its two occupied cells. Standing means both are the
     * same cell; lying means they are adjacent. Every rule falls out of that.
     */
    function cells(b) {
      return b.a[0] === b.b[0] && b.a[1] === b.b[1] ? [b.a] : [b.a, b.b];
    }

    function standing(b) { return b.a[0] === b.b[0] && b.a[1] === b.b[1]; }

    function loadLevel(g, n) {
      var d = g.data;
      var L = LEVELS[n % LEVELS.length];
      d.levelName = L.name;
      d.grid = L.grid.map(function (r) { return r.split(''); });
      d.broken = {};
      d.bridgeOn = false;
      d.block = { a: L.start.slice(), b: L.start.slice() };
      d.moves = 0;
      d.falling = 0;
      d.won = 0;
      d.anim = null;
      g.set('Level', (n % LEVELS.length) + 1);
      g.set('Moves', 0);
      g.set('Stage', d.levelName);
    }

    function reset(g) {
      var d = g.data;
      d.level = d.level || 0;
      d.total = d.total || 0;
      loadLevel(g, d.level);
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    /** A cell is solid unless it is void, a broken fragile tile, or a bridge that is off. */
    function solid(d, x, y) {
      var t = tileAt(d, x, y);
      if (t === ' ') return false;
      if (t === 'X' && d.broken[x + ',' + y]) return false;
      if (t === 'B' && !d.bridgeOn) return false;
      return true;
    }

    function roll(g, dx, dy) {
      var d = g.data;
      if (d.anim || d.falling || d.won) return;
      var b = d.block;
      var na, nb;

      if (standing(b)) {
        // Standing tips onto two cells in the direction of travel.
        var x = b.a[0], y = b.a[1];
        na = [x + dx, y + dy];
        nb = [x + dx * 2, y + dy * 2];
      } else {
        var horiz = b.a[1] === b.b[1];
        var along = horiz ? dx !== 0 : dy !== 0;
        if (along) {
          // Rolling along its length stands the block back up beyond the far end.
          var lead = (dx + dy) > 0
            ? (horiz ? (b.a[0] > b.b[0] ? b.a : b.b) : (b.a[1] > b.b[1] ? b.a : b.b))
            : (horiz ? (b.a[0] < b.b[0] ? b.a : b.b) : (b.a[1] < b.b[1] ? b.a : b.b));
          na = [lead[0] + dx, lead[1] + dy];
          nb = na.slice();
        } else {
          // Rolling sideways keeps it lying, shifted one cell.
          na = [b.a[0] + dx, b.a[1] + dy];
          nb = [b.b[0] + dx, b.b[1] + dy];
        }
      }

      var next = { a: na, b: nb };
      d.anim = { from: { a: b.a.slice(), b: b.b.slice() }, to: next, t: 0, dir: [dx, dy] };
      d.moves++;
      g.set('Moves', d.moves);
      Milo.sound.click();
    }

    function settle(g) {
      var d = g.data;
      var b = d.block;
      var cs = cells(b);

      // Goal: only a standing block drops through the hole.
      if (standing(b) && tileAt(d, b.a[0], b.a[1]) === 'O') {
        d.won = .01;
        Milo.sound.win();
        return;
      }

      var supported = cs.every(function (p) { return solid(d, p[0], p[1]); });
      if (!supported) {
        d.falling = .01;
        Milo.sound.lose();
        return;
      }

      // Standing on fragile ice puts the whole weight on one tile and breaks it.
      if (standing(b) && tileAt(d, b.a[0], b.a[1]) === 'X') {
        d.broken[b.a[0] + ',' + b.a[1]] = true;
        d.falling = .01;
        Milo.sound.explode();
        return;
      }

      // A switch flips every bridge tile on the board.
      var onSwitch = cs.some(function (p) { return tileAt(d, p[0], p[1]) === 's'; });
      if (onSwitch && !d.switchHeld) {
        d.bridgeOn = !d.bridgeOn;
        Milo.sound.powerup();
      }
      d.switchHeld = onSwitch;
    }

    function iso(x, y, lift) {
      // A gentle isometric skew, enough to read depth without a 3D pipeline.
      return {
        x: OX + (x - y) * TILE * .72,
        y: OY + (x + y) * TILE * .38 - (lift || 0)
      };
    }

    function drawTop(c, x, y, lift, fill, stroke) {
      var p = iso(x, y, lift);
      var hw = TILE * .72, hh = TILE * .38;
      c.beginPath();
      c.moveTo(p.x, p.y - hh);
      c.lineTo(p.x + hw, p.y);
      c.lineTo(p.x, p.y + hh);
      c.lineTo(p.x - hw, p.y);
      c.closePath();
      c.fillStyle = fill;
      c.fill();
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); }
      return p;
    }

    return Milo.arcade(host, {
      id: 'roll-block',
      w: W, h: H, bg: '#151a2e',
      stats: ['Score', 'Level', 'Stage', 'Moves', 'Best'],
      emo: '🧊',
      trackBest: true,
      touch: 'dpad',
      start: {
        title: 'Roll Block',
        text: 'Tip the block end over end. It only falls through the hole standing upright, ' +
          'so getting there is half the puzzle and arriving the right way up is the other half.',
        keys: ['Arrows / WASD to roll', 'R to restart the level']
      },
      init: reset,

      onKey: function (g, e, name) {
        if (g.state !== 'play') return;
        var d = g.data;
        if (e.code === 'KeyR') { loadLevel(g, d.level); return; }
        if (name === 'left') roll(g, -1, 0);
        else if (name === 'right') roll(g, 1, 0);
        else if (name === 'up') roll(g, 0, -1);
        else if (name === 'down') roll(g, 0, 1);
      },

      update: function (g, dt) {
        var d = g.data;

        if (d.anim) {
          d.anim.t += dt * 7;
          if (d.anim.t >= 1) {
            d.block = { a: d.anim.to.a.slice(), b: d.anim.to.b.slice() };
            d.anim = null;
            settle(g);
          }
          return;
        }

        if (d.falling) {
          d.falling += dt;
          if (d.falling > .7) loadLevel(g, d.level);
          return;
        }

        if (d.won) {
          d.won += dt;
          if (d.won > .9) {
            // Fewer moves is a better solve, so the par bonus rewards a tidy route.
            var bonus = Math.max(60, 500 - d.moves * 22);
            g.score += 300 + bonus;
            g.set('Score', g.score);
            d.total++;
            d.level++;
            if (d.level >= LEVELS.length) {
              g.win({
                emo: '🧊', title: 'Every board cleared!',
                text: 'You rolled through all ' + LEVELS.length + ' stages.',
                score: g.score
              });
              d.level = 0;
              return;
            }
            loadLevel(g, d.level);
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1d2440'); bg.addColorStop(1, '#0e1220');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        var rows = d.grid.length;
        var maxCols = 0;
        d.grid.forEach(function (r) { maxCols = Math.max(maxCols, r.length); });

        // Painter's order: far tiles first so nearer ones overlap correctly.
        for (var s = 0; s < rows + maxCols; s++) {
          for (var y = 0; y < rows; y++) {
            var x = s - y;
            if (x < 0 || x >= maxCols) continue;
            var t = tileAt(d, x, y);
            if (t === ' ') continue;
            var brokenHere = t === 'X' && d.broken[x + ',' + y];
            if (brokenHere) continue;
            if (t === 'B' && !d.bridgeOn) {
              // An off bridge is drawn as an outline so the route is still readable.
              var gp = iso(x, y, 0);
              c.strokeStyle = 'rgba(120,190,255,.3)';
              c.setLineDash([4, 5]);
              c.lineWidth = 1.5;
              c.beginPath();
              c.moveTo(gp.x, gp.y - TILE * .38);
              c.lineTo(gp.x + TILE * .72, gp.y);
              c.lineTo(gp.x, gp.y + TILE * .38);
              c.lineTo(gp.x - TILE * .72, gp.y);
              c.closePath(); c.stroke();
              c.setLineDash([]);
              continue;
            }

            var fill = '#5f6f9c';
            if (t === 'O') fill = '#2a3350';
            else if (t === 'X') fill = '#7fa8d8';
            else if (t === 'B') fill = '#4f86c6';
            else if (t === 's') fill = '#c08a4a';
            else fill = (x + y) % 2 ? '#5f6f9c' : '#55648e';

            var p = iso(x, y, 0);
            // Side faces give the slab thickness.
            c.fillStyle = U.shade(fill, -34);
            c.beginPath();
            c.moveTo(p.x - TILE * .72, p.y);
            c.lineTo(p.x, p.y + TILE * .38);
            c.lineTo(p.x, p.y + TILE * .38 + DEPTH);
            c.lineTo(p.x - TILE * .72, p.y + DEPTH);
            c.closePath(); c.fill();
            c.fillStyle = U.shade(fill, -20);
            c.beginPath();
            c.moveTo(p.x + TILE * .72, p.y);
            c.lineTo(p.x, p.y + TILE * .38);
            c.lineTo(p.x, p.y + TILE * .38 + DEPTH);
            c.lineTo(p.x + TILE * .72, p.y + DEPTH);
            c.closePath(); c.fill();

            drawTop(c, x, y, 0, fill, 'rgba(0,0,0,.25)');

            if (t === 'O') {
              c.fillStyle = '#0a0d18';
              c.beginPath();
              c.ellipse(p.x, p.y, TILE * .46, TILE * .24, 0, 0, Math.PI * 2);
              c.fill();
            } else if (t === 's') {
              c.fillStyle = d.bridgeOn ? '#ffd166' : '#8a6a3a';
              c.beginPath();
              c.ellipse(p.x, p.y, TILE * .26, TILE * .14, 0, 0, Math.PI * 2);
              c.fill();
            } else if (t === 'X') {
              c.strokeStyle = 'rgba(255,255,255,.35)';
              c.lineWidth = 1;
              c.beginPath();
              c.moveTo(p.x - 12, p.y - 3); c.lineTo(p.x + 4, p.y + 4);
              c.moveTo(p.x + 10, p.y - 4); c.lineTo(p.x - 2, p.y + 5);
              c.stroke();
            }
          }
        }

        // --- the block --------------------------------------------------------
        var b = d.block, drawCells, lift = 0, alpha = 1;
        if (d.anim) {
          // Mid-roll, interpolate between the two footprints and arc it upward.
          var k = U.clamp(d.anim.t, 0, 1);
          var ease = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          var fa = d.anim.from, ta = d.anim.to;
          drawCells = [
            [fa.a[0] + (ta.a[0] - fa.a[0]) * ease, fa.a[1] + (ta.a[1] - fa.a[1]) * ease],
            [fa.b[0] + (ta.b[0] - fa.b[0]) * ease, fa.b[1] + (ta.b[1] - fa.b[1]) * ease]
          ];
          lift = Math.sin(k * Math.PI) * 12;
        } else {
          drawCells = cells(b).map(function (p) { return [p[0], p[1]]; });
          if (d.falling) { lift = -d.falling * 260; alpha = Math.max(0, 1 - d.falling / .7); }
          if (d.won) { lift = -d.won * 120; alpha = Math.max(0, 1 - d.won / .9); }
        }

        c.globalAlpha = alpha;
        var height = drawCells.length === 1 ? TILE * 1.55 : TILE * .78;
        drawCells.slice().sort(function (p, q) { return (p[0] + p[1]) - (q[0] + q[1]); }).forEach(function (p) {
          var ip = iso(p[0], p[1], lift);
          var hw = TILE * .72, hh = TILE * .38;
          c.fillStyle = '#b8481f';
          c.beginPath();
          c.moveTo(ip.x - hw, ip.y);
          c.lineTo(ip.x, ip.y + hh);
          c.lineTo(ip.x, ip.y + hh - height);
          c.lineTo(ip.x - hw, ip.y - height);
          c.closePath(); c.fill();
          c.fillStyle = '#d4602c';
          c.beginPath();
          c.moveTo(ip.x + hw, ip.y);
          c.lineTo(ip.x, ip.y + hh);
          c.lineTo(ip.x, ip.y + hh - height);
          c.lineTo(ip.x + hw, ip.y - height);
          c.closePath(); c.fill();
          c.fillStyle = '#f2874a';
          c.beginPath();
          c.moveTo(ip.x, ip.y - hh - height);
          c.lineTo(ip.x + hw, ip.y - height);
          c.lineTo(ip.x, ip.y + hh - height);
          c.lineTo(ip.x - hw, ip.y - height);
          c.closePath(); c.fill();
          c.strokeStyle = 'rgba(0,0,0,.3)';
          c.lineWidth = 1.5;
          c.stroke();
        });
        c.globalAlpha = 1;

        c.fillStyle = 'rgba(255,255,255,.55)';
        c.font = '600 13px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('The block only drops through the hole standing upright · R restarts the level',
          W / 2, H - 18);
      }
    });
  }

  window.Milo.register({
    id: 'roll-block', title: 'Roll Block', emo: '🧊', category: 'Puzzle',
    tagline: 'Tip it end over end into the hole',
    description: 'A block twice as tall as it is wide, and a hole exactly one square across. ' +
      'It tips end over end, so it spends half its time lying flat across two tiles and half ' +
      'standing on one — and it only drops through the hole while standing. Pale tiles crack ' +
      'under the full weight of a standing block, orange switches flip bridges in and out of ' +
      'existence, and the edge of the board is always one careless roll away.',
    controls: ['Arrows / WASD to roll the block', 'R to restart the current level'],
    colors: ['#1d2440', '#d4602c'],
    tags: ['puzzle', 'logic', 'isometric', 'brain'],
    mount: mount
  });
})();
