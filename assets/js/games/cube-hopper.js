/* Cube Hopper — flip every cube on the pyramid, dodge the coil snake. */
(function () {
  'use strict';
  var ROWS = 7;
  var HW = 36, HH = 18, SIDE = 36;      // cube half-width, half-depth, side height
  var STEP = HH + SIDE;                 // vertical distance between rows
  var W = 620, H = 580;
  var CX = W / 2, TOP = 112;

  // Each round gets its own palette: [unflipped, mid, done] top-face colours.
  var PALETTES = [
    ['#3b2a6b', '#7c5cff', '#ffd257'],
    ['#153a4d', '#0ea5e9', '#f472b6'],
    ['#3f1d2b', '#e11d48', '#a3e635'],
    ['#123027', '#10b981', '#fb923c'],
    ['#2c2350', '#8b5cf6', '#22d3ee'],
    ['#402a12', '#f59e0b', '#38bdf8']
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function px(r, c) { return CX + (2 * c - r) * HW; }
    function py(r) { return TOP + r * STEP; }

    function onBoard(r, c) { return r >= 0 && r < ROWS && c >= 0 && c <= r; }

    function idx(r, c) { return r * ROWS + c; }

    /* ------------------------------------------------------------ rounds */

    function roundRules(n) {
      // steps: how many hops a cube needs. revert: extra hops undo it again.
      if (n <= 2) return { steps: 1, revert: false };
      if (n <= 4) return { steps: 2, revert: false };
      if (n <= 6) return { steps: 1, revert: true };
      return { steps: 2, revert: true };
    }

    function buildRound(g) {
      var d = g.data;
      var rr = roundRules(d.round);
      d.steps = rr.steps;
      d.revert = rr.revert;
      d.pal = PALETTES[(d.round - 1) % PALETTES.length];
      d.cubes = {};
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c <= r; c++) d.cubes[idx(r, c)] = { s: 0, flash: 0 };
      }
      d.done = 0;
      d.need = 28;                        // 1+2+…+7
      d.p = { r: 0, c: 0, hop: null, queued: null, riding: null, dead: 0, face: 1 };
      d.balls = [];
      d.snake = null;
      d.snakeTimer = Math.max(2.2, 6 - d.round * 0.4);
      d.ballTimer = Math.max(1.2, 3.2 - d.round * 0.2);
      d.freeze = 0;
      d.discs = [];
      var lr = U.randInt(1, 4), rrow = U.randInt(1, 4);
      d.discs.push({ r: lr, c: -1, used: false, spin: 0 });
      d.discs.push({ r: rrow, c: rrow + 1, used: false, spin: 0 });
      d.beat = 0;
      d.shake = 0;
      g.set('Round', d.round);
      g.set('Cubes', d.need - d.done);
    }

    function reset(g) {
      var d = g.data;
      d.round = 1;
      d.lives = 3;
      d.parts = [];
      d.msg = '';
      d.msgT = 0;
      buildRound(g);
      g.score = 0;
      g.set('Score', 0);
      g.set('Lives', 3);
    }

    function say(d, t) { d.msg = t; d.msgT = 1.6; }
    function award(g, n) { g.score += n; g.set('Score', U.fmt(g.score)); }

    function burst(d, x, y, col, n) {
      for (var i = 0; i < (n || 14); i++) {
        var a = Math.random() * 6.283, s = U.rand(50, 250);
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60,
          life: U.rand(.3, .7), max: .7, col: col, r: U.rand(2, 4.5)
        });
      }
    }

    /* ------------------------------------------------------------- hops */

    var DIRS = {
      ul: [-1, -1], ur: [-1, 0], dl: [1, 0], dr: [1, 1]
    };

    function discAt(d, r, c) {
      for (var i = 0; i < d.discs.length; i++) {
        var dd = d.discs[i];
        if (!dd.used && dd.r === r && dd.c === c) return dd;
      }
      return null;
    }

    function startHop(g, dir) {
      var d = g.data, p = d.p;
      if (p.hop || p.riding || p.dead > 0) { p.queued = dir; return; }
      var v = DIRS[dir];
      if (!v) return;
      var nr = p.r + v[0], nc = p.c + v[1];
      p.face = (dir === 'dr' || dir === 'ur') ? 1 : -1;
      var disc = discAt(d, nr, nc);
      p.hop = {
        t: 0, dur: 0.24, fr: p.r, fc: p.c, tr: nr, tc: nc,
        fall: !onBoard(nr, nc) && !disc, disc: disc
      };
      Milo.sound.tone({ f: 420, f2: 700, d: .09, v: .05, type: 'square' });
    }

    function landCube(g, r, c) {
      var d = g.data;
      var cube = d.cubes[idx(r, c)];
      if (!cube) return;
      cube.flash = .3;
      var was = cube.s;
      if (was < d.steps) {
        cube.s = was + 1;
        if (cube.s === d.steps) { d.done++; award(g, 25); }
        else award(g, 15);
        Milo.sound.tone({ f: 520 + cube.s * 180, d: .07, v: .06, type: 'triangle' });
      } else if (d.revert) {
        cube.s = 0;
        d.done--;
        Milo.sound.tone({ f: 260, f2: 150, d: .1, v: .06, type: 'sawtooth' });
      }
      g.set('Cubes', Math.max(0, d.need - d.done));
      for (var i = 0; i < 6; i++) {
        d.parts.push({
          x: px(r, c) + U.rand(-24, 24), y: py(r) + U.rand(-10, 10),
          vx: U.rand(-60, 60), vy: U.rand(-160, -40),
          life: .4, max: .4, col: d.pal[Math.min(2, cube.s)], r: U.rand(1.6, 3)
        });
      }
    }

    function killPlayer(g, why) {
      var d = g.data;
      if (d.p.dead > 0) return;
      d.p.dead = 1.5;
      d.p.hop = null;
      d.p.riding = null;
      d.shake = 16;
      burst(d, px(d.p.r, d.p.c), py(d.p.r), '#fb7185', 22);
      Milo.sound.explode();
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      if (d.lives <= 0) {
        g.gameOver({ emo: '🟠', title: why || 'Off the edge', text: 'You reached round ' + d.round + '.' });
      }
    }

    function respawn(g) {
      var d = g.data;
      d.p.r = 0; d.p.c = 0; d.p.hop = null; d.p.riding = null; d.p.queued = null;
      d.snake = null;
      d.snakeTimer = 3;
      d.balls = [];
    }

    /* ------------------------------------------------------------ runner */

    return Milo.arcade(host, {
      id: 'cube-hopper',
      w: W, h: H, bg: '#080b1e',
      stats: ['Score', 'Round', 'Cubes', 'Lives'],
      touch: 'dpad',
      emo: '🟧',
      start: {
        title: 'Cube Hopper',
        text: 'Hop diagonally down the pyramid until every cube has changed colour. ' +
          'Arrows are rotated to match the cubes: Up goes up-right, Right goes down-right. ' +
          'Hop off the edge onto a floating disc and it carries you back to the top.',
        keys: ['↑ up-right   → down-right', '↓ down-left   ← up-left']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        if (type !== 'down') return;
        var d = g.data;
        var cx = px(d.p.r, d.p.c), cy = py(d.p.r);
        var dx = x - cx, dy = y - cy;
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        startHop(g, dy > 0 ? (dx > 0 ? 'dr' : 'dl') : (dx > 0 ? 'ur' : 'ul'));
      },

      update: function (g, dt) {
        var d = g.data, i = g.input, p = d.p;
        d.shake = Math.max(0, d.shake - dt * 42);
        d.msgT = Math.max(0, d.msgT - dt);
        d.beat += dt;
        d.freeze = Math.max(0, d.freeze - dt);

        d.parts = d.parts.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 560 * dt; q.life -= dt;
          return q.life > 0;
        });
        for (var k in d.cubes) { if (d.cubes[k].flash > 0) d.cubes[k].flash -= dt; }
        d.discs.forEach(function (dd) { dd.spin += dt * 3; });

        if (p.dead > 0) {
          p.dead -= dt;
          if (p.dead <= 0 && d.lives > 0) respawn(g);
          return;
        }

        /* -- input -- */
        if (i.pressed('up')) startHop(g, 'ur');
        else if (i.pressed('right')) startHop(g, 'dr');
        else if (i.pressed('down')) startHop(g, 'dl');
        else if (i.pressed('left')) startHop(g, 'ul');

        /* -- riding a disc -- */
        if (p.riding) {
          var rd = p.riding;
          rd.t += dt;
          if (rd.t >= 1) {
            p.riding = null;
            p.r = 0; p.c = 0;
            landCube(g, 0, 0);
          }
        } else if (p.hop) {
          var hp = p.hop;
          hp.t += dt;
          if (hp.t >= hp.dur) {
            if (hp.disc) {
              hp.disc.used = true;
              p.riding = { t: 0, fx: px(hp.tr, hp.tc), fy: py(hp.tr) };
              award(g, 60);
              say(d, 'DISC +60');
              Milo.sound.powerup();
              // A snake chasing you off the edge goes over with the disc.
              if (d.snake && d.snake.hatched && Math.abs(d.snake.r - hp.fr) <= 1) {
                burst(d, px(d.snake.r, d.snake.c), py(d.snake.r), '#a855f7', 24);
                d.snake = null;
                d.snakeTimer = Math.max(2.5, 7 - d.round * 0.4);
                award(g, 500);
                say(d, 'SNAKE OFF THE EDGE  +500');
                Milo.sound.win();
              }
              p.hop = null;
            } else if (hp.fall) {
              p.hop = null;
              killPlayer(g, 'Off the edge');
              return;
            } else {
              p.r = hp.tr; p.c = hp.tc;
              p.hop = null;
              landCube(g, p.r, p.c);
            }
            if (p.queued && !p.hop && !p.riding && p.dead <= 0) {
              var q2 = p.queued; p.queued = null; startHop(g, q2);
            }
          }
        }

        /* -- snake -- */
        if (d.freeze <= 0) {
          if (!d.snake) {
            d.snakeTimer -= dt;
            if (d.snakeTimer <= 0) {
              d.snake = { r: 0, c: 0, hatched: false, t: 0, beat: 0, hop: null, egg: 2 };
              Milo.sound.tone({ f: 180, f2: 320, d: .2, v: .07, type: 'sawtooth' });
            }
          } else {
            var sn = d.snake;
            sn.beat += dt;
            var period = sn.hatched ? Math.max(0.28, 0.6 - d.round * 0.03) : 0.42;
            if (sn.hop) {
              sn.hop.t += dt;
              if (sn.hop.t >= period) {
                sn.r = sn.hop.tr; sn.c = sn.hop.tc;
                sn.hop = null;
                if (!sn.hatched) {
                  sn.egg--;
                  if (sn.egg <= 0 || sn.r >= ROWS - 1) { sn.hatched = true; Milo.sound.hit(); }
                }
              }
            } else {
              var nr, nc;
              if (!sn.hatched) {
                nr = sn.r + 1; nc = sn.c + (Math.random() < .5 ? 0 : 1);
                if (nr >= ROWS) { sn.hatched = true; nr = sn.r; nc = sn.c; }
              } else {
                // Chase: close the row gap first, then the column gap.
                var tr = p.r, tc = p.c;
                if (tr > sn.r) { nr = sn.r + 1; nc = sn.c + (tc > sn.c + (tr - sn.r) / 2 ? 1 : 0); }
                else if (tr < sn.r) { nr = sn.r - 1; nc = sn.c - (tc < sn.c ? 1 : 0); }
                else { nr = sn.r + (sn.r < ROWS - 1 ? 1 : -1); nc = sn.c + (tc > sn.c ? 1 : 0); }
                if (!onBoard(nr, nc)) { nr = U.clamp(nr, 0, ROWS - 1); nc = U.clamp(nc, 0, nr); }
              }
              sn.hop = { t: 0, fr: sn.r, fc: sn.c, tr: nr, tc: nc };
            }
            if (p.dead <= 0 && !p.riding) {
              var sr = sn.hop ? U.lerp(sn.hop.fr, sn.hop.tr, sn.hop.t / period) : sn.r;
              var sc = sn.hop ? U.lerp(sn.hop.fc, sn.hop.tc, sn.hop.t / period) : sn.c;
              var pr = p.hop ? U.lerp(p.hop.fr, p.hop.tr, p.hop.t / p.hop.dur) : p.r;
              var pc = p.hop ? U.lerp(p.hop.fc, p.hop.tc, p.hop.t / p.hop.dur) : p.c;
              if (Math.abs(sr - pr) < .55 && Math.abs(sc - pc) < .55) { killPlayer(g, 'The coil got you'); return; }
            }
          }

          /* -- bouncing orbs -- */
          d.ballTimer -= dt;
          if (d.ballTimer <= 0) {
            d.ballTimer = Math.max(1.1, 3.4 - d.round * 0.22) + U.rand(0, 1.4);
            var green = Math.random() < .22;
            d.balls.push({ r: 0, c: U.randInt(0, 1) === 0 ? 0 : 1, t: 0, green: green, fr: 0, fc: 0, dead: false });
            d.balls[d.balls.length - 1].c = 0;
          }
          d.balls.forEach(function (b) {
            b.t += dt * 2.6;
            if (b.t >= 1) {
              b.t = 0;
              b.fr = b.r; b.fc = b.c;
              b.r += 1;
              if (Math.random() < .5) b.c += 1;
              if (b.r >= ROWS) { b.dead = true; return; }
              if (b.c > b.r) b.c = b.r;
            }
            if (!b.dead && p.dead <= 0 && !p.riding) {
              var br = U.lerp(b.fr, b.r, b.t), bc = U.lerp(b.fc, b.c, b.t);
              var pr2 = p.hop ? U.lerp(p.hop.fr, p.hop.tr, p.hop.t / p.hop.dur) : p.r;
              var pc2 = p.hop ? U.lerp(p.hop.fc, p.hop.tc, p.hop.t / p.hop.dur) : p.c;
              if (Math.abs(br - pr2) < .5 && Math.abs(bc - pc2) < .5) {
                if (b.green) {
                  b.dead = true;
                  d.freeze = 4;
                  award(g, 100);
                  say(d, 'FROZEN  +100');
                  Milo.sound.powerup();
                } else { killPlayer(g, 'Squashed'); }
              }
            }
          });
          d.balls = d.balls.filter(function (b) { return !b.dead; });
        }

        /* -- round clear -- */
        if (d.done >= d.need && p.dead <= 0) {
          award(g, 800 + d.round * 150 + d.lives * 100);
          d.round++;
          if (d.round % 3 === 0) { d.lives++; g.set('Lives', d.lives); }
          Milo.sound.win();
          buildRound(g);
          say(d, 'ROUND ' + d.round);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#0d1230');
        sky.addColorStop(.55, '#080b1e');
        sky.addColorStop(1, '#03040d');
        c.fillStyle = sky; c.fillRect(-40, -40, W + 80, H + 80);

        // starfield
        for (var s = 0; s < 46; s++) {
          var hx = U.hash2(s, 3, 11) * W, hy = U.hash2(s, 9, 17) * H;
          c.globalAlpha = .18 + U.hash2(s, 5, 23) * .5;
          c.fillStyle = '#cbd5ff';
          c.fillRect(hx, hy, 2, 2);
        }
        c.globalAlpha = 1;

        // discs
        d.discs.forEach(function (dd) {
          if (dd.used) return;
          var x = px(dd.r, dd.c), y = py(dd.r);
          var wob = Math.sin(dd.spin) * 4;
          c.save(); c.translate(x, y + wob);
          for (var q = 3; q >= 0; q--) {
            c.fillStyle = ['#f472b6', '#c084fc', '#60a5fa', '#34d399'][q];
            c.globalAlpha = .9;
            c.beginPath(); c.ellipse(0, q * 3, 26 - q * 2, 12 - q, 0, 0, 7); c.fill();
          }
          c.globalAlpha = 1;
          c.restore();
        });

        // cubes, back rows first
        for (var r = 0; r < ROWS; r++) {
          for (var col = 0; col <= r; col++) {
            var cube = d.cubes[idx(r, col)];
            if (!cube) continue;
            var x = px(r, col), y = py(r);
            var top = d.pal[Math.min(2, cube.s === 0 ? 0 : (cube.s >= d.steps ? 2 : 1))];
            if (cube.flash > 0) top = U.shade(top, cube.flash * 1.6);
            // top face
            c.fillStyle = top;
            c.beginPath();
            c.moveTo(x, y - HH); c.lineTo(x + HW, y); c.lineTo(x, y + HH); c.lineTo(x - HW, y);
            c.closePath(); c.fill();
            // left face
            c.fillStyle = U.shade(top, -.45);
            c.beginPath();
            c.moveTo(x - HW, y); c.lineTo(x, y + HH); c.lineTo(x, y + HH + SIDE); c.lineTo(x - HW, y + SIDE);
            c.closePath(); c.fill();
            // right face
            c.fillStyle = U.shade(top, -.24);
            c.beginPath();
            c.moveTo(x + HW, y); c.lineTo(x, y + HH); c.lineTo(x, y + HH + SIDE); c.lineTo(x + HW, y + SIDE);
            c.closePath(); c.fill();
            c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1;
            c.beginPath();
            c.moveTo(x, y - HH); c.lineTo(x + HW, y); c.lineTo(x, y + HH); c.lineTo(x - HW, y); c.closePath();
            c.moveTo(x, y + HH); c.lineTo(x, y + HH + SIDE);
            c.stroke();
          }
        }

        // orbs
        d.balls.forEach(function (b) {
          var br = U.lerp(b.fr, b.r, b.t), bc = U.lerp(b.fc, b.c, b.t);
          var x = px(br, bc), y = py(br) - Math.sin(b.t * Math.PI) * 26 - 12;
          c.fillStyle = b.green ? '#4ade80' : '#f43f5e';
          c.shadowColor = b.green ? '#4ade80' : '#f43f5e'; c.shadowBlur = 14;
          c.beginPath(); c.arc(x, y, 12, 0, 7); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = 'rgba(255,255,255,.4)';
          c.beginPath(); c.arc(x - 4, y - 4, 4, 0, 7); c.fill();
        });

        // snake
        if (d.snake) {
          var sn = d.snake;
          var period = sn.hatched ? Math.max(0.28, 0.6 - d.round * 0.03) : 0.42;
          var sr = sn.hop ? U.lerp(sn.hop.fr, sn.hop.tr, sn.hop.t / period) : sn.r;
          var sc = sn.hop ? U.lerp(sn.hop.fc, sn.hop.tc, sn.hop.t / period) : sn.c;
          var arc = sn.hop ? Math.sin((sn.hop.t / period) * Math.PI) * 28 : 0;
          var x2 = px(sr, sc), y2 = py(sr) - arc - 14;
          c.save(); c.translate(x2, y2);
          if (!sn.hatched) {
            c.fillStyle = '#e9d5ff';
            c.beginPath(); c.ellipse(0, 0, 13, 17, 0, 0, 7); c.fill();
            c.fillStyle = '#a855f7';
            c.beginPath(); c.arc(0, 4, 5, 0, 7); c.fill();
          } else {
            c.fillStyle = '#7e22ce';
            for (var q2 = 3; q2 >= 1; q2--) {
              c.beginPath(); c.arc(0, q2 * 9, 12 - q2 * 1.6, 0, 7); c.fill();
            }
            c.fillStyle = '#a855f7';
            c.shadowColor = '#a855f7'; c.shadowBlur = 16;
            c.beginPath(); c.arc(0, -4, 15, 0, 7); c.fill();
            c.shadowBlur = 0;
            c.fillStyle = '#fff';
            c.beginPath(); c.arc(-5, -8, 5, 0, 7); c.arc(5, -8, 5, 0, 7); c.fill();
            c.fillStyle = '#1a032b';
            c.beginPath(); c.arc(-5, -7, 2.4, 0, 7); c.arc(5, -7, 2.4, 0, 7); c.fill();
            c.fillStyle = '#f43f5e';
            c.beginPath(); c.moveTo(0, 4); c.lineTo(-4, 14); c.lineTo(4, 14); c.closePath(); c.fill();
          }
          c.restore();
        }

        // hopper
        var p = d.p;
        if (p.dead <= 0) {
          var hx, hy;
          if (p.riding) {
            var t = p.riding.t;
            hx = U.lerp(p.riding.fx, px(0, 0), t);
            hy = U.lerp(p.riding.fy, py(0), t) - Math.sin(t * Math.PI) * 60;
          } else if (p.hop) {
            var ht = p.hop.t / p.hop.dur;
            hx = U.lerp(px(p.hop.fr, p.hop.fc), px(p.hop.tr, p.hop.tc), ht);
            hy = U.lerp(py(p.hop.fr), py(p.hop.tr), ht) - Math.sin(ht * Math.PI) * 34;
            if (p.hop.fall) hy += ht * ht * 120;
          } else { hx = px(p.r, p.c); hy = py(p.r); }
          c.save(); c.translate(hx, hy - 16);
          c.fillStyle = 'rgba(0,0,0,.28)';
          c.beginPath(); c.ellipse(0, 18, 18, 7, 0, 0, 7); c.fill();
          c.fillStyle = '#fb923c';
          c.shadowColor = '#fb923c'; c.shadowBlur = 14;
          c.beginPath(); c.arc(0, 0, 17, 0, 7); c.fill();
          c.shadowBlur = 0;
          // snout
          c.fillStyle = '#f97316';
          c.beginPath(); c.ellipse(p.face * 13, 4, 9, 6, 0, 0, 7); c.fill();
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(p.face * 3 - 5, -5, 6, 0, 7); c.arc(p.face * 3 + 6, -5, 6, 0, 7); c.fill();
          c.fillStyle = '#231106';
          c.beginPath(); c.arc(p.face * 4 - 5, -5, 2.8, 0, 7); c.arc(p.face * 4 + 6, -5, 2.8, 0, 7); c.fill();
          c.restore();
        }

        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
        });
        c.globalAlpha = 1;
        c.restore();

        // round / target swatch
        c.font = '700 13px Outfit, sans-serif';
        c.textAlign = 'left';
        c.fillStyle = 'rgba(255,255,255,.6)';
        c.fillText('TARGET', 18, H - 44);
        c.fillStyle = d.pal[2];
        U.roundRect(c, 18, H - 38, 44, 18, 5); c.fill();
        if (d.freeze > 0) {
          c.fillStyle = '#4ade80';
          c.textAlign = 'right';
          c.fillText('FROZEN ' + d.freeze.toFixed(1) + 's', W - 18, H - 26);
        }
        if (d.msgT > 0) {
          c.globalAlpha = Math.min(1, d.msgT);
          c.fillStyle = '#ffd257';
          c.font = '800 24px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.msg, W / 2, 62);
          c.globalAlpha = 1;
        }
        c.textAlign = 'left';
      }
    });
  }

  window.Milo.register({
    id: 'cube-hopper',
    title: 'Cube Hopper',
    emo: '🟧',
    category: 'Arcade',
    tagline: 'Flip every cube, dodge the coil',
    description: 'Twenty-eight cubes make a seven-row pyramid and you hop diagonally across ' +
      'it until every top face has turned the target colour. Rounds three and four need two ' +
      'hops per cube; from round five a third hop turns one back, so route planning matters ' +
      'more than speed. A purple coil hatches at the apex and chases you — hop off the edge ' +
      'onto a floating disc and it follows you into the void for 500 points.',
    controls: ['↑ up-right', '→ down-right', '↓ down-left', '← up-left', 'Tap a cube'],
    colors: ['#7c5cff', '#ffd257'],
    tags: ['classic', 'isometric', 'arcade', 'rounds', 'puzzle'],
    mount: mount
  });
})();
