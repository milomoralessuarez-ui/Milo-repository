/* Simon Says — repeat the sequence, one longer every round. */
(function () {
  'use strict';
  var W = 520, H = 520;
  var PADS = [
    { col: '#34d399', lit: '#a7f3d0', freq: 330, a0: Math.PI, a1: Math.PI * 1.5 },
    { col: '#fb7185', lit: '#fecdd3', freq: 415, a0: Math.PI * 1.5, a1: Math.PI * 2 },
    { col: '#ffd257', lit: '#fef3c7', freq: 494, a0: Math.PI * .5, a1: Math.PI },
    { col: '#38bdf8', lit: '#bae6fd', freq: 587, a0: 0, a1: Math.PI * .5 }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.seq = [];
      d.step = 0;
      d.lit = -1;
      d.phase = 'show';
      d.timer = 0.8;
      d.strict = d.strict || false;
      addStep(d);
      g.set('Round', 0);
      g.set('Best', U.fmt(g.best));
      g.set('Mode', d.strict ? 'Strict' : 'Normal');
    }

    function addStep(d) {
      d.seq.push(U.randInt(0, 3));
      d.step = 0;
      d.phase = 'show';
      d.showIdx = 0;
      d.timer = 0.6;
    }

    function press(g, i) {
      var d = g.data;
      if (d.phase !== 'input') return;
      d.lit = i;
      d.litT = 0.22;
      Milo.sound.tone({ f: PADS[i].freq, d: .22, v: .08, type: 'sine' });

      if (d.seq[d.step] === i) {
        d.step++;
        if (d.step >= d.seq.length) {
          g.score = d.seq.length;
          g.set('Round', d.seq.length);
          d.phase = 'wait';
          d.timer = 0.7;
        }
      } else {
        Milo.sound.lose();
        g.gameOver({
          emo: '🔴', title: 'Wrong pad',
          text: 'You repeated ' + (d.seq.length - 1) + ' round' + (d.seq.length - 1 === 1 ? '' : 's') + '.',
          score: d.seq.length - 1
        });
      }
    }

    function padAt(x, y) {
      var dx = x - W / 2, dy = y - H / 2;
      var r = Math.hypot(dx, dy);
      if (r < 60 || r > 200) return -1;
      var a = Math.atan2(dy, dx);
      if (a < 0) a += Math.PI * 2;
      for (var i = 0; i < 4; i++) {
        if (a >= PADS[i].a0 && a < PADS[i].a1) return i;
      }
      return -1;
    }

    return Milo.arcade(host, {
      id: 'simon-says',
      w: W, h: H, bg: '#0b0f24',
      stats: ['Round', 'Best', 'Mode'],
      emo: '🔴',
      start: {
        title: 'Simon Says',
        text: 'Watch the sequence, then repeat it. One extra step every round. Press S ' +
          'for strict mode, where a single mistake ends the run instead of replaying it.',
        keys: ['Click the pads', '1–4 also work', 'S for strict']
      },
      preload: function (g) { g.data.strict = true; },
      init: reset,

      onKey: function (g, e) {
        var m = /^Digit([1-4])$/.exec(e.code);
        if (m) press(g, +m[1] - 1);
        if (e.code === 'KeyS') { g.data.strict = !g.data.strict; g.restart(); }
      },
      onPointer: function (g, type, x, y) {
        if (type !== 'down') return;
        var i = padAt(x, y);
        if (i >= 0) press(g, i);
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.litT > 0) { d.litT -= dt; if (d.litT <= 0) d.lit = -1; }

        d.timer -= dt;
        if (d.timer > 0) return;

        if (d.phase === 'show') {
          if (d.showIdx < d.seq.length) {
            d.lit = d.seq[d.showIdx];
            d.litT = 0.42;
            Milo.sound.tone({ f: PADS[d.lit].freq, d: .4, v: .08, type: 'sine' });
            d.showIdx++;
            d.timer = 0.62;
          } else {
            d.phase = 'input';
            d.timer = 999;
          }
        } else if (d.phase === 'wait') {
          addStep(d);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * .7);
        bg.addColorStop(0, '#161c40'); bg.addColorStop(1, '#070a1a');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        PADS.forEach(function (p, i) {
          c.fillStyle = d.lit === i ? p.lit : p.col;
          c.beginPath();
          c.moveTo(W / 2, H / 2);
          c.arc(W / 2, H / 2, 200, p.a0 + 0.03, p.a1 - 0.03);
          c.closePath();
          c.fill();
        });

        c.fillStyle = '#0b0f24';
        c.beginPath(); c.arc(W / 2, H / 2, 62, 0, 7); c.fill();
        c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 2;
        c.beginPath(); c.arc(W / 2, H / 2, 62, 0, 7); c.stroke();

        c.fillStyle = '#fff';
        c.font = '800 30px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(d.seq.length, W / 2, H / 2 + 4);
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 11px Outfit, sans-serif';
        c.fillText(d.phase === 'show' ? 'WATCH' : d.phase === 'input' ? 'REPEAT' : '…', W / 2, H / 2 + 24);
      }
    });
  }

  window.Milo.register({
    id: 'simon-says', title: 'Simon Says', emo: '🔴', category: 'Casual',
    tagline: 'Repeat the sequence, one longer each time',
    description: 'Four pads light up in a sequence and play a note each; repeat it back. ' +
      'Every round adds one more step, so it becomes a memory test dressed up as a reflex ' +
      'game. Press S to toggle strict mode, where a single wrong pad ends the run.',
    controls: ['Click the pads', '1–4', 'S for strict'],
    colors: ['#0b0f24', '#34d399'],
    tags: ['memory', 'sequence', 'classic', 'sound'],
    mount: mount
  });
})();
