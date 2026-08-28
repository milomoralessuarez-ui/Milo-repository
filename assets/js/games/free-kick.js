/* Free Kick — bend it over the wall, past a keeper who reads straight shots. */
(function () {
  'use strict';
  var W = 800, H = 560, TAU = Math.PI * 2;
  var GOAL = { x: 220, y: 118, w: 360, h: 130 };
  var BALLX = W / 2, BALLY = H - 74;
  var WALLY = 322;                 // the wall's screen row
  var KICKS = 10, NEED = 6;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function setupRound(g) {
      var d = g.data;
      d.kick = 0;
      d.goalsRound = 0;
      d.wallN = Math.min(3 + d.round - 1, 7);
      d.keeperSkill = U.clamp(.42 + (d.round - 1) * .13, .42, .92);
      var span = d.wallN * 40;
      d.wallX = U.clamp(BALLX + U.rand(-70, 70), GOAL.x + span / 2 + 20, GOAL.x + GOAL.w - span / 2 - 20);
      d.phase = 'aim';
      d.msg = 'Round ' + d.round + ' — ' + d.wallN + ' in the wall. Drag through the ball.';
      g.set('Kick', '1/' + KICKS);
    }

    function reset(g) {
      var d = g.data;
      d.round = 1;
      d.goals = 0;
      d.best = 0;
      d.keeper = { x: GOAL.x + GOAL.w / 2, y: GOAL.y + GOAL.h - 34, dx: 0, dy: 0 };
      d.jump = 0;
      d.shot = null;
      d.drag = null;
      d.parts = [];
      d.confetti = [];
      d.netWob = 0;
      d.resultT = 0;
      d.result = '';
      setupRound(g);
      g.set('Goals', '0');
      g.set('Kick', '1/' + KICKS);
      g.set('Round', 1);
    }

    /** The shot's screen position at t in [0,1]: straight line bent by curve. */
    function shotPos(s, t) {
      var x = U.lerp(BALLX, s.tx, t) + s.curve * Math.sin(Math.PI * t) * 130;
      var y = U.lerp(BALLY, s.ty, t) - s.loft * Math.sin(Math.PI * t * .92) * 90;
      return { x: x, y: y };
    }

    function fire(g) {
      var d = g.data, dr = d.drag;
      var pts = dr.pts;
      if (pts.length < 4) { d.drag = null; return; }
      var p0 = pts[0], p1 = pts[pts.length - 1];
      var dx = p1.x - p0.x, dy = p1.y - p0.y;
      if (dy > -40) { d.drag = null; return; }       // must pull up-screen
      var power = U.clamp(Math.hypot(dx, dy) / 300, .35, 1.25);
      // Curve: how far the drag path bows out sideways from its own chord.
      var mid = pts[(pts.length / 2) | 0];
      var chordLen = Math.hypot(dx, dy) || 1;
      var side = ((mid.x - p0.x) * dy - (mid.y - p0.y) * dx) / chordLen;
      var curve = U.clamp(-side / 60, -1.4, 1.4);
      var tx = U.clamp(BALLX + dx * 1.55, GOAL.x - 90, GOAL.x + GOAL.w + 90);
      var ty = U.clamp(BALLY + dy * 1.45, GOAL.y - 60, WALLY);
      d.shot = {
        t: 0, dur: U.clamp(1.05 - power * .35, .62, .95),
        tx: tx, ty: ty, curve: curve,
        loft: U.clamp(power * .9, .3, 1.15),
        spin: 0, trail: []
      };
      d.drag = null;
      d.phase = 'shot';
      d.kick++;
      g.set('Kick', Math.min(d.kick, KICKS) + '/' + KICKS);

      // The wall jumps a beat after the strike.
      d.jump = -.22;

      // Keeper commits: straight shots get read, big benders don't.
      var read = U.clamp(d.keeperSkill * (1 - Math.abs(curve) * .55), .06, .95);
      var guessX = U.rand(GOAL.x + 50, GOAL.x + GOAL.w - 50);
      var finalX = tx + curve * 130 * Math.sin(Math.PI * .97);
      d.keeper.dx = finalX * read + guessX * (1 - read);
      d.keeper.dy = ty * read + U.rand(GOAL.y + 40, GOAL.y + GOAL.h - 26) * (1 - read);
      Milo.sound.tone({ f: 190, f2: 120, d: .14, v: .1, type: 'triangle' });
    }

    function resolve(g, txt, col, scored, bonus) {
      var d = g.data;
      d.result = txt;
      d.resultCol = col;
      d.resultT = 1.35;
      d.phase = 'result';
      d.shot = null;
      if (scored) {
        d.goals++; d.goalsRound++;
        g.score += 100 + bonus;
        g.set('Goals', d.goals);
        d.netWob = 1;
        Milo.sound.win();
        for (var i = 0; i < 30; i++) {
          d.confetti.push({
            x: U.rand(GOAL.x, GOAL.x + GOAL.w), y: GOAL.y + U.rand(0, GOAL.h),
            vx: U.rand(-70, 70), vy: U.rand(-160, -30),
            t: U.rand(.6, 1.2), max: 1.2, r: U.rand(2, 4),
            col: U.choice(['#ffd257', '#f0abfc', '#4ade80', '#60a5fa', '#fff'])
          });
        }
      }
    }

    function endOfKick(g) {
      var d = g.data;
      d.keeper = { x: GOAL.x + GOAL.w / 2, y: GOAL.y + GOAL.h - 34, dx: 0, dy: 0 };
      if (d.kick >= KICKS) {
        if (d.goalsRound >= NEED) {
          d.round++;
          g.set('Round', d.round);
          setupRound(g);
          Milo.sound.powerup();
        } else {
          g.gameOver({
            emo: '⚽',
            title: d.goals + ' goal' + (d.goals === 1 ? '' : 's') + ' from ' + d.round * KICKS + ' kicks',
            text: 'You needed ' + NEED + '/' + KICKS + ' that round to earn a bigger wall. ' +
              'Bend it more — the keeper only reads straight shots.',
            score: g.score
          });
        }
      } else {
        d.phase = 'aim';
        d.msg = '';
      }
    }

    return Milo.arcade(host, {
      id: 'free-kick',
      w: W, h: H, bg: '#1c1033',
      stats: ['Goals', 'Kick', 'Round'],
      emo: '🥅',
      start: {
        title: 'Free Kick',
        text: 'Ten set pieces a round. Drag through the ball and let the shape of your ' +
          'drag bend the shot — a curved pull whips the ball around the wall, and the ' +
          'keeper only reads shots that fly straight. Score ' + NEED + ' of ' + KICKS +
          ' and the wall grows.',
        keys: ['Drag to shoot', 'Bend the drag path to curve it']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (g.state !== 'play' || d.phase !== 'aim') return;
        if (type === 'down' && U.dist(x, y, BALLX, BALLY) < 120) {
          d.drag = { pts: [{ x: x, y: y }] };
        } else if (type === 'move' && d.drag) {
          var last = d.drag.pts[d.drag.pts.length - 1];
          if (U.dist(x, y, last.x, last.y) > 6) d.drag.pts.push({ x: x, y: y });
        } else if (type === 'up' && d.drag) {
          fire(g);
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.netWob > 0) d.netWob -= dt * 2;

        // Wall jump timing: charges after the strike, hangs, lands.
        if (d.phase === 'shot' || d.jump > 0) {
          d.jump += dt * 2.6;
          if (d.jump > 1.2) d.jump = 1.2;
        }

        if (d.phase === 'shot' && d.shot) {
          var s = d.shot;
          s.t += dt / s.dur;
          s.spin += dt * 14 * (1 + Math.abs(s.curve));
          var p = shotPos(s, Math.min(1, s.t));
          s.trail.push({ x: p.x, y: p.y, t: .35 });
          if (s.trail.length > 18) s.trail.shift();
          s.trail.forEach(function (q) { q.t -= dt; });

          // Keeper dives.
          d.keeper.x += (d.keeper.dx - d.keeper.x) * Math.min(1, dt * 4.2);
          d.keeper.y += (d.keeper.dy - d.keeper.y) * Math.min(1, dt * 4.2);

          // The wall plane sits ~42% of the flight.
          if (!s.pastWall && s.t >= .42) {
            s.pastWall = true;
            var jumpH = Math.sin(Math.min(1, Math.max(0, d.jump)) * Math.PI) * 34;
            var span = d.wallN * 40;
            var inWall = p.x > d.wallX - span / 2 - 8 && p.x < d.wallX + span / 2 + 8;
            var wallTop = WALLY - 62 - jumpH;
            if (inWall && p.y > wallTop) {
              // Smacked into the wall.
              Milo.sound.hit();
              for (var i = 0; i < 14; i++) {
                d.parts.push({
                  x: p.x, y: p.y, vx: U.rand(-160, 160), vy: U.rand(-220, -20),
                  t: U.rand(.3, .6), max: .6, col: U.choice(['#fff', '#f0abfc', '#8b7bb8'])
                });
              }
              resolve(g, 'INTO THE WALL', '#fb7185', false, 0);
              return;
            }
          }

          if (s.t >= 1) {
            var fin = shotPos(s, 1);
            var onTarget = fin.x > GOAL.x + 6 && fin.x < GOAL.x + GOAL.w - 6 &&
              fin.y > GOAL.y + 6 && fin.y < GOAL.y + GOAL.h;
            if (!onTarget) {
              Milo.sound.tone({ f: 220, f2: 130, d: .2, v: .09, type: 'triangle' });
              resolve(g, fin.y <= GOAL.y + 6 ? 'OVER THE BAR' : 'WIDE', '#9aa3d0', false, 0);
            } else if (U.dist(fin.x, fin.y, d.keeper.x, d.keeper.y) < 56) {
              Milo.sound.hit();
              resolve(g, 'SAVED!', '#fb7185', false, 0);
            } else {
              var corner = Math.min(fin.x - GOAL.x, GOAL.x + GOAL.w - fin.x) < 70 &&
                fin.y < GOAL.y + 55;
              var bendBonus = Math.round(Math.abs(s.curve) * 80);
              resolve(g, corner ? 'TOP CORNER! +' + (150 + bendBonus) : 'GOAL! +' + (100 + bendBonus),
                '#4ade80', true, (corner ? 50 : 0) + bendBonus);
            }
            return;
          }
        }

        if (d.phase === 'result') {
          d.resultT -= dt;
          if (d.resultT <= 0) { d.result = ''; d.jump = 0; endOfKick(g); }
        }

        for (var pi = d.parts.length - 1; pi >= 0; pi--) {
          var pp = d.parts[pi];
          pp.x += pp.vx * dt; pp.y += pp.vy * dt; pp.vy += 700 * dt; pp.t -= dt;
          if (pp.t <= 0) d.parts.splice(pi, 1);
        }
        for (pi = d.confetti.length - 1; pi >= 0; pi--) {
          var cf = d.confetti[pi];
          cf.x += cf.vx * dt; cf.y += cf.vy * dt; cf.vy += 260 * dt; cf.t -= dt;
          if (cf.t <= 0) d.confetti.splice(pi, 1);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;

        // Night match: violet sky, floodlight haze, striped pitch.
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#1c1033');
        sky.addColorStop(.34, '#3b1f5e');
        sky.addColorStop(.35, '#155e42');
        sky.addColorStop(1, '#0b3d2a');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        for (var st = 0; st < 7; st++) {
          if (st % 2) continue;
          c.fillStyle = 'rgba(255,255,255,.035)';
          var y0 = 196 + st * 56;
          c.beginPath();
          c.moveTo(0, y0); c.lineTo(W, y0 - 14);
          c.lineTo(W, y0 + 42); c.lineTo(0, y0 + 56);
          c.closePath(); c.fill();
        }
        // Crowd band + flicker.
        c.fillStyle = '#160c28';
        c.fillRect(0, 148, W, 48);
        for (var cd = 0; cd < 120; cd++) {
          var flick = (cd * 13 + ((g.t * 3) | 0)) % 17 === 0;
          c.fillStyle = flick ? '#f0abfc' : 'hsl(' + ((cd * 53) % 360) + ',24%,' + (26 + (cd % 4) * 5) + '%)';
          c.beginPath();
          c.arc((cd * 47) % W, 156 + (cd * 31) % 36, 2.6, 0, TAU);
          c.fill();
        }
        // Floodlight beams.
        [[60, 0], [W - 60, 0]].forEach(function (t) {
          var beam = c.createLinearGradient(t[0], 0, W / 2, 360);
          beam.addColorStop(0, 'rgba(240,235,255,.14)');
          beam.addColorStop(1, 'rgba(240,235,255,0)');
          c.fillStyle = beam;
          c.beginPath();
          c.moveTo(t[0] - 16, -4); c.lineTo(t[0] + 16, -4);
          c.lineTo(W / 2 + 190, 380); c.lineTo(W / 2 - 190, 380);
          c.closePath(); c.fill();
        });

        // Goal + net.
        c.strokeStyle = '#f5f6ff'; c.lineWidth = 7; c.lineJoin = 'round';
        c.strokeRect(GOAL.x, GOAL.y, GOAL.w, GOAL.h);
        var wob = Math.max(0, d.netWob);
        c.strokeStyle = 'rgba(255,255,255,.20)'; c.lineWidth = 1;
        for (var i = 1; i < 15; i++) {
          var nx = GOAL.x + i * (GOAL.w / 15);
          c.beginPath();
          c.moveTo(nx, GOAL.y);
          c.quadraticCurveTo(nx + Math.sin(g.t * 20 + i) * wob * 7, GOAL.y + GOAL.h / 2, nx, GOAL.y + GOAL.h);
          c.stroke();
        }
        for (var j = 1; j < 7; j++) {
          var yy = GOAL.y + j * (GOAL.h / 7);
          c.beginPath();
          c.moveTo(GOAL.x, yy);
          c.quadraticCurveTo(W / 2, yy + wob * 8, GOAL.x + GOAL.w, yy);
          c.stroke();
        }

        // Penalty-box arcs for depth.
        c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 3;
        c.beginPath();
        c.moveTo(GOAL.x - 120, GOAL.y + GOAL.h + 4);
        c.lineTo(GOAL.x - 60, H - 190);
        c.lineTo(GOAL.x + GOAL.w + 60, H - 190);
        c.lineTo(GOAL.x + GOAL.w + 120, GOAL.y + GOAL.h + 4);
        c.stroke();

        // Keeper — jade kit, arms out.
        var kp = d.keeper;
        c.fillStyle = '#2dd4bf';
        U.roundRect(c, kp.x - 17, kp.y - 30, 34, 52, 11); c.fill();
        c.strokeStyle = '#2dd4bf'; c.lineWidth = 8; c.lineCap = 'round';
        c.beginPath();
        c.moveTo(kp.x - 15, kp.y - 20); c.lineTo(kp.x - 40, kp.y - 40);
        c.moveTo(kp.x + 15, kp.y - 20); c.lineTo(kp.x + 40, kp.y - 40);
        c.stroke();
        c.fillStyle = '#f4cba4';
        c.beginPath(); c.arc(kp.x, kp.y - 40, 10, 0, TAU); c.fill();

        // The wall.
        var jumpH = Math.sin(U.clamp(d.jump, 0, 1) * Math.PI) * 34;
        var span = d.wallN * 40;
        for (var wI = 0; wI < d.wallN; wI++) {
          var wx = d.wallX - span / 2 + 20 + wI * 40;
          var wy = WALLY - (d.phase === 'shot' || d.jump > 0 ? jumpH : 0);
          c.fillStyle = 'rgba(10,6,22,.4)';
          c.beginPath(); c.ellipse(wx, WALLY + 12, 20, 6, 0, 0, TAU); c.fill();
          c.fillStyle = '#7c3aed';
          U.roundRect(c, wx - 15, wy - 58, 30, 48, 9); c.fill();
          c.fillStyle = '#fff';
          c.font = '800 12px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(String(wI + 2), wx, wy - 28);
          c.fillStyle = '#f4cba4';
          c.beginPath(); c.arc(wx, wy - 68, 9.5, 0, TAU); c.fill();
          c.fillStyle = '#26124a';
          c.beginPath(); c.arc(wx, wy - 71, 9.5, Math.PI, TAU); c.fill();
          // Hands protecting face.
          c.fillStyle = '#f4cba4';
          c.beginPath(); c.arc(wx - 6, wy - 52, 4, 0, TAU); c.fill();
          c.beginPath(); c.arc(wx + 6, wy - 52, 4, 0, TAU); c.fill();
        }

        // Shot trail + ball, or the waiting ball + aim guide.
        if (d.shot) {
          var s = d.shot;
          s.trail.forEach(function (q) {
            if (q.t <= 0) return;
            c.globalAlpha = q.t * 1.6;
            c.fillStyle = '#fff';
            c.beginPath(); c.arc(q.x, q.y, 12 * q.t, 0, TAU); c.fill();
          });
          c.globalAlpha = 1;
          var p = shotPos(s, Math.min(1, s.t));
          var r = U.lerp(13, 6.5, Math.min(1, s.t));
          ballDraw(c, p.x, p.y, r, s.spin);
        } else {
          ballDraw(c, BALLX, BALLY, 13, 0);
          if (d.drag && d.drag.pts.length > 1) {
            var pts = d.drag.pts;
            c.strokeStyle = 'rgba(240,171,252,.85)'; c.lineWidth = 4; c.lineCap = 'round';
            c.beginPath();
            c.moveTo(pts[0].x, pts[0].y);
            for (var di = 1; di < pts.length; di++) c.lineTo(pts[di].x, pts[di].y);
            c.stroke();
            var lastP = pts[pts.length - 1];
            c.fillStyle = '#f0abfc';
            c.beginPath(); c.arc(lastP.x, lastP.y, 7, 0, TAU); c.fill();
          } else if (d.phase === 'aim') {
            var pulse = 1 + Math.sin(g.t * 4) * .12;
            c.strokeStyle = 'rgba(240,171,252,.5)'; c.lineWidth = 2;
            c.beginPath(); c.arc(BALLX, BALLY, 24 * pulse, 0, TAU); c.stroke();
          }
        }

        // Particles + confetti.
        d.parts.forEach(function (pp) {
          c.globalAlpha = Math.max(0, pp.t / pp.max);
          c.fillStyle = pp.col;
          c.fillRect(pp.x - 2.5, pp.y - 2.5, 5, 5);
        });
        d.confetti.forEach(function (cf) {
          c.globalAlpha = Math.max(0, cf.t / cf.max);
          c.fillStyle = cf.col;
          c.fillRect(cf.x - cf.r / 2, cf.y - cf.r / 2, cf.r, cf.r * 1.6);
        });
        c.globalAlpha = 1;

        // Messages.
        c.textAlign = 'center';
        if (d.result) {
          c.fillStyle = d.resultCol;
          c.font = '800 40px Outfit, sans-serif';
          c.fillText(d.result, W / 2, H / 2 - 30);
        } else if (d.phase === 'aim' && d.msg) {
          c.fillStyle = 'rgba(245,246,255,.85)';
          c.font = '800 17px Outfit, sans-serif';
          c.fillText(d.msg, W / 2, H - 22);
        }
        // Round tally dots.
        for (var kd = 0; kd < KICKS; kd++) {
          c.fillStyle = kd < d.kick ?
            (kd < d.goalsRound ? '#4ade80' : 'rgba(251,113,133,.85)') : 'rgba(255,255,255,.2)';
          c.beginPath(); c.arc(28 + kd * 20, H - 24, 6, 0, TAU); c.fill();
        }
      }
    });

    function ballDraw(c, x, y, r, spin) {
      c.fillStyle = 'rgba(6,4,16,.4)';
      c.beginPath(); c.ellipse(x, y + r + 4, r * .9, r * .3, 0, 0, TAU); c.fill();
      c.fillStyle = '#fdfdff';
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      c.fillStyle = '#1c1c2e';
      for (var i = 0; i < 3; i++) {
        var a = spin + i * TAU / 3;
        c.beginPath();
        c.arc(x + Math.cos(a) * r * .55, y + Math.sin(a) * r * .55, r * .26, 0, TAU);
        c.fill();
      }
    }
  }

  window.Milo.register({
    id: 'free-kick', title: 'Free Kick', emo: '🥅', category: 'Sports',
    tagline: 'Bend it around a growing wall',
    description: 'Set-piece football where the shape of your drag is the shape of the ' +
      'shot: a straight pull flies true, a bowed one whips the ball around the wall. ' +
      'The keeper reads straight shots almost perfectly but guesses against real bend, ' +
      'and every bit of curve pays a bonus on top of the goal. Score 6 of 10 and the ' +
      'wall grows a body — by round four you are threading seven jumping defenders.',
    controls: ['Drag to shoot', 'Curve the drag to bend it'],
    colors: ['#3b1f5e', '#2dd4bf'],
    tags: ['football', 'curve', 'set piece', 'aiming', 'soccer'],
    mount: mount
  });
})();
