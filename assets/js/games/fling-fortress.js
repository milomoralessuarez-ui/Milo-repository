/* Fling Fortress — pull back, let go, and bring the towers down. */
(function () {
  'use strict';
  var W = 900, H = 560, G = 1400, GROUND = H - 62;
  var SLING = { x: 130, y: GROUND - 110 };
  var MAX_PULL = 110;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;

    /**
     * Levels are described as block towers rather than hand-placed pixels, so a new
     * layout is a few numbers rather than a new draw routine.
     */
    function buildLevel(d, n) {
      d.blocks = [];
      d.pigs = [];
      var baseX = 520 + (n % 3) * 40;
      var towers = 2 + Math.min(2, Math.floor(n / 3));
      for (var t = 0; t < towers; t++) {
        var tx = baseX + t * 118;
        var height = 3 + ((n + t) % 3);
        for (var i = 0; i < height; i++) {
          var wood = (i + t) % 3 !== 2;
          d.blocks.push({
            x: tx, y: GROUND - 34 - i * 34, w: 26, h: 34,
            vx: 0, vy: 0, rot: 0, vr: 0,
            hp: wood ? 26 : 55, max: wood ? 26 : 55, kind: wood ? 'wood' : 'stone', settled: true
          });
          d.blocks.push({
            x: tx + 62, y: GROUND - 34 - i * 34, w: 26, h: 34,
            vx: 0, vy: 0, rot: 0, vr: 0,
            hp: wood ? 26 : 55, max: wood ? 26 : 55, kind: wood ? 'wood' : 'stone', settled: true
          });
          // A plank across the top ties the two legs together into a real tower.
          d.blocks.push({
            x: tx + 31, y: GROUND - 34 - i * 34 - 24, w: 88, h: 16,
            vx: 0, vy: 0, rot: 0, vr: 0,
            hp: 20, max: 20, kind: 'plank', settled: true
          });
        }
        d.pigs.push({ x: tx + 31, y: GROUND - 34 - height * 34 - 46, r: 17, vx: 0, vy: 0, hp: 24, dead: false });
        if (height > 2) d.pigs.push({ x: tx + 31, y: GROUND - 20, r: 15, vx: 0, vy: 0, hp: 20, dead: false });
      }
      d.pigsLeft = d.pigs.length;
    }

    function reset(g) {
      var d = g.data;
      d.level = d.level || 1;
      d.shots = 5;
      d.ball = null;
      d.dragging = false;
      d.pull = { x: 0, y: 0 };
      d.parts = [];
      d.settleTimer = 0;
      d.between = 0;
      d.trail = [];
      d.ghost = [];
      buildLevel(d, d.level);
      g.set('Level', d.level);
      g.set('Shots', d.shots);
      g.set('Targets', d.pigsLeft);
      g.set('Best', g.best ? U.fmt(g.best) : '—');
    }

    function burst(d, x, y, color, n) {
      for (var i = 0; i < n; i++) {
        var a = U.rand(0, Math.PI * 2), s = U.rand(50, 220);
        d.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: U.rand(.25, .7), c: color });
      }
    }

    function damage(g, thing, amount, x, y, color) {
      var d = g.data;
      thing.hp -= amount;
      if (thing.hp <= 0) {
        thing.dead = true;
        burst(d, x, y, color, 16);
        g.score += 120;
        g.set('Score', g.score);
        Milo.sound.hit();
      } else if (amount > 4) {
        burst(d, x, y, color, 4);
      }
    }

    function launch(g) {
      var d = g.data;
      var dx = -d.pull.x, dy = -d.pull.y;
      var mag = Math.hypot(dx, dy);
      if (mag < 12) { d.dragging = false; return; }
      var power = Math.min(mag, MAX_PULL) / MAX_PULL;
      d.ball = {
        x: SLING.x + d.pull.x, y: SLING.y + d.pull.y,
        vx: dx / mag * power * 900, vy: dy / mag * power * 900,
        r: 13, live: 2.6, bounces: 0
      };
      d.trail = [];
      d.shots--;
      d.dragging = false;
      g.set('Shots', d.shots);
      Milo.sound.tone({ f: 300, d: .12, v: .06, type: 'triangle' });
    }

    /** Aim preview: the same integration the ball will use, run forward a short way. */
    function predict(d) {
      var dx = -d.pull.x, dy = -d.pull.y, mag = Math.hypot(dx, dy);
      if (mag < 12) return [];
      var power = Math.min(mag, MAX_PULL) / MAX_PULL;
      var x = SLING.x + d.pull.x, y = SLING.y + d.pull.y;
      var vx = dx / mag * power * 900, vy = dy / mag * power * 900;
      var pts = [];
      for (var i = 0; i < 55; i++) {
        vy += G * (1 / 60);
        x += vx / 60; y += vy / 60;
        if (y > GROUND) break;
        if (i % 3 === 0) pts.push({ x: x, y: y });
      }
      return pts;
    }

    return Milo.arcade(host, {
      id: 'fling-fortress',
      w: W, h: H, bg: '#7fc0e8',
      stats: ['Score', 'Level', 'Shots', 'Targets', 'Best'],
      emo: '🎯',
      trackBest: true,
      start: {
        title: 'Fling Fortress',
        text: 'Drag back from the sling, watch the arc, and let go. Knock every green target ' +
          'off the board before you run out of shots — collapsing a tower on top of them counts.',
        keys: ['Drag from the sling and release', 'The dotted arc shows your shot']
      },
      init: reset,

      onPointer: function (g, type, px, py) {
        if (g.state !== 'play') return;
        var d = g.data;
        if (d.between > 0) return;
        if (type === 'down') {
          if (d.ball || d.shots <= 0) return;
          if (U.dist(px, py, SLING.x, SLING.y) < 120) { d.dragging = true; d.pull = { x: 0, y: 0 }; }
        } else if (type === 'move' && d.dragging) {
          var dx = px - SLING.x, dy = py - SLING.y, m = Math.hypot(dx, dy);
          if (m > MAX_PULL) { dx = dx / m * MAX_PULL; dy = dy / m * MAX_PULL; }
          d.pull = { x: dx, y: dy };
        } else if (type === 'up' && d.dragging) {
          launch(g);
        }
      },

      update: function (g, dt) {
        var d = g.data;
        var i;

        for (i = d.parts.length - 1; i >= 0; i--) {
          var pt = d.parts[i];
          pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 900 * dt; pt.life -= dt;
          if (pt.life <= 0) d.parts.splice(i, 1);
        }

        if (d.between > 0) {
          d.between -= dt;
          if (d.between <= 0) {
            d.level++;
            g.score += 400 + d.shots * 150;
            g.set('Score', g.score);
            var lvl = d.level;
            reset(g);
            d.level = lvl;
            g.set('Level', lvl);
            g.set('Score', g.score);
          }
          return;
        }

        // --- ball ------------------------------------------------------------
        if (d.ball) {
          var b = d.ball;
          // Substepping keeps a fast ball from tunnelling through a thin plank.
          var steps = 4, sdt = dt / steps;
          for (var s = 0; s < steps && d.ball; s++) {
            b.vy += G * sdt;
            b.x += b.vx * sdt;
            b.y += b.vy * sdt;

            if (b.y + b.r > GROUND) {
              b.y = GROUND - b.r;
              b.vy *= -.42;
              b.vx *= .74;
              b.bounces++;
              if (Math.abs(b.vy) < 40) b.vy = 0;
            }

            d.blocks.forEach(function (bl) {
              if (bl.dead) return;
              if (b.x + b.r < bl.x - bl.w / 2 || b.x - b.r > bl.x + bl.w / 2) return;
              if (b.y + b.r < bl.y - bl.h / 2 || b.y - b.r > bl.y + bl.h / 2) return;
              var speed = Math.hypot(b.vx, b.vy);
              damage(g, bl, speed / 26, b.x, b.y, bl.kind === 'stone' ? '#9aa0a8' : '#c08a4a');
              bl.vx += b.vx * .012;
              bl.vy -= 40;
              bl.vr += U.rand(-3, 3);
              bl.settled = false;
              // Reflect off whichever face was shallower to enter.
              var ox = Math.abs(b.x - bl.x) - (bl.w / 2 + b.r);
              var oy = Math.abs(b.y - bl.y) - (bl.h / 2 + b.r);
              if (ox > oy) b.vx *= -.42; else b.vy *= -.42;
              b.vx *= .82; b.vy *= .82;
            });

            d.pigs.forEach(function (p) {
              if (p.dead) return;
              if (U.dist(b.x, b.y, p.x, p.y) > b.r + p.r) return;
              damage(g, p, Math.hypot(b.vx, b.vy) / 16, p.x, p.y, '#6ed77a');
              b.vx *= .55; b.vy *= .55;
            });

            b.live -= sdt;
            if (b.live <= 0 || b.x > W + 60 || (b.bounces > 4 && Math.abs(b.vx) < 25)) {
              d.trail = [];
              d.ball = null;
              d.settleTimer = .9;
            }
          }
          if (d.ball) {
            d.trail.push({ x: b.x, y: b.y });
            if (d.trail.length > 90) d.trail.shift();
          }
        }

        // --- debris physics -----------------------------------------------------
        var moving = false;
        d.blocks.forEach(function (bl) {
          if (bl.dead || bl.settled) return;
          moving = true;
          bl.vy += G * dt;
          bl.x += bl.vx * dt;
          bl.y += bl.vy * dt;
          bl.rot += bl.vr * dt;
          bl.vr *= .97;
          if (bl.y + bl.h / 2 > GROUND) {
            bl.y = GROUND - bl.h / 2;
            bl.vy *= -.22;
            bl.vx *= .7;
            bl.vr *= .6;
            if (Math.abs(bl.vy) < 30) { bl.vy = 0; bl.vx *= .5; }
            if (Math.abs(bl.vx) < 8 && Math.abs(bl.vy) < 8) bl.settled = true;
          }
          // Falling masonry is what actually finishes most towers off.
          d.pigs.forEach(function (p) {
            if (p.dead) return;
            if (Math.abs(p.x - bl.x) > p.r + bl.w / 2 || Math.abs(p.y - bl.y) > p.r + bl.h / 2) return;
            var force = Math.hypot(bl.vx, bl.vy);
            if (force > 60) damage(g, p, force / 18, p.x, p.y, '#6ed77a');
          });
        });

        d.pigs.forEach(function (p) {
          if (p.dead) return;
          // Targets sit on whatever is under them; if that goes, so do they.
          var supported = p.y > GROUND - p.r - 2 || d.blocks.some(function (bl) {
            return !bl.dead && Math.abs(bl.x - p.x) < bl.w / 2 + p.r * .7 &&
              bl.y - bl.h / 2 >= p.y + p.r - 6 && bl.y - bl.h / 2 <= p.y + p.r + 26;
          });
          if (!supported) {
            p.vy += G * dt;
            p.y += p.vy * dt;
            if (p.y + p.r > GROUND) {
              p.y = GROUND - p.r;
              if (p.vy > 320) damage(g, p, p.vy / 22, p.x, p.y, '#6ed77a');
              p.vy = 0;
            }
            moving = true;
          } else { p.vy = 0; }
        });

        var alive = d.pigs.filter(function (p) { return !p.dead; }).length;
        if (alive !== d.pigsLeft) { d.pigsLeft = alive; g.set('Targets', alive); }

        if (alive === 0 && d.between <= 0) {
          d.between = 1.2;
          Milo.sound.win();
          return;
        }

        if (!d.ball && d.settleTimer > 0) {
          d.settleTimer -= dt;
          if (d.settleTimer <= 0 && !moving && d.shots <= 0 && alive > 0) {
            g.gameOver({
              emo: '🎯', title: 'Out of ammo',
              text: alive + ' target' + (alive === 1 ? '' : 's') + ' still standing on level ' + d.level + '.',
              score: g.score
            });
          }
        }
      },

      draw: function (g) {
        var c = g.ctx, d = g.data;
        var sky = c.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#8fcdf0'); sky.addColorStop(1, '#d8eef8');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);

        c.fillStyle = 'rgba(255,255,255,.55)';
        for (var i = 0; i < 4; i++) {
          var cx = ((i * 233 + g.t * 6) % (W + 160)) - 80, cy = 60 + i * 34;
          c.beginPath();
          c.arc(cx, cy, 26, 0, Math.PI * 2);
          c.arc(cx + 26, cy + 6, 20, 0, Math.PI * 2);
          c.arc(cx - 24, cy + 8, 17, 0, Math.PI * 2);
          c.fill();
        }

        c.fillStyle = '#5a9e46';
        c.fillRect(0, GROUND, W, H - GROUND);
        c.fillStyle = '#4a8438';
        c.fillRect(0, GROUND, W, 8);

        d.blocks.forEach(function (bl) {
          if (bl.dead) return;
          c.save();
          c.translate(bl.x, bl.y);
          c.rotate(bl.rot);
          var hurt = 1 - bl.hp / bl.max;
          c.fillStyle = bl.kind === 'stone' ? U.shade('#8d939b', -hurt * 30)
            : bl.kind === 'plank' ? U.shade('#c9954f', -hurt * 30)
              : U.shade('#b87f3e', -hurt * 30);
          U.roundRect(c, -bl.w / 2, -bl.h / 2, bl.w, bl.h, 4); c.fill();
          c.strokeStyle = 'rgba(0,0,0,.28)';
          c.lineWidth = 1.5;
          U.roundRect(c, -bl.w / 2, -bl.h / 2, bl.w, bl.h, 4); c.stroke();
          if (hurt > .3) {
            c.strokeStyle = 'rgba(0,0,0,.35)';
            c.beginPath();
            c.moveTo(-bl.w / 4, -bl.h / 2 + 3); c.lineTo(bl.w / 6, 0); c.lineTo(-bl.w / 5, bl.h / 2 - 3);
            c.stroke();
          }
          c.restore();
        });

        d.pigs.forEach(function (p) {
          if (p.dead) return;
          c.fillStyle = U.shade('#6ed77a', -(1 - p.hp / 24) * 40);
          c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#fff';
          c.beginPath(); c.arc(p.x - 5, p.y - 4, 4, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.arc(p.x + 5, p.y - 4, 4, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#1a2b16';
          c.beginPath(); c.arc(p.x - 5, p.y - 4, 1.8, 0, Math.PI * 2); c.fill();
          c.beginPath(); c.arc(p.x + 5, p.y - 4, 1.8, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#4fae5c';
          c.beginPath(); c.ellipse(p.x, p.y + 4, 6, 4.5, 0, 0, Math.PI * 2); c.fill();
        });

        // Sling frame.
        c.strokeStyle = '#6b4423';
        c.lineWidth = 7;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(SLING.x, GROUND); c.lineTo(SLING.x, SLING.y);
        c.moveTo(SLING.x, SLING.y + 18); c.lineTo(SLING.x - 16, SLING.y - 6);
        c.stroke();

        if (d.dragging) {
          var bx = SLING.x + d.pull.x, by = SLING.y + d.pull.y;
          c.strokeStyle = '#3b2a18';
          c.lineWidth = 4;
          c.beginPath();
          c.moveTo(SLING.x - 16, SLING.y - 6); c.lineTo(bx, by); c.lineTo(SLING.x + 6, SLING.y - 4);
          c.stroke();
          c.fillStyle = '#e8543f';
          c.beginPath(); c.arc(bx, by, 13, 0, Math.PI * 2); c.fill();

          var arc = predict(d);
          c.fillStyle = 'rgba(255,255,255,.75)';
          arc.forEach(function (p, i) {
            c.globalAlpha = .85 - i / arc.length * .6;
            c.beginPath(); c.arc(p.x, p.y, 3.4, 0, Math.PI * 2); c.fill();
          });
          c.globalAlpha = 1;

          var power = Math.round(Math.min(Math.hypot(d.pull.x, d.pull.y), MAX_PULL) / MAX_PULL * 100);
          c.fillStyle = '#1d2b3a';
          c.font = '600 14px Outfit, sans-serif';
          c.textAlign = 'left';
          c.fillText('Power ' + power + '%', SLING.x - 30, SLING.y - 74);
        } else if (!d.ball && d.shots > 0) {
          c.fillStyle = '#e8543f';
          c.beginPath(); c.arc(SLING.x - 5, SLING.y - 6, 13, 0, Math.PI * 2); c.fill();
        }

        if (d.trail.length > 1) {
          c.strokeStyle = 'rgba(255,255,255,.5)';
          c.lineWidth = 2;
          c.setLineDash([5, 6]);
          c.beginPath();
          d.trail.forEach(function (p, i) { if (i) c.lineTo(p.x, p.y); else c.moveTo(p.x, p.y); });
          c.stroke();
          c.setLineDash([]);
        }

        if (d.ball) {
          c.fillStyle = '#e8543f';
          c.beginPath(); c.arc(d.ball.x, d.ball.y, d.ball.r, 0, Math.PI * 2); c.fill();
          c.fillStyle = 'rgba(255,255,255,.45)';
          c.beginPath(); c.arc(d.ball.x - 4, d.ball.y - 4, 4, 0, Math.PI * 2); c.fill();
        }

        d.parts.forEach(function (pt) {
          c.globalAlpha = Math.max(0, pt.life * 1.5);
          c.fillStyle = pt.c;
          c.fillRect(pt.x - 3, pt.y - 3, 6, 6);
        });
        c.globalAlpha = 1;

        // Remaining shots, drawn as the ammo itself.
        for (var s = 0; s < d.shots; s++) {
          c.fillStyle = '#e8543f';
          c.beginPath(); c.arc(46 + s * 26, GROUND - 14, 9, 0, Math.PI * 2); c.fill();
        }

        if (d.between > 0) {
          c.fillStyle = 'rgba(0,0,0,.5)';
          c.fillRect(0, H / 2 - 42, W, 84);
          c.fillStyle = '#ffe08a';
          c.font = '700 30px Outfit, sans-serif';
          c.textAlign = 'center';
          c.fillText('Fortress down! +' + (400 + d.shots * 150), W / 2, H / 2 + 10);
        }
      }
    });
  }

  window.Milo.register({
    id: 'fling-fortress', title: 'Fling Fortress', emo: '🎯', category: 'Sports',
    tagline: 'Pull back and knock it all down',
    description: 'Haul the sling back, line up the dotted arc and let fly. Every fortress is ' +
      'built from wood, planks and stone with different toughness, and the green targets are ' +
      'perched where a direct hit is hard — so the good shots are the ones that take out a ' +
      'load-bearing block and drop the whole tower on them. Debris keeps its momentum after ' +
      'the ball has stopped, so a shot can keep paying off for several seconds. Clear the board ' +
      'and every unused shot turns into bonus points.',
    controls: ['Drag back from the sling and release', 'The dotted line previews your arc'],
    colors: ['#8fcdf0', '#e8543f'],
    tags: ['physics', 'aiming', 'destruction', 'casual'],
    mount: mount
  });
})();
