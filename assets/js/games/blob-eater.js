/* Blob Eater — eat what's smaller, run from what isn't. */
(function () {
  'use strict';
  var AW = 2400, AH = 1800;
  var NAMES = ['Gulp', 'Bloop', 'Nimbus', 'Orbit', 'Pudge', 'Zest', 'Moxie', 'Wobble', 'Drift'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.me = { x: AW / 2, y: AH / 2, mass: 40, name: 'You', hue: 190, bot: false };
      d.blobs = [d.me];
      for (var i = 0; i < 14; i++) d.blobs.push(mkBot(i));
      d.food = [];
      for (var f = 0; f < 700; f++) d.food.push(mkFood());
      d.cam = { x: 0, y: 0 };
      d.eaten = 0;
      g.set('Mass', 40);
      g.set('Rank', '1/15');
      g.set('Eaten', 0);
    }

    function mkBot(i) {
      return {
        x: U.rand(80, AW - 80), y: U.rand(80, AH - 80),
        mass: U.rand(25, 90), name: NAMES[i % NAMES.length],
        hue: U.randInt(0, 359), bot: true, retarget: 0, tx: 0, ty: 0
      };
    }
    function mkFood() {
      return { x: U.rand(20, AW - 20), y: U.rand(20, AH - 20), hue: U.randInt(0, 359) };
    }

    function radius(b) { return Math.sqrt(b.mass) * 3.4; }
    function speed(b) { return 300 / (1 + Math.sqrt(b.mass) * 0.12); }

    return Milo.arcade(host, {
      id: 'blob-eater',
      fit: 'resize',
      bg: '#080d20',
      stats: ['Mass', 'Rank', 'Eaten'],
      emo: '🔵',
      start: {
        title: 'Blob Eater',
        text: 'Eat the pellets to grow. You can swallow any blob smaller than you — and ' +
          'anything bigger can swallow you. The bigger you get, the slower you move.',
        keys: ['Move the mouse', 'Drag on touch']
      },
      init: reset,

      update: function (g, dt) {
        var d = g.data, me = d.me;

        var wx = g.input.px + d.cam.x, wy = g.input.py + d.cam.y;
        var a = Math.atan2(wy - me.y, wx - me.x);
        var dist = U.dist(wx, wy, me.x, me.y);
        if (dist > 6) {
          me.x += Math.cos(a) * speed(me) * dt;
          me.y += Math.sin(a) * speed(me) * dt;
        }
        var i = g.input;
        if (i.down('left')) me.x -= speed(me) * dt;
        if (i.down('right')) me.x += speed(me) * dt;
        if (i.down('up')) me.y -= speed(me) * dt;
        if (i.down('down')) me.y += speed(me) * dt;

        d.blobs.forEach(function (b) {
          if (!b.bot) return;
          b.retarget -= dt;
          if (b.retarget <= 0) {
            b.retarget = U.rand(.6, 1.6);
            // Chase something smaller, flee something bigger, else find food.
            var threat = null, prey = null;
            d.blobs.forEach(function (o) {
              if (o === b) return;
              var dd = U.dist(o.x, o.y, b.x, b.y);
              if (dd > 460) return;
              if (o.mass > b.mass * 1.15) { if (!threat || dd < threat.d) threat = { o: o, d: dd }; }
              else if (b.mass > o.mass * 1.15) { if (!prey || dd < prey.d) prey = { o: o, d: dd }; }
            });
            if (threat) { b.tx = b.x - (threat.o.x - b.x); b.ty = b.y - (threat.o.y - b.y); }
            else if (prey) { b.tx = prey.o.x; b.ty = prey.o.y; }
            else {
              var near = d.food[U.randInt(0, d.food.length - 1)];
              b.tx = near.x; b.ty = near.y;
            }
          }
          var ba = Math.atan2(b.ty - b.y, b.tx - b.x);
          b.x += Math.cos(ba) * speed(b) * dt;
          b.y += Math.sin(ba) * speed(b) * dt;
        });

        d.blobs.forEach(function (b) {
          b.x = U.clamp(b.x, radius(b), AW - radius(b));
          b.y = U.clamp(b.y, radius(b), AH - radius(b));
          var r = radius(b);
          for (var k = d.food.length - 1; k >= 0; k--) {
            var f = d.food[k];
            if (Math.abs(f.x - b.x) > r + 8 || Math.abs(f.y - b.y) > r + 8) continue;
            if (U.dist(f.x, f.y, b.x, b.y) < r) {
              b.mass += 1.1;
              d.food.splice(k, 1);
              d.food.push(mkFood());
              if (!b.bot) {
                d.eaten++;
                g.set('Eaten', d.eaten);
                Milo.sound.tone({ f: 500 + Math.min(600, b.mass), d: .03, v: .03, type: 'square' });
              }
            }
          }
        });

        // blob vs blob
        for (var x = d.blobs.length - 1; x >= 0; x--) {
          for (var y = d.blobs.length - 1; y >= 0; y--) {
            if (x === y || x >= d.blobs.length || y >= d.blobs.length) continue;
            var big = d.blobs[x], small = d.blobs[y];
            if (big.mass <= small.mass * 1.15) continue;
            if (U.dist(big.x, big.y, small.x, small.y) > radius(big) - radius(small) * .4) continue;
            big.mass += small.mass * 0.8;
            d.blobs.splice(y, 1);
            if (small === me) {
              Milo.sound.explode();
              g.gameOver({ text: 'Eaten by ' + big.name + ' at mass ' + Math.round(me.mass) + '.' });
              return;
            }
            if (big === me) Milo.sound.powerup();
            d.blobs.push(mkBot(U.randInt(0, NAMES.length - 1)));
            if (y < x) x--;
          }
        }

        g.score = Math.round(me.mass);
        g.set('Mass', g.score);
        var rank = 1 + d.blobs.filter(function (b) { return b.mass > me.mass; }).length;
        g.set('Rank', rank + '/' + d.blobs.length);

        d.cam.x = U.clamp(me.x - g.W / 2, 0, Math.max(0, AW - g.W));
        d.cam.y = U.clamp(me.y - g.H / 2, 0, Math.max(0, AH - g.H));
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#080d20'; c.fillRect(0, 0, g.W, g.H);
        c.save();
        c.translate(-d.cam.x, -d.cam.y);

        c.strokeStyle = 'rgba(124,92,255,.10)'; c.lineWidth = 1;
        c.beginPath();
        var gx0 = Math.floor(d.cam.x / 80) * 80, gy0 = Math.floor(d.cam.y / 80) * 80;
        for (var x = gx0; x < d.cam.x + g.W + 80; x += 80) { c.moveTo(x, d.cam.y); c.lineTo(x, d.cam.y + g.H); }
        for (var y = gy0; y < d.cam.y + g.H + 80; y += 80) { c.moveTo(d.cam.x, y); c.lineTo(d.cam.x + g.W, y); }
        c.stroke();
        c.strokeStyle = '#fb7185'; c.lineWidth = 6;
        c.strokeRect(0, 0, AW, AH);

        d.food.forEach(function (f) {
          if (f.x < d.cam.x - 10 || f.x > d.cam.x + g.W + 10) return;
          if (f.y < d.cam.y - 10 || f.y > d.cam.y + g.H + 10) return;
          c.fillStyle = 'hsl(' + f.hue + ',85%,62%)';
          c.beginPath(); c.arc(f.x, f.y, 5, 0, 7); c.fill();
        });

        d.blobs.slice().sort(function (a, b) { return a.mass - b.mass; }).forEach(function (b) {
          var r = radius(b);
          c.fillStyle = 'hsla(' + b.hue + ',80%,55%,.85)';
          c.beginPath(); c.arc(b.x, b.y, r, 0, 7); c.fill();
          c.strokeStyle = 'hsl(' + b.hue + ',80%,72%)'; c.lineWidth = 3;
          c.beginPath(); c.arc(b.x, b.y, r, 0, 7); c.stroke();
          c.fillStyle = b.bot ? 'rgba(255,255,255,.8)' : '#fff';
          c.font = '700 ' + Math.max(11, Math.min(20, r * .4)) + 'px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(b.name, b.x, b.y + 5);
        });
        c.restore();

        var board = d.blobs.slice().sort(function (a, b) { return b.mass - a.mass; }).slice(0, 6);
        c.font = '700 12px Outfit, sans-serif';
        board.forEach(function (b, i) {
          c.fillStyle = 'rgba(8,10,26,.6)';
          U.roundRect(c, g.W - 152, 68 + i * 22, 138, 19, 5); c.fill();
          c.fillStyle = b.bot ? '#c7cff0' : '#22d3ee';
          c.textAlign = 'left';
          c.fillText((i + 1) + '. ' + b.name, g.W - 145, 82 + i * 22);
          c.textAlign = 'right';
          c.fillText(Math.round(b.mass), g.W - 20, 82 + i * 22);
        });
      }
    });
  }

  window.Milo.register({
    id: 'blob-eater', title: 'Blob Eater', emo: '🔵', category: 'Action',
    tagline: 'Eat smaller, flee bigger',
    description: 'An open arena shared with fourteen rival blobs. Pellets grow you slowly; ' +
      'swallowing another blob grows you fast — but you can only eat something meaningfully ' +
      'smaller than you, and anything meaningfully bigger can eat you. Mass costs speed, so ' +
      'the leader is always the slowest thing on the board.',
    controls: ['Move the mouse', 'Arrow keys'],
    colors: ['#080d20', '#22d3ee'],
    tags: ['io-style', 'arena', 'growth', 'action'],
    mount: mount
  });
})();
