/* Tunnel Rush — dive down a twisting neon tunnel; every gate has one gap. */
(function () {
  'use strict';
  var W = 560, H = 700, CX = W / 2, CY = H / 2 - 6;
  var K = 238; // projection: screen radius = K / depth
  var HUES = [268, 312, 196];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.a = Math.PI / 2;          // player angle on the ring
      d.rot = 0;                  // tunnel twist
      d.rotV = .4;
      d.rotTimer = 3;
      d.speed = 1.55;
      d.gates = 0;
      d.perfects = 0;
      d.i = 0;
      d.rings = [];
      var z = 2.1;
      for (var k = 0; k < 15; k++) { pushRing(g.data, z); z += .62; }
      d.parts = [];
      d.texts = [];
      d.streaks = [];
      d.trail = [];
      d.flash = 0;
      d.shake = 0;
      d.dead = false;
      g.set('Gates', 0);
      g.set('Best', U.fmt(g.best));
    }

    function pushRing(d, z) {
      d.rings.push({
        z: z,
        gap: Math.random() * Math.PI * 2,
        gw: Math.max(.84, 1.95 - d.gates * .02),
        i: d.i++
      });
    }

    function angDiff(a, b) {
      var t = (a - b) % (Math.PI * 2);
      if (t > Math.PI) t -= Math.PI * 2;
      if (t < -Math.PI) t += Math.PI * 2;
      return t;
    }

    function pulse(d, perfect) {
      d.parts.push({ kind: 'pulse', r: K, v: 430, life: .3, max: .3, col: perfect ? '#ffd257' : '#c084fc' });
      if (perfect) {
        d.texts.push({
          x: CX + Math.cos(d.a) * (K - 70),
          y: CY + Math.sin(d.a) * (K - 70),
          t: 'PERFECT', life: .7, max: .7
        });
      }
    }

    function crash(g) {
      var d = g.data;
      d.dead = true;
      d.shake = 15;
      var R = K - 18;
      var px = CX + Math.cos(d.a) * R, py = CY + Math.sin(d.a) * R;
      for (var k = 0; k < 26; k++) {
        var an = Math.random() * 6.283, s = U.rand(60, 320);
        d.parts.push({
          x: px, y: py, vx: Math.cos(an) * s, vy: Math.sin(an) * s,
          life: U.rand(.4, .8), max: .8,
          col: Math.random() < .5 ? '#ffe66d' : '#f472b6'
        });
      }
      Milo.sound.explode();
      g.gameOver({
        text: 'You threaded ' + d.gates + ' gates' +
          (d.perfects ? ' — ' + d.perfects + ' of them dead centre.' : '.')
      });
    }

    function cool(d, dt) {
      d.flash = Math.max(0, d.flash - dt * 2.2);
      d.shake = Math.max(0, d.shake - dt * 46);
      var k;
      for (k = d.parts.length - 1; k >= 0; k--) {
        var p = d.parts[k];
        if (p.kind === 'pulse') { p.r += p.v * dt; p.life -= dt; }
        else { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
        if (p.life <= 0) d.parts.splice(k, 1);
      }
      for (k = d.texts.length - 1; k >= 0; k--) {
        d.texts[k].y -= 32 * dt; d.texts[k].life -= dt;
        if (d.texts[k].life <= 0) d.texts.splice(k, 1);
      }
      for (k = d.trail.length - 1; k >= 0; k--) {
        d.trail[k].life -= dt;
        if (d.trail[k].life <= 0) d.trail.splice(k, 1);
      }
    }

    return Milo.arcade(host, {
      id: 'tunnel-rush',
      w: W, h: H, bg: '#0b0518',
      stats: ['Gates', 'Best'],
      emo: '🌀',
      start: {
        title: 'Tunnel Rush',
        text: 'Gates rush at you down the tunnel and each one is solid except for a ' +
          'single gap. Steer around the ring to line up — the tunnel itself keeps ' +
          'twisting underneath you, and it only gets faster.',
        keys: ['← →  or  A D', 'Hold left / right side of the screen']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, i = g.input;
        if (d.dead) { cool(d, dt); return; }

        var steer = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
        if (!steer && i.pdown) steer = i.px < CX ? -1 : 1;
        d.a += steer * 3.9 * dt;

        d.rotTimer -= dt;
        if (d.rotTimer <= 0) {
          d.rotTimer = U.rand(1.6, 3.4);
          var m = .32 + Math.min(1.35, d.gates * .015);
          d.rotV = (Math.random() < .5 ? -1 : 1) * U.rand(m * .5, m);
        }
        d.rot += d.rotV * dt;

        d.trail.push({ a: d.a, life: .26, max: .26 });

        var sp = d.speed, k;
        for (k = d.rings.length - 1; k >= 0; k--) {
          var r = d.rings[k];
          var pz = r.z;
          r.z -= sp * dt;
          if (pz >= 1 && r.z < 1) {
            var diff = angDiff(d.a, r.gap + d.rot);
            if (Math.abs(diff) < r.gw / 2 - .1) {
              d.gates++;
              var perfect = Math.abs(diff) < r.gw * .17;
              if (perfect) d.perfects++;
              g.score = d.gates + d.perfects * 2;
              g.set('Gates', d.gates);
              d.speed = Math.min(4.6, d.speed + .05);
              d.flash = perfect ? .34 : .15;
              pulse(d, perfect);
              Milo.sound.tone({ f: 480 + Math.min(560, d.gates * 8), f2: 900, d: .07, v: .07, type: 'square' });
              if (perfect) Milo.sound.coin();
            } else {
              crash(g);
              return;
            }
          }
          if (r.z < .16) d.rings.splice(k, 1);
        }
        var lastZ = d.rings.length ? d.rings[d.rings.length - 1].z : 2;
        while (lastZ < 10.4) { lastZ += .62; pushRing(d, lastZ); }

        if (Math.random() < .85) d.streaks.push({ ang: Math.random() * 6.283, z: U.rand(5, 9) });
        for (k = d.streaks.length - 1; k >= 0; k--) {
          d.streaks[k].z -= sp * dt * 1.5;
          if (d.streaks[k].z < .22) d.streaks.splice(k, 1);
        }
        cool(d, dt);
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, k;
        var bg = c.createRadialGradient(CX, CY, 30, CX, CY, 420);
        bg.addColorStop(0, '#1c0f38');
        bg.addColorStop(1, '#0b0518');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.save();
        if (d.shake > 0) c.translate(U.rand(-d.shake, d.shake), U.rand(-d.shake, d.shake));

        // speed streaks radiating from the vanishing point
        c.strokeStyle = 'rgba(190,160,255,.22)';
        c.lineWidth = 1.5;
        for (k = 0; k < d.streaks.length; k++) {
          var st = d.streaks[k];
          var r0 = K / (st.z + .55), r1 = K / st.z;
          c.beginPath();
          c.moveTo(CX + Math.cos(st.ang) * r0, CY + Math.sin(st.ang) * r0);
          c.lineTo(CX + Math.cos(st.ang) * r1, CY + Math.sin(st.ang) * r1);
          c.stroke();
        }

        // rings, far to near (array is sorted near -> far)
        for (k = d.rings.length - 1; k >= 0; k--) {
          var rg = d.rings[k];
          var r = K / rg.z;
          if (r > 880) continue;
          var alpha = U.clamp(1.45 - rg.z * .14, 0, 1);
          var lw = U.clamp(26 / rg.z, 3, 86);
          var hue = HUES[rg.i % 3];
          var a0 = rg.gap + d.rot;
          c.strokeStyle = 'hsla(' + hue + ',90%,' + (58 + d.flash * 40) + '%,' + alpha + ')';
          c.lineWidth = lw;
          c.beginPath();
          c.arc(CX, CY, r, a0 + rg.gw / 2, a0 - rg.gw / 2 + Math.PI * 2);
          c.stroke();
          // brighter inner filament
          c.strokeStyle = 'rgba(255,255,255,' + (alpha * .22) + ')';
          c.lineWidth = Math.max(1.5, lw * .22);
          c.beginPath();
          c.arc(CX, CY, r, a0 + rg.gw / 2, a0 - rg.gw / 2 + Math.PI * 2);
          c.stroke();
          // gap edge beacons
          c.fillStyle = 'hsla(' + hue + ',100%,82%,' + alpha + ')';
          var e1 = a0 + rg.gw / 2, e2 = a0 - rg.gw / 2;
          c.beginPath(); c.arc(CX + Math.cos(e1) * r, CY + Math.sin(e1) * r, Math.max(2.5, lw * .4), 0, 7); c.fill();
          c.beginPath(); c.arc(CX + Math.cos(e2) * r, CY + Math.sin(e2) * r, Math.max(2.5, lw * .4), 0, 7); c.fill();
        }

        // vanishing-point glow
        var vg = c.createRadialGradient(CX, CY, 0, CX, CY, 90);
        vg.addColorStop(0, 'rgba(236,140,255,' + (.4 + d.flash) + ')');
        vg.addColorStop(1, 'rgba(236,140,255,0)');
        c.fillStyle = vg;
        c.beginPath(); c.arc(CX, CY, 90, 0, 7); c.fill();

        // player trail
        for (k = 0; k < d.trail.length; k++) {
          var tr = d.trail[k];
          c.globalAlpha = (tr.life / tr.max) * .4;
          c.fillStyle = '#ffe66d';
          c.beginPath();
          c.arc(CX + Math.cos(tr.a) * (K - 18), CY + Math.sin(tr.a) * (K - 18), 5, 0, 7);
          c.fill();
        }
        c.globalAlpha = 1;

        // ship
        if (!d.dead) {
          c.save();
          c.translate(CX, CY);
          c.rotate(d.a);
          c.shadowColor = '#ffe66d'; c.shadowBlur = 16;
          c.fillStyle = '#ffe66d';
          c.beginPath();
          c.moveTo(K - 42, 0);
          c.lineTo(K - 8, -10);
          c.lineTo(K - 14, 0);
          c.lineTo(K - 8, 10);
          c.closePath(); c.fill();
          c.shadowBlur = 0;
          c.restore();
        }

        // particles
        for (k = 0; k < d.parts.length; k++) {
          var p = d.parts[k];
          c.globalAlpha = Math.max(0, p.life / p.max);
          if (p.kind === 'pulse') {
            c.strokeStyle = p.col; c.lineWidth = 4;
            c.beginPath(); c.arc(CX, CY, p.r, 0, 7); c.stroke();
          } else {
            c.fillStyle = p.col;
            c.fillRect(p.x - 3, p.y - 3, 6, 6);
          }
        }
        c.globalAlpha = 1;

        // floating texts
        c.font = '800 17px Outfit, sans-serif';
        c.textAlign = 'center';
        for (k = 0; k < d.texts.length; k++) {
          var tx = d.texts[k];
          c.globalAlpha = Math.max(0, tx.life / tx.max);
          c.fillStyle = '#ffd257';
          c.fillText(tx.t, tx.x, tx.y);
        }
        c.globalAlpha = 1;
        c.restore();

        // vignette
        var vig = c.createRadialGradient(CX, CY, 240, CX, CY, 460);
        vig.addColorStop(0, 'rgba(5,2,12,0)');
        vig.addColorStop(1, 'rgba(5,2,12,.75)');
        c.fillStyle = vig; c.fillRect(0, 0, W, H);
      }
    });
  }

  window.Milo.register({
    id: 'tunnel-rush', title: 'Tunnel Rush', emo: '🌀', category: 'Arcade',
    tagline: 'Find the gap in every gate — at speed',
    description: 'You are falling down a neon tunnel and every gate ahead is a solid ' +
      'ring with one gap in it. Steer around the tunnel wall to line up before the gate ' +
      'reaches you; hitting the ring dead centre scores a Perfect worth triple. The ' +
      'tunnel twists faster and the gaps shrink the deeper you go — watch the bright ' +
      'beacons that mark each gap’s edges rather than the gap itself.',
    controls: ['← →', 'A D', 'Hold left/right'],
    colors: ['#7c3aed', '#ec4899'],
    tags: ['endless', 'dodge', 'tunnel', 'reflex', 'speed'],
    mount: mount
  });
})();
