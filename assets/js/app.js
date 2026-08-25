/* ==========================================================================
   MiloPlay portal
   Hash routing, search, categories, favourites, recently-played, and the
   game player. Everything is client-side so the whole site works as static
   files (GitHub Pages, a USB stick, or file://).
   ========================================================================== */
(function () {
  'use strict';

  var Milo = window.Milo;
  var U = Milo.util;
  var store = Milo.store;
  var el = Milo.el;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* --------------------------------------------------------------- state */

  var CATEGORIES = [
    { id: 'Sandbox', icon: '⛏️', blurb: 'Build, mine and explore open worlds.' },
    { id: 'Arcade', icon: '🕹️', blurb: 'Quick reflex classics you can pick up in a second.' },
    { id: 'Action', icon: '💥', blurb: 'Shoot, dodge and survive the swarm.' },
    { id: 'Puzzle', icon: '🧩', blurb: 'Take your time and think it through.' },
    { id: 'Racing', icon: '🏎️', blurb: 'Fast lanes, tight corners, no brakes.' },
    { id: 'Sports', icon: '🏓', blurb: 'Beat the bot, beat your best.' },
    { id: 'Casual', icon: '🍭', blurb: 'Relaxed games for a five-minute break.' },
    { id: 'Strategy', icon: '♟️', blurb: 'Outsmart the opponent, one move at a time.' }
  ];

  // Officially-hosted games elsewhere on the web. We link out rather than
  // embed — these are other people's sites and framing them is not ours to do.
  var EXTERNAL = [
    { name: 'Eaglercraft', desc: 'Minecraft 1.8 in the browser', url: 'https://eaglercraft.com/', emo: '⛏️', colors: ['#5b8a3c', '#8b5a2b'] },
    { name: 'Bloxd.io', desc: 'Multiplayer voxel worlds & minigames', url: 'https://bloxd.io/', emo: '🧱', colors: ['#f59e0b', '#ef4444'] },
    { name: 'CrazyGames', desc: 'Huge browser games catalogue', url: 'https://www.crazygames.com/', emo: '🎡', colors: ['#7c5cff', '#ec4899'] },
    { name: 'Poki', desc: 'Curated free web games', url: 'https://poki.com/', emo: '🎈', colors: ['#22d3ee', '#3b82f6'] },
    { name: 'Krunker.io', desc: 'Fast browser FPS', url: 'https://krunker.io/', emo: '🔫', colors: ['#64748b', '#0ea5e9'] },
    { name: 'itch.io', desc: 'Indie games, many playable in-browser', url: 'https://itch.io/games/html5', emo: '🎨', colors: ['#fa5c5c', '#f97316'] }
  ];

  var state = {
    query: '',
    route: { name: 'home' },
    favs: store.get('favs', []) || [],
    recent: store.get('recent', []) || [],
    plays: store.get('plays', {}) || {}
  };

  var current = null;  // live game instance

  /* --------------------------------------------------------------- helpers */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function tileStyle(game) {
    var c = game.colors;
    return 'background:linear-gradient(140deg,' + c[0] + ' 0%,' + c[1] + ' 100%)';
  }

  function tileHTML(game, cls) {
    return '<div class="tile ' + (cls || '') + '" style="' + tileStyle(game) + '">' +
      '<span class="glyph">' + (game.emo || '🎮') + '</span></div>';
  }

  function isFav(id) { return state.favs.indexOf(id) !== -1; }

  function toggleFav(id) {
    var i = state.favs.indexOf(id);
    if (i === -1) { state.favs.unshift(id); toast('❤️ Added to favourites'); }
    else { state.favs.splice(i, 1); toast('Removed from favourites'); }
    store.set('favs', state.favs);
    renderSidebar();
    return isFav(id);
  }

  function markPlayed(id) {
    state.recent = [id].concat(state.recent.filter(function (x) { return x !== id; })).slice(0, 24);
    state.plays[id] = (state.plays[id] || 0) + 1;
    store.set('recent', state.recent);
    store.set('plays', state.plays);
    renderSidebar();
  }
  Milo.onPlayed = markPlayed;

  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2000);
  }

  function go(hash) { location.hash = hash; }

  function scoreMatch(game, q) {
    var t = game.title.toLowerCase();
    if (t === q) return 100;
    if (t.indexOf(q) === 0) return 80;
    if (t.indexOf(q) !== -1) return 60;
    if ((game.tagline || '').toLowerCase().indexOf(q) !== -1) return 40;
    if (game.category.toLowerCase().indexOf(q) !== -1) return 30;
    if (game.tags.some(function (x) { return x.toLowerCase().indexOf(q) !== -1; })) return 25;
    if ((game.description || '').toLowerCase().indexOf(q) !== -1) return 10;
    return 0;
  }

  function search(q) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    return Milo.games
      .map(function (gm) { return { g: gm, s: scoreMatch(gm, q) }; })
      .filter(function (r) { return r.s > 0; })
      .sort(function (a, b) { return b.s - a.s || a.g.title.localeCompare(b.g.title); })
      .map(function (r) { return r.g; });
  }

  /* ------------------------------------------------------------ card list */

  // The play overlay has to live inside .tile for the hover effect, so cards
  // are assembled as nodes rather than as an HTML string.
  function card(game, opts) {
    opts = opts || {};
    var b = el('button', 'card' + (opts.wide ? ' wide' : ''));
    b.type = 'button';
    b.dataset.play = game.id;
    b.setAttribute('aria-label', 'Play ' + game.title);

    var badgeText = opts.badge || (game.featured ? 'Featured' : (game.isNew ? 'New' : ''));
    var badgeKind = opts.badgeKind || (game.featured ? 'hot' : (game.isNew ? 'new' : ''));
    if (badgeText) b.appendChild(el('span', 'badge ' + badgeKind, esc(badgeText)));

    var fav = el('span', 'fav-btn' + (isFav(game.id) ? ' on' : ''), isFav(game.id) ? '♥' : '♡');
    fav.dataset.fav = game.id;
    fav.setAttribute('role', 'button');
    fav.setAttribute('tabindex', '0');
    fav.setAttribute('aria-label', 'Toggle favourite for ' + game.title);
    b.appendChild(fav);

    var tile = el('div', 'tile');
    tile.setAttribute('style', tileStyle(game));
    tile.appendChild(el('span', 'glyph', game.emo || '🎮'));
    var pl = el('div', 'tile-play');
    pl.appendChild(el('span', null, Milo.ICON.play));
    tile.appendChild(pl);
    b.appendChild(tile);

    var best = store.best(game.id);
    var body = el('div', 'card-body');
    body.appendChild(el('div', 'card-title', esc(game.title)));
    body.appendChild(el('div', 'card-meta',
      esc(game.category) + (best ? '<span class="dot"></span>Best ' + U.fmt(best) : '')));
    b.appendChild(body);
    return b;
  }

  function gridOf(games, opts) {
    var grid = el('div', 'grid' + (opts && opts.big ? ' big' : ''));
    games.forEach(function (gm, i) {
      grid.appendChild(card(gm, { wide: opts && opts.wideFirst && i === 0 }));
    });
    return grid;
  }

  function section(title, emo, games, opts) {
    opts = opts || {};
    if (!games.length) return null;
    var s = el('section', 'section');
    var head = el('div', 'section-head');
    head.appendChild(el('h2', null, '<span class="emo">' + emo + '</span>' + esc(title)));
    if (opts.moreHash) {
      var m = el('button', 'more', 'See all →');
      m.type = 'button';
      m.addEventListener('click', function () { go(opts.moreHash); });
      head.appendChild(m);
    }
    s.appendChild(head);
    s.appendChild(gridOf(games, opts));
    return s;
  }

  /* ------------------------------------------------------------- sidebar */

  function renderSidebar() {
    var nav = $('#sidenav');
    if (!nav) return;
    var r = state.route;
    var html = '';

    function link(hash, icon, label, count, active) {
      return '<button class="side-link' + (active ? ' active' : '') + '" data-go="' + hash + '">' +
        '<span class="ico">' + icon + '</span>' + esc(label) +
        (count ? '<span class="count">' + count + '</span>' : '') + '</button>';
    }

    html += '<div class="side-title">Browse</div>';
    html += link('#/', '🏠', 'Home', 0, r.name === 'home');
    html += link('#/browse', '🎮', 'All games', Milo.games.length, r.name === 'browse' && !r.cat);
    html += link('#/favorites', '❤️', 'Favourites', state.favs.length, r.name === 'favorites');
    html += link('#/recent', '🕘', 'Recently played', state.recent.length, r.name === 'recent');

    html += '<div class="side-title">Categories</div>';
    CATEGORIES.forEach(function (c) {
      var n = Milo.games.filter(function (gm) { return gm.category === c.id; }).length;
      if (!n) return;
      html += link('#/c/' + encodeURIComponent(c.id), c.icon, c.id, n, r.name === 'browse' && r.cat === c.id);
    });

    html += '<div class="side-title">More</div>';
    html += link('#/elsewhere', '🌐', 'Games elsewhere', 0, r.name === 'elsewhere');
    html += link('#/about', 'ℹ️', 'About', 0, r.name === 'about');

    nav.innerHTML = html;
  }

  /* --------------------------------------------------------------- views */

  function viewHome() {
    var wrap = el('div');

    var featured = Milo.games.filter(function (gm) { return gm.featured; });
    var hero = el('section', 'hero');
    hero.innerHTML =
      '<div class="hero-inner">' +
      '<span class="eyebrow">✨ ' + Milo.games.length + ' free games · no downloads · no sign-up</span>' +
      '<h1>Play something <span>brilliant</span> right now.</h1>' +
      '<p>Voxel worlds, arena shooters, puzzles and arcade classics — all built to run ' +
      'instantly in your browser, on any device. Nothing to install, nothing to pay.</p>' +
      '<div class="hero-cta">' +
      '<button class="btn btn-primary" data-play="' + esc((featured[0] || Milo.games[0]).id) + '">' +
      Milo.ICON.play + ' Play ' + esc((featured[0] || Milo.games[0]).title) + '</button>' +
      '<button class="btn btn-ghost" data-go="#/browse">Browse all games</button>' +
      '<button class="btn btn-ghost" data-random="1">🎲 Surprise me</button>' +
      '</div></div>';
    wrap.appendChild(hero);

    var s;
    if ((s = section('Featured', '⭐', featured, { big: true, moreHash: '#/browse' }))) wrap.appendChild(s);

    var recentGames = state.recent.map(function (id) { return Milo.byId[id]; })
      .filter(Boolean).slice(0, 12);
    if ((s = section('Jump back in', '🕘', recentGames, { moreHash: '#/recent' }))) wrap.appendChild(s);

    var favGames = state.favs.map(function (id) { return Milo.byId[id]; }).filter(Boolean).slice(0, 12);
    if ((s = section('Your favourites', '❤️', favGames, { moreHash: '#/favorites' }))) wrap.appendChild(s);

    // Most-played across this browser, falling back to catalogue order.
    var popular = Milo.games.slice().sort(function (a, b) {
      return (state.plays[b.id] || 0) - (state.plays[a.id] || 0) ||
        (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }).slice(0, 12);
    if ((s = section('Popular now', '🔥', popular, { moreHash: '#/browse' }))) wrap.appendChild(s);

    CATEGORIES.forEach(function (c) {
      var games = Milo.games.filter(function (gm) { return gm.category === c.id; });
      if (games.length < 2) return;
      var sec = section(c.id, c.icon, games.slice(0, 12), { moreHash: '#/c/' + encodeURIComponent(c.id) });
      if (sec) wrap.appendChild(sec);
    });

    // Links out to the big sites people asked about.
    var ext = el('section', 'section');
    ext.appendChild(el('div', 'section-head',
      '<h2><span class="emo">🌐</span>Great games elsewhere</h2>'));
    ext.appendChild(el('p', null,
      '<span style="color:var(--text-2);font-size:.93rem">These open on their own official sites in a new tab.</span>'));
    ext.appendChild(externalList());
    wrap.appendChild(ext);

    return wrap;
  }

  function externalList() {
    var list = el('div', 'ext-list');
    list.style.marginTop = '12px';
    EXTERNAL.forEach(function (x) {
      var a = el('a', 'ext');
      a.href = x.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.innerHTML =
        '<div class="tile" style="background:linear-gradient(140deg,' + x.colors[0] + ',' + x.colors[1] + ')">' +
        '<span class="glyph">' + x.emo + '</span></div>' +
        '<div><div class="n">' + esc(x.name) + '</div><div class="d">' + esc(x.desc) + '</div></div>' +
        '<span class="arrow">↗</span>';
      list.appendChild(a);
    });
    return list;
  }

  function viewBrowse(cat) {
    var wrap = el('div');
    var games = cat ? Milo.games.filter(function (gm) { return gm.category === cat; }) : Milo.games.slice();
    var meta = CATEGORIES.filter(function (c) { return c.id === cat; })[0];

    var head = el('div', 'page-head');
    head.innerHTML =
      '<h1>' + (meta ? meta.icon + ' ' : '') + esc(cat || 'All games') + '</h1>' +
      '<p>' + (meta ? esc(meta.blurb) + ' ' : '') + games.length + ' game' + (games.length === 1 ? '' : 's') +
      ' — free, instant, no account needed.</p>';
    wrap.appendChild(head);

    var chips = el('div', 'chips');
    var all = el('button', 'chip' + (!cat ? ' active' : ''), 'All');
    all.type = 'button';
    all.addEventListener('click', function () { go('#/browse'); });
    chips.appendChild(all);
    CATEGORIES.forEach(function (c) {
      var n = Milo.games.filter(function (gm) { return gm.category === c.id; }).length;
      if (!n) return;
      var b = el('button', 'chip' + (cat === c.id ? ' active' : ''), c.icon + ' ' + c.id);
      b.type = 'button';
      b.addEventListener('click', function () { go('#/c/' + encodeURIComponent(c.id)); });
      chips.appendChild(b);
    });
    wrap.appendChild(chips);

    games.sort(function (a, b) {
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.title.localeCompare(b.title);
    });
    wrap.appendChild(gridOf(games, { big: !!cat }));
    return wrap;
  }

  function viewList(title, emo, games, emptyMsg) {
    var wrap = el('div');
    var head = el('div', 'page-head');
    head.innerHTML = '<h1>' + emo + ' ' + esc(title) + '</h1><p>' + games.length +
      ' game' + (games.length === 1 ? '' : 's') + '</p>';
    wrap.appendChild(head);
    if (!games.length) {
      wrap.appendChild(emptyState(emo, title, emptyMsg));
    } else {
      wrap.appendChild(gridOf(games, { big: true }));
    }
    return wrap;
  }

  function emptyState(emo, title, msg) {
    var e = el('div', 'empty');
    e.innerHTML = '<div class="e">' + emo + '</div><h3>Nothing here yet</h3><p>' + esc(msg) + '</p>';
    var b = el('button', 'btn btn-primary', 'Browse all games');
    b.type = 'button';
    b.addEventListener('click', function () { go('#/browse'); });
    e.appendChild(b);
    return e;
  }

  function viewSearch(q) {
    var results = search(q);
    var wrap = el('div');
    var head = el('div', 'page-head');
    head.innerHTML = '<h1>Search</h1><p>' + results.length + ' result' +
      (results.length === 1 ? '' : 's') + ' for “' + esc(q) + '”</p>';
    wrap.appendChild(head);
    if (!results.length) {
      var e = el('div', 'empty');
      e.innerHTML = '<div class="e">🔍</div><h3>No games matched “' + esc(q) + '”</h3>' +
        '<p>Try a category like <b>puzzle</b>, <b>racing</b> or <b>sandbox</b>.</p>';
      var b = el('button', 'btn btn-primary', 'Browse all games');
      b.type = 'button';
      b.addEventListener('click', function () { go('#/browse'); });
      e.appendChild(b);
      wrap.appendChild(e);
    } else {
      wrap.appendChild(gridOf(results, { big: true }));
    }
    return wrap;
  }

  function viewElsewhere() {
    var wrap = el('div');
    wrap.appendChild(el('div', 'page-head',
      '<h1>🌐 Games elsewhere</h1><p>Big browser-game sites worth a visit. ' +
      'Each link opens the official site in a new tab.</p>'));
    wrap.appendChild(externalList());
    var note = el('div', 'info-card');
    note.style.marginTop = '24px';
    note.innerHTML = '<h3>Why link instead of embed?</h3>' +
      '<p>These are other people’s games on their own servers. Linking to them keeps ' +
      'their analytics, their ads and their rules intact — and it means MiloPlay stays fast ' +
      'and works offline. Everything under “All games” is built into this site and runs locally.</p>';
    wrap.appendChild(note);
    return wrap;
  }

  function viewAbout() {
    var wrap = el('div');
    wrap.appendChild(el('div', 'page-head',
      '<h1>ℹ️ About MiloPlay</h1><p>A free browser arcade with ' + Milo.games.length +
      ' original games.</p>'));
    var c = el('div', 'info-card');
    c.innerHTML =
      '<h3>What this is</h3>' +
      '<p>MiloPlay is a static website — one HTML page, some CSS and some JavaScript. ' +
      'Every game here was written from scratch for this site and runs entirely in your ' +
      'browser. There is no server, no account, no tracking and no ads.</p>' +
      '<h3 style="margin-top:18px">Your data</h3>' +
      '<p>High scores, favourites and your recently-played list are saved in your browser’s ' +
      'own storage. They never leave your device, and clearing your browser data resets them.</p>' +
      '<h3 style="margin-top:18px">Controls</h3>' +
      '<p>Most games work with the arrow keys or WASD, plus the mouse. On phones and tablets ' +
      'an on-screen pad appears automatically. Every game has a fullscreen button.</p>' +
      '<h3 style="margin-top:18px">Works offline</h3>' +
      '<p>Once the page has loaded, you can keep playing without a connection.</p>';
    wrap.appendChild(c);
    return wrap;
  }

  function viewPlay(id) {
    var game = Milo.byId[id];
    if (!game) {
      var e = el('div', 'empty');
      e.innerHTML = '<div class="e">🕳️</div><h3>That game doesn’t exist</h3>' +
        '<p>The link may be out of date.</p>';
      var b = el('button', 'btn btn-primary', 'Browse all games');
      b.type = 'button';
      b.addEventListener('click', function () { go('#/browse'); });
      e.appendChild(b);
      return e;
    }

    var wrap = el('div');

    var crumb = el('button', 'crumb', '← Back to games');
    crumb.type = 'button';
    crumb.addEventListener('click', function () {
      if (history.length > 1) history.back(); else go('#/browse');
    });
    wrap.appendChild(crumb);

    var layout = el('div', 'player-wrap');

    /* left: the game itself */
    var shell = el('div', 'stage-shell');
    var bar = el('div', 'stage-bar');
    bar.innerHTML =
      '<div class="tile" style="' + tileStyle(game) + '"><span class="glyph" style="font-size:17px">' +
      (game.emo || '🎮') + '</span></div>' +
      '<div><div class="n">' + esc(game.title) + '</div>' +
      '<div class="c">' + esc(game.category) + ' · ' + esc(game.tagline || '') + '</div></div>' +
      '<div class="sp"></div>';
    var favBtn = el('button', 'btn btn-sm ' + (isFav(game.id) ? 'btn-primary' : ''),
      (isFav(game.id) ? '♥ Favourited' : '♡ Favourite'));
    favBtn.type = 'button';
    favBtn.addEventListener('click', function () {
      var on = toggleFav(game.id);
      favBtn.className = 'btn btn-sm ' + (on ? 'btn-primary' : '');
      favBtn.textContent = on ? '♥ Favourited' : '♡ Favourite';
    });
    bar.appendChild(favBtn);
    shell.appendChild(bar);

    var stage = el('div', 'stage');
    stage.id = 'stage';
    shell.appendChild(stage);
    layout.appendChild(shell);

    /* right: info panel */
    var side = el('div');

    var about = el('div', 'info-card');
    about.innerHTML = '<h3>How to play</h3><p>' + esc(game.description || game.tagline || '') + '</p>';
    if (game.controls && game.controls.length) {
      var kc = el('div', 'keycaps');
      game.controls.forEach(function (k) { kc.appendChild(el('kbd', null, esc(k))); });
      about.appendChild(kc);
    }
    side.appendChild(about);

    var stats = el('div', 'info-card');
    var best = store.best(game.id);
    stats.innerHTML = '<h3>Stats</h3>' +
      '<div class="kv"><span class="k">Your best</span><span class="v">' +
      (best ? U.fmt(best) + (game.scoreLabel ? ' ' + esc(game.scoreLabel) : '') : '—') + '</span></div>' +
      '<div class="kv"><span class="k">Times played</span><span class="v">' +
      (state.plays[game.id] || 0) + '</span></div>' +
      '<div class="kv"><span class="k">Category</span><span class="v">' + esc(game.category) + '</span></div>';
    side.appendChild(stats);

    if (game.tags.length) {
      var tg = el('div', 'info-card');
      tg.innerHTML = '<h3>Tags</h3>';
      var row = el('div', 'tag-row');
      game.tags.forEach(function (t) {
        var s = el('span', 'tag', esc(t));
        s.addEventListener('click', function () {
          $('#q').value = t;
          go('#/search/' + encodeURIComponent(t));
        });
        row.appendChild(s);
      });
      tg.appendChild(row);
      side.appendChild(tg);
    }

    layout.appendChild(side);
    wrap.appendChild(layout);

    /* related */
    var related = Milo.games.filter(function (x) {
      return x.id !== game.id && (x.category === game.category ||
        x.tags.some(function (t) { return game.tags.indexOf(t) !== -1; }));
    }).slice(0, 8);
    if (!related.length) related = Milo.games.filter(function (x) { return x.id !== game.id; }).slice(0, 8);
    var rs = section('More like this', '🎯', related);
    if (rs) { rs.style.marginTop = '30px'; wrap.appendChild(rs); }

    // Mount after the node is in the document so the stage has a real size.
    requestAnimationFrame(function () {
      if (!document.body.contains(stage)) return;
      try {
        current = game.mount(stage, Milo);
      } catch (err) {
        stage.innerHTML = '<div style="color:#fff;padding:30px;text-align:center;font-family:var(--font)">' +
          '<div style="font-size:2.4rem">😵</div><h3>This game failed to start</h3>' +
          '<p style="color:#9aa3d0;font-size:.9rem">' + esc(err && err.message) + '</p></div>';
      }
    });

    return wrap;
  }

  /* --------------------------------------------------------------- router */

  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean).map(decodeURIComponent);
    if (!parts.length) return { name: 'home' };
    switch (parts[0]) {
      case 'play': return { name: 'play', id: parts[1] };
      case 'browse': return { name: 'browse' };
      case 'c': return { name: 'browse', cat: parts[1] };
      case 'favorites': case 'favourites': return { name: 'favorites' };
      case 'recent': return { name: 'recent' };
      case 'search': return { name: 'search', q: parts.slice(1).join('/') };
      case 'elsewhere': return { name: 'elsewhere' };
      case 'about': return { name: 'about' };
      default: return { name: 'home' };
    }
  }

  function render() {
    if (current) { try { current.destroy(); } catch (e) { } current = null; }

    // A game may have grabbed the pointer or gone fullscreen. Neither should
    // survive a navigation, and a destroy that threw may not have undone them.
    if (document.pointerLockElement) { try { document.exitPointerLock(); } catch (e) { } }
    if (document.fullscreenElement) { document.exitFullscreen().catch(function () { }); }

    var r = state.route = parseHash();
    var main = $('#main');
    var view;

    switch (r.name) {
      case 'play': view = viewPlay(r.id); break;
      case 'browse': view = viewBrowse(r.cat); break;
      case 'favorites':
        view = viewList('Favourites', '❤️',
          state.favs.map(function (id) { return Milo.byId[id]; }).filter(Boolean),
          'Tap the heart on any game to save it here.');
        break;
      case 'recent':
        view = viewList('Recently played', '🕘',
          state.recent.map(function (id) { return Milo.byId[id]; }).filter(Boolean),
          'Games you play will show up here.');
        break;
      case 'search': view = viewSearch(r.q || ''); break;
      case 'elsewhere': view = viewElsewhere(); break;
      case 'about': view = viewAbout(); break;
      default: view = viewHome();
    }

    main.innerHTML = '';
    main.appendChild(view);
    renderSidebar();
    closeSidebar();

    document.title = titleFor(r);
    if (r.name !== 'play') window.scrollTo(0, 0);
  }

  function titleFor(r) {
    var base = 'MiloPlay — free browser games';
    if (r.name === 'play' && Milo.byId[r.id]) return Milo.byId[r.id].title + ' · MiloPlay';
    if (r.name === 'browse' && r.cat) return r.cat + ' games · MiloPlay';
    if (r.name === 'browse') return 'All games · MiloPlay';
    if (r.name === 'search') return 'Search · MiloPlay';
    return base;
  }

  /* ------------------------------------------------------- global events */

  document.addEventListener('click', function (e) {
    var fav = e.target.closest('[data-fav]');
    if (fav) {
      e.preventDefault(); e.stopPropagation();
      var on = toggleFav(fav.dataset.fav);
      fav.classList.toggle('on', on);
      fav.textContent = on ? '♥' : '♡';
      return;
    }
    var play = e.target.closest('[data-play]');
    if (play) { go('#/play/' + encodeURIComponent(play.dataset.play)); return; }

    var nav = e.target.closest('[data-go]');
    if (nav) { go(nav.dataset.go); return; }

    if (e.target.closest('[data-random]')) {
      go('#/play/' + encodeURIComponent(U.choice(Milo.games).id));
      return;
    }
  });

  /* --------------------------------------------------------------- search */

  function setupSearch() {
    var box = $('#search');
    var input = $('#q');
    var sug = $('#suggest');
    var idx = -1;
    var items = [];

    function close() { sug.classList.remove('open'); idx = -1; }

    function open(list) {
      items = list.slice(0, 8);
      if (!items.length) {
        sug.innerHTML = '<div class="suggest-empty">No games matched. Try “puzzle” or “race”.</div>';
        sug.classList.add('open');
        return;
      }
      sug.innerHTML = items.map(function (gm, i) {
        return '<button class="suggest-item' + (i === idx ? ' active' : '') + '" data-play="' +
          esc(gm.id) + '">' +
          '<span class="tile" style="' + tileStyle(gm) + '">' + (gm.emo || '🎮') + '</span>' +
          '<span><span class="t">' + esc(gm.title) + '</span><br>' +
          '<span class="c">' + esc(gm.category) + ' · ' + esc(gm.tagline || '') + '</span></span>' +
          '</button>';
      }).join('');
      sug.classList.add('open');
    }

    input.addEventListener('input', function () {
      state.query = input.value;
      box.classList.toggle('has-value', !!input.value);
      idx = -1;
      if (!input.value.trim()) { close(); return; }
      open(search(input.value));
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (!items.length) return;
        e.preventDefault();
        idx = (idx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        $$('.suggest-item', sug).forEach(function (n, i) { n.classList.toggle('active', i === idx); });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (idx >= 0 && items[idx]) { go('#/play/' + encodeURIComponent(items[idx].id)); }
        else if (input.value.trim()) { go('#/search/' + encodeURIComponent(input.value.trim())); }
        close(); input.blur();
      } else if (e.key === 'Escape') { close(); input.blur(); }
    });

    $('#s-clear').addEventListener('click', function () {
      input.value = ''; box.classList.remove('has-value'); close(); input.focus();
    });

    document.addEventListener('click', function (e) {
      if (!box.contains(e.target)) close();
    });

    // "/" focuses search from anywhere that isn't already a text field.
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== input &&
        !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
        e.preventDefault(); input.focus(); input.select();
      }
    });
  }

  /* ---------------------------------------------------------------- theme */

  function setupTheme() {
    var saved = store.get('theme', null);
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    var btn = $('#theme');
    function icon() {
      var dark = document.documentElement.getAttribute('data-theme') !== 'light';
      btn.textContent = dark ? '🌙' : '☀️';
    }
    icon();
    btn.addEventListener('click', function () {
      var dark = document.documentElement.getAttribute('data-theme') !== 'light';
      var next = dark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      store.set('theme', next);
      icon();
    });
  }

  /* -------------------------------------------------------------- sidebar */

  function openSidebar() { $('#sidebar').classList.add('open'); $('#scrim').classList.add('on'); }
  function closeSidebar() { $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('on'); }

  /* ----------------------------------------------------------------- boot */

  function boot() {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      document.body.classList.add('touch');
    }
    setupTheme();
    setupSearch();
    $('#menu').addEventListener('click', openSidebar);
    $('#scrim').addEventListener('click', closeSidebar);
    $('#sidenav').addEventListener('click', function (e) {
      var b = e.target.closest('[data-go]');
      if (b) go(b.dataset.go);
    });
    window.addEventListener('hashchange', render);
    render();
    $('#boot').remove();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
