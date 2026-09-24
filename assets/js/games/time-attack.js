/* Time Attack — one car, one circuit, and the ghost of your own best lap. */
(function () {
  'use strict';
  var W = 900, H = 600, TAU = Math.PI * 2;
  var TRACKW = 30, LAPS = 8, SAMPLES = 16;
  var KEY = 'time-attack:ghost';

  // Hand-drawn circuit: a long left sweep, a chicane and two hairpins.
  var CTRL = [
    [130, 310], [178, 158], [332, 104], [470, 152], [520, 272], [624, 300],
    [706, 202], [814, 232], [832, 382], [724, 432], [662, 398], [548, 424],
    [472, 522], [332, 542], [202, 472], [140, 420]
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    /* ---------------------------------------------------- the centreline */

    var PATH = (function () {
      var out = [], n = CTRL.length;
      function cr(p0, p1, p2, p3, t) {
        var t2 = t * t, t3 = t2 * t;
        return 0.5 * ((2 * p1) + (-p0 + p2) * t +
          (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
      }
      for (var i = 0; i < n; i++) {
        var a = CTRL[(i - 1 + n) % n], b = CTRL[i], c = CTRL[(i + 1) % n], e = CTRL[(i + 2) % n];
        for (var k = 0; k < SAMPLES; k++) {
          var t = k / SAMPLES;
          out.push({ x: cr(a[0], b[0], c[0], e[0], t), y: cr(a[1], b[1], c[1], e[1], t) });
        }
      }
      return out;
    })();
    var N = PATH.length;
    var S1 = Math.round(N / 3), S2 = Math.round(N * 2 / 3);

    function nearest(x, y, from) {
      var best = from, bd = 1e9;
      for (var k = -18; k <= 30; k++) {
        var i = ((from + k) % N + N) % N;
        var dx = PATH[i].x - x, dy = PATH[i].y - y;
        var dd = dx * dx + dy * dy;
        if (dd < bd) { bd = dd; best = i; }
      }
      return { i: best, d: Math.sqrt(bd) };
    }

    function loadGhost() {
      var raw = Milo.store.get(KEY, null);
      if (!raw || !raw.t || !raw.p || raw.p.length !== N || raw.t.length !== N) return null;
      return raw;
    }

    function reset(g) {
      var d = g.data;
      var p0 = PATH[0], p1 = PATH[4];
      d.a = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      d.x = p0.x; d.y = p0.y;
      d.vx = 0; d.vy = 0;
      d.idx = 0;
      d.lap = 0;
      d.lapT = 0;
      d.total = 0;
      d.bestLap = 0;
      d.sect = [0, 0, 0];
      d.bestSect = null;
      d.recT = new Array(N);
      d.recP = new Array(N);
      d.ghost = loadGhost();
      d.storedBest = d.ghost ? d.ghost.best : 0;
      d.marks = [];
      d.parts = [];
      d.delta = null;
      d.splitMsg = '';
      d.splitT = 0;
      d.splitCol = '#fff';
      d.phase = 'count';
      d.count = 3.2;
      d.lastBeep = 0;
      d.started = false;
      g.set('Lap', '1/' + LAPS);
      g.set('Lap time', '0.00');
      g.set('Best', d.storedBest ? (d.storedBest / 1000).toFixed(2) : '—');
      g.set('Speed', 0);
    }

    function fmt(ms) { return (ms / 1000).toFixed(2); }
    function scoreOf(d) {
      var b = d.bestLap || d.storedBest;
      return b ? Math.max(0, 300000 - Math.round(b)) : 0;
    }

    function startLapRecord(d) {
      d.recT = new Array(N);
      d.recP = new Array(N);
      d.lapT = 0;
      d.sect = [0, 0, 0];
    }

    function saveGhost(d) {
      var t = [], p = [], i;
      for (i = 0; i < N; i++) {
        if (d.recT[i] == null) return;                 // incomplete lap, keep the old ghost
        t.push(Math.round(d.recT[i]));
        p.push([Math.round(d.recP[i][0] * 10) / 10, Math.round(d.recP[i][1] * 10) / 10,
        Math.round(d.recP[i][2] * 100) / 100]);
      }
      var rec = { best: Math.round(d.lapT), t: t, p: p, s: d.sect.slice() };
      d.ghost = rec;
      d.storedBest = rec.best;
      d.bestSect = rec.s;
      Milo.store.set(KEY, rec);
    }

    function ghostAt(d, ms) {
      var gh = d.ghost;
      if (!gh) return null;
      if (ms >= gh.t[N - 1]) ms = gh.t[N - 1];
      // binary search the recorded times
      var lo = 0, hi = N - 1;
      while (lo < hi - 1) {
        var mid = (lo + hi) >> 1;
        if (gh.t[mid] <= ms) lo = mid; else hi = mid;
      }
      var t0 = gh.t[lo], t1 = gh.t[hi];
      var f = t1 > t0 ? (ms - t0) / (t1 - t0) : 0;
      var A = gh.p[lo], B = gh.p[hi];
      return {
        x: U.lerp(A[0], B[0], f), y: U.lerp(A[1], B[1], f),
        a: A[2] + wrap(B[2] - A[2]) * f
      };
    }

    function wrap(a) { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; }

    return Milo.arcade(host, {
      id: 'time-attack',
      w: W, h: H, bg: '#0b1020',
      stats: ['Lap', 'Lap time', 'Best', 'Speed'],
      touch: 'dpad',
      emo: '⏱️',
      start: {
        title: 'Time Attack',
        text: 'No rivals, no contact — just eight laps of one circuit and a translucent ghost ' +
          'of your own best lap running the same road beside you. Three sector splits tell you ' +
          'live whether you are up or down on it, and the ghost is saved, so the next session ' +
          'starts against the best you have ever driven here.',
        keys: ['↑ throttle', '↓ brake', '← → steer']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, inp = g.input, i;

        if (d.phase === 'count') {
          d.count -= dt;
          if (Math.ceil(d.count) !== d.lastBeep) {
            d.lastBeep = Math.ceil(d.count);
            Milo.sound.tone({ f: d.count < 1 ? 880 : 440, d: .12, v: .1 });
          }
          if (d.count <= 0) { d.phase = 'run'; startLapRecord(d); }
          return;
        }
        if (d.phase === 'done') return;

        d.lapT += dt * 1000;
        d.total += dt * 1000;
        if (d.splitT > 0) d.splitT -= dt;

        var thr = inp.down('up') || inp.down('action');
        var brake = inp.down('down');
        var steer = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
        if (inp.pdown) {
          thr = true;
          steer = inp.px < W * .4 ? -1 : inp.px > W * .6 ? 1 : 0;
        }

        var near = nearest(d.x, d.y, d.idx);
        var onTrack = near.d < TRACKW;
        var sp = Math.hypot(d.vx, d.vy);

        d.a += steer * dt * 3.0 * Math.min(1, sp / 55) * (onTrack ? 1 : .7);

        var ca = Math.cos(d.a), sa = Math.sin(d.a);
        var vf = d.vx * ca + d.vy * sa;
        var vl = -d.vx * sa + d.vy * ca;

        if (thr) vf += (onTrack ? 330 : 120) * dt;
        if (brake) vf -= 480 * dt;
        vf -= (onTrack ? 0.45 : 3.6) * vf * dt;
        vl -= (onTrack ? 7.2 : 4.0) * vl * dt;
        var maxv = onTrack ? 306 : 150;
        if (vf > maxv) vf = maxv;
        if (vf < -60) vf = -60;

        d.vx = vf * ca - vl * sa;
        d.vy = vf * sa + vl * ca;
        d.x += d.vx * dt;
        d.y += d.vy * dt;

        if (!onTrack) {
          var p = PATH[near.i];
          var bx = p.x - d.x, by = p.y - d.y, bl = Math.hypot(bx, by) || 1;
          d.vx += bx / bl * 70 * dt;
          d.vy += by / bl * 70 * dt;
          if (g.frame % 3 === 0) {
            d.parts.push({ x: d.x, y: d.y, vx: U.rand(-40, 40), vy: U.rand(-40, 40), t: .5, max: .5, col: '#4d7a44' });
          }
        } else if (Math.abs(vl) > 34 && g.frame % 2 === 0) {
          d.marks.push({ x: d.x, y: d.y, a: d.a });
          if (d.marks.length > 420) d.marks.shift();
        }
        if (g.frame % 6 === 0 && sp > 15) {
          Milo.sound.tone({ f: 60 + sp * .6, d: .06, v: .035, type: 'sawtooth' });
        }

        // record the lap, index by index
        var prev = d.idx;
        d.idx = near.i;
        if (d.idx !== prev) {
          var step = ((d.idx - prev) % N + N) % N;
          if (step < N / 2) {
            for (i = 1; i <= step; i++) {
              var k = (prev + i) % N;
              if (d.recT[k] == null) {
                d.recT[k] = d.lapT;
                d.recP[k] = [d.x, d.y, d.a];
              }
            }
          }
          // sector boundaries
          if (crossed(prev, d.idx, S1)) sector(g, d, 0);
          if (crossed(prev, d.idx, S2)) sector(g, d, 1);
          if (crossed(prev, d.idx, 0)) lapDone(g, d);
        }

        // live delta against the ghost's time at this point on the road
        if (d.ghost && d.ghost.t[d.idx] != null) d.delta = d.lapT - d.ghost.t[d.idx];
        else d.delta = null;

        for (i = d.parts.length - 1; i >= 0; i--) {
          var pp = d.parts[i];
          pp.x += pp.vx * dt; pp.y += pp.vy * dt; pp.t -= dt;
          if (pp.t <= 0) d.parts.splice(i, 1);
        }

        g.score = scoreOf(d);
        g.set('Lap', Math.min(LAPS, d.lap + 1) + '/' + LAPS);
        g.set('Lap time', fmt(d.lapT));
        g.set('Speed', Math.round(sp * .58));
      },

      draw: function (g) { render(g, g.ctx, g.data); }
    });

    function crossed(prev, now, mark) {
      if (prev === now) return false;
      var step = ((now - prev) % N + N) % N;
      if (step > N / 2) return false;                       // went backwards
      return ((mark - prev) % N + N) % N <= step && ((mark - prev) % N + N) % N > 0;
    }

    function sector(g, d, which) {
      var prevSum = which === 0 ? 0 : d.sect[0];
      d.sect[which] = d.lapT - prevSum;
      if (d.bestSect) {
        var delta = d.sect[which] - d.bestSect[which];
        d.splitMsg = 'S' + (which + 1) + '  ' + (delta >= 0 ? '+' : '') + (delta / 1000).toFixed(2);
        d.splitCol = delta < 0 ? '#4ade80' : '#fb7185';
      } else {
        d.splitMsg = 'S' + (which + 1) + '  ' + fmt(d.sect[which]);
        d.splitCol = '#ffd257';
      }
      d.splitT = 2.4;
      Milo.sound.blip();
    }

    function lapDone(g, d) {
      if (!d.started) {                 // rolling off the line, not a timed lap
        d.started = true;
        startLapRecord(d);
        return;
      }
      d.sect[2] = d.lapT - d.sect[0] - d.sect[1];
      var isBest = !d.storedBest || d.lapT < d.storedBest;
      var delta = d.storedBest ? d.lapT - d.storedBest : 0;
      d.splitMsg = isBest ? 'LAP ' + fmt(d.lapT) + '  NEW BEST'
        : 'LAP ' + fmt(d.lapT) + '  ' + (delta >= 0 ? '+' : '') + (delta / 1000).toFixed(2);
      d.splitCol = isBest ? '#4ade80' : '#fb7185';
      d.splitT = 3;
      if (!d.bestLap || d.lapT < d.bestLap) d.bestLap = d.lapT;
      if (isBest) { saveGhost(d); Milo.sound.powerup(); }
      else Milo.sound.blip();
      g.set('Best', d.storedBest ? fmt(d.storedBest) : fmt(d.lapT));

      d.lap++;
      if (d.lap >= LAPS) {
        d.phase = 'done';
        var best = d.bestLap;
        var txt = 'Best lap of the session ' + fmt(best) + 's' +
          (d.storedBest && d.storedBest < best ? ', all-time best ' + fmt(d.storedBest) + 's' : '') +
          '. The ghost keeps whatever you just set.';
        if (isBest) g.win({ emo: '⏱️', title: 'New all-time best', text: txt, score: scoreOf(d) });
        else g.gameOver({ emo: '🏁', title: 'Session over', text: txt, score: scoreOf(d) });
        return;
      }
      startLapRecord(d);
    }

    /* ------------------------------------------------------------ paint */

    function trackPath(c) {
      c.beginPath();
      c.moveTo(PATH[0].x, PATH[0].y);
      for (var i = 1; i <= N; i++) c.lineTo(PATH[i % N].x, PATH[i % N].y);
      c.closePath();
    }

    function render(g, c, d) {
      var i;
      c.fillStyle = '#0b1020'; c.fillRect(0, 0, W, H);
      // grass
      c.fillStyle = '#16301c'; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,.02)';
      for (i = 0; i < W; i += 26) c.fillRect(i, 0, 13, H);

      trackPath(c);
      c.lineJoin = 'round'; c.lineCap = 'round';
      c.lineWidth = (TRACKW + 12) * 2; c.strokeStyle = '#d9dee8'; c.stroke();
      c.lineWidth = (TRACKW + 6) * 2; c.strokeStyle = '#b8434a'; c.stroke();
      c.lineWidth = TRACKW * 2; c.strokeStyle = '#2b3140'; c.stroke();

      // skid marks
      c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 3;
      for (i = 0; i < d.marks.length; i++) {
        var m = d.marks[i];
        c.beginPath();
        c.moveTo(m.x - Math.sin(m.a) * 7, m.y + Math.cos(m.a) * 7);
        c.lineTo(m.x - Math.sin(m.a) * 7 - Math.cos(m.a) * 8, m.y + Math.cos(m.a) * 7 - Math.sin(m.a) * 8);
        c.moveTo(m.x + Math.sin(m.a) * 7, m.y - Math.cos(m.a) * 7);
        c.lineTo(m.x + Math.sin(m.a) * 7 - Math.cos(m.a) * 8, m.y - Math.cos(m.a) * 7 - Math.sin(m.a) * 8);
        c.stroke();
      }

      // sector + start lines
      lineAt(c, 0, '#fff', 5);
      lineAt(c, S1, '#ffd257', 3);
      lineAt(c, S2, '#ffd257', 3);
      c.fillStyle = '#ffd257'; c.font = 'bold 11px system-ui,sans-serif';
      c.fillText('S1', PATH[S1].x + 12, PATH[S1].y - 10);
      c.fillText('S2', PATH[S2].x + 12, PATH[S2].y - 10);

      for (i = 0; i < d.parts.length; i++) {
        var p = d.parts[i];
        c.globalAlpha = Math.max(0, p.t / p.max);
        c.fillStyle = p.col;
        c.fillRect(p.x - 2, p.y - 2, 4, 4);
      }
      c.globalAlpha = 1;

      // the ghost
      if (d.ghost && d.phase === 'run') {
        var gh = ghostAt(d, d.lapT);
        if (gh) {
          c.globalAlpha = .42;
          drawCar(c, gh.x, gh.y, gh.a, '#9fd8ff', false);
          c.globalAlpha = 1;
          c.fillStyle = 'rgba(159,216,255,.85)'; c.font = 'bold 10px system-ui,sans-serif';
          c.textAlign = 'center';
          c.fillText('GHOST', gh.x, gh.y - 18);
          c.textAlign = 'left';
        }
      }

      drawCar(c, d.x, d.y, d.a, '#ff4f79', true);
      drawHud(g, c, d);
    }

    function lineAt(c, i, col, w) {
      var a = PATH[i], b = PATH[(i + 2) % N];
      var ang = Math.atan2(b.y - a.y, b.x - a.x);
      c.save();
      c.translate(a.x, a.y); c.rotate(ang);
      c.fillStyle = col;
      c.fillRect(-w / 2, -TRACKW, w, TRACKW * 2);
      c.restore();
    }

    function drawCar(c, x, y, a, col, mine) {
      c.save();
      c.translate(x, y);
      c.rotate(a);
      c.fillStyle = 'rgba(0,0,0,.35)';
      U.roundRect(c, -14, -8, 28, 16, 4); c.fill();
      c.fillStyle = '#12161f';
      c.fillRect(-11, -11, 7, 4); c.fillRect(-11, 7, 7, 4);
      c.fillRect(6, -11, 7, 4); c.fillRect(6, 7, 7, 4);
      c.fillStyle = col;
      U.roundRect(c, -16, -9, 32, 18, 5); c.fill();
      if (mine) { c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.5; c.stroke(); }
      c.fillStyle = 'rgba(12,18,34,.8)';
      U.roundRect(c, -3, -6.5, 11, 13, 3); c.fill();
      c.fillStyle = '#fff';
      c.fillRect(13, -6, 3, 4); c.fillRect(13, 2, 3, 4);
      c.restore();
    }

    function drawHud(g, c, d) {
      // live delta
      if (d.delta != null && d.phase === 'run' && d.started) {
        var ahead = d.delta < 0;
        c.fillStyle = ahead ? 'rgba(74,222,128,.92)' : 'rgba(251,113,133,.92)';
        U.roundRect(c, W / 2 - 92, 96, 184, 40, 10); c.fill();
        c.textAlign = 'center';
        c.fillStyle = '#0b1020'; c.font = 'bold 24px system-ui,sans-serif';
        c.fillText((ahead ? '−' : '+') + (Math.abs(d.delta) / 1000).toFixed(2), W / 2, 124);
        c.textAlign = 'left';
      }

      if (d.splitT > 0) {
        c.textAlign = 'center';
        c.globalAlpha = Math.min(1, d.splitT);
        c.fillStyle = 'rgba(8,12,24,.86)';
        U.roundRect(c, W / 2 - 150, 146, 300, 38, 9); c.fill();
        c.fillStyle = d.splitCol; c.font = 'bold 20px system-ui,sans-serif';
        c.fillText(d.splitMsg, W / 2, 172);
        c.globalAlpha = 1;
        c.textAlign = 'left';
      }

      // sector board
      c.fillStyle = 'rgba(8,12,24,.78)';
      U.roundRect(c, 16, H - 96, 236, 80, 10); c.fill();
      c.fillStyle = '#9fb0d8'; c.font = '11px system-ui,sans-serif';
      c.fillText('SECTORS  (this lap / best)', 28, H - 78);
      for (var i = 0; i < 3; i++) {
        var mine = d.sect[i], bestS = d.bestSect ? d.bestSect[i] : 0;
        var y = H - 60 + i * 16;
        c.fillStyle = '#c3cde6'; c.font = '12px system-ui,sans-serif';
        c.fillText('S' + (i + 1), 28, y);
        c.fillStyle = mine ? (bestS && mine < bestS ? '#4ade80' : bestS ? '#fb7185' : '#ffd257') : '#5b6488';
        c.fillText(mine ? fmt(mine) : '—', 58, y);
        c.fillStyle = '#7d88ad';
        c.fillText(bestS ? fmt(bestS) : '—', 120, y);
        if (mine && bestS) {
          var dd = mine - bestS;
          c.fillStyle = dd < 0 ? '#4ade80' : '#fb7185';
          c.fillText((dd >= 0 ? '+' : '') + (dd / 1000).toFixed(2), 180, y);
        }
      }

      // all-time
      c.fillStyle = 'rgba(8,12,24,.78)';
      U.roundRect(c, W - 214, H - 62, 198, 46, 10); c.fill();
      c.fillStyle = '#9fb0d8'; c.font = '11px system-ui,sans-serif';
      c.fillText('ALL-TIME BEST LAP', W - 202, H - 42);
      c.fillStyle = d.storedBest ? '#22d3ee' : '#5b6488';
      c.font = 'bold 22px system-ui,sans-serif';
      c.fillText(d.storedBest ? fmt(d.storedBest) + 's' : 'not set', W - 202, H - 22);

      if (d.phase === 'count') {
        c.textAlign = 'center';
        c.fillStyle = 'rgba(8,12,24,.6)'; c.fillRect(0, H / 2 - 74, W, 148);
        c.fillStyle = '#fff'; c.font = 'bold 72px system-ui,sans-serif';
        c.fillText(d.count > 1 ? String(Math.ceil(d.count - .2)) : 'GO!', W / 2, H / 2 + 14);
        c.fillStyle = '#9fd8ff'; c.font = '16px system-ui,sans-serif';
        c.fillText(d.ghost ? 'Your ghost is out there — beat it.'
          : 'First lap sets the ghost. Then beat yourself.', W / 2, H / 2 + 50);
        c.textAlign = 'left';
      }
    }
  }

  window.Milo.register({
    id: 'time-attack', title: 'Time Attack', emo: '⏱️', category: 'Racing',
    tagline: 'Race the ghost of your own best lap',
    description: 'One car, one twisting circuit and nobody to hit. Your best lap is recorded ' +
      'corner by corner and played back as a translucent ghost on the next one, so you can see ' +
      'exactly where it is pulling away from you. A live delta reads out how far up or down you ' +
      'are at this precise point on the road, and three sector splits go green or red as you ' +
      'cross them. Eight laps a session, and the ghost is saved between sessions — so the car ' +
      'you are chasing only ever gets faster. Tip: the sector that costs you is usually the one ' +
      'you entered fastest.',
    controls: ['↑ throttle', '↓ brake', '← → steer'],
    colors: ['#ff4f79', '#9fd8ff'],
    tags: ['time trial', 'ghost', 'laps', 'splits', 'circuit'],
    scoreLabel: 'pts',
    mount: mount
  });
})();
