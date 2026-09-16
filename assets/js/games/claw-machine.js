/* Claw Machine — eight tokens, one loose claw, and a bin full of plush. */
(function () {
  'use strict';
  var W = 520, H = 700;
  var RAILY = 128, FLOOR = 606;
  var BINL = 40, BINR = 408, CHL = 420, CHR = 498, CHX = (CHL + CHR) / 2;
  var CLAWMIN = 74, CLAWMAX = 470, TOKENS = 8;

  var KINDS = [
    { col: '#f472b6', dark: '#be1f6a', name: 'bunny' },
    { col: '#60a5fa', dark: '#1d4ed8', name: 'whale' },
    { col: '#4ade80', dark: '#15803d', name: 'frog' },
    { col: '#fbbf24', dark: '#b45309', name: 'duck' },
    { col: '#c084fc', dark: '#7e22ce', name: 'octo' },
    { col: '#fb7185', dark: '#9f1239', name: 'piggy' }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.tokens = TOKENS;
      d.prizes = [];
      d.parts = [];
      d.shake = 0;
      d.banner = null;
      d.won = 0;
      d.rares = 0;
      for (var i = 0; i < 16; i++) {
        var rare = Math.random() < 0.09;
        var r = rare ? 25 : U.rand(15, 24);
        d.prizes.push({
          x: U.rand(BINL + 40, BINR - 40), y: U.rand(360, 560),
          vx: U.rand(-40, 40), vy: 0, r: r, rot: U.rand(-.4, .4),
          rare: rare, k: rare ? 4 : U.randInt(0, KINDS.length - 1), held: false, gone: false
        });
      }
      d.claw = { x: 180, y: RAILY, dir: 1, open: 1, holding: null, grip: 0 };
      d.phase = 'move';
      d.t = 0;
      d.manual = false;
      g.score = 0;
      g.set('Score', 0);
      g.set('Tokens', d.tokens);
      g.set('Prizes', 0);
    }

    function tip(d) { return { x: d.claw.x, y: d.claw.y + 54 }; }

    function drop(g) {
      var d = g.data;
      if (d.phase !== 'move') return;
      d.phase = 'down';
      Milo.sound.tone({ f: 140, f2: 110, d: .3, v: .05, type: 'sawtooth' });
    }

    function closeClaw(g) {
      var d = g.data, t = tip(d);
      d.phase = 'close';
      d.t = 0;
      Milo.sound.tone({ f: 520, f2: 260, d: .1, v: .06, type: 'square' });
      var best = null, bd = 1e9;
      for (var i = 0; i < d.prizes.length; i++) {
        var p = d.prizes[i];
        if (p.gone) continue;
        var dd = U.dist(t.x, t.y - 4, p.x, p.y);
        if (dd < p.r + 20 && dd < bd) { bd = dd; best = p; }
      }
      d.pending = best;
    }

    function endGrab(g, grabbed) {
      var d = g.data;
      if (grabbed) {
        var p = d.pending;
        p.held = true;
        d.claw.holding = p;
        // A weak claw: grip is luck, weight is the enemy.
        d.claw.grip = U.rand(0.28, 1.0) - (p.rare ? 0.16 : 0) - (p.r - 15) * 0.012;
        Milo.sound.tone({ f: 300, f2: 480, d: .12, v: .06, type: 'triangle' });
      } else {
        Milo.sound.tone({ f: 220, f2: 150, d: .16, v: .05, type: 'sawtooth' });
      }
      d.phase = 'up';
    }

    function slip(g) {
      var d = g.data, p = d.claw.holding;
      if (!p) return;
      p.held = false;
      p.vx = U.rand(-70, 70);
      p.vy = 40;
      if (p.x > BINR) { p.x = BINR - p.r - 4; }       // never fall for free
      d.claw.holding = null;
      d.claw.open = 1;
      d.shake = 7;
      Milo.sound.hit();
      d.banner = { text: 'It slipped!', t: 1.1, col: '#f87171' };
      for (var i = 0; i < 12; i++) {
        d.parts.push({ x: p.x, y: p.y, vx: U.rand(-100, 100), vy: U.rand(-150, 0),
          life: .6, max: .6, col: KINDS[p.k].col });
      }
      d.phase = 'return';
    }

    function slipRoll(g, dt, extra) {
      var d = g.data;
      var hold = d.claw.grip - (d.claw.holding.rare ? 0.5 : 0.34);
      var chance = U.clamp(0.85 - hold * 1.9, 0.03, 1.1) + (extra || 0);
      if (Math.random() < chance * dt) { slip(g); return true; }
      return false;
    }

    function scorePrize(g, p) {
      var d = g.data;
      d.won++;
      var gain = p.rare ? 750 : Math.round(60 + (p.r - 15) * 12);
      if (p.rare) d.rares++;
      g.score += gain;
      g.set('Score', U.fmt(g.score));
      g.set('Prizes', d.won);
      d.banner = { text: (p.rare ? '★ LEGENDARY PLUSH ★  +' : 'Got one!  +') + gain, t: 1.7,
        col: p.rare ? '#facc15' : '#4ade80' };
      if (p.rare) { Milo.sound.powerup(); d.shake = 10; } else Milo.sound.coin();
      for (var i = 0; i < (p.rare ? 34 : 16); i++) {
        var a = Math.random() * 6.283;
        d.parts.push({ x: CHX, y: 600, vx: Math.cos(a) * U.rand(60, 300), vy: Math.sin(a) * U.rand(60, 300) - 120,
          life: 1, max: 1, col: p.rare ? U.choice(['#facc15', '#fde68a', '#fb923c']) : KINDS[p.k].col });
      }
    }

    function nextToken(g) {
      var d = g.data;
      d.tokens--;
      g.set('Tokens', Math.max(0, d.tokens));
      if (d.tokens <= 0) {
        g.gameOver({
          emo: '🧸', title: 'Out of tokens',
          text: d.won + ' prize' + (d.won === 1 ? '' : 's') + ' out of eight goes' +
            (d.rares ? ', including ' + d.rares + ' legendary plush' : '') + '.'
        });
        return;
      }
      d.phase = 'move';
      d.claw.open = 1;
    }

    function physics(d, dt) {
      var i, j, p, q;
      for (i = 0; i < d.prizes.length; i++) {
        p = d.prizes[i];
        if (p.gone || p.held) continue;
        p.vy += 1100 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vx * dt * 0.01;
        p.vx *= Math.pow(0.12, dt);
        var inChute = p.x > CHL && p.x < CHR;
        if (!inChute) {
          if (p.x < BINL + p.r) { p.x = BINL + p.r; p.vx = Math.abs(p.vx) * .4; }
          if (p.x > BINR - p.r) { p.x = BINR - p.r; p.vx = -Math.abs(p.vx) * .4; }
          if (p.y > FLOOR - p.r) { p.y = FLOOR - p.r; p.vy *= -0.22; if (Math.abs(p.vy) < 26) p.vy = 0; }
        } else if (p.y > 690) {
          p.gone = true;
        }
      }
      for (var it = 0; it < 2; it++) {
        for (i = 0; i < d.prizes.length; i++) {
          p = d.prizes[i];
          if (p.gone || p.held) continue;
          for (j = i + 1; j < d.prizes.length; j++) {
            q = d.prizes[j];
            if (q.gone || q.held) continue;
            var dx = q.x - p.x, dy = q.y - p.y, dist = Math.hypot(dx, dy) || .001;
            var pen = p.r + q.r - dist;
            if (pen > 0) {
              var nx = dx / dist, ny = dy / dist, push = pen / 2;
              p.x -= nx * push; p.y -= ny * push;
              q.x += nx * push; q.y += ny * push;
              var rel = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
              if (rel < 0) { p.vx += nx * rel * .4; p.vy += ny * rel * .4; q.vx -= nx * rel * .4; q.vy -= ny * rel * .4; }
            }
          }
        }
      }
    }

    return Milo.arcade(host, {
      id: 'claw-machine',
      w: W, h: H, bg: '#180a2c',
      stats: ['Score', 'Tokens', 'Prizes'],
      touchButtons: [{ key: 'action', label: 'DROP' }],
      emo: '🧸',
      start: {
        title: 'Claw Machine',
        text: 'The claw sweeps across the rail — tap to stop it and send it down. How tightly it ' +
          'grips is pure luck, and the heavier the plush the more likely it shakes loose on the ' +
          'way up or across. Get one over the chute and it is yours. The gold legendary plush is ' +
          'worth twelve ordinary ones and grips worst of all. Eight tokens.',
        keys: ['Click / Space to drop', '← → to steer']
      },
      init: reset,
      onPointer: function (g, type) { if (type === 'down') drop(g); },
      onKey: function (g, e) { if (e.code === 'Space') drop(g); },

      update: function (g, dt) {
        var d = g.data, cl = d.claw, i = g.input;
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 28);
        if (d.banner) { d.banner.t -= dt; if (d.banner.t <= 0) d.banner = null; }
        if (i.pressed('action')) drop(g);
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; p.life -= dt;
          return p.life > 0;
        });
        physics(d, dt);

        if (d.phase === 'move') {
          var key = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
          if (key) { d.manual = true; cl.x += key * 260 * dt; }
          else if (!d.manual) {
            cl.x += cl.dir * 190 * dt;
            if (cl.x > CLAWMAX) { cl.x = CLAWMAX; cl.dir = -1; }
            if (cl.x < CLAWMIN) { cl.x = CLAWMIN; cl.dir = 1; }
          }
          cl.x = U.clamp(cl.x, CLAWMIN, CLAWMAX);
          cl.open = 1;
          cl.y = RAILY;
        } else if (d.phase === 'down') {
          cl.y += 300 * dt;
          var t = tip(d), hit = false;
          for (var k = 0; k < d.prizes.length; k++) {
            var p = d.prizes[k];
            if (p.gone) continue;
            if (U.dist(t.x, t.y, p.x, p.y) < p.r + 10) { hit = true; break; }
          }
          if (hit || cl.y + 54 > FLOOR - 8) closeClaw(g);
        } else if (d.phase === 'close') {
          d.t += dt;
          cl.open = Math.max(0.12, 1 - d.t / 0.34);
          if (d.t >= 0.34) endGrab(g, !!d.pending && Math.random() < 0.88);
        } else if (d.phase === 'up') {
          cl.y -= 250 * dt;
          if (cl.holding) {
            cl.holding.x = cl.x;
            cl.holding.y = cl.y + 54 + cl.holding.r * 0.5;
            if (slipRoll(g, dt, 0)) return;
          }
          if (cl.y <= RAILY) {
            cl.y = RAILY;
            d.phase = cl.holding ? 'across' : 'return';
          }
        } else if (d.phase === 'across') {
          var tgt = CHX;
          cl.x += Math.sign(tgt - cl.x) * 190 * dt;
          if (cl.holding) {
            cl.holding.x = cl.x + Math.sin(g.t * 9) * 3;
            cl.holding.y = cl.y + 54 + cl.holding.r * 0.5;
            if (slipRoll(g, dt, 0.16)) return;
          }
          if (Math.abs(tgt - cl.x) < 4) { cl.x = tgt; d.phase = 'open'; d.t = 0; }
        } else if (d.phase === 'open') {
          d.t += dt;
          cl.open = Math.min(1, 0.12 + d.t / 0.25);
          if (cl.holding) { cl.holding.x = cl.x; cl.holding.y = cl.y + 54 + cl.holding.r * 0.5; }
          if (d.t >= 0.25) {
            var pr = cl.holding;
            cl.holding = null;
            if (pr) { pr.held = false; pr.vy = 60; pr.vx = 0; scorePrize(g, pr); }
            d.phase = 'return';
          }
        } else if (d.phase === 'return') {
          cl.open = 1;
          cl.y = U.lerp(cl.y, RAILY, Math.min(1, 8 * dt));
          if (Math.abs(cl.y - RAILY) < 2) { cl.y = RAILY; nextToken(g); }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, cl = d.claw;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#3b0f5c'); bg.addColorStop(.5, '#1d0b36'); bg.addColorStop(1, '#0d0520');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // cabinet frame
        c.fillStyle = '#2a1147';
        U.roundRect(c, 20, 84, W - 40, H - 120, 18); c.fill();
        c.strokeStyle = '#ff5ea8'; c.lineWidth = 4;
        U.roundRect(c, 20, 84, W - 40, H - 120, 18); c.stroke();
        c.strokeStyle = 'rgba(94,234,212,.5)'; c.lineWidth = 2;
        U.roundRect(c, 28, 92, W - 56, H - 136, 14); c.stroke();

        // marquee bulbs
        for (var b = 0; b < 12; b++) {
          var on = (Math.floor(g.t * 5) + b) % 3 === 0;
          c.fillStyle = on ? '#fde68a' : 'rgba(253,230,138,.28)';
          c.beginPath(); c.arc(42 + b * 39, 74, 5, 0, 7); c.fill();
        }

        // rail
        c.fillStyle = '#5b6479';
        c.fillRect(56, RAILY - 16, CLAWMAX - 56 + 30, 8);

        // bin floor + walls
        c.fillStyle = '#1a0b30';
        c.fillRect(BINL - 8, FLOOR, BINR - BINL + 16, 26);
        c.fillStyle = 'rgba(255,255,255,.07)';
        c.fillRect(BINL - 8, FLOOR, BINR - BINL + 16, 4);
        c.fillStyle = '#3a1a5e';
        c.fillRect(BINR + 4, 470, 10, FLOOR - 470 + 26);

        // chute
        var chg = c.createLinearGradient(0, 540, 0, 660);
        chg.addColorStop(0, 'rgba(94,234,212,.28)'); chg.addColorStop(1, 'rgba(10,5,25,.95)');
        c.fillStyle = chg;
        U.roundRect(c, CHL, 540, CHR - CHL, 120, 8); c.fill();
        c.strokeStyle = '#5eead4'; c.lineWidth = 3;
        U.roundRect(c, CHL, 540, CHR - CHL, 120, 8); c.stroke();
        c.fillStyle = '#5eead4';
        c.font = '700 11px Outfit, system-ui, sans-serif';
        c.textAlign = 'center';
        c.fillText('PRIZE', CHX, 566);

        function plush(p) {
          var kk = KINDS[p.k];
          c.save();
          c.translate(p.x, p.y); c.rotate(p.rot);
          if (p.rare) {
            c.shadowColor = '#facc15'; c.shadowBlur = 18;
          }
          c.fillStyle = p.rare ? '#facc15' : kk.col;
          c.beginPath(); c.arc(0, 0, p.r, 0, 7); c.fill();
          c.shadowBlur = 0;
          // ears
          c.fillStyle = p.rare ? '#eab308' : kk.dark;
          c.beginPath(); c.arc(-p.r * .62, -p.r * .72, p.r * .36, 0, 7); c.fill();
          c.beginPath(); c.arc(p.r * .62, -p.r * .72, p.r * .36, 0, 7); c.fill();
          c.fillStyle = 'rgba(255,255,255,.55)';
          c.beginPath(); c.arc(0, p.r * .28, p.r * .46, 0, Math.PI); c.fill();
          c.fillStyle = '#1b1030';
          c.beginPath(); c.arc(-p.r * .3, -p.r * .12, p.r * .12, 0, 7); c.fill();
          c.beginPath(); c.arc(p.r * .3, -p.r * .12, p.r * .12, 0, 7); c.fill();
          c.strokeStyle = '#1b1030'; c.lineWidth = 1.6;
          c.beginPath(); c.arc(0, p.r * .1, p.r * .22, .3, Math.PI - .3); c.stroke();
          if (p.rare) {
            c.fillStyle = '#fff7cf';
            c.font = '800 10px Outfit, system-ui, sans-serif';
            c.textAlign = 'center';
            c.fillText('★', 0, -p.r - 5);
          }
          c.restore();
        }

        d.prizes.forEach(function (p) { if (!p.gone) plush(p); });

        // cable + claw
        c.strokeStyle = '#9aa4bd'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(cl.x, RAILY - 12); c.lineTo(cl.x, cl.y); c.stroke();
        c.fillStyle = '#c7cede';
        U.roundRect(c, cl.x - 17, cl.y - 6, 34, 20, 5); c.fill();
        c.fillStyle = '#7b86a3';
        U.roundRect(c, cl.x - 12, cl.y + 12, 24, 8, 3); c.fill();
        var spread = 8 + cl.open * 17;
        [-1, 1].forEach(function (s) {
          c.strokeStyle = '#e2e8f0'; c.lineWidth = 5; c.lineCap = 'round';
          c.beginPath();
          c.moveTo(cl.x + s * 7, cl.y + 18);
          c.quadraticCurveTo(cl.x + s * spread, cl.y + 36, cl.x + s * (spread * 0.55), cl.y + 56);
          c.stroke();
        });
        c.strokeStyle = '#cbd5e1'; c.lineWidth = 4;
        c.beginPath();
        c.moveTo(cl.x, cl.y + 18);
        c.lineTo(cl.x, cl.y + 54 - cl.open * 6);
        c.stroke();

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 3, p.y - 3, 6, 6);
        });
        c.globalAlpha = 1;

        // glass sheen
        c.fillStyle = 'rgba(255,255,255,.05)';
        c.beginPath();
        c.moveTo(60, 100); c.lineTo(190, 100); c.lineTo(80, H - 60); c.lineTo(34, H - 60);
        c.closePath(); c.fill();
        c.restore();

        // grip gauge while holding
        c.textAlign = 'center';
        if (cl.holding) {
          var hold = U.clamp(cl.grip, 0, 1);
          c.fillStyle = 'rgba(255,255,255,.14)';
          U.roundRect(c, W / 2 - 80, 100, 160, 12, 6); c.fill();
          c.fillStyle = hold > .66 ? '#4ade80' : hold > .4 ? '#facc15' : '#ef4444';
          U.roundRect(c, W / 2 - 80, 100, 160 * hold, 12, 6); c.fill();
          c.fillStyle = 'rgba(255,255,255,.6)';
          c.font = '700 11px Outfit, system-ui, sans-serif';
          c.fillText('GRIP', W / 2, 96);
        }

        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '700 13px Outfit, system-ui, sans-serif';
        c.fillText(d.phase === 'move' ? 'Tap to drop the claw' : '', W / 2, H - 22);

        // token row
        for (var t = 0; t < TOKENS; t++) {
          c.fillStyle = t < d.tokens ? '#fbbf24' : 'rgba(255,255,255,.14)';
          c.beginPath(); c.arc(40 + t * 22, H - 22, 8, 0, 7); c.fill();
        }

        if (d.banner) {
          c.globalAlpha = Math.min(1, d.banner.t);
          c.fillStyle = d.banner.col;
          c.font = '800 24px Outfit, system-ui, sans-serif';
          c.fillText(d.banner.text, W / 2, 200);
          c.globalAlpha = 1;
        }
      }
    });
  }

  window.Milo.register({
    id: 'claw-machine', title: 'Claw Machine', emo: '🧸', category: 'Casual',
    tagline: 'Eight tokens against a claw that does not want to hold on',
    description: 'Stop the sweeping claw over the plush you want and send it down. It closes with ' +
      'a random grip, and from then on every second of the lift and the slide across to the chute ' +
      'is a roll against the weight of what you are carrying — the grip bar tells you how worried ' +
      'to be. Small plush come up easily; the gold legendary is heavy, grips worst and is worth ' +
      'seven hundred and fifty. Eight tokens and then the machine keeps your money.',
    controls: ['Click', 'Space', '← →'],
    colors: ['#180a2c', '#ff5ea8'],
    tags: ['arcade', 'physics', 'luck', 'prizes', 'one more go'],
    mount: mount
  });
})();
