/* Vine Swing — hold to grab the nearest vine, let go at the right moment, fly. */
(function () {
  'use strict';
  var W = 800, H = 520, GRAV = 1300, RIVER = 462;
  var PR = 14;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.p = { x: 90, y: 340 - PR, vx: 0, vy: 0, onLedge: true, ang: 0 };
      d.vine = null;           // {v, L, th, om}
      d.vines = [];
      d.bananas = [];
      d.parts = [];
      d.texts = [];
      d.cam = 0;
      d.dist = 0;
      d.bananaCount = 0;
      d.genX = 260;
      d.over = false;
      d.hold = false;
      d.shake = 0;
      d.flies = [];
      for (var i = 0; i < 18; i++) d.flies.push({ x: Math.random() * W, y: U.rand(200, 440), t: Math.random() * 7 });
      d.trees = [];
      for (i = 0; i < 40; i++) d.trees.push({ x: i * 130 + U.rand(-30, 30), w: U.rand(18, 40), layer: i % 3 });
      // the first vine hangs right beside the start ledge
      d.vines.push({ x: 250, y: 60, len: 230, sway: 0, snap: false, held: 0 });
      gen(d);
      g.set('Distance', '0m');
      g.set('Bananas', 0);
      g.set('Best', g.best ? U.fmt(g.best) + 'm' : '—');
    }

    /** Vines keep coming, spaced wider the further you have travelled. */
    function gen(d) {
      while (d.genX < d.cam + W + 500) {
        var diff = Math.min(1, d.dist / 1500);
        var gap = U.rand(210, 250) + diff * 110;
        var x = d.genX + gap;
        var len = U.rand(170, 250) + (Math.random() < .3 ? U.rand(-50, 40) : 0);
        var snap = d.dist > 600 && Math.random() < .12 + diff * .18;
        d.vines.push({ x: x, y: U.rand(40, 80), len: len, sway: Math.random() * 7, snap: snap, held: 0 });
        if (Math.random() < .7) d.bananas.push({ x: x + gap * .5, y: U.rand(120, 300), got: false });
        d.genX = x;
      }
    }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = U.rand(30, spd);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: U.rand(.3, .7), max: .7, col: col, r: U.rand(2, 4) });
      }
    }

    function grab(d) {
      var p = d.p, best = null, bestScore = 1e9;
      for (var i = 0; i < d.vines.length; i++) {
        var v = d.vines[i];
        if (v.broken) continue;
        var L = U.dist(p.x, p.y, v.x, v.y);
        if (L > v.len + 26 || L < 50) continue;
        // distance from the hanging rope: the rope hangs (roughly) straight down, so the
        // reach test is "am I near the rope's line, at or above its tip"
        var dx = Math.abs(p.x - (v.x + Math.sin(v.restAng || 0) * L));
        if (dx > 34) continue;
        if (dx < bestScore) { bestScore = dx; best = v; }
      }
      if (!best) return false;
      var Lr = Math.min(U.dist(p.x, p.y, best.x, best.y), best.len);
      var th = Math.atan2(p.x - best.x, p.y - best.y);
      var om = (p.vx * Math.cos(th) - p.vy * Math.sin(th)) / Lr;
      d.vine = { v: best, L: Lr, th: th, om: om };
      best.held = 0;
      p.onLedge = false;
      burst(d, p.x, p.y, '#9be36a', 8, 120);
      Milo.sound.tone({ f: 520, f2: 380, d: .07, v: .07, type: 'triangle' });
      return true;
    }

    function release(d) {
      var s = d.vine, p = d.p;
      if (!s) return;
      p.vx = s.L * s.om * Math.cos(s.th);
      p.vy = -s.L * s.om * Math.sin(s.th);
      d.vine = null;
      Milo.sound.tone({ f: 380, f2: 620, d: .1, v: .06, type: 'square' });
    }

    function die(g, why) {
      var d = g.data;
      if (d.over) return;
      d.over = true; d.shake = 8;
      burst(d, d.p.x, Math.min(d.p.y, RIVER), '#7fc8ff', 24, 220);
      Milo.sound.explode();
      g.gameOver({ emo: '🐒', title: why, text: 'You swung ' + U.fmt(d.dist) + ' metres through the jungle.', score: g.score });
    }

    return Milo.arcade(host, {
      id: 'vine-swing',
      w: W, h: H, bg: '#12301c',
      stats: ['Distance', 'Bananas', 'Best'],
      touchButtons: [{ key: 'action', label: 'GRAB' }],
      emo: '🐒',
      start: {
        title: 'Vine Swing',
        text: 'Hold to grab the nearest vine, let go to fly. The best release is on the way ' +
          'up, just before the top of the swing. Grab lower on a vine for a longer, slower arc. ' +
          'The gaps widen, and brown vines snap a second after you grab them.',
        keys: ['Hold Space / click / tap = grab', 'Release = let go', '← → pump the swing']
      },
      init: reset,
      onPointer: function (g, type) {
        if (type === 'down') g.data.hold = true;
        if (type === 'up') g.data.hold = false;
      },

      update: function (g, dt) {
        var d = g.data, p = d.p, inp = g.input, i;
        d.shake = Math.max(0, d.shake - dt * 30);
        for (i = d.parts.length - 1; i >= 0; i--) {
          var pt = d.parts[i];
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 500 * dt; pt.life -= dt;
          if (pt.life <= 0) d.parts.splice(i, 1);
        }
        for (i = d.texts.length - 1; i >= 0; i--) { d.texts[i].y -= 40 * dt; d.texts[i].life -= dt; if (d.texts[i].life <= 0) d.texts.splice(i, 1); }
        d.vines.forEach(function (v) { v.sway += dt; v.restAng = Math.sin(v.sway * 1.1) * (0.05 + Math.min(1, d.dist / 1500) * .08); });
        if (d.over) return;

        var holding = d.hold || inp.down('action') || inp.down('up') || inp.down('a');
        var pump = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);

        if (d.vine) {
          var s = d.vine;
          if (!holding) { release(d); }
          else {
            s.v.held += dt;
            if (s.v.snap && s.v.held > 1.1) {
              s.v.broken = true;
              burst(d, s.v.x + Math.sin(s.th) * s.L * .5, s.v.y + Math.cos(s.th) * s.L * .5, '#8a5a2b', 10, 120);
              Milo.sound.tone({ f: 200, f2: 80, d: .15, v: .09, type: 'sawtooth' });
              release(d);
            } else {
              s.om += (-(GRAV / s.L) * Math.sin(s.th) + pump * 1.2) * dt;
              s.om *= Math.pow(.86, dt);
              s.th += s.om * dt;
              p.x = s.v.x + Math.sin(s.th) * s.L;
              p.y = s.v.y + Math.cos(s.th) * s.L;
              p.vx = s.L * s.om * Math.cos(s.th);
              p.vy = -s.L * s.om * Math.sin(s.th);
            }
          }
        }
        if (!d.vine) {
          if (holding && !p.onLedge) grab(d);
          if (holding && p.onLedge && !d.wasHolding) {
            // hop off the start ledge toward the first vine
            p.onLedge = false; p.vx = 260; p.vy = -420;
            Milo.sound.jump();
          }
          if (!p.onLedge && !d.vine) {
            p.vy += GRAV * dt;
            p.vx *= Math.pow(.92, dt);
            p.x += p.vx * dt;
            p.y += p.vy * dt;
          }
          if (p.onLedge) { p.y = 340 - PR; }
          else if (p.x < 170 && p.y + PR >= 340 && p.vy > 0 && p.y - PR < 360) { p.onLedge = true; p.y = 340 - PR; p.vx = 0; p.vy = 0; }
        }
        d.wasHolding = holding;
        p.ang = U.clamp(p.vx * .0015, -.6, .6);

        if (p.y > RIVER - 6) { die(g, 'Into the river'); return; }

        for (i = 0; i < d.bananas.length; i++) {
          var b = d.bananas[i];
          if (b.got) continue;
          if (U.dist(p.x, p.y, b.x, b.y) < 28) {
            b.got = true; d.bananaCount++;
            burst(d, b.x, b.y, '#ffe36b', 10, 150);
            d.texts.push({ x: b.x, y: b.y - 10, s: '+10', col: '#ffe36b', life: 1 });
            g.set('Bananas', d.bananaCount);
            Milo.sound.coin();
          }
        }

        var target = p.x - 300;
        d.cam += (target - d.cam) * Math.min(1, dt * 5);
        if (d.cam < 0) d.cam = 0;
        var m = Math.floor(Math.max(0, p.x - 90) / 10);
        if (m > d.dist) { d.dist = m; g.set('Distance', U.fmt(m) + 'm'); }
        g.score = d.dist + d.bananaCount * 10;

        gen(d);
        d.vines = d.vines.filter(function (v) { return v.x > d.cam - 400; });
        d.bananas = d.bananas.filter(function (b) { return b.x > d.cam - 100; });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p, cam = d.cam;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#1d4a2a'); sky.addColorStop(.45, '#ff9a4a'); sky.addColorStop(.75, '#ffcf7a'); sky.addColorStop(1, '#0d2a3a');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        // sun
        c.fillStyle = 'rgba(255,240,180,.9)';
        c.beginPath(); c.arc(W * .7, 250, 46, 0, 7); c.fill();

        // trees in three parallax layers
        d.trees.forEach(function (t) {
          var par = [.25, .45, .7][t.layer];
          var x = ((t.x - cam * par) % 2600 + 2600) % 2600 - 300;
          if (x < -60 || x > W + 60) return;
          c.fillStyle = ['#183a25', '#1f4a2c', '#2a5a34'][t.layer];
          c.fillRect(x, 0, t.w * (0.6 + t.layer * .3), RIVER + 10);
          c.beginPath(); c.ellipse(x + t.w * .5, 40 + t.layer * 20, t.w * 2.2, 50, 0, 0, 7); c.fill();
        });

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));
        c.translate(-cam, 0);

        // canopy across the top
        c.fillStyle = '#123d22';
        c.beginPath(); c.moveTo(cam - 10, 0);
        for (var x = Math.floor(cam / 40) * 40 - 40; x < cam + W + 80; x += 40) {
          c.lineTo(x, 30 + U.hash2(x / 40, 1, 5) * 40);
          c.lineTo(x + 20, 48 + U.hash2(x / 40, 2, 5) * 40);
        }
        c.lineTo(cam + W + 80, 0); c.closePath(); c.fill();
        c.fillStyle = '#2c6b3a';
        for (x = Math.floor(cam / 60) * 60; x < cam + W + 60; x += 60) {
          c.beginPath(); c.ellipse(x + 20, 30 + U.hash2(x / 60, 3, 5) * 30, 34, 16, .3, 0, 7); c.fill();
        }

        // start ledge
        if (cam < 300) {
          c.fillStyle = '#4a5a3a';
          U.roundRect(c, -40, 340, 200, 60, 14); c.fill();
          c.fillStyle = '#6fbf4a';
          U.roundRect(c, -40, 334, 200, 14, 7); c.fill();
        }

        // vines
        d.vines.forEach(function (v) {
          if (v.x < cam - 300 || v.x > cam + W + 300) return;
          var held = d.vine && d.vine.v === v;
          var ang = held ? d.vine.th : v.restAng;
          var len = v.len;
          var ex = v.x + Math.sin(ang) * len, ey = v.y + Math.cos(ang) * len;
          if (v.broken) { len *= .35; ex = v.x + Math.sin(ang) * len; ey = v.y + Math.cos(ang) * len; }
          c.strokeStyle = v.snap ? '#8a5a2b' : '#4fa64a';
          c.lineWidth = v.snap ? 4 : 5; c.lineCap = 'round';
          c.beginPath(); c.moveTo(v.x, v.y);
          c.quadraticCurveTo(v.x + Math.sin(ang) * len * .5 + (held ? 0 : Math.sin(v.sway * 2) * 8), v.y + Math.cos(ang) * len * .5, ex, ey);
          c.stroke();
          c.fillStyle = v.snap ? '#a3743a' : '#6fd35a';
          for (var k = 1; k < 5; k++) {
            var lx = v.x + Math.sin(ang) * len * k / 5, ly = v.y + Math.cos(ang) * len * k / 5;
            c.beginPath(); c.ellipse(lx + (k % 2 ? 7 : -7), ly, 8, 4, k % 2 ? .6 : -.6, 0, 7); c.fill();
          }
          if (held && v.snap) {
            c.fillStyle = 'rgba(255,120,60,' + (.4 + Math.sin(g.t * 20) * .3) + ')';
            c.beginPath(); c.arc(v.x, v.y, 8, 0, 7); c.fill();
          }
        });

        d.bananas.forEach(function (b) {
          if (b.got) return;
          var y = b.y + Math.sin(g.t * 3 + b.x * .01) * 5;
          c.strokeStyle = '#ffe36b'; c.lineWidth = 7; c.lineCap = 'round';
          c.beginPath(); c.arc(b.x, y - 6, 12, .3, Math.PI - .3); c.stroke();
          c.strokeStyle = '#5a3a1e'; c.lineWidth = 3;
          c.beginPath(); c.moveTo(b.x - 11, y - 2); c.lineTo(b.x - 13, y - 5); c.stroke();
        });

        // river with ripples and the odd pair of crocodile eyes
        var rg = c.createLinearGradient(0, RIVER, 0, H);
        rg.addColorStop(0, '#1e5a7a'); rg.addColorStop(1, '#0a2436');
        c.fillStyle = rg; c.fillRect(cam - 10, RIVER, W + 20, H - RIVER);
        c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 2;
        for (x = Math.floor(cam / 50) * 50; x < cam + W + 50; x += 50) {
          c.beginPath(); c.moveTo(x, RIVER + 16 + Math.sin(g.t * 2 + x * .05) * 3); c.lineTo(x + 24, RIVER + 16 + Math.sin(g.t * 2 + x * .05) * 3); c.stroke();
        }
        for (x = Math.floor(cam / 300) * 300; x < cam + W + 300; x += 300) {
          var ex2 = x + U.hash2(x / 300, 9, 2) * 200, ey2 = RIVER + 6;
          c.fillStyle = '#3d6b2a';
          c.beginPath(); c.ellipse(ex2, ey2, 22, 6, 0, 0, 7); c.fill();
          c.fillStyle = '#ffe36b';
          c.beginPath(); c.arc(ex2 - 8, ey2 - 3, 2.5, 0, 7); c.arc(ex2 + 8, ey2 - 3, 2.5, 0, 7); c.fill();
        }

        // fireflies (screen-space drift, drawn in world by offsetting with cam)
        d.flies.forEach(function (f) {
          f.t += g.dt;
          var fx = cam + ((f.x + Math.sin(f.t) * 30) % W + W) % W, fy = f.y + Math.cos(f.t * 1.3) * 12;
          c.globalAlpha = .4 + Math.sin(f.t * 4) * .4;
          c.fillStyle = '#d6ff6b';
          c.beginPath(); c.arc(fx, fy, 2, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        d.parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life / pt.max);
          c.fillStyle = pt.col;
          c.beginPath(); c.arc(pt.x, pt.y, pt.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        // the monkey
        if (!d.over) {
          c.save();
          c.translate(p.x, p.y);
          c.rotate(d.vine ? -d.vine.th : p.ang);
          c.strokeStyle = '#c9762b'; c.lineWidth = 4; c.lineCap = 'round';
          c.beginPath(); c.moveTo(-6, 10); c.quadraticCurveTo(-24, 18 + Math.sin(g.t * 6) * 6, -20, 30); c.stroke();
          c.fillStyle = '#e08a3c';
          c.beginPath(); c.arc(0, 0, PR, 0, 7); c.fill();
          c.beginPath(); c.arc(-12, -6, 5, 0, 7); c.arc(12, -6, 5, 0, 7); c.fill();
          c.fillStyle = '#ffd9b0';
          c.beginPath(); c.ellipse(0, 3, 9, 7, 0, 0, 7); c.fill();
          c.fillStyle = '#222';
          c.fillRect(-5, -4, 2.5, 2.5); c.fillRect(2.5, -4, 2.5, 2.5);
          c.beginPath(); c.arc(0, 4, 3, .2, Math.PI - .2); c.stroke();
          if (d.vine) {
            c.strokeStyle = '#e08a3c'; c.lineWidth = 5;
            c.beginPath(); c.moveTo(0, -10); c.lineTo(0, -26); c.stroke();
          }
          c.restore();
        }

        d.texts.forEach(function (t) {
          c.globalAlpha = Math.max(0, t.life);
          c.fillStyle = t.col; c.font = '800 16px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(t.s, t.x, t.y);
        });
        c.globalAlpha = 1;
        c.restore();

        if (p.onLedge && !d.over) {
          c.fillStyle = 'rgba(255,255,255,.85)';
          c.font = '700 16px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('Hold to leap for the first vine', W / 2, H - 18);
        }
      }
    });
  }

  window.Milo.register({
    id: 'vine-swing', title: 'Vine Swing', emo: '🐒', category: 'Arcade',
    tagline: 'Grab, swing, let go at the top of the arc',
    description: 'One button: hold it and you grab the nearest vine, release it and you fly ' +
      'with whatever speed the swing gave you. Where you let go is everything — on the way up ' +
      'just before the top sends you far and high, at the very top drops you like a stone. ' +
      'Grabbing lower on a vine gives a longer, lazier arc. The gaps between vines widen with ' +
      'distance, brown vines snap about a second after you take hold, and the river below is ' +
      'full of crocodiles. Distance is the score, bananas add ten each.',
    controls: ['Hold Space / click / tap', '← → pump'],
    colors: ['#1d4a2a', '#ff9a4a'],
    tags: ['swinging', 'one button', 'endless', 'physics', 'jungle'],
    mount: mount
  });
})();
