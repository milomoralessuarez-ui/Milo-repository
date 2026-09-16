/* Bubble Trap — blow bubbles round the critters, then kick the bubbles into each other. */
(function () {
  'use strict';
  var W = 800, H = 512, TS = 32, COLS = 25, ROWS = 16;
  var PW = 22, PH = 28;
  var JUMP_V = -560, G_RISE = 1600, G_CUT = 3400, G_FALL = 2200, MAXFALL = 820;
  var COYOTE = .1, BUFFER = .12, RUN = 220;
  var BR = 16, BUBBLE_LIFE = 7.5;

  /* Legend: # solid  P start  c walker  h hopper */
  var ARENAS = [
    { name: 'Warm-up', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#       #########       #',
      '#                       #',
      '#  ####           ####  #',
      '#                       #',
      '#                       #',
      '#P     c         c      #',
      '#########################'] },
    { name: 'Two Tiers', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#     c         c       #',
      '#  #######   #######    #',
      '#                       #',
      '#        #######        #',
      '#                       #',
      '#  ####           ####  #',
      '#                       #',
      '#                       #',
      '#     P      c          #',
      '#########################'] },
    { name: 'Steps', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                   c   #',
      '#                 ##### #',
      '#                       #',
      '#             ####      #',
      '#                       #',
      '#         ####          #',
      '#                       #',
      '#     ####              #',
      '#                       #',
      '#  ###                  #',
      '#P   c      h      c    #',
      '#########################'] },
    { name: 'Pillars', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#     c            c    #',
      '#   #####        #####  #',
      '#                       #',
      '#           ###         #',
      '#                       #',
      '#     ####     ####     #',
      '#                       #',
      '#        ###   ###      #',
      '#                       #',
      '#   ###           ###   #',
      '#P        c   h         #',
      '#########################'] },
    { name: 'Crossfire', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#     c          h      #',
      '#   ######    ######    #',
      '#                       #',
      '#            ###        #',
      '#                       #',
      '#   ####        ####    #',
      '#                       #',
      '#       #####           #',
      '#                       #',
      '#  ###             ###  #',
      '#P     c     h     c    #',
      '#########################'] },
    { name: 'Long Hall', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#  c                 c  #',
      '# #####           ##### #',
      '#                       #',
      '#       #########       #',
      '#                       #',
      '# ######         ###### #',
      '#                       #',
      '#       #########       #',
      '#                       #',
      '# ####             #### #',
      '#P     c     c     c    #',
      '#########################'] },
    { name: 'Hop Zone', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#                       #',
      '#      h         h      #',
      '#    ####       ####    #',
      '#                       #',
      '#          ###          #',
      '#                       #',
      '#   ####         ####   #',
      '#                       #',
      '#  ##                ## #',
      '#P    h           h     #',
      '#########################'] },
    { name: 'The Cage', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#   c               c   #',
      '# #####  #######  ##### #',
      '#                       #',
      '#      ###       ###    #',
      '#        c     c        #',
      '#   ###  #######  ###   #',
      '#                       #',
      '#      ###     ###      #',
      '#                       #',
      '#  ###             ###  #',
      '#P        c   c         #',
      '#########################'] },
    { name: 'Gauntlet', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#    h          c       #',
      '#  ######    ########   #',
      '#                       #',
      '#      ####     ####    #',
      '#                       #',
      '#  #####   h   #####    #',
      '#                       #',
      '#        #######        #',
      '#                       #',
      '# ####             #### #',
      '#P   c     h     c    c #',
      '#########################'] },
    { name: 'Swarm', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#   h      c        h   #',
      '# #####  #######  ##### #',
      '#                       #',
      '#      ###       ###    #',
      '#        c     h        #',
      '#   ###  #######  ###   #',
      '#                       #',
      '#      ###     ###      #',
      '#                       #',
      '#  ###             ###  #',
      '#P     c    h    c    c #',
      '#########################'] },
    { name: 'Summit', map: [
      '#########################',
      '#                       #',
      '#                       #',
      '#                       #',
      '#   c               h   #',
      '# #####           ##### #',
      '#                       #',
      '#      c       h        #',
      '#     ####   ####       #',
      '#                       #',
      '#   ####         ####   #',
      '#          h            #',
      '#        #######        #',
      '#                       #',
      '#P  c    ###   c    h   #',
      '#########################'] }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.arena = 0;
      d.loop = 0;
      d.lives = 3;
      d.parts = [];
      d.texts = [];
      d.shake = 0;
      d.over = false;
      d.bestChain = 0;
      loadArena(d);
      g.score = 0;
      g.set('Arena', 1);
      g.set('Score', 0);
      g.set('Lives', 3);
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    function loadArena(d) {
      var def = ARENAS[d.arena % ARENAS.length];
      d.name = def.name;
      d.map = def.map;
      d.critters = [];
      d.bubbles = [];
      d.fruit = [];
      var start = { x: 1, y: ROWS - 2 };
      var speed = 55 + (d.arena % ARENAS.length) * 5 + d.loop * 22;
      for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) {
        var ch = d.map[y][x];
        if (ch === 'c' || ch === 'h') {
          d.critters.push({ x: x * TS + TS / 2, y: (y + 1) * TS - 24, w: 22, h: 24, vx: (x % 2 ? 1 : -1) * speed, vy: 0, kind: ch === 'h' ? 'hopper' : 'walker', ground: false, hopT: U.rand(1, 3), angry: false, speed: speed, wob: Math.random() * 7 });
        } else if (ch === 'P') start = { x: x, y: y };
      }
      d.start = start;
      d.bannerT = 1.8;
      d.clearT = 0;
      spawn(d);
    }

    function spawn(d) {
      d.p = { x: d.start.x * TS + TS / 2, y: (d.start.y + 1) * TS - PH, w: PW, h: PH, vx: 0, vy: 0, ground: false, coyote: 0, buffer: 0, face: 1, dead: 0, squash: 1, blow: 0, safe: 1.5 };
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
    /** Moves any {x (centre), y (top), w, h} entity, snapping to tile edges. */
    function sweep(d, e, dx, dy) {
      var hit = { x: false, y: false }, rem, sg, st;
      rem = Math.abs(dx); sg = dx > 0 ? 1 : -1;
      while (rem > 0) {
        st = Math.min(rem, 4);
        if (hitsRect(d, e.x - e.w / 2 + sg * st, e.y, e.w, e.h)) {
          if (sg > 0) e.x = Math.floor((e.x + e.w / 2 + st) / TS) * TS - e.w / 2 - .01;
          else e.x = (Math.floor((e.x - e.w / 2 - st) / TS) + 1) * TS + e.w / 2 + .01;
          hit.x = true; break;
        }
        e.x += sg * st; rem -= st;
      }
      rem = Math.abs(dy); sg = dy > 0 ? 1 : -1;
      while (rem > 0) {
        st = Math.min(rem, 4);
        if (hitsRect(d, e.x - e.w / 2, e.y + sg * st, e.w, e.h)) {
          if (sg > 0) e.y = Math.floor((e.y + e.h + st) / TS) * TS - e.h - .01;
          else e.y = (Math.floor((e.y - st) / TS) + 1) * TS + .01;
          hit.y = true; break;
        }
        e.y += sg * st; rem -= st;
      }
      return hit;
    }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = U.rand(30, spd || 180);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: U.rand(.3, .6), max: .6, col: col, r: U.rand(1.5, 3.5) });
      }
    }
    function text(d, x, y, s, col, big) { d.texts.push({ x: x, y: y, s: s, col: col, life: 1.2, big: big }); }

    function die(g, why) {
      var d = g.data, p = d.p;
      if (p.dead || p.safe > 0) return;
      p.dead = 1.0;
      d.shake = 9;
      burst(d, p.x, p.y + p.h / 2, '#5ee0c0', 22, 240);
      burst(d, p.x, p.y + p.h / 2, '#ffffff', 10, 160);
      Milo.sound.explode();
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      d.why = why;
    }

    /** Pops a bubble: frees or finishes its critter, then spreads to nearby bubbles. */
    function pop(g, b, chain, byHit) {
      var d = g.data;
      if (b.popped) return;
      b.popped = true;
      burst(d, b.x, b.y, '#bff4ff', 10, 150);
      if (b.critter) {
        var cr = b.critter;
        if (byHit) {
          var pts = 100 * chain;
          g.score += pts; g.set('Score', U.fmt(g.score));
          burst(d, b.x, b.y, cr.angry ? '#ff7a7a' : '#ffb347', 14, 200);
          text(d, b.x, b.y - 20, '+' + pts + (chain > 1 ? '  x' + chain : ''), chain > 1 ? '#ffd257' : '#ffffff', chain > 2);
          d.fruit.push({ x: b.x, y: b.y, vy: 0, life: 6, kind: U.randInt(0, 2) });
          d.bestChain = Math.max(d.bestChain, chain);
          Milo.sound.tone({ f: 500 + chain * 120, f2: 900 + chain * 200, d: .12, v: .08, type: 'square' });
        } else {
          // it escaped, and it is not happy about it
          cr.trapped = false; cr.angry = true; cr.x = b.x; cr.y = b.y - cr.h / 2; cr.vy = 0;
          cr.vx = (cr.vx < 0 ? -1 : 1) * cr.speed * 1.7;
          d.critters.push(cr);
          text(d, b.x, b.y - 20, 'escaped!', '#ff7a7a');
          Milo.sound.tone({ f: 300, f2: 120, d: .2, v: .07, type: 'sawtooth' });
        }
        b.critter = null;
      } else {
        Milo.sound.tone({ f: 900, f2: 1400, d: .05, v: .04, type: 'sine' });
        if (byHit) { g.score += 10; g.set('Score', U.fmt(g.score)); }
      }
      if (byHit) {
        d.shake = Math.max(d.shake, Math.min(6, chain * 1.5));
        d.bubbles.forEach(function (o) {
          if (!o.popped && U.dist(o.x, o.y, b.x, b.y) < BR * 2 + 28) pop(g, o, chain + 1, true);
        });
      }
    }

    function blow(g) {
      var d = g.data, p = d.p;
      if (p.blow > 0 || d.bubbles.length >= 10) return;
      p.blow = .28;
      d.bubbles.push({ x: p.x + p.face * 18, y: p.y + 10, vx: p.face * 300, vy: 0, t: 0, phase: 'shoot', critter: null, kick: 0, wob: Math.random() * 7, popped: false });
      Milo.sound.tone({ f: 600, f2: 1100, d: .08, v: .05, type: 'sine' });
    }

    return Milo.arcade(host, {
      id: 'bubble-trap',
      w: W, h: H, bg: '#0e1a2b',
      stats: ['Arena', 'Score', 'Lives', 'Best'],
      touch: 'dpad',
      touchButtons: [{ key: 'b', label: 'BUBBLE' }, { key: 'action', label: 'JUMP' }],
      emo: '🫧',
      start: {
        title: 'Bubble Trap',
        text: 'Blow a bubble at a critter to trap it, then kick bubbles into each other to ' +
          'pop them — every extra bubble in the chain multiplies the points. A bubble left ' +
          'alone too long bursts and its critter comes out angry. Clear every critter to ' +
          'move on.',
        keys: ['← → move', 'Space / ↑ jump', 'Z / X / ↓ blow a bubble', 'Touch a bubble to kick it']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, p = d.p, inp = g.input, i, j;
        d.shake = Math.max(0, d.shake - dt * 30);
        if (d.bannerT > 0) d.bannerT -= dt;
        for (i = d.parts.length - 1; i >= 0; i--) {
          var pt = d.parts[i];
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 300 * dt; pt.life -= dt;
          if (pt.life <= 0) d.parts.splice(i, 1);
        }
        for (i = d.texts.length - 1; i >= 0; i--) { d.texts[i].y -= 36 * dt; d.texts[i].life -= dt; if (d.texts[i].life <= 0) d.texts.splice(i, 1); }
        if (d.over) return;
        var frozen = d.bannerT > 1.2;

        // --- player ---------------------------------------------------------------------------
        if (p.dead) {
          p.dead -= dt;
          if (p.dead <= 0) {
            if (d.lives <= 0) {
              d.over = true;
              g.gameOver({ emo: '🫧', title: d.why, text: 'Cleared ' + d.arena + ' arena' + (d.arena === 1 ? '' : 's') + '; best chain x' + d.bestChain + '.', score: g.score });
              return;
            }
            spawn(d);
          }
        } else {
          p.safe = Math.max(0, p.safe - dt);
          p.blow = Math.max(0, p.blow - dt);
          var move = frozen ? 0 : (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
          var jumpPressed = !frozen && (inp.pressed('action') || inp.pressed('up'));
          var jumpHeld = inp.down('action') || inp.down('up');
          var blowPressed = !frozen && (inp.pressed('b') || inp.pressed('a') || inp.pressed('down'));
          if (move) p.face = move;
          var accel = p.ground ? 2600 : 1500;
          if (move) p.vx += (move * RUN - p.vx) * Math.min(1, accel / RUN * dt);
          else p.vx *= Math.pow(p.ground ? .0005 : .05, dt);
          if (Math.abs(p.vx) < 2) p.vx = 0;

          p.coyote = p.ground ? COYOTE : p.coyote - dt;
          p.buffer = jumpPressed ? BUFFER : p.buffer - dt;
          if (p.buffer > 0 && p.coyote > 0) {
            p.vy = JUMP_V; p.coyote = 0; p.buffer = 0; p.ground = false; p.squash = .72;
            burst(d, p.x, p.y + p.h, '#3d6b8a', 5, 70);
            Milo.sound.tone({ f: 320, f2: 720, d: .1, v: .05, type: 'square' });
          }
          if (blowPressed) blow(g);
          var grav = p.vy < 0 ? (jumpHeld ? G_RISE : G_CUT) : G_FALL;
          if (Math.abs(p.vy) < 70 && !p.ground) grav *= .55;
          p.vy = Math.min(p.vy + grav * dt, MAXFALL);
          var wasGround = p.ground, fallV = p.vy;
          var hit = sweep(d, p, p.vx * dt, p.vy * dt);
          if (hit.x) p.vx = 0;
          if (hit.y) {
            if (p.vy > 0) { p.ground = true; if (!wasGround) { p.squash = fallV > 500 ? 1.4 : 1.18; burst(d, p.x, p.y + p.h, '#3d6b8a', 3, 60); } }
            p.vy = 0;
          } else p.ground = hitsRect(d, p.x - p.w / 2, p.y + 1, p.w, p.h) && p.vy >= 0;
          p.squash += (1 - p.squash) * Math.min(1, dt * 12);
        }
        var cx = p.x, cy = p.y + p.h / 2;

        // --- critters --------------------------------------------------------------------------
        for (i = d.critters.length - 1; i >= 0; i--) {
          var cr = d.critters[i];
          if (cr.trapped) { d.critters.splice(i, 1); continue; }
          cr.wob += dt;
          if (frozen) continue;
          if (cr.kind === 'hopper' && cr.ground) {
            cr.hopT -= dt;
            if (cr.hopT <= 0) { cr.vy = -430; cr.ground = false; cr.hopT = U.rand(1.6, 3); }
          }
          cr.vy = Math.min(cr.vy + 1900 * dt, MAXFALL);
          var ch = sweep(d, cr, cr.vx * dt, cr.vy * dt);
          if (ch.x) cr.vx = -cr.vx;
          if (ch.y) { if (cr.vy > 0) cr.ground = true; cr.vy = 0; }
          else cr.ground = hitsRect(d, cr.x - cr.w / 2, cr.y + 1, cr.w, cr.h) && cr.vy >= 0;
          if (!p.dead && Math.abs(cr.x - cx) < (cr.w + p.w) / 2 - 4 && Math.abs(cr.y + cr.h / 2 - cy) < (cr.h + p.h) / 2 - 4) {
            die(g, cr.angry ? 'An angry critter got you' : 'A critter got you');
          }
        }

        // --- bubbles ------------------------------------------------------------------------------
        for (i = 0; i < d.bubbles.length; i++) {
          var b = d.bubbles[i];
          b.t += dt; b.wob += dt;
          b.kick = Math.max(0, b.kick - dt);
          if (b.phase === 'shoot') {
            b.vx *= Math.pow(.02, dt);
            if (b.t > .5) { b.phase = 'float'; }
            // shot bubbles catch critters
            for (j = 0; j < d.critters.length; j++) {
              var c2 = d.critters[j];
              if (!c2.trapped && U.dist(b.x, b.y, c2.x, c2.y + c2.h / 2) < BR + 10) {
                c2.trapped = true; b.critter = c2; b.phase = 'float'; b.t = .6;
                burst(d, b.x, b.y, '#bff4ff', 8, 120);
                text(d, b.x, b.y - 22, 'trapped', '#bff4ff');
                Milo.sound.tone({ f: 800, f2: 500, d: .1, v: .06, type: 'triangle' });
                break;
              }
            }
          } else {
            var drag = b.kick > 0 ? .55 : .05;
            b.vx *= Math.pow(drag, dt); b.vy *= Math.pow(drag, dt);
            if (b.kick <= 0) { b.vy += (-38 - b.vy) * Math.min(1, dt * 2); b.vx += Math.sin(b.wob * 1.5) * 20 * dt; }
          }
          b.x += b.vx * dt; b.y += b.vy * dt;
          // arena walls: bubbles bounce, and a hard-kicked one bursts against them
          var hard = b.kick > 0 && Math.hypot(b.vx, b.vy) > 330;
          var wallHit = false;
          if (b.x < TS + BR) { b.x = TS + BR; b.vx = Math.abs(b.vx) * .6; wallHit = true; }
          if (b.x > W - TS - BR) { b.x = W - TS - BR; b.vx = -Math.abs(b.vx) * .6; wallHit = true; }
          if (b.y < TS + BR) { b.y = TS + BR; b.vy = Math.abs(b.vy) * .3; wallHit = true; }
          if (b.y > H - TS - BR) { b.y = H - TS - BR; b.vy = -Math.abs(b.vy) * .6; wallHit = true; }
          if (wallHit && hard) { pop(g, b, 1, true); continue; }
          if (b.t > BUBBLE_LIFE) { pop(g, b, 1, false); continue; }
          // kicked by the player
          if (!p.dead && b.kick <= 0 && b.phase === 'float' && U.dist(b.x, b.y, cx, cy) < BR + 15) {
            var kx = b.x - cx, ky = b.y - cy, kl = Math.hypot(kx, ky) || 1;
            b.vx = kx / kl * 460 + p.vx * .4; b.vy = ky / kl * 460 - 60;
            b.kick = 1.1; b.t = Math.min(b.t, BUBBLE_LIFE - 2);
            burst(d, b.x, b.y, '#ffffff', 5, 80);
            Milo.sound.tone({ f: 420, f2: 300, d: .07, v: .06, type: 'square' });
          }
        }
        // bubble on bubble: a kicked one pops whatever it hits
        for (i = 0; i < d.bubbles.length; i++) {
          var b1 = d.bubbles[i];
          if (b1.popped || b1.kick <= 0) continue;
          for (j = 0; j < d.bubbles.length; j++) {
            var b2 = d.bubbles[j];
            if (i === j || b2.popped) continue;
            if (U.dist(b1.x, b1.y, b2.x, b2.y) < BR * 2) { pop(g, b1, 1, true); break; }
          }
        }
        d.bubbles = d.bubbles.filter(function (bb) { return !bb.popped; });

        // --- fruit ------------------------------------------------------------------------------------
        for (i = d.fruit.length - 1; i >= 0; i--) {
          var f = d.fruit[i];
          f.life -= dt;
          f.vy = Math.min(f.vy + 900 * dt, 500);
          var ny = f.y + f.vy * dt;
          if (hitsRect(d, f.x - 8, ny - 8, 16, 16)) f.vy = 0; else f.y = ny;
          if (f.life <= 0) { d.fruit.splice(i, 1); continue; }
          if (!p.dead && U.dist(f.x, f.y, cx, cy) < 24) {
            d.fruit.splice(i, 1);
            g.score += 50; g.set('Score', U.fmt(g.score));
            text(d, f.x, f.y - 16, '+50', '#ffd257');
            burst(d, f.x, f.y, '#ffd257', 8, 120);
            Milo.sound.coin();
          }
        }

        // --- clear ----------------------------------------------------------------------------------
        var trappedLeft = d.bubbles.some(function (bb) { return !!bb.critter; });
        if (!frozen && !p.dead && d.critters.length === 0 && !trappedLeft) {
          d.clearT += dt;
          if (d.clearT > .8) {
            g.score += 200; g.set('Score', U.fmt(g.score));
            Milo.sound.win();
            d.arena++;
            if (d.arena % ARENAS.length === 0) d.loop++;
            loadArena(d);
            g.set('Arena', d.arena + 1);
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#12304a'); bg.addColorStop(1, '#0a1626');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        // caustic light ripples
        c.strokeStyle = 'rgba(120,200,255,.07)'; c.lineWidth = 2;
        for (var k = 0; k < 6; k++) {
          c.beginPath();
          for (var x = 0; x <= W; x += 20) c.lineTo(x, 60 + k * 80 + Math.sin(x * .02 + g.t * 1.2 + k) * 12);
          c.stroke();
        }

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        var seed = (d.arena % ARENAS.length) * 11 + 2;
        for (var y = 0; y < ROWS; y++) for (var xx = 0; xx < COLS; xx++) {
          if (d.map[y][xx] !== '#') continue;
          var px = xx * TS, py = y * TS;
          var edge = y === 0 || y === ROWS - 1 || xx === 0 || xx === COLS - 1;
          c.fillStyle = edge ? (U.hash2(xx, y, seed) < .5 ? '#1f4a6e' : '#245478') : '#2a7a6a';
          U.roundRect(c, px, py, TS, TS, edge ? 0 : 6); c.fill();
          if (!edge) {
            c.fillStyle = '#4fd1a8'; U.roundRect(c, px, py, TS, 7, 3); c.fill();
            c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(px + 3, py + TS - 5, TS - 6, 3);
          } else {
            c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(px + 2, py + 2, TS - 4, 4);
          }
        }

        d.fruit.forEach(function (f) {
          c.globalAlpha = f.life < 1.5 ? (Math.sin(g.t * 20) > 0 ? 1 : .3) : 1;
          c.fillStyle = ['#ff5c7a', '#ffb347', '#a3e635'][f.kind];
          c.beginPath(); c.arc(f.x, f.y, 8, 0, 7); c.fill();
          c.fillStyle = '#2a7a3a'; c.fillRect(f.x - 1, f.y - 12, 2, 6);
          c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(f.x - 3, f.y - 3, 2.5, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        d.critters.forEach(function (cr) { drawCritter(c, cr, g.t, false); });

        d.bubbles.forEach(function (b) {
          var wob = 1 + Math.sin(b.wob * 4) * .06;
          var age = b.t / BUBBLE_LIFE;
          c.save();
          c.translate(b.x, b.y);
          c.scale(wob, 1 / wob);
          if (b.critter) drawCritter(c, { x: 0, y: -b.critter.h / 2, w: b.critter.w, h: b.critter.h, kind: b.critter.kind, angry: b.critter.angry, wob: b.wob, vx: 1 }, g.t, true);
          c.fillStyle = 'rgba(160,220,255,' + (b.kick > 0 ? .35 : .18) + ')';
          c.beginPath(); c.arc(0, 0, BR, 0, 7); c.fill();
          c.strokeStyle = age > .75 ? (Math.sin(g.t * 24) > 0 ? '#ff9a9a' : '#bff4ff') : '#bff4ff';
          c.lineWidth = b.kick > 0 ? 2.5 : 1.5;
          c.beginPath(); c.arc(0, 0, BR, 0, 7); c.stroke();
          c.fillStyle = 'rgba(255,255,255,.7)';
          c.beginPath(); c.ellipse(-5, -6, 4, 2.5, -.6, 0, 7); c.fill();
          c.restore();
        });

        d.parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life / pt.max);
          c.fillStyle = pt.col;
          c.beginPath(); c.arc(pt.x, pt.y, pt.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        // the player: a round green bubble-dragon
        if (!p.dead) {
          c.save();
          c.translate(p.x, p.y + p.h);
          c.scale(p.face / p.squash, p.squash);
          if (p.safe > 0) c.globalAlpha = Math.sin(g.t * 30) > 0 ? 1 : .35;
          c.fillStyle = '#5ee0c0';
          U.roundRect(c, -p.w / 2, -p.h, p.w, p.h, 9); c.fill();
          c.fillStyle = '#3fb99a';
          c.fillRect(-p.w / 2 + 3, -6, 6, 6); c.fillRect(p.w / 2 - 9, -6, 6, 6);
          c.beginPath(); c.moveTo(-p.w / 2, -p.h + 6); c.lineTo(-p.w / 2 - 8, -p.h + 2); c.lineTo(-p.w / 2, -p.h + 12); c.fill();
          c.fillStyle = '#c8fff0';
          U.roundRect(c, -4, -p.h + 12, 12, 10, 4); c.fill();
          c.fillStyle = '#ffffff';
          c.beginPath(); c.arc(3, -p.h + 8, 4, 0, 7); c.fill();
          c.fillStyle = '#123';
          c.beginPath(); c.arc(4, -p.h + 8, 2, 0, 7); c.fill();
          if (p.blow > 0) {
            c.fillStyle = 'rgba(191,244,255,.8)';
            c.beginPath(); c.arc(p.w / 2 + 6, -p.h + 14, 4 + (0.28 - p.blow) * 30, 0, 7); c.fill();
          }
          c.restore();
          c.globalAlpha = 1;
        }

        d.texts.forEach(function (t) {
          c.globalAlpha = Math.max(0, t.life);
          c.fillStyle = t.col; c.font = '900 ' + (t.big ? 24 : 15) + 'px Outfit, sans-serif'; c.textAlign = 'center';
          c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 3;
          c.strokeText(t.s, t.x, t.y); c.fillText(t.s, t.x, t.y);
        });
        c.globalAlpha = 1;
        c.restore();

        if (d.bannerT > 0) {
          c.globalAlpha = Math.min(1, d.bannerT * 2);
          c.fillStyle = 'rgba(8,20,36,.88)';
          U.roundRect(c, W / 2 - 170, H / 2 - 40, 340, 64, 12); c.fill();
          c.fillStyle = '#bff4ff';
          c.font = '800 22px Outfit, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('Arena ' + (d.arena + 1) + (d.loop ? ' · loop ' + (d.loop + 1) : '') + ' — ' + d.name, W / 2, H / 2 - 16);
          c.fillStyle = '#7fb4d0'; c.font = '600 13px Outfit, sans-serif';
          c.fillText(d.critters.length + ' critters to clear', W / 2, H / 2 + 8);
          c.globalAlpha = 1; c.textBaseline = 'alphabetic';
        }
        if (p.dead && d.lives > 0) {
          c.fillStyle = 'rgba(255,255,255,.85)';
          c.font = '700 18px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(d.why + ' — ' + d.lives + ' left', W / 2, H - 20);
        }
        var left = d.critters.length + d.bubbles.filter(function (bb) { return !!bb.critter; }).length;
        c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '700 12px Outfit, sans-serif'; c.textAlign = 'right';
        c.fillText(left + ' left', W - 14, H - 12);
      }
    });

    function drawCritter(c, cr, t, inBubble) {
      var x = cr.x, y = cr.y + cr.h / 2;
      c.save();
      c.translate(x, y);
      c.scale(cr.vx < 0 ? -1 : 1, 1);
      var col = cr.angry ? '#ff5c5c' : cr.kind === 'hopper' ? '#ffb347' : '#c084fc';
      if (inBubble) c.globalAlpha = .9;
      c.fillStyle = col;
      var sq = inBubble ? 1 : 1 + Math.sin(cr.wob * 10) * .05;
      c.beginPath(); c.ellipse(0, 0, cr.w / 2 * sq, cr.h / 2 / sq, 0, 0, 7); c.fill();
      if (cr.kind === 'hopper') {
        c.fillStyle = U.shade(col, -.3);
        c.fillRect(-8, cr.h / 2 - 6, 5, 6); c.fillRect(3, cr.h / 2 - 6, 5, 6);
      } else {
        c.fillStyle = U.shade(col, -.3);
        for (var l = -1; l <= 1; l++) c.fillRect(l * 6 - 2 + Math.sin(cr.wob * 12 + l) * 2, cr.h / 2 - 4, 4, 5);
      }
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(4, -4, 4, 0, 7); c.fill();
      c.fillStyle = '#1a1030';
      c.beginPath(); c.arc(5.5, -4, 2, 0, 7); c.fill();
      if (cr.angry) { c.strokeStyle = '#1a1030'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -9); c.lineTo(8, -6); c.stroke(); }
      c.restore();
    }
  }

  window.Milo.register({
    id: 'bubble-trap', title: 'Bubble Trap', emo: '🫧', category: 'Arcade',
    tagline: 'Trap critters in bubbles, chain-pop them',
    description: 'Blow a bubble and it shoots forward for half a second, trapping any critter ' +
      'it touches before it starts to float. Trapped critters are not gone yet: walk into a ' +
      'bubble to kick it, and a kicked bubble pops the first bubble it hits — and every ' +
      'bubble near that one — with the score multiplied by the length of the chain. A ' +
      'hard kick into the arena wall bursts a lone bubble. Leave one floating for more than ' +
      'seven seconds and its critter escapes angry and quick. Popped critters drop fruit ' +
      'worth 50. Eleven single-screen arenas with walkers and hoppers; clear one to advance.',
    controls: ['← →', 'Space / ↑ jump', 'Z / X / ↓ bubble'],
    colors: ['#12304a', '#5ee0c0'],
    tags: ['bubble bobble', 'arcade', 'levels', 'combo', 'platformer'],
    mount: mount
  });
})();
