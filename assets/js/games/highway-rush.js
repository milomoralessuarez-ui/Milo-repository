/* Highway Rush — weave through traffic at speed; near misses pay. */
(function () {
  'use strict';
  var W = 520, H = 720;
  var LANES = 5, LANE_W = 82;
  var ROAD_L = (W - LANES * LANE_W) / 2;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function laneX(i) { return ROAD_L + i * LANE_W + LANE_W / 2; }

    function reset(g) {
      var d = g.data;
      d.lane = 2;
      d.x = laneX(2);
      d.y = H - 130;
      d.speed = 300;
      d.traffic = [];
      d.marks = [];
      d.parts = [];
      d.dist = 0;
      d.near = 0;
      d.next = 60;
      for (var i = 0; i < 12; i++) d.marks.push({ y: i * 70 });
      g.set('Score', 0);
      g.set('Near miss', 0);
      g.set('Speed', 0);
    }

    return Milo.arcade(host, {
      id: 'highway-rush',
      w: W, h: H, bg: '#101426',
      stats: ['Score', 'Near miss', 'Speed'],
      touch: 'dpad',
      emo: '🚗',
      start: {
        title: 'Highway Rush',
        text: 'Five lanes, no brakes worth using. Slip past traffic as close as you ' +
          'dare — near misses are worth 50 points each.',
        keys: ['← → change lane', 'Tap left/right']
      },
      init: reset,
      onPointer: function (g, type, x) {
        if (type !== 'down') return;
        moveLane(g, x < W / 2 ? -1 : 1);
      },

      update: function (g, dt) {
        var d = g.data;
        if (g.input.pressed('left')) moveLane(g, -1);
        if (g.input.pressed('right')) moveLane(g, 1);

        d.speed = Math.min(760, 300 + d.dist * 0.02);
        d.dist += d.speed * dt;
        g.score = Math.floor(d.dist / 8) + d.near * 50;
        g.set('Score', U.fmt(g.score));
        g.set('Speed', Math.round(d.speed * .32));

        d.x += (laneX(d.lane) - d.x) * Math.min(1, dt * 12);

        d.marks.forEach(function (m) {
          m.y += d.speed * dt;
          if (m.y > H + 40) m.y -= 12 * 70;
        });

        d.next -= d.speed * dt;
        if (d.next <= 0) {
          d.next = U.rand(210, 380) - Math.min(120, d.dist / 400);
          // Leave at least one lane open so the wall is always passable.
          var blocked = U.shuffle([0, 1, 2, 3, 4]).slice(0, U.randInt(1, 3));
          blocked.forEach(function (ln) {
            d.traffic.push({
              lane: ln, x: laneX(ln), y: -90,
              v: U.rand(90, 190),
              col: U.choice(['#fb7185', '#ffd257', '#a78bfa', '#34d399', '#60a5fa']),
              scored: false
            });
          });
        }

        var px = d.x, py = d.y;
        for (var i = d.traffic.length - 1; i >= 0; i--) {
          var t = d.traffic[i];
          t.y += (d.speed - t.v) * dt;
          if (t.y > H + 120) { d.traffic.splice(i, 1); continue; }

          var dx = Math.abs(t.x - px), dy = Math.abs(t.y - py);
          if (dx < 46 && dy < 74) {
            Milo.sound.explode();
            for (var b = 0; b < 26; b++) {
              var a = Math.random() * 6.28, s = U.rand(60, 300);
              d.parts.push({ x: px, y: py, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: U.rand(.3, .8), max: .8, col: U.choice(['#fff', '#ffd257', '#fb7185']) });
            }
            g.gameOver({ text: U.fmt(Math.floor(d.dist / 8)) + ' m driven, ' + d.near + ' near misses.' });
            return;
          }
          if (!t.scored && t.y > py + 40) {
            t.scored = true;
            if (dx < 96) {
              d.near++;
              g.set('Near miss', d.near);
              Milo.sound.tone({ f: 800, f2: 1200, d: .09, v: .07, type: 'square' });
            }
          }
        }

        d.parts = d.parts.filter(function (p) {
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt;
          return p.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        c.fillStyle = '#0c1020'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#1c2138';
        c.fillRect(ROAD_L, 0, LANES * LANE_W, H);
        c.fillStyle = '#2a3050';
        c.fillRect(ROAD_L - 10, 0, 10, H);
        c.fillRect(ROAD_L + LANES * LANE_W, 0, 10, H);

        c.fillStyle = 'rgba(255,255,255,.25)';
        d.marks.forEach(function (m) {
          for (var l = 1; l < LANES; l++) {
            c.fillRect(ROAD_L + l * LANE_W - 2, m.y, 4, 34);
          }
        });

        function car(x, y, col, isPlayer) {
          c.save();
          c.translate(x, y);
          c.fillStyle = 'rgba(0,0,0,.4)';
          U.roundRect(c, -22, -36, 44, 74, 9); c.fill();
          if (isPlayer) { c.shadowColor = col; c.shadowBlur = 18; }
          c.fillStyle = col;
          U.roundRect(c, -24, -38, 48, 76, 10); c.fill();
          c.shadowBlur = 0;
          c.fillStyle = 'rgba(10,14,32,.72)';
          U.roundRect(c, -17, -26, 34, 20, 5); c.fill();
          U.roundRect(c, -17, 8, 34, 18, 5); c.fill();
          c.fillStyle = isPlayer ? '#fff' : 'rgba(255,255,255,.55)';
          c.fillRect(-20, -40, 9, 5); c.fillRect(11, -40, 9, 5);
          c.restore();
        }

        d.traffic.forEach(function (t) { car(t.x, t.y, t.col, false); });
        car(d.x, d.y, '#22d3ee', true);

        d.parts.forEach(function (p) {
          c.globalAlpha = Math.max(0, p.life / p.max);
          c.fillStyle = p.col;
          c.fillRect(p.x - 3, p.y - 3, 6, 6);
        });
        c.globalAlpha = 1;
      }
    });

    function moveLane(g, dir) {
      var d = g.data;
      var next = U.clamp(d.lane + dir, 0, LANES - 1);
      if (next === d.lane) return;
      d.lane = next;
      Milo.sound.click();
    }
  }

  window.Milo.register({
    id: 'highway-rush', title: 'Highway Rush', emo: '🚗', category: 'Racing',
    tagline: 'Weave through endless traffic',
    description: 'Five lanes of traffic and a car that only gets faster. Change lanes ' +
      'to slip through the gaps — passing close to another car counts as a near miss and ' +
      'pays 50 points, so the greedy line is also the risky one.',
    controls: ['← →', 'Tap left/right'],
    colors: ['#22d3ee', '#f59e0b'],
    tags: ['driving', 'endless', 'reflex', 'traffic'],
    mount: mount
  });
})();
