/* Rally Stage — blind point-to-point, a co-driver reading the road ahead. */
(function () {
  'use strict';
  var W = 900, H = 560;
  var SEG = 200, ROADW = 2000, DRAW = 105, CAMH = 1150, CAMD = 0.86;
  var LEN_MUL = 7, SEGM = 0.9;      // segments per section step, metres per segment
  var TAU = Math.PI * 2;

  // grip, roll resistance, colours
  var SURF = {
    tarmac: { grip: 1.00, drag: 1.00, dark: '#22262f', light: '#272c36', rum: '#c8ccd8', lane: 'rgba(255,255,255,.55)', dust: '#8f97ad', name: 'Tarmac' },
    gravel: { grip: 0.70, drag: 0.95, dark: '#6b563a', light: '#7a6342', rum: '#d9c9a6', lane: null, dust: '#cbb68c', name: 'Gravel' },
    mud: { grip: 0.48, drag: 0.86, dark: '#3f3226', light: '#4a3b2c', rum: '#8a7355', lane: null, dust: '#6b563d', name: 'Mud' }
  };

  // Sections: [dir(-1 L, 0 straight, 1 R), severity 1-6, length, qualifier, surface]
  // Severity follows rally pacenotes: 1 is a hairpin, 6 is flat out.
  var STAGES = [
    {
      name: 'Pine Ridge', surf: 'gravel', hill: 0.6,
      secs: [[0, 0, 26], [1, 5, 16], [0, 0, 12], [-1, 4, 18, 'tightens'], [0, 0, 16],
      [1, 3, 16], [0, 0, 10], [-1, 5, 14, 'over crest'], [0, 0, 20], [1, 2, 14, 'hairpin'],
      [0, 0, 18], [-1, 6, 18, 'long'], [0, 0, 14], [1, 4, 16], [0, 0, 26]]
    },
    {
      name: 'Slate Quarry', surf: 'tarmac', hill: 0.4,
      secs: [[0, 0, 22], [-1, 5, 16], [1, 4, 14], [0, 0, 12], [-1, 3, 16, 'tightens'],
      [0, 0, 14], [1, 5, 18, 'opens'], [0, 0, 10], [-1, 2, 12, 'hairpin'], [0, 0, 16],
      [1, 3, 16, 'don\'t cut'], [0, 0, 12], [-1, 4, 16], [1, 6, 18, 'long'], [0, 0, 14],
      [-1, 4, 14, 'caution'], [0, 0, 24]]
    },
    {
      name: 'Bog Crossing', surf: 'mud', hill: 0.8,
      secs: [[0, 0, 22], [1, 4, 18], [0, 0, 10], [-1, 3, 18, 'tightens'], [0, 0, 12],
      [1, 5, 14, 'over crest'], [-1, 5, 14], [0, 0, 16], [1, 2, 14, 'hairpin'], [0, 0, 12],
      [-1, 4, 20, 'long'], [0, 0, 10, '', 'gravel'], [1, 3, 16, 'caution', 'gravel'],
      [0, 0, 14, '', 'gravel'], [-1, 5, 16, '', 'gravel'], [0, 0, 22, '', 'gravel']]
    },
    {
      name: 'Col du Vent', surf: 'tarmac', hill: 1.2,
      secs: [[0, 0, 20], [1, 3, 16, 'tightens'], [0, 0, 8], [-1, 2, 12, 'hairpin'],
      [0, 0, 14], [1, 5, 16, 'over crest'], [0, 0, 10], [-1, 4, 16], [1, 4, 14],
      [0, 0, 12], [-1, 3, 14, 'don\'t cut'], [0, 0, 16], [1, 6, 20, 'long'],
      [0, 0, 10], [-1, 5, 14], [1, 2, 12, 'hairpin'], [0, 0, 14], [-1, 4, 16, 'opens'],
      [0, 0, 20]]
    },
    {
      name: 'Dust Bowl', surf: 'gravel', hill: 0.5,
      secs: [[0, 0, 20], [-1, 5, 18], [1, 5, 18], [0, 0, 10], [-1, 3, 16, 'tightens'],
      [0, 0, 12], [1, 4, 16], [0, 0, 8], [-1, 2, 12, 'hairpin'], [0, 0, 14],
      [1, 3, 18, 'caution'], [0, 0, 10, '', 'mud'], [-1, 4, 18, 'slippy', 'mud'],
      [0, 0, 12, '', 'mud'], [1, 5, 16, '', 'mud'], [0, 0, 12], [-1, 6, 18, 'long'],
      [1, 3, 14, 'tightens'], [0, 0, 22]]
    },
    {
      name: 'Night Pass', surf: 'tarmac', hill: 1.0,
      secs: [[0, 0, 18], [1, 4, 16], [0, 0, 8], [-1, 3, 14, 'tightens'], [1, 2, 12, 'hairpin'],
      [0, 0, 12], [-1, 5, 16, 'over crest'], [0, 0, 8, '', 'gravel'], [1, 3, 16, 'caution', 'gravel'],
      [-1, 4, 16, '', 'gravel'], [0, 0, 10, '', 'gravel'], [1, 5, 14], [0, 0, 12],
      [-1, 2, 12, 'hairpin'], [0, 0, 14], [1, 4, 18, 'don\'t cut'], [0, 0, 10],
      [-1, 6, 20, 'long'], [1, 3, 14, 'tightens'], [0, 0, 12], [-1, 5, 16], [0, 0, 22]]
    }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    /* ------------------------------------------------------------ track */

    function buildStage(def) {
      var segs = [], notes = [], y = 0, i;
      function push(curve, dy, surf) {
        var n = segs.length;
        segs.push({
          i: n, curve: curve, surf: surf,
          y1: y, y2: y + dy,
          p1: { wx: 0, wy: 0, wz: n * SEG, sx: 0, sy: 0, sw: 0, cz: 1 },
          p2: { wx: 0, wy: 0, wz: (n + 1) * SEG, sx: 0, sy: 0, sw: 0, cz: 1 },
          spr: null
        });
        y += dy;
      }
      for (var s = 0; s < def.secs.length; s++) {
        var sec = def.secs[s];
        var dir = sec[0], sev = sec[1], len = sec[2] * LEN_MUL, qual = sec[3] || '', surf = sec[4] || def.surf;
        var curve = dir === 0 ? 0 : dir * (7 - sev) * 0.95;
        if (dir !== 0) {
          notes.push({
            seg: segs.length, dir: dir, sev: sev, qual: qual,
            said: false, text: (dir < 0 ? 'Left ' : 'Right ') + sev + (qual ? ' ' + qual : '')
          });
        }
        var hill = (U.hash2(s, 7, 3) - 0.5) * 240 * def.hill;
        for (i = 0; i < len; i++) {
          var t = i / len;
          var ease = dir === 0 ? 0 : Math.sin(Math.min(1, t * 1.15) * Math.PI) * 1.25;
          var dy = Math.sin(t * Math.PI) * hill / len;
          push(curve * ease, dy, surf);
          // Scenery flanking the road.
          var sg = segs[segs.length - 1];
          if ((sg.i % 5) === 0) {
            var side = U.hash2(sg.i, 3, 11) > 0.5 ? 1 : -1;
            sg.spr = { off: side * (1.45 + U.hash2(sg.i, 9, 5) * 1.6), kind: U.hash2(sg.i, 5, 2) };
          }
        }
      }
      // pad the finish
      for (i = 0; i < 30; i++) push(0, 0, def.surf);
      // distance from each note to the next
      for (i = 0; i < notes.length; i++) {
        var nxt = i + 1 < notes.length ? notes[i + 1].seg : segs.length;
        notes[i].gap = Math.max(20, Math.round((nxt - notes[i].seg) * SEGM / 10) * 10);
      }
      return { name: def.name, segs: segs, notes: notes, len: segs.length * SEG, surf: def.surf };
    }

    function segAt(d, z) {
      var i = Math.floor(z / SEG);
      return d.track.segs[U.clamp(i, 0, d.track.segs.length - 1)];
    }

    /* ----------------------------------------------------------- state */

    function startStage(g, n) {
      var d = g.data;
      d.stage = n;
      d.track = buildStage(STAGES[n]);
      d.z = 0;
      d.px = 0;
      d.speed = 0;
      d.stageT = 0;
      d.penalty = 0;
      d.spin = 0;
      d.shake = 0;
      d.notes = [];
      d.dust = [];
      d.steerVis = 0;
      d.beeped1 = false;
      d.phase = 'go';
      d.phaseT = 2.2;
      d.flash = 0;
      g.set('Stage', (n + 1) + '/6');
      g.set('Time', '0:00.0');
      g.set('Speed', '0');
      g.set('Damage', Math.round(d.damage) + '%');
    }

    function reset(g) {
      var d = g.data;
      d.damage = 0;
      d.total = 0;
      d.splits = [];
      d.done = 0;
      startStage(g, 0);
    }

    function fmtT(ms) {
      var s = ms / 1000;
      var m = Math.floor(s / 60);
      var r = s - m * 60;
      return m + ':' + (r < 10 ? '0' : '') + r.toFixed(1);
    }

    function score(d) {
      return Math.max(0, Math.round(d.done * 500000 - d.total));
    }

    function crash(g, why) {
      var d = g.data;
      if (d.spin > 0) return;
      d.spin = 1.5;
      d.penalty += 3000;
      d.damage += why === 'tree' ? 26 : 13;
      d.speed *= 0.18;
      d.shake = 1;
      Milo.sound.explode();
      for (var i = 0; i < 22; i++) {
        d.dust.push({ x: U.rand(-1, 1), y: U.rand(0, 1), t: U.rand(.4, 1), max: 1, big: true });
      }
      g.set('Damage', Math.round(Math.min(100, d.damage)) + '%');
      if (d.damage >= 100) {
        d.phase = 'retire';
        d.phaseT = 2.4;
      }
    }

    /* ------------------------------------------------------------- draw */

    function project(p, camX, camY, camZ) {
      p.cz = p.wz - camZ;
      if (p.cz < 80) p.cz = 80;
      var sc = CAMD / p.cz;
      p.scale = sc;
      p.sx = W / 2 + sc * (p.wx - camX) * W / 2;
      p.sy = H / 2 - sc * (p.wy - camY) * H / 2;
      p.sw = sc * ROADW * W / 2;
    }

    function poly(c, x1, y1, w1, x2, y2, w2, col) {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(x1 - w1, y1); c.lineTo(x2 - w2, y2);
      c.lineTo(x2 + w2, y2); c.lineTo(x1 + w1, y1);
      c.closePath(); c.fill();
    }

    return Milo.arcade(host, {
      id: 'rally-stage',
      w: W, h: H, bg: '#0b1020',
      stats: ['Stage', 'Time', 'Speed', 'Damage'],
      touch: 'dpad',
      emo: '🚙',
      start: {
        title: 'Rally Stage',
        text: 'Six stages, one car, and a co-driver who sees the road before you do. ' +
          '"Left 4 tightens, 200" means a medium left that closes up, then 200 metres to the ' +
          'next call — 1 is a hairpin, 6 is flat out. Gravel, tarmac and mud all grip differently.',
        keys: ['↑ throttle', '↓ brake', '← → steer']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, inp = g.input, i;
        var sf = SURF[segAt(d, d.z).surf];

        if (d.phase === 'go') {
          d.phaseT -= dt;
          if (d.phaseT <= 1.2 && !d.beeped1) { d.beeped1 = true; Milo.sound.tone({ f: 500, d: .12, v: .1 }); }
          if (d.phaseT <= 0) { d.phase = 'run'; d.beeped1 = false; Milo.sound.tone({ f: 900, d: .22, v: .12 }); }
          return;
        }
        if (d.phase === 'split' || d.phase === 'retire') {
          d.phaseT -= dt;
          if (d.phaseT <= 0) {
            if (d.phase === 'retire') {
              g.gameOver({
                emo: '🔧', title: 'Retired',
                text: 'The car gave up on stage ' + (d.stage + 1) + '. ' + d.done +
                  ' stage' + (d.done === 1 ? '' : 's') + ' in the book, ' + fmtT(d.total) + ' total.',
                score: score(d)
              });
            } else if (d.stage + 1 < STAGES.length) {
              startStage(g, d.stage + 1);
            } else {
              g.win({
                emo: '🏆', title: 'Stage rally complete',
                text: 'Six stages in ' + fmtT(d.total) + '. Damage ' + Math.round(d.damage) + '%.',
                score: score(d)
              });
            }
          }
          return;
        }

        /* ---- driving ---- */
        d.stageT += dt * 1000;
        var seg = segAt(d, d.z);
        var maxSpeed = 11800;
        var off = Math.abs(d.px) > 1;
        var thr = inp.down('up') || inp.down('action');
        var brk = inp.down('down');
        if (inp.pdown) { if (inp.py > H * 0.62) brk = true; else thr = true; }

        if (d.spin > 0) {
          d.spin -= dt;
          d.speed *= Math.pow(0.35, dt);
          thr = false; brk = false;
        }

        if (thr) d.speed += (maxSpeed - d.speed) * 0.62 * dt * sf.drag;
        else if (brk) d.speed -= 6200 * dt;
        else d.speed -= 1100 * dt;
        if (off) {
          d.speed = Math.min(d.speed, 4200);
          d.speed -= 2200 * dt;
        }
        d.speed = U.clamp(d.speed, 0, maxSpeed);

        var sp = d.speed / maxSpeed;
        // Steering authority scales with grip; centrifugal force does not.
        if (d.spin <= 0) {
          var steer = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
          if (!steer && inp.pdown) steer = inp.px < W * 0.38 ? -1 : inp.px > W * 0.62 ? 1 : 0;
          d.px += steer * dt * 2.0 * sp * (0.55 + sf.grip * 0.55);
          d.px -= sp * seg.curve * dt * 0.42 / Math.max(0.35, sf.grip);
          d.steerVis = U.lerp(d.steerVis || 0, steer, Math.min(1, dt * 9));
        } else {
          d.px += Math.sin(d.spin * 12) * dt * 1.4;
          d.steerVis = Math.sin(d.spin * 12);
        }
        d.px = U.clamp(d.px, -2.6, 2.6);

        d.z += d.speed * dt;

        // scenery collision
        if (Math.abs(d.px) > 1.28) {
          var s2 = segAt(d, d.z);
          if (s2.spr && Math.abs(s2.spr.off - d.px) < 0.34 && d.speed > 2200) crash(g, 'tree');
        }
        if (Math.abs(d.px) > 2.45 && d.speed > 2600) crash(g, 'ditch');

        // dust / gravel spray
        if (d.speed > 900 && (off || sf.grip < 0.8) && g.frame % 2 === 0) {
          d.dust.push({ x: d.px, y: 0, t: .55, max: .55, big: false });
        }
        for (i = d.dust.length - 1; i >= 0; i--) {
          d.dust[i].t -= dt;
          if (d.dust[i].t <= 0) d.dust.splice(i, 1);
        }
        if (d.shake > 0) d.shake = Math.max(0, d.shake - dt * 2);

        // co-driver: call the corner a beat before it arrives
        var lookahead = d.z + Math.max(1400, d.speed * 2.3);
        for (i = 0; i < d.track.notes.length; i++) {
          var nt = d.track.notes[i];
          if (!nt.said && nt.seg * SEG <= lookahead) {
            nt.said = true;
            d.notes.unshift({ text: nt.text + ', ' + nt.gap, t: 4.5, dir: nt.dir, sev: nt.sev });
            if (d.notes.length > 3) d.notes.pop();
            Milo.sound.tone({ f: nt.dir < 0 ? 420 : 560, f2: nt.dir < 0 ? 360 : 620, d: .09, v: .07, type: 'triangle' });
          }
        }
        for (i = 0; i < d.notes.length; i++) d.notes[i].t -= dt;

        g.set('Time', fmtT(d.stageT + d.penalty));
        g.set('Speed', Math.round(d.speed * 0.0161));
        g.score = score(d) + Math.max(0, Math.round(500000 - d.stageT - d.penalty));
        if (d.flash > 0) d.flash -= dt;

        // finish line
        if (d.z >= d.track.len - 30 * SEG) {
          var ms = d.stageT + d.penalty;
          d.total += ms;
          d.done++;
          d.splits.push({ name: d.track.name, ms: ms });
          d.phase = 'split';
          d.phaseT = 3.0;
          Milo.sound.win();
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, i;
        var segs = d.track.segs;
        var base = segAt(d, d.z);
        var pct = (d.z % SEG) / SEG;
        var playerY = U.lerp(base.y1, base.y2, pct);
        var camX = d.px * ROADW;
        var camY = playerY + CAMH;
        var shk = d.shake > 0 ? (Math.random() - .5) * d.shake * 10 : 0;

        // sky
        var night = d.stage === 5;
        var sky = c.createLinearGradient(0, 0, 0, H * .62);
        if (night) { sky.addColorStop(0, '#0a0f24'); sky.addColorStop(1, '#2a2350'); }
        else { sky.addColorStop(0, '#2b4a7a'); sky.addColorStop(1, '#c9946a'); }
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        // distant ridge
        c.fillStyle = night ? '#141a36' : '#34405e';
        c.beginPath(); c.moveTo(0, H * .52);
        for (var rx = 0; rx <= W; rx += 30) {
          c.lineTo(rx, H * .52 - 30 - U.noise2(rx * .008 + d.stage * 3 - camX * .00002, 4, 9) * 70);
        }
        c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();

        var x = 0, dx = -(base.curve * pct);
        var maxy = H;
        var drawn = [];
        c.save();
        c.translate(shk, 0);
        for (i = 0; i < DRAW; i++) {
          var s = segs[base.i + i];
          if (!s) break;
          s.p1.wy = s.y1; s.p2.wy = s.y2;
          project(s.p1, camX - x, camY, d.z);
          project(s.p2, camX - (x + dx), camY, d.z);
          x += dx; dx += s.curve;
          if (s.p1.cz <= 90 || s.p2.sy >= maxy) continue;
          maxy = s.p2.sy;
          drawn.push(s);

          var sf = SURF[s.surf];
          var alt = ((s.i / 3) | 0) % 2 === 0;
          var grass = night
            ? (alt ? '#101c1a' : '#132320')
            : (alt ? '#1f3a24' : '#24432a');
          c.fillStyle = grass;
          c.fillRect(0, s.p2.sy, W, s.p1.sy - s.p2.sy + 1);
          var rw1 = s.p1.sw * 1.16, rw2 = s.p2.sw * 1.16;
          poly(c, s.p1.sx, s.p1.sy, rw1, s.p2.sx, s.p2.sy, rw2, alt ? sf.rum : U.shade(sf.rum, -.25));
          poly(c, s.p1.sx, s.p1.sy, s.p1.sw, s.p2.sx, s.p2.sy, s.p2.sw, alt ? sf.light : sf.dark);
          if (sf.lane && alt && s.p1.sw > 6) {
            poly(c, s.p1.sx, s.p1.sy, s.p1.sw * .03, s.p2.sx, s.p2.sy, s.p2.sw * .03, sf.lane);
          }
        }

        // scenery, far to near
        for (i = drawn.length - 1; i >= 0; i--) {
          var sg = drawn[i];
          if (!sg.spr) continue;
          if (sg.p1.cz < 1200) continue;         // too close: it would fill the screen
          var sx = sg.p1.sx + sg.p1.sw * sg.spr.off;
          var sy = sg.p1.sy;
          var kind = sg.spr.kind;
          var wh = kind > .62 ? 2400 : kind > .3 ? 900 : 1500;
          var hgt = sg.p1.scale * wh * H / 2;
          if (hgt < 3 || sx < -160 || sx > W + 160) continue;
          var wdt = hgt * (kind > .62 ? .62 : kind > .3 ? 1.1 : .5);
          if (kind > .62) {
            c.fillStyle = night ? '#2c5a3c' : '#3f8f4e';
            c.beginPath();
            c.moveTo(sx, sy - hgt); c.lineTo(sx + wdt * .5, sy); c.lineTo(sx - wdt * .5, sy);
            c.closePath(); c.fill();
            c.fillStyle = '#3b2a1c';
            c.fillRect(sx - wdt * .07, sy - hgt * .12, wdt * .14, hgt * .12);
          } else if (kind > .3) {
            c.fillStyle = night ? '#2a2d3a' : '#6a6558';
            c.beginPath(); c.ellipse(sx, sy - hgt * .16, wdt * .3, hgt * .18, 0, 0, TAU); c.fill();
          } else {
            c.fillStyle = '#b4482f';
            c.fillRect(sx - wdt * .05, sy - hgt * .5, wdt * .1, hgt * .5);
            c.fillStyle = '#ffd257';
            c.fillRect(sx - wdt * .16, sy - hgt * .62, wdt * .32, hgt * .16);
          }
        }
        c.restore();

        // dust
        for (i = 0; i < d.dust.length; i++) {
          var p = d.dust[i], a = p.t / p.max;
          var px = W / 2 + (p.x - d.px) * 210;
          var py = H - 60 - (1 - a) * (p.big ? 120 : 50);
          c.globalAlpha = a * .5;
          c.fillStyle = SURF[base.surf].dust;
          c.beginPath();
          c.arc(px + (1 - a) * (p.big ? U.rand(-60, 60) : 0), py, (p.big ? 22 : 10) * (1.4 - a), 0, TAU);
          c.fill();
        }
        c.globalAlpha = 1;

        drawCar(c, d);
        drawHud(g, c, d);
      }
    });

    function drawCar(c, d) {
      var lean = (d.steerVis || 0) * 14;
      var bounce = Math.sin(d.z * 0.02) * (d.speed > 100 ? 2.6 : 0) * (SURF[segAt(d, d.z).surf].grip < .8 ? 1.8 : 1);
      var cx = W / 2 + lean, cy = H - 92 + bounce;
      c.save();
      c.translate(cx, cy);
      c.rotate(lean * 0.004 + (d.spin > 0 ? d.spin * 3 : 0));
      c.fillStyle = 'rgba(0,0,0,.45)';
      c.beginPath(); c.ellipse(0, 46, 84, 15, 0, 0, TAU); c.fill();
      c.fillStyle = '#12151f';
      c.fillRect(-80, 16, 30, 30); c.fillRect(50, 16, 30, 30);
      c.fillStyle = '#e63946';
      U.roundRect(c, -74, -34, 148, 74, 12); c.fill();
      c.fillStyle = '#f1f5ff';
      U.roundRect(c, -56, -28, 112, 34, 8); c.fill();
      c.fillStyle = '#1b2233';
      U.roundRect(c, -50, -24, 100, 26, 6); c.fill();
      c.fillStyle = '#0f1420';
      c.fillRect(-74, 6, 148, 10);
      c.fillStyle = '#ffd257';
      c.fillRect(-70, -6, 16, 10); c.fillRect(54, -6, 16, 10);
      c.fillStyle = '#fff';
      c.font = 'bold 15px system-ui,sans-serif'; c.textAlign = 'center';
      c.fillText('7', 0, -8);
      c.restore();
    }

    function drawHud(g, c, d) {
      var i;
      c.textAlign = 'left';
      // co-driver notes
      for (i = 0; i < d.notes.length; i++) {
        var n = d.notes[i];
        if (n.t <= 0) continue;
        var a = Math.min(1, n.t / 1.1);
        var y = 96 + i * 40;
        c.globalAlpha = a * (i === 0 ? 1 : .45);
        c.fillStyle = 'rgba(8,10,20,.78)';
        U.roundRect(c, 16, y, 300 - i * 24, 34, 8); c.fill();
        c.fillStyle = n.dir < 0 ? '#60a5fa' : '#fbbf24';
        c.fillRect(16, y, 5, 34);
        c.fillStyle = '#fff';
        c.font = (i === 0 ? 'bold 19px' : '15px') + ' system-ui,sans-serif';
        c.fillText(n.text, 30, y + (i === 0 ? 24 : 23));
        c.globalAlpha = 1;
      }

      // surface pill
      var sf = SURF[segAt(d, d.z).surf];
      c.fillStyle = 'rgba(8,10,20,.72)';
      U.roundRect(c, W - 150, 96, 132, 30, 8); c.fill();
      c.fillStyle = sf.rum;
      c.beginPath(); c.arc(W - 134, 111, 7, 0, TAU); c.fill();
      c.fillStyle = '#dfe5ff';
      c.font = '14px system-ui,sans-serif';
      c.fillText(sf.name + '  grip ' + Math.round(sf.grip * 100) + '%', W - 122, 116);

      // progress bar
      var prog = U.clamp(d.z / d.track.len, 0, 1);
      c.fillStyle = 'rgba(255,255,255,.18)';
      U.roundRect(c, W - 150, 134, 132, 8, 4); c.fill();
      c.fillStyle = '#4ade80';
      U.roundRect(c, W - 150, 134, 132 * prog, 8, 4); c.fill();
      c.fillStyle = '#9fb0d8';
      c.font = '12px system-ui,sans-serif';
      c.fillText(d.track.name, W - 150, 158);

      if (d.penalty > 0) {
        c.fillStyle = '#fb7185';
        c.font = 'bold 15px system-ui,sans-serif';
        c.fillText('+' + (d.penalty / 1000).toFixed(0) + 's penalties', W - 150, 178);
      }

      if (d.phase === 'go') {
        c.textAlign = 'center';
        c.fillStyle = 'rgba(6,8,16,.66)'; c.fillRect(0, H / 2 - 72, W, 144);
        c.fillStyle = '#fff';
        c.font = 'bold 44px system-ui,sans-serif';
        c.fillText('SS' + (d.stage + 1) + ' · ' + d.track.name, W / 2, H / 2 - 12);
        c.font = '20px system-ui,sans-serif';
        c.fillStyle = '#ffd257';
        c.fillText(d.phaseT > 1.2 ? 'Get ready…' : (d.phaseT > 0 ? 'GO!' : 'GO!'), W / 2, H / 2 + 28);
        c.fillStyle = '#9fb0d8';
        c.font = '15px system-ui,sans-serif';
        c.fillText(SURF[d.track.surf].name + ' stage · listen to the notes', W / 2, H / 2 + 56);
      }
      if (d.phase === 'split' || d.phase === 'retire') {
        c.textAlign = 'center';
        c.fillStyle = 'rgba(6,8,16,.78)'; c.fillRect(0, H / 2 - 100, W, 200);
        c.fillStyle = '#fff';
        c.font = 'bold 34px system-ui,sans-serif';
        c.fillText(d.phase === 'retire' ? 'Damage too high' : 'Stage finish', W / 2, H / 2 - 50);
        if (d.phase === 'split') {
          var sp = d.splits[d.splits.length - 1];
          c.fillStyle = '#4ade80';
          c.font = 'bold 42px system-ui,sans-serif';
          c.fillText(fmtT(sp.ms), W / 2, H / 2 + 4);
          c.fillStyle = '#9fb0d8';
          c.font = '17px system-ui,sans-serif';
          c.fillText('Total ' + fmtT(d.total) + '  ·  damage ' + Math.round(d.damage) + '%', W / 2, H / 2 + 42);
          c.fillText(d.stage + 1 < 6 ? 'Next: ' + STAGES[d.stage + 1].name : 'Last stage done', W / 2, H / 2 + 70);
        }
      }
      c.textAlign = 'left';
    }
  }

  window.Milo.register({
    id: 'rally-stage', title: 'Rally Stage', emo: '🚙', category: 'Racing',
    tagline: 'Your co-driver sees the corner first',
    description: 'Six point-to-point special stages against the clock, driven half-blind: ' +
      'the corner you are about to meet is called out by your co-driver a couple of seconds ' +
      'before you can see it. "Left 4 tightens, 200" is a medium left that closes up with 200 ' +
      'metres to the next call — 1 is a hairpin, 6 is flat out. Gravel, tarmac and mud each ' +
      'have their own grip, so the same note is a different corner on each surface; hitting ' +
      'the scenery costs three seconds and a chunk of bodywork, and 100% damage retires you. ' +
      'Tip: brake on the straight before the call, not in the corner after it.',
    controls: ['↑ throttle', '↓ brake', '← → steer'],
    colors: ['#e63946', '#7a6342'],
    tags: ['rally', 'racing', 'time trial', 'driving', 'stages'],
    scoreLabel: 'pts',
    mount: mount
  });
})();
