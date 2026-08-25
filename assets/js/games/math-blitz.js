/* Math Blitz — 60 seconds of arithmetic that gets harder as you go. */
(function () {
  'use strict';
  var W = 720, H = 480, TIME = 60;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.time = TIME;
      d.right = 0;
      d.wrong = 0;
      d.streak = 0;
      d.best = 0;
      d.typed = '';
      d.flash = null;
      next(d);
      g.set('Score', 0);
      g.set('Time', TIME);
      g.set('Streak', 0);
    }

    function next(d) {
      var tier = Math.min(4, 1 + Math.floor(d.right / 6));
      var ops = ['+', '-'];
      if (tier >= 2) ops.push('×');
      if (tier >= 4) ops.push('÷');
      var op = U.choice(ops);
      var a, b;
      if (op === '+') { a = U.randInt(2, 20 * tier); b = U.randInt(2, 20 * tier); }
      else if (op === '-') { a = U.randInt(5, 20 * tier); b = U.randInt(1, a); }
      else if (op === '×') { a = U.randInt(2, 4 + tier * 3); b = U.randInt(2, 4 + tier * 3); }
      else { b = U.randInt(2, 9); var q = U.randInt(2, 9); a = b * q; }
      d.q = { a: a, b: b, op: op };
      d.answer = op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : a / b;
      d.typed = '';
    }

    function submit(g) {
      var d = g.data;
      if (d.typed === '') return;
      if (parseInt(d.typed, 10) === d.answer) {
        d.right++;
        d.streak++;
        d.best = Math.max(d.best, d.streak);
        var pts = 20 + d.streak * 4;
        g.score += pts;
        g.set('Score', U.fmt(g.score));
        g.set('Streak', d.streak);
        d.flash = { t: .4, text: '+' + pts, good: true };
        d.time = Math.min(TIME, d.time + 1);
        Milo.sound.coin();
      } else {
        d.wrong++;
        d.streak = 0;
        g.set('Streak', 0);
        d.flash = { t: .5, text: 'Was ' + d.answer, good: false };
        d.time = Math.max(0, d.time - 2);
        Milo.sound.tone({ f: 150, d: .12, v: .06, type: 'square' });
      }
      next(d);
    }

    function padButton(i) {
      var cols = 3;
      var x = 250 + (i % cols) * 76, y = 250 + Math.floor(i / cols) * 56;
      return { x: x, y: y, w: 68, h: 48 };
    }

    return Milo.arcade(host, {
      id: 'math-blitz',
      w: W, h: H, bg: '#0e1a30',
      stats: ['Score', 'Time', 'Streak'],
      emo: '➗',
      start: {
        title: 'Math Blitz',
        text: 'Sixty seconds of mental arithmetic. Right answers add a second and build ' +
          'a streak bonus; wrong ones cost you two. It gets harder the better you do.',
        keys: ['Type the answer', 'Enter to submit']
      },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        if (e.key === 'Enter') { submit(g); return; }
        if (e.key === 'Backspace') { d.typed = d.typed.slice(0, -1); return; }
        if (e.key === '-' && !d.typed) { d.typed = '-'; return; }
        if (/^[0-9]$/.test(e.key) && d.typed.length < 6) d.typed += e.key;
      },

      onPointer: function (g, type, x, y) {
        if (type !== 'down') return;
        var d = g.data;
        var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '↵'];
        for (var i = 0; i < keys.length; i++) {
          var b = padButton(i);
          if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
            var k = keys[i];
            if (k === '⌫') d.typed = d.typed.slice(0, -1);
            else if (k === '↵') submit(g);
            else if (d.typed.length < 6) d.typed += k;
            return;
          }
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.flash) { d.flash.t -= dt; if (d.flash.t <= 0) d.flash = null; }
        d.time -= dt;
        g.set('Time', Math.max(0, Math.ceil(d.time)));
        if (d.time <= 0) {
          g.gameOver({
            emo: '➗', title: 'Time!',
            text: d.right + ' correct, ' + d.wrong + ' wrong · best streak ' + d.best + '.'
          });
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#15263f'); bg.addColorStop(1, '#080f1e');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.fillStyle = '#fff';
        c.font = '800 54px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(d.q.a + ' ' + d.q.op + ' ' + d.q.b + ' =', W / 2, 130);

        c.fillStyle = 'rgba(255,255,255,.08)';
        U.roundRect(c, W / 2 - 130, 158, 260, 62, 12); c.fill();
        c.fillStyle = d.typed ? '#22d3ee' : 'rgba(255,255,255,.3)';
        c.font = '800 34px Outfit, sans-serif';
        c.fillText(d.typed || '?', W / 2, 202);

        if (d.flash) {
          c.globalAlpha = Math.min(1, d.flash.t * 2.5);
          c.fillStyle = d.flash.good ? '#34d399' : '#fb7185';
          c.font = '800 22px Outfit, sans-serif';
          c.fillText(d.flash.text, W / 2, 246);
          c.globalAlpha = 1;
        }

        var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '↵'];
        keys.forEach(function (k, i) {
          var b = padButton(i);
          c.fillStyle = k === '↵' ? '#22d3ee' : 'rgba(255,255,255,.10)';
          U.roundRect(c, b.x, b.y, b.w, b.h, 9); c.fill();
          c.fillStyle = k === '↵' ? '#062a33' : '#dfe5ff';
          c.font = '700 20px Outfit, sans-serif';
          c.fillText(k, b.x + b.w / 2, b.y + 32);
        });
      }
    });
  }

  window.Milo.register({
    id: 'math-blitz', title: 'Math Blitz', emo: '➗', category: 'Puzzle',
    tagline: 'Sixty seconds of mental arithmetic',
    description: 'Answer as many sums as you can in a minute. Every correct answer adds a ' +
      'second back to the clock and grows your streak multiplier; every wrong one takes two ' +
      'away. Addition and subtraction to start, with multiplication and then division ' +
      'creeping in as you prove you can keep up.',
    controls: ['Type digits', 'Enter', 'Or use the keypad'],
    colors: ['#0e1a30', '#22d3ee'],
    tags: ['maths', 'timed', 'brain', 'arithmetic'],
    mount: mount
  });
})();
