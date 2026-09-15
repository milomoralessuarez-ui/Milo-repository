/* Bomb Catcher — the mad bomber speeds up; miss one and the lot goes off. */
(function () {
  'use strict';
  var W = 720, H = 600;
  var BOMBER_Y = 96;
  var BUCKET_Y = [H - 112, H - 76, H - 40];
  var BW = 96, BH = 22;

  // Each group is faster and worth more than the last.
  var GROUPS = [
    { n: 'WARM-UP', bombs: 10, fall: 190, rate: 1.05, sweep: 120, pts: 1 },
    { n: 'BRISK', bombs: 20, fall: 235, rate: 0.82, sweep: 155, pts: 2 },
    { n: 'HASTY', bombs: 30, fall: 280, rate: 0.66, sweep: 190, pts: 3 },
    { n: 'FRANTIC', bombs: 40, fall: 325, rate: 0.54, sweep: 225, pts: 4 },
    { n: 'RABID', bombs: 50, fall: 370, rate: 0.45, sweep: 262, pts: 5 },
    { n: 'MANIC', bombs: 75, fall: 415, rate: 0.38, sweep: 300, pts: 6 },
    { n: 'UNHINGED', bombs: 100, fall: 460, rate: 0.32, sweep: 340, pts: 7 },
    { n: 'MELTDOWN', bombs: 150, fall: 505, rate: 0.27, sweep: 380, pts: 8 }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function group(d) { return GROUPS[Math.min(GROUPS.length - 1, d.group)]; }

    function burst(d, x, y, col, n, spd) {
      for (var i = 0; i < (n || 16); i++) {
        var a = Math.random() * 6.283, s = U.rand(50, spd || 300);
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 80,
          life: U.rand(.3, .8), max: .8, col: col, r: U.rand(2, 4.6)
        });
      }
    }

    function say(d, t) { d.msg = t; d.msgT = 1.6; }
    function award(g, n) { g.score += n; g.set('Score', U.fmt(g.score)); }

    function reset(g) {
      var d = g.data;
      d.group = 0;
      d.caught = 0;           // caught within the current group
      d.buckets = 3;
      d.x = W / 2;
      d.bomber = { x: W / 2, dir: 1, target: W / 2, rage: 0, laugh: 0 };
      d.bombs = [];
      d.parts = [];
      d.dropT = 0.9;
      d.shake = 0;
      d.flash = 0;
      d.panic = 0;
      d.msg = '';
      d.msgT = 0;
      d.streak = 0;
      d.totalCaught = 0;
      g.score = 0;
      g.set('Score', 0);
      g.set('Buckets', 3);
      g.set('Group', GROUPS[0].n);
      g.set('Streak', 0);
    }

    function missed(g) {
      var d = g.data;
      if (d.panic > 0) return;
      d.panic = 1.5;
      d.shake = 26;
      d.flash = .6;
      d.streak = 0;
      g.set('Streak', 0);
      d.bombs.forEach(function (b) { burst(d, b.x, b.y, '#fb923c', 14, 340); });
      d.bombs = [];
      d.buckets--;
      g.set('Buckets', Math.max(0, d.buckets));
      Milo.sound.explode();
      d.bomber.laugh = 1.5;
      if (d.buckets <= 0) {
        g.gameOver({
          emo: '💣', title: 'Boom',
          text: 'You caught ' + U.fmt(d.totalCaught) + ' bombs before the bomber won.'
        });
      } else {
        say(d, 'BUCKET LOST — ' + d.buckets + ' LEFT');
      }
    }

    return Milo.arcade(host, {
      id: 'bomb-catcher',
      w: W, h: H, bg: '#1a0b33',
      stats: ['Score', 'Group', 'Streak', 'Buckets'],
      touch: 'dpad',
      emo: '💣',
      start: {
        title: 'Bomb Catcher',
        text: 'A bomber paces the roofline lobbing bombs into the yard. Slide your stack of ' +
          'buckets under every one — miss a single bomb and everything still in the air ' +
          'goes off, taking a bucket with it. Each group he throws is faster than the last.',
        keys: ['← → or mouse to slide the buckets']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input;
        d.shake = Math.max(0, d.shake - dt * 44);
        d.flash = Math.max(0, d.flash - dt * 1.6);
        d.msgT = Math.max(0, d.msgT - dt);
        d.bomber.laugh = Math.max(0, d.bomber.laugh - dt);

        d.parts = d.parts.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 520 * dt; q.life -= dt;
          return q.life > 0;
        });

        var G = group(d);

        /* -- buckets -- */
        var lean = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
        d.x += lean * 560 * dt;
        // pointer takes over while it is held down
        if (i.pdown) d.x = U.lerp(d.x, i.px, Math.min(1, dt * 22));
        d.x = U.clamp(d.x, BW / 2 + 6, W - BW / 2 - 6);

        if (d.panic > 0) {
          d.panic -= dt;
          if (d.panic <= 0) { d.dropT = 1.1; }
          return;
        }

        /* -- bomber pacing -- */
        var bm = d.bomber;
        if (Math.abs(bm.x - bm.target) < 12) {
          bm.target = U.rand(70, W - 70);
          bm.dir = bm.target > bm.x ? 1 : -1;
        }
        bm.x += bm.dir * G.sweep * dt;
        bm.x = U.clamp(bm.x, 60, W - 60);

        /* -- dropping -- */
        d.dropT -= dt;
        if (d.dropT <= 0) {
          d.dropT = G.rate * U.rand(.82, 1.18);
          d.bombs.push({ x: bm.x, y: BOMBER_Y + 22, spin: Math.random() * 6, fuse: Math.random() * 6 });
          Milo.sound.tone({ f: 420, f2: 300, d: .05, v: .04, type: 'square' });
        }

        /* -- bombs -- */
        d.bombs = d.bombs.filter(function (b) {
          b.y += G.fall * dt;
          b.spin += dt * 5;
          b.fuse += dt * 12;
          // caught if it enters any bucket's mouth while over the stack
          for (var k = 0; k < 3; k++) {
            if (k >= d.buckets) continue;
            var by = BUCKET_Y[2 - k];
            if (b.y > by - 6 && b.y < by + BH && Math.abs(b.x - d.x) < BW / 2 - 4) {
              d.caught++;
              d.totalCaught++;
              d.streak++;
              g.set('Streak', d.streak);
              var pts = G.pts * (1 + Math.floor(d.streak / 25));
              award(g, pts);
              for (var q = 0; q < 5; q++) {
                d.parts.push({
                  x: b.x + U.rand(-8, 8), y: by, vx: U.rand(-70, 70), vy: U.rand(-160, -60),
                  life: .3, max: .3, col: '#fde047', r: U.rand(1.4, 2.8)
                });
              }
              Milo.sound.tone({ f: 620 + Math.min(600, d.streak * 6), d: .04, v: .05, type: 'square' });
              return false;
            }
          }
          if (b.y > H - 14) { missed(g); return false; }
          return true;
        });

        /* -- group complete -- */
        if (d.caught >= G.bombs) {
          d.caught = 0;
          d.group++;
          var earned = 0;
          if (d.buckets < 3) { d.buckets++; g.set('Buckets', d.buckets); earned = 1; }
          award(g, 500 * d.group);
          g.set('Group', group(d).n);
          say(d, group(d).n + (earned ? '  —  BUCKET BACK!' : '  —  FASTER!'));
          Milo.sound.powerup();
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#3b1163');
        sky.addColorStop(.45, '#1f0b3d');
        sky.addColorStop(1, '#0d0520');
        c.fillStyle = sky; c.fillRect(-40, -40, W + 80, H + 80);

        // moon + skyline
        c.fillStyle = 'rgba(253,230,138,.85)';
        c.beginPath(); c.arc(W - 96, 62, 30, 0, 7); c.fill();
        c.fillStyle = 'rgba(59,17,99,.9)';
        c.beginPath(); c.arc(W - 84, 54, 26, 0, 7); c.fill();

        c.fillStyle = '#160932';
        for (var bx = -20; bx < W + 40; bx += 62) {
          var hgt = 90 + U.hash2(bx, 3, 21) * 130;
          c.fillRect(bx, H - hgt, 54, hgt);
          c.fillStyle = 'rgba(253,224,71,.16)';
          for (var wy = H - hgt + 14; wy < H - 26; wy += 26) {
            for (var wx = bx + 8; wx < bx + 46; wx += 16) {
              if (U.hash2(wx, wy, 5) > .55) c.fillRect(wx, wy, 8, 11);
            }
          }
          c.fillStyle = '#160932';
        }

        // rooftop ledge the bomber paces
        c.fillStyle = '#2a1354';
        c.fillRect(-20, BOMBER_Y + 22, W + 40, 12);
        c.fillStyle = '#4c1d95';
        c.fillRect(-20, BOMBER_Y + 22, W + 40, 4);

        // bomber
        var bm = d.bomber;
        c.save();
        c.translate(bm.x, BOMBER_Y);
        c.scale(bm.dir >= 0 ? 1 : -1, 1);
        var hop = Math.abs(Math.sin(g.t * 7)) * (d.bomber.laugh > 0 ? 7 : 3);
        c.translate(0, -hop);
        // cloak
        c.fillStyle = '#111827';
        c.beginPath();
        c.moveTo(-16, -6); c.lineTo(16, -6); c.lineTo(22, 22); c.lineTo(-22, 22);
        c.closePath(); c.fill();
        c.fillStyle = '#7f1d1d';
        c.beginPath();
        c.moveTo(-14, -4); c.lineTo(14, -4); c.lineTo(18, 20); c.lineTo(-18, 20);
        c.closePath(); c.fill();
        // head
        c.fillStyle = '#fcd9b6';
        c.beginPath(); c.arc(0, -16, 11, 0, 7); c.fill();
        // wild hair
        c.strokeStyle = '#e5e7eb'; c.lineWidth = 3; c.lineCap = 'round';
        for (var hstr = -3; hstr <= 3; hstr++) {
          c.beginPath();
          c.moveTo(hstr * 3, -24);
          c.lineTo(hstr * 5.5, -34 - Math.abs(Math.sin(g.t * 6 + hstr)) * 5);
          c.stroke();
        }
        c.fillStyle = '#111827';
        c.beginPath(); c.arc(-4, -18, 2.1, 0, 7); c.arc(5, -18, 2.1, 0, 7); c.fill();
        c.strokeStyle = '#111827'; c.lineWidth = 2;
        c.beginPath();
        if (d.bomber.laugh > 0) { c.arc(1, -11, 5, 0, Math.PI); }
        else { c.moveTo(-4, -10); c.lineTo(6, -12); }
        c.stroke();
        // throwing arm
        c.strokeStyle = '#fcd9b6'; c.lineWidth = 5;
        var swing = Math.sin(g.t * 9) * .5;
        c.beginPath(); c.moveTo(10, -2); c.lineTo(20 + swing * 6, -12 - swing * 8); c.stroke();
        c.restore();

        // bombs
        d.bombs.forEach(function (b) {
          c.save(); c.translate(b.x, b.y); c.rotate(Math.sin(b.spin) * .4);
          c.fillStyle = '#0f172a';
          c.beginPath(); c.arc(0, 0, 11, 0, 7); c.fill();
          c.fillStyle = '#334155';
          c.beginPath(); c.arc(-3.5, -3.5, 3.6, 0, 7); c.fill();
          c.fillStyle = '#475569';
          c.fillRect(-3, -14, 6, 5);
          c.strokeStyle = '#94a3b8'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(0, -14); c.quadraticCurveTo(7, -20, 3, -25); c.stroke();
          var sp = 3 + Math.sin(b.fuse) * 1.6;
          c.fillStyle = '#fde047';
          c.beginPath(); c.arc(3, -26, sp, 0, 7); c.fill();
          c.fillStyle = '#fb923c';
          c.beginPath(); c.arc(3, -26, sp * .55, 0, 7); c.fill();
          c.restore();
        });

        // buckets (bottom of the stack is the last one you lose)
        for (var k = 0; k < d.buckets; k++) {
          var by = BUCKET_Y[2 - k];
          var col = ['#22d3ee', '#a3e635', '#fb923c'][k % 3];
          c.save();
          c.translate(d.x, by);
          c.fillStyle = U.shade(col, -.45);
          c.beginPath();
          c.moveTo(-BW / 2, 0); c.lineTo(BW / 2, 0);
          c.lineTo(BW / 2 - 12, BH); c.lineTo(-BW / 2 + 12, BH);
          c.closePath(); c.fill();
          c.fillStyle = col;
          U.roundRect(c, -BW / 2, -5, BW, 9, 4); c.fill();
          c.fillStyle = 'rgba(255,255,255,.35)';
          U.roundRect(c, -BW / 2 + 4, -3.5, BW - 8, 3, 1.5); c.fill();
          c.fillStyle = 'rgba(0,0,0,.35)';
          c.fillRect(-BW / 2 + 14, 5, BW - 28, 3);
          c.restore();
        }
        // catcher underneath
        c.fillStyle = '#e2e8f0';
        c.beginPath(); c.arc(d.x, H - 20, 9, 0, 7); c.fill();
        c.fillStyle = '#0f172a';
        c.beginPath(); c.arc(d.x - 3, H - 21, 1.8, 0, 7); c.arc(d.x + 3, H - 21, 1.8, 0, 7); c.fill();

        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.beginPath(); c.arc(q.x, q.y, q.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;
        c.restore();

        // group progress bar
        var G = GROUPS[Math.min(GROUPS.length - 1, d.group)];
        var frac = U.clamp(d.caught / G.bombs, 0, 1);
        c.fillStyle = 'rgba(15,5,32,.7)';
        U.roundRect(c, W / 2 - 110, 16, 220, 16, 8); c.fill();
        c.fillStyle = '#a3e635';
        U.roundRect(c, W / 2 - 107, 19, 214 * frac, 10, 5); c.fill();
        c.fillStyle = '#e2e8f0';
        c.font = '700 11px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(d.caught + ' / ' + G.bombs, W / 2, 44);

        if (d.msgT > 0) {
          c.globalAlpha = Math.min(1, d.msgT);
          c.fillStyle = '#fde047';
          c.font = '800 28px Outfit, sans-serif';
          c.fillText(d.msg, W / 2, H / 2 - 60);
          c.globalAlpha = 1;
        }
        c.textAlign = 'left';

        if (d.flash > 0) {
          c.fillStyle = 'rgba(251,146,60,' + U.clamp(d.flash * .6, 0, .75) + ')';
          c.fillRect(0, 0, W, H);
        }
      }
    });
  }

  window.Milo.register({
    id: 'bomb-catcher',
    title: 'Bomb Catcher',
    emo: '💣',
    category: 'Arcade',
    tagline: 'Catch every bomb — one miss sets off the rest',
    description: 'A grinning bomber paces the roofline and lobs bombs into the yard, and you ' +
      'slide a stack of three buckets under all of them. Miss one and everything still ' +
      'falling detonates at once, costing you a bucket. Eight groups get faster and worth ' +
      'more — from 10 lazy bombs at one point each to 150 at eight — and finishing a group ' +
      'hands a lost bucket back. Every 25 caught in a row raises the multiplier.',
    controls: ['← →', 'Mouse', 'Drag'],
    colors: ['#3b1163', '#fde047'],
    tags: ['classic', 'reflex', 'arcade', 'catching', 'high score'],
    mount: mount
  });
})();
