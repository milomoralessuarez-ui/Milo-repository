/* Arrow Storm — hold to draw, loose real arcing arrows at the siege lines. */
(function () {
  'use strict';
  var W = 800, H = 560, GROUND = 474, AX = 96, AY = 208, GRAV = 640;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    var KINDS = {
      foot: { hp: 1, sp: 44, w: 16, h: 34, pts: 10, dmg: 4 },
      shield: { hp: 1, sp: 32, w: 18, h: 34, pts: 20, dmg: 4 },
      knight: { hp: 2, sp: 78, w: 16, h: 38, pts: 25, dmg: 6 },
      ram: { hp: 7, sp: 20, w: 64, h: 40, pts: 70, dmg: 16 }
    };

    function reset(g) {
      var d = g.data;
      d.wall = 100;
      d.wave = 0;
      d.foes = [];
      d.arrows = [];
      d.stuck = [];
      d.parts = [];
      d.texts = [];
      d.rain = [];
      d.spawnLeft = 0;
      d.spawnT = 0;
      d.betweenT = 2;
      d.drawing = false;
      d.power = 0;
      d.aim = -.45;
      d.kbAim = false;
      d.kills = 0;
      d.heads = 0;
      d.flash = 0;
      d.shake = 0;
      d.banner = ''; d.bannerT = 0;
      for (var i = 0; i < 46; i++) {
        d.rain.push({ x: Math.random() * (W + 100), y: Math.random() * H, s: U.rand(.6, 1.2) });
      }
      g.set('Score', 0);
      g.set('Wave', 0);
      g.set('Wall', '100%');
    }

    function startWave(g) {
      var d = g.data;
      d.wave++;
      g.set('Wave', d.wave);
      d.spawnLeft = 4 + d.wave * 3;
      d.spawnT = .8;
      d.banner = 'WAVE ' + d.wave;
      d.bannerT = 1.6;
      Milo.sound.tone({ f: 110, f2: 220, d: .5, v: .12, type: 'sawtooth' });
    }

    function spawnFoe(d) {
      var roll = Math.random(), kind = 'foot';
      if (d.wave >= 3 && roll < .12) kind = 'ram';
      else if (d.wave >= 2 && roll < .38) kind = 'shield';
      else if (d.wave >= 2 && roll < .62) kind = 'knight';
      var k = KINDS[kind];
      d.foes.push({
        kind: kind, x: W + 40 + U.rand(0, 60), hp: k.hp,
        sp: k.sp + d.wave * 2.5 + U.rand(-4, 6),
        t: Math.random() * 6, chop: 0
      });
    }

    function loose(g) {
      var d = g.data;
      if (d.power < .12) { d.drawing = false; d.power = 0; return; }
      var v = 260 + 560 * d.power;
      d.arrows.push({
        x: AX + Math.cos(d.aim) * 26, y: AY + Math.sin(d.aim) * 26,
        vx: Math.cos(d.aim) * v, vy: Math.sin(d.aim) * v
      });
      Milo.sound.tone({ f: 200 + d.power * 500, f2: 90, d: .12, v: .1, type: 'triangle' });
      d.drawing = false;
      d.power = 0;
    }

    function popText(d, x, y, str, col) {
      d.texts.push({ x: x, y: y, str: str, col: col, life: 1 });
    }

    function dust(d, x, y, col, n) {
      for (var i = 0; i < n; i++) {
        var a = U.rand(-2.6, -.5), s = U.rand(20, 120);
        d.parts.push({
          x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: U.rand(.25, .55), max: .55, col: col, r: U.rand(2, 4.5)
        });
      }
    }

    function kill(g, f, headshot) {
      var d = g.data, k = KINDS[f.kind];
      var idx = d.foes.indexOf(f);
      if (idx >= 0) d.foes.splice(idx, 1);
      d.kills++;
      var pts = k.pts * (headshot ? 2 : 1) + (headshot ? 15 : 0);
      if (headshot) d.heads++;
      g.score += pts;
      g.set('Score', U.fmt(g.score));
      dust(d, f.x, GROUND - k.h / 2, f.kind === 'ram' ? '#8a6a3a' : '#5a2c34', headshot ? 14 : 8);
      popText(d, f.x, GROUND - k.h - 16, headshot ? 'HEADSHOT +' + pts : '+' + pts, headshot ? '#ffd257' : '#cfd6c8');
      if (f.kind === 'ram') d.shake = Math.max(d.shake, .5);
      Milo.sound.tone({ f: headshot ? 880 : 320, f2: headshot ? 1320 : 140, d: .12, v: .1, type: 'square' });
    }

    return Milo.arcade(host, {
      id: 'arrow-storm',
      w: W, h: H, bg: '#2a3038',
      stats: ['Score', 'Wave', 'Wall'],
      emo: '🏹',
      start: {
        title: 'Arrow Storm',
        text: 'Hold to draw the bow, release to loose. Arrows fly true arcs — drop ' +
          'plunging fire behind the shield line, and a head hit kills anything ' +
          'outright. Keep the rams off your wall.',
        keys: ['Hold + drag to aim', 'Release to loose', 'Or Space + ↑ ↓']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (type === 'down') { d.drawing = true; d.kbAim = false; d.power = 0; }
        if ((type === 'down' || type === 'move') && !d.kbAim) {
          d.aim = Math.atan2(y - AY, Math.max(30, x - AX));
          d.aim = U.clamp(d.aim, -1.35, .5);
        }
        if (type === 'up' && d.drawing && !d.kbAim) loose(g);
      },

      update: function (g, dt) {
        var d = g.data, i = g.input;
        d.shake = Math.max(0, d.shake - dt * 3);
        d.flash = Math.max(0, d.flash - dt * 2);
        d.bannerT -= dt;
        if (Math.random() < .003) d.flash = .5; // distant lightning

        /* keyboard archery */
        if (i.down('up')) { d.aim -= 1.4 * dt; d.kbAim = true; }
        if (i.down('down')) { d.aim += 1.4 * dt; d.kbAim = true; }
        d.aim = U.clamp(d.aim, -1.35, .5);
        if (i.down('action')) {
          if (!d.drawing) { d.drawing = true; d.kbAim = true; d.power = 0; }
        } else if (d.drawing && d.kbAim) loose(g);

        if (d.drawing) {
          var was = d.power;
          d.power = Math.min(1, d.power + dt / 1.05);
          if (was < 1 && d.power >= 1) Milo.sound.tone({ f: 660, d: .05, v: .05, type: 'square' });
        }

        /* waves */
        if (d.spawnLeft > 0) {
          d.spawnT -= dt;
          if (d.spawnT <= 0) {
            d.spawnT = U.rand(.6, 1.4) * Math.max(.35, 1 - d.wave * .06);
            d.spawnLeft--;
            spawnFoe(d);
          }
        } else if (!d.foes.length) {
          d.betweenT -= dt;
          if (d.betweenT <= 0) {
            if (d.wave > 0) {
              var bonus = 50 + d.wave * 10;
              g.score += bonus;
              g.set('Score', U.fmt(g.score));
              d.wall = Math.min(100, d.wall + 20);
              g.set('Wall', Math.round(d.wall) + '%');
              d.banner = 'WALL REPAIRED +' + bonus;
              d.bannerT = 1.6;
              Milo.sound.coin();
            }
            startWave(g);
            d.betweenT = 3;
          }
        }

        /* the siege line advances */
        for (var k = d.foes.length - 1; k >= 0; k--) {
          var f = d.foes[k], kk = KINDS[f.kind];
          f.t += dt;
          if (f.x > 158) {
            f.x -= f.sp * dt;
          } else {
            // hacking at the wall
            f.chop -= dt;
            if (f.chop <= 0) {
              f.chop = f.kind === 'ram' ? 1.6 : 1;
              d.wall -= kk.dmg;
              d.shake = Math.max(d.shake, f.kind === 'ram' ? .7 : .3);
              g.set('Wall', Math.max(0, Math.round(d.wall)) + '%');
              dust(d, 140, U.rand(240, 420), '#8a8f96', 6);
              Milo.sound.tone({ f: f.kind === 'ram' ? 70 : 120, f2: 50, d: .18, v: .13, type: 'sawtooth' });
              if (d.wall <= 0) {
                g.gameOver({
                  emo: '🏰', title: 'The Wall Fell',
                  text: 'Breached on wave ' + d.wave + ' — ' + d.kills + ' kills, ' + d.heads + ' headshots.'
                });
                return;
              }
            }
          }
        }

        /* arrows */
        for (var a = d.arrows.length - 1; a >= 0; a--) {
          var ar = d.arrows[a];
          ar.vy += GRAV * dt;
          ar.x += ar.vx * dt; ar.y += ar.vy * dt;
          var gone = false;

          for (var j = 0; j < d.foes.length; j++) {
            var fo = d.foes[j], fk = KINDS[fo.kind];
            var headY = GROUND - fk.h - 4;
            // head first (rams have no head to speak of)
            if (fo.kind !== 'ram' && U.dist(ar.x, ar.y, fo.x, headY) < 8.5) {
              kill(g, fo, true);
              gone = true;
              break;
            }
            // body
            if (ar.x > fo.x - fk.w / 2 - 3 && ar.x < fo.x + fk.w / 2 + 3 &&
              ar.y > headY + 6 && ar.y < GROUND) {
              if (fo.kind === 'shield' && ar.vy < Math.abs(ar.vx) * .85) {
                // flat shot clangs off the shield — only plunging fire gets through
                dust(d, ar.x, ar.y, '#c8ccd4', 5);
                popText(d, fo.x, headY - 10, 'BLOCKED', '#8a8f96');
                Milo.sound.tone({ f: 1500, f2: 900, d: .07, v: .08, type: 'square' });
                gone = true;
                break;
              }
              fo.hp--;
              gone = true;
              if (fo.hp <= 0) kill(g, fo, false);
              else {
                dust(d, ar.x, ar.y, '#5a2c34', 5);
                Milo.sound.hit();
              }
              break;
            }
          }

          if (!gone && ar.y >= GROUND) {
            d.stuck.push({ x: ar.x, y: GROUND, rot: Math.atan2(ar.vy, ar.vx), life: 6 });
            dust(d, ar.x, GROUND, '#4a4438', 3);
            Milo.sound.tone({ f: 160, f2: 90, d: .05, v: .04, type: 'triangle' });
            gone = true;
          }
          if (gone || ar.x > W + 40 || ar.x < 0) d.arrows.splice(a, 1);
        }

        /* fx */
        d.rain.forEach(function (r) {
          r.x -= 220 * r.s * dt; r.y += 420 * r.s * dt;
          if (r.y > H) { r.y = -10; r.x = Math.random() * (W + 100); }
          if (r.x < -10) r.x = W + 10;
        });
        d.stuck = d.stuck.filter(function (s) { s.life -= dt; return s.life > 0; });
        d.texts = d.texts.filter(function (t) { t.y -= 30 * dt; t.life -= dt; return t.life > 0; });
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        // storm sky
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#262c36');
        sky.addColorStop(.7, '#3d4650');
        sky.addColorStop(1, '#4a5258');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        if (d.flash > 0) {
          c.fillStyle = 'rgba(220,230,255,' + d.flash * .25 + ')';
          c.fillRect(0, 0, W, H);
        }

        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 5, U.rand(-1, 1) * d.shake * 5);

        // brooding cloud bank
        c.fillStyle = 'rgba(20,24,32,.55)';
        for (var cl = 0; cl < 5; cl++) {
          var cx2 = ((cl * 210 + g.t * 12) % (W + 260)) - 130;
          c.beginPath(); c.ellipse(cx2, 40 + (cl % 2) * 26, 130, 30, 0, 0, 7); c.fill();
        }

        // sodden field
        c.fillStyle = '#39422c';
        c.fillRect(0, GROUND, W, H - GROUND);
        c.fillStyle = '#2e3624';
        for (var tuft = 0; tuft < 12; tuft++) {
          var tx2 = (tuft * 73) % W;
          c.fillRect(tx2, GROUND + 8 + (tuft % 3) * 20, 26, 4);
        }

        // castle wall
        var crack = d.wall < 50;
        c.fillStyle = '#5a6068';
        c.fillRect(0, 224, 148, H - 224);
        c.fillStyle = '#4a5058';
        for (var row = 0; row < 8; row++) {
          for (var col2 = 0; col2 < 4; col2++) {
            var bx = ((row % 2) * 20 + col2 * 40) - 8;
            c.fillRect(bx, 232 + row * 32, 36, 28);
          }
        }
        // battlements
        c.fillStyle = '#6a7078';
        for (var bt = 0; bt < 4; bt++) c.fillRect(bt * 40, 204, 26, 24);
        if (crack) {
          c.strokeStyle = '#20242a'; c.lineWidth = 3;
          c.beginPath();
          c.moveTo(120, 300); c.lineTo(100, 350); c.lineTo(118, 400); c.lineTo(96, 460);
          c.stroke();
        }
        // wall hp bar
        c.fillStyle = 'rgba(0,0,0,.5)';
        U.roundRect(c, 10, 188, 128, 9, 4.5); c.fill();
        c.fillStyle = d.wall > 40 ? '#8ac25a' : '#e05252';
        U.roundRect(c, 12, 190, 124 * Math.max(0, d.wall) / 100, 5, 2.5); c.fill();

        // stuck arrows in the mud
        d.stuck.forEach(function (s) {
          c.save();
          c.globalAlpha = Math.min(1, s.life);
          c.translate(s.x, s.y);
          c.rotate(s.rot);
          c.strokeStyle = '#c8b88a'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(-16, 0); c.lineTo(0, 0); c.stroke();
          c.fillStyle = '#e05252';
          c.beginPath(); c.moveTo(-16, 0); c.lineTo(-21, -3); c.lineTo(-21, 3); c.closePath(); c.fill();
          c.restore();
        });
        c.globalAlpha = 1;

        // siege lines
        d.foes.forEach(function (f) { drawFoe(c, f, g.t); });

        // flying arrows
        d.arrows.forEach(function (ar) {
          c.save();
          c.translate(ar.x, ar.y);
          c.rotate(Math.atan2(ar.vy, ar.vx));
          c.strokeStyle = '#c8b88a'; c.lineWidth = 2.4; c.lineCap = 'round';
          c.beginPath(); c.moveTo(-14, 0); c.lineTo(8, 0); c.stroke();
          c.fillStyle = '#d8dce4';
          c.beginPath(); c.moveTo(8, 0); c.lineTo(2, -3); c.lineTo(2, 3); c.closePath(); c.fill();
          c.fillStyle = '#e05252';
          c.beginPath(); c.moveTo(-14, 0); c.lineTo(-19, -3); c.lineTo(-19, 3); c.closePath(); c.fill();
          c.restore();
        });

        // trajectory preview while drawing
        if (d.drawing && d.power > .1) {
          var v = 260 + 560 * d.power;
          var px2 = AX + Math.cos(d.aim) * 26, py2 = AY + Math.sin(d.aim) * 26;
          var pvx = Math.cos(d.aim) * v, pvy = Math.sin(d.aim) * v;
          c.fillStyle = '#ffd257';
          for (var st = 0; st < 24; st++) {
            pvy += GRAV * .045;
            px2 += pvx * .045; py2 += pvy * .045;
            if (py2 > GROUND) break;
            c.globalAlpha = Math.max(0, .55 - st * .022);
            c.beginPath(); c.arc(px2, py2, 2.2, 0, 7); c.fill();
          }
          c.globalAlpha = 1;
        }

        drawArcher(c, d, g.t);

        // rain over everything
        c.strokeStyle = 'rgba(190,205,225,.28)'; c.lineWidth = 1;
        c.beginPath();
        d.rain.forEach(function (r) {
          c.moveTo(r.x, r.y);
          c.lineTo(r.x - 4 * r.s, r.y + 9 * r.s);
        });
        c.stroke();

        // particles + texts
        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill();
        });
        c.globalAlpha = 1;
        d.texts.forEach(function (t) {
          c.globalAlpha = Math.max(0, t.life);
          c.fillStyle = t.col;
          c.font = '800 14px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(t.str, t.x, t.y);
        });
        c.globalAlpha = 1;

        if (d.bannerT > 0 && d.banner) {
          c.globalAlpha = Math.min(1, d.bannerT);
          c.textAlign = 'center';
          c.fillStyle = '#e8dcc0';
          c.font = '800 30px Outfit, sans-serif';
          c.fillText(d.banner, W / 2, 120);
          c.globalAlpha = 1;
        }
        c.restore();
      }
    });

    function drawFoe(c, f, t) {
      var k = KINDS[f.kind];
      var y = GROUND, step = f.x > 158 ? Math.sin(t * 9 + f.t * 7) * 3 : 0;
      c.save();
      c.translate(f.x, y);
      if (f.kind === 'ram') {
        // wheeled battering ram
        c.fillStyle = '#5a4428';
        U.roundRect(c, -32, -k.h, 64, 22, 5); c.fill();
        c.fillStyle = '#3c2e1a';
        U.roundRect(c, -36, -k.h + 20, 72, 8, 3); c.fill();
        c.fillStyle = '#2c2216';
        c.beginPath();
        c.arc(-22, -6, 8, 0, 7); c.arc(0, -6, 8, 0, 7); c.arc(22, -6, 8, 0, 7);
        c.fill();
        c.fillStyle = '#8a8f96'; // iron head
        c.beginPath();
        c.moveTo(-32, -k.h + 8); c.lineTo(-44, -k.h + 12); c.lineTo(-32, -k.h + 16);
        c.closePath(); c.fill();
        // hp pips
        c.fillStyle = 'rgba(0,0,0,.5)';
        c.fillRect(-20, -k.h - 10, 40, 4);
        c.fillStyle = '#e05252';
        c.fillRect(-20, -k.h - 10, 40 * f.hp / KINDS.ram.hp, 4);
      } else {
        var bodyCol = f.kind === 'knight' ? '#6a7484' : '#6e3844';
        // legs
        c.strokeStyle = '#2c2430'; c.lineWidth = 3.5; c.lineCap = 'round';
        c.beginPath();
        c.moveTo(-3, -14); c.lineTo(-5 - step, 0);
        c.moveTo(3, -14); c.lineTo(5 + step, 0);
        c.stroke();
        // body
        c.fillStyle = bodyCol;
        U.roundRect(c, -k.w / 2, -k.h + 6, k.w, k.h - 18, 4); c.fill();
        // head
        c.fillStyle = f.kind === 'knight' ? '#8a94a4' : '#d8b08a';
        c.beginPath(); c.arc(0, -k.h - 4 + 5, 6.5, 0, 7); c.fill();
        if (f.kind === 'knight') {
          c.fillStyle = '#c8a24a'; // plume
          c.fillRect(-1.5, -k.h - 8, 3, 6);
        }
        if (f.kind === 'shield') {
          c.fillStyle = '#8a6a3a';
          U.roundRect(c, -k.w / 2 - 8, -k.h + 4, 8, k.h - 12, 3); c.fill();
          c.fillStyle = '#c8a24a';
          c.beginPath(); c.arc(-k.w / 2 - 4, -k.h / 2 - 2, 2.5, 0, 7); c.fill();
        } else {
          // axe arm swings while chopping
          c.strokeStyle = '#2c2430'; c.lineWidth = 3;
          var swing = f.x <= 158 ? Math.sin(t * 6) * .8 : .2;
          c.beginPath();
          c.moveTo(-k.w / 2, -k.h + 12);
          c.lineTo(-k.w / 2 - 9 * Math.cos(swing), -k.h + 6 - 8 * Math.sin(swing));
          c.stroke();
        }
      }
      c.restore();
    }

    function drawArcher(c, d, t) {
      c.save();
      c.translate(AX, AY);
      // cloak
      c.fillStyle = '#2e5240';
      c.beginPath();
      c.moveTo(-8, -10); c.lineTo(8, -10); c.lineTo(11, 16); c.lineTo(-11, 16);
      c.closePath(); c.fill();
      // head + hood
      c.fillStyle = '#d8b08a';
      c.beginPath(); c.arc(0, -16, 6.5, 0, 7); c.fill();
      c.fillStyle = '#24422f';
      c.beginPath(); c.arc(0, -18, 7, Math.PI, 0); c.fill();
      // bow
      var pull = d.drawing ? d.power * 9 : 0;
      c.save();
      c.rotate(d.aim);
      c.strokeStyle = '#8a5a2a'; c.lineWidth = 3.4; c.lineCap = 'round';
      c.beginPath(); c.arc(18 - pull * .3, 0, 17, -1.25, 1.25); c.stroke();
      c.strokeStyle = '#d8dce4'; c.lineWidth = 1.2;
      var tipX = 18 - pull * .3 + Math.cos(1.25) * 17;
      c.beginPath();
      c.moveTo(tipX, -Math.sin(1.25) * 17);
      c.lineTo(6 - pull, 0);
      c.lineTo(tipX, Math.sin(1.25) * 17);
      c.stroke();
      if (d.drawing) {
        c.strokeStyle = '#c8b88a'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(6 - pull, 0); c.lineTo(30 - pull, 0); c.stroke();
      }
      c.restore();
      // power ring
      if (d.drawing) {
        c.strokeStyle = d.power >= 1 ? '#ffd257' : '#8ac25a';
        c.lineWidth = 3;
        c.beginPath(); c.arc(0, 0, 26, -Math.PI / 2, -Math.PI / 2 + d.power * 6.283); c.stroke();
      }
      c.restore();
    }
  }

  window.Milo.register({
    id: 'arrow-storm', title: 'Arrow Storm', emo: '🏹', category: 'Action',
    tagline: 'Plunging fire beats the shield wall',
    description: 'You are the last archer on a rain-lashed castle wall. Hold to draw — ' +
      'power grows for a second — and release to loose an arrow that flies a true ' +
      'gravity arc. Shieldmen block anything flat, so drop plunging fire on their ' +
      'helmets: any head hit kills instantly and pays double plus fifteen. Battering ' +
      'rams take seven body shots and hit the wall for sixteen, so they die first.',
    controls: ['Hold + drag', 'Release', 'Space + ↑ ↓'],
    colors: ['#3d4650', '#c8a24a'],
    tags: ['archery', 'castle', 'defense', 'waves', 'physics'],
    mount: mount
  });
})();
