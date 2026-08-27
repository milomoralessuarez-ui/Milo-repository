/* Table Tennis — behind the paddle, first to 11, the robot studies your game. */
(function () {
  'use strict';
  var W = 800, H = 560, TAU = Math.PI * 2;
  var NETH = .18, GRAV = 4.6;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function halfW(z) { return U.lerp(310, 150, z); }
    function PX(x, z) { return W / 2 + x * halfW(z); }
    function PY(y, z) { return U.lerp(452, 262, z) - y * U.lerp(190, 95, z); }

    function reset(g) {
      var d = g.data;
      d.lvl = 1;
      d.you = 0; d.ai = 0;
      d.total = 0;               // rally points won across games
      d.gamesWon = 0;
      d.px = 0; d.pv = 0; d.prevPx = 0;
      d.py = .25;
      d.ax = 0;
      d.server = 'you';
      d.serveN = 0;
      d.ball = null;
      d.phase = 'serve-you';
      d.phaseT = 0;
      d.msg = 'Click to serve';
      d.swingT = 0;              // swing animation / cooldown
      d.trail = [];
      d.parts = [];
      g.set('You', 0);
      g.set('CPU', 0);
      g.set('Level', 1);
    }

    // Solve a return that leaves (x0,y0,z0) and lands on the table at
    // (xl, 0, zl) after T seconds; gravity does the shaping.
    function launch(d, x0, y0, z0, xl, zl, T, spin, by) {
      d.ball = {
        x: x0, y: y0, z: z0,
        vx: (xl - x0) / T,
        vy: (GRAV / 2 * T * T - y0) / T,
        vz: (zl - z0) / T,
        spin: spin || 0,
        by: by,
        bounced: false
      };
      d.trail = [];
    }

    function pointTo(g, who, msg) {
      var d = g.data;
      if (who === 'you') { d.you++; d.total++; Milo.sound.coin(); }
      else { d.ai++; Milo.sound.hit(); }
      g.set('You', d.you);
      g.set('CPU', d.ai);
      d.msg = msg;
      d.ball = null;
      d.phase = 'point';
      d.phaseT = 1.25;
      d.serveN++;
      if (d.serveN % 2 === 0) d.server = d.server === 'you' ? 'ai' : 'you';
    }

    function score(d) { return d.total * 100 + d.gamesWon * 500; }

    return Milo.arcade(host, {
      id: 'table-tennis',
      w: W, h: H, bg: '#171a2b',
      stats: ['You', 'CPU', 'Level'],
      emo: '🏓',
      start: {
        title: 'Table Tennis',
        text: 'First to 11 against the club robot. Move the paddle with the mouse and ' +
          'click to swing as the ball arrives — swing while sliding sideways to put ' +
          'curve on the return. Win a game and the robot comes back faster.',
        keys: ['Mouse to move', 'Click / Space to swing']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (type === 'down' && g.state === 'play') act(g);
        void d; void x; void y;
      },
      onKey: function (g, e) {
        if (e.code === 'Space' || e.code === 'Enter') act(g);
      },

      update: function (g, dt) {
        var d = g.data;

        // Paddle follows the pointer.
        var tx = U.clamp((g.input.px - W / 2) / 310, -1.15, 1.15);
        d.pv = d.pv * .7 + ((tx - d.px) / Math.max(dt, .001)) * .3;
        d.px = tx;
        d.py = U.clamp((452 - g.input.py) / 190, .05, .8);
        if (d.swingT > 0) d.swingT -= dt;

        if (d.phase === 'point') {
          d.phaseT -= dt;
          if (d.phaseT <= 0) {
            if (d.you >= 11 || d.ai >= 11) {
              if (d.you >= 11) {
                d.gamesWon++;
                d.lvl++;
                g.set('Level', d.lvl);
                d.you = 0; d.ai = 0;
                g.set('You', 0); g.set('CPU', 0);
                d.msg = 'Game won! The robot speeds up…';
                d.phase = 'game';
                d.phaseT = 2;
                Milo.sound.win();
              } else {
                g.gameOver({
                  emo: '🏓',
                  title: 'The robot takes it',
                  text: 'You reached level ' + d.lvl + ' and won ' + d.total + ' rallies.',
                  score: score(d)
                });
              }
              return;
            }
            d.phase = d.server === 'you' ? 'serve-you' : 'serve-ai';
            d.phaseT = 1;
            d.msg = d.server === 'you' ? 'Click to serve' : '';
          }
          return;
        }
        if (d.phase === 'game') {
          d.phaseT -= dt;
          if (d.phaseT <= 0) {
            d.server = 'you'; d.serveN = 0;
            d.phase = 'serve-you';
            d.msg = 'Click to serve';
          }
          return;
        }
        if (d.phase === 'serve-you') {
          return;              // waiting for the click (handled in act)
        }
        if (d.phase === 'serve-ai') {
          d.phaseT -= dt;
          if (d.phaseT <= 0) {
            launch(d, d.ax, .3, .97, U.rand(-.55, .55), U.rand(.18, .3),
              U.rand(.5, .62) - d.lvl * .01, U.rand(-.2, .2) * (d.lvl > 2 ? 1 : 0), 'ai');
            d.phase = 'rally';
            Milo.sound.blip();
          }
          return;
        }

        // ------- rally -------
        var b = d.ball;
        if (!b) return;
        b.vy -= GRAV * dt;
        b.vx += b.spin * 1.9 * dt;
        var prevZ = b.z;
        b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
        d.trail.push({ x: b.x, y: b.y, z: b.z, t: .3 });
        if (d.trail.length > 14) d.trail.shift();
        d.trail.forEach(function (p) { p.t -= dt; });

        // Net.
        if ((prevZ - .5) * (b.z - .5) < 0 && b.y < NETH) {
          pointTo(g, b.by === 'you' ? 'ai' : 'you', 'Into the net!');
          return;
        }

        // Bounce.
        if (b.y <= 0 && b.vy < 0) {
          var onTable = b.z > 0 && b.z < 1 && Math.abs(b.x) < 1.02;
          if (!onTable) {
            pointTo(g, b.by === 'you' ? 'ai' : 'you',
              Math.abs(b.x) >= 1.02 ? 'Wide!' : 'Off the end!');
            return;
          }
          b.y = 0; b.vy = -b.vy * .78; b.vz *= .97;
          b.bounced = true;
          Milo.sound.tone({ f: 520, f2: 380, d: .05, v: .06, type: 'triangle' });
          d.parts.push({ x: PX(b.x, b.z), y: PY(0, b.z), t: .3 });
        }

        // Long without bouncing on the far side.
        if (b.vz > 0 && b.z > 1.05 && !b.bounced) {
          pointTo(g, 'ai', 'Long!');
          return;
        }

        // AI moves toward the ball (or recenters).
        var want = b.vz > 0 ? b.x + b.vx * ((1 - b.z) / Math.max(.3, b.vz)) : 0;
        var spd = .8 + d.lvl * .25;
        d.ax += U.clamp(want - d.ax, -spd * dt, spd * dt);

        // AI contact.
        if (b.vz > 0 && b.z >= .94) {
          var reach = .3 - Math.min(.12, Math.abs(b.spin) * .28);
          var whiff = Math.random() < Math.max(.02, .15 - d.lvl * .018) + Math.min(.25, Math.abs(b.spin) * .5);
          if (Math.abs(b.x - d.ax) < reach && !whiff && b.bounced) {
            // Aim at your open side.
            var side = d.px > 0 ? -1 : 1;
            var err = U.rand(-1, 1) * Math.max(.12, .5 - d.lvl * .05);
            var landX = U.clamp(side * U.rand(.25, .8) + err, -.9, .9);
            var T = Math.max(.4, .62 - d.lvl * .028) + U.rand(-.03, .03);
            launch(d, b.x, Math.max(.08, b.y), b.z, landX, U.rand(.16, .3), T,
              d.lvl >= 3 ? U.rand(-.3, .3) : 0, 'ai');
            Milo.sound.blip();
          } else if (b.z >= 1.02) {
            pointTo(g, 'you', whiff || !b.bounced ? 'Winner!' : 'Clean winner!');
          }
          // else: keep flying until 1.02, then the point lands.
        }

        // Past you.
        if (b.vz < 0 && b.z < -.1) {
          pointTo(g, 'ai', 'It got past you!');
          return;
        }

        d.parts.forEach(function (p) { p.t -= dt; });
        d.parts = d.parts.filter(function (p) { return p.t > 0; });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;

        // Hall: dark walls, warm floor.
        var wall = c.createLinearGradient(0, 0, 0, H);
        wall.addColorStop(0, '#121527');
        wall.addColorStop(.55, '#1c2140');
        wall.addColorStop(1, '#141830');
        c.fillStyle = wall; c.fillRect(0, 0, W, H);
        c.fillStyle = '#3d2030';
        c.fillRect(0, 300, W, H - 300);
        // Banner + scoreboard on the wall.
        c.fillStyle = '#232a52';
        U.roundRect(c, W / 2 - 170, 60, 340, 76, 10); c.fill();
        c.fillStyle = '#8b93c6';
        c.font = '700 13px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillText('MILO OPEN — LEVEL ' + d.lvl, W / 2, 82);
        c.fillStyle = '#fff';
        c.font = '800 38px Outfit, sans-serif';
        c.fillText(d.you + ' – ' + d.ai, W / 2, 122);

        // Table.
        var nz = 0, fz = 1;
        c.fillStyle = '#1d4e9e';
        c.beginPath();
        c.moveTo(PX(-1, nz), PY(0, nz));
        c.lineTo(PX(1, nz), PY(0, nz));
        c.lineTo(PX(1, fz), PY(0, fz));
        c.lineTo(PX(-1, fz), PY(0, fz));
        c.closePath(); c.fill();
        var shine = c.createLinearGradient(0, PY(0, 1), 0, PY(0, 0));
        shine.addColorStop(0, 'rgba(255,255,255,.14)');
        shine.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = shine; c.fill();
        // Edge + centre lines.
        c.strokeStyle = '#f2f5ff'; c.lineWidth = 3;
        c.stroke();
        c.lineWidth = 2;
        c.beginPath(); c.moveTo(PX(0, nz), PY(0, nz)); c.lineTo(PX(0, fz), PY(0, fz)); c.stroke();
        // Table legs / skirt.
        c.fillStyle = '#0e2a56';
        c.beginPath();
        c.moveTo(PX(-1, nz), PY(0, nz));
        c.lineTo(PX(1, nz), PY(0, nz));
        c.lineTo(PX(1, nz) - 14, PY(0, nz) + 52);
        c.lineTo(PX(-1, nz) + 14, PY(0, nz) + 52);
        c.closePath(); c.fill();

        // Bounce blips.
        d.parts.forEach(function (p) {
          c.globalAlpha = p.t * 2.4;
          c.strokeStyle = '#ffd257'; c.lineWidth = 2;
          c.beginPath(); c.ellipse(p.x, p.y, (0.35 - p.t) * 60 + 6, ((0.35 - p.t) * 60 + 6) * .3, 0, 0, TAU); c.stroke();
          c.globalAlpha = 1;
        });

        // Robot opponent.
        var axp = PX(d.ax, 1), ayp = PY(.32, 1);
        c.fillStyle = '#2b3152';
        U.roundRect(c, axp - 24, ayp - 46, 48, 52, 12); c.fill();
        c.fillStyle = '#39406b';
        c.beginPath(); c.arc(axp, ayp - 56, 15, 0, TAU); c.fill();
        c.fillStyle = d.lvl > 3 ? '#fb7185' : '#22d3ee';
        c.fillRect(axp - 8, ayp - 60, 6, 4); c.fillRect(axp + 2, ayp - 60, 6, 4);
        c.fillStyle = '#c73e4a';
        c.beginPath(); c.arc(axp + 26, ayp - 30, 10, 0, TAU); c.fill();

        // Net (after far things, before near ball when ball is near).
        var nly = PY(0, .5), nty = PY(NETH, .5), nhw = halfW(.5) + 14;
        c.strokeStyle = 'rgba(230,236,255,.5)'; c.lineWidth = 1;
        for (var m = 1; m < 9; m++) {
          var yy = U.lerp(nty, nly, m / 9);
          c.beginPath(); c.moveTo(W / 2 - nhw, yy); c.lineTo(W / 2 + nhw, yy); c.stroke();
        }
        for (m = 0; m <= 22; m++) {
          var xx = U.lerp(W / 2 - nhw, W / 2 + nhw, m / 22);
          c.beginPath(); c.moveTo(xx, nty); c.lineTo(xx, nly); c.stroke();
        }
        c.strokeStyle = '#f2f5ff'; c.lineWidth = 4;
        c.beginPath(); c.moveTo(W / 2 - nhw, nty); c.lineTo(W / 2 + nhw, nty); c.stroke();

        // Ball trail + ball + shadow.
        var b = d.ball;
        if (b) {
          d.trail.forEach(function (p) {
            if (p.t <= 0) return;
            c.globalAlpha = p.t * 1.4;
            c.fillStyle = '#ffb703';
            var rr = U.lerp(10, 5, U.clamp(p.z, 0, 1)) * .5;
            c.beginPath(); c.arc(PX(p.x, p.z), PY(p.y, p.z), rr, 0, TAU); c.fill();
          });
          c.globalAlpha = 1;
          if (b.z > 0 && b.z < 1) {
            c.fillStyle = 'rgba(0,0,0,.35)';
            c.beginPath();
            c.ellipse(PX(b.x, b.z), PY(0, b.z), U.lerp(9, 4, b.z), U.lerp(4, 2, b.z), 0, 0, TAU);
            c.fill();
          }
          var r = U.lerp(11, 5.5, U.clamp(b.z, 0, 1));
          c.fillStyle = '#ffe8c2';
          c.beginPath(); c.arc(PX(b.x, b.z), PY(b.y, b.z), r, 0, TAU); c.fill();
          c.fillStyle = 'rgba(255,255,255,.8)';
          c.beginPath(); c.arc(PX(b.x, b.z) - r * .3, PY(b.y, b.z) - r * .3, r * .3, 0, TAU); c.fill();
        } else if (d.phase === 'serve-you') {
          // Ball waiting on your paddle.
          var sx2 = PX(d.px, .04), sy2 = PY(.2, .04);
          c.fillStyle = '#ffe8c2';
          c.beginPath(); c.arc(sx2, sy2 - 26, 10, 0, TAU); c.fill();
        }

        // Your paddle — rubber, blade, glow while swinging.
        var ppx = PX(d.px, .02), ppy = PY(d.py, .02);
        var sw = d.swingT > .18;
        c.save();
        c.translate(ppx, ppy);
        c.rotate(d.px * .3 + (sw ? -.5 : 0));
        c.fillStyle = '#c78d5a';
        U.roundRect(c, -8, 26, 16, 34, 7); c.fill();
        if (sw) { c.shadowColor = '#ff5d73'; c.shadowBlur = 22; }
        c.fillStyle = '#c73e4a';
        c.beginPath(); c.arc(0, 0, 30, 0, TAU); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = 'rgba(255,255,255,.16)';
        c.beginPath(); c.arc(-8, -8, 14, 0, TAU); c.fill();
        c.restore();

        // Message.
        if (d.msg) {
          c.fillStyle = '#eef1ff';
          c.font = '800 21px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.msg, W / 2, 508);
        }
        // Serve dots.
        c.textAlign = 'left';
        c.font = '700 12px Outfit, sans-serif';
        c.fillStyle = '#8b93c6';
        c.fillText(d.server === 'you' ? 'Your serve' : 'Robot serve', 20, H - 18);
      }
    });

    function act(g) {
      var d = g.data;
      if (d.phase === 'serve-you') {
        launch(d, d.px, .28, .04, U.clamp(-d.px * .4 + U.rand(-.45, .45), -.85, .85),
          U.rand(.62, .8), .58, U.clamp(d.pv * .1, -.4, .4), 'you');
        d.phase = 'rally';
        d.swingT = .3;
        Milo.sound.tone({ f: 340, f2: 260, d: .08, v: .08, type: 'triangle' });
        return;
      }
      if (d.phase !== 'rally' || !d.ball || d.swingT > 0) return;
      var b = d.ball;
      if (b.vz >= 0) return;
      d.swingT = .3;
      if (b.z > .3 || Math.abs(b.x - d.px) > .3) {
        // Fanned it.
        Milo.sound.tone({ f: 200, f2: 150, d: .08, v: .06, type: 'triangle' });
        return;
      }
      var perfect = b.z > .01 && b.z < .16;
      var T = perfect ? .44 : .6;
      var landZ = perfect ? U.rand(.8, .92) : U.rand(.68, .8);
      var landX = U.clamp(b.x + (b.x - d.px) * 2.4 + U.rand(-.08, .08), -.98, .98);
      var spin = U.clamp(d.pv * .16, -.55, .55);
      launch(d, b.x, Math.max(.05, b.y), Math.max(0, b.z), landX, landZ, T, spin, 'you');
      Milo.sound.tone({ f: perfect ? 620 : 420, f2: 300, d: .07, v: .09, type: 'square' });
      if (perfect) {
        for (var i = 0; i < 5; i++) {
          d.trail.push({ x: b.x + U.rand(-.05, .05), y: b.y + U.rand(0, .1), z: b.z, t: .25 });
        }
      }
    }
  }

  window.Milo.register({
    id: 'table-tennis', title: 'Table Tennis', emo: '🏓', category: 'Sports',
    tagline: 'Spin serves past the club robot',
    description: 'A behind-the-paddle rally game, first to 11 against a robot that gets ' +
      'faster and more accurate every game you take off it. Click as the ball arrives — ' +
      'inside the tight window the return is a fast drive, outside it a slow loop — and ' +
      'swing while sliding the mouse sideways to load sidespin that bends the ball away ' +
      'from the robot’s paddle. Contact low on a late ball and you’ll find the net.',
    controls: ['Mouse to move', 'Click / Space swing'],
    colors: ['#1d4e9e', '#c73e4a'],
    tags: ['ping pong', 'spin', 'vs cpu', 'timing', 'rally'],
    mount: mount
  });
})();
