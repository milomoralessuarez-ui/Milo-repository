/* City Idle — zone a grid, watch it grow, and keep the power and happiness up. */
(function () {
  'use strict';
  var W = 900, H = 640, CELL = 46, COLS = 13, ROWS = 9;
  var OX = 26, OY = 96, PANEL = OX + COLS * CELL + 18;

  var KINDS = {
    house: { name: 'Housing', cost: 60, emo: '🏠', color: '#5fae6a', pop: 4, power: -1, jobs: 0, happy: 0 },
    shop: { name: 'Shops', cost: 110, emo: '🏬', color: '#4a86d8', pop: 0, power: -2, jobs: 3, happy: 1 },
    factory: { name: 'Factory', cost: 190, emo: '🏭', color: '#b0762f', pop: 0, power: -3, jobs: 8, happy: -3 },
    plant: { name: 'Power', cost: 150, emo: '⚡', color: '#d8b23a', pop: 0, power: 12, jobs: 1, happy: -1 },
    park: { name: 'Park', cost: 70, emo: '🌳', color: '#3f8f52', pop: 0, power: 0, jobs: 0, happy: 4 },
    road: { name: 'Road', cost: 25, emo: '🛣️', color: '#6b7180', pop: 0, power: 0, jobs: 0, happy: 0 }
  };
  var ORDER = ['road', 'house', 'shop', 'park', 'factory', 'plant'];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    function reset(g) {
      var d = g.data;
      d.grid = [];
      for (var r = 0; r < ROWS; r++) d.grid.push(new Array(COLS).fill(null));
      d.money = 400;
      d.pop = 0;
      d.happy = 70;
      d.power = 0;
      d.demand = 0;
      d.day = 1;
      d.tick = 0;
      d.tool = 'road';
      d.hover = null;
      d.msg = 'Lay a road, then zone housing beside it.';
      d.msgT = 4;
      d.floaters = [];
      d.income = 0;
      d.blackout = 0;
      d.won = false;
      g.set('Score', 0);
      g.set('Money', '$400');
      g.set('People', 0);
      g.set('Happy', '70%');
      g.set('Day', 1);
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    function at(d, c, r) {
      if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null;
      return d.grid[r][c];
    }

    /** A building only counts if a road touches it — the road network is the whole constraint. */
    function onRoad(d, c, r) {
      return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (o) {
        var t = at(d, c + o[0], r + o[1]);
        return t && t.kind === 'road';
      });
    }

    function say(d, text) { d.msg = text; d.msgT = 3.4; }

    function floater(d, c, r, text, color) {
      d.floaters.push({ x: OX + (c + .5) * CELL, y: OY + (r + .5) * CELL, text: text, life: 1.2, c: color });
    }

    function recount(g) {
      var d = g.data;
      var pop = 0, power = 0, jobs = 0, happy = 60, connected = 0, total = 0;
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          var t = d.grid[r][c];
          if (!t || t.kind === 'road') continue;
          total++;
          var K = KINDS[t.kind];
          t.live = onRoad(d, c, r);
          if (!t.live) continue;
          connected++;
          power += K.power;
          happy += K.happy;
          if (K.pop) pop += K.pop + t.level * 2;
          jobs += K.jobs;
        }
      }
      d.power = power;
      // Brownouts, unemployment and overcrowding each bite into happiness.
      if (power < 0) happy -= Math.min(40, -power * 3);
      var unemployed = Math.max(0, pop - jobs * 2);
      happy -= Math.min(30, unemployed * 1.2);
      if (total && connected < total) happy -= (total - connected) * 2;
      d.pop = pop;
      d.jobs = jobs;
      d.unconnected = total - connected;
      d.happy = U.clamp(Math.round(happy), 0, 100);
      d.income = Math.round(pop * 1.1 + jobs * 1.6);
      g.set('People', U.fmtShort ? U.fmtShort(pop) : pop);
      g.set('Happy', d.happy + '%');
    }

    function place(g, c, r) {
      var d = g.data;
      var K = KINDS[d.tool];
      var existing = at(d, c, r);
      if (existing) {
        // Clicking what is already there sells it back at half price.
        d.money += Math.round(KINDS[existing.kind].cost * .5);
        d.grid[r][c] = null;
        floater(d, c, r, '+$' + Math.round(KINDS[existing.kind].cost * .5), '#8ef0a8');
        say(d, 'Demolished the ' + KINDS[existing.kind].name.toLowerCase());
        Milo.sound.click();
        recount(g);
        g.set('Money', '$' + U.fmt(Math.round(d.money)));
        return;
      }
      if (d.money < K.cost) { say(d, 'Not enough money for ' + K.name.toLowerCase()); Milo.sound.tone({ f: 130, d: .1, v: .05, type: 'square' }); return; }
      d.money -= K.cost;
      d.grid[r][c] = { kind: d.tool, level: 0, age: 0 };
      floater(d, c, r, '-$' + K.cost, '#ff9aa8');
      Milo.sound.blip();
      recount(g);
      if (d.tool !== 'road' && !onRoad(d, c, r)) say(d, 'No road connection — it will sit empty');
      g.set('Money', '$' + U.fmt(Math.round(d.money)));
    }

    return Milo.arcade(host, {
      id: 'city-idle',
      w: W, h: H, bg: '#16202c',
      stats: ['Score', 'Money', 'People', 'Happy', 'Day', 'Best'],
      emo: '🏙️',
      trackBest: true,
      autoStart: false,
      start: {
        title: 'City Idle',
        text: 'Zone a small city. Roads connect everything, housing brings people, shops and ' +
          'factories give them work, power keeps the lights on and parks keep them happy.',
        keys: ['Click the palette, then click the map', 'Click a tile again to sell it back', '1–6 to switch tool']
      },
      init: reset,

      onKey: function (g, e) {
        if (g.state !== 'play') return;
        var d = g.data;
        var m = /^Digit([1-6])$/.exec(e.code);
        if (m) { d.tool = ORDER[+m[1] - 1]; Milo.sound.click(); }
      },

      onPointer: function (g, type, px, py) {
        if (g.state !== 'play') return;
        var d = g.data;
        if (type === 'move') {
          var hc = Math.floor((px - OX) / CELL), hr = Math.floor((py - OY) / CELL);
          d.hover = (hc >= 0 && hc < COLS && hr >= 0 && hr < ROWS) ? { c: hc, r: hr } : null;
          return;
        }
        if (type !== 'down') return;

        // Palette first, so a click on a button never also drops a building.
        for (var i = 0; i < ORDER.length; i++) {
          var by = OY + i * 58;
          if (px >= PANEL && px <= PANEL + 160 && py >= by && py <= by + 50) {
            d.tool = ORDER[i];
            Milo.sound.click();
            return;
          }
        }
        var c = Math.floor((px - OX) / CELL), r = Math.floor((py - OY) / CELL);
        if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return;
        place(g, c, r);
      },

      update: function (g, dt) {
        var d = g.data;
        var i;

        if (d.msgT > 0) d.msgT -= dt;
        for (i = d.floaters.length - 1; i >= 0; i--) {
          d.floaters[i].y -= 26 * dt;
          d.floaters[i].life -= dt;
          if (d.floaters[i].life <= 0) d.floaters.splice(i, 1);
        }

        d.tick += dt;
        if (d.tick < 1.5) return;
        d.tick = 0;
        d.day++;
        g.set('Day', d.day);

        // A day's takings, scaled by how happy the city is with you.
        var earned = Math.round(d.income * (.4 + d.happy / 100));
        d.money += earned;
        g.set('Money', '$' + U.fmt(Math.round(d.money)));
        g.score = Math.round(d.pop * 12 + d.day * 4 + d.money * .2);
        g.set('Score', g.score);

        // Well-served buildings upgrade themselves, which is the idle part.
        if (d.happy > 62) {
          for (var r = 0; r < ROWS; r++) {
            for (var c = 0; c < COLS; c++) {
              var t = d.grid[r][c];
              if (!t || t.kind === 'road' || !t.live) continue;
              t.age += 1;
              if (t.age > 6 + t.level * 5 && t.level < 3 && Math.random() < .3) {
                t.level++;
                t.age = 0;
                floater(d, c, r, 'Level ' + (t.level + 1), '#ffe08a');
              }
            }
          }
          recount(g);
        }

        if (d.power < 0) {
          d.blackout += 1;
          if (d.blackout === 1) say(d, 'Brownout! Build a power plant.');
        } else { d.blackout = 0; }

        if (d.happy <= 12) {
          g.gameOver({
            emo: '🏙️', title: 'The council voted you out',
            text: 'Happiness bottomed out on day ' + d.day + ' with ' + d.pop + ' residents.',
            score: g.score
          });
          return;
        }

        if (!d.won && d.pop >= 120 && d.happy >= 70) {
          d.won = true;
          say(d, 'A thriving city — keep going for a higher score!');
          g.score += 2500;
          g.set('Score', g.score);
          Milo.sound.win();
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var bg = c.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#1e2b3a'); bg.addColorStop(1, '#101822');
        c.fillStyle = bg; c.fillRect(0, 0, W, H);

        c.textAlign = 'center';
        c.textBaseline = 'middle';

        for (var r = 0; r < ROWS; r++) {
          for (var cc = 0; cc < COLS; cc++) {
            var x = OX + cc * CELL, y = OY + r * CELL;
            var t = d.grid[r][cc];
            c.fillStyle = (cc + r) % 2 ? '#243141' : '#212d3c';
            c.fillRect(x, y, CELL, CELL);
            c.strokeStyle = 'rgba(255,255,255,.04)';
            c.lineWidth = 1;
            c.strokeRect(x + .5, y + .5, CELL - 1, CELL - 1);

            if (!t) continue;
            var K = KINDS[t.kind];
            if (t.kind === 'road') {
              c.fillStyle = K.color;
              c.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
              c.strokeStyle = 'rgba(255,255,255,.35)';
              c.setLineDash([5, 5]);
              c.lineWidth = 2;
              c.beginPath();
              // Draw the centre line along whichever way the road runs.
              var horiz = (at(d, cc - 1, r) && at(d, cc - 1, r).kind === 'road') ||
                (at(d, cc + 1, r) && at(d, cc + 1, r).kind === 'road');
              if (horiz) { c.moveTo(x + 3, y + CELL / 2); c.lineTo(x + CELL - 3, y + CELL / 2); }
              else { c.moveTo(x + CELL / 2, y + 3); c.lineTo(x + CELL / 2, y + CELL - 3); }
              c.stroke();
              c.setLineDash([]);
              continue;
            }

            var h = 8 + t.level * 7;
            c.fillStyle = t.live ? K.color : U.shade(K.color, -45);
            U.roundRect(c, x + 4, y + CELL - 6 - h - 12, CELL - 8, h + 12, 4); c.fill();
            c.fillStyle = 'rgba(255,255,255,.13)';
            c.fillRect(x + 6, y + CELL - 6 - h - 10, CELL - 12, 3);
            c.font = '17px serif';
            c.fillText(K.emo, x + CELL / 2, y + CELL - 6 - (h + 12) / 2);

            if (!t.live) {
              c.fillStyle = 'rgba(255,120,120,.85)';
              c.font = '600 10px Outfit, sans-serif';
              c.fillText('no road', x + CELL / 2, y + 10);
            } else if (t.level > 0) {
              for (var k = 0; k <= t.level; k++) {
                c.fillStyle = '#ffe08a';
                c.beginPath(); c.arc(x + 9 + k * 7, y + 9, 2.4, 0, Math.PI * 2); c.fill();
              }
            }
          }
        }

        if (d.hover) {
          var hx = OX + d.hover.c * CELL, hy = OY + d.hover.r * CELL;
          var K2 = KINDS[d.tool];
          var affordable = d.money >= K2.cost || at(d, d.hover.c, d.hover.r);
          c.strokeStyle = affordable ? '#ffe08a' : '#e0553f';
          c.lineWidth = 2.5;
          U.roundRect(c, hx + 1, hy + 1, CELL - 2, CELL - 2, 4); c.stroke();
        }

        // --- palette ------------------------------------------------------------
        ORDER.forEach(function (kind, i) {
          var K = KINDS[kind], by = OY + i * 58;
          var sel = d.tool === kind;
          c.fillStyle = sel ? U.shade(K.color, -18) : '#243141';
          U.roundRect(c, PANEL, by, 160, 50, 9); c.fill();
          c.strokeStyle = sel ? '#ffe08a' : 'rgba(255,255,255,.1)';
          c.lineWidth = sel ? 2.5 : 1.5;
          U.roundRect(c, PANEL, by, 160, 50, 9); c.stroke();
          c.font = '20px serif';
          c.textAlign = 'left';
          c.fillText(K.emo, PANEL + 14, by + 25);
          c.fillStyle = '#f2f5ff';
          c.font = '600 14px Outfit, sans-serif';
          c.fillText(K.name, PANEL + 42, by + 19);
          c.fillStyle = d.money >= K.cost ? 'rgba(255,255,255,.6)' : '#ff9aa8';
          c.font = '600 12px Outfit, sans-serif';
          c.fillText('$' + K.cost + '  ·  ' + (i + 1), PANEL + 42, by + 36);
          c.textAlign = 'center';
        });

        // --- power and happiness gauges -------------------------------------------
        var gy = OY + ORDER.length * 58 + 10;
        c.textAlign = 'left';
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.font = '600 12px Outfit, sans-serif';
        c.fillText('POWER', PANEL, gy + 8);
        c.fillStyle = 'rgba(255,255,255,.14)';
        U.roundRect(c, PANEL, gy + 14, 160, 9, 4); c.fill();
        var pw = U.clamp((d.power + 12) / 24, 0, 1);
        c.fillStyle = d.power < 0 ? '#e0553f' : '#d8b23a';
        U.roundRect(c, PANEL, gy + 14, 160 * pw, 9, 4); c.fill();

        c.fillStyle = 'rgba(255,255,255,.55)';
        c.fillText('HAPPINESS', PANEL, gy + 44);
        c.fillStyle = 'rgba(255,255,255,.14)';
        U.roundRect(c, PANEL, gy + 50, 160, 9, 4); c.fill();
        c.fillStyle = d.happy < 30 ? '#e0553f' : d.happy < 60 ? '#e8a44a' : '#5fae6a';
        U.roundRect(c, PANEL, gy + 50, 160 * (d.happy / 100), 9, 4); c.fill();

        c.fillStyle = 'rgba(255,255,255,.5)';
        c.font = '600 12px Outfit, sans-serif';
        c.fillText('Jobs ' + (d.jobs || 0) + '  ·  Income $' + (d.income || 0) + '/day', PANEL, gy + 82);
        if (d.unconnected) {
          c.fillStyle = '#ff9aa8';
          c.fillText(d.unconnected + ' building' + (d.unconnected === 1 ? '' : 's') + ' off the road', PANEL, gy + 100);
        }

        d.floaters.forEach(function (f) {
          c.globalAlpha = Math.min(1, f.life);
          c.fillStyle = f.c;
          c.font = '600 13px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(f.text, f.x, f.y);
          c.globalAlpha = 1;
        });

        if (d.msgT > 0) {
          c.globalAlpha = Math.min(1, d.msgT);
          c.fillStyle = 'rgba(0,0,0,.55)';
          U.roundRect(c, OX, H - 46, COLS * CELL, 30, 8); c.fill();
          c.fillStyle = '#ffe4a8';
          c.font = '600 14px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText(d.msg, OX + COLS * CELL / 2, H - 30);
          c.globalAlpha = 1;
        }
        c.textBaseline = 'alphabetic';
      }
    });
  }

  window.Milo.register({
    id: 'city-idle', title: 'City Idle', emo: '🏙️', category: 'Strategy',
    tagline: 'Zone it, wire it, watch it grow',
    description: 'A small city on a small grid, where nothing works unless it touches a road. ' +
      'Housing brings residents, shops and factories give them jobs, and a power plant keeps ' +
      'the whole thing lit — run short of any of the three and happiness starts sliding. ' +
      'Factories pay best and are the most miserable to live near, so parks are how you buy ' +
      'that back. Keep people happy and your buildings upgrade themselves over time, which is ' +
      'when the money really starts arriving.',
    controls: ['Click a tool, then click the map', 'Click a tile again to sell it back', 'Keys 1–6 switch tool'],
    colors: ['#1e2b3a', '#5fae6a'],
    tags: ['idle', 'building', 'management', 'strategy'],
    mount: mount
  });
})();
