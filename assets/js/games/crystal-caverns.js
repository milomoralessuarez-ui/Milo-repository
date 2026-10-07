/* Crystal Caverns — twelve hand-built cave rooms: every crystal, then the exit. */
(function () {
  'use strict';
  var W = 800, H = 512, TS = 32, COLS = 25, ROWS = 16;
  var PW = 20, PH = 28;
  var JUMP_V = -600, G_RISE = 1600, G_CUT = 3400, G_FALL = 2200, MAXFALL = 820;
  var COYOTE = .1, BUFFER = .12, RUN = 230;

  /* Legend: # rock  * crystal  k key  D door  ^ spikes  v drip  P start  E exit */
  var ROOMS = [
    { name: 'First Light', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#         *             #',
      '#       #####           #',
      '#                       #',
      '#     *          *      #',
      '#   #####      #####    #',
      '#                       #',
      '#                  *    #',
      '#  #####        ######  #',
      '#                       #',
      '#  P      *          E  #',
      '#########################'] },
    { name: 'Spike Pits', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#        *      *       #',
      '#       ###    ###      #',
      '#                       #',
      '#   *       *        *  #',
      '#  ###     ###      ### #',
      '#P    ^^^      ^^^    E #',
      '#########################'] },
    { name: 'Drip Tunnel', map: [
      '#########################',
      '#########################',
      '#########################',
      '#########################',
      '#########################',
      '#########################',
      '#########################',
      '#   v      v      v     #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#   *      *      *     #',
      '#  ###    ###    ###    #',
      '#P                     E#',
      '#########################'] },
    { name: 'The Key', map: [
      '#########################',
      '#                   #   #',
      '#                   #   #',
      '#  k                #   #',
      '# ####              #   #',
      '#                   #   #',
      '#      ####       * #   #',
      '#                ####   #',
      '#          *        #   #',
      '#        #####      #   #',
      '#                   #   #',
      '#   *         *     #   #',
      '# ####      ####    #   #',
      '#                   #   #',
      '#  P                D E #',
      '#########################'] },
    { name: 'Pillars', map: [
      '#########################',
      '#                       #',
      '#  *                 E  #',
      '# ####            #######',
      '#        *     *        #',
      '#       ####  ###       #',
      '#                ####   #',
      '#       *               #',
      '#      ####    *        #',
      '#             ####      #',
      '#                   *   #',
      '#   *              ###  #',
      '# ####                  #',
      '#            ####       #',
      '#  P    ^^^       ^^^   #',
      '#########################'] },
    { name: 'Descent', map: [
      '#########################',
      '# P      v        v     #',
      '#####                   #',
      '#                       #',
      '#      *   ^^  *        #',
      '#     ###########       #',
      '#                       #',
      '#                     * #',
      '#                  ######',
      '#   *                   #',
      '# #####     ^^^         #',
      '#          #####        #',
      '#                       #',
      '#         *        *    #',
      '#  ^^^   ###   ^^^    E #',
      '#########################'] },
    { name: 'Drip Hall', map: [
      '#########################',
      '#                       #',
      '#  *                 *  #',
      '###########   ###########',
      '#  v    v       v    v  #',
      '#                       #',
      '#          ###          #',
      '#                       #',
      '#        *      *       #',
      '#       ###    ###      #',
      '#                       #',
      '#   *        *       *  #',
      '#  ###      ###     ### #',
      '#                       #',
      '#  P        ^^        E #',
      '#########################'] },
    { name: 'Twin Doors', map: [
      '#########################',
      '#             #         #',
      '#  *          #    k    #',
      '# ####        #  #####  #',
      '#             #         #',
      '#      k      #     ### #',
      '#     ####    #         #',
      '#             # ####    #',
      '#   *         #         #',
      '#  ####       #   *     #',
      '#             #  ###    #',
      '#         *   #     #####',
      '#       ####  # ##  #   #',
      '#             #   * #   #',
      '# P           D     D E #',
      '#########################'] },
    { name: 'Spike Stairs', map: [
      '#########################',
      '#                       #',
      '#                     E #',
      '#                   #####',
      '#  *        * ^^        #',
      '# ###       ########    #',
      '#      *             *  #',
      '#     ####          ### #',
      '#                       #',
      '#               *       #',
      '#              ###      #',
      '#          ^^           #',
      '#         ####          #',
      '#   *                   #',
      '#  ###  P     ^^^^   ^^ #',
      '#########################'] },
    { name: 'Crystal Garden', map: [
      '#########################',
      '#    v             v    #',
      '#          *E*          #',
      '#         #####         #',
      '#                       #',
      '#   *               *   #',
      '#  ####          ####   #',
      '#                       #',
      '#        *     *        #',
      '#       ####  ####      #',
      '#                       #',
      '#    *      *      *    #',
      '#  ####          ####   #',
      '#                       #',
      '#  P      ^^^^        ^ #',
      '#########################'] },
    { name: 'Gauntlet', map: [
      '#########################',
      '#           #     v  v  #',
      '#  *        #           #',
      '# ###    k  #           #',
      '#       ### #         E #',
      '#    *      #       #####',
      '#   ####    #           #',
      '#           #    *      #',
      '#        *  #   ####    #',
      '#       ### #           #',
      '#           #  *        #',
      '#  *        # ####      #',
      '# ####      #           #',
      '#           #           #',
      '#  P    ^^  D    ^^^    #',
      '#########################'] },
    { name: 'The Deep', map: [
      '#########################',
      '#     #      v      v   #',
      '# E   D                 #',
      '#########   *      ######',
      '#          ###          #',
      '#              ###      #',
      '#   *                   #',
      '#  ###           k      #',
      '#               ###     #',
      '#        *          *   #',
      '#       ####       ###  #',
      '#                       #',
      '#   *          *        #',
      '#  ####      ######     #',
      '#      ^^^         ^^ P #',
      '#########################'] }
  ];

  var CRYSTAL_COLS = ['#ff6ad5', '#5ce1e6', '#b8ff5c', '#ffb454'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.room = 0;
      d.loop = 0;
      d.lives = 3;
      d.crystalsTotal = 0;
      d.parts = [];
      d.shake = 0;
      d.flash = 0;
      d.over = false;
      loadRoom(d);
      g.score = 0;
      g.set('Room', 1);
      g.set('Crystals', d.crystals.length);
      g.set('Lives', 3);
      g.set('Best', g.best ? g.best + ' rooms' : '—');
    }

    function loadRoom(d) {
      var def = ROOMS[d.room % ROOMS.length];
      d.name = def.name;
      d.map = def.map.map(function (r) { return (r + '                         ').slice(0, COLS); });
      d.crystals = []; d.keys = []; d.doors = {}; d.spikes = []; d.drips = []; d.exit = null;
      var start = { x: 2, y: ROWS - 2 };
      for (var y = 0; y < ROWS; y++) {
        for (var x = 0; x < COLS; x++) {
          var ch = d.map[y][x];
          if (ch === '*') d.crystals.push({ x: x, y: y, got: false, hue: d.crystals.length % CRYSTAL_COLS.length });
          else if (ch === 'k') d.keys.push({ x: x, y: y, got: false });
          else if (ch === '^') d.spikes.push({ x: x, y: y });
          else if (ch === 'v') d.drips.push({ x: x, y: y, t: -(x * .37 % 1.7), per: Math.max(1.1, 2.6 - d.loop * .5), drop: null });
          else if (ch === 'P') start = { x: x, y: y };
          else if (ch === 'E') d.exit = { x: x, y: y };
        }
      }
      d.start = start;
      d.keyCount = 0;
      d.bannerT = 1.6;
      spawn(d);
    }

    function spawn(d) {
      d.p = {
        x: d.start.x * TS + TS / 2, y: (d.start.y + 1) * TS - PH, w: PW, h: PH,
        vx: 0, vy: 0, ground: false, coyote: 0, buffer: 0, face: 1, dead: 0, squash: 1, lampT: 0
      };
    }

    function solid(d, tx, ty) {
      if (ty < 0 || ty >= ROWS || tx < 0 || tx >= COLS) return true;
      var ch = d.map[ty][tx];
      return ch === '#' || (ch === 'D' && !d.doors[ty * COLS + tx]);
    }
    function hitsRect(d, x, y, w, h) {
      var x0 = Math.floor(x / TS), x1 = Math.floor((x + w - .01) / TS);
      var y0 = Math.floor(y / TS), y1 = Math.floor((y + h - .01) / TS);
      for (var ty = y0; ty <= y1; ty++) for (var tx = x0; tx <= x1; tx++) if (solid(d, tx, ty)) return true;
      return false;
    }
    /** Moves the player by (dx, dy) in small steps, snapping to tile edges on contact. */
    function sweep(d, p, dx, dy) {
      var hit = { x: false, y: false }, rem, sg, st;
      rem = Math.abs(dx); sg = dx > 0 ? 1 : -1;
      while (rem > 0) {
        st = Math.min(rem, 4);
        if (hitsRect(d, p.x - p.w / 2 + sg * st, p.y, p.w, p.h)) {
          if (sg > 0) p.x = Math.floor((p.x + p.w / 2 + st) / TS) * TS - p.w / 2 - .01;
          else p.x = (Math.floor((p.x - p.w / 2 - st) / TS) + 1) * TS + p.w / 2 + .01;
          hit.x = true; break;
        }
        p.x += sg * st; rem -= st;
      }
      rem = Math.abs(dy); sg = dy > 0 ? 1 : -1;
      while (rem > 0) {
        st = Math.min(rem, 4);
        if (hitsRect(d, p.x - p.w / 2, p.y + sg * st, p.w, p.h)) {
          if (sg > 0) p.y = Math.floor((p.y + p.h + st) / TS) * TS - p.h - .01;
          else p.y = (Math.floor((p.y - st) / TS) + 1) * TS + .01;
          hit.y = true; break;
        }
        p.y += sg * st; rem -= st;
      }
      return hit;
    }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = U.rand(30, spd || 180);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: U.rand(.3, .7), max: .7, col: col, r: U.rand(1.5, 3.5) });
      }
    }

    function die(g, why) {
      var d = g.data, p = d.p;
      if (p.dead) return;
      p.dead = 1.0;
      d.shake = 10;
      d.flash = .5;
      burst(d, p.x, p.y + p.h / 2, '#ff8fb1', 24, 260);
      burst(d, p.x, p.y + p.h / 2, '#ffe9a8', 10, 120);
      Milo.sound.explode();
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      d.why = why;
    }

    return Milo.arcade(host, {
      id: 'crystal-caverns',
      w: W, h: H, bg: '#0b0716',
      stats: ['Room', 'Crystals', 'Lives', 'Best'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'JUMP' }],
      emo: '💎',
      start: {
        title: 'Crystal Caverns',
        text: 'Twelve cave rooms. Collect every crystal in a room to unlock its exit. Keys open ' +
          'doors, spikes and falling drips end a life, and you have three of them.',
        keys: ['← → move', 'Space / ↑ jump', 'Release early for a short hop']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, p = d.p, inp = g.input, i;

        d.shake = Math.max(0, d.shake - dt * 30);
        d.flash = Math.max(0, d.flash - dt);
        if (d.bannerT > 0) d.bannerT -= dt;
        for (i = d.parts.length - 1; i >= 0; i--) {
          var pt = d.parts[i];
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 500 * dt; pt.life -= dt;
          if (pt.life <= 0) d.parts.splice(i, 1);
        }

        // --- drips run whether or not the player is alive ----------------------
        d.drips.forEach(function (dr) {
          dr.t += dt;
          if (!dr.drop && dr.t >= dr.per) {
            dr.t = 0;
            dr.drop = { x: dr.x * TS + TS / 2, y: dr.y * TS + 22, vy: 60 };
          }
          if (dr.drop) {
            var dp = dr.drop;
            dp.vy += 900 * dt;
            dp.y += dp.vy * dt;
            var tx = Math.floor(dp.x / TS), ty = Math.floor((dp.y + 5) / TS);
            if (solid(d, tx, ty) || dp.y > H + 20) {
              burst(d, dp.x, ty * TS, '#7fd7ff', 5, 90);
              dr.drop = null;
              if (Math.abs(dp.x - p.x) < 220) Milo.sound.tone({ f: 900, f2: 500, d: .05, v: .03, type: 'sine' });
            } else if (!p.dead && dp.x > p.x - p.w / 2 - 4 && dp.x < p.x + p.w / 2 + 4 &&
              dp.y > p.y - 4 && dp.y < p.y + p.h + 4) {
              dr.drop = null;
              die(g, 'A drip got you');
            }
          }
        });

        if (p.dead) {
          p.dead -= dt;
          if (p.dead <= 0) {
            if (d.lives <= 0) {
              d.over = true;
              g.gameOver({
                emo: '💎', title: d.why,
                text: 'You cleared ' + g.score + ' room' + (g.score === 1 ? '' : 's') + ' of the caverns.',
                score: g.score
              });
            } else spawn(d);
          }
          return;
        }

        // --- input & jump feel ---------------------------------------------------
        var frozen = d.bannerT > 1.0;
        var move = frozen ? 0 : (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
        var jumpPressed = !frozen && (inp.pressed('action') || inp.pressed('up') || inp.pressed('a'));
        var jumpHeld = inp.down('action') || inp.down('up') || inp.down('a');
        if (move) p.face = move;
        var accel = p.ground ? 2600 : 1500;
        if (move) p.vx += (move * RUN - p.vx) * Math.min(1, accel / RUN * dt);
        else p.vx *= Math.pow(p.ground ? .0005 : .05, dt);
        if (Math.abs(p.vx) < 2) p.vx = 0;

        p.coyote = p.ground ? COYOTE : p.coyote - dt;
        p.buffer = jumpPressed ? BUFFER : p.buffer - dt;
        if (p.buffer > 0 && p.coyote > 0) {
          p.vy = JUMP_V; p.coyote = 0; p.buffer = 0; p.ground = false; p.squash = .7;
          burst(d, p.x, p.y + p.h, '#9d8fc4', 6, 80);
          Milo.sound.tone({ f: 320, f2: 760, d: .11, v: .06, type: 'square' });
        }
        var grav = p.vy < 0 ? (jumpHeld ? G_RISE : G_CUT) : G_FALL;
        if (Math.abs(p.vy) < 70 && !p.ground) grav *= .55;   // a little hang at the apex
        p.vy = Math.min(p.vy + grav * dt, MAXFALL);

        var wasGround = p.ground, fallV = p.vy;
        var hit = sweep(d, p, p.vx * dt, p.vy * dt);
        if (hit.x) p.vx = 0;
        if (hit.y) {
          if (p.vy > 0) {
            p.ground = true;
            if (!wasGround) {
              p.squash = fallV > 500 ? 1.45 : 1.2;
              burst(d, p.x, p.y + p.h, '#6f6096', fallV > 500 ? 8 : 4, 70);
              if (fallV > 500) Milo.sound.tone({ f: 160, f2: 90, d: .07, v: .05, type: 'triangle' });
            }
          }
          p.vy = 0;
        } else p.ground = hitsRect(d, p.x - p.w / 2, p.y + 1, p.w, p.h) && p.vy >= 0;
        p.squash += (1 - p.squash) * Math.min(1, dt * 12);
        p.lampT += dt;

        // --- pickups ---------------------------------------------------------------
        var cx = p.x, cy = p.y + p.h / 2;
        var left = 0;
        d.crystals.forEach(function (cr) {
          if (cr.got) return;
          if (U.dist(cx, cy, cr.x * TS + TS / 2, cr.y * TS + TS / 2) < 26) {
            cr.got = true;
            burst(d, cr.x * TS + TS / 2, cr.y * TS + TS / 2, CRYSTAL_COLS[cr.hue], 14, 160);
            Milo.sound.coin();
          } else left++;
        });
        g.set('Crystals', left);
        d.keys.forEach(function (k) {
          if (k.got) return;
          if (U.dist(cx, cy, k.x * TS + TS / 2, k.y * TS + TS / 2) < 26) {
            k.got = true; d.keyCount++;
            burst(d, k.x * TS + TS / 2, k.y * TS + TS / 2, '#ffd257', 12, 140);
            Milo.sound.powerup();
          }
        });
        if (d.keyCount > 0) {
          var x0 = Math.floor((p.x - p.w / 2 - 3) / TS), x1 = Math.floor((p.x + p.w / 2 + 3) / TS);
          var y0 = Math.floor((p.y - 1) / TS), y1 = Math.floor((p.y + p.h + 1) / TS);
          for (var ty = y0; ty <= y1; ty++) for (var tx = x0; tx <= x1; tx++) {
            if (d.map[ty] && d.map[ty][tx] === 'D' && !d.doors[ty * COLS + tx]) {
              d.doors[ty * COLS + tx] = true; d.keyCount--;
              burst(d, tx * TS + TS / 2, ty * TS + TS / 2, '#c9b8ff', 16, 150);
              Milo.sound.tone({ f: 220, f2: 440, d: .25, v: .08, type: 'triangle' });
              d.shake = 4;
            }
          }
        }

        // --- hazards -------------------------------------------------------------------
        for (i = 0; i < d.spikes.length; i++) {
          var s = d.spikes[i];
          var sx = s.x * TS + 5, sy = s.y * TS + 14;
          if (p.x + p.w / 2 > sx && p.x - p.w / 2 < sx + TS - 10 && p.y + p.h > sy && p.y < s.y * TS + TS) {
            die(g, 'Spiked'); return;
          }
        }

        // --- exit ------------------------------------------------------------------------
        if (left === 0 && d.exit && U.dist(cx, cy, d.exit.x * TS + TS / 2, d.exit.y * TS + TS / 2) < 22) {
          d.room++;
          g.score = d.room;
          if (d.room % ROOMS.length === 0) d.loop++;
          burst(d, cx, cy, '#7dffb0', 20, 200);
          Milo.sound.win();
          loadRoom(d);
          g.set('Room', d.room + 1);
          g.set('Crystals', d.crystals.length);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1a1236'); bg.addColorStop(1, '#0b0716');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // background rock blobs, seeded per room so each cave looks its own
        var seed = (d.room % ROOMS.length) * 17 + 3;
        for (var b = 0; b < 26; b++) {
          var bx = U.hash2(b, 1, seed) * W, by = U.hash2(b, 2, seed) * H;
          var br = 20 + U.hash2(b, 3, seed) * 60;
          c.fillStyle = 'rgba(60,40,110,' + (0.08 + U.hash2(b, 4, seed) * .1) + ')';
          c.beginPath(); c.ellipse(bx, by, br, br * .6, U.hash2(b, 5, seed) * 3, 0, 7); c.fill();
        }

        // tiles
        for (var y = 0; y < ROWS; y++) {
          for (var x = 0; x < COLS; x++) {
            var ch = d.map[y][x];
            var px = x * TS, py = y * TS;
            if (ch === '#') {
              var v = U.hash2(x, y, seed);
              c.fillStyle = v < .5 ? '#2a2145' : '#2f2650';
              c.fillRect(px, py, TS, TS);
              if (!solid(d, x, y - 1)) { c.fillStyle = '#5a4a8a'; c.fillRect(px, py, TS, 5); }
              if (!solid(d, x, y + 1)) {
                c.fillStyle = '#1c1630';
                c.beginPath();
                c.moveTo(px + 6, py + TS); c.lineTo(px + 10, py + TS + 7); c.lineTo(px + 14, py + TS);
                c.moveTo(px + 20, py + TS); c.lineTo(px + 23, py + TS + 5); c.lineTo(px + 26, py + TS);
                c.fill();
              }
              if (!solid(d, x - 1, y)) { c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(px, py, 3, TS); }
              if (v > .8) { c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(px + 8 + v * 10, py + 12, 4, 4); }
            } else if (ch === 'D') {
              var open = d.doors[y * COLS + x];
              c.fillStyle = open ? 'rgba(120,100,180,.25)' : '#6b5a3c';
              U.roundRect(c, px + 2, py, TS - 4, TS, 6); c.fill();
              if (!open) {
                c.fillStyle = '#4a3c26'; c.fillRect(px + 6, py + 4, TS - 12, TS - 8);
                c.fillStyle = '#ffd257';
                c.beginPath(); c.arc(px + TS / 2, py + 14, 3.5, 0, 7); c.fill();
                c.fillRect(px + TS / 2 - 1.5, py + 15, 3, 8);
              }
            } else if (ch === '^') {
              c.fillStyle = '#c9c2df';
              c.beginPath();
              for (var k = 0; k < 3; k++) {
                c.moveTo(px + k * 11 - 1, py + TS);
                c.lineTo(px + k * 11 + 5, py + 10);
                c.lineTo(px + k * 11 + 11, py + TS);
              }
              c.fill();
            } else if (ch === 'E') {
              var openE = d.crystals.every(function (cr) { return cr.got; });
              var col = openE ? '#7dffb0' : '#6b4d7a';
              c.strokeStyle = col; c.lineWidth = 4;
              c.shadowColor = col; c.shadowBlur = openE ? 18 : 0;
              c.beginPath();
              c.moveTo(px + 5, py + TS); c.lineTo(px + 5, py + 12);
              c.arc(px + TS / 2, py + 12, TS / 2 - 5, Math.PI, 0);
              c.lineTo(px + TS - 5, py + TS);
              c.stroke();
              c.shadowBlur = 0;
              if (openE) {
                c.fillStyle = 'rgba(125,255,176,' + (.25 + Math.sin(g.t * 4) * .1) + ')';
                c.fillRect(px + 8, py + 12, TS - 16, TS - 12);
              }
            }
          }
        }

        // drips: stalactite, telegraphing bead, falling drop
        d.drips.forEach(function (dr) {
          var px = dr.x * TS, py = dr.y * TS;
          var soon = Math.max(0, (dr.t - (dr.per - .55)) / .55);
          var wob = soon > 0 ? Math.sin(g.t * 40) * soon * 1.5 : 0;
          c.fillStyle = '#4a3d78';
          c.beginPath(); c.moveTo(px + 6, py); c.lineTo(px + TS - 6, py); c.lineTo(px + TS / 2 + wob, py + 22); c.closePath(); c.fill();
          c.fillStyle = '#7fd7ff';
          if (soon > 0 && !dr.drop) { c.beginPath(); c.arc(px + TS / 2 + wob, py + 22, 2 + soon * 3, 0, 7); c.fill(); }
          if (dr.drop) {
            c.beginPath();
            c.moveTo(dr.drop.x, dr.drop.y - 9);
            c.quadraticCurveTo(dr.drop.x + 5, dr.drop.y, dr.drop.x, dr.drop.y + 5);
            c.quadraticCurveTo(dr.drop.x - 5, dr.drop.y, dr.drop.x, dr.drop.y - 9);
            c.fill();
          }
        });

        d.keys.forEach(function (k) {
          if (k.got) return;
          var kx = k.x * TS + TS / 2, ky = k.y * TS + TS / 2 + Math.sin(g.t * 4 + k.x) * 3;
          c.strokeStyle = '#ffd257'; c.lineWidth = 3; c.lineCap = 'round';
          c.beginPath(); c.arc(kx - 6, ky, 5, 0, 7); c.stroke();
          c.beginPath(); c.moveTo(kx - 1, ky); c.lineTo(kx + 10, ky); c.moveTo(kx + 6, ky); c.lineTo(kx + 6, ky + 5); c.moveTo(kx + 10, ky); c.lineTo(kx + 10, ky + 4); c.stroke();
        });

        // the player: a caver with a headlamp
        if (!p.dead) {
          c.save();
          c.translate(p.x, p.y + p.h);
          c.scale(p.face * (1 / p.squash), p.squash);
          c.fillStyle = '#e8b072';
          U.roundRect(c, -p.w / 2, -p.h, p.w, p.h, 6); c.fill();
          c.fillStyle = '#c94c4c';
          c.fillRect(-p.w / 2, -p.h + 10, p.w, 10);
          c.fillStyle = '#fff4d6';
          c.beginPath(); c.arc(0, -p.h + 7, 7, 0, 7); c.fill();
          c.fillStyle = '#ffe36b';
          c.fillRect(2, -p.h + 3, 6, 4);
          c.fillStyle = '#2b1b3a';
          c.fillRect(3, -p.h + 6, 2.5, 2.5);
          c.restore();
        }

        // darkness with a headlamp cone cut out of it
        var lx = p.x, ly = p.y + 8;
        var dark = c.createRadialGradient(lx, ly, 30, lx, ly, 300);
        dark.addColorStop(0, 'rgba(6,3,20,0)');
        dark.addColorStop(.5, 'rgba(6,3,20,.25)');
        dark.addColorStop(1, 'rgba(6,3,20,.62)');
        c.fillStyle = dark; c.fillRect(0, 0, W, H);
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = 'rgba(255,230,150,.07)';
        c.beginPath();
        c.moveTo(lx, ly);
        c.lineTo(lx + p.face * 260, ly - 70);
        c.lineTo(lx + p.face * 260, ly + 70);
        c.closePath(); c.fill();
        c.restore();

        // crystals glow through the dark
        d.crystals.forEach(function (cr) {
          if (cr.got) return;
          var cx = cr.x * TS + TS / 2, cy = cr.y * TS + TS / 2 + Math.sin(g.t * 3 + cr.x * .7) * 2.5;
          var col = CRYSTAL_COLS[cr.hue];
          c.shadowColor = col; c.shadowBlur = 16 + Math.sin(g.t * 5 + cr.y) * 5;
          c.fillStyle = col;
          c.beginPath();
          c.moveTo(cx, cy - 12); c.lineTo(cx + 8, cy - 2); c.lineTo(cx, cy + 12); c.lineTo(cx - 8, cy - 2);
          c.closePath(); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = 'rgba(255,255,255,.55)';
          c.beginPath(); c.moveTo(cx, cy - 12); c.lineTo(cx + 8, cy - 2); c.lineTo(cx, cy - 2); c.closePath(); c.fill();
        });

        d.parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life / pt.max);
          c.fillStyle = pt.col;
          c.beginPath(); c.arc(pt.x, pt.y, pt.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        if (d.flash > 0) { c.fillStyle = 'rgba(255,80,120,' + d.flash * .5 + ')'; c.fillRect(0, 0, W, H); }
        c.restore();

        if (d.bannerT > 0) {
          var a = Math.min(1, d.bannerT * 2);
          c.globalAlpha = a;
          c.fillStyle = 'rgba(10,5,30,.8)';
          U.roundRect(c, W / 2 - 170, 40, 340, 56, 12); c.fill();
          c.fillStyle = '#e9ddff';
          c.font = '800 22px Outfit, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('Room ' + (d.room + 1) + (d.loop ? ' · loop ' + (d.loop + 1) : '') + ' — ' + d.name, W / 2, 68);
          c.globalAlpha = 1;
          c.textBaseline = 'alphabetic';
        }
        if (d.p.dead && d.lives > 0) {
          c.fillStyle = 'rgba(255,255,255,.85)';
          c.font = '700 18px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(d.why + ' — ' + d.lives + ' left', W / 2, H - 20);
        }
      }
    });
  }

  window.Milo.register({
    id: 'crystal-caverns', title: 'Crystal Caverns', emo: '💎', category: 'Action',
    tagline: 'Twelve cave rooms, every crystal, then the exit',
    description: 'Each cave is one screen: grab every glowing crystal and the exit arch lights ' +
      'up green. Spikes and the drips that fall from stalactites cost a life, and a stalactite ' +
      'always wobbles and beads up for half a second before it lets go, so watch it rather than ' +
      'run under it. Keys open the stone doors that wall off some exits, and in the later rooms ' +
      'you will need two. Your score is how many rooms you cleared — clear all twelve and the ' +
      'caverns loop with faster drips.',
    controls: ['← →', 'Space / ↑ jump'],
    colors: ['#1a1236', '#ff6ad5'],
    tags: ['platformer', 'levels', 'cave', 'precision', 'action'],
    mount: mount
  });
})();
