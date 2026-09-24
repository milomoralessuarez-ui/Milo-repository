/* Hover Pod — anti-grav racing inside a tube that will not hold still. */
(function () {
  'use strict';
  var W = 900, H = 600, TAU = Math.PI * 2;
  var TL = 27000;                  // track length, world units
  var LAPS = 3;
  var NR = 30, RSTEP = 96;         // rings drawn, spacing
  var FOV = 260, TUBEW = 520;      // projection depth, tube radius in world units
  var PODDIST = 516;               // how far the camera sits behind the pod

  var RIVALS = [
    { name: 'Kessel', col: '#4ade80', sp: 1180 },
    { name: 'Ordo', col: '#fbbf24', sp: 1240 },
    { name: 'Nyx', col: '#f472b6', sp: 1300 }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    /* ------------------------------------------------------------ track */

    function twist(z) {
      return Math.sin(z * 0.00031) * 2.6 + Math.sin(z * 0.00097 + 1.3) * 1.15 + z * 0.00006;
    }
    function bendX(z) { return Math.sin(z * 0.00052 + .6) * 760; }
    function bendY(z) { return Math.sin(z * 0.00071 + 2.2) * 430; }

    // Camera sits PODDIST behind the pod, looking down the tube.
    function proj(d, z) {
      var dist = (z - d.z) + PODDIST;
      if (dist < 46) dist = 46;
      var sc = FOV / dist;
      return {
        x: W / 2 + (bendX(z) - bendX(d.z)) * sc * 2.0,
        y: H / 2 + (bendY(z) - bendY(d.z)) * sc * 2.0,
        r: TUBEW * sc, sc: sc, dist: dist
      };
    }

    function buildTrack(seed) {
      var obs = [], pads = [], z = 2200;
      while (z < TL - 900) {
        var h = U.hash2((z / 37) | 0, 5, seed);
        if (h < 0.24) {
          pads.push({ z: z, a: U.hash2((z / 41) | 0, 9, seed) * TAU, w: 0.5, used: false });
          z += 500 + h * 700;
        } else {
          var bars = 1 + ((h * 3) | 0);
          var base = U.hash2((z / 53) | 0, 17, seed) * TAU;
          for (var b = 0; b < bars; b++) {
            obs.push({ z: z, a: base + b * TAU / (bars + 1.6), w: 0.42 + h * 0.22 });
          }
          z += 330 + h * 520;
        }
      }
      return { obs: obs, pads: pads };
    }

    function reset(g) {
      var d = g.data;
      d.track = buildTrack(((Math.random() * 999) | 0) + 1);
      d.z = 0; d.lap = 0;
      d.th = twist(0) + Math.PI / 2;
      d.thv = 0;
      d.v = 0;
      d.shield = 100;
      d.time = 0;
      d.boosting = false;
      d.hitT = 0;
      d.parts = [];
      d.trail = [];
      d.phase = 'count';
      d.count = 3.2;
      d.lastBeep = 0;
      d.msg = ''; d.msgT = 0;
      d.done = false;
      d.rivals = RIVALS.map(function (r, i) {
        return { name: r.name, col: r.col, sp: r.sp, z: -140 - i * 90, lap: 0, th: 0, wob: Math.random() * TAU };
      });
      g.set('Lap', '1/' + LAPS);
      g.set('Pos', '4th');
      g.set('Time', '0.0');
      g.set('Speed', '0');
    }

    function prog(o) { return o.lap * TL + o.z; }
    function place(d) {
      var me = prog(d), p = 1;
      for (var i = 0; i < d.rivals.length; i++) if (prog(d.rivals[i]) > me) p++;
      return p;
    }
    function ord(n) { return n + (['st', 'nd', 'rd'][n - 1] || 'th'); }
    function scoreOf(d) {
      return Math.max(0, (5 - place(d)) * 110000 + Math.max(0, 400000 - Math.round(d.time * 1000)));
    }
    function say(d, t) { d.msg = t; d.msgT = 1.8; }

    function angGap(a, b) {
      var r = (a - b) % TAU;
      if (r > Math.PI) r -= TAU;
      if (r < -Math.PI) r += TAU;
      return r;
    }

    return Milo.arcade(host, {
      id: 'hover-pod',
      w: W, h: H, bg: '#05060f',
      stats: ['Lap', 'Pos', 'Time', 'Speed'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'BOOST' }],
      emo: '🛸',
      start: {
        title: 'Hover Pod',
        text: 'Three laps inside a tube that twists as you fly it, so the floor you are riding ' +
          'on keeps rolling around you and the pod slides with it. One energy bar is both your ' +
          'shield and your boost fuel — spend it for speed or keep it to survive the barriers.',
        keys: ['← → ride around the tube', '↑ thrust', 'Space boost']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, inp = g.input, i;

        if (d.phase === 'count') {
          d.count -= dt;
          if (Math.ceil(d.count) !== d.lastBeep) {
            d.lastBeep = Math.ceil(d.count);
            Milo.sound.tone({ f: d.count < 1 ? 900 : 440, d: .12, v: .1 });
          }
          if (d.count <= 0) d.phase = 'race';
          return;
        }
        if (d.phase === 'over') return;

        d.time += dt;
        if (d.msgT > 0) d.msgT -= dt;
        if (d.hitT > 0) d.hitT -= dt;

        /* ---- pod ---- */
        var thr = inp.down('up') || inp.pdown ? 1 : 0.62;   // it always creeps forward
        var brake = inp.down('down') ? 1 : 0;
        d.boosting = (inp.down('action') || inp.down('a')) && d.shield > 4;
        if (d.boosting) {
          d.shield = Math.max(0, d.shield - 24 * dt);
          if (g.frame % 3 === 0) Milo.sound.tone({ f: 200 + d.v * .1, d: .05, v: .04, type: 'sawtooth' });
        }
        var target = 1280 + (d.boosting ? 640 : 0);
        d.v += (target * thr - d.v) * 0.9 * dt;
        if (brake) d.v -= 900 * dt;
        d.v = U.clamp(d.v, 140, 2100);

        var steer = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
        if (inp.pdown) steer = inp.px < W * .4 ? -1 : inp.px > W * .6 ? 1 : 0;
        d.thv += steer * 7.6 * dt;
        // the tube's own floor drags the pod round with it
        var floor = twist(d.z) + Math.PI / 2;
        d.thv += angGap(floor, d.th) * 2.5 * dt * (0.45 + d.v / 1600);
        d.thv *= Math.pow(0.12, dt);
        d.th += d.thv * dt;

        var before = d.z;
        d.z += d.v * dt;

        /* ---- obstacles and pads ---- */
        for (i = 0; i < d.track.obs.length; i++) {
          var o = d.track.obs[i];
          if (o.z <= before || o.z > d.z) continue;
          var oa = o.a + twist(o.z);
          if (Math.abs(angGap(d.th, oa)) < o.w) hit(g, d);
        }
        for (i = 0; i < d.track.pads.length; i++) {
          var p = d.track.pads[i];
          if (p.z <= before || p.z > d.z) continue;
          var pa = p.a + twist(p.z);
          if (Math.abs(angGap(d.th, pa)) < p.w) {
            d.v = Math.min(2100, d.v + 340);
            d.shield = Math.min(100, d.shield + 20);
            say(d, 'Boost pad  +20 energy');
            Milo.sound.powerup();
            spark(d, '#22d3ee', 14);
          }
        }

        if (d.z >= TL) {
          d.z -= TL; d.lap++;
          if (d.lap >= LAPS) { finish(g, d); return; }
          say(d, 'Lap ' + (d.lap + 1) + ' of ' + LAPS);
          Milo.sound.blip();
        }

        /* ---- rivals ---- */
        for (i = 0; i < d.rivals.length; i++) {
          var r = d.rivals[i];
          r.wob += dt;
          var rub = (prog(d) - prog(r)) * 0.00012;         // they stay in the fight
          r.z += (r.sp + U.clamp(rub, -110, 190) + Math.sin(r.wob * .7) * 60) * dt;
          r.th = twist(r.z) + Math.PI / 2 + Math.sin(r.wob * 1.3 + i) * 0.9;
          if (r.z >= TL) { r.z -= TL; r.lap++; }
        }

        d.trail.push({ z: d.z, th: d.th, t: .5 });
        if (d.trail.length > 14) d.trail.shift();
        for (i = d.trail.length - 1; i >= 0; i--) { d.trail[i].t -= dt; if (d.trail[i].t <= 0) d.trail.splice(i, 1); }
        for (i = d.parts.length - 1; i >= 0; i--) {
          var pp = d.parts[i];
          pp.x += pp.vx * dt; pp.y += pp.vy * dt; pp.t -= dt;
          if (pp.t <= 0) d.parts.splice(i, 1);
        }

        g.score = scoreOf(d);
        g.set('Lap', Math.min(LAPS, d.lap + 1) + '/' + LAPS);
        g.set('Pos', ord(place(d)));
        g.set('Time', d.time.toFixed(1));
        g.set('Speed', Math.round(d.v * .34));
      },

      draw: function (g) { render(g, g.ctx, g.data); }
    });

    function hit(g, d) {
      if (d.hitT > 0.35) return;
      d.hitT = 0.85;
      d.v *= 0.42;
      d.shield -= 30;
      spark(d, '#fb7185', 22);
      Milo.sound.explode();
      if (d.shield <= 0) {
        d.shield = 0;
        d.phase = 'over';
        g.gameOver({
          emo: '💥', title: 'Pod destroyed',
          text: 'The shield ran out on lap ' + (d.lap + 1) + '. Energy is boost fuel and armour ' +
            'at the same time — spending it all is how this ends.',
          score: scoreOf(d)
        });
      } else {
        say(d, 'Barrier! −30 energy');
      }
    }

    function finish(g, d) {
      d.phase = 'over';
      d.done = true;
      var p = place(d);
      var txt = 'Three laps in ' + d.time.toFixed(2) + 's, finishing ' + ord(p) +
        ' with ' + Math.round(d.shield) + '% energy left.';
      if (p === 1) g.win({ emo: '🥇', title: 'Tube record', text: txt, score: scoreOf(d) });
      else g.gameOver({ emo: '🏁', title: ord(p) + ' place', text: txt, score: scoreOf(d) });
    }

    function spark(d, col, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * TAU, s = U.rand(60, 320);
        d.parts.push({ x: W / 2, y: H / 2, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: U.rand(.2, .6), max: .6, col: col });
      }
    }

    /* ------------------------------------------------------------ paint */

    function render(g, c, d) {
      var i, k;
      c.fillStyle = '#05060f'; c.fillRect(0, 0, W, H);

      var rings = [];
      for (k = NR; k >= 0; k--) {
        var z = d.z + k * RSTEP;
        var R = proj(d, z);
        R.z = z; R.tw = twist(z);
        rings.push(R);
      }

      // tube walls: fill the band between each pair of rings, far to near
      for (i = 0; i < rings.length - 1; i++) {
        var a = rings[i], b = rings[i + 1];
        var f = (i + 1) / rings.length;
        c.beginPath();
        c.arc(b.x, b.y, Math.max(1, b.r), 0, TAU);
        c.arc(a.x, a.y, Math.max(.5, a.r), 0, TAU, true);
        c.fillStyle = (i % 2 ? 'rgba(18,30,62,' : 'rgba(11,20,44,') + (0.55 + f * 0.45) + ')';
        c.fill();
        c.strokeStyle = 'rgba(' + Math.round(60 + f * 60) + ',' + Math.round(130 + f * 100) + ',' +
          Math.round(200 + f * 55) + ',' + (0.12 + f * 0.45) + ')';
        c.lineWidth = 1.5;
        c.beginPath(); c.arc(a.x, a.y, Math.max(1, a.r), 0, TAU); c.stroke();
        // twist spokes so the roll is visible
        if (i % 2 === 0) {
          c.strokeStyle = 'rgba(120,200,255,' + (0.08 + f * 0.3) + ')';
          for (k = 0; k < 6; k++) {
            var ang = a.tw + k * TAU / 6;
            c.beginPath();
            c.moveTo(a.x + Math.cos(ang) * a.r * .82, a.y + Math.sin(ang) * a.r * .82);
            c.lineTo(a.x + Math.cos(ang) * a.r, a.y + Math.sin(ang) * a.r);
            c.stroke();
          }
        }
        // the floor strip
        c.strokeStyle = 'rgba(124,92,255,' + (0.12 + f * 0.45) + ')';
        c.lineWidth = Math.max(1, a.r * .1);
        c.beginPath();
        c.arc(a.x, a.y, Math.max(1, a.r * .96), a.tw + Math.PI / 2 - .34, a.tw + Math.PI / 2 + .34);
        c.stroke();
      }

      // pads then obstacles, far to near
      drawItems(c, d, d.track.pads, '#22d3ee', true);
      drawItems(c, d, d.track.obs, '#fb7185', false);

      // rivals
      for (i = 0; i < d.rivals.length; i++) {
        var r = d.rivals[i];
        var rel = r.z - d.z;
        if (rel < 0) rel += TL;
        if (rel > NR * RSTEP || rel < 40) continue;
        var R2 = proj(d, d.z + rel);
        var px = R2.x + Math.cos(r.th) * R2.r * .8;
        var py = R2.y + Math.sin(r.th) * R2.r * .8;
        var s = Math.max(3, R2.r * .12);
        c.fillStyle = r.col;
        c.beginPath();
        c.moveTo(px, py - s); c.lineTo(px + s, py + s * .8); c.lineTo(px - s, py + s * .8);
        c.closePath(); c.fill();
        if (s > 8) {
          c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '11px system-ui,sans-serif';
          c.textAlign = 'center'; c.fillText(r.name, px, py - s - 6); c.textAlign = 'left';
        }
      }

      // trail + pod
      var near = proj(d, d.z);
      for (i = 0; i < d.trail.length; i++) {
        var t = d.trail[i];
        var tr = proj(d, t.z);
        c.globalAlpha = (i / d.trail.length) * .35;
        c.fillStyle = d.boosting ? '#ffd257' : '#22d3ee';
        c.beginPath();
        c.arc(tr.x + Math.cos(t.th) * tr.r * .8, tr.y + Math.sin(t.th) * tr.r * .8, 5, 0, TAU);
        c.fill();
      }
      c.globalAlpha = 1;

      var podx = near.x + Math.cos(d.th) * near.r * .8;
      var pody = near.y + Math.sin(d.th) * near.r * .8;
      c.save();
      c.translate(podx, pody);
      c.rotate(d.th + Math.PI / 2);
      if (d.hitT > 0 && (g.frame % 6 < 3)) c.globalAlpha = .4;
      c.shadowColor = d.boosting ? '#ffd257' : '#22d3ee';
      c.shadowBlur = d.boosting ? 26 : 14;
      c.fillStyle = '#e2e8f0';
      c.beginPath();
      c.moveTo(0, -20); c.lineTo(15, 14); c.lineTo(0, 8); c.lineTo(-15, 14);
      c.closePath(); c.fill();
      c.shadowBlur = 0;
      c.fillStyle = d.boosting ? '#ffd257' : '#22d3ee';
      c.beginPath(); c.moveTo(-7, 10); c.lineTo(7, 10); c.lineTo(0, 22 + (d.boosting ? 16 : 0));
      c.closePath(); c.fill();
      c.globalAlpha = 1;
      c.restore();

      for (i = 0; i < d.parts.length; i++) {
        var pp = d.parts[i];
        c.globalAlpha = Math.max(0, pp.t / pp.max);
        c.fillStyle = pp.col;
        c.fillRect(pp.x - 2, pp.y - 2, 4, 4);
      }
      c.globalAlpha = 1;

      drawHud(g, c, d);
    }

    function drawItems(c, d, list, col, isPad) {
      for (var i = 0; i < list.length; i++) {
        var o = list[i];
        var rel = o.z - d.z;
        if (rel < 0) rel += TL;
        if (rel > NR * RSTEP || rel < -70) continue;
        var R = proj(d, d.z + rel);
        if (R.r < 2) continue;
        var a0 = o.a + twist(o.z);
        var f = 1 - rel / (NR * RSTEP);
        c.globalAlpha = 0.25 + f * 0.75;
        c.strokeStyle = col;
        c.lineWidth = Math.max(2, R.r * (isPad ? .11 : .2));
        c.beginPath();
        c.arc(R.x, R.y, Math.max(1, R.r * (isPad ? .93 : .88)), a0 - o.w, a0 + o.w);
        c.stroke();
        c.globalAlpha = 1;
      }
    }

    function drawHud(g, c, d) {
      // energy
      c.fillStyle = 'rgba(8,10,20,.75)';
      U.roundRect(c, 18, H - 62, 250, 44, 10); c.fill();
      c.fillStyle = '#9fb0d8'; c.font = '11px system-ui,sans-serif';
      c.fillText('SHIELD / BOOST ENERGY', 30, H - 44);
      c.fillStyle = 'rgba(255,255,255,.14)';
      U.roundRect(c, 30, H - 38, 226, 14, 7); c.fill();
      var s = U.clamp(d.shield / 100, 0, 1);
      c.fillStyle = s > .5 ? '#22d3ee' : s > .2 ? '#ffd257' : '#fb7185';
      U.roundRect(c, 30, H - 38, 226 * s, 14, 7); c.fill();
      if (d.boosting) {
        c.fillStyle = '#ffd257'; c.font = 'bold 13px system-ui,sans-serif';
        c.fillText('BOOST', 210, H - 48);
      }

      // lap progress
      c.fillStyle = 'rgba(8,10,20,.7)';
      U.roundRect(c, W - 214, H - 52, 196, 34, 10); c.fill();
      c.fillStyle = '#9fb0d8'; c.font = '11px system-ui,sans-serif';
      c.fillText('LAP ' + Math.min(LAPS, d.lap + 1), W - 202, H - 36);
      c.fillStyle = 'rgba(255,255,255,.14)';
      U.roundRect(c, W - 148, H - 42, 118, 10, 5); c.fill();
      c.fillStyle = '#7c5cff';
      U.roundRect(c, W - 148, H - 42, 118 * U.clamp(d.z / TL, 0, 1), 10, 5); c.fill();

      if (d.msgT > 0) {
        c.textAlign = 'center';
        c.globalAlpha = Math.min(1, d.msgT);
        c.fillStyle = '#ffd257'; c.font = 'bold 18px system-ui,sans-serif';
        c.fillText(d.msg, W / 2, 120);
        c.globalAlpha = 1;
        c.textAlign = 'left';
      }
      if (d.phase === 'count') {
        c.textAlign = 'center';
        c.fillStyle = '#fff'; c.font = 'bold 72px system-ui,sans-serif';
        c.fillText(d.count > 1 ? String(Math.ceil(d.count - .2)) : 'GO!', W / 2, H / 2 + 20);
        c.fillStyle = '#9fd8ff'; c.font = '16px system-ui,sans-serif';
        c.fillText('The floor moves. Ride with it.', W / 2, H / 2 + 56);
        c.textAlign = 'left';
      }
      if (d.hitT > 0) {
        c.fillStyle = 'rgba(255,70,90,' + (d.hitT * .25) + ')';
        c.fillRect(0, 0, W, H);
      }
    }
  }

  window.Milo.register({
    id: 'hover-pod', title: 'Hover Pod', emo: '🛸', category: 'Racing',
    tagline: 'Down keeps moving in this tube',
    description: 'An anti-gravity sprint through the inside of a tube that rolls as it runs, so ' +
      'the floor your pod is clinging to keeps rotating around you — let go of the controls and ' +
      'the twist drags you up the wall and into a barrier. One bar covers both shield and boost: ' +
      'burn it for a huge turn of speed, or hoard it because every barrier you clip costs 30 of ' +
      'it and a flat bar ends the race. Cyan pads refill it and kick you forward. Three laps, ' +
      'three rivals. Tip: the twist is faster the faster you go, so a boost you cannot steer ' +
      'through is a boost into the wall.',
    controls: ['← → ride round', '↑ thrust', 'Space boost'],
    colors: ['#7c5cff', '#22d3ee'],
    tags: ['futuristic', 'tube', 'boost', 'laps', 'antigravity'],
    scoreLabel: 'pts',
    mount: mount
  });
})();
