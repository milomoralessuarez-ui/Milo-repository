/* Shadow Leap — teleport up the crumbling stones; leap fast, chain the multiplier. */
(function () {
  'use strict';
  var W = 480, H = 720, R = 260;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function crumbleTime(d) {
      return Math.max(.55, 1.1 - d.topM * .004);
    }

    function reset(g) {
      var d = g.data;
      d.startY = H - 130;
      d.p = { x: 240, y: d.startY - 14 };
      d.falling = false;
      d.vy = 0;
      d.plats = [];
      d.topM = 0;
      d.camY = 0;
      d.chain = 0;
      d.maxChain = 0;
      d.bonus = 0;
      d.orbs = 0;
      d.rangeFlash = 0;
      d.sinceLand = 99;
      d.parts = [];
      d.texts = [];
      d.shake = 0;
      d.dead = false;
      d.dieT = 0;
      var start = { x: 240, y: d.startY, w: 130, t: -1, T: 1, brittle: false, orb: false, gone: false };
      d.plats.push(start);
      d.cur = start;
      d.lastX = 240; d.lastY = d.startY;
      while (d.lastY > -900) addPlat(d);
      // the starting stone waits for your first leap
      g.set('Score', 0);
      g.set('Chain', '×0');
      g.set('Best', U.fmt(g.best));
    }

    function addPlat(d) {
      var ny = d.lastY - U.rand(95, 150);
      var span = Math.min(200, Math.sqrt(Math.max(0, (R * .85) * (R * .85) - (d.lastY - ny) * (d.lastY - ny))));
      var nx = U.clamp(d.lastX + U.rand(-span, span), 60, 420);
      var m = Math.max(0, (d.startY - ny) / 14);
      d.plats.push({
        x: nx, y: ny, w: U.rand(72, 108) - Math.min(24, m * .06),
        t: -1, T: 1, gone: false,
        brittle: Math.random() < Math.min(.4, .06 + m * .0012),
        orb: Math.random() < .16,
        phase: Math.random() * 6.28
      });
      d.lastX = nx; d.lastY = ny;
    }

    function shardBurst(d, pl) {
      for (var k = 0; k < 10; k++) {
        d.parts.push({
          x: pl.x + U.rand(-pl.w / 2, pl.w / 2), y: pl.y + U.rand(-4, 6),
          vx: U.rand(-60, 60), vy: U.rand(20, 160), grav: 500, rot: U.rand(0, 6.28),
          life: U.rand(.4, .8), max: .8, kind: 'shard',
          col: pl.brittle ? '#a78bfa' : '#aab2d8'
        });
      }
    }

    function leap(g, pl) {
      var d = g.data, p = d.p;
      if (d.dead || d.falling || pl === d.cur || pl.gone) return;
      if (U.dist(p.x, p.y, pl.x, pl.y) > R) {
        d.texts.push({ x: pl.x, y: pl.y - 24, t: 'TOO FAR', life: .5, max: .5, col: '#64748b' });
        Milo.sound.tone({ f: 160, f2: 120, d: .08, v: .05, type: 'triangle' });
        d.rangeFlash = .35;
        return;
      }
      // shadow trail along the leap line
      var steps = Math.ceil(U.dist(p.x, p.y, pl.x, pl.y - 14) / 16);
      for (var k = 0; k <= steps; k++) {
        var t = k / Math.max(1, steps);
        d.parts.push({
          x: U.lerp(p.x, pl.x, t) + U.rand(-4, 4),
          y: U.lerp(p.y, pl.y - 14, t) + U.rand(-4, 4),
          vx: U.rand(-16, 16), vy: U.rand(-40, -10), grav: 0,
          life: .3 + t * .15, max: .45, kind: 'puff', col: '#1e1b34'
        });
      }
      var swift = d.sinceLand < .5;
      if (swift) {
        d.chain++;
        var pts = 10 * d.chain;
        d.bonus += pts;
        d.texts.push({
          x: pl.x, y: pl.y - 34, t: '×' + d.chain + '  +' + pts, life: .8, max: .8,
          col: d.chain >= 6 ? '#fbbf24' : '#a5b4fc'
        });
        Milo.sound.tone({ f: 300 + Math.min(900, d.chain * 70), f2: 980, d: .09, v: .08, type: 'square' });
      } else {
        if (d.chain > 2) d.texts.push({ x: pl.x, y: pl.y - 34, t: 'CHAIN LOST', life: .7, max: .7, col: '#64748b' });
        d.chain = 0;
        Milo.sound.tone({ f: 240, f2: 90, d: .1, v: .07, type: 'sawtooth' });
      }
      g.set('Chain', '×' + d.chain);
      Milo.sound.noise(.08, .05, 1400);

      p.x = pl.x; p.y = pl.y - 14;
      d.cur = pl;
      d.sinceLand = 0;
      if (pl.t < 0) pl.t = 0;              // the stone starts to crumble
      if (pl.orb) {
        pl.orb = false;
        d.orbs++;
        d.bonus += 40;
        d.texts.push({ x: pl.x, y: pl.y - 54, t: 'SOUL +40', life: .8, max: .8, col: '#67e8f9' });
        Milo.sound.coin();
      }
      var m = Math.max(0, Math.floor((d.startY - pl.y) / 14));
      if (m > d.topM) d.topM = m;
      g.score = d.topM + d.bonus;
      g.set('Score', U.fmt(g.score));
    }

    function pickByKey(g, dir) {
      var d = g.data, p = d.p;
      var best = null, bd = 1e9;
      for (var k = 0; k < d.plats.length; k++) {
        var pl = d.plats[k];
        if (pl === d.cur || pl.gone) continue;
        if (pl.y > p.y - 20) continue;
        var dx = pl.x - p.x;
        if (dir < 0 && dx > -10) continue;
        if (dir > 0 && dx < 10) continue;
        var dist = U.dist(p.x, p.y, pl.x, pl.y);
        if (dist > R) continue;
        if (dist < bd) { bd = dist; best = pl; }
      }
      if (best) leap(g, best);
    }

    return Milo.arcade(host, {
      id: 'shadow-leap',
      w: W, h: H, bg: '#0a0816',
      stats: ['Score', 'Chain', 'Best'],
      emo: '🌑',
      start: {
        title: 'Shadow Leap',
        text: 'Tap any stone inside your ring to teleport to it — one second after ' +
          'you land, the stone falls apart under you. Leap again within half a ' +
          'second to grow the chain multiplier. Violet stones barely last at all.',
        keys: ['Click / Tap a stone', '← ↑ → leap by key']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.data.dead) return;
        var d = g.data;
        var best = null, bd = 1e9;
        for (var k = 0; k < d.plats.length; k++) {
          var pl = d.plats[k];
          if (pl.gone) continue;
          var sy = pl.y - d.camY;
          if (Math.abs(x - pl.x) < pl.w / 2 + 18 && Math.abs(y - sy) < 34) {
            var dd = Math.abs(x - pl.x) + Math.abs(y - sy);
            if (dd < bd) { bd = dd; best = pl; }
          }
        }
        if (best) leap(g, best);
      },
      onKey: function (g, e) {
        if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') pickByKey(g, 0);
        else if (e.code === 'ArrowLeft' || e.code === 'KeyA') pickByKey(g, -1);
        else if (e.code === 'ArrowRight' || e.code === 'KeyD') pickByKey(g, 1);
      },

      update: function (g, dt) {
        var d = g.data, k;
        d.shake = Math.max(0, d.shake - dt * 40);
        d.rangeFlash = Math.max(0, (d.rangeFlash || 0) - dt);

        if (d.dead) {
          d.dieT -= dt;
          cool(d, dt);
          if (d.dieT <= 0) {
            g.gameOver({
              text: 'The stones gave out at ' + U.fmt(d.topM) + ' m — chain topped ×' +
                d.maxChain + ' with ' + d.orbs + ' soul' + (d.orbs === 1 ? '' : 's') + '.'
            });
          }
          return;
        }

        d.sinceLand += dt;
        d.maxChain = Math.max(d.maxChain || 0, d.chain);

        // crumbling
        var T = crumbleTime(d);
        for (k = d.plats.length - 1; k >= 0; k--) {
          var pl = d.plats[k];
          if (pl.t >= 0 && !pl.gone) {
            pl.T = pl.brittle ? T * .55 : T;
            pl.t += dt;
            if (pl.t >= pl.T) {
              pl.gone = true;
              shardBurst(d, pl);
              Milo.sound.noise(.14, .1, 700);
              if (pl === d.cur) {
                d.falling = true;
                d.vy = 0;
                d.chain = 0;
                g.set('Chain', '×0');
              }
            }
          }
          if (pl.y > d.camY + H + 120) d.plats.splice(k, 1);
        }

        if (d.falling) {
          d.vy += 1500 * dt;
          d.p.y += d.vy * dt;
          if (Math.random() < .5) wisp(d, d.p.x, d.p.y, '#312e5e');
          if (d.p.y - d.camY > H + 60) {
            d.dead = true;
            d.dieT = .7;
            d.shake = 10;
            Milo.sound.lose();
          }
        } else if (Math.random() < .3) {
          wisp(d, d.p.x + U.rand(-8, 8), d.p.y + U.rand(-4, 8), '#1e1b34');
        }

        // camera eases upward only
        var target = d.p.y - H * .62;
        if (target < d.camY) d.camY += (target - d.camY) * Math.min(1, 7 * dt);

        while (d.lastY > d.camY - 300) addPlat(d);

        cool(d, dt);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, k;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#131029');
        bg.addColorStop(1, '#0a0816');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // moon, world-fixed-ish (drifts slowly with the climb)
        var moonY = 130 + (d.camY * .05 % 40);
        c.save();
        c.shadowColor = '#e2e8f0'; c.shadowBlur = 46;
        c.fillStyle = '#dfe4f5';
        c.beginPath(); c.arc(96, moonY, 52, 0, 7); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = 'rgba(148,163,184,.4)';
        c.beginPath(); c.arc(80, moonY - 12, 9, 0, 7); c.fill();
        c.beginPath(); c.arc(112, moonY + 16, 6, 0, 7); c.fill();
        c.beginPath(); c.arc(102, moonY - 24, 4.5, 0, 7); c.fill();
        c.restore();

        // stars, hash-scattered, parallax
        c.fillStyle = 'rgba(226,232,240,.5)';
        for (k = 0; k < 40; k++) {
          var sx = U.hash2(k, 1, 44) * W;
          var sy = ((U.hash2(k, 2, 44) * H * 2 - d.camY * .15) % (H + 40) + H + 40) % (H + 40) - 20;
          var tw = .3 + .7 * Math.abs(Math.sin(g.t * 1.5 + k));
          c.globalAlpha = tw * .6;
          c.fillRect(sx, sy, 2, 2);
        }
        c.globalAlpha = 1;

        // drifting fog bands
        for (k = 0; k < 3; k++) {
          var fy = ((k * 260 - d.camY * .3) % (H + 200) + H + 200) % (H + 200) - 100;
          c.fillStyle = 'rgba(94,84,142,.08)';
          c.beginPath();
          c.ellipse(W / 2 + Math.sin(g.t * .2 + k * 2) * 60, fy, 300, 46, 0, 0, 7);
          c.fill();
        }

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));
        c.translate(0, -d.camY);

        // range ring
        if (!d.dead && !d.falling) {
          c.strokeStyle = d.rangeFlash > 0 ? 'rgba(248,113,113,.5)' : 'rgba(165,180,252,.16)';
          c.lineWidth = 2;
          c.setLineDash([6, 10]);
          c.beginPath(); c.arc(d.p.x, d.p.y, R, 0, 7); c.stroke();
          c.setLineDash([]);
        }

        // stones
        for (k = 0; k < d.plats.length; k++) {
          var pl = d.plats[k];
          if (pl.gone || pl.y < d.camY - 60 || pl.y > d.camY + H + 60) continue;
          var frac = pl.t < 0 ? 0 : pl.t / pl.T;
          var jit = frac > .65 ? (frac - .65) * 10 : 0;
          var ox = U.rand(-jit, jit), oy = U.rand(-jit, jit);
          var inRange = !d.falling && !d.dead &&
            U.dist(d.p.x, d.p.y, pl.x, pl.y) <= R && pl !== d.cur;
          c.save();
          c.translate(pl.x + ox, pl.y + oy);
          if (inRange) {
            c.shadowColor = pl.brittle ? '#a78bfa' : '#a5b4fc';
            c.shadowBlur = 12;
          }
          // slab: moonlit top, dark side
          c.fillStyle = pl.brittle ? '#8b7ec7' : '#aab2d8';
          U.roundRect(c, -pl.w / 2, -8, pl.w, 16, 6); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = pl.brittle ? '#4c4382' : '#4a5178';
          U.roundRect(c, -pl.w / 2 + 2, 2, pl.w - 4, 7, 4); c.fill();
          c.fillStyle = 'rgba(255,255,255,.35)';
          U.roundRect(c, -pl.w / 2 + 3, -7, pl.w - 6, 3.5, 2); c.fill();
          // cracks grow with the crumble
          if (frac > 0) {
            c.strokeStyle = 'rgba(20,16,40,' + (0.35 + frac * .6) + ')';
            c.lineWidth = 1.6;
            var nCr = 1 + Math.floor(frac * 4);
            for (var cr = 0; cr < nCr; cr++) {
              var cx0 = ((U.hash2(k, cr, 7) - .5) * pl.w * .8);
              c.beginPath();
              c.moveTo(cx0, -8);
              c.lineTo(cx0 + (U.hash2(k, cr + 9, 7) - .5) * 14, 0);
              c.lineTo(cx0 + (U.hash2(k, cr + 17, 7) - .5) * 20, 8);
              c.stroke();
            }
          }
          if (pl.brittle && frac === 0) {
            c.strokeStyle = 'rgba(30,20,60,.5)'; c.lineWidth = 1.4;
            c.beginPath(); c.moveTo(-pl.w * .2, -8); c.lineTo(-pl.w * .12, 8); c.stroke();
          }
          // soul orb
          if (pl.orb) {
            var bob = Math.sin(g.t * 3 + pl.phase) * 5;
            c.shadowColor = '#67e8f9'; c.shadowBlur = 14;
            c.fillStyle = '#67e8f9';
            c.beginPath(); c.arc(0, -26 + bob, 6, 0, 7); c.fill();
            c.shadowBlur = 0;
            c.fillStyle = 'rgba(255,255,255,.7)';
            c.beginPath(); c.arc(-2, -28 + bob, 2, 0, 7); c.fill();
          }
          c.restore();
        }

        // particles
        for (k = 0; k < d.parts.length; k++) {
          var p = d.parts[k];
          var a = Math.max(0, p.life / p.max);
          c.globalAlpha = p.kind === 'puff' ? a * .8 : a;
          c.fillStyle = p.col;
          if (p.kind === 'shard') {
            c.save();
            c.translate(p.x, p.y);
            c.rotate(p.rot + p.life * 4);
            c.fillRect(-4, -2.5, 8, 5);
            c.restore();
          } else if (p.kind === 'puff') {
            c.beginPath(); c.arc(p.x, p.y, 6 * (1.4 - a), 0, 7); c.fill();
          } else {
            c.beginPath(); c.arc(p.x, p.y, 3, 0, 7); c.fill();
          }
        }
        c.globalAlpha = 1;

        // the shade
        if (!d.dead) {
          var pp = d.p;
          c.save();
          c.translate(pp.x, pp.y);
          var breathe = 1 + Math.sin(g.t * 4) * .05;
          c.scale(breathe, 1 / breathe);
          c.fillStyle = '#0d0b1c';
          c.strokeStyle = 'rgba(165,180,252,.4)';
          c.lineWidth = 1.5;
          c.beginPath();
          c.moveTo(0, -22);
          c.bezierCurveTo(13, -20, 13, 2, 9, 8);
          c.quadraticCurveTo(4, 12, 0, 9);
          c.quadraticCurveTo(-4, 12, -9, 8);
          c.bezierCurveTo(-13, 2, -13, -20, 0, -22);
          c.closePath(); c.fill(); c.stroke();
          // glowing eyes
          c.shadowColor = '#67e8f9'; c.shadowBlur = 8;
          c.fillStyle = '#67e8f9';
          c.beginPath();
          c.ellipse(-4.5, -12, 2.4, 3.4, .2, 0, 7);
          c.ellipse(4.5, -12, 2.4, 3.4, -.2, 0, 7);
          c.fill();
          c.shadowBlur = 0;
          c.restore();
        }

        // floating texts
        c.font = '800 15px Outfit, sans-serif';
        c.textAlign = 'center';
        for (k = 0; k < d.texts.length; k++) {
          var t = d.texts[k];
          c.globalAlpha = Math.max(0, t.life / t.max);
          c.fillStyle = t.col;
          c.fillText(t.t, t.x, t.y);
        }
        c.globalAlpha = 1;
        c.restore();

        // crumble timer arc for the current stone
        if (!d.dead && !d.falling && d.cur && d.cur.t >= 0 && !d.cur.gone) {
          var fr = d.cur.t / d.cur.T;
          var ax = d.p.x, ay = d.p.y - d.camY - 40;
          c.strokeStyle = fr > .7 ? '#f87171' : '#a5b4fc';
          c.lineWidth = 3.5;
          c.beginPath();
          c.arc(ax, ay, 11, -Math.PI / 2, -Math.PI / 2 + (1 - fr) * Math.PI * 2);
          c.stroke();
        }
      }
    });

    function wisp(d, x, y, col) {
      d.parts.push({
        x: x, y: y, vx: U.rand(-14, 14), vy: U.rand(-50, -20), grav: 0,
        life: U.rand(.3, .6), max: .6, kind: 'wisp', col: col
      });
    }

    function cool(d, dt) {
      var k;
      for (k = d.parts.length - 1; k >= 0; k--) {
        var p = d.parts[k];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.grav || 0) * dt; p.life -= dt;
        if (p.life <= 0) d.parts.splice(k, 1);
      }
      for (k = d.texts.length - 1; k >= 0; k--) {
        d.texts[k].y -= 30 * dt; d.texts[k].life -= dt;
        if (d.texts[k].life <= 0) d.texts.splice(k, 1);
      }
    }
  }

  window.Milo.register({
    id: 'shadow-leap', title: 'Shadow Leap', emo: '🌑', category: 'Action',
    tagline: 'Every stone you touch starts dying',
    description: 'You are a shade that moves only by teleporting: tap any stone inside ' +
      'your dashed ring and you are there instantly — but one second after you land, ' +
      'the stone under you shatters, and the ring above your head counts it down. ' +
      'Leaping again within half a second grows a chain worth 10 points times its ' +
      'length, so the fast line up is also the rich one. Violet stones crumble in ' +
      'barely half the time, cyan souls pay 40 each, and the higher you climb the ' +
      'quicker everything breaks. Hesitate and the mountain simply stops existing.',
    controls: ['Click / Tap', '← ↑ →'],
    colors: ['#1e1b4b', '#c7d2fe'],
    tags: ['endless', 'teleport', 'climbing', 'chain', 'reflex'],
    mount: mount
  });
})();
