/* ==========================================================================
   Blockcraft — a first-person voxel sandbox (WebGL)
   Procedural terrain, block breaking and placing, gravity + flight, and
   edits that persist in localStorage so your world is still there tomorrow.
   ========================================================================== */
(function () {
  'use strict';

  var CH = 16;          // chunk width/depth in blocks
  var WH = 48;          // world height
  var CX = 8, CZ = 8;   // world size in chunks
  var WX = CX * CH, WZ = CZ * CH;
  var SEA = 22;
  var REACH = 6;
  var MAX_EDITS = 24000;

  /* ------------------------------------------------------------- blocks */

  // tiles: [top, bottom, side] indices into the 4x4 texture atlas
  var BLOCKS = {
    1: { name: 'Grass', tiles: [0, 2, 1] },
    2: { name: 'Dirt', tiles: [2, 2, 2] },
    3: { name: 'Stone', tiles: [3, 3, 3] },
    4: { name: 'Log', tiles: [5, 5, 4] },
    5: { name: 'Leaves', tiles: [6, 6, 6] },
    6: { name: 'Sand', tiles: [7, 7, 7] },
    7: { name: 'Water', tiles: [8, 8, 8], liquid: true, transparent: true },
    8: { name: 'Planks', tiles: [9, 9, 9] },
    9: { name: 'Brick', tiles: [10, 10, 10] },
    10: { name: 'Glass', tiles: [11, 11, 11], transparent: true },
    11: { name: 'Cobble', tiles: [12, 12, 12] },
    12: { name: 'Snow', tiles: [13, 13, 13] },
    13: { name: 'Lamp', tiles: [14, 14, 14], glow: true }
  };

  var HOTBAR = [1, 3, 11, 8, 4, 9, 10, 6, 13];
  var SWATCH = {
    1: '#5aa02c', 2: '#8b5a2b', 3: '#8a8a8f', 4: '#6b4a26', 5: '#3f7f2f',
    6: '#e0d29a', 7: '#3b6fd4', 8: '#b9884f', 9: '#a3402f', 10: '#bfe6f2',
    11: '#7d7d84', 12: '#f2f6ff', 13: '#ffd257'
  };

  function isTransparent(id) { return id === 0 || (BLOCKS[id] && BLOCKS[id].transparent); }
  function isSolid(id) { return id !== 0 && !(BLOCKS[id] && BLOCKS[id].liquid); }

  /* ---------------------------------------------------------- atlas art */

  /** Draws the 4x4 / 16px texture atlas procedurally onto a 2D canvas. */
  function buildAtlas() {
    var S = 16, c = document.createElement('canvas');
    c.width = c.height = S * 4;
    var x = c.getContext('2d');
    var img = x.createImageData(S * 4, S * 4);
    var d = img.data;

    function put(tile, px, py, r, g, b, a) {
      var ox = (tile % 4) * S, oy = ((tile / 4) | 0) * S;
      var i = ((oy + py) * S * 4 + (ox + px)) * 4;
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a == null ? 255 : a;
    }
    // Deterministic per-pixel jitter so textures look grainy but stable.
    function n(px, py, tile) {
      var h = (px * 73856093) ^ (py * 19349663) ^ (tile * 83492791);
      h = (h ^ (h >> 13)) * 1274126177;
      return ((h ^ (h >> 16)) >>> 0) / 4294967296;
    }
    function fill(tile, fn) {
      for (var py = 0; py < S; py++) {
        for (var px = 0; px < S; px++) fn(px, py, n(px, py, tile));
      }
    }

    fill(0, function (px, py, r) {                       // grass top
      var v = r * 34;
      put(0, px, py, 74 + v, 140 + v * 1.2, 48 + v);
    });
    fill(1, function (px, py, r) {                       // grass side
      var v = r * 30;
      if (py < 4) put(1, px, py, 74 + v, 140 + v, 48 + v);
      else put(1, px, py, 122 + v, 88 + v, 54 + v);
    });
    fill(2, function (px, py, r) {                       // dirt
      var v = r * 34;
      put(2, px, py, 122 + v, 88 + v, 54 + v);
    });
    fill(3, function (px, py, r) {                       // stone
      var v = r * 40;
      put(3, px, py, 118 + v, 118 + v, 124 + v);
    });
    fill(4, function (px, py, r) {                       // log side
      var streak = Math.sin(px * 1.6) * 10;
      var v = r * 20 + streak;
      put(4, px, py, 106 + v, 74 + v, 40 + v);
    });
    fill(5, function (px, py, r) {                       // log top (rings)
      var dx = px - 7.5, dy = py - 7.5;
      var ring = Math.sin(Math.hypot(dx, dy) * 2.2) * 16;
      var v = r * 14 + ring;
      put(5, px, py, 150 + v, 112 + v, 66 + v);
    });
    fill(6, function (px, py, r) {                       // leaves
      var v = r * 60;
      var dark = r < .22;
      put(6, px, py, (dark ? 30 : 52) + v * .5, (dark ? 78 : 118) + v * .6, (dark ? 28 : 44) + v * .4);
    });
    fill(7, function (px, py, r) {                       // sand
      var v = r * 26;
      put(7, px, py, 220 + v * .4, 206 + v * .5, 150 + v);
    });
    fill(8, function (px, py, r) {                       // water
      var w = Math.sin((px + py) * .8) * 12;
      put(8, px, py, 46 + r * 14 + w, 104 + r * 18 + w, 198 + r * 20, 165);
    });
    fill(9, function (px, py, r) {                       // planks
      var line = (py % 5 === 0) ? -34 : 0;
      var v = r * 20 + line;
      put(9, px, py, 190 + v, 148 + v, 92 + v);
    });
    fill(10, function (px, py, r) {                      // brick
      var row = (py / 4) | 0;
      var mortar = (py % 4 === 0) || ((px + (row % 2) * 4) % 8 === 0);
      var v = r * 18;
      if (mortar) put(10, px, py, 188 + v, 180 + v, 172 + v);
      else put(10, px, py, 158 + v, 62 + v, 48 + v);
    });
    fill(11, function (px, py, r) {                      // glass
      var edge = px === 0 || py === 0 || px === S - 1 || py === S - 1;
      var glint = (px === py) || (px === py + 1);
      put(11, px, py, 214, 238, 248, edge ? 210 : (glint ? 120 : 46));
    });
    fill(12, function (px, py, r) {                      // cobble
      var blob = ((px / 5) | 0) * 3 + ((py / 5) | 0);
      var v = r * 30 + (blob % 2 ? 12 : -12);
      put(12, px, py, 122 + v, 122 + v, 126 + v);
    });
    fill(13, function (px, py, r) {                      // snow
      var v = r * 18;
      put(13, px, py, 232 + v, 240 + v, 252);
    });
    fill(14, function (px, py, r) {                      // lamp
      var dx = px - 7.5, dy = py - 7.5;
      var glow = Math.max(0, 1 - Math.hypot(dx, dy) / 9);
      var v = r * 30 + glow * 70;
      put(14, px, py, 240 + v * .1, 190 + v * .3, 70 + v);
    });
    fill(15, function (px, py, r) { put(15, px, py, 255, 0, 255); });

    x.putImageData(img, 0, 0);
    return c;
  }

  /* ------------------------------------------------------------- mat4 */

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
  function m4translate(x, y, z) {
    var o = new Float32Array(16);
    o[0] = o[5] = o[10] = o[15] = 1;
    o[12] = x; o[13] = y; o[14] = z;
    return o;
  }

  /* --------------------------------------------------------- geometry */

  // dir, brightness, four corners (unit cube local), which tile slot
  var FACES = [
    { d: [0, 1, 0], sh: 1.00, c: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]], t: 0 },
    { d: [0, -1, 0], sh: 0.48, c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], t: 1 },
    { d: [0, 0, 1], sh: 0.82, c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], t: 2 },
    { d: [0, 0, -1], sh: 0.72, c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], t: 2 },
    { d: [1, 0, 0], sh: 0.90, c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], t: 2 },
    { d: [-1, 0, 0], sh: 0.62, c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], t: 2 }
  ];
  var FACE_UV = [[0, 1], [1, 1], [1, 0], [0, 0]];

  var VS = [
    'attribute vec3 aPos;',
    'attribute vec2 aUV;',
    'attribute float aShade;',
    'uniform mat4 uMVP;',
    'uniform vec3 uEye;',
    'varying vec2 vUV;',
    'varying float vShade;',
    'varying float vFog;',
    'void main(){',
    '  gl_Position = uMVP * vec4(aPos,1.0);',
    '  vUV = aUV;',
    '  vShade = aShade;',
    '  vFog = clamp((length(aPos - uEye) - 34.0) / 46.0, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FS = [
    'precision mediump float;',
    'uniform sampler2D uTex;',
    'uniform vec3 uFogColor;',
    'varying vec2 vUV;',
    'varying float vShade;',
    'varying float vFog;',
    'void main(){',
    '  vec4 c = texture2D(uTex, vUV);',
    '  if (c.a < 0.04) discard;',
    '  vec3 rgb = c.rgb * vShade;',
    '  gl_FragColor = vec4(mix(rgb, uFogColor, vFog), c.a);',
    '}'
  ].join('\n');

  var LINE_VS = 'attribute vec3 aPos; uniform mat4 uMVP; void main(){ gl_Position = uMVP * vec4(aPos,1.0); }';
  var LINE_FS = 'precision mediump float; void main(){ gl_FragColor = vec4(0.05,0.05,0.08,0.85); }';

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error('Shader: ' + gl.getShaderInfoLog(s));
    }
    return s;
  }
  function program(gl, vs, fs) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error('Link: ' + gl.getProgramInfoLog(p));
    }
    return p;
  }

  /* ------------------------------------------------------------- world */

  function World(seed) {
    this.seed = seed;
    this.blocks = new Uint8Array(WX * WH * WZ);
    this.edits = {};
  }
  World.prototype.idx = function (x, y, z) { return (y * WZ + z) * WX + x; };
  World.prototype.inside = function (x, y, z) {
    return x >= 0 && x < WX && y >= 0 && y < WH && z >= 0 && z < WZ;
  };
  World.prototype.get = function (x, y, z) {
    if (y < 0) return 3;                       // bedrock floor: never fall out
    if (!this.inside(x, y, z)) return 0;
    return this.blocks[this.idx(x, y, z)];
  };
  World.prototype.set = function (x, y, z, v) {
    if (!this.inside(x, y, z)) return;
    this.blocks[this.idx(x, y, z)] = v;
  };

  World.prototype.generate = function () {
    var U = window.Milo.util, seed = this.seed, b = this.blocks, self = this;
    for (var z = 0; z < WZ; z++) {
      for (var x = 0; x < WX; x++) {
        var base = U.fbm(x * 0.018, z * 0.018, 4, seed);
        var ridge = U.fbm(x * 0.055, z * 0.055, 3, seed + 7);
        var h = Math.floor(16 + base * 26 + ridge * 6);
        h = Math.max(6, Math.min(WH - 8, h));
        var beach = h <= SEA + 1;
        for (var y = 0; y <= h; y++) {
          var v;
          if (y === h) v = beach ? 6 : (h > 38 ? 12 : 1);
          else if (y > h - 4) v = beach ? 6 : 2;
          else v = 3;
          b[self.idx(x, y, z)] = v;
        }
        for (var w = h + 1; w <= SEA; w++) b[self.idx(x, w, z)] = 7;
        // Scatter trees on grass well above the waterline.
        if (!beach && h < 38 && h > SEA + 1 && U.hash2(x, z, seed + 31) < 0.012 &&
          x > 2 && z > 2 && x < WX - 3 && z < WZ - 3) {
          this.tree(x, h + 1, z);
        }
      }
    }
  };

  World.prototype.tree = function (x, y, z) {
    var U = window.Milo.util;
    var tall = 4 + Math.floor(U.hash2(x, z, this.seed + 5) * 3);
    for (var i = 0; i < tall; i++) this.set(x, y + i, z, 4);
    var top = y + tall;
    for (var dy = -2; dy <= 1; dy++) {
      var r = dy <= -1 ? 2 : 1;
      for (var dx = -r; dx <= r; dx++) {
        for (var dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) === r && Math.abs(dz) === r && r > 1) continue;
          if (dx === 0 && dz === 0 && dy < 1) continue;
          if (this.get(x + dx, top + dy, z + dz) === 0) this.set(x + dx, top + dy, z + dz, 5);
        }
      }
    }
  };

  World.prototype.applyEdits = function (edits) {
    this.edits = edits || {};
    for (var k in this.edits) {
      var i = +k;
      if (i >= 0 && i < this.blocks.length) this.blocks[i] = this.edits[k];
    }
  };

  /* -------------------------------------------------------------- game */

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var atlas = buildAtlas();

    var world = null;
    var chunks = [];          // {cx, cz, opaque:{buf,count}, alpha:{buf,count}, dirty}
    var meshQueue = [];
    var prog = null, lineProg = null, tex = null, lineBuf = null;
    var loc = {}, lineLoc = {};

    var P = {                 // player
      x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
      yaw: 0, pitch: 0, onGround: false, fly: false
    };
    var slot = 0, mined = 0, placed = 0;
    var fpsAcc = 0, fpsCount = 0, fpsTimer = 0;
    var breakCd = 0, placeCd = 0;
    var saveTimer = null;
    var target = null;        // {x,y,z, nx,ny,nz}

    var runner = Milo.glGame(host, {
      id: 'blockcraft',
      stats: ['Mined', 'Placed', 'FPS'],
      trackBest: false,
      touchLook: true,
      touch: 'dpad',
      touchButtons: [
        { key: 'b', label: 'MINE' },
        { key: 'a', label: 'PUT' },
        { key: 'action', label: 'JUMP' }
      ],
      start: {
        emo: '⛏️',
        title: 'Blockcraft',
        text: 'An infinite-feeling voxel world that is yours to dig up. ' +
          'Click to lock the mouse, then build whatever you like — your changes are saved.',
        keys: ['WASD move', 'Mouse look', 'Space jump', 'Shift sprint', 'F fly',
          'Left click mine', 'Right click place', '1–9 pick block'],
        hint: 'Tip: press F to fly, then F again to drop back down'
      },
      preload: function (g) { setup(g); },
      init: function (g) { start(g); },
      frame: function (g, dt) { frame(g, dt); },
      onMouseDown: function (g, button) {
        if (g.state !== 'play' || !g.mouse.locked) return;
        if (button === 0) doBreak(g);
        if (button === 2) doPlace(g);
      },
      onResume: function (g) { g.requestLock(); },
      onKey: function (g, e) {
        if (e.code === 'KeyF') { P.fly = !P.fly; P.vy = 0; Milo.sound.blip(); }
        var m = /^Digit([1-9])$/.exec(e.code);
        if (m) { slot = +m[1] - 1; drawHotbar(); Milo.sound.click(); }
      },
      destroy: function () { if (saveTimer) clearTimeout(saveTimer); flushSave(); }
    });

    var g = runner.g;
    if (!g) return runner;   // WebGL unavailable — glGame already rendered a notice

    /* --- DOM extras: crosshair + hotbar --- */
    var cross = document.createElement('div');
    cross.style.cssText = 'position:absolute;left:50%;top:50%;width:22px;height:22px;' +
      'margin:-11px 0 0 -11px;pointer-events:none;z-index:6;opacity:.85';
    cross.innerHTML = '<svg viewBox="0 0 22 22"><path d="M11 3v6M11 13v6M3 11h6M13 11h6" ' +
      'stroke="#fff" stroke-width="2" stroke-linecap="round" ' +
      'style="filter:drop-shadow(0 0 2px rgba(0,0,0,.9))"/></svg>';
    g.hud.appendChild(cross);

    var hotbar = document.createElement('div');
    hotbar.style.cssText = 'position:absolute;left:50%;bottom:14px;transform:translateX(-50%);' +
      'display:flex;gap:5px;padding:5px;border-radius:12px;z-index:6;pointer-events:auto;' +
      'background:rgba(8,10,26,.55);border:1px solid rgba(255,255,255,.14);' +
      'backdrop-filter:blur(8px)';
    g.hud.appendChild(hotbar);

    function drawHotbar() {
      hotbar.innerHTML = '';
      HOTBAR.forEach(function (id, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.title = BLOCKS[id].name;
        b.style.cssText = 'width:38px;height:38px;border-radius:9px;cursor:pointer;' +
          'display:grid;place-items:end center;padding-bottom:2px;font:700 9px/1 system-ui;' +
          'color:rgba(255,255,255,.85);text-shadow:0 1px 2px #000;' +
          'background:' + SWATCH[id] + ';border:2px solid ' +
          (i === slot ? '#fff' : 'rgba(255,255,255,.18)');
        b.textContent = i + 1;
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          slot = i;
          drawHotbar();
        });
        hotbar.appendChild(b);
      });
    }
    drawHotbar();

    /* --- GL setup --- */
    function setup(g) {
      var gl = g.gl;
      prog = program(gl, VS, FS);
      lineProg = program(gl, LINE_VS, LINE_FS);
      loc = {
        pos: gl.getAttribLocation(prog, 'aPos'),
        uv: gl.getAttribLocation(prog, 'aUV'),
        shade: gl.getAttribLocation(prog, 'aShade'),
        mvp: gl.getUniformLocation(prog, 'uMVP'),
        eye: gl.getUniformLocation(prog, 'uEye'),
        tex: gl.getUniformLocation(prog, 'uTex'),
        fog: gl.getUniformLocation(prog, 'uFogColor')
      };
      lineLoc = {
        pos: gl.getAttribLocation(lineProg, 'aPos'),
        mvp: gl.getUniformLocation(lineProg, 'uMVP')
      };

      tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      lineBuf = gl.createBuffer();
      gl.enable(gl.DEPTH_TEST);
      gl.clearColor(0.53, 0.75, 0.93, 1);
    }

    /* --- world lifecycle --- */
    function start(g) {
      var saved = Milo.store.get('blockcraft:world', null);
      var seed = (saved && saved.seed) || Math.floor(Math.random() * 100000);
      world = new World(seed);
      world.generate();
      if (saved && saved.edits) world.applyEdits(saved.edits);
      Milo.store.set('blockcraft:world', { seed: seed, edits: world.edits });

      chunks = [];
      meshQueue = [];
      for (var cz = 0; cz < CZ; cz++) {
        for (var cx = 0; cx < CX; cx++) {
          var c = { cx: cx, cz: cz, opaque: null, alpha: null };
          chunks.push(c);
          meshQueue.push(c);
        }
      }

      // Spawn on the surface at the middle of the map.
      var sx = WX >> 1, sz = WZ >> 1;
      var sy = WH - 1;
      while (sy > 1 && world.get(sx, sy, sz) === 0) sy--;
      P.x = sx + .5; P.y = sy + 2.2; P.z = sz + .5;
      P.vx = P.vy = P.vz = 0;
      P.yaw = 0; P.pitch = -0.15; P.fly = false;
      mined = 0; placed = 0; slot = 0;
      drawHotbar();
      g.set('Mined', 0);
      g.set('Placed', 0);

      // Sort so chunks nearest the player mesh first.
      meshQueue.sort(function (a, b) {
        return dist2(a) - dist2(b);
      });
      function dist2(c) {
        var dx = (c.cx * CH + CH / 2) - P.x, dz = (c.cz * CH + CH / 2) - P.z;
        return dx * dx + dz * dz;
      }

      g.requestLock();
    }

    /* --- meshing --- */
    function shouldFace(here, there) {
      if (there === 0) return true;
      if (there === here) return false;
      return isTransparent(there);
    }

    function meshChunk(gl, c) {
      var opaque = [], alpha = [];
      var x0 = c.cx * CH, z0 = c.cz * CH;
      for (var y = 0; y < WH; y++) {
        for (var z = z0; z < z0 + CH; z++) {
          for (var x = x0; x < x0 + CH; x++) {
            var id = world.get(x, y, z);
            if (id === 0) continue;
            var def = BLOCKS[id];
            if (!def) continue;
            var out = def.transparent ? alpha : opaque;
            for (var f = 0; f < 6; f++) {
              var F = FACES[f];
              var nb = world.get(x + F.d[0], y + F.d[1], z + F.d[2]);
              if (!shouldFace(id, nb)) continue;
              var tile = def.tiles[F.t];
              var tu = (tile % 4) / 4, tv = ((tile / 4) | 0) / 4;
              var sh = def.glow ? 1 : F.sh;
              // two triangles: 0,1,2 and 0,2,3
              var order = [0, 1, 2, 0, 2, 3];
              for (var v = 0; v < 6; v++) {
                var ci = order[v], cc = F.c[ci], uv = FACE_UV[ci];
                out.push(
                  x + cc[0], y + cc[1], z + cc[2],
                  tu + (uv[0] * .25 - (uv[0] ? .002 : -.002)),
                  tv + (uv[1] * .25 - (uv[1] ? .002 : -.002)),
                  sh
                );
              }
            }
          }
        }
      }
      c.opaque = upload(gl, c.opaque, opaque);
      c.alpha = upload(gl, c.alpha, alpha);
    }

    function upload(gl, existing, arr) {
      if (!arr.length) {
        if (existing && existing.buf) gl.deleteBuffer(existing.buf);
        return null;
      }
      var buf = (existing && existing.buf) || gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.STATIC_DRAW);
      return { buf: buf, count: arr.length / 6 };
    }

    function chunkAt(x, z) {
      var cx = (x / CH) | 0, cz = (z / CH) | 0;
      if (cx < 0 || cz < 0 || cx >= CX || cz >= CZ) return null;
      return chunks[cz * CX + cx];
    }

    function markDirty(x, y, z) {
      var seen = [];
      [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (o) {
        var c = chunkAt(x + o[0], z + o[1]);
        if (c && seen.indexOf(c) === -1 && meshQueue.indexOf(c) === -1) {
          seen.push(c);
          meshQueue.unshift(c);
        }
      });
    }

    /* --- editing --- */
    function recordEdit(x, y, z, v) {
      var i = world.idx(x, y, z);
      world.edits[i] = v;
      if (Object.keys(world.edits).length > MAX_EDITS) return;
      queueSave();
    }
    function queueSave() {
      if (saveTimer) return;
      saveTimer = setTimeout(function () { saveTimer = null; flushSave(); }, 1200);
    }
    function flushSave() {
      if (!world) return;
      Milo.store.set('blockcraft:world', { seed: world.seed, edits: world.edits });
    }

    function doBreak(g) {
      if (!target || breakCd > 0) return;
      breakCd = .18;
      var id = world.get(target.x, target.y, target.z);
      if (id === 0 || id === 7) return;
      world.set(target.x, target.y, target.z, 0);
      recordEdit(target.x, target.y, target.z, 0);
      markDirty(target.x, target.y, target.z);
      mined++;
      g.set('Mined', mined);
      Milo.sound.tone({ f: 220 + Math.random() * 60, f2: 120, d: .09, v: .09, type: 'square' });
    }

    function doPlace(g) {
      if (!target || placeCd > 0) return;
      placeCd = .18;
      var x = target.x + target.nx, y = target.y + target.ny, z = target.z + target.nz;
      if (!world.inside(x, y, z)) return;
      if (isSolid(world.get(x, y, z))) return;
      // Don't seal the player inside a block.
      if (boxHitsBlock(P.x, P.y, P.z, x, y, z)) return;
      var id = HOTBAR[slot];
      world.set(x, y, z, id);
      recordEdit(x, y, z, id);
      markDirty(x, y, z);
      placed++;
      g.set('Placed', placed);
      Milo.sound.tone({ f: 320, f2: 420, d: .07, v: .08, type: 'triangle' });
    }

    /* --- physics --- */
    var PW = 0.32, PH = 1.72, EYE = 1.58;

    function boxHitsBlock(px, py, pz, bx, by, bz) {
      return px + PW > bx && px - PW < bx + 1 &&
        py + PH > by && py < by + 1 &&
        pz + PW > bz && pz - PW < bz + 1;
    }

    function collides(px, py, pz) {
      var x0 = Math.floor(px - PW), x1 = Math.floor(px + PW);
      var y0 = Math.floor(py), y1 = Math.floor(py + PH);
      var z0 = Math.floor(pz - PW), z1 = Math.floor(pz + PW);
      for (var y = y0; y <= y1; y++) {
        for (var z = z0; z <= z1; z++) {
          for (var x = x0; x <= x1; x++) {
            if (isSolid(world.get(x, y, z))) return true;
          }
        }
      }
      return false;
    }

    function move(dx, dy, dz) {
      // Resolve one axis at a time so sliding along walls feels right.
      if (dx) { if (!collides(P.x + dx, P.y, P.z)) P.x += dx; else P.vx = 0; }
      if (dz) { if (!collides(P.x, P.y, P.z + dz)) P.z += dz; else P.vz = 0; }
      if (dy) {
        if (!collides(P.x, P.y + dy, P.z)) { P.y += dy; P.onGround = false; }
        else {
          if (dy < 0) P.onGround = true;
          P.vy = 0;
        }
      }
    }

    /* --- raycast (DDA over the voxel grid) --- */
    function raycast() {
      var cp = Math.cos(P.pitch), sp = Math.sin(P.pitch);
      var cy = Math.cos(P.yaw), sy = Math.sin(P.yaw);
      var dx = -sy * cp, dy = sp, dz = -cy * cp;

      var ox = P.x, oy = P.y + EYE, oz = P.z;
      var x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
      var stepX = dx > 0 ? 1 : -1, stepY = dy > 0 ? 1 : -1, stepZ = dz > 0 ? 1 : -1;
      var tdx = Math.abs(1 / (dx || 1e-9)), tdy = Math.abs(1 / (dy || 1e-9)), tdz = Math.abs(1 / (dz || 1e-9));
      var tmx = ((dx > 0 ? (x + 1 - ox) : (ox - x)) || 0) * tdx;
      var tmy = ((dy > 0 ? (y + 1 - oy) : (oy - y)) || 0) * tdy;
      var tmz = ((dz > 0 ? (z + 1 - oz) : (oz - z)) || 0) * tdz;
      var nx = 0, ny = 0, nz = 0, t = 0;

      while (t <= REACH) {
        var id = world.get(x, y, z);
        if (id !== 0 && id !== 7) {
          return { x: x, y: y, z: z, nx: nx, ny: ny, nz: nz };
        }
        if (tmx < tmy && tmx < tmz) {
          x += stepX; t = tmx; tmx += tdx; nx = -stepX; ny = 0; nz = 0;
        } else if (tmy < tmz) {
          y += stepY; t = tmy; tmy += tdy; nx = 0; ny = -stepY; nz = 0;
        } else {
          z += stepZ; t = tmz; tmz += tdz; nx = 0; ny = 0; nz = -stepZ;
        }
      }
      return null;
    }

    /* --- frame --- */
    function frame(g, dt) {
      var gl = g.gl;

      // Mesh a few chunks per frame so world load never blocks the page.
      var budget = 3;
      while (meshQueue.length && budget-- > 0) meshChunk(gl, meshQueue.shift());

      if (g.state === 'play' && world) {
        update(g, dt);
      }
      render(g);

      fpsAcc += dt; fpsCount++;
      fpsTimer += dt;
      if (fpsTimer > .5) {
        g.set('FPS', fpsAcc > 0 ? Math.round(fpsCount / fpsAcc) : 0);
        fpsAcc = 0; fpsCount = 0; fpsTimer = 0;
      }
    }

    function update(g, dt) {
      var inp = g.input;

      // look
      var sens = 0.0024;
      P.yaw -= g.mouse.dx * sens;
      P.pitch -= g.mouse.dy * sens;
      P.pitch = U.clamp(P.pitch, -1.55, 1.55);

      // walk
      var fwd = (inp.down('up') ? 1 : 0) - (inp.down('down') ? 1 : 0);
      var strafe = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
      var sprint = inp.down('shift') ? 1.65 : 1;
      var speed = (P.fly ? 11 : 5.2) * sprint;

      var sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
      var mx = (-sy * fwd + cy * strafe);
      var mz = (-cy * fwd - sy * strafe);
      var len = Math.hypot(mx, mz);
      if (len > 0) { mx /= len; mz /= len; }

      var inWater = world.get(Math.floor(P.x), Math.floor(P.y + 0.9), Math.floor(P.z)) === 7;

      if (P.fly) {
        P.vy = 0;
        var lift = (inp.down('action') ? 1 : 0) - (inp.down('shift') ? 1 : 0);
        move(mx * speed * dt, lift * 8 * dt, mz * speed * dt);
      } else {
        var drag = P.onGround ? 14 : 6;
        P.vx += (mx * speed - P.vx) * Math.min(1, drag * dt);
        P.vz += (mz * speed - P.vz) * Math.min(1, drag * dt);
        var grav = inWater ? 9 : 26;
        P.vy -= grav * dt;
        if (inWater) {
          P.vy = Math.max(P.vy, -3.4);
          if (inp.down('action')) P.vy = 4.2;
        } else if (inp.down('action') && P.onGround) {
          P.vy = 8.6;
          P.onGround = false;
          Milo.sound.tone({ f: 260, f2: 200, d: .07, v: .05, type: 'triangle' });
        }
        P.vy = Math.max(P.vy, -32);
        move(P.vx * dt, P.vy * dt, P.vz * dt);
      }

      // Safety net: if the player somehow leaves the map, put them back.
      if (P.y < -6) {
        var sx = WX >> 1, sz = WZ >> 1, sy2 = WH - 1;
        while (sy2 > 1 && world.get(sx, sy2, sz) === 0) sy2--;
        P.x = sx + .5; P.y = sy2 + 2; P.z = sz + .5; P.vy = 0;
      }
      P.x = U.clamp(P.x, 0.4, WX - 0.4);
      P.z = U.clamp(P.z, 0.4, WZ - 0.4);

      target = raycast();

      breakCd -= dt; placeCd -= dt;
      if (g.mouse.left && g.mouse.locked) doBreak(g);
      if (g.mouse.right && g.mouse.locked) doPlace(g);
      if (inp.down('b')) doBreak(g);          // touch buttons
      if (inp.down('a')) doPlace(g);
      if (inp.wheel) {
        slot = (slot + (inp.wheel > 0 ? 1 : -1) + HOTBAR.length) % HOTBAR.length;
        drawHotbar();
      }
    }

    function render(g) {
      var gl = g.gl;
      var underwater = world &&
        world.get(Math.floor(P.x), Math.floor(P.y + EYE), Math.floor(P.z)) === 7;
      var fog = underwater ? [0.16, 0.38, 0.68] : [0.53, 0.75, 0.93];
      gl.clearColor(fog[0], fog[1], fog[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (!world || !prog) return;

      var proj = m4perspective(underwater ? 1.15 : 1.3, Math.max(.2, g.W / g.H), 0.1, 220);
      var view = m4mul(m4mul(m4rotX(-P.pitch), m4rotY(-P.yaw)),
        m4translate(-P.x, -(P.y + EYE), -P.z));
      var mvp = m4mul(proj, view);

      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.disable(gl.BLEND);

      gl.useProgram(prog);
      gl.uniformMatrix4fv(loc.mvp, false, mvp);
      gl.uniform3f(loc.eye, P.x, P.y + EYE, P.z);
      gl.uniform3f(loc.fog, fog[0], fog[1], fog[2]);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(loc.tex, 0);
      gl.enableVertexAttribArray(loc.pos);
      gl.enableVertexAttribArray(loc.uv);
      gl.enableVertexAttribArray(loc.shade);

      function drawMesh(m) {
        if (!m) return;
        gl.bindBuffer(gl.ARRAY_BUFFER, m.buf);
        gl.vertexAttribPointer(loc.pos, 3, gl.FLOAT, false, 24, 0);
        gl.vertexAttribPointer(loc.uv, 2, gl.FLOAT, false, 24, 12);
        gl.vertexAttribPointer(loc.shade, 1, gl.FLOAT, false, 24, 20);
        gl.drawArrays(gl.TRIANGLES, 0, m.count);
      }

      var i;
      for (i = 0; i < chunks.length; i++) drawMesh(chunks[i].opaque);

      // Transparent pass: blend on, depth writes off so water layers stack.
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      for (i = 0; i < chunks.length; i++) drawMesh(chunks[i].alpha);
      gl.depthMask(true);
      gl.disable(gl.BLEND);

      gl.disableVertexAttribArray(loc.pos);
      gl.disableVertexAttribArray(loc.uv);
      gl.disableVertexAttribArray(loc.shade);

      if (target) drawOutline(gl, mvp, target);
    }

    var OUTLINE = (function () {
      var e = [
        [0, 0, 0, 1, 0, 0], [1, 0, 0, 1, 0, 1], [1, 0, 1, 0, 0, 1], [0, 0, 1, 0, 0, 0],
        [0, 1, 0, 1, 1, 0], [1, 1, 0, 1, 1, 1], [1, 1, 1, 0, 1, 1], [0, 1, 1, 0, 1, 0],
        [0, 0, 0, 0, 1, 0], [1, 0, 0, 1, 1, 0], [1, 0, 1, 1, 1, 1], [0, 0, 1, 0, 1, 1]
      ];
      var a = [];
      e.forEach(function (s) { a.push(s[0], s[1], s[2], s[3], s[4], s[5]); });
      return new Float32Array(a);
    })();

    function drawOutline(gl, mvp, t) {
      var pts = new Float32Array(OUTLINE.length);
      var pad = 0.004;
      for (var i = 0; i < OUTLINE.length; i += 3) {
        pts[i] = t.x + OUTLINE[i] + (OUTLINE[i] ? pad : -pad);
        pts[i + 1] = t.y + OUTLINE[i + 1] + (OUTLINE[i + 1] ? pad : -pad);
        pts[i + 2] = t.z + OUTLINE[i + 2] + (OUTLINE[i + 2] ? pad : -pad);
      }
      gl.useProgram(lineProg);
      gl.uniformMatrix4fv(lineLoc.mvp, false, mvp);
      gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
      gl.bufferData(gl.ARRAY_BUFFER, pts, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(lineLoc.pos);
      gl.vertexAttribPointer(lineLoc.pos, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.LINES, 0, pts.length / 3);
      gl.disableVertexAttribArray(lineLoc.pos);
    }

    return runner;
  }

  window.Milo.register({
    id: 'blockcraft',
    title: 'Blockcraft',
    emo: '⛏️',
    category: 'Sandbox',
    tagline: 'Mine, build and explore a voxel world',
    description: 'A first-person voxel sandbox. Dig through hills, swim the oceans, ' +
      'chop trees and build whatever you want out of nine block types. Click the world ' +
      'to lock your mouse; press F to fly. Everything you change is saved in your browser, ' +
      'so your build is still standing when you come back.',
    controls: ['WASD', 'Mouse look', 'Space jump', 'Shift sprint', 'F fly',
      'Left click mine', 'Right click place', '1–9 blocks'],
    colors: ['#6aab3f', '#3f6b8f'],
    featured: true,
    tags: ['3d', 'sandbox', 'building', 'voxel', 'minecraft-like', 'exploration'],
    mount: mount
  });
})();
