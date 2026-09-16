/* Magnet Boots — walk floors and ceilings; flip polarity on metal, never touch a live wire. */
(function () {
  'use strict';
  var W = 800, H = 512, TS = 32, COLS = 25, ROWS = 16;
  var PW = 20, PH = 28;
  var GRAV = 2300, MAXFALL = 720, RUN = 215;
  var COYOTE = .1, BUFFER = .12;
  var PULSE = 2.6, PULSE_ON = 1.15, PULSE_WARN = .3;

  /* Legend: # metal (flippable)  = rubber (solid, no flip)  ~ live wire
             ! pulsing wire  ? pulsing wire (opposite phase)  o bolt  P start  E exit */
  var ROOMS = [
    { name: 'Power On', map: [
      '#########################',
      '#          o            #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#P       ~~~~~~      E  #',
      '#########################'] },
    { name: 'Alternating Current', map: [
      '#########################',
      '#        ~~~~        ~~~#',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#            o          #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#P ~~~~        ~~~~   E #',
      '#########################'] },
    { name: 'Rubber Soles', map: [
      '#######==========########',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                   o   #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#P        ~~~~        E #',
      '######====####====#######'] },
    { name: 'Decoy Ceiling', map: [
      '#########################',
      '#         ~~~~~~        #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#       ######          #',
      '#                       #',
      '#                 o     #',
      '#                       #',
      '#                       #',
      '#             ######    #',
      '#                       #',
      '#                    E  #',
      '#                   ### #',
      '#P   ~~~~~~~~~~~~~~~###~#',
      '#########################'] },
    { name: 'Pulse', map: [
      '#########################',
      '# o ~~~~~~~~~~~~~~~~~   #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#P    !!!     ???    E  #',
      '#########################'] },
    { name: 'Staircase', map: [
      '#########################',
      '#P          ~~~~~~~~~~~ #',
      '####                    #',
      '#                       #',
      '#      #####            #',
      '#           o           #',
      '#          #####        #',
      '#                       #',
      '#              #####    #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#~~~~~~~~~~~~~~~~~~~  E #',
      '#########################'] },
    { name: 'Upside-Down Hall', map: [
      '#########################',
      '#~~~~~~~~~  E           #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#              o        #',
      '####################    #',
      '#         ~~~           #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#P   ~~~~     ~~~~~~    #',
      '#########################'] },
    { name: 'The Vault', map: [
      '#########################',
      '#         !!!!!         #',
      '#                       #',
      '#                       #',
      '#           o           #',
      '#       ########        #',
      '#       #   E           #',
      '#       #########       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#P  ~~~~~~~~~~~~~~~~~~~~#',
      '#########################'] },
    { name: 'Live Grid', map: [
      '#########################',
      '#   ~~  ???  ~~  !!!    #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#           o           #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#P  !!!  ~~  ???  ~~  E #',
      '#########################'] },
    { name: 'Drop Shaft', map: [
      '#########################',
      '#P     ~~~~   ~~~~~~~~~~#',
      '#####                   #',
      '#                       #',
      '#      =====            #',
      '#                       #',
      '#                       #',
      '#           =====       #',
      '#                       #',
      '#                       #',
      '#   #####       ##      #',
      '#                       #',
      '#                 o     #',
      '#                       #',
      '#~~~~~~~~~~~~~~~~     E #',
      '#########################'] },
    { name: 'Three Storeys', map: [
      '#########################',
      '#             !!!    E  #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#######  ################',
      '#           ??          #',
      '#                       #',
      '#                       #',
      '#                   o   #',
      '################  #######',
      '#    !!!                #',
      '#                       #',
      '#                       #',
      '#P  ~~~~~~~~~~~~~~~~~~~~#',
      '#########################'] },
    { name: 'Final Circuit', map: [
      '#########################',
      '#  ~~~  !!!  ~~~  ???   #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#       o       o       #',
      '#     ####    ####      #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#P ???  ~~~  !!!  ~~~ E #',
      '#########################'] }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.room = 0;
      d.loop = 0;
      d.lives = 3;
      d.bolts = 0;
      d.parts = [];
      d.sparks = [];
      d.shake = 0;
      d.flash = 0;
      d.flipFx = 0;
      d.over = false;
      d.clock = 0;
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
      d.boltList = []; d.exit = null;
      var start = { x: 1, y: ROWS - 2 };
      for (var y = 0; y < ROWS; y++) {
        for (var x = 0; x < COLS; x++) {
          var ch = d.map[y][x];
          if (ch === 'o') d.boltList.push({ x: x, y: y, got: false });
          else if (ch === 'P') start = { x: x, y: y };
          else if (ch === 'E') d.exit = { x: x, y: y };
        }
      }
      d.start = start;
      d.bannerT = 1.6;
      d.roomT = 0;
      spawn(d);
    }

    function spawn(d) {
      d.p = {
        x: d.start.x * TS + TS / 2, y: (d.start.y + 1) * TS - PH, w: PW, h: PH,
        vx: 0, vy: 0, gd: 1, ground: false, metal: false, coyote: 0, buffer: 0,
        face: 1, dead: 0, squash: 1
      };
    }

    function tile(d, tx, ty) {
      if (ty < 0 || ty >= ROWS || tx < 0 || tx >= COLS) return '#';
      return d.map[ty][tx];
    }
    function solid(d, tx, ty) { var ch = tile(d, tx, ty); return ch === '#' || ch === '='; }
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

    /** Is a wire tile live right now? Pulsing wires share a clock; '?' runs half a cycle behind '!'. */
    function wireState(d, ch) {
      if (ch === '~') return 'on';
      if (ch !== '!' && ch !== '?') return null;
      var t = (d.clock + (ch === '?' ? PULSE / 2 : 0)) % PULSE;
      if (t < PULSE_ON) return 'on';
      if (t > PULSE - PULSE_WARN) return 'warn';
      return 'off';
    }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = U.rand(30, spd || 180);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.25, .6), max: .6, col: col, r: U.rand(1.5, 3.5) });
      }
    }

    function die(g, why) {
      var d = g.data, p = d.p;
      if (p.dead) return;
      p.dead = 1.0;
      d.shake = 10;
      d.flash = .5;
      burst(d, p.x, p.y + p.h / 2, '#ffe86b', 20, 260);
      burst(d, p.x, p.y + p.h / 2, '#7fe9ff', 16, 200);
      Milo.sound.explode();
      Milo.sound.tone({ f: 1200, f2: 200, d: .3, v: .08, type: 'sawtooth' });
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      d.why = why;
    }

    function flip(g) {
      var d = g.data, p = d.p;
      p.gd = -p.gd;
      p.vy = p.gd * 140;
      p.ground = false; p.coyote = 0; p.buffer = 0;
      p.squash = .75;
      d.flipFx = .25;
      var fy = p.gd > 0 ? p.y : p.y + p.h;
      burst(d, p.x, fy, '#7fe9ff', 10, 140);
      Milo.sound.tone({ f: p.gd > 0 ? 700 : 260, f2: p.gd > 0 ? 260 : 700, d: .13, v: .07, type: 'square' });
    }

    return Milo.arcade(host, {
      id: 'magnet-boots',
      w: W, h: H, bg: '#101823',
      stats: ['Room', 'Score', 'Lives', 'Best'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'FLIP' }],
      emo: '🧲',
      start: {
        title: 'Magnet Boots',
        text: 'Your boots stick to metal — floor or ceiling. Press flip while standing on a ' +
          'metal plate to fall the other way. Rubber blocks hold you but will not flip you, ' +
          'live wires end a life, and pulsing wires switch off for a moment each cycle.',
        keys: ['← → walk', 'Space / ↑ flip polarity']
      },
      init: reset,
      onPointer: function (g, type) { if (type === 'down' && g.state === 'play') g.data.tapFlip = true; },

      update: function (g, dt) {
        var d = g.data, p = d.p, inp = g.input, i;
        d.clock += dt;
        d.roomT += dt;
        d.shake = Math.max(0, d.shake - dt * 30);
        d.flash = Math.max(0, d.flash - dt);
        d.flipFx = Math.max(0, d.flipFx - dt);
        if (d.bannerT > 0) d.bannerT -= dt;
        for (i = d.parts.length - 1; i >= 0; i--) {
          var pt = d.parts[i];
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vx *= Math.pow(.2, dt); pt.vy *= Math.pow(.2, dt); pt.life -= dt;
          if (pt.life <= 0) d.parts.splice(i, 1);
        }
        // ambient sparks crawl along live wires
        if (Math.random() < dt * 14) {
          var wx = U.randInt(0, COLS - 1), wy = U.randInt(0, ROWS - 1), wc = tile(d, wx, wy);
          if (wireState(d, wc) === 'on') d.sparks.push({ x: wx * TS + U.rand(4, 28), y: wy * TS + TS / 2, life: .3 });
        }
        for (i = d.sparks.length - 1; i >= 0; i--) { d.sparks[i].life -= dt; if (d.sparks[i].life <= 0) d.sparks.splice(i, 1); }

        if (p.dead) {
          p.dead -= dt;
          if (p.dead <= 0) {
            if (d.lives <= 0) {
              d.over = true;
              g.gameOver({
                emo: '🧲', title: d.why,
                text: 'You cleared ' + d.room + ' room' + (d.room === 1 ? '' : 's') + ' and collected ' + d.bolts + ' bolt' + (d.bolts === 1 ? '' : 's') + '.',
                score: g.score
              });
            } else spawn(d);
          }
          return;
        }

        // --- input -------------------------------------------------------------------
        var frozen = d.bannerT > 1.0;
        var move = frozen ? 0 : (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
        var flipPressed = !frozen && (inp.pressed('action') || inp.pressed('up') || inp.pressed('a') || inp.pressed('down') || d.tapFlip);
        d.tapFlip = false;
        if (move) p.face = move;
        var accel = p.ground ? 2800 : 1700;
        if (move) p.vx += (move * RUN - p.vx) * Math.min(1, accel / RUN * dt);
        else p.vx *= Math.pow(p.ground ? .0004 : .08, dt);
        if (Math.abs(p.vx) < 2) p.vx = 0;

        // Coyote time counts from the last moment the boots were on metal.
        p.coyote = (p.ground && p.metal) ? COYOTE : p.coyote - dt;
        p.buffer = flipPressed ? BUFFER : p.buffer - dt;
        if (p.buffer > 0 && p.coyote > 0) flip(g);
        else if (flipPressed && p.ground && !p.metal) {
          Milo.sound.tone({ f: 160, f2: 120, d: .08, v: .05, type: 'triangle' });
          d.rubberHint = .9;
        }
        if (d.rubberHint > 0) d.rubberHint -= dt;

        p.vy += p.gd * GRAV * dt;
        p.vy = U.clamp(p.vy, -MAXFALL, MAXFALL);

        var wasGround = p.ground, fallV = Math.abs(p.vy);
        var hit = sweep(d, p, p.vx * dt, p.vy * dt);
        if (hit.x) p.vx = 0;
        p.ground = false;
        if (hit.y) {
          if ((p.vy > 0 && p.gd > 0) || (p.vy < 0 && p.gd < 0)) {
            p.ground = true;
            if (!wasGround) {
              p.squash = fallV > 450 ? 1.4 : 1.18;
              burst(d, p.x, p.gd > 0 ? p.y + p.h : p.y, '#9fb4c8', fallV > 450 ? 8 : 4, 70);
              Milo.sound.tone({ f: 150, f2: 90, d: .07, v: fallV > 450 ? .06 : .03, type: 'triangle' });
            }
          }
          p.vy = 0;
        } else if (hitsRect(d, p.x - p.w / 2, p.y + p.gd, p.w, p.h) && p.vy * p.gd >= 0) p.ground = true;
        // what are the boots touching?
        p.metal = false;
        if (p.ground) {
          var fy = p.gd > 0 ? Math.floor((p.y + p.h + 1) / TS) : Math.floor((p.y - 1) / TS);
          var fx0 = Math.floor((p.x - p.w / 2 + 2) / TS), fx1 = Math.floor((p.x + p.w / 2 - 2) / TS);
          for (var fx = fx0; fx <= fx1; fx++) if (tile(d, fx, fy) === '#') p.metal = true;
        }
        p.squash += (1 - p.squash) * Math.min(1, dt * 12);

        // --- wires -----------------------------------------------------------------------
        var x0 = Math.floor((p.x - p.w / 2 + 3) / TS), x1 = Math.floor((p.x + p.w / 2 - 3) / TS);
        var y0 = Math.floor((p.y + 3) / TS), y1 = Math.floor((p.y + p.h - 3) / TS);
        for (var ty = y0; ty <= y1; ty++) for (var tx = x0; tx <= x1; tx++) {
          if (wireState(d, tile(d, tx, ty)) === 'on') { die(g, 'Zapped by a live wire'); return; }
        }

        // --- bolts & exit --------------------------------------------------------------
        var cx = p.x, cy = p.y + p.h / 2;
        d.boltList.forEach(function (b) {
          if (b.got) return;
          if (U.dist(cx, cy, b.x * TS + TS / 2, b.y * TS + TS / 2) < 26) {
            b.got = true; d.bolts++;
            g.score += 25; g.set('Score', g.score);
            burst(d, b.x * TS + TS / 2, b.y * TS + TS / 2, '#ffd257', 12, 150);
            Milo.sound.coin();
          }
        });
        if (d.exit && Math.abs(cx - (d.exit.x * TS + TS / 2)) < 16 && Math.abs(cy - (d.exit.y * TS + TS / 2)) < 22) {
          d.room++;
          if (d.room % ROOMS.length === 0) d.loop++;
          var quick = d.roomT < 12 ? 50 : 0;
          g.score += 100 + quick;
          g.set('Score', g.score);
          burst(d, cx, cy, '#7dffb0', 24, 220);
          Milo.sound.win();
          loadRoom(d);
          g.set('Room', d.room + 1);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#16202e'); bg.addColorStop(1, '#0c1119');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // faint grid + hatching so the room reads as a machine interior
        c.strokeStyle = 'rgba(120,160,200,.06)'; c.lineWidth = 1;
        c.beginPath();
        for (var gx = 0; gx <= W; gx += TS) { c.moveTo(gx + .5, 0); c.lineTo(gx + .5, H); }
        for (var gy = 0; gy <= H; gy += TS) { c.moveTo(0, gy + .5); c.lineTo(W, gy + .5); }
        c.stroke();

        var seed = (d.room % ROOMS.length) * 31 + 5;
        for (var y = 0; y < ROWS; y++) {
          for (var x = 0; x < COLS; x++) {
            var ch = d.map[y][x], px = x * TS, py = y * TS;
            if (ch === '#') {
              var v = U.hash2(x, y, seed);
              c.fillStyle = v < .5 ? '#3a4a60' : '#405269';
              c.fillRect(px, py, TS, TS);
              c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(px, py, TS, 2); c.fillRect(px, py, 2, TS);
              c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(px, py + TS - 2, TS, 2); c.fillRect(px + TS - 2, py, 2, TS);
              c.fillStyle = '#6a86a8';
              c.beginPath(); c.arc(px + 6, py + 6, 1.8, 0, 7); c.arc(px + TS - 6, py + 6, 1.8, 0, 7);
              c.arc(px + 6, py + TS - 6, 1.8, 0, 7); c.arc(px + TS - 6, py + TS - 6, 1.8, 0, 7); c.fill();
              if (v > .82) { c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(px + 8, py + 10, 16, 12); }
            } else if (ch === '=') {
              c.fillStyle = '#c2622e';
              c.fillRect(px, py, TS, TS);
              c.fillStyle = '#e07a3e';
              for (var k = 0; k < 4; k++) c.fillRect(px + 3 + k * 8, py + 3, 5, TS - 6);
              c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(px, py + TS - 3, TS, 3);
            } else if (ch === '~' || ch === '!' || ch === '?') {
              var st = wireState(d, ch);
              var pulse = ch !== '~';
              // find which surface the wire is attached to, so it hugs it
              var attachY = solid(d, x, y + 1) ? py + TS - 5 : solid(d, x, y - 1) ? py + 5 : py + TS / 2;
              c.lineCap = 'round';
              c.strokeStyle = st === 'on' ? '#ffe86b' : st === 'warn' ? (Math.sin(g.t * 50) > 0 ? '#ffb347' : '#6a5a30') : '#4a4a55';
              c.lineWidth = st === 'on' ? 3.5 : 3;
              c.shadowColor = '#ffe86b'; c.shadowBlur = st === 'on' ? 12 : 0;
              c.beginPath();
              c.moveTo(px, attachY);
              for (var wx = 4; wx <= TS; wx += 4) c.lineTo(px + wx, attachY + (st === 'on' ? Math.sin(g.t * 30 + x * 3 + wx) * 2 : Math.sin(wx * .7 + x) * 1.5));
              c.stroke();
              c.shadowBlur = 0;
              if (pulse) {
                c.fillStyle = st === 'on' ? '#ff5c5c' : st === 'warn' ? '#ffb347' : '#3fd97a';
                c.beginPath(); c.arc(px + TS / 2, attachY + (attachY > py + TS / 2 ? -7 : 7), 3, 0, 7); c.fill();
              }
              if (st === 'on') {
                c.fillStyle = '#7fe9ff';
                c.fillRect(px + ((g.t * 200 + x * 13) % TS), attachY - 1.5, 3, 3);
              }
            } else if (ch === 'E') {
              // the exit hatch, framed on whichever surface it sits against
              var down = solid(d, x, y + 1);
              c.fillStyle = '#1c2a22';
              U.roundRect(c, px + 3, py + 1, TS - 6, TS - 2, 5); c.fill();
              c.strokeStyle = '#7dffb0'; c.lineWidth = 3;
              c.shadowColor = '#7dffb0'; c.shadowBlur = 14 + Math.sin(g.t * 4) * 4;
              U.roundRect(c, px + 3, py + 1, TS - 6, TS - 2, 5); c.stroke();
              c.shadowBlur = 0;
              c.fillStyle = 'rgba(125,255,176,' + (.35 + Math.sin(g.t * 4) * .15) + ')';
              c.fillRect(px + 9, py + (down ? 6 : 12), TS - 18, 14);
              c.fillStyle = '#7dffb0';
              c.font = '800 10px Outfit, sans-serif'; c.textAlign = 'center';
              c.fillText('EXIT', px + TS / 2, py + (down ? 28 : 10));
            }
          }
        }

        d.boltList.forEach(function (b) {
          if (b.got) return;
          var bx = b.x * TS + TS / 2, by = b.y * TS + TS / 2 + Math.sin(g.t * 3 + b.x) * 3;
          c.save();
          c.translate(bx, by); c.rotate(g.t * 1.5);
          c.fillStyle = '#ffd257';
          c.shadowColor = '#ffd257'; c.shadowBlur = 10;
          c.beginPath();
          for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3; c.lineTo(Math.cos(a) * 9, Math.sin(a) * 9); }
          c.closePath(); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#8a6a1a';
          c.beginPath(); c.arc(0, 0, 3.5, 0, 7); c.fill();
          c.restore();
        });

        d.sparks.forEach(function (s) {
          c.globalAlpha = s.life * 3;
          c.fillStyle = '#ffffff';
          c.fillRect(s.x - 1, s.y - 1 - (0.3 - s.life) * 30, 2, 2);
        });
        c.globalAlpha = 1;

        // the robot: a boxy little walker whose boots glow while they hold
        if (!p.dead) {
          c.save();
          var baseY = p.gd > 0 ? p.y + p.h : p.y;
          c.translate(p.x, baseY);
          c.scale(p.face / p.squash, p.squash * p.gd);
          // magnet field when stuck to metal
          if (p.ground && p.metal) {
            c.strokeStyle = 'rgba(127,233,255,' + (.25 + Math.sin(g.t * 10) * .15) + ')'; c.lineWidth = 1.5;
            c.beginPath(); c.arc(0, 0, 16, Math.PI, 0); c.arc(0, 0, 22, Math.PI, 0); c.stroke();
          }
          // boots
          c.fillStyle = p.metal && p.ground ? '#7fe9ff' : '#3b4f66';
          c.fillRect(-PW / 2, -6, 8, 6); c.fillRect(PW / 2 - 8, -6, 8, 6);
          // body
          c.fillStyle = '#d8dee8';
          U.roundRect(c, -PW / 2 + 1, -PH + 2, PW - 2, PH - 8, 5); c.fill();
          c.fillStyle = '#b4bcc9';
          c.fillRect(-PW / 2 + 1, -PH + 14, PW - 2, 3);
          // visor
          c.fillStyle = '#1b2430';
          U.roundRect(c, -6, -PH + 6, 13, 7, 3); c.fill();
          c.fillStyle = '#7fe9ff';
          c.fillRect(1 + (p.vx ? 1 : 0), -PH + 8, 4, 3);
          // antenna
          c.strokeStyle = '#b4bcc9'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(-4, -PH + 2); c.lineTo(-6, -PH - 4); c.stroke();
          c.fillStyle = d.flipFx > 0 ? '#ffe86b' : '#ff5c5c';
          c.beginPath(); c.arc(-6, -PH - 5, 2.5, 0, 7); c.fill();
          c.restore();
          if (d.flipFx > 0) {
            c.strokeStyle = 'rgba(127,233,255,' + d.flipFx * 3 + ')'; c.lineWidth = 2;
            c.beginPath(); c.arc(p.x, p.y + p.h / 2, 30 - d.flipFx * 80, 0, 7); c.stroke();
          }
        }

        d.parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life / pt.max);
          c.fillStyle = pt.col;
          c.fillRect(pt.x - pt.r, pt.y - pt.r, pt.r * 2, pt.r * 2);
        });
        c.globalAlpha = 1;

        if (d.flash > 0) { c.fillStyle = 'rgba(255,230,100,' + d.flash * .4 + ')'; c.fillRect(0, 0, W, H); }
        c.restore();

        if (d.bannerT > 0) {
          c.globalAlpha = Math.min(1, d.bannerT * 2);
          c.fillStyle = 'rgba(8,14,22,.85)';
          U.roundRect(c, W / 2 - 180, 40, 360, 56, 10); c.fill();
          c.strokeStyle = '#7fe9ff'; c.lineWidth = 2;
          U.roundRect(c, W / 2 - 180, 40, 360, 56, 10); c.stroke();
          c.fillStyle = '#e8f4ff';
          c.font = '800 22px Outfit, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('Room ' + (d.room + 1) + (d.loop ? ' · loop ' + (d.loop + 1) : '') + ' — ' + d.name, W / 2, 68);
          c.globalAlpha = 1; c.textBaseline = 'alphabetic';
        }
        if (d.rubberHint > 0 && !p.dead) {
          c.globalAlpha = Math.min(1, d.rubberHint * 2);
          c.fillStyle = '#ffb347'; c.font = '700 14px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('Rubber — no grip for the magnet', p.x, p.gd > 0 ? p.y - 12 : p.y + p.h + 20);
          c.globalAlpha = 1;
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
    id: 'magnet-boots', title: 'Magnet Boots', emo: '🧲', category: 'Action',
    tagline: 'Flip polarity, walk the ceiling, dodge live wires',
    description: 'There is no jump. Your boots cling to metal plates, and pressing flip while ' +
      'they are touching one reverses the pull so you fall to the opposite surface — cross a ' +
      'floor full of live wires by walking the ceiling over it. Rubber blocks hold you but ' +
      'refuse to flip you, and pulsing wires switch off for a beat each cycle, with a flicker ' +
      'before they come back on. Twelve rooms, three lives, 100 points a room plus a bonus for ' +
      'clearing it inside twelve seconds and 25 for every bolt. Always check what is directly ' +
      'above before you flip.',
    controls: ['← →', 'Space / ↑ flip'],
    colors: ['#16202e', '#7fe9ff'],
    tags: ['gravity', 'platformer', 'levels', 'puzzle', 'precision'],
    mount: mount
  });
})();
