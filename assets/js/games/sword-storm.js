/* Sword Storm — rhythm combat: cut each attacker from the side it comes from. */
(function () {
  'use strict';
  var W = 720, H = 720, CX = 360, CY = 372;
  var RING = 120, WIN = 46, PERFECT = 15, HIT_R = 42, SPAWN_D = 400;
  var DIRS = ['up', 'down', 'left', 'right'];
  var VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  var KIND = {
    grunt: { col: '#e11d48', beats: 2 },
    ninja: { col: '#a855f7', beats: 1 },
    chord: { col: '#f5c542', beats: 2 }
  };

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.enemies = []; d.parts = []; d.pops = []; d.slashes = [];
      d.bpm = 84; d.beat = 0; d.beatT = 60 / d.bpm; d.pulse = 0;
      d.lives = 3; d.combo = 0; d.bestCombo = 0; d.cuts = 0; d.perfects = 0;
      d.lastCut = -9; d.lastCutDir = null; d.flash = 0; d.hurtT = 0; d.face = 'right';
      d.lastPress = { t: -9, dir: '' };
      g.set('Score', 0); g.set('Combo', 0); g.set('Lives', '♥♥♥'); g.set('BPM', d.bpm);
    }

    function laneFree(d, dir) {
      for (var i = 0; i < d.enemies.length; i++) if (d.enemies[i].dir === dir && d.enemies[i].dist > SPAWN_D - 90) return false;
      return true;
    }

    function spawn(d, dir, kind) {
      var k = KIND[kind];
      d.enemies.push({
        dir: dir, dist: SPAWN_D, kind: kind, col: k.col,
        speed: (SPAWN_D - RING) / (k.beats * 60 / d.bpm), wob: Math.random() * 6.28
      });
    }

    function onBeat(g) {
      var d = g.data;
      d.beat++;
      d.pulse = 1;
      if (d.beat % 8 === 0) { d.bpm = Math.min(196, d.bpm + 4); g.set('BPM', d.bpm); }
      Milo.sound.tone({ f: d.beat % 4 === 1 ? 240 : 180, d: .03, v: .035, type: 'triangle' });
      var storm = d.beat % 32 >= 25;
      var p = d.beat < 8 ? (d.beat % 2 ? 1 : 0) : storm ? 1 : .72;
      if (Math.random() > p) return;
      var chordP = d.beat < 12 ? 0 : Math.min(.42, .08 + d.beat * .006);
      var ninjaP = d.beat < 24 ? 0 : Math.min(.32, (d.beat - 24) * .012);
      var dirs = U.shuffle(DIRS.slice()).filter(function (x) { return laneFree(d, x); });
      if (!dirs.length) return;
      var r = Math.random();
      if (r < chordP && dirs.length >= 2) { spawn(d, dirs[0], 'chord'); spawn(d, dirs[1], 'chord'); }
      else if (r < chordP + ninjaP) spawn(d, dirs[0], 'ninja');
      else spawn(d, dirs[0], 'grunt');
      if (storm && Math.random() < .35 && dirs.length >= 3) spawn(d, dirs[2], 'grunt');
    }

    function pop(d, x, y, text, col, big) {
      d.pops.push({ x: x, y: y, text: text, col: col, life: .8, max: .8, big: !!big });
    }

    function ink(d, x, y, col, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = U.rand(60, 300);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .7), max: .7, col: col, r: U.rand(2, 6) });
      }
    }

    function livesText(n) { var s = ''; for (var i = 0; i < 3; i++) s += i < n ? '♥' : '♡'; return s; }

    function press(g, dir) {
      var d = g.data;
      d.face = dir;
      var best = null, bestErr = 1e9;
      d.enemies.forEach(function (e) {
        if (e.dir !== dir) return;
        var err = Math.abs(e.dist - RING);
        if (err <= WIN && err < bestErr) { best = e; bestErr = err; }
      });
      var v = VEC[dir];
      d.slashes.push({ dir: dir, life: .18, max: .18 });
      if (!best) {
        d.combo = 0; g.set('Combo', 0);
        pop(d, CX + v[0] * 150, CY + v[1] * 150, 'whiff', 'rgba(245,240,230,.6)');
        Milo.sound.noise(.08, .06, 1500);
        return;
      }
      var perfect = bestErr <= PERFECT;
      d.enemies.splice(d.enemies.indexOf(best), 1);
      d.combo++; d.cuts++;
      if (d.combo > d.bestCombo) d.bestCombo = d.combo;
      var mult = Math.min(8, 1 + Math.floor(d.combo / 10));
      var pts = (perfect ? 100 : 50) * mult;
      if (perfect) d.perfects++;
      // chord: a second cut within a tenth of a beat, from a different side
      var chord = (g.t - d.lastCut) < Math.max(.12, 6 / d.bpm) && d.lastCutDir !== dir;
      if (chord) { pts += 150 * mult; pop(d, CX, CY - 150, 'CHORD!', '#f5c542', true); Milo.sound.coin(); }
      d.lastCut = g.t; d.lastCutDir = dir;
      g.score += pts;
      g.set('Score', U.fmt(g.score)); g.set('Combo', d.combo + (mult > 1 ? '  x' + mult : ''));
      var ex = CX + v[0] * best.dist, ey = CY + v[1] * best.dist;
      ink(d, ex, ey, best.col, perfect ? 22 : 12);
      pop(d, ex, ey - 24, perfect ? 'PERFECT' : 'good', perfect ? '#fff5d6' : '#f5f0e6', perfect);
      if (perfect) { d.flash = .25; Milo.sound.tone({ f: 1100, f2: 1700, d: .12, v: .09, type: 'square' }); }
      else Milo.sound.tone({ f: 700, f2: 900, d: .07, v: .07, type: 'square' });
      Milo.sound.noise(.07, .07, 3200);
    }

    function hurt(g, e) {
      var d = g.data;
      d.lives--; d.combo = 0; d.hurtT = .5;
      g.set('Lives', livesText(d.lives)); g.set('Combo', 0);
      ink(d, CX, CY, '#e11d48', 24);
      Milo.sound.hit();
      if (d.lives <= 0) {
        g.gameOver({ text: 'Cut down after ' + d.cuts + ' attackers (' + d.perfects + ' perfect). Best combo ' + d.bestCombo + ', tempo ' + d.bpm + ' bpm.' });
      }
    }

    return Milo.arcade(host, {
      id: 'sword-storm',
      w: W, h: H, bg: '#12111c',
      stats: ['Score', 'Combo', 'Lives', 'BPM'],
      touch: 'dpad',
      emo: '⚔️',
      start: {
        title: 'Sword Storm',
        text: 'Attackers rush you from four sides in time with the beat. Press the direction ' +
          'they come FROM while they cross the white ring. Dead centre is a Perfect; two ' +
          'cuts on the same beat is a chord. Three hits and you fall.',
        keys: ['← ↑ ↓ → cut', 'WASD cut']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down') return;
        var dx = x - CX, dy = y - CY;
        if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
        press(g, Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
      },

      update: function (g, dt) {
        var d = g.data, inp = g.input;
        for (var di = 0; di < DIRS.length; di++) if (inp.pressed(DIRS[di])) press(g, DIRS[di]);
        d.beatT -= dt;
        if (d.beatT <= 0) { d.beatT += 60 / d.bpm; onBeat(g); }
        d.pulse = Math.max(0, d.pulse - dt * 4);
        d.flash = Math.max(0, d.flash - dt);
        d.hurtT = Math.max(0, d.hurtT - dt);

        for (var i = d.enemies.length - 1; i >= 0; i--) {
          var e = d.enemies[i];
          e.dist -= e.speed * dt;
          e.wob += dt * 12;
          if (e.dist <= HIT_R) { d.enemies.splice(i, 1); hurt(g, e); }
        }
        d.parts = d.parts.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .93; q.vy *= .93; q.life -= dt; return q.life > 0;
        });
        d.pops = d.pops.filter(function (q) { q.life -= dt; q.y -= 30 * dt; return q.life > 0; });
        d.slashes = d.slashes.filter(function (s) { s.life -= dt; return s.life > 0; });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, t = g.t;
        // paper-ink backdrop
        var bg = c.createRadialGradient(CX, CY, 40, CX, CY, 520);
        bg.addColorStop(0, '#1d1b2c'); bg.addColorStop(1, '#0c0b14');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);
        if (d.hurtT > 0) { c.fillStyle = 'rgba(225,29,72,' + d.hurtT * .5 + ')'; c.fillRect(0, 0, W, H); }
        if (d.flash > 0) { c.fillStyle = 'rgba(245,240,230,' + d.flash * .5 + ')'; c.fillRect(0, 0, W, H); }

        // lanes — brush strokes
        c.lineCap = 'round';
        DIRS.forEach(function (dir) {
          var v = VEC[dir];
          var grad = c.createLinearGradient(CX, CY, CX + v[0] * SPAWN_D, CY + v[1] * SPAWN_D);
          grad.addColorStop(0, 'rgba(245,240,230,.12)'); grad.addColorStop(1, 'rgba(245,240,230,0)');
          c.strokeStyle = grad; c.lineWidth = 26;
          c.beginPath(); c.moveTo(CX + v[0] * HIT_R, CY + v[1] * HIT_R); c.lineTo(CX + v[0] * SPAWN_D, CY + v[1] * SPAWN_D); c.stroke();
          // key glyph at the lane end
          c.fillStyle = 'rgba(245,240,230,.35)'; c.font = '800 20px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText({ up: '▲', down: '▼', left: '◀', right: '▶' }[dir], CX + v[0] * 330, CY + v[1] * 330 + 7);
        });

        // cut window ring
        var pr = 1 + d.pulse * .06;
        c.strokeStyle = 'rgba(245,240,230,.14)'; c.lineWidth = WIN * 2;
        c.beginPath(); c.arc(CX, CY, RING * pr, 0, 7); c.stroke();
        c.strokeStyle = 'rgba(245,240,230,.9)'; c.lineWidth = 3;
        c.beginPath(); c.arc(CX, CY, RING * pr, 0, 7); c.stroke();
        c.strokeStyle = 'rgba(245,197,66,.35)'; c.lineWidth = 1;
        c.beginPath(); c.arc(CX, CY, (RING - PERFECT) * pr, 0, 7); c.stroke();
        c.beginPath(); c.arc(CX, CY, (RING + PERFECT) * pr, 0, 7); c.stroke();

        // enemies
        d.enemies.forEach(function (e) {
          var v = VEC[e.dir];
          var x = CX + v[0] * e.dist, y = CY + v[1] * e.dist;
          var ang = Math.atan2(-v[1], -v[0]);
          var inWin = Math.abs(e.dist - RING) <= WIN;
          c.save(); c.translate(x, y); c.rotate(ang);
          var wob = Math.sin(e.wob) * 2;
          c.fillStyle = 'rgba(0,0,0,.4)';
          c.beginPath(); c.ellipse(0, 14, 16, 5, 0, 0, 7); c.fill();
          if (inWin) { c.shadowColor = e.col; c.shadowBlur = 18; }
          c.fillStyle = e.col;
          c.beginPath(); c.moveTo(18, 0); c.lineTo(0, -14 + wob); c.lineTo(-16, 0); c.lineTo(0, 14 - wob); c.closePath(); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#12111c';
          c.beginPath(); c.arc(6, -4, 2.2, 0, 7); c.arc(6, 4, 2.2, 0, 7); c.fill();
          if (e.kind === 'ninja') { c.strokeStyle = '#f5f0e6'; c.lineWidth = 2; c.beginPath(); c.moveTo(-6, -8); c.lineTo(-14, -18); c.stroke(); }
          if (e.kind === 'chord') { c.fillStyle = '#f5f0e6'; c.font = '800 12px Outfit, sans-serif'; c.textAlign = 'center'; c.fillText('♫', 0, -18); }
          c.restore();
        });

        // slashes
        d.slashes.forEach(function (s) {
          var v = VEC[s.dir], k = s.life / s.max;
          c.strokeStyle = 'rgba(245,240,230,' + k + ')'; c.lineWidth = 8 * k + 2;
          c.beginPath();
          c.arc(CX, CY, RING, Math.atan2(v[1], v[0]) - .9 * (1 - k) - .1, Math.atan2(v[1], v[0]) + .9 * (1 - k) + .1);
          c.stroke();
        });

        // samurai
        var fv = VEC[d.face];
        c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(CX, CY + 26, 22, 7, 0, 0, 7); c.fill();
        c.fillStyle = '#f5f0e6';
        U.roundRect(c, CX - 14, CY - 6, 28, 30, 8); c.fill();
        c.fillStyle = '#e11d48'; c.fillRect(CX - 14, CY + 6, 28, 5);
        c.fillStyle = '#f5f0e6'; c.beginPath(); c.arc(CX, CY - 14, 11, 0, 7); c.fill();
        c.fillStyle = '#1b1a27'; c.beginPath(); c.moveTo(CX - 22, CY - 16); c.lineTo(CX + 22, CY - 16); c.lineTo(CX, CY - 34); c.closePath(); c.fill();
        c.strokeStyle = '#f5f0e6'; c.lineWidth = 4; c.lineCap = 'round';
        c.beginPath(); c.moveTo(CX + fv[0] * 14, CY + 4 + fv[1] * 14); c.lineTo(CX + fv[0] * 46, CY + 4 + fv[1] * 46); c.stroke();
        c.fillStyle = '#f5c542'; c.beginPath(); c.arc(CX + fv[0] * 14, CY + 4 + fv[1] * 14, 4, 0, 7); c.fill();

        // ink particles
        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max); c.fillStyle = q.col;
          c.beginPath(); c.arc(q.x, q.y, q.r * (q.life / q.max), 0, 7); c.fill();
        });
        c.globalAlpha = 1;
        d.pops.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max); c.fillStyle = q.col; c.textAlign = 'center';
          c.font = (q.big ? '900 26px' : '700 15px') + ' Outfit, sans-serif';
          c.fillText(q.text, q.x, q.y);
        });
        c.globalAlpha = 1;

        // beat bar
        var bw = 260, bx = CX - bw / 2, by = H - 34;
        c.fillStyle = 'rgba(245,240,230,.12)'; U.roundRect(c, bx, by, bw, 8, 4); c.fill();
        var frac = 1 - d.beatT / (60 / d.bpm);
        c.fillStyle = d.beat % 32 >= 25 ? '#f5c542' : '#e11d48'; U.roundRect(c, bx, by, bw * frac, 8, 4); c.fill();
        c.fillStyle = 'rgba(245,240,230,.55)'; c.font = '700 12px Outfit, sans-serif'; c.textAlign = 'center';
        c.fillText(d.beat % 32 >= 25 ? 'STORM' : 'beat ' + (d.beat % 4 + 1) + ' / 4', CX, by - 6);
      }
    });
  }

  window.Milo.register({
    id: 'sword-storm', title: 'Sword Storm', emo: '⚔️', category: 'Action',
    tagline: 'Cut on the beat, from the side they come from',
    description: 'A rhythm brawler: attackers rush your samurai from four sides in time with a ' +
      'metronome that climbs four bpm every eight beats. Press the direction an attacker ' +
      'comes from while it crosses the white ring; dead centre scores a Perfect, and a second ' +
      'cut on the same beat from another side is a chord worth a big bonus. Gold pairs always ' +
      'arrive together and purple ninjas take one beat instead of two. Every ten cuts in a ' +
      'row raises the multiplier; a whiff resets it and three hits end the run. Tip: listen ' +
      'for the tick and cut on it rather than watching the ring.',
    controls: ['← ↑ ↓ →', 'WASD', 'Tap a side'],
    colors: ['#12111c', '#e11d48'],
    tags: ['rhythm', 'samurai', 'reaction', 'combo', 'action'],
    mount: mount
  });
})();
