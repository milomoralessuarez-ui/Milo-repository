/* Velodrome Dash — alternate the pedals, guard the tank, win two sprints. */
(function () {
  'use strict';
  var W = 880, H = 540, TAU = Math.PI * 2;
  var DIST = 400;                    // metres per sprint
  var PPM = 34;                      // pixels per metre
  var TRACKY = 388;                  // your wheel line
  var AIY = 348;                     // the rival rides the lane above

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function setupSprint(g) {
      var d = g.data;
      d.you = { dist: 0, v: 0, leg: 0 };
      d.ai = { dist: 0, v: 0, leg: 0 };
      d.stam = 100;
      d.blown = 0;
      d.lastKey = '';
      d.cad = 0;                     // taps/sec estimate
      d.tapT = [];
      d.drafting = false;
      d.draftT = 0;                  // seconds spent in the draft this sprint
      d.time = 0;
      d.go = -2.8;
      d.finished = false;
      d.result = null;
      d.parts = [];
      d.floats = [];
      var s = 1 + (d.sprint - 1) * .06 + d.wins.you * .05;
      d.aiPace = 12.2 * s;           // cruising speed m/s
      d.aiKick = 16.2 * s;           // finishing speed
      g.set('Sprint', d.sprint + '/3');
      g.set('Speed', 0);
      g.set('Gap', '—');
    }

    function reset(g) {
      var d = g.data;
      d.sprint = 1;
      d.wins = { you: 0, ai: 0 };
      d.margins = 0;
      setupSprint(g);
    }

    function addFloat(d, x, y, txt, col) {
      d.floats.push({ x: x, y: y, txt: txt, col: col, t: 1.3 });
    }

    function sprintOver(g, youWon, margin) {
      var d = g.data;
      d.finished = true;
      if (youWon) { d.wins.you++; d.margins += margin; Milo.sound.win(); }
      else { d.wins.ai++; Milo.sound.lose(); }
      d.result = {
        won: youWon,
        margin: margin,
        t: 3
      };
      g.set('Sprint', d.wins.you + '–' + d.wins.ai);
    }

    function matchOver(g) {
      var d = g.data;
      var score = d.wins.you * 500 + Math.round(d.margins * 120) +
        (d.wins.you >= 2 ? 800 + Math.round(d.stam * 3) : 0);
      if (d.wins.you >= 2) {
        g.win({
          emo: '🚴', title: 'Match sprint champion ' + d.wins.you + '–' + d.wins.ai,
          text: 'Winning margins totalled ' + d.margins.toFixed(2) + 's.',
          score: score
        });
      } else {
        g.gameOver({
          emo: '🚴', title: 'Beaten ' + d.wins.ai + '–' + d.wins.you,
          text: 'Sit in the draft longer, and never let the tank hit zero.',
          score: score
        });
      }
    }

    function tap(g, which) {
      var d = g.data;
      if (d.finished || d.go < 0 || d.blown > 0) return;
      if (which === d.lastKey) {
        // Mashing one pedal does nothing but stumble the rhythm.
        d.cad = Math.max(0, d.cad - 1);
        return;
      }
      d.lastKey = which;
      d.tapT.push(g.t);
      if (d.tapT.length > 6) d.tapT.shift();
      // Push: bigger at low speed, and cheaper in the draft.
      var boost = 1.35 * (1 - d.you.v / 21);
      d.you.v += Math.max(.25, boost);
      var cost = (d.drafting ? .95 : 1.55) + d.you.v * .028;
      d.stam -= cost;
      Milo.sound.tone({ f: 240 + d.you.v * 14, d: .03, v: .05, type: 'triangle' });
      if (d.stam <= 0) {
        d.stam = 0;
        d.blown = 2.6;
        addFloat(d, W * .3, TRACKY - 120, 'BLOWN UP!', '#fb7185');
        Milo.sound.explode();
      }
    }

    return Milo.arcade(host, {
      id: 'velodrome-dash',
      w: W, h: H, bg: '#12242b',
      stats: ['Sprint', 'Speed', 'Gap'],
      touchButtons: [{ key: 'left', label: 'L' }, { key: 'right', label: 'R' }],
      emo: '🚴',
      start: {
        title: 'Velodrome Dash',
        text: 'Best of three ' + DIST + ' m sprints. Alternate ← and → to pedal — every ' +
          'stroke costs stamina, and an empty tank means you blow up mid-sprint. Sit ' +
          'tucked behind the rival to save your legs, then swing out and empty the ' +
          'tank in the last 100 m.',
        keys: ['← → alternate to pedal', 'Draft to save the tank']
      },
      init: reset,

      onPointer: function (g, type, x) {
        if (type === 'down') tap(g, x < W / 2 ? 'left' : 'right');
      },

      update: function (g, dt) {
        var d = g.data;

        // Edge-triggered pedal strokes (covers keyboard and the touch buttons).
        if (g.input.pressed('left')) tap(g, 'left');
        if (g.input.pressed('right')) tap(g, 'right');

        if (d.result) {
          d.result.t -= dt;
          if (d.result.t <= 0) {
            if (d.wins.you >= 2 || d.wins.ai >= 2 || d.sprint >= 3) { matchOver(g); return; }
            d.sprint++;
            setupSprint(g);
          }
          return;
        }

        if (d.go < 0) {
          var b4 = Math.ceil(-d.go);
          d.go += dt;
          if (d.go < 0 && Math.ceil(-d.go) !== b4) Milo.sound.tone({ f: 440, d: .12, v: .1, type: 'square' });
          if (d.go >= 0) Milo.sound.tone({ f: 880, d: .3, v: .12, type: 'square' });
          return;
        }

        d.time += dt;

        // Cadence estimate from recent taps.
        var cut = g.t - 1.2;
        d.tapT = d.tapT.filter(function (t) { return t > cut; });
        d.cad = d.tapT.length / 1.2;

        // Blown legs.
        if (d.blown > 0) {
          d.blown -= dt;
          d.stam = Math.min(24, d.stam + 8 * dt);
        } else {
          // Slow trickle back when soft-pedalling.
          d.stam = Math.min(100, d.stam + (d.cad < 1.5 ? 7.5 : 1.6) * dt +
            (d.drafting ? 1.4 * dt : 0));
        }

        // Draft check: tucked 0.5–7 m behind the rival.
        var gap = d.ai.dist - d.you.dist;
        var wasDraft = d.drafting;
        d.drafting = gap > .5 && gap < 7;
        if (d.drafting) d.draftT += dt;
        if (d.drafting && !wasDraft) addFloat(d, W * .42, AIY - 90, 'DRAFT', '#4ade80');

        // Drag: the wind bites v²; the draft takes most of it away.
        var drag = (d.drafting ? .0065 : .016) * d.you.v * d.you.v;
        d.you.v = Math.max(0, d.you.v - (drag + (d.blown > 0 ? 2.6 : .32)) * dt);
        d.you.dist += d.you.v * dt;
        d.you.leg += d.you.v * dt * 1.9;

        // AI: cruises, kicks at the end, drafts you when behind.
        var a = d.ai;
        var kick = a.dist > DIST - 130 || d.you.dist > DIST - 130;
        var target = kick ? d.aiKick : d.aiPace;
        // If you attack early, the AI responds but pays for it late.
        if (d.you.v > target && d.you.dist > a.dist - 4 && a.dist < DIST - 150) {
          target = Math.min(d.you.v * 1.02, d.aiKick * .94);
          a.tired = (a.tired || 0) + dt;
        }
        if (a.tired > 5 && kick) target *= .93;
        var aiDrafting = d.you.dist - a.dist > .5 && d.you.dist - a.dist < 7;
        a.v += (target - a.v) * Math.min(1, dt * (aiDrafting ? 1.4 : 1.0));
        a.dist += a.v * dt;
        a.leg += a.v * dt * 1.9;

        // Speed lines while drafting or at full gas.
        if ((d.drafting || d.you.v > 15) && Math.random() < .5) {
          d.parts.push({
            x: W * .55 + U.rand(-40, 260), y: U.rand(AIY - 80, TRACKY + 10),
            vx: -d.you.v * 26, vy: 0, t: .3, max: .3, line: true,
            col: d.drafting ? 'rgba(74,222,128,.5)' : 'rgba(255,255,255,.30)'
          });
        }

        for (var pi = d.parts.length - 1; pi >= 0; pi--) {
          var p = d.parts[pi];
          p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt;
          if (p.t <= 0) d.parts.splice(pi, 1);
        }
        for (pi = d.floats.length - 1; pi >= 0; pi--) {
          d.floats[pi].t -= dt;
          if (d.floats[pi].t <= 0) d.floats.splice(pi, 1);
        }

        // Finish.
        if (d.you.dist >= DIST || a.dist >= DIST) {
          var youWon = d.you.dist >= DIST && (a.dist < DIST || d.you.dist >= a.dist);
          var lead = Math.abs(d.you.dist - a.dist);
          var vRef = Math.max(6, youWon ? d.you.v : a.v);
          sprintOver(g, youWon, lead / vRef);
          return;
        }

        g.set('Speed', (d.you.v * 3.6).toFixed(0) + ' km/h');
        g.set('Gap', (gap >= 0 ? '−' : '+') + Math.abs(gap).toFixed(1) + 'm');
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var cam = d.you.dist * PPM - W * .3;

        // Hall + stands.
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0d1a20');
        bg.addColorStop(.42, '#173038');
        bg.addColorStop(1, '#101d24');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        // Roof girders slide slowly (far parallax).
        c.strokeStyle = 'rgba(255,255,255,.06)'; c.lineWidth = 6;
        for (var gr = -1; gr < 8; gr++) {
          var gx = gr * 160 - (cam * .15) % 160;
          c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx + 70, 96); c.stroke();
        }
        // Crowd terraces.
        c.fillStyle = '#122830';
        c.fillRect(0, 96, W, 92);
        for (var cd = 0; cd < 160; cd++) {
          var px2 = ((cd * 67) - cam * .35) % (W + 60) - 30;
          if (px2 < -20) px2 += W + 60;
          var wave = d.you.dist > DIST - 110 ? Math.sin(g.t * 7 + cd) * 3 : 0;
          c.fillStyle = 'hsl(' + ((cd * 41) % 360) + ',30%,' + (34 + (cd % 4) * 7) + '%)';
          c.beginPath(); c.arc(px2, 112 + (cd * 29) % 64 - wave, 3.4, 0, TAU); c.fill();
        }
        // Ad boards.
        c.fillStyle = '#0a3d4a';
        c.fillRect(0, 188, W, 34);
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '800 20px Outfit, sans-serif'; c.textAlign = 'left';
        for (var ad = -1; ad < 4; ad++) {
          var ax2 = ad * 320 - (cam * .6) % 320;
          c.fillText('MILOPLAY  ·  VELODROME', ax2, 212);
        }

        // The banked boards: warm wood strips with perspective lines.
        var wood = c.createLinearGradient(0, 222, 0, H);
        wood.addColorStop(0, '#a4713d');
        wood.addColorStop(.5, '#c08a4c');
        wood.addColorStop(1, '#8a5c30');
        c.fillStyle = wood;
        c.fillRect(0, 222, W, H - 222);
        c.strokeStyle = 'rgba(70,42,18,.35)'; c.lineWidth = 2;
        for (var b = 0; b < 9; b++) {
          var by = 232 + b * 34;
          c.beginPath(); c.moveTo(0, by); c.lineTo(W, by); c.stroke();
        }
        // Board seams rushing past.
        c.strokeStyle = 'rgba(70,42,18,.3)';
        for (var sm = -1; sm < 16; sm++) {
          var sx = sm * 68 - cam % 68;
          c.beginPath(); c.moveTo(sx, 222); c.lineTo(sx - 26, H); c.stroke();
        }
        // Sprinter (red) and stayer (blue) lines, and the côte d'azur.
        c.fillStyle = '#c33d3d'; c.fillRect(0, 300, W, 5);
        c.fillStyle = '#2b6fb0'; c.fillRect(0, 252, W, 4);
        c.fillStyle = '#79c4d8'; c.fillRect(0, 420, W, 26);
        c.fillStyle = '#0f2229'; c.fillRect(0, 446, W, H - 446);

        // 50 m marks + finish line in world space.
        c.textAlign = 'center';
        for (var mk = 1; mk <= DIST / 50; mk++) {
          var mx = mk * 50 * PPM - cam;
          if (mx < -60 || mx > W + 60) continue;
          c.fillStyle = 'rgba(255,255,255,.55)';
          c.fillRect(mx, 420, 3, 26);
          c.font = '700 12px Outfit, sans-serif';
          c.fillText((DIST - mk * 50) + 'm', mx, 466);
        }
        var fx = DIST * PPM - cam;
        if (fx > -80 && fx < W + 80) {
          for (var fr = 0; fr < 10; fr++) {
            c.fillStyle = fr % 2 ? '#fff' : '#16202a';
            c.fillRect(fx - 6, 222 + fr * ((H - 222 - 94) / 10), 12, (H - 222 - 94) / 10);
          }
        }

        // Speed lines.
        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.t / p.max);
          c.strokeStyle = p.col; c.lineWidth = 2;
          c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x + 34, p.y); c.stroke();
        });
        c.globalAlpha = 1;

        // Riders.
        riderDraw(c, W * .3 + (d.ai.dist - d.you.dist) * PPM, AIY, d.ai.leg,
          '#3f79c9', '#274b7e', false, d);
        riderDraw(c, W * .3, TRACKY, d.you.leg, '#e8563f', '#8f2a1a', true, d);

        // Floats.
        c.textAlign = 'center';
        c.font = '800 19px Outfit, sans-serif';
        d.floats.forEach(function (f) {
          c.globalAlpha = Math.min(1, f.t);
          c.fillStyle = f.col;
          c.fillText(f.txt, f.x, f.y - (1.3 - f.t) * 26);
        });
        c.globalAlpha = 1;

        // Stamina tank with a marked red zone.
        var bw = 240, bx = 24, byy = 30;
        c.fillStyle = 'rgba(8,14,20,.6)';
        U.roundRect(c, bx - 8, byy - 8, bw + 16, 34, 10); c.fill();
        c.fillStyle = 'rgba(255,255,255,.14)';
        U.roundRect(c, bx, byy, bw, 12, 6); c.fill();
        c.fillStyle = 'rgba(251,113,133,.28)';
        U.roundRect(c, bx, byy, bw * .22, 12, 6); c.fill();
        var sf = d.stam / 100;
        c.fillStyle = d.blown > 0 ? '#fb7185' : sf > .45 ? '#4ade80' : sf > .22 ? '#ffd257' : '#fb7185';
        if (sf > 0.02) { U.roundRect(c, bx, byy, Math.max(6, bw * sf), 12, 6); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,.75)';
        c.font = '800 10px Outfit, sans-serif'; c.textAlign = 'left';
        c.fillText(d.blown > 0 ? 'LEGS GONE — COASTING' : 'TANK', bx, byy + 24);
        if (d.blown <= 0 && sf < .25 && Math.sin(g.t * 9) > 0) {
          c.fillStyle = '#fb7185';
          c.fillText('DO NOT REDLINE', bx + 60, byy + 24);
        }

        // Race progress strip.
        var pw = W - 380, px = 320, py = 34;
        c.fillStyle = 'rgba(8,14,20,.6)';
        U.roundRect(c, px - 8, py - 10, pw + 16, 26, 9); c.fill();
        c.fillStyle = 'rgba(255,255,255,.2)';
        c.fillRect(px, py, pw, 3);
        c.fillStyle = '#3f79c9';
        c.beginPath(); c.arc(px + U.clamp(d.ai.dist / DIST, 0, 1) * pw, py + 1, 6, 0, TAU); c.fill();
        c.fillStyle = '#e8563f';
        c.beginPath(); c.arc(px + U.clamp(d.you.dist / DIST, 0, 1) * pw, py + 1, 6, 0, TAU); c.fill();
        // Sprint tally.
        for (var w2 = 0; w2 < 3; w2++) {
          c.fillStyle = w2 < d.wins.you ? '#4ade80' : 'rgba(255,255,255,.2)';
          c.beginPath(); c.arc(px + 14 + w2 * 18, py + 14 + 4, 5, 0, TAU); c.fill();
        }
        for (w2 = 0; w2 < 3; w2++) {
          c.fillStyle = w2 < d.wins.ai ? '#fb7185' : 'rgba(255,255,255,.2)';
          c.beginPath(); c.arc(px + pw - 14 - w2 * 18, py + 14 + 4, 5, 0, TAU); c.fill();
        }

        // Countdown / result banners.
        if (d.go < 0) {
          c.fillStyle = 'rgba(6,12,16,.55)'; c.fillRect(0, 0, W, H);
          c.textAlign = 'center';
          c.fillStyle = '#ffd257';
          c.font = '800 24px Outfit, sans-serif';
          c.fillText('SPRINT ' + d.sprint + ' OF 3 — first to ' + DIST + ' m', W / 2, H / 2 - 76);
          c.fillStyle = '#fff';
          c.font = '800 92px Outfit, sans-serif';
          var n = Math.ceil(-d.go);
          c.fillText(n > 0 ? String(n) : 'GO!', W / 2, H / 2 + 30);
        } else if (d.go < .8 && !d.result) {
          c.textAlign = 'center';
          c.fillStyle = '#fff';
          c.font = '800 92px Outfit, sans-serif';
          c.globalAlpha = 1 - d.go / .8;
          c.fillText('GO!', W / 2, H / 2 + 30);
          c.globalAlpha = 1;
        }
        if (d.result) {
          c.fillStyle = 'rgba(6,12,16,.6)'; c.fillRect(0, 0, W, H);
          c.textAlign = 'center';
          c.fillStyle = d.result.won ? '#4ade80' : '#fb7185';
          c.font = '800 46px Outfit, sans-serif';
          c.fillText(d.result.won ? 'SPRINT WON!' : 'OUTSPRINTED', W / 2, H / 2 - 20);
          c.fillStyle = '#e6eef2';
          c.font = '700 20px Outfit, sans-serif';
          c.fillText('by ' + d.result.margin.toFixed(2) + 's   ·   ' +
            d.wins.you + '–' + d.wins.ai, W / 2, H / 2 + 22);
        }

        // Final-stretch cue.
        if (!d.result && d.go >= 0 && d.you.dist > DIST - 110 && Math.sin(g.t * 10) > 0) {
          c.textAlign = 'center';
          c.fillStyle = '#ffd257';
          c.font = '800 24px Outfit, sans-serif';
          c.fillText('EMPTY THE TANK!', W / 2, 250);
        }
      }
    });

    function riderDraw(c, x, y, leg, col, dark, isYou, d) {
      if (x < -80 || x > W + 120) return;
      c.save();
      c.translate(x, y);
      var lean = isYou && d.blown > 0 ? .16 : -.08;
      c.rotate(lean);
      // Wheels.
      [-26, 26].forEach(function (wx) {
        c.fillStyle = '#141a20';
        c.beginPath(); c.arc(wx, 0, 17, 0, TAU); c.fill();
        c.fillStyle = '#20303a';
        c.beginPath(); c.arc(wx, 0, 12, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(200,220,235,.5)'; c.lineWidth = 1.5;
        for (var s2 = 0; s2 < 3; s2++) {
          var sa = leg * .1 + s2 * TAU / 3;
          c.beginPath();
          c.moveTo(wx - Math.cos(sa) * 11, -Math.sin(sa) * 11);
          c.lineTo(wx + Math.cos(sa) * 11, Math.sin(sa) * 11);
          c.stroke();
        }
        c.fillStyle = '#c8d6e0';
        c.beginPath(); c.arc(wx, 0, 3, 0, TAU); c.fill();
      });
      // Frame.
      c.strokeStyle = dark; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(-26, 0); c.lineTo(-6, -18); c.lineTo(14, -18);
      c.moveTo(-6, -18); c.lineTo(2, 0); c.lineTo(26, 0);
      c.moveTo(14, -18); c.lineTo(22, -24);
      c.stroke();
      // Pedalling legs from crank angle.
      var ca = leg * .14;
      var k1x = 2 + Math.cos(ca) * 9, k1y = Math.sin(ca) * 9;
      var k2x = 2 - Math.cos(ca) * 9, k2y = -Math.sin(ca) * 9;
      c.strokeStyle = '#22303c'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(-2, -26); c.lineTo(k2x, k2y); c.stroke();
      c.beginPath(); c.moveTo(-2, -26); c.lineTo(k1x, k1y); c.stroke();
      // Torso crouched over the bars.
      c.fillStyle = col;
      c.save();
      c.translate(-2, -30);
      c.rotate(.85);
      U.roundRect(c, -9, -20, 18, 26, 8); c.fill();
      c.restore();
      // Arm to the bars.
      c.strokeStyle = col; c.lineWidth = 4.5;
      c.beginPath(); c.moveTo(6, -36); c.lineTo(21, -23); c.stroke();
      // Helmet.
      c.fillStyle = isYou ? '#ffd257' : '#c8d6e0';
      c.beginPath(); c.arc(16, -38, 7.5, 0, TAU); c.fill();
      c.fillStyle = '#141a20';
      c.beginPath(); c.arc(19, -37, 2.4, 0, TAU); c.fill();
      c.restore();
      // Draft glow between the two riders.
      if (isYou && d.drafting) {
        c.strokeStyle = 'rgba(74,222,128,.55)'; c.lineWidth = 2;
        c.setLineDash([4, 6]);
        c.beginPath();
        c.arc(x, y - 16, 42, 0, TAU);
        c.stroke();
        c.setLineDash([]);
      }
    }
  }

  window.Milo.register({
    id: 'velodrome-dash', title: 'Velodrome Dash', emo: '🚴', category: 'Racing',
    tagline: 'Draft, then empty the tank',
    description: 'A best-of-three match sprint on the boards: alternate ← and → to turn ' +
      'the pedals, and watch the tank — every stroke costs stamina and hitting zero ' +
      'blows your legs for a long coasting eternity. Tuck within a few metres behind ' +
      'the rival and the wind almost disappears, so the classic race is to sit in, ' +
      'recover, and slingshot past inside the last 100 m. The rival kicks harder in ' +
      'every sprint you take.',
    controls: ['← → alternate', 'Tap left/right'],
    colors: ['#c08a4c', '#e8563f'],
    tags: ['cycling', 'sprint', 'stamina', 'mashing', 'vs cpu'],
    mount: mount
  });
})();
