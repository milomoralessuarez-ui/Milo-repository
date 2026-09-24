/* MiloPlay service worker — makes the whole site playable offline.
   Bump CACHE when assets change; old caches are cleaned up on activate. */
const CACHE = 'miloplay-v2';

const GAMES = [
// GAMES:BEGIN
  'acronym-quiz', 'aim-trainer', 'air-hockey', 'alien-swarm', 'amazons', 'anagram-hunt',
  'ant-colony', 'archery', 'arrow-storm', 'asteroid-field', 'astro-blaster', 'backgammon',
  'badminton', 'balance-tower', 'ball-blast', 'ball-maze', 'balloon-pop', 'barrel-climb',
  'basket-fall', 'batting-cage', 'battleship', 'beat-drop', 'bike-courier', 'binary-puzzle',
  'blackjack', 'blast-arena', 'blob-eater', 'block-stacker', 'blockcraft', 'boat-race',
  'bomb-catcher', 'bowling', 'box-fort', 'box-push', 'boxing-ring', 'brick-breaker',
  'bridges-hashi', 'bubble-pop', 'bubble-shooter', 'bubble-trap', 'bug-blaster', 'burger-boss',
  'burrow-blast', 'cannon-golf', 'cannon-siege', 'casino-cards', 'castle-raid', 'cave-flyer',
  'centipede-strike', 'checkers', 'chess-blitz', 'city-idle', 'claw-machine', 'clicker-pack',
  'coin-tycoon', 'color-flood', 'color-rush', 'connect-four', 'conquest', 'crazy-eights',
  'cribbage', 'crossword-mini', 'crystal-caverns', 'cube-hopper', 'curling', 'dance-arrows',
  'darts', 'dash-runner', 'domino-run', 'dominoes', 'dot-connect', 'dots-and-boxes',
  'drag-racer', 'drum-echo', 'dungeon-dash', 'durak', 'emoji-riddles', 'euchre',
  'factory-lines', 'farm-idle', 'fencing-duel', 'flap-rocket', 'fling-fortress', 'flip-bottle',
  'floor-is-lava', 'free-kick', 'freecell', 'frost-peak', 'fruit-slice', 'futoshiki', 'g2048',
  'galaxy-raid', 'gem-swap', 'ghost-escape', 'ghost-manor', 'gin-rummy', 'go-fish', 'go-mini',
  'goblin-gates', 'golf-blast', 'golf-solitaire', 'gomoku', 'gravity-swap', 'halma', 'hangman',
  'hearts', 'helix-drop', 'hex-game', 'high-jump', 'highway-rush', 'hnefatafl', 'hole-eater',
  'honeycomb-words', 'hoop-shot', 'hover-bike', 'hover-pod', 'ice-breaker', 'ice-racer',
  'ice-slide', 'javelin-throw', 'jigsaw-pack', 'juggle-master', 'jump-quest', 'kart-sprint',
  'key-quest', 'kitchen-climb', 'klondike', 'knife-throw', 'knight-tour', 'laser-dodge',
  'laser-duel', 'laser-limbo', 'laser-maze', 'lava-run', 'lemonade-stand', 'letter-drop',
  'lights-out', 'lines-of-action', 'logic-pack', 'lunar-lander', 'magnet-boots', 'make-24',
  'mancala', 'mastermind', 'math-blitz', 'math-pack', 'maze-muncher', 'maze-runner',
  'mech-storm', 'memory-match', 'memory-pack', 'memory-sequence', 'merge-drop', 'meteor-miner',
  'meteor-surf', 'mine-magnate', 'minesweeper', 'mini-golf', 'missile-defense',
  'missing-vowels', 'monster-truck', 'moto-hill', 'neon-snake', 'night-rider', 'nim',
  'nine-mens-morris', 'ninja-climb', 'ninja-slice', 'nonogram', 'number-link', 'odd-one-out',
  'oh-hell', 'one-line', 'onitama', 'orbital-defense', 'ostrich-knights', 'paddle-pair',
  'paint-wars', 'pancake-pile', 'paper-claim', 'paper-planes', 'parking-draw', 'peg-solitaire',
  'penalty-shootout', 'perfect-circle', 'perfect-slice', 'pet-hotel', 'photon-cycles',
  'piano-tap', 'pinball', 'pipe-panic', 'pit-stop', 'plinko', 'pogo-bounce', 'polly-track',
  'pong-duel', 'power-plant', 'pyramid-solitaire', 'queens-eight', 'quick-draw', 'quick-math',
  'quiz-pack-1', 'quiz-pack-2', 'quiz-pack-3', 'quoridor', 'ragdoll-launch', 'rally-stage',
  'reaction-time', 'reversi', 'rhyme-time', 'rhythm-tap', 'rise-up', 'river-raft',
  'road-hopper', 'roll-block', 'rolling-ball', 'rooftop-run', 'rope-cut', 'rotate-rings',
  'rowing-sprint', 'rummy-500', 'shadow-leap', 'shark-escape', 'show-jumping', 'simon-says',
  'skate-park', 'ski-slalom', 'sky-ace', 'sky-hopper', 'slide-puzzle', 'slingshot-stars',
  'snake-royale', 'snowboard-pipe', 'solitaire-pack', 'space-defender', 'space-farm',
  'space-trader', 'spades', 'spider-solitaire', 'spike-dash', 'spot-difference',
  'spring-heights', 'stack-ball', 'star-battle', 'star-gate', 'stick-bridge', 'storm-chaser',
  'stroop-rush', 'stunt-jump', 'submarine-strike', 'sudoku', 'sudoku-mines-pack', 'sumo-push',
  'sweet-match', 'sword-storm', 'table-tennis', 'tangram-fit', 'tank-arena', 'tempo-tap',
  'terra-dig', 'tic-tac-toe', 'tile-match', 'time-attack', 'tower-defence', 'tower-of-hanoi',
  'tower-stack', 'traffic-control', 'trivia-ladder', 'truck-haul', 'true-false-blitz',
  'tunnel-digger', 'tunnel-rush', 'turbo-drift', 'turret-tower', 'typing-pack', 'typing-test',
  'ultimate-ttt', 'unblock-car', 'velodrome-dash', 'video-poker', 'vine-swing',
  'volcano-escape', 'volleyball-blobs', 'wall-jumper', 'war-cards', 'water-sort',
  'whack-a-mole', 'wind-glider', 'word-grid', 'word-guess', 'word-ladder', 'word-search',
  'word-search-pack', 'word-sleuth', 'wrecking-ball', 'zig-zag', 'zombie-siege'
// GAMES:END
];

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/style.css',
  './assets/js/engine.js',
  './assets/js/lib/cards.js',
  './assets/js/lib/words.js',
  './assets/js/lib/racing.js',
  './assets/js/variants.js',
  './assets/js/app.js',
  ...GAMES.map((g) => `./assets/js/games/${g}.js`)
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // Individual failures must not abort the whole install.
      .then((c) => Promise.allSettled(ASSETS.map((a) => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // let fonts etc. go to the network

  // Navigations: try the network first so a redeploy is picked up immediately,
  // and fall back to the cached shell when offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // Assets: serve from cache, refreshing it in the background.
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
