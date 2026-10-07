/* Ghost Manor — ghosts patrol fixed routes and freeze whenever you hold still. Keys, then the door. */
(function () {
  'use strict';
  var W = 800, H = 512, TS = 32, COLS = 25, ROWS = 16;
  var PW = 20, PH = 28;
  var JUMP_V = -560, G_RISE = 1600, G_CUT = 3400, G_FALL = 2200, MAXFALL = 820;
  var COYOTE = .1, BUFFER = .12, RUN = 230, CANDLE = 40;

  /* Legend: # wall/floor  k key  D door  P start.  Ghost routes are tile waypoints;
     `loop` routes go round, the rest ping-pong. */
  var ROOMS = [
    { name: 'Foyer', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#          k            #',
      '#         ####          #',
      '#                       #',
      '#     ###       ###     #',
      '#                       #',
      '#  ###               ####',
      '#P                 D    #',
      '#########################'],
      ghosts: [{ p: [[3, 14], [20, 14]], s: 60 }] },
    { name: 'Gallery', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#    k             k    #',
      '#   ####         ####   #',
      '#                       #',
      '#        #######        #',
      '#                       #',
      '#  ####           ####  #',
      '#                       #',
      '#      ###########      #',
      '#                       #',
      '#  ###             ###  #',
      '#           P    D      #',
      '#########################'],
      ghosts: [{ p: [[4, 2], [4, 13]], s: 60 }, { p: [[20, 13], [20, 2]], s: 60 }, { p: [[2, 6], [22, 6]], s: 50 }] },
    { name: 'Library', map: [
      '#########################',
      '#                       #',
      '#  k                    #',
      '# ####                  #',
      '#                       #',
      '#      ####             #',
      '#                       #',
      '#           ####        #',
      '#                       #',
      '#     ####        ####  #',
      '#                       #',
      '#       ####            #',
      '#                       #',
      '#  ####          ####   #',
      '#P         D            #',
      '#########################'],
      ghosts: [{ p: [[4, 4], [20, 4], [20, 12], [4, 12]], s: 80, loop: true }, { p: [[2, 14], [22, 14]], s: 55 }] },
    { name: 'Chapel', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#     k           k     #',
      '#    ####       ####    #',
      '#                       #',
      '#         #####         #',
      '#                       #',
      '#  ####           ####  #',
      '#                       #',
      '#       ###     ###     #',
      '#                       #',
      '#            ###        #',
      '#D          P           #',
      '#########################'],
      ghosts: [{ p: [[2, 2], [22, 12]], s: 90 }, { p: [[22, 2], [2, 12]], s: 90 }] },
    { name: 'Cellar', map: [
      '#########################',
      '#P                      #',
      '#                       #',
      '####################    #',
      '#                       #',
      '#                       #',
      '#    ####################',
      '#                       #',
      '#                  k    #',
      '####################    #',
      '#                       #',
      '#                       #',
      '#    ####################',
      '#                       #',
      '#D       k              #',
      '#########################'],
      ghosts: [{ p: [[6, 1], [6, 14]], s: 90 }, { p: [[12, 14], [12, 1]], s: 110 }, { p: [[18, 1], [18, 14]], s: 130 }] },
    { name: 'Ballroom', map: [
      '#########################',
      '#                       #',
      '#          k            #',
      '#         ####          #',
      '#                       #',
      '#    ####       ####    #',
      '#                       #',
      '#        #######        #',
      '#                       #',
      '#  ####           ####  #',
      '#                       #',
      '#      ####   ####      #',
      '#                       #',
      '#  ###             ###  #',
      '#P      k       k     D #',
      '#########################'],
      ghosts: [{ p: [[6, 4], [18, 4], [18, 12], [6, 12]], s: 100, loop: true }, { p: [[18, 6], [6, 6], [6, 10], [18, 10]], s: 100, loop: true }, { p: [[2, 14], [22, 14]], s: 60 }] },
    { name: 'Attic', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#          k            #',
      '#         ####          #',
      '#                       #',
      '#    ####       ####    #',
      '#                       #',
      '#  ###    ####    ###   #',
      '#                       #',
      '#     ####      ####    #',
      '#                       #',
      '#  ###      ###     ### #',
      '#    P  k        k   D  #',
      '#########################'],
      ghosts: [{ p: [[2, 13], [22, 13]], s: 120 }, { p: [[4, 3], [12, 11], [20, 3]], s: 110 }, { p: [[14, 1], [14, 14]], s: 100 }] },
    { name: 'Portrait Hall', map: [
      '#########################',
      '#                       #',
      '#  k                 k  #',
      '# ####             #### #',
      '#                       #',
      '#        #######        #',
      '#                       #',
      '# ####             #### #',
      '#                       #',
      '#        #######        #',
      '#                       #',
      '# ####             #### #',
      '#                       #',
      '#        #######        #',
      '#P   k       D          #',
      '#########################'],
      ghosts: [{ p: [[2, 12], [22, 12]], s: 110 }, { p: [[22, 8], [2, 8]], s: 120 }, { p: [[2, 4], [22, 4]], s: 130 }] },
    { name: 'Clock Tower', map: [
      '#########################',
      '#                       #',
      '#  D                    #',
      '# ####   ####           #',
      '#                 k     #',
      '#    ####       ####    #',
      '#                       #',
      '#         ####          #',
      '#     k                 #',
      '#    ####       ####    #',
      '#          k            #',
      '#         ####          #',
      '#                       #',
      '#    ####       ####    #',
      '#           P           #',
      '#########################'],
      ghosts: [{ p: [[12, 1], [12, 14]], s: 120 }, { p: [[6, 14], [6, 1]], s: 90 }, { p: [[18, 1], [18, 14]], s: 90 }] },
    { name: 'Kitchen', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#  k      k         k   #',
      '# ####  ######    ####  #',
      '#                       #',
      '#    ###    ####   ###  #',
      '#                       #',
      '#  ####   ####   ####   #',
      '#                       #',
      '#     ###    ###    ### #',
      '#                       #',
      '#  ###    ###    ###    #',
      '#P                   D  #',
      '#########################'],
      ghosts: [{ p: [[2, 3], [6, 3]], s: 60 }, { p: [[8, 3], [13, 3]], s: 70 }, { p: [[17, 3], [22, 3]], s: 80 }, { p: [[2, 14], [22, 14]], s: 100 }] },
    { name: 'Crypt', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#            k          #',
      '#   ####  ######  ####  #',
      '#                       #',
      '#      ####     ####    #',
      '#                       #',
      '#  ###    ####     ###  #',
      '#                       #',
      '#      ####     ####    #',
      '#          k            #',
      '#  ###    ###     ###   #',
      '#D          P           #',
      '#########################'],
      ghosts: [{ p: [[2, 12], [22, 12]], s: 110 }, { p: [[22, 8], [2, 8]], s: 120 }, { p: [[2, 4], [22, 4]], s: 130 }, { p: [[12, 1], [12, 14]], s: 100 }] },
    { name: 'Master Bedroom', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#  k                 k  #',
      '# ####  ####   ####  ####',
      '#                       #',
      '#     ####       ####   #',
      '#                       #',
      '#  ####    ####    #### #',
      '#                       #',
      '#     ####       ####   #',
      '#                       #',
      '#  ###    ####     ###  #',
      '#D    k     P        k  #',
      '#########################'],
      ghosts: [{ p: [[3, 2], [21, 2], [21, 13], [3, 13]], s: 130, loop: true }, { p: [[12, 1], [12, 14]], s: 120 }, { p: [[2, 10], [22, 10]], s: 110 }, { p: [[22, 6], [2, 6]], s: 110 }] }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.room = 0;
      d.loop = 0;
      d.lives = 3;
      d.parts = [];
      d.texts = [];
      d.shake = 0;
      d.flash = 0;
      d.over = false;
      d.stealthRuns = 0;
      loadRoom(d);
      g.score = 0;
      g.set('Room', 1);
      g.set('Score', 0);
      g.set('Lives', 3);
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    function loadRoom(d) {
      var def = ROOMS[d.room % ROOMS.length];
      d.name = def.name;
      d.map = def.map;
      d.keys = []; d.door = null;
      var start = { x: 1, y: ROWS - 2 };
      for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) {
        var ch = d.map[y][x];
        if (ch === 'k') d.keys.push({ x: x, y: y, got: false });
        else if (ch === 'P') start = { x: x, y: y };
        else if (ch === 'D') d.door = { x: x, y: y };
      }
      d.start = start;
      d.ghostDefs = def.ghosts;
      d.candle = CANDLE;
      d.noticed = false;
      d.bannerT = 1.6;
      d.cobwebs = [];
      for (var i = 0; i < 5; i++) d.cobwebs.push({ x: U.hash2(i, d.room, 3) * W, y: U.hash2(i, d.room, 4) * H * .5, s: .6 + U.hash2(i, d.room, 5) });
      spawn(d);
    }

    function spawn(d) {
      d.p = { x: d.start.x * TS + TS / 2, y: (d.start.y + 1) * TS - PH, w: PW, h: PH, vx: 0, vy: 0, ground: false, coyote: 0, buffer: 0, face: 1, dead: 0, squash: 1, still: false, stillT: 0 };
      var speedMul = 1 + d.loop * .25;
      d.ghosts = d.ghostDefs.map(function (gd) {
        var pts = gd.p.map(function (q) { return { x: q[0] * TS + TS / 2, y: q[1] * TS + TS / 2 }; });
        return { pts: pts, i: 1, dir: 1, x: pts[0].x, y: pts[0].y, s: gd.s * speedMul, loop: !!gd.loop, alert: 0, wob: Math.random() * 7 };
      });
    }

    function solid(d, tx, ty) {
      if (ty < 0 || ty >= ROWS || tx < 0 || tx >= COLS) return true;
      return d.map[ty][tx] === '#';
    }
    function hitsRect(d, x, y, w, h) {
      var x0 = Math.floor(x / TS), x1 = Math.floor((x + w - .01) / TS);
      var y0 = Math.floor(y / TS), y1 = Math.floor((y + h - .01) / TS);
      for (var ty = y0; ty <= y1; ty++) for (var tx = x0; tx <= x1; tx++) if (solid(d, tx, ty)) return true;
      return false;
    }
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
    function text(d, x, y, s, col) { d.texts.push({ x: x, y: y, s: s, col: col, life: 1.2 }); }

    function die(g, why) {
      var d = g.data, p = d.p;
      if (p.dead) return;
      p.dead = 1.1;
      d.shake = 9;
      d.flash = .5;
      burst(d, p.x, p.y + p.h / 2, '#f4f0ff', 22, 240);
      burst(d, p.x, p.y + p.h / 2, '#9b7bff', 12, 160);
      Milo.sound.explode();
      Milo.sound.tone({ f: 500, f2: 120, d: .5, v: .08, type: 'sine' });
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      d.why = why;
    }

    return Milo.arcade(host, {
      id: 'ghost-manor',
      w: W, h: H, bg: '#1a0f1e',
      stats: ['Room', 'Score', 'Lives', 'Best'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'JUMP' }],
      emo: '👻',
      start: {
        title: 'Ghost Manor',
        text: 'The ghosts patrol fixed routes, and they can only move while you do — stand ' +
          'perfectly still and they freeze. Collect every key in a room, then reach the door ' +
          'before your candle burns out. Move near a ghost and it notices you; clear a room ' +
          'unnoticed for a stealth bonus.',
        keys: ['← → move', 'Space / ↑ jump', 'Stay still to freeze the ghosts']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, p = d.p, inp = g.input, i;
        d.shake = Math.max(0, d.shake - dt * 30);
        d.flash = Math.max(0, d.flash - dt);
        if (d.bannerT > 0) d.bannerT -= dt;
        for (i = d.parts.length - 1; i >= 0; i--) {
          var pt = d.parts[i];
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 300 * dt; pt.life -= dt;
          if (pt.life <= 0) d.parts.splice(i, 1);
        }
        for (i = d.texts.length - 1; i >= 0; i--) { d.texts[i].y -= 36 * dt; d.texts[i].life -= dt; if (d.texts[i].life <= 0) d.texts.splice(i, 1); }

        if (p.dead) {
          p.dead -= dt;
          if (p.dead <= 0) {
            if (d.lives <= 0) {
              d.over = true;
              g.gameOver({
                emo: '👻', title: d.why,
                text: 'You escaped ' + d.room + ' room' + (d.room === 1 ? '' : 's') + ' of the manor, ' + d.stealthRuns + ' of them unnoticed.',
                score: g.score
              });
            } else { spawn(d); d.candle = CANDLE; d.noticed = true; }
          }
          return;
        }

        // --- input & jump feel -------------------------------------------------------------
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
          p.vy = JUMP_V; p.coyote = 0; p.buffer = 0; p.ground = false; p.squash = .72;
          burst(d, p.x, p.y + p.h, '#6a5a7a', 5, 70);
          Milo.sound.tone({ f: 300, f2: 700, d: .1, v: .05, type: 'square' });
        }
        var grav = p.vy < 0 ? (jumpHeld ? G_RISE : G_CUT) : G_FALL;
        if (Math.abs(p.vy) < 70 && !p.ground) grav *= .55;
        p.vy = Math.min(p.vy + grav * dt, MAXFALL);

        var wasGround = p.ground, fallV = p.vy;
        var hit = sweep(d, p, p.vx * dt, p.vy * dt);
        if (hit.x) p.vx = 0;
        if (hit.y) {
          if (p.vy > 0) {
            p.ground = true;
            if (!wasGround) {
              p.squash = fallV > 500 ? 1.4 : 1.18;
              burst(d, p.x, p.y + p.h, '#5a4a6a', fallV > 500 ? 7 : 3, 60);
              Milo.sound.tone({ f: 150, f2: 90, d: .06, v: .04, type: 'triangle' });
            }
          }
          p.vy = 0;
        } else p.ground = hitsRect(d, p.x - p.w / 2, p.y + 1, p.w, p.h) && p.vy >= 0;
        p.squash += (1 - p.squash) * Math.min(1, dt * 12);

        // Still = grounded, no input, not sliding. Ghosts only move while you do.
        p.still = p.ground && !move && Math.abs(p.vx) < 5 && p.vy === 0 && !frozen;
        p.stillT = p.still ? p.stillT + dt : 0;

        // --- ghosts ------------------------------------------------------------------------
        var cx = p.x, cy = p.y + p.h / 2;
        for (i = 0; i < d.ghosts.length; i++) {
          var gh = d.ghosts[i];
          gh.wob += dt;
          gh.alert = Math.max(0, gh.alert - dt);
          if (!p.still) {
            var dist = U.dist(gh.x, gh.y, cx, cy);
            if (dist < 110 && gh.alert <= 0) {
              gh.alert = 1.6;
              if (!d.noticed) { d.noticed = true; text(d, gh.x, gh.y - 30, 'noticed!', '#ff7a7a'); }
              Milo.sound.tone({ f: 700, f2: 300, d: .25, v: .06, type: 'sine' });
            }
            var sp = gh.s * (gh.alert > 0 ? 1.6 : 1);
            var tgt = gh.pts[gh.i];
            var dx = tgt.x - gh.x, dy = tgt.y - gh.y, L = Math.hypot(dx, dy);
            if (L <= sp * dt) {
              gh.x = tgt.x; gh.y = tgt.y;
              if (gh.loop) gh.i = (gh.i + 1) % gh.pts.length;
              else {
                gh.i += gh.dir;
                if (gh.i >= gh.pts.length || gh.i < 0) { gh.dir = -gh.dir; gh.i += gh.dir * 2; }
              }
            } else { gh.x += dx / L * sp * dt; gh.y += dy / L * sp * dt; }
          }
          if (U.dist(gh.x, gh.y + Math.sin(gh.wob * 2) * 3, cx, cy) < 24) { die(g, 'Caught by a ghost'); return; }
        }

        // --- candle ---------------------------------------------------------------------------
        if (!frozen) d.candle -= dt;
        if (d.candle <= 0) { die(g, 'The candle burned out'); return; }
        if (d.candle < 5 && Math.floor(d.candle) !== Math.floor(d.candle + dt)) Milo.sound.tone({ f: 660, d: .06, v: .05, type: 'square' });

        // --- keys & door --------------------------------------------------------------------
        var left = 0;
        d.keys.forEach(function (k) {
          if (k.got) return;
          if (U.dist(cx, cy, k.x * TS + TS / 2, k.y * TS + TS / 2) < 26) {
            k.got = true;
            g.score += 10; g.set('Score', g.score);
            burst(d, k.x * TS + TS / 2, k.y * TS + TS / 2, '#ffd257', 12, 150);
            text(d, k.x * TS + TS / 2, k.y * TS, '+10', '#ffd257');
            Milo.sound.coin();
          } else left++;
        });
        if (left === 0 && d.door && Math.abs(cx - (d.door.x * TS + TS / 2)) < 18 && Math.abs(cy - (d.door.y * TS + TS / 2)) < 24) {
          var bonus = d.noticed ? 0 : 50;
          if (!d.noticed) d.stealthRuns++;
          g.score += 100 + bonus + Math.floor(d.candle);
          g.set('Score', g.score);
          text(d, cx, cy - 30, (d.noticed ? 'ESCAPED' : 'UNSEEN  +50') + ' · candle +' + Math.floor(d.candle), d.noticed ? '#c9b8ff' : '#7dffb0');
          burst(d, cx, cy, '#c9b8ff', 22, 220);
          Milo.sound.win();
          d.room++;
          if (d.room % ROOMS.length === 0) d.loop++;
          loadRoom(d);
          g.set('Room', d.room + 1);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#2a1630'); bg.addColorStop(1, '#140a18');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        // damask wallpaper
        c.fillStyle = 'rgba(120,70,120,.12)';
        for (var wy = 16; wy < H; wy += 48) for (var wx = (wy / 48 | 0) % 2 ? 24 : 0; wx < W; wx += 48) {
          c.beginPath(); c.moveTo(wx + 12, wy); c.lineTo(wx + 22, wy + 12); c.lineTo(wx + 12, wy + 24); c.lineTo(wx + 2, wy + 12); c.closePath(); c.fill();
        }
        // moonlit window
        c.fillStyle = 'rgba(160,190,255,.12)';
        U.roundRect(c, W - 150, 40, 90, 120, 40); c.fill();
        c.fillStyle = 'rgba(160,190,255,.25)';
        c.beginPath(); c.arc(W - 118, 78, 16, 0, 7); c.fill();
        c.fillStyle = '#2a1630'; c.fillRect(W - 108, 40, 6, 120); c.fillRect(W - 150, 96, 90, 6);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        d.cobwebs.forEach(function (cw) {
          c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1;
          c.beginPath();
          for (var r = 8; r < 30 * cw.s; r += 7) c.arc(cw.x, cw.y, r, 0, Math.PI / 2);
          for (var a = 0; a <= 4; a++) { c.moveTo(cw.x, cw.y); c.lineTo(cw.x + Math.cos(a * Math.PI / 8) * 30 * cw.s, cw.y + Math.sin(a * Math.PI / 8) * 30 * cw.s); }
          c.stroke();
        });

        var seed = (d.room % ROOMS.length) * 13 + 7;
        for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) {
          if (d.map[y][x] !== '#') continue;
          var px = x * TS, py = y * TS;
          var edge = y === 0 || y === ROWS - 1 || x === 0 || x === COLS - 1;
          if (edge) {
            c.fillStyle = U.hash2(x, y, seed) < .5 ? '#3a2a3e' : '#40303f';
            c.fillRect(px, py, TS, TS);
            c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1; c.strokeRect(px + .5, py + .5, TS - 1, TS - 1);
          } else {
            // wooden floorboards for inner platforms
            c.fillStyle = '#6b4a2e'; c.fillRect(px, py, TS, TS);
            c.fillStyle = '#8a6238'; c.fillRect(px, py, TS, 6);
            c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(px, py + TS - 4, TS, 4);
            c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(px + 14, py + 8, 2, TS - 12);
            if (!solid(d, x, y - 1) && U.hash2(x, y, seed) > .8) {
              // a candle sconce
              c.fillStyle = '#e8c070'; c.fillRect(px + 13, py - 12, 6, 12);
              c.fillStyle = '#ffb347'; c.beginPath(); c.ellipse(px + 16, py - 15, 3, 5 + Math.sin(g.t * 9 + x) * 1.5, 0, 0, 7); c.fill();
            }
          }
        }
        // portraits between platforms
        for (var k = 0; k < 4; k++) {
          var fx = 60 + U.hash2(k, 1, seed) * (W - 200), fy = 40 + U.hash2(k, 2, seed) * 120;
          c.fillStyle = '#5a3a1a'; c.fillRect(fx, fy, 36, 46);
          c.fillStyle = '#3a2a4a'; c.fillRect(fx + 4, fy + 4, 28, 38);
          c.fillStyle = '#bfa8c8'; c.beginPath(); c.arc(fx + 18, fy + 20, 8, 0, 7); c.fill();
          c.fillStyle = '#1a0f1e';
          var look = p.x > fx ? 2 : -2;
          c.fillRect(fx + 14 + look, fy + 18, 2, 2); c.fillRect(fx + 20 + look, fy + 18, 2, 2);
        }

        // door
        if (d.door) {
          var dx0 = d.door.x * TS, dy0 = d.door.y * TS;
          var open = d.keys.every(function (k2) { return k2.got; });
          c.fillStyle = open ? '#2a5a3a' : '#4a2e1a';
          U.roundRect(c, dx0 + 3, dy0 - 8, TS - 6, TS + 8, 8); c.fill();
          c.fillStyle = open ? 'rgba(125,255,176,.35)' : '#3a2010';
          c.fillRect(dx0 + 8, dy0 - 2, TS - 16, TS);
          c.fillStyle = '#ffd257';
          c.beginPath(); c.arc(dx0 + TS - 10, dy0 + 16, 2.5, 0, 7); c.fill();
          if (!open) {
            c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '700 10px Outfit, sans-serif'; c.textAlign = 'center';
            var need = d.keys.filter(function (k3) { return !k3.got; }).length;
            c.fillText(need + ' 🔑', dx0 + TS / 2, dy0 - 14);
          } else {
            c.shadowColor = '#7dffb0'; c.shadowBlur = 14;
            c.strokeStyle = '#7dffb0'; c.lineWidth = 2;
            U.roundRect(c, dx0 + 3, dy0 - 8, TS - 6, TS + 8, 8); c.stroke();
            c.shadowBlur = 0;
          }
        }

        d.keys.forEach(function (k4) {
          if (k4.got) return;
          var kx = k4.x * TS + TS / 2, ky = k4.y * TS + TS / 2 + Math.sin(g.t * 4 + k4.x) * 3;
          c.shadowColor = '#ffd257'; c.shadowBlur = 10;
          c.strokeStyle = '#ffd257'; c.lineWidth = 3; c.lineCap = 'round';
          c.beginPath(); c.arc(kx - 6, ky, 5, 0, 7); c.stroke();
          c.beginPath(); c.moveTo(kx - 1, ky); c.lineTo(kx + 10, ky); c.moveTo(kx + 6, ky); c.lineTo(kx + 6, ky + 5); c.moveTo(kx + 10, ky); c.lineTo(kx + 10, ky + 4); c.stroke();
          c.shadowBlur = 0;
        });

        // the player: a small explorer with a lantern
        if (!p.dead) {
          c.save();
          c.translate(p.x, p.y + p.h);
          c.scale(p.face / p.squash, p.squash);
          c.fillStyle = '#8a6a3a';
          U.roundRect(c, -p.w / 2, -p.h + 8, p.w, p.h - 8, 5); c.fill();
          c.fillStyle = '#3a2a1a';
          c.fillRect(-p.w / 2 + 2, -6, 6, 6); c.fillRect(p.w / 2 - 8, -6, 6, 6);
          c.fillStyle = '#f5cfa8';
          c.beginPath(); c.arc(0, -p.h + 6, 7, 0, 7); c.fill();
          c.fillStyle = '#5a3a2a';
          c.fillRect(-9, -p.h - 1, 18, 4); c.fillRect(-6, -p.h - 8, 12, 8);
          c.fillStyle = '#222'; c.fillRect(2, -p.h + 5, 2.5, 2.5);
          // lantern
          c.fillStyle = '#ffd257';
          c.fillRect(p.w / 2 + 2, -p.h + 12, 6, 8);
          c.restore();
          var lg = c.createRadialGradient(p.x, p.y + 10, 5, p.x, p.y + 10, 120);
          lg.addColorStop(0, 'rgba(255,210,120,.22)'); lg.addColorStop(1, 'rgba(255,210,120,0)');
          c.fillStyle = lg; c.fillRect(p.x - 120, p.y - 110, 240, 240);
          if (p.stillT > .3) {
            c.fillStyle = 'rgba(160,220,255,' + Math.min(.9, p.stillT) + ')';
            c.font = '700 11px Outfit, sans-serif'; c.textAlign = 'center';
            c.fillText('still', p.x, p.y - 14);
          }
        }

        d.ghosts.forEach(function (gh) {
          var frozen = p.still;
          var gy = gh.y + Math.sin(gh.wob * 2) * 3;
          c.save();
          c.translate(gh.x, gy);
          c.globalAlpha = frozen ? .55 : .85;
          c.fillStyle = frozen ? '#9fb4c8' : gh.alert > 0 ? '#ffd0d0' : '#f4f0ff';
          c.shadowColor = frozen ? '#7fb4ff' : '#ffffff'; c.shadowBlur = frozen ? 4 : 14;
          c.beginPath();
          c.arc(0, -4, 14, Math.PI, 0);
          c.lineTo(14, 12);
          for (var w = 3; w >= -3; w--) c.lineTo(w * 4.6, 12 + (w % 2 ? -5 : 0) + (frozen ? 0 : Math.sin(gh.wob * 6 + w) * 2));
          c.lineTo(-14, 12);
          c.closePath(); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = gh.alert > 0 ? '#ff3b3b' : '#2a1630';
          c.beginPath(); c.arc(-5, -4, 2.6, 0, 7); c.arc(5, -4, 2.6, 0, 7); c.fill();
          if (gh.alert > 0) { c.fillStyle = '#2a1630'; c.beginPath(); c.arc(0, 4, 3.5, 0, 7); c.fill(); }
          if (frozen) {
            c.strokeStyle = 'rgba(200,235,255,.8)'; c.lineWidth = 1.5;
            c.beginPath();
            for (var s = 0; s < 3; s++) { var a = g.t * .5 + s * 2.1; c.moveTo(Math.cos(a) * 12, Math.sin(a) * 12); c.lineTo(Math.cos(a) * 20, Math.sin(a) * 20); }
            c.stroke();
          }
          c.restore();
        });
        c.globalAlpha = 1;

        d.parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life / pt.max);
          c.fillStyle = pt.col;
          c.beginPath(); c.arc(pt.x, pt.y, pt.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        d.texts.forEach(function (t) {
          c.globalAlpha = Math.max(0, t.life);
          c.fillStyle = t.col; c.font = '800 15px Outfit, sans-serif'; c.textAlign = 'center';
          c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 3;
          c.strokeText(t.s, t.x, t.y); c.fillText(t.s, t.x, t.y);
        });
        c.globalAlpha = 1;

        if (d.flash > 0) { c.fillStyle = 'rgba(180,140,255,' + d.flash * .4 + ')'; c.fillRect(0, 0, W, H); }
        c.restore();

        // candle timer
        var frac = U.clamp(d.candle / CANDLE, 0, 1);
        var cxx = W / 2, cyy = 30;
        c.fillStyle = 'rgba(0,0,0,.35)'; U.roundRect(c, cxx - 70, cyy - 6, 140, 14, 7); c.fill();
        c.fillStyle = '#f2e6c0'; U.roundRect(c, cxx - 66, cyy - 3, 132 * frac, 8, 4); c.fill();
        var flameX = cxx - 66 + 132 * frac;
        c.fillStyle = '#ffb347';
        c.beginPath(); c.ellipse(flameX, cyy - 8, 4, 7 + Math.sin(g.t * 12) * 2, 0, 0, 7); c.fill();
        c.fillStyle = frac < .2 ? '#ff7a7a' : 'rgba(255,255,255,.6)';
        c.font = '700 11px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillText(Math.ceil(d.candle) + 's', cxx, cyy + 22);
        if (!d.noticed && !p.dead) {
          c.fillStyle = 'rgba(125,255,176,.7)'; c.font = '700 11px Outfit, sans-serif'; c.textAlign = 'right';
          c.fillText('unseen', W - 14, H - 12);
        }

        if (d.bannerT > 0) {
          c.globalAlpha = Math.min(1, d.bannerT * 2);
          c.fillStyle = 'rgba(20,8,26,.88)';
          U.roundRect(c, W / 2 - 180, H / 2 - 40, 360, 64, 12); c.fill();
          c.fillStyle = '#e9ddff';
          c.font = '800 22px Outfit, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('Room ' + (d.room + 1) + (d.loop ? ' · loop ' + (d.loop + 1) : '') + ' — ' + d.name, W / 2, H / 2 - 16);
          c.fillStyle = '#bfa8c8'; c.font = '600 13px Outfit, sans-serif';
          c.fillText(d.keys.length + ' key' + (d.keys.length === 1 ? '' : 's') + ' · ' + d.ghosts.length + ' ghost' + (d.ghosts.length === 1 ? '' : 's'), W / 2, H / 2 + 8);
          c.globalAlpha = 1; c.textBaseline = 'alphabetic';
        }
        if (p.dead && d.lives > 0) {
          c.fillStyle = 'rgba(255,255,255,.85)';
          c.font = '700 18px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(d.why + ' — ' + d.lives + ' left', W / 2, H - 20);
        }
      }
    });
  }

  window.Milo.register({
    id: 'ghost-manor', title: 'Ghost Manor', emo: '👻', category: 'Action',
    tagline: 'Ghosts only move when you do',
    description: 'Twelve rooms of a haunted house, each with a few keys, a locked door and ' +
      'ghosts drifting along fixed patrol routes — straight through the walls. The rule ' +
      'that makes it a stealth game: ghosts only move while you are moving, so stand ' +
      'still and everything freezes while you plan. Your candle burns for forty seconds a ' +
      'room, though, and a ghost that notices you moving nearby turns red and speeds up. ' +
      'Rooms pay 100 plus the candle time you had left, and 50 extra if nothing noticed you.',
    controls: ['← →', 'Space / ↑ jump', 'Hold still to freeze ghosts'],
    colors: ['#2a1630', '#f4f0ff'],
    tags: ['stealth', 'platformer', 'levels', 'spooky', 'puzzle'],
    mount: mount
  });
})();
