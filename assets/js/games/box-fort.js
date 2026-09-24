/* Box Fort — boxes rain down; carry, push and stack them into a fort and reach the star in time. */
(function () {
  'use strict';
  var W = 800, H = 520, TS = 40, COLS = 20, ROWS = 13;
  var PW = 24, PH = 34;
  var JUMP_V = -470, G_RISE = 1700, G_CUT = 3600, G_FALL = 2300, MAXFALL = 800;
  var COYOTE = .1, BUFFER = .12, RUN = 230;
  var FALL_SPEED = 120, SLIDE_SPEED = 170, WARN = 1.3;

  /* Legend: # fixed block  B starting box  P start  * star */
  var LEVELS = [
    { name: 'First Stack', rate: 5, time: 60, map: [
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '             *      ',
      '                    ',
      '                    ',
      '  P    B    B       ',
      '####################'] },
    { name: 'Over the Wall', rate: 4, time: 60, map: [
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '          #      *  ',
      '          #         ',
      '  P   B   #         ',
      '####################'] },
    { name: 'Step Up', rate: 4.5, time: 80, map: [
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '               *    ',
      '                    ',
      '                    ',
      '            ########',
      '                    ',
      '  P   B     B       ',
      '####################'] },
    { name: 'Tower', rate: 3, time: 100, map: [
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '             *      ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      ' P  B  B  B  B  B B ',
      '####################'] },
    { name: 'Overhang', rate: 3, time: 90, map: [
      '                    ',
      '                    ',
      '                    ',
      '      ########      ',
      '      ########      ',
      '                    ',
      '                    ',
      '         *          ',
      '                    ',
      '                    ',
      '                    ',
      ' P B      B      B  ',
      '####################'] },
    { name: 'Ledges', rate: 4, time: 80, map: [
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                 *  ',
      '                    ',
      '            ####    ',
      '                    ',
      '       ####         ',
      '                    ',
      '  ####              ',
      ' P               B  ',
      '####################'] },
    { name: 'Narrow Sky', rate: 3, time: 110, map: [
      '#########  #########',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '   *                ',
      '                    ',
      '                    ',
      '                    ',
      '        P B    B    ',
      '####################'] },
    { name: 'Basement', rate: 4, time: 90, map: [
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '             *      ',
      '                    ',
      '                    ',
      '                    ',
      '#######             ',
      '# P B B #           ',
      '####################'] },
    { name: 'The Pit', rate: 3.5, time: 90, map: [
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                 *  ',
      '                    ',
      '                    ',
      '#######      #######',
      '#######      #######',
      '  P B B     B      #',
      '####################'] },
    { name: 'Chimney', rate: 3, time: 110, map: [
      '        #   #       ',
      '        #   #       ',
      '        #   #       ',
      '        #   #       ',
      '        #   #       ',
      '        #   #       ',
      '        #   #       ',
      '        # * #       ',
      '        #   #       ',
      '        #   #       ',
      '                    ',
      '  P B  B     B  B   ',
      '####################'] },
    { name: 'Skyscraper', rate: 2.5, time: 140, map: [
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '            *       ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      '                    ',
      'P B B B B B B B B B ',
      '####################'] },
    { name: 'Final Fort', rate: 2.8, time: 150, map: [
      '##########    ######',
      '                    ',
      '                    ',
      '                  * ',
      '                    ',
      '                    ',
      '     ###            ',
      '                    ',
      '                ####',
      '                    ',
      '                    ',
      ' P  B   B   B   B   ',
      '####################'] }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.level = 0;
      d.parts = [];
      d.texts = [];
      d.shake = 0;
      d.over = false;
      load(d);
      g.score = 0;
      g.set('Level', 1);
      g.set('Score', 0);
      g.set('Time', Math.ceil(d.time));
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    function load(d) {
      var L = LEVELS[d.level];
      d.name = L.name;
      d.map = L.map;
      d.rate = L.rate;
      d.time = L.time;
      d.timeMax = L.time;
      d.boxes = [];
      d.star = null;
      d.carry = null;
      d.dropIn = L.rate * .6;
      d.warn = null;
      d.bannerT = 1.8;
      d.stun = 0;
      var start = { x: 1, y: ROWS - 2 };
      for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) {
        var ch = L.map[y][x];
        if (ch === 'B') d.boxes.push(mkBox(x, y));
        else if (ch === 'P') start = { x: x, y: y };
        else if (ch === '*') d.star = { x: x, y: y };
      }
      d.p = { x: start.x * TS + TS / 2, y: (start.y + 1) * TS - PH, vx: 0, vy: 0, ground: false, coyote: 0, buffer: 0, face: 1, squash: 1 };
      d.boxCount = 0;
    }

    function mkBox(gx, gy) { return { gx: gx, gy: gy, x: gx * TS, y: gy * TS, state: 'rest', tone: U.randInt(0, 2) }; }

    function fixed(d, tx, ty) {
      if (tx < 0 || tx >= COLS || ty >= ROWS) return true;
      if (ty < 0) return false;
      return d.map[ty][tx] === '#';
    }
    function boxAt(d, gx, gy) {
      for (var i = 0; i < d.boxes.length; i++) {
        var b = d.boxes[i];
        if (b.state !== 'fall' && b.gx === gx && b.gy === gy) return b;
      }
      return null;
    }
    function cellFree(d, gx, gy) { return gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS && !fixed(d, gx, gy) && !boxAt(d, gx, gy); }

    /** Does a rect touch a fixed tile or a landed box? */
    function hits(d, x, y, w, h) {
      var x0 = Math.floor(x / TS), x1 = Math.floor((x + w - .01) / TS);
      var y0 = Math.floor(y / TS), y1 = Math.floor((y + h - .01) / TS);
      for (var ty = y0; ty <= y1; ty++) for (var tx = x0; tx <= x1; tx++) if (fixed(d, tx, ty)) return true;
      for (var i = 0; i < d.boxes.length; i++) {
        var b = d.boxes[i];
        if (b.state === 'fall') continue;
        if (x < b.x + TS && x + w > b.x && y < b.y + TS && y + h > b.y) return true;
      }
      return false;
    }
    function playerRect(d, dx, dy) {
      var p = d.p, top = d.carry ? TS : 0;
      return { x: p.x - PW / 2 + (dx || 0), y: p.y - top + (dy || 0), w: PW, h: PH + top };
    }
    function blocked(d, dx, dy) { var r = playerRect(d, dx, dy); return hits(d, r.x, r.y, r.w, r.h); }
    function sweep(d, dx, dy) {
      var p = d.p, hit = { x: false, y: false }, rem, sg, st;
      rem = Math.abs(dx); sg = dx > 0 ? 1 : -1;
      while (rem > 0) {
        st = Math.min(rem, 2);
        if (blocked(d, sg * st, 0)) { hit.x = true; break; }
        p.x += sg * st; rem -= st;
      }
      rem = Math.abs(dy); sg = dy > 0 ? 1 : -1;
      while (rem > 0) {
        st = Math.min(rem, 2);
        if (blocked(d, 0, sg * st)) { hit.y = true; break; }
        p.y += sg * st; rem -= st;
      }
      return hit;
    }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = U.rand(30, spd);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: U.rand(.3, .6), max: .6, col: col, r: U.rand(2, 4) });
      }
    }
    function text(d, x, y, s, col) { d.texts.push({ x: x, y: y, s: s, col: col, life: 1.1 }); }

    /** The box at the player's feet in front of them, if it can be lifted. */
    function frontCol(d, reach) {
      var p = d.p, gx = Math.floor((p.x + p.face * reach) / TS);
      if (gx === Math.floor(p.x / TS)) gx += p.face;
      return gx;
    }
    function boxInFront(d) {
      var p = d.p, gx = frontCol(d, PW / 2 + 8), gy = Math.floor((p.y + PH - 4) / TS);
      // feet level first, then head level — so a two-high stack can be taken apart
      for (var k = 0; k < 2; k++) {
        var b = boxAt(d, gx, gy - k);
        if (b && b.state === 'rest' && !boxAt(d, gx, gy - k - 1)) return b;
      }
      return null;
    }

    return Milo.arcade(host, {
      id: 'box-fort',
      w: W, h: H, bg: '#e9dcc3',
      stats: ['Level', 'Score', 'Time', 'Best'],
      touch: 'dpad',
      touchButtons: [{ key: 'b', label: 'GRAB' }, { key: 'action', label: 'JUMP' }],
      emo: '📦',
      start: {
        title: 'Box Fort',
        text: 'Boxes drift down from the sky. Pick one up, carry it, drop it in front of you ' +
          'to stack it — or just shove it along the floor. Build a staircase and reach the ' +
          'star before the clock runs out. Twelve levels.',
        keys: ['← → move', 'Space / ↑ jump', '↓ / X / Z grab & drop']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, p = d.p, inp = g.input, i;
        d.shake = Math.max(0, d.shake - dt * 30);
        if (d.bannerT > 0) d.bannerT -= dt;
        for (i = d.parts.length - 1; i >= 0; i--) {
          var pt = d.parts[i];
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 500 * dt; pt.life -= dt;
          if (pt.life <= 0) d.parts.splice(i, 1);
        }
        for (i = d.texts.length - 1; i >= 0; i--) { d.texts[i].y -= 36 * dt; d.texts[i].life -= dt; if (d.texts[i].life <= 0) d.texts.splice(i, 1); }
        if (d.over) return;
        var frozen = d.bannerT > 1.2;
        if (frozen) return;

        // --- timer ---------------------------------------------------------------------------
        d.time -= dt;
        g.set('Time', Math.max(0, Math.ceil(d.time)));
        if (d.time <= 0) {
          d.over = true;
          Milo.sound.explode();
          g.gameOver({ emo: '⏰', title: 'Out of time', text: 'The star on level ' + (d.level + 1) + ' was out of reach.', score: g.score });
          return;
        }
        if (d.time < 10 && Math.floor(d.time) !== Math.floor(d.time + dt)) Milo.sound.tone({ f: 880, d: .06, v: .05, type: 'square' });

        // --- box rain --------------------------------------------------------------------------
        if (!d.warn) {
          d.dropIn -= dt;
          if (d.dropIn <= 0) {
            var cols = [];
            for (var cx = 0; cx < COLS; cx++) if (!fixed(d, cx, 0) && !boxAt(d, cx, 0)) cols.push(cx);
            if (cols.length) d.warn = { gx: U.choice(cols), t: WARN };
            d.dropIn = d.rate;
          }
        } else {
          d.warn.t -= dt;
          if (d.warn.t <= 0) {
            var nb = mkBox(d.warn.gx, -1); nb.state = 'fall'; nb.y = -TS;
            d.boxes.push(nb);
            d.warn = null;
            Milo.sound.tone({ f: 500, f2: 300, d: .08, v: .04, type: 'triangle' });
          }
        }

        // --- box motion ------------------------------------------------------------------------
        for (i = 0; i < d.boxes.length; i++) {
          var b = d.boxes[i];
          if (b.state === 'fall') {
            b.y += FALL_SPEED * dt;
            var below = Math.floor((b.y + TS) / TS);
            if (below >= 0 && (fixed(d, b.gx, below) || boxAt(d, b.gx, below))) {
              b.gy = below - 1; b.y = b.gy * TS; b.state = 'rest';
              burst(d, b.x + TS / 2, b.y + TS, '#c9a97a', 6, 90);
              Milo.sound.tone({ f: 140, f2: 90, d: .08, v: .06, type: 'triangle' });
              // landed on the player: scoop them onto the box with a bonk
              var pr = playerRect(d);
              if (pr.x < b.x + TS && pr.x + pr.w > b.x && pr.y < b.y + TS && pr.y + pr.h > b.y) {
                p.y = b.y - PH; p.vy = 0; d.stun = .6; d.shake = 5;
                text(d, p.x, p.y - 20, 'BONK', '#e8503c');
                Milo.sound.hit();
              }
            }
          } else if (b.state === 'slide') {
            var tx = b.gx * TS;
            var step = Math.sign(tx - b.x) * SLIDE_SPEED * dt;
            if (Math.abs(tx - b.x) <= Math.abs(step)) {
              b.x = tx; b.state = 'rest';
              if (!fixed(d, b.gx, b.gy + 1) && !boxAt(d, b.gx, b.gy + 1)) { b.state = 'fall'; }
            } else b.x += step;
          } else if (b.state === 'rest') {
            if (!fixed(d, b.gx, b.gy + 1) && !boxAt(d, b.gx, b.gy + 1)) { b.state = 'fall'; }
          }
        }
        // a box that lost its support may have had boxes stacked on it: they fall too
        d.boxes.forEach(function (b) { if (b.state === 'fall') b.gy = -99; });

        // --- player ---------------------------------------------------------------------------
        d.stun = Math.max(0, d.stun - dt);
        var move = d.stun > 0 ? 0 : (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
        var jumpPressed = d.stun <= 0 && (inp.pressed('action') || inp.pressed('up'));
        var jumpHeld = inp.down('action') || inp.down('up');
        var grab = d.stun <= 0 && (inp.pressed('down') || inp.pressed('b') || inp.pressed('a'));
        if (move) p.face = move;
        var accel = p.ground ? 2600 : 1500;
        if (move) p.vx += (move * RUN - p.vx) * Math.min(1, accel / RUN * dt);
        else p.vx *= Math.pow(p.ground ? .0005 : .05, dt);
        if (Math.abs(p.vx) < 2) p.vx = 0;

        p.coyote = p.ground ? COYOTE : p.coyote - dt;
        p.buffer = jumpPressed ? BUFFER : p.buffer - dt;
        if (p.buffer > 0 && p.coyote > 0) {
          p.vy = JUMP_V; p.coyote = 0; p.buffer = 0; p.ground = false; p.squash = .72;
          burst(d, p.x, p.y + PH, '#b9a58a', 5, 70);
          Milo.sound.tone({ f: 320, f2: 700, d: .1, v: .06, type: 'square' });
        }
        var grav = p.vy < 0 ? (jumpHeld ? G_RISE : G_CUT) : G_FALL;
        p.vy = Math.min(p.vy + grav * dt, MAXFALL);

        // pushing: walking into a free-standing box shoves it one cell
        if (move && p.ground) {
          var gx = Math.floor((p.x + move * (PW / 2 + 3)) / TS), gy = Math.floor((p.y + PH - 4) / TS);
          var pb = boxAt(d, gx, gy);
          if (pb && pb.state === 'rest' && !boxAt(d, gx, gy - 1) && cellFree(d, gx + move, gy)) {
            var pr2 = playerRect(d);
            var tgt = { x: (gx + move) * TS, y: gy * TS };
            if (!(pr2.x < tgt.x + TS && pr2.x + pr2.w > tgt.x && pr2.y < tgt.y + TS && pr2.y + pr2.h > tgt.y)) {
              pb.gx += move; pb.state = 'slide';
              Milo.sound.tone({ f: 120, f2: 100, d: .15, v: .04, type: 'sawtooth' });
            }
          }
        }

        var wasGround = p.ground, fallV = p.vy;
        var hit = sweep(d, p.vx * dt, p.vy * dt);
        if (hit.x) p.vx = 0;
        if (hit.y) {
          if (p.vy > 0) {
            p.ground = true;
            if (!wasGround) { p.squash = fallV > 500 ? 1.4 : 1.15; burst(d, p.x, p.y + PH, '#b9a58a', 4, 60); }
          }
          p.vy = 0;
        } else p.ground = blocked(d, 0, 1) && p.vy >= 0;
        if (!hit.y && !p.ground) p.ground = false;
        p.x = U.clamp(p.x, PW / 2, W - PW / 2);
        p.squash += (1 - p.squash) * Math.min(1, dt * 12);

        // --- grab & drop -------------------------------------------------------------------------
        if (grab) {
          if (!d.carry) {
            var bf = boxInFront(d);
            if (bf && !blocked(d, 0, -TS)) {
              d.boxes.splice(d.boxes.indexOf(bf), 1);
              d.carry = { tone: bf.tone };
              p.squash = 1.15;
              burst(d, bf.x + TS / 2, bf.y + TS / 2, '#c9a97a', 6, 90);
              Milo.sound.tone({ f: 260, f2: 420, d: .1, v: .06, type: 'square' });
            } else Milo.sound.click();
          } else {
            var dgx = frontCol(d, PW / 2 + 14), dgy = Math.floor((p.y - TS / 2) / TS);
            if (cellFree(d, dgx, dgy)) {
              var nb2 = mkBox(dgx, dgy); nb2.tone = d.carry.tone; nb2.state = 'fall'; nb2.gy = -99;
              d.boxes.push(nb2);
              d.carry = null;
              Milo.sound.tone({ f: 200, f2: 140, d: .1, v: .06, type: 'triangle' });
            } else {
              Milo.sound.click();
              text(d, p.x, p.y - 50, 'no room', '#8a7a6a');
            }
          }
        }

        // --- the star ------------------------------------------------------------------------------
        var sx = d.star.x * TS + TS / 2, sy = d.star.y * TS + TS / 2;
        if (Math.abs(p.x - sx) < 26 && Math.abs(p.y + PH / 2 - sy) < 32) {
          var bonus = Math.ceil(d.time) * 2;
          g.score += 100 + bonus;
          g.set('Score', U.fmt(g.score));
          burst(d, sx, sy, '#ffd257', 30, 260);
          text(d, sx, sy - 30, '+' + (100 + bonus), '#ffd257');
          Milo.sound.win();
          d.level++;
          if (d.level >= LEVELS.length) {
            d.over = true;
            g.win({ score: g.score, emo: '🏰', title: 'Fort complete!', text: 'All twelve stars reached.' });
            return;
          }
          load(d);
          g.set('Level', d.level + 1);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#bfe3ff'); sky.addColorStop(1, '#e9dcc3');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        // distant hills + sun
        c.fillStyle = '#ffe9a8'; c.beginPath(); c.arc(660, 90, 38, 0, 7); c.fill();
        c.fillStyle = '#cfe3c9';
        c.beginPath(); c.moveTo(0, 380);
        for (var hx = 0; hx <= W; hx += 20) c.lineTo(hx, 340 + Math.sin(hx * .01) * 30 + Math.sin(hx * .027) * 12);
        c.lineTo(W, 520); c.lineTo(0, 520); c.closePath(); c.fill();

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) {
          if (d.map[y][x] !== '#') continue;
          var px = x * TS, py = y * TS;
          c.fillStyle = y === ROWS - 1 ? '#7a9a4a' : '#8a6a4a';
          c.fillRect(px, py, TS, TS);
          c.fillStyle = y === ROWS - 1 ? '#9fc45c' : '#a8825a';
          c.fillRect(px, py, TS, 6);
          c.fillStyle = 'rgba(0,0,0,.12)';
          c.fillRect(px + 2, py + 20, 16, 4); c.fillRect(px + 22, py + 32, 14, 4);
        }

        // star
        var st = d.star, sx = st.x * TS + TS / 2, sy = st.y * TS + TS / 2 + Math.sin(g.t * 3) * 4;
        c.save(); c.translate(sx, sy); c.rotate(Math.sin(g.t * 2) * .2);
        c.fillStyle = '#ffd257'; c.shadowColor = '#ffb300'; c.shadowBlur = 18;
        c.beginPath();
        for (var k = 0; k < 10; k++) { var r = k % 2 ? 8 : 18, an = k * Math.PI / 5 - Math.PI / 2; c.lineTo(Math.cos(an) * r, Math.sin(an) * r); }
        c.closePath(); c.fill(); c.shadowBlur = 0;
        c.restore();

        // warning marker
        if (d.warn) {
          var wx = d.warn.gx * TS + TS / 2;
          c.globalAlpha = Math.sin(g.t * 18) > 0 ? .9 : .4;
          c.fillStyle = '#e8503c';
          c.beginPath(); c.moveTo(wx - 12, 6); c.lineTo(wx + 12, 6); c.lineTo(wx, 22); c.closePath(); c.fill();
          c.globalAlpha = .15; c.fillRect(d.warn.gx * TS, 0, TS, H);
          c.globalAlpha = 1;
        }

        d.boxes.forEach(function (b) { drawBox(c, b.x, b.y, b.tone, b.state === 'fall'); });

        d.parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life / pt.max);
          c.fillStyle = pt.col;
          c.fillRect(pt.x - pt.r, pt.y - pt.r, pt.r * 2, pt.r * 2);
        });
        c.globalAlpha = 1;

        // the kid in a paper hat
        {
          c.save();
          c.translate(p.x, p.y + PH);
          c.scale(p.face / p.squash, p.squash);
          c.fillStyle = '#3b5bdb';
          c.fillRect(-PW / 2 + 2, -13, 8, 13); c.fillRect(PW / 2 - 10, -13, 8, 13);
          c.fillStyle = '#2b2b33';
          U.roundRect(c, -PW / 2, -5, 11, 5, 2); c.fill(); U.roundRect(c, PW / 2 - 11, -5, 11, 5, 2); c.fill();
          c.fillStyle = '#4caf50';
          U.roundRect(c, -PW / 2, -PH + 9, PW, PH - 21, 5); c.fill();
          c.fillStyle = '#f5cfa8';
          c.beginPath(); c.arc(0, -PH + 4, 9, 0, 7); c.fill();
          c.fillStyle = '#f4f0e6';
          c.beginPath(); c.moveTo(-10, -PH); c.lineTo(10, -PH); c.lineTo(0, -PH - 12); c.closePath(); c.fill();
          c.fillStyle = '#222';
          c.fillRect(3, -PH + 3, 2.5, 2.5);
          if (d.carry) {
            c.fillStyle = '#f5cfa8'; c.fillRect(-8, -PH - 4, 4, 10); c.fillRect(4, -PH - 4, 4, 10);
          }
          c.restore();
          if (d.carry) drawBox(c, p.x - TS / 2, p.y - TS - 8 + Math.sin(g.t * 8) * (p.vx ? 2 : 0), d.carry.tone, false);
          if (d.stun > 0) {
            c.fillStyle = '#ffd257'; c.font = '800 16px Outfit, sans-serif'; c.textAlign = 'center';
            for (var s = 0; s < 3; s++) c.fillText('✦', p.x + Math.cos(g.t * 8 + s * 2.1) * 16, p.y - 14 + Math.sin(g.t * 8 + s * 2.1) * 6);
          }
        }

        d.texts.forEach(function (t) {
          c.globalAlpha = Math.max(0, t.life);
          c.fillStyle = t.col; c.font = '800 16px Outfit, sans-serif'; c.textAlign = 'center';
          c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3;
          c.strokeText(t.s, t.x, t.y); c.fillText(t.s, t.x, t.y);
        });
        c.globalAlpha = 1;
        c.restore();

        // timer bar
        var frac = U.clamp(d.time / d.timeMax, 0, 1);
        c.fillStyle = 'rgba(0,0,0,.18)'; U.roundRect(c, W / 2 - 150, H - 14, 300, 8, 4); c.fill();
        c.fillStyle = frac < .2 ? '#e8503c' : '#4caf50'; U.roundRect(c, W / 2 - 150, H - 14, 300 * frac, 8, 4); c.fill();

        if (d.bannerT > 0) {
          c.globalAlpha = Math.min(1, d.bannerT * 2);
          c.fillStyle = 'rgba(60,40,20,.85)';
          U.roundRect(c, W / 2 - 190, 40, 380, 56, 12); c.fill();
          c.fillStyle = '#fff4dc';
          c.font = '800 22px Outfit, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('Level ' + (d.level + 1) + ' — ' + d.name, W / 2, 68);
          c.globalAlpha = 1; c.textBaseline = 'alphabetic';
        }
        if (d.level === 0 && !d.carry && g.t < 12 && d.bannerT <= 0) {
          c.fillStyle = 'rgba(60,40,20,.7)'; c.font = '700 14px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('Walk up to a box and press ↓ to lift it; ↓ again drops it in front of you', W / 2, 24);
        }
      }
    });

    function drawBox(c, x, y, tone, ghost) {
      var col = ['#d9a35c', '#c98f4a', '#e0b070'][tone];
      c.globalAlpha = ghost ? .55 : 1;
      c.fillStyle = col;
      c.fillRect(x + 1, y + 1, TS - 2, TS - 2);
      c.strokeStyle = '#8a5a2b'; c.lineWidth = 2;
      if (ghost) c.setLineDash([4, 3]);
      c.strokeRect(x + 2, y + 2, TS - 4, TS - 4);
      c.setLineDash([]);
      c.fillStyle = 'rgba(120,80,40,.35)';
      c.fillRect(x + TS / 2 - 4, y + 2, 8, TS - 4);
      c.fillStyle = 'rgba(255,255,255,.18)';
      c.fillRect(x + 4, y + 4, TS - 8, 4);
      c.fillStyle = '#5a3a1a';
      c.fillRect(x + 8, y + 26, 10, 2); c.fillRect(x + 22, y + 26, 10, 2);
      c.globalAlpha = 1;
    }
  }

  window.Milo.register({
    id: 'box-fort', title: 'Box Fort', emo: '📦', category: 'Action',
    tagline: 'Stack the raining boxes into stairs, reach the star',
    description: 'Cardboard boxes drift down from the sky one at a time, landing wherever the ' +
      'red marker points. Press down next to a box to hoist it over your head, carry it — ' +
      'you can still jump one box high while holding one — and press down again to drop it ' +
      'in front of you, which is how you stack. Shoving a free-standing box slides it a ' +
      'cell. You can only jump a single box, so reaching a star three boxes up means ' +
      'building a 1-2-3 staircase. Twelve levels with walls, shelves, pits and sealed skies; ' +
      'each is worth 100 plus two points for every second left on the clock.',
    controls: ['← →', 'Space / ↑ jump', '↓ / X grab & drop'],
    colors: ['#bfe3ff', '#d9a35c'],
    tags: ['building', 'levels', 'platformer', 'puzzle', 'timer'],
    mount: mount
  });
})();
