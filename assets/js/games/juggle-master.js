/* Juggle Master — keep them all in the air, and never touch the bomb. */
(function () {
  'use strict';

  var W = 780, H = 560, FLOOR = H - 44;
  var MAX_BALLS = 8;

  var TYPES = {
    normal: { r: 27, grav: 980, pop: -545, col: '#38bdf8', glow: '#0ea5e9', name: 'ball' },
    heavy: { r: 33, grav: 1520, pop: -690, col: '#f97362', glow: '#dc2626', name: 'heavy' },
    floaty: { r: 24, grav: 520, pop: -400, col: '#a3e635', glow: '#65a30d', name: 'floaty' },
    bomb: { r: 23, grav: 760, pop: 0, col: '#334155', glow: '#0f172a', name: 'bomb' }
  };
  var ORDER = ['normal', 'floaty', 'heavy', 'normal', 'heavy', 'floaty', 'heavy'];
  var SCALE = [392, 440, 494, 523, 587, 659, 698, 784, 880];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var S = Milo.sound;

    function realCount(d) {
      var n = 0;
      for (var i = 0; i < d.balls.length; i++) if (d.balls[i].kind !== 'bomb') n++;
      return n;
    }

    function syncBalls(g) { g.set('Balls', realCount(g.data)); }

    function newBall(kind, x, y) {
      var t = TYPES[kind];
      return {
        kind: kind, x: x, y: y, vx: U.rand(-60, 60), vy: 0,
        r: t.r, spin: U.rand(-3, 3), rot: 0, trail: [], fuse: 0, hits: 0
      };
    }

    function reset(g) {
      var d = g.data;
      d.balls = [newBall('normal', W / 2, 150)];
      d.pending = [];
      d.parts = [];
      d.pops = [];
      d.catches = 0;
      d.chain = 0;
      d.bestChain = 0;
      d.lives = 3;
      d.tier = 0;
      d.bombT = 9;
      d.banner = { t: 2, text: 'ONE BALL. EASY.' };
      d.flash = 0;
      d.shake = 0;
      d.hand = 0;
      g.score = 0;
      g.set('Score', 0);
      g.set('Balls', 1);
      g.set('Catches', 0);
      g.set('Lives', 3);
    }

    function burst(d, x, y, col, n, spread) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.2832;
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * U.rand(40, spread), vy: Math.sin(a) * U.rand(40, spread),
          life: U.rand(.22, .6), max: .6, col: col, r: U.rand(1.6, 4)
        });
      }
    }

    function popText(d, x, y, text, col) {
      d.pops.push({ x: x, y: y, text: text, col: col, t: .8 });
    }

    function addBall(g) {
      var d = g.data;
      if (realCount(d) + d.pending.length >= MAX_BALLS) return;
      var kind = ORDER[d.tier % ORDER.length];
      d.tier++;
      d.pending.push({ t: .6, kind: kind });
      d.banner = {
        t: 2.1,
        text: (realCount(d) + 1) + ' BALLS  ·  ' +
          (kind === 'heavy' ? 'this one is HEAVY' : kind === 'floaty' ? 'this one FLOATS' : 'another ball')
      };
      S.powerup();
      g.score += 250;
      g.set('Score', U.fmt(g.score));
    }

    function bat(g, ball, px) {
      var d = g.data;
      var t = TYPES[ball.kind];
      // catching it low is riskier and worth more
      var low = U.clamp((ball.y - H * .45) / (FLOOR - H * .45), 0, 1);
      ball.vy = t.pop * (.82 + low * .3);
      ball.vx += (ball.x - px) * 4.6 + U.rand(-20, 20);
      ball.vx = U.clamp(ball.vx, -330, 330);
      ball.spin = -ball.vx * .02;
      ball.hits++;

      d.catches++;
      d.chain++;
      if (d.chain > d.bestChain) d.bestChain = d.chain;
      var pts = 10 + realCount(d) * 6 + Math.round(low * 34) + Math.min(40, d.chain);
      g.score += pts;
      g.set('Score', U.fmt(g.score));
      g.set('Catches', d.catches);
      popText(d, ball.x, ball.y - ball.r - 6, '+' + pts + (low > .75 ? '  LOW!' : ''), low > .75 ? '#fde047' : '#e2e8f0');
      burst(d, ball.x, ball.y + ball.r * .6, t.col, low > .75 ? 12 : 7, 220);
      S.tone({ f: SCALE[Math.min(SCALE.length - 1, d.chain % 9)] * (ball.kind === 'heavy' ? .5 : 1), d: .1, v: .07, type: 'sine' });
      d.hand = .18;

      if (d.catches % 10 === 0) addBall(g);
    }

    function tapAt(g, x, y) {
      var d = g.data;
      if (g.state !== 'play') return;
      d.hand = .18;
      var target = null, bestD = 1e9;
      for (var i = 0; i < d.balls.length; i++) {
        var b = d.balls[i];
        var dist = U.dist(x, y, b.x, b.y);
        if (dist < b.r + 26 && dist < bestD) { bestD = dist; target = b; }
      }
      if (!target) {
        burst(d, x, y, 'rgba(148,163,184,.6)', 4, 90);
        S.tone({ f: 200, d: .04, v: .035, type: 'triangle' });
        d.chain = 0;
        return;
      }
      if (target.kind === 'bomb') {
        d.flash = .6;
        d.shake = .7;
        burst(d, target.x, target.y, '#f97316', 40, 460);
        S.explode();
        g.gameOver({
          emo: '💣', title: 'You touched the bomb',
          text: d.catches + ' catches with ' + realCount(d) + ' in the air · best chain ' +
            d.bestChain + '.'
        });
        return;
      }
      bat(g, target, x);
    }

    function dropBall(g, i) {
      var d = g.data;
      var b = d.balls[i];
      d.balls.splice(i, 1);
      d.lives--;
      d.chain = 0;
      d.flash = .35;
      d.shake = .4;
      g.set('Lives', Math.max(0, d.lives));
      syncBalls(g);
      burst(d, b.x, FLOOR, TYPES[b.kind].col, 18, 300);
      popText(d, b.x, FLOOR - 30, 'DROPPED', '#f87171');
      S.hit();
      if (d.lives <= 0) {
        g.gameOver({
          emo: '🤹', title: 'Everything on the floor',
          text: d.catches + ' catches · ' + (d.tier + 1) + ' ball' + (d.tier ? 's' : '') +
            ' at the peak · best chain ' + d.bestChain + '.'
        });
        return;
      }
      d.pending.push({ t: 1.1, kind: b.kind });
    }

    return Milo.arcade(host, {
      id: 'juggle-master',
      w: W, h: H, bg: '#0a1024',
      stats: ['Score', 'Balls', 'Catches', 'Lives'],
      emo: '🤹',
      start: {
        title: 'Juggle Master',
        text: 'Click or tap a ball to knock it back up — where you hit it decides which way ' +
          'it flies. Every ten catches adds another ball, and they are not all the same: ' +
          'heavy ones drop like stones, floaty ones drift. Bombs fall through on their own, ' +
          'so whatever you do, do not touch one.',
        keys: ['Click / tap the balls', 'Space bats the lowest']
      },
      init: reset,

      onPointer: function (g, type, x, y) { if (type === 'down') tapAt(g, x, y); },
      onKey: function (g, e) {
        if (e.code !== 'Space' && e.code !== 'Enter') return;
        var d = g.data, low = null;
        for (var i = 0; i < d.balls.length; i++) {
          var b = d.balls[i];
          if (b.kind === 'bomb') continue;
          if (!low || b.y > low.y) low = b;
        }
        if (low) tapAt(g, low.x, low.y);
      },

      update: function (g, dt) {
        var d = g.data;
        d.flash = Math.max(0, d.flash - dt * 2);
        d.shake = Math.max(0, d.shake - dt * 1.6);
        d.hand = Math.max(0, d.hand - dt);
        if (d.banner) { d.banner.t -= dt; if (d.banner.t <= 0) d.banner = null; }

        // balls waiting to enter
        for (var p = d.pending.length - 1; p >= 0; p--) {
          d.pending[p].t -= dt;
          if (d.pending[p].t <= 0) {
            var kind = d.pending[p].kind;
            d.balls.push(newBall(kind, U.rand(120, W - 120), -40));
            d.pending.splice(p, 1);
            syncBalls(g);
            S.blip();
          }
        }

        // bombs
        d.bombT -= dt;
        if (d.bombT <= 0 && realCount(d) >= 3) {
          d.balls.push(newBall('bomb', U.rand(90, W - 90), -40));
          d.bombT = Math.max(3.2, U.rand(6, 9.5) - realCount(d) * .35);
          S.tone({ f: 180, f2: 320, d: .3, v: .06, type: 'sawtooth' });
          popText(d, W / 2, 196, 'BOMB INCOMING', '#fb923c');
        }

        // physics
        for (var i = d.balls.length - 1; i >= 0; i--) {
          var b = d.balls[i], t = TYPES[b.kind];
          b.vy += t.grav * dt;
          if (b.kind === 'floaty') b.vx += Math.sin(g.t * 2.2 + b.x * .01) * 40 * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.rot += b.spin * dt;
          if (b.kind === 'bomb') b.fuse += dt;

          if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * .82; S.tone({ f: 300, d: .04, v: .03, type: 'triangle' }); }
          if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * .82; S.tone({ f: 300, d: .04, v: .03, type: 'triangle' }); }

          b.trail.push({ x: b.x, y: b.y });
          if (b.trail.length > 9) b.trail.shift();

          if (b.kind === 'bomb') {
            if (b.y + b.r > FLOOR) {
              d.balls.splice(i, 1);
              burst(d, b.x, FLOOR - 6, '#64748b', 12, 190);
              S.noise(.12, .05, 700);
              popText(d, b.x, FLOOR - 34, 'bomb fizzled', '#94a3b8');
            }
          } else if (b.y + b.r > FLOOR) {
            dropBall(g, i);
            if (g.state !== 'play') return;
          }
        }

        for (var k = d.parts.length - 1; k >= 0; k--) {
          var q = d.parts[k];
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 520 * dt; q.life -= dt;
          if (q.life <= 0) d.parts.splice(k, 1);
        }
        for (var m = d.pops.length - 1; m >= 0; m--) {
          d.pops[m].t -= dt;
          d.pops[m].y -= 34 * dt;
          if (d.pops[m].t <= 0) d.pops.splice(m, 1);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 10, U.rand(-1, 1) * d.shake * 10);

        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#182a5c'); bg.addColorStop(.6, '#0d1430'); bg.addColorStop(1, '#070a18');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // big-top stripes fanning from above the canvas
        c.save();
        c.globalAlpha = .05;
        var fx = W / 2, fy = -150, R = 1500;
        for (var s = 0; s < 14; s++) {
          if (s % 2) continue;
          var a0 = Math.PI * (0.1 + (s / 14) * 0.8);
          var a1 = Math.PI * (0.1 + ((s + 1) / 14) * 0.8);
          c.fillStyle = '#fde047';
          c.beginPath();
          c.moveTo(fx, fy);
          c.lineTo(fx + Math.cos(a0) * R, fy + Math.sin(a0) * R);
          c.lineTo(fx + Math.cos(a1) * R, fy + Math.sin(a1) * R);
          c.closePath(); c.fill();
        }
        c.restore();

        // floor
        var fg = c.createLinearGradient(0, FLOOR, 0, H);
        fg.addColorStop(0, '#7f1d3d'); fg.addColorStop(1, '#3b0d20');
        c.fillStyle = fg; c.fillRect(0, FLOOR, W, H - FLOOR);
        c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(0, FLOOR); c.lineTo(W, FLOOR); c.stroke();

        // landing shadows
        for (var i = 0; i < d.balls.length; i++) {
          var b = d.balls[i];
          var h = U.clamp(1 - (FLOOR - b.y) / FLOOR, 0, 1);
          c.globalAlpha = .12 + h * .3;
          c.fillStyle = b.kind === 'bomb' ? '#000' : TYPES[b.kind].col;
          c.beginPath();
          c.ellipse(b.x, FLOOR + 8, b.r * (.5 + h * .8), 7 * (.5 + h * .6), 0, 0, 6.2832);
          c.fill();
        }
        c.globalAlpha = 1;

        // trails
        for (var tI = 0; tI < d.balls.length; tI++) {
          var tb = d.balls[tI];
          for (var q2 = 0; q2 < tb.trail.length; q2++) {
            var pt = tb.trail[q2];
            c.globalAlpha = (q2 / tb.trail.length) * .22;
            c.fillStyle = TYPES[tb.kind].col;
            c.beginPath(); c.arc(pt.x, pt.y, tb.r * (.3 + q2 / tb.trail.length * .6), 0, 6.2832); c.fill();
          }
        }
        c.globalAlpha = 1;

        // balls
        for (var j = 0; j < d.balls.length; j++) {
          var ball = d.balls[j], ty = TYPES[ball.kind];
          c.save();
          c.translate(ball.x, ball.y);
          c.rotate(ball.rot);
          c.shadowColor = ty.glow; c.shadowBlur = 20;
          var sg = c.createRadialGradient(-ball.r * .35, -ball.r * .4, ball.r * .12, 0, 0, ball.r);
          sg.addColorStop(0, U.shade(ty.col, .45));
          sg.addColorStop(1, ty.col);
          c.fillStyle = sg;
          c.beginPath(); c.arc(0, 0, ball.r, 0, 6.2832); c.fill();
          c.shadowBlur = 0;

          if (ball.kind === 'heavy') {
            c.fillStyle = 'rgba(0,0,0,.4)';
            c.fillRect(-ball.r, -5, ball.r * 2, 10);
            c.fillStyle = '#fff';
            c.font = '800 15px Outfit, sans-serif';
            c.textAlign = 'center';
            c.fillText('kg', 0, 5);
          } else if (ball.kind === 'floaty') {
            c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2;
            c.setLineDash([5, 5]);
            c.beginPath(); c.arc(0, 0, ball.r - 6, 0, 6.2832); c.stroke();
            c.setLineDash([]);
          } else if (ball.kind === 'bomb') {
            c.strokeStyle = '#a16207'; c.lineWidth = 3;
            c.beginPath();
            c.moveTo(4, -ball.r + 2);
            c.quadraticCurveTo(16, -ball.r - 14, 4, -ball.r - 22);
            c.stroke();
            var sp = 3 + Math.sin(ball.fuse * 22) * 2;
            c.fillStyle = '#fde047';
            c.beginPath(); c.arc(4, -ball.r - 23, sp, 0, 6.2832); c.fill();
            c.fillStyle = '#fff';
            c.font = '800 14px Outfit, sans-serif';
            c.textAlign = 'center';
            c.fillText('✖', 0, 5);
          } else {
            c.fillStyle = 'rgba(255,255,255,.55)';
            c.beginPath(); c.arc(-ball.r * .3, -ball.r * .35, ball.r * .2, 0, 6.2832); c.fill();
          }
          c.restore();
        }

        // particles
        for (var pi = 0; pi < d.parts.length; pi++) {
          var pp = d.parts[pi];
          c.globalAlpha = Math.max(0, pp.life / pp.max);
          c.fillStyle = pp.col;
          c.beginPath(); c.arc(pp.x, pp.y, pp.r, 0, 6.2832); c.fill();
        }
        c.globalAlpha = 1;

        // hand ring at the pointer
        var hx = g.input.px, hy = g.input.py;
        if (hx > 0 && hx < W && hy > 0 && hy < H) {
          c.strokeStyle = 'rgba(255,255,255,' + (.18 + d.hand * 2.4).toFixed(3) + ')';
          c.lineWidth = 2;
          c.beginPath(); c.arc(hx, hy, 20 + d.hand * 40, 0, 6.2832); c.stroke();
        }

        // floating score pops
        c.textAlign = 'center';
        for (var po = 0; po < d.pops.length; po++) {
          var o = d.pops[po];
          c.globalAlpha = Math.min(1, o.t * 1.6);
          c.fillStyle = o.col;
          c.font = '800 17px Outfit, sans-serif';
          c.fillText(o.text, o.x, o.y);
        }
        c.globalAlpha = 1;

        if (d.banner) {
          c.globalAlpha = Math.min(1, d.banner.t * 1.4);
          c.fillStyle = 'rgba(8,11,28,.7)';
          U.roundRect(c, W / 2 - 230, 116, 460, 54, 14); c.fill();
          c.fillStyle = '#fde047';
          c.font = '800 24px Outfit, sans-serif';
          c.fillText(d.banner.text, W / 2, 151);
          c.globalAlpha = 1;
        }

        if (d.chain >= 5) {
          c.fillStyle = 'rgba(255,255,255,.7)';
          c.font = '800 16px Outfit, sans-serif';
          c.fillText(d.chain + ' clean catches', W / 2, H - 14);
        }

        // lives
        c.textAlign = 'left';
        for (var lv = 0; lv < 3; lv++) {
          c.fillStyle = lv < d.lives ? '#f472b6' : 'rgba(255,255,255,.15)';
          c.beginPath(); c.arc(26 + lv * 22, H - 20, 8, 0, 6.2832); c.fill();
        }

        if (d.flash > 0) {
          c.fillStyle = 'rgba(255,120,80,' + (d.flash * .45).toFixed(3) + ')';
          c.fillRect(0, 0, W, H);
        }
        c.restore();
      }
    });
  }

  window.Milo.register({
    id: 'juggle-master', title: 'Juggle Master', emo: '🤹', category: 'Casual',
    tagline: 'One more ball every ten catches',
    description: 'Click a falling ball to bat it back up — hit it off-centre and it flies that ' +
      'way, catch it close to the floor and it pays nearly four times as much. Every ten ' +
      'catches adds another ball to the pattern, and the new ones vary: heavy balls fall at ' +
      'half again the gravity and need a hard early hit, floaty ones hang and drift sideways. ' +
      'Once three are up, bombs start dropping through the pattern — they fall harmlessly ' +
      'off the bottom, but touching one ends the run instantly. Three drops allowed, and ' +
      'your record counts the balls you kept up as well as the catches. Tip: Space always ' +
      'bats the lowest real ball, which is the one about to cost you.',
    controls: ['Click', 'Tap', 'Space'],
    colors: ['#182a5c', '#f472b6'],
    tags: ['reflex', 'juggling', 'physics', 'timing', 'circus'],
    mount: mount
  });
})();
