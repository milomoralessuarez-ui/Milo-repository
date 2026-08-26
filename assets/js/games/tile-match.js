/* Tile Match — mahjong-style pairing on a layered layout. */
(function () {
  'use strict';
  var W = 860, H = 620, TW = 58, TH = 76, LIFT = 6;
  var FACES = ['🀄', '🎋', '🌸', '🍁', '🐉', '🐦', '☀️', '🌙', '💠', '🔶', '🟣', '🔵',
    '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.tiles = [];
      var slots = [];
      // Three layers, each smaller than the one below.
      var layers = [
        { cols: 11, rows: 6, z: 0 },
        { cols: 8, rows: 4, z: 1 },
        { cols: 5, rows: 2, z: 2 }
      ];
      layers.forEach(function (L) {
        for (var y = 0; y < L.rows; y++) {
          for (var x = 0; x < L.cols; x++) {
            slots.push({
              x: (W - L.cols * TW) / 2 + x * TW,
              y: 70 + (H - 160 - L.rows * TH * .82) / 2 + y * TH * .82,
              z: L.z, gx: x, gy: y, cols: L.cols, rows: L.rows
            });
          }
        }
      });
      // Trim to an even count so every face can be paired.
      if (slots.length % 2) slots.pop();
      var faces = [];
      for (var i = 0; i < slots.length / 2; i++) {
        var f = FACES[i % FACES.length];
        faces.push(f, f);
      }
      U.shuffle(faces);
      slots.forEach(function (s, i) {
        d.tiles.push({ x: s.x - s.z * LIFT, y: s.y - s.z * LIFT, z: s.z, gx: s.gx, gy: s.gy,
          face: faces[i], gone: false });
      });
      d.sel = null;
      d.left = d.tiles.length;
      d.time = 0;
      d.done = false;
      g.set('Tiles', d.left);
      g.set('Time', '0:00');
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    /** Free means nothing on top and one side open — the mahjong rule. */
    function free(d, t) {
      if (t.gone) return false;
      var above = d.tiles.some(function (o) {
        return !o.gone && o.z === t.z + 1 &&
          Math.abs(o.x - t.x) < TW * .9 && Math.abs(o.y - t.y) < TH * .8;
      });
      if (above) return false;
      var left = d.tiles.some(function (o) {
        return !o.gone && o.z === t.z && o.gy === t.gy && o.gx === t.gx - 1;
      });
      var right = d.tiles.some(function (o) {
        return !o.gone && o.z === t.z && o.gy === t.gy && o.gx === t.gx + 1;
      });
      return !left || !right;
    }

    function anyMove(d) {
      var freeTiles = d.tiles.filter(function (t) { return free(d, t); });
      for (var i = 0; i < freeTiles.length; i++) {
        for (var j = i + 1; j < freeTiles.length; j++) {
          if (freeTiles[i].face === freeTiles[j].face) return true;
        }
      }
      return false;
    }

    return Milo.arcade(host, {
      id: 'tile-match',
      w: W, h: H, bg: '#123522',
      stats: ['Tiles', 'Time', 'Best'],
      emo: '🀄',
      start: {
        title: 'Tile Match',
        text: 'Pair up matching tiles to clear the board. A tile can only be taken when ' +
          'nothing sits on top of it and at least one of its sides is open.',
        keys: ['Click two matching free tiles']
      },
      init: reset,

      onPointer: function (g, type, px, py) {
        if (type !== 'down' || g.state !== 'play' || g.data.done) return;
        var d = g.data;
        // Search from the top layer down so stacked tiles resolve correctly.
        var hit = null;
        for (var z = 2; z >= 0 && !hit; z--) {
          d.tiles.forEach(function (t) {
            if (hit || t.gone || t.z !== z) return;
            if (px >= t.x && px <= t.x + TW && py >= t.y && py <= t.y + TH) hit = t;
          });
        }
        if (!hit) { d.sel = null; return; }
        if (!free(d, hit)) {
          Milo.sound.tone({ f: 150, d: .07, v: .05, type: 'square' });
          return;
        }
        if (!d.sel) { d.sel = hit; Milo.sound.blip(); return; }
        if (d.sel === hit) { d.sel = null; return; }
        if (d.sel.face !== hit.face) { d.sel = hit; Milo.sound.click(); return; }

        d.sel.gone = true;
        hit.gone = true;
        d.sel = null;
        d.left -= 2;
        g.score += 20;
        g.set('Tiles', d.left);
        Milo.sound.coin();

        if (d.left === 0) {
          d.done = true;
          g.win({
            emo: '🀄', title: 'Board cleared!',
            text: 'Done in ' + U.time(d.time) + '.',
            score: Math.max(200, 5000 - Math.round(d.time) * 10)
          });
        } else if (!anyMove(d)) {
          d.done = true;
          g.gameOver({
            emo: '🀄', title: 'No matching pairs left',
            text: d.left + ' tiles stranded.',
            score: (d.tiles.length - d.left) * 20
          });
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (!d.done) { d.time += dt; g.set('Time', U.time(d.time)); }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#17462c'); bg.addColorStop(1, '#0a2416');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        var sorted = d.tiles.slice().sort(function (a, b) { return a.z - b.z || a.y - b.y; });
        sorted.forEach(function (t) {
          if (t.gone) return;
          var isFree = free(d, t);
          c.fillStyle = 'rgba(0,0,0,.35)';
          U.roundRect(c, t.x + 3, t.y + 4, TW - 4, TH - 4, 7); c.fill();
          c.fillStyle = d.sel === t ? '#ffe9a8' : isFree ? '#f4ecd8' : '#c3b89c';
          U.roundRect(c, t.x, t.y, TW - 4, TH - 4, 7); c.fill();
          c.strokeStyle = d.sel === t ? '#f0a020' : 'rgba(0,0,0,.2)';
          c.lineWidth = d.sel === t ? 3 : 1.5;
          U.roundRect(c, t.x, t.y, TW - 4, TH - 4, 7); c.stroke();
          c.globalAlpha = isFree ? 1 : .55;
          c.font = '30px serif';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText(t.face, t.x + (TW - 4) / 2, t.y + (TH - 4) / 2);
          c.globalAlpha = 1;
        });
        c.textBaseline = 'alphabetic';

        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText('Dimmed tiles are blocked — clear what is on top or beside them first',
          W / 2, H - 14);
      }
    });
  }

  window.Milo.register({
    id: 'tile-match', title: 'Tile Match', emo: '🀄', category: 'Puzzle',
    tagline: 'Clear the stack, pair by pair',
    description: 'Tiles are stacked three layers deep. Remove matching pairs — but only ' +
      'tiles that have nothing on top of them and at least one open side can be taken, so ' +
      'the order matters as much as spotting the match. Blocked tiles are drawn dimmed, and ' +
      'the game tells you if you strand yourself with no legal pairs left.',
    controls: ['Click two matching tiles'],
    colors: ['#17462c', '#f4ecd8'],
    tags: ['mahjong', 'matching', 'brain', 'relaxing'],
    mount: mount
  });
})();
