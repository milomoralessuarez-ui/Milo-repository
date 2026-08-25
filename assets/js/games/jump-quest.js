/* Jump Quest — a platformer with coins, spikes and a flag. */
(function () {
  'use strict';
  var W = 900, H = 520, TS = 40;
  var LEVELS = [
    ['                              ',
     '                              ',
     '        ccc          ccc      ',
     '       =====       =====      ',
     '                              ',
     '   cc                     F   ',
     '  ====      ^^      ====  =   ',
     '##############################'],
    ['                              ',
     '            ccc               ',
     '           =====              ',
     '     cc              cc       ',
     '    ====    ^^^     ====   F  ',
     '                         ===  ',
     '   ^^          ^^             ',
     '##############################'],
    ['               c              ',
     '              ===             ',
     '        c             c    F  ',
     '       ===           === ==== ',
     '   c          ^^^             ',
     '  ===     =======             ',
     '      ^^            ^^^       ',
     '##############################']
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.level = d.level || 0;
      load(d);
      d.lives = 3;
      d.coins = 0;
      g.set('Level', d.level + 1);
      g.set('Coins', 0);
      g.set('Lives', 3);
    }

    function load(d) {
      var map = LEVELS[d.level % LEVELS.length];
      d.map = map;
      d.rows = map.length;
      d.cols = map[0].length;
      d.coinList = [];
      d.spikes = [];
      d.flag = null;
      for (var y = 0; y < d.rows; y++) {
        for (var x = 0; x < d.cols; x++) {
          var ch = map[y][x];
          if (ch === 'c') d.coinList.push({ x: x, y: y, taken: false });
          if (ch === '^') d.spikes.push({ x: x, y: y });
          if (ch === 'F') d.flag = { x: x, y: y };
        }
      }
      d.p = { x: 60, y: (d.rows - 2) * TS, vx: 0, vy: 0, w: 24, h: 34, onGround: false, face: 1 };
      d.cam = 0;
      d.parts = [];
    }

    function solid(d, x, y) {
      if (y < 0) return false;
      if (y >= d.rows || x < 0 || x >= d.cols) return y >= d.rows;
      var ch = d.map[y][x];
      return ch === '#' || ch === '=';
    }

    function hits(d, px, py) {
      var x0 = Math.floor((px - d.p.w / 2) / TS), x1 = Math.floor((px + d.p.w / 2 - 1) / TS);
      var y0 = Math.floor(py / TS), y1 = Math.floor((py + d.p.h - 1) / TS);
      for (var y = y0; y <= y1; y++) {
        for (var x = x0; x <= x1; x++) if (solid(d, x, y)) return true;
      }
      return false;
    }

    function die(g, why) {
      var d = g.data;
      d.lives--;
      g.set('Lives', Math.max(0, d.lives));
      Milo.sound.explode();
      if (d.lives <= 0) {
        g.gameOver({ text: why + ' on level ' + (d.level + 1) + '. ' + d.coins + ' coins collected.' });
        return;
      }
      var keepCoins = d.coinList.map(function (c2) { return c2.taken; });
      load(d);
      d.coinList.forEach(function (c2, i) { c2.taken = keepCoins[i]; });
    }

    return Milo.arcade(host, {
      id: 'jump-quest',
      w: W, h: H, bg: '#0d1b3a',
      stats: ['Level', 'Coins', 'Lives'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'JUMP' }],
      emo: '🏃',
      start: {
        title: 'Jump Quest',
        text: 'Run and jump to the flag. Collect the coins on the way and stay off the ' +
          'spikes. Three levels, three lives.',
        keys: ['← → move', 'Space / ↑ jump']
      },
      preload: function (g) { g.data.level = 0; },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && d.p.onGround) {
          d.p.vy = -560;
          d.p.onGround = false;
          Milo.sound.jump();
        }
      },

      update: function (g, dt) {
        var d = g.data, p = d.p, i = g.input;

        var move = (i.down('right') ? 1 : 0) - (i.down('left') ? 1 : 0);
        if (move) p.face = move;
        p.vx += (move * 230 - p.vx) * Math.min(1, dt * 16);
        p.vy += 1500 * dt;
        p.vy = Math.min(p.vy, 900);

        if ((i.down('up') || i.down('action')) && p.onGround) {
          p.vy = -560;
          p.onGround = false;
          Milo.sound.jump();
        }

        var nx = p.x + p.vx * dt;
        if (!hits(d, nx, p.y)) p.x = nx; else p.vx = 0;
        var ny = p.y + p.vy * dt;
        if (!hits(d, p.x, ny)) { p.y = ny; p.onGround = false; }
        else {
          if (p.vy > 0) p.onGround = true;
          p.vy = 0;
        }
        p.x = U.clamp(p.x, 14, d.cols * TS - 14);

        if (p.y > H + 200) { die(g, 'Fell off the map'); return; }

        var tx = Math.floor(p.x / TS), ty = Math.floor((p.y + p.h - 4) / TS);
        if (d.spikes.some(function (s) { return s.x === tx && s.y === ty; })) {
          die(g, 'Landed on spikes');
          return;
        }

        d.coinList.forEach(function (co) {
          if (co.taken) return;
          if (Math.abs(co.x * TS + TS / 2 - p.x) < 26 && Math.abs(co.y * TS + TS / 2 - (p.y + p.h / 2)) < 30) {
            co.taken = true;
            d.coins++;
            g.score += 25;
            g.set('Coins', d.coins);
            Milo.sound.coin();
          }
        });

        if (d.flag && Math.abs(d.flag.x * TS + TS / 2 - p.x) < 28 &&
          Math.abs(d.flag.y * TS - p.y) < 60) {
          d.level++;
          g.score += 300;
          Milo.sound.win();
          if (d.level >= LEVELS.length) {
            g.win({ score: g.score, emo: '🏁', title: 'All levels cleared!', text: d.coins + ' coins collected.' });
            return;
          }
          load(d);
          g.set('Level', d.level + 1);
        }

        d.cam = U.clamp(p.x - W / 2, 0, Math.max(0, d.cols * TS - W));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#1d3a72'); sky.addColorStop(1, '#0a1226');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        c.save();
        c.translate(-d.cam, H - d.rows * TS);

        for (var y = 0; y < d.rows; y++) {
          for (var x = 0; x < d.cols; x++) {
            var ch = d.map[y][x];
            if (ch !== '#' && ch !== '=') continue;
            c.fillStyle = ch === '#' ? '#3a5a2c' : '#7a5330';
            U.roundRect(c, x * TS, y * TS, TS, TS, 4); c.fill();
            c.fillStyle = ch === '#' ? '#57853f' : '#a1703f';
            c.fillRect(x * TS, y * TS, TS, 7);
          }
        }

        d.spikes.forEach(function (s) {
          c.fillStyle = '#e5484d';
          c.beginPath();
          for (var k = 0; k < 3; k++) {
            c.moveTo(s.x * TS + k * 13, (s.y + 1) * TS);
            c.lineTo(s.x * TS + k * 13 + 6.5, s.y * TS + 12);
            c.lineTo(s.x * TS + k * 13 + 13, (s.y + 1) * TS);
          }
          c.fill();
        });

        d.coinList.forEach(function (co) {
          if (co.taken) return;
          var bob = Math.sin(g.t * 5 + co.x) * 3;
          c.fillStyle = '#ffd257';
          c.beginPath();
          c.ellipse(co.x * TS + TS / 2, co.y * TS + TS / 2 + bob, 9, 11, 0, 0, 7);
          c.fill();
        });

        if (d.flag) {
          c.strokeStyle = '#e8ecff'; c.lineWidth = 3;
          c.beginPath();
          c.moveTo(d.flag.x * TS + 10, (d.flag.y + 1) * TS);
          c.lineTo(d.flag.x * TS + 10, d.flag.y * TS - 20);
          c.stroke();
          c.fillStyle = '#34d399';
          c.beginPath();
          c.moveTo(d.flag.x * TS + 10, d.flag.y * TS - 20);
          c.lineTo(d.flag.x * TS + 40, d.flag.y * TS - 10);
          c.lineTo(d.flag.x * TS + 10, d.flag.y * TS);
          c.closePath(); c.fill();
        }

        var p = d.p;
        c.fillStyle = '#22d3ee';
        U.roundRect(c, p.x - p.w / 2, p.y, p.w, p.h, 6); c.fill();
        c.fillStyle = '#e9f4ff';
        c.beginPath(); c.arc(p.x, p.y + 9, 7, 0, 7); c.fill();
        c.fillStyle = '#0d2740';
        c.fillRect(p.x - 2 + p.face * 3, p.y + 6, 2.5, 3);
        c.fillRect(p.x + 2 + p.face * 3, p.y + 6, 2.5, 3);
        c.restore();
      }
    });
  }

  window.Milo.register({
    id: 'jump-quest', title: 'Jump Quest', emo: '🏃', category: 'Action',
    tagline: 'Run, jump, collect, reach the flag',
    description: 'A straightforward platformer across three hand-built levels. Run and ' +
      'jump between ledges, pick up the coins, avoid the spikes and touch the flag at the ' +
      'end. Coins you have already collected stay collected when you lose a life, so a ' +
      'tricky jump is worth retrying.',
    controls: ['← →', 'Space / ↑ jump'],
    colors: ['#3a5a2c', '#22d3ee'],
    tags: ['platformer', 'levels', 'jumping', 'action'],
    mount: mount
  });
})();
