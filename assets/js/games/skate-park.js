/* Skate Park — pump the pipe, hold the trick, land it clean or lose the combo. */
(function () {
  'use strict';
  var W = 900, H = 560, TAU = Math.PI * 2;
  var PL = 110, PR = 790, R = 170, FLOOR = 460, G = 1350;
  var BOXL = 415, BOXR = 505, BOXTOP = FLOOR - 26;
  var TIME = 75;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function ySurf(x) {
      if (x < PL + R) {
        var dx = x - (PL + R);
        return (FLOOR - R) + Math.sqrt(Math.max(0, R * R - dx * dx));
      }
      if (x > PR - R) {
        var dx2 = x - (PR - R);
        return (FLOOR - R) + Math.sqrt(Math.max(0, R * R - dx2 * dx2));
      }
      return FLOOR;
    }
    function slopeAt(x) {              // dy/dx
      if (x < PL + R) {
        var dx = x - (PL + R);
        return -dx / Math.max(14, Math.sqrt(R * R - dx * dx));
      }
      if (x > PR - R) {
        var dx2 = x - (PR - R);
        return -dx2 / Math.max(14, Math.sqrt(R * R - dx2 * dx2));
      }
      return 0;
    }

    function reset(g) {
      var d = g.data;
      d.mode = 'ride';
      d.x = 300; d.y = ySurf(300);
      d.v = 240;                       // signed speed along the surface
      d.vx = 0; d.vy = 0;
      d.spin = 0; d.flip = 0; d.grab = 0;
      d.airPts = 0;
      d.mult = 1;
      d.combo = 0;
      d.time = TIME;
      d.bailT = 0;
      d.multPulse = 0;
      d.parts = [];
      d.floats = [];
      d.trickName = '';
      d.over = false;
      g.set('Score', 0);
      g.set('Combo', 'x1');
      g.set('Time', TIME);
    }

    function addFloat(d, x, y, txt, col) {
      d.floats.push({ x: x, y: y, txt: txt, col: col || '#ffd257', t: 1.4 });
    }

    function dust(d, x, y, n, col) {
      for (var i = 0; i < n; i++) {
        d.parts.push({
          x: x, y: y, vx: U.rand(-120, 120), vy: U.rand(-160, -20),
          t: U.rand(.25, .55), max: .55, col: col || '#c9c2b8'
        });
      }
    }

    function bail(g, why) {
      var d = g.data;
      d.mode = 'bail';
      d.bailT = 1.0;
      d.airPts = 0;
      d.mult = 1;
      d.combo = 0;
      d.v *= .3;
      d.spin = 0; d.flip = 0; d.grab = 0;
      g.set('Combo', 'x1');
      Milo.sound.hit();
      dust(d, d.x, d.y, 16, '#fb7185');
      addFloat(d, d.x, d.y - 60, why || 'BAIL!', '#fb7185');
    }

    function landClean(g) {
      var d = g.data;
      if (d.airPts > 2) {
        var banked = Math.round(d.airPts) * d.mult;
        g.score += banked;
        d.combo++;
        if (d.mult < 8) { d.mult++; d.multPulse = .5; Milo.sound.powerup(); }
        else Milo.sound.coin();
        addFloat(d, d.x, d.y - 70, '+' + U.fmt(banked) + '  x' + d.mult, '#4ade80');
        g.set('Score', U.fmt(g.score));
        g.set('Combo', 'x' + d.mult);
      }
      d.airPts = 0;
      d.spin = 0; d.flip = 0; d.grab = 0;
      d.trickName = '';
      dust(g.data, d.x, d.y + 6, 6);
    }

    return Milo.arcade(host, {
      id: 'skate-park',
      w: W, h: H, bg: '#8ecdf2',
      stats: ['Score', 'Combo', 'Time'],
      touchButtons: [
        { key: 'left', label: '↺' }, { key: 'down', label: 'GRAB' },
        { key: 'right', label: 'FLIP' }, { key: 'action', label: 'JUMP' }
      ],
      emo: '🛹',
      start: {
        title: 'Skate Park',
        text: 'A 75-second halfpipe session. Hold Space through the transitions to pump ' +
          'for speed, then hold tricks in the air — spin, flip, grab. Land straight to ' +
          'bank the points and grow the combo; a bail resets it to x1. Ollie (Space) ' +
          'onto the box on the flat to grind it.',
        keys: ['Space pump / ollie', '← spin', '→ flip', '↓ grab']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, inp = g.input;
        if (d.over) return;

        d.time -= dt;
        g.set('Time', Math.max(0, Math.ceil(d.time)));
        if (d.time <= 0) {
          d.over = true;
          g.gameOver({
            emo: '🛹',
            title: 'Session over',
            text: 'Best combo x' + Math.max(1, d.mult) + '. Bank tricks faster to climb the board.',
            score: g.score
          });
          return;
        }
        if (d.multPulse > 0) d.multPulse -= dt;

        var pump = inp.down('action') || inp.down('up');

        if (d.mode === 'bail') {
          d.bailT -= dt;
          d.x += d.v * dt;
          d.x = U.clamp(d.x, PL + 10, PR - 10);
          d.y = ySurf(d.x);
          d.v *= 1 - 2.4 * dt;
          if (d.bailT <= 0) d.mode = 'ride';
        } else if (d.mode === 'ride') {
          var sl = slopeAt(d.x);
          var th = Math.atan(sl);
          // Gravity along the slope, pump for extra push, rolling friction.
          d.v += G * Math.sin(th) * dt;
          if (pump && Math.abs(th) > .3) {
            d.v += 300 * Math.sign(d.v || 1) * dt;
            if (Math.random() < .25) dust(d, d.x, d.y + 4, 1, '#e8e2d6');
          }
          d.v *= 1 - (Math.abs(th) < .1 ? .10 : .04) * dt;
          d.v = U.clamp(d.v, -980, 980);

          d.x += d.v * Math.cos(th) * dt;

          // Ollie from the flat.
          if (inp.pressed('action') && Math.abs(th) < .3) {
            d.mode = 'air';
            d.vx = d.v; d.vy = -390;
            d.lowAir = true;
            Milo.sound.jump();
            dust(d, d.x, FLOOR + 2, 5);
          } else if (d.x <= PL + 6 && d.v < 0) {
            // Launch off the left lip.
            launch(d, th);
          } else if (d.x >= PR - 6 && d.v > 0) {
            launch(d, th);
          } else {
            d.x = U.clamp(d.x, PL + 6, PR - 6);
            d.y = ySurf(d.x);
            // Ride into the grind box: that hurts.
            if (Math.abs(th) < .1 && d.x > BOXL - 12 && d.x < BOXR + 12) {
              if (Math.abs(d.v) > 110) { bail(g, 'BOX!'); }
              else { d.v = -d.v * .4; d.x = d.v < 0 ? BOXL - 13 : BOXR + 13; }
            }
          }
        } else if (d.mode === 'air') {
          d.vy += G * dt;
          // Gentle pipe magnetism keeps big airs over the pipe.
          d.vx += (d.x < W / 2 ? 1 : -1) * 30 * dt;
          d.x += d.vx * dt;
          d.x = U.clamp(d.x, PL + 6, PR - 6);
          d.y += d.vy * dt;

          // Held tricks.
          var doing = [];
          if (inp.down('left')) { d.spin += 340 * dt; d.airPts += 46 * dt; doing.push(Math.round(d.spin / 10) * 10 + '° spin'); }
          if (inp.down('right')) { d.flip += 480 * dt; d.airPts += 52 * dt; doing.push('kickflip'); }
          if (inp.down('down')) { d.grab += dt; d.airPts += 34 * dt; doing.push('melon grab'); }
          d.trickName = doing.join(' + ');

          // Grind catch over the box.
          if (d.lowAir && d.vy > 0 && d.x > BOXL - 4 && d.x < BOXR + 4 && d.y >= BOXTOP - 10) {
            if (spinOk(d) && flipOk(d)) {
              d.mode = 'grind';
              d.y = BOXTOP;
              d.v = d.vx;
              d.spin = 0; d.flip = 0;
              Milo.sound.tone({ f: 1100, f2: 700, d: .12, v: .08, type: 'square' });
            } else { bail(g, 'CAUGHT AN EDGE'); }
            return;
          }

          // Touchdown.
          var sy = ySurf(d.x);
          if (d.vy > 0 && d.y >= sy) {
            d.y = sy;
            var th2 = Math.atan(slopeAt(d.x));
            if (spinOk(d) && flipOk(d)) {
              d.mode = 'ride';
              d.v = d.vx * Math.cos(th2) + d.vy * Math.sin(th2);
              landClean(g);
            } else {
              bail(g, flipOk(d) ? 'UNDER-ROTATED' : 'MID-FLIP!');
            }
          }
        } else if (d.mode === 'grind') {
          d.x += d.v * dt;
          d.airPts += 62 * dt;
          if (Math.random() < .7) {
            d.parts.push({
              x: d.x - Math.sign(d.v) * 10, y: BOXTOP + 4,
              vx: -Math.sign(d.v) * U.rand(40, 140), vy: U.rand(-60, -10),
              t: .25, max: .25, col: U.choice(['#ffd257', '#ffb703', '#fff'])
            });
          }
          if (Math.abs(d.v) < 40) d.v = 60 * (d.v < 0 ? -1 : 1);
          if (d.x < BOXL - 4 || d.x > BOXR + 4) {
            d.mode = 'air';
            d.vx = d.v; d.vy = 30;
            d.lowAir = false;
          }
        }

        // FX.
        for (var pi = d.parts.length - 1; pi >= 0; pi--) {
          var p = d.parts[pi];
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.t -= dt;
          if (p.t <= 0) d.parts.splice(pi, 1);
        }
        for (pi = d.floats.length - 1; pi >= 0; pi--) {
          d.floats[pi].t -= dt;
          if (d.floats[pi].t <= 0) d.floats.splice(pi, 1);
        }

        function launch(dd, th3) {
          dd.mode = 'air';
          dd.lowAir = false;
          var sgn = dd.v < 0 ? -1 : 1;
          dd.vx = dd.v * Math.cos(th3) * .5;
          dd.vy = -Math.abs(dd.v) * Math.abs(Math.sin(th3)) * .96;
          if (dd.vy > -180) { dd.vy = -180; }
          Milo.sound.jump();
          dust(dd, dd.x, dd.y, 4, '#e8e2d6');
          void sgn;
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;

        // Sky, sun, clouds.
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#6db7ea');
        sky.addColorStop(.7, '#bfe0f5');
        sky.addColorStop(1, '#e9d9b8');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        c.fillStyle = '#fff3c4';
        c.beginPath(); c.arc(760, 80, 38, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,255,255,.85)';
        [[150, 90, 1], [420, 60, .7], [640, 130, .85]].forEach(function (cl) {
          c.beginPath();
          c.arc(cl[0], cl[1], 22 * cl[2], 0, TAU);
          c.arc(cl[0] + 24 * cl[2], cl[1] - 8 * cl[2], 17 * cl[2], 0, TAU);
          c.arc(cl[0] + 46 * cl[2], cl[1], 19 * cl[2], 0, TAU);
          c.fill();
        });

        // Skyline + fence behind the pipe.
        c.fillStyle = 'rgba(74,98,138,.45)';
        [[0, 200, 70, 90], [80, 170, 55, 120], [700, 190, 90, 100], [820, 160, 70, 130]].forEach(function (b) {
          c.fillRect(b[0], b[1], b[2], b[3]);
        });
        c.strokeStyle = 'rgba(90,104,128,.5)'; c.lineWidth = 2;
        for (var fx2 = 20; fx2 < W; fx2 += 26) {
          c.beginPath(); c.moveTo(fx2, FLOOR - R - 60); c.lineTo(fx2, FLOOR - R - 8); c.stroke();
        }
        c.beginPath(); c.moveTo(0, FLOOR - R - 58); c.lineTo(W, FLOOR - R - 58); c.stroke();

        // The pipe body.
        c.fillStyle = '#b9b2a6';
        c.beginPath();
        c.moveTo(0, FLOOR - R);
        c.lineTo(PL, FLOOR - R);
        for (var x2 = PL; x2 <= PR; x2 += 10) c.lineTo(x2, ySurf(x2));
        c.lineTo(PR, FLOOR - R);
        c.lineTo(W, FLOOR - R);
        c.lineTo(W, H); c.lineTo(0, H);
        c.closePath(); c.fill();
        // Graffiti splashes on the transitions.
        [[PL + 60, FLOOR - 40, '#f472b6'], [PL + 130, FLOOR - 14, '#22d3ee'],
        [PR - 90, FLOOR - 30, '#a3e635'], [PR - 150, FLOOR - 8, '#fb923c']].forEach(function (gr) {
          c.fillStyle = gr[2];
          c.globalAlpha = .5;
          c.beginPath();
          c.ellipse(gr[0], gr[1], 26, 11, .4, 0, TAU);
          c.fill();
          c.globalAlpha = 1;
        });
        // Surface line.
        c.strokeStyle = '#8f887c'; c.lineWidth = 4; c.lineCap = 'round';
        c.beginPath();
        for (x2 = PL; x2 <= PR; x2 += 10) {
          if (x2 === PL) c.moveTo(x2, ySurf(x2)); else c.lineTo(x2, ySurf(x2));
        }
        c.stroke();
        // Coping.
        c.fillStyle = '#fb923c';
        c.beginPath(); c.arc(PL, FLOOR - R, 7, 0, TAU); c.fill();
        c.beginPath(); c.arc(PR, FLOOR - R, 7, 0, TAU); c.fill();
        // Decks.
        c.fillStyle = '#a49c8f';
        c.fillRect(0, FLOOR - R - 8, PL, 8);
        c.fillRect(PR, FLOOR - R - 8, W - PR, 8);

        // Grind box.
        c.fillStyle = '#7a5c3e';
        U.roundRect(c, BOXL, BOXTOP, BOXR - BOXL, FLOOR - BOXTOP, 4); c.fill();
        c.fillStyle = '#e2b04a';
        c.fillRect(BOXL - 3, BOXTOP - 4, BOXR - BOXL + 6, 5);
        c.fillStyle = 'rgba(255,255,255,.25)';
        c.fillRect(BOXL - 3, BOXTOP - 4, BOXR - BOXL + 6, 2);

        // Particles.
        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.t / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
        });
        c.globalAlpha = 1;

        // Skater.
        c.save();
        c.translate(d.x, d.y - 16);
        var facing = (d.mode === 'air' ? (d.vx < 0 ? -1 : 1) : (d.v < 0 ? -1 : 1));
        if (d.mode === 'bail') {
          c.rotate(Math.sin(g.t * 20) * .4);
          c.fillStyle = '#334155';
          U.roundRect(c, -12, -4, 24, 12, 5); c.fill();
          c.fillStyle = '#fcd9b8';
          c.beginPath(); c.arc(-14, 0, 6, 0, TAU); c.fill();
          c.fillStyle = '#e11d48';
          U.roundRect(c, 4, -14, 20, 6, 3); c.fill();   // loose board
        } else {
          var lean = d.mode === 'air' ? d.spin * Math.PI / 180 * facing
            : Math.atan(slopeAt(d.x)) * .8;
          c.rotate(lean);
          c.scale(facing, 1);
          var crouch = (d.mode === 'ride' && (g.input.down('action') || g.input.down('up'))) ? 4 : 0;
          var grabbing = d.mode === 'air' && g.input.down('down');
          // board (kickflip = fake 3D spin via y-scale)
          c.save();
          c.translate(0, 14);
          if (d.mode === 'air') c.scale(1, Math.max(.15, Math.abs(Math.cos(d.flip * Math.PI / 180))));
          c.fillStyle = '#e11d48';
          U.roundRect(c, -16, -3, 32, 6, 3); c.fill();
          c.fillStyle = '#1f2937';
          c.beginPath(); c.arc(-9, 5, 3.4, 0, TAU); c.fill();
          c.beginPath(); c.arc(9, 5, 3.4, 0, TAU); c.fill();
          c.restore();
          // legs
          c.strokeStyle = '#1e3a5f'; c.lineWidth = 5; c.lineCap = 'round';
          c.beginPath();
          c.moveTo(-7, 11); c.lineTo(-5, 2 + crouch);
          c.moveTo(7, 11); c.lineTo(5, 2 + crouch);
          c.stroke();
          // torso
          c.fillStyle = '#0d9488';
          U.roundRect(c, -8, -16 + crouch, 16, 20, 6); c.fill();
          // arms
          c.strokeStyle = '#0d9488'; c.lineWidth = 4;
          if (grabbing) {
            c.beginPath(); c.moveTo(6, -8 + crouch); c.lineTo(12, 10); c.stroke();
          } else {
            c.beginPath(); c.moveTo(6, -10 + crouch); c.lineTo(15, -2 + crouch); c.stroke();
            c.beginPath(); c.moveTo(-6, -10 + crouch); c.lineTo(-14, -4 + crouch); c.stroke();
          }
          // head + cap
          c.fillStyle = '#fcd9b8';
          c.beginPath(); c.arc(0, -22 + crouch, 7, 0, TAU); c.fill();
          c.fillStyle = '#e11d48';
          c.beginPath(); c.arc(0, -24 + crouch, 7, Math.PI, TAU); c.fill();
          c.fillRect(0, -25 + crouch, 11, 3);
        }
        c.restore();

        // Current trick readout.
        if (d.mode === 'air' && d.trickName) {
          c.textAlign = 'center';
          c.font = '800 15px Outfit, sans-serif';
          c.fillStyle = '#1e3a5f';
          c.fillText(d.trickName + '  +' + Math.round(d.airPts), d.x, d.y - 58);
        }
        if (d.mode === 'grind') {
          c.textAlign = 'center';
          c.font = '800 15px Outfit, sans-serif';
          c.fillStyle = '#b45309';
          c.fillText('GRIND +' + Math.round(d.airPts), d.x, d.y - 48);
        }

        // Floats.
        c.textAlign = 'center';
        c.font = '800 18px Outfit, sans-serif';
        d.floats.forEach(function (f) {
          c.globalAlpha = Math.min(1, f.t);
          c.fillStyle = f.col;
          c.fillText(f.txt, f.x, f.y - (1.4 - f.t) * 34);
        });
        c.globalAlpha = 1;

        // Combo badge.
        if (d.mult > 1) {
          var pulse = 1 + Math.max(0, d.multPulse) * .8;
          c.save();
          c.translate(W / 2, 84);
          c.scale(pulse, pulse);
          c.fillStyle = 'rgba(20,26,44,.55)';
          U.roundRect(c, -44, -22, 88, 40, 12); c.fill();
          c.fillStyle = ['#fff', '#fff', '#4ade80', '#22d3ee', '#a78bfa', '#f472b6', '#fb923c', '#ffd257', '#ffd257'][d.mult] || '#ffd257';
          c.font = '800 26px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('x' + d.mult, 0, 8);
          c.restore();
        }

        // Session clock strip.
        var tw = (W - 40) * U.clamp(d.time / TIME, 0, 1);
        c.fillStyle = 'rgba(20,26,44,.28)';
        U.roundRect(c, 20, H - 22, W - 40, 8, 4); c.fill();
        c.fillStyle = d.time < 12 ? '#fb7185' : '#0d9488';
        if (tw > 4) { U.roundRect(c, 20, H - 22, tw, 8, 4); c.fill(); }
      }
    });

    function spinOk(d) {
      var r = Math.abs(d.spin % 180);
      return r < 42 || r > 138;
    }
    function flipOk(d) {
      var f = Math.abs(d.flip % 360);
      return f < 62 || f > 298;
    }
  }

  window.Milo.register({
    id: 'skate-park', title: 'Skate Park', emo: '🛹', category: 'Sports',
    tagline: 'Pump, air, grind, don’t bail',
    description: 'A 75-second halfpipe session where every trick is a held key: spin with ' +
      '←, kickflip with →, grab with ↓, and stack them in one air for bigger ' +
      'points. Landing mid-spin or mid-flip is a bail that resets your combo multiplier ' +
      'to x1, so let go early enough to straighten out. Pump the transitions with Space ' +
      'for amplitude, and ollie onto the box on the flat — grinding it pays better per ' +
      'second than any grab.',
    controls: ['Space pump / ollie', '← spin', '→ flip', '↓ grab'],
    colors: ['#8ecdf2', '#e11d48'],
    tags: ['skateboarding', 'tricks', 'combo', 'halfpipe', 'timing'],
    mount: mount
  });
})();
