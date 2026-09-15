/**
 * Turbo Drift — low-poly 3D circuit racing across fifty generated tracks,
 * with a garage of ten cars and six tuning branches to spend winnings on.
 *
 * Tracks come from Milo.racing's seeded generator; the seeds below are the
 * ones that passed the drivability validator (closed loop, no self-overlap,
 * every corner inside the car's turning circle), so all fifty are raceable.
 */
(function () {
  'use strict';
  var Milo = window.Milo, R = Milo.racing, M = Milo.mat4;

  /* ------------------------------------------------------------- tracks */

  // name, theme, seed, difficulty, laps, radius, amp, chic, hill, hillFreq,
  // lobes, width, bank, jumps, boosts, tunnels, narrow, walls
  var TRACK_ROWS = [
    ['Sunset Bay', 'dawn', 191729, 1, 2, 393, 0.103, 0, 1.43, 4, 4, 24.4, 27, 2, 1, 0, 0, 1, 4, 0.68],
    ['Meadow Loop', 'desert', 95117, 1, 2, 401, 0.068, 0, 0.46, 5, 3, 24.8, 20, 1, 2, 0, 0, 1, 5, 0.62],
    ['First Light', 'space', 103234, 1, 2, 396, 0.085, 0.003, 2.69, 3, 4, 23.8, 24, 2, 2, 0, 0, 1, 7, 0.59],
    ['Harbour Mile', 'ocean', 111351, 1, 2, 401, 0.112, 0.002, 3.29, 2, 3, 23.7, 29, 1, 2, 0, 0, 1, 5, 0.56],
    ['Green Circuit', 'night', 119468, 1, 2, 396, 0.08, 0, 2.34, 3, 4, 24.9, 22, 2, 2, 0, 0, 1, 5, 0.46],
    ['Quiet Run', 'grass', 127585, 1, 2, 399, 0.086, 0, 3.87, 4, 2, 25.3, 27, 1, 1, 0, 0, 1, 5, 0.54],
    ['Low Tide', 'snow', 135702, 1, 2, 407, 0.089, 0.01, 2.73, 5, 2, 25.1, 21, 2, 1, 0, 0, 1, 5, 0.58],
    ['Foothill', 'volcano', 143819, 1, 2, 404, 0.094, 0.008, 3.25, 3, 4, 23.2, 23, 1, 2, 0, 0, 1, 7, 0.7],
    ['Copper Flats', 'dawn', 151936, 1, 2, 405, 0.075, 0.011, 3.19, 4, 2, 24.6, 22, 1, 1, 0, 0, 1, 7, 0.63],
    ['Morning Sprint', 'desert', 160053, 1, 2, 404, 0.116, 0, 3.16, 2, 4, 24.7, 30, 2, 1, 0, 0, 1, 6, 0.55],
    ['Pine Ridge', 'grass', 168170, 2, 2, 404, 0.109, 0.004, 3.96, 5, 3, 22.9, 26, 2, 1, 0, 0, 1, 5, 0.5],
    ['Amber Pass', 'snow', 176287, 2, 2, 414, 0.106, 0.01, 4.84, 4, 4, 23.7, 27, 1, 2, 0, 0, 1, 7, 0.74],
    ['Dune Sweep', 'volcano', 184404, 2, 2, 412, 0.098, 0, 3.8, 5, 5, 23.8, 26, 2, 2, 0, 0, 1, 6, 0.66],
    ['Glass Harbour', 'dawn', 192521, 2, 2, 423, 0.102, 0, 3.53, 4, 4, 23.4, 28, 2, 1, 1, 0, 1, 4, 0.6],
    ['Cinder Track', 'desert', 200638, 2, 2, 412, 0.125, 0, 3.92, 4, 2, 23.5, 30, 2, 2, 1, 0, 1, 5, 0.53],
    ['Frost Hollow', 'space', 208755, 2, 2, 400, 0.119, 0.009, 6.46, 3, 5, 23.7, 30, 2, 1, 1, 0, 1, 6, 0.63],
    ['Long Shadow', 'ocean', 216872, 2, 2, 424, 0.086, 0, 5.87, 4, 2, 22.6, 32, 2, 1, 1, 0, 1, 4, 0.66],
    ['Tidewater', 'night', 224989, 2, 2, 410, 0.101, 0.013, 5.32, 5, 5, 22.5, 29, 2, 2, 1, 0, 1, 7, 0.47],
    ['Ember Curve', 'grass', 233106, 2, 2, 407, 0.073, 0.012, 7.39, 3, 5, 22.1, 25, 2, 1, 0, 0, 1, 5, 0.73],
    ['Split Rock', 'snow', 241223, 2, 2, 411, 0.129, 0, 7.02, 5, 5, 21.7, 26, 1, 1, 0, 0, 1, 7, 0.58],
    ['Neon Mile', 'space', 249340, 3, 2, 415, 0.104, 0.009, 7.35, 3, 2, 22.8, 29, 2, 2, 0, 0, 1, 6, 0.62],
    ['Canyon Run', 'ocean', 257457, 3, 2, 422, 0.121, 0.015, 5.64, 5, 3, 21.8, 26, 1, 2, 1, 0, 1, 5, 0.65],
    ['Ridgeback', 'night', 265574, 3, 2, 411, 0.13, 0.011, 7.9, 2, 4, 22.9, 33, 2, 3, 0, 0, 1, 7, 0.69],
    ['Saltmarsh', 'grass', 273691, 3, 2, 422, 0.11, 0, 7.05, 3, 2, 21.7, 25, 1, 2, 0, 0, 1, 7, 0.7],
    ['Ironworks', 'snow', 281808, 3, 2, 411, 0.095, 0.01, 8.79, 4, 5, 22.5, 25, 2, 2, 0, 0, 1, 7, 0.46],
    ['Snowbreak', 'volcano', 289925, 3, 2, 418, 0.088, 0.016, 7.82, 2, 3, 22.4, 27, 1, 2, 1, 0, 1, 5, 0.48],
    ['Nightfall', 'dawn', 298042, 3, 2, 422, 0.141, 0, 8.84, 5, 3, 21.4, 26, 2, 3, 0, 0, 1, 5, 0.58],
    ['Deep Blue', 'desert', 306159, 3, 2, 428, 0.132, 0, 9.51, 4, 5, 20.8, 29, 1, 2, 1, 0, 1, 4, 0.69],
    ['Ashfall', 'space', 314276, 3, 2, 409, 0.139, 0.015, 8.79, 2, 5, 20.9, 34, 2, 3, 1, 0, 1, 7, 0.58],
    ['Crosswind', 'ocean', 322393, 3, 2, 425, 0.103, 0, 10.17, 5, 3, 21.1, 32, 2, 2, 0, 0, 1, 7, 0.56],
    ['Vertigo', 'volcano', 330510, 4, 1, 867, 0.134, 0, 7.98, 2, 6, 21.5, 32, 3, 3, 1, 0.15, 1, 4, 0.71],
    ['Serpentine', 'dawn', 338627, 4, 1, 809, 0.139, 0, 9.86, 4, 6, 20.3, 26, 3, 3, 1, 0.22, 1, 7, 0.53],
    ['Blackout', 'desert', 346744, 4, 1, 858, 0.101, 0.019, 10.28, 3, 2, 20.4, 28, 2, 2, 0, 0.22, 1, 4, 0.56],
    ['Highwater', 'space', 354861, 4, 1, 860, 0.099, 0, 10.9, 4, 5, 20.1, 35, 2, 3, 0, 0.13, 1, 6, 0.45],
    ['Furnace', 'ocean', 362978, 4, 1, 812, 0.12, 0, 9.18, 5, 6, 21.2, 34, 3, 2, 0, 0.1, 1, 6, 0.64],
    ['Whiteout', 'night', 371095, 4, 1, 844, 0.13, 0.018, 11.53, 4, 7, 21.1, 34, 2, 3, 1, 0.13, 1, 5, 0.59],
    ['Skyline', 'grass', 379212, 4, 1, 856, 0.137, 0.02, 9.64, 5, 2, 21.2, 29, 3, 2, 0, 0.24, 1, 6, 0.47],
    ['Undertow', 'snow', 387329, 4, 1, 818, 0.124, 0.016, 10.28, 5, 5, 21.1, 35, 3, 2, 1, 0.15, 1, 7, 0.51],
    ['Scoria', 'volcano', 395446, 4, 1, 896, 0.111, 0.02, 10.42, 4, 6, 19.8, 31, 3, 3, 0, 0.23, 1, 4, 0.67],
    ['Razorback', 'dawn', 403563, 4, 1, 823, 0.126, 0.022, 12.8, 2, 5, 20.6, 34, 2, 2, 0, 0.22, 1, 7, 0.7],
    ['Apex Summit', 'night', 411680, 5, 1, 804, 0.138, 0.018, 12.06, 2, 7, 20.9, 34, 2, 3, 1, 0.18, 1, 5, 0.68],
    ['The Gauntlet', 'grass', 419797, 5, 1, 818, 0.101, 0.021, 11.55, 3, 8, 19.3, 31, 3, 3, 0, 0.22, 1, 5, 0.5],
    ['Terminal Velocity', 'snow', 427914, 5, 1, 799, 0.132, 0.021, 12.99, 4, 6, 19.6, 37, 2, 3, 0, 0.14, 1, 6, 0.63],
    ['Maelstrom', 'volcano', 436031, 5, 1, 852, 0.131, 0.023, 11.33, 5, 5, 20.5, 35, 3, 2, 1, 0.13, 1, 7, 0.54],
    ['Inferno', 'dawn', 444148, 5, 1, 835, 0.139, 0.023, 12.32, 2, 4, 19.7, 28, 3, 3, 2, 0.13, 1, 7, 0.57],
    ['Absolute Zero', 'desert', 452265, 5, 1, 901, 0.132, 0.02, 13.45, 3, 5, 18.7, 33, 3, 2, 1, 0.12, 1, 4, 0.54],
    ['Event Horizon', 'space', 460382, 5, 1, 864, 0.154, 0.022, 14.06, 3, 2, 18.8, 35, 3, 2, 1, 0.26, 1, 4, 0.5],
    ['Abyssal', 'ocean', 468499, 5, 1, 828, 0.131, 0, 13.84, 2, 7, 20.2, 33, 2, 2, 1, 0.13, 1, 7, 0.73],
    ['Caldera', 'night', 476616, 5, 1, 890, 0.115, 0, 13.02, 4, 2, 18.6, 34, 3, 2, 2, 0.2, 1, 4, 0.59],
    ['Final Lap', 'grass', 484733, 5, 1, 857, 0.145, 0.021, 13.54, 2, 8, 19.7, 35, 2, 2, 1, 0.11, 1, 5, 0.6]
  ];

  var TRACKS = TRACK_ROWS.map(function (r, i) {
    return {
      index: i, name: r[0], theme: r[1], seed: r[2], diff: r[3], laps: r[4],
      radius: r[5], amp: r[6], chic: r[7], hill: r[8], hillFreq: r[9],
      lobes: r[10], width: r[11], bank: r[12], jumps: r[13], boosts: r[14],
      tunnels: r[15], narrow: r[16], walls: !!r[17], sides: r[18], poly: r[19]
    };
  });

  /* ------------------------------------------------------------- saving */

  var SAVE = 'turbo-drift:save';

  function blankSave() {
    return { credits: 600, sel: 'cadet', cars: { cadet: { owned: true, tune: {} } }, tracks: {} };
  }

  function loadSave() {
    var s = Milo.store.get(SAVE, null);
    if (!s || typeof s !== 'object') s = blankSave();
    if (typeof s.credits !== 'number' || !isFinite(s.credits)) s.credits = 600;
    if (!s.cars || typeof s.cars !== 'object') s.cars = {};
    if (!s.tracks || typeof s.tracks !== 'object') s.tracks = {};
    // The starter car is always owned, whatever the stored blob claims.
    if (!s.cars.cadet) s.cars.cadet = { owned: true, tune: {} };
    s.cars.cadet.owned = true;
    if (!s.cars[s.sel] || !s.cars[s.sel].owned) s.sel = 'cadet';
    return s;
  }

  function persist(save) { Milo.store.set(SAVE, save); }

  function carEntry(save, id) {
    if (!save.cars[id]) save.cars[id] = { owned: false, tune: {} };
    if (!save.cars[id].tune) save.cars[id].tune = {};
    return save.cars[id];
  }

  function trackEntry(save, i) {
    if (!save.tracks[i]) save.tracks[i] = { best: 0, medal: 0 };
    return save.tracks[i];
  }

  /** Track 0 is always open; after that you need the previous one finished. */
  function trackUnlocked(save, i) {
    if (i === 0) return true;
    var prev = save.tracks[i - 1];
    return !!(prev && prev.best);
  }

  /**
   * Medal times scale with track length and difficulty. Derived rather than
   * hand-set so all fifty stay consistent as tracks change.
   */
  function medalTimes(track, built) {
    // Calibrated against measured lap pace in the starter car: a clean but
    // unhurried lap lands around silver, so gold genuinely needs a better line
    // or a better car. The earlier figures put bronze beyond that pace, which
    // made every medal unobtainable on the easy tracks.
    var pace = 30 - track.diff * .9;
    var gold = built.total * track.laps / pace;
    return { gold: gold, silver: gold * 1.15, bronze: gold * 1.32 };
  }

  var MEDAL_NAMES = ['—', '🥉 Bronze', '🥈 Silver', '🥇 Gold'];

  function medalFor(times, ms) {
    var t = ms / 1000;
    if (t <= times.gold) return 3;
    if (t <= times.silver) return 2;
    if (t <= times.bronze) return 1;
    return 0;
  }

  function fmtTime(ms) {
    if (!ms) return '—';
    var t = ms / 1000;
    var m = Math.floor(t / 60);
    var s = t - m * 60;
    return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2);
  }

  /* ------------------------------------------------------------ shaders */

  var VS = [
    'attribute vec3 aPos;',
    'attribute vec3 aCol;',
    'attribute float aShade;',
    'attribute float aTint;',
    'uniform mat4 uVP;',
    'uniform mat4 uModel;',
    'uniform vec3 uTint;',
    'uniform vec3 uEye;',
    'uniform vec2 uFog;',
    'varying vec3 vCol;',
    'varying float vFog;',
    'void main(){',
    '  vec4 world = uModel * vec4(aPos, 1.0);',
    '  gl_Position = uVP * world;',
    '  vCol = mix(aCol, uTint, aTint) * aShade;',
    '  vFog = clamp((length(world.xyz - uEye) - uFog.x) / uFog.y, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FS = [
    'precision mediump float;',
    'uniform vec3 uFogColor;',
    'uniform float uAlpha;',
    'varying vec3 vCol;',
    'varying float vFog;',
    'void main(){',
    '  gl_FragColor = vec4(mix(vCol, uFogColor, vFog), uAlpha);',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('Shader: ' + gl.getShaderInfoLog(s));
    return s;
  }

  function program(gl, vs, fs) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Link: ' + gl.getProgramInfoLog(p));
    return p;
  }

  /* ----------------------------------------------------------- geometry */

  var GREY = [.5, .5, .5], DARK = [.12, .12, .15], GLASS = [.14, .17, .26];

  /** Road edge points for one cross-section, with banking applied. */
  function edge(s, side) {
    var w = s.w * side;
    var lift = Math.sin(s.bank) * w;
    return [s.x + s.lx * w, s.y + lift, s.z + s.lz * w];
  }

  /**
   * Builds every static piece of a track into one buffer: road, kerbs, walls,
   * the slab underneath, tunnels, boost pads, checkpoints and the scenery.
   */
  function buildTrackMesh(built, track, theme) {
    var mesh = new Milo.Mesh();
    var s = built.samples, n = built.n;
    var rand = R.rng(track.seed ^ 0x9e37);
    var i;

    for (i = 0; i < n; i++) {
      var a = s[i], b = s[(i + 1) % n];
      if (a.kind === 1) continue;                    // hole: no road here
      var aL = edge(a, 1), aR = edge(a, -1);
      var bL = edge(b, 1), bR = edge(b, -1);

      // Road surface, with boost pads picked out in the theme accent.
      var surface = a.kind === 2 ? theme.accent : theme.road;
      var shade = a.kind === 2 ? 1.15 : (i % 8 < 4 ? 1 : .94);
      mesh.quad(aR, aL, bL, bR, surface, shade);

      // Kerbs: a bright strip either side, alternating every few segments.
      var kerbCol = (i % 6 < 3) ? theme.kerbA : theme.kerbB;
      var kw = 1.5;
      var aLo = [aL[0] + a.lx * kw, aL[1], aL[2] + a.lz * kw];
      var bLo = [bL[0] + b.lx * kw, bL[1], bL[2] + b.lz * kw];
      var aRo = [aR[0] - a.lx * kw, aR[1], aR[2] - a.lz * kw];
      var bRo = [bR[0] - b.lx * kw, bR[1], bR[2] - b.lz * kw];
      mesh.quad(aL, aLo, bLo, bL, kerbCol, .95);
      mesh.quad(aRo, aR, bR, bRo, kerbCol, .95);

      // Slab: a dark underside so the ribbon reads as solid, not a decal.
      var drop = 1.6;
      mesh.quad([aLo[0], aLo[1] - drop, aLo[2]], [aLo[0], aLo[1], aLo[2]],
        [bLo[0], bLo[1], bLo[2]], [bLo[0], bLo[1] - drop, bLo[2]], DARK, .62);
      mesh.quad([aRo[0], aRo[1], aRo[2]], [aRo[0], aRo[1] - drop, aRo[2]],
        [bRo[0], bRo[1] - drop, bRo[2]], [bRo[0], bRo[1], bRo[2]], DARK, .5);

      // Walls, on the tracks that have them.
      if (track.walls && i % 2 === 0) {
        var wh = 1.5;
        var wc = (i % 8 < 4) ? theme.wall : theme.kerbB;
        mesh.box(aLo[0] + a.lx * .5, aLo[1] + wh * .5, aLo[2] + a.lz * .5, .5, wh * .5, built.step * .55, wc, 0);
        mesh.box(aRo[0] - a.lx * .5, aRo[1] + wh * .5, aRo[2] - a.lz * .5, .5, wh * .5, built.step * .55, wc, 0);
      }

      // Tunnel: side pillars and a roof, which also darkens the drive through.
      if (a.tunnel && i % 2 === 0) {
        var th = 6;
        mesh.box(aLo[0] + a.lx * 1.2, aLo[1] + th * .5, aLo[2] + a.lz * 1.2, 1, th * .5, built.step, theme.wall, 0, .8);
        mesh.box(aRo[0] - a.lx * 1.2, aRo[1] + th * .5, aRo[2] - a.lz * 1.2, 1, th * .5, built.step, theme.wall, 0, .8);
        var mid = [(aL[0] + aR[0]) / 2, a.y + th, (aL[2] + aR[2]) / 2];
        mesh.box(mid[0], mid[1], mid[2], a.w + 2, .6, built.step, theme.wall, 0, .55);
      }
    }

    // Start/finish: a chequered strip plus a gantry you can see coming.
    var st = s[0];
    for (var c = 0; c < 8; c++) {
      var f0 = -1 + c * .25, f1 = f0 + .25;
      var w0 = st.w * f0, w1 = st.w * f1;
      var q0 = [st.x + st.lx * w0, st.y + .06, st.z + st.lz * w0];
      var q1 = [st.x + st.lx * w1, st.y + .06, st.z + st.lz * w1];
      var back = [st.tx * 3, 0, st.tz * 3];
      mesh.quad(q0, q1, [q1[0] + back[0], q1[1], q1[2] + back[2]], [q0[0] + back[0], q0[1], q0[2] + back[2]],
        c % 2 ? [.97, .97, .97] : [.10, .10, .13], 1.1);
    }
    var gl0 = edge(st, 1), gr0 = edge(st, -1);
    mesh.box(gl0[0] + st.lx * 1.6, st.y + 4, gl0[2] + st.lz * 1.6, .8, 4, .8, theme.accent, 0);
    mesh.box(gr0[0] - st.lx * 1.6, st.y + 4, gr0[2] - st.lz * 1.6, .8, 4, .8, theme.accent, 0);
    mesh.box(st.x, st.y + 8, st.z, st.w + 2, .9, .8, theme.accent, 0);

    // Checkpoint gates, so the next one is always visible from the last.
    built.checkpoints.forEach(function (ci, k) {
      if (k === 0) return;                             // 0 is the start line
      var cs = s[ci];
      var cl = edge(cs, 1), cr = edge(cs, -1);
      mesh.box(cl[0] + cs.lx * 1.2, cs.y + 2.6, cl[2] + cs.lz * 1.2, .5, 2.6, .5, theme.kerbA, 0);
      mesh.box(cr[0] - cs.lx * 1.2, cs.y + 2.6, cr[2] - cs.lz * 1.2, .5, 2.6, .5, theme.kerbA, 0);
    });

    // Scenery: a few hundred simple shapes set back from the road edge.
    var kinds = theme.scen;
    for (i = 0; i < n; i += 5) {
      if (rand() > .55) continue;
      var sm = s[i];
      var side = rand() < .5 ? 1 : -1;
      var off = sm.w + 17 + rand() * 22;
      var ox = sm.x + sm.lx * off * side, oz = sm.z + sm.lz * off * side;
      var oy = sm.y - 1.5;
      var scale = .7 + rand() * .9;
      if (kinds === 'tree' || kinds === 'pine') {
        mesh.box(ox, oy + 1.2 * scale, oz, .35, 1.2 * scale, .35, [.30, .22, .16], 0);
        var leaf = kinds === 'pine' ? [.16, .40, .28] : [.22, .60, .30];
        mesh.box(ox, oy + 3.4 * scale, oz, 1.5 * scale, 1.9 * scale, 1.5 * scale, leaf, 0);
        mesh.box(ox, oy + 5.4 * scale, oz, .9 * scale, 1.1 * scale, .9 * scale, leaf, 0, 1.12);
      } else if (kinds === 'rock') {
        mesh.box(ox, oy + 1.3 * scale, oz, 1.7 * scale, 1.3 * scale, 1.5 * scale, [.34, .30, .28], 0);
        mesh.box(ox + .6, oy + 2.6 * scale, oz - .4, .9 * scale, .9 * scale, .8 * scale, [.40, .35, .32], 0);
      } else if (kinds === 'neon') {
        mesh.box(ox, oy + 4 * scale, oz, .4, 4 * scale, .4, [.14, .14, .20], 0);
        mesh.box(ox, oy + 8.2 * scale, oz, 1.1 * scale, .5, 1.1 * scale, theme.accent, 0, 1.3);
      } else if (kinds === 'cactus') {
        mesh.box(ox, oy + 2.2 * scale, oz, .6 * scale, 2.2 * scale, .6 * scale, [.26, .50, .30], 0);
        mesh.box(ox + 1.1 * scale, oy + 2.8 * scale, oz, .5 * scale, .5, .5 * scale, [.26, .50, .30], 0);
      } else if (kinds === 'palm') {
        mesh.box(ox, oy + 2.6 * scale, oz, .3, 2.6 * scale, .3, [.42, .33, .22], 0);
        mesh.box(ox, oy + 5.4 * scale, oz, 2.0 * scale, .3, 2.0 * scale, [.20, .62, .42], 0);
      } else {
        // crystal
        mesh.box(ox, oy + 2.4 * scale, oz, .8 * scale, 2.4 * scale, .8 * scale, theme.accent, 0, .9);
        mesh.box(ox, oy + 5.2 * scale, oz, .4 * scale, .9 * scale, .4 * scale, theme.accent, 0, 1.3);
      }
    }

    // --- F1-style grandstands ---------------------------------------------
    // Stands go where a crowd could actually watch: stretches where the road
    // runs straight for a dozen segments, spaced around the lap. Each one is
    // a tiered concrete wedge packed with coloured fans under an accent roof,
    // and the scatter of empty seats keeps the crowd from looking stamped.
    var FAN_COLS = [
      [.94, .30, .30], [.30, .55, .95], [.98, .85, .30], [.40, .85, .50],
      [.95, .55, .25], [.85, .40, .90], [.95, .95, .95], [.25, .80, .80]
    ];
    var lastStand = -1e9, standCount = 0;
    var standGap = Math.max(24, Math.floor(n / 14));
    for (i = 0; i < n && standCount < 12; i++) {
      if (i - lastStand < standGap) continue;
      var straight = true;
      for (var q = -2; q <= 7 && straight; q++) {
        var ss = s[(i + q + n) % n];
        if (Math.abs(ss.curvS) > .006 || ss.kind === 1 || ss.tunnel) straight = false;
      }
      if (!straight) continue;
      lastStand = i;
      standCount++;
      var sm2 = s[(i + 2) % n];
      var sSide = rand() < .5 ? 1 : -1;
      var sYaw = Math.atan2(sm2.tx, sm2.tz);
      var half = 10.5, tiers = 4;
      var baseY = sm2.y - .5;
      for (var tr = 0; tr < tiers; tr++) {
        var away = sm2.w + 8.5 + tr * 1.7;
        var ty = baseY + 1.1 + tr * 1.05;
        var tx2 = sm2.x + sm2.lx * away * sSide;
        var tz2 = sm2.z + sm2.lz * away * sSide;
        mesh.boxR(tx2, ty - .38, tz2, 1.0, .38, half, sYaw, [.44, .46, .54], 0);
        for (var seat = -7; seat <= 7; seat++) {
          if (rand() < .18) continue;
          mesh.boxR(tx2 + sm2.tx * seat * 1.38, ty + .42, tz2 + sm2.tz * seat * 1.38,
            .36, .42, .30, sYaw, FAN_COLS[(seat * 5 + tr * 3 + i) & 7], 0, 1.05);
        }
      }
      var backAway = sm2.w + 8.5 + tiers * 1.7;
      mesh.boxR(sm2.x + sm2.lx * backAway * sSide, baseY + 2.9, sm2.z + sm2.lz * backAway * sSide,
        .35, 2.9, half + .8, sYaw, [.38, .40, .48], 0);
      var roofAway = sm2.w + 8.2 + tiers * .85;
      mesh.boxR(sm2.x + sm2.lx * roofAway * sSide, baseY + 6.3, sm2.z + sm2.lz * roofAway * sSide,
        4.4, .22, half + 1.2, sYaw, theme.accent, 0, .9);
      var pilAway = sm2.w + 8.0;
      for (var pe = -1; pe <= 1; pe += 2) {
        mesh.boxR(sm2.x + sm2.lx * pilAway * sSide + sm2.tx * pe * (half + .6), baseY + 3.1,
          sm2.z + sm2.lz * pilAway * sSide + sm2.tz * pe * (half + .6),
          .3, 3.1, .3, sYaw, [.38, .40, .48], 0);
      }
    }

    return mesh;
  }

  /** A big flat ground plane plus a horizon ring, so the world has a floor. */
  function buildGroundMesh(built, theme) {
    var mesh = new Milo.Mesh();
    var lo = 1e9, i;
    for (i = 0; i < built.n; i++) lo = Math.min(lo, built.samples[i].y);
    var y = lo - 9;
    var far = 3000;
    mesh.quad([-far, y, -far], [-far, y, far], [far, y, far], [far, y, -far], theme.ground, .9);
    // A sparse grid of raised tiles keeps the floor from looking like a void.
    var rand = R.rng(1234);
    for (i = 0; i < 260; i++) {
      var a = rand() * Math.PI * 2;
      var r = built.spec.radius * (1.5 + rand() * 3.2);
      mesh.box(Math.cos(a) * r, y + .4, Math.sin(a) * r, 12 + rand() * 26, .4, 12 + rand() * 26,
        theme.ground, 0, .82 + rand() * .3);
    }
    return mesh;
  }

  /** One car body, built once and drawn per racer with a different tint. */
  function buildCarMesh() {
    var m = new Milo.Mesh();
    m.box(0, .52, .1, .78, .26, 1.72, GREY, 1);              // main body
    m.box(0, .86, -.15, .60, .26, .82, GLASS, 0);            // cabin
    m.box(0, .30, 1.62, .74, .16, .22, GREY, 1, .9);         // nose
    m.box(0, .95, -1.42, .70, .07, .18, GREY, 1, 1.1);       // wing blade
    m.box(-.58, .74, -1.42, .09, .22, .16, DARK, 0);
    m.box(.58, .74, -1.42, .09, .22, .16, DARK, 0);
    m.box(-.52, .30, 1.60, .16, .10, .10, [1, .96, .8], 0, 1.4);   // headlights
    m.box(.52, .30, 1.60, .16, .10, .10, [1, .96, .8], 0, 1.4);
    m.box(-.50, .28, -1.60, .14, .08, .08, [1, .25, .2], 0, 1.4);  // tail lights
    m.box(.50, .28, -1.60, .14, .08, .08, [1, .25, .2], 0, 1.4);
    var wheels = [[-.80, 1.05], [.80, 1.05], [-.80, -1.05], [.80, -1.05]];
    wheels.forEach(function (w) {
      m.box(w[0], .34, w[1], .16, .34, .36, [.08, .08, .10], 0);
    });
    return m;
  }

  /** A flat quad used for the drift smoke and boost puffs. */
  function buildPuffMesh() {
    var m = new Milo.Mesh();
    m.quad([-1, 0, -1], [-1, 0, 1], [1, 0, 1], [1, 0, -1], GREY, 1, 1);
    return m;
  }

  /* --------------------------------------------------------- physics */

  var GRAV = 34;

  /** Turns 0..1 stat sliders into the numbers the simulation actually uses. */
  function physicsFor(stats) {
    return {
      top: 27 + stats.top * 43,
      accel: 11 + stats.accel * 17,
      brakeF: 16 + stats.brake * 20,
      grip: 3.4 + stats.grip * 7.2,
      steer: 1.75 + stats.grip * .75,
      air: .35 + stats.air * 1.35,
      nitro: stats.nitro,
      mass: stats.mass
    };
  }

  var AI_NAMES = ['Rossi', 'Vega', 'Kade', 'Nyx', 'Orin', 'Sable', 'Juno', 'Ezra', 'Mika',
    'Dax', 'Lyra', 'Cole', 'Vesper', 'Remy', 'Indigo', 'Sora', 'Blitz', 'Moss'];
  // Eighteen liveries spread around the hue wheel, so no two rivals match.
  var AI_COLS = (function () {
    var cols = [];
    for (var i = 0; i < 18; i++) {
      var h = (i * 20 + 8) % 360, sat = .68, v = .92;
      var c = v * sat, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
      var k = Math.floor(h / 60);
      cols.push([[c, x, 0, 0, x, c][k] + m, [x, c, c, x, 0, 0][k] + m, [0, 0, x, c, c, x][k] + m]);
    }
    return cols;
  })();
  var RIVALS = 18;

  function ordinal(p) {
    var t = p % 10, h = p % 100;
    if (h >= 11 && h <= 13) return p + 'th';
    return p + (t === 1 ? 'st' : t === 2 ? 'nd' : t === 3 ? 'rd' : 'th');
  }

  function mount(host) {
    var U = Milo.util;
    var save = loadSave();
    var carMesh = buildCarMesh(), puffMesh = buildPuffMesh();

    var gpu = null;     // lazily created once we have a GL context
    var menuEl = null, hudEl = null, nitroEl = null, msgEl = null, lightsEl = null;

    /* ------------------------------------------------------- track state */

    var current = { index: 0, built: null, theme: null, times: null };

    function ensureTrack(i) {
      if (current.built && current.index === i) return current;
      var t = TRACKS[i];
      current.index = i;
      current.track = t;
      current.built = R.buildTrack(t);
      current.theme = R.THEMES[t.theme] || R.THEMES.grass;
      current.times = medalTimes(t, current.built);
      current.dirty = true;
      return current;
    }

    /* ------------------------------------------------------------- menu */

    function el(tag, cls, html) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (html != null) e.innerHTML = html;
      return e;
    }

    function closeMenu() {
      if (menuEl) { menuEl.remove(); menuEl = null; }
    }

    function bar(label, value, boosted) {
      var pct = Math.round(U.clamp(value, 0, 1) * 100);
      return '<div class="td-bar"><span>' + label + '</span><i><b class="' +
        (boosted ? 'up' : '') + '" style="width:' + pct + '%"></b></i></div>';
    }

    function rgbCss(c) {
      return 'rgb(' + Math.round(c[0] * 255) + ',' + Math.round(c[1] * 255) + ',' + Math.round(c[2] * 255) + ')';
    }

    function openMenu(g, tab) {
      closeMenu();
      g.clearOverlay();
      menuEl = el('div', 'td-menu');
      var top = el('div', 'td-top');
      top.appendChild(el('h3', null, 'Turbo Drift'));
      var tabs = el('div', 'td-tabs');
      top.appendChild(tabs);
      top.appendChild(el('div', 'td-credits', '💰 ' + U.fmt(Math.round(save.credits))));
      menuEl.appendChild(top);
      var body = el('div', 'td-body');
      menuEl.appendChild(body);

      ['Race', 'Cars', 'Tuning'].forEach(function (name) {
        var b = el('button', tab === name ? 'on' : '', name);
        b.type = 'button';
        b.addEventListener('click', function () { openMenu(g, name); });
        tabs.appendChild(b);
      });

      if (tab === 'Race') renderTracks(g, body);
      else if (tab === 'Cars') renderCars(g, body);
      else renderTuning(g, body);

      g.hud.appendChild(menuEl);
    }

    function renderTracks(g, body) {
      var grid = el('div', 'td-grid');
      TRACKS.forEach(function (t, i) {
        var open = trackUnlocked(save, i);
        var rec = save.tracks[i];
        var card = el('button', 'td-card' + (open ? '' : ' locked') + (i === current.index ? ' on' : ''));
        card.type = 'button';
        var stars = '★'.repeat(t.diff) + '☆'.repeat(5 - t.diff);
        card.innerHTML =
          '<h4><span class="td-swatch" style="background:' + rgbCss((R.THEMES[t.theme] || R.THEMES.grass).accent) + '"></span>' +
          (i + 1) + '. ' + (open ? t.name : 'Locked') + '</h4>' +
          '<div class="td-note">' + stars + ' · ' + t.laps + ' laps · ' + t.theme + '</div>' +
          (open
            ? '<div class="td-note">Best ' + fmtTime(rec && rec.best) + '</div>' +
            '<div class="td-medal">' + MEDAL_NAMES[(rec && rec.medal) || 0] + '</div>'
            : '<div class="td-note">Finish track ' + i + ' to unlock</div>');
        if (open) {
          card.addEventListener('click', function () {
            ensureTrack(i);
            closeMenu();
            g.restart();
          });
        }
        grid.appendChild(card);
      });
      body.appendChild(grid);
    }

    function renderCars(g, body) {
      var grid = el('div', 'td-grid');
      R.CARS.forEach(function (car) {
        var entry = carEntry(save, car.id);
        var owned = entry.owned;
        var afford = save.credits >= car.price;
        var sel = save.sel === car.id;
        var card = el('button', 'td-card' + (sel ? ' on' : '') + (!owned && !afford ? ' locked' : ''));
        card.type = 'button';
        var st = R.tunedStats(car, entry.tune);
        card.innerHTML =
          '<h4><span class="td-swatch" style="background:' + rgbCss(car.col) + '"></span>' + car.name + '</h4>' +
          '<div class="td-note">' + car.desc + '</div>' +
          '<div class="td-bars">' +
          bar('Speed', st.top, st.top > car.top) +
          bar('Accel', st.accel, st.accel > car.accel) +
          bar('Grip', st.grip, st.grip > car.grip) +
          bar('Brake', st.brake, st.brake > car.brake) +
          '</div>' +
          '<div class="td-note">' + (owned
            ? (sel ? '✅ Selected' : 'Tap to select')
            : '💰 ' + U.fmt(car.price) + (afford ? ' — tap to buy' : ' — not enough')) + '</div>';
        card.addEventListener('click', function () {
          if (!owned) {
            if (save.credits < car.price) return;
            save.credits -= car.price;
            entry.owned = true;
          }
          save.sel = car.id;
          persist(save);
          openMenu(g, 'Cars');
        });
        grid.appendChild(card);
      });
      body.appendChild(grid);
    }

    function renderTuning(g, body) {
      var car = R.CARS.filter(function (c) { return c.id === save.sel; })[0] || R.CARS[0];
      var entry = carEntry(save, car.id);
      body.appendChild(el('div', 'td-note',
        'Tuning <b style="color:var(--text)">' + car.name + '</b> — upgrades stay with this car.'));
      var grid = el('div', 'td-grid');
      R.TUNES.forEach(function (t) {
        var lvl = Math.min(R.TUNE_MAX, entry.tune[t.id] || 0);
        var maxed = lvl >= R.TUNE_MAX;
        var cost = R.tuneCost(lvl);
        var afford = save.credits >= cost;
        var card = el('button', 'td-card' + (maxed ? ' on' : (afford ? '' : ' locked')));
        card.type = 'button';
        var pips = '';
        for (var i = 0; i < R.TUNE_MAX; i++) pips += '<u class="' + (i < lvl ? 'on' : '') + '"></u>';
        card.innerHTML =
          '<h4>' + t.icon + ' ' + t.name + '</h4>' +
          '<div class="td-note">' + t.desc + '</div>' +
          '<div class="td-pips">' + pips + '</div>' +
          '<div class="td-note">' + (maxed ? 'Fully tuned' :
            '💰 ' + U.fmt(cost) + (afford ? ' — tap to fit' : ' — not enough')) + '</div>';
        card.addEventListener('click', function () {
          if (maxed || save.credits < cost) return;
          save.credits -= cost;
          entry.tune[t.id] = lvl + 1;
          persist(save);
          Milo.sound.powerup();
          openMenu(g, 'Tuning');
        });
        grid.appendChild(card);
      });
      body.appendChild(grid);
    }

    /* ------------------------------------------------------- race setup */

    function makeCar(built, slot, isPlayer, stats, col, name) {
      // The grid is laid along the track's own samples, two abreast, so a
      // curved start straight still lines the field up on the tarmac.
      var n = built.n;
      var back = 6 + Math.floor(slot / 2) * 6.5;
      var idx = (n - Math.max(1, Math.round(back / built.step))) % n;
      var s = built.samples[idx];
      var lane = (slot % 2 ? 1 : -1) * Math.min(2.8, s.w * .35);
      return {
        x: s.x + s.lx * lane,
        y: s.y + .4,
        z: s.z + s.lz * lane,
        vx: 0, vy: 0, vz: 0,
        yaw: Math.atan2(s.tx, s.tz), roll: 0, pitch: 0,
        si: idx, lap: 0, cp: 1, prog: 0,
        ground: true, drift: 0, boost: 0, nitro: stats.nitro,
        respawnT: 0, finished: false, finishMs: 0,
        player: isPlayer, name: name, col: col,
        phys: physicsFor(stats),
        lane: ((slot * 37) % 5 - 2) * .35,
        skill: isPlayer ? 1 : 0
      };
    }

    /**
     * Race progress that stays honest on the grid: cars start a little behind
     * the line, so positions just before index 0 count as slightly negative
     * rather than as a whole lap ahead.
     */
    function progOf(car, n) {
      return car.lap * n + (((car.si + 30) % n) - 30);
    }

    function rankOf(d, me) {
      var n = d.built.n;
      var myKey = me.finished ? 1e12 - me.finishMs : progOf(me, n);
      var r = 1;
      d.cars.forEach(function (c) {
        if (c === me) return;
        var k = c.finished ? 1e12 - c.finishMs : progOf(c, n);
        if (k > myKey) r++;
      });
      return r;
    }

    function reset(g) {
      var d = g.data;
      var cur = ensureTrack(current.index);
      var built = cur.built, track = cur.track;

      var car = R.CARS.filter(function (c) { return c.id === save.sel; })[0] || R.CARS[0];
      var entry = carEntry(save, car.id);
      var stats = R.tunedStats(car, entry.tune);

      d.built = built;
      d.track = track;
      d.theme = cur.theme;
      d.times = cur.times;
      // F1-style grid: eighteen rivals ahead, you at the back. The fastest
      // AI sit on the front rows, so the field sorts itself into a real race
      // and every overtake moves you up a position that is shown live.
      d.cars = [makeCar(built, RIVALS, true, stats, car.col, 'You')];

      // Rivals scale with the track's difficulty rather than your car, so an
      // upgraded car genuinely feels like an upgrade.
      var high = U.clamp(.42 + track.diff * .075, 0, .9);
      for (var i = 0; i < RIVALS; i++) {
        var f = i / (RIVALS - 1);
        var lvl = high - .30 * f;
        var rstats = {
          top: U.clamp(lvl + .06, .2, .97), accel: U.clamp(lvl, .2, .95),
          grip: U.clamp(lvl + .1, .2, .95), brake: U.clamp(lvl, .2, .95),
          air: .5, nitro: .4, mass: .5
        };
        var ai = makeCar(built, i, false, rstats, AI_COLS[i % AI_COLS.length], AI_NAMES[i % AI_NAMES.length]);
        ai.skill = U.clamp(.86 + track.diff * .018 - .06 * f, .6, .99);
        d.cars.push(ai);
      }

      d.me = d.cars[0];
      d.ms = 0;
      d.countdown = 4.4;
      d.done = false;
      d.puffs = [];
      d.msg = '';
      d.msgT = 0;
      d.wrong = 0;
      d.sectorT = 0;
      d.lastLit = 0;
      d.cam = null;
      d.laps = track.laps;

      g.set('Track', (current.index + 1) + '. ' + track.name);
      g.set('Pos', d.cars.length + '/' + d.cars.length);
      g.set('Lap', '1/' + d.laps);
      g.set('Time', '0:00.00');
      g.set('Speed', '0');
      var rec = save.tracks[current.index];
      g.set('Best', fmtTime(rec && rec.best));
      showHud(g);
      if (cur.dirty) uploadTrack(g);
    }

    /* ------------------------------------------------------------- GPU */

    function initGpu(g) {
      var gl = g.gl;
      var prog = program(gl, VS, FS);
      gpu = {
        gl: gl, prog: prog,
        loc: {
          pos: gl.getAttribLocation(prog, 'aPos'),
          col: gl.getAttribLocation(prog, 'aCol'),
          shade: gl.getAttribLocation(prog, 'aShade'),
          tint: gl.getAttribLocation(prog, 'aTint'),
          vp: gl.getUniformLocation(prog, 'uVP'),
          model: gl.getUniformLocation(prog, 'uModel'),
          uTint: gl.getUniformLocation(prog, 'uTint'),
          eye: gl.getUniformLocation(prog, 'uEye'),
          fog: gl.getUniformLocation(prog, 'uFog'),
          fogColor: gl.getUniformLocation(prog, 'uFogColor'),
          alpha: gl.getUniformLocation(prog, 'uAlpha')
        },
        track: gl.createBuffer(), trackN: 0,
        ground: gl.createBuffer(), groundN: 0,
        car: gl.createBuffer(), carN: 0,
        puff: gl.createBuffer(), puffN: 0
      };
      upload(gpu.car, carMesh);
      gpu.carN = carMesh.count();
      upload(gpu.puff, puffMesh);
      gpu.puffN = puffMesh.count();
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
    }

    function upload(buf, mesh) {
      var gl = gpu.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, mesh.data(), gl.STATIC_DRAW);
    }

    function uploadTrack(g) {
      if (!gpu) return;
      var cur = current;
      var tm = buildTrackMesh(cur.built, cur.track, cur.theme);
      upload(gpu.track, tm);
      gpu.trackN = tm.count();
      var gm = buildGroundMesh(cur.built, cur.theme);
      upload(gpu.ground, gm);
      gpu.groundN = gm.count();
      cur.dirty = false;
    }

    function bindMesh(buf) {
      var gl = gpu.gl, L = gpu.loc, stride = 32;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(L.pos);
      gl.vertexAttribPointer(L.pos, 3, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(L.col);
      gl.vertexAttribPointer(L.col, 3, gl.FLOAT, false, stride, 12);
      gl.enableVertexAttribArray(L.shade);
      gl.vertexAttribPointer(L.shade, 1, gl.FLOAT, false, stride, 24);
      gl.enableVertexAttribArray(L.tint);
      gl.vertexAttribPointer(L.tint, 1, gl.FLOAT, false, stride, 28);
    }

    /* ------------------------------------------------------------- HUD */

    function showHud(g) {
      if (hudEl) return;
      hudEl = el('div', 'td-hud');
      lightsEl = el('div', 'td-lights', '<i></i><i></i><i></i><i></i><i></i>');
      msgEl = el('div', 'td-msg');
      nitroEl = el('div', 'td-nitro', '<b style="width:0%"></b>');
      hudEl.appendChild(lightsEl);
      hudEl.appendChild(msgEl);
      hudEl.appendChild(nitroEl);
      g.hud.appendChild(hudEl);
    }

    function hideHud() {
      if (hudEl) { hudEl.remove(); hudEl = null; }
      lightsEl = null;
    }

    /* --------------------------------------------------------- geometry */

    /**
     * Finds the car's place on the track and reads the road under it.
     *
     * The surface is interpolated between neighbouring cross-sections rather
     * than taken from the nearest one. Sampling a single section makes the road
     * a staircase with a step every few metres, and on a hilly circuit the car
     * drops off the edge of each one and spends most of the lap airborne.
     */
    function locate(built, car) {
      var s = built.samples, n = built.n, step = built.step;
      var best = car.si, bestD = 1e18;
      for (var k = -34; k <= 34; k++) {
        var i = (car.si + k + n * 2) % n;
        var dx = car.x - s[i].x, dz = car.z - s[i].z;
        var dd = dx * dx + dz * dz;
        if (dd < bestD) { bestD = dd; best = i; }
      }
      car.si = best;
      var sm = s[best];
      var ox = car.x - sm.x, oz = car.z - sm.z;
      car.off = ox * sm.lx + oz * sm.lz;
      // How far past this cross-section the car sits, as a fraction of a segment.
      var along = ox * sm.tx + oz * sm.tz;
      var nb = s[(best + (along >= 0 ? 1 : n - 1)) % n];
      var f = Math.min(1, Math.abs(along) / step);
      car.roadBase = sm.y + (nb.y - sm.y) * f;
      car.roadBank = sm.bank + (nb.bank - sm.bank) * f;
      car.roadW = sm.w + (nb.w - sm.w) * f;
      car.roadY = car.roadBase + Math.sin(car.roadBank) * car.off;
      // Gradient of that interpolated surface in the direction of travel. The
      // car follows this, not the cross-section's own tangent — mixing the two
      // leaves it chattering a few centimetres above the road.
      var seg = (nb.y - sm.y) / step;
      car.roadSlope = along >= 0 ? seg : -seg;
      car.sm = sm;
      return sm;
    }

    /** True when the given point is over solid road rather than a hole or void. */
    function supported(car, sm) {
      if (sm.kind === 1) return false;
      return Math.abs(car.off) <= car.roadW + 1.2;
    }

    function passed(prevSi, si, target, n) {
      var d = (si - prevSi + n) % n;
      if (d === 0 || d > n / 2) return false;
      var t = (target - prevSi + n) % n;
      return t > 0 && t <= d;
    }

    function respawn(car, built) {
      var s = built.samples[car.lastCp || 0];
      car.x = s.x; car.y = s.y + .6; car.z = s.z;
      car.vx = 0; car.vy = 0; car.vz = 0;
      car.yaw = Math.atan2(s.tx, s.tz);
      car.roll = 0; car.pitch = 0;
      car.si = built.samples.indexOf(s);
      if (car.si < 0) car.si = car.lastCp || 0;
      car.respawnT = .7;
      car.boost = 0;
    }

    /* --------------------------------------------------------- driving */

    var RIDE = .42;

    /** Picks a throttle, brake and steering input for one rival. */
    function aiDrive(car, built) {
      var s = built.samples, n = built.n;
      var speed = Math.hypot(car.vx, car.vz);
      var look = Math.round(5 + speed * .30);
      var t = s[(car.si + look) % n];
      var lane = car.lane * Math.min(2.6, t.w * .28);
      var tx = t.x + t.lx * lane, tz = t.z + t.lz * lane;
      var want = Math.atan2(tx - car.x, tz - car.z);
      var diff = ((want - car.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      car.steerIn = U.clamp(diff * 2.3, -1, 1);

      // Slow to whatever the tightest corner in view actually allows. The
      // lateral-grip figure here is deliberately conservative: a rival that
      // understeers into the outside barrier is slower than one that lifts.
      var limit = car.phys.top;
      for (var k = 3; k < look + 34; k += 3) {
        var sm = s[(car.si + k) % n];
        var c = Math.abs(sm.curvS);
        if (c > 1e-5) limit = Math.min(limit, Math.sqrt((8.5 * car.skill) / c) + k * .30);
      }
      // Running wide is the warning sign; back off before the wall arrives.
      var wide = Math.abs(car.off) / Math.max(1, s[car.si].w);
      if (wide > .62) limit *= 1 - Math.min(.45, (wide - .62) * 1.2);
      car.throttleIn = speed < limit ? 1 : 0;
      car.brakeIn = speed > limit * 1.06 ? 1 : 0;
      car.nitroIn = car.nitro > .05 && Math.abs(s[car.si].curvS) < .0035 && speed > limit * .85;
    }

    function step(g, dt) {
      var d = g.data, built = d.built, n = built.n, track = d.track;
      var cps = built.checkpoints;

      d.cars.forEach(function (car) {
        var sm = locate(built, car);
        var startSi = car.si;
        var P = car.phys;

        if (car.respawnT > 0) { car.respawnT -= dt; return; }

        var thr = 0, brk = 0, steer = 0, nos = false;
        if (car.player) {
          var inp = g.input;
          thr = inp.down('up') ? 1 : 0;
          brk = inp.down('down') ? 1 : 0;
          steer = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
          nos = inp.down('action') || inp.down('a');
          if (inp.pdown) { thr = 1; steer = inp.px < g.W / 2 ? -1 : 1; }
        } else {
          aiDrive(car, built);
          thr = car.throttleIn; brk = car.brakeIn; steer = car.steerIn; nos = car.nitroIn;
        }
        if (d.countdown > 0) { thr = 0; brk = 0; nos = false; }
        if (car.finished) { thr = 0; brk = 1; steer = 0; nos = false; }

        // --- nitrous and boost pads -------------------------------------
        if (nos && car.nitro > .02 && car.ground) {
          car.nitro = Math.max(0, car.nitro - dt * .30);
          car.boost = Math.max(car.boost, .30);
          if (car.player && Math.random() < .5) puff(d, car, true);
        }
        if (sm.kind === 2 && car.ground) {
          car.boost = Math.max(car.boost, 1.0);
          car.nitro = Math.min(1, car.nitro + dt * .9);
          if (Math.random() < .4) puff(d, car, true);
        }
        if (car.boost > 0) car.boost -= dt;
        var boosting = car.boost > 0;

        // --- steering ----------------------------------------------------
        var speed = Math.hypot(car.vx, car.vz);
        var auth = car.ground
          ? P.steer * (1 - .50 * Math.min(1, speed / P.top)) * Math.min(1, speed / 4.5)
          : P.air * .55;
        var vfSign = (car.vx * Math.sin(car.yaw) + car.vz * Math.cos(car.yaw)) < -.5 ? -1 : 1;
        car.yaw += steer * auth * dt * vfSign;

        // --- longitudinal + lateral --------------------------------------
        var sinY = Math.sin(car.yaw), cosY = Math.cos(car.yaw);
        var vf = car.vx * sinY + car.vz * cosY;
        var vr = car.vx * cosY - car.vz * sinY;

        if (car.ground) {
          var topV = P.top * (boosting ? 1.30 : 1);
          var accelF = P.accel * (boosting ? 1.75 : 1);
          if (thr > 0 && vf < topV) vf += accelF * dt;
          if (brk > 0) {
            if (vf > .5) vf -= P.brakeF * dt;
            else vf = Math.max(-14, vf - P.accel * .45 * dt);
          }
          // Coasting drag, plus a hard cap so boost bleeds off rather than sticks.
          vf -= vf * (thr > 0 ? .02 : .55) * dt;
          if (vf > topV) vf = topV;

          // Riding the kerb costs grip, which is what makes the edges risky.
          var edgy = Math.abs(car.off) > car.roadW * .84;
          var gripRate = P.grip * (edgy ? .62 : 1);
          vr *= Math.exp(-gripRate * dt);
          car.drift = Math.abs(vr);
          if (car.drift > 3.4 && speed > 12 && Math.random() < .6) puff(d, car, false);
        } else {
          // In the air there is nothing to push against: only drag.
          vf -= vf * .06 * dt;
          vr -= vr * .35 * dt;
          car.drift = 0;
        }

        car.vx = sinY * vf + cosY * vr;
        car.vz = cosY * vf - sinY * vr;

        // --- move, then resolve against the surface at the NEW position ----
        car.x += car.vx * dt;
        car.z += car.vz * dt;
        // Re-read the road under the car. Resolving height against the section
        // it occupied at the top of the frame leaves it floating on any climb,
        // because the road has risen underneath it since.
        sm = locate(built, car);
        var off = car.off;

        if (track.walls) {
          var lim = car.roadW - .95;
          if (Math.abs(off) > lim) {
            var sgn = off < 0 ? -1 : 1;
            var over = Math.abs(off) - lim;
            car.x -= sm.lx * over * sgn;
            car.z -= sm.lz * over * sgn;
            var into = car.vx * sm.lx + car.vz * sm.lz;
            if (into * sgn > 0) {
              // Kill the component driving into the barrier, keep a little bounce.
              car.vx -= sm.lx * into * 1.25;
              car.vz -= sm.lz * into * 1.25;
              // Only the moment of impact costs speed. Scrubbing every frame of
              // contact instead would pin a car against the wall at walking pace.
              if (!car.touching) {
                var hit = Math.abs(into);
                var keep = U.clamp(1 - hit * .022, .74, 1);
                car.vx *= keep; car.vz *= keep;
                if (car.player && hit > 5) Milo.sound.hit();
              }
            }
            // A light scrape while still in contact, rate-based so it does not
            // depend on the frame rate.
            var scrape = Math.exp(-.25 * dt);
            car.vx *= scrape; car.vz *= scrape;
            // A car nosed straight into a barrier has all its thrust absorbed and
            // can never recover. Easing its heading toward the wall's own
            // direction lets it slide along and drive out of the mistake.
            var along = Math.atan2(sm.tx, sm.tz);
            var delta = ((along - car.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
            car.yaw += U.clamp(delta, -1.8 * dt, 1.8 * dt);
            car.touching = true;
            off = sgn * lim;
          } else {
            car.touching = false;
          }
        }
        car.off = off;
        car.roadY = car.roadBase + Math.sin(car.roadBank) * off;

        // --- vertical ----------------------------------------------------
        var support = supported(car, sm);
        var targetY = car.roadY + RIDE;
        car.vy -= GRAV * dt;
        car.y += car.vy * dt;
        // Vertical speed relative to the road, so a car climbing a ramp at the
        // road's own rate still counts as being on it.
        var follow = vf * car.roadSlope;
        var relV = car.vy - follow;
        if (support && car.y <= targetY + .30 && relV <= .5) {
          if (!car.ground && car.vy < -9 && car.player) Milo.sound.hit();
          car.y = targetY;
          // Carry the road's gradient as vertical speed: this is what launches
          // the car when a ramp's tarmac runs out at the lip of a gap.
          car.vy = follow;
          car.ground = true;
        } else {
          car.ground = false;
        }

        // Anti-beaching for rivals: a car that has made no progress for a few
        // seconds is stuck on something and will never free itself.
        if (!car.player && !car.finished && d.countdown <= 0) {
          var moved = (car.si - (car.stuckSi == null ? car.si : car.stuckSi) + n) % n;
          if (moved > 2 && moved < n / 2) { car.stuckSi = car.si; car.stuckT = 0; }
          else {
            car.stuckT = (car.stuckT || 0) + dt;
            if (car.stuckT > 4.5) { respawn(car, built); car.stuckT = 0; car.stuckSi = car.si; return; }
          }
        }

        if (car.y < sm.y - 26) {
          respawn(car, built);
          if (car.player) {
            say(d, 'Back to the last checkpoint');
            Milo.sound.lose();
          }
          return;
        }

        // --- body attitude, purely cosmetic -------------------------------
        var wantRoll = car.roadBank + U.clamp(-vr * .022, -.28, .28);
        car.roll += (wantRoll - car.roll) * Math.min(1, 8 * dt);
        var wantPitch = car.ground ? U.clamp(-sm.ty * 1.2, -.3, .3) : U.clamp(-car.vy * .012, -.35, .35);
        car.pitch += (wantPitch - car.pitch) * Math.min(1, 6 * dt);

        // --- checkpoints and laps ------------------------------------------
        if (!car.finished && d.countdown <= 0) {
          var target = car.cp < cps.length ? cps[car.cp] : 0;
          if (passed(startSi, car.si, target, n)) {
            car.lastCp = target;
            if (car.cp < cps.length) {
              car.cp++;
              if (car.player) { Milo.sound.blip(); playerSector(g, car.cp - 1); }
            } else {
              car.cp = 1;
              car.lap++;
              if (car.player) playerSector(g, cps.length);
              if (car.lap >= d.laps) {
                car.finished = true;
                car.finishMs = d.ms;
                if (car.player) finishRace(g);
              } else if (car.player) {
                g.set('Lap', Math.min(car.lap + 1, d.laps) + '/' + d.laps);
                say(d, 'Lap ' + (car.lap + 1) + ' of ' + d.laps);
                Milo.sound.powerup();
              }
            }
          }
        }
        car.prog = car.lap * n + car.si;
      });

      // Keep cars from occupying the same patch of tarmac.
      for (var a = 0; a < d.cars.length; a++) {
        for (var b = a + 1; b < d.cars.length; b++) {
          var c1 = d.cars[a], c2 = d.cars[b];
          var dx = c2.x - c1.x, dz = c2.z - c1.z;
          var dist = Math.hypot(dx, dz);
          if (dist > 3.4 || dist < .001) continue;
          if (Math.abs(c1.y - c2.y) > 2.5) continue;
          var push = (3.4 - dist) / 2;
          var nx = dx / dist, nz = dz / dist;
          // The heavier car gives less ground.
          var m1 = c1.phys.mass + .2, m2 = c2.phys.mass + .2, mt = m1 + m2;
          c1.x -= nx * push * (m2 / mt) * 2; c1.z -= nz * push * (m2 / mt) * 2;
          c2.x += nx * push * (m1 / mt) * 2; c2.z += nz * push * (m1 / mt) * 2;
          c1.vx *= .94; c1.vz *= .94; c2.vx *= .94; c2.vz *= .94;
          if ((c1.player || c2.player)) Milo.sound.hit();
        }
      }
    }

    function puff(d, car, hot) {
      if (d.puffs.length > 90) return;
      d.puffs.push({
        x: car.x - Math.sin(car.yaw) * 1.6 + U.rand(-.5, .5),
        y: car.y - .3,
        z: car.z - Math.cos(car.yaw) * 1.6 + U.rand(-.5, .5),
        life: hot ? .35 : .55, max: hot ? .35 : .55, hot: hot
      });
    }

    function say(d, text) { d.msg = text; d.msgT = 2.2; }

    /**
     * F1-style sector timing: the lap splits into three at checkpoint
     * boundaries, and each split is compared to the stored personal best.
     */
    function playerSector(g, cpPassed) {
      var d = g.data;
      var count = d.built.checkpoints.length;
      var b1 = Math.floor(count / 3), b2 = Math.floor(count * 2 / 3);
      var idx = cpPassed === b1 ? 0 : cpPassed === b2 ? 1 : cpPassed >= count ? 2 : -1;
      if (idx < 0) return;
      var t = d.ms - d.sectorT;
      d.sectorT = d.ms;
      var rec = trackEntry(save, current.index);
      if (!rec.sectors) rec.sectors = [0, 0, 0];
      var old = rec.sectors[idx];
      var msg = 'Sector ' + (idx + 1) + ' — ' + (t / 1000).toFixed(2) + 's';
      if (!old || t < old) {
        rec.sectors[idx] = Math.round(t);
        persist(save);
        if (old) msg += '  · personal best!';
      } else {
        msg += '  (+' + ((t - old) / 1000).toFixed(2) + ')';
      }
      say(d, msg);
    }

    /* -------------------------------------------------------- finishing */

    function finishRace(g) {
      var d = g.data;
      if (d.done) return;
      d.done = true;
      var i = current.index;
      var rec = trackEntry(save, i);
      var ms = d.ms;

      var place = rankOf(d, d.me);

      var medal = medalFor(d.times, ms);
      var first = !rec.best;
      var improved = !rec.best || ms < rec.best;
      if (improved) rec.best = ms;
      if (medal > (rec.medal || 0)) rec.medal = medal;

      // Winnings taper down the 19-car field, plus medals and unlock bonuses.
      var prize = Math.max(120, Math.round(1100 * Math.pow(.85, place - 1)));
      prize += medal * 260;
      prize += first ? 400 + d.track.diff * 180 : 0;
      if (improved && !first) prize += 150;
      save.credits += prize;
      persist(save);

      g.score = Math.round(prize + medal * 500 + Math.max(0, 260 - ms / 1000) * 12);
      var nextIdx = i + 1;
      var actions = [];
      if (nextIdx < TRACKS.length && trackUnlocked(save, nextIdx)) {
        actions.push({
          label: '▶  Next: ' + TRACKS[nextIdx].name, primary: true,
          onClick: function () { ensureTrack(nextIdx); g.restart(); }
        });
      }
      actions.push({ label: '↻  Retry', primary: !actions.length, onClick: function () { g.restart(); } });
      actions.push({ label: '🔧  Garage', onClick: function () { openMenu(g, 'Race'); } });

      Milo.store.setBest(g.id, g.score);
      g.best = Milo.store.best(g.id);
      g.state = 'over';
      hideHud();
      Milo.sound.win();
      g.overlay({
        emo: place === 1 ? '🏆' : (medal === 3 ? '🥇' : '🏁'),
        title: place === 1 ? 'Race won!' : 'Finished ' + ordinal(place) + ' of ' + d.cars.length,
        text: fmtTime(ms) + ' · ' + MEDAL_NAMES[medal] +
          (improved ? ' · new personal best' : ' · best ' + fmtTime(rec.best)) +
          ' · earned ' + U.fmt(prize) + ' credits',
        actions: actions,
        hint: 'Gold under ' + fmtTime(d.times.gold * 1000) + ' · Silver under ' + fmtTime(d.times.silver * 1000)
      });
    }

    /* ---------------------------------------------------------- drawing */

    function render(g, wall) {
      if (!gpu) return;
      var gl = gpu.gl, L = gpu.loc, d = g.data;
      var theme = d && d.theme ? d.theme : current.theme;
      var built = d && d.built ? d.built : current.built;
      if (!built) return;

      var me = d && d.me;
      var eye, look;
      if (me && g.state !== 'start') {
        var speed = Math.hypot(me.vx, me.vz);
        var k = U.clamp(speed / me.phys.top, 0, 1);
        var fwdX = Math.sin(me.yaw), fwdZ = Math.cos(me.yaw);
        var want = [
          me.x - fwdX * (9.6 + k * 3.4), me.y + 4.0 + k * .9, me.z - fwdZ * (9.6 + k * 3.4)
        ];
        if (!d.cam) d.cam = want.slice();
        // A lagging camera reads as speed; snapping to the car reads as a diagram.
        var f = 1 - Math.exp(-7 * Math.max(wall, .0001));
        d.cam[0] += (want[0] - d.cam[0]) * f;
        d.cam[1] += (want[1] - d.cam[1]) * f;
        d.cam[2] += (want[2] - d.cam[2]) * f;
        eye = d.cam;
        look = [me.x + fwdX * 7, me.y + 1.3, me.z + fwdZ * 7];
        g.data.camK = k;
      } else {
        // Menu: a slow orbit of the circuit, so the garage has the track behind it.
        var a = wallClock * .12;
        var rad = built.spec.radius * 1.5;
        eye = [Math.cos(a) * rad, built.spec.radius * .42 + 40, Math.sin(a) * rad];
        look = [0, 0, 0];
        g.data.camK = 0;
      }

      var aspect = Math.max(.35, g.W / Math.max(1, g.H));
      var fov = (60 + (g.data.camK || 0) * 13) * Math.PI / 180;
      var proj = M.perspective(fov, aspect, .6, 3600);
      var view = M.lookAt(eye[0], eye[1], eye[2], look[0], look[1], look[2], 0, 1, 0);
      var vp = M.mul(proj, view);

      gl.clearColor(theme.sky[0], theme.sky[1], theme.sky[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.disable(gl.BLEND);

      gl.useProgram(gpu.prog);
      gl.uniformMatrix4fv(L.vp, false, vp);
      gl.uniform3f(L.eye, eye[0], eye[1], eye[2]);
      gl.uniform2f(L.fog, 150, 620);
      gl.uniform3f(L.fogColor, theme.fog[0], theme.fog[1], theme.fog[2]);
      gl.uniform1f(L.alpha, 1);

      var ident = M.identity();
      gl.uniformMatrix4fv(L.model, false, ident);
      gl.uniform3f(L.uTint, 1, 1, 1);

      if (gpu.groundN) { bindMesh(gpu.ground); gl.drawArrays(gl.TRIANGLES, 0, gpu.groundN); }
      if (gpu.trackN) { bindMesh(gpu.track); gl.drawArrays(gl.TRIANGLES, 0, gpu.trackN); }

      if (d && d.cars) {
        bindMesh(gpu.car);
        d.cars.forEach(function (car) {
          if (car.respawnT > 0 && Math.floor(car.respawnT * 12) % 2) return;   // blink
          var model = M.model(car.x, car.y, car.z, car.yaw, car.pitch, car.roll, 1, 1, 1);
          gl.uniformMatrix4fv(L.model, false, model);
          gl.uniform3f(L.uTint, car.col[0], car.col[1], car.col[2]);
          gl.drawArrays(gl.TRIANGLES, 0, gpu.carN);
        });

        if (d.puffs.length) {
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          gl.depthMask(false);
          bindMesh(gpu.puff);
          d.puffs.forEach(function (p) {
            var f = p.life / p.max;
            var sc = (1.6 - f) * (p.hot ? 1.5 : 2.1);
            gl.uniformMatrix4fv(L.model, false, M.model(p.x, p.y + (1 - f) * 1.2, p.z, 0, 0, 0, sc, 1, sc));
            if (p.hot) gl.uniform3f(L.uTint, 1, .62, .25);
            else gl.uniform3f(L.uTint, .88, .90, .96);
            gl.uniform1f(L.alpha, f * (p.hot ? .55 : .35));
            gl.drawArrays(gl.TRIANGLES, 0, gpu.puffN);
          });
          gl.uniform1f(L.alpha, 1);
          gl.depthMask(true);
          gl.disable(gl.BLEND);
        }
      }
    }

    /* ------------------------------------------------------------ frame */

    var wallClock = 0, lastWall = 0;

    function frame(g, dt) {
      var now = performance.now();
      var wall = lastWall ? Math.min((now - lastWall) / 1000, .05) : .016;
      lastWall = now;
      wallClock += wall;

      var d = g.data;
      if (g.state === 'play' && d.built) {
        if (d.countdown > 0) {
          d.countdown -= dt;
          // Five red lights come on one by one; all out means go.
          var lit = Math.min(5, Math.floor((4.4 - Math.max(0, d.countdown)) / .8));
          if (lit > d.lastLit) { d.lastLit = lit; Milo.sound.blip(); }
          if (d.countdown <= 0) { say(d, 'GO!'); Milo.sound.win(); }
        } else if (!d.done) {
          d.ms += dt * 1000;
        }
        step(g, dt);

        for (var i = d.puffs.length - 1; i >= 0; i--) {
          d.puffs[i].life -= dt;
          if (d.puffs[i].life <= 0) d.puffs.splice(i, 1);
        }
        if (d.msgT > 0) d.msgT -= dt;

        var me = d.me;
        var speed = Math.hypot(me.vx, me.vz);
        g.set('Speed', Math.round(speed * 3.6));
        g.set('Time', fmtTime(d.ms));
        g.set('Pos', rankOf(d, me) + '/' + d.cars.length);

        // Wrong-way warning: are we actually pointing along the track?
        var sm = me.sm || d.built.samples[0];
        var dot = Math.sin(me.yaw) * sm.tx + Math.cos(me.yaw) * sm.tz;
        d.wrong = (dot < -.25 && speed > 5) ? d.wrong + dt : 0;

        if (lightsEl) {
          var showLights = d.countdown > 0;
          lightsEl.style.display = showLights ? 'flex' : 'none';
          if (showLights) {
            for (var li = 0; li < 5; li++) {
              lightsEl.children[li].classList.toggle('on', li < d.lastLit);
            }
          }
        }
        if (msgEl) {
          var text = d.countdown > 0 ? ''
            : (d.wrong > .5 ? 'WRONG WAY' : (d.msgT > 0 ? d.msg : ''));
          if (msgEl.textContent !== text) msgEl.textContent = text;
          var warn = d.wrong > .5;
          if (msgEl.classList.contains('warn') !== warn) msgEl.classList.toggle('warn', warn);
        }
        if (nitroEl) nitroEl.firstChild.style.width = Math.round(me.nitro * 100) + '%';
      }

      render(g, wall);
    }

    /* ------------------------------------------------------------ mount */

    var api = Milo.glGame(host, {
      id: 'turbo-drift',
      stats: ['Track', 'Lap', 'Pos', 'Time', 'Speed', 'Best'],
      emo: '🏎️',
      touch: 'dpad+a',
      pointerLock: false,
      touchLook: false,
      trackBest: true,
      maxDpr: 1.5,

      preload: function (g) {
        initGpu(g);
        ensureTrack(current.index);
        // Own start screen: the garage is the front door, not an afterthought.
        g.showStart = function () {
          g.state = 'start';
          hideHud();
          openMenu(g, 'Race');
        };
      },

      init: function (g) {
        closeMenu();
        reset(g);
      },

      onPause: function () { hideHud(); },
      onResume: function (g) { showHud(g); },

      onKey: function (g, e) {
        if (e.code === 'KeyG') { g.state = 'start'; hideHud(); openMenu(g, 'Race'); }
      },

      frame: frame,

      destroy: function () { closeMenu(); hideHud(); }
    });

    return api;
  }

  Milo.register({
    id: 'turbo-drift', title: 'Turbo Drift', emo: '🏎️', category: 'Racing',
    tagline: 'Fifty grand-prix circuits, a 19-car grid',
    description: 'A low-poly 3D racer across fifty grand-prix style circuits: long straights ' +
      'that funnel into braking corners, chicane complexes, banked sweepers, tunnels — and, ' +
      'because this is not quite Formula One, ramps that launch you over gaps in the road. ' +
      'Five red lights start every race F1-style, and each lap splits into three timed ' +
      'sectors against your personal bests. You start at ' +
      'the back of the grid with the fastest rivals on pole, grandstands full of fans line the ' +
      'straights, and every race runs past the two-minute mark even flat out. Ten cars and six ' +
      'tuning branches turn your winnings into lap time.',
    controls: ['↑ accelerate', '↓ brake and reverse', '← → steer', 'Space for nitrous', 'G opens the garage'],
    colors: ['#22d3ee', '#ef4444'],
    featured: true,
    tags: ['racing', '3d', 'cars', 'tuning', 'time trial'],
    mount: mount
  });
})();
