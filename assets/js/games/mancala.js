/* Mancala — sow the seeds, capture, and land in your store for a free turn. */
(function () {
  'use strict';
  var W = 860, H = 460;
  var PIT_R = 44, STORE_W = 76, STORE_H = 210;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      // 0-5 your pits, 6 your store, 7-12 CPU pits, 13 CPU store.
      d.p = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0];
      d.turn = 0;                  // 0 = you, 1 = cpu
      d.over = false;
      d.thinking = 0;
      d.msg = 'Pick one of your pits';
      d.anim = null;
      g.set('You', 0);
      g.set('CPU', 0);
      g.set('Turn', 'Yours');
    }

    function pitXY(i) {
      if (i === 6) return { x: W - 60 - STORE_W / 2, y: H / 2 };
      if (i === 13) return { x: 60 + STORE_W / 2, y: H / 2 };
      var col = i < 6 ? i : 12 - i;
      var x = 150 + col * 96 + PIT_R;
      return { x: x, y: i < 6 ? H / 2 + 66 : H / 2 - 66 };
    }

    function mine(i, who) { return who === 0 ? (i >= 0 && i <= 5) : (i >= 7 && i <= 12); }
    function storeOf(who) { return who === 0 ? 6 : 13; }

    /** Sow from a pit; returns true if the player earns another turn. */
    function sow(g, from, who) {
      var d = g.data;
      var seeds = d.p[from];
      if (!seeds) return null;
      d.p[from] = 0;
      var i = from;
      while (seeds > 0) {
        i = (i + 1) % 14;
        if (i === storeOf(1 - who)) continue;      // skip the opponent's store
        d.p[i]++;
        seeds--;
      }
      Milo.sound.tone({ f: 380 + d.p[i] * 12, d: .06, v: .05, type: 'triangle' });

      // Landing in an empty pit on your own side captures the pit opposite.
      if (mine(i, who) && d.p[i] === 1) {
        var opp = 12 - i;
        if (d.p[opp] > 0) {
          d.p[storeOf(who)] += d.p[opp] + 1;
          d.p[opp] = 0;
          d.p[i] = 0;
          Milo.sound.coin();
        }
      }
      return i === storeOf(who);
    }

    function sideEmpty(d, who) {
      var range = who === 0 ? [0, 5] : [7, 12];
      for (var i = range[0]; i <= range[1]; i++) if (d.p[i]) return false;
      return true;
    }

    function finish(g) {
      var d = g.data;
      // Whoever still has seeds sweeps them into their store.
      for (var i = 0; i <= 5; i++) { d.p[6] += d.p[i]; d.p[i] = 0; }
      for (var j = 7; j <= 12; j++) { d.p[13] += d.p[j]; d.p[j] = 0; }
      d.over = true;
      g.set('You', d.p[6]);
      g.set('CPU', d.p[13]);
      if (d.p[6] > d.p[13]) g.win({ emo: '🫘', title: 'You win ' + d.p[6] + '–' + d.p[13], score: d.p[6] * 60 });
      else if (d.p[13] > d.p[6]) g.gameOver({ emo: '🫘', title: 'CPU wins ' + d.p[13] + '–' + d.p[6], score: d.p[6] * 60 });
      else g.gameOver({ emo: '🤝', title: 'A tie at ' + d.p[6], score: d.p[6] * 60 });
    }

    function afterMove(g, again, who) {
      var d = g.data;
      g.set('You', d.p[6]);
      g.set('CPU', d.p[13]);
      if (sideEmpty(d, 0) || sideEmpty(d, 1)) { finish(g); return; }
      if (again) {
        d.msg = who === 0 ? 'Landed in your store — go again!' : 'CPU lands in its store, going again';
        if (who === 1) d.thinking = 0.6;
        return;
      }
      d.turn = 1 - who;
      d.msg = d.turn === 0 ? 'Your turn' : 'CPU is thinking…';
      g.set('Turn', d.turn === 0 ? 'Yours' : 'CPU');
      if (d.turn === 1) d.thinking = 0.6;
    }

    function cpuMove(g) {
      var d = g.data;
      if (d.over) return;
      var options = [];
      for (var i = 7; i <= 12; i++) if (d.p[i]) options.push(i);
      if (!options.length) { finish(g); return; }

      // Prefer a free turn, then a capture, then the move that banks the most.
      var best = null, bestScore = -1;
      options.forEach(function (i) {
        var copy = d.p.slice();
        var landed = (i + d.p[i]) % 14;
        var score = 0;
        if (landed === 13) score += 100;
        if (mine(landed, 1) && copy[landed] === 0 && copy[12 - landed] > 0) score += 40 + copy[12 - landed] * 2;
        score += d.p[i] > 0 ? Math.min(d.p[i], 6) : 0;
        score += U.hash2(i, d.p[i], 3) * 3;
        if (score > bestScore) { bestScore = score; best = i; }
      });
      var again = sow(g, best, 1);
      afterMove(g, again, 1);
    }

    return Milo.arcade(host, {
      id: 'mancala',
      w: W, h: H, bg: '#3a2412',
      stats: ['You', 'CPU', 'Turn'],
      emo: '🫘',
      start: {
        title: 'Mancala',
        text: 'Pick up all the seeds from one of your pits and drop them one at a time ' +
          'going anticlockwise. Land in your store for another turn; land in an empty pit ' +
          'on your side and you capture everything opposite.',
        keys: ['Click one of your pits (the bottom row)']
      },
      init: reset,

      onPointer: function (g, type, px, py) {
        if (type !== 'down' || g.state !== 'play') return;
        var d = g.data;
        if (d.over || d.turn !== 0 || d.thinking > 0) return;
        for (var i = 0; i <= 5; i++) {
          var p = pitXY(i);
          if (U.dist(px, py, p.x, p.y) < PIT_R) {
            if (!d.p[i]) { Milo.sound.tone({ f: 140, d: .07, v: .05, type: 'square' }); return; }
            var again = sow(g, i, 0);
            afterMove(g, again, 0);
            return;
          }
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.thinking > 0) {
          d.thinking -= dt;
          if (d.thinking <= 0 && d.turn === 1) cpuMove(g);
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#4c2f18'); bg.addColorStop(1, '#2a1a0c');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.fillStyle = '#6b421f';
        U.roundRect(c, 40, 50, W - 80, H - 100, 40); c.fill();

        function seeds(cx, cy, n, spread) {
          for (var s = 0; s < Math.min(n, 18); s++) {
            var a = s * 2.39, r = spread * Math.sqrt(s / 18);
            var sx = cx + Math.cos(a) * r, sy = cy + Math.sin(a) * r;
            c.fillStyle = ['#e0b453', '#c9d86a', '#e08b53', '#8fd6c0'][s % 4];
            c.beginPath(); c.arc(sx, sy, 6, 0, 7); c.fill();
          }
        }

        [6, 13].forEach(function (i) {
          var p = pitXY(i);
          c.fillStyle = 'rgba(0,0,0,.34)';
          U.roundRect(c, p.x - STORE_W / 2, p.y - STORE_H / 2, STORE_W, STORE_H, 34); c.fill();
          seeds(p.x, p.y, d.p[i], 26);
          c.fillStyle = '#fff';
          c.font = '800 20px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.p[i], p.x, p.y + STORE_H / 2 + 24);
          c.fillStyle = 'rgba(255,255,255,.5)';
          c.font = '600 11px Outfit, sans-serif';
          c.fillText(i === 6 ? 'YOU' : 'CPU', p.x, p.y - STORE_H / 2 - 10);
        });

        for (var i = 0; i < 14; i++) {
          if (i === 6 || i === 13) continue;
          var p = pitXY(i);
          var yours = i <= 5;
          var active = yours && d.turn === 0 && d.p[i] > 0 && !d.over;
          c.fillStyle = 'rgba(0,0,0,.34)';
          c.beginPath(); c.arc(p.x, p.y, PIT_R, 0, 7); c.fill();
          if (active) {
            c.strokeStyle = '#ffd257'; c.lineWidth = 3;
            c.beginPath(); c.arc(p.x, p.y, PIT_R - 2, 0, 7); c.stroke();
          }
          seeds(p.x, p.y, d.p[i], 20);
          c.fillStyle = d.p[i] ? '#fff' : 'rgba(255,255,255,.35)';
          c.font = '700 15px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.p[i], p.x, p.y + PIT_R + 18);
        }

        c.fillStyle = '#f4e6d0';
        c.font = '700 16px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(d.msg, W / 2, 30);
      }
    });
  }

  window.Milo.register({
    id: 'mancala', title: 'Mancala', emo: '🫘', category: 'Strategy',
    tagline: 'Sow seeds, capture, go again',
    description: 'One of the oldest board games there is. Lift all the seeds from one of ' +
      'your pits and drop them one per pit going anticlockwise, skipping the opponent’s ' +
      'store. Finish in your own store and you take another turn; finish in an empty pit ' +
      'on your side and you capture everything sitting opposite it.',
    controls: ['Click one of your pits'],
    colors: ['#6b421f', '#e0b453'],
    tags: ['board game', 'vs cpu', 'ancient', 'strategy'],
    mount: mount
  });
})();
