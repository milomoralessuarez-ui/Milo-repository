/* Mastermind — crack the colour code in ten guesses. */
(function () {
  'use strict';
  var SLOTS = 4, TRIES = 10;
  var COLORS = ['#fb7185', '#22d3ee', '#ffd257', '#34d399', '#a78bfa', '#fb923c'];
  var W = 560, H = 680;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.code = [];
      for (var i = 0; i < SLOTS; i++) d.code.push(U.randInt(0, COLORS.length - 1));
      d.rows = [];
      d.cur = [];
      d.done = false;
      d.pick = 0;
      g.set('Guess', '1/' + TRIES);
      g.set('Won', d.wins || 0);
      g.set('Colours', COLORS.length);
    }

    /** Exact matches, then colour-only matches from what's left over. */
    function score(guess, code) {
      var black = 0, white = 0;
      var gLeft = [], cLeft = [];
      for (var i = 0; i < SLOTS; i++) {
        if (guess[i] === code[i]) black++;
        else { gLeft.push(guess[i]); cLeft.push(code[i]); }
      }
      gLeft.forEach(function (v) {
        var at = cLeft.indexOf(v);
        if (at !== -1) { white++; cLeft.splice(at, 1); }
      });
      return { black: black, white: white };
    }

    function submit(g) {
      var d = g.data;
      if (d.cur.length !== SLOTS || d.done) return;
      var s = score(d.cur, d.code);
      d.rows.push({ guess: d.cur.slice(), s: s });
      d.cur = [];
      g.set('Guess', Math.min(TRIES, d.rows.length + 1) + '/' + TRIES);

      if (s.black === SLOTS) {
        d.done = true;
        d.wins = (d.wins || 0) + 1;
        g.set('Won', d.wins);
        g.win({
          emo: '🎨', title: 'Code cracked!',
          text: 'Solved in ' + d.rows.length + ' guess' + (d.rows.length === 1 ? '' : 'es') + '.',
          score: (TRIES - d.rows.length + 1) * 150
        });
      } else if (d.rows.length >= TRIES) {
        d.done = true;
        g.gameOver({ emo: '🎨', title: 'Out of guesses', text: 'The code is revealed below.', score: 0 });
      } else {
        Milo.sound.blip();
      }
    }

    function rowY(i) { return H - 150 - i * 46; }
    function slotX(i) { return 60 + i * 54; }

    return Milo.arcade(host, {
      id: 'mastermind',
      w: W, h: H, bg: '#1a1230',
      stats: ['Guess', 'Won', 'Colours'],
      emo: '🎨',
      start: {
        title: 'Mastermind',
        text: 'A hidden code of four colours, chosen from six, with repeats allowed. ' +
          'After each guess a black peg means right colour in the right place, white means ' +
          'right colour in the wrong place.',
        keys: ['Click a colour', 'Enter to guess', 'Backspace to undo']
      },
      preload: function (g) { g.data.wins = 0; },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        if (e.key === 'Enter') submit(g);
        if (e.key === 'Backspace') d.cur.pop();
        var n = parseInt(e.key, 10);
        if (n >= 1 && n <= COLORS.length && d.cur.length < SLOTS) d.cur.push(n - 1);
      },

      onPointer: function (g, type, x, y) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        if (d.done) return;
        if (y > H - 74) {
          for (var i = 0; i < COLORS.length; i++) {
            var bx = 46 + i * 78;
            if (x >= bx && x <= bx + 60) {
              if (d.cur.length < SLOTS) { d.cur.push(i); Milo.sound.click(); }
              if (d.cur.length === SLOTS) submit(g);
              return;
            }
          }
          return;
        }
        // tapping the working row removes the last peg
        if (y > H - 148 && y < H - 100) d.cur.pop();
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#241a44'); bg.addColorStop(1, '#0e0a1c');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        // the code, hidden until the game ends
        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '700 12px Outfit, sans-serif';
        c.textAlign = 'left';
        c.fillText('THE CODE', 60, 34);
        for (var i = 0; i < SLOTS; i++) {
          var x = slotX(i);
          if (d.done) {
            c.fillStyle = COLORS[d.code[i]];
            c.beginPath(); c.arc(x, 58, 18, 0, 7); c.fill();
          } else {
            c.fillStyle = 'rgba(255,255,255,.10)';
            c.beginPath(); c.arc(x, 58, 18, 0, 7); c.fill();
            c.fillStyle = 'rgba(255,255,255,.4)';
            c.font = '700 18px Outfit, sans-serif';
            c.textAlign = 'center';
            c.fillText('?', x, 65);
          }
        }

        for (var r = 0; r < d.rows.length; r++) {
          var row = d.rows[r], y = rowY(r);
          row.guess.forEach(function (v, k) {
            c.fillStyle = COLORS[v];
            c.beginPath(); c.arc(slotX(k), y, 17, 0, 7); c.fill();
          });
          // feedback pegs, 2x2
          for (var p = 0; p < SLOTS; p++) {
            var px = 300 + (p % 2) * 18, py = y - 9 + ((p / 2) | 0) * 18;
            c.fillStyle = p < row.s.black ? '#12162e'
              : p < row.s.black + row.s.white ? '#ffffff' : 'rgba(255,255,255,.10)';
            c.beginPath(); c.arc(px, py, 6, 0, 7); c.fill();
            if (p < row.s.black) {
              c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.5;
              c.beginPath(); c.arc(px, py, 6, 0, 7); c.stroke();
            }
          }
        }

        // working row
        var wy = H - 124;
        for (var s = 0; s < SLOTS; s++) {
          c.fillStyle = d.cur[s] != null ? COLORS[d.cur[s]] : 'rgba(255,255,255,.08)';
          c.beginPath(); c.arc(slotX(s), wy, 19, 0, 7); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1.5;
          c.beginPath(); c.arc(slotX(s), wy, 19, 0, 7); c.stroke();
        }

        for (var k2 = 0; k2 < COLORS.length; k2++) {
          var bx = 46 + k2 * 78;
          c.fillStyle = COLORS[k2];
          U.roundRect(c, bx, H - 66, 60, 42, 10); c.fill();
          c.fillStyle = 'rgba(0,0,0,.55)';
          c.font = '700 12px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(String(k2 + 1), bx + 30, H - 40);
        }
      }
    });
  }

  window.Milo.register({
    id: 'mastermind', title: 'Mastermind', emo: '🎨', category: 'Puzzle',
    tagline: 'Crack the four-colour code',
    description: 'A hidden sequence of four colours drawn from six, repeats allowed. Each ' +
      'guess comes back with pegs: a dark peg for a colour that is right and in the right ' +
      'place, a white peg for a colour that is right but misplaced. The pegs are not in ' +
      'order — working out which is which is the whole game. Ten guesses.',
    controls: ['Click a colour', 'Enter', 'Backspace'],
    colors: ['#1a1230', '#fb7185'],
    tags: ['logic', 'deduction', 'brain', 'classic'],
    mount: mount
  });
})();
