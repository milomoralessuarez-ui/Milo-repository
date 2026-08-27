/* Wall Jumper — kick between two walls, climb past the sliding spikes. */
(function () {
  'use strict';
  var W = 480, H = 720, WL = 96, WR = 384;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.p = { x: WL + 13, y: H - 160, vx: 0, vy: 0, side: -1, air: false, rot: 0 };
      d.startY = d.p.y;
      d.topM = 0;
      d.camY = 0;
      d.spikes = [];
      d.gems = [];
      d.gemN = 0;
      d.nextSp = H - 420;
      d.parts = [];
      d.texts = [];
      d.shake = 0;
      d.dead = false;
      d.dieT = 0;
      g.set('Height', 0);
      g.set('Gems', 0);
      g.set('Best', U.fmt(g.best));
    }

    function metres(d) { return Math.max(0, Math.floor((d.startY - d.p.y) / 14)); }

    function spawnBand(d) {
      var m = d.topM;
      var side = Math.random() < .5 ? -1 : 1;
      var slider = Math.random() < Math.min(.45, .08 + m * .002);
      d.spikes.push({
        side: side, y: d.nextSp,
        vy: slider ? U.rand(46, 96) + Math.min(70, m * .3) : 0,
        slider: slider
      });
      // sometimes a matching spike on the other wall, offset
      if (Math.random() < Math.min(.4, .05 + m * .0018)) {
        d.spikes.push({ side: -side, y: d.nextSp - U.rand(60, 130), vy: 0, slider: false });
      }
      if (Math.random() < .3) {
        d.gems.push({ x: U.rand(180, 300), y: d.nextSp - U.rand(20, 80), taken: false });
      }
      d.nextSp -= Math.max(130, 260 - m * .9) * U.rand(.85, 1.2);
    }

    function jump(g) {
      var d = g.data, p = d.p;
      if (d.dead || p.air) return;
      p.air = true;
      p.vx = -p.side * 640;
      p.vy = -560;
      Milo.sound.jump();
      for (var k = 0; k < 7; k++) {
        d.parts.push({
          x: p.x, y: p.y + U.rand(-10, 10),
          vx: p.side * U.rand(40, 140), vy: U.rand(-60, 60),
          life: .3, max: .3, col: '#a3e635'
        });
      }
    }

    function die(g, why) {
      var d = g.data;
      d.dead = true;
      d.dieT = .8;
      d.why = why;
      d.shake = 12;
      for (var k = 0; k < 24; k++) {
        var a = Math.random() * 6.283, s = U.rand(60, 320);
        d.parts.push({
          x: d.p.x, y: d.p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: U.rand(.4, .8), max: .8,
          col: Math.random() < .5 ? '#a3e635' : '#fb923c'
        });
      }
      Milo.sound.explode();
    }

    return Milo.arcade(host, {
      id: 'wall-jumper',
      w: W, h: H, bg: '#07131c',
      stats: ['Height', 'Gems', 'Best'],
      touchButtons: [{ key: 'action', label: 'JUMP' }],
      emo: '🧗',
      start: {
        title: 'Wall Jumper',
        text: 'You slip slowly down whichever wall you cling to. Tap to kick across ' +
          'to the other wall — every crossing gains height. Dodge the spikes, ' +
          'especially the red ones sliding down to meet you.',
        keys: ['Click / Space / Tap']
      },
      init: reset,
      onPointer: function (g, type) { if (type === 'down') jump(g); },
      onKey: function (g, e) { if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') jump(g); },

      update: function (g, dt) {
        var d = g.data, p = d.p, k;
        d.shake = Math.max(0, d.shake - dt * 40);

        if (d.dead) {
          d.dieT -= dt;
          cool(d, dt);
          if (d.dieT <= 0) {
            g.gameOver({
              text: (d.why === 'fall' ? 'You slipped off the bottom at ' : 'Spiked at ') +
                U.fmt(d.topM) + ' m, with ' + d.gemN + ' gem' + (d.gemN === 1 ? '' : 's') + '.'
            });
          }
          return;
        }

        if (g.input.pressed('action')) jump(g);

        var m = d.topM;
        if (p.air) {
          p.vy += 1300 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += -p.side * 9 * dt;
          if (p.vx < 0 && p.x <= WL + 13) {
            p.x = WL + 13; p.side = -1; p.air = false; p.rot = 0; land(d, p);
          } else if (p.vx > 0 && p.x >= WR - 13) {
            p.x = WR - 13; p.side = 1; p.air = false; p.rot = 0; land(d, p);
          }
        } else {
          p.y += (60 + Math.min(130, m * .55)) * dt;
          if (Math.random() < .3) {
            d.parts.push({
              x: p.x + p.side * 12, y: p.y - 8, vx: -p.side * U.rand(10, 40), vy: U.rand(-30, 10),
              life: .25, max: .25, col: 'rgba(163,230,53,.7)'
            });
          }
        }

        // camera rises only
        var target = p.y - H * .55;
        if (target < d.camY) d.camY += (target - d.camY) * Math.min(1, 8 * dt);

        var mm = metres(d);
        if (mm > d.topM) {
          d.topM = mm;
          g.score = d.topM + d.gemN * 25;
          g.set('Height', U.fmt(d.topM));
        }

        // keep spikes stocked above the camera
        while (d.nextSp > d.camY - 300) spawnBand(d);

        for (k = d.spikes.length - 1; k >= 0; k--) {
          var s = d.spikes[k];
          s.y += s.vy * dt;
          if (s.y > d.camY + H + 90) { d.spikes.splice(k, 1); continue; }
          var sx = s.side === -1 ? WL : WR - 30;
          if (p.x + 12 > sx && p.x - 12 < sx + 30 && Math.abs(p.y - s.y) < 29) {
            die(g, 'spike');
            return;
          }
        }

        for (k = d.gems.length - 1; k >= 0; k--) {
          var gm = d.gems[k];
          if (gm.y > d.camY + H + 60) { d.gems.splice(k, 1); continue; }
          if (!gm.taken && U.dist(p.x, p.y, gm.x, gm.y) < 28) {
            gm.taken = true;
            d.gemN++;
            g.set('Gems', d.gemN);
            g.score = d.topM + d.gemN * 25;
            d.texts.push({ x: gm.x, y: gm.y - 16, t: '+25', life: .7, max: .7 });
            Milo.sound.coin();
          }
        }

        if (p.y - d.camY > H + 30) { die(g, 'fall'); return; }
        cool(d, dt);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p, k;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0d2431'); bg.addColorStop(1, '#07131c');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));
        c.translate(0, -d.camY);

        // walls with brick shading
        var top = d.camY - 20, bot = d.camY + H + 20;
        c.fillStyle = '#14323f';
        c.fillRect(0, top, WL, H + 40);
        c.fillRect(WR, top, W - WR, H + 40);
        var row0 = Math.floor(top / 34);
        for (var r = row0; r * 34 < bot; r++) {
          for (var side = 0; side < 2; side++) {
            for (var bcol = 0; bcol < 2; bcol++) {
              var h2 = U.hash2(bcol + side * 5, r, 23);
              if (h2 < .45) continue;
              c.fillStyle = 'rgba(255,255,255,' + (h2 * .05) + ')';
              var bx = side === 0 ? bcol * 46 : WR + 4 + bcol * 46;
              c.fillRect(bx + 4, r * 34 + 3, 40, 28);
            }
          }
        }
        // inner face glow
        c.fillStyle = 'rgba(163,230,53,.35)';
        c.fillRect(WL - 2, top, 2, H + 40);
        c.fillRect(WR, top, 2, H + 40);

        // height markers
        var mk0 = Math.ceil((d.startY - (d.camY + H)) / 14 / 50) * 50;
        for (var mkm = Math.max(50, mk0); ; mkm += 50) {
          var my = d.startY - mkm * 14;
          if (my < d.camY - 20) break;
          c.strokeStyle = 'rgba(148,196,222,.16)';
          c.setLineDash([8, 10]); c.lineWidth = 1.5;
          c.beginPath(); c.moveTo(WL + 4, my); c.lineTo(WR - 4, my); c.stroke();
          c.setLineDash([]);
          c.fillStyle = 'rgba(148,196,222,.4)';
          c.font = '700 12px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(mkm + 'm', W / 2, my - 6);
        }

        // spikes
        for (k = 0; k < d.spikes.length; k++) {
          var s = d.spikes[k];
          if (s.y < d.camY - 60 || s.y > d.camY + H + 60) continue;
          var face = s.side === -1 ? WL : WR;
          var dirx = s.side === -1 ? 1 : -1;
          var col = s.slider ? '#f43f5e' : '#fb923c';
          if (s.slider) {
            c.globalAlpha = .3;
            c.fillStyle = col;
            c.beginPath();
            c.moveTo(face, s.y - 44); c.lineTo(face + dirx * 18, s.y - 30); c.lineTo(face, s.y - 16);
            c.closePath(); c.fill();
            c.globalAlpha = 1;
          }
          c.shadowColor = col; c.shadowBlur = 10;
          c.fillStyle = col;
          c.beginPath();
          c.moveTo(face, s.y - 22);
          c.lineTo(face + dirx * 30, s.y);
          c.lineTo(face, s.y + 22);
          c.closePath(); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = 'rgba(255,255,255,.3)';
          c.beginPath();
          c.moveTo(face, s.y - 18); c.lineTo(face + dirx * 20, s.y - 2); c.lineTo(face, s.y - 8);
          c.closePath(); c.fill();
        }

        // gems
        for (k = 0; k < d.gems.length; k++) {
          var gm = d.gems[k];
          if (gm.taken || gm.y < d.camY - 40 || gm.y > d.camY + H + 40) continue;
          c.save();
          c.translate(gm.x, gm.y);
          c.rotate(g.t * 2);
          c.shadowColor = '#67e8f9'; c.shadowBlur = 12;
          c.fillStyle = '#67e8f9';
          c.fillRect(-8, -8, 16, 16);
          c.shadowBlur = 0;
          c.fillStyle = 'rgba(255,255,255,.5)';
          c.fillRect(-8, -8, 8, 8);
          c.restore();
        }

        // particles
        for (k = 0; k < d.parts.length; k++) {
          var q = d.parts[k];
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.fillRect(q.x - 2.5, q.y - 2.5, 5, 5);
        }
        c.globalAlpha = 1;

        // player
        if (!d.dead) {
          c.save();
          c.translate(p.x, p.y);
          c.rotate(p.air ? p.rot : 0);
          var sq = p.air ? U.clamp(1 + p.vy / 3200, .82, 1.18) : 1;
          c.scale(1 / sq, sq);
          c.shadowColor = '#a3e635'; c.shadowBlur = 16;
          c.fillStyle = '#a3e635';
          U.roundRect(c, -13, -13, 26, 26, 7); c.fill();
          c.shadowBlur = 0;
          var look = p.air ? (p.vx > 0 ? 1 : -1) : -p.side;
          c.fillStyle = '#12300a';
          c.beginPath();
          c.arc(look * 4 - 3, -3, 2.6, 0, 7);
          c.arc(look * 4 + 4, -3, 2.6, 0, 7);
          c.fill();
          c.fillRect(look * 4 - 3, 4, 8, 2.5);
          c.restore();
        }

        // floating texts
        c.font = '800 15px Outfit, sans-serif';
        c.textAlign = 'center';
        for (k = 0; k < d.texts.length; k++) {
          var t = d.texts[k];
          c.globalAlpha = Math.max(0, t.life / t.max);
          c.fillStyle = '#67e8f9';
          c.fillText(t.t, t.x, t.y);
        }
        c.globalAlpha = 1;
        c.restore();
      }
    });

    function land(d, p) {
      p.vy = 0; p.vx = 0;
      Milo.sound.tone({ f: 240, f2: 180, d: .05, v: .06, type: 'triangle' });
      for (var k = 0; k < 6; k++) {
        d.parts.push({
          x: p.x + p.side * 12, y: p.y + U.rand(-12, 12),
          vx: -p.side * U.rand(30, 110), vy: U.rand(-50, 50),
          life: .25, max: .25, col: '#94c4de'
        });
      }
    }

    function cool(d, dt) {
      var k;
      for (k = d.parts.length - 1; k >= 0; k--) {
        var q = d.parts[k];
        q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
        if (q.life <= 0) d.parts.splice(k, 1);
      }
      for (k = d.texts.length - 1; k >= 0; k--) {
        d.texts[k].y -= 30 * dt; d.texts[k].life -= dt;
        if (d.texts[k].life <= 0) d.texts.splice(k, 1);
      }
    }
  }

  window.Milo.register({
    id: 'wall-jumper', title: 'Wall Jumper', emo: '🧗', category: 'Action',
    tagline: 'Kick between the walls, outrun the spikes',
    description: 'Cling to a wall and you slide slowly down it; tap and you kick off ' +
      'in a flat arc to the opposite wall, gaining a little height with every crossing. ' +
      'Orange spikes are bolted in place but the red ones slide down the walls toward ' +
      'you, and both get denser the higher you climb — as does your slide speed, so ' +
      'hesitating costs metres. Cyan gems floating mid-gap are worth 25 each, and the ' +
      'moment to grab them is mid-jump.',
    controls: ['Click', 'Space', 'Tap'],
    colors: ['#0f766e', '#a3e635'],
    tags: ['endless', 'climbing', 'one tap', 'spikes', 'reflex'],
    mount: mount
  });
})();
