/* Zombie Siege — top-down farmhouse defence: shoot the horde, board the windows. */
(function () {
  'use strict';
  var W = 800, H = 600;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    var HOUSE = { x: 330, y: 250, w: 140, h: 100 };
    var WINDOWS = [
      { x: HOUSE.x + HOUSE.w / 2, y: HOUSE.y },              // north
      { x: HOUSE.x + HOUSE.w / 2, y: HOUSE.y + HOUSE.h },    // south
      { x: HOUSE.x, y: HOUSE.y + HOUSE.h / 2 },              // west
      { x: HOUSE.x + HOUSE.w, y: HOUSE.y + HOUSE.h / 2 }     // east
    ];

    function reset(g) {
      var d = g.data;
      d.p = { x: W / 2, y: H - 120, r: 13, hp: 100, inv: 0, cool: 0 };
      d.aim = { x: W / 2, y: 0 };
      d.ammo = 60;
      d.boards = 2;
      d.houseHp = 100;
      d.wins = WINDOWS.map(function (w) { return { x: w.x, y: w.y, boards: 3, max: 4, chewT: 0 }; });
      d.zombies = [];
      d.wave = 0;
      d.phase = 'build';
      d.phaseT = 4;
      d.spawnLeft = 0;
      d.spawnT = 0;
      d.drops = [];
      d.blood = [];
      d.parts = [];
      d.tracers = [];
      d.shake = 0;
      d.firing = false;
      d.repairT = 0;
      d.grass = [];
      for (var i = 0; i < 70; i++) {
        d.grass.push({ x: Math.random() * W, y: Math.random() * H, r: U.rand(8, 26), a: U.rand(.03, .08) });
      }
      g.set('Score', 0);
      g.set('Wave', 1);
      g.set('HP', 100);
      g.set('Ammo', 60);
    }

    function edgeSpawn() {
      var s = (Math.random() * 4) | 0;
      if (s === 0) return { x: Math.random() * W, y: -24 };
      if (s === 1) return { x: Math.random() * W, y: H + 24 };
      if (s === 2) return { x: -24, y: Math.random() * H };
      return { x: W + 24, y: Math.random() * H };
    }

    function startWave(g) {
      var d = g.data;
      d.wave++;
      g.set('Wave', d.wave);
      d.phase = 'fight';
      d.spawnLeft = 6 + d.wave * 3;
      d.spawnT = .5;
      Milo.sound.tone({ f: 90, f2: 55, d: .6, v: .14, type: 'sawtooth' });
    }

    function spawnZombie(d) {
      var p = edgeSpawn();
      var brute = d.wave >= 3 && Math.random() < .18;
      d.zombies.push({
        x: p.x, y: p.y,
        r: brute ? 20 : 13,
        hp: (brute ? 6 : 2) + Math.floor(d.wave / 3),
        sp: (brute ? 30 : 44) + d.wave * 3 + U.rand(-6, 10),
        brute: brute,
        likes: Math.random() < .5 ? 'house' : 'player',
        bite: 0, t: Math.random() * 6
      });
    }

    function nearestZombie(d, x, y) {
      var best = null, bd = 1e9;
      for (var i = 0; i < d.zombies.length; i++) {
        var dd = U.dist(x, y, d.zombies[i].x, d.zombies[i].y);
        if (dd < bd) { bd = dd; best = d.zombies[i]; }
      }
      return best;
    }

    function splat(d, x, y, big) {
      d.blood.push({ x: x + U.rand(-6, 6), y: y + U.rand(-6, 6), r: U.rand(4, big ? 14 : 9), a: U.rand(.25, .5), rot: Math.random() * 3.14 });
      if (d.blood.length > 90) d.blood.shift();
      for (var i = 0; i < (big ? 10 : 5); i++) {
        var a = Math.random() * 6.28, s = U.rand(30, 160);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .4, max: .4, col: '#8c1626', sz: 3 });
      }
    }

    function fire(g) {
      var d = g.data, p = d.p;
      if (p.cool > 0) return;
      p.cool = .14;
      if (d.ammo <= 0) {
        Milo.sound.tone({ f: 240, f2: 200, d: .04, v: .05, type: 'square' });
        return;
      }
      d.ammo--;
      g.set('Ammo', d.ammo);
      var ang = Math.atan2(d.aim.y - p.y, d.aim.x - p.x);
      // hitscan: walk the ray, first zombie inside 26px of it takes the hit
      var hit = null, hd = 0, range = 400;
      for (var t = 12; t < range; t += 8) {
        var rx = p.x + Math.cos(ang) * t, ry = p.y + Math.sin(ang) * t;
        for (var i = 0; i < d.zombies.length; i++) {
          var z = d.zombies[i];
          if (U.dist(rx, ry, z.x, z.y) < z.r + 3) { hit = z; hd = t; break; }
        }
        if (hit) break;
        // shots do not pass through the farmhouse
        if (rx > HOUSE.x && rx < HOUSE.x + HOUSE.w && ry > HOUSE.y && ry < HOUSE.y + HOUSE.h) { hd = t; break; }
      }
      var end = hd || range;
      d.tracers.push({ x1: p.x + Math.cos(ang) * 14, y1: p.y + Math.sin(ang) * 14, x2: p.x + Math.cos(ang) * end, y2: p.y + Math.sin(ang) * end, life: .07 });
      d.parts.push({ x: p.x + Math.cos(ang) * 18, y: p.y + Math.sin(ang) * 18, vx: 0, vy: 0, life: .05, max: .05, col: '#ffd257', sz: 7 });
      Milo.sound.tone({ f: 750, f2: 260, d: .06, v: .07, type: 'square' });
      if (hit) {
        hit.hp--;
        splat(g.data, hit.x, hit.y, false);
        if (hit.hp <= 0) killZombie(g, hit);
        else Milo.sound.hit();
      }
    }

    function killZombie(g, z) {
      var d = g.data;
      var i = d.zombies.indexOf(z);
      if (i >= 0) d.zombies.splice(i, 1);
      splat(d, z.x, z.y, true);
      g.score += z.brute ? 25 : 10;
      g.set('Score', U.fmt(g.score));
      d.shake = Math.max(d.shake, .25);
      Milo.sound.tone({ f: 160, f2: 50, d: .2, v: .12, type: 'sawtooth' });
      if (Math.random() < .28 || d.ammo < 8) {
        d.drops.push({ x: z.x, y: z.y, kind: Math.random() < .25 ? 'med' : 'ammo', t: 12 });
      }
    }

    return Milo.arcade(host, {
      id: 'zombie-siege',
      w: W, h: H, bg: '#0b1410',
      stats: ['Score', 'Wave', 'HP', 'Ammo'],
      emo: '🧟',
      touch: 'dpad',
      touchButtons: [{ key: 'action', label: 'FIRE' }],
      start: {
        title: 'Zombie Siege',
        text: 'The horde wants you AND the farmhouse. Shoot with the mouse, scavenge ' +
          'ammo, and between waves stand by a broken window to hammer boards over it.',
        keys: ['WASD move', 'Mouse aim + fire', 'Space fires too']
      },
      init: reset,
      onPointer: function (g, type, x, y) {
        var d = g.data;
        d.aim.x = x; d.aim.y = y;
        if (type === 'down') d.firing = true;
        if (type === 'up') d.firing = false;
      },

      update: function (g, dt) {
        var d = g.data, p = d.p, i = g.input;

        var ax = i.axis();
        p.x = U.clamp(p.x + ax.x * 230 * dt, 14, W - 14);
        p.y = U.clamp(p.y + ax.y * 230 * dt, 14, H - 14);
        // keep the farmer out of the house walls
        if (p.x > HOUSE.x - p.r && p.x < HOUSE.x + HOUSE.w + p.r &&
          p.y > HOUSE.y - p.r && p.y < HOUSE.y + HOUSE.h + p.r) {
          var dl = p.x - (HOUSE.x - p.r), dr = (HOUSE.x + HOUSE.w + p.r) - p.x;
          var dtp = p.y - (HOUSE.y - p.r), db = (HOUSE.y + HOUSE.h + p.r) - p.y;
          var m = Math.min(dl, dr, dtp, db);
          if (m === dl) p.x = HOUSE.x - p.r;
          else if (m === dr) p.x = HOUSE.x + HOUSE.w + p.r;
          else if (m === dtp) p.y = HOUSE.y - p.r;
          else p.y = HOUSE.y + HOUSE.h + p.r;
        }

        p.cool -= dt;
        p.inv = Math.max(0, p.inv - dt);
        d.shake = Math.max(0, d.shake - dt * 3);

        if (i.down('action')) {
          var nz = nearestZombie(d, p.x, p.y);
          if (nz) { d.aim.x = nz.x; d.aim.y = nz.y; }
          fire(g);
        } else if (d.firing) fire(g);

        /* ---- phases ---- */
        if (d.phase === 'build') {
          d.phaseT -= dt;
          // hammer boards onto a nearby damaged window
          d.repairT -= dt;
          if (d.boards > 0 && d.repairT <= 0) {
            for (var wi = 0; wi < d.wins.length; wi++) {
              var wn = d.wins[wi];
              if (wn.boards < wn.max && U.dist(p.x, p.y, wn.x, wn.y) < 48) {
                wn.boards++;
                d.boards--;
                d.repairT = .55;
                Milo.sound.tone({ f: 220, f2: 170, d: .07, v: .1, type: 'square' });
                for (var s = 0; s < 5; s++) {
                  d.parts.push({ x: wn.x, y: wn.y, vx: U.rand(-60, 60), vy: U.rand(-80, -20), life: .35, max: .35, col: '#c8a36a', sz: 3 });
                }
                break;
              }
            }
          }
          if (d.phaseT <= 0) startWave(g);
        } else {
          if (d.spawnLeft > 0) {
            d.spawnT -= dt;
            if (d.spawnT <= 0) {
              d.spawnT = Math.max(.28, 1.3 - d.wave * .07);
              d.spawnLeft--;
              spawnZombie(d);
            }
          } else if (!d.zombies.length) {
            g.score += 50 + d.wave * 10;
            g.set('Score', U.fmt(g.score));
            d.phase = 'build';
            d.phaseT = 8;
            d.boards += 3 + Math.floor(d.wave / 2);
            d.repairT = 0;
            d.drops.push({ x: U.rand(80, W - 80), y: U.rand(80, H - 80), kind: 'ammo', t: 10 });
            Milo.sound.coin();
          }
        }

        /* ---- zombies ---- */
        for (var k = d.zombies.length - 1; k >= 0; k--) {
          var z = d.zombies[k];
          z.t += dt;
          z.bite -= dt;
          var tx, ty, targ = z.likes;
          if (U.dist(z.x, z.y, p.x, p.y) < 150) targ = 'player';
          if (targ === 'player') { tx = p.x; ty = p.y; }
          else {
            var bw = null, bd = 1e9;
            for (var wj = 0; wj < d.wins.length; wj++) {
              var dd = U.dist(z.x, z.y, d.wins[wj].x, d.wins[wj].y);
              if (dd < bd) { bd = dd; bw = d.wins[wj]; }
            }
            tx = bw.x; ty = bw.y;
            if (bd < 26) {
              // chew through the boards, then the house itself
              z.chewing = true;
              bw.chewT += dt;
              if (bw.chewT > 1.1) {
                bw.chewT = 0;
                if (bw.boards > 0) {
                  bw.boards--;
                  Milo.sound.tone({ f: 130, f2: 80, d: .12, v: .1, type: 'sawtooth' });
                } else {
                  d.houseHp -= z.brute ? 9 : 5;
                  d.shake = Math.max(d.shake, .4);
                  Milo.sound.hit();
                  if (d.houseHp <= 0) {
                    g.gameOver({ emo: '🏚️', title: 'The Farmhouse Fell', text: 'The horde broke in on wave ' + d.wave + '.' });
                    return;
                  }
                }
              }
              continue;
            }
          }
          var za = Math.atan2(ty - z.y, tx - z.x);
          z.x += Math.cos(za) * z.sp * dt;
          z.y += Math.sin(za) * z.sp * dt;
          // light separation so the horde doesn't stack into one blob
          for (var o = 0; o < d.zombies.length; o++) {
            var oz = d.zombies[o];
            if (oz === z) continue;
            var sd = U.dist(z.x, z.y, oz.x, oz.y);
            if (sd < z.r + oz.r && sd > 0) {
              z.x += (z.x - oz.x) / sd * 30 * dt;
              z.y += (z.y - oz.y) / sd * 30 * dt;
            }
          }
          if (z.bite <= 0 && U.dist(z.x, z.y, p.x, p.y) < z.r + p.r + 3 && p.inv <= 0) {
            z.bite = .9;
            p.hp -= z.brute ? 16 : 8;
            p.inv = .5;
            d.shake = Math.max(d.shake, .6);
            g.set('HP', Math.max(0, p.hp));
            splat(d, p.x, p.y, false);
            Milo.sound.hit();
            if (p.hp <= 0) {
              g.gameOver({ text: 'Eaten on wave ' + d.wave + '. The farm is quiet again.' });
              return;
            }
          }
        }

        /* ---- drops ---- */
        d.drops = d.drops.filter(function (dr) {
          dr.t -= dt;
          if (dr.t <= 0) return false;
          if (U.dist(p.x, p.y, dr.x, dr.y) < 24) {
            if (dr.kind === 'ammo') { d.ammo += 24; g.set('Ammo', d.ammo); }
            else { p.hp = Math.min(100, p.hp + 25); g.set('HP', p.hp); }
            Milo.sound.powerup();
            return false;
          }
          return true;
        });

        d.tracers = d.tracers.filter(function (tr) { tr.life -= dt; return tr.life > 0; });
        d.parts = d.parts.filter(function (q) {
          q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
          return q.life > 0;
        });
      },

      draw: function (g) {
        var c = g.ctx, d = g.data, p = d.p;
        c.fillStyle = '#0b1410'; c.fillRect(0, 0, W, H);
        c.save();
        if (d.shake > 0) c.translate(U.rand(-1, 1) * d.shake * 5, U.rand(-1, 1) * d.shake * 5);

        // mottled night grass
        d.grass.forEach(function (gr) {
          c.globalAlpha = gr.a;
          c.fillStyle = '#2c4a2c';
          c.beginPath(); c.ellipse(gr.x, gr.y, gr.r, gr.r * .6, 0, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        // moon
        c.fillStyle = 'rgba(220,230,255,.12)';
        c.beginPath(); c.arc(W - 90, 70, 46, 0, 7); c.fill();
        c.fillStyle = '#dfe6f5';
        c.beginPath(); c.arc(W - 90, 70, 26, 0, 7); c.fill();
        c.fillStyle = '#c3ccdf';
        c.beginPath(); c.arc(W - 98, 64, 5, 0, 7); c.arc(W - 82, 76, 4, 0, 7); c.fill();

        // blood
        d.blood.forEach(function (b) {
          c.globalAlpha = b.a;
          c.fillStyle = '#6d0f1e';
          c.beginPath(); c.ellipse(b.x, b.y, b.r, b.r * .65, b.rot, 0, 7); c.fill();
        });
        c.globalAlpha = 1;

        // lantern glow around player
        var lg = c.createRadialGradient(p.x, p.y, 10, p.x, p.y, 130);
        lg.addColorStop(0, 'rgba(255,208,120,.16)');
        lg.addColorStop(1, 'rgba(255,208,120,0)');
        c.fillStyle = lg;
        c.beginPath(); c.arc(p.x, p.y, 130, 0, 7); c.fill();

        // farmhouse
        c.fillStyle = '#4a3320';
        c.fillRect(HOUSE.x - 4, HOUSE.y - 4, HOUSE.w + 8, HOUSE.h + 8);
        c.fillStyle = '#6b4a2a';
        c.fillRect(HOUSE.x, HOUSE.y, HOUSE.w, HOUSE.h);
        c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1;
        for (var ln = 1; ln < 5; ln++) {
          c.beginPath(); c.moveTo(HOUSE.x, HOUSE.y + ln * HOUSE.h / 5); c.lineTo(HOUSE.x + HOUSE.w, HOUSE.y + ln * HOUSE.h / 5); c.stroke();
        }
        c.fillStyle = '#8a6a3a';
        c.fillRect(HOUSE.x + HOUSE.w / 2 - 16, HOUSE.y + HOUSE.h / 2 - 12, 32, 24);
        // house hp bar
        c.fillStyle = 'rgba(0,0,0,.4)';
        c.fillRect(HOUSE.x, HOUSE.y - 14, HOUSE.w, 6);
        c.fillStyle = d.houseHp > 40 ? '#8ac25a' : '#e05252';
        c.fillRect(HOUSE.x, HOUSE.y - 14, HOUSE.w * Math.max(0, d.houseHp) / 100, 6);

        // windows + boards
        d.wins.forEach(function (wn) {
          c.fillStyle = '#151a24';
          c.fillRect(wn.x - 16, wn.y - 8, 32, 16);
          c.strokeStyle = '#c8a36a'; c.lineWidth = 3.4; c.lineCap = 'round';
          for (var b = 0; b < wn.boards; b++) {
            var yy = wn.y - 7 + b * 4.6;
            c.beginPath(); c.moveTo(wn.x - 17, yy + (b % 2 ? 2 : 0)); c.lineTo(wn.x + 17, yy + (b % 2 ? 0 : 2)); c.stroke();
          }
          if (d.phase === 'build' && wn.boards < wn.max) {
            c.fillStyle = 'rgba(255,210,87,' + (0.5 + 0.4 * Math.sin(g.t * 6)) + ')';
            c.font = '800 13px Outfit, sans-serif'; c.textAlign = 'center';
            c.fillText('🔨', wn.x, wn.y - 14);
          }
        });

        // drops
        d.drops.forEach(function (dr) {
          var blink = dr.t < 3 && Math.floor(g.t * 6) % 2 === 0;
          if (blink) return;
          c.fillStyle = dr.kind === 'ammo' ? '#caa64a' : '#e05252';
          U.roundRect(c, dr.x - 10, dr.y - 8, 20, 16, 3); c.fill();
          c.fillStyle = '#141210';
          c.font = '800 10px Outfit, sans-serif'; c.textAlign = 'center';
          c.fillText(dr.kind === 'ammo' ? 'AMMO' : '✚', dr.x, dr.y + 3.6);
        });

        // zombies
        d.zombies.forEach(function (z) {
          var wob = Math.sin(z.t * 7) * .25;
          c.fillStyle = z.brute ? '#40632c' : '#6f9c40';
          // flailing arms
          c.strokeStyle = c.fillStyle; c.lineWidth = z.brute ? 7 : 5; c.lineCap = 'round';
          var aa = Math.atan2(p.y - z.y, p.x - z.x);
          c.beginPath();
          c.moveTo(z.x, z.y);
          c.lineTo(z.x + Math.cos(aa + .5 + wob) * (z.r + 8), z.y + Math.sin(aa + .5 + wob) * (z.r + 8));
          c.moveTo(z.x, z.y);
          c.lineTo(z.x + Math.cos(aa - .5 - wob) * (z.r + 8), z.y + Math.sin(aa - .5 - wob) * (z.r + 8));
          c.stroke();
          c.beginPath(); c.arc(z.x, z.y, z.r, 0, 7); c.fill();
          c.fillStyle = 'rgba(0,0,0,.35)';
          c.beginPath(); c.arc(z.x, z.y, z.r * .55, 0, 7); c.fill();
          c.fillStyle = '#d8e63c';
          c.beginPath();
          c.arc(z.x + Math.cos(aa - .4) * z.r * .5, z.y + Math.sin(aa - .4) * z.r * .5, z.brute ? 3 : 2.2, 0, 7);
          c.arc(z.x + Math.cos(aa + .4) * z.r * .5, z.y + Math.sin(aa + .4) * z.r * .5, z.brute ? 3 : 2.2, 0, 7);
          c.fill();
        });

        // tracers
        d.tracers.forEach(function (tr) {
          c.globalAlpha = tr.life / .07;
          c.strokeStyle = '#ffd257'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(tr.x1, tr.y1); c.lineTo(tr.x2, tr.y2); c.stroke();
        });
        c.globalAlpha = 1;

        // player
        if (p.inv <= 0 || Math.floor(g.t * 14) % 2 === 0) {
          var pa = Math.atan2(d.aim.y - p.y, d.aim.x - p.x);
          c.strokeStyle = '#3a3f4c'; c.lineWidth = 5; c.lineCap = 'round';
          c.beginPath(); c.moveTo(p.x, p.y);
          c.lineTo(p.x + Math.cos(pa) * 20, p.y + Math.sin(pa) * 20); c.stroke();
          c.fillStyle = '#e8c98f';
          c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill();
          c.fillStyle = '#7a4f2a'; // straw hat
          c.beginPath(); c.arc(p.x, p.y, p.r * .68, 0, 7); c.fill();
          c.fillStyle = '#a06a38';
          c.beginPath(); c.arc(p.x, p.y, p.r * .34, 0, 7); c.fill();
        }

        // particles
        d.parts.forEach(function (q) {
          c.globalAlpha = Math.max(0, q.life / q.max);
          c.fillStyle = q.col;
          c.fillRect(q.x - q.sz / 2, q.y - q.sz / 2, q.sz, q.sz);
        });
        c.globalAlpha = 1;

        // phase banner
        if (d.phase === 'build') {
          c.textAlign = 'center';
          c.fillStyle = '#ffd257';
          c.font = '800 26px Outfit, sans-serif';
          c.fillText(d.wave === 0 ? 'GET READY — ' + Math.ceil(d.phaseT) : 'BOARD UP! ' + Math.ceil(d.phaseT) + 's', W / 2, 66);
          c.font = '700 15px Outfit, sans-serif';
          c.fillStyle = '#c8a36a';
          c.fillText('🪵 boards: ' + d.boards + ' — stand by a window', W / 2, 90);
        }
        c.restore();
      }
    });
  }

  window.Milo.register({
    id: 'zombie-siege', title: 'Zombie Siege', emo: '🧟', category: 'Action',
    tagline: 'Hold the farmhouse against the horde',
    description: 'Zombies pour in from every edge, and half of them ignore you completely ' +
      'to chew through the farmhouse windows. Kill for ammo drops, then spend the short ' +
      'break between waves standing next to broken windows to hammer boards back on. ' +
      'Brutes soak six shots from wave three — losing either your health or the house ends ' +
      'the run, so never let a window sit bare.',
    controls: ['WASD', 'Mouse aim + fire', 'Space'],
    colors: ['#1c2e1a', '#8ac25a'],
    tags: ['zombies', 'shooter', 'waves', 'defense', 'top-down'],
    mount: mount
  });
})();
