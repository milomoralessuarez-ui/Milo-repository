/* Piano Tap — hit every black tile as the track scrolls faster. */
(function () {
  'use strict';
  var COLS = 4, W = 400, H = 660, ROW_H = 150;
  var NOTES = [262, 294, 330, 349, 392, 440, 494, 523];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.rows = [];
      for (var i = 0; i < 8; i++) d.rows.push({ col: U.randInt(0, COLS - 1), y: -i * ROW_H, hit: false });
      d.speed = 260;
      d.tiles = 0;
      d.combo = 0;
      d.flash = null;
      d.parts = [];
      g.set('Tiles', 0);
      g.set('Speed', 1);
      g.set('Best', U.fmt(g.best));
    }

    function tap(g, x, y) {
      var d = g.data;
      var col = Math.floor(x / (W / COLS));
      // Whichever unhit tile is furthest down is the one you're aiming at.
      var target = null;
      d.rows.forEach(function (r) {
        if (r.hit) return;
        if (!target || r.y > target.y) target = r;
      });
      if (!target) return;

      if (target.col === col && y > target.y && y < target.y + ROW_H) {
        target.hit = true;
        d.tiles++;
        d.combo++;
        g.score = d.tiles;
        g.set('Tiles', d.tiles);
        d.speed = Math.min(900, 260 + d.tiles * 6);
        g.set('Speed', (d.speed / 260).toFixed(1));
        Milo.sound.tone({ f: NOTES[d.tiles % NOTES.length], d: .16, v: .07, type: 'sine' });
        for (var p = 0; p < 6; p++) {
          d.parts.push({
            x: col * (W / COLS) + W / COLS / 2, y: target.y + ROW_H / 2,
            vx: U.rand(-120, 120), vy: U.rand(-160, 40), life: .4, max: .4, col: '#22d3ee'
          });
        }
      } else {
        Milo.sound.explode();
        g.gameOver({ emo: '🎹', title: 'Wrong tile', text: d.tiles + ' tiles played.' });
      }
    }

    return Milo.arcade(host, {
      id: 'piano-tap',
      w: W, h: H, bg: '#f5f5fa',
      stats: ['Tiles', 'Speed', 'Best'],
      emo: '🎹',
      start: {
        title: 'Piano Tap',
        text: 'Tap the black tile in every row as the track scrolls down. Miss one, or ' +
          'touch a white tile, and the music stops. It gets faster with every tile.',
        keys: ['Click / tap the black tiles', 'D F J K']
      },
      init: reset,

      onKey: function (g, e) {
        var idx = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'].indexOf(e.code);
        if (idx === -1) return;
        var d = g.data;
        var target = null;
        d.rows.forEach(function (r) { if (!r.hit && (!target || r.y > target.y)) target = r; });
        if (target) tap(g, idx * (W / COLS) + 10, target.y + 10);
      },
      onPointer: function (g, type, x, y) { if (type === 'down') tap(g, x, y); },

      update: function (g, dt) {
        var d = g.data;
        d.rows.forEach(function (r) { r.y += d.speed * dt; });

        for (var i = d.rows.length - 1; i >= 0; i--) {
          var r = d.rows[i];
          if (r.y > H) {
            if (!r.hit) {
              Milo.sound.explode();
              g.gameOver({ emo: '🎹', title: 'Missed a tile', text: d.tiles + ' tiles played.' });
              return;
            }
            d.rows.splice(i, 1);
            var top = Math.min.apply(null, d.rows.map(function (q) { return q.y; }));
            d.rows.push({ col: U.randInt(0, COLS - 1), y: top - ROW_H, hit: false });
          }
        }

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#f5f5fa'; c.fillRect(0, 0, W, H);

        c.strokeStyle = 'rgba(0,0,0,.10)'; c.lineWidth = 1;
        for (var i = 1; i < COLS; i++) {
          c.beginPath(); c.moveTo(i * (W / COLS), 0); c.lineTo(i * (W / COLS), H); c.stroke();
        }

        d.rows.forEach(function (r) {
          var x = r.col * (W / COLS);
          c.fillStyle = r.hit ? '#c8d0e8' : '#161a35';
          U.roundRect(c, x + 3, r.y + 3, W / COLS - 6, ROW_H - 6, 8);
          c.fill();
        });

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 3, p.y - 3, 6, 6);
        });
        c.globalAlpha = 1;

        c.fillStyle = 'rgba(20,24,50,.55)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('D F J K also play', W / 2, H - 12);
      }
    });
  }

  window.Milo.register({
    id: 'piano-tap', title: 'Piano Tap', emo: '🎹', category: 'Casual',
    tagline: 'Hit every black tile, faster and faster',
    description: 'Four columns of tiles scroll down and exactly one in each row is black. ' +
      'Tap it — or use D, F, J and K — before it reaches the bottom. Every tile you play ' +
      'sounds the next note up a scale and nudges the speed higher; one miss or one wrong ' +
      'tile ends the run.',
    controls: ['Click', 'Tap', 'D F J K'],
    colors: ['#161a35', '#22d3ee'],
    tags: ['reflex', 'music', 'speed', 'hyper-casual'],
    mount: mount
  });
})();
