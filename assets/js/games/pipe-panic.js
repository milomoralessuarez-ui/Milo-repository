/* Pipe Panic — lay the pipe before the sludge catches you up. */
(function () {
  'use strict';
  var COLS = 10, ROWS = 7, CELL = 62;
  var PAD_L = 116, PAD_T = 96;
  var W = PAD_L + COLS * CELL + 22, H = PAD_T + ROWS * CELL + 78;

  // Openings per piece, as [up, right, down, left] booleans packed in a string.
  var PIECES = [
    { k: 'h', o: [0, 1, 0, 1] },
    { k: 'v', o: [1, 0, 1, 0] },
    { k: 'ur', o: [1, 1, 0, 0] },
    { k: 'rd', o: [0, 1, 1, 0] },
    { k: 'dl', o: [0, 0, 1, 1] },
    { k: 'lu', o: [1, 0, 0, 1] },
    { k: 'x', o: [1, 1, 1, 1] }
  ];
  // Weights so straights and elbows dominate and crosses stay rare.
  var BAG = [0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6];

  var DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];   // up right down left
  var OPP = [2, 3, 0, 1];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function idx(x, y) { return y * COLS + x; }
    function inGrid(x, y) { return x >= 0 && x < COLS && y >= 0 && y < ROWS; }

    function cellX(x) { return PAD_L + x * CELL; }
    function cellY(y) { return PAD_T + y * CELL; }

    function drawPiece(c, piece, cx, cy, size, pipeCol, fillCol, fillFrom, fillAmt) {
      c.lineCap = 'butt';
      // casing
      c.strokeStyle = pipeCol;
      c.lineWidth = size * 0.4;
      strokeShape(c, piece, cx, cy, size);
      c.strokeStyle = U.shade(pipeCol, .28);
      c.lineWidth = size * 0.3;
      strokeShape(c, piece, cx, cy, size);
      c.strokeStyle = U.shade(pipeCol, -.5);
      c.lineWidth = size * 0.19;
      strokeShape(c, piece, cx, cy, size);
      if (fillAmt > 0) {
        c.save();
        // Fill grows from the entry side outward.
        var half = size / 2;
        var t = U.clamp(fillAmt, 0, 1), run = size * t;
        c.beginPath();
        if (fillFrom === 0) c.rect(cx - half, cy - half, size, run);
        else if (fillFrom === 2) c.rect(cx - half, cy + half - run, size, run);
        else if (fillFrom === 3) c.rect(cx - half, cy - half, run, size);
        else c.rect(cx + half - run, cy - half, run, size);
        c.clip();
        c.strokeStyle = fillCol;
        c.lineWidth = size * 0.19;
        strokeShape(c, piece, cx, cy, size);
        c.restore();
      }
    }

    function strokeShape(c, piece, cx, cy, size) {
      var half = size / 2;
      var o = piece.o;
      c.beginPath();
      if (o[0] && o[2] && !o[1] && !o[3]) { c.moveTo(cx, cy - half); c.lineTo(cx, cy + half); }
      else if (o[1] && o[3] && !o[0] && !o[2]) { c.moveTo(cx - half, cy); c.lineTo(cx + half, cy); }
      else if (o[0] && o[1] && o[2] && o[3]) {
        c.moveTo(cx, cy - half); c.lineTo(cx, cy + half);
        c.moveTo(cx - half, cy); c.lineTo(cx + half, cy);
      } else {
        // elbow: from one opening to the centre, then out the other
        for (var k = 0; k < 4; k++) {
          if (!o[k]) continue;
          var v = DIRS[k];
          c.moveTo(cx + v[0] * half, cy + v[1] * half);
          c.lineTo(cx, cy);
        }
      }
      c.stroke();
    }

    /* ------------------------------------------------------------- level */

    function newPiece() { return PIECES[BAG[U.randInt(0, BAG.length - 1)]]; }

    function buildLevel(g) {
      var d = g.data;
      d.grid = [];
      for (var i = 0; i < COLS * ROWS; i++) d.grid.push(null);
      d.blocks = {};
      var blocks = Math.min(9, Math.floor((d.level - 1) * 1.2));
      // Start tile: never on the last column, and facing into the board.
      d.start = { x: U.randInt(1, 2), y: U.randInt(1, ROWS - 2), dir: 1 };
      if (Math.random() < .35) { d.start.x = U.randInt(2, COLS - 3); d.start.y = 0; d.start.dir = 2; }
      var placed = 0, tries = 0;
      while (placed < blocks && tries < 200) {
        tries++;
        var bx = U.randInt(0, COLS - 1), by = U.randInt(0, ROWS - 1);
        if (bx === d.start.x && by === d.start.y) continue;
        var sv = DIRS[d.start.dir];
        if (bx === d.start.x + sv[0] && by === d.start.y + sv[1]) continue;
        if (d.blocks[idx(bx, by)]) continue;
        d.blocks[idx(bx, by)] = true;
        placed++;
      }
      d.queue = [];
      for (var q = 0; q < 5; q++) d.queue.push(newPiece());
      d.flowDelay = Math.max(4.5, 16 - d.level * 1.1);
      d.flowSpeed = 0.62 + d.level * 0.11;   // cells per second
      d.flowing = false;
      d.cur = { x: d.start.x, y: d.start.y, from: OPP[d.start.dir], t: 0 };
      d.filled = 0;
      d.target = Math.min(28, 7 + d.level * 2);
      d.dead = false;
      d.levelDone = 0;
      d.hoverX = -1; d.hoverY = -1;
      d.drips = [];
      d.shake = 0;
      g.set('Level', d.level);
      g.set('Pipes', '0/' + d.target);
    }

    function reset(g) {
      var d = g.data;
      d.level = 1;
      d.parts = [];
      d.msg = '';
      d.msgT = 0;
      buildLevel(g);
      g.score = 0;
      g.set('Score', 0);
    }

    function say(d, t) { d.msg = t; d.msgT = 1.9; }
    function award(g, n) { g.score = Math.max(0, g.score + n); g.set('Score', U.fmt(g.score)); }

    function splash(d, x, y, col, n) {
      for (var i = 0; i < (n || 10); i++) {
        var a = Math.random() * 6.283, s = U.rand(30, 170);
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60,
          life: U.rand(.25, .6), max: .6, col: col, r: U.rand(1.6, 3.4)
        });
      }
    }

    /* ----------------------------------------------------------- placing */

    function place(g, x, y) {
      var d = g.data;
      if (d.dead || d.levelDone) return;
      if (!inGrid(x, y) || d.blocks[idx(x, y)]) return;
      var existing = d.grid[idx(x, y)];
      // The tile the sludge is in (and everything it has filled) is locked.
      if (existing && existing.fill > 0) {
        Milo.sound.tone({ f: 160, f2: 100, d: .1, v: .06, type: 'sawtooth' });
        return;
      }
      if (existing) { award(g, -25); splash(d, cellX(x) + CELL / 2, cellY(y) + CELL / 2, '#94a3b8', 8); }
      d.grid[idx(x, y)] = { p: d.queue.shift(), fill: 0, from: -1, done: false, pop: .22 };
      d.queue.push(newPiece());
      Milo.sound.tone({ f: 520, f2: 700, d: .06, v: .05, type: 'square' });
    }

    /* -------------------------------------------------------------- flow */

    function endLevel(g, won) {
      var d = g.data;
      if (d.dead || d.levelDone) return;
      if (won) {
        d.levelDone = 0.001;
        var bonus = 500 * d.level + (d.filled - d.target) * 60;
        award(g, bonus);
        say(d, 'SECTION SEALED  +' + U.fmt(bonus));
        Milo.sound.win();
      } else {
        d.dead = true;
        d.shake = 20;
        Milo.sound.explode();
        g.gameOver({
          emo: '🔧', title: 'Sludge everywhere',
          text: 'Level ' + d.level + ': ' + d.filled + ' of ' + d.target + ' sections laid.'
        });
      }
    }

    function advance(g) {
      var d = g.data;
      var cellNow = d.grid[idx(d.cur.x, d.cur.y)];
      if (!cellNow) { endLevel(g, d.filled >= d.target); return; }
      // Which way does the sludge leave this piece?
      var o = cellNow.p.o;
      var exit = -1;
      if (!o[d.cur.from]) {                                            // sludge hits a solid wall
        splash(d, cellX(d.cur.x) + CELL / 2, cellY(d.cur.y) + CELL / 2, '#65a30d', 22);
        endLevel(g, d.filled >= d.target);
        return;
      }
      if (o[0] && o[1] && o[2] && o[3]) exit = OPP[d.cur.from];        // cross: straight through
      else {
        for (var k = 0; k < 4; k++) if (o[k] && k !== d.cur.from) { exit = k; break; }
      }
      if (exit < 0) { endLevel(g, d.filled >= d.target); return; }
      cellNow.done = true;
      d.filled++;
      g.set('Pipes', d.filled + '/' + d.target);
      award(g, 25 + d.level * 5);
      Milo.sound.tone({ f: 300 + d.filled * 9, d: .05, v: .04, type: 'triangle' });
      var v = DIRS[exit];
      var nx = d.cur.x + v[0], ny = d.cur.y + v[1];
      if (!inGrid(nx, ny) || d.blocks[idx(nx, ny)]) {
        splash(d, cellX(d.cur.x) + CELL / 2 + v[0] * 30, cellY(d.cur.y) + CELL / 2 + v[1] * 30, '#65a30d', 20);
        endLevel(g, d.filled >= d.target);
        return;
      }
      var nextCell = d.grid[idx(nx, ny)];
      if (!nextCell || !nextCell.p.o[OPP[exit]]) {
        splash(d, cellX(nx) + CELL / 2, cellY(ny) + CELL / 2, '#65a30d', 22);
        endLevel(g, d.filled >= d.target);
        return;
      }
      d.cur = { x: nx, y: ny, from: OPP[exit], t: 0 };
      nextCell.from = OPP[exit];
      nextCell.fill = 0.001;
    }

    /* ------------------------------------------------------------ runner */

    return Milo.arcade(host, {
      id: 'pipe-panic',
      w: W, h: H, bg: '#0b1220',
      stats: ['Score', 'Level', 'Pipes'],
      emo: '🔧',
      start: {
        title: 'Pipe Panic',
        text: 'Lay pipe from the queue onto the grid before the sludge starts moving. Only ' +
          'the shapes at the top of the queue are yours to place, and once sludge reaches a ' +
          'tile that tile is set. Hit the section target or the level ends where the pipe does.',
        keys: ['Click / tap a square to lay the next piece']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        var d = g.data;
        var gx = Math.floor((x - PAD_L) / CELL), gy = Math.floor((y - PAD_T) / CELL);
        d.hoverX = gx; d.hoverY = gy;
        if (type === 'down') place(g, gx, gy);
      },

      update: function (g, dt) {
        var d = g.data;
        d.msgT = Math.max(0, d.msgT - dt);
        d.shake = Math.max(0, d.shake - dt * 40);
        d.parts = d.parts.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 460 * dt; q.life -= dt;
          return q.life > 0;
        });
        for (var i = 0; i < d.grid.length; i++) {
          if (d.grid[i] && d.grid[i].pop > 0) d.grid[i].pop -= dt;
        }
        if (d.dead) return;

        if (d.levelDone) {
          d.levelDone += dt;
          if (d.levelDone > 1.6) {
            d.level++;
            buildLevel(g);
          }
          return;
        }

        if (!d.flowing) {
          d.flowDelay -= dt;
          if (d.flowDelay <= 0) {
            d.flowing = true;
            var first = d.grid[idx(d.cur.x, d.cur.y)];
            if (first) { first.from = d.cur.from; first.fill = 0.001; }
            say(d, 'SLUDGE RUNNING');
            Milo.sound.tone({ f: 120, f2: 240, d: .4, v: .08, type: 'sawtooth' });
          }
          return;
        }

        var cur = d.grid[idx(d.cur.x, d.cur.y)];
        if (!cur) { endLevel(g, d.filled >= d.target); return; }
        d.cur.t += dt * d.flowSpeed;
        cur.fill = U.clamp(d.cur.t, 0, 1);
        if (d.cur.t >= 1) advance(g);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        var bg = c.createLinearGradient(0, 0, W, H);
        bg.addColorStop(0, '#111c31');
        bg.addColorStop(1, '#070d18');
        c.fillStyle = bg; c.fillRect(-40, -40, W + 80, H + 80);

        // riveted back plate
        c.fillStyle = '#16233c';
        U.roundRect(c, PAD_L - 12, PAD_T - 12, COLS * CELL + 24, ROWS * CELL + 24, 12); c.fill();
        c.strokeStyle = '#25395c'; c.lineWidth = 3;
        U.roundRect(c, PAD_L - 12, PAD_T - 12, COLS * CELL + 24, ROWS * CELL + 24, 12); c.stroke();
        c.fillStyle = '#31496f';
        for (var rx = PAD_L - 4; rx < PAD_L + COLS * CELL + 8; rx += (COLS * CELL + 12) / 9) {
          c.beginPath(); c.arc(rx, PAD_T - 5, 3, 0, 7); c.fill();
          c.beginPath(); c.arc(rx, PAD_T + ROWS * CELL + 5, 3, 0, 7); c.fill();
        }

        // cells
        for (var y = 0; y < ROWS; y++) {
          for (var x = 0; x < COLS; x++) {
            var px = cellX(x), py = cellY(y);
            if (d.blocks[idx(x, y)]) {
              c.fillStyle = '#3c2a1b';
              U.roundRect(c, px + 3, py + 3, CELL - 6, CELL - 6, 6); c.fill();
              c.fillStyle = '#5b4028';
              c.beginPath();
              c.moveTo(px + 14, py + CELL - 12); c.lineTo(px + 22, py + 16);
              c.lineTo(px + CELL - 14, py + 22); c.lineTo(px + CELL - 18, py + CELL - 14);
              c.closePath(); c.fill();
              continue;
            }
            c.fillStyle = (x + y) % 2 ? '#0f1c30' : '#0d1728';
            U.roundRect(c, px + 2, py + 2, CELL - 4, CELL - 4, 5); c.fill();
            c.strokeStyle = 'rgba(56,120,180,.14)'; c.lineWidth = 1;
            U.roundRect(c, px + 2, py + 2, CELL - 4, CELL - 4, 5); c.stroke();
          }
        }

        // hover highlight
        if (inGrid(d.hoverX, d.hoverY) && !d.blocks[idx(d.hoverX, d.hoverY)] && !d.dead && !d.levelDone) {
          var hcell = d.grid[idx(d.hoverX, d.hoverY)];
          c.fillStyle = hcell && hcell.fill > 0 ? 'rgba(248,113,113,.18)' : 'rgba(125,211,252,.16)';
          U.roundRect(c, cellX(d.hoverX) + 2, cellY(d.hoverY) + 2, CELL - 4, CELL - 4, 5); c.fill();
        }

        // start marker
        var sv = DIRS[d.start.dir];
        c.save();
        c.translate(cellX(d.start.x) + CELL / 2 - sv[0] * CELL, cellY(d.start.y) + CELL / 2 - sv[1] * CELL);
        c.fillStyle = '#84cc16';
        c.beginPath();
        c.arc(0, 0, 17, 0, 7); c.fill();
        c.fillStyle = '#365314';
        c.beginPath(); c.arc(0, 0, 10, 0, 7); c.fill();
        c.fillStyle = '#bef264';
        c.beginPath();
        c.moveTo(sv[0] * 26 - sv[1] * 8, sv[1] * 26 + sv[0] * 8);
        c.lineTo(sv[0] * 40, sv[1] * 40);
        c.lineTo(sv[0] * 26 + sv[1] * 8, sv[1] * 26 - sv[0] * 8);
        c.closePath(); c.fill();
        c.restore();

        // laid pipes
        for (var k = 0; k < d.grid.length; k++) {
          var cell = d.grid[k];
          if (!cell) continue;
          var gx = k % COLS, gy = (k / COLS) | 0;
          var cx = cellX(gx) + CELL / 2, cy = cellY(gy) + CELL / 2;
          var size = CELL * (1 + Math.max(0, cell.pop) * 0.7);
          drawPiece(c, cell.p, cx, cy, size, '#b08d57', '#84cc16',
            cell.from < 0 ? 3 : cell.from, cell.done ? 1 : cell.fill);
        }

        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.beginPath(); c.arc(q.x, q.y, q.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;
        c.restore();

        /* ---- queue rail ---- */
        c.fillStyle = '#16233c';
        U.roundRect(c, 16, PAD_T - 12, 82, ROWS * CELL + 24, 10); c.fill();
        c.strokeStyle = '#25395c'; c.lineWidth = 3;
        U.roundRect(c, 16, PAD_T - 12, 82, ROWS * CELL + 24, 10); c.stroke();
        c.fillStyle = '#7dd3fc';
        c.font = '800 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('NEXT', 57, PAD_T + 10);
        for (var qi = 0; qi < d.queue.length; qi++) {
          var qy = PAD_T + 30 + qi * 58;
          var isNext = qi === 0;
          c.fillStyle = isNext ? 'rgba(125,211,252,.16)' : 'rgba(255,255,255,.04)';
          U.roundRect(c, 26, qy, 62, 52, 8); c.fill();
          if (isNext) {
            c.strokeStyle = '#7dd3fc'; c.lineWidth = 2;
            U.roundRect(c, 26, qy, 62, 52, 8); c.stroke();
          }
          drawPiece(c, d.queue[qi], 57, qy + 26, 44, isNext ? '#d6b183' : '#7a6344', '#84cc16', 3, 0);
        }

        /* ---- fuse bar ---- */
        var barY = PAD_T + ROWS * CELL + 22;
        c.fillStyle = 'rgba(255,255,255,.08)';
        U.roundRect(c, PAD_L, barY, COLS * CELL, 18, 9); c.fill();
        if (!d.flowing) {
          var maxDelay = Math.max(4.5, 16 - d.level * 1.1);
          var frac = U.clamp(d.flowDelay / maxDelay, 0, 1);
          c.fillStyle = frac > .35 ? '#38bdf8' : '#f87171';
          U.roundRect(c, PAD_L + 2, barY + 2, (COLS * CELL - 4) * frac, 14, 7); c.fill();
          c.fillStyle = '#e2e8f0';
          c.font = '700 12px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('SLUDGE IN ' + d.flowDelay.toFixed(1) + 's', PAD_L + COLS * CELL / 2, barY + 13);
        } else {
          var pf = U.clamp(d.filled / d.target, 0, 1);
          c.fillStyle = pf >= 1 ? '#84cc16' : '#a3a3a3';
          U.roundRect(c, PAD_L + 2, barY + 2, (COLS * CELL - 4) * pf, 14, 7); c.fill();
          c.fillStyle = '#0b1220';
          c.font = '700 12px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.filled + ' / ' + d.target + ' SECTIONS', PAD_L + COLS * CELL / 2, barY + 13);
        }
        c.textAlign = 'left';

        if (d.msgT > 0) {
          c.globalAlpha = Math.min(1, d.msgT);
          c.fillStyle = '#bef264';
          c.font = '800 24px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.msg, W / 2, 56);
          c.globalAlpha = 1;
          c.textAlign = 'left';
        }
      }
    });
  }

  window.Milo.register({
    id: 'pipe-panic',
    title: 'Pipe Panic',
    emo: '🔧',
    category: 'Arcade',
    tagline: 'Lay the pipe before the sludge starts running',
    description: 'Pieces arrive in a queue of five and you can only ever place the one at ' +
      'the front, so the run you build is half planning and half improvising. The sludge ' +
      'starts moving on a timer that shrinks every level and flows faster once it does; any ' +
      'tile it has touched is locked, and overwriting a dry tile costs 25. Beat the section ' +
      'target before the pipe runs out and the overflow is worth 60 a section.',
    controls: ['Click', 'Tap'],
    colors: ['#16233c', '#84cc16'],
    tags: ['classic', 'puzzle', 'tiles', 'arcade', 'levels'],
    mount: mount
  });
})();
