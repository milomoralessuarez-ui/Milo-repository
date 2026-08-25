/* Make 24 — combine four numbers with + - x ÷ to hit exactly 24. */
(function () {
  'use strict';
  var W = 720, H = 520;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.solved = 0;
      d.time = 180;
      d.skips = 3;
      newPuzzle(d);
      g.set('Solved', 0);
      g.set('Time', U.time(180));
      g.set('Skips', 3);
    }

    /** Only deal hands that actually have a solution. */
    function newPuzzle(d) {
      for (var tries = 0; tries < 500; tries++) {
        var nums = [];
        for (var i = 0; i < 4; i++) nums.push(U.randInt(1, 10));
        if (solvable(nums.slice())) {
          d.original = nums.slice();
          dealHand(d);
          return;
        }
      }
      d.original = [4, 6, 2, 3];
      dealHand(d);
    }

    /** Put the current deal back the way it started. */
    function dealHand(d) {
      d.nums = d.original.map(function (v, i) { return { v: v, id: i, gone: false }; });
      d.sel = null;
      d.op = null;
      d.msg = 'Pick a number, an operator, then another number';
    }

    function solvable(nums) {
      if (nums.length === 1) return Math.abs(nums[0] - 24) < 1e-6;
      for (var i = 0; i < nums.length; i++) {
        for (var j = 0; j < nums.length; j++) {
          if (i === j) continue;
          var rest = nums.filter(function (_, k) { return k !== i && k !== j; });
          var a = nums[i], b = nums[j];
          var options = [a + b, a - b, a * b];
          if (Math.abs(b) > 1e-6) options.push(a / b);
          for (var o = 0; o < options.length; o++) {
            if (solvable(rest.concat([options[o]]))) return true;
          }
        }
      }
      return false;
    }

    var OPS = ['+', '−', '×', '÷'];

    function apply(a, op, b) {
      if (op === '+') return a + b;
      if (op === '−') return a - b;
      if (op === '×') return a * b;
      return Math.abs(b) < 1e-9 ? null : a / b;
    }

    function tapNumber(g, item) {
      var d = g.data;
      if (item.gone) return;
      if (d.sel == null) { d.sel = item; Milo.sound.blip(); return; }
      if (d.sel === item) { d.sel = null; return; }
      if (!d.op) { d.sel = item; return; }

      var result = apply(d.sel.v, d.op, item.v);
      if (result == null) { d.msg = 'Cannot divide by zero'; return; }
      d.sel.gone = true;
      item.v = result;
      d.sel = null;
      d.op = null;
      Milo.sound.tone({ f: 420, d: .07, v: .06, type: 'triangle' });

      var left = d.nums.filter(function (n) { return !n.gone; });
      if (left.length === 1) {
        if (Math.abs(left[0].v - 24) < 1e-6) {
          d.solved++;
          g.score += 200 + Math.round(d.time);
          g.set('Solved', d.solved);
          d.msg = 'That is 24! Next hand…';
          Milo.sound.win();
          newPuzzle(d);
        } else {
          d.msg = 'That comes to ' + round(left[0].v) + ', not 24 — hand reset.';
          Milo.sound.hit();
          dealHand(d);
        }
      }
    }

    return Milo.arcade(host, {
      id: 'make-24',
      w: W, h: H, bg: '#141a3c',
      stats: ['Solved', 'Time', 'Skips'],
      emo: '🎰',
      start: {
        title: 'Make 24',
        text: 'Use all four numbers exactly once, with plus, minus, times and divide, to ' +
          'reach exactly 24. Every hand dealt is guaranteed solvable.',
        keys: ['Click a number, an operator, then another number']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;

        if (y > 300 && y < 364) {
          for (var i = 0; i < 4; i++) {
            var bx = W / 2 - 160 + i * 84;
            if (x > bx && x < bx + 70) { d.op = d.op === OPS[i] ? null : OPS[i]; Milo.sound.click(); return; }
          }
        }
        if (y > 400 && y < 456) {
          if (x > W / 2 - 160 && x < W / 2 - 20) { dealHand(d); Milo.sound.click(); return; }
          if (x > W / 2 + 20 && x < W / 2 + 160 && d.skips > 0) {
            d.skips--;
            g.set('Skips', d.skips);
            d.time = Math.max(0, d.time - 10);
            newPuzzle(d);
            return;
          }
        }
        var live = d.nums.filter(function (n) { return !n.gone; });
        live.forEach(function (n, i) {
          var bx = W / 2 - (live.length * 110 - 20) / 2 + i * 110;
          if (x > bx && x < bx + 90 && y > 140 && y < 230) tapNumber(g, n);
        });
      },

      update: function (g, dt) {
        var d = g.data;
        d.time -= dt;
        g.set('Time', U.time(Math.max(0, d.time)));
        if (d.time <= 0) {
          g.gameOver({
            emo: '🎰', title: 'Time!',
            text: d.solved + ' hand' + (d.solved === 1 ? '' : 's') + ' solved.'
          });
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1c2350'); bg.addColorStop(1, '#0b0f26');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.fillStyle = '#ffd257';
        c.font = '800 34px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('Make 24', W / 2, 70);

        var live = d.nums.filter(function (n) { return !n.gone; });
        live.forEach(function (n, i) {
          var bx = W / 2 - (live.length * 110 - 20) / 2 + i * 110;
          var sel = d.sel === n;
          c.fillStyle = sel ? '#22d3ee' : 'rgba(255,255,255,.10)';
          U.roundRect(c, bx, 140, 90, 90, 14); c.fill();
          c.fillStyle = sel ? '#062a33' : '#fff';
          c.font = '800 34px Outfit, sans-serif';
          c.fillText(round(n.v), bx + 45, 196);
        });

        OPS.forEach(function (op, i) {
          var bx = W / 2 - 160 + i * 84;
          c.fillStyle = d.op === op ? '#7c5cff' : 'rgba(255,255,255,.10)';
          U.roundRect(c, bx, 300, 70, 60, 12); c.fill();
          c.fillStyle = '#fff';
          c.font = '800 28px Outfit, sans-serif';
          c.fillText(op, bx + 35, 340);
        });

        [['Reset hand', W / 2 - 160], ['Skip (−10s)', W / 2 + 20]].forEach(function (b, i) {
          c.fillStyle = 'rgba(255,255,255,.08)';
          U.roundRect(c, b[1], 400, 140, 48, 10); c.fill();
          c.fillStyle = i === 1 && !d.skips ? 'rgba(255,255,255,.3)' : '#dfe5ff';
          c.font = '700 14px Outfit, sans-serif';
          c.fillText(b[0], b[1] + 70, 430);
        });

        c.fillStyle = 'rgba(255,255,255,.6)';
        c.font = '600 14px Outfit, sans-serif';
        c.fillText(d.msg, W / 2, 268);
      }
    });

    function round(v) {
      return Math.abs(v - Math.round(v)) < 1e-6 ? String(Math.round(v)) : v.toFixed(2);
    }
  }

  window.Milo.register({
    id: 'make-24', title: 'Make 24', emo: '🎰', category: 'Puzzle',
    tagline: 'Four numbers, one target',
    description: 'Combine all four numbers — each used exactly once — with addition, ' +
      'subtraction, multiplication and division to land on exactly 24. Fractions along the ' +
      'way are fine. Every hand is checked for solvability before it is dealt, so if you ' +
      'cannot see it, it is still there.',
    controls: ['Click number, operator, number'],
    colors: ['#141a3c', '#ffd257'],
    tags: ['maths', 'brain', 'numbers', 'logic'],
    mount: mount
  });
})();
