/* Meteor Surf — carve a lava wave, dive for speed, launch off crests. */
(function () {
  'use strict';
  var W = 800, H = 500, PX = 250;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function a1(x) { return 44 + Math.min(38, x / 260); }
    function a2(x) { return 22 + Math.min(20, x / 500); }
    function waveY(x) {
      return 330 - Math.sin(x * 0.0105) * a1(x) - Math.sin(x * 0.0041 + 1.7) * a2(x);
    }
    function slopeAt(x) { return (waveY(x + 3) - waveY(x - 3)) / 6; }

    function reset(g) {
      var d = g.data;
      d.px = 0;
      d.y = waveY(0);
      d.vx = 300;
      d.vy = 0;
      d.onG = true;
      d.airT = 0;
      d.flow = 0;
      d.bonus = 0;
      d.rot = 0;
      d.camY = 0;
      d.spires = [];
      d.nextSp = 1400;
      d.parts = [];
      d.texts = [];
      d.trail = [];
      d.shake = 0;
      d.flash = 0;
      d.dead = false;
      d.dieT = 0;
      d.emberT = 0;
      g.set('Score', 0);
      g.set('Flow', 'x0');
      g.set('Best', U.fmt(g.best));
    }

    function ember(d, x, y, hot) {
      d.parts.push({
        x: x, y: y,
        vx: U.rand(-40, 40), vy: U.rand(-160, -60),
        life: U.rand(.4, .9), max: .9,
        col: hot ? '#ffe17d' : (Math.random() < .5 ? '#fb923c' : '#ef4444')
      });
    }

    function crash(g) {
      var d = g.data;
      d.dead = true;
      d.dieT = .9;
      d.shake = 14;
      d.vy = -260;
      for (var k = 0; k < 30; k++) {
        var an = Math.random() * 6.283, s = U.rand(60, 360);
        d.parts.push({
          x: PX, y: d.y - d.camY, vx: Math.cos(an) * s, vy: Math.sin(an) * s - 80,
          life: U.rand(.4, .9), max: .9,
          col: Math.random() < .5 ? '#ffe17d' : '#ef4444'
        });
      }
      Milo.sound.explode();
    }

    function landing(g, diff) {
      var d = g.data;
      if (diff < .35) {
        d.flow++;
        var pts = 25 * d.flow;
        d.bonus += pts;
        d.vx += 30;
        d.flash = .3;
        g.set('Flow', 'x' + d.flow);
        d.texts.push({ x: PX, y: d.y - d.camY - 46, t: 'FLOW x' + d.flow + '  +' + pts, life: .8, max: .8, col: '#ffe17d' });
        Milo.sound.tone({ f: 500 + Math.min(700, d.flow * 90), f2: 1000, d: .1, v: .09, type: 'square' });
        for (var k = 0; k < 8; k++) ember(d, PX + U.rand(-18, 18), d.y - d.camY, true);
      } else if (diff > .7) {
        d.vx *= .6;
        if (d.flow > 0) d.texts.push({ x: PX, y: d.y - d.camY - 40, t: 'WIPED', life: .6, max: .6, col: '#fda4af' });
        d.flow = 0;
        d.shake = 6;
        g.set('Flow', 'x0');
        Milo.sound.tone({ f: 140, f2: 70, d: .14, v: .11, type: 'sawtooth' });
        for (var j = 0; j < 10; j++) ember(d, PX + U.rand(-20, 20), d.y - d.camY, false);
      } else {
        Milo.sound.tone({ f: 260, f2: 180, d: .06, v: .05, type: 'triangle' });
      }
    }

    return Milo.arcade(host, {
      id: 'meteor-surf',
      w: W, h: H, bg: '#1c0405',
      stats: ['Score', 'Flow', 'Best'],
      emo: '🌋',
      start: {
        title: 'Meteor Surf',
        text: 'Hold to dive — press into the downslopes to build speed, release to ' +
          'launch off the crests and clear the obsidian spires. Land matching the ' +
          'slope to keep your flow chain alive.',
        keys: ['Hold Space / Hold anywhere']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input, k;
        d.flash = Math.max(0, d.flash - dt * 2);
        d.shake = Math.max(0, d.shake - dt * 40);

        if (d.dead) {
          d.vy += 1400 * dt;
          d.y += d.vy * dt;
          d.rot += 9 * dt;
          d.dieT -= dt;
          cool(d, dt);
          if (d.dieT <= 0) {
            g.gameOver({
              text: U.fmt(Math.floor(d.px / 10)) + ' m of lava surfed.' +
                (d.bonus ? ' Flow bonuses paid ' + U.fmt(d.bonus) + '.' : '')
            });
          }
          return;
        }

        var hold = i.down('action') || i.pdown;

        // ballistic motion; the wave catches you
        d.vy += (d.onG ? 0 : (hold ? 4200 : 1400)) * dt;
        d.y += d.vy * dt;
        d.px += d.vx * dt;
        var gy = waveY(d.px), sl = slopeAt(d.px);

        if (d.y >= gy) {
          if (!d.onG && d.airT > .25) {
            var velAng = Math.atan2(d.vy, d.vx);
            landing(g, Math.abs(velAng - Math.atan(sl)));
          }
          d.y = gy;
          d.onG = true;
          d.airT = 0;
          d.vy = sl * d.vx;
          d.vx += sl * 480 * dt;
          if (hold) d.vx += (180 + Math.max(0, sl) * 720) * dt;
          else d.vx += (300 - d.vx) * .25 * dt;
          d.vx = U.clamp(d.vx, 220, 940);
        } else if (d.onG) {
          if (d.y < gy - 2) {
            d.onG = false;
            d.airT = 0;
            if (d.vy < -220) Milo.sound.tone({ f: 320, f2: 640, d: .12, v: .06, type: 'sine' });
          } else { d.y = gy; d.vy = sl * d.vx; }
        } else {
          d.airT += dt;
        }

        d.rot += ((d.onG ? Math.atan(sl) : U.clamp(d.vy * .0009, -.7, .7)) - d.rot) * Math.min(1, 12 * dt);

        // camera lifts when you fly high
        var camT = Math.min(0, d.y - 190);
        d.camY += (camT - d.camY) * Math.min(1, 5 * dt);

        // spires
        while (d.nextSp < d.px + W + 200) {
          d.spires.push({ x: d.nextSp, h: U.rand(60, 105) + Math.min(40, d.px / 400) });
          d.nextSp += U.rand(1, 1.35) * Math.max(430, 820 - d.px / 40);
        }
        for (k = d.spires.length - 1; k >= 0; k--) {
          var sp = d.spires[k];
          if (sp.x < d.px - 400) { d.spires.splice(k, 1); continue; }
          if (Math.abs(sp.x - d.px) < 22 && d.y > waveY(sp.x) - sp.h + 6) {
            crash(g);
            return;
          }
        }

        // surf trail + ambient embers
        if (d.vx > 480 || !d.onG) {
          d.trail.push({ x: d.px, y: d.y, life: .35, max: .35 });
        }
        d.emberT -= dt;
        if (d.emberT <= 0) {
          d.emberT = U.rand(.04, .12);
          var ex = d.px + U.rand(-PX, W - PX);
          ember(d, ex - d.px + PX, waveY(ex) - d.camY, false);
        }

        cool(d, dt);
        g.score = Math.floor(d.px / 10) + d.bonus;
        g.set('Score', U.fmt(g.score));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, k, x;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#160304');
        sky.addColorStop(.55, '#48100a');
        sky.addColorStop(1, '#7a2008');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // far volcano ridge, slow parallax
        c.fillStyle = '#2a070c';
        c.beginPath();
        c.moveTo(0, H);
        for (x = 0; x <= W; x += 20) {
          var rx = (d.px * .25 + x);
          c.lineTo(x, 240 - U.noise2(rx * .002, 0, 17) * 130);
        }
        c.lineTo(W, H); c.closePath(); c.fill();

        c.translate(0, -d.camY);

        // trail behind the board
        for (k = 0; k < d.trail.length; k++) {
          var tr = d.trail[k];
          var tx = tr.x - d.px + PX;
          if (tx < -20) continue;
          c.globalAlpha = (tr.life / tr.max) * .5;
          c.fillStyle = '#ffe17d';
          c.beginPath(); c.arc(tx, tr.y - 6, 4, 0, 7); c.fill();
        }
        c.globalAlpha = 1;

        // the lava wave
        c.beginPath();
        c.moveTo(-20, H + 60 - d.camY);
        for (x = -20; x <= W + 20; x += 8) {
          c.lineTo(x, waveY(d.px + x - PX));
        }
        c.lineTo(W + 20, H + 60 - d.camY);
        c.closePath();
        var lg = c.createLinearGradient(0, 220, 0, H);
        lg.addColorStop(0, '#ffd54a');
        lg.addColorStop(.28, '#ff7b1c');
        lg.addColorStop(.7, '#c81e0c');
        lg.addColorStop(1, '#570d08');
        c.fillStyle = lg; c.fill();

        // crest glow line
        c.shadowColor = '#ffb14a'; c.shadowBlur = 16 + d.flash * 30;
        c.strokeStyle = '#ffe17d'; c.lineWidth = 3.5;
        c.beginPath();
        for (x = -20; x <= W + 20; x += 8) {
          var wy = waveY(d.px + x - PX);
          if (x === -20) c.moveTo(x, wy); else c.lineTo(x, wy);
        }
        c.stroke();
        c.shadowBlur = 0;

        // bright drift speckles on the surface
        c.fillStyle = 'rgba(255,240,180,.6)';
        for (k = 0; k < 14; k++) {
          var sxw = (Math.floor(d.px / 60) + k * 7) * 60 + U.hash2(k, 3, 9) * 60;
          var sxs = sxw - d.px + PX;
          if (sxs < -10 || sxs > W + 10) continue;
          c.fillRect(sxs, waveY(sxw) + 6 + U.hash2(k, 5, 9) * 20, 3, 3);
        }

        // obsidian spires
        for (k = 0; k < d.spires.length; k++) {
          var sp = d.spires[k];
          var spx = sp.x - d.px + PX;
          if (spx < -60 || spx > W + 60) continue;
          var by = waveY(sp.x) + 14;
          c.fillStyle = '#170a22';
          c.beginPath();
          c.moveTo(spx - 22, by);
          c.lineTo(spx - 5, by - sp.h);
          c.lineTo(spx, by - sp.h - 10);
          c.lineTo(spx + 6, by - sp.h + 6);
          c.lineTo(spx + 24, by);
          c.closePath(); c.fill();
          c.strokeStyle = 'rgba(168,85,247,.55)';
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(spx - 22, by);
          c.lineTo(spx - 5, by - sp.h);
          c.lineTo(spx, by - sp.h - 10);
          c.stroke();
          c.fillStyle = '#ff5c33';
          c.beginPath(); c.arc(spx, by - sp.h - 10, 2.5, 0, 7); c.fill();
        }

        // surfer
        c.save();
        c.translate(PX, d.y - 8);
        c.rotate(d.rot);
        c.shadowColor = '#ffe17d'; c.shadowBlur = 14;
        c.fillStyle = '#31122e';
        U.roundRect(c, -24, 2, 48, 9, 4.5); c.fill();
        c.shadowBlur = 0;
        c.strokeStyle = '#ffe17d'; c.lineWidth = 2;
        U.roundRect(c, -24, 2, 48, 9, 4.5); c.stroke();
        // rider
        c.fillStyle = '#1b0b1d';
        U.roundRect(c, -6, -18, 11, 20, 4); c.fill();
        c.beginPath(); c.arc(0, -23, 6, 0, 7); c.fill();
        c.fillStyle = '#ffb14a';
        c.fillRect(-2.5, -25, 6, 3);
        c.restore();

        // particles
        for (k = 0; k < d.parts.length; k++) {
          var p = d.parts[k];
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2.5, p.y + d.camY - 2.5, 5, 5);
        }
        c.globalAlpha = 1;

        // floating texts
        c.font = '800 17px Outfit, sans-serif';
        c.textAlign = 'center';
        for (k = 0; k < d.texts.length; k++) {
          var t = d.texts[k];
          c.globalAlpha = Math.max(0, t.life / t.max);
          c.fillStyle = t.col;
          c.fillText(t.t, t.x, t.y + d.camY);
        }
        c.globalAlpha = 1;
        c.restore();

        if (d.flash > 0) {
          c.fillStyle = 'rgba(255,225,125,' + d.flash * .25 + ')';
          c.fillRect(0, 0, W, H);
        }
      }
    });

    function cool(d, dt) {
      var k;
      for (k = d.parts.length - 1; k >= 0; k--) {
        var p = d.parts[k];
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.life -= dt;
        if (p.life <= 0) d.parts.splice(k, 1);
      }
      for (k = d.texts.length - 1; k >= 0; k--) {
        d.texts[k].y -= 34 * dt; d.texts[k].life -= dt;
        if (d.texts[k].life <= 0) d.texts.splice(k, 1);
      }
      for (k = d.trail.length - 1; k >= 0; k--) {
        d.trail[k].life -= dt;
        if (d.trail[k].life <= 0) d.trail.splice(k, 1);
      }
    }
  }

  window.Milo.register({
    id: 'meteor-surf', title: 'Meteor Surf', emo: '🌋', category: 'Arcade',
    tagline: 'Dive the dips, launch the crests',
    description: 'You are surfing a molten wave that never ends. Hold to dive: pressed ' +
      'into a downslope you gain huge speed, and carrying that speed over a crest ' +
      'launches you into the air — which is the only way past the obsidian spires. ' +
      'Land with your board matching the slope and each smooth touchdown extends a ' +
      'flow chain worth 25 points times the chain; slap down flat and the chain wipes ' +
      'along with most of your speed. The spires grow taller and closer the further you ride.',
    controls: ['Space (hold)', 'Hold anywhere'],
    colors: ['#7f1d1d', '#fb923c'],
    tags: ['endless', 'surf', 'one button', 'flow', 'lava'],
    mount: mount
  });
})();
