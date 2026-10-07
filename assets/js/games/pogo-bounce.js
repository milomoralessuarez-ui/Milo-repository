/* Pogo Bounce — you never stop bouncing; steer the drift and chain the good landings. */
(function () {
  'use strict';
  var W = 800, H = 500, GROUND = 420;
  var PW = 22, PH = 46, BOUNCE = 570, GRAV = 1650;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.p = { x: 120, y: GROUND - PH, vx: 0, vy: -BOUNCE, squash: 1, face: 1, air: 0 };
      d.plats = [];
      d.stars = [];
      d.parts = [];
      d.texts = [];
      d.cam = 0;
      d.dist = 0;
      d.combo = 0;
      d.bonus = 0;
      d.starCount = 0;
      d.genX = 0;
      d.shake = 0;
      d.over = false;
      d.lean = 0;
      d.hills = [];
      for (var i = 0; i < 12; i++) d.hills.push({ x: i * 180, r: U.rand(90, 160), h: U.rand(.5, 1) });
      d.clouds = [];
      for (i = 0; i < 7; i++) d.clouds.push({ x: Math.random() * W * 2, y: U.rand(30, 180), s: U.rand(.6, 1.3) });
      addGround(d, 0, 520);
      d.genX = 520;
      gen(d);
      g.set('Distance', '0m');
      g.set('Combo', 'x0');
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    function addGround(d, x, w, y) {
      d.plats.push({ kind: 'ground', x: x, y: y || GROUND, w: w, h: H - (y || GROUND) + 40 });
    }
    function addStar(d, x, y) { d.stars.push({ x: x, y: y, got: false }); }

    /** Extends the course to the right with themed chunks that get meaner with distance. */
    function gen(d) {
      while (d.genX < d.cam + W + 700) {
        var diff = Math.min(1, d.genX / 9000);
        var roll = Math.random(), x = d.genX;
        if (roll < .22) {                                  // pit then ground
          var gap = U.rand(90, 140) + diff * 110;
          addGround(d, x + gap, U.rand(200, 320));
          addStar(d, x + gap / 2, GROUND - U.rand(90, 160));
          d.genX = x + gap + 260;
        } else if (roll < .42) {                           // crates on ground
          var gw = U.rand(260, 380);
          addGround(d, x, gw);
          var n = U.randInt(1, 3), cx = x + 60;
          for (var k = 0; k < n; k++) {
            var stack = Math.random() < .35 + diff * .3 ? 2 : 1;
            for (var s = 0; s < stack; s++) d.plats.push({ kind: 'crate', x: cx, y: GROUND - 40 * (s + 1), w: 40, h: 40 });
            addStar(d, cx + 20, GROUND - 40 * stack - 120);
            cx += U.rand(80, 120);
          }
          d.genX = x + gw;
        } else if (roll < .58) {                           // trampoline island
          var gap2 = U.rand(80, 120) + diff * 60;
          var iw = 150;
          addGround(d, x + gap2, iw);
          d.plats.push({ kind: 'tramp', x: x + gap2 + iw / 2 - 30, y: GROUND - 12, w: 60, h: 12, t: 0 });
          addStar(d, x + gap2 + iw / 2, GROUND - 260);
          addStar(d, x + gap2 + iw / 2 + 40, GROUND - 300);
          d.genX = x + gap2 + iw;
        } else if (roll < .76) {                           // glass bridge over a pit
          var panes = U.randInt(2, 4), px = x + 70;
          for (k = 0; k < panes; k++) {
            d.plats.push({ kind: 'glass', x: px, y: GROUND - U.rand(20, 80), w: 64, h: 8, cracked: false });
            px += U.rand(120, 150) + diff * 30;
          }
          addGround(d, px + 20, U.rand(200, 280));
          d.genX = px + 20 + 220;
        } else {                                           // spikes on ground
          var sw = U.rand(300, 400);
          addGround(d, x, sw);
          var spx = x + U.rand(90, 140);
          d.plats.push({ kind: 'spike', x: spx, y: GROUND - 18, w: 40 + diff * 24, h: 18 });
          if (Math.random() < .5) d.plats.push({ kind: 'spike', x: spx + 150, y: GROUND - 18, w: 40 + diff * 24, h: 18 });
          addStar(d, spx + 20, GROUND - 120);
          d.genX = x + sw;
        }
      }
    }

    function burst(d, x, y, col, n, spd, up) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = U.rand(30, spd);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (up || 0), life: U.rand(.3, .7), max: .7, col: col, r: U.rand(2, 4), sq: Math.random() < .5 });
      }
    }
    function text(d, x, y, str, col) { d.texts.push({ x: x, y: y, s: str, col: col, life: 1 }); }

    function die(g, why) {
      var d = g.data;
      if (d.over) return;
      d.over = true; d.shake = 9;
      burst(d, d.p.x, d.p.y + PH / 2, '#ff7b7b', 30, 280, 100);
      Milo.sound.explode();
      g.gameOver({ emo: '🦘', title: why, text: U.fmt(d.dist) + 'm travelled, best combo x' + d.bestCombo + '.', score: g.score });
    }

    return Milo.arcade(host, {
      id: 'pogo-bounce',
      w: W, h: H, bg: '#8fd3ff',
      stats: ['Score', 'Distance', 'Combo', 'Best'],
      touch: 'dpad',
      emo: '🦘',
      start: {
        title: 'Pogo Bounce',
        text: 'The pogo stick never stops bouncing — you only steer the drift. Crates bounce ' +
          'you higher, trampolines much higher, glass shatters after one bounce, spikes and ' +
          'pits end the run. Chain crates and trampolines without touching plain ground to ' +
          'build a combo.',
        keys: ['← → steer', 'Touch: left / right half']
      },
      init: reset,
      onPointer: function (g, type, x) {
        g.data.lean = type === 'up' ? 0 : (x < W / 2 ? -1 : 1);
      },

      update: function (g, dt) {
        var d = g.data, p = d.p, inp = g.input, i;
        d.shake = Math.max(0, d.shake - dt * 30);
        for (i = d.parts.length - 1; i >= 0; i--) {
          var pt = d.parts[i];
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 700 * dt; pt.life -= dt;
          if (pt.life <= 0) d.parts.splice(i, 1);
        }
        for (i = d.texts.length - 1; i >= 0; i--) { d.texts[i].y -= 40 * dt; d.texts[i].life -= dt; if (d.texts[i].life <= 0) d.texts.splice(i, 1); }
        d.plats.forEach(function (pl) { if (pl.kind === 'tramp' && pl.t > 0) pl.t -= dt; });
        if (d.over) return;

        var move = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
        if (!move && d.lean) move = d.lean;
        if (move) { p.face = move; p.vx += move * 1500 * dt; }
        else p.vx *= Math.pow(.15, dt);
        p.vx = U.clamp(p.vx, -330, 330);
        p.vy += GRAV * dt;
        p.air += dt;

        var prevBottom = p.y + PH;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x - PW / 2 < d.cam + 4) { p.x = d.cam + 4 + PW / 2; p.vx = Math.max(0, p.vx); }
        p.squash += (1 - p.squash) * Math.min(1, dt * 10);

        // landings (one-way from above) and side blocks
        for (i = 0; i < d.plats.length; i++) {
          var pl = d.plats[i];
          if (pl.gone) continue;
          var overlapX = p.x + PW / 2 - 5 > pl.x && p.x - PW / 2 + 5 < pl.x + pl.w;
          if (!overlapX) continue;
          if (p.vy >= 0 && prevBottom <= pl.y + 1 && p.y + PH >= pl.y) {
            if (pl.kind === 'spike') { die(g, 'Landed on the spikes'); return; }
            p.y = pl.y - PH;
            var factor = pl.kind === 'crate' ? 1.32 : pl.kind === 'tramp' ? 1.8 : 1;
            p.vy = -BOUNCE * factor;
            p.squash = 1.35;
            p.air = 0;
            if (pl.kind === 'ground') {
              if (d.combo > 1) text(d, p.x, p.y - 10, 'combo lost', '#ffb0b0');
              d.combo = 0;
              burst(d, p.x, pl.y, '#c9a97a', 6, 90, 30);
              Milo.sound.tone({ f: 260, f2: 420, d: .08, v: .06, type: 'square' });
            } else if (pl.kind === 'glass') {
              pl.gone = true;
              burst(d, p.x, pl.y, '#dff4ff', 16, 200, 60);
              Milo.sound.noise(.2, .12, 3000);
              Milo.sound.tone({ f: 1400, f2: 900, d: .12, v: .05, type: 'triangle' });
            } else {
              d.combo++;
              d.bestCombo = Math.max(d.bestCombo || 0, d.combo);
              var pts = 25 * d.combo;
              d.bonus += pts;
              text(d, p.x, p.y - 12, '+' + pts + (d.combo > 1 ? '  x' + d.combo : ''), pl.kind === 'tramp' ? '#2b7bff' : '#ffb347');
              if (pl.kind === 'tramp') {
                pl.t = .25;
                burst(d, p.x, pl.y, '#5ab1ff', 10, 160, 120);
                Milo.sound.tone({ f: 220, f2: 1100, d: .22, v: .09, type: 'square' });
              } else {
                burst(d, p.x, pl.y, '#e0b070', 8, 120, 60);
                Milo.sound.tone({ f: 380, f2: 700, d: .1, v: .07, type: 'square' });
              }
              d.shake = Math.min(6, 1 + d.combo);
            }
            g.set('Combo', 'x' + d.combo);
          } else if ((pl.kind === 'ground' || pl.kind === 'crate') &&
            p.y + PH > pl.y + 6 && p.y < pl.y + pl.h) {
            // ran into the side of it
            if (p.x < pl.x) { p.x = pl.x - PW / 2 + 5; if (p.vx > 0) p.vx = -60; }
            else if (p.x > pl.x + pl.w) { p.x = pl.x + pl.w + PW / 2 - 5; if (p.vx < 0) p.vx = 60; }
          }
        }

        for (i = 0; i < d.stars.length; i++) {
          var st = d.stars[i];
          if (st.got) continue;
          if (U.dist(p.x, p.y + PH / 2, st.x, st.y) < 30) {
            st.got = true; d.starCount++; d.bonus += 50;
            burst(d, st.x, st.y, '#ffe36b', 10, 150, 60);
            text(d, st.x, st.y - 10, '+50', '#ffe36b');
            Milo.sound.coin();
          }
        }

        if (p.y > H + 40) { die(g, 'Fell into the pit'); return; }

        var target = p.x - 280;
        if (target > d.cam) d.cam = target;
        var m = Math.floor(p.x / 10);
        if (m > d.dist) { d.dist = m; g.set('Distance', U.fmt(m) + 'm'); }
        g.score = d.dist + d.bonus;
        g.set('Score', U.fmt(g.score));

        gen(d);
        d.plats = d.plats.filter(function (pl) { return pl.x + pl.w > d.cam - 200; });
        d.stars = d.stars.filter(function (s) { return s.x > d.cam - 100; });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p, cam = d.cam;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#6fc3ff'); sky.addColorStop(.7, '#bfe6ff'); sky.addColorStop(1, '#ffe8b8');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        c.fillStyle = 'rgba(255,255,255,.85)';
        d.clouds.forEach(function (cl) {
          var x = ((cl.x - cam * .2) % (W + 300) + W + 300) % (W + 300) - 150;
          c.beginPath();
          c.ellipse(x, cl.y, 46 * cl.s, 18 * cl.s, 0, 0, 7);
          c.ellipse(x + 28 * cl.s, cl.y - 10 * cl.s, 30 * cl.s, 18 * cl.s, 0, 0, 7);
          c.ellipse(x - 26 * cl.s, cl.y - 6 * cl.s, 26 * cl.s, 14 * cl.s, 0, 0, 7);
          c.fill();
        });
        // rolling hills, two parallax layers
        [[.35, '#7ccf6a', 300], [.55, '#5bb54e', 350]].forEach(function (layer) {
          c.fillStyle = layer[1];
          c.beginPath(); c.moveTo(0, H);
          for (var x = -20; x <= W + 20; x += 10) {
            var wx = x + cam * layer[0];
            var y = layer[2] + Math.sin(wx * .008) * 40 + Math.sin(wx * .021 + 1) * 18;
            c.lineTo(x, y);
          }
          c.lineTo(W, H); c.closePath(); c.fill();
        });

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));
        c.translate(-cam, 0);

        d.plats.forEach(function (pl) {
          if (pl.gone || pl.x + pl.w < cam - 10 || pl.x > cam + W + 10) return;
          if (pl.kind === 'ground') {
            c.fillStyle = '#8a5a3b';
            c.fillRect(pl.x, pl.y, pl.w, pl.h);
            c.fillStyle = '#6b4530';
            for (var gx = pl.x + 10; gx < pl.x + pl.w - 10; gx += 34) c.fillRect(gx, pl.y + 30 + (gx % 3) * 8, 14, 5);
            c.fillStyle = '#4fbf3f';
            U.roundRect(c, pl.x - 3, pl.y - 6, pl.w + 6, 16, 6); c.fill();
            c.fillStyle = '#7ee06a';
            c.fillRect(pl.x + 2, pl.y - 4, pl.w - 4, 4);
          } else if (pl.kind === 'crate') {
            c.fillStyle = '#d9a35c';
            c.fillRect(pl.x, pl.y, pl.w, pl.h);
            c.strokeStyle = '#8a5a2b'; c.lineWidth = 3;
            c.strokeRect(pl.x + 1.5, pl.y + 1.5, pl.w - 3, pl.h - 3);
            c.beginPath(); c.moveTo(pl.x + 4, pl.y + 4); c.lineTo(pl.x + pl.w - 4, pl.y + pl.h - 4);
            c.moveTo(pl.x + pl.w - 4, pl.y + 4); c.lineTo(pl.x + 4, pl.y + pl.h - 4); c.stroke();
          } else if (pl.kind === 'glass') {
            c.fillStyle = 'rgba(200,240,255,.55)';
            U.roundRect(c, pl.x, pl.y, pl.w, pl.h, 3); c.fill();
            c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.5;
            c.beginPath(); c.moveTo(pl.x + 6, pl.y + 2.5); c.lineTo(pl.x + pl.w * .5, pl.y + 2.5); c.stroke();
          } else if (pl.kind === 'tramp') {
            var sq = pl.t > 0 ? 1 + pl.t * 2 : 1;
            c.fillStyle = '#222';
            c.fillRect(pl.x + 4, pl.y + 4, 5, 14); c.fillRect(pl.x + pl.w - 9, pl.y + 4, 5, 14);
            c.fillStyle = '#2b7bff';
            c.beginPath();
            c.moveTo(pl.x, pl.y); c.quadraticCurveTo(pl.x + pl.w / 2, pl.y + 10 * sq, pl.x + pl.w, pl.y);
            c.lineTo(pl.x + pl.w, pl.y + 6); c.lineTo(pl.x, pl.y + 6); c.closePath(); c.fill();
            c.fillStyle = '#ffffff';
            c.fillRect(pl.x + 8, pl.y + 1, pl.w - 16, 2);
          } else if (pl.kind === 'spike') {
            c.fillStyle = '#ff5c5c';
            c.fillRect(pl.x - 6, pl.y + pl.h - 3, pl.w + 12, 4);
            c.fillStyle = '#c8ccd8';
            c.beginPath();
            for (var sx = pl.x; sx < pl.x + pl.w - 1; sx += 10) {
              c.moveTo(sx, pl.y + pl.h); c.lineTo(sx + 5, pl.y); c.lineTo(sx + 10, pl.y + pl.h);
            }
            c.fill();
          }
        });

        d.stars.forEach(function (s) {
          if (s.got || s.x < cam - 20 || s.x > cam + W + 20) return;
          var y = s.y + Math.sin(g.t * 4 + s.x * .02) * 4;
          c.fillStyle = '#ffe36b';
          c.shadowColor = '#ffe36b'; c.shadowBlur = 10;
          c.beginPath();
          for (var k = 0; k < 10; k++) {
            var r = k % 2 ? 5 : 11, an = k * Math.PI / 5 - Math.PI / 2 + g.t;
            c.lineTo(s.x + Math.cos(an) * r, y + Math.sin(an) * r);
          }
          c.closePath(); c.fill();
          c.shadowBlur = 0;
        });

        d.parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life / pt.max);
          c.fillStyle = pt.col;
          if (pt.sq) c.fillRect(pt.x - pt.r, pt.y - pt.r, pt.r * 2, pt.r * 2);
          else { c.beginPath(); c.arc(pt.x, pt.y, pt.r, 0, 7); c.fill(); }
        });
        c.globalAlpha = 1;

        if (!d.over) {
          c.save();
          c.translate(p.x, p.y + PH);
          c.scale(p.face, 1);
          // pogo stick: compresses on the bounce
          var comp = (p.squash - 1) * 18;
          c.strokeStyle = '#444b5a'; c.lineWidth = 5; c.lineCap = 'round';
          c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -22 + comp); c.stroke();
          c.fillStyle = '#ff5c5c';
          U.roundRect(c, -9, -8, 18, 8, 3); c.fill();
          c.strokeStyle = '#444b5a'; c.lineWidth = 4;
          c.beginPath(); c.moveTo(-10, -30 + comp); c.lineTo(10, -30 + comp); c.stroke();
          c.translate(0, comp);
          c.fillStyle = '#4c9dff';
          U.roundRect(c, -10, -44, 20, 22, 6); c.fill();
          c.fillStyle = '#2f6fd0';
          c.fillRect(-9, -26, 18, 3);
          c.fillStyle = '#ffd9b8';
          c.beginPath(); c.arc(0, -50, 9, 0, 7); c.fill();
          c.fillStyle = '#5a3a1e';
          c.beginPath(); c.arc(0, -55, 9, Math.PI, 0); c.fill();
          c.fillStyle = '#222';
          c.fillRect(3, -52, 2, 2);
          c.fillStyle = '#ffd9b8';
          c.fillRect(-14, -36, 5, 10); c.fillRect(9, -36, 5, 10);
          c.restore();
        }

        d.texts.forEach(function (t) {
          c.globalAlpha = Math.max(0, t.life);
          c.fillStyle = t.col; c.font = '800 16px Outfit, sans-serif'; c.textAlign = 'center';
          c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 3;
          c.strokeText(t.s, t.x, t.y); c.fillText(t.s, t.x, t.y);
        });
        c.globalAlpha = 1;
        c.restore();

        if (d.combo >= 3 && !d.over) {
          c.fillStyle = '#2b7bff';
          c.font = '900 30px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('COMBO x' + d.combo, W / 2, 60);
        }
      }
    });
  }

  window.Milo.register({
    id: 'pogo-bounce', title: 'Pogo Bounce', emo: '🦘', category: 'Arcade',
    tagline: 'Always bouncing — steer the drift, chain the combo',
    description: 'You are on a pogo stick and it never stops: every landing bounces you straight ' +
      'back up, so all you control is where you drift in the air. Crates bounce you a third ' +
      'higher, trampolines nearly double, and every crate or trampoline landed in a row adds to ' +
      'a combo worth 25 points a step — touch plain ground and it resets. Glass panes hold for ' +
      'exactly one bounce, spikes and pits end the run, and the pits get wider the further you ' +
      'go. Score is distance plus combo and star bonuses.',
    controls: ['← →', 'Touch left / right'],
    colors: ['#6fc3ff', '#ffb347'],
    tags: ['bouncing', 'endless', 'combo', 'side-scroller', 'reflex'],
    mount: mount
  });
})();
