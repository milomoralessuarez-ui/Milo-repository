/* Rooftop Run — parkour at dusk: jump the gaps, slide the pipes, keep the combo. */
(function () {
  'use strict';
  var W = 800, H = 500, PX = 200;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.px = 0;
      d.y = 260;           // feet
      d.vy = 0;
      d.onRoof = true;
      d.sliding = false;
      d.airT = 0;
      d.coyote = 0;
      d.jumpBuf = 0;
      d.combo = 0;
      d.bestCombo = 0;
      d.bonus = 0;
      d.slowT = 0;
      d.inv = 0;
      d.blds = [];
      d.nextX = -240;
      d.lastH = 240;
      d.landBld = 0;
      d.parts = [];
      d.texts = [];
      d.shake = 0;
      d.flash = 0;
      d.dead = false;
      d.dieT = 0;
      // opening building is long and flat, then the city gets interesting
      addBld(d, 1400, 240, true);
      while (d.nextX < W + 600) addBld(d);
      g.set('Score', 0);
      g.set('Combo', '×0');
      g.set('Best', U.fmt(g.best));
    }

    function addBld(d, w, h, bare) {
      var gap = d.blds.length ? U.rand(70, 140 + Math.min(100, d.px / 420)) : 0;
      var x = d.nextX + gap;
      w = w || U.rand(280, 540);
      h = h || U.clamp(d.lastH + U.rand(-90, 60), 130, 330);
      var b = { x: x, w: w, h: h, items: [] };
      if (!bare) {
        var ix = 130;
        while (ix < w - 110) {
          var r = Math.random();
          if (r < .3) b.items.push({ t: 'pipe', dx: ix, hit: false, done: false });
          else if (r < .55) b.items.push({ t: 'ac', dx: ix, hit: false, done: false });
          else if (r < .68) b.items.push({ t: 'wt', dx: ix });
          else if (r < .78) b.items.push({ t: 'ant', dx: ix });
          ix += U.rand(150, 300);
        }
      }
      d.blds.push(b);
      d.nextX = x + w;
      d.lastH = h;
    }

    function bldAt(d, x) {
      for (var i = 0; i < d.blds.length; i++) {
        var b = d.blds[i];
        if (x >= b.x && x <= b.x + b.w) return i;
      }
      return -1;
    }

    function jump(d) {
      if (d.dead) return;
      if (d.onRoof || d.coyote > 0) {
        d.vy = -640;
        d.onRoof = false;
        d.coyote = 0;
        d.jumpBuf = 0;
        d.sliding = false;
        Milo.sound.jump();
        for (var k = 0; k < 6; k++) {
          d.parts.push({
            x: PX + U.rand(-10, 10), y: d.y, vx: U.rand(-120, -40), vy: U.rand(-40, 40),
            life: .3, max: .3, col: '#94a3b8'
          });
        }
      } else d.jumpBuf = .12;
    }

    function clean(g, label) {
      var d = g.data;
      d.combo++;
      if (d.combo > d.bestCombo) d.bestCombo = d.combo;
      var pts = 25 * d.combo;
      d.bonus += pts;
      g.set('Combo', '×' + d.combo);
      d.texts.push({
        x: PX, y: d.y - 70, t: label + ' +' + pts, life: .8, max: .8,
        col: d.combo >= 5 ? '#fbbf24' : '#a5f3fc'
      });
      Milo.sound.tone({ f: 500 + Math.min(700, d.combo * 60), f2: 980, d: .08, v: .08, type: 'square' });
    }

    function stumble(g, label) {
      var d = g.data;
      if (d.inv > 0) return;
      d.inv = 1;
      d.slowT = .8;
      d.shake = 9;
      d.flash = .3;
      d.combo = 0;
      g.set('Combo', '×0');
      d.texts.push({ x: PX, y: d.y - 70, t: label, life: .8, max: .8, col: '#fda4af' });
      for (var k = 0; k < 12; k++) {
        var a = Math.random() * 6.283;
        d.parts.push({
          x: PX, y: d.y - 20, vx: Math.cos(a) * U.rand(40, 220), vy: Math.sin(a) * U.rand(40, 220),
          life: .4, max: .4, col: '#fda4af'
        });
      }
      Milo.sound.hit();
    }

    return Milo.arcade(host, {
      id: 'rooftop-run',
      w: W, h: H, bg: '#1e1b4b',
      stats: ['Score', 'Combo', 'Best'],
      touchButtons: [{ key: 'action', label: 'JUMP' }, { key: 'down', label: 'SLIDE' }],
      emo: '🏃',
      start: {
        title: 'Rooftop Run',
        text: 'Two moves: jump the gaps between rooftops, slide under the pipes. ' +
          'Every clean move grows a combo that multiplies its points; clip anything ' +
          'and it resets. The street below does not forgive.',
        keys: ['Space / ↑ jump', '↓ slide (hold)']
      },
      init: reset,
      onPointer: function (g, type) { if (type === 'down') jump(g.data); },
      onKey: function (g, e) {
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') jump(g.data);
      },

      update: function (g, dt) {
        var d = g.data, i = g.input, k, m;
        d.shake = Math.max(0, d.shake - dt * 40);
        d.flash = Math.max(0, d.flash - dt * 2.4);

        if (d.dead) {
          d.vy += 1600 * dt;
          d.y += d.vy * dt;
          d.dieT -= dt;
          cool(d, dt);
          if (d.dieT <= 0) {
            g.gameOver({
              text: U.fmt(Math.floor(d.px / 10)) + ' m across the rooftops. Best combo ×' +
                d.bestCombo + '.'
            });
          }
          return;
        }

        var v = (300 + Math.min(240, d.px / 500)) * (d.slowT > 0 ? .55 : 1);
        d.slowT = Math.max(0, d.slowT - dt);
        d.inv = Math.max(0, d.inv - dt);
        d.px += v * dt;

        // slide intent
        var wantSlide = i.down('down');
        d.sliding = d.onRoof && wantSlide;
        var curH = d.sliding ? 22 : 46;

        // find the roof under the player
        var bi = bldAt(d, d.px);
        var roof = bi >= 0 ? H - d.blds[bi].h : 1e9;

        // ran off the edge into a gap
        if (bi < 0 && d.onRoof) {
          d.onRoof = false;
          d.sliding = false;
          d.coyote = .09;
          d.airT = 0;
        }

        // vertical motion
        var wasAir = !d.onRoof;
        if (!d.onRoof) {
          d.vy += 1600 * dt;
          d.y += d.vy * dt;
          d.airT += dt;
        }
        d.coyote = Math.max(0, d.coyote - dt);
        d.jumpBuf = Math.max(0, d.jumpBuf - dt);

        if (bi >= 0) {
          if (d.onRoof) {
            if (d.y < roof - 4) {
              // stepped off a ledge downward — begin falling
              d.onRoof = false;
              d.coyote = .09;
            } else if (roof < d.y - 26) {
              // the next roof is a wall in the face: clamber up, lose the combo
              d.y = roof;
              stumble(g, 'CLAMBER');
            } else {
              d.y = roof; // small steps are absorbed
            }
          } else if (d.vy >= 0 && d.y >= roof) {
            var pen = d.y - roof;   // how deep into the building face we arrived
            d.y = roof;
            d.vy = 0;
            d.onRoof = true;
            for (k = 0; k < 5; k++) {
              d.parts.push({
                x: PX + U.rand(-12, 12), y: d.y, vx: U.rand(-140, -60), vy: U.rand(-60, -10),
                life: .25, max: .25, col: '#94a3b8'
              });
            }
            if (pen > 34) {
              // smacked the wall below the roofline — dragged yourself up
              stumble(g, 'CLAMBER');
            } else {
              Milo.sound.tone({ f: 220, f2: 170, d: .05, v: .06, type: 'triangle' });
              if (wasAir && d.airT > .18 && bi !== d.landBld && d.inv <= 0) clean(g, 'GAP');
            }
            d.landBld = bi;
            d.airT = 0;
            if (d.jumpBuf > 0) jump(d);
          }
        }

        // roof furniture
        if (bi >= 0) {
          var b = d.blds[bi];
          for (m = 0; m < b.items.length; m++) {
            var it = b.items[m];
            var ix = b.x + it.dx;
            if (it.t === 'pipe') {
              var barBot = roof - 30;
              if (!it.hit && Math.abs(d.px - ix) < 40 && d.onRoof && d.y - curH < barBot) {
                it.hit = true;
                stumble(g, 'CLANG!');
              }
              if (!it.done && d.px > ix + 48) {
                it.done = true;
                if (!it.hit) clean(g, 'PIPE');
              }
            } else if (it.t === 'ac') {
              if (!it.hit && Math.abs(d.px - ix) < 25 && d.y > roof - 27) {
                it.hit = true;
                stumble(g, 'THUD');
              }
              if (!it.done && d.px > ix + 32) {
                it.done = true;
                if (!it.hit) clean(g, 'VAULT');
              }
            }
          }
        }

        // fell into the street
        if (d.y > H + 50) {
          d.dead = true;
          d.dieT = .7;
          d.shake = 12;
          Milo.sound.explode();
          cool(d, dt);
          return;
        }

        // keep the city stocked, drop what's behind
        while (d.nextX < d.px + W + 600) addBld(d);
        while (d.blds.length && d.blds[0].x + d.blds[0].w < d.px - 400) {
          d.blds.shift();
          d.landBld--;
        }

        // run dust
        if (d.onRoof && !d.sliding && Math.random() < .35) {
          d.parts.push({
            x: PX - 12, y: d.y - 1, vx: U.rand(-160, -80), vy: U.rand(-50, -10),
            life: .25, max: .25, col: 'rgba(148,163,184,.7)'
          });
        }

        cool(d, dt);
        g.score = Math.floor(d.px / 10) + d.bonus;
        g.set('Score', U.fmt(g.score));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, k, m, x;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#1e1b4b');
        sky.addColorStop(.55, '#7e22ce');
        sky.addColorStop(.9, '#fb7185');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        // setting sun
        c.save();
        c.shadowColor = '#fda4af'; c.shadowBlur = 46;
        c.fillStyle = '#fecdd3';
        c.beginPath(); c.arc(W * .58, H * .68, 62, 0, 7); c.fill();
        c.restore();

        // far skyline silhouettes, two parallax layers
        for (var layer = 0; layer < 2; layer++) {
          var sp = layer === 0 ? .12 : .28;
          var col = layer === 0 ? 'rgba(30,27,75,.55)' : 'rgba(23,20,60,.85)';
          var seg = layer === 0 ? 90 : 70;
          c.fillStyle = col;
          var i0 = Math.floor(d.px * sp / seg);
          for (k = i0; k < i0 + W / seg + 2; k++) {
            var bh = 90 + U.hash2(k, layer, 71) * (layer === 0 ? 150 : 110);
            var bx = k * seg - d.px * sp;
            c.fillRect(bx, H - (layer === 0 ? 120 : 40) - bh, seg - 8, bh + 200);
          }
        }

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // the rooftops
        for (k = 0; k < d.blds.length; k++) {
          var b = d.blds[k];
          var sx = b.x - d.px + PX;
          if (sx + b.w < -60 || sx > W + 60) continue;
          var ry = H - b.h;
          var tint = U.hash2(Math.round(b.x), 0, 33);
          c.fillStyle = tint < .5 ? '#111827' : '#0f172a';
          c.fillRect(sx, ry, b.w, b.h + 20);
          // sunset rim on the roofline
          c.fillStyle = '#fb7185';
          c.fillRect(sx, ry, b.w, 3);
          c.fillStyle = '#334155';
          c.fillRect(sx, ry + 3, b.w, 6);
          // lit windows
          for (var wy = ry + 26; wy < H - 10; wy += 34) {
            for (var wx = sx + 14; wx < sx + b.w - 18; wx += 40) {
              var hsh = U.hash2(Math.round(wx - sx + b.x), Math.round(wy), 19);
              if (hsh < .55) continue;
              c.fillStyle = hsh < .78 ? 'rgba(253,224,71,.55)' : 'rgba(103,232,249,.35)';
              c.fillRect(wx, wy, 12, 16);
            }
          }
          // furniture
          for (m = 0; m < b.items.length; m++) {
            var it = b.items[m];
            var ix = sx + it.dx;
            if (ix < -80 || ix > W + 80) continue;
            if (it.t === 'pipe') {
              c.fillStyle = '#155e75';
              c.fillRect(ix - 42, ry - 44, 6, 44);
              c.fillRect(ix + 36, ry - 44, 6, 44);
              c.shadowColor = '#22d3ee'; c.shadowBlur = 6;
              c.fillStyle = '#0e7490';
              U.roundRect(c, ix - 46, ry - 44, 92, 13, 6); c.fill();
              c.shadowBlur = 0;
              c.fillStyle = 'rgba(255,255,255,.25)';
              c.fillRect(ix - 42, ry - 42, 84, 3);
            } else if (it.t === 'ac') {
              c.fillStyle = '#475569';
              U.roundRect(c, ix - 18, ry - 27, 36, 27, 3); c.fill();
              c.fillStyle = '#1e293b';
              c.beginPath(); c.arc(ix, ry - 14, 9, 0, 7); c.fill();
              c.strokeStyle = '#94a3b8'; c.lineWidth = 2;
              c.beginPath(); c.arc(ix, ry - 14, 9, 0, 7); c.stroke();
              c.beginPath();
              c.moveTo(ix - 6, ry - 14); c.lineTo(ix + 6, ry - 14);
              c.moveTo(ix, ry - 20); c.lineTo(ix, ry - 8);
              c.stroke();
            } else if (it.t === 'wt') {
              c.fillStyle = '#3f3f46';
              c.fillRect(ix - 16, ry - 46, 4, 46);
              c.fillRect(ix + 12, ry - 46, 4, 46);
              c.fillStyle = '#52525b';
              U.roundRect(c, ix - 22, ry - 82, 44, 40, 5); c.fill();
              c.beginPath();
              c.moveTo(ix - 22, ry - 80); c.lineTo(ix, ry - 94); c.lineTo(ix + 22, ry - 80);
              c.closePath(); c.fill();
              c.fillStyle = 'rgba(251,113,133,.5)';
              c.fillRect(ix - 22, ry - 82, 44, 3);
            } else if (it.t === 'ant') {
              c.strokeStyle = '#64748b'; c.lineWidth = 3;
              c.beginPath(); c.moveTo(ix, ry); c.lineTo(ix, ry - 58); c.stroke();
              c.lineWidth = 1.5;
              c.beginPath(); c.moveTo(ix - 12, ry - 40); c.lineTo(ix + 12, ry - 40); c.stroke();
              c.beginPath(); c.moveTo(ix - 8, ry - 50); c.lineTo(ix + 8, ry - 50); c.stroke();
              c.fillStyle = Math.sin(g.t * 4) > 0 ? '#ef4444' : '#7f1d1d';
              c.beginPath(); c.arc(ix, ry - 60, 3, 0, 7); c.fill();
            }
          }
        }

        // particles
        for (k = 0; k < d.parts.length; k++) {
          var p = d.parts[k];
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
        }
        c.globalAlpha = 1;

        // the runner
        if (!d.dead || d.dieT > 0) {
          c.save();
          c.translate(PX, d.y);
          if (d.inv > 0) c.globalAlpha = Math.sin(g.t * 24) > 0 ? .4 : .9;
          var ph = d.px * .045;
          if (d.sliding) {
            // low slide pose
            c.fillStyle = '#f8fafc';
            U.roundRect(c, -16, -18, 30, 12, 6); c.fill();
            c.fillStyle = '#fbbf24';
            c.beginPath(); c.arc(16, -14, 7, 0, 7); c.fill();
            c.strokeStyle = '#ef4444'; c.lineWidth = 4; c.lineCap = 'round';
            c.beginPath();
            c.moveTo(-14, -16);
            c.quadraticCurveTo(-30, -20 + Math.sin(g.t * 18) * 4, -42, -14);
            c.stroke();
          } else {
            var lift = d.onRoof ? Math.abs(Math.sin(ph)) * 3 : 0;
            c.translate(0, -lift);
            // legs
            c.strokeStyle = '#1e293b'; c.lineWidth = 5; c.lineCap = 'round';
            var l1 = d.onRoof ? Math.sin(ph) : .8, l2 = d.onRoof ? -Math.sin(ph) : -.5;
            c.beginPath(); c.moveTo(0, -20); c.lineTo(l1 * 10, -10 + Math.abs(l1) * 2); c.lineTo(l1 * 14, 0); c.stroke();
            c.beginPath(); c.moveTo(0, -20); c.lineTo(l2 * 10, -10 + Math.abs(l2) * 2); c.lineTo(l2 * 14, 0); c.stroke();
            // body
            c.fillStyle = '#f8fafc';
            U.roundRect(c, -7, -40, 15, 22, 7); c.fill();
            // arms
            c.strokeStyle = '#f8fafc'; c.lineWidth = 4.5;
            c.beginPath(); c.moveTo(0, -34); c.lineTo(-l1 * 12, -26); c.stroke();
            c.beginPath(); c.moveTo(0, -34); c.lineTo(-l2 * 12, -26); c.stroke();
            // head
            c.fillStyle = '#fbbf24';
            c.beginPath(); c.arc(3, -46, 7, 0, 7); c.fill();
            // scarf
            c.strokeStyle = '#ef4444'; c.lineWidth = 4;
            c.beginPath();
            c.moveTo(-2, -40);
            c.quadraticCurveTo(-16, -44 + Math.sin(g.t * 16) * 5, -28, -38 + Math.sin(g.t * 12) * 6);
            c.stroke();
          }
          c.restore();
          c.globalAlpha = 1;
        }

        // combo pips under the hud
        if (d.combo > 0) {
          var n = Math.min(10, d.combo);
          for (k = 0; k < n; k++) {
            c.fillStyle = k < 4 ? '#67e8f9' : (k < 7 ? '#a5f3fc' : '#fbbf24');
            U.roundRect(c, W / 2 - n * 11 + k * 22, 54, 16, 7, 3.5); c.fill();
          }
        }

        // floating texts
        c.font = '800 16px Outfit, sans-serif';
        c.textAlign = 'center';
        for (k = 0; k < d.texts.length; k++) {
          var t = d.texts[k];
          c.globalAlpha = Math.max(0, t.life / t.max);
          c.fillStyle = t.col;
          c.fillText(t.t, t.x, t.y);
        }
        c.globalAlpha = 1;
        c.restore();

        if (d.flash > 0) {
          c.fillStyle = 'rgba(251,113,133,' + d.flash * .25 + ')';
          c.fillRect(0, 0, W, H);
        }
      }
    });

    function cool(d, dt) {
      var k;
      for (k = d.parts.length - 1; k >= 0; k--) {
        var p = d.parts[k];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt; p.life -= dt;
        if (p.life <= 0) d.parts.splice(k, 1);
      }
      for (k = d.texts.length - 1; k >= 0; k--) {
        d.texts[k].y -= 34 * dt; d.texts[k].life -= dt;
        if (d.texts[k].life <= 0) d.texts.splice(k, 1);
      }
    }
  }

  window.Milo.register({
    id: 'rooftop-run', title: 'Rooftop Run', emo: '🏃', category: 'Action',
    tagline: 'Jump the gaps, slide the pipes, feed the combo',
    description: 'A dusk parkour sprint across an endless skyline with exactly two ' +
      'moves: jump clears the gaps between rooftops, and holding slide gets you under ' +
      'the cyan pipes. Every clean gap, slide or vault over an AC unit adds to a combo ' +
      'and pays 25 points times it, so a long unbroken line is worth far more than the ' +
      'distance alone — clip a pipe or fluff a climb and the combo dies with a clang. ' +
      'Rooftop heights vary, and only the street below actually ends the run, so when ' +
      'in doubt jump late and aim low.',
    controls: ['Space / ↑', '↓ (hold)', 'Tap to jump'],
    colors: ['#312e81', '#fb7185'],
    tags: ['endless', 'parkour', 'runner', 'combo', 'two button'],
    mount: mount
  });
})();
