/* Penalty Shootout — five each way, then sudden death. */
(function () {
  'use strict';
  var W = 800, H = 560;
  var GOAL = { x: 150, y: 120, w: 500, h: 240 };

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.you = [];
      d.cpu = [];
      d.round = 0;
      d.mode = 'shoot';          // shoot | keep
      d.phase = 'aim';
      d.ball = null;
      d.keeper = { x: W / 2, y: GOAL.y + GOAL.h - 40, dive: 0 };
      d.aim = null;
      d.msg = 'Drag to place your shot';
      d.pick = null;
      g.set('You', 0);
      g.set('CPU', 0);
      g.set('Round', 1);
    }

    function score(list) { return list.filter(Boolean).length; }

    function shoot(g, tx, ty, power) {
      var d = g.data;
      d.ball = { x: W / 2, y: H - 90, tx: tx, ty: ty, t: 0, power: power };
      // The keeper commits to a side as the ball is struck.
      var guess = U.rand(GOAL.x + 40, GOAL.x + GOAL.w - 40);
      // Better keepers on later rounds.
      var accuracy = U.clamp(0.25 + d.round * 0.06, 0, 0.7);
      d.keeper.target = tx * accuracy + guess * (1 - accuracy);
      d.keeper.diveY = ty * accuracy + U.rand(GOAL.y + 40, GOAL.y + GOAL.h - 30) * (1 - accuracy);
      d.phase = 'flying';
      Milo.sound.tone({ f: 220, f2: 150, d: .12, v: .07, type: 'triangle' });
    }

    function cpuShoot(g) {
      var d = g.data;
      d.pick = null;
      d.phase = 'choose';
      d.msg = 'Pick a side to dive';
    }

    function resolveCpu(g, side) {
      var d = g.data;
      var target = U.rand(GOAL.x + 30, GOAL.x + GOAL.w - 30);
      var region = target < GOAL.x + GOAL.w / 3 ? 0 : target < GOAL.x + GOAL.w * 2 / 3 ? 1 : 2;
      var saved = side === region && Math.random() < 0.8;
      d.cpu.push(!saved);
      g.set('CPU', score(d.cpu));
      d.msg = saved ? 'Saved!' : 'They score.';
      if (saved) Milo.sound.win(); else Milo.sound.hit();
      d.phase = 'result';
      d.resultT = 1.2;
      d.lastCpu = { target: target, saved: saved, side: side };
    }

    function nextTurn(g) {
      var d = g.data;
      if (d.mode === 'shoot') {
        d.mode = 'keep';
        cpuShoot(g);
        return;
      }
      d.mode = 'shoot';
      d.round++;
      g.set('Round', d.round + 1);

      var y = score(d.you), c = score(d.cpu);
      var left = Math.max(0, 5 - d.round);
      if (d.round >= 5 && y !== c) {
        finish(g, y > c);
        return;
      }
      // Sudden death once both have taken five.
      if (d.round >= 5 && y === c && d.you.length === d.cpu.length) {
        d.msg = 'Sudden death — drag to shoot';
      } else {
        d.msg = 'Drag to place your shot';
      }
      d.phase = 'aim';
      d.ball = null;
    }

    function finish(g, won) {
      var d = g.data;
      var y = score(d.you), c = score(d.cpu);
      if (won) {
        g.win({ emo: '⚽', title: 'You win ' + y + '–' + c, score: y * 200 + (y - c) * 100 });
      } else {
        g.gameOver({ emo: '⚽', title: 'You lose ' + y + '–' + c, score: y * 200 });
      }
    }

    return Milo.arcade(host, {
      id: 'penalty-shootout',
      w: W, h: H, bg: '#12401f',
      stats: ['You', 'CPU', 'Round'],
      emo: '⚽',
      start: {
        title: 'Penalty Shootout',
        text: 'Five penalties each, then sudden death. When you shoot, drag to pick your ' +
          'spot; when you keep, choose a side to dive. The keeper reads you better as the ' +
          'rounds go on.',
        keys: ['Drag to shoot', 'Click a third of the goal to dive']
      },
      init: reset,

      onPointer: function (g, type, x, y) {
        var d = g.data;
        if (d.phase === 'aim' && d.mode === 'shoot') {
          if (type === 'down') d.aim = { x: x, y: y };
          else if (type === 'move' && d.aim) { d.aim.x = x; d.aim.y = y; }
          else if (type === 'up' && d.aim) {
            var tx = U.clamp(d.aim.x, GOAL.x - 20, GOAL.x + GOAL.w + 20);
            var ty = U.clamp(d.aim.y, GOAL.y - 20, GOAL.y + GOAL.h);
            shoot(g, tx, ty, 1);
            d.aim = null;
          }
        } else if (d.phase === 'choose' && type === 'down') {
          var side = x < GOAL.x + GOAL.w / 3 ? 0 : x < GOAL.x + GOAL.w * 2 / 3 ? 1 : 2;
          resolveCpu(g, side);
        }
      },

      update: function (g, dt) {
        var d = g.data;
        if (d.phase === 'flying') {
          var b = d.ball;
          b.t += dt * 1.5;
          b.x = W / 2 + (b.tx - W / 2) * b.t;
          b.y = H - 90 + (b.ty - (H - 90)) * b.t;
          d.keeper.x += (d.keeper.target - d.keeper.x) * Math.min(1, dt * 5);
          d.keeper.y += (d.keeper.diveY - d.keeper.y) * Math.min(1, dt * 5);

          if (b.t >= 1) {
            var onTarget = b.tx > GOAL.x && b.tx < GOAL.x + GOAL.w &&
              b.ty > GOAL.y && b.ty < GOAL.y + GOAL.h;
            var saved = onTarget && U.dist(b.tx, b.ty, d.keeper.x, d.keeper.y) < 68;
            var scored = onTarget && !saved;
            d.you.push(scored);
            g.set('You', score(d.you));
            d.msg = !onTarget ? 'Off target!' : saved ? 'The keeper saves it!' : 'GOAL!';
            if (scored) Milo.sound.win(); else Milo.sound.hit();
            d.phase = 'result';
            d.resultT = 1.3;
          }
        } else if (d.phase === 'result') {
          d.resultT -= dt;
          if (d.resultT <= 0) {
            d.keeper = { x: W / 2, y: GOAL.y + GOAL.h - 40, dive: 0 };
            nextTurn(g);
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var pitch = c.createLinearGradient(0, 0, 0, H);
        pitch.addColorStop(0, '#1f6b3a'); pitch.addColorStop(1, '#124a26');
        c.fillStyle = pitch; c.fillRect(0, 0, W, H);
        for (var s = 0; s < 8; s++) {
          if (s % 2) continue;
          c.fillStyle = 'rgba(255,255,255,.03)';
          c.fillRect(0, s * (H / 8), W, H / 8);
        }

        // goal
        c.strokeStyle = '#fdfdff'; c.lineWidth = 8;
        c.strokeRect(GOAL.x, GOAL.y, GOAL.w, GOAL.h);
        c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1;
        for (var i = 1; i < 16; i++) {
          c.beginPath();
          c.moveTo(GOAL.x + i * (GOAL.w / 16), GOAL.y);
          c.lineTo(GOAL.x + i * (GOAL.w / 16), GOAL.y + GOAL.h);
          c.stroke();
        }
        for (var j = 1; j < 8; j++) {
          c.beginPath();
          c.moveTo(GOAL.x, GOAL.y + j * (GOAL.h / 8));
          c.lineTo(GOAL.x + GOAL.w, GOAL.y + j * (GOAL.h / 8));
          c.stroke();
        }

        if (d.phase === 'choose') {
          for (var k = 0; k < 3; k++) {
            c.fillStyle = 'rgba(34,211,238,.14)';
            c.fillRect(GOAL.x + k * (GOAL.w / 3), GOAL.y, GOAL.w / 3 - 3, GOAL.h);
          }
          c.fillStyle = 'rgba(255,255,255,.6)';
          c.font = '700 13px Outfit, sans-serif';
          c.textAlign = 'center';
          ['LEFT', 'CENTRE', 'RIGHT'].forEach(function (t, k2) {
            c.fillText(t, GOAL.x + k2 * (GOAL.w / 3) + GOAL.w / 6, GOAL.y + GOAL.h / 2);
          });
        }

        // keeper
        var kp = d.keeper;
        c.fillStyle = '#facc15';
        U.roundRect(c, kp.x - 20, kp.y - 34, 40, 60, 12); c.fill();
        c.fillStyle = '#fde68a';
        c.beginPath(); c.arc(kp.x, kp.y - 44, 12, 0, 7); c.fill();
        c.strokeStyle = '#facc15'; c.lineWidth = 9; c.lineCap = 'round';
        c.beginPath();
        c.moveTo(kp.x - 18, kp.y - 24); c.lineTo(kp.x - 46, kp.y - 46);
        c.moveTo(kp.x + 18, kp.y - 24); c.lineTo(kp.x + 46, kp.y - 46);
        c.stroke();

        if (d.aim) {
          c.strokeStyle = 'rgba(255,255,255,.5)';
          c.setLineDash([5, 7]); c.lineWidth = 2;
          c.beginPath(); c.moveTo(W / 2, H - 90); c.lineTo(d.aim.x, d.aim.y); c.stroke();
          c.setLineDash([]);
          c.strokeStyle = '#ffd257'; c.lineWidth = 3;
          c.beginPath(); c.arc(d.aim.x, d.aim.y, 16, 0, 7); c.stroke();
        }

        var bx = d.ball ? d.ball.x : W / 2, by = d.ball ? d.ball.y : H - 90;
        var br = d.ball ? 14 - d.ball.t * 5 : 14;
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(bx, by, Math.max(6, br), 0, 7); c.fill();
        c.fillStyle = '#111';
        c.beginPath(); c.arc(bx, by, Math.max(2, br * .35), 0, 7); c.fill();

        // scoreboard dots
        [['YOU', d.you, 30], ['CPU', d.cpu, 52]].forEach(function (row) {
          c.fillStyle = 'rgba(255,255,255,.65)';
          c.font = '700 12px Outfit, sans-serif';
          c.textAlign = 'left';
          c.fillText(row[0], 22, row[2] + 4);
          for (var n = 0; n < Math.max(5, row[1].length); n++) {
            var v = row[1][n];
            c.fillStyle = v === true ? '#34d399' : v === false ? '#fb7185' : 'rgba(255,255,255,.18)';
            c.beginPath(); c.arc(64 + n * 20, row[2], 7, 0, 7); c.fill();
          }
        });

        c.fillStyle = '#eaf6ec';
        c.font = '800 20px Outfit, sans-serif';
        c.textAlign = 'center';
        c.fillText(d.msg, W / 2, H - 22);
      }
    });
  }

  window.Milo.register({
    id: 'penalty-shootout', title: 'Penalty Shootout', emo: '⚽', category: 'Sports',
    tagline: 'Five each, then sudden death',
    description: 'You alternate between taking penalties and keeping them out. Taking one, ' +
      'you drag to pick a spot in the goal; keeping, you commit to diving left, centre or ' +
      'right. The opposing keeper reads your placement a little better every round, so the ' +
      'corners get more valuable as the shootout goes on.',
    controls: ['Drag to shoot', 'Click a side to dive'],
    colors: ['#1f6b3a', '#facc15'],
    tags: ['football', 'aiming', 'sports', 'vs cpu'],
    mount: mount
  });
})();
