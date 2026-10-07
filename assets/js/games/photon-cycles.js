/* Photon Cycles — light-cycle duel; the walls behind you never go away. */
(function () {
  'use strict';
  var CELL = 10, COLS = 84, ROWS = 50;
  var W = COLS * CELL, H = ROWS * CELL;

  var RIDERS = [
    { name: 'YOU', col: '#22d3ee', glow: '#67e8f9' },
    { name: 'VEX', col: '#f43f5e', glow: '#fda4af' },
    { name: 'ORA', col: '#f59e0b', glow: '#fcd34d' },
    { name: 'LYM', col: '#a3e635', glow: '#d9f99d' }
  ];
  var DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];   // right, down, left, up

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function key(x, y) { return y * COLS + x; }

    function free(d, x, y) {
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
      return !d.grid[key(x, y)];
    }

    /** How far a rider could run in direction di before hitting something. */
    function runway(d, x, y, di, cap) {
      var v = DIRS[di], n = 0;
      cap = cap || 22;
      while (n < cap) {
        x += v[0]; y += v[1];
        if (!free(d, x, y)) break;
        n++;
      }
      return n;
    }

    /** Rough open-space measure: the runway plus both sideways runways. */
    function roominess(d, x, y, di) {
      var v = DIRS[di];
      var nx = x + v[0], ny = y + v[1];
      if (!free(d, nx, ny)) return -1;
      var straight = runway(d, x, y, di, 26);
      var left = runway(d, nx, ny, (di + 3) % 4, 14);
      var right = runway(d, nx, ny, (di + 1) % 4, 14);
      return straight * 2 + left + right;
    }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < (n || 18); i++) {
        var a = Math.random() * 6.283, s = U.rand(40, spd || 300);
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: U.rand(.3, .8), max: .8, col: col, r: U.rand(1.4, 3.2)
        });
      }
    }

    /* ------------------------------------------------------------ rounds */

    function startRound(g) {
      var d = g.data;
      d.grid = {};
      d.parts = [];
      d.riders = [];
      d.countdown = 1.6;
      d.shake = 0;
      d.tick = 0;
      d.roundOver = 0;
      d.flash = 0;
      var n = Math.min(4, 2 + Math.floor((d.round - 1) / 2));
      d.aiCount = n - 1;
      // Corners of an inset square, facing the middle.
      var spots = [
        { x: 8, y: 8, di: 0 },
        { x: COLS - 9, y: ROWS - 9, di: 2 },
        { x: COLS - 9, y: 8, di: 1 },
        { x: 8, y: ROWS - 9, di: 3 }
      ];
      for (var i = 0; i < n; i++) {
        var s = spots[i];
        d.riders.push({
          i: i, x: s.x, y: s.y, di: s.di, next: s.di,
          alive: true, human: i === 0, boost: 0, boostLeft: 2.2,
          trail: [], think: 0, col: RIDERS[i].col, glow: RIDERS[i].glow, name: RIDERS[i].name
        });
        d.grid[key(s.x, s.y)] = i + 1;
        d.riders[i].trail.push({ x: s.x, y: s.y });
      }
      d.speed = 12 + d.round * 1.1;      // cells per second
      g.set('Round', d.round);
      g.set('Lost', d.losses + '/3');
    }

    function reset(g) {
      var d = g.data;
      d.round = 1;
      d.losses = 0;
      d.wins = 0;
      d.msg = '';
      d.msgT = 0;
      startRound(g);
      g.score = 0;
      g.set('Score', 0);
    }

    function say(d, t, dur) { d.msg = t; d.msgT = dur || 1.8; }
    function award(g, n) { g.score += n; g.set('Score', U.fmt(g.score)); }

    function derez(g, r) {
      var d = g.data;
      if (!r.alive) return;
      r.alive = false;
      d.shake = r.human ? 22 : 12;
      if (r.human) d.flash = .4;
      burst(d, r.x * CELL + CELL / 2, r.y * CELL + CELL / 2, r.col, r.human ? 34 : 22, 380);
      Milo.sound.explode();
      if (!r.human) { award(g, 400); say(d, r.name + ' DEREZZED  +400'); }
    }

    /* ------------------------------------------------------------ runner */

    return Milo.arcade(host, {
      id: 'photon-cycles',
      w: W, h: H, bg: '#02030a',
      stats: ['Score', 'Round', 'Lost', 'Boost'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'BOOST' }],
      emo: '🏍️',
      start: {
        title: 'Photon Cycles',
        text: 'Your cycle never stops and leaves a solid wall behind it. So do the other ' +
          'riders. Turn to survive, hold boost for a burst of speed — you only get about ' +
          'two seconds of it a round. Three lost rounds ends the run.',
        keys: ['Arrows / WASD to turn', 'Hold Space to boost']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input;
        d.shake = Math.max(0, d.shake - dt * 46);
        d.flash = Math.max(0, d.flash - dt);
        d.msgT = Math.max(0, d.msgT - dt);

        d.parts = d.parts.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .93; q.vy *= .93; q.life -= dt;
          return q.life > 0;
        });

        if (d.countdown > 0) { d.countdown -= dt; return; }

        var me = d.riders[0];

        /* -- steering: you may not reverse into your own wall -- */
        if (me.alive) {
          var want = -1;
          if (i.pressed('right') || i.down('right')) want = 0;
          if (i.pressed('down') || i.down('down')) want = 1;
          if (i.pressed('left') || i.down('left')) want = 2;
          if (i.pressed('up') || i.down('up')) want = 3;
          if (want >= 0 && want !== (me.di + 2) % 4) me.next = want;

          var boosting = (i.down('action') || i.pdown) && me.boostLeft > 0;
          me.boost = boosting ? 1 : 0;
          if (boosting) me.boostLeft = Math.max(0, me.boostLeft - dt);
          g.set('Boost', Math.round(me.boostLeft * 45) + '%');
        }

        /* -- AI steering -- */
        for (var a = 1; a < d.riders.length; a++) {
          var r = d.riders[a];
          if (!r.alive) continue;
          r.think -= dt;
          var ahead = runway(d, r.x, r.y, r.di, 8);
          var panic = ahead <= 2;
          if (panic || r.think <= 0) {
            r.think = U.rand(.18, .45);
            var opts = [r.di, (r.di + 1) % 4, (r.di + 3) % 4];
            var best = r.di, bestScore = -1e9;
            for (var o = 0; o < opts.length; o++) {
              var sc = roominess(d, r.x, r.y, opts[o]);
              if (sc < 0) continue;
              if (opts[o] === r.di) sc += 6;                 // mild preference to hold the line
              // Hunt the leader a little: cut toward the human's path.
              var tgt = d.riders[0];
              if (tgt.alive && Math.random() < .5) {
                var v = DIRS[opts[o]];
                var dd = Math.abs(r.x + v[0] * 4 - tgt.x) + Math.abs(r.y + v[1] * 4 - tgt.y);
                sc -= dd * (0.25 + d.round * 0.04);
              }
              sc += Math.random() * 5;
              if (sc > bestScore) { bestScore = sc; best = opts[o]; }
            }
            r.next = best;
          }
          // AI boost: a short dash when it has clear road.
          if (r.boostLeft > 0 && ahead > 14 && Math.random() < dt * 1.2) r.boost = 0.7;
          if (r.boost > 0) { r.boostLeft = Math.max(0, r.boostLeft - dt); if (ahead < 6) r.boost = 0; }
        }

        /* -- fixed-step movement -- */
        d.tick += dt;
        var period = 1 / d.speed;
        var guard = 0;
        while (d.tick >= period && guard++ < 8) {
          d.tick -= period;
          for (var pass = 0; pass < 2; pass++) {
            var moved = false;
            for (var k = 0; k < d.riders.length; k++) {
              var rd = d.riders[k];
              if (!rd.alive) continue;
              if (pass === 1 && rd.boost <= 0) continue;     // boosted riders take a second step
              rd.di = rd.next;
              var v2 = DIRS[rd.di];
              var nx = rd.x + v2[0], ny = rd.y + v2[1];
              if (!free(d, nx, ny)) { derez(g, rd); continue; }
              rd.x = nx; rd.y = ny;
              d.grid[key(nx, ny)] = rd.i + 1;
              rd.trail.push({ x: nx, y: ny });
              moved = true;
            }
            if (pass === 1 && !moved) break;
          }
          if (d.riders[0].alive) { award(g, 1); }
          // Head-on: two riders entering the same cell in the same tick.
          for (var p1 = 0; p1 < d.riders.length; p1++) {
            for (var p2 = p1 + 1; p2 < d.riders.length; p2++) {
              var A = d.riders[p1], B = d.riders[p2];
              if (A.alive && B.alive && A.x === B.x && A.y === B.y) { derez(g, A); derez(g, B); }
            }
          }
        }

        /* -- round resolution -- */
        var alive = d.riders.filter(function (r2) { return r2.alive; });
        if (alive.length <= 1 || !d.riders[0].alive) {
          var first = d.roundOver === 0;
          d.roundOver += dt;
          if (first) {
            if (d.riders[0].alive && alive.length === 1) {
              d.wins++;
              award(g, 1000 + d.round * 200);
              say(d, 'ROUND ' + d.round + ' WON  +' + U.fmt(1000 + d.round * 200), 2.2);
              Milo.sound.win();
            } else {
              d.losses++;
              g.set('Lost', d.losses + '/3');
              say(d, d.losses >= 3 ? 'DEREZZED' : 'ROUND LOST  ' + d.losses + '/3', 2.2);
            }
          }
          if (d.roundOver > 1.8) {
            if (d.losses >= 3) {
              g.gameOver({
                emo: '🏍️', title: 'Off the grid',
                text: 'You took ' + d.wins + ' round' + (d.wins === 1 ? '' : 's') + ' before the walls closed in.'
              });
              return;
            }
            d.round++;
            startRound(g);
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        c.fillStyle = '#02030a'; c.fillRect(-40, -40, W + 80, H + 80);

        // grid floor
        c.strokeStyle = 'rgba(56,189,248,.10)';
        c.lineWidth = 1;
        for (var x = 0; x <= COLS; x += 4) {
          c.beginPath(); c.moveTo(x * CELL, 0); c.lineTo(x * CELL, H); c.stroke();
        }
        for (var y = 0; y <= ROWS; y += 4) {
          c.beginPath(); c.moveTo(0, y * CELL); c.lineTo(W, y * CELL); c.stroke();
        }
        c.strokeStyle = 'rgba(56,189,248,.35)';
        c.lineWidth = 3;
        c.strokeRect(1.5, 1.5, W - 3, H - 3);

        // wall ribbons
        d.riders.forEach(function (r) {
          if (!r.trail.length) return;
          c.strokeStyle = r.col;
          c.lineWidth = 5;
          c.lineJoin = 'round'; c.lineCap = 'round';
          c.shadowColor = r.glow; c.shadowBlur = 12;
          c.globalAlpha = r.alive ? 1 : .35;
          c.beginPath();
          c.moveTo(r.trail[0].x * CELL + CELL / 2, r.trail[0].y * CELL + CELL / 2);
          for (var i = 1; i < r.trail.length; i++) {
            c.lineTo(r.trail[i].x * CELL + CELL / 2, r.trail[i].y * CELL + CELL / 2);
          }
          c.stroke();
          c.shadowBlur = 0;
          c.globalAlpha = 1;
        });

        // cycles
        d.riders.forEach(function (r) {
          if (!r.alive) return;
          var cx = r.x * CELL + CELL / 2, cy = r.y * CELL + CELL / 2;
          var v = DIRS[r.di];
          c.save();
          c.translate(cx, cy);
          c.rotate(Math.atan2(v[1], v[0]));
          if (r.boost > 0) {
            var jg = c.createLinearGradient(-26, 0, -4, 0);
            jg.addColorStop(0, 'rgba(255,255,255,0)');
            jg.addColorStop(1, r.glow);
            c.fillStyle = jg;
            c.fillRect(-26, -4, 24, 8);
          }
          c.shadowColor = r.glow; c.shadowBlur = 16;
          c.fillStyle = '#ffffff';
          c.beginPath();
          c.moveTo(10, 0); c.lineTo(-6, -5.5); c.lineTo(-3, 0); c.lineTo(-6, 5.5);
          c.closePath(); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = r.col;
          c.beginPath();
          c.moveTo(7, 0); c.lineTo(-5, -3.6); c.lineTo(-5, 3.6);
          c.closePath(); c.fill();
          c.restore();
        });

        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
        });
        c.globalAlpha = 1;
        c.restore();

        // boost meter
        var me = d.riders[0];
        if (me) {
          c.fillStyle = 'rgba(2,3,10,.7)';
          U.roundRect(c, 14, H - 34, 176, 20, 10); c.fill();
          c.fillStyle = 'rgba(255,255,255,.14)';
          U.roundRect(c, 18, H - 30, 168, 12, 6); c.fill();
          c.fillStyle = me.boostLeft > .5 ? '#22d3ee' : '#f43f5e';
          U.roundRect(c, 18, H - 30, 168 * U.clamp(me.boostLeft / 2.2, 0, 1), 12, 6); c.fill();
          c.fillStyle = '#e2e8f0';
          c.font = '700 11px Outfit, sans-serif';
          c.textAlign = 'left';
          c.fillText('BOOST', 200, H - 20);
        }

        // rider tags
        c.font = '700 12px Outfit, sans-serif';
        c.textAlign = 'right';
        d.riders.forEach(function (r, i) {
          c.fillStyle = r.alive ? r.col : 'rgba(148,163,184,.4)';
          c.fillText(r.name + (r.alive ? '' : ' ✕'), W - 16, 22 + i * 17);
        });
        c.textAlign = 'center';

        if (d.countdown > 0) {
          c.fillStyle = 'rgba(2,3,10,.55)';
          c.fillRect(0, 0, W, H);
          c.fillStyle = '#22d3ee';
          c.font = '900 84px Outfit, sans-serif';
          var n = Math.ceil(d.countdown);
          c.fillText(n > 1 ? String(n - 1) : 'GO', W / 2, H / 2 + 10);
          c.font = '700 18px Outfit, sans-serif';
          c.fillStyle = '#94a3b8';
          c.fillText('ROUND ' + d.round + ' — ' + (d.aiCount + 1) + ' CYCLES', W / 2, H / 2 + 54);
        } else if (d.msgT > 0) {
          c.globalAlpha = Math.min(1, d.msgT);
          c.fillStyle = '#e2e8f0';
          c.font = '800 28px Outfit, sans-serif';
          c.fillText(d.msg, W / 2, 62);
          c.globalAlpha = 1;
        }
        c.textAlign = 'left';

        if (d.flash > 0) {
          c.fillStyle = 'rgba(244,63,94,' + (d.flash * .45) + ')';
          c.fillRect(0, 0, W, H);
        }
      }
    });
  }

  window.Milo.register({
    id: 'photon-cycles',
    title: 'Photon Cycles',
    emo: '🏍️',
    category: 'Arcade',
    tagline: 'Light-cycle duel — the wall behind you is permanent',
    description: 'Your cycle runs flat out and lays a solid wall behind it; so do one to ' +
      'three rival riders who actively cut across your path. Each round adds speed, and from ' +
      'round three a third cycle joins, then a fourth. Boost is a hard budget of roughly two ' +
      'seconds per round — spend it to escape a box, not to show off. Three lost rounds and ' +
      'the run is over; surviving one is worth a thousand plus a bonus for the round number.',
    controls: ['Arrow keys', 'WASD', 'Hold Space to boost'],
    colors: ['#02030a', '#22d3ee'],
    tags: ['classic', 'neon', 'duel', 'arcade', 'survival'],
    mount: mount
  });
})();
