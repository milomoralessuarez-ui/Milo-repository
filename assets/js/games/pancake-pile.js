/* Pancake Pile — catch them off the griddle and keep the tower from leaning over. */
(function () {
  'use strict';
  var W = 520, H = 700;
  var BASEY = 606, PLATEW = 108, PH = 15, GRAV = 520;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.plate = { x: W / 2, v: 0 };
      d.stack = [];
      d.flying = [];
      d.parts = [];
      d.lean = 0; d.omega = 0;
      d.lives = 3;
      d.syrup = 0;
      d.spawnT = 1.1;
      d.side = Math.random() < .5 ? -1 : 1;
      d.perfects = 0;
      d.shake = 0;
      d.banner = null;
      d.toppleT = 0;
      d.dead = false;
      g.score = 0;
      g.set('Score', 0);
      g.set('Stack', 0);
      g.set('Lives', 3);
    }

    function stackH(d) { return d.stack.length * PH; }
    function viewScale(d) { return U.clamp(300 / Math.max(120, stackH(d) + 60), .34, 1); }
    function catchY(d) { return BASEY - 16 - stackH(d) * viewScale(d); }

    function spawn(d, golden) {
      var fromLeft = d.side < 0;
      d.side *= -1;
      var speed = U.rand(170, 240) + Math.min(120, d.stack.length * 4);
      d.flying.push({
        x: fromLeft ? -34 : W + 34,
        y: U.rand(150, 260),
        vx: fromLeft ? speed : -speed,
        vy: U.rand(-140, -40),
        r: U.rand(-.5, .5),
        spin: U.rand(-3, 3),
        gold: !!golden,
        shade: U.randInt(0, 2)
      });
      Milo.sound.tone({ f: 380, f2: 300, d: .06, v: .04, type: 'triangle' });
    }

    function splat(d, x, y, col) {
      for (var i = 0; i < 14; i++) {
        var a = -Math.random() * Math.PI;
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * U.rand(50, 230), vy: Math.sin(a) * U.rand(60, 240),
          life: .8, max: .8, col: col });
      }
    }

    function topple(g) {
      var d = g.data;
      if (d.dead) return;
      d.dead = true;
      d.shake = 15;
      Milo.sound.explode();
      splat(d, d.plate.x, catchY(d), '#c98a45');
      g.gameOver({
        emo: '🥞', title: 'The pile went over',
        text: d.stack.length + ' pancakes high with ' + d.perfects + ' dead-centre catches.'
      });
    }

    return Milo.arcade(host, {
      id: 'pancake-pile',
      w: W, h: H, bg: '#2b1a12',
      stats: ['Score', 'Stack', 'Lives'],
      touch: 'dpad',
      emo: '🥞',
      start: {
        title: 'Pancake Pile',
        text: 'Pancakes come off the griddle from alternating sides — slide the plate under each ' +
          'one. Catch them off-centre and the tower starts to lean, and the taller it gets the ' +
          'less it wants to come back. Steer the plate into the lean to save it. Golden syrup ' +
          'pancakes thicken the wobble for a while.',
        keys: ['← →  or  A D', 'Move the mouse', 'Drag on touch']
      },
      init: reset,
      onPointer: function (g, type, x) { g.data.aimX = x; },

      update: function (g, dt) {
        var d = g.data, i = g.input;
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 30);
        if (d.banner) { d.banner.t -= dt; if (d.banner.t <= 0) d.banner = null; }
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.life -= dt;
          return p.life > 0;
        });
        if (d.dead) return;

        // plate
        var px = d.plate.x;
        var key = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
        if (key) d.plate.x += key * 430 * dt;
        else if (d.aimX != null) d.plate.x = U.lerp(d.plate.x, d.aimX, Math.min(1, 14 * dt));
        d.plate.x = U.clamp(d.plate.x, PLATEW / 2 + 6, W - PLATEW / 2 - 6);
        d.plate.v = (d.plate.x - px) / Math.max(dt, .0001);

        // wobble: a spring that turns unstable as the tower grows
        var hf = Math.min(1.25, d.stack.length / 22);
        var syr = d.syrup > 0;
        d.omega += (-9.5 * d.lean + 12 * d.lean * hf) * dt;
        d.omega -= d.plate.v * 0.0055 * (0.5 + hf) * dt * 60;
        d.omega *= Math.pow(syr ? 0.03 : 0.45, dt);
        d.lean += d.omega * dt;
        if (d.syrup > 0) d.syrup -= dt;
        if (Math.abs(d.lean) > 0.6) { topple(g); return; }

        // spawning
        d.spawnT -= dt;
        if (d.spawnT <= 0) {
          var gap = Math.max(0.62, 1.45 - d.stack.length * 0.028);
          d.spawnT = gap;
          spawn(d, Math.random() < 0.11);
          if (d.stack.length > 14 && Math.random() < 0.18) spawn(d, false);
        }

        var cy = catchY(d), sc = viewScale(d);
        for (var k = d.flying.length - 1; k >= 0; k--) {
          var f = d.flying[k];
          f.vy += GRAV * dt;
          f.x += f.vx * dt;
          f.y += f.vy * dt;
          f.r += f.spin * dt;

          if (f.vy > 0 && f.y >= cy && f.y < cy + 46) {
            var off = (f.x - d.plate.x) / sc;
            if (Math.abs(off) < PLATEW / 2 + 16) {
              d.flying.splice(k, 1);
              catchOne(g, f, U.clamp(off, -PLATEW / 2, PLATEW / 2), hf);
              continue;
            }
          }
          if (f.y > BASEY + 70 || f.x < -90 || f.x > W + 90) {
            d.flying.splice(k, 1);
            d.lives--;
            g.set('Lives', Math.max(0, d.lives));
            d.shake = 8;
            Milo.sound.hit();
            splat(d, U.clamp(f.x, 20, W - 20), BASEY + 48, f.gold ? '#f0a83c' : '#b9793b');
            if (d.lives <= 0) {
              d.dead = true;
              g.gameOver({
                emo: '🥞', title: 'Three on the floor',
                text: d.stack.length + ' pancakes stacked before the last one hit the lino.'
              });
              return;
            }
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#4a2c1c'); bg.addColorStop(.62, '#2b1a12'); bg.addColorStop(1, '#1a0f0a');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // checked tablecloth
        for (var ty = BASEY + 22; ty < H; ty += 34) {
          for (var tx = 0; tx < W; tx += 34) {
            c.fillStyle = (((tx / 34) | 0) + ((ty / 34) | 0)) % 2 ? '#8d2d2d' : '#a83a3a';
            c.fillRect(tx, ty, 34, 34);
          }
        }
        c.fillStyle = 'rgba(0,0,0,.25)';
        c.fillRect(0, BASEY + 22, W, 8);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // griddles either side
        [26, W - 26].forEach(function (gx) {
          c.fillStyle = '#39424f';
          U.roundRect(c, gx - 22, 96, 44, 14, 5); c.fill();
          c.fillStyle = 'rgba(255,255,255,.12)';
          U.roundRect(c, gx - 22, 96, 44, 4, 3); c.fill();
        });

        function pancake(x, y, r, w, gold, shade) {
          c.save();
          c.translate(x, y); c.rotate(r);
          var body = gold ? '#f7b733' : ['#d79a56', '#c9884a', '#e0a866'][shade % 3];
          c.fillStyle = 'rgba(0,0,0,.28)';
          c.beginPath(); c.ellipse(0, 4, w / 2, PH * .62, 0, 0, 7); c.fill();
          c.fillStyle = body;
          c.beginPath(); c.ellipse(0, 0, w / 2, PH * .62, 0, 0, 7); c.fill();
          c.fillStyle = gold ? '#fde68a' : 'rgba(255,225,180,.45)';
          c.beginPath(); c.ellipse(-w * .12, -PH * .16, w * .28, PH * .22, 0, 0, 7); c.fill();
          c.strokeStyle = gold ? '#b45309' : 'rgba(120,70,30,.5)'; c.lineWidth = 1.5;
          c.beginPath(); c.ellipse(0, 0, w / 2, PH * .62, 0, 0, 7); c.stroke();
          c.restore();
        }

        // the stack, shrinking into the distance as it grows
        var sc = viewScale(d);
        c.save();
        c.translate(d.plate.x, BASEY);
        c.scale(sc, sc);

        // plate
        c.fillStyle = 'rgba(0,0,0,.4)';
        c.beginPath(); c.ellipse(0, 10, PLATEW / 2 + 14, 13, 0, 0, 7); c.fill();
        c.fillStyle = '#e8eef6';
        c.beginPath(); c.ellipse(0, 2, PLATEW / 2 + 12, 12, 0, 0, 7); c.fill();
        c.fillStyle = '#cbd5e1';
        c.beginPath(); c.ellipse(0, -2, PLATEW / 2, 9, 0, 0, 7); c.fill();

        var topple = d.dead ? d.lean * 1.6 : 0;
        for (var i = 0; i < d.stack.length; i++) {
          var s = d.stack[i];
          var hy = -8 - i * PH;
          var lx = s.off + (d.lean + topple) * (i + 1) * PH * 1.05;
          pancake(lx, hy, (d.lean + topple) * .5, PLATEW - 14, s.gold, s.shade);
        }

        // butter and syrup on top
        if (d.stack.length) {
          var tp = d.stack[d.stack.length - 1];
          var ty2 = -8 - (d.stack.length - 1) * PH;
          var tx2 = tp.off + d.lean * d.stack.length * PH * 1.05;
          c.save();
          c.translate(tx2, ty2 - 7);
          c.fillStyle = '#fde68a';
          U.roundRect(c, -11, -6, 22, 11, 3); c.fill();
          c.fillStyle = '#fef3c7';
          U.roundRect(c, -11, -6, 22, 4, 2); c.fill();
          c.restore();
          if (d.syrup > 0) {
            c.fillStyle = 'rgba(180,83,9,.75)';
            for (var q = 0; q < 4; q++) {
              var qx = tx2 - 26 + q * 17;
              c.beginPath();
              c.moveTo(qx, ty2 - 2);
              c.lineTo(qx + 6, ty2 - 2);
              c.lineTo(qx + 4, ty2 + 14 + Math.sin(g.t * 3 + q) * 5);
              c.lineTo(qx + 2, ty2 + 14 + Math.sin(g.t * 3 + q) * 5);
              c.closePath(); c.fill();
            }
          }
        }
        c.restore();

        // flying pancakes
        d.flying.forEach(function (f) { pancake(f.x, f.y, f.r, PLATEW - 14, f.gold, f.shade); });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 3, p.y - 3, 6, 6);
        });
        c.globalAlpha = 1;
        c.restore();

        // lean meter
        var mw = 210, mx = (W - mw) / 2, my = 72;
        c.fillStyle = 'rgba(255,255,255,.10)';
        U.roundRect(c, mx, my, mw, 12, 6); c.fill();
        c.fillStyle = 'rgba(74,222,128,.4)';
        U.roundRect(c, mx + mw / 2 - 26, my, 52, 12, 6); c.fill();
        var lp = U.clamp(d.lean / 0.6, -1, 1);
        c.fillStyle = Math.abs(lp) > .72 ? '#ef4444' : '#fde68a';
        c.fillRect(mx + mw / 2 + lp * (mw / 2 - 5) - 3, my - 5, 6, 22);
        c.textAlign = 'center';
        c.fillStyle = 'rgba(255,255,255,.45)';
        c.font = '700 11px Outfit, system-ui, sans-serif';
        c.fillText(d.syrup > 0 ? 'SYRUP — WOBBLE DAMPED ' + d.syrup.toFixed(1) + 's' : 'LEAN', W / 2, my - 10);

        if (d.banner) {
          c.globalAlpha = Math.min(1, d.banner.t);
          c.fillStyle = d.banner.col;
          c.font = '800 24px Outfit, system-ui, sans-serif';
          c.fillText(d.banner.text, W / 2, 150);
          c.globalAlpha = 1;
        }
      }
    });

    function catchOne(g, f, off, hf) {
      var d = g.data;
      d.stack.push({ off: off, gold: f.gold, shade: f.shade });
      g.set('Stack', d.stack.length);
      var perfect = Math.abs(off) < 8;
      var gain = 10 + d.stack.length;
      if (perfect) {
        gain += 25;
        d.perfects++;
        d.omega *= 0.5;
        d.banner = { text: 'DEAD CENTRE +' + gain, t: .9, col: '#4ade80' };
        Milo.sound.coin();
      } else {
        Milo.sound.tone({ f: 200 + Math.abs(off), f2: 140, d: .07, v: .055, type: 'square' });
      }
      if (f.gold) {
        d.syrup = 8;
        gain += 50;
        d.banner = { text: 'SYRUP! +' + gain, t: 1.2, col: '#f7b733' };
        Milo.sound.powerup();
      }
      d.omega += off * 0.022 * (0.4 + hf);
      g.score += gain;
      g.set('Score', U.fmt(g.score));
      for (var i = 0; i < 6; i++) {
        d.parts.push({ x: f.x, y: f.y, vx: U.rand(-80, 80), vy: U.rand(-140, -20),
          life: .45, max: .45, col: f.gold ? '#fde68a' : 'rgba(255,230,190,.8)' });
      }
    }
  }

  window.Milo.register({
    id: 'pancake-pile', title: 'Pancake Pile', emo: '🥞', category: 'Casual',
    tagline: 'Catch them, stack them, keep them upright',
    description: 'Pancakes fly in from alternating griddles and the plate has to be under each ' +
      'one. Every off-centre catch tips the tower a little further, and past about twenty high ' +
      'the lean stops correcting itself — you have to steer the plate into the lean to hold it, ' +
      'exactly like balancing a broom. A dead-centre catch damps the wobble and pays a bonus, a ' +
      'golden syrup pancake soaks the whole stack and calms it for eight seconds, and three on ' +
      'the floor ends breakfast.',
    controls: ['← →', 'Mouse', 'Drag'],
    colors: ['#2b1a12', '#f7b733'],
    tags: ['catching', 'balance', 'stacking', 'reflex', 'food'],
    mount: mount
  });
})();
