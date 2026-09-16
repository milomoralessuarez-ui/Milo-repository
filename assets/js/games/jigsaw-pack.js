/* Jigsaw Pack — eighteen jigsaw puzzles on one shared engine.
   Six scenes are painted procedurally on an offscreen canvas (no images):
   sunset bay, misty mountains, neon city, deep space, koi pond and autumn
   forest — each a layered painting with gradient skies, silhouettes and
   light effects. The picture is cut into grid tiles (12, 24 or 54), the
   tiles are scattered around the board, and you drag them onto a faint
   ghost of the finished picture; a close drop snaps in with a chime.
   Score = difficulty base minus time and moves, so fast tidy solves win. */
(function () {
  'use strict';
  var Milo = window.Milo, U = Milo.util;

  var W = 960, H = 640;            // design space
  var PW = 540, PH = 360;          // picture size in design units
  var RES = 2;                     // offscreen paint at 2x for crispness
  var BX = (W - PW) / 2, BY = 168; // board top-left

  /* ------------------------------------------------------ paint helpers */

  function lcg(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function lg(c, x0, y0, x1, y1, stops) {
    var gr = c.createLinearGradient(x0, y0, x1, y1);
    for (var i = 0; i < stops.length; i++) gr.addColorStop(stops[i][0], stops[i][1]);
    return gr;
  }

  function glow(c, x, y, r, inner, outer) {
    var gr = c.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, inner);
    gr.addColorStop(1, outer);
    c.fillStyle = gr;
    c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  }

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  /* ------------------------------------------------------ scene painters
     Each paints a full 1080x720 picture. Deterministic (seeded) so the
     ghost, the pieces and every restart show the exact same painting. */

  function paintSunsetBay(c, w, h) {
    var R = lcg(11), i;
    var hy = h * 0.62;
    // sky
    c.fillStyle = lg(c, 0, 0, 0, hy, [[0, '#241043'], [.45, '#83285f'], [.75, '#d94f5f'], [1, '#ff9d4d']]);
    c.fillRect(0, 0, w, hy);
    // sun glow + disc
    var sx = w * 0.58, sy = hy - h * 0.055, sr = h * 0.085;
    glow(c, sx, sy, sr * 4.2, 'rgba(255,190,110,.55)', 'rgba(255,190,110,0)');
    c.fillStyle = lg(c, 0, sy - sr, 0, sy + sr, [[0, '#fff3cf'], [1, '#ffc46b']]);
    c.beginPath(); c.arc(sx, sy, sr, 0, 7); c.fill();
    // under-lit cloud streaks
    for (i = 0; i < 9; i++) {
      var cy = h * (0.08 + R() * 0.40), cw = w * (0.12 + R() * 0.3), ch = h * (0.008 + R() * 0.014);
      var cx = R() * w;
      c.fillStyle = 'rgba(60,20,60,' + (0.18 + R() * 0.22).toFixed(2) + ')';
      c.beginPath(); c.ellipse(cx, cy, cw, ch, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,170,130,' + (0.12 + R() * 0.2).toFixed(2) + ')';
      c.beginPath(); c.ellipse(cx + cw * 0.15, cy - ch * 0.8, cw * 0.8, ch * 0.6, 0, 0, 7); c.fill();
    }
    // water
    c.fillStyle = lg(c, 0, hy, 0, h, [[0, '#ff9d4d'], [.25, '#c14f58'], [.6, '#5b2456'], [1, '#1c0d33']]);
    c.fillRect(0, hy, w, h - hy);
    // glitter path under the sun
    for (i = 0; i < 70; i++) {
      var t = i / 70;
      var gy = hy + 4 + t * (h - hy) * 0.72;
      var gw = (6 + t * 70) * (0.5 + R());
      var gx = sx + (R() - 0.5) * (10 + t * 150);
      c.fillStyle = 'rgba(255,220,150,' + (0.35 * (1 - t) + 0.06).toFixed(2) + ')';
      c.fillRect(gx - gw / 2, gy, gw, 2 + t * 3);
    }
    // wave lines
    c.strokeStyle = 'rgba(20,8,40,.25)';
    c.lineWidth = 2;
    for (i = 0; i < 14; i++) {
      var wy = hy + 8 + Math.pow(i / 14, 1.4) * (h - hy - 30);
      c.beginPath();
      c.moveTo(0, wy);
      c.bezierCurveTo(w * .3, wy - 4, w * .6, wy + 4, w, wy);
      c.stroke();
    }
    // sailboat silhouette
    var bx = w * 0.30, by = hy + h * 0.055;
    c.fillStyle = '#1d0d2b';
    c.beginPath();                              // hull
    c.moveTo(bx - h * .075, by);
    c.lineTo(bx + h * .075, by);
    c.lineTo(bx + h * .05, by + h * .028);
    c.lineTo(bx - h * .05, by + h * .028);
    c.closePath(); c.fill();
    c.fillRect(bx - 2, by - h * .16, 4, h * .16); // mast
    c.beginPath();                              // main sail
    c.moveTo(bx + 4, by - h * .155);
    c.lineTo(bx + h * .085, by - h * .012);
    c.lineTo(bx + 4, by - h * .012);
    c.closePath(); c.fill();
    c.beginPath();                              // jib
    c.moveTo(bx - 4, by - h * .13);
    c.lineTo(bx - h * .07, by - h * .012);
    c.lineTo(bx - 4, by - h * .012);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(29,13,43,.4)';          // reflection
    c.beginPath(); c.ellipse(bx, by + h * .05, h * .07, h * .012, 0, 0, 7); c.fill();
    // beach foreground
    c.fillStyle = lg(c, 0, h * .78, 0, h, [[0, '#33163e'], [1, '#120720']]);
    c.beginPath();
    c.moveTo(0, h * 0.80);
    c.bezierCurveTo(w * 0.25, h * 0.82, w * 0.45, h * 0.90, w * 0.60, h * 1.03);
    c.lineTo(0, h + 6);
    c.closePath(); c.fill();
    // foam line along the beach edge
    c.strokeStyle = 'rgba(255,190,150,.45)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(0, h * 0.80);
    c.bezierCurveTo(w * 0.25, h * 0.82, w * 0.45, h * 0.90, w * 0.60, h * 1.03);
    c.stroke();
    // birds
    c.strokeStyle = 'rgba(30,10,40,.85)';
    c.lineWidth = 2.5;
    for (i = 0; i < 4; i++) {
      var bxr = w * (0.12 + R() * 0.5), byr = h * (0.12 + R() * 0.25), bs = 6 + R() * 6;
      c.beginPath();
      c.moveTo(bxr - bs, byr);
      c.quadraticCurveTo(bxr - bs * .5, byr - bs * .8, bxr, byr);
      c.quadraticCurveTo(bxr + bs * .5, byr - bs * .8, bxr + bs, byr);
      c.stroke();
    }
  }

  function paintMistyMountains(c, w, h) {
    var R = lcg(23), i, x;
    c.fillStyle = lg(c, 0, 0, 0, h, [[0, '#b8c6dc'], [.5, '#e3d3c4'], [.78, '#f2c9a2'], [1, '#e8b58e']]);
    c.fillRect(0, 0, w, h);
    // pale sun
    var sx = w * .38, sy = h * .28;
    glow(c, sx, sy, h * .32, 'rgba(255,245,225,.9)', 'rgba(255,245,225,0)');
    c.fillStyle = 'rgba(255,250,235,.95)';
    c.beginPath(); c.arc(sx, sy, h * .045, 0, 7); c.fill();
    // six ridges, far to near, with mist pooled between them
    var cols = ['#c5b3bd', '#a893a8', '#857192', '#61527a', '#3f3660', '#262441'];
    var crest = [];
    for (i = 0; i < 6; i++) {
      var base = h * (0.42 + i * 0.105);
      var amp = h * (0.10 + i * 0.02);
      var seedR = lcg(100 + i * 7);
      var ph0 = seedR() * 20, f1 = 0.004 + seedR() * 0.003, f2 = 0.011 + seedR() * 0.006;
      c.fillStyle = cols[i];
      c.beginPath();
      c.moveTo(-4, h + 4);
      for (x = -4; x <= w + 6; x += 6) {
        var yy = base - amp * (0.55 + 0.45 * Math.sin(x * f1 + ph0))
          - amp * 0.45 * Math.abs(Math.sin(x * f2 + ph0 * 3));
        c.lineTo(x, yy);
        if (i === 5) crest.push({ x: x, y: yy });
      }
      c.lineTo(w + 4, h + 4);
      c.closePath(); c.fill();
      // mist band hugging this ridge
      c.fillStyle = lg(c, 0, base - h * .09, 0, base + h * .05,
        [[0, 'rgba(240,232,232,0)'],
        [.6, 'rgba(240,232,232,' + (0.34 - i * 0.045).toFixed(2) + ')'],
        [1, 'rgba(240,232,232,0)']]);
      c.fillRect(0, base - h * .09, w, h * .14);
    }
    // pines along the nearest crest
    c.fillStyle = '#1d1b33';
    for (i = 4; i < crest.length - 4; i += 7) {
      if (lcg(i * 31)() < 0.35) continue;
      var p = crest[i], th = h * (0.02 + lcg(i * 17)() * 0.018);
      c.beginPath();
      c.moveTo(p.x, p.y - th);
      c.lineTo(p.x + th * .38, p.y + 3);
      c.lineTo(p.x - th * .38, p.y + 3);
      c.closePath(); c.fill();
    }
    // birds
    c.strokeStyle = 'rgba(70,60,90,.7)';
    c.lineWidth = 2;
    for (i = 0; i < 3; i++) {
      var bx = w * (0.55 + R() * 0.3), by = h * (0.12 + R() * 0.15), bs = 5 + R() * 5;
      c.beginPath();
      c.moveTo(bx - bs, by);
      c.quadraticCurveTo(bx - bs * .5, by - bs * .8, bx, by);
      c.quadraticCurveTo(bx + bs * .5, by - bs * .8, bx + bs, by);
      c.stroke();
    }
  }

  function paintNeonCity(c, w, h) {
    var R = lcg(37), i, x;
    var wy = h * 0.74;
    // night sky
    c.fillStyle = lg(c, 0, 0, 0, wy, [[0, '#040413'], [.55, '#141138'], [.85, '#33195e'], [1, '#572470']]);
    c.fillRect(0, 0, w, wy);
    glow(c, w * .5, wy, w * .5, 'rgba(255,80,190,.16)', 'rgba(255,80,190,0)');
    // stars
    for (i = 0; i < 130; i++) {
      c.fillStyle = 'rgba(255,255,255,' + (0.15 + R() * 0.6).toFixed(2) + ')';
      c.fillRect(R() * w, R() * wy * 0.7, R() < .18 ? 2.6 : 1.6, R() < .18 ? 2.6 : 1.6);
    }
    // moon
    var mx = w * .84, my = h * .15;
    glow(c, mx, my, h * .13, 'rgba(200,210,255,.4)', 'rgba(200,210,255,0)');
    c.fillStyle = '#e6e9ff';
    c.beginPath(); c.arc(mx, my, h * .038, 0, 7); c.fill();
    c.fillStyle = 'rgba(180,188,235,.55)';
    c.beginPath(); c.arc(mx - h * .012, my + h * .008, h * .007, 0, 7); c.fill();
    c.beginPath(); c.arc(mx + h * .012, my - h * .012, h * .005, 0, 7); c.fill();
    // background skyline
    c.fillStyle = '#191545';
    x = 0;
    while (x < w) {
      var bw = w * (0.03 + R() * 0.05);
      var bh = h * (0.12 + R() * 0.22);
      c.fillRect(x, wy - bh, bw, bh);
      x += bw + w * 0.004;
    }
    // foreground skyline with lit windows
    var neon = ['#2ee6d6', '#ff5ca8', '#ffd166', '#9a6bff'];
    var refl = [];
    var pad = w * 0.006, cw = w * 0.0075, chh = h * 0.011, gx = w * 0.005, gyy = h * 0.009;
    x = -w * 0.01;
    while (x < w) {
      var bw2 = w * (0.045 + R() * 0.075);
      var bh2 = h * (0.20 + R() * 0.30);
      var bx = x, by = wy - bh2;
      c.fillStyle = '#0a0820';
      c.fillRect(bx, by, bw2, bh2);
      if (R() < 0.5) {                            // neon roof strip
        var nc = neon[(R() * 4) | 0];
        c.fillStyle = nc;
        c.fillRect(bx, by, bw2, 3);
        c.fillStyle = rgba(nc, .16);
        c.fillRect(bx - 2, by - h * .012, bw2 + 4, h * .012);
      }
      if (R() < 0.4) {                            // antenna with beacon
        c.fillStyle = '#0a0820';
        c.fillRect(bx + bw2 / 2 - 1.5, by - h * .05, 3, h * .05);
        glow(c, bx + bw2 / 2, by - h * .05, 5, 'rgba(255,70,90,.9)', 'rgba(255,70,90,0)');
      }
      var ncols = Math.floor((bw2 - pad * 2) / (cw + gx));
      var nrows = Math.floor((bh2 - pad * 2) / (chh + gyy));
      for (var r = 0; r < nrows; r++) {
        for (var q = 0; q < ncols; q++) {
          if (R() < 0.40) {
            var col2 = R() < 0.72 ? '#ffd97a' : neon[(R() * 4) | 0];
            var wx = bx + pad + q * (cw + gx), wyy = by + pad + r * (chh + gyy);
            c.fillStyle = rgba(col2, 0.5 + R() * 0.5);
            c.fillRect(wx, wyy, cw, chh);
            if (refl.length < 90 && R() < 0.22) refl.push({ x: wx, w: cw, c: col2 });
          }
        }
      }
      x += bw2 + w * 0.006;
    }
    // harbour water
    c.fillStyle = lg(c, 0, wy, 0, h, [[0, '#241448'], [1, '#05040f']]);
    c.fillRect(0, wy, w, h - wy);
    glow(c, w * .5, wy + 6, w * .35, 'rgba(160,70,200,.18)', 'rgba(160,70,200,0)');
    // wobbling window reflections
    for (i = 0; i < refl.length; i++) {
      var rf = refl[i];
      var len = (h - wy) * (0.2 + R() * 0.7);
      c.fillStyle = rgba(rf.c, 0.10 + R() * 0.10);
      var yy2 = wy + 2;
      while (yy2 < wy + len) {
        var sh = 5 + R() * 10;
        c.fillRect(rf.x + Math.sin(yy2 * 0.05) * 4, yy2, rf.w, sh * 0.55);
        yy2 += sh;
      }
    }
    // dark ripple flecks
    c.fillStyle = 'rgba(5,4,15,.5)';
    for (i = 0; i < 30; i++) {
      c.fillRect(R() * w, wy + R() * (h - wy), w * (0.06 + R() * 0.22), 2);
    }
  }

  function paintDeepSpace(c, w, h) {
    var R = lcg(53), i;
    c.fillStyle = lg(c, 0, 0, 0, h, [[0, '#050414'], [.5, '#0a0724'], [1, '#02020c']]);
    c.fillRect(0, 0, w, h);
    // nebula (additive blobs)
    c.globalCompositeOperation = 'lighter';
    var neb = ['124,58,237', '236,72,153', '34,211,238', '80,70,220'];
    for (i = 0; i < 10; i++) {
      var nx = R() * w, ny = R() * h * 0.85, nr = h * (0.12 + R() * 0.28);
      var col = neb[(R() * neb.length) | 0];
      glow(c, nx, ny, nr, 'rgba(' + col + ',' + (0.10 + R() * 0.12).toFixed(2) + ')', 'rgba(' + col + ',0)');
    }
    c.globalCompositeOperation = 'source-over';
    // dark dust lanes
    glow(c, w * .3, h * .35, h * .3, 'rgba(3,3,18,.4)', 'rgba(3,3,18,0)');
    glow(c, w * .5, h * .15, h * .22, 'rgba(3,3,18,.3)', 'rgba(3,3,18,0)');
    // star field
    for (i = 0; i < 260; i++) {
      c.fillStyle = 'rgba(255,255,255,' + (0.25 + R() * 0.7).toFixed(2) + ')';
      c.beginPath(); c.arc(R() * w, R() * h, R() * 1.6 + 0.6, 0, 7); c.fill();
    }
    // bright stars with cross flares
    for (i = 0; i < 6; i++) {
      var fx = R() * w, fy = R() * h * .7, fl = 8 + R() * 16;
      glow(c, fx, fy, fl * 1.6, 'rgba(200,220,255,.8)', 'rgba(200,220,255,0)');
      c.strokeStyle = 'rgba(230,240,255,.8)';
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(fx - fl, fy); c.lineTo(fx + fl, fy);
      c.moveTo(fx, fy - fl); c.lineTo(fx, fy + fl);
      c.stroke();
    }
    // ringed planet
    var px = w * 0.66, py = h * 0.60, pr = h * 0.21, tilt = -0.32;
    function ringPass() {
      c.strokeStyle = 'rgba(230,200,160,.5)';
      c.lineWidth = pr * 0.16;
      c.beginPath(); c.ellipse(0, 0, pr * 1.75, pr * 0.5, 0, 0, 7); c.stroke();
      c.strokeStyle = 'rgba(180,150,190,.35)';
      c.lineWidth = pr * 0.07;
      c.beginPath(); c.ellipse(0, 0, pr * 2.0, pr * 0.58, 0, 0, 7); c.stroke();
    }
    c.save();                                     // far side of the ring
    c.translate(px, py); c.rotate(tilt);
    ringPass();
    c.restore();
    c.save();                                     // banded planet body
    c.beginPath(); c.arc(px, py, pr, 0, 7); c.clip();
    c.fillStyle = lg(c, 0, py - pr, 0, py + pr, [[0, '#e8a06b'], [.4, '#c06a63'], [.75, '#7c4370'], [1, '#4a2a56']]);
    c.fillRect(px - pr, py - pr, pr * 2, pr * 2);
    for (i = 0; i < 7; i++) {
      var by = py - pr + (i + 0.5) * (pr * 2 / 7);
      c.fillStyle = 'rgba(' + (i % 2 ? '255,230,200' : '60,20,60') + ',' + (0.08 + R() * 0.10).toFixed(2) + ')';
      c.beginPath(); c.ellipse(px, by, pr * 1.05, pr * (0.09 + R() * 0.05), 0, 0, 7); c.fill();
    }
    glow(c, px - pr * .6, py - pr * .6, pr * 1.9, 'rgba(255,235,210,.30)', 'rgba(255,235,210,0)');
    glow(c, px + pr * .8, py + pr * .8, pr * 1.9, 'rgba(5,5,20,.75)', 'rgba(5,5,20,0)');
    c.restore();
    c.save();                                     // near side of the ring
    c.translate(px, py); c.rotate(tilt);
    c.beginPath(); c.rect(-pr * 2.3, 0, pr * 4.6, pr * 2.3); c.clip();
    ringPass();
    c.restore();
    // cratered moon
    var mx = w * .18, my = h * .74, mr = h * .035;
    c.fillStyle = '#c9c4d8';
    c.beginPath(); c.arc(mx, my, mr, 0, 7); c.fill();
    c.fillStyle = 'rgba(90,85,120,.5)';
    c.beginPath(); c.arc(mx - mr * .3, my + mr * .2, mr * .28, 0, 7); c.fill();
    c.beginPath(); c.arc(mx + mr * .35, my - mr * .3, mr * .18, 0, 7); c.fill();
    glow(c, mx + mr * .7, my + mr * .6, mr * 1.6, 'rgba(2,2,12,.6)', 'rgba(2,2,12,0)');
    // distant galaxy smear
    c.save();
    c.translate(w * .12, h * .18); c.rotate(0.6);
    c.fillStyle = 'rgba(200,180,255,.14)';
    c.beginPath(); c.ellipse(0, 0, h * .06, h * .016, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,240,255,.35)';
    c.beginPath(); c.ellipse(0, 0, h * .016, h * .008, 0, 0, 7); c.fill();
    c.restore();
  }

  function paintKoiPond(c, w, h) {
    var R = lcg(71), i, k;
    c.fillStyle = lg(c, 0, 0, 0, h, [[0, '#0f6157'], [.5, '#0a4550'], [1, '#062a38']]);
    c.fillRect(0, 0, w, h);
    glow(c, w * .25, h * .2, w * .5, 'rgba(140,230,200,.14)', 'rgba(140,230,200,0)');
    // caustic squiggles
    c.strokeStyle = 'rgba(190,240,225,.10)';
    c.lineWidth = 2;
    for (i = 0; i < 40; i++) {
      c.beginPath();
      c.ellipse(R() * w, R() * h, 10 + R() * 60, (10 + R() * 60) * (0.3 + R() * 0.3),
        R() * 3, R() * 5, R() * 3 + 4);
      c.stroke();
    }
    // sun dapples
    for (i = 0; i < 8; i++) {
      glow(c, R() * w, R() * h * .55, 30 + R() * 70, 'rgba(255,255,220,.07)', 'rgba(255,255,220,0)');
    }
    // ripple ring sets
    function ringSet(x, y) {
      for (var j = 1; j <= 3; j++) {
        c.strokeStyle = 'rgba(220,255,245,' + (0.22 - j * 0.05).toFixed(2) + ')';
        c.lineWidth = 2;
        c.beginPath(); c.ellipse(x, y, j * 22, j * 9, 0, 0, 7); c.stroke();
      }
    }
    ringSet(w * .60, h * .28);
    ringSet(w * .18, h * .78);
    // a koi, seen from above
    function koi(x, y, ang, len, base, patch) {
      function bodyPath(s) {
        c.beginPath();
        c.moveTo(len * .52 * s, 0);
        c.bezierCurveTo(len * .48 * s, len * .30 * s, -len * .2 * s, len * .28 * s, -len * .46 * s, 0);
        c.bezierCurveTo(-len * .2 * s, -len * .28 * s, len * .48 * s, -len * .30 * s, len * .52 * s, 0);
        c.closePath();
      }
      c.save();                                   // drop shadow on the pond bed
      c.translate(x + len * .12, y + len * .16);
      c.rotate(ang);
      c.fillStyle = 'rgba(2,15,20,.30)';
      bodyPath(0.95); c.fill();
      c.restore();
      c.save();
      c.translate(x, y); c.rotate(ang);
      c.fillStyle = base;                         // waving tail
      c.beginPath();
      c.moveTo(-len * .40, 0);
      c.quadraticCurveTo(-len * .75, -len * .18, -len * .92, -len * .06);
      c.quadraticCurveTo(-len * .72, 0, -len * .92, len * .10);
      c.quadraticCurveTo(-len * .72, len * .16, -len * .40, 0);
      c.fill();
      c.fillStyle = rgba(base, .85);              // pectoral fins
      c.beginPath(); c.ellipse(len * .08, len * .30, len * .16, len * .07, 0.7, 0, 7); c.fill();
      c.beginPath(); c.ellipse(len * .08, -len * .30, len * .16, len * .07, -0.7, 0, 7); c.fill();
      c.fillStyle = base;                         // body
      bodyPath(1); c.fill();
      c.save();                                   // patches, clipped to body
      bodyPath(1); c.clip();
      c.fillStyle = patch;
      c.beginPath(); c.ellipse(len * .20, -len * .06, len * .17, len * .12, 0.3, 0, 7); c.fill();
      c.beginPath(); c.ellipse(-len * .14, len * .07, len * .14, len * .10, -0.4, 0, 7); c.fill();
      c.beginPath(); c.ellipse(len * .42, len * .03, len * .10, len * .08, 0, 0, 7); c.fill();
      c.restore();
      c.fillStyle = '#141418';                    // eyes
      c.beginPath(); c.arc(len * .40, -len * .09, len * .022, 0, 7); c.fill();
      c.beginPath(); c.arc(len * .40, len * .09, len * .022, 0, 7); c.fill();
      c.restore();
    }
    koi(w * .34, h * .44, 0.6, h * .115, '#f2f0e6', '#e8542f');
    koi(w * .62, h * .64, 2.7, h * .13, '#f28a2e', '#fdf6ea');
    koi(w * .80, h * .24, 3.9, h * .085, '#e8b93b', '#2c2c33');
    koi(w * .15, h * .70, 5.3, h * .095, '#f2f0e6', '#1b1b22');
    // lily pads (floating above the fish)
    function pad(x, y, r, rot) {
      c.save();
      c.translate(x, y); c.rotate(rot);
      c.fillStyle = lg(c, -r, -r, r, r, [[0, '#3b8a48'], [1, '#1d5a30']]);
      c.beginPath();
      c.moveTo(0, 0);
      c.arc(0, 0, r, 0.28, 6.0);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(210,255,190,.30)';
      c.lineWidth = 3;
      c.beginPath(); c.arc(0, 0, r - 2, 0.34, 5.95); c.stroke();
      c.strokeStyle = 'rgba(10,40,20,.25)';
      c.lineWidth = 2;
      for (var j = 0; j < 7; j++) {
        var a = 0.55 + j * 0.78;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * r * .85, Math.sin(a) * r * .85); c.stroke();
      }
      c.restore();
    }
    pad(w * .12, h * .16, w * .075, 0.4);
    pad(w * .87, h * .80, w * .095, 2.2);
    pad(w * .50, h * .09, w * .055, 4.0);
    pad(w * .76, h * .48, w * .045, 1.1);
    pad(w * .30, h * .88, w * .06, 5.2);
    // lotus flower on the big pad
    var lx = w * .87, ly = h * .80, lr = w * .045;
    for (k = 0; k < 8; k++) {
      var a2 = k * Math.PI / 4;
      c.save();
      c.translate(lx + Math.cos(a2) * lr * .55, ly + Math.sin(a2) * lr * .55);
      c.rotate(a2);
      c.fillStyle = '#ee8fb2';
      c.beginPath(); c.ellipse(0, 0, lr * .55, lr * .24, 0, 0, 7); c.fill();
      c.restore();
    }
    for (k = 0; k < 5; k++) {
      var a3 = k * Math.PI * 2 / 5 + 0.5;
      c.save();
      c.translate(lx + Math.cos(a3) * lr * .3, ly + Math.sin(a3) * lr * .3);
      c.rotate(a3);
      c.fillStyle = '#f9c2d4';
      c.beginPath(); c.ellipse(0, 0, lr * .38, lr * .18, 0, 0, 7); c.fill();
      c.restore();
    }
    c.fillStyle = '#ffd166';
    c.beginPath(); c.arc(lx, ly, lr * .16, 0, 7); c.fill();
  }

  function paintAutumnForest(c, w, h) {
    var R = lcg(89), i;
    var leafCols = ['#d94f2b', '#e8862f', '#f2b93b', '#a83a22', '#c26a2a'];
    c.fillStyle = lg(c, 0, 0, 0, h, [[0, '#f6e6bd'], [.45, '#f2bf7a'], [.75, '#e08a4a'], [1, '#9c4a2a']]);
    c.fillRect(0, 0, w, h);
    glow(c, w * .5, h * .30, h * .45, 'rgba(255,244,214,.65)', 'rgba(255,244,214,0)');
    // hazy distant trees
    for (i = 0; i < 14; i++) {
      var tx = R() * w, tb = h * (0.60 + R() * 0.18);
      c.fillStyle = 'rgba(160,84,52,' + (0.15 + R() * 0.15).toFixed(2) + ')';
      c.fillRect(tx - 3, tb - h * .3, 7, h * .3);
      c.fillStyle = 'rgba(190,100,60,.20)';
      c.beginPath(); c.arc(tx, tb - h * .3, h * (0.03 + R() * 0.04), 0, 7); c.fill();
    }
    // ground
    var gy = h * 0.78;
    c.fillStyle = lg(c, 0, gy, 0, h, [[0, '#6b3320'], [1, '#2c1410']]);
    c.fillRect(0, gy, w, h - gy);
    // leaf litter
    for (i = 0; i < 160; i++) {
      c.globalAlpha = 0.25 + R() * 0.5;
      c.fillStyle = leafCols[(R() * leafCols.length) | 0];
      c.beginPath();
      c.ellipse(R() * w, gy + R() * (h - gy), 3 + R() * 5, 1.8 + R() * 2.4, R() * 3, 0, 7);
      c.fill();
    }
    c.globalAlpha = 1;
    // light shafts
    c.save();
    c.translate(w * .5, 0); c.rotate(0.18);
    c.fillStyle = 'rgba(255,235,190,.10)';
    c.fillRect(-w * .03, -h * .2, w * .06, h * 1.3);
    c.fillRect(-w * .30, -h * .2, w * .04, h * 1.3);
    c.fillRect(w * .22, -h * .2, w * .05, h * 1.3);
    c.restore();
    // trunks with branches
    var trunkXs = [0.08, 0.22, 0.38, 0.60, 0.74, 0.90];
    for (i = 0; i < trunkXs.length; i++) {
      var tx2 = w * (trunkXs[i] + (R() - .5) * 0.03);
      var tw = w * (0.012 + R() * 0.012);
      var top = h * (0.04 + R() * 0.10);
      c.fillStyle = '#33180f';
      c.beginPath();
      c.moveTo(tx2 - tw, gy + h * .02);
      c.lineTo(tx2 - tw * .45, top);
      c.lineTo(tx2 + tw * .45, top);
      c.lineTo(tx2 + tw, gy + h * .02);
      c.closePath(); c.fill();
      c.strokeStyle = '#33180f';
      c.lineWidth = tw * .5;
      for (var b = 0; b < 3; b++) {
        var byy = top + (gy - top) * (0.12 + R() * 0.35);
        var dir = R() < .5 ? -1 : 1;
        c.beginPath();
        c.moveTo(tx2, byy);
        c.quadraticCurveTo(tx2 + dir * w * .04, byy - h * .05, tx2 + dir * w * .08, byy - h * .09);
        c.stroke();
      }
    }
    // canopy of red, orange and amber
    for (i = 0; i < 95; i++) {
      var cx = R() * w, cy = h * (0.02 + Math.pow(R(), 1.6) * 0.42);
      c.fillStyle = leafCols[(R() * leafCols.length) | 0];
      c.globalAlpha = 0.55 + R() * 0.4;
      c.beginPath(); c.arc(cx, cy, h * (0.02 + R() * 0.055), 0, 7); c.fill();
    }
    c.globalAlpha = 1;
    // falling leaves
    for (i = 0; i < 28; i++) {
      c.save();
      c.translate(R() * w, h * (0.2 + R() * 0.55));
      c.rotate(R() * 6.28);
      c.fillStyle = leafCols[(R() * leafCols.length) | 0];
      c.beginPath(); c.ellipse(0, 0, 4 + R() * 5, 2.4 + R() * 2.5, 0, 0, 7); c.fill();
      c.restore();
    }
  }

  /* ---------------------------------------------------------- picture cache */

  var picCache = {};
  function getPicture(scene) {
    if (picCache[scene.key]) return picCache[scene.key];
    var cv = document.createElement('canvas');
    cv.width = PW * RES;
    cv.height = PH * RES;
    scene.paint(cv.getContext('2d'), cv.width, cv.height);
    picCache[scene.key] = cv;
    return cv;
  }

  /* --------------------------------------------------------- jigsaw engine */

  function scatterPiece(p, i, d) {
    var pw = d.pw, ph = d.ph;
    for (var t = 0; t < 8; t++) {
      var side = (i + t) % 4, x, y;
      if (side === 0) {                                   // left margin
        x = U.rand(8, Math.max(9, BX - pw + 26));
        y = U.rand(64, H - ph - 8);
      } else if (side === 1) {                            // right margin
        x = U.rand(Math.min(BX + PW - 26, W - pw - 9), W - pw - 8);
        y = U.rand(64, H - ph - 8);
      } else if (side === 2) {                            // top strip
        x = U.rand(8, W - pw - 8);
        y = U.rand(64, Math.max(65, BY - ph + 26));
      } else {                                            // bottom strip
        x = U.rand(8, W - pw - 8);
        y = U.rand(Math.min(BY + PH - 26, H - ph - 9), H - ph - 8);
      }
      x = U.clamp(x, 6, W - pw - 6);
      y = U.clamp(y, 60, H - ph - 6);
      if (Math.abs(x - p.tx) > d.snap * 1.6 || Math.abs(y - p.ty) > d.snap * 1.6) {
        p.x = x; p.y = y;
        return;
      }
    }
    p.x = 8; p.y = 64;
  }

  function reset(g, scene, size) {
    var d = g.data;
    d.pic = getPicture(scene);
    d.sceneName = scene.name;
    d.cols = size.grid[0];
    d.rows = size.grid[1];
    d.pw = PW / d.cols;
    d.ph = PH / d.rows;
    d.count = size.n;
    d.snap = Math.max(20, d.pw * 0.34);
    d.pieces = [];
    d.order = [];
    d.drag = null;
    d.placed = 0;
    d.moves = 0;
    d.time = 0;
    d.done = false;
    d.sparks = [];
    var idx = [];
    var i;
    for (i = 0; i < d.count; i++) idx.push(i);
    U.shuffle(idx);
    for (i = 0; i < d.count; i++) {
      var k = idx[i];
      var cx = k % d.cols, cy = (k / d.cols) | 0;
      var p = {
        sx: cx * d.pw, sy: cy * d.ph,
        tx: BX + cx * d.pw, ty: BY + cy * d.ph,
        x: 0, y: 0, placed: false
      };
      scatterPiece(p, i, d);
      d.pieces.push(p);
      d.order.push(p);
    }
    g.set('Pieces', '0/' + d.count);
    g.set('Moves', 0);
    g.set('Time', '0:00');
  }

  function drop(g) {
    var d = g.data;
    var p = d.drag.p;
    d.drag = null;
    d.moves++;
    g.set('Moves', d.moves);
    if (Math.abs(p.x - p.tx) < d.snap && Math.abs(p.y - p.ty) < d.snap) {
      p.x = p.tx; p.y = p.ty; p.placed = true;
      d.order.splice(d.order.indexOf(p), 1);
      d.placed++;
      g.set('Pieces', d.placed + '/' + d.count);
      Milo.sound.tone({ f: 620, f2: 940, d: .09, v: .09, type: 'square' });
      for (var s = 0; s < 10; s++) {
        var a = Math.random() * 6.28, sp = U.rand(30, 130);
        d.sparks.push({
          x: p.tx + d.pw / 2, y: p.ty + d.ph / 2,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .5, max: .5
        });
      }
      if (d.placed === d.count) {
        d.done = true;
        var base = 2500 + d.count * 250;
        var score = Math.max(d.count * 25, base - Math.round(d.time) * 8 - d.moves * 12);
        g.win({
          emo: '🧩',
          title: d.sceneName + ' complete!',
          text: 'Solved in ' + U.time(d.time) + ' with ' + d.moves + ' moves.',
          score: score
        });
      }
    } else {
      Milo.sound.tone({ f: 150, f2: 110, d: .06, v: .06, type: 'triangle' });
    }
  }

  function pointer(g, type, x, y) {
    var d = g.data;
    if (g.state !== 'play' || d.done) {
      if (type === 'up') d.drag = null;   // don't leave a piece glued to the pointer
      return;
    }
    if (type === 'down') {
      for (var i = d.order.length - 1; i >= 0; i--) {
        var p = d.order[i];
        if (x >= p.x && x <= p.x + d.pw && y >= p.y && y <= p.y + d.ph) {
          d.order.splice(i, 1);
          d.order.push(p);                       // dragged piece rides on top
          d.drag = { p: p, ox: x - p.x, oy: y - p.y };
          Milo.sound.tone({ f: 240, f2: 300, d: .04, v: .05, type: 'triangle' });
          return;
        }
      }
    } else if (type === 'move' && d.drag) {
      var q = d.drag.p;
      q.x = U.clamp(x - d.drag.ox, -d.pw * .3, W - d.pw * .7);
      q.y = U.clamp(y - d.drag.oy, 46, H - d.ph * .5);
    } else if (type === 'up' && d.drag) {
      drop(g);
    }
  }

  function draw(g, scene) {
    var c = g.ctx, d = g.data, i;
    // table
    c.fillStyle = lg(c, 0, 0, 0, H, [[0, scene.table[0]], [1, scene.table[1]]]);
    c.fillRect(0, 0, W, H);
    var vg = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.45)');
    c.fillStyle = vg;
    c.fillRect(0, 0, W, H);
    // frame
    U.roundRect(c, BX - 12, BY - 12, PW + 24, PH + 24, 10);
    c.fillStyle = 'rgba(0,0,0,.42)';
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,.10)';
    c.lineWidth = 2;
    c.stroke();
    if (d.done) {
      c.drawImage(d.pic, 0, 0, d.pic.width, d.pic.height, BX, BY, PW, PH);
      c.strokeStyle = scene.accent;
      c.globalAlpha = .8;
      c.lineWidth = 3;
      c.strokeRect(BX - 4, BY - 4, PW + 8, PH + 8);
      c.globalAlpha = 1;
    } else {
      // faint ghost of the finished picture
      c.globalAlpha = 0.15;
      c.drawImage(d.pic, 0, 0, d.pic.width, d.pic.height, BX, BY, PW, PH);
      c.globalAlpha = 1;
      // grid
      c.strokeStyle = 'rgba(255,255,255,.08)';
      c.lineWidth = 1;
      for (i = 1; i < d.cols; i++) {
        c.beginPath();
        c.moveTo(BX + i * d.pw, BY);
        c.lineTo(BX + i * d.pw, BY + PH);
        c.stroke();
      }
      for (i = 1; i < d.rows; i++) {
        c.beginPath();
        c.moveTo(BX, BY + i * d.ph);
        c.lineTo(BX + PW, BY + i * d.ph);
        c.stroke();
      }
      c.strokeStyle = 'rgba(255,255,255,.14)';
      c.strokeRect(BX, BY, PW, PH);
      // placed pieces
      for (i = 0; i < d.pieces.length; i++) {
        var p = d.pieces[i];
        if (p.placed) {
          c.drawImage(d.pic, p.sx * RES, p.sy * RES, d.pw * RES, d.ph * RES,
            p.tx, p.ty, d.pw, d.ph);
        }
      }
      // slot hint when the dragged piece is close to home
      if (d.drag) {
        var dp = d.drag.p;
        if (Math.abs(dp.x - dp.tx) < d.snap * 1.8 && Math.abs(dp.y - dp.ty) < d.snap * 1.8) {
          c.strokeStyle = scene.accent;
          c.lineWidth = 2.5;
          c.globalAlpha = .8;
          c.strokeRect(dp.tx + 1, dp.ty + 1, d.pw - 2, d.ph - 2);
          c.globalAlpha = 1;
        }
      }
      // loose pieces, dragged one on top
      for (i = 0; i < d.order.length; i++) {
        var q = d.order[i];
        var held = d.drag && d.drag.p === q;
        c.save();
        c.shadowColor = 'rgba(0,0,0,.55)';
        c.shadowBlur = held ? 16 : 7;
        c.shadowOffsetY = held ? 8 : 3;
        c.drawImage(d.pic, q.sx * RES, q.sy * RES, d.pw * RES, d.ph * RES,
          q.x, q.y, d.pw, d.ph);
        c.restore();
        c.strokeStyle = held ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.28)';
        c.lineWidth = held ? 2 : 1;
        c.strokeRect(q.x + .5, q.y + .5, d.pw - 1, d.ph - 1);
      }
    }
    // snap sparkles
    for (i = 0; i < d.sparks.length; i++) {
      var s = d.sparks[i];
      c.globalAlpha = Math.max(0, s.life / s.max);
      c.fillStyle = scene.accent;
      c.fillRect(s.x - 2.5, s.y - 2.5, 5, 5);
    }
    c.globalAlpha = 1;
  }

  function makeMount(scene, size) {
    var id = 'jig-' + scene.key + '-' + size.n;
    return function mount(host) {
      return Milo.arcade(host, {
        id: id,
        w: W, h: H, bg: scene.table[1],
        stats: ['Pieces', 'Moves', 'Time'],
        emo: scene.emo,
        start: {
          title: 'Jigsaw: ' + scene.name + ' (' + size.n + ')',
          text: 'Rebuild the painting: ' + scene.line + '. Drag pieces onto the faint ' +
            'ghost in the frame — drop close enough and they snap in. Fewer seconds ' +
            'and fewer drops mean a higher score.',
          keys: ['Drag the pieces']
        },
        init: function (g) { reset(g, scene, size); },
        onPointer: function (g, type, x, y) { pointer(g, type, x, y); },
        update: function (g, dt) {
          var d = g.data;
          for (var i = d.sparks.length - 1; i >= 0; i--) {
            var s = d.sparks[i];
            s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 60 * dt; s.life -= dt;
            if (s.life <= 0) d.sparks.splice(i, 1);
          }
          if (d.done) return;
          d.time += dt;
          g.set('Time', U.time(d.time));
        },
        draw: function (g) { draw(g, scene); }
      });
    };
  }

  /* ----------------------------------------------------------- catalogue */

  var MECH = 'Drag pieces in from the table edge and drop them onto the faint ghost ' +
    'in the frame — a close drop snaps home with a chime, while the clock and the ' +
    'move counter both eat into your score.';

  var SIZES = [
    {
      n: 12, grid: [4, 3], diff: 'easy', word: '12 chunky pieces',
      line: 'At twelve big tiles (a 3×4 cut) this is the gentle version — most pieces ' +
        'carry an unmistakable landmark, and a clean solve takes a couple of minutes.'
    },
    {
      n: 24, grid: [6, 4], diff: 'medium', word: '24 pieces',
      line: 'The 4×6 cut is the middle weight: twenty-four pieces, small enough that ' +
        'neighbouring sky and water tiles start to look alike.'
    },
    {
      n: 54, grid: [9, 6], diff: 'hard', word: '54 little tiles',
      line: 'The 6×9 cut is the serious one — fifty-four small squares, many of them ' +
        'near-identical patches of sky or water, so the ghost image is your best friend.'
    }
  ];

  var SCENES = [
    {
      key: 'sunset-bay', name: 'Sunset Bay', emo: '🌅', word: 'sunset',
      paint: paintSunsetBay,
      table: ['#221233', '#0d0718'], accent: '#ffb066',
      card: ['#ff9d4d', '#5b2456'],
      flavor: 'Golden hour over the bay',
      line: 'a low sun over a bay, its glitter path on the water, a sailboat and a dark sweep of beach',
      pic: 'Rebuild a painted sunset bay: an orange-to-violet sky, a low sun laying a ' +
        'glitter trail on the water, a two-sail silhouette boat and a dark sweep of ' +
        'beach across the foreground.',
      tip: 'The glitter path under the sun is the easiest column to anchor first.'
    },
    {
      key: 'misty-mountains', name: 'Misty Mountains', emo: '🏔️', word: 'mountains',
      paint: paintMistyMountains,
      table: ['#232735', '#101320'], accent: '#e8d8c4',
      card: ['#c9d4e4', '#473a56'],
      flavor: 'Six hazy ridges at dawn',
      line: 'six mountain ridges fading back into pale haze under a soft white sun',
      pic: 'Rebuild a misty dawn: six mountain ridges fading from ink-dark pines in ' +
        'front to pale haze at the back, a soft white sun, and fog pooled in every valley.',
      tip: 'Ridge lines run clean across piece edges, so match the horizon bands first.'
    },
    {
      key: 'neon-city', name: 'Neon City', emo: '🌃', word: 'city',
      paint: paintNeonCity,
      table: ['#120b26', '#060412'], accent: '#2ee6d6',
      card: ['#ff5ca8', '#131038'],
      flavor: 'A lit-up skyline and its reflections',
      line: 'a night skyline full of lit windows and neon rooftops, doubled in the harbour below',
      pic: 'Rebuild a neon night skyline: two ranks of towers full of lit cyan, pink ' +
        'and gold windows under a starfield and a small moon, all smeared into ' +
        'wobbling reflections on the harbour below.',
      tip: 'The window patterns are almost unique per piece, so the skyline row nearly places itself.'
    },
    {
      key: 'deep-space', name: 'Deep Space', emo: '🪐', word: 'space',
      paint: paintDeepSpace,
      table: ['#0b0a20', '#030310'], accent: '#c084fc',
      card: ['#7c3aed', '#0a0620'],
      flavor: 'Ringed planet, nebula and stars',
      line: 'a banded ringed planet over drifts of magenta and cyan nebula, with a cratered moon',
      pic: 'Rebuild a deep-space vista: a banded ringed planet hanging over drifts of ' +
        'magenta and cyan nebula, a small cratered moon, and hundreds of stars with a ' +
        'few bright cross-flares.',
      tip: 'Start with the planet and its ring; the star-field corners are the real test.'
    },
    {
      key: 'koi-pond', name: 'Koi Pond', emo: '🎏', word: 'koi',
      paint: paintKoiPond,
      table: ['#0a2a30', '#04161c'], accent: '#ffd166',
      card: ['#f28a2e', '#0a4550'],
      flavor: 'Koi and lilies from above',
      line: 'four koi gliding under lily pads and a pink lotus, with ripples on the teal water',
      pic: 'Rebuild a koi pond seen from above: four koi — white-and-red, orange, gold ' +
        'and calico — gliding beneath lily pads and a pink lotus, with ripple rings ' +
        'and sun dapples on the teal water.',
      tip: 'Place the koi and the lily pads first, and save the plain water for last.'
    },
    {
      key: 'autumn-forest', name: 'Autumn Forest', emo: '🍁', word: 'autumn',
      paint: paintAutumnForest,
      table: ['#241410', '#100806'], accent: '#f2b93b',
      card: ['#f2b93b', '#6b3320'],
      flavor: 'Red and gold woodland, leaves falling',
      line: 'dark trunks against a golden sky, a red-and-amber canopy and falling leaves',
      pic: 'Rebuild an autumn forest: dark trunks against a golden sky, a canopy of ' +
        'red, orange and amber, shafts of low light, and leaves falling all the way ' +
        'down to the litter on the ground.',
      tip: 'The trunks cross several rows — use them as vertical rails to hang everything else on.'
    }
  ];

  function cardColors(scene, n) {
    if (n === 12) return [scene.card[0], scene.card[1]];
    if (n === 24) return [U.shade(scene.card[0], -0.18), U.shade(scene.card[1], 0.18)];
    return [U.shade(scene.card[0], 0.18), U.shade(scene.card[1], -0.22)];
  }

  SCENES.forEach(function (scene) {
    SIZES.forEach(function (size) {
      Milo.register({
        id: 'jig-' + scene.key + '-' + size.n,
        title: 'Jigsaw: ' + scene.name + ' (' + size.n + ')',
        emo: scene.emo,
        category: 'Puzzle',
        tagline: scene.flavor + ' — ' + size.word,
        description: scene.pic + ' ' + size.line + ' ' + MECH + ' ' + scene.tip,
        controls: ['Drag pieces'],
        colors: cardColors(scene, size.n),
        tags: ['jigsaw', 'picture', 'relaxing', scene.word, size.diff],
        mount: makeMount(scene, size)
      });
    });
  });
})();
