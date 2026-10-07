/* Spring Heights — run to build speed, jump higher for it, and learn which springs are lying. */
(function () {
  'use strict';
  var W = 480, H = 720, WALL = 30, FLOOR_H = 84;
  var PW = 22, PH = 30;
  var G_RISE = 1500, G_CUT = 3200, G_FALL = 2100, MAXFALL = 950;
  var COYOTE = .1, BUFFER = .12, MAXRUN = 340;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.p = { x: W / 2, y: H - 80 - PH, vx: 0, vy: 0, ground: null, coyote: 0, buffer: 0, face: 1, squash: 1, lastFloor: 0, jumpFloor: 0 };
      d.floors = [{ n: 0, x: WALL, y: H - 80, w: W - WALL * 2, spring: null, base: true }];
      d.nextN = 1;
      d.camY = 0;
      d.scroll = 0;         // camera climb speed once the run has begun
      d.started = false;
      d.floor = 0;
      d.combo = 0;
      d.bestCombo = 0;
      d.bonus = 0;
      d.parts = [];
      d.texts = [];
      d.trail = [];
      d.shake = 0;
      d.over = false;
      d.lean = 0;
      seed(d);
      g.set('Floor', 0);
      g.set('Score', 0);
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    /** Floors keep coming, narrowing with height; springs appear from floor 8. */
    function seed(d) {
      while (d.floors[d.floors.length - 1].y > d.camY - 300) {
        var n = d.nextN++;
        var diff = Math.min(1, n / 220);
        var w = Math.round(U.rand(150, 210) - diff * 110);
        var x = U.rand(WALL, W - WALL - w);
        var y = H - 80 - n * FLOOR_H;
        var spring = null;
        if (n >= 8 && n % 25 !== 0 && Math.random() < .3) {
          // Liars turn up from floor 20, and get more common the higher you go.
          var liar = n >= 20 && Math.random() < .3 + diff * .3;
          spring = { x: x + U.rand(14, w - 34), liar: liar, t: 0, spent: false };
        }
        d.floors.push({ n: n, x: x, y: y, w: n % 25 === 0 ? W - WALL * 2 : w, spring: spring, gone: false, fade: null });
        if (n % 25 === 0) d.floors[d.floors.length - 1].x = WALL;
      }
    }

    function burst(d, x, y, col, n, spd, up) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = U.rand(20, spd);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (up || 0), life: U.rand(.3, .6), max: .6, col: col, r: U.rand(2, 4) });
      }
    }
    function text(d, x, y, s, col, big) { d.texts.push({ x: x, y: y, s: s, col: col, life: 1.1, big: big }); }

    function die(g, why) {
      var d = g.data;
      if (d.over) return;
      d.over = true; d.shake = 8;
      burst(d, d.p.x, d.p.y + PH / 2, '#c7f5ff', 26, 240, 60);
      Milo.sound.explode();
      g.gameOver({ emo: '🗼', title: why, text: 'Floor ' + d.floor + ', best combo ' + d.bestCombo + ' floors in one jump.', score: g.score });
    }

    return Milo.arcade(host, {
      id: 'spring-heights',
      w: W, h: H, bg: '#0d1626',
      stats: ['Floor', 'Score', 'Best'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'JUMP' }],
      emo: '🗼',
      start: {
        title: 'Spring Heights',
        text: 'Run to build speed — the faster you are moving, the higher you jump, and walls ' +
          'bounce you back without losing any of it. Skip floors for combo points. Blue ' +
          'springs launch you; the ones with a dull, kinked coil are liars that collapse.',
        keys: ['← → run', 'Space / ↑ jump']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (type === 'up') { d.lean = 0; return; }
        if (type === 'down' && y < H * .45) { d.tapJump = true; return; }
        d.lean = x < W / 2 ? -1 : 1;
      },

      update: function (g, dt) {
        var d = g.data, p = d.p, inp = g.input, i;
        d.shake = Math.max(0, d.shake - dt * 30);
        for (i = d.parts.length - 1; i >= 0; i--) {
          var pt = d.parts[i];
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 500 * dt; pt.life -= dt;
          if (pt.life <= 0) d.parts.splice(i, 1);
        }
        for (i = d.texts.length - 1; i >= 0; i--) { d.texts[i].y -= 30 * dt; d.texts[i].life -= dt; if (d.texts[i].life <= 0) d.texts.splice(i, 1); }
        d.floors.forEach(function (f) {
          if (f.spring) f.spring.t = Math.max(0, f.spring.t - dt);
          if (f.fade != null) { f.fade -= dt; if (f.fade <= 0) f.gone = true; }
        });
        if (d.over) return;

        // --- running: speed builds while you hold, and the walls keep it ------------------
        var move = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
        if (!move && d.lean) move = d.lean;
        var jumpPressed = inp.pressed('action') || inp.pressed('up') || inp.pressed('a') || d.tapJump;
        var jumpHeld = inp.down('action') || inp.down('up') || inp.down('a') || inp.pdown;
        d.tapJump = false;
        if (move) p.face = move;
        if (move) {
          if (Math.sign(p.vx) === move || p.vx === 0) p.vx += move * (p.ground ? 620 : 420) * dt;
          else p.vx += move * (p.ground ? 1400 : 700) * dt;
          p.vx = U.clamp(p.vx, -MAXRUN, MAXRUN);
        } else p.vx *= Math.pow(p.ground ? .01 : .5, dt);
        if (Math.abs(p.vx) < 1) p.vx = 0;

        p.coyote = p.ground ? COYOTE : p.coyote - dt;
        p.buffer = jumpPressed ? BUFFER : p.buffer - dt;
        if (p.buffer > 0 && p.coyote > 0) {
          var speed = Math.abs(p.vx) / MAXRUN;
          p.vy = -(520 + speed * 380);
          p.jumpFloor = p.ground ? p.ground.n : p.lastFloor;
          p.coyote = 0; p.buffer = 0; p.ground = null; p.squash = .7;
          d.started = true;
          burst(d, p.x, p.y + PH, '#c7f5ff', 4 + Math.round(speed * 6), 60 + speed * 80, 30);
          Milo.sound.tone({ f: 300 + speed * 120, f2: 700 + speed * 400, d: .1, v: .06, type: 'square' });
        }
        var grav = p.vy < 0 ? (jumpHeld ? G_RISE : G_CUT) : G_FALL;
        if (Math.abs(p.vy) < 80 && !p.ground) grav *= .6;
        p.vy = Math.min(p.vy + grav * dt, MAXFALL);

        var prevBottom = p.y + PH;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x - PW / 2 < WALL) { p.x = WALL + PW / 2; if (p.vx < 0) { p.vx = -p.vx; wallHit(d, p, WALL); } }
        if (p.x + PW / 2 > W - WALL) { p.x = W - WALL - PW / 2; if (p.vx > 0) { p.vx = -p.vx; wallHit(d, p, W - WALL); } }

        var landed = null;
        if (p.vy >= 0) {
          for (i = 0; i < d.floors.length; i++) {
            var f = d.floors[i];
            if (f.gone) continue;
            if (p.x + PW / 2 - 4 < f.x || p.x - PW / 2 + 4 > f.x + f.w) continue;
            if (prevBottom <= f.y + .5 && p.y + PH >= f.y) { landed = f; break; }
          }
        }
        if (landed) {
          var sp = landed.spring;
          var onSpring = sp && !sp.spent && Math.abs(p.x - (sp.x + 10)) < 20;
          if (onSpring) {
            sp.t = .3;
            if (sp.liar) {
              // it sags, coughs, and the floor gives way under it
              sp.spent = true;
              landed.fade = .35;
              p.y = landed.y - PH; p.vy = 0; p.ground = landed;
              burst(d, sp.x + 10, landed.y, '#8a8a7a', 10, 120, 40);
              text(d, p.x, p.y - 12, 'liar!', '#ff7a7a');
              Milo.sound.tone({ f: 200, f2: 60, d: .3, v: .09, type: 'sawtooth' });
              d.shake = 4;
            } else {
              p.y = landed.y - PH;
              p.vy = -1150;
              p.ground = null; p.squash = .6;
              p.jumpFloor = landed.n;
              d.started = true;
              burst(d, sp.x + 10, landed.y, '#5ab1ff', 14, 200, 140);
              text(d, p.x, p.y - 12, 'SPROING', '#5ab1ff');
              Milo.sound.tone({ f: 220, f2: 1200, d: .25, v: .1, type: 'square' });
            }
          } else {
            if (!p.ground) {
              p.squash = p.vy > 700 ? 1.45 : 1.18;
              burst(d, p.x, landed.y, '#dfe9ff', 5, 60, 30);
              Milo.sound.tone({ f: 190, f2: 120, d: .06, v: .04, type: 'triangle' });
              var skipped = landed.n - p.jumpFloor;
              if (skipped >= 2) {
                var pts = skipped * skipped * 10;
                d.bonus += pts;
                d.combo = skipped;
                d.bestCombo = Math.max(d.bestCombo, skipped);
                text(d, p.x, p.y - 14, skipped + ' FLOORS  +' + pts, skipped >= 4 ? '#ffd257' : '#9fe88a', skipped >= 4);
                Milo.sound.tone({ f: 500 + skipped * 80, f2: 900 + skipped * 120, d: .15, v: .07, type: 'square' });
                if (skipped >= 4) d.shake = 3;
              }
            }
            p.y = landed.y - PH; p.vy = 0; p.ground = landed;
          }
          p.lastFloor = landed.n;
        } else if (p.ground) {
          var G = p.ground;
          if (G.gone || p.x + PW / 2 - 4 < G.x || p.x - PW / 2 + 4 > G.x + G.w || p.vy < 0) p.ground = null;
          else { p.y = G.y - PH; p.vy = 0; }
        }
        p.squash += (1 - p.squash) * Math.min(1, dt * 12);

        d.trail.unshift({ x: p.x, y: p.y + PH / 2, a: Math.min(1, Math.abs(p.vx) / MAXRUN) });
        if (d.trail.length > 8) d.trail.pop();

        // --- camera: follows you up, and once you start, climbs on its own ------------------
        var target = p.y - H * .5;
        if (target < d.camY) d.camY = target;
        if (d.started) {
          d.scroll = Math.min(150, 28 + d.floor * .55);
          d.camY -= d.scroll * dt;
        }
        if (p.lastFloor > d.floor) {
          d.floor = p.lastFloor;
          g.set('Floor', d.floor);
        }
        g.score = d.floor * 10 + d.bonus;
        g.set('Score', U.fmt(g.score));
        if (p.y - d.camY > H + 40) { die(g, 'Fell out of the tower'); return; }

        seed(d);
        d.floors = d.floors.filter(function (f) { return f.y < d.camY + H + 200; });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p, cam = d.camY;
        var deep = U.clamp(d.floor / 300, 0, 1);
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, 'hsl(' + (215 + deep * 60) + ',45%,' + (10 + deep * 6) + '%)');
        sky.addColorStop(1, 'hsl(' + (205 + deep * 40) + ',45%,' + (18 - deep * 4) + '%)');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));
        c.translate(0, -cam);

        // ice-brick tower walls
        var top = Math.floor(cam / 36) * 36 - 36;
        for (var wy = top; wy < cam + H + 36; wy += 36) {
          var row = Math.floor(wy / 36), off = row % 2 ? 0 : 15;
          for (var side = 0; side < 2; side++) {
            var bx = side ? W - WALL : 0;
            c.fillStyle = row % 3 === 0 ? '#2b4a72' : '#31527c';
            c.fillRect(bx, wy, WALL, 36);
            c.strokeStyle = 'rgba(200,230,255,.25)'; c.lineWidth = 1;
            c.strokeRect(bx + .5, wy + .5 + off / 3, WALL - 1, 35);
            c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(bx + 2, wy + 2, WALL - 4, 6);
          }
          if (row % 10 === 0) {
            c.fillStyle = 'rgba(200,230,255,.08)'; c.fillRect(WALL, wy, W - WALL * 2, 2);
          }
        }

        d.floors.forEach(function (f) {
          if (f.gone || f.y < cam - 40 || f.y > cam + H + 40) return;
          c.globalAlpha = f.fade != null ? Math.max(0, f.fade / .35) : 1;
          var milestone = f.n % 25 === 0 && f.n > 0;
          c.fillStyle = milestone ? '#6d4bd1' : f.base ? '#3a5a8a' : '#4f78b8';
          U.roundRect(c, f.x, f.y, f.w, f.base ? 100 : 16, 5); c.fill();
          c.fillStyle = milestone ? '#d7c7ff' : '#dff2ff';
          U.roundRect(c, f.x, f.y - 2, f.w, 7, 3); c.fill();
          c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(f.x + 4, f.y + 12, f.w - 8, 3);
          if (f.n > 0 && f.n % 5 === 0) {
            c.fillStyle = 'rgba(255,255,255,.55)';
            c.font = '700 11px Outfit, sans-serif'; c.textAlign = 'left';
            c.fillText(f.n, f.x + 6, f.y + 13);
          }
          if (f.spring) {
            var s = f.spring, sx = s.x, sy = f.y, comp = s.t > 0 ? 1 - s.t * 1.8 : 1;
            var coilH = 16 * comp;
            c.strokeStyle = s.liar ? '#8fa5b8' : '#5ab1ff';
            c.lineWidth = 3; c.lineCap = 'round';
            c.beginPath();
            for (var k = 0; k <= 4; k++) {
              var yy = sy - coilH + k * coilH / 4;
              // a liar's coil has a kink in the middle and one ring fewer
              var kink = s.liar && k === 2 ? 4 : 0;
              if (s.liar && k === 3) continue;
              c.moveTo(sx + 2 + kink, yy); c.lineTo(sx + 18 - kink, yy - 2);
            }
            c.stroke();
            c.fillStyle = s.liar ? '#6c7f92' : '#2f6fd0';
            U.roundRect(c, sx - 2, sy - coilH - 5, 24, 5, 2); c.fill();
            if (!s.liar) { c.fillStyle = '#c7f5ff'; c.fillRect(sx + 2, sy - coilH - 4, 8, 2); }
          }
          c.globalAlpha = 1;
        });

        // speed trail
        d.trail.forEach(function (t, i) {
          c.globalAlpha = t.a * (1 - i / 8) * .5;
          c.fillStyle = '#c7f5ff';
          c.beginPath(); c.arc(t.x, t.y, 8 - i, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        d.parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life / pt.max);
          c.fillStyle = pt.col;
          c.beginPath(); c.arc(pt.x, pt.y, pt.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        // the climber: a yeti-ish fellow in a scarf
        if (!d.over) {
          c.save();
          c.translate(p.x, p.y + PH);
          var tilt = U.clamp(p.vx / MAXRUN, -1, 1) * .18;
          c.rotate(tilt);
          c.scale(p.face / p.squash, p.squash);
          c.fillStyle = '#eaf4ff';
          U.roundRect(c, -PW / 2, -PH, PW, PH, 8); c.fill();
          c.fillStyle = '#c9dcf0';
          c.fillRect(-PW / 2 + 3, -8, 6, 8); c.fillRect(PW / 2 - 9, -8, 6, 8);
          c.fillStyle = '#ff6b6b';
          U.roundRect(c, -PW / 2, -PH + 14, PW, 6, 3); c.fill();
          c.fillRect(-PW / 2 - 6 - Math.abs(p.vx) * .02, -PH + 15, 8 + Math.abs(p.vx) * .02, 4);
          c.fillStyle = '#2b3a4a';
          c.fillRect(2, -PH + 7, 3, 3); c.fillRect(7, -PH + 7, 3, 3);
          c.restore();
        }

        d.texts.forEach(function (t) {
          c.globalAlpha = Math.max(0, t.life);
          c.fillStyle = t.col; c.font = '900 ' + (t.big ? 24 : 16) + 'px Outfit, sans-serif'; c.textAlign = 'center';
          c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 3;
          c.strokeText(t.s, t.x, t.y); c.fillText(t.s, t.x, t.y);
        });
        c.globalAlpha = 1;
        c.restore();

        if (!d.started && !d.over) {
          c.fillStyle = 'rgba(255,255,255,.75)';
          c.font = '700 15px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('Run first — speed is height', W / 2, H - 20);
        }
      }
    });

    function wallHit(d, p, x) {
      if (Math.abs(p.vx) < 120) return;
      burst(d, x, p.y + PH / 2, '#c7f5ff', 5, 90, 0);
      Milo.sound.tone({ f: 260, f2: 200, d: .05, v: .04, type: 'triangle' });
    }
  }

  window.Milo.register({
    id: 'spring-heights', title: 'Spring Heights', emo: '🗼', category: 'Arcade',
    tagline: 'Icy-tower climb with springs that sometimes lie',
    description: 'A vertical tower where your jump height comes from your run speed: hold a ' +
      'direction to build up to full pelt, and the walls bounce you back with the speed kept, ' +
      'so the top players zig-zag the whole way up. Floors narrow the higher you go and the ' +
      'camera never stops climbing. Clearing two or more floors in a single jump pays combo ' +
      'points that grow with the square of the floors skipped. Springs launch you way up — ' +
      'but from floor 20 some are liars, with a dull grey coil, a kink and one ring missing, ' +
      'and stepping on one collapses the floor under you.',
    controls: ['← →', 'Space / ↑ jump', 'Touch: sides to move, top to jump'],
    colors: ['#2b4a72', '#5ab1ff'],
    tags: ['platformer', 'endless', 'vertical', 'icy tower', 'combo'],
    mount: mount
  });
})();
