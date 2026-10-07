/* Flip Bottle — stop the meter, send the bottle spinning, land it on its base. */
(function () {
  'use strict';
  var W = 520, H = 700;
  var G = 1500, BH = 62, BW = 24;
  var MX = 54, MW = W - 108, MY = H - 78, MH = 26;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.shelfNo = 1;
      d.streak = 0;
      d.parts = [];
      d.shake = 0;
      d.banner = null;
      d.caps = 0;
      d.shelf = { x: 70, y: 470, w: 150 };
      d.bottle = { x: 145, y: 470 - BH / 2, vx: 0, vy: 0, rot: 0, spin: 0 };
      d.camX = 0;
      d.phase = 'charge';
      d.bar = 0; d.barDir = 1;
      g.score = 0;
      g.set('Score', 0);
      g.set('Shelf', 1);
      g.set('Streak', 0);
      makeNext(d);
    }

    function flightTime(vy, dy) {
      // dy = launch y minus landing y (positive when landing lower is negative)
      var disc = vy * vy + 2 * G * (-dy);
      if (disc < 0) return 0;
      return (-vy + Math.sqrt(disc)) / G;
    }

    function shot(p) {
      return { vx: 150 + p * 380, vy: -(300 + p * 380) };
    }

    /** Build the next shelf around an ideal meter reading, so it is always landable. */
    function makeNext(d) {
      var n = d.shelfNo;
      d.turns = n < 6 ? 2 : n < 13 ? 3 : 4;
      var star = U.rand(0.32, 0.86);
      var s = shot(star);
      var y0 = d.shelf.y - BH / 2;
      var dyShelf = U.rand(-45, 45);
      var ny = U.clamp(d.shelf.y + dyShelf, 390, 545);
      var T = flightTime(s.vy, y0 - (ny - BH / 2));
      var cx = d.bottle.x + s.vx * T;
      var w = Math.max(40, 148 - (n - 1) * 5.5);
      d.next = { x: cx - w / 2, y: ny, w: w };
      d.star = star;
      d.spin = d.turns * Math.PI * 2 / T;

      // How far off the ideal reading can be before the throw fails?
      var tol = 0.5;
      for (var dp = 0.004; dp < 0.5; dp += 0.004) {
        var bad = false;
        for (var sgn = -1; sgn <= 1; sgn += 2) {
          var p = star + sgn * dp;
          if (p < 0 || p > 1) { bad = true; break; }
          var ss = shot(p);
          var tt = flightTime(ss.vy, y0 - (ny - BH / 2));
          var lx = d.bottle.x + ss.vx * tt;
          var e = Math.abs(wrap(d.spin * tt - d.turns * Math.PI * 2));
          if (e > 0.44 || lx < d.next.x + 9 || lx > d.next.x + w - 9) { bad = true; break; }
        }
        if (bad) { tol = dp; break; }
      }
      d.tol = Math.max(0.012, tol);
      d.gold = Math.max(0.006, d.tol * 0.2);
      d.barSpeed = 0.85 + Math.min(1.3, n * 0.07);
    }

    function wrap(a) {
      return ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    }

    function flip(g) {
      var d = g.data;
      if (d.phase !== 'charge') return;
      var p = d.bar, s = shot(p), b = d.bottle;
      b.vx = s.vx; b.vy = s.vy; b.spin = d.spin; b.rot = 0;
      d.launchP = p;
      d.phase = 'fly';
      d.flyT = 0;
      Milo.sound.tone({ f: 200, f2: 520, d: .12, v: .06, type: 'triangle' });
    }

    function droplets(d, x, y, n, col) {
      for (var i = 0; i < n; i++) {
        var a = -Math.random() * Math.PI;
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * U.rand(40, 200), vy: Math.sin(a) * U.rand(60, 240),
          life: .7, max: .7, col: col });
      }
    }

    function landed(g, e) {
      var d = g.data, b = d.bottle;
      var cap = Math.abs(d.launchP - d.star) <= d.gold;
      d.streak++;
      var mult = Math.min(10, d.streak);
      var gain = (cap ? 300 : 100) * mult;
      g.score += gain;
      g.set('Score', U.fmt(g.score));
      g.set('Streak', d.streak);
      if (cap) {
        d.caps++;
        b.rot = Math.PI;
        d.banner = { text: 'CAP LANDING ×3   +' + gain, t: 1.5, col: '#facc15' };
        Milo.sound.powerup();
        droplets(d, b.x, b.y, 22, '#facc15');
        d.shake = 9;
      } else {
        b.rot = U.clamp(e * 1.6, -0.5, 0.5);
        d.banner = { text: (Math.abs(e) < 0.16 ? 'CLEAN  ' : '') + '+' + gain, t: 1.1, col: '#4ade80' };
        Milo.sound.tone({ f: 300, f2: 180, d: .1, v: .07, type: 'square' });
        droplets(d, b.x, b.y + 22, 10, '#7dd3fc');
        d.shake = 5;
      }
      b.vx = 0; b.vy = 0; b.spin = 0;
      b.y = d.next.y - BH / 2;
      d.shelf = d.next;
      d.shelfNo++;
      g.set('Shelf', d.shelfNo);
      d.phase = 'settle';
      d.settleT = .5;
    }

    function fail(g, why) {
      var d = g.data;
      if (d.phase === 'dead') return;
      d.phase = 'dead';
      d.shake = 12;
      Milo.sound.explode();
      droplets(d, d.bottle.x, d.bottle.y, 18, '#7dd3fc');
      g.gameOver({
        emo: '🍾', title: why,
        text: 'Shelf ' + d.shelfNo + ', best streak ' + d.streak +
          ', ' + d.caps + ' cap landing' + (d.caps === 1 ? '' : 's') + '.'
      });
    }

    return Milo.arcade(host, {
      id: 'flip-bottle',
      w: W, h: H, bg: '#0c2029',
      stats: ['Score', 'Shelf', 'Streak'],
      touchButtons: [{ key: 'action', label: 'FLIP' }],
      emo: '🍾',
      start: {
        title: 'Flip Bottle',
        text: 'One tap stops the sweeping meter and throws the bottle. Land inside the green ' +
          'band and it comes down on its base; clip the gold sliver in the middle and it sticks ' +
          'the landing balanced on its cap for triple. Shelves get narrower and the meter gets ' +
          'faster, and from shelf six the bottle turns three times instead of two.',
        keys: ['Click / Space / Tap']
      },
      init: reset,
      onPointer: function (g, type) { if (type === 'down') flip(g); },
      onKey: function (g, e) { if (e.code === 'Space') flip(g); },

      update: function (g, dt) {
        var d = g.data, b = d.bottle;
        if (g.input.pressed('action')) flip(g);
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 30);
        if (d.banner) { d.banner.t -= dt; if (d.banner.t <= 0) d.banner = null; }
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.life -= dt;
          return p.life > 0;
        });

        var targetCam = Math.max(0, (d.phase === 'charge' ? b.x : b.x) - 165);
        d.camX = U.lerp(d.camX, targetCam, Math.min(1, 6 * dt));

        if (d.phase === 'charge') {
          d.bar += d.barDir * d.barSpeed * dt;
          if (d.bar >= 1) { d.bar = 1; d.barDir = -1; }
          if (d.bar <= 0) { d.bar = 0; d.barDir = 1; }
          b.rot = Math.sin(g.t * 2) * 0.03;
          return;
        }

        if (d.phase === 'settle') {
          d.settleT -= dt;
          b.rot *= Math.pow(0.02, dt);
          if (d.settleT <= 0) {
            d.phase = 'charge';
            d.bar = 0; d.barDir = 1;
            makeNext(d);
          }
          return;
        }

        if (d.phase !== 'fly') return;

        var top = d.next.y - BH / 2, steps = 5, sdt = dt / steps;
        for (var s = 0; s < steps; s++) {
          d.flyT += sdt;
          b.vy += G * sdt;
          b.x += b.vx * sdt;
          b.y += b.vy * sdt;
          b.rot += b.spin * sdt;
          if (b.vy > 0 && b.y >= top) {
            if (b.x > d.next.x + 6 && b.x < d.next.x + d.next.w - 6) {
              var e = wrap(b.spin * d.flyT - d.turns * Math.PI * 2);
              if (Math.abs(e) < 0.44) { b.y = top; landed(g, e); }
              else fail(g, 'It toppled');
              return;
            }
          }
          if (b.y > H + 120) { fail(g, 'Missed the shelf'); return; }
        }

        if (g.frame % 3 === 0) {
          d.parts.push({ x: b.x, y: b.y, vx: U.rand(-20, 20), vy: U.rand(-20, 20),
            life: .3, max: .3, col: 'rgba(160,220,255,.45)' });
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, b = d.bottle;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#14424f'); bg.addColorStop(.7, '#0c2029'); bg.addColorStop(1, '#071319');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // tiled wall
        c.strokeStyle = 'rgba(255,255,255,.045)'; c.lineWidth = 2;
        for (var ty = 60; ty < H - 120; ty += 56) {
          c.beginPath(); c.moveTo(0, ty); c.lineTo(W, ty); c.stroke();
        }
        for (var tx = -((d.camX * .4) % 56); tx < W; tx += 56) {
          c.beginPath(); c.moveTo(tx, 60); c.lineTo(tx, H - 120); c.stroke();
        }

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));
        c.translate(-d.camX, 0);

        function shelf(s, cur) {
          c.fillStyle = cur ? '#a3703f' : '#8a5c33';
          U.roundRect(c, s.x, s.y, s.w, 16, 4); c.fill();
          c.fillStyle = 'rgba(255,255,255,.18)';
          U.roundRect(c, s.x, s.y, s.w, 5, 3); c.fill();
          c.fillStyle = 'rgba(0,0,0,.35)';
          c.fillRect(s.x + 8, s.y + 16, 9, 26);
          c.fillRect(s.x + s.w - 17, s.y + 16, 9, 26);
        }
        shelf(d.shelf, true);
        if (d.next && d.phase !== 'settle') shelf(d.next, false);

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2, p.y - 2, 4, 4);
        });
        c.globalAlpha = 1;

        // the bottle
        c.save();
        c.translate(b.x, b.y);
        c.rotate(b.rot);
        c.beginPath();
        c.moveTo(-BW / 2, BH / 2);
        c.lineTo(-BW / 2, -BH / 2 + 22);
        c.quadraticCurveTo(-BW / 2, -BH / 2 + 8, -6, -BH / 2 + 6);
        c.lineTo(-6, -BH / 2);
        c.lineTo(6, -BH / 2);
        c.lineTo(6, -BH / 2 + 6);
        c.quadraticCurveTo(BW / 2, -BH / 2 + 8, BW / 2, -BH / 2 + 22);
        c.lineTo(BW / 2, BH / 2);
        c.closePath();
        c.save();
        c.clip();
        c.fillStyle = 'rgba(190,230,245,.20)';
        c.fillRect(-30, -50, 60, 100);
        // liquid stays level in world space
        c.rotate(-b.rot);
        var lvl = 8 + Math.sin(g.t * 7) * 2;
        c.fillStyle = '#38bdf8';
        c.fillRect(-40, lvl, 80, 80);
        c.fillStyle = 'rgba(255,255,255,.35)';
        c.fillRect(-40, lvl, 80, 2.5);
        c.restore();
        c.strokeStyle = 'rgba(220,245,255,.75)'; c.lineWidth = 2;
        c.stroke();
        c.fillStyle = '#e2e8f0';
        U.roundRect(c, -8, -BH / 2 - 7, 16, 9, 2); c.fill();
        c.fillStyle = 'rgba(255,255,255,.4)';
        c.fillRect(-BW / 2 + 3, -BH / 2 + 24, 3, BH - 34);
        c.restore();

        c.restore();

        // streak flames
        if (d.streak >= 3) {
          c.textAlign = 'center';
          c.font = '800 16px Outfit, system-ui, sans-serif';
          c.fillStyle = '#fb923c';
          c.fillText('🔥 ' + d.streak + ' IN A ROW  ×' + Math.min(10, d.streak), W / 2, 92);
        }

        // meter
        c.fillStyle = 'rgba(255,255,255,.10)';
        U.roundRect(c, MX, MY, MW, MH, 8); c.fill();
        var gx = MX + (d.star - d.tol) * MW, gw = d.tol * 2 * MW;
        c.fillStyle = 'rgba(74,222,128,.55)';
        U.roundRect(c, gx, MY + 2, Math.max(4, gw), MH - 4, 6); c.fill();
        c.fillStyle = '#facc15';
        c.fillRect(MX + (d.star - d.gold) * MW, MY + 2, Math.max(3, d.gold * 2 * MW), MH - 4);
        if (d.phase === 'charge') {
          c.fillStyle = '#ffffff';
          c.fillRect(MX + d.bar * MW - 2, MY - 6, 4, MH + 12);
        } else if (d.launchP != null) {
          c.fillStyle = 'rgba(255,255,255,.4)';
          c.fillRect(MX + d.launchP * MW - 2, MY - 6, 4, MH + 12);
        }
        c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 2;
        U.roundRect(c, MX, MY, MW, MH, 8); c.stroke();

        c.textAlign = 'center';
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.font = '700 12px Outfit, system-ui, sans-serif';
        c.fillText(d.phase === 'charge' ? 'TAP TO FLIP  —  ' + d.turns + ' TURNS' : d.turns + ' TURNS',
          W / 2, MY - 14);

        if (d.banner) {
          c.globalAlpha = Math.min(1, d.banner.t);
          c.fillStyle = d.banner.col;
          c.font = '800 28px Outfit, system-ui, sans-serif';
          c.fillText(d.banner.text, W / 2, 180);
          c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'flip-bottle', title: 'Flip Bottle', emo: '🍾', category: 'Casual',
    tagline: 'Stop the meter, stick the landing',
    description: 'A meter sweeps back and forth and one tap throws the bottle at whatever power ' +
      'it was showing. Land in the green band and the bottle comes down flat on its base; nick the ' +
      'gold sliver dead centre and it balances on its cap for triple points. Every shelf is ' +
      'narrower than the last, the meter sweeps quicker, and past shelf six the bottle has to ' +
      'complete three whole turns instead of two — miss and it rolls off into the dark.',
    controls: ['Click', 'Space', 'Tap'],
    colors: ['#0c2029', '#38bdf8'],
    tags: ['timing', 'one tap', 'streak', 'physics', 'hyper-casual'],
    mount: mount
  });
})();
