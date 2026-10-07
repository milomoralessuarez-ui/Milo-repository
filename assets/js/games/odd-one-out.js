/* Odd One Out — three belong together, one does not, and the reason matters. */
(function () {
  'use strict';

  /* Every set is [odd one, three that belong, the reason]. The odd one is
     always written first here and shuffled into place at run time. Reasons are
     hand-written and checked — the point of the game is the sentence you get
     back, not the guess. */

  var EASY = [
    ['Carrot', 'Apple', 'Banana', 'Orange', 'A carrot is a root vegetable. The other three are fruit.'],
    ['Whale', 'Salmon', 'Tuna', 'Shark', 'A whale is a mammal that breathes air. Salmon, tuna and sharks are all fish with gills.'],
    ['Trumpet', 'Violin', 'Cello', 'Guitar', 'The trumpet is brass. The others are string instruments, bowed or plucked.'],
    ['Spider', 'Ant', 'Bee', 'Beetle', 'A spider is an arachnid with eight legs. The others are insects with six.'],
    ['Orange', 'Red', 'Blue', 'Yellow', 'Orange is a secondary colour, mixed from red and yellow. The others are the traditional primaries.'],
    ['Jupiter', 'Mercury', 'Venus', 'Mars', 'Jupiter is a gas giant. Mercury, Venus and Mars are the small rocky inner planets.'],
    ['Sun', 'Earth', 'Mars', 'Venus', 'The Sun is a star. The other three are planets that orbit it.'],
    ['Triangle', 'Square', 'Rectangle', 'Rhombus', 'A triangle has three sides. The others are quadrilaterals with four.'],
    ['Copper', 'Oxygen', 'Nitrogen', 'Hydrogen', 'Copper is a solid metal. The others are gases at room temperature.'],
    ['Penguin', 'Eagle', 'Sparrow', 'Robin', 'All four are birds, but the penguin cannot fly — its wings are flippers.'],
    ['Bat', 'Eagle', 'Owl', 'Sparrow', 'A bat is a flying mammal with fur. The others are birds with feathers.'],
    ['Tokyo', 'Paris', 'Rome', 'Madrid', 'Tokyo is in Asia. Paris, Rome and Madrid are European capitals.'],
    ['Sydney', 'Canberra', 'Ottawa', 'Oslo', 'Sydney is not a capital city — Australia’s capital is Canberra.'],
    ['Bronze', 'Gold', 'Silver', 'Platinum', 'Bronze is an alloy of copper and tin. The others are pure chemical elements.'],
    ['Guitar', 'Drum', 'Tambourine', 'Cymbal', 'The guitar has strings. The other three are percussion — you hit or shake them.'],
    ['Potato', 'Lettuce', 'Spinach', 'Cabbage', 'A potato is a tuber grown underground. The others are leaves.'],
    ['Shark', 'Dolphin', 'Whale', 'Seal', 'The shark is a fish. Dolphins, whales and seals are mammals that surface to breathe.'],
    ['Pearl', 'Ruby', 'Emerald', 'Sapphire', 'A pearl is grown inside a living oyster. The others are minerals dug out of rock.'],
    ['Everest', 'Amazon', 'Nile', 'Danube', 'Everest is a mountain. The other three are rivers.'],
    ['February', 'April', 'June', 'September', 'April, June and September all have 30 days. February has 28, or 29 in a leap year.'],
    ['Sunday', 'Monday', 'Wednesday', 'Friday', 'Sunday is a weekend day. The others fall in the working week.'],
    ['Square', 'Circle', 'Oval', 'Ellipse', 'A square is made of straight lines and corners. The others are closed curves.'],
    ['Brazil', 'Kenya', 'Egypt', 'Nigeria', 'Brazil is in South America. Kenya, Egypt and Nigeria are African countries.'],
    ['Violin', 'Flute', 'Clarinet', 'Oboe', 'The violin is a string instrument. The others are woodwind — you blow them.'],
    ['Football', 'Chess', 'Draughts', 'Backgammon', 'Football is a physical sport. The others are board games played sitting down.'],
    ['Wolf', 'Lion', 'Tiger', 'Leopard', 'A wolf is a member of the dog family. The others are big cats.'],
    ['Lentil', 'Wheat', 'Barley', 'Oats', 'A lentil is a pulse from a pod. Wheat, barley and oats are cereal grains.'],
    ['Pencil', 'Hammer', 'Saw', 'Screwdriver', 'A pencil is for writing. The other three are tools for building things.'],
    ['Snake', 'Lizard', 'Crocodile', 'Turtle', 'All four are reptiles, but only the snake has no legs at all.'],
    ['Butterfly', 'Bee', 'Wasp', 'Hornet', 'Bees, wasps and hornets can sting you. A butterfly has no sting.'],
    ['Oak', 'Pine', 'Spruce', 'Fir', 'The oak is a broadleaf that drops its leaves. The others are evergreen conifers with cones.'],
    ['Zero', 'One', 'Three', 'Five', 'Zero is an even number. One, three and five are odd.'],
    ['Nine', 'Two', 'Three', 'Five', 'Nine divides by three, so it is not prime. The others are prime numbers.'],
    ['Bicycle', 'Car', 'Bus', 'Lorry', 'A bicycle has no engine — it runs on legs.'],
    ['Helicopter', 'Car', 'Bus', 'Train', 'The helicopter is the only one that leaves the ground.'],
    ['Mediterranean', 'Atlantic', 'Pacific', 'Indian', 'The Mediterranean is a sea almost enclosed by land. The others are oceans.'],
    ['Bread', 'Milk', 'Butter', 'Cheese', 'Bread is baked from grain. Milk, butter and cheese are dairy.'],
    ['Mercury', 'Iron', 'Copper', 'Gold', 'Mercury is liquid at room temperature. The other metals are solid.'],
    ['Saxophone', 'Trumpet', 'Trombone', 'Tuba', 'The saxophone is woodwind — it sounds through a reed. The others are brass, buzzed with the lips.'],
    ['Pluto', 'Mars', 'Venus', 'Neptune', 'Pluto was reclassified as a dwarf planet in 2006. The others are still full planets.'],
    ['Mount Rushmore', 'Mount Fuji', 'Mount Etna', 'Mount Vesuvius', 'Fuji, Etna and Vesuvius are volcanoes. Rushmore is a granite cliff carved into faces.'],
    ['Blue whale', 'Elephant', 'Giraffe', 'Hippopotamus', 'The blue whale lives entirely at sea. The others are land animals.']
  ];

  var MEDIUM = [
    ['New York', 'Washington DC', 'Ottawa', 'Mexico City', 'New York is not a capital city, however big it is.'],
    ['Rio de Janeiro', 'Brasilia', 'Lima', 'Santiago', 'Rio lost capital status in 1960 when Brasilia was built to replace it.'],
    ['Portugal', 'Austria', 'Switzerland', 'Hungary', 'Portugal has a long Atlantic coast. The other three are landlocked.'],
    ['Greenland', 'Cuba', 'Madagascar', 'Sri Lanka', 'Greenland is a self-governing part of Denmark. The others are independent island countries.'],
    ['Mont Blanc', 'Everest', 'K2', 'Kangchenjunga', 'Mont Blanc is in the Alps. The others are in the Himalaya and Karakoram, and all top 8,000 metres.'],
    ['German', 'Spanish', 'French', 'Italian', 'German is a Germanic language. The others descend from Latin.'],
    ['Estonia', 'Sweden', 'Norway', 'Denmark', 'Estonia is a Baltic state. The other three are Scandinavian.'],
    ['Bach', 'Mozart', 'Beethoven', 'Schubert', 'Bach was a Baroque composer who died in 1750. The others all worked in Vienna decades later.'],
    ['Oxygen', 'Helium', 'Neon', 'Argon', 'Oxygen reacts with almost everything. Helium, neon and argon are noble gases that barely react at all.'],
    ['Quartz', 'Diamond', 'Graphite', 'Charcoal', 'Quartz is silicon dioxide. Diamond, graphite and charcoal are all pure carbon.'],
    ['Tomato', 'Carrot', 'Potato', 'Onion', 'A tomato is botanically a fruit — seeds and all. The others are roots and bulbs.'],
    ['Peanut', 'Almond', 'Walnut', 'Pecan', 'A peanut is a legume that ripens underground. The others grow on trees.'],
    ['Rabbit', 'Rat', 'Mouse', 'Squirrel', 'A rabbit is a lagomorph with a second pair of small front teeth. The others are rodents.'],
    ['Dingo', 'Kangaroo', 'Koala', 'Wombat', 'The dingo is a placental mammal brought to Australia by people. The others are marsupials with pouches.'],
    ['Venus', 'Mars', 'Jupiter', 'Saturn', 'Venus rotates backwards, so its sun rises in the west.'],
    ['Volga', 'Nile', 'Amazon', 'Mississippi', 'The Volga drains into the landlocked Caspian Sea. The others reach an ocean.'],
    ['Amazon', 'Sahara', 'Gobi', 'Kalahari', 'The Amazon is rainforest. The other three are deserts.'],
    ['Nitrogen', 'Chlorine', 'Fluorine', 'Iodine', 'Chlorine, fluorine and iodine are halogens in group 17. Nitrogen is not.'],
    ['Cricket', 'Baseball', 'Rounders', 'Softball', 'Cricket is played up and down between two wickets. The others run round a diamond of bases.'],
    ['Marathon', 'Sprint', 'Hurdles', 'Relay', 'The marathon is run on roads. The others are track events inside the stadium.'],
    ['Wimbledon', 'French Open', 'US Open', 'Australian Open', 'Wimbledon is the only Grand Slam still played on grass.'],
    ['Basketball', 'Volleyball', 'Tennis', 'Badminton', 'Basketball has no net dividing the two sides.'],
    ['Backgammon', 'Chess', 'Draughts', 'Go', 'Backgammon uses dice. The others are games of pure skill with no luck in them.'],
    ['Switzerland', 'France', 'Germany', 'Italy', 'Switzerland is not a member of the European Union.'],
    ['Hawaii', 'Alaska', 'Texas', 'Florida', 'Hawaii is the only US state that is not attached to North America at all.'],
    ['Eagle', 'Ostrich', 'Emu', 'Kiwi', 'The eagle flies. Ostriches, emus and kiwis are flightless.'],
    ['Earth', 'Mercury', 'Venus', 'Mars', 'Earth is the only one with liquid water standing on its surface.'],
    ['Titanium', 'Iron', 'Nickel', 'Cobalt', 'Iron, nickel and cobalt are the three metals that are magnetic at room temperature. Titanium is not.'],
    ['Glass', 'Steel', 'Copper', 'Aluminium', 'Glass is an insulator. The others are metals that conduct electricity.'],
    ['Whale shark', 'Great white', 'Hammerhead', 'Tiger shark', 'The whale shark filters plankton with its mouth open. The others hunt and bite.'],
    ['Rome', 'Paris', 'London', 'Madrid', 'Rome has an entire independent country inside it — Vatican City.'],
    ['Turkey', 'Greece', 'Italy', 'Spain', 'Turkey straddles two continents, with Istanbul sitting in both Europe and Asia.'],
    ['Alaska', 'California', 'Oregon', 'Washington', 'Alaska does not touch another US state.'],
    ['Bamboo', 'Oak', 'Maple', 'Birch', 'Bamboo is a giant grass, not a tree — it has no wood rings.'],
    ['Banana', 'Apple', 'Pear', 'Cherry', 'Bananas grow on a giant herb with no woody trunk. The others grow on trees.'],
    ['Honey', 'Sugar', 'Maple syrup', 'Molasses', 'Honey is made by animals. The other sweeteners all come straight from plants.'],
    ['Greece', 'Egypt', 'Mexico', 'Peru', 'Egypt, Mexico and Peru all built pyramids. Greece built columns instead.'],
    ['Braille', 'Morse code', 'Semaphore', 'Smoke signals', 'Braille is read with the fingertips. The others are seen or heard.'],
    ['Piano', 'Harp', 'Guitar', 'Violin', 'All four have strings, but the piano’s are struck by hammers rather than plucked or bowed.'],
    ['Clarinet', 'Flute', 'Recorder', 'Piccolo', 'The clarinet sounds through a reed. The others are blown across or into an edge.']
  ];

  var HARD = [
    ['Vitamin C', 'Vitamin A', 'Vitamin D', 'Vitamin E', 'Vitamin C is water-soluble and flushed out daily. A, D and E are stored in body fat.'],
    ['Saturn', 'Jupiter', 'Uranus', 'Neptune', 'Saturn is less dense than water — drop it in a big enough ocean and it would float.'],
    ['Tungsten', 'Gold', 'Silver', 'Copper', 'Gold, silver and copper sit together in group 11 of the periodic table. Tungsten does not.'],
    ['Hummingbird', 'Swallow', 'Swift', 'Falcon', 'Only the hummingbird can fly backwards.'],
    ['Cucumber', 'Potato', 'Tomato', 'Aubergine', 'Cucumber is a gourd. Potato, tomato and aubergine are all nightshades.'],
    ['Iceland', 'Japan', 'Indonesia', 'Chile', 'Iceland sits on the Mid-Atlantic Ridge. The other three are on the Pacific Ring of Fire.'],
    ['Mandarin', 'Spanish', 'Hindi', 'English', 'Mandarin is written in characters rather than an alphabet.'],
    ['Greek', 'Russian', 'Bulgarian', 'Serbian', 'Russian, Bulgarian and Serbian use the Cyrillic alphabet. Greek has an alphabet of its own.'],
    ['Hungary', 'Poland', 'Czech Republic', 'Slovakia', 'Hungarian is not a Slavic language — it is not even Indo-European.'],
    ['Great Pyramid', 'Colossus of Rhodes', 'Hanging Gardens', 'Pharos of Alexandria', 'The Great Pyramid is the only one of the seven ancient wonders still standing.'],
    ['Helium', 'Hydrogen', 'Oxygen', 'Nitrogen', 'Hydrogen, oxygen and nitrogen go round in pairs as H2, O2 and N2. Helium floats about as single atoms.'],
    ['Bromine', 'Mercury', 'Gallium', 'Caesium', 'Mercury, gallium and caesium are metals that melt at or near room temperature. Bromine is a liquid non-metal.'],
    ['Lima', 'Quito', 'Bogota', 'La Paz', 'Lima sits on the coast at sea level. The others are high in the Andes.'],
    ['Wellington', 'Canberra', 'Brasilia', 'Washington DC', 'Canberra, Brasilia and Washington were all built from scratch to be capitals. Wellington was already a town.'],
    ['Arctic', 'Pacific', 'Atlantic', 'Indian', 'The Arctic is the one ocean with a permanent lid of sea ice.'],
    ['Yuri Gagarin', 'Neil Armstrong', 'Buzz Aldrin', 'Michael Collins', 'Armstrong, Aldrin and Collins flew Apollo 11 together. Gagarin was the first Soviet cosmonaut in orbit.'],
    ['Moon', 'Mars', 'Venus', 'Titan', 'Human beings have walked on the Moon. The others have only ever been visited by robots.'],
    ['Halley’s Comet', 'Ceres', 'Vesta', 'Pallas', 'Ceres, Vesta and Pallas are asteroids in the main belt. Halley is a comet on a long loop.'],
    ['Sound', 'Light', 'Radio waves', 'X-rays', 'Sound needs air or water to travel through. The others are electromagnetic waves and cross empty space.'],
    ['Graphite', 'Diamond', 'Rubber', 'Glass', 'Graphite conducts electricity. The other three are insulators.'],
    ['Antarctica', 'Africa', 'Australia', 'South America', 'Antarctica has no countries and no permanent population.'],
    ['Nepal', 'Japan', 'Iceland', 'Sri Lanka', 'Nepal is landlocked between India and Tibet. The others are islands.'],
    ['Golf', 'Baseball', 'Cricket', 'Tennis', 'In golf the ball is sitting still when you hit it. In the others it is moving.'],
    ['Skiing', 'Ice hockey', 'Figure skating', 'Curling', 'Skiing happens on snow. The other three are played on ice.'],
    ['Paris-Roubaix', 'Tour de France', 'Giro d’Italia', 'Vuelta a España', 'Paris-Roubaix is a one-day classic. The others are three-week grand tours.'],
    ['Squash', 'Tennis', 'Badminton', 'Table tennis', 'Squash is played against a wall. The others are played across a net.'],
    ['Trombone', 'Trumpet', 'French horn', 'Tuba', 'The trombone changes note with a sliding tube. The others use valves.'],
    ['Double bass', 'Violin', 'Viola', 'Cello', 'The double bass is tuned in fourths and comes from the viol family. The other three are tuned in fifths.'],
    ['Organ', 'Piano', 'Harpsichord', 'Clavichord', 'The organ makes its sound with columns of air. The others are keyboards with strings inside.'],
    ['Earth', 'Mars', 'Venus', 'Neptune', 'Earth is the only planet not named after a Greek or Roman god.'],
    ['Sponge', 'Coral', 'Jellyfish', 'Starfish', 'A sponge has no nerve cells whatsoever. The others all have at least a nerve net.'],
    ['Platypus', 'Kangaroo', 'Dolphin', 'Bat', 'The platypus lays eggs. The other three mammals give birth to live young.']
  ];

  var FIENDISH = [
    ['Cat', 'Orange', 'Silver', 'Purple', 'Orange, silver and purple are famously hard to rhyme. Cat rhymes with half the dictionary.'],
    ['Lake Michigan', 'Lake Ontario', 'Lake Erie', 'Lake Huron', 'Ontario, Erie and Huron all have a Canadian shore. Michigan is the only Great Lake entirely inside the United States.'],
    ['Banana', 'Almost', 'Biopsy', 'Chintz', 'Almost, biopsy and chintz have every letter in alphabetical order. Banana does not.'],
    ['Education', 'Facetious', 'Abstemious', 'Arsenious', 'Facetious, abstemious and arsenious contain a, e, i, o and u exactly once, in order.'],
    ['Dessert', 'Racecar', 'Level', 'Rotor', 'Racecar, level and rotor read the same backwards. Dessert backwards is stressed.'],
    ['Pupil', 'Iris', 'Cornea', 'Retina', 'All four are parts of the eye, but only pupil is also a word for a schoolchild.'],
    ['Mercury', 'Mars', 'Neptune', 'Saturn', 'All four are planets, but only Mercury is also a chemical element.'],
    ['Maine', 'Ohio', 'Iowa', 'Utah', 'Ohio, Iowa and Utah are the only US states with four-letter names.'],
    ['Four', 'One', 'Two', 'Three', 'Four is the only number in English whose name has exactly as many letters as its value.'],
    ['Twenty-four', 'Sixteen', 'Twenty-five', 'Thirty-six', '16, 25 and 36 are perfect squares. 24 is not.'],
    ['W', 'H', 'K', 'Q', 'W is the only letter of the English alphabet whose name has more than one syllable.'],
    ['May', 'January', 'February', 'June', 'May is the only month whose name is three letters long.'],
    ['Rowing', 'Running', 'Cycling', 'Swimming', 'Rowers race backwards, facing away from the finish line.'],
    ['Sister', 'Listen', 'Silent', 'Tinsel', 'Listen, silent and tinsel are anagrams of one another. Sister is not.'],
    ['Carbon', 'Iron', 'Lead', 'Gold', 'Iron, lead and gold take their symbols from Latin — Fe, Pb and Au. Carbon is simply C.'],
    ['Uranus', 'Mercury', 'Venus', 'Mars', 'Uranus keeps its Greek name. The others were renamed by the Romans.'],
    ['Tuesday', 'Monday', 'Saturday', 'Sunday', 'Monday, Saturday and Sunday are named after the Moon, Saturn and the Sun. Tuesday is named after the Norse god Tiw.'],
    ['Amethyst', 'Ruby', 'Sapphire', 'Emerald', 'Ruby, sapphire and emerald are the classic precious stones. Amethyst is a purple quartz, and semi-precious.'],
    ['Tortoise', 'Frog', 'Newt', 'Salamander', 'Frogs, newts and salamanders are amphibians that start life in water. A tortoise is a reptile.'],
    ['Hexagon', 'Cube', 'Pyramid', 'Sphere', 'A hexagon is flat. The other three are solids you can hold.'],
    ['Cello', 'Trumpet', 'Clarinet', 'Flute', 'The cello is the only one you cannot play while standing up and marching.'],
    ['Nitrogen', 'Argon', 'Krypton', 'Xenon', 'Argon, krypton and xenon are noble gases used to fill lamps. Nitrogen is not noble at all.'],
    ['Lightning', 'Thunder', 'Echo', 'Sonic boom', 'Thunder, echoes and sonic booms are all sound. Lightning is light.'],
    ['Tomato ketchup', 'Mayonnaise', 'Aioli', 'Hollandaise', 'Mayonnaise, aioli and hollandaise are emulsions built on egg yolk. Ketchup has no egg in it.']
  ];

  var TIERS = [EASY, MEDIUM, HARD, FIENDISH];
  var TIER_NAMES = ['warm-up', 'tricky', 'hard', 'fiendish'];
  var LIVES = 3;

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var els = null, timers = [];

    function later(fn, ms) {
      var t = setTimeout(function () {
        var i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); fn();
      }, ms);
      timers.push(t);
      return t;
    }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    /* --------------------------------------------------------------- DOM */

    function build(g) {
      var root = g.root;
      root.innerHTML = '';
      var style = document.createElement('style');
      style.textContent = [
        '.oo-wrap{display:flex;flex-direction:column;align-items:center;gap:12px;position:relative;',
        'font-family:Outfit,sans-serif;width:100%;max-width:520px;margin:auto;',
        'user-select:none;-webkit-user-select:none}',
        '.oo-head{display:flex;flex-direction:column;align-items:center;gap:3px}',
        '.oo-q{font:900 clamp(19px,5vw,27px)/1.15 Outfit,sans-serif;color:#fff4e6;',
        'text-shadow:0 0 20px rgba(249,115,22,.55)}',
        '.oo-sub{font-size:.7rem;letter-spacing:.22em;text-transform:uppercase;color:#f6b17a;font-weight:800}',
        '.oo-bar{width:100%;height:9px;border-radius:6px;background:#3d1f0c;overflow:hidden}',
        '.oo-bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#fbbf24,#f97316)}',
        '.oo-bar i.low{background:linear-gradient(90deg,#f43f5e,#fb7185)}',
        '.oo-opts{display:grid;grid-template-columns:1fr 1fr;gap:9px;width:100%}',
        '.oo-o{position:relative;border:2px solid #7c3a14;background:#40200c;color:#ffeede;border-radius:14px;',
        'padding:15px 8px 13px;font:800 clamp(14px,3.9vw,19px)/1.15 Outfit,sans-serif;cursor:pointer;',
        'transition:transform .1s,background .15s,border-color .15s;min-height:56px}',
        '.oo-o span{position:absolute;top:5px;left:9px;font-size:.6rem;color:#d9924f;font-weight:700}',
        '.oo-o:hover{background:#55290f}',
        '.oo-o:active{transform:scale(.97)}',
        '.oo-o.right{background:#15653f;border-color:#34d399;color:#eafff4}',
        '.oo-o.wrong{background:#73182f;border-color:#fb7185;color:#ffe9ee}',
        '.oo-o.dim{opacity:.4}',
        '.oo-why{min-height:58px;width:100%;border-radius:12px;padding:10px 12px;',
        'background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);',
        'font:600 clamp(12px,3.3vw,15px)/1.4 Outfit,sans-serif;color:#ffe9d2;text-align:center;',
        'display:flex;align-items:center;justify-content:center;transition:background .2s}',
        '.oo-why.good{background:rgba(52,211,153,.14);border-color:rgba(52,211,153,.4)}',
        '.oo-why.bad{background:rgba(251,113,133,.14);border-color:rgba(251,113,133,.4)}',
        '.oo-why b{color:#fde68a}',
        '.oo-foot{display:flex;justify-content:space-between;width:100%;font-size:.76rem;color:#e0a879}',
        '.oo-foot b{color:#fde68a}',
        '.oo-sp{position:absolute;width:7px;height:7px;border-radius:50%;pointer-events:none;',
        'animation:ooSp 1s ease-out forwards}',
        '@keyframes ooSp{0%{transform:translate(0,0) scale(1);opacity:1}',
        '100%{transform:translate(var(--dx),var(--dy)) scale(0);opacity:0}}'
      ].join('');

      var wrap = document.createElement('div'); wrap.className = 'oo-wrap';
      var head = document.createElement('div'); head.className = 'oo-head';
      var sub = document.createElement('div'); sub.className = 'oo-sub';
      sub.textContent = 'which one does not belong';
      var q = document.createElement('div'); q.className = 'oo-q';
      head.appendChild(sub); head.appendChild(q);

      var bar = document.createElement('div'); bar.className = 'oo-bar';
      var fill = document.createElement('i'); bar.appendChild(fill);

      var opts = document.createElement('div'); opts.className = 'oo-opts';
      var buttons = [];
      for (var i = 0; i < 4; i++) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'oo-o';
        var n = document.createElement('span'); n.textContent = i + 1;
        var t = document.createElement('u'); t.style.textDecoration = 'none';
        b.appendChild(n); b.appendChild(t);
        (function (idx) { b.addEventListener('click', function () { answer(g, idx); }); })(i);
        opts.appendChild(b);
        buttons.push({ el: b, tx: t });
      }

      var why = document.createElement('div'); why.className = 'oo-why';
      var foot = document.createElement('div'); foot.className = 'oo-foot';
      var fL = document.createElement('span'), fR = document.createElement('span');
      foot.appendChild(fL); foot.appendChild(fR);

      wrap.appendChild(head); wrap.appendChild(bar); wrap.appendChild(opts);
      wrap.appendChild(why); wrap.appendChild(foot);
      root.appendChild(style); root.appendChild(wrap);

      els = { wrap: wrap, q: q, fill: fill, buttons: buttons, why: why, fL: fL, fR: fR };
    }

    function spark(node, colour, n) {
      if (!els) return;
      var r = node.getBoundingClientRect(), w = els.wrap.getBoundingClientRect();
      for (var i = 0; i < n; i++) {
        var p = document.createElement('div');
        p.className = 'oo-sp';
        p.style.background = colour;
        p.style.left = (r.left - w.left + r.width / 2) + 'px';
        p.style.top = (r.top - w.top + r.height / 2) + 'px';
        var a = Math.random() * Math.PI * 2, dist = 28 + Math.random() * 78;
        p.style.setProperty('--dx', (Math.cos(a) * dist).toFixed(0) + 'px');
        p.style.setProperty('--dy', (Math.sin(a) * dist).toFixed(0) + 'px');
        els.wrap.appendChild(p);
        (function (node2) {
          later(function () { if (node2.parentNode) node2.parentNode.removeChild(node2); }, 1100);
        })(p);
      }
    }

    /* ------------------------------------------------------------- rounds */

    function reset(g) {
      var d = g.data;
      clearTimers();
      d.gen = (d.gen || 0) + 1;
      d.pools = TIERS.map(function (t) { return U.shuffle(t.slice()); });
      d.idx = [0, 0, 0, 0];
      d.lives = LIVES;
      d.streak = 0;
      d.bestStreak = 0;
      d.asked = 0;
      d.right = 0;
      d.locked = true;
      build(g);
      nextQ(g);
      g.set('Score', 0);
      g.set('Lives', LIVES);
      g.set('Streak', 0);
    }

    function pick(d) {
      var a = d.asked, tier;
      if (a < 5) tier = 0;
      else if (a < 12) tier = (a % 4 === 1) ? 0 : 1;
      else if (a < 20) tier = (a % 3 === 0) ? 1 : 2;
      else tier = (a % 3 === 0) ? 2 : 3;
      var pool = d.pools[tier];
      if (d.idx[tier] >= pool.length) { U.shuffle(pool); d.idx[tier] = 0; }
      return { set: pool[d.idx[tier]++], tier: tier };
    }

    function nextQ(g) {
      var d = g.data;
      var got = pick(d);
      var set = got.set;
      d.tier = got.tier;
      d.oddWord = set[0];
      d.why = set[4];
      var choices = [set[0], set[1], set[2], set[3]].slice();
      U.shuffle(choices);
      d.choices = choices;
      d.correct = choices.indexOf(set[0]);
      d.limit = Math.max(6, 15 - d.asked * .32);
      d.left = d.limit;
      d.locked = false;

      els.q.textContent = 'Question ' + (d.asked + 1);
      els.buttons.forEach(function (b, i) {
        b.el.className = 'oo-o';
        b.tx.textContent = choices[i];
      });
      els.why.className = 'oo-why';
      els.why.textContent = 'Three of these share something. One does not.';
      els.fL.textContent = TIER_NAMES[d.tier];
      els.fR.innerHTML = '';
      var bb = document.createElement('b');
      bb.textContent = d.streak > 1 ? 'Streak ×' + d.streak : (d.right + ' correct');
      els.fR.appendChild(bb);
      els.fill.style.width = '100%';
      els.fill.className = '';
    }

    function reveal(g, chosen, cls) {
      var d = g.data;
      els.buttons.forEach(function (b, i) {
        if (i === d.correct) b.el.className = 'oo-o right';
        else if (i === chosen) b.el.className = 'oo-o wrong';
        else b.el.className = 'oo-o dim';
      });
      els.why.className = 'oo-why ' + cls;
      els.why.innerHTML = '';
      var strong = document.createElement('b');
      strong.textContent = d.oddWord + ' — ';
      els.why.appendChild(strong);
      els.why.appendChild(document.createTextNode(d.why));
    }

    function answer(g, idx) {
      var d = g.data;
      if (g.state !== 'play' || d.locked) return;
      d.locked = true;
      var right = idx === d.correct;
      reveal(g, idx, right ? 'good' : 'bad');

      if (right) {
        d.right++;
        d.streak++;
        if (d.streak > d.bestStreak) d.bestStreak = d.streak;
        var mult = 1 + Math.min(1.8, (d.streak - 1) * .2);
        var pts = Math.round((50 + Math.round(d.left * 9) + d.tier * 35) * mult);
        g.score += pts;
        g.set('Score', U.fmt(g.score));
        g.set('Streak', d.streak);
        spark(els.buttons[idx].el, '#34d399', 18);
        Milo.sound.coin();
      } else {
        d.streak = 0;
        d.lives--;
        g.set('Streak', 0);
        g.set('Lives', Math.max(0, d.lives));
        spark(els.buttons[idx].el, '#fb7185', 12);
        Milo.sound.hit();
      }
      d.asked++;
      finishTurn(g);
    }

    function timeout(g) {
      var d = g.data;
      if (d.locked) return;
      d.locked = true;
      d.streak = 0;
      d.lives--;
      g.set('Streak', 0);
      g.set('Lives', Math.max(0, d.lives));
      reveal(g, -1, 'bad');
      Milo.sound.lose();
      d.asked++;
      finishTurn(g);
    }

    function finishTurn(g) {
      var d = g.data, gen = d.gen;
      later(function () {
        if (d.gen !== gen || g.state === 'over') return;
        if (d.lives <= 0) {
          g.gameOver({
            emo: '🧩', title: 'Three strikes',
            text: d.right + ' right out of ' + d.asked + ', best streak ' + d.bestStreak + '.',
            score: g.score
          });
          return;
        }
        nextQ(g);
      }, 2600);
    }

    return Milo.domGame(host, {
      id: 'odd-one-out',
      bg: '#1d0e04',
      stats: ['Score', 'Lives', 'Streak'],
      emo: '🧩',
      start: {
        title: 'Odd One Out',
        text: 'Four things. Three of them share something; one does not. Pick the intruder ' +
          'before the bar empties and the reason is spelled out either way. The sets start ' +
          'gentle and end fiendish, a streak multiplies everything, and three misses end the run.',
        keys: ['1 2 3 4', 'Click an answer']
      },
      init: reset,
      destroy: function () { clearTimers(); els = null; },
      update: function (g, dt) {
        var d = g.data;
        if (d.locked) return;
        d.left -= dt;
        var frac = Math.max(0, d.left / d.limit);
        els.fill.style.width = (frac * 100) + '%';
        els.fill.className = frac < .3 ? 'low' : '';
        if (d.left <= 0) timeout(g);
      },
      onKey: function (g, e) {
        var n = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3,
          Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 }[e.code];
        if (n != null) answer(g, n);
      }
    });
  }

  window.Milo.register({
    id: 'odd-one-out',
    title: 'Odd One Out',
    emo: '🧩',
    category: 'Word',
    tagline: 'Three belong together. One is lying.',
    description: 'A hundred and thirty-eight hand-written sets, sorted into four tiers that ramp ' +
      'from warm-up to fiendish. Early rounds are clean categories — a bat among the birds, a ' +
      'mediterranean among the oceans. Later ones turn on one fact: Saturn floats in water, the ' +
      'double bass is tuned in fourths, and only bookkeeper stacks its double letters three deep. ' +
      'Whatever you answer, the reason is printed out afterwards, so a wrong guess still teaches ' +
      'you the set. Scoring is time plus tier times a streak multiplier that climbs to 2.8x, the ' +
      'clock shortens with every question, and three misses finish you. Tip: when nothing obvious ' +
      'links three of them, stop thinking about meaning and start counting letters.',
    controls: ['1 2 3 4', 'Click'],
    colors: ['#1d0e04', '#f97316'],
    tags: ['word', 'quiz', 'logic', 'trivia', 'timed'],
    mount: mount
  });
})();
