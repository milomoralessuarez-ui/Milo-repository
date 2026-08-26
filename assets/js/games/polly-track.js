/* ==========================================================================
   Polly Track — a low-poly 3D track racer (WebGL)
   Three circuits built from closed Catmull-Rom splines: a road ribbon with
   kerbs, edge posts, a start arch and ordered checkpoints, raced over three
   laps against the clock. Flat-shaded triangles, one static buffer per mesh,
   arcade drift handling and a lagging chase camera.
   Registers: polly-track, polly-track-canyon, polly-track-alpine.
   ========================================================================== */
(function () {
  'use strict';

  var LAPS = 3;
  var CPS = 7;              // checkpoint count per lap (index 0 = start/finish)
  var SHOULDER = 2.5;       // runoff strip beside the tarmac, in units
  var LX = 0.45, LY = 0.85, LZ = 0.30;   // sun direction (normalised below)
  (function () { var l = Math.hypot(LX, LY, LZ); LX /= l; LY /= l; LZ /= l; })();

  /* ----------------------------------------------------------- tiny maths */

  function hex(h) {
    var n = parseInt(h.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function m4mul(a, b) {
    var o = new Float32Array(16);
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        var s = 0;
        for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
        o[i * 4 + j] = s;
      }
    }
    return o;
  }
  function m4perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), o = new Float32Array(16);
    o[0] = f / aspect; o[5] = f;
    o[10] = (far + near) / (near - far); o[11] = -1;
    o[14] = 2 * far * near / (near - far);
    return o;
  }
  function m4rotX(a) {
    var c = Math.cos(a), s = Math.sin(a), o = new Float32Array(16);
    o[0] = 1; o[5] = c; o[6] = s; o[9] = -s; o[10] = c; o[15] = 1;
    return o;
  }
  function m4rotY(a) {
    var c = Math.cos(a), s = Math.sin(a), o = new Float32Array(16);
    o[0] = c; o[2] = -s; o[5] = 1; o[8] = s; o[10] = c; o[15] = 1;
    return o;
  }
  function m4rotZ(a) {
    var c = Math.cos(a), s = Math.sin(a), o = new Float32Array(16);
    o[0] = c; o[1] = s; o[4] = -s; o[5] = c; o[10] = 1; o[15] = 1;
    return o;
  }
  function m4translate(x, y, z) {
    var o = new Float32Array(16);
    o[0] = o[5] = o[10] = o[15] = 1;
    o[12] = x; o[13] = y; o[14] = z;
    return o;
  }
  var M4ID = (function () {
    var o = new Float32Array(16);
    o[0] = o[5] = o[10] = o[15] = 1;
    return o;
  })();

  /** View matrix for an eye looking at a target (yaw/pitch form). */
  function m4view(ex, ey, ez, tx, ty, tz) {
    var dx = tx - ex, dy = ty - ey, dz = tz - ez;
    var l = Math.hypot(dx, dy, dz) || 1;
    dx /= l; dy /= l; dz /= l;
    var yaw = Math.atan2(-dx, -dz);
    var pitch = Math.asin(Math.max(-1, Math.min(1, dy)));
    return m4mul(m4mul(m4rotX(-pitch), m4rotY(-yaw)), m4translate(-ex, -ey, -ez));
  }

  /** Deterministic per-track random stream so a circuit always looks the same. */
  function rng(seed) {
    var s = (seed * 2654435761) >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /* -------------------------------------------------------------- shaders */

  var MAIN_VS = [
    'attribute vec3 aPos;',
    'attribute vec3 aCol;',
    'uniform mat4 uPV;',
    'uniform mat4 uModel;',
    'uniform vec3 uEye;',
    'uniform vec2 uFogRange;',
    'varying vec3 vCol;',
    'varying float vFog;',
    'void main(){',
    '  vec4 w = uModel * vec4(aPos, 1.0);',
    '  gl_Position = uPV * w;',
    '  vCol = aCol;',
    '  vFog = clamp((distance(w.xyz, uEye) - uFogRange.x) / (uFogRange.y - uFogRange.x), 0.0, 1.0);',
    '}'
  ].join('\n');

  var MAIN_FS = [
    'precision mediump float;',
    'uniform vec3 uFogCol;',
    'varying vec3 vCol;',
    'varying float vFog;',
    'void main(){ gl_FragColor = vec4(mix(vCol, uFogCol, vFog), 1.0); }'
  ].join('\n');

  var SKY_VS = [
    'attribute vec2 aPos;',
    'varying float vY;',
    'void main(){ vY = aPos.y; gl_Position = vec4(aPos, 0.999, 1.0); }'
  ].join('\n');

  var SKY_FS = [
    'precision mediump float;',
    'uniform vec3 uZen;',
    'uniform vec3 uHor;',
    'varying float vY;',
    'void main(){',
    '  float t = clamp(vY * 0.8 + 0.28, 0.0, 1.0);',
    '  t = t * t * (3.0 - 2.0 * t);',
    '  gl_FragColor = vec4(mix(uHor, uZen, t), 1.0);',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error('Polly Track shader: ' + gl.getShaderInfoLog(s));
    }
    return s;
  }
  function program(gl, vs, fs) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error('Polly Track link: ' + gl.getProgramInfoLog(p));
    }
    return p;
  }

  /* ---------------------------------------------- flat-shaded mesh helpers
     Every vertex is [x,y,z, r,g,b] — 24-byte stride, one interleaved buffer
     per static mesh. Lighting is baked per face at build time. */

  function tri(M, ax, ay, az, bx, by, bz, cx, cy, cz, col, mult, glow) {
    var ux = bx - ax, uy = by - ay, uz = bz - az;
    var vx = cx - ax, vy = cy - ay, vz = cz - az;
    var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    var l = Math.hypot(nx, ny, nz) || 1;
    var d = (nx * LX + ny * LY + nz * LZ) / l;
    var b = (glow ? 1 : (0.55 + 0.45 * Math.max(0, d))) * (mult == null ? 1 : mult);
    var r = Math.min(1, col[0] * b), g = Math.min(1, col[1] * b), bl = Math.min(1, col[2] * b);
    M.push(ax, ay, az, r, g, bl, bx, by, bz, r, g, bl, cx, cy, cz, r, g, bl);
  }

  // Corner order per face gives outward normals (matches Blockcraft's table).
  var BOX_FACES = [
    [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]],
    [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]],
    [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]],
    [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]],
    [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]],
    [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]]
  ];

  /** Axis-aligned-ish box; x,z centre, y bottom; optional yaw about centre. */
  function box(M, x, y, z, sx, sy, sz, yaw, col, mult, glow) {
    var c = Math.cos(yaw || 0), s = Math.sin(yaw || 0);
    function pt(k) {
      var lx = (k[0] - 0.5) * sx, ly = k[1] * sy, lz = (k[2] - 0.5) * sz;
      return [x + lx * c + lz * s, y + ly, z - lx * s + lz * c];
    }
    for (var f = 0; f < 6; f++) {
      var q = BOX_FACES[f];
      var a = pt(q[0]), b = pt(q[1]), cc = pt(q[2]), d = pt(q[3]);
      tri(M, a[0], a[1], a[2], b[0], b[1], b[2], cc[0], cc[1], cc[2], col, mult, glow);
      tri(M, a[0], a[1], a[2], cc[0], cc[1], cc[2], d[0], d[1], d[2], col, mult, glow);
    }
  }

  /** Low-poly cone: ring of `sides` base points up to an apex. */
  function cone(M, x, y, z, r, h, sides, col, mult, wobble, rand) {
    var pts = [];
    for (var i = 0; i < sides; i++) {
      var a = (i / sides) * Math.PI * 2;
      var rr = r * (wobble ? (0.75 + rand() * 0.5) : 1);
      pts.push([x + Math.cos(a) * rr, y, z + Math.sin(a) * rr]);
    }
    for (i = 0; i < sides; i++) {
      var p = pts[i], q = pts[(i + 1) % sides];
      tri(M, p[0], p[1], p[2], x, y + h, z, q[0], q[1], q[2], col, mult);
    }
  }

  /* ------------------------------------------- closed centripetal spline */

  function sampleSpline(pts, perSeg) {
    var n = pts.length, out = [];
    function dist(a, b) {
      return Math.max(0.0001, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
    }
    function lerpV(a, b, t) {
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    }
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i];
      var p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      var t0 = 0;
      var t1 = t0 + Math.sqrt(dist(p0, p1));
      var t2 = t1 + Math.sqrt(dist(p1, p2));
      var t3 = t2 + Math.sqrt(dist(p2, p3));
      for (var k = 0; k < perSeg; k++) {
        var t = t1 + (t2 - t1) * (k / perSeg);
        var a1 = lerpV(p0, p1, (t - t0) / (t1 - t0));
        var a2 = lerpV(p1, p2, (t - t1) / (t2 - t1));
        var a3 = lerpV(p2, p3, (t - t2) / (t3 - t2));
        var b1 = lerpV(a1, a2, (t - t0) / (t2 - t0));
        var b2 = lerpV(a2, a3, (t - t1) / (t3 - t1));
        out.push(lerpV(b1, b2, (t - t1) / (t2 - t1)));
      }
    }
    return out;
  }

  /* -------------------------------------------------------- track building
     buildTrack turns a track definition into sampled spline data plus the
     terrain / ground-height functions the physics and meshes share. */

  function buildTrack(T) {
    var U = window.Milo.util;
    var raw = sampleSpline(T.pts, 30);
    var N = raw.length;
    var sx = new Float32Array(N), sy = new Float32Array(N), sz = new Float32Array(N);
    var tx = new Float32Array(N), ty = new Float32Array(N), tz = new Float32Array(N);
    var nx = new Float32Array(N), nz = new Float32Array(N);
    var ss = new Float32Array(N);
    var i;
    for (i = 0; i < N; i++) { sx[i] = raw[i][0]; sy[i] = raw[i][1]; sz[i] = raw[i][2]; }
    var total = 0;
    for (i = 0; i < N; i++) {
      var a = (i - 1 + N) % N, b = (i + 1) % N;
      var dx = sx[b] - sx[a], dy = sy[b] - sy[a], dz = sz[b] - sz[a];
      var l = Math.hypot(dx, dy, dz) || 1;
      tx[i] = dx / l; ty[i] = dy / l; tz[i] = dz / l;
      var hl = Math.hypot(tx[i], tz[i]) || 1;
      nx[i] = tz[i] / hl; nz[i] = -tx[i] / hl;
      ss[i] = total;
      var j = (i + 1) % N;
      total += Math.hypot(sx[j] - sx[i], sy[j] - sy[i], sz[j] - sz[i]);
    }

    // World bounds (for the ground mesh + terrain edge fade).
    var minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    for (i = 0; i < N; i++) {
      if (sx[i] < minX) minX = sx[i]; if (sx[i] > maxX) maxX = sx[i];
      if (sz[i] < minZ) minZ = sz[i]; if (sz[i] > maxZ) maxZ = sz[i];
    }
    var PAD = 150;
    minX -= PAD; maxX += PAD; minZ -= PAD; maxZ += PAD;

    function terrain(x, z) {
      var u = (x - minX) / (maxX - minX), v = (z - minZ) / (maxZ - minZ);
      var edge = Math.min(u, 1 - u, v, 1 - v) / 0.18;
      edge = Math.max(0, Math.min(1, edge));
      edge = edge * edge * (3 - 2 * edge);
      var h = U.fbm(x * 0.013, z * 0.013, 3, T.seed) * T.terrAmp +
        U.fbm(x * 0.05, z * 0.05, 2, T.seed + 9) * T.terrAmp * 0.25;
      return h * edge;
    }

    /** Ground height given lateral distance from the road centre line. */
    function heightFor(off, roadY, x, z) {
      if (off <= 0) return roadY;
      if (off <= SHOULDER) return roadY - off * 0.12;
      var w = 1 - (off - SHOULDER) / 26;
      w = Math.max(0, Math.min(1, w));
      w = w * w * (3 - 2 * w);
      var t = terrain(x, z);
      return t + (roadY - 0.3 - t) * w;
    }

    /** Full scan; build-time only. Returns nearest sample idx (step-strided). */
    function nearestFull(x, z, step) {
      var best = 0, bd = 1e18;
      for (var k = 0; k < N; k += step) {
        var ddx = x - sx[k], ddz = z - sz[k];
        var d = ddx * ddx + ddz * ddz;
        if (d < bd) { bd = d; best = k; }
      }
      return best;
    }

    function groundBuild(x, z) {
      var k = nearestFull(x, z, 3);
      var off = Math.abs((x - sx[k]) * nx[k] + (z - sz[k]) * nz[k]);
      return heightFor(off, sy[k], x, z);
    }
    function roadDist(x, z) {
      var k = nearestFull(x, z, 3);
      return Math.hypot(x - sx[k], z - sz[k]);
    }

    // Checkpoint sample indices at even arc-length spacing.
    var cpIdx = [], cpS = [];
    for (i = 0; i < CPS; i++) {
      var target = i * total / CPS, k2 = 0;
      while (k2 < N - 1 && ss[k2 + 1] < target) k2++;
      cpIdx.push(k2);
      cpS.push(ss[k2]);
    }

    return {
      N: N, sx: sx, sy: sy, sz: sz, tx: tx, ty: ty, tz: tz, nx: nx, nz: nz,
      ss: ss, total: total,
      minX: minX, maxX: maxX, minZ: minZ, maxZ: maxZ,
      terrain: terrain, heightFor: heightFor,
      groundBuild: groundBuild, roadDist: roadDist,
      nearestFull: nearestFull,
      cpIdx: cpIdx, cpS: cpS
    };
  }

  /* ------------------------------------------------------- world geometry */

  function buildWorld(T, D) {
    var M = [];
    var rand = rng(T.seed);
    var half = T.roadHalf;
    var N = D.N, sx = D.sx, sy = D.sy, sz = D.sz, nx = D.nx, nz = D.nz;
    var road = hex(T.road), kerbA = hex(T.kerb[0]), kerbB = hex(T.kerb[1]);
    var dashC = hex(T.dash), postC = hex(T.post), gateC = hex(T.gate);
    var archC = hex(T.arch);
    var i, j;

    /** One road-strip quad between samples i and j, offsets oA (left) > oB. */
    function strip(i, j, oA, oB, lift, col, mult) {
      var ax = sx[i] + nx[i] * oA, ay = sy[i] + lift, az = sz[i] + nz[i] * oA;
      var bx = sx[i] + nx[i] * oB, by = sy[i] + lift, bz = sz[i] + nz[i] * oB;
      var cx = sx[j] + nx[j] * oB, cy = sy[j] + lift, cz = sz[j] + nz[j] * oB;
      var dx = sx[j] + nx[j] * oA, dy = sy[j] + lift, dz = sz[j] + nz[j] * oA;
      tri(M, ax, ay, az, bx, by, bz, cx, cy, cz, col, mult);
      tri(M, ax, ay, az, cx, cy, cz, dx, dy, dz, col, mult);
    }

    for (i = 0; i < N; i++) {
      j = (i + 1) % N;
      strip(i, j, half, -half, 0, road, (i % 2) ? 1 : 0.93);            // tarmac
      var kc = ((i >> 1) % 2) ? kerbA : kerbB;                          // kerbs
      strip(i, j, half + 0.8, half, 0.06, kc, 1);
      strip(i, j, -half, -half - 0.8, 0.06, ((i >> 1) % 2) ? kerbB : kerbA, 1);
      if (i % 6 < 3) strip(i, j, 0.18, -0.18, 0.02, dashC, 1);          // centre dashes
    }

    // Edge posts flanking the road.
    for (i = 0; i < N; i += 9) {
      for (var side = -1; side <= 1; side += 2) {
        var off = side * (half + 1.7);
        var px = sx[i] + nx[i] * off, pz = sz[i] + nz[i] * off;
        var py = D.heightFor(Math.abs(off) - half, sy[i], px, pz);
        box(M, px, py, pz, 0.22, 1.1, 0.22, 0, postC, 1);
        box(M, px, py + 1.1, pz, 0.26, 0.22, 0.26, 0, kerbA, 1, true);
      }
    }

    // Checkpoint gates (cp 1..CPS-1): posts with a glowing beacon cap.
    for (i = 1; i < CPS; i++) {
      var k = D.cpIdx[i];
      for (side = -1; side <= 1; side += 2) {
        off = side * (half + 1.2);
        px = sx[k] + nx[k] * off; pz = sz[k] + nz[k] * off;
        py = D.heightFor(Math.abs(off) - half, sy[k], px, pz);
        box(M, px, py, pz, 0.4, 3.4, 0.4, 0, gateC, 1);
        box(M, px, py + 3.4, pz, 0.7, 0.7, 0.7, 0, gateC, 1, true);
      }
    }

    // Start/finish arch with a chequered banner.
    var k0 = D.cpIdx[0];
    var archYaw = Math.atan2(nx[k0], nz[k0]);
    for (side = -1; side <= 1; side += 2) {
      off = side * (half + 1.8);
      px = sx[k0] + nx[k0] * off; pz = sz[k0] + nz[k0] * off;
      py = D.heightFor(Math.abs(off) - half, sy[k0], px, pz);
      box(M, px, py, pz, 1.0, 5.4, 1.0, archYaw, archC, 1);
    }
    var segs = 10, span = (half + 1.8) * 2;
    for (i = 0; i < segs; i++) {
      var f = -(half + 1.8) + span * (i + 0.5) / segs;
      px = sx[k0] + nx[k0] * f; pz = sz[k0] + nz[k0] * f;
      var cc = (i % 2) ? [0.95, 0.95, 0.95] : [0.08, 0.08, 0.1];
      box(M, px, sy[k0] + 5.4, pz, span / segs + 0.05, 1.0, 0.7, archYaw, cc, 1, true);
    }

    // Ground: one coarse heightfield grid, per-triangle colour jitter.
    var G = 46;
    var gy = [];
    for (j = 0; j <= G; j++) {
      for (i = 0; i <= G; i++) {
        var gx = D.minX + (D.maxX - D.minX) * i / G;
        var gz = D.minZ + (D.maxZ - D.minZ) * j / G;
        gy.push(D.groundBuild(gx, gz));
      }
    }
    var lo = hex(T.groundLo), hi = hex(T.groundHi);
    function gCol(h, r) {
      var t = Math.max(0, Math.min(1, h / (T.terrAmp || 1)));
      var m = 0.9 + r * 0.2;
      return [
        (lo[0] + (hi[0] - lo[0]) * t) * m,
        (lo[1] + (hi[1] - lo[1]) * t) * m,
        (lo[2] + (hi[2] - lo[2]) * t) * m
      ];
    }
    for (j = 0; j < G; j++) {
      for (i = 0; i < G; i++) {
        var x0 = D.minX + (D.maxX - D.minX) * i / G;
        var x1 = D.minX + (D.maxX - D.minX) * (i + 1) / G;
        var z0 = D.minZ + (D.maxZ - D.minZ) * j / G;
        var z1 = D.minZ + (D.maxZ - D.minZ) * (j + 1) / G;
        var y00 = gy[j * (G + 1) + i], y10 = gy[j * (G + 1) + i + 1];
        var y01 = gy[(j + 1) * (G + 1) + i], y11 = gy[(j + 1) * (G + 1) + i + 1];
        var c1 = gCol((y00 + y10 + y11) / 3, rand());
        var c2 = gCol((y00 + y11 + y01) / 3, rand());
        if ((i + j) % 2) {
          tri(M, x0, y00, z0, x0, y01, z1, x1, y10, z0, c1);
          tri(M, x1, y10, z0, x0, y01, z1, x1, y11, z1, c2);
        } else {
          tri(M, x0, y00, z0, x0, y01, z1, x1, y11, z1, c1);
          tri(M, x0, y00, z0, x1, y11, z1, x1, y10, z0, c2);
        }
      }
    }
    // A huge fog-coloured base plate so the horizon never shows a hard edge.
    var B = 1400, gb = hex(T.groundLo);
    tri(M, -B, -0.6, -B, -B, -0.6, B, B, -0.6, -B, gb, 0.9);
    tri(M, B, -0.6, -B, -B, -0.6, B, B, -0.6, B, gb, 0.9);

    T.scenery(M, T, D, rand);

    return new Float32Array(M);
  }

  /* ------------------------------------------------------ scenery builders */

  function place(D, T, rand, minD, tries, fn) {
    for (var t = 0; t < tries; t++) {
      var x = D.minX + 40 + rand() * (D.maxX - D.minX - 80);
      var z = D.minZ + 40 + rand() * (D.maxZ - D.minZ - 80);
      var d = D.roadDist(x, z);
      if (d < minD) continue;
      fn(x, D.groundBuild(x, z) - 0.25, z, d);
    }
  }

  function treeAt(M, x, y, z, s, fol, trunk, rand) {
    box(M, x, y, z, 0.5 * s, 1.5 * s, 0.5 * s, rand() * 3, trunk, 1);
    cone(M, x, y + 1.2 * s, z, 1.7 * s, 3.4 * s, 6, fol, 0.9 + rand() * 0.2, true, rand);
  }

  function sceneryMeadow(M, T, D, rand) {
    var folA = hex('#3f9142'), folB = hex('#63b34f'), trunk = hex('#7a5230');
    var rock = hex('#9aa08a'), hill = hex('#78b45c');
    place(D, T, rand, T.roadHalf + 8, 150, function (x, y, z, d) {
      var r = rand();
      if (d > 55 && r < 0.22) cone(M, x, y, z, 16 + rand() * 14, 6 + rand() * 8, 7, hill, 1, true, rand);
      else if (r < 0.72) treeAt(M, x, y, z, 0.8 + rand() * 0.9, rand() < 0.5 ? folA : folB, trunk, rand);
      else if (r < 0.88) cone(M, x, y, z, 1.2 + rand() * 2, 1 + rand() * 2.4, 5, rock, 1, true, rand);
      else cone(M, x, y, z, 0.9 + rand(), 0.9 + rand(), 5, folB, 1.05, true, rand);
    });
  }

  function sceneryCanyon(M, T, D, rand) {
    var rockA = hex('#b0563a'), rockB = hex('#c4714e'), cap = hex('#d9955f');
    var cactus = hex('#4e9c53');
    // Canyon walls: mesa towers marching along both sides of the road.
    for (var i = 0; i < D.N; i += 11) {
      for (var side = -1; side <= 1; side += 2) {
        if (rand() < 0.25) continue;
        var off = side * (T.roadHalf + 9 + rand() * 9);
        var x = D.sx[i] + D.nx[i] * off, z = D.sz[i] + D.nz[i] * off;
        var y = D.groundBuild(x, z) - 0.4;
        var w = 5 + rand() * 5, h = 7 + rand() * 9;
        var col = rand() < 0.5 ? rockA : rockB;
        box(M, x, y, z, w, h, w, rand() * 3, col, 0.95 + rand() * 0.15);
        box(M, x, y + h, z, w * 0.72, h * 0.32, w * 0.72, rand() * 3, cap, 1);
      }
    }
    place(D, T, rand, T.roadHalf + 24, 90, function (x, y, z, d) {
      var r = rand();
      if (r < 0.5) {
        var w = 7 + rand() * 9, h = 10 + rand() * 14;
        box(M, x, y, z, w, h, w, rand() * 3, rand() < 0.5 ? rockA : rockB, 1);
        box(M, x, y + h, z, w * 0.7, h * 0.3, w * 0.7, rand() * 3, cap, 1);
      } else if (r < 0.8) {
        cone(M, x, y, z, 2.5 + rand() * 3, 5 + rand() * 8, 5, rockB, 1, true, rand);
      } else {
        box(M, x, y, z, 0.7, 2.4 + rand() * 1.4, 0.7, rand(), cactus, 1);
        box(M, x + 0.5, y + 1.1, z, 1.1, 0.5, 0.5, 0, cactus, 0.92);
        box(M, x + 0.9, y + 1.1, z, 0.5, 1.2, 0.5, 0, cactus, 0.96);
      }
    });
  }

  function sceneryAlpine(M, T, D, rand) {
    var pine = hex('#2f6b46'), pineSnow = hex('#dfe9f2'), trunk = hex('#5d4a33');
    var boulder = hex('#8f98a5'), drift = hex('#f4f8fd');
    place(D, T, rand, T.roadHalf + 8, 170, function (x, y, z, d) {
      var r = rand();
      if (d > 60 && r < 0.2) {
        cone(M, x, y, z, 18 + rand() * 16, 12 + rand() * 14, 7, drift, 1, true, rand);
      } else if (r < 0.7) {
        var s = 0.8 + rand();
        box(M, x, y, z, 0.5 * s, 1.2 * s, 0.5 * s, rand() * 3, trunk, 1);
        cone(M, x, y + s, z, 1.9 * s, 2.6 * s, 6, pine, 0.95, true, rand);
        cone(M, x, y + s + 1.6 * s, z, 1.4 * s, 2.1 * s, 6, pine, 1.05, true, rand);
        cone(M, x, y + s + 3.1 * s, z, 0.9 * s, 1.5 * s, 5, pineSnow, 1, true, rand);
      } else if (r < 0.88) {
        cone(M, x, y, z, 1.5 + rand() * 2.5, 1.4 + rand() * 2.6, 5, boulder, 1, true, rand);
      } else {
        cone(M, x, y, z, 2 + rand() * 3, 0.8 + rand(), 6, drift, 1, true, rand);
      }
    });
  }

  /* ---------------------------------------------------------- car + beacon */

  function buildCar(T) {
    var M = [];
    var body = hex(T.car), dark = hex('#1d2430'), wheel = hex('#15171c');
    var trim = hex('#f2f4f8');
    box(M, 0, 0.32, 0, 1.7, 0.5, 3.4, 0, body, 1);               // body
    box(M, 0, 0.34, 1.55, 1.5, 0.3, 0.6, 0, body, 0.85);          // nose
    box(M, 0, 0.82, -0.25, 1.28, 0.5, 1.5, 0, dark, 1);           // cabin
    box(M, 0, 0.86, -1.55, 1.6, 0.14, 0.5, 0, body, 0.9);         // spoiler base
    box(M, 0, 1.0, -1.62, 1.7, 0.12, 0.34, 0, dark, 1);           // spoiler wing
    box(M, 0, 0.84, 0.6, 1.1, 0.08, 0.7, 0, trim, 1);             // roof stripe
    var i, sx2, sz2;
    for (i = 0; i < 4; i++) {
      sx2 = (i % 2) ? 0.82 : -0.82;
      sz2 = (i < 2) ? 1.05 : -1.15;
      box(M, sx2, 0.02, sz2, 0.34, 0.56, 0.62, 0, wheel, 1);
    }
    return new Float32Array(M);
  }

  function buildBeacon(T) {
    var M = [];
    var c = hex(T.beacon);
    var r = 1.0, h = 1.4;
    var ring = [[r, 0, 0], [0, 0, r], [-r, 0, 0], [0, 0, -r]];
    for (var i = 0; i < 4; i++) {
      var p = ring[i], q = ring[(i + 1) % 4];
      tri(M, p[0], 0, p[2], 0, h, 0, q[0], 0, q[2], c, 1, true);
      tri(M, p[0], 0, p[2], q[0], 0, q[2], 0, -h, 0, c, 0.75, true);
    }
    return new Float32Array(M);
  }

  /* -------------------------------------------------------------- the game */

  function fmtRace(t) {
    if (t < 0) t = 0;
    var m = Math.floor(t / 60), s = t - m * 60;
    return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2);
  }
  function fmtHud(t) {
    if (t < 0) t = 0;
    var m = Math.floor(t / 60), s = t - m * 60;
    return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1);
  }

  function makeMount(T) {
    return function mount(host) {
      var Milo = window.Milo;
      var D = buildTrack(T);

      var prog = null, skyProg = null;
      var loc = {}, skyLoc = {};
      var worldBuf = null, worldCount = 0;
      var carBuf = null, carCount = 0;
      var beaconBuf = null, beaconCount = 0;
      var skyBuf = null;

      var zen = hex(T.sky[0]), hor = hex(T.sky[1]);

      // Car state
      var car = {
        x: 0, y: 0, z: 0, h: 0,       // position + heading
        vx: 0, vz: 0, s: 0,           // velocity vector + engine speed
        pitch: 0, roll: 0, idx: 0
      };
      var cam = { x: 0, y: 6, z: -12, yaw: 0 };
      var race = {
        lap: 1, nextCp: 1, time: 0, lapStart: 0, cd: 3.2,
        prevS: 0, lastCpIdx: 0, wrong: 0, done: false, offRoad: false
      };
      var msgT = 0;

      // HUD message element — built detached (glGame primes during mount),
      // attached to g.hud afterwards, same trick Blockcraft uses.
      var msgEl = document.createElement('div');
      msgEl.style.cssText = 'position:absolute;left:0;right:0;top:16%;text-align:center;' +
        'pointer-events:none;z-index:6;font-weight:800;font-size:2.2rem;color:#fff;' +
        'text-shadow:0 2px 10px rgba(0,0,0,.55);opacity:0;transition:opacity .15s;' +
        'font-family:inherit;letter-spacing:.04em';

      function msg(text, dur) {
        msgEl.textContent = text;
        msgT = dur || 1.4;
        msgEl.style.opacity = '1';
      }

      var startText = T.blurb + ' Three timed laps — hit every checkpoint gate in ' +
        'order (cutting doesn’t count), and keep it on the tarmac: ' +
        T.surface + ' scrubs your speed off fast.';

      var cfg = {
        id: T.id,
        stats: ['Speed', 'Lap', 'Time'],
        scoreLabel: 'pts',
        pointerLock: false,
        touch: 'dpad',
        touchButtons: [{ key: 'reset', label: 'RESET' }],
        start: {
          emo: T.emo,
          title: T.title,
          text: startText,
          keys: ['W/↑ accelerate', 'S/↓ brake · reverse', 'A/D or ←/→ steer', 'R back to checkpoint'],
          hint: 'Press Space to launch'
        },
        preload: function (g) { setup(g); },
        init: function (g) { reset(g); },
        frame: function (g, dt) { frame(g, dt); },
        destroy: function () { }
      };

      var runner = Milo.glGame(host, cfg);
      var g = runner.g;
      if (!g) return runner;      // WebGL unavailable — glGame showed a notice
      g.hud.appendChild(msgEl);

      /* --- GL setup (once) --- */
      function setup(g) {
        var gl = g.gl;
        prog = program(gl, MAIN_VS, MAIN_FS);
        skyProg = program(gl, SKY_VS, SKY_FS);
        loc = {
          pos: gl.getAttribLocation(prog, 'aPos'),
          col: gl.getAttribLocation(prog, 'aCol'),
          pv: gl.getUniformLocation(prog, 'uPV'),
          model: gl.getUniformLocation(prog, 'uModel'),
          eye: gl.getUniformLocation(prog, 'uEye'),
          fogRange: gl.getUniformLocation(prog, 'uFogRange'),
          fogCol: gl.getUniformLocation(prog, 'uFogCol')
        };
        skyLoc = {
          pos: gl.getAttribLocation(skyProg, 'aPos'),
          zen: gl.getUniformLocation(skyProg, 'uZen'),
          hor: gl.getUniformLocation(skyProg, 'uHor')
        };

        function upload(arr) {
          var b = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, b);
          gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
          return b;
        }
        var world = buildWorld(T, D);
        worldBuf = upload(world); worldCount = world.length / 6;
        var carM = buildCar(T);
        carBuf = upload(carM); carCount = carM.length / 6;
        var bec = buildBeacon(T);
        beaconBuf = upload(bec); beaconCount = bec.length / 6;
        skyBuf = upload(new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]));

        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(hor[0], hor[1], hor[2], 1);
      }

      /* --- race reset --- */
      function placeAt(idx) {
        car.x = D.sx[idx]; car.z = D.sz[idx]; car.y = D.sy[idx];
        var hl = Math.hypot(D.tx[idx], D.tz[idx]) || 1;
        car.h = Math.atan2(D.tx[idx] / hl, D.tz[idx] / hl);
        car.vx = car.vz = car.s = 0;
        car.pitch = car.roll = 0;
        car.idx = idx;
        race.prevS = D.ss[idx];
        // Snap the chase camera straight behind the car.
        cam.yaw = car.h;
        cam.x = car.x - Math.sin(car.h) * 11;
        cam.z = car.z - Math.cos(car.h) * 11;
        cam.y = car.y + 4.6;
      }

      function reset(g) {
        var spawn = (D.cpIdx[0] + 4) % D.N;
        placeAt(spawn);
        race.lap = 1; race.nextCp = 1; race.time = 0; race.lapStart = 0;
        race.cd = 3.2; race.lastCpIdx = spawn; race.wrong = 0;
        race.done = false; race.offRoad = false;
        msgT = 0; msgEl.style.opacity = '0';
        g.set('Speed', '0 km/h');
        g.set('Lap', '1/' + LAPS);
        g.set('Time', '0:00.0');
        // Show your best on the start overlay, formatted as a real time.
        var best = Milo.store.get('polly:best:' + T.id, 0);
        cfg.start.text = startText +
          (best ? ' Track best so far: ' + fmtRace(best / 1000) + '.' : '');
      }

      /* --- physics helpers --- */
      function nearest(x, z, hint, win) {
        var best = hint, bd = 1e18;
        for (var o = -win; o <= win; o++) {
          var k = ((hint + o) % D.N + D.N) % D.N;
          var dx = x - D.sx[k], dz = z - D.sz[k];
          var d = dx * dx + dz * dz;
          if (d < bd) { bd = d; best = k; }
        }
        return best;
      }

      function groundAt(x, z, hint) {
        var k = nearest(x, z, hint, 40);
        var off = Math.abs((x - D.sx[k]) * D.nx[k] + (z - D.sz[k]) * D.nz[k]);
        var hl = Math.hypot(D.tx[k], D.tz[k]) || 1;
        var along = (x - D.sx[k]) * (D.tx[k] / hl) + (z - D.sz[k]) * (D.tz[k] / hl);
        var roadY = D.sy[k] + along * (D.ty[k] / hl);
        return D.heightFor(off, roadY, x, z);
      }

      function finishRace(g) {
        race.done = true;
        var totalMs = Math.round(race.time * 1000);
        var key = 'polly:best:' + T.id;
        var prev = Milo.store.get(key, 0);
        var newBest = !prev || totalMs < prev;
        if (newBest) Milo.store.set(key, totalMs);
        g.score = Math.max(1, 600000 - totalMs);
        g.win({
          emo: '🏆',
          title: 'Race Complete!',
          score: g.score,
          text: 'Three laps of ' + T.title + ' in ' + fmtRace(race.time) +
            (newBest ? ' — new track record!' :
              ' · your record is ' + fmtRace(prev / 1000))
        });
      }

      /* --- per-frame update (play state only) --- */
      function update(g, dt) {
        var inp = g.input;

        // Countdown lights
        if (race.cd > 0) {
          var before = Math.ceil(race.cd);
          race.cd -= dt;
          var after = Math.ceil(race.cd);
          if (after < before) {
            if (after > 0) { msg('' + after, 0.9); Milo.sound.blip(); }
            else { msg('GO!', 1.0); Milo.sound.tone({ f: 660, f2: 990, d: .25, v: .12, type: 'square' }); }
          }
          if (race.cd > 0) {
            g.set('Time', '0:00.0');
            fadeMsg(dt);
            return;
          }
        }

        race.time += dt;

        // Reset to last checkpoint
        if (inp.pressed('KeyR') || inp.pressed('reset')) {
          placeAt(race.lastCpIdx);
          msg('Back to checkpoint', 1.2);
          Milo.sound.click();
        }

        var up = inp.down('up'), down = inp.down('down');
        var steer = (inp.down('left') ? 1 : 0) - (inp.down('right') ? 1 : 0);

        // Track-relative frame
        var k = nearest(car.x, car.z, car.idx, 28);
        car.idx = k;
        var lat = (car.x - D.sx[k]) * D.nx[k] + (car.z - D.sz[k]) * D.nz[k];
        var off = Math.abs(lat) - T.roadHalf;
        var onRoad = off <= 0.6;
        if (onRoad !== !race.offRoad) { /* state flip handled below */ }
        if (!onRoad && !race.offRoad && Math.abs(car.s) > 8) {
          Milo.sound.tone({ f: 150, f2: 90, d: .12, v: .07, type: 'sawtooth' });
        }
        race.offRoad = !onRoad;

        // Engine speed scalar
        var max = T.maxSpeed;
        if (up) car.s += 30 * Math.max(0.25, 1 - Math.max(0, car.s) / max) * dt;
        if (down) {
          if (car.s > 0.5) car.s -= 55 * dt;
          else car.s -= 16 * dt;             // reverse
        }
        if (!up && !down) car.s -= car.s * 0.45 * dt;
        // Off the road the surface eats your speed.
        if (!onRoad) {
          var offMax = max * T.offMax;
          if (Math.abs(car.s) > offMax) car.s -= car.s * 2.8 * dt;
        }
        car.s = Math.max(-13, Math.min(max, car.s));

        // Steering (speed-sensitive; flips in reverse)
        var sp = Math.abs(car.s);
        var rate = T.steer * Math.min(1, sp / 11) * (1 - 0.38 * sp / max);
        car.h += steer * rate * (car.s < 0 ? -1 : 1) * dt;

        // Velocity chases the heading — grip drops with speed for light drift.
        var fx = Math.sin(car.h), fz = Math.cos(car.h);
        var grip = onRoad
          ? T.grip[0] - (T.grip[0] - T.grip[1]) * Math.min(1, sp / max)
          : T.offGrip;
        var gf = Math.min(1, grip * dt);
        car.vx += (fx * car.s - car.vx) * gf;
        car.vz += (fz * car.s - car.vz) * gf;
        car.x += car.vx * dt;
        car.z += car.vz * dt;
        car.x = Math.max(D.minX + 6, Math.min(D.maxX - 6, car.x));
        car.z = Math.max(D.minZ + 6, Math.min(D.maxZ - 6, car.z));

        // Follow the ground; lean into drift; pitch with the slope.
        var gy = groundAt(car.x, car.z, car.idx);
        car.y += (gy - car.y) * Math.min(1, 11 * dt);
        var yA = groundAt(car.x + fx * 1.7, car.z + fz * 1.7, car.idx);
        var yB = groundAt(car.x - fx * 1.7, car.z - fz * 1.7, car.idx);
        var slip = (car.vx * fz - car.vz * fx) / Math.max(4, sp);   // signed side-slip
        car.pitch += (-Math.atan2(yA - yB, 3.4) - car.pitch) * Math.min(1, 8 * dt);
        car.roll += (slip * 0.5 - car.roll) * Math.min(1, 8 * dt);

        // Rescue a car that has wandered far off the map.
        if (Math.abs(lat) > 70) {
          placeAt(race.lastCpIdx);
          msg('Rescued — stay on the road!', 1.6);
          Milo.sound.hit();
        }

        // Progress + ordered checkpoints
        var hl = Math.hypot(D.tx[k], D.tz[k]) || 1;
        var along = (car.x - D.sx[k]) * (D.tx[k] / hl) + (car.z - D.sz[k]) * (D.tz[k] / hl);
        var s = D.ss[k] + along;
        var L = D.total;
        var ds = s - race.prevS;
        if (ds > L / 2) ds -= L;
        if (ds < -L / 2) ds += L;
        if (ds > 0.0001) {
          var rel = D.cpS[race.nextCp] - race.prevS;
          rel = ((rel % L) + L) % L;
          if (rel <= ds && Math.abs(lat) < T.roadHalf + 2.2) {
            race.lastCpIdx = D.cpIdx[race.nextCp];
            if (race.nextCp === 0) {
              var lapT = race.time - race.lapStart;
              race.lapStart = race.time;
              race.lap++;
              if (race.lap > LAPS) { finishRace(g); return; }
              msg('Lap ' + race.lap + '/' + LAPS + '  ·  ' + fmtRace(lapT), 2.0);
              Milo.sound.powerup();
              race.nextCp = 1;
            } else {
              msg('Checkpoint ' + race.nextCp + '/' + (CPS - 1), 0.9);
              Milo.sound.coin();
              race.nextCp = (race.nextCp + 1) % CPS;
            }
          }
        }
        // Wrong-way nag
        if (ds < -0.02 && sp > 5) race.wrong += dt; else race.wrong = 0;
        if (race.wrong > 1.1) msg('WRONG WAY!', 0.3);
        race.prevS = s;

        // Chase camera with lag
        var dy2 = car.h - cam.yaw;
        while (dy2 > Math.PI) dy2 -= Math.PI * 2;
        while (dy2 < -Math.PI) dy2 += Math.PI * 2;
        cam.yaw += dy2 * Math.min(1, 4.5 * dt);
        var cfx = Math.sin(cam.yaw), cfz = Math.cos(cam.yaw);
        var back = 10.5 + sp * 0.05;
        var wx = car.x - cfx * back, wz = car.z - cfz * back;
        var wy = car.y + 4.4;
        var camGround = groundAt(wx, wz, car.idx) + 1.4;
        if (wy < camGround) wy = camGround;
        cam.x += (wx - cam.x) * Math.min(1, 7 * dt);
        cam.z += (wz - cam.z) * Math.min(1, 7 * dt);
        cam.y += (wy - cam.y) * Math.min(1, 6 * dt);

        // HUD
        var kmh = Math.round(Math.hypot(car.vx, car.vz) * 2.9);
        g.set('Speed', kmh + ' km/h');
        g.set('Lap', Math.min(race.lap, LAPS) + '/' + LAPS);
        g.set('Time', fmtHud(race.time));

        fadeMsg(dt);
      }

      function fadeMsg(dt) {
        if (msgT > 0) {
          msgT -= dt;
          if (msgT <= 0) msgEl.style.opacity = '0';
        }
      }

      /* --- render --- */
      function drawMesh(gl, buf, count, model) {
        gl.uniformMatrix4fv(loc.model, false, model);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, 24, 0);
        gl.vertexAttribPointer(loc.col, 3, gl.FLOAT, false, 24, 12);
        gl.drawArrays(gl.TRIANGLES, 0, count);
      }

      function render(g) {
        var gl = g.gl;
        if (!prog) return;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Sky gradient (fills the background, no depth writes)
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        gl.useProgram(skyProg);
        gl.uniform3f(skyLoc.zen, zen[0], zen[1], zen[2]);
        gl.uniform3f(skyLoc.hor, hor[0], hor[1], hor[2]);
        gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf);
        gl.enableVertexAttribArray(skyLoc.pos);
        gl.vertexAttribPointer(skyLoc.pos, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.disableVertexAttribArray(skyLoc.pos);
        gl.depthMask(true);
        gl.enable(gl.DEPTH_TEST);

        var sp = Math.hypot(car.vx, car.vz);
        var fov = 1.05 + 0.22 * Math.min(1, sp / T.maxSpeed);
        var proj = m4perspective(fov, Math.max(0.2, g.W / g.H), 0.3, 900);
        var lx = car.x + Math.sin(cam.yaw) * 5, lz = car.z + Math.cos(cam.yaw) * 5;
        var view = m4view(cam.x, cam.y, cam.z, lx, car.y + 1.3, lz);
        var pv = m4mul(proj, view);

        gl.useProgram(prog);
        gl.uniformMatrix4fv(loc.pv, false, pv);
        gl.uniform3f(loc.eye, cam.x, cam.y, cam.z);
        gl.uniform2f(loc.fogRange, T.fogFar * 0.22, T.fogFar);
        gl.uniform3f(loc.fogCol, hor[0], hor[1], hor[2]);
        gl.enableVertexAttribArray(loc.pos);
        gl.enableVertexAttribArray(loc.col);

        drawMesh(gl, worldBuf, worldCount, M4ID);

        var carModel = m4mul(
          m4translate(car.x, car.y, car.z),
          m4mul(m4rotY(car.h), m4mul(m4rotX(car.pitch), m4rotZ(car.roll)))
        );
        drawMesh(gl, carBuf, carCount, carModel);

        if (!race.done) {
          var bi = D.cpIdx[race.nextCp];
          var bob = Math.sin(g.t * 2.4) * 0.4;
          var beaconModel = m4mul(
            m4translate(D.sx[bi], D.sy[bi] + 5.6 + bob, D.sz[bi]),
            m4rotY(g.t * 2.2)
          );
          drawMesh(gl, beaconBuf, beaconCount, beaconModel);
        }

        gl.disableVertexAttribArray(loc.pos);
        gl.disableVertexAttribArray(loc.col);
      }

      function frame(g, dt) {
        if (g.state === 'play' && !race.done) update(g, dt);
        render(g);
      }

      return runner;
    };
  }

  /* ------------------------------------------------------------ the tracks */

  var SUNRISE = {
    id: 'polly-track',
    title: 'Polly Track',
    emo: '🏁',
    seed: 11,
    pts: [
      [0, 0, 0], [60, 1, -15], [120, 3, -10], [170, 4, -40], [200, 5, -90],
      [180, 6, -150], [120, 4, -170], [70, 2, -140], [30, 2, -170],
      [-30, 3, -200], [-90, 5, -180], [-120, 6, -120], [-100, 3, -60], [-60, 1, -20]
    ],
    roadHalf: 5, maxSpeed: 62, offMax: 0.34,
    grip: [6.2, 2.7], offGrip: 2.1, steer: 2.05,
    terrAmp: 7, fogFar: 340,
    sky: ['#6f9fe8', '#ffd9a8'],
    road: '#565b66', kerb: ['#e84545', '#f5f3ef'], dash: '#f7e9b0',
    post: '#f4f4f4', gate: '#2ec4b6', arch: '#e84545', beacon: '#ffd166',
    groundLo: '#79c05e', groundHi: '#57a24b',
    car: '#e84545',
    scenery: sceneryMeadow,
    surface: 'the grass',
    blurb: 'Sunrise Circuit: wide flowing sweepers and one cheeky chicane, rolling ' +
      'over sunlit meadows with the whole valley glowing gold.'
  };

  var CANYON = {
    id: 'polly-track-canyon',
    title: 'Polly Track: Canyon',
    emo: '🏜️',
    seed: 47,
    pts: [
      [0, 0, 0], [50, 1, -10], [85, 2, -45], [60, 3, -85], [90, 4, -120],
      [60, 5, -160], [10, 4, -150], [-20, 5, -185], [-70, 4, -165],
      [-60, 3, -115], [-95, 2, -80], [-70, 1, -40], [-30, 0, -25]
    ],
    roadHalf: 4.4, maxSpeed: 54, offMax: 0.3,
    grip: [6.6, 2.9], offGrip: 1.8, steer: 2.35,
    terrAmp: 9, fogFar: 300,
    sky: ['#eaa45e', '#ffe3b0'],
    road: '#6b5a4d', kerb: ['#d9541f', '#ffe8c9'], dash: '#ffe8c9',
    post: '#f7ead2', gate: '#ffb703', arch: '#d9541f', beacon: '#ffdd55',
    groundLo: '#d9a868', groundHi: '#c07a4a',
    car: '#2f6db3',
    scenery: sceneryCanyon,
    surface: 'the sand',
    blurb: 'A twisty ribbon threaded between mesa walls at dusk — chicane after ' +
      'chicane with barely a straight to breathe on.'
  };

  var ALPINE = {
    id: 'polly-track-alpine',
    title: 'Polly Track: Alpine',
    emo: '🏔️',
    seed: 83,
    pts: [
      [0, 16, 0], [90, 13, -8], [180, 9, -14], [245, 7, -40], [258, 6, -85],
      [225, 5, -118], [172, 5, -108], [110, 7, -88], [45, 8, -72],
      [-15, 7, -88], [-60, 5, -120], [-50, 3, -165], [-90, 3, -190],
      [-140, 5, -160], [-155, 8, -100], [-140, 11, -45], [-85, 14, -12]
    ],
    roadHalf: 5, maxSpeed: 68, offMax: 0.3,
    grip: [5.9, 2.5], offGrip: 1.9, steer: 2.1,
    terrAmp: 12, fogFar: 380,
    sky: ['#7fb2f0', '#eaf4ff'],
    road: '#4c525e', kerb: ['#d94b5c', '#ffffff'], dash: '#cfd8e6',
    post: '#d94b5c', gate: '#4cc9f0', arch: '#d94b5c', beacon: '#ffd166',
    groundLo: '#eef3fa', groundHi: '#c9d6e6',
    car: '#ff7b3a',
    scenery: sceneryAlpine,
    surface: 'the snow',
    blurb: 'A mountain descent: two long flat-out straights dropping off the ' +
      'summit plateau, stitched together by a pair of brutal hairpins.'
  };

  window.Milo.register({
    id: 'polly-track',
    title: 'Polly Track',
    emo: '🏁',
    category: 'Racing',
    tagline: 'Low-poly 3D time trials over a sunlit circuit',
    description: 'Sunrise Circuit is the track that teaches you the game: wide ' +
      'flowing sweepers over rolling green hills where you can hold the throttle ' +
      'and let the back end drift wide, plus one chicane that punishes greed. ' +
      'Three laps against the clock, six checkpoint gates a lap that must be taken ' +
      'in order — cutting across the grass kills your speed and skips nothing. ' +
      'Tip: brake before the chicane, not in it, and ride the kerbs on exit ' +
      'to keep your record run alive.',
    controls: ['W/S or ↑/↓', 'A/D or ←/→', 'R reset'],
    colors: ['#ff9d5c', '#6f9fe8'],
    featured: true,
    scoreLabel: 'pts',
    tags: ['racing', '3d', 'low-poly', 'time-trial', 'drift'],
    mount: makeMount(SUNRISE)
  });

  window.Milo.register({
    id: 'polly-track-canyon',
    title: 'Polly Track: Canyon',
    emo: '🏜️',
    category: 'Racing',
    tagline: 'Tight desert switchbacks between the mesa walls',
    description: 'The technical one. Canyon is all second-gear corners — a ' +
      'narrower ribbon of road snaking between red rock towers, where the ' +
      'chicanes come so fast you set up for the next apex mid-drift. The clock ' +
      'and the checkpoint gates are merciless: run wide into the sand and your ' +
      'speed evaporates, so smooth beats brave here. Tip: a quick dab of brake ' +
      'as you turn in rotates the car and lines you up two corners ahead.',
    controls: ['W/S or ↑/↓', 'A/D or ←/→', 'R reset'],
    colors: ['#ffb703', '#b5533c'],
    scoreLabel: 'pts',
    tags: ['racing', '3d', 'low-poly', 'time-trial', 'drift'],
    mount: makeMount(CANYON)
  });

  window.Milo.register({
    id: 'polly-track-alpine',
    title: 'Polly Track: Alpine',
    emo: '🏔️',
    category: 'Racing',
    tagline: 'Flat-out downhill straights into brutal hairpins',
    description: 'The fast one. Alpine starts on a summit plateau and just falls ' +
      'away — two huge downhill straights where you brush the speed cap, each ' +
      'ending in a hairpin that arrives much sooner than your braking distance ' +
      'thinks it does. Snow off the racing line is fatal to a lap time, and the ' +
      'climb back to the finish makes every scrap of exit speed count over three ' +
      'laps. Tip: hug the inside gate post at the hairpins and use R the moment ' +
      'a run goes into the powder — the clock never stops.',
    controls: ['W/S or ↑/↓', 'A/D or ←/→', 'R reset'],
    colors: ['#4cc9f0', '#4a5d8f'],
    scoreLabel: 'pts',
    tags: ['racing', '3d', 'low-poly', 'time-trial', 'drift'],
    mount: makeMount(ALPINE)
  });
})();
