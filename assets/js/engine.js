/* ==========================================================================
   MiloPlay engine
   A tiny arcade framework: canvas + loop + input + audio + HUD + overlays.
   Every game in assets/js/games/ registers itself here and gets mounted by
   the portal into a plain <div> stage. No iframes, no dependencies.
   ========================================================================== */
(function (global) {
  'use strict';

  var Milo = global.Milo || (global.Milo = {});

  /* ---------------------------------------------------------------- utils */

  var U = Milo.util = {
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    rand: function (a, b) { return a + Math.random() * (b - a); },
    randInt: function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
    choice: function (arr) { return arr[(Math.random() * arr.length) | 0]; },
    dist: function (x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); },
    aabb: function (a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    },
    shuffle: function (a) {
      for (var i = a.length - 1; i > 0; i--) {
        var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    },
    // Deterministic 2D hash noise, used by terrain / level generators.
    hash2: function (x, y, seed) {
      var h = x * 374761393 + y * 668265263 + (seed || 0) * 1442695040;
      h = (h ^ (h >> 13)) * 1274126177;
      return ((h ^ (h >> 16)) >>> 0) / 4294967296;
    },
    noise2: function (x, y, seed) {
      var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      var a = U.hash2(xi, yi, seed), b = U.hash2(xi + 1, yi, seed);
      var c = U.hash2(xi, yi + 1, seed), d = U.hash2(xi + 1, yi + 1, seed);
      return U.lerp(U.lerp(a, b, u), U.lerp(c, d, u), v);
    },
    fbm: function (x, y, oct, seed) {
      var t = 0, amp = 1, f = 1, norm = 0;
      for (var i = 0; i < (oct || 4); i++) {
        t += U.noise2(x * f, y * f, seed) * amp;
        norm += amp; amp *= .5; f *= 2;
      }
      return t / norm;
    },
    roundRect: function (ctx, x, y, w, h, r) {
      r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    },
    // "#rrggbb" -> lighter/darker variant. amt in [-1, 1].
    shade: function (hex, amt) {
      var n = parseInt(hex.slice(1), 16);
      var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      var f = amt < 0 ? 0 : 255, p = Math.abs(amt);
      r = Math.round(r + (f - r) * p); g = Math.round(g + (f - g) * p); b = Math.round(b + (f - b) * p);
      return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },
    fmt: function (n) { return (n | 0).toLocaleString('en-US'); },
    // Compact number for idle games: 12345 -> "12.3K"
    fmtShort: function (n) {
      var units = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'], i = 0;
      while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
      return (i === 0 ? Math.floor(n) : n.toFixed(n < 10 ? 2 : 1)) + units[i];
    },
    time: function (s) {
      var m = Math.floor(s / 60), r = Math.floor(s % 60);
      return m + ':' + (r < 10 ? '0' : '') + r;
    }
  };

  /* -------------------------------------------------------------- storage */

  var PREFIX = 'miloplay:';
  var Store = Milo.store = {
    get: function (key, fallback) {
      try {
        var v = localStorage.getItem(PREFIX + key);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set: function (key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* private mode */ }
    },
    best: function (id) { return Store.get('best:' + id, 0) || 0; },
    setBest: function (id, v) {
      if (v > Store.best(id)) { Store.set('best:' + id, v); return true; }
      return false;
    }
  };

  /* ---------------------------------------------------------------- audio */

  function Sound() {
    this.ctx = null;
    this.muted = Store.get('muted', false);
  }
  Sound.prototype._ac = function () {
    if (!this.ctx) {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      try { this.ctx = new AC(); } catch (e) { return null; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  };
  Sound.prototype.setMuted = function (m) { this.muted = m; Store.set('muted', m); };
  /** Basic synth voice: frequency sweep with an exponential decay envelope. */
  Sound.prototype.tone = function (opt) {
    if (this.muted) return;
    var ac = this._ac(); if (!ac) return;
    var t = ac.currentTime;
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = opt.type || 'square';
    o.frequency.setValueAtTime(opt.f || 440, t);
    if (opt.f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, opt.f2), t + (opt.d || .1));
    var vol = (opt.v == null ? .12 : opt.v);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + .008);
    g.gain.exponentialRampToValueAtTime(.0001, t + (opt.d || .1));
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + (opt.d || .1) + .02);
  };
  Sound.prototype.noise = function (dur, vol, filter) {
    if (this.muted) return;
    var ac = this._ac(); if (!ac) return;
    dur = dur || .18;
    var n = Math.floor(ac.sampleRate * dur);
    var buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = ac.createBufferSource(); src.buffer = buf;
    var g = ac.createGain(); g.gain.value = vol == null ? .16 : vol;
    if (filter) {
      var bp = ac.createBiquadFilter();
      bp.type = 'lowpass'; bp.frequency.value = filter;
      src.connect(bp); bp.connect(g);
    } else src.connect(g);
    g.connect(ac.destination);
    src.start();
  };
  Sound.prototype.blip = function () { this.tone({ f: 660, f2: 880, d: .06, v: .09, type: 'square' }); };
  Sound.prototype.click = function () { this.tone({ f: 380, f2: 300, d: .05, v: .08, type: 'triangle' }); };
  Sound.prototype.coin = function () {
    this.tone({ f: 880, d: .05, v: .1, type: 'square' });
    var s = this; setTimeout(function () { s.tone({ f: 1320, d: .1, v: .1, type: 'square' }); }, 55);
  };
  Sound.prototype.jump = function () { this.tone({ f: 300, f2: 720, d: .12, v: .1, type: 'square' }); };
  Sound.prototype.hit = function () { this.tone({ f: 180, f2: 60, d: .16, v: .14, type: 'sawtooth' }); };
  Sound.prototype.explode = function () { this.noise(.35, .2, 900); this.tone({ f: 140, f2: 40, d: .3, v: .12, type: 'sawtooth' }); };
  Sound.prototype.powerup = function () {
    var s = this;
    [523, 659, 784, 1046].forEach(function (f, i) {
      setTimeout(function () { s.tone({ f: f, d: .1, v: .09, type: 'square' }); }, i * 60);
    });
  };
  Sound.prototype.lose = function () {
    var s = this;
    [440, 350, 260, 180].forEach(function (f, i) {
      setTimeout(function () { s.tone({ f: f, d: .18, v: .11, type: 'triangle' }); }, i * 110);
    });
  };
  Sound.prototype.win = function () {
    var s = this;
    [523, 659, 784, 1046, 1318].forEach(function (f, i) {
      setTimeout(function () { s.tone({ f: f, d: .16, v: .1, type: 'square' }); }, i * 90);
    });
  };

  Milo.sound = new Sound();

  /* ---------------------------------------------------------------- input */

  var KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    Space: 'action', Enter: 'action',
    KeyZ: 'b', KeyX: 'a', ShiftLeft: 'shift', ShiftRight: 'shift'
  };

  function Input(host) {
    this.host = host;
    this.held = Object.create(null);
    this.hit = Object.create(null);      // edge-triggered, cleared each frame
    this.px = 0; this.py = 0;            // pointer in design space
    this.pdown = false;
    this.pbutton = 0;                    // 0 left, 1 middle, 2 right (0 for touch)
    this.ptap = false;                   // edge-triggered
    this.prelease = false;
    this.wheel = 0;
    this._binds = [];
    this._onKey = null;
    var self = this;

    function keyName(e) { return KEYMAP[e.code] || e.code; }

    this._kd = function (e) {
      if (e.repeat) { return; }
      var n = keyName(e);
      self.held[n] = true; self.hit[n] = true;
      self.held[e.code] = true; self.hit[e.code] = true;
      if (self._onKey) self._onKey(e, n);
      // Stop the page from scrolling under the game.
      if (/^(Arrow|Space|Page|Home|End|Tab)/.test(e.code) || e.code === 'Space') e.preventDefault();
    };
    this._ku = function (e) {
      var n = keyName(e);
      self.held[n] = false; self.held[e.code] = false;
    };
    this._blur = function () { self.held = Object.create(null); };

    global.addEventListener('keydown', this._kd, { passive: false });
    global.addEventListener('keyup', this._ku);
    global.addEventListener('blur', this._blur);
  }

  Input.prototype.down = function (n) { return !!this.held[n]; };
  Input.prototype.pressed = function (n) { return !!this.hit[n]; };
  Input.prototype.axis = function () {
    return {
      x: (this.down('right') ? 1 : 0) - (this.down('left') ? 1 : 0),
      y: (this.down('down') ? 1 : 0) - (this.down('up') ? 1 : 0)
    };
  };
  Input.prototype.set = function (n, v) { if (v && !this.held[n]) this.hit[n] = true; this.held[n] = !!v; };
  Input.prototype.endFrame = function () {
    this.hit = Object.create(null);
    this.ptap = false; this.prelease = false; this.wheel = 0;
  };
  Input.prototype.destroy = function () {
    global.removeEventListener('keydown', this._kd);
    global.removeEventListener('keyup', this._ku);
    global.removeEventListener('blur', this._blur);
  };

  /* ------------------------------------------------------------ HUD / DOM */

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  Milo.el = el;

  var ICON = {
    play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v13.72L19 12z"/></svg>',
    pause: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>',
    sound: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 5V4L8 9H4zm11.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/></svg>',
    mute: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 5V4L8 9H4zm12.6 3 2.1-2.1-1.4-1.4L15.2 10.6 13.1 8.5l-1.4 1.4 2.1 2.1-2.1 2.1 1.4 1.4 2.1-2.1 2.1 2.1 1.4-1.4z"/></svg>',
    full: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M4 9V4h5v2H6v3H4zm11-5h5v5h-2V6h-3V4zM4 15h2v3h3v2H4v-5zm14 0h2v5h-5v-2h3v-3z"/></svg>',
    restart: '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg>'
  };
  Milo.ICON = ICON;

  /* --------------------------------------------------------------- chrome */

  /**
   * Builds the shared furniture every game gets: the stat readouts, the
   * corner buttons, and the start / pause / game-over overlays. Wires the
   * matching methods onto `g`. Used by all three runners below.
   */
  function makeChrome(host, cfg, g) {
    var hud = el('div', 'hud');
    var hudTop = el('div', 'hud-top');
    var statsWrap = el('div');
    statsWrap.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
    var btns = el('div', 'hud-btns');
    hudTop.appendChild(statsWrap);
    hudTop.appendChild(btns);
    hud.appendChild(hudTop);
    host.appendChild(hud);

    var statEls = Object.create(null);
    var overlayEl = null;

    (cfg.stats || []).forEach(function (name) {
      var s = el('div', 'hud-stat', '<div class="l">' + name + '</div><div class="v">0</div>');
      statEls[name] = s.querySelector('.v');
      statsWrap.appendChild(s);
    });

    g.set = function (name, value) { if (statEls[name]) statEls[name].textContent = value; };
    g.setStatVisible = function (name, vis) {
      if (statEls[name]) statEls[name].parentNode.style.display = vis ? '' : 'none';
    };

    function mkBtn(html, title, fn) {
      var b = el('button', 'hud-btn', html);
      b.type = 'button';
      b.title = title;
      b.setAttribute('aria-label', title);
      b.addEventListener('click', function (e) { e.stopPropagation(); fn(b); });
      btns.appendChild(b);
      return b;
    }

    var pauseBtn = null;
    if (cfg.pausable !== false) {
      pauseBtn = mkBtn(ICON.pause, 'Pause', function () {
        if (g.state === 'play') g.pause();
        else if (g.state === 'pause') g.resume();
      });
    }
    mkBtn(ICON.restart, 'Restart', function () { g.restart(); });
    mkBtn(Milo.sound.muted ? ICON.mute : ICON.sound, 'Sound', function (b) {
      Milo.sound.setMuted(!Milo.sound.muted);
      b.innerHTML = Milo.sound.muted ? ICON.mute : ICON.sound;
    });
    mkBtn(ICON.full, 'Fullscreen', function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (host.requestFullscreen) host.requestFullscreen().catch(function () { });
    });

    g.clearOverlay = function () { if (overlayEl) { overlayEl.remove(); overlayEl = null; } };
    g.overlayOpen = function () { return !!overlayEl; };

    /**
     * opt: {emo, title, text, score, best, newBest, actions, keys, hint}
     */
    g.overlay = function (opt) {
      g.clearOverlay();
      var o = el('div', 'overlay');
      var inner = el('div');
      if (opt.emo) inner.appendChild(el('div', 'o-emo', opt.emo));
      if (opt.title) inner.appendChild(el('h2', null, opt.title));
      if (opt.score != null) {
        inner.appendChild(el('div', 'o-score', U.fmt(opt.score)));
        if (opt.best != null) {
          inner.appendChild(el('div', 'o-best',
            opt.newBest ? '🏆 New best!' : 'Best ' + U.fmt(opt.best)));
        }
      }
      if (opt.text) inner.appendChild(el('p', null, opt.text));
      if (opt.keys && opt.keys.length) {
        var k = el('div', 'o-keys');
        opt.keys.forEach(function (s) { k.appendChild(el('kbd', null, s)); });
        inner.appendChild(k);
      }
      var acts = el('div', 'o-actions');
      (opt.actions || []).forEach(function (a) {
        var b = el('button', 'btn ' + (a.primary ? 'btn-primary' : 'btn-ghost'), a.label);
        b.type = 'button';
        b.addEventListener('click', function (e) { e.stopPropagation(); a.onClick(); });
        acts.appendChild(b);
      });
      inner.appendChild(acts);
      if (opt.hint) inner.appendChild(el('div', 'o-hint', opt.hint));
      o.appendChild(inner);
      hud.appendChild(o);
      overlayEl = o;
      return o;
    };

    g.showStart = function () {
      g.state = 'start';
      var s = cfg.start || {};
      g.overlay({
        emo: s.emo || cfg.emo || '🎮',
        title: s.title || cfg.title || 'Ready?',
        text: s.text,
        keys: s.keys,
        hint: g.best ? 'Your best: ' + U.fmt(g.best) : (s.hint || 'Press Space to start'),
        actions: [{ label: '▶  Play', primary: true, onClick: function () { g.restart(); } }]
      });
    };

    g.pause = function () {
      if (g.state !== 'play' || cfg.pausable === false) return;
      g.state = 'pause';
      if (pauseBtn) pauseBtn.innerHTML = ICON.play;
      if (cfg.onPause) cfg.onPause(g);
      g.overlay({
        emo: '⏸️',
        title: 'Paused',
        hint: 'Press Esc or P to resume',
        actions: [
          { label: 'Resume', primary: true, onClick: function () { g.resume(); } },
          { label: 'Restart', onClick: function () { g.restart(); } }
        ]
      });
    };

    g.resume = function () {
      if (g.state !== 'pause') return;
      g.clearOverlay();
      g.state = 'play';
      if (pauseBtn) pauseBtn.innerHTML = ICON.pause;
      if (cfg.onResume) cfg.onResume(g);
    };

    /** Shared end-of-run overlay. `kind` is 'over' or 'win'. */
    function finish(kind, opt) {
      opt = opt || {};
      g.state = 'over';
      var tracks = cfg.trackBest !== false && cfg.id;
      var score = opt.score == null ? (kind === 'win' ? null : g.score) : opt.score;
      var newBest = false;
      if (tracks && score != null) {
        newBest = Store.setBest(cfg.id, Math.round(score));
        g.best = Store.best(cfg.id);
      }
      if (kind === 'win' || newBest) Milo.sound.win(); else Milo.sound.lose();
      g.overlay({
        emo: opt.emo || (kind === 'win' ? '🎉' : (newBest ? '🏆' : '💀')),
        title: opt.title || (kind === 'win' ? 'You Win!' : (newBest ? 'New High Score!' : 'Game Over')),
        text: opt.text,
        score: tracks ? score : null,
        best: tracks && score != null ? g.best : null,
        newBest: newBest,
        actions: [
          { label: '↻  Play Again', primary: true, onClick: function () { g.restart(); } },
          { label: 'More Games', onClick: function () { location.hash = '#/browse'; } }
        ]
      });
    }

    g.gameOver = function (opt) { if (g.state !== 'over') finish('over', opt); };
    g.win = function (opt) { if (g.state !== 'over') finish('win', opt); };

    if (pauseBtn) g.pauseBtn = pauseBtn;
    return { hud: hud, buttons: btns };
  }

  /** Shared restart wiring: reset the common fields, then call cfg.init. */
  function makeRestart(cfg, g, extra) {
    return function () {
      g.clearOverlay();
      if (g.pauseBtn) g.pauseBtn.innerHTML = ICON.pause;
      g.score = 0;
      g.best = Store.best(cfg.id);
      g.state = 'play';
      g.input.held = Object.create(null);
      if (extra) extra();
      if (cfg.init) cfg.init(g);
      Milo.sound._ac();                 // unlock audio on this user gesture
      if (Milo.onPlayed && cfg.id) Milo.onPlayed(cfg.id);
    };
  }

  /**
   * When a variant is being mounted (see Milo.registerVariant), rewrite the
   * cfg the base game handed us so the chrome, the overlays and the high-score
   * slot all belong to the variant rather than the original.
   */
  function applyVariant(cfg) {
    var vr = Milo._variant;
    if (!vr) return cfg;
    cfg = Object.assign({}, cfg);
    cfg.id = vr.id;
    if (vr.title) {
      cfg.title = vr.title;
      if (cfg.start) cfg.start = Object.assign({}, cfg.start, { title: vr.title });
    }
    if (vr.emo) {
      cfg.emo = vr.emo;
      if (cfg.start && cfg.start.emo) cfg.start = Object.assign({}, cfg.start, { emo: vr.emo });
    }
    return cfg;
  }

  /** Standard key handling: Esc/P pauses, Space/Enter starts or replays. */
  function wireKeys(cfg, g) {
    g.input._onKey = function (e, name) {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (g.state === 'play') g.pause();
        else if (g.state === 'pause') g.resume();
        return;
      }
      if ((g.state === 'start' || g.state === 'over') && (e.code === 'Space' || e.code === 'Enter')) {
        g.restart();
        return;
      }
      if (cfg.onKey && g.state === 'play') cfg.onKey(g, e, name);
    };
  }

  /**
   * Runs a game's preload + first init, then shows the start overlay.
   * Priming before the first frame means the game renders behind that overlay
   * instead of drawing from an empty state. If a game throws while starting up
   * we tear its runner down before rethrowing — otherwise its global key and
   * mouse listeners would survive and fire on whatever the player opens next.
   */
  function prime(api, cfg, g, onPrimed) {
    try {
      if (cfg.preload) cfg.preload(g);
      if (cfg.init) cfg.init(g);
      if (onPrimed) onPrimed();
      if (cfg.autoStart) g.restart(); else g.showStart();
    } catch (err) {
      try { api.destroy(); } catch (e) { /* already half torn down */ }
      throw err;
    }
  }

  /**
   * True when on-screen controls are (or will be) covering the stage edges,
   * so games can lift their own bottom-of-screen UI clear of them.
   */
  Milo.touchLayout = function () {
    return (global.matchMedia && global.matchMedia('(pointer: coarse)').matches) ||
      document.body.classList.contains('touch');
  };

  /** Optional on-screen controls for touch devices. */
  function addTouchControls(hud, cfg, input) {
    if (cfg.touch === 'dpad' || cfg.touch === 'dpad+a') {
      var pad = el('div', 'touch-pad tp-dpad');
      ['up', 'down', 'left', 'right'].forEach(function (dir) {
        var k = el('div', 'k ' + dir, { up: '▲', down: '▼', left: '◀', right: '▶' }[dir]);
        function on(e) { input.set(dir, true); k.classList.add('on'); e.preventDefault(); }
        function off(e) { input.held[dir] = false; k.classList.remove('on'); if (e.cancelable) e.preventDefault(); }
        k.addEventListener('touchstart', on, { passive: false });
        k.addEventListener('touchend', off);
        k.addEventListener('touchcancel', off);
        k.addEventListener('mousedown', on);
        k.addEventListener('mouseup', off);
        k.addEventListener('mouseleave', off);
        pad.appendChild(k);
      });
      hud.appendChild(pad);
    }
    var wantButtons = cfg.touchButtons || (cfg.touch === 'dpad+a' || cfg.touch === 'a');
    if (wantButtons) {
      var row = el('div', 'touch-pad tp-btns');
      (cfg.touchButtons || [{ key: 'action', label: 'A' }]).forEach(function (def) {
        var b = el('div', 'tp-btn', def.label);
        function on(e) { input.set(def.key, true); b.classList.add('on'); e.preventDefault(); }
        function off(e) { input.held[def.key] = false; b.classList.remove('on'); if (e.cancelable) e.preventDefault(); }
        b.addEventListener('touchstart', on, { passive: false });
        b.addEventListener('touchend', off);
        b.addEventListener('touchcancel', off);
        b.addEventListener('mousedown', on);
        b.addEventListener('mouseup', off);
        b.addEventListener('mouseleave', off);
        row.appendChild(b);
      });
      hud.appendChild(row);
    }
  }

  /* --------------------------------------------------------------- arcade */

  /**
   * 2D canvas runner. Games draw in a fixed design space (cfg.w x cfg.h) that
   * is letterboxed into the stage, or set fit:'resize' to draw at stage size.
   * Returns an object with `.destroy()` — the portal calls it on navigation.
   */
  Milo.arcade = function (host, cfg) {
    cfg = applyVariant(cfg || {});
    // Variants tune real difficulty by scaling game time, and get their own
    // look from a cheap hue rotation over everything the base game draws.
    var vr = Milo._variant;
    var timeScale = (vr && vr.speed) || 1;
    var W = cfg.w || 800, H = cfg.h || 500;
    var mode = cfg.fit || 'contain';
    var canvas = el('canvas');
    var ctx = canvas.getContext('2d');
    if (vr && vr.hue) canvas.style.filter = 'hue-rotate(' + vr.hue + 'deg)' + (vr.sat ? ' saturate(' + vr.sat + ')' : '');

    host.innerHTML = '';
    host.appendChild(canvas);

    var input = new Input(host);
    var raf = 0, last = 0, destroyed = false, primed = false;
    var scale = 1, ox = 0, oy = 0, dpr = 1;

    var g = {
      ctx: ctx, canvas: canvas, host: host,
      W: W, H: H,
      t: 0, dt: 0, frame: 0,
      state: 'start',
      score: 0,
      best: Store.best(cfg.id),
      id: cfg.id,
      input: input,
      sound: Milo.sound,
      u: U,
      data: {}
    };

    var chrome = makeChrome(host, cfg, g);
    g.hud = chrome.hud;
    addTouchControls(chrome.hud, cfg, input);
    g.restart = makeRestart(cfg, g, function () { g.t = 0; g.frame = 0; });
    wireKeys(cfg, g);

    /* --- sizing --- */
    function resize() {
      var r = host.getBoundingClientRect();
      var cw = Math.max(1, Math.round(r.width)), ch = Math.max(1, Math.round(r.height));
      dpr = Math.min(global.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      canvas.style.width = cw + 'px';
      canvas.style.height = ch + 'px';
      if (mode === 'resize') {
        g.W = W = cw; g.H = H = ch;
        scale = 1; ox = 0; oy = 0;
      } else {
        scale = Math.min(cw / W, ch / H);
        ox = (cw - W * scale) / 2;
        oy = (ch - H * scale) / 2;
      }
      ctx.imageSmoothingEnabled = cfg.smooth !== false;
      if (cfg.onResize) cfg.onResize(g);
      if (g.state !== 'play') paint();
    }
    var ro = global.ResizeObserver ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(host);
    global.addEventListener('resize', resize);

    /* --- pointer --- */
    function toDesign(clientX, clientY) {
      var r = canvas.getBoundingClientRect();
      return { x: (clientX - r.left - ox) / scale, y: (clientY - r.top - oy) / scale };
    }
    g.toDesign = toDesign;

    function onDown(e) {
      var p = e.touches ? e.touches[0] : e;
      var d = toDesign(p.clientX, p.clientY);
      input.px = d.x; input.py = d.y;
      input.pdown = true; input.ptap = true;
      input.pbutton = e.touches ? 0 : (e.button || 0);
      if (cfg.onPointer) cfg.onPointer(g, 'down', d.x, d.y, e);
      if (e.cancelable) e.preventDefault();
    }
    function onMove(e) {
      var p = e.touches ? e.touches[0] : e;
      if (!p) return;
      var d = toDesign(p.clientX, p.clientY);
      input.px = d.x; input.py = d.y;
      if (cfg.onPointer) cfg.onPointer(g, 'move', d.x, d.y, e);
      if (e.touches && e.cancelable) e.preventDefault();
    }
    function onUp(e) {
      input.pdown = false; input.prelease = true;
      if (cfg.onPointer) cfg.onPointer(g, 'up', input.px, input.py, e);
    }
    function onWheel(e) { input.wheel = Math.sign(e.deltaY); if (cfg.wheel) e.preventDefault(); }

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    global.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    global.addEventListener('touchend', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: !cfg.wheel });
    canvas.addEventListener('contextmenu', function (e) { if (cfg.noContextMenu) e.preventDefault(); });

    /* --- loop --- */
    function paint() {
      // Nothing to draw until cfg.init has populated g.data.
      if (!primed) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (cfg.bg) {
        ctx.fillStyle = cfg.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
      if (mode !== 'resize' && cfg.bg) { ctx.fillStyle = cfg.bg; ctx.fillRect(0, 0, W, H); }
      if (cfg.draw) cfg.draw(g);
    }

    function tick(now) {
      if (destroyed) return;
      raf = requestAnimationFrame(tick);
      var dt = Math.min((now - last) / 1000, .05) * timeScale;
      last = now;
      g.dt = dt;
      if (g.state === 'play') {
        g.t += dt; g.frame++;
        if (cfg.update) cfg.update(g, dt);
      }
      paint();
      input.endFrame();
    }

    function vis() { if (document.hidden && g.state === 'play' && cfg.pauseOnBlur !== false) g.pause(); }
    document.addEventListener('visibilitychange', vis);

    var api = {
      g: g,
      destroy: function () {
        destroyed = true;
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        global.removeEventListener('resize', resize);
        global.removeEventListener('mouseup', onUp);
        global.removeEventListener('touchend', onUp);
        document.removeEventListener('visibilitychange', vis);
        input.destroy();
        if (cfg.destroy) cfg.destroy(g);
        host.innerHTML = '';
      }
    };

    resize();
    prime(api, cfg, g, function () { primed = true; });
    last = performance.now();
    raf = requestAnimationFrame(tick);
    return api;
  };

  /* ------------------------------------------------------- DOM-based game */

  /**
   * For games that are clearer as HTML than as pixels (2048, Minesweeper,
   * Connect Four…). Same chrome, but the game builds DOM inside `g.root`.
   */
  Milo.domGame = function (host, cfg) {
    cfg = applyVariant(cfg || {});
    var root = el('div');
    root.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;' +
      'justify-content:center;padding:58px 14px 18px;overflow:auto;';

    host.innerHTML = '';
    if (cfg.bg) host.style.background = cfg.bg;
    host.appendChild(root);

    var input = new Input(host);
    var g = {
      root: root, host: host,
      state: 'start', score: 0, id: cfg.id,
      best: Store.best(cfg.id),
      sound: Milo.sound, u: U, input: input, data: {}
    };

    var chrome = makeChrome(host, Object.assign({ pausable: false }, cfg), g);
    g.hud = chrome.hud;
    g.restart = makeRestart(cfg, g);
    wireKeys(Object.assign({ pausable: false }, cfg), g);

    var raf = 0, destroyed = false, last = performance.now();
    if (cfg.update) {
      (function tick(now) {
        if (destroyed) return;
        raf = requestAnimationFrame(tick);
        var dt = Math.min((now - last) / 1000, .05);
        last = now;
        if (g.state === 'play') cfg.update(g, dt);
      })(last);
    }

    var api = {
      g: g,
      destroy: function () {
        destroyed = true;
        cancelAnimationFrame(raf);
        input.destroy();
        if (cfg.destroy) cfg.destroy(g);
        host.style.background = '';
        host.innerHTML = '';
      }
    };

    prime(api, cfg, g);
    return api;
  };

  /* ----------------------------------------------------------- WebGL game */

  /**
   * WebGL runner for the 3D games. Handles context creation, resizing,
   * pointer lock and mouse-look deltas; the game supplies init/frame.
   */
  Milo.glGame = function (host, cfg) {
    cfg = applyVariant(cfg || {});
    var canvas = el('canvas');
    host.innerHTML = '';
    host.appendChild(canvas);

    var gl = canvas.getContext('webgl', { antialias: false, alpha: false }) ||
      canvas.getContext('experimental-webgl', { antialias: false, alpha: false });
    if (!gl) {
      host.innerHTML = '<div style="color:#fff;padding:40px;text-align:center;font-family:var(--font)">' +
        '<div style="font-size:2.6rem">😕</div>' +
        '<h3>WebGL isn’t available</h3>' +
        '<p style="color:#9aa3d0">This game needs WebGL. Try another browser, or ' +
        'enable hardware acceleration in your settings.</p></div>';
      return { destroy: function () { host.innerHTML = ''; } };
    }

    var input = new Input(host);
    var raf = 0, last = 0, destroyed = false, dpr = 1;

    var g = {
      gl: gl, canvas: canvas, host: host,
      W: 1, H: 1, t: 0, dt: 0,
      state: 'start', score: 0, id: cfg.id,
      best: Store.best(cfg.id),
      input: input, sound: Milo.sound, u: U, data: {},
      mouse: { dx: 0, dy: 0, locked: false, left: false, right: false }
    };

    var chrome = makeChrome(host, cfg, g);
    g.hud = chrome.hud;
    addTouchControls(chrome.hud, cfg, input);
    g.restart = makeRestart(cfg, g, function () { g.t = 0; });
    wireKeys(cfg, g);

    function resize() {
      var r = host.getBoundingClientRect();
      var cw = Math.max(1, Math.round(r.width)), ch = Math.max(1, Math.round(r.height));
      dpr = Math.min(global.devicePixelRatio || 1, cfg.maxDpr || 1.5);
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      canvas.style.width = cw + 'px';
      canvas.style.height = ch + 'px';
      g.W = cw; g.H = ch;
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (cfg.onResize) cfg.onResize(g);
    }
    var ro = global.ResizeObserver ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(host);
    global.addEventListener('resize', resize);

    /* --- pointer lock + mouse look --- */
    function onLockChange() {
      g.mouse.locked = (document.pointerLockElement === canvas);
      if (!g.mouse.locked && g.state === 'play' && cfg.pauseOnUnlock !== false) g.pause();
    }
    document.addEventListener('pointerlockchange', onLockChange);

    g.requestLock = function () {
      if (canvas.requestPointerLock) {
        var p = canvas.requestPointerLock();
        if (p && p.catch) p.catch(function () { });
      }
    };
    g.exitLock = function () { if (document.pointerLockElement === canvas) document.exitPointerLock(); };

    function onMouseMove(e) {
      if (g.mouse.locked) { g.mouse.dx += e.movementX || 0; g.mouse.dy += e.movementY || 0; }
    }
    function onMouseDown(e) {
      if (e.button === 0) g.mouse.left = true;
      if (e.button === 2) g.mouse.right = true;
      if (g.state === 'play' && !g.mouse.locked && cfg.pointerLock !== false) g.requestLock();
      if (cfg.onMouseDown) cfg.onMouseDown(g, e.button, e);
    }
    function onMouseUp(e) {
      if (e.button === 0) g.mouse.left = false;
      if (e.button === 2) g.mouse.right = false;
    }
    function onWheel(e) { input.wheel = Math.sign(e.deltaY); e.preventDefault(); }

    document.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    global.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    // Touch: left half drags to look, taps on the right act.
    if (cfg.touchLook) {
      var lookId = null, lx = 0, ly = 0;
      canvas.addEventListener('touchstart', function (e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
          var t = e.changedTouches[i];
          var r = canvas.getBoundingClientRect();
          if (lookId === null && t.clientX - r.left > r.width * .35) {
            lookId = t.identifier; lx = t.clientX; ly = t.clientY;
          }
        }
        if (e.cancelable) e.preventDefault();
      }, { passive: false });
      canvas.addEventListener('touchmove', function (e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
          var t = e.changedTouches[i];
          if (t.identifier === lookId) {
            g.mouse.dx += (t.clientX - lx) * 1.6;
            g.mouse.dy += (t.clientY - ly) * 1.6;
            lx = t.clientX; ly = t.clientY;
          }
        }
        if (e.cancelable) e.preventDefault();
      }, { passive: false });
      canvas.addEventListener('touchend', function (e) {
        for (var i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === lookId) lookId = null;
        }
      });
    }

    function tick(now) {
      if (destroyed) return;
      raf = requestAnimationFrame(tick);
      var dt = Math.min((now - last) / 1000, .05);
      last = now;
      g.dt = dt;
      if (g.state === 'play') { g.t += dt; }
      if (cfg.frame) cfg.frame(g, g.state === 'play' ? dt : 0);
      g.mouse.dx = 0; g.mouse.dy = 0;
      input.endFrame();
    }

    function vis() { if (document.hidden && g.state === 'play') g.pause(); }
    document.addEventListener('visibilitychange', vis);

    var api = {
      g: g,
      destroy: function () {
        destroyed = true;
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        global.removeEventListener('resize', resize);
        global.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('pointerlockchange', onLockChange);
        document.removeEventListener('visibilitychange', vis);
        g.exitLock();
        input.destroy();
        if (cfg.destroy) cfg.destroy(g);
        var ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
        host.innerHTML = '';
      }
    };

    resize();
    prime(api, cfg, g);
    last = performance.now();
    raf = requestAnimationFrame(tick);
    return api;
  };

  /* -------------------------------------------------------- registration */

  Milo.games = [];
  Milo.byId = Object.create(null);

  Milo.register = function (def) {
    if (Milo.byId[def.id]) { return; }
    def.category = def.category || 'Arcade';
    def.tags = def.tags || [];
    def.colors = def.colors || ['#7c5cff', '#22d3ee'];
    Milo.games.push(def);
    Milo.byId[def.id] = def;
  };

  /**
   * A variant is a real remix of a registered game: its own catalogue entry,
   * title, description, thumbnail and high-score slot, with gameplay retuned
   * through `speed` (game-time multiplier — 0.7 is gentle, 1.5 is frantic)
   * and restyled through `hue`/`sat`. The base game's mount runs unmodified;
   * the runners read Milo._variant while it does. Load variant files after
   * every base game file.
   */
  Milo._variant = null;
  Milo.registerVariant = function (baseId, v) {
    var base = Milo.byId[baseId];
    if (!base || Milo.byId[v.id]) return;
    var def = Object.assign({}, base, v);
    def.variantOf = baseId;
    def.tags = (v.tags || base.tags || []).slice();
    def.featured = false;
    def.mount = function (host) {
      Milo._variant = def;
      try { return base.mount(host); }
      finally { Milo._variant = null; }
    };
    Milo.games.push(def);
    Milo.byId[def.id] = def;
  };

})(window);
