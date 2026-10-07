/* Badminton — the shuttle stalls and drops; pick your shot by where you meet it. */
(function () {
  'use strict';

  var W = 860, H = 520;
  var FLOOR = 438, NETX = 430, NETTOP = 344;
  var LEFT_LINE = 70, RIGHT_LINE = 790;
  var GRAV = 1950, DRAG = 0.0012, DT = 1 / 240;
  var TARGET = 21;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    /* ------------------------------------------------------------ physics */

    function stepShuttle(s, dt) {
      var sp = Math.hypot(s.vx, s.vy);
      var k = DRAG * sp * dt;
      s.vx -= s.vx * k;
      s.vy -= s.vy * k;
      s.vy += GRAV * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }

    // Where does a shuttle launched like this come down?
    function landing(x, y, vx, vy) {
      var s = { x: x, y: y, vx: vx, vy: vy };
      for (var i = 0; i < 2400; i++) {
        stepShuttle(s, DT);
        if (s.y >= FLOOR) return s.x;
        if (s.x < -120 || s.x > W + 120) return s.x;
      }
      return s.x;
    }

    // Solve the racket speed that puts the shuttle down on targetX for a
    // given launch angle. Landing distance rises with speed, so a bisection
    // is enough — and it means every shot type keeps its own shape.
    function solve(x, y, angle, targetX, dir) {
      var lo = 150, hi = 2600, mid = 0, i;
      for (i = 0; i < 26; i++) {
        mid = (lo + hi) / 2;
        var vx = Math.cos(angle) * mid * dir;
        var vy = -Math.sin(angle) * mid;
        var lx = landing(x, y, vx, vy);
        if ((dir > 0 && lx < targetX) || (dir < 0 && lx > targetX)) lo = mid; else hi = mid;
      }
      return { vx: Math.cos(angle) * mid * dir, vy: -Math.sin(angle) * mid };
    }

    // Would this shot actually get over the net? Used to veto a drop played
    // from too far back, so the shot named on screen is the shot you get.
    function clearsNet(x, y, vx, vy) {
      var s = { x: x, y: y, vx: vx, vy: vy };
      for (var i = 0; i < 1600; i++) {
        var px = s.x;
        stepShuttle(s, DT);
        if ((px - NETX) * (s.x - NETX) <= 0) return s.y < NETTOP - 3;
        if (s.y >= FLOOR) return false;
      }
      return false;
    }

    var SHOTS = {
      smash: { ang: -0.20, name: 'SMASH', col: '#fb7185' },
      clear: { ang: 0.85, name: 'CLEAR', col: '#38bdf8' },
      drop: { ang: 1.30, name: 'DROP', col: '#a78bfa' },
      lift: { ang: 1.00, name: 'LIFT', col: '#34d399' }
    };

    // A smash from the back of the court has to be flatter or it buries
    // itself in the net; close to the net you can hit it almost straight down.
    function shotAngle(kind, x, dir) {
      if (kind !== 'smash') return SHOTS[kind].ang;
      var depth = U.clamp((dir > 0 ? NETX - x : x - NETX) / 340, 0, 1);
      return -0.22 + 0.20 * depth;
    }

    // Contact height (and how close to the net you are) decides the shot.
    function pickShot(y, x, dir) {
      var nearNet = dir > 0 ? (x > NETX - 118) : (x < NETX + 118);
      if (y < 300) return 'smash';
      if (y < 372) return 'clear';
      return nearNet ? 'drop' : 'lift';
    }

    // Clears go deep, drops go short, and a smash is aimed at whichever end
    // of their court they are not standing in — that is what wins rallies.
    function shotTarget(kind, dir, err, oppX) {
      var deep = dir > 0 ? 740 : 120;
      var shortT = dir > 0 ? 520 : 340;
      var t;
      if (kind === 'smash') {
        var theirDepth = dir > 0 ? (oppX - NETX) : (NETX - oppX);
        t = theirDepth > 176 ? (dir > 0 ? 552 : 308) : (dir > 0 ? 706 : 154);
      } else t = kind === 'drop' ? shortT : deep;
      return t + (err || 0) * (dir > 0 ? 1 : -1);
    }

    /* -------------------------------------------------------------- state */

    function reset(g) {
      var d = g.data;
      d.you = 0; d.cpu = 0;
      d.lvl = 1;
      d.rallies = 0;
      d.px = 210; d.pv = 0;
      d.ax = 640; d.atx = 640; d.recover = 620;
      d.shuttle = null;
      d.last = null;
      d.phase = 'serve-you';
      d.phaseT = 0;
      d.swing = 0; d.aswing = 0;
      d.lastShot = '';
      d.lastShotT = 0;
      d.msg = 'Space to serve';
      d.tap = false;
      d.rallyHits = 0;
      d.trail = [];
      g.set('You', 0);
      g.set('CPU', 0);
      g.set('Rally', 0);
    }

    function serve(g, who) {
      var d = g.data;
      var x = who === 'you' ? d.px : d.ax;
      var dir = who === 'you' ? 1 : -1;
      var v = solve(x, 392, SHOTS.lift.ang, who === 'you' ? 715 : 145, dir);
      d.shuttle = { x: x + dir * 20, y: 392, vx: v.vx, vy: v.vy };
      d.last = who;
      d.phase = 'rally';
      d.rallyHits = 0;
      d.trail = [];
      d.msg = '';
      Milo.sound.tone({ f: 520, f2: 380, d: .07, v: .08, type: 'square' });
    }

    function point(g, who, why) {
      var d = g.data;
      if (who === 'you') { d.you++; Milo.sound.coin(); } else { d.cpu++; Milo.sound.hit(); }
      g.set('You', d.you);
      g.set('CPU', d.cpu);
      d.rallies += d.rallyHits;
      g.set('Rally', d.rallyHits);
      g.score = d.you * 45 + d.rallies * 6;
      d.lvl = 1 + Math.floor((d.you + d.cpu) / 5);
      d.msg = why;
      d.shuttle = null;
      d.phase = 'point';
      d.phaseT = 1.15;
    }

    function gameDone(d) {
      var hi = Math.max(d.you, d.cpu);
      return (hi >= TARGET && Math.abs(d.you - d.cpu) >= 2) || hi >= 30;
    }

    function finish(g) {
      var d = g.data;
      var sc = d.you * 45 + d.rallies * 6 + (d.you > d.cpu ? 450 : 0);
      g.score = sc;
      var txt = d.you + '–' + d.cpu + ' with ' + d.rallies + ' shots played.';
      if (d.you > d.cpu) g.win({ emo: '🏸', title: 'Game — you win ' + d.you + '–' + d.cpu, text: txt, score: sc });
      else g.gameOver({ emo: '🏸', title: 'Game to the club player', text: txt, score: sc });
    }

    /* ---------------------------------------------------------- the swing */

    function playerHit(g) {
      var d = g.data, s = d.shuttle;
      if (!s || d.swing > 0) return;
      d.swing = .22;
      if (Math.abs(s.x - d.px) > 76 || s.y < 140 || s.y > FLOOR - 4 || s.x > NETX - 6) {
        Milo.sound.tone({ f: 190, f2: 140, d: .07, v: .05, type: 'triangle' });
        return;                                   // fresh air
      }
      var kind = pickShot(s.y, s.x, 1);
      var err = U.rand(-34, 34);
      var v = solve(s.x, s.y, shotAngle(kind, s.x, 1), shotTarget(kind, 1, err, d.ax), 1);
      if (!clearsNet(s.x, s.y, v.vx, v.vy)) {
        kind = 'lift';
        v = solve(s.x, s.y, SHOTS.lift.ang, shotTarget('lift', 1, err, d.ax), 1);
      }
      s.vx = v.vx; s.vy = v.vy;
      d.last = 'you';
      d.rallyHits++;
      d.lastShot = SHOTS[kind].name;
      d.lastShotT = 1;
      d.lastShotCol = SHOTS[kind].col;
      Milo.sound.tone({
        f: kind === 'smash' ? 780 : kind === 'drop' ? 420 : 560,
        f2: 260, d: .08, v: .1, type: 'square'
      });
    }

    function cpuHit(g) {
      var d = g.data, s = d.shuttle;
      d.aswing = .22;
      var missChance = Math.max(.02, .09 - d.lvl * .015);
      if (Math.random() < missChance) {
        Milo.sound.tone({ f: 190, f2: 140, d: .07, v: .05, type: 'triangle' });
        return;
      }
      var kind = pickShot(s.y, s.x, -1);
      // A good opponent smashes when you are stuck at the net and drops when
      // you are pinned at the back.
      if (kind === 'clear' && d.px > 300 && Math.random() < .3 + d.lvl * .07) kind = 'smash';
      if (kind === 'clear' && d.px < 160 && Math.random() < .3 + d.lvl * .07) kind = 'drop';
      var err = U.rand(-60, 60) / d.lvl;
      var v = solve(s.x, s.y, shotAngle(kind, s.x, -1), shotTarget(kind, -1, err, d.px), -1);
      if (!clearsNet(s.x, s.y, v.vx, v.vy)) {
        kind = 'lift';
        v = solve(s.x, s.y, SHOTS.lift.ang, shotTarget('lift', -1, err, d.px), -1);
      }
      s.vx = v.vx; s.vy = v.vy;
      // Recover towards the base he should hold after that shot.
      d.recover = kind === 'drop' ? 530 : kind === 'smash' ? 600 : 646;
      d.last = 'cpu';
      d.rallyHits++;
      Milo.sound.tone({ f: kind === 'smash' ? 700 : 500, f2: 240, d: .08, v: .08, type: 'square' });
    }

    /* --------------------------------------------------------------- draw */

    function drawPlayer(c, x, col, swing, dir, bands) {
      c.save();
      c.strokeStyle = col; c.lineWidth = 9; c.lineCap = 'round';
      c.beginPath();
      c.moveTo(x, FLOOR - 4); c.lineTo(x - dir * 8, FLOOR - 52); c.stroke();
      c.beginPath();
      c.moveTo(x - dir * 8, FLOOR - 52); c.lineTo(x + dir * 10, FLOOR - 100); c.stroke();
      c.fillStyle = col;
      c.beginPath(); c.arc(x + dir * 12, FLOOR - 114, 12, 0, 7); c.fill();
      // racket arm
      var a = swing > 0 ? -1.15 + (1 - swing / .22) * 1.5 : -.5;
      var hx = x + dir * (Math.cos(a) * 46), hy = FLOOR - 96 - Math.sin(a) * 46;
      c.strokeStyle = col; c.lineWidth = 7;
      c.beginPath(); c.moveTo(x + dir * 6, FLOOR - 92); c.lineTo(hx, hy); c.stroke();
      c.strokeStyle = '#f8fafc'; c.lineWidth = 3;
      c.beginPath(); c.ellipse(hx + dir * 10, hy - 8, 15, 11, -a * .5, 0, 7); c.stroke();
      if (bands) {
        var zones = [[140, 300, 'rgba(251,113,133,.16)'], [300, 372, 'rgba(56,189,248,.14)'],
        [372, FLOOR, 'rgba(52,211,153,.12)']];
        for (var i = 0; i < zones.length; i++) {
          c.fillStyle = zones[i][2];
          c.fillRect(x - 76, zones[i][0], 152, zones[i][1] - zones[i][0]);
        }
        c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1;
        c.strokeRect(x - 76, 140, 152, FLOOR - 140);
        c.font = '700 10px Outfit, sans-serif'; c.textAlign = 'left';
        var labels = [['SMASH', 294, '#fb7185'], ['CLEAR', 366, '#38bdf8'], ['DROP / LIFT', FLOOR - 6, '#34d399']];
        for (var L = 0; L < labels.length; L++) {
          c.fillStyle = labels[L][2];
          c.fillText(labels[L][0], x - 72, labels[L][1]);
        }
      }
      c.restore();
    }

    return Milo.arcade(host, {
      id: 'badminton',
      w: W, h: H, bg: '#101a2e',
      stats: ['You', 'CPU', 'Rally'],
      emo: '🏸',
      touch: 'dpad+a',
      start: {
        title: 'Badminton',
        text: 'The shuttle rockets off the racket, stalls in the air and drops almost ' +
          'vertically — everything else follows from that. Run under it with ← →, then hit ' +
          'with Space: meet it above your head and you smash, at shoulder height you clear ' +
          'to the back, low at the net you play a drop, low at the back you lift. First to ' +
          '21, rally scoring.',
        keys: ['← →  move', 'Space  hit']
      },
      init: reset,

      onPointer: function (g, type) { if (type === 'down') g.data.tap = true; },

      update: function (g, dt) {
        var d = g.data, k = g.input, i;
        var tap = k.pressed('action') || d.tap;
        d.tap = false;
        if (d.swing > 0) d.swing -= dt;
        if (d.aswing > 0) d.aswing -= dt;
        if (d.lastShotT > 0) d.lastShotT -= dt;

        // movement
        var mv = (k.down('right') ? 1 : 0) - (k.down('left') ? 1 : 0);
        d.px = U.clamp(d.px + mv * 248 * dt, LEFT_LINE - 20, NETX - 46);

        if (d.phase === 'serve-you') {
          if (tap) serve(g, 'you');
          return;
        }
        if (d.phase === 'serve-cpu') {
          d.phaseT -= dt;
          if (d.phaseT <= 0) serve(g, 'cpu');
          return;
        }
        if (d.phase === 'point') {
          d.phaseT -= dt;
          if (d.phaseT <= 0) {
            if (gameDone(d)) { finish(g); return; }
            var server = d.you > d.cpu || (d.you === d.cpu && d.lastPoint === 'you') ? null : null;
            void server;
            d.phase = d.lastPoint === 'you' ? 'serve-you' : 'serve-cpu';
            d.phaseT = .9;
            d.msg = d.lastPoint === 'you' ? 'Your serve — Space' : 'Their serve…';
          }
          return;
        }

        if (d.phase !== 'rally' || !d.shuttle) return;

        if (tap) playerHit(g);

        var s = d.shuttle;
        // Sub-step so a 1200px/s shuttle cannot tunnel through the net.
        var steps = 4, sdt = dt / steps;
        for (i = 0; i < steps; i++) {
          var px0 = s.x;
          stepShuttle(s, sdt);
          // net
          if ((px0 - NETX) * (s.x - NETX) <= 0 && s.y > NETTOP) {
            d.lastPoint = d.last === 'you' ? 'cpu' : 'you';
            point(g, d.lastPoint, 'Into the net.');
            return;
          }
          if (s.y >= FLOOR) {
            var inCourt = s.x > LEFT_LINE && s.x < RIGHT_LINE;
            var theirSide = s.x > NETX;
            var winner;
            if (!inCourt) winner = d.last === 'you' ? 'cpu' : 'you';
            else winner = theirSide ? 'you' : 'cpu';
            var why = !inCourt ? (d.last === 'you' ? 'Long — out of court.' : 'They put it out.')
              : theirSide ? 'Down in their court!' : 'It lands behind you.';
            d.lastPoint = winner;
            point(g, winner, why);
            return;
          }
          if (s.x < -80 || s.x > W + 80) {
            d.lastPoint = d.last === 'you' ? 'cpu' : 'you';
            point(g, d.lastPoint, 'Out.');
            return;
          }
        }
        d.trail.push({ x: s.x, y: s.y });
        if (d.trail.length > 14) d.trail.shift();

        // opponent: reads the landing spot, moves there, swings when in range
        if (d.last === 'you') {
          var lx = landing(s.x, s.y, s.vx, s.vy);
          d.atx = U.clamp(lx + U.rand(-8, 8) / d.lvl, NETX + 40, RIGHT_LINE + 10);
        } else {
          d.atx = d.recover || 620;
        }
        var aspeed = 208 + d.lvl * 26;
        var ddx = d.atx - d.ax;
        d.ax += U.clamp(ddx, -aspeed * dt, aspeed * dt);
        if (d.last === 'you' && d.aswing <= 0 && s.x > NETX + 6 &&
          Math.abs(s.x - d.ax) < 70 && s.y > 150 && s.y < FLOOR - 10) {
          // Wait for a good contact height when there is time to.
          if (s.vy > 0 || s.y > 330 || Math.random() < .35) cpuHit(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i;

        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#16233d'); sky.addColorStop(1, '#0b1122');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        // hall floor
        c.fillStyle = '#1f6f4f';
        c.fillRect(0, FLOOR, W, H - FLOOR);
        c.fillStyle = '#2b8a63';
        c.fillRect(LEFT_LINE, FLOOR, RIGHT_LINE - LEFT_LINE, H - FLOOR);
        c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(LEFT_LINE, FLOOR); c.lineTo(LEFT_LINE, H); c.stroke();
        c.beginPath(); c.moveTo(RIGHT_LINE, FLOOR); c.lineTo(RIGHT_LINE, H); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 2;
        [LEFT_LINE + 160, RIGHT_LINE - 160].forEach(function (x) {
          c.beginPath(); c.moveTo(x, FLOOR); c.lineTo(x, H); c.stroke();
        });

        // net
        c.fillStyle = '#e2e8f0';
        c.fillRect(NETX - 3, NETTOP - 8, 6, 8);
        c.strokeStyle = 'rgba(226,232,240,.5)'; c.lineWidth = 1;
        for (i = 0; i <= 14; i++) {
          c.beginPath(); c.moveTo(NETX - 3, NETTOP + i * ((FLOOR - NETTOP) / 14));
          c.lineTo(NETX + 3, NETTOP + i * ((FLOOR - NETTOP) / 14)); c.stroke();
        }
        c.fillStyle = 'rgba(226,232,240,.32)';
        c.fillRect(NETX - 2, NETTOP, 4, FLOOR - NETTOP);
        c.fillStyle = '#94a3b8';
        c.fillRect(NETX - 4, NETTOP - 12, 8, 4);

        drawPlayer(c, d.px, '#38bdf8', d.swing, 1, d.phase === 'rally' || d.phase === 'serve-you');
        drawPlayer(c, d.ax, '#fb923c', d.aswing, -1, false);

        // shuttle + trail
        for (i = 0; i < d.trail.length; i++) {
          c.fillStyle = 'rgba(255,255,255,' + (i / d.trail.length * .28) + ')';
          c.beginPath(); c.arc(d.trail[i].x, d.trail[i].y, 3, 0, 7); c.fill();
        }
        if (d.shuttle) {
          var s = d.shuttle;
          var ang = Math.atan2(s.vy, s.vx);
          c.save();
          c.translate(s.x, s.y); c.rotate(ang + Math.PI);
          c.fillStyle = 'rgba(248,250,252,.85)';
          c.beginPath(); c.moveTo(0, 0); c.lineTo(17, -9); c.lineTo(17, 9); c.closePath(); c.fill();
          c.fillStyle = '#f8fafc';
          c.beginPath(); c.arc(0, 0, 5, 0, 7); c.fill();
          c.restore();
          // shadow on the floor
          c.fillStyle = 'rgba(0,0,0,.25)';
          c.beginPath(); c.ellipse(s.x, FLOOR + 6, 10, 3, 0, 0, 7); c.fill();
        }

        // shot readout
        if (d.lastShotT > 0 && d.lastShot) {
          c.globalAlpha = Math.min(1, d.lastShotT);
          c.fillStyle = d.lastShotCol || '#fff';
          c.font = '900 26px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(d.lastShot, d.px, 128);
          c.globalAlpha = 1;
        }

        // scoreboard
        c.fillStyle = 'rgba(8,14,26,.8)';
        U.roundRect(c, W / 2 - 92, 64, 184, 40, 10); c.fill();
        c.font = '900 24px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillStyle = '#38bdf8'; c.fillText(d.you, W / 2 - 52, 93);
        c.fillStyle = 'rgba(226,232,240,.5)'; c.fillText('–', W / 2, 93);
        c.fillStyle = '#fb923c'; c.fillText(d.cpu, W / 2 + 52, 93);
        c.font = '600 10px Outfit, sans-serif';
        c.fillStyle = 'rgba(226,232,240,.55)';
        c.fillText('FIRST TO ' + TARGET + '  ·  OPPONENT LV ' + d.lvl, W / 2, 116);

        if (d.msg) {
          c.fillStyle = '#f1f5f9';
          c.font = '800 19px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(d.msg, W / 2, H - 16);
        }
      }
    });
  }

  window.Milo.register({
    id: 'badminton',
    title: 'Badminton',
    emo: '🏸',
    category: 'Sports',
    tagline: 'The shuttle stalls, then falls off a cliff',
    description: 'Shuttle flight is modelled with heavy drag, so every shot leaves fast, ' +
      'stalls and then drops almost straight down — reading that fall is the whole game. ' +
      'Run under it with ← → and hit with Space; the contact height picks the shot for you: ' +
      'above your head is a smash, shoulder height is a clear to the back line, low at the ' +
      'net is a delicate drop and low at the back is a defensive lift. Rally scoring to 21, ' +
      'win by two, and the opponent gets quicker and more accurate every five points — so ' +
      'once they are sharp, pull them to the net with a drop before you smash.',
    controls: ['← →  move', 'Space  hit'],
    colors: ['#0ea5e9', '#f97316'],
    tags: ['badminton', 'rally', 'timing', 'vs cpu', 'racket'],
    mount: mount
  });
})();
