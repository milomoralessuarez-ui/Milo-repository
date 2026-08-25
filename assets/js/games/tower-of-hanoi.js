/* Tower of Hanoi — move the stack, never a big disc onto a small one. */
(function () {
  'use strict';
  var W = 780, H = 480;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.n = d.n || 4;
      d.pegs = [[], [], []];
      for (var i = d.n; i >= 1; i--) d.pegs[0].push(i);
      d.held = null;
      d.moves = 0;
      d.time = 0;
      d.done = false;
      d.par = Math.pow(2, d.n) - 1;
      g.set('Moves', 0);
      g.set('Best possible', d.par);
      g.set('Discs', d.n);
    }

    function pegX(i) { return W / 2 + (i - 1) * 220; }
    var BASE_Y = H - 90;

    function discW(size, n) { return 44 + (size / n) * 130; }

    function drop(g, peg) {
      var d = g.data;
      if (d.held == null) return;
      var top = d.pegs[peg][d.pegs[peg].length - 1];
      if (top != null && top < d.held.size) {
        Milo.sound.tone({ f: 150, d: .08, v: .05, type: 'square' });
        d.pegs[d.held.from].push(d.held.size);
        d.held = null;
        return;
      }
      d.pegs[peg].push(d.held.size);
      if (peg !== d.held.from) {
        d.moves++;
        g.set('Moves', d.moves);
        Milo.sound.tone({ f: 380 + d.held.size * 30, d: .07, v: .06, type: 'triangle' });
      }
      d.held = null;

      if (d.pegs[2].length === d.n) {
        d.done = true;
        var perfect = d.moves === d.par;
        g.win({
          emo: '🗼',
          title: perfect ? 'Perfect — ' + d.moves + ' moves!' : 'Tower moved!',
          text: d.moves + ' moves (best possible is ' + d.par + ') in ' + U.time(d.time) + '.',
          score: Math.max(100, d.n * 400 - (d.moves - d.par) * 25 - Math.round(d.time) * 3)
        });
      }
    }

    function sizeButton(i) { return { x: 20 + i * 62, y: 12, w: 54, h: 26 }; }

    return Milo.arcade(host, {
      id: 'tower-of-hanoi',
      w: W, h: H, bg: '#1a1030',
      stats: ['Moves', 'Best possible', 'Discs'],
      emo: '🗼',
      start: {
        title: 'Tower of Hanoi',
        text: 'Move the whole stack to the right-hand peg. One disc at a time, and a ' +
          'larger disc may never rest on a smaller one. The minimum is 2ⁿ−1 moves.',
        keys: ['Click a peg to lift', 'Click another to drop']
      },
      preload: function (g) { g.data.n = 4; },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;

        if (y < 44) {
          for (var i = 0; i < 5; i++) {
            var b = sizeButton(i);
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
              d.n = i + 3;
              g.restart();
              return;
            }
          }
        }
        if (d.done) return;

        var peg = 0, bestD = 1e9;
        for (var p = 0; p < 3; p++) {
          var dist = Math.abs(x - pegX(p));
          if (dist < bestD) { bestD = dist; peg = p; }
        }
        if (bestD > 110) return;

        if (d.held == null) {
          if (!d.pegs[peg].length) return;
          d.held = { size: d.pegs[peg].pop(), from: peg };
          Milo.sound.blip();
        } else {
          drop(g, peg);
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (!d.done) { d.time += dt; }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#241640'); bg.addColorStop(1, '#0e0820');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        for (var i = 0; i < 5; i++) {
          var b = sizeButton(i);
          c.fillStyle = d.n === i + 3 ? '#7c5cff' : 'rgba(255,255,255,.08)';
          U.roundRect(c, b.x, b.y, b.w, b.h, 7); c.fill();
          c.fillStyle = '#fff';
          c.font = '700 12px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText((i + 3) + ' discs', b.x + b.w / 2, b.y + 18);
        }

        c.fillStyle = '#5b4630';
        U.roundRect(c, 60, BASE_Y, W - 120, 16, 6); c.fill();
        for (var p = 0; p < 3; p++) {
          c.fillStyle = '#7a5f40';
          U.roundRect(c, pegX(p) - 7, BASE_Y - 200, 14, 200, 6); c.fill();
          c.fillStyle = p === 2 ? 'rgba(52,211,153,.75)' : 'rgba(255,255,255,.3)';
          c.font = '700 12px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(p === 2 ? 'TARGET' : String.fromCharCode(65 + p), pegX(p), BASE_Y + 36);
        }

        for (var q = 0; q < 3; q++) {
          d.pegs[q].forEach(function (size, k) {
            var dw = discW(size, d.n);
            var y = BASE_Y - 22 - k * 24;
            var hue = 200 + (size / d.n) * 140;
            c.fillStyle = 'hsl(' + hue + ',70%,58%)';
            U.roundRect(c, pegX(q) - dw / 2, y, dw, 20, 9); c.fill();
            c.fillStyle = 'rgba(255,255,255,.25)';
            U.roundRect(c, pegX(q) - dw / 2 + 6, y + 4, dw - 12, 5, 2.5); c.fill();
          });
        }

        if (d.held) {
          var dw2 = discW(d.held.size, d.n);
          var hue2 = 200 + (d.held.size / d.n) * 140;
          c.fillStyle = 'hsl(' + hue2 + ',80%,66%)';
          U.roundRect(c, pegX(d.held.from) - dw2 / 2, 96, dw2, 20, 9); c.fill();
          c.fillStyle = 'rgba(255,255,255,.5)';
          c.font = '600 12px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('carrying — click a peg to place', W / 2, 78);
        }
      }
    });
  }

  window.Milo.register({
    id: 'tower-of-hanoi', title: 'Tower of Hanoi', emo: '🗼', category: 'Puzzle',
    tagline: 'Move the stack, one disc at a time',
    description: 'Shift the whole tower from the left peg to the right one. You can only ' +
      'move a single disc at a time and a larger disc can never sit on a smaller one. ' +
      'Three to seven discs; the theoretical minimum is 2ⁿ−1 moves, and matching it is ' +
      'the real challenge.',
    controls: ['Click a peg to lift', 'Click a peg to drop'],
    colors: ['#1a1030', '#38bdf8'],
    tags: ['logic', 'classic', 'brain', 'recursion'],
    mount: mount
  });
})();
