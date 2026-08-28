/**
 * Shared racing kit: 4x4 matrix maths, a tiny WebGL mesh builder, a seeded
 * track generator and the car / tuning tables.
 *
 * Tracks are generated rather than hand-drawn. Fifty hand-authored circuits
 * would be fifty chances to ship one that self-intersects or has a corner
 * tighter than the car can turn; a generator plus a validator gives fifty that
 * are all provably drivable. Every track is a closed star-shaped loop around
 * the origin — radius varies with angle but never doubles back — which is what
 * makes "no self-intersection" true by construction rather than by inspection.
 */
(function (global) {
  'use strict';
  var Milo = global.Milo = global.Milo || {};

  /* ============================================================== mat4 */

  var M = {};

  M.identity = function () {
    var o = new Float32Array(16);
    o[0] = o[5] = o[10] = o[15] = 1;
    return o;
  };

  M.mul = function (a, b) {
    var o = new Float32Array(16);
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        var s = 0;
        for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
        o[i * 4 + j] = s;
      }
    }
    return o;
  };

  M.perspective = function (fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), o = new Float32Array(16);
    o[0] = f / aspect; o[5] = f;
    o[10] = (far + near) / (near - far); o[11] = -1;
    o[14] = 2 * far * near / (near - far);
    return o;
  };

  M.lookAt = function (ex, ey, ez, cx, cy, cz, ux, uy, uz) {
    var zx = ex - cx, zy = ey - cy, zz = ez - cz;
    var zl = Math.hypot(zx, zy, zz) || 1;
    zx /= zl; zy /= zl; zz /= zl;
    var xx = uy * zz - uz * zy, xy = uz * zx - ux * zz, xz = ux * zy - uy * zx;
    var xl = Math.hypot(xx, xy, xz) || 1;
    xx /= xl; xy /= xl; xz /= xl;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    var o = new Float32Array(16);
    o[0] = xx; o[1] = yx; o[2] = zx;
    o[4] = xy; o[5] = yy; o[6] = zy;
    o[8] = xz; o[9] = yz; o[10] = zz;
    o[12] = -(xx * ex + xy * ey + xz * ez);
    o[13] = -(yx * ex + yy * ey + yz * ez);
    o[14] = -(zx * ex + zy * ey + zz * ez);
    o[15] = 1;
    return o;
  };

  /** Translate * rotateY * rotateZ(roll) * rotateX(pitch) * scale, in one pass. */
  M.model = function (x, y, z, yaw, pitch, roll, sx, sy, sz) {
    var cy = Math.cos(yaw), sy2 = Math.sin(yaw);
    var cp = Math.cos(pitch || 0), sp = Math.sin(pitch || 0);
    var cr = Math.cos(roll || 0), sr = Math.sin(roll || 0);
    sx = sx == null ? 1 : sx; sy = sy == null ? 1 : sy; sz = sz == null ? 1 : sz;
    // R = Ry * Rz * Rx, written out so the hot path does no matrix products.
    var m00 = cy * cr, m01 = -cy * sr * cp + sy2 * sp, m02 = cy * sr * sp + sy2 * cp;
    var m10 = sr, m11 = cr * cp, m12 = -cr * sp;
    var m20 = -sy2 * cr, m21 = sy2 * sr * cp + cy * sp, m22 = -sy2 * sr * sp + cy * cp;
    var o = new Float32Array(16);
    o[0] = m00 * sx; o[1] = m10 * sx; o[2] = m20 * sx;
    o[4] = m01 * sy; o[5] = m11 * sy; o[6] = m21 * sy;
    o[8] = m02 * sz; o[9] = m12 * sz; o[10] = m22 * sz;
    o[12] = x; o[13] = y; o[14] = z; o[15] = 1;
    return o;
  };

  Milo.mat4 = M;

  /* ====================================================== mesh builder */

  /**
   * Vertices are pos(3) + colour(3) + shade(1) + tint(1). `tint` blends the
   * vertex colour toward a per-draw uniform, so one car mesh serves every
   * paint job without rebuilding a buffer.
   */
  function Mesh() { this.v = []; }

  Mesh.prototype.vert = function (x, y, z, col, shade, tint) {
    this.v.push(x, y, z, col[0], col[1], col[2], shade, tint || 0);
  };

  Mesh.prototype.tri = function (a, b, c, col, shade, tint) {
    this.vert(a[0], a[1], a[2], col, shade, tint);
    this.vert(b[0], b[1], b[2], col, shade, tint);
    this.vert(c[0], c[1], c[2], col, shade, tint);
  };

  Mesh.prototype.quad = function (a, b, c, d, col, shade, tint) {
    this.tri(a, b, c, col, shade, tint);
    this.tri(a, c, d, col, shade, tint);
  };

  /** Axis-aligned box from centre + half-extents, with per-face shading. */
  Mesh.prototype.box = function (cx, cy, cz, hx, hy, hz, col, tint, shadeScale) {
    var s = shadeScale == null ? 1 : shadeScale;
    var x0 = cx - hx, x1 = cx + hx, y0 = cy - hy, y1 = cy + hy, z0 = cz - hz, z1 = cz + hz;
    var t = this;
    t.quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], col, 1.00 * s, tint);
    t.quad([x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], col, 0.45 * s, tint);
    t.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], col, 0.80 * s, tint);
    t.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], col, 0.66 * s, tint);
    t.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], col, 0.90 * s, tint);
    t.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], col, 0.58 * s, tint);
  };

  /**
   * Box rotated about Y. Local +z runs along the given yaw, +x to its right,
   * which is what track-side buildings need to face the road.
   */
  Mesh.prototype.boxR = function (cx, cy, cz, hx, hy, hz, yaw, col, tint, shadeScale) {
    var sc = shadeScale == null ? 1 : shadeScale;
    var c = Math.cos(yaw), s = Math.sin(yaw);
    function P(x, y, z) { return [cx + x * c + z * s, cy + y, cz - x * s + z * c]; }
    var p000 = P(-hx, -hy, -hz), p100 = P(hx, -hy, -hz), p010 = P(-hx, hy, -hz), p110 = P(hx, hy, -hz);
    var p001 = P(-hx, -hy, hz), p101 = P(hx, -hy, hz), p011 = P(-hx, hy, hz), p111 = P(hx, hy, hz);
    this.quad(p010, p011, p111, p110, col, 1.00 * sc, tint);
    this.quad(p001, p000, p100, p101, col, .45 * sc, tint);
    this.quad(p001, p101, p111, p011, col, .80 * sc, tint);
    this.quad(p100, p000, p010, p110, col, .66 * sc, tint);
    this.quad(p101, p100, p110, p111, col, .90 * sc, tint);
    this.quad(p000, p001, p011, p010, col, .58 * sc, tint);
  };

  Mesh.prototype.count = function () { return this.v.length / 8; };
  Mesh.prototype.data = function () { return new Float32Array(this.v); };

  Milo.Mesh = Mesh;

  /* =================================================== seeded PRNG */

  /** mulberry32 — small, fast, and identical in every browser for a given seed. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ================================================ track generation */

  var TAU = Math.PI * 2;

  /**
   * A periodic wobble built from whole-numbered harmonics, so it closes on
   * itself exactly at t = 1 and the loop has no seam.
   */
  function harmonics(rand, count, minFreq, maxFreq) {
    var terms = [];
    for (var i = 0; i < count; i++) {
      terms.push({
        f: Math.round(minFreq + rand() * (maxFreq - minFreq)),
        p: rand() * TAU,
        a: 1 / (i + 1)
      });
    }
    // Normalise so the sum peaks at roughly 1 regardless of how many terms.
    var norm = 0;
    terms.forEach(function (t) { norm += Math.abs(t.a); });
    terms.forEach(function (t) { t.a /= norm || 1; });
    return function (t) {
      var s = 0;
      for (var i = 0; i < terms.length; i++) s += terms[i].a * Math.sin(terms[i].f * TAU * t + terms[i].p);
      return s;
    };
  }

  var SEG = 4.2;            // metres between road cross-sections
  var MIN_TURN_RADIUS = 26; // tighter than this and the car simply cannot make it

  /**
   * Builds a full track from a spec. Returns cross-sections sampled at even
   * arc length, plus the feature ranges (jumps, boost pads, tunnels) and the
   * checkpoint indices.
   */
  function buildTrack(spec) {
    var rand = rng(spec.seed);
    var radial = harmonics(rand, 3, 1, Math.max(2, spec.lobes));
    var chicane = harmonics(rand, 2, spec.lobes + 2, spec.lobes + 6);
    var hilly = harmonics(rand, 2, 1, Math.max(2, spec.hillFreq || 3));

    var base = spec.radius || 190;
    var amp = spec.amp || .22;
    var chic = spec.chic || 0;
    var hill = spec.hill || 0;

    function point(t) {
      var r = base * (1 + amp * radial(t) + chic * chicane(t));
      var a = t * TAU;
      return {
        x: Math.cos(a) * r,
        y: hill * hilly(t),
        z: Math.sin(a) * r
      };
    }

    // Dense sample first, then resample by arc length so segments are even.
    var FINE = 4000;
    var fine = [], i;
    for (i = 0; i <= FINE; i++) fine.push(point(i / FINE));
    var cum = [0];
    for (i = 1; i <= FINE; i++) {
      var p = fine[i - 1], q = fine[i];
      cum.push(cum[i - 1] + Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z));
    }
    var total = cum[FINE];
    var n = Math.max(64, Math.round(total / SEG));
    var step = total / n;

    var pts = [], fi = 0;
    for (i = 0; i < n; i++) {
      var target = i * step;
      while (fi < FINE && cum[fi + 1] < target) fi++;
      var span = cum[fi + 1] - cum[fi] || 1;
      var f = (target - cum[fi]) / span;
      var a2 = fine[fi], b2 = fine[fi + 1];
      pts.push({
        x: a2.x + (b2.x - a2.x) * f,
        y: a2.y + (b2.y - a2.y) * f,
        z: a2.z + (b2.z - a2.z) * f
      });
    }

    // Tangents, left normals and signed curvature from neighbouring samples.
    var samples = [];
    for (i = 0; i < n; i++) {
      var prev = pts[(i - 1 + n) % n], cur = pts[i], next = pts[(i + 1) % n];
      var tx = next.x - prev.x, ty = next.y - prev.y, tz = next.z - prev.z;
      var tl = Math.hypot(tx, ty, tz) || 1;
      tx /= tl; ty /= tl; tz /= tl;
      // Left is up x tangent, flattened: the road banks, it never rolls over.
      var lx = -tz, lz = tx;
      var ll = Math.hypot(lx, lz) || 1;
      lx /= ll; lz /= ll;
      // Signed turn rate in the ground plane, in radians per metre.
      var a1 = Math.atan2(cur.z - prev.z, cur.x - prev.x);
      var a3 = Math.atan2(next.z - cur.z, next.x - cur.x);
      var da = ((a3 - a1 + Math.PI * 3) % TAU) - Math.PI;
      var curv = da / step;
      samples.push({
        x: cur.x, y: cur.y, z: cur.z,
        tx: tx, ty: ty, tz: tz,
        lx: lx, lz: lz,
        curv: curv, s: i * step,
        w: spec.width * .5, bank: 0, kind: 0
      });
    }

    // Smooth the curvature before it drives banking, or the road twitches.
    var smooth = new Float32Array(n);
    for (i = 0; i < n; i++) {
      var acc = 0, w = 0;
      for (var k = -6; k <= 6; k++) {
        var wt = 7 - Math.abs(k);
        acc += samples[(i + k + n) % n].curv * wt;
        w += wt;
      }
      smooth[i] = acc / w;
    }
    for (i = 0; i < n; i++) {
      samples[i].curvS = smooth[i];
      // Bank into the corner, capped so nothing becomes a wall.
      samples[i].bank = Math.max(-.42, Math.min(.42, -smooth[i] * (spec.bank || 26)));
    }

    // Width variation: a track that pinches in places reads far less uniform.
    if (spec.narrow) {
      var wob = harmonics(rand, 2, 2, 5);
      for (i = 0; i < n; i++) {
        samples[i].w = spec.width * .5 * (1 - spec.narrow * .5 * (1 + wob(i / n)) * .5);
      }
    }

    var feats = { gaps: [], boosts: [], tunnels: [] };

    /** Reserves a stretch of track, keeping features off the start line. */
    function reserve(list, len, taken) {
      for (var attempt = 0; attempt < 40; attempt++) {
        var start = Math.floor(30 + rand() * (n - len - 60));
        var clash = taken.some(function (r) { return start < r[1] + 26 && start + len > r[0] - 26; });
        if (clash) continue;
        taken.push([start, start + len]);
        list.push([start, start + len]);
        return true;
      }
      return false;
    }

    var taken = [];
    var j;
    for (j = 0; j < (spec.jumps || 0); j++) {
      // A jump is a ramp, a hole, and a landing ramp; the hole is the middle.
      reserve(feats.gaps, 3 + Math.floor(rand() * 2), taken);
    }
    for (j = 0; j < (spec.boosts || 0); j++) reserve(feats.boosts, 7, taken);
    for (j = 0; j < (spec.tunnels || 0); j++) reserve(feats.tunnels, 22 + Math.floor(rand() * 18), taken);

    // Ramp the road up into each hole. The climb is *imposed* on the terrain
    // rather than added to it: adding left a downhill lip on hilly tracks with
    // no upward gradient at all, and therefore no launch. The landing is set a
    // full ramp-height below the lip, and that drop buys most of the air time
    // needed to clear the gap.
    feats.gaps.forEach(function (gap) {
      var lead = 8, out = 12, rise = 6.2, q;
      var startIdx = (gap[0] - lead + n) % n;
      var base = samples[startIdx].y;
      for (q = 0; q <= lead; q++) {
        samples[(startIdx + q) % n].y = base + (q / lead) * rise;
      }
      // Blend the far side back to the natural terrain over a longer run, so
      // the recovery never turns into a gradient the validator would reject.
      var afterBase = samples[(gap[1] + out) % n].y;
      for (q = 0; q <= out; q++) {
        var f = q / out;
        samples[(gap[1] + q) % n].y = base * (1 - f) + afterBase * f;
      }
      for (q = gap[0]; q < gap[1]; q++) samples[q % n].kind = 1;   // hole
    });
    feats.boosts.forEach(function (b) {
      for (var q = b[0]; q < b[1]; q++) samples[q % n].kind = 2;
    });
    feats.tunnels.forEach(function (t) {
      for (var q = t[0]; q < t[1]; q++) samples[q % n].tunnel = true;
    });

    // The feature pass moved the road up and down, so the tangents computed
    // from the original centreline are now stale. Rebuilding them is what
    // gives a ramp lip its upward gradient — and therefore its launch.
    for (i = 0; i < n; i++) {
      var pv = samples[(i - 1 + n) % n], nb = samples[(i + 1) % n];
      var dx2 = nb.x - pv.x, dy2 = nb.y - pv.y, dz2 = nb.z - pv.z;
      var l2 = Math.hypot(dx2, dy2, dz2) || 1;
      samples[i].tx = dx2 / l2; samples[i].ty = dy2 / l2; samples[i].tz = dz2 / l2;
    }

    // Checkpoints: evenly spaced, and never inside a hole.
    var cpCount = Math.max(4, Math.min(12, Math.round(total / 260)));
    var checkpoints = [];
    for (i = 0; i < cpCount; i++) {
      var idx = Math.round(i * n / cpCount);
      var guard = 0;
      while (samples[idx % n].kind === 1 && guard++ < n) idx++;
      checkpoints.push(idx % n);
    }

    return {
      spec: spec, samples: samples, n: n, step: step, total: total,
      feats: feats, checkpoints: checkpoints
    };
  }

  /**
   * Confirms a generated track is actually raceable: closed, evenly sampled,
   * never doubling back on itself, and with no corner tighter than a car can
   * physically take. Returns a list of problems — empty means good.
   */
  function validateTrack(track) {
    var problems = [];
    var s = track.samples, n = track.n, i;

    if (n < 64) problems.push('too short (' + n + ' segments)');

    // 1. Curvature: the tightest corner must clear the minimum turn radius,
    //    with room for the road's own half-width on the inside of the bend.
    var worst = 0, worstAt = -1;
    for (i = 0; i < n; i++) {
      var r = Math.abs(s[i].curvS) > 1e-6 ? 1 / Math.abs(s[i].curvS) : 1e9;
      if (r - s[i].w < MIN_TURN_RADIUS && r < 1e8) {
        if (worstAt < 0 || r < worst) { worst = r; worstAt = i; }
      }
    }
    if (worstAt >= 0) {
      problems.push('corner radius ' + worst.toFixed(1) + 'm at segment ' + worstAt +
        ' (needs ' + (MIN_TURN_RADIUS + s[worstAt].w).toFixed(1) + 'm)');
    }

    // 2. Self-clearance: any two non-adjacent cross-sections must stay more
    //    than a road-width apart, or two bits of track overlap in space.
    //    A uniform grid keeps this linear instead of comparing every pair.
    var maxW = 0;
    for (i = 0; i < n; i++) maxW = Math.max(maxW, s[i].w);
    var cellSize = maxW * 2 + 8;
    var grid = Object.create(null);
    function key(cx, cz) { return cx + ',' + cz; }
    for (i = 0; i < n; i++) {
      var gx = Math.floor(s[i].x / cellSize), gz = Math.floor(s[i].z / cellSize);
      var kk = key(gx, gz);
      (grid[kk] || (grid[kk] = [])).push(i);
    }
    var minGap = 1e9, gapAt = -1;
    for (i = 0; i < n; i++) {
      var a = s[i];
      var cx = Math.floor(a.x / cellSize), cz = Math.floor(a.z / cellSize);
      for (var ox = -1; ox <= 1; ox++) {
        for (var oz = -1; oz <= 1; oz++) {
          var bucket = grid[key(cx + ox, cz + oz)];
          if (!bucket) continue;
          for (var bi = 0; bi < bucket.length; bi++) {
            var j = bucket[bi];
            if (j <= i) continue;
            // Samples within eight steps along the track are meant to be close.
            var along = Math.min(j - i, n - (j - i));
            if (along < 8) continue;
            var b = s[j];
            var d = Math.hypot(a.x - b.x, a.z - b.z);
            // Two levels of track can share ground plan if they clear vertically.
            if (Math.abs(a.y - b.y) > 7) continue;
            var need = a.w + b.w + 4;
            if (d < need && d < minGap) { minGap = d; gapAt = i; }
          }
        }
      }
    }
    if (gapAt >= 0) {
      problems.push('track passes within ' + minGap.toFixed(1) + 'm of itself near segment ' + gapAt);
    }

    // 3. Gradient: a ramp steeper than this launches the car uncontrollably.
    for (i = 0; i < n; i++) {
      var nx = s[(i + 1) % n];
      var slope = Math.abs(nx.y - s[i].y) / track.step;
      if (slope > .55 && s[i].kind !== 1) {
        problems.push('gradient ' + (slope * 100).toFixed(0) + '% at segment ' + i);
        break;
      }
    }

    // 4. Every checkpoint must sit on solid road.
    track.checkpoints.forEach(function (c, k) {
      if (s[c].kind === 1) problems.push('checkpoint ' + k + ' is over a hole');
    });

    return problems;
  }

  /* ============================================================ themes */

  var THEMES = {
    dawn: { sky: [.99, .71, .45], fog: [.99, .78, .58], ground: [.42, .30, .26], road: [.28, .27, .34], kerbA: [.94, .35, .29], kerbB: [.97, .95, .92], wall: [.98, .84, .40], accent: [1, .55, .25], scen: 'rock' },
    grass: { sky: [.42, .72, .95], fog: [.68, .84, .96], ground: [.36, .63, .32], road: [.30, .30, .36], kerbA: [.90, .24, .24], kerbB: [.97, .97, .97], wall: [.95, .95, .97], accent: [.20, .80, .55], scen: 'tree' },
    night: { sky: [.05, .05, .12], fog: [.08, .07, .18], ground: [.10, .10, .18], road: [.16, .16, .22], kerbA: [.20, .90, .95], kerbB: [.65, .30, .95], wall: [.30, .85, .95], accent: [.25, .95, .85], scen: 'neon' },
    snow: { sky: [.75, .85, .95], fog: [.88, .93, .98], ground: [.90, .93, .97], road: [.34, .36, .44], kerbA: [.85, .30, .35], kerbB: [.98, .98, 1], wall: [.70, .82, .92], accent: [.45, .75, .95], scen: 'pine' },
    desert: { sky: [.62, .80, .93], fog: [.90, .82, .64], ground: [.82, .70, .45], road: [.36, .33, .32], kerbA: [.92, .55, .20], kerbB: [.98, .95, .88], wall: [.85, .72, .48], accent: [.95, .70, .25], scen: 'cactus' },
    volcano: { sky: [.20, .07, .08], fog: [.36, .12, .10], ground: [.18, .10, .10], road: [.20, .18, .20], kerbA: [.98, .42, .12], kerbB: [.30, .26, .28], wall: [.55, .18, .12], accent: [1, .45, .12], scen: 'rock' },
    ocean: { sky: [.48, .80, .90], fog: [.62, .87, .93], ground: [.16, .48, .62], road: [.28, .32, .40], kerbA: [.98, .82, .30], kerbB: [.96, .98, 1], wall: [.30, .70, .82], accent: [.20, .85, .80], scen: 'palm' },
    space: { sky: [.03, .02, .08], fog: [.08, .05, .16], ground: [.09, .07, .16], road: [.18, .17, .26], kerbA: [.75, .30, .95], kerbB: [.35, .80, 1], wall: [.55, .35, .90], accent: [.80, .40, 1], scen: 'crystal' }
  };

  /* ============================================================= cars */

  /**
   * Stats are 0..1 and get scaled into physics units by the game. `air` is how
   * much steering authority you keep off the ground, which matters a lot on
   * the jump-heavy tracks.
   */
  var CARS = [
    { id: 'cadet', name: 'Cadet', price: 0, top: .52, accel: .55, grip: .62, brake: .55, mass: .45, air: .50, col: [.20, .78, .92], desc: 'Forgiving and free. A good place to learn the lines.' },
    { id: 'dart', name: 'Dart', price: 900, top: .58, accel: .68, grip: .70, brake: .58, mass: .34, air: .62, col: [.98, .78, .22], desc: 'Light and eager. Turns in fast, punished by big jumps.' },
    { id: 'hauler', name: 'Hauler', price: 1400, top: .66, accel: .44, grip: .52, brake: .70, mass: .82, air: .34, col: [.55, .60, .68], desc: 'Heavy. Shrugs off walls and rivals, hates tight corners.' },
    { id: 'vulpine', name: 'Vulpine', price: 2200, top: .63, accel: .72, grip: .80, brake: .66, mass: .40, air: .70, col: [.95, .40, .30], desc: 'The cornering specialist. Rewards a clean, committed line.' },
    { id: 'comet', name: 'Comet', price: 3200, top: .78, accel: .62, grip: .58, brake: .52, mass: .52, air: .48, col: [.40, .95, .60], desc: 'Enormous top end. Needs long straights to pay off.' },
    { id: 'onyx', name: 'Onyx', price: 4400, top: .72, accel: .76, grip: .72, brake: .74, mass: .50, air: .60, col: [.32, .30, .40], desc: 'No weakness worth naming. Expensive for exactly that reason.' },
    { id: 'wasp', name: 'Wasp', price: 5600, top: .70, accel: .88, grip: .74, brake: .62, mass: .28, air: .82, col: [.98, .86, .16], desc: 'Explosive off the line and superb in the air.' },
    { id: 'monolith', name: 'Monolith', price: 7000, top: .86, accel: .58, grip: .64, brake: .80, mass: .90, air: .30, col: [.72, .24, .24], desc: 'A missile. Terrifying to place, unbeatable down a straight.' },
    { id: 'phantom', name: 'Phantom', price: 9000, top: .82, accel: .82, grip: .86, brake: .78, mass: .42, air: .76, col: [.62, .38, .96], desc: 'Near-perfect balance. The car the leaderboards are set in.' },
    { id: 'apex', name: 'Apex R', price: 13000, top: .95, accel: .94, grip: .90, brake: .86, mass: .38, air: .84, col: [.20, .95, .95], desc: 'Prototype. Faster than the tracks were designed for.' }
  ];

  /* =========================================================== tuning */

  var TUNES = [
    { id: 'engine', name: 'Engine', icon: '⚙️', stat: 'top', desc: 'Raises top speed.' },
    { id: 'gearbox', name: 'Gearbox', icon: '🔧', stat: 'accel', desc: 'Sharper acceleration out of corners.' },
    { id: 'tyres', name: 'Tyres', icon: '🛞', stat: 'grip', desc: 'More grip before the car breaks away.' },
    { id: 'brakes', name: 'Brakes', icon: '🛑', stat: 'brake', desc: 'Later braking into corners.' },
    { id: 'nitro', name: 'Nitrous', icon: '🔥', stat: 'nitro', desc: 'A bigger, longer boost bottle.' },
    { id: 'chassis', name: 'Chassis', icon: '🪶', stat: 'air', desc: 'Lighter body and better control in the air.' }
  ];
  var TUNE_MAX = 5;

  /** Upgrades get steeper as they go, so a maxed car is a real investment. */
  function tuneCost(level) { return Math.round(320 * Math.pow(1.85, level)); }

  /** Applies a car's tuning levels to its base stats. */
  function tunedStats(car, tune) {
    tune = tune || {};
    var out = { nitro: 0 };
    TUNES.forEach(function (t) {
      var lvl = Math.min(TUNE_MAX, tune[t.id] || 0);
      var base = t.stat === 'nitro' ? 0 : car[t.stat];
      // Each level closes a fifth of the gap to a perfect stat.
      out[t.stat] = t.stat === 'nitro' ? lvl / TUNE_MAX : base + (1 - base) * (lvl / TUNE_MAX) * .7;
    });
    out.mass = car.mass * (1 - (Math.min(TUNE_MAX, tune.chassis || 0) / TUNE_MAX) * .18);
    return out;
  }

  Milo.racing = {
    rng: rng,
    buildTrack: buildTrack,
    validateTrack: validateTrack,
    THEMES: THEMES,
    CARS: CARS,
    TUNES: TUNES,
    TUNE_MAX: TUNE_MAX,
    tuneCost: tuneCost,
    tunedStats: tunedStats,
    MIN_TURN_RADIUS: MIN_TURN_RADIUS,
    SEG: SEG
  };

})(window);
