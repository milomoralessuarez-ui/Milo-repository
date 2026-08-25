/* Aim Trainer — 30 seconds of targets, with accuracy and reaction time. */
(function () {
  'use strict';
  var W = 800, H = 560, DURATION = 30;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.targets = [];
      d.time = DURATION;
      d.hits = 0;
      d.shots = 0;
      d.streak = 0;
      d.bestStreak = 0;
      d.reactions = [];
      d.parts = [];
      d.rings = [];
      spawn(d);
      g.set('Score', 0);
      g.set('Time', DURATION);
      g.set('Accuracy', '—');
    }

    function spawn(d) {
      var size = Math.max(18, 42 - d.hits * 0.55);
      d.targets = [{
        x: U.rand(size + 30, W - size - 30),
        y: U.rand(size + 70, H - size - 30),
        r: size,
        born: performance.now(),
        life: 0
      }];
    }

    return Milo.arcade(host, {
      id: 'aim-trainer',
      w: W, h: H, bg: '#0a0e24',
      stats: ['Score', 'Time', 'Accuracy'],
      emo: '🎯',
      start: {
        title: 'Aim Trainer',
        text: 'Thirty seconds. Click each target the moment it appears — they get ' +
          'smaller the more you hit. Missing costs you points.',
        keys: ['Click the targets', 'Speed and accuracy both count']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        d.shots++;
        var t = d.targets[0];
        if (t && U.dist(x, y, t.x, t.y) <= t.r) {
          var ms = performance.now() - t.born;
          d.reactions.push(ms);
          d.hits++;
          d.streak++;
          d.bestStreak = Math.max(d.bestStreak, d.streak);
          // Quick clicks on small targets are worth the most.
          var speedBonus = Math.max(0, 60 - Math.floor(ms / 20));
          var sizeBonus = Math.round((44 - t.r) * 2);
          g.score += 20 + speedBonus + Math.max(0, sizeBonus) + Math.min(30, d.streak * 2);
          g.set('Score', U.fmt(g.score));
          Milo.sound.tone({ f: 700 + Math.min(600, d.streak * 30), d: .06, v: .07, type: 'square' });
          d.rings.push({ x: t.x, y: t.y, r: t.r, t: 1 });
          for (var i = 0; i < 14; i++) {
            var a = Math.random() * 6.28, s = U.rand(70, 280);
            d.parts.push({ x: t.x, y: t.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .45, max: .45, col: '#22d3ee' });
          }
          spawn(d);
        } else {
          d.streak = 0;
          g.score = Math.max(0, g.score - 15);
          g.set('Score', U.fmt(g.score));
          Milo.sound.tone({ f: 150, f2: 90, d: .1, v: .06, type: 'sawtooth' });
          d.rings.push({ x: x, y: y, r: 14, t: 1, miss: true });
        }
        var acc = d.shots ? Math.round(d.hits / d.shots * 100) : 0;
        g.set('Accuracy', acc + '%');
      },

      update: function (g, dt) {
        var d = g.data;
        d.time -= dt;
        g.set('Time', Math.max(0, Math.ceil(d.time)));

        d.targets.forEach(function (t) { t.life += dt; });

        d.rings = d.rings.filter(function (r) { r.t -= dt * 2.4; return r.t > 0; });
        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          return p.life > 0;
        });

        if (d.time <= 0) {
          var acc = d.shots ? Math.round(d.hits / d.shots * 100) : 0;
          var avg = d.reactions.length
            ? Math.round(d.reactions.reduce(function (a, b) { return a + b; }, 0) / d.reactions.length)
            : 0;
          g.gameOver({
            emo: '🎯', title: 'Time!',
            text: d.hits + ' hits · ' + acc + '% accuracy · ' +
              (avg ? avg + 'ms average reaction' : 'no hits') +
              ' · best streak ' + d.bestStreak
          });
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#0a0e24'; c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(124,92,255,.10)'; c.lineWidth = 1;
        c.beginPath();
        for (var x = 0; x < W; x += 40) { c.moveTo(x, 0); c.lineTo(x, H); }
        for (var y = 0; y < H; y += 40) { c.moveTo(0, y); c.lineTo(W, y); }
        c.stroke();

        d.rings.forEach(function (r) {
          c.globalAlpha = r.t;
          c.strokeStyle = r.miss ? '#fb7185' : '#22d3ee';
          c.lineWidth = 3;
          c.beginPath(); c.arc(r.x, r.y, r.r * (2 - r.t), 0, 7); c.stroke();
        });
        c.globalAlpha = 1;

        d.targets.forEach(function (t) {
          var pulse = 1 + Math.sin(t.life * 8) * .04;
          c.save();
          c.translate(t.x, t.y);
          c.scale(pulse, pulse);
          c.shadowColor = '#ff4d6d'; c.shadowBlur = 22;
          c.fillStyle = '#ff4d6d';
          c.beginPath(); c.arc(0, 0, t.r, 0, 7); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(0, 0, t.r * .66, 0, 7); c.fill();
          c.fillStyle = '#ff4d6d';
          c.beginPath(); c.arc(0, 0, t.r * .38, 0, 7); c.fill();
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(0, 0, t.r * .13, 0, 7); c.fill();
          c.restore();
        });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2, p.y - 2, 4, 4);
        });
        c.globalAlpha = 1;

        if (d.streak > 2) {
          c.fillStyle = '#ffd257';
          c.font = '800 18px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('STREAK ×' + d.streak, W / 2, H - 22);
        }
      }
    });
  }

  window.Milo.register({
    id: 'aim-trainer', title: 'Aim Trainer', emo: '🎯', category: 'Casual',
    tagline: 'How fast is your click?',
    description: 'One target at a time, thirty seconds on the clock. Hitting a target ' +
      'instantly spawns the next one — slightly smaller. Faster clicks on smaller targets ' +
      'score more, consecutive hits build a streak bonus, and every miss costs 15 points. ' +
      'Your accuracy and average reaction time are reported at the end.',
    controls: ['Click', 'Tap'],
    colors: ['#ff4d6d', '#22d3ee'],
    tags: ['reflex', 'reaction time', 'accuracy', 'timed'],
    mount: mount
  });
})();
