/* Word Search Pack — twenty themed word searches on one shared engine.
   Each round buries 10 words from the theme's hand-written list in a 12x12
   grid (8 directions, reverses included), fills the gaps with random letters,
   and scores each find by word length plus a speed bonus at the end. */
(function () {
  'use strict';
  var Milo = window.Milo, U = Milo.util;
  var N = 12, W = 820, H = 620, CELL = 42;
  var GX = 24, GY = 60, TARGET = 10;
  var ABC = 'abcdefghijklmnopqrstuvwxyz';
  var DIRS = [[1, 0], [0, 1], [1, 1], [1, -1], [-1, 0], [0, -1], [-1, -1], [-1, 1]];

  /* ------------------------------------------------------- shared engine */

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function tryPlace(grid, word) {
    for (var attempt = 0; attempt < 140; attempt++) {
      var dir = U.choice(DIRS);
      var x = U.randInt(0, N - 1), y = U.randInt(0, N - 1);
      var ex = x + dir[0] * (word.length - 1), ey = y + dir[1] * (word.length - 1);
      if (ex < 0 || ey < 0 || ex >= N || ey >= N) continue;
      var ok = true;
      for (var i = 0; i < word.length; i++) {
        var have = grid[y + dir[1] * i][x + dir[0] * i];
        if (have && have !== word[i]) { ok = false; break; }
      }
      if (!ok) continue;
      for (var j = 0; j < word.length; j++) {
        grid[y + dir[1] * j][x + dir[0] * j] = word[j];
      }
      return true;
    }
    return false;
  }

  function cellAt(px, py) {
    var x = Math.floor((px - GX) / CELL), y = Math.floor((py - GY) / CELL);
    if (x < 0 || y < 0 || x >= N || y >= N) return null;
    return { x: x, y: y };
  }

  /** Cells on the straight line between two points, if one exists. */
  function lineCells(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var steps = Math.max(Math.abs(dx), Math.abs(dy));
    if (steps === 0) return [a];
    if (dx !== 0 && dy !== 0 && Math.abs(dx) !== Math.abs(dy)) return null;
    var sx = Math.sign(dx), sy = Math.sign(dy);
    var out = [];
    for (var i = 0; i <= steps; i++) out.push({ x: a.x + sx * i, y: a.y + sy * i });
    return out;
  }

  function reset(g, theme) {
    var d = g.data;
    d.grid = [];
    for (var y = 0; y < N; y++) d.grid.push(new Array(N).fill(''));
    d.words = [];
    d.found = {};
    d.drag = null;
    d.time = 0;
    d.done = false;
    d.pops = [];

    var pool = U.shuffle(theme.words.slice());
    for (var i = 0; i < pool.length && d.words.length < TARGET; i++) {
      if (tryPlace(d.grid, pool[i])) d.words.push({ word: pool[i] });
    }
    d.words.sort(function (a, b) { return a.word < b.word ? -1 : 1; });

    // Fill the gaps: half plain random letters, half drawn from the theme's
    // own letter distribution so near-misses look plausible.
    var bag = theme.words.join('');
    for (var yy = 0; yy < N; yy++) {
      for (var xx = 0; xx < N; xx++) {
        if (!d.grid[yy][xx]) {
          d.grid[yy][xx] = Math.random() < .5
            ? bag[U.randInt(0, bag.length - 1)]
            : ABC[U.randInt(0, 25)];
        }
      }
    }
    g.set('Score', '0');
    g.set('Found', '0/' + d.words.length);
    g.set('Time', '0:00');
  }

  function commit(g, theme) {
    var d = g.data;
    if (!d.drag || !d.drag.cells || d.drag.cells.length < 2) { d.drag = null; return; }
    var text = d.drag.cells.map(function (p) { return d.grid[p.y][p.x]; }).join('');
    var rev = text.split('').reverse().join('');
    var match = d.words.filter(function (w) {
      return !d.found[w.word] && (w.word === text || w.word === rev);
    })[0];
    if (match) {
      d.found[match.word] = d.drag.cells;
      var pts = match.word.length * 15;
      g.score += pts;
      g.set('Score', U.fmt(g.score));
      var mid = d.drag.cells[Math.floor(d.drag.cells.length / 2)];
      d.pops.push({ x: GX + mid.x * CELL + CELL / 2, y: GY + mid.y * CELL, txt: '+' + pts, t: 1 });
      Milo.sound.coin();
      var n = Object.keys(d.found).length;
      g.set('Found', n + '/' + d.words.length);
      if (n === d.words.length) {
        d.done = true;
        var bonus = Math.max(0, 3000 - Math.round(d.time) * 15);
        g.score += bonus;
        g.set('Score', U.fmt(g.score));
        g.win({
          emo: theme.emo,
          title: 'All ' + d.words.length + ' found!',
          text: 'Cleared the ' + theme.name.toLowerCase() + ' grid in ' + U.time(d.time) +
            (bonus > 0 ? ', earning a +' + U.fmt(bonus) + ' speed bonus' : '') +
            '. Play again to reshuffle — a different ten words, hidden in new places.',
          score: g.score
        });
      }
    } else {
      Milo.sound.tone({ f: 160, d: .08, v: .05, type: 'square' });
    }
    d.drag = null;
  }

  function draw(g, theme) {
    var c = g.ctx, d = g.data;
    c.fillStyle = theme.bg; c.fillRect(0, 0, W, H);

    // found-word highlights, one hue per word
    Object.keys(d.found).forEach(function (w, i) {
      c.fillStyle = 'hsla(' + (i * 47) + ',75%,55%,.30)';
      d.found[w].forEach(function (p) {
        c.fillRect(GX + p.x * CELL, GY + p.y * CELL, CELL, CELL);
      });
    });
    if (d.drag && d.drag.cells) {
      c.fillStyle = rgba(theme.accent, .30);
      d.drag.cells.forEach(function (p) {
        c.fillRect(GX + p.x * CELL, GY + p.y * CELL, CELL, CELL);
      });
    }

    c.strokeStyle = 'rgba(255,255,255,.07)';
    c.lineWidth = 1;
    for (var i = 0; i <= N; i++) {
      c.beginPath();
      c.moveTo(GX + i * CELL, GY); c.lineTo(GX + i * CELL, GY + N * CELL);
      c.moveTo(GX, GY + i * CELL); c.lineTo(GX + N * CELL, GY + i * CELL);
      c.stroke();
    }

    c.font = '700 20px Outfit, sans-serif';
    c.textAlign = 'center';
    c.fillStyle = '#e9edff';
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        c.fillText(d.grid[y][x].toUpperCase(), GX + x * CELL + CELL / 2, GY + y * CELL + CELL / 2 + 7);
      }
    }

    // word list panel
    var lx = GX + N * CELL + 26;
    var left = d.words.length - Object.keys(d.found).length;
    c.fillStyle = theme.accent;
    c.font = '700 12px Outfit, sans-serif';
    c.textAlign = 'left';
    c.fillText(theme.name.toUpperCase() + ' — ' + (left ? left + ' LEFT' : 'DONE!'), lx, GY + 4);
    d.words.forEach(function (w, wi) {
      var got = !!d.found[w.word];
      c.fillStyle = got ? '#34d399' : '#cdd4f2';
      c.font = (got ? '600 ' : '700 ') + '16px Outfit, sans-serif';
      c.fillText(w.word.toUpperCase(), lx, GY + 34 + wi * 28);
      if (got) {
        c.strokeStyle = '#34d399'; c.lineWidth = 2;
        c.beginPath();
        c.moveTo(lx - 2, GY + 29 + wi * 28);
        c.lineTo(lx + c.measureText(w.word.toUpperCase()).width + 2, GY + 29 + wi * 28);
        c.stroke();
      }
    });

    // score popups
    c.textAlign = 'center';
    c.font = '800 18px Outfit, sans-serif';
    d.pops.forEach(function (p) {
      c.fillStyle = rgba(theme.accent, Math.max(0, p.t));
      c.fillText(p.txt, p.x, p.y);
    });

    c.fillStyle = 'rgba(255,255,255,.35)';
    c.font = '600 12px Outfit, sans-serif';
    c.textAlign = 'left';
    c.fillText('Words run in all 8 directions — some backwards.', GX, GY + N * CELL + 26);
  }

  function makeMount(theme) {
    return function mount(host) {
      return Milo.arcade(host, {
        id: theme.id,
        w: W, h: H, bg: theme.bg,
        stats: ['Score', 'Found', 'Time'],
        emo: theme.emo,
        start: {
          title: 'Word Search: ' + theme.name,
          text: 'Ten ' + theme.name.toLowerCase() + ' words are hidden in the grid — across, ' +
            'down, diagonally, and some backwards. Drag from first letter to last to claim one. ' +
            'Longer words score more, and finishing fast earns a big time bonus.',
          keys: ['Drag across the letters']
        },
        init: function (g) { reset(g, theme); },
        onPointer: function (g, type, px, py) {
          var d = g.data;
          if (d.done) return;
          if (type === 'down') {
            var a = cellAt(px, py);
            if (a) d.drag = { a: a, cells: [a] };
          } else if (type === 'move' && d.drag) {
            var b = cellAt(px, py);
            if (b) {
              var cells = lineCells(d.drag.a, b);
              if (cells) d.drag.cells = cells;
            }
          } else if (type === 'up') {
            commit(g, theme);
          }
        },
        update: function (g, dt) {
          var d = g.data;
          for (var i = d.pops.length - 1; i >= 0; i--) {
            d.pops[i].t -= dt * 1.4;
            d.pops[i].y -= 32 * dt;
            if (d.pops[i].t <= 0) d.pops.splice(i, 1);
          }
          if (d.done) return;
          d.time += dt;
          g.set('Time', U.time(d.time));
        },
        draw: function (g) { draw(g, theme); }
      });
    };
  }

  /* ------------------------------------------------------------- themes */

  var THEMES = [
    {
      id: 'ws-animals', name: 'Animals', emo: '🦊',
      bg: '#241a10', accent: '#f59e0b', colors: ['#78350f', '#fbbf24'],
      tagline: 'Ten beasts per grid, GIRAFFE to SKUNK',
      desc: 'Ten animals from a thirty-strong list hide in a 12×12 grid — across, down, ' +
        'diagonal, and often spelled backwards. Drag first letter to last to cross one off; ' +
        'long finds like HEDGEHOG and CHEETAH pay far more than a quick FOX, and a speed ' +
        'bonus drains 15 points a second until the last word falls. Tip: hunt rare letters ' +
        'first — a stray Z in the fill is usually ZEBRA.',
      tags: ['word', 'search', 'animals', 'puzzle'],
      words: ['tiger', 'lion', 'zebra', 'giraffe', 'elephant', 'monkey', 'panda', 'koala',
        'otter', 'badger', 'rabbit', 'fox', 'wolf', 'bear', 'moose', 'deer', 'camel',
        'hippo', 'rhino', 'cheetah', 'leopard', 'sloth', 'lemur', 'gorilla', 'walrus',
        'weasel', 'hedgehog', 'raccoon', 'beaver', 'skunk']
    },
    {
      id: 'ws-countries', name: 'Countries', emo: '🌍',
      bg: '#0e1f38', accent: '#38bdf8', colors: ['#0c4a6e', '#7dd3fc'],
      tagline: 'ICELAND may be hiding backwards on a diagonal',
      desc: 'Each round buries ten real countries — PORTUGAL, FIJI, MOROCCO and friends — in ' +
        'a 12×12 grid, in any of eight directions including reverse. Every find pays fifteen ' +
        'points a letter, plus a time bonus that shrinks the longer you stare. Short names ' +
        'like PERU and CUBA are the sneakiest, four letters vanishing into the random fill. ' +
        'Play again and the round redraws with a different ten from a thirty-country list.',
      tags: ['word', 'search', 'geography', 'countries'],
      words: ['canada', 'brazil', 'france', 'spain', 'italy', 'japan', 'china', 'india',
        'egypt', 'kenya', 'norway', 'sweden', 'poland', 'greece', 'turkey', 'mexico',
        'peru', 'chile', 'cuba', 'ghana', 'nepal', 'laos', 'fiji', 'portugal', 'germany',
        'austria', 'ireland', 'iceland', 'morocco', 'vietnam']
    },
    {
      id: 'ws-food', name: 'Food', emo: '🍕',
      bg: '#2b1211', accent: '#fb7185', colors: ['#881337', '#fda4af'],
      tagline: 'PRETZEL, SUSHI and eight more to devour',
      desc: 'A menu of thirty dishes and ingredients feeds each round its ten hidden words — ' +
        'expect anything from PIZZA and WAFFLE to YOGURT and PRETZEL, any direction, some ' +
        'backwards. Longer words are worth more, so grab PANCAKE before RICE if you spot ' +
        'both, but do not dawdle: the finish bonus melts by the second. Doubled letters are ' +
        'your friend — a ZZ can only be PIZZA and an FF is a WAFFLE or MUFFIN.',
      tags: ['word', 'search', 'food', 'puzzle'],
      words: ['pizza', 'pasta', 'taco', 'sushi', 'burger', 'salad', 'bread', 'cheese',
        'apple', 'mango', 'grape', 'lemon', 'peach', 'olive', 'bacon', 'waffle', 'pancake',
        'noodle', 'curry', 'stew', 'soup', 'rice', 'corn', 'bean', 'honey', 'butter',
        'yogurt', 'muffin', 'pretzel', 'omelet']
    },
    {
      id: 'ws-space', name: 'Space', emo: '🪐',
      bg: '#0b1030', accent: '#a78bfa', colors: ['#1e1b4b', '#c4b5fd'],
      tagline: 'NEBULA and QUASAR lost in the letter void',
      desc: 'Ten astronomy words per round from a thirty-word catalogue: planets like SATURN ' +
        'and NEPTUNE, deep-sky stuff like NEBULA, QUASAR and PULSAR, plus hardware like ' +
        'TELESCOPE and SATELLITE. Drag along a straight line in any of eight directions — ' +
        'reversed words count too. Nine-letter monsters such as ASTRONAUT score 135 on ' +
        'their own; sweep them up early while the speed bonus is still fat.',
      tags: ['word', 'search', 'space', 'science'],
      words: ['planet', 'comet', 'meteor', 'galaxy', 'nebula', 'orbit', 'rocket', 'lunar',
        'solar', 'star', 'moon', 'mars', 'venus', 'saturn', 'jupiter', 'mercury', 'neptune',
        'uranus', 'pluto', 'cosmos', 'gravity', 'eclipse', 'asteroid', 'quasar', 'pulsar',
        'telescope', 'astronaut', 'satellite', 'crater', 'vacuum']
    },
    {
      id: 'ws-sports', name: 'Sports', emo: '🏅',
      bg: '#0f2318', accent: '#4ade80', colors: ['#14532d', '#86efac'],
      tagline: 'From JUDO to MARATHON in one grid',
      desc: 'The whole sports day in a 12×12 grid: each round hides ten events from a ' +
        'thirty-sport list, from four-letter sprints like JUDO and POLO up to MARATHON and ' +
        'LACROSSE. All eight directions are in play and reversed words are common, so read ' +
        'every diagonal both ways. Scoring is fifteen points per letter plus a decaying ' +
        'speed bonus — the J of JAVELIN and the X of BOXING stand out of the fill and make ' +
        'easy first finds.',
      tags: ['word', 'search', 'sports', 'puzzle'],
      words: ['soccer', 'tennis', 'hockey', 'rugby', 'golf', 'boxing', 'rowing', 'skiing',
        'surfing', 'cycling', 'archery', 'bowling', 'cricket', 'curling', 'fencing', 'judo',
        'karate', 'darts', 'diving', 'skating', 'sprint', 'marathon', 'javelin', 'discus',
        'relay', 'volley', 'lacrosse', 'handball', 'snooker', 'polo']
    },
    {
      id: 'ws-jobs', name: 'Jobs', emo: '💼',
      bg: '#0d2320', accent: '#5eead4', colors: ['#134e4a', '#5eead4'],
      tagline: 'PLUMBER, FLORIST and the whole workforce',
      desc: 'Thirty occupations feed the grid; every round hires ten of them, from VET at ' +
        'three letters to ENGINEER at eight. Words run across, down and diagonally, and ' +
        'roughly half get written backwards, so DOCTOR may read ROTCOD. Long titles like ' +
        'PLUMBER and DENTIST are worth the most, but the timer never stops — clear the ' +
        'short ones like CHEF the instant you spot them and save the scanning for the rest.',
      tags: ['word', 'search', 'jobs', 'puzzle'],
      words: ['doctor', 'nurse', 'teacher', 'chef', 'pilot', 'farmer', 'baker', 'lawyer',
        'artist', 'actor', 'singer', 'dancer', 'plumber', 'welder', 'tailor', 'barber',
        'banker', 'judge', 'coach', 'clerk', 'author', 'editor', 'dentist', 'vet',
        'engineer', 'florist', 'janitor', 'cashier', 'surgeon', 'waiter']
    },
    {
      id: 'ws-music', name: 'Music', emo: '🎸',
      bg: '#26102e', accent: '#e879f9', colors: ['#701a75', '#f0abfc'],
      tagline: 'TRUMPET and RHYTHM buried in the noise',
      desc: 'Instruments, genres and theory terms — TRUMPET, REGGAE, OCTAVE, RHYTHM — thirty ' +
        'in the pool, ten per round, hidden along all eight directions of a 12×12 grid. ' +
        'RHYTHM is the classic trap: with no proper vowel it hides beautifully in random ' +
        'consonants. Each letter of a find is worth fifteen points and the finish bonus ' +
        'rewards a quick clear, so start with distinctive shapes like JAZZ and OBOE.',
      tags: ['word', 'search', 'music', 'puzzle'],
      words: ['piano', 'guitar', 'violin', 'drums', 'flute', 'oboe', 'cello', 'harp',
        'trumpet', 'tuba', 'banjo', 'chord', 'tempo', 'rhythm', 'melody', 'harmony',
        'singer', 'choir', 'opera', 'jazz', 'blues', 'reggae', 'ballad', 'anthem',
        'encore', 'lyrics', 'octave', 'treble', 'bass', 'organ']
    },
    {
      id: 'ws-colors', name: 'Colors', emo: '🎨',
      bg: '#1c1030', accent: '#f472b6', colors: ['#db2777', '#38bdf8'],
      tagline: 'TURQUOISE hides better than RED does',
      desc: 'A palette of thirty colour names, ten hidden per round: everyday ones like RED ' +
        'and NAVY next to CRIMSON, MAGENTA and the nine-letter TURQUOISE. Every direction ' +
        'is legal and reversed words are everywhere — DER on a diagonal is just RED going ' +
        'the other way. Long exotic names score triple what the short ones do, and the ' +
        'speed bonus makes a two-minute clear worth chasing.',
      tags: ['word', 'search', 'colors', 'puzzle'],
      words: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'violet', 'indigo',
        'pink', 'teal', 'cyan', 'magenta', 'maroon', 'crimson', 'scarlet', 'amber', 'gold',
        'silver', 'bronze', 'ivory', 'beige', 'khaki', 'olive', 'coral', 'salmon',
        'lavender', 'turquoise', 'mauve', 'navy', 'gray']
    },
    {
      id: 'ws-ocean', name: 'Ocean', emo: '🐙',
      bg: '#06253a', accent: '#22d3ee', colors: ['#155e75', '#67e8f9'],
      tagline: 'PLANKTON to SEAHORSE, ten fathoms of words',
      desc: 'Dive a 12×12 grid for ten sea words drawn from a thirty-word reef: creatures ' +
        'like OCTOPUS, SEAHORSE and URCHIN alongside KELP, TIDE and TRENCH. Words swim in ' +
        'all eight directions and plenty go backwards, so EEL may surface as LEE. ' +
        'Three-letter finds like RAY barely pay; nine-letter JELLYFISH is the jackpot. ' +
        'The clock counts up and the finish bonus shrinks with it — clear fast for the best score.',
      tags: ['word', 'search', 'ocean', 'sea'],
      words: ['whale', 'shark', 'dolphin', 'octopus', 'squid', 'jellyfish', 'coral', 'reef',
        'kelp', 'tide', 'wave', 'crab', 'lobster', 'shrimp', 'oyster', 'clam', 'seal',
        'walrus', 'urchin', 'anemone', 'plankton', 'eel', 'ray', 'tuna', 'marlin',
        'seahorse', 'starfish', 'current', 'abyss', 'trench']
    },
    {
      id: 'ws-forest', name: 'Forest', emo: '🌲',
      bg: '#101f12', accent: '#a3e635', colors: ['#1a2e05', '#a3e635'],
      tagline: 'TOADSTOOL and BRAMBLE under the canopy',
      desc: 'A woodland list of thirty-two words — trees like BIRCH and CEDAR, undergrowth ' +
        'like BRAMBLE, MOSS and TOADSTOOL, and the SQUIRREL that lives in it. Ten hide per ' +
        'round, along all eight directions with reverses common. Double letters give away ' +
        'the big scorers: OO is TOADSTOOL or ROOT, RR is SQUIRREL. Fifteen points per ' +
        'letter plus a speed bonus that decays every second you wander.',
      tags: ['word', 'search', 'forest', 'nature'],
      words: ['oak', 'pine', 'birch', 'maple', 'cedar', 'willow', 'moss', 'fern', 'fungus',
        'canopy', 'thicket', 'bramble', 'acorn', 'twig', 'bark', 'root', 'trail', 'deer',
        'owl', 'fox', 'badger', 'squirrel', 'toadstool', 'sapling', 'mushroom', 'foliage',
        'timber', 'grove', 'glade', 'meadow', 'hollow', 'stump']
    },
    {
      id: 'ws-city', name: 'City', emo: '🏙️',
      bg: '#191a22', accent: '#fcd34d', colors: ['#374151', '#fcd34d'],
      tagline: 'SKYLINE, SUBWAY and a hidden BILLBOARD',
      desc: 'Downtown in letter form: thirty urban words in the pool, ten per grid, from ' +
        'TAXI and TRAM up to SKYLINE and BILLBOARD. All eight directions are used and ' +
        'reversed words are routine, so scan avenues both ways like a proper commuter. ' +
        'Word length drives the score and a countdown-style bonus rewards a fast clear — ' +
        'find MUSEUM and MARKET early, they share letters and confuse each other.',
      tags: ['word', 'search', 'city', 'puzzle'],
      words: ['street', 'avenue', 'subway', 'taxi', 'tram', 'plaza', 'market', 'museum',
        'tower', 'bridge', 'tunnel', 'mayor', 'siren', 'crowd', 'skyline', 'borough',
        'alley', 'park', 'cafe', 'mall', 'office', 'station', 'harbor', 'library',
        'theater', 'hotel', 'bakery', 'corner', 'traffic', 'billboard']
    },
    {
      id: 'ws-kitchen', name: 'Kitchen', emo: '🍳',
      bg: '#2a1c12', accent: '#fb923c', colors: ['#7c2d12', '#fdba74'],
      tagline: 'SPATULA and COLANDER in the letter drawer',
      desc: 'Every round rummages ten utensils and appliances out of a thirty-item drawer: ' +
        'WHISK, LADLE, SPATULA, COLANDER, FREEZER and friends. They lie in all eight ' +
        'directions, backwards included — POT reversed is TOP, which is exactly why short ' +
        'words are slippery. Eight-letter finds like CUPBOARD pay 120 points; add the ' +
        'speed bonus by clearing the whole drawer inside a couple of minutes.',
      tags: ['word', 'search', 'kitchen', 'cooking'],
      words: ['oven', 'stove', 'pan', 'pot', 'kettle', 'whisk', 'ladle', 'spatula',
        'grater', 'peeler', 'knife', 'fork', 'spoon', 'plate', 'bowl', 'mug', 'apron',
        'timer', 'mixer', 'blender', 'toaster', 'skillet', 'colander', 'teapot', 'tongs',
        'tray', 'sponge', 'faucet', 'cupboard', 'freezer']
    },
    {
      id: 'ws-school', name: 'School', emo: '✏️',
      bg: '#122032', accent: '#facc15', colors: ['#1d4ed8', '#fde047'],
      tagline: 'HOMEWORK is hidden — for once, find it fast',
      desc: 'Ten classroom words per round from a thirty-word register: supplies like ' +
        'PENCIL, ERASER and CRAYON, subjects like SCIENCE and HISTORY, and yes, HOMEWORK. ' +
        'Words run in all eight directions with reverses mixed in, so GYM might read MYG ' +
        'on a diagonal. Long words like NOTEBOOK score 120 while ART scores 45 — but the ' +
        'ticking speed bonus means the tiny ones are still worth grabbing on sight.',
      tags: ['word', 'search', 'school', 'puzzle'],
      words: ['pencil', 'eraser', 'ruler', 'crayon', 'marker', 'paper', 'folder', 'binder',
        'locker', 'desk', 'chalk', 'board', 'globe', 'atlas', 'essay', 'quiz', 'exam',
        'grade', 'recess', 'teacher', 'student', 'lesson', 'homework', 'library',
        'science', 'history', 'math', 'art', 'gym', 'notebook']
    },
    {
      id: 'ws-travel', name: 'Travel', emo: '🧳',
      bg: '#122530', accent: '#7dd3fc', colors: ['#0369a1', '#fca5a5'],
      tagline: 'Lost your PASSPORT? It is on a diagonal',
      desc: 'Pack light: each round hides ten travel words from a thirty-word itinerary — ' +
        'PASSPORT, SUITCASE, SOUVENIR, VISA, and the nine-letter ITINERARY itself. All ' +
        'eight directions, reverses included, so MAP can lurk as PAM. Three-letter finds ' +
        'barely cover the airport coffee; the long ones plus a fast finish bonus are where ' +
        'the score is. Tip: PASSPORT and TRANSIT both hide double letters worth scanning for.',
      tags: ['word', 'search', 'travel', 'holiday'],
      words: ['passport', 'ticket', 'luggage', 'suitcase', 'airport', 'flight', 'hotel',
        'hostel', 'map', 'visa', 'journey', 'voyage', 'cruise', 'tour', 'guide', 'beach',
        'resort', 'souvenir', 'customs', 'transit', 'cabin', 'ferry', 'train', 'compass',
        'border', 'abroad', 'packing', 'itinerary', 'landmark', 'tourist']
    },
    {
      id: 'ws-halloween', name: 'Halloween', emo: '🎃',
      bg: '#180d20', accent: '#fb923c', colors: ['#3b0764', '#f97316'],
      tagline: 'GRAVEYARD shift: ten spooky words to unearth',
      desc: 'Thirty frights in the pool and ten per round: GHOST, CAULDRON, SKELETON, ' +
        'COBWEB, and the nine-letter GRAVEYARD. Words creep in all eight directions and ' +
        'many are written backwards — BAT reversed is TAB, which is how it gets you. ' +
        'Length pays fifteen points a letter and the speed bonus drains like a candle, so ' +
        'sweep the obvious PUMPKIN early and save the short spooks for last.',
      tags: ['word', 'search', 'halloween', 'spooky'],
      words: ['ghost', 'witch', 'zombie', 'vampire', 'mummy', 'skeleton', 'spider', 'cobweb',
        'pumpkin', 'lantern', 'candy', 'treat', 'trick', 'spooky', 'haunted', 'graveyard',
        'tomb', 'bat', 'owl', 'cauldron', 'potion', 'broom', 'costume', 'mask', 'monster',
        'howl', 'fright', 'shadow', 'casket', 'goblin']
    },
    {
      id: 'ws-winter', name: 'Winter', emo: '❄️',
      bg: '#0d1b2e', accent: '#93c5fd', colors: ['#1e3a8a', '#e0f2fe'],
      tagline: 'BLIZZARD conditions: SNOWMAN visibility low',
      desc: 'A cold-weather list of thirty words feeds each round its ten: BLIZZARD, ' +
        'ICICLE, FIREPLACE, COCOA and both SNOWMAN and SNOWBALL — watch out, they share ' +
        'four letters and love to overlap. All eight directions with reverses, so SKI can ' +
        'hide as IKS on a diagonal. The double Z of BLIZZARD is the easiest spot on the ' +
        'board; bank it first while the speed bonus is still deep.',
      tags: ['word', 'search', 'winter', 'seasonal'],
      words: ['snow', 'frost', 'icicle', 'sleet', 'blizzard', 'mitten', 'scarf', 'sled',
        'skate', 'ski', 'igloo', 'parka', 'fireplace', 'cocoa', 'flurry', 'freeze',
        'shiver', 'thaw', 'glacier', 'hail', 'slush', 'snowman', 'snowball', 'sweater',
        'boots', 'chill', 'frozen', 'december', 'holly', 'tinsel']
    },
    {
      id: 'ws-summer', name: 'Summer', emo: '🏖️',
      bg: '#292008', accent: '#fde047', colors: ['#b45309', '#fde68a'],
      tagline: 'SUNSCREEN on, ten beach words to bag',
      desc: 'Ten summer words per round out of a thirty-word beach bag: LEMONADE, HAMMOCK, ' +
        'SNORKEL, SEASHELL, POPSICLE. Eight directions, reverses common — SUN backwards is ' +
        'NUS, which is why three-letter words are the last ones anybody finds. SUN also ' +
        'hides inside SUNBURN and SUNSCREEN, and finding it there counts, so the family of ' +
        'SUN-words practically solves itself. Fast clears keep the fat time bonus.',
      tags: ['word', 'search', 'summer', 'seasonal'],
      words: ['beach', 'sand', 'sun', 'tan', 'surf', 'swim', 'pool', 'shade', 'picnic',
        'lemonade', 'sunburn', 'seashell', 'sandals', 'sunscreen', 'towel', 'umbrella',
        'vacation', 'heatwave', 'barbecue', 'breeze', 'hammock', 'kayak', 'snorkel',
        'sailing', 'camping', 'firefly', 'meadow', 'july', 'august', 'popsicle']
    },
    {
      id: 'ws-vehicles', name: 'Vehicles', emo: '🚗',
      bg: '#1c1416', accent: '#f87171', colors: ['#7f1d1d', '#fca5a5'],
      tagline: 'AMBULANCE to CANOE, ten rides hidden',
      desc: 'A thirty-vehicle garage supplies ten hidden words per round, from CAR and VAN ' +
        'up to nine-letter monsters AMBULANCE and FIRETRUCK. Words drive in all eight ' +
        'directions and reverse gear is common — BUS backwards is SUB, which is not one of ' +
        'the words, but SUBWAY is. Scoring rewards the long haulers, and the finish bonus ' +
        'rewards not idling: fifteen points a second slip away until the last find.',
      tags: ['word', 'search', 'vehicles', 'transport'],
      words: ['car', 'truck', 'bus', 'van', 'taxi', 'train', 'tram', 'subway', 'scooter',
        'moped', 'bicycle', 'tractor', 'forklift', 'ambulance', 'firetruck', 'jeep',
        'sedan', 'wagon', 'camper', 'trailer', 'ferry', 'yacht', 'canoe', 'kayak',
        'glider', 'jet', 'plane', 'chopper', 'rocket', 'tank']
    },
    {
      id: 'ws-clothes', name: 'Clothes', emo: '👕',
      bg: '#221726', accent: '#c084fc', colors: ['#6b21a8', '#d8b4fe'],
      tagline: 'CARDIGAN and PAJAMAS in the letter wardrobe',
      desc: 'The wardrobe holds thirty garments; every round hangs ten of them in the grid, ' +
        'from HAT, CAP and TIE up to CARDIGAN and OVERALLS. Eight directions, plenty ' +
        'reversed, and the three-letter items are the true test — TIE hides in almost any ' +
        'corner of random fill. Longer clothes pay much better, and the time bonus decays ' +
        'steadily, so dress the score up fast. Look for the J of PAJAMAS and JACKET first.',
      tags: ['word', 'search', 'clothes', 'fashion'],
      words: ['shirt', 'pants', 'jeans', 'skirt', 'dress', 'jacket', 'blazer', 'hoodie',
        'sweater', 'coat', 'scarf', 'glove', 'mitten', 'sock', 'boot', 'sneaker', 'sandal',
        'hat', 'cap', 'beanie', 'belt', 'tie', 'vest', 'shorts', 'pajamas', 'robe',
        'apron', 'poncho', 'cardigan', 'overalls']
    },
    {
      id: 'ws-garden', name: 'Garden', emo: '🌻',
      bg: '#16210f', accent: '#f9a8d4', colors: ['#3f6212', '#f9a8d4'],
      tagline: 'SUNFLOWER, TRELLIS and one well-hidden WORM',
      desc: 'Thirty garden words in the seed packet, ten sown per round: flowers like TULIP, ' +
        'PEONY and nine-letter SUNFLOWER next to tools like TROWEL and the humble WORM. ' +
        'They grow in all eight directions and often backwards — IVY reversed is YVI, three ' +
        'letters of pure camouflage. Length sets the points and the speed bonus wilts by ' +
        'the second; COMPOST and MARIGOLD are the fat finds worth digging for first.',
      tags: ['word', 'search', 'garden', 'nature'],
      words: ['rose', 'tulip', 'daisy', 'lily', 'orchid', 'peony', 'ivy', 'fern', 'hedge',
        'lawn', 'soil', 'seed', 'sprout', 'bloom', 'petal', 'thorn', 'stem', 'weed',
        'mulch', 'compost', 'trowel', 'shovel', 'rake', 'hose', 'planter', 'trellis',
        'beehive', 'worm', 'sunflower', 'marigold']
    }
  ];

  THEMES.forEach(function (t) {
    Milo.register({
      id: t.id,
      title: 'Word Search: ' + t.name,
      emo: t.emo,
      category: 'Word',
      tagline: t.tagline,
      description: t.desc,
      controls: ['Drag across letters'],
      colors: t.colors,
      tags: t.tags,
      mount: makeMount(t)
    });
  });
})();
