/* Cannon Siege — artillery duel across a hilly battlefield. */
(function () {
  'use strict';
  var W = 900, H = 520;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.round = 1;
      d.wins = 0;
      newRound(d);
      g.set('Round', 1);
      g.set('Your HP', 100);
      g.set('Enemy HP', 100);
    }

    function newRound(d) {
      d.ground = [];
      var y = H - 120;
      for (var x = 0; x <= W; x += 12) {
        y += U.rand(-9, 9);
        y = U.clamp(y, H - 230, H - 60);
        d.ground.push(y);
      }
      d.you = { x: 80, hp: 100, angle: 45, power: 60 };
      d.foe = { x: W - 80, hp: 100, angle: 135, power: 60 };
      d.you.y = groundAt(d, d.you.x) - 14;
      d.foe.y = groundAt(d, d.foe.x) - 14;
      d.wind = U.rand(-1, 1) * (10 + d.round * 4);
      d.shell = null;
      d.turn = 'you';
      d.parts = [];
      d.msg = 'Set your angle and power, then fire';
      d.thinking = 0;
    }

    function groundAt(d, x) {
      var i = U.clamp(Math.round(x / 12), 0, d.ground.length - 1);
      return d.ground[i];
    }

    function fire(g, who) {
      var d = g.data;
      var t = who === 'you' ? d.you : d.foe;
      var a = t.angle * Math.PI / 180;
      d.shell = {
        x: t.x + Math.cos(a) * 24, y: t.y - Math.sin(a) * 24,
        vx: Math.cos(a) * t.power * 4.4, vy: -Math.sin(a) * t.power * 4.4,
        from: who, trail: []
      };
      Milo.sound.tone({ f: 150, f2: 90, d: .2, v: .08, type: 'sawtooth' });
    }

    function boom(d, x, y) {
      for (var i = 0; i < 26; i++) {
        var a = Math.random() * 6.28, s = U.rand(50, 280);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .8), max: .8, col: U.choice(['#ffb020', '#fb7185', '#fff']) });
      }
      // Blow a crater in the terrain.
      for (var k = 0; k < d.ground.length; k++) {
        var gx = k * 12;
        var dist = Math.abs(gx - x);
        if (dist < 50) d.ground[k] = Math.min(H - 20, d.ground[k] + (50 - dist) * 0.34);
      }
      Milo.sound.explode();
    }

    function damage(g, target, dist) {
      var d = g.data;
      var dmg = Math.max(0, Math.round(46 - dist * 0.8));
      if (!dmg) return false;
      target.hp -= dmg;
      g.set('Your HP', Math.max(0, d.you.hp));
      g.set('Enemy HP', Math.max(0, d.foe.hp));
      return true;
    }

    function endTurn(g) {
      var d = g.data;
      if (d.foe.hp <= 0) {
        d.wins++;
        d.round++;
        if (d.round > 5) {
          g.win({ emo: '💣', title: 'Siege won!', text: 'Five rounds taken.', score: 1000 + d.you.hp * 20 });
          return;
        }
        g.score += 300 + d.you.hp * 5;
        Milo.sound.win();
        newRound(g.data);
        g.set('Round', d.round);
        g.set('Your HP', 100);
        g.set('Enemy HP', 100);
        return;
      }
      if (d.you.hp <= 0) {
        g.gameOver({ emo: '💣', title: 'Your gun is destroyed', text: 'You won ' + d.wins + ' round' + (d.wins === 1 ? '' : 's') + '.', score: d.wins * 300 });
        return;
      }
      d.turn = d.turn === 'you' ? 'foe' : 'you';
      d.msg = d.turn === 'you' ? 'Your shot' : 'Enemy is ranging…';
      if (d.turn === 'foe') d.thinking = 0.9;
    }

    function foeAim(d) {
      // Aim roughly at the player, with error that shrinks each round.
      var dx = d.you.x - d.foe.x, dy = d.you.y - d.foe.y;
      var err = Math.max(2, 14 - d.round * 2);
      var best = { angle: 135, power: 60, miss: 1e9 };
      for (var a = 100; a <= 170; a += 2) {
        for (var p = 30; p <= 100; p += 2) {
          var rad = a * Math.PI / 180;
          var vx = Math.cos(rad) * p * 4.4, vy = -Math.sin(rad) * p * 4.4;
          var x = d.foe.x, y = d.foe.y, t = 0;
          while (t < 6 && y < H) {
            vy += 300 * 0.05; vx += d.wind * 0.05;
            x += vx * 0.05; y += vy * 0.05; t += 0.05;
            if (y >= groundAt(d, x)) break;
          }
          var miss = Math.abs(x - d.you.x);
          if (miss < best.miss) best = { angle: a, power: p, miss: miss };
        }
      }
      d.foe.angle = best.angle + U.rand(-err, err) * 0.4;
      d.foe.power = U.clamp(best.power + U.rand(-err, err), 20, 100);
    }

    return Milo.arcade(host, {
      id: 'cannon-siege',
      w: W, h: H, bg: '#1a2438',
      stats: ['Round', 'Your HP', 'Enemy HP'],
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'FIRE' }],
      emo: '💣',
      start: {
        title: 'Cannon Siege',
        text: 'An artillery duel. Up and down set your angle, left and right set power, ' +
          'and space fires. The wind pushes every shell, and hits blow craters in the ground.',
        keys: ['↑ ↓ angle', '← → power', 'Space to fire']
      },
      init: reset,

      onKey: function (g, e) {
        var d = g.data;
        if (e.code === 'Space' && d.turn === 'you' && !d.shell) fire(g, 'you');
      },

      update: function (g, dt) {
        var d = g.data, i = g.input;

        if (d.turn === 'you' && !d.shell) {
          if (i.down('up')) d.you.angle = U.clamp(d.you.angle + 34 * dt, 5, 89);
          if (i.down('down')) d.you.angle = U.clamp(d.you.angle - 34 * dt, 5, 89);
          if (i.down('right')) d.you.power = U.clamp(d.you.power + 34 * dt, 10, 100);
          if (i.down('left')) d.you.power = U.clamp(d.you.power - 34 * dt, 10, 100);
          if (i.pressed('action')) fire(g, 'you');
        }

        if (d.thinking > 0) {
          d.thinking -= dt;
          if (d.thinking <= 0 && d.turn === 'foe' && !d.shell) { foeAim(d); fire(g, 'foe'); }
        }

        if (d.shell) {
          var s = d.shell;
          s.vy += 300 * dt;
          s.vx += d.wind * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.trail.push({ x: s.x, y: s.y });
          if (s.trail.length > 40) s.trail.shift();

          var hitGround = s.y >= groundAt(d, s.x);
          var offMap = s.x < -60 || s.x > W + 60 || s.y > H + 200;
          var target = s.from === 'you' ? d.foe : d.you;
          var direct = U.dist(s.x, s.y, target.x, target.y) < 22;

          if (direct || hitGround || offMap) {
            if (!offMap) {
              boom(d, s.x, s.y);
              var dist = U.dist(s.x, s.y, target.x, target.y);
              var hit = damage(g, target, dist);
              d.msg = direct ? 'Direct hit!' : hit ? 'Close — some damage' : 'Missed';
            } else d.msg = 'Out of bounds';
            d.shell = null;
            d.you.y = groundAt(d, d.you.x) - 14;
            d.foe.y = groundAt(d, d.foe.x) - 14;
            endTurn(g);
          }
        }

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#2f4568'); sky.addColorStop(1, '#141b2e');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        c.fillStyle = '#3a4a2c';
        c.beginPath();
        c.moveTo(0, H);
        d.ground.forEach(function (y, i) { c.lineTo(i * 12, y); });
        c.lineTo(W, H);
        c.closePath(); c.fill();
        c.strokeStyle = '#5d7a3c'; c.lineWidth = 3;
        c.beginPath();
        d.ground.forEach(function (y, i) { i ? c.lineTo(i * 12, y) : c.moveTo(0, y); });
        c.stroke();

        [[d.you, '#22d3ee', 'YOU'], [d.foe, '#fb7185', 'ENEMY']].forEach(function (row) {
          var t = row[0];
          c.fillStyle = row[1];
          U.roundRect(c, t.x - 16, t.y - 4, 32, 18, 5); c.fill();
          var a = t.angle * Math.PI / 180;
          c.strokeStyle = row[1]; c.lineWidth = 6; c.lineCap = 'round';
          c.beginPath();
          c.moveTo(t.x, t.y);
          c.lineTo(t.x + Math.cos(a) * 30, t.y - Math.sin(a) * 30);
          c.stroke();
          c.fillStyle = 'rgba(0,0,0,.5)';
          c.fillRect(t.x - 26, t.y - 28, 52, 7);
          c.fillStyle = t.hp > 40 ? '#34d399' : '#fb7185';
          c.fillRect(t.x - 26, t.y - 28, 52 * Math.max(0, t.hp / 100), 7);
        });

        if (d.shell) {
          c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;
          c.beginPath();
          d.shell.trail.forEach(function (p, i) { i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); });
          c.stroke();
          c.fillStyle = '#ffd257';
          c.beginPath(); c.arc(d.shell.x, d.shell.y, 5, 0, 7); c.fill();
        }

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
        });
        c.globalAlpha = 1;

        // readouts
        c.fillStyle = 'rgba(0,0,0,.45)';
        U.roundRect(c, 16, 16, 210, 68, 10); c.fill();
        c.fillStyle = '#dfe5ff';
        c.font = '700 13px Outfit, sans-serif';
        c.textAlign = 'left';
        c.fillText('ANGLE  ' + Math.round(d.you.angle) + '°', 30, 40);
        c.fillText('POWER  ' + Math.round(d.you.power), 30, 60);
        c.fillStyle = Math.abs(d.wind) < 4 ? '#8b93bd' : '#ffd257';
        c.fillText('WIND   ' + (d.wind > 0 ? '→ ' : '← ') + Math.abs(Math.round(d.wind)), 30, 78);

        c.fillStyle = '#fff';
        c.font = '700 17px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(d.msg, W / 2, 40);
      }
    });
  }

  window.Milo.register({
    id: 'cannon-siege', title: 'Cannon Siege', emo: '💣', category: 'Strategy',
    tagline: 'Artillery duel across the hills',
    description: 'You and an enemy gun trade shots across broken ground. Set the angle and ' +
      'power of each shell and account for a crosswind that changes every round. Impacts ' +
      'blow craters in the terrain, which reshapes the shot for both of you. The enemy ' +
      'gunner ranges in properly and its aim tightens with each round you win.',
    controls: ['↑ ↓ angle', '← → power', 'Space fire'],
    colors: ['#3a4a2c', '#ffd257'],
    tags: ['artillery', 'physics', 'turn based', 'vs cpu'],
    mount: mount
  });
})();
