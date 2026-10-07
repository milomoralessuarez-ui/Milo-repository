/* Trivia Ladder — twelve rungs, three lifelines, one nerve. */
(function () {
  'use strict';

  /* [question, correct answer, three wrong answers]. Options are shuffled at
     runtime so the first entry is never the one on the button you expect. */
  var EASY = [
    ['How many days are there in a leap year?', '366', '365', '364', '367'],
    ['What is the largest planet in the Solar System?', 'Jupiter', 'Saturn', 'Neptune', 'Earth'],
    ['What is the capital of France?', 'Paris', 'Lyon', 'Marseille', 'Nice'],
    ['How many sides does a hexagon have?', 'Six', 'Five', 'Seven', 'Eight'],
    ['Which gas do humans need to breathe in to survive?', 'Oxygen', 'Nitrogen', 'Carbon dioxide', 'Helium'],
    ['What is H₂O better known as?', 'Water', 'Salt', 'Sugar', 'Hydrogen peroxide'],
    ['Which animal is nicknamed the king of the jungle?', 'The lion', 'The tiger', 'The elephant', 'The gorilla'],
    ['How many colours are traditionally listed in a rainbow?', 'Seven', 'Five', 'Six', 'Eight'],
    ['What is the largest ocean on Earth?', 'The Pacific', 'The Atlantic', 'The Indian', 'The Arctic'],
    ['Which planet is known as the Red Planet?', 'Mars', 'Venus', 'Mercury', 'Jupiter'],
    ['How many players does a football team have on the pitch?', 'Eleven', 'Ten', 'Twelve', 'Nine'],
    ['What is the chemical symbol for gold?', 'Au', 'Ag', 'Go', 'Gd'],
    ['Which is the longest river in Africa?', 'The Nile', 'The Congo', 'The Niger', 'The Zambezi'],
    ['How many legs does a spider have?', 'Eight', 'Six', 'Ten', 'Four'],
    ['What colour do you get by mixing blue and yellow paint?', 'Green', 'Purple', 'Orange', 'Brown'],
    ['Which country is the natural home of the kangaroo?', 'Australia', 'New Zealand', 'South Africa', 'Brazil'],
    ['How many minutes are in a full hour?', 'Sixty', 'Fifty', 'Ninety', 'One hundred'],
    ['What is the capital of Japan?', 'Tokyo', 'Kyoto', 'Osaka', 'Sapporo'],
    ['What do bees make inside their hives?', 'Honey', 'Jam', 'Butter', 'Syrup'],
    ['Which is the tallest living land animal?', 'The giraffe', 'The elephant', 'The camel', 'The horse'],
    ['How many continents are there?', 'Seven', 'Five', 'Six', 'Eight'],
    ['Which instrument has 88 keys?', 'The piano', 'The guitar', 'The violin', 'The flute'],
    ['What is the freezing point of water in Celsius?', '0 degrees', '32 degrees', '100 degrees', 'Minus 10 degrees'],
    ['Which sport is played with a shuttlecock?', 'Badminton', 'Tennis', 'Squash', 'Table tennis'],
    ['What is the largest animal on Earth?', 'The blue whale', 'The African elephant', 'The giraffe', 'The polar bear'],
    ['How many strings does a standard guitar have?', 'Six', 'Four', 'Five', 'Seven'],
    ['Which season comes straight after summer?', 'Autumn', 'Winter', 'Spring', 'The monsoon'],
    ['What is the capital of Italy?', 'Rome', 'Milan', 'Venice', 'Naples'],
    ['What is the main ingredient in guacamole?', 'Avocado', 'Pea', 'Courgette', 'Broccoli'],
    ['Which flightless bird lives in Antarctica?', 'The penguin', 'The ostrich', 'The emu', 'The kiwi'],
    ['What is the smallest prime number?', 'Two', 'One', 'Three', 'Zero'],
    ['Which metal is liquid at room temperature?', 'Mercury', 'Iron', 'Copper', 'Lead'],
    ['How many sides does a triangle have?', 'Three', 'Four', 'Two', 'Five'],
    ['What is the capital of Spain?', 'Madrid', 'Barcelona', 'Seville', 'Valencia'],
    ['Which planet is closest to the Sun?', 'Mercury', 'Venus', 'Earth', 'Mars'],
    ['Which insect begins life as a caterpillar?', 'The butterfly', 'The grasshopper', 'The ant', 'The wasp'],
    ['How many hours are there in two days?', '48', '24', '36', '72'],
    ['What is the hardest naturally occurring substance?', 'Diamond', 'Quartz', 'Steel', 'Granite'],
    ['Which language has the most native speakers?', 'Mandarin Chinese', 'English', 'Spanish', 'Hindi'],
    ['What is the capital of Germany?', 'Berlin', 'Munich', 'Hamburg', 'Frankfurt'],
    ['How many zeros are in the number one thousand?', 'Three', 'Two', 'Four', 'Five'],
    ['Which organ pumps blood around the body?', 'The heart', 'The liver', 'The lungs', 'The kidneys'],
    ['What is a group of wolves called?', 'A pack', 'A herd', 'A flock', 'A school'],
    ['Which shape has four equal sides and four right angles?', 'A square', 'A rectangle', 'A rhombus', 'A trapezium'],
    ['What is the currency of the United States?', 'The dollar', 'The pound', 'The euro', 'The peso'],
    ['How many letters are in the English alphabet?', '26', '24', '28', '25'],
    ['What is frozen water called?', 'Ice', 'Steam', 'Salt', 'Sand'],
    ['Which country is shaped like a boot?', 'Italy', 'Greece', 'Portugal', 'Turkey'],
    ['What is the largest desert in Africa?', 'The Sahara', 'The Kalahari', 'The Namib', 'The Gobi'],
    ['How many faces does a cube have?', 'Six', 'Eight', 'Four', 'Twelve'],
    ['Which lizard is famous for changing colour?', 'The chameleon', 'The iguana', 'The gecko', 'The skink'],
    ['What is the capital of Canada?', 'Ottawa', 'Toronto', 'Montreal', 'Vancouver'],
    ['Which vitamin does the body make from sunlight?', 'Vitamin D', 'Vitamin C', 'Vitamin A', 'Vitamin B12'],
    ['How many basketball players from each team are on court?', 'Five', 'Six', 'Seven', 'Four'],
    ['What is the plural of the animal "mouse"?', 'Mice', 'Mouses', 'Mouse', 'Mices'],
    ['What do you call a baby cat?', 'A kitten', 'A puppy', 'A cub', 'A calf'],
    ['Which is the only mammal capable of true flight?', 'The bat', 'The flying squirrel', 'The colugo', 'The sugar glider'],
    ['At sea level, at what Celsius temperature does water boil?', '100 degrees', '90 degrees', '80 degrees', '120 degrees'],
    ['What is the tallest mountain in the world above sea level?', 'Mount Everest', 'K2', 'Kilimanjaro', 'Mont Blanc'],
    ['Which sense do dogs famously have far better than humans?', 'Smell', 'Sight', 'Taste', 'Balance']
  ];

  var MEDIUM = [
    ['Who painted the Mona Lisa?', 'Leonardo da Vinci', 'Michelangelo', 'Raphael', 'Botticelli'],
    ['In which year did the Second World War end?', '1945', '1944', '1946', '1939'],
    ['What is the chemical symbol for potassium?', 'K', 'P', 'Po', 'Pt'],
    ['Which planet has bright rings easily seen through a small telescope?', 'Saturn', 'Mars', 'Venus', 'Mercury'],
    ['Who wrote the play "Romeo and Juliet"?', 'William Shakespeare', 'Charles Dickens', 'Jane Austen', 'Christopher Marlowe'],
    ['Which is the longest river in South America?', 'The Amazon', 'The Paraná', 'The Orinoco', 'The Magdalena'],
    ['What is the capital of Australia?', 'Canberra', 'Sydney', 'Melbourne', 'Perth'],
    ['Which element has atomic number 1?', 'Hydrogen', 'Helium', 'Lithium', 'Oxygen'],
    ['How many bones are in the adult human body?', '206', '187', '233', '300'],
    ['Who was the first person to walk on the Moon?', 'Neil Armstrong', 'Buzz Aldrin', 'Yuri Gagarin', 'Michael Collins'],
    ['In which country is Machu Picchu?', 'Peru', 'Chile', 'Bolivia', 'Ecuador'],
    ['What is the study of earthquakes called?', 'Seismology', 'Geology', 'Meteorology', 'Volcanology'],
    ['Which painter famously cut off part of his own ear?', 'Vincent van Gogh', 'Claude Monet', 'Pablo Picasso', 'Paul Gauguin'],
    ['What is the largest island in the world?', 'Greenland', 'New Guinea', 'Borneo', 'Madagascar'],
    ['Which sea creature has three hearts?', 'The octopus', 'The shark', 'The jellyfish', 'The starfish'],
    ['In Greek mythology, who was god of the sea?', 'Poseidon', 'Zeus', 'Hades', 'Apollo'],
    ['What does DNA stand for?', 'Deoxyribonucleic acid', 'Dinucleic acid', 'Deoxyribose nitrate', 'Double nucleic acid'],
    ['Which country gave the Statue of Liberty to the United States?', 'France', 'Britain', 'Spain', 'Italy'],
    ['What is the smallest country in the world by area?', 'Vatican City', 'Monaco', 'San Marino', 'Nauru'],
    ['How many strings does a violin have?', 'Four', 'Six', 'Five', 'Three'],
    ['What is the currency of Japan?', 'The yen', 'The won', 'The yuan', 'The rupee'],
    ['Who wrote "Pride and Prejudice"?', 'Jane Austen', 'Emily Brontë', 'George Eliot', 'Mary Shelley'],
    ['Which gas makes up about 78% of Earth’s atmosphere?', 'Nitrogen', 'Oxygen', 'Argon', 'Carbon dioxide'],
    ['In which city is the Colosseum?', 'Rome', 'Athens', 'Istanbul', 'Naples'],
    ['What is the fastest land animal over a short sprint?', 'The cheetah', 'The pronghorn', 'The lion', 'The greyhound'],
    ['Which ocean lies between Africa and Australia?', 'The Indian Ocean', 'The Pacific', 'The Atlantic', 'The Southern Ocean'],
    ['What is the name of the galaxy containing our Solar System?', 'The Milky Way', 'Andromeda', 'Triangulum', 'The Whirlpool'],
    ['Who developed the theory of general relativity?', 'Albert Einstein', 'Isaac Newton', 'Niels Bohr', 'Max Planck'],
    ['Which country has the largest population?', 'India', 'China', 'The United States', 'Indonesia'],
    ['What is the tallest species of tree?', 'The coast redwood', 'The Douglas fir', 'The giant sequoia', 'The mountain ash'],
    ['In written music, how many lines make up a standard stave?', 'Five', 'Four', 'Six', 'Three'],
    ['Which vitamin is also called ascorbic acid?', 'Vitamin C', 'Vitamin A', 'Vitamin D', 'Vitamin E'],
    ['What is a baby kangaroo called?', 'A joey', 'A cub', 'A kid', 'A pup'],
    ['Which planet is tipped on its side, with an axial tilt near 98 degrees?', 'Uranus', 'Neptune', 'Saturn', 'Venus'],
    ['Who put the "Ode to Joy" into his Ninth Symphony?', 'Ludwig van Beethoven', 'Wolfgang Amadeus Mozart', 'Johann Sebastian Bach', 'Franz Schubert'],
    ['What is the capital of Brazil?', 'Brasília', 'Rio de Janeiro', 'São Paulo', 'Salvador'],
    ['Which blood type is the universal donor for red blood cells?', 'O negative', 'AB positive', 'A positive', 'B negative'],
    ['How many squares are on a chessboard?', '64', '36', '81', '100'],
    ['What is the process by which plants make food from sunlight?', 'Photosynthesis', 'Respiration', 'Transpiration', 'Germination'],
    ['Which country hosted the first modern Olympic Games, in 1896?', 'Greece', 'France', 'Britain', 'Italy'],
    ['Which is the largest organ of the human body?', 'The skin', 'The liver', 'The brain', 'The lungs'],
    ['What is a shape with eight sides called?', 'An octagon', 'A heptagon', 'A nonagon', 'A hexagon'],
    ['Which famous lake is so salty that bathers float on it?', 'The Dead Sea', 'The Red Sea', 'The Black Sea', 'Lake Como'],
    ['In which century did the French Revolution begin?', 'The 18th', 'The 17th', 'The 19th', 'The 16th'],
    ['Which metal is the best conductor of electricity?', 'Silver', 'Copper', 'Gold', 'Aluminium'],
    ['What is the SI unit of force?', 'The newton', 'The joule', 'The watt', 'The pascal'],
    ['Who wrote the novel "1984"?', 'George Orwell', 'Aldous Huxley', 'Ray Bradbury', 'H. G. Wells'],
    ['What is the longest bone in the human body?', 'The femur', 'The tibia', 'The humerus', 'The fibula'],
    ['Which US state is the largest by area?', 'Alaska', 'Texas', 'California', 'Montana'],
    ['What is the collective noun for a group of crows?', 'A murder', 'A parliament', 'A gaggle', 'A pride'],
    ['Which planet has the Great Red Spot?', 'Jupiter', 'Mars', 'Saturn', 'Neptune'],
    ['What is the world’s largest coral reef system?', 'The Great Barrier Reef', 'The Belize Barrier Reef', 'The Maldives Atolls', 'The Florida Keys Reef'],
    ['In which country is Mount Kilimanjaro?', 'Tanzania', 'Kenya', 'Uganda', 'Ethiopia'],
    ['Which sport awards the Ryder Cup?', 'Golf', 'Sailing', 'Rowing', 'Polo'],
    ['What is the hardest working part of the eye that focuses light?', 'The lens', 'The retina', 'The iris', 'The sclera']
  ];

  var HARD = [
    ['Which letter appears in no US state name at all?', 'Q', 'Z', 'X', 'J'],
    ['Which element has the chemical symbol W?', 'Tungsten', 'Tin', 'Titanium', 'Vanadium'],
    ['In which year did the Berlin Wall fall?', '1989', '1991', '1987', '1990'],
    ['What is the capital of Mongolia?', 'Ulaanbaatar', 'Astana', 'Bishkek', 'Tashkent'],
    ['Who was the first woman to win a Nobel Prize?', 'Marie Curie', 'Dorothy Hodgkin', 'Irène Joliot-Curie', 'Rosalind Franklin'],
    ['What is the deepest known point in the ocean called?', 'The Challenger Deep', 'The Mariana Trough', 'The Java Deep', 'The Tonga Abyss'],
    ['Which planet takes the longest to orbit the Sun?', 'Neptune', 'Uranus', 'Saturn', 'Jupiter'],
    ['What is a word that reads the same backwards called?', 'A palindrome', 'An anagram', 'A homonym', 'A pangram'],
    ['In which country was Frédéric Chopin born?', 'Poland', 'France', 'Austria', 'Hungary'],
    ['What is the largest species of shark?', 'The whale shark', 'The great white', 'The basking shark', 'The tiger shark'],
    ['What does the "www" in a web address stand for?', 'World Wide Web', 'Wide World Web', 'World Web Wide', 'Web World Wide'],
    ['Which country has the longest coastline in the world?', 'Canada', 'Russia', 'Indonesia', 'Australia'],
    ['What is the study of fungi called?', 'Mycology', 'Botany', 'Entomology', 'Herpetology'],
    ['In chess, which piece moves only diagonally?', 'The bishop', 'The rook', 'The knight', 'The king'],
    ['What is the chemical formula for table salt?', 'NaCl', 'KCl', 'NaHCO₃', 'CaCl₂'],
    ['Which river flows through Vienna, Budapest and Belgrade?', 'The Danube', 'The Rhine', 'The Elbe', 'The Vistula'],
    ['Who wrote "One Hundred Years of Solitude"?', 'Gabriel García Márquez', 'Jorge Luis Borges', 'Mario Vargas Llosa', 'Isabel Allende'],
    ['What is the largest moon of Saturn?', 'Titan', 'Rhea', 'Enceladus', 'Iapetus'],
    ['A deficiency of which vitamin causes scurvy?', 'Vitamin C', 'Vitamin D', 'Vitamin B1', 'Vitamin K'],
    ['What is the official language of Brazil?', 'Portuguese', 'Spanish', 'Brazilian', 'French'],
    ['Which planet has the shortest day?', 'Jupiter', 'Mercury', 'Earth', 'Mars'],
    ['In which year did the Titanic sink?', '1912', '1905', '1915', '1920'],
    ['What is the capital of New Zealand?', 'Wellington', 'Auckland', 'Christchurch', 'Dunedin'],
    ['Who painted "The Persistence of Memory", with its melting clocks?', 'Salvador Dalí', 'René Magritte', 'Joan Miró', 'Max Ernst'],
    ['Which mineral sits at the top of the Mohs hardness scale?', 'Diamond', 'Corundum', 'Topaz', 'Quartz'],
    ['How many time zones does Russia span?', 'Eleven', 'Nine', 'Seven', 'Thirteen'],
    ['What is a female fox called?', 'A vixen', 'A doe', 'A jenny', 'A sow'],
    ['In which country was paper invented?', 'China', 'Egypt', 'India', 'Greece'],
    ['What is the study of the origins of words called?', 'Etymology', 'Entomology', 'Ecology', 'Epistemology'],
    ['Which US president is on the one-dollar bill?', 'George Washington', 'Abraham Lincoln', 'Thomas Jefferson', 'Benjamin Franklin'],
    ['What is the smallest bone in the human body?', 'The stapes', 'The malleus', 'The incus', 'The pisiform'],
    ['Which sea has no land coastline, being ringed by ocean currents?', 'The Sargasso Sea', 'The Coral Sea', 'The Sea of Azov', 'The Bering Sea'],
    ['In Roman numerals, what number is CM?', '900', '1100', '400', '190'],
    ['Which is the largest lake in the world by surface area?', 'The Caspian Sea', 'Lake Superior', 'Lake Victoria', 'Lake Baikal'],
    ['What gives Mars its reddish colour?', 'Iron oxide dust', 'Red algae', 'Sulphur clouds', 'Volcanic glass'],
    ['Who holds the first US patent for the telephone?', 'Alexander Graham Bell', 'Thomas Edison', 'Nikola Tesla', 'Guglielmo Marconi'],
    ['What is the currency of Poland?', 'The zloty', 'The koruna', 'The forint', 'The leu'],
    ['Which planet was found in 1846 after being predicted by mathematics?', 'Neptune', 'Uranus', 'Ceres', 'Saturn'],
    ['What is the tallest volcano in the Solar System?', 'Olympus Mons', 'Mauna Loa', 'Mount Etna', 'Ascraeus Mons'],
    ['Which language is most widely spoken in Switzerland?', 'German', 'French', 'Italian', 'Romansh'],
    ['What does the word LASER stand for?',
      'Light Amplification by Stimulated Emission of Radiation',
      'Light Absorption by Sustained Energy Release',
      'Linear Amplified Source of Emitted Radiance',
      'Luminous Array of Stimulated Electronic Rays'],
    ['How many players are in a rugby union team on the field?', 'Fifteen', 'Thirteen', 'Eleven', 'Seventeen'],
    ['Which element is named after the Greek word for the Sun?', 'Helium', 'Selenium', 'Neon', 'Argon'],
    ['Which is the oldest university in the English-speaking world?', 'Oxford', 'Cambridge', 'Harvard', 'St Andrews'],
    ['In which ocean is the Bermuda Triangle?', 'The Atlantic', 'The Pacific', 'The Indian', 'The Arctic'],
    ['What word describes an animal active at dawn and dusk?', 'Crepuscular', 'Nocturnal', 'Diurnal', 'Cathemeral'],
    ['Which country produces the most coffee?', 'Brazil', 'Colombia', 'Vietnam', 'Ethiopia'],
    ['Which is the deepest lake in the world?', 'Lake Baikal', 'Lake Tanganyika', 'The Caspian Sea', 'Crater Lake'],
    ['Which of the seven ancient wonders still stands?', 'The Great Pyramid of Giza', 'The Hanging Gardens', 'The Colossus of Rhodes', 'The Lighthouse of Alexandria'],
    ['What is the largest artery in the human body?', 'The aorta', 'The carotid', 'The femoral artery', 'The pulmonary artery'],
    ['Which sea separates Europe from Africa at Gibraltar?', 'The Mediterranean', 'The Adriatic', 'The Aegean', 'The Baltic'],
    ['How many hydrogen atoms are in a molecule of methane?', 'Four', 'Two', 'Three', 'Six']
  ];

  var RUNGS = [
    100, 200, 400, 800, 1500, 3000, 6000, 12000, 25000, 50000, 100000, 250000
  ];
  var SAFE = [2, 6];          /* zero-based rung indices that bank a floor */
  var TIMES = [50, 50, 45, 45, 45, 40, 40, 40, 36, 36, 32, 32];

  function mount(host) {
    var Milo = window.Milo, U = Milo.util;
    var els = null, timers = [];

    function later(fn, ms) {
      var t = setTimeout(function () { var i = timers.indexOf(t); if (i >= 0) timers.splice(i, 1); fn(); }, ms);
      timers.push(t);
      return t;
    }
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function build(g) {
      var root = g.root;
      root.innerHTML = '';
      var style = document.createElement('style');
      style.textContent = [
        '.tl-wrap{display:flex;gap:16px;align-items:stretch;justify-content:center;flex-wrap:wrap-reverse;',
        'font-family:Outfit,sans-serif;width:100%;max-width:660px;margin:auto;position:relative;',
        'user-select:none;-webkit-user-select:none}',
        '.tl-main{flex:1 1 320px;min-width:280px;display:flex;flex-direction:column;gap:10px}',
        '.tl-q{background:radial-gradient(120% 120% at 50% 0%,#123a7a,#061635);border:1px solid #2a5ba8;',
        'border-radius:14px;padding:15px 14px;color:#eaf2ff;font:700 clamp(14px,3.7vw,18px)/1.35 Outfit,sans-serif;',
        'min-height:78px;display:grid;place-items:center;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.45)}',
        '.tl-opts{display:grid;grid-template-columns:1fr;gap:7px}',
        '.tl-o{position:relative;display:flex;align-items:center;gap:9px;border:1px solid #2a5ba8;',
        'background:linear-gradient(180deg,#0d2450,#071730);color:#dce9ff;border-radius:999px;padding:9px 14px;',
        'font:600 clamp(13px,3.4vw,16px)/1.2 Outfit,sans-serif;cursor:pointer;text-align:left;',
        'transition:background .15s,border-color .15s,transform .08s}',
        '.tl-o b{color:#fbbf24;min-width:16px;font-weight:800}',
        '.tl-o:active{transform:scale(.985)}',
        '.tl-o.sel{background:#4a3a06;border-color:#fbbf24}',
        '.tl-o.right{background:#12603f;border-color:#34d399;color:#eafff3}',
        '.tl-o.wrong{background:#6b1730;border-color:#fb7185;color:#ffeaef}',
        '.tl-o.gone{opacity:.22;pointer-events:none}',
        '.tl-o i{margin-left:auto;font-style:normal;font-size:.72rem;color:#8fb4ee}',
        '.tl-life{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}',
        '.tl-l{border:1px solid #2a5ba8;background:#0b1f42;color:#cfe0ff;border-radius:9px;padding:6px 11px;',
        'font:700 .76rem Outfit,sans-serif;cursor:pointer}',
        '.tl-l:active{background:#fbbf24;color:#12203c}',
        '.tl-l.used{opacity:.3;pointer-events:none;text-decoration:line-through}',
        '.tl-l.walk{border-color:#fbbf24;color:#fbbf24}',
        '.tl-bar{height:7px;border-radius:5px;background:#0b1f42;overflow:hidden}',
        '.tl-bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#fbbf24,#f97316)}',
        '.tl-msg{min-height:22px;text-align:center;font-size:.83rem;font-weight:700;color:#ffd98a}',
        '.tl-ladder{flex:0 0 156px;display:flex;flex-direction:column-reverse;gap:2px;background:#061635;',
        'border:1px solid #1d4076;border-radius:12px;padding:7px}',
        '.tl-r{display:flex;justify-content:space-between;align-items:center;border-radius:6px;padding:3px 8px;',
        'font:700 .74rem Outfit,sans-serif;color:#7d9ad0}',
        '.tl-r b{color:#a9c2ea;font-weight:800}',
        '.tl-r.safe{color:#d8b45c}',
        '.tl-r.on{background:#fbbf24;color:#12203c}',
        '.tl-r.on b{color:#12203c}',
        '.tl-r.done{color:#3f8f6b}',
        '.tl-spark{position:absolute;width:5px;height:5px;border-radius:50%;background:#fbbf24;pointer-events:none;',
        'animation:tlSpark 1.1s ease-out forwards}',
        '@keyframes tlSpark{0%{transform:translate(0,0) scale(1.4);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(0);opacity:0}}'
      ].join('');

      var wrap = document.createElement('div'); wrap.className = 'tl-wrap';
      var main = document.createElement('div'); main.className = 'tl-main';

      var q = document.createElement('div'); q.className = 'tl-q';
      var bar = document.createElement('div'); bar.className = 'tl-bar';
      var fill = document.createElement('i'); bar.appendChild(fill);
      var opts = document.createElement('div'); opts.className = 'tl-opts';
      var buttons = [];
      for (var i = 0; i < 4; i++) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'tl-o';
        var lab = document.createElement('b'); lab.textContent = 'ABCD'.charAt(i);
        var tx = document.createElement('span');
        var pct = document.createElement('i');
        b.appendChild(lab); b.appendChild(tx); b.appendChild(pct);
        (function (idx) { b.addEventListener('click', function () { choose(g, idx); }); })(i);
        opts.appendChild(b);
        buttons.push({ el: b, tx: tx, pct: pct });
      }

      var life = document.createElement('div'); life.className = 'tl-life';
      var l50 = mkLife(g, '50 : 50', function () { use5050(g); });
      var lSwap = mkLife(g, 'Swap', function () { useSwap(g); });
      var lHint = mkLife(g, 'Hint', function () { useHint(g); });
      var lWalk = document.createElement('button');
      lWalk.type = 'button'; lWalk.className = 'tl-l walk'; lWalk.textContent = 'Walk away';
      lWalk.addEventListener('click', function () { walk(g); });
      life.appendChild(l50); life.appendChild(lSwap); life.appendChild(lHint); life.appendChild(lWalk);

      var msg = document.createElement('div'); msg.className = 'tl-msg';
      main.appendChild(q); main.appendChild(bar); main.appendChild(opts);
      main.appendChild(life); main.appendChild(msg);

      var ladder = document.createElement('div'); ladder.className = 'tl-ladder';
      var rungs = [];
      for (i = 0; i < RUNGS.length; i++) {
        var r = document.createElement('div');
        r.className = 'tl-r' + (SAFE.indexOf(i) >= 0 ? ' safe' : '');
        var rn = document.createElement('b'); rn.textContent = (i + 1);
        var rv = document.createElement('span'); rv.textContent = U.fmt(RUNGS[i]);
        r.appendChild(rn); r.appendChild(rv);
        ladder.appendChild(r);
        rungs.push(r);
      }

      wrap.appendChild(main); wrap.appendChild(ladder);
      root.appendChild(style); root.appendChild(wrap);

      els = { wrap: wrap, q: q, fill: fill, buttons: buttons, msg: msg, rungs: rungs,
        l50: l50, lSwap: lSwap, lHint: lHint, lWalk: lWalk };
    }

    function mkLife(g, label, fn) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'tl-l'; b.textContent = label;
      b.addEventListener('click', fn);
      return b;
    }

    /* ------------------------------------------------------------ rounds */

    function reset(g) {
      var d = g.data;
      clearTimers();
      d.gen = (d.gen || 0) + 1;
      d.rung = 0;
      d.banked = 0;
      d.lifelines = { fifty: false, swap: false, hint: false };
      d.pools = [U.shuffle(EASY.slice()), U.shuffle(MEDIUM.slice()), U.shuffle(HARD.slice())];
      d.idx = [0, 0, 0];
      build(g);
      askQ(g);
      g.set('Score', 0);
      g.set('Rung', '1 / 12');
      g.set('Banked', 0);
    }

    function tierFor(rung) { return rung < 4 ? 0 : rung < 8 ? 1 : 2; }

    function pull(d, tier) {
      var pool = d.pools[tier];
      if (d.idx[tier] >= pool.length) { U.shuffle(pool); d.idx[tier] = 0; }
      return pool[d.idx[tier]++];
    }

    function askQ(g) {
      var d = g.data;
      var tier = tierFor(d.rung);
      var row = pull(d, tier);
      setQuestion(g, row);
      d.time = TIMES[Math.min(d.rung, TIMES.length - 1)];
      d.limit = d.time;
      d.locked = false;
      els.msg.textContent = 'Rung ' + (d.rung + 1) + ' for ' + U.fmt(RUNGS[d.rung]) +
        (SAFE.indexOf(d.rung) >= 0 ? '  ·  safe rung' : '');
      paintLadder(g);
      paintLifelines(g);
      g.set('Rung', (d.rung + 1) + ' / 12');
    }

    function setQuestion(g, row) {
      var d = g.data;
      d.row = row;
      var choices = [row[1], row[2], row[3], row[4]];
      U.shuffle(choices);
      d.choices = choices;
      d.correct = choices.indexOf(row[1]);
      els.q.textContent = row[0];
      els.buttons.forEach(function (b, i) {
        b.el.className = 'tl-o';
        b.tx.textContent = choices[i];
        b.pct.textContent = '';
      });
    }

    function paintLadder(g) {
      var d = g.data;
      els.rungs.forEach(function (r, i) {
        r.className = 'tl-r' + (SAFE.indexOf(i) >= 0 ? ' safe' : '') +
          (i === d.rung ? ' on' : i < d.rung ? ' done' : '');
      });
    }

    function paintLifelines(g) {
      var d = g.data;
      els.l50.className = 'tl-l' + (d.lifelines.fifty ? ' used' : '');
      els.lSwap.className = 'tl-l' + (d.lifelines.swap ? ' used' : '');
      els.lHint.className = 'tl-l' + (d.lifelines.hint ? ' used' : '');
    }

    /* --------------------------------------------------------- lifelines */

    function use5050(g) {
      var d = g.data;
      if (g.state !== 'play' || d.locked || d.lifelines.fifty) return;
      d.lifelines.fifty = true;
      var wrongs = [];
      for (var i = 0; i < 4; i++) if (i !== d.correct) wrongs.push(i);
      U.shuffle(wrongs);
      els.buttons[wrongs[0]].el.classList.add('gone');
      els.buttons[wrongs[1]].el.classList.add('gone');
      els.msg.textContent = 'Two duds gone.';
      Milo.sound.blip();
      paintLifelines(g);
    }

    function useSwap(g) {
      var d = g.data;
      if (g.state !== 'play' || d.locked || d.lifelines.swap) return;
      d.lifelines.swap = true;
      setQuestion(g, pull(d, tierFor(d.rung)));
      d.time = d.limit;
      els.msg.textContent = 'Swapped for a fresh question.';
      Milo.sound.powerup();
      paintLifelines(g);
    }

    function useHint(g) {
      var d = g.data;
      if (g.state !== 'play' || d.locked || d.lifelines.hint) return;
      d.lifelines.hint = true;
      /* A crowd poll: heavily weighted to the truth, but never unanimous. */
      var live = [];
      for (var i = 0; i < 4; i++) if (!els.buttons[i].el.classList.contains('gone')) live.push(i);
      var share = [], total = 0;
      live.forEach(function (i) {
        var v = i === d.correct ? 46 + Math.random() * 26 : 4 + Math.random() * 18;
        share[i] = v; total += v;
      });
      live.forEach(function (i) {
        els.buttons[i].pct.textContent = Math.round((share[i] / total) * 100) + '%';
      });
      var worst = live.filter(function (i) { return i !== d.correct; })
        .sort(function (a, b) { return share[a] - share[b]; })[0];
      if (worst != null) els.buttons[worst].el.classList.add('gone');
      els.msg.textContent = 'The crowd has spoken — and the weakest answer is out.';
      Milo.sound.blip();
      paintLifelines(g);
    }

    function walk(g) {
      var d = g.data;
      if (g.state !== 'play' || d.locked) return;
      d.locked = true;
      var take = d.rung > 0 ? RUNGS[d.rung - 1] : 0;
      g.score = take;
      g.set('Score', U.fmt(g.score));
      Milo.sound.win();
      g.gameOver({
        emo: '🚪', title: 'Walked away',
        text: 'Banked ' + U.fmt(take) + ' after ' + d.rung + ' correct answer' + (d.rung === 1 ? '' : 's') +
          '. The answer was “' + d.row[1] + '”.',
        score: take
      });
    }

    /* ---------------------------------------------------------- answering */

    function spark(g, node, colour) {
      var r = node.getBoundingClientRect(), w = els.wrap.getBoundingClientRect();
      for (var i = 0; i < 18; i++) {
        var p = document.createElement('div');
        p.className = 'tl-spark';
        p.style.background = colour;
        p.style.left = (r.left - w.left + r.width * Math.random()) + 'px';
        p.style.top = (r.top - w.top + r.height / 2) + 'px';
        p.style.setProperty('--dx', (Math.random() * 120 - 60).toFixed(0) + 'px');
        p.style.setProperty('--dy', (-30 - Math.random() * 90).toFixed(0) + 'px');
        els.wrap.appendChild(p);
        (function (n) { later(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 1200); })(p);
      }
    }

    function choose(g, idx) {
      var d = g.data;
      if (g.state !== 'play' || d.locked) return;
      d.locked = true;
      els.buttons[idx].el.classList.add('sel');
      Milo.sound.click();
      var gen = d.gen;
      later(function () {
        if (d.gen !== gen || g.state === 'over') return;
        resolve(g, idx);
      }, 850);
    }

    function resolve(g, idx) {
      var d = g.data;
      var ok = idx === d.correct;
      els.buttons.forEach(function (b, i) {
        b.el.className = 'tl-o' + (i === d.correct ? ' right' : (i === idx ? ' wrong' : ''));
      });
      if (ok) {
        Milo.sound.coin();
        spark(g, els.buttons[idx].el, '#fbbf24');
        g.score = RUNGS[d.rung];
        g.set('Score', U.fmt(g.score));
        if (SAFE.indexOf(d.rung) >= 0) {
          d.banked = RUNGS[d.rung];
          g.set('Banked', U.fmt(d.banked));
          els.msg.textContent = 'Safe rung reached — ' + U.fmt(d.banked) + ' is yours whatever happens.';
        } else {
          els.msg.textContent = 'Correct — ' + U.fmt(RUNGS[d.rung]) + ' on the board.';
        }
        var gen = d.gen;
        later(function () {
          if (d.gen !== gen || g.state === 'over') return;
          d.rung++;
          if (d.rung >= RUNGS.length) {
            g.score = RUNGS[RUNGS.length - 1];
            g.win({
              emo: '🏆', title: 'Top of the ladder!',
              text: 'All twelve rungs climbed for ' + U.fmt(g.score) + '.',
              score: g.score
            });
            return;
          }
          askQ(g);
        }, 1500);
      } else {
        Milo.sound.explode();
        els.msg.textContent = 'Wrong — it was “' + d.row[1] + '”.';
        g.score = d.banked;
        g.set('Score', U.fmt(g.score));
        var gen2 = d.gen;
        later(function () {
          if (d.gen !== gen2 || g.state === 'over') return;
          g.gameOver({
            emo: '💥', title: 'Dropped a rung too far',
            text: 'Out on rung ' + (d.rung + 1) + '. You keep your safe total of ' + U.fmt(d.banked) +
              '. The answer was “' + d.row[1] + '”.',
            score: d.banked
          });
        }, 1600);
      }
    }

    function timeUp(g) {
      var d = g.data;
      if (d.locked) return;
      d.locked = true;
      els.buttons.forEach(function (b, i) { b.el.className = 'tl-o' + (i === d.correct ? ' right' : ''); });
      els.msg.textContent = 'Out of time — it was “' + d.row[1] + '”.';
      Milo.sound.lose();
      g.score = d.banked;
      g.set('Score', U.fmt(g.score));
      var gen = d.gen;
      later(function () {
        if (d.gen !== gen || g.state === 'over') return;
        g.gameOver({
          emo: '⏰', title: 'The clock beat you',
          text: 'Out on rung ' + (d.rung + 1) + ' with ' + U.fmt(d.banked) + ' banked.',
          score: d.banked
        });
      }, 1500);
    }

    return Milo.domGame(host, {
      id: 'trivia-ladder',
      bg: '#04122e',
      stats: ['Score', 'Rung', 'Banked'],
      emo: '💰',
      start: {
        title: 'Trivia Ladder',
        text: 'Twelve questions, each worth more than the last, from 100 up to 250,000. Rungs 3 and 7 ' +
          'are safe: reach them and that money is yours no matter what happens next. Three lifelines — ' +
          '50:50, Swap for a new question, and a crowd Hint — and a Walk Away button that banks what ' +
          'you have. Get one wrong and you drop to your last safe total.',
        keys: ['A B C D', 'Click an answer']
      },
      init: reset,
      destroy: function () { clearTimers(); },
      update: function (g, dt) {
        var d = g.data;
        if (d.locked) return;
        d.time -= dt;
        els.fill.style.width = Math.max(0, (d.time / d.limit) * 100) + '%';
        if (d.time <= 0) timeUp(g);
      },
      onKey: function (g, e) {
        var n = { KeyA: 0, KeyB: 1, KeyC: 2, KeyD: 3, Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 }[e.code];
        if (n != null) { choose(g, n); return; }
        if (e.code === 'KeyF') use5050(g);
        if (e.code === 'KeyH') useHint(g);
      }
    });
  }

  window.Milo.register({
    id: 'trivia-ladder', title: 'Trivia Ladder', emo: '💰', category: 'Trivia',
    tagline: 'Twelve rungs, three lifelines, one nerve',
    description: 'A money-ladder quiz built on 165 hand-written questions sorted into three difficulty ' +
      'bins — the first four rungs are gentle, the last four are genuinely hard. Rungs 3 and 7 bank a ' +
      'floor you cannot lose. Spend 50:50 to kill two duds, Swap to trade the question for another at ' +
      'the same level, or Hint for a crowd poll that also removes the weakest answer. Walk Away at any ' +
      'time to keep what you have. Tip: hoard the Swap — it is the only lifeline that saves you from a ' +
      'question you simply do not know.',
    controls: ['A B C D', 'Click', 'F = 50:50', 'H = hint'],
    colors: ['#04122e', '#fbbf24'],
    tags: ['trivia', 'quiz', 'general knowledge', 'lifelines', 'money'],
    mount: mount
  });
})();
