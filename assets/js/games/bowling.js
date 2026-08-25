/* Bowling — ten frames, real scoring, with hook on the throw. */
(function () {
  'use strict';
  var W = 520, H = 700, LANE_L = 90, LANE_R = W - 90;
  var PIN_Y = 140;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.frames = [];
      for (var i = 0; i < 10; i++) d.frames.push([]);
      d.frame = 0;
      d.roll = 0;
      d.phase = 'aim';           // aim | power | spin | rolling | settle
      d.marker = 0;
      d.dir = 1;
      d.power = 0;
      d.spin = 0;
      setupPins(d, true);
      d.ball = null;
      g.set('Frame', '1/10');
      g.set('Score', 0);
      g.set('Roll', '1st');
    }

    function setupPins(d, all) {
      d.pins = [];
      var rows = [[0], [-1, 1], [-2, 0, 2], [-3, -1, 1, 3]];
      rows.forEach(function (row, r) {
        row.forEach(function (off) {
          d.pins.push({
            x: W / 2 + off * 26, y: PIN_Y - r * 32,
            down: false, vx: 0, vy: 0, r: 11
          });
        });
      });
    }

    function standing(d) { return d.pins.filter(function (p) { return !p.down; }).length; }

    /** Standard ten-pin scoring, including strike and spare bonuses. */
    function totalScore(frames) {
      var rolls = [];
      frames.forEach(function (f, i) { f.forEach(function (r) { rolls.push({ v: r, frame: i }); }); });
      var score = 0, idx = 0;
      for (var f = 0; f < 10; f++) {
        if (idx >= rolls.length) break;
        var first = rolls[idx];
        if (first.v === 10) {
          score += 10 + (rolls[idx + 1] ? rolls[idx + 1].v : 0) + (rolls[idx + 2] ? rolls[idx + 2].v : 0);
          idx += 1;
        } else {
          var second = rolls[idx + 1];
          var sum = first.v + (second ? second.v : 0);
          if (sum === 10) score += 10 + (rolls[idx + 2] ? rolls[idx + 2].v : 0);
          else score += sum;
          idx += 2;
        }
      }
      return score;
    }

    function throwBall(d) {
      d.ball = {
        x: W / 2 + d.marker * 70, y: H - 90, vy: -520,
        vx: d.spin * 120, r: 15
      };
      d.phase = 'rolling';
      Milo.sound.tone({ f: 160, f2: 110, d: .3, v: .07, type: 'sawtooth' });
    }

    function endRoll(g) {
      var d = g.data;
      var knocked = d.startStanding - standing(d);
      d.frames[d.frame].push(knocked);
      g.set('Score', totalScore(d.frames));

      var isTenth = d.frame === 9;
      var rollsThisFrame = d.frames[d.frame].length;
      var pinsLeft = standing(d);

      var frameDone;
      if (isTenth) {
        var f = d.frames[9];
        if (rollsThisFrame >= 3) frameDone = true;
        else if (rollsThisFrame === 2) frameDone = !(f[0] === 10 || f[0] + f[1] === 10);
        else frameDone = false;
        if (!frameDone && pinsLeft === 0) setupPins(d, true);
      } else {
        frameDone = pinsLeft === 0 || rollsThisFrame >= 2;
      }

      if (knocked === d.startStanding && d.startStanding === 10) Milo.sound.win();
      else if (pinsLeft === 0) Milo.sound.powerup();
      else Milo.sound.hit();

      if (frameDone) {
        d.frame++;
        if (d.frame >= 10) {
          var total = totalScore(d.frames);
          g.win({ emo: '🎳', title: total + ' pins', text: 'Ten frames bowled.', score: total });
          return;
        }
        setupPins(d, true);
        g.set('Frame', (d.frame + 1) + '/10');
        g.set('Roll', '1st');
      } else {
        g.set('Roll', rollsThisFrame === 1 ? '2nd' : '3rd');
      }
      d.phase = 'aim';
      d.marker = 0;
      d.power = 0;
      d.spin = 0;
      d.ball = null;
    }

    function advance(g) {
      var d = g.data;
      if (d.phase === 'aim') { d.phase = 'power'; d.power = 0; d.dir = 1; }
      else if (d.phase === 'power') { d.phase = 'spin'; d.spin = 0; d.dir = 1; }
      else if (d.phase === 'spin') { d.startStanding = standing(d); throwBall(d); }
    }

    return Milo.arcade(host, {
      id: 'bowling',
      w: W, h: H, bg: '#20160e',
      stats: ['Frame', 'Score', 'Roll'],
      emo: '🎳',
      start: {
        title: 'Bowling',
        text: 'Three taps per throw: one to set your line, one for power, one for spin. ' +
          'Ten frames with proper strike and spare bonuses.',
        keys: ['Click / Space three times']
      },
      init: reset,
      onKey: function (g, e) { if (e.code === 'Space') advance(g); },
      onPointer: function (g, type) { if (type === 'down') advance(g); },

      update: function (g, dt) {
        var d = g.data;
        if (d.phase === 'aim') {
          d.marker += d.dir * dt * 1.5;
          if (d.marker > 1) { d.marker = 1; d.dir = -1; }
          if (d.marker < -1) { d.marker = -1; d.dir = 1; }
        } else if (d.phase === 'power') {
          d.power += d.dir * dt * 1.3;
          if (d.power > 1) { d.power = 1; d.dir = -1; }
          if (d.power < 0.15) { d.power = 0.15; d.dir = 1; }
        } else if (d.phase === 'spin') {
          d.spin += d.dir * dt * 2;
          if (d.spin > 1) { d.spin = 1; d.dir = -1; }
          if (d.spin < -1) { d.spin = -1; d.dir = 1; }
        } else if (d.phase === 'rolling') {
          var b = d.ball;
          b.y += b.vy * (0.5 + d.power) * dt;
          b.x += b.vx * dt;
          b.vx += d.spin * 80 * dt;             // the hook builds as it travels
          if (b.x < LANE_L + b.r) { b.x = LANE_L + b.r; b.vx = Math.abs(b.vx) * .3; }
          if (b.x > LANE_R - b.r) { b.x = LANE_R - b.r; b.vx = -Math.abs(b.vx) * .3; }

          d.pins.forEach(function (p) {
            if (p.down) return;
            if (U.dist(b.x, b.y, p.x, p.y) < b.r + p.r) {
              p.down = true;
              p.vx = (p.x - b.x) * 3 + U.rand(-40, 40);
              p.vy = -Math.abs(b.vy) * 0.25 + U.rand(-30, 30);
              Milo.sound.tone({ f: 700 + Math.random() * 300, d: .06, v: .05, type: 'square' });
            }
          });

          if (b.y < PIN_Y - 130) { d.phase = 'settle'; d.settle = 1.1; }
        } else if (d.phase === 'settle') {
          d.settle -= dt;
          if (d.settle <= 0) endRoll(g);
        }

        // Falling pins knock into their neighbours.
        d.pins.forEach(function (p) {
          if (!p.down) return;
          p.x += p.vx * dt; p.y += p.vy * dt;
          p.vx *= Math.pow(.2, dt);
          d.pins.forEach(function (q) {
            if (q === p || q.down) return;
            if (U.dist(p.x, p.y, q.x, q.y) < p.r + q.r) {
              q.down = true;
              q.vx = (q.x - p.x) * 2.4;
              q.vy = (q.y - p.y) * 2.4 - 20;
            }
          });
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#20160e'; c.fillRect(0, 0, W, H);
        var lane = c.createLinearGradient(0, 0, 0, H);
        lane.addColorStop(0, '#c99a5e'); lane.addColorStop(1, '#a87a45');
        c.fillStyle = lane;
        c.fillRect(LANE_L, 40, LANE_R - LANE_L, H - 40);
        c.fillStyle = 'rgba(0,0,0,.14)';
        for (var i = 1; i < 7; i++) c.fillRect(LANE_L + i * ((LANE_R - LANE_L) / 7), 40, 2, H - 40);
        c.fillStyle = '#3b2a18';
        c.fillRect(LANE_L - 16, 40, 16, H - 40);
        c.fillRect(LANE_R, 40, 16, H - 40);

        d.pins.forEach(function (p) {
          if (p.down && (p.y > H || p.x < 0 || p.x > W)) return;
          c.save();
          c.translate(p.x, p.y);
          if (p.down) c.rotate(1.2);
          c.fillStyle = '#fdfdff';
          c.beginPath(); c.ellipse(0, 0, p.r * .8, p.r * 1.3, 0, 0, 7); c.fill();
          c.fillStyle = '#e5484d';
          c.fillRect(-p.r * .8, -p.r * .5, p.r * 1.6, 3);
          c.restore();
        });

        if (d.ball) {
          c.fillStyle = '#1d1a3a';
          c.beginPath(); c.arc(d.ball.x, d.ball.y, d.ball.r, 0, 7); c.fill();
          c.fillStyle = 'rgba(255,255,255,.28)';
          c.beginPath(); c.arc(d.ball.x - 5, d.ball.y - 5, 4, 0, 7); c.fill();
        }

        // aim marker / meters
        if (d.phase !== 'rolling' && d.phase !== 'settle') {
          var mx = W / 2 + d.marker * 70;
          c.strokeStyle = '#22d3ee'; c.lineWidth = 3;
          c.setLineDash([6, 8]);
          c.beginPath(); c.moveTo(mx, H - 90); c.lineTo(mx, PIN_Y); c.stroke();
          c.setLineDash([]);
          c.fillStyle = '#1d1a3a';
          c.beginPath(); c.arc(mx, H - 90, 15, 0, 7); c.fill();
        }

        function meter(label, value, y, from) {
          c.fillStyle = 'rgba(0,0,0,.45)';
          U.roundRect(c, 30, y, W - 60, 22, 8); c.fill();
          c.fillStyle = '#ffd257';
          var v = from === 'centre' ? Math.abs(value) : value;
          var x0 = from === 'centre' ? W / 2 : 34;
          var wd = (W - 68) * v * (from === 'centre' ? 0.5 : 1);
          c.fillRect(from === 'centre' ? (value < 0 ? x0 - wd : x0) : x0, y + 4, wd, 14);
          c.fillStyle = '#fff';
          c.font = '600 11px Outfit, sans-serif';
          c.textAlign = 'left';
          c.fillText(label, 36, y + 16);
        }
        if (d.phase === 'power') meter('POWER — click to lock', d.power, H - 56);
        if (d.phase === 'spin') meter('SPIN — click to throw', d.spin, H - 56, 'centre');
        if (d.phase === 'aim') {
          c.fillStyle = '#fff';
          c.font = '600 13px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('Click to lock your line', W / 2, H - 40);
        }

        // scorecard
        c.font = '600 10px Outfit, sans-serif';
        c.textAlign = 'center';
        for (var f = 0; f < 10; f++) {
          var bx = 20 + f * ((W - 40) / 10);
          c.fillStyle = f === d.frame ? 'rgba(34,211,238,.3)' : 'rgba(0,0,0,.35)';
          c.fillRect(bx, 8, (W - 40) / 10 - 3, 24);
          c.fillStyle = '#fff';
          var txt = d.frames[f].map(function (v, i) {
            if (v === 10 && i === 0) return 'X';
            if (i > 0 && d.frames[f][i - 1] + v === 10) return '/';
            return v === 0 ? '-' : String(v);
          }).join(' ');
          c.fillText(txt, bx + ((W - 40) / 10 - 3) / 2, 24);
        }
      }
    });
  }

  window.Milo.register({
    id: 'bowling', title: 'Bowling', emo: '🎳', category: 'Sports',
    tagline: 'Ten frames with a proper scorecard',
    description: 'Three clicks per throw: the first locks your line as a marker slides ' +
      'across the lane, the second sets power, the third sets spin — and spin builds into a ' +
      'real hook as the ball travels. Pins knock each other over, so a good pocket hit can ' +
      'clear all ten. Full ten-pin scoring with strike and spare bonuses.',
    controls: ['Click three times', 'Space'],
    colors: ['#c99a5e', '#1d1a3a'],
    tags: ['bowling', 'timing', 'sports', 'physics'],
    mount: mount
  });
})();
