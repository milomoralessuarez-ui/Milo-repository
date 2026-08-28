/* Blob Volleyball — two wobbling blobs, one net, first to 15 on the sand. */
(function () {
  'use strict';
  var W = 800, H = 520, TAU = Math.PI * 2;
  var GY = 452;                       // sand line
  var NETX = W / 2, NETTOP = GY - 128, NETW = 8;
  var BR = 42, BALLR = 13;
  var TARGET = 15;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.you = 0; d.cpu = 0;
      d.rally = 0; d.bestRally = 0;
      d.p = { x: 200, y: GY, vx: 0, vy: 0, sq: 1 };
      d.a = { x: 600, y: GY, vx: 0, vy: 0, sq: 1 };
      d.aiJumpT = 0;
      d.ball = { x: 200, y: 140, vx: 0, vy: 0, held: 1.1 };
      d.server = 'you';
      d.pointT = 0;
      d.ending = false;
      d.msg = '';
      d.trail = [];
      d.parts = [];
      d.floats = [];
      d.gulls = [
        { x: 120, y: 70, s: 22 }, { x: 560, y: 46, s: 14 }, { x: 660, y: 96, s: 18 }
      ];
      g.set('You', 0);
      g.set('CPU', 0);
      g.set('Rally', 0);
    }

    function serve(d, who) {
      d.server = who;
      d.rally = 0;
      d.ball = { x: who === 'you' ? 200 : 600, y: 130, vx: 0, vy: 0, held: 1.0 };
      d.trail = [];
    }

    function puff(d, x, y, n, col) {
      for (var i = 0; i < n; i++) {
        d.parts.push({
          x: x + U.rand(-8, 8), y: y, vx: U.rand(-130, 130), vy: U.rand(-190, -40),
          t: U.rand(.3, .6), max: .6, col: col || U.choice(['#f2dcae', '#e8cf9b', '#fff'])
        });
      }
    }

    function point(g, who, why) {
      var d = g.data;
      if (who === 'you') { d.you++; Milo.sound.coin(); }
      else { d.cpu++; Milo.sound.hit(); }
      g.set('You', d.you);
      g.set('CPU', d.cpu);
      d.bestRally = Math.max(d.bestRally, d.rally);
      d.floats.push({
        x: d.ball.x, y: d.ball.y - 30,
        txt: who === 'you' ? '+1 YOU' : '+1 CPU',
        col: who === 'you' ? '#4ade80' : '#fb7185', t: 1.3
      });
      puff(d, d.ball.x, GY, 14);
      d.msg = why;
      d.pointT = 1.2;
      g.score = d.you * 100 + d.bestRally * 10;
      g.set('Rally', d.rally);

      if (d.you >= TARGET || d.cpu >= TARGET) {
        d.pointT = .8;
        d.ending = true;
      } else {
        serve(g.data, who);
      }
    }

    /** Circle bounce off a blob's dome. Returns true when it connected. */
    function blobHit(d, blob, isYou) {
      var b = d.ball;
      var dx = b.x - blob.x, dy = b.y - (blob.y - 6);
      var dist = Math.hypot(dx, dy);
      if (dist > BR + BALLR || dy > 8) return false;
      var nx = dx / (dist || 1), ny = dy / (dist || 1);
      // Push the ball out of the blob, then reflect + inherit blob motion.
      b.x = blob.x + nx * (BR + BALLR + 1);
      b.y = (blob.y - 6) + ny * (BR + BALLR + 1);
      var dot = b.vx * nx + b.vy * ny;
      if (dot < 0) { b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; }
      b.vx = b.vx * .55 + nx * 260 + blob.vx * .55;
      b.vy = b.vy * .55 + ny * 260 + blob.vy * .5;
      // Always leave with some lift and pace; pace grows with the score.
      var pace = 430 + (d.you + d.cpu) * 9;
      if (b.vy > -180) b.vy = -180 - Math.abs(b.vx) * .1;
      var sp = Math.hypot(b.vx, b.vy);
      if (sp > pace) { b.vx *= pace / sp; b.vy *= pace / sp; }
      if (sp < 300) { b.vx *= 300 / (sp || 1); b.vy *= 300 / (sp || 1); }
      blob.sq = .72;
      d.rally++;
      g_set_rally(d);
      Milo.sound.tone({ f: isYou ? 520 : 420, f2: 300, d: .07, v: .09, type: 'square' });
      return true;
    }

    var gref = null;
    function g_set_rally(d) { if (gref) gref.set('Rally', d.rally); }

    return Milo.arcade(host, {
      id: 'volleyball-blobs',
      w: W, h: H, bg: '#ffb98a',
      stats: ['You', 'CPU', 'Rally'],
      touch: 'dpad',
      emo: '🏐',
      start: {
        title: 'Blob Volleyball',
        text: 'One-on-one on the evening sand, first to ' + TARGET + '. The ball takes ' +
          'your blob’s motion with it — rise into it at the net to spike, and the ' +
          'rallies only get faster as the score climbs.',
        keys: ['← → move', '↑ jump']
      },
      init: function (g) { gref = g; reset(g); },

      update: function (g, dt) {
        var d = g.data, inp = g.input;

        // Blob squash recovery + gulls drift always.
        d.p.sq += (1 - d.p.sq) * Math.min(1, dt * 8);
        d.a.sq += (1 - d.a.sq) * Math.min(1, dt * 8);
        d.gulls.forEach(function (gl) {
          gl.x += dt * 14;
          if (gl.x > W + 30) gl.x = -30;
        });

        if (d.pointT > 0) {
          d.pointT -= dt;
          if (d.pointT <= 0) {
            d.msg = '';
            if (d.ending) {
              var won = d.you >= TARGET;
              var sc = d.you * 100 + d.bestRally * 10 + (won ? 500 + (TARGET - d.cpu) * 40 : 0);
              if (won) g.win({ emo: '🏐', title: 'You take the set ' + d.you + '–' + d.cpu, text: 'Longest rally: ' + d.bestRally + ' touches.', score: sc });
              else g.gameOver({ emo: '🏐', title: 'Lost ' + d.you + '–' + d.cpu, text: 'Longest rally: ' + d.bestRally + ' touches.', score: sc });
              return;
            }
          }
        }

        // ---- your blob ----
        var mx = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
        if (inp.pdown) {
          if (inp.py < H * .45 && d.p.y >= GY) { inp.set('up', true); }
          mx = inp.px < d.p.x - 20 ? -1 : inp.px > d.p.x + 20 ? 1 : 0;
        }
        d.p.vx = mx * 330;
        d.p.x = U.clamp(d.p.x + d.p.vx * dt, BR, NETX - NETW / 2 - BR + 6);
        if ((inp.pressed('up') || inp.pressed('action')) && d.p.y >= GY) {
          d.p.vy = -660;
          d.p.sq = 1.3;
          Milo.sound.jump();
          puff(d, d.p.x, GY, 4);
        }
        d.p.vy += 1500 * dt;
        d.p.y += d.p.vy * dt;
        if (d.p.y > GY) {
          if (d.p.vy > 300) { d.p.sq = .7; puff(d, d.p.x, GY, 3); }
          d.p.y = GY; d.p.vy = 0;
        }

        // ---- AI blob ----
        var b = d.ball;
        var skill = U.clamp(.55 + d.you * .05 + (d.you + d.cpu) * .012, .55, 1.15);
        var targetX = 600;
        if (b.held) {
          targetX = d.server === 'ai' ? b.x : 600;
        } else if (b.x > NETX - 60 || b.vx > 0) {
          // Predict the landing spot with a skill-sized error.
          var tHit = (b.vy + Math.sqrt(Math.max(0, b.vy * b.vy + 2 * 820 * (GY - 40 - b.y)))) / 820;
          var lx = b.x + b.vx * tHit * U.clamp(skill, 0, 1);
          targetX = U.clamp(lx + Math.sin(g.t * 3) * (46 - skill * 34), NETX + NETW / 2 + BR - 6, W - BR);
        } else targetX = 620;
        var adx = targetX - d.a.x;
        d.a.vx = U.clamp(adx * 8, -1, 1) * (250 + skill * 130);
        if (Math.abs(adx) < 8) d.a.vx = 0;
        d.a.x = U.clamp(d.a.x + d.a.vx * dt, NETX + NETW / 2 + BR - 6, W - BR);
        d.aiJumpT -= dt;
        var ballComing = !b.held && b.x > NETX - 40 && b.y < GY - 60 &&
          Math.abs(b.x - d.a.x) < 130 && b.y > 120;
        if (ballComing && d.a.y >= GY && d.aiJumpT <= 0 && Math.random() < skill * .09) {
          d.a.vy = -660; d.a.sq = 1.3; d.aiJumpT = .8;
        }
        d.a.vy += 1500 * dt;
        d.a.y += d.a.vy * dt;
        if (d.a.y > GY) { d.a.y = GY; d.a.vy = 0; }

        // ---- ball ----
        if (d.pointT > 0) return;
        if (b.held) {
          b.held -= dt;
          b.x += ((d.server === 'you' ? 200 : 600) - b.x) * dt * 4;
          b.y = 130 + Math.sin(g.t * 4) * 6;
          if (b.held <= 0) { b.vx = 0; b.vy = 40; Milo.sound.blip(); }
          return;
        }

        b.vy += 820 * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        d.trail.push({ x: b.x, y: b.y, t: .28 });
        if (d.trail.length > 16) d.trail.shift();
        d.trail.forEach(function (p) { p.t -= dt; });

        // Walls.
        if (b.x < BALLR) { b.x = BALLR; b.vx = Math.abs(b.vx) * .85; }
        if (b.x > W - BALLR) { b.x = W - BALLR; b.vx = -Math.abs(b.vx) * .85; }
        if (b.y < BALLR + 4) { b.y = BALLR + 4; b.vy = Math.abs(b.vy) * .8; }

        // Net: post sides + a rounded top.
        if (b.y > NETTOP && Math.abs(b.x - NETX) < NETW / 2 + BALLR) {
          b.vx = (b.x < NETX ? -1 : 1) * Math.max(120, Math.abs(b.vx) * .8);
          b.x = NETX + (b.x < NETX ? -1 : 1) * (NETW / 2 + BALLR + 1);
          Milo.sound.click();
        } else {
          var ndx = b.x - NETX, ndy = b.y - NETTOP;
          if (Math.hypot(ndx, ndy) < BALLR + NETW / 2 + 2 && b.vy > -40) {
            var nn = Math.hypot(ndx, ndy) || 1;
            b.vx = ndx / nn * 240 + b.vx * .3;
            b.vy = -Math.abs(b.vy) * .5 - 80;
            Milo.sound.click();
          }
        }

        // Blob contact.
        blobHit(d, d.p, true) || blobHit(d, d.a, false);

        // Sand.
        if (b.y > GY - 4) {
          point(g, b.x < NETX ? 'cpu' : 'you',
            b.x < NETX ? 'It dropped on your sand!' : 'It lands on their side!');
          return;
        }

        // FX bookkeeping.
        for (var pi = d.parts.length - 1; pi >= 0; pi--) {
          var p = d.parts[pi];
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.t -= dt;
          if (p.t <= 0) d.parts.splice(pi, 1);
        }
        for (pi = d.floats.length - 1; pi >= 0; pi--) {
          d.floats[pi].t -= dt;
          if (d.floats[pi].t <= 0) d.floats.splice(pi, 1);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;

        // Golden-hour sky over a flat sea.
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#ff9e6d');
        sky.addColorStop(.45, '#ffc48a');
        sky.addColorStop(.62, '#ffe1ad');
        sky.addColorStop(.63, '#2e8bb5');
        sky.addColorStop(.78, '#1e6f96');
        sky.addColorStop(.79, '#f2dcae');
        sky.addColorStop(1, '#dabf85');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        // Sun + glitter path.
        c.fillStyle = '#fff3d6';
        c.beginPath(); c.arc(620, H * .52, 46, Math.PI, TAU); c.fill();
        c.fillStyle = 'rgba(255,243,214,.4)';
        for (var sh = 0; sh < 7; sh++) {
          c.fillRect(596 + Math.sin(g.t * 2 + sh) * 12, H * .63 + sh * 10, 48 - sh * 4, 3);
        }
        // Gulls.
        c.strokeStyle = 'rgba(90,60,50,.7)'; c.lineWidth = 2; c.lineCap = 'round';
        d.gulls.forEach(function (gl) {
          var f = Math.sin(g.t * 6 + gl.x) * 4;
          c.beginPath();
          c.moveTo(gl.x - gl.s / 2, gl.y - f);
          c.quadraticCurveTo(gl.x, gl.y + 3, gl.x + gl.s / 2, gl.y - f);
          c.stroke();
        });

        // Sand grain + court boundary.
        c.fillStyle = 'rgba(120,90,50,.16)';
        for (var gr = 0; gr < 60; gr++) {
          c.fillRect((gr * 173) % W, GY + 8 + (gr * 89) % 50, 3, 2);
        }
        c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(20, GY + 2); c.lineTo(W - 20, GY + 2); c.stroke();

        // Net.
        c.fillStyle = '#7a4a2b';
        c.fillRect(NETX - NETW / 2, NETTOP, NETW, GY - NETTOP);
        c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2;
        c.strokeRect(NETX - NETW / 2 - 1, NETTOP - 4, NETW + 2, 10);
        c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1;
        for (var ny = NETTOP + 14; ny < GY; ny += 13) {
          c.beginPath(); c.moveTo(NETX - NETW / 2, ny); c.lineTo(NETX + NETW / 2, ny); c.stroke();
        }

        // Ball trail.
        d.trail.forEach(function (p) {
          if (p.t <= 0) return;
          c.globalAlpha = p.t * 1.6;
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(p.x, p.y, BALLR * p.t * 2.2, 0, TAU); c.fill();
        });
        c.globalAlpha = 1;

        // Blobs.
        blobDraw(c, d.p, '#e0435c', '#8f1f33', d.ball, false);
        blobDraw(c, d.a, '#6d5bd0', '#3c2f8f', d.ball, true);

        // Ball with panels.
        var b = d.ball;
        c.fillStyle = 'rgba(90,60,30,.25)';
        c.beginPath();
        c.ellipse(b.x, GY + 6, BALLR * U.clamp(1.6 - (GY - b.y) / 300, .4, 1.4), 4, 0, 0, TAU);
        c.fill();
        c.fillStyle = '#fffdf5';
        c.beginPath(); c.arc(b.x, b.y, BALLR, 0, TAU); c.fill();
        c.strokeStyle = '#e0435c'; c.lineWidth = 2.5;
        var ra = b.x * .04;
        c.beginPath(); c.arc(b.x, b.y, BALLR - 1.5, ra, ra + 2.2); c.stroke();
        c.strokeStyle = '#f0a832';
        c.beginPath(); c.arc(b.x, b.y, BALLR - 1.5, ra + 3, ra + 5.2); c.stroke();

        // Sand puffs + floats.
        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.t / p.max);
          c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, 3.2, 0, TAU); c.fill();
        });
        c.globalAlpha = 1;
        c.textAlign = 'center';
        c.font = '800 19px Outfit, sans-serif';
        d.floats.forEach(function (f) {
          c.globalAlpha = Math.min(1, f.t);
          c.fillStyle = f.col;
          c.fillText(f.txt, f.x, f.y - (1.3 - f.t) * 34);
        });
        c.globalAlpha = 1;

        // Big score, beach-sign style.
        c.fillStyle = 'rgba(70,35,20,.5)';
        U.roundRect(c, W / 2 - 78, 14, 156, 44, 12); c.fill();
        c.fillStyle = '#ffe9c9';
        c.font = '800 27px Outfit, sans-serif';
        c.fillText(d.you + ' · ' + d.cpu, W / 2, 45);

        if (d.msg && d.pointT > 0) {
          c.fillStyle = '#5b2b1a';
          c.font = '800 21px Outfit, sans-serif';
          c.fillText(d.msg, W / 2, 96);
        }
        if (d.ball.held && d.pointT <= 0) {
          c.fillStyle = 'rgba(91,43,26,.75)';
          c.font = '700 15px Outfit, sans-serif';
          c.fillText((d.server === 'you' ? 'Your' : 'Their') + ' serve…', W / 2, 96);
        }
      }
    });

    function blobDraw(c, blob, col, dark, ball, flip) {
      var squash = blob.sq;
      c.save();
      c.translate(blob.x, blob.y);
      c.scale(2 - squash, squash);
      // Dome body.
      c.fillStyle = 'rgba(90,60,30,.25)';
      c.beginPath(); c.ellipse(0, 2, BR * 1.05, 6, 0, 0, TAU); c.fill();
      var gradB = c.createLinearGradient(0, -BR, 0, 0);
      gradB.addColorStop(0, col);
      gradB.addColorStop(1, dark);
      c.fillStyle = gradB;
      c.beginPath(); c.arc(0, 0, BR, Math.PI, TAU); c.lineTo(BR, 0); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,.25)';
      c.beginPath(); c.arc(-BR * .35, -BR * .55, BR * .22, 0, TAU); c.fill();
      c.restore();
      // Eyes track the ball (outside the squash transform so they stay round).
      var ex = blob.x + (flip ? -12 : 12), ey = blob.y - BR * .62 * squash;
      var ang = Math.atan2(ball.y - ey, ball.x - ex);
      [0, flip ? -17 : 17].forEach(function (off) {
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(ex + off, ey, 7.5, 0, TAU); c.fill();
        c.fillStyle = '#241d3a';
        c.beginPath();
        c.arc(ex + off + Math.cos(ang) * 3.4, ey + Math.sin(ang) * 3.4, 3.6, 0, TAU);
        c.fill();
      });
    }
  }

  window.Milo.register({
    id: 'volleyball-blobs', title: 'Blob Volleyball', emo: '🏐', category: 'Sports',
    tagline: 'Bouncy one-on-one, first to 15',
    description: 'One-on-one volleyball between two wobbling blobs on an evening beach, ' +
      'first to 15. The ball inherits your blob’s motion, so the spike is all timing: ' +
      'rise into the ball at the net and it comes down steep on the far side. Every point ' +
      'played makes the ball a little faster, and the purple blob reads your landings ' +
      'better the more you score — long rallies also pay a bonus at the end.',
    controls: ['← → move', '↑ jump'],
    colors: ['#ff9e6d', '#6d5bd0'],
    tags: ['volleyball', 'blob', 'vs cpu', 'beach', 'jumping'],
    mount: mount
  });
})();
