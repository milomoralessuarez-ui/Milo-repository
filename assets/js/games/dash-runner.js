/* Dash Runner — endless runner with jumps, slides and a rising tempo. */
(function () {
  'use strict';
  var W = 900, H = 460, GROUND = H - 78;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.p = { x: 130, y: GROUND, vy: 0, h: 52, ducking: false, jumps: 0 };
      d.speed = 420;
      d.obs = [];
      d.coins = [];
      d.parts = [];
      d.dist = 0;
      d.next = 300;
      d.nextCoin = 500;
      d.hills = [];
      for (var i = 0; i < 5; i++) d.hills.push({ x: i * 260, h: U.rand(40, 120) });
      g.set('Score', 0);
      g.set('Coins', 0);
      d.coinCount = 0;
    }

    function jump(g) {
      var d = g.data, p = d.p;
      if (p.jumps >= 2) return;
      p.vy = p.jumps === 0 ? -760 : -640;
      p.jumps++;
      Milo.sound.jump();
    }

    return Milo.arcade(host, {
      id: 'dash-runner',
      w: W, h: H, bg: '#0b1026',
      stats: ['Score', 'Coins'],
      emo: '🏃',
      touch: 'dpad',
      start: {
        title: 'Dash Runner',
        text: 'Run, jump and slide through everything in your way. You get a ' +
          'double jump — use it. Coins are worth 25 each.',
        keys: ['Space / ↑ jump', '↓ slide', 'Double-tap to double jump']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        if (type !== 'down') return;
        if (y > H * .62) g.data.p.ducking = true; else jump(g);
      },
      onKey: function (g, e) {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') jump(g);
      },

      update: function (g, dt) {
        var d = g.data, p = d.p, i = g.input;

        if (i.pressed('up')) jump(g);
        p.ducking = i.down('down') || (g.input.pdown && g.input.py > H * .62);
        p.h = p.ducking && p.y >= GROUND - 1 ? 28 : 52;

        d.speed = Math.min(900, 420 + d.dist * 0.028);
        d.dist += d.speed * dt;
        g.score = Math.floor(d.dist / 10) + d.coinCount * 25;
        g.set('Score', U.fmt(g.score));

        p.vy += 2100 * dt;
        p.y += p.vy * dt;
        if (p.y >= GROUND) { p.y = GROUND; p.vy = 0; p.jumps = 0; }

        d.hills.forEach(function (hl) {
          hl.x -= d.speed * .25 * dt;
          if (hl.x < -300) { hl.x += 5 * 260; hl.h = U.rand(40, 120); }
        });

        // spawn
        d.next -= d.speed * dt;
        if (d.next <= 0) {
          var gap = U.rand(260, 460) - Math.min(120, d.dist / 120);
          d.next = Math.max(170, gap);
          var kind = Math.random();
          if (kind < .45) d.obs.push({ x: W + 40, y: GROUND, w: 26, h: U.rand(34, 58), kind: 'block' });
          else if (kind < .72) d.obs.push({ x: W + 40, y: GROUND - 74, w: 60, h: 26, kind: 'bar' });
          else d.obs.push({ x: W + 40, y: GROUND, w: 54, h: 30, kind: 'spikes' });
        }
        d.nextCoin -= d.speed * dt;
        if (d.nextCoin <= 0) {
          d.nextCoin = U.rand(340, 700);
          var cy = Math.random() < .5 ? GROUND - 40 : GROUND - 130;
          for (var n = 0; n < 5; n++) d.coins.push({ x: W + 40 + n * 34, y: cy, t: n });
        }

        d.obs = d.obs.filter(function (o) { o.x -= d.speed * dt; return o.x > -120; });
        d.coins = d.coins.filter(function (o) { o.x -= d.speed * dt; return o.x > -60; });

        // player box
        var px = p.x - 15, py = p.y - p.h, pw = 30, ph = p.h;

        for (var k = 0; k < d.obs.length; k++) {
          var o = d.obs[k];
          var oy = o.kind === 'bar' ? o.y : o.y - o.h;
          if (px < o.x + o.w && px + pw > o.x && py < oy + o.h && py + ph > oy) {
            Milo.sound.explode();
            for (var b = 0; b < 24; b++) {
              var a = Math.random() * 6.28, s = U.rand(60, 300);
              d.parts.push({ x: p.x, y: p.y - 26, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .7), max: .7, col: U.choice(['#22d3ee', '#fff', '#fb7185']) });
            }
            g.gameOver({ text: 'You ran ' + U.fmt(Math.floor(d.dist / 10)) + ' m and grabbed ' + d.coinCount + ' coins.' });
            return;
          }
        }

        for (var m = d.coins.length - 1; m >= 0; m--) {
          var co = d.coins[m];
          if (U.dist(co.x, co.y, p.x, p.y - p.h / 2) < 30) {
            d.coins.splice(m, 1);
            d.coinCount++;
            g.set('Coins', d.coinCount);
            Milo.sound.coin();
            for (var q = 0; q < 6; q++) {
              var aa = Math.random() * 6.28;
              d.parts.push({ x: co.x, y: co.y, vx: Math.cos(aa) * 120, vy: Math.sin(aa) * 120, life: .3, max: .3, col: '#ffd257' });
            }
          }
        }

        d.parts = d.parts.filter(function (q2) {
          q2.x += q2.vx * dt; q2.y += q2.vy * dt; q2.vy += 700 * dt; q2.life -= dt;
          return q2.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#16123f'); sky.addColorStop(1, '#080a1e');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        c.fillStyle = 'rgba(124,92,255,.16)';
        d.hills.forEach(function (hl) {
          c.beginPath();
          c.moveTo(hl.x - 130, GROUND);
          c.quadraticCurveTo(hl.x, GROUND - hl.h, hl.x + 130, GROUND);
          c.fill();
        });

        c.fillStyle = '#141a3d';
        c.fillRect(0, GROUND, W, H - GROUND);
        c.strokeStyle = 'rgba(34,211,238,.55)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(0, GROUND); c.lineTo(W, GROUND); c.stroke();
        c.strokeStyle = 'rgba(124,92,255,.25)'; c.lineWidth = 1;
        c.beginPath();
        for (var x = -(d.dist % 60); x < W; x += 60) { c.moveTo(x, GROUND); c.lineTo(x - 26, H); }
        c.stroke();

        d.coins.forEach(function (co) {
          var bob = Math.sin(g.t * 5 + co.t) * 4;
          c.shadowColor = '#ffd257'; c.shadowBlur = 14;
          c.fillStyle = '#ffd257';
          c.beginPath(); c.ellipse(co.x, co.y + bob, 8, 10, 0, 0, 7); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#8a6b00';
          c.font = '800 10px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText('$', co.x, co.y + bob + 4);
        });

        d.obs.forEach(function (o) {
          var oy = o.kind === 'bar' ? o.y : o.y - o.h;
          if (o.kind === 'spikes') {
            c.fillStyle = '#fb7185';
            c.shadowColor = '#fb7185'; c.shadowBlur = 12;
            c.beginPath();
            for (var s = 0; s < 3; s++) {
              c.moveTo(o.x + s * 18, o.y);
              c.lineTo(o.x + s * 18 + 9, o.y - o.h);
              c.lineTo(o.x + s * 18 + 18, o.y);
            }
            c.fill(); c.shadowBlur = 0;
          } else {
            var col = o.kind === 'bar' ? '#a78bfa' : '#22d3ee';
            c.shadowColor = col; c.shadowBlur = 12;
            c.fillStyle = col;
            U.roundRect(c, o.x, oy, o.w, o.h, 5); c.fill();
            c.shadowBlur = 0;
          }
        });

        // runner
        c.save();
        c.translate(p.x, p.y);
        var run = Math.sin(d.dist / 22) ;
        c.shadowColor = '#fff'; c.shadowBlur = 14;
        c.fillStyle = '#eef2ff';
        U.roundRect(c, -14, -p.h, 28, p.h, 9); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = '#22d3ee';
        c.beginPath(); c.arc(4, -p.h + 12, 4, 0, 7); c.fill();
        if (p.y >= GROUND - 1) {
          c.strokeStyle = '#eef2ff'; c.lineWidth = 5; c.lineCap = 'round';
          c.beginPath();
          c.moveTo(-4, 0); c.lineTo(-4 + run * 10, 12);
          c.moveTo(6, 0); c.lineTo(6 - run * 10, 12);
          c.stroke();
        }
        c.restore();

        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.fillRect(q.x - 2.5, q.y - 2.5, 5, 5);
        });
        c.globalAlpha = 1;
      }
    });
  }

  window.Milo.register({
    id: 'dash-runner', title: 'Dash Runner', emo: '🏃', category: 'Arcade',
    tagline: 'Endless running, jumping and sliding',
    description: 'Sprint down a neon highway that never ends. Jump the blocks and ' +
      'spikes, slide under the bars, and grab every coin you can reach — each one is ' +
      'worth 25 points. You have a double jump, and the run gets faster the longer you last.',
    controls: ['Space jump', '↑ jump', '↓ slide', 'Tap top/bottom'],
    colors: ['#22d3ee', '#7c5cff'],
    tags: ['runner', 'endless', 'reflex', 'high score'],
    mount: mount
  });
})();
