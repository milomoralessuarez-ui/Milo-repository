/* Fruit Slice — swipe through the fruit, leave the bombs alone. */
(function () {
  'use strict';
  var W = 800, H = 560;
  var FRUIT = [
    { emo: '🍉', col: '#ef4444', pts: 10 }, { emo: '🍊', col: '#fb923c', pts: 10 },
    { emo: '🍋', col: '#facc15', pts: 10 }, { emo: '🍏', col: '#4ade80', pts: 10 },
    { emo: '🍇', col: '#a78bfa', pts: 15 }, { emo: '🍓', col: '#fb7185', pts: 15 },
    { emo: '🥝', col: '#84cc16', pts: 20 }
  ];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.items = [];
      d.trail = [];
      d.parts = [];
      d.lives = 3;
      d.combo = 0;
      d.comboT = 0;
      d.spawn = 0;
      d.wave = 0;
      g.set('Score', 0);
      g.set('Lives', 3);
      g.set('Combo', 0);
    }

    function spawn(d) {
      var isBomb = Math.random() < Math.min(0.24, 0.07 + d.wave * 0.012);
      var f = U.choice(FRUIT);
      d.items.push({
        x: U.rand(80, W - 80), y: H + 40,
        vx: U.rand(-90, 90), vy: U.rand(-780, -640),
        r: isBomb ? 28 : 30, bomb: isBomb,
        emo: isBomb ? '💣' : f.emo, col: isBomb ? '#334155' : f.col,
        pts: isBomb ? 0 : f.pts, a: U.rand(0, 6.28), spin: U.rand(-3, 3), sliced: false
      });
    }

    function slice(g, item) {
      var d = g.data;
      item.sliced = true;
      if (item.bomb) {
        d.lives--;
        d.combo = 0;
        g.set('Lives', Math.max(0, d.lives));
        g.set('Combo', 0);
        Milo.sound.explode();
        burst(d, item.x, item.y, '#f87171', 30);
        if (d.lives <= 0) {
          g.gameOver({ emo: '💣', title: 'One bomb too many', text: 'Final score ' + U.fmt(g.score) + '.' });
        }
        return;
      }
      d.combo++;
      d.comboT = 0.7;
      var pts = item.pts * Math.max(1, d.combo);
      g.score += pts;
      g.set('Score', U.fmt(g.score));
      g.set('Combo', d.combo);
      Milo.sound.tone({ f: 480 + d.combo * 40, f2: 300, d: .08, v: .06, type: 'triangle' });
      burst(d, item.x, item.y, item.col, 16);
    }

    function burst(d, x, y, col, n) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.28, s = U.rand(60, 320);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .8), max: .8, col: col });
      }
    }

    return Milo.arcade(host, {
      id: 'fruit-slice',
      w: W, h: H, bg: '#1a1024',
      stats: ['Score', 'Lives', 'Combo'],
      emo: '🍉',
      start: {
        title: 'Fruit Slice',
        text: 'Swipe through the fruit as it flies up. Slicing several in one swipe builds ' +
          'a combo. Hit a bomb and you lose a life — three and you are out.',
        keys: ['Drag to slice']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (type === 'down') d.trail = [{ x: x, y: y }];
        else if (type === 'move' && g.input.pdown) {
          d.trail.push({ x: x, y: y });
          if (d.trail.length > 14) d.trail.shift();
          // Anything the blade passes over gets cut.
          d.items.forEach(function (it) {
            if (it.sliced) return;
            if (U.dist(x, y, it.x, it.y) < it.r + 12) slice(g, it);
          });
        } else if (type === 'up') d.trail = [];
      },

      update: function (g, dt) {
        var d = g.data;
        d.wave += dt * 0.12;

        d.spawn -= dt;
        if (d.spawn <= 0) {
          d.spawn = Math.max(0.32, U.rand(0.55, 1.2) - d.wave * 0.02);
          var n = 1 + (Math.random() < Math.min(.5, d.wave * .06) ? 1 : 0);
          for (var i = 0; i < n; i++) spawn(d);
        }

        for (var k = d.items.length - 1; k >= 0; k--) {
          var it = d.items[k];
          it.vy += 900 * dt;
          it.x += it.vx * dt;
          it.y += it.vy * dt;
          it.a += it.spin * dt;
          if (it.y > H + 80) {
            if (!it.sliced && !it.bomb) {
              d.lives--;
              d.combo = 0;
              g.set('Lives', Math.max(0, d.lives));
              g.set('Combo', 0);
              Milo.sound.hit();
              if (d.lives <= 0) {
                g.gameOver({ emo: '🍉', title: 'Too many dropped', text: 'Final score ' + U.fmt(g.score) + '.' });
                return;
              }
            }
            d.items.splice(k, 1);
          } else if (it.sliced && it.y > H + 40) {
            d.items.splice(k, 1);
          }
        }

        if (d.comboT > 0) {
          d.comboT -= dt;
          if (d.comboT <= 0) { d.combo = 0; g.set('Combo', 0); }
        }

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 700 * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#2a1638'); bg.addColorStop(1, '#120a1a');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.beginPath(); c.arc(p.x, p.y, 4, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        d.items.forEach(function (it) {
          c.save();
          c.translate(it.x, it.y);
          c.rotate(it.a);
          c.globalAlpha = it.sliced ? .45 : 1;
          c.font = (it.r * 2) + 'px serif';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText(it.emo, 0, 0);
          c.restore();
          c.globalAlpha = 1;
        });
        c.textBaseline = 'alphabetic';

        if (d.trail.length > 1) {
          c.strokeStyle = 'rgba(255,255,255,.85)';
          c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round';
          c.beginPath();
          d.trail.forEach(function (p, i) { i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); });
          c.stroke();
        }

        if (d.combo > 1) {
          c.fillStyle = '#ffd257';
          c.font = '800 24px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('COMBO ×' + d.combo, W / 2, 60);
        }
      }
    });
  }

  window.Milo.register({
    id: 'fruit-slice', title: 'Fruit Slice', emo: '🍉', category: 'Casual',
    tagline: 'Swipe the fruit, dodge the bombs',
    description: 'Fruit is launched up from the bottom of the screen and you cut it by ' +
      'dragging a blade through it. Catch several in a single swipe and the combo multiplier ' +
      'stacks. Bombs cost a life if you slice one, and so does letting three pieces of fruit ' +
      'fall past you.',
    controls: ['Drag to slice'],
    colors: ['#1a1024', '#ef4444'],
    tags: ['swipe', 'reflex', 'arcade', 'combo'],
    mount: mount
  });
})();
