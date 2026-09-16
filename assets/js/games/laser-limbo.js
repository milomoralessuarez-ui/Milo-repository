/* Laser Limbo — beams sweep the room on the beat. Duck the high, jump the low. */
(function () {
  'use strict';

  var W = 820, H = 500;
  var FLOOR = 404, PX = 250, PW = 46;
  var STAND_H = 84, DUCK_H = 36;
  var HIGH_TOP = FLOOR - 102, HIGH_BOT = FLOOR - 58;
  var LOW_TOP = FLOOR - 34, LOW_BOT = FLOOR - 2;
  var GRAV = 1750, JUMP_V = -560;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var S = Milo.sound;

    function reset(g) {
      var d = g.data;
      d.t = 0;
      d.beatDur = 60 / 92;
      d.nextBeat = 0;
      d.beats = 0;
      d.wave = 0;
      d.bpm = 92;
      d.lasers = [];
      d.planAt = 3.2;
      d.y = 0;            // height above the floor
      d.vy = 0;
      d.ducking = false;
      d.air = false;
      d.lives = 3;
      d.inv = 0;
      d.combo = 0;
      d.bestCombo = 0;
      d.dodged = 0;
      d.parts = [];
      d.pulse = 0;
      d.shake = 0;
      d.banner = { t: 2.2, text: 'WAVE 1' };
      d.msg = null;
      d.floatScore = 0;
      g.score = 0;
      g.set('Score', 0);
      g.set('Lives', 3);
      g.set('Wave', 1);
      g.set('Combo', 0);
    }

    function leadBeats(w) { return w < 2 ? 2.4 : w < 4 ? 2.1 : w < 7 ? 1.8 : 1.55; }
    function sweepDur(w) { return Math.max(.2, .4 - w * .018); }

    function addLaser(d, kind, fireT, fake) {
      d.lasers.push({
        kind: kind, fireT: fireT, fake: !!fake, state: 'charge',
        x: -60, credited: false, dead: 0, sweep: sweepDur(d.wave)
      });
    }

    function planGroup(g) {
      var d = g.data;
      var w = d.wave, beat = d.beatDur, T = d.planAt;
      var r = Math.random();
      var last = T;

      if (w >= 2 && r < .24) {
        // double: opposite poses back to back
        var a = Math.random() < .5 ? 'high' : 'low';
        var b = a === 'high' ? 'low' : 'high';
        addLaser(d, a, T, false);
        var gap2 = beat * (w >= 6 ? .62 : .8);
        addLaser(d, b, T + gap2, false);
        last = T + gap2;
      } else if (w >= 3 && r < .48) {
        // trap: a telegraph that fizzles, then the opposite beam right after
        var f = Math.random() < .5 ? 'high' : 'low';
        var real = f === 'high' ? 'low' : 'high';
        addLaser(d, f, T, true);
        var gap3 = beat * (w >= 6 ? .75 : .95);
        addLaser(d, real, T + gap3, false);
        last = T + gap3;
      } else if (w >= 5 && r < .6) {
        // triple sweep of the same pose
        var k = Math.random() < .5 ? 'high' : 'low';
        addLaser(d, k, T, false);
        addLaser(d, k, T + beat, false);
        addLaser(d, k, T + beat * 2, false);
        last = T + beat * 2;
      } else {
        addLaser(d, Math.random() < .5 ? 'high' : 'low', T, false);
      }

      var restBeats = w < 1 ? 3 : w < 3 ? 2.5 : w < 5 ? 2.1 : w < 8 ? 1.8 : 1.5;
      d.planAt = last + Math.max(.62, beat * restBeats);
    }

    function pose(d) {
      var h = d.ducking && !d.air ? DUCK_H : STAND_H;
      var bot = FLOOR - d.y;
      return { top: bot - h, bot: bot, h: h };
    }

    function burst(d, x, y, col, n, spread) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.2832;
        d.parts.push({
          x: x, y: y,
          vx: Math.cos(a) * U.rand(50, spread), vy: Math.sin(a) * U.rand(50, spread),
          life: U.rand(.2, .55), max: .55, col: col, r: U.rand(1.6, 3.8)
        });
      }
    }

    function hitPlayer(g, laser) {
      var d = g.data;
      d.lives--;
      d.inv = 1.35;
      d.combo = 0;
      g.set('Combo', 0);
      g.set('Lives', Math.max(0, d.lives));
      d.shake = .5;
      d.msg = { t: .9, text: laser.kind === 'high' ? 'THAT ONE WAS A DUCK' : 'THAT ONE WAS A JUMP', col: '#ff5252' };
      S.explode();
      burst(d, PX, FLOOR - 40, '#ff5252', 26, 340);
      if (d.lives <= 0) {
        g.gameOver({
          emo: '🔴', title: 'Vaporised',
          text: d.dodged + ' beams dodged across ' + (d.wave + 1) + ' waves · best streak ' +
            d.bestCombo + '.'
        });
      }
    }

    function dodged(g, laser) {
      var d = g.data;
      d.dodged++;
      d.combo++;
      if (d.combo > d.bestCombo) d.bestCombo = d.combo;
      g.set('Combo', d.combo);
      var pts = 120 + d.wave * 25 + Math.min(d.combo, 40) * 6;
      g.score += pts;
      g.set('Score', U.fmt(g.score));
      d.floatScore = 1;
      S.tone({ f: 880, d: .06, v: .05, type: 'sine' });
      burst(d, PX, laser.kind === 'high' ? HIGH_BOT : LOW_TOP, '#67e8f9', 6, 180);
      if (d.combo % 15 === 0) { S.powerup(); d.banner = { t: 1.4, text: d.combo + ' IN A ROW' }; }
    }

    return Milo.arcade(host, {
      id: 'laser-limbo',
      w: W, h: H, bg: '#07040e',
      stats: ['Score', 'Lives', 'Wave', 'Combo'],
      emo: '🔴',
      touch: 'dpad',
      start: {
        title: 'Laser Limbo',
        text: 'Beams fire across the room on the beat. A line at head height means duck, a ' +
          'line at your ankles means jump — the emitter charges for about two beats first, ' +
          'so watch where it lights up. Later waves fire doubles, and some telegraphs are ' +
          'fakes designed to get you airborne at the wrong moment.',
        keys: ['↑ jump', '↓ duck', 'Space']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, inp = g.input;
        d.t += dt;
        d.pulse = Math.max(0, d.pulse - dt * 3.2);
        d.shake = Math.max(0, d.shake - dt * 1.6);
        d.inv = Math.max(0, d.inv - dt);
        d.floatScore = Math.max(0, d.floatScore - dt * 1.6);
        if (d.banner) { d.banner.t -= dt; if (d.banner.t <= 0) d.banner = null; }
        if (d.msg) { d.msg.t -= dt; if (d.msg.t <= 0) d.msg = null; }

        g.score += 9 * dt;
        g.set('Score', U.fmt(g.score));

        // --- beat clock ---
        while (d.t >= d.nextBeat) {
          d.nextBeat += d.beatDur;
          d.beats++;
          var w = Math.min(11, Math.floor(d.beats / 14));
          if (w !== d.wave) {
            d.wave = w;
            d.bpm = Math.min(178, 92 + w * 8);
            d.beatDur = 60 / d.bpm;
            d.banner = { t: 1.8, text: 'WAVE ' + (w + 1) + '  ·  ' + d.bpm + ' BPM' };
            g.set('Wave', w + 1);
            S.tone({ f: 330, d: .18, v: .06, type: 'square' });
          }
          d.pulse = 1;
          S.tone({ f: 120, f2: 44, d: .14, v: .1, type: 'sine' });
          if (d.beats % 2 === 1) S.noise(.025, .02, 7600);
        }

        // --- input ---
        d.ducking = inp.down('down');
        if ((inp.pressed('up') || inp.pressed('action')) && !d.air) {
          d.air = true;
          d.vy = JUMP_V * (d.ducking ? .86 : 1);
          S.tone({ f: 300, f2: 760, d: .12, v: .07, type: 'square' });
          burst(d, PX, FLOOR, '#a78bfa', 6, 140);
        }
        if (d.air) {
          d.vy += GRAV * dt * (inp.down('down') ? 1.7 : 1);   // duck in the air to drop fast
          d.y -= d.vy * dt;                                    // vy is negative going up
          if (d.y <= 0) {
            d.y = 0; d.vy = 0; d.air = false;
            burst(d, PX, FLOOR, '#334155', 5, 110);
          }
        }

        // --- planning ---
        if (d.t > d.planAt - leadBeats(d.wave) * d.beatDur) planGroup(g);

        // --- lasers ---
        var p = pose(d);
        for (var i = d.lasers.length - 1; i >= 0; i--) {
          var L = d.lasers[i];
          if (L.state === 'charge') {
            if (d.t >= L.fireT) {
              if (L.fake) {
                L.state = 'fizzle';
                L.dead = .45;
                S.tone({ f: 420, f2: 90, d: .3, v: .07, type: 'sawtooth' });
              } else {
                L.state = 'fire';
                L.x = -50;
                S.noise(.14, .09, 5200);
                S.tone({ f: L.kind === 'high' ? 760 : 420, f2: L.kind === 'high' ? 300 : 180, d: .22, v: .08, type: 'sawtooth' });
                d.shake = Math.max(d.shake, .2);
              }
            }
          } else if (L.state === 'fire') {
            var prevX = L.x;
            L.x += (W + 120) / L.sweep * dt;
            var top = L.kind === 'high' ? HIGH_TOP : LOW_TOP;
            var bot = L.kind === 'high' ? HIGH_BOT : LOW_BOT;
            if (Math.random() < dt * 40) burst(d, L.x, U.rand(top, bot), L.kind === 'high' ? '#ff5252' : '#ffb03a', 1, 90);
            // swept test: a fast beam can clear the player's width inside one frame
            if (!L.credited && L.x > PX - PW / 2 - 4 && prevX < PX + PW / 2 + 4) {
              if (d.inv <= 0 && p.top < bot && p.bot > top) {
                L.credited = true;
                hitPlayer(g, L);
                if (g.state !== 'play') return;
              }
            }
            if (!L.credited && L.x > PX + PW / 2 + 6) {
              L.credited = true;
              dodged(g, L);
            }
            if (L.x > W + 70) d.lasers.splice(i, 1);
          } else if (L.state === 'fizzle') {
            L.dead -= dt;
            if (L.dead <= 0) d.lasers.splice(i, 1);
          }
        }

        for (var k = d.parts.length - 1; k >= 0; k--) {
          var q = d.parts[k];
          q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 520 * dt; q.life -= dt;
          if (q.life <= 0) d.parts.splice(k, 1);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 10, U.rand(-1, 1) * d.shake * 10);

        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#140a2c'); bg.addColorStop(.7, '#0a0618'); bg.addColorStop(1, '#05030d');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // perspective floor grid
        c.save();
        c.strokeStyle = 'rgba(124,92,255,' + (.18 + d.pulse * .3).toFixed(3) + ')';
        c.lineWidth = 1;
        for (var gx = 0; gx <= W; gx += 40) {
          c.beginPath();
          c.moveTo(gx, FLOOR);
          c.lineTo(W / 2 + (gx - W / 2) * 2.4, H + 60);
          c.stroke();
        }
        for (var gy = 0; gy < 6; gy++) {
          var yy = FLOOR + gy * gy * 5.5 + 6;
          if (yy > H) break;
          c.beginPath(); c.moveTo(0, yy); c.lineTo(W, yy); c.stroke();
        }
        c.restore();

        // back wall glow
        var gl = c.createRadialGradient(W / 2, FLOOR - 120, 20, W / 2, FLOOR - 120, 420);
        gl.addColorStop(0, 'rgba(103,232,249,' + (.05 + d.pulse * .07).toFixed(3) + ')');
        gl.addColorStop(1, 'rgba(103,232,249,0)');
        c.fillStyle = gl; c.fillRect(0, 0, W, FLOOR);

        // emitter pods on the left wall
        c.fillStyle = '#1b2340';
        U.roundRect(c, 0, HIGH_TOP - 12, 34, HIGH_BOT - HIGH_TOP + 24, 8); c.fill();
        U.roundRect(c, 0, LOW_TOP - 12, 34, LOW_BOT - LOW_TOP + 24, 8); c.fill();

        // charging telegraphs
        for (var i = 0; i < d.lasers.length; i++) {
          var L = d.lasers[i];
          var top = L.kind === 'high' ? HIGH_TOP : LOW_TOP;
          var bot = L.kind === 'high' ? HIGH_BOT : LOW_BOT;
          var mid = (top + bot) / 2;
          var col = L.kind === 'high' ? '#ff5252' : '#ffb03a';

          if (L.state === 'charge') {
            var lead = Math.max(.001, leadBeats(d.wave) * d.beatDur);
            var k = U.clamp(1 - (L.fireT - d.t) / lead, 0, 1);
            c.save();
            c.globalAlpha = .25 + k * .55;
            c.strokeStyle = col;
            c.lineWidth = 2 + k * 3;
            c.setLineDash([16, 12]);
            c.lineDashOffset = -d.t * 120;
            c.beginPath(); c.moveTo(24, mid); c.lineTo(W, mid); c.stroke();
            c.setLineDash([]);
            c.restore();
            // emitter charge
            c.fillStyle = col;
            c.globalAlpha = .35 + .65 * k;
            U.roundRect(c, 4, bot - (bot - top) * k, 26, (bot - top) * k, 5); c.fill();
            c.globalAlpha = 1;
            // instruction, early waves only
            if (d.wave < 3) {
              c.textAlign = 'left';
              c.fillStyle = col;
              c.font = '800 16px Outfit, sans-serif';
              c.fillText(L.kind === 'high' ? 'DUCK' : 'JUMP', 42, mid - 12);
            }
          } else if (L.state === 'fizzle') {
            c.save();
            c.globalAlpha = Math.max(0, d.lasers[i].dead / .45) * .6;
            c.strokeStyle = '#64748b'; c.lineWidth = 2;
            c.setLineDash([6, 10]);
            c.beginPath(); c.moveTo(24, mid); c.lineTo(W, mid); c.stroke();
            c.setLineDash([]);
            c.textAlign = 'left';
            c.fillStyle = '#94a3b8';
            c.font = '800 15px Outfit, sans-serif';
            c.fillText('FAKE', 42, mid - 12);
            c.restore();
          }
        }

        drawPlayer(c, d);

        // firing beams (drawn over the player so they read as lethal)
        for (var j = 0; j < d.lasers.length; j++) {
          var B = d.lasers[j];
          if (B.state !== 'fire') continue;
          var t2 = B.kind === 'high' ? HIGH_TOP : LOW_TOP;
          var b2 = B.kind === 'high' ? HIGH_BOT : LOW_BOT;
          var col2 = B.kind === 'high' ? '#ff5252' : '#ffb03a';
          // afterglow trail
          var tg = c.createLinearGradient(B.x - 220, 0, B.x, 0);
          tg.addColorStop(0, 'rgba(255,255,255,0)');
          tg.addColorStop(1, col2);
          c.globalAlpha = .5;
          c.fillStyle = tg;
          c.fillRect(Math.max(0, B.x - 220), t2 + 6, Math.min(220, B.x), b2 - t2 - 12);
          c.globalAlpha = 1;
          c.save();
          c.shadowColor = col2; c.shadowBlur = 26;
          c.fillStyle = '#fff';
          U.roundRect(c, B.x - 9, t2, 18, b2 - t2, 9); c.fill();
          c.fillStyle = col2;
          U.roundRect(c, B.x - 5, t2 + 3, 10, b2 - t2 - 6, 5); c.fill();
          c.restore();
        }

        // particles
        for (var p2 = 0; p2 < d.parts.length; p2++) {
          var q = d.parts[p2];
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.fillRect(q.x - q.r, q.y - q.r, q.r * 2, q.r * 2);
        }
        c.globalAlpha = 1;

        // floor line
        c.strokeStyle = 'rgba(167,139,250,' + (.5 + d.pulse * .4).toFixed(3) + ')';
        c.lineWidth = 3;
        c.beginPath(); c.moveTo(0, FLOOR); c.lineTo(W, FLOOR); c.stroke();

        // HUD extras
        c.textAlign = 'center';
        if (d.banner) {
          c.globalAlpha = Math.min(1, d.banner.t * 1.6);
          c.fillStyle = '#67e8f9';
          c.font = '800 34px Outfit, sans-serif';
          c.fillText(d.banner.text, W / 2, 96);
          c.globalAlpha = 1;
        }
        if (d.msg) {
          c.globalAlpha = Math.min(1, d.msg.t * 2);
          c.fillStyle = d.msg.col;
          c.font = '800 22px Outfit, sans-serif';
          c.fillText(d.msg.text, W / 2, 140);
          c.globalAlpha = 1;
        }
        if (d.combo >= 3) {
          c.fillStyle = 'rgba(255,255,255,.75)';
          c.font = '800 18px Outfit, sans-serif';
          c.fillText(d.combo + '× STREAK', W / 2, 52);
        }

        // lives as shield pips
        c.textAlign = 'left';
        for (var lv = 0; lv < 3; lv++) {
          c.fillStyle = lv < d.lives ? '#67e8f9' : 'rgba(255,255,255,.14)';
          c.beginPath(); c.arc(28 + lv * 22, H - 26, 8, 0, 6.2832); c.fill();
        }
        c.fillStyle = 'rgba(255,255,255,.4)';
        c.font = '700 12px Outfit, sans-serif';
        c.fillText('↑ JUMP the low beam   ·   ↓ DUCK the high beam', 100, H - 21);
        c.restore();
      }
    });

    function drawPlayer(c, d) {
      var p = pose(d);
      var blink = d.inv > 0 && (Math.floor(d.inv * 14) % 2 === 0);
      c.save();
      c.globalAlpha = blink ? .35 : 1;

      // shadow
      c.fillStyle = 'rgba(0,0,0,.4)';
      c.beginPath();
      c.ellipse(PX, FLOOR + 3, PW / 2 + 6 - d.y * .02, 6, 0, 0, 6.2832);
      c.fill();

      var bodyTop = p.top, h = p.h;
      var grd = c.createLinearGradient(0, bodyTop, 0, p.bot);
      grd.addColorStop(0, '#67e8f9');
      grd.addColorStop(1, '#3b82f6');
      c.fillStyle = grd;
      c.shadowColor = '#22d3ee'; c.shadowBlur = 16;
      U.roundRect(c, PX - PW / 2, bodyTop + h * .3, PW, h * .7, 10); c.fill();
      // head
      c.beginPath();
      c.arc(PX, bodyTop + h * .18, h * .19, 0, 6.2832);
      c.fill();
      c.shadowBlur = 0;
      // visor
      c.fillStyle = '#0b1120';
      U.roundRect(c, PX - 12, bodyTop + h * .12, 24, h * .1, 4); c.fill();
      // legs
      c.fillStyle = '#1e3a8a';
      if (d.air) {
        U.roundRect(c, PX - 16, p.bot - 14, 12, 14, 4); c.fill();
        U.roundRect(c, PX + 4, p.bot - 18, 12, 18, 4); c.fill();
      } else {
        U.roundRect(c, PX - 17, p.bot - 10, 13, 10, 4); c.fill();
        U.roundRect(c, PX + 4, p.bot - 10, 13, 10, 4); c.fill();
      }
      c.restore();
    }
  }

  window.Milo.register({
    id: 'laser-limbo', title: 'Laser Limbo', emo: '🔴', category: 'Arcade',
    tagline: 'Duck the high beam, jump the low one',
    description: 'Emitters on the wall charge for a couple of beats and then sweep a beam ' +
      'across the room at one of two heights: head height means duck, ankle height means ' +
      'jump, and standing still means neither. From wave three the room starts lying to you ' +
      '— a telegraph fizzles out just as you commit, and the real beam at the opposite height ' +
      'arrives three-quarters of a beat later while you are still in the air. Waves push the ' +
      'tempo from 92 to 178 BPM and shorten the warning, with three shields and a streak ' +
      'multiplier on every clean dodge. Tip: duck late rather than early — the crouch is ' +
      'instant, but a jump commits you for half a second.',
    controls: ['↑ jump', '↓ duck', 'Space', 'D-pad'],
    colors: ['#2a0713', '#ff5252'],
    tags: ['reflex', 'rhythm', 'dodge', 'survival', 'neon'],
    mount: mount
  });
})();
