/* Acronym Quiz — you use them every day, but what do the letters stand for? */
(function () {
  'use strict';

  /* [acronym, the real expansion, three hand-written fakes]. Every fake keeps
     the same initials so the options are genuinely hard to separate, and a few
     of them are the misconceptions people actually hold (AD does not mean
     "After Death", e.g. does not mean "Example Given"). */

  var ROUNDS = [
    { name: 'Screens and Circuits', emo: '💻', q: [
      ['RAM', 'Random Access Memory', 'Rapid Access Memory', 'Read And Modify', 'Runtime Allocation Module'],
      ['ROM', 'Read Only Memory', 'Rapid Optical Memory', 'Registered Output Module', 'Run Once Memory'],
      ['CPU', 'Central Processing Unit', 'Core Program Utility', 'Computing Power Unit', 'Controlled Process Uplink'],
      ['GPU', 'Graphics Processing Unit', 'General Purpose Unit', 'Graphical Pixel Undertaker', 'Grid Processing Utility'],
      ['USB', 'Universal Serial Bus', 'Universal System Bridge', 'United Serial Backbone', 'Unified Storage Bus'],
      ['HTML', 'HyperText Markup Language', 'High Level Text Markup Language', 'Hyperlink Text Machine Language', 'Home Text Management Layer'],
      ['HTTP', 'HyperText Transfer Protocol', 'High Throughput Transfer Protocol', 'Hyperlink Tracking Transfer Protocol', 'Host To Terminal Protocol'],
      ['URL', 'Uniform Resource Locator', 'Universal Resource Link', 'User Reference Locator', 'Unified Retrieval Location'],
      ['PDF', 'Portable Document Format', 'Printable Document File', 'Page Description Framework', 'Public Document Form'],
      ['GIF', 'Graphics Interchange Format', 'General Image Format', 'Graphical Image Frame', 'Grouped Image File'],
      ['JPEG', 'Joint Photographic Experts Group', 'Java Picture Encoding Group', 'Joint Pixel Encoding Grid', 'Jointed Photo Export Group'],
      ['PNG', 'Portable Network Graphics', 'Packed Network Graphic', 'Pixel Native Graphics', 'Public Network Graphic'],
      ['LED', 'Light Emitting Diode', 'Low Energy Display', 'Linear Electric Diode', 'Luminous Emission Device'],
      ['LCD', 'Liquid Crystal Display', 'Light Controlled Display', 'Layered Colour Display', 'Low Current Display'],
      ['SIM', 'Subscriber Identity Module', 'Signal Interface Module', 'Secure Identity Marker', 'System Identity Memory'],
      ['SMS', 'Short Message Service', 'Simple Message System', 'Standard Mobile Signal', 'Short Mail Service'],
      ['VPN', 'Virtual Private Network', 'Verified Protected Network', 'Variable Packet Node', 'Virtual Proxy Network'],
      ['LAN', 'Local Area Network', 'Linked Access Network', 'Low Amplitude Node', 'Logical Address Network'],
      ['WAN', 'Wide Area Network', 'Wireless Access Node', 'Web Application Network', 'Wired Area Node'],
      ['DNS', 'Domain Name System', 'Digital Network Service', 'Directory Naming Standard', 'Data Node Server'],
      ['SQL', 'Structured Query Language', 'Sequential Query Logic', 'Simple Question Language', 'Server Query Link'],
      ['API', 'Application Programming Interface', 'Applied Protocol Interchange', 'Automatic Program Injection', 'Advanced Processing Interface'],
      ['BIOS', 'Basic Input Output System', 'Binary Interface Operating Standard', 'Boot Initialisation Operating Sequence', 'Base Integrated Output Store'],
      ['SSD', 'Solid State Drive', 'Super Speed Disk', 'Sequential Storage Device', 'Static Store Drive'],
      ['HDD', 'Hard Disk Drive', 'High Density Disk', 'Hybrid Data Drive', 'Heavy Duty Disk'],
      ['CAPTCHA', 'Completely Automated Public Turing test to tell Computers and Humans Apart',
        'Coded Access Protection Test for Computer Human Authentication',
        'Cryptographic Automated Puzzle To Challenge Human Access',
        'Common Automated Program To Check Human Attention'],
      ['MODEM', 'Modulator Demodulator', 'Mobile Data Exchange Module', 'Modular Data Emitter', 'Monitored Digital Exchange Mechanism'],
      ['ASCII', 'American Standard Code for Information Interchange', 'Advanced Symbol Code for Internal Indexing', 'Automated Serial Character Index Interface', 'American System Code for Internet Interchange'],
      ['CSS', 'Cascading Style Sheets', 'Computed Style Syntax', 'Client Side Styling', 'Coded Site Structure'],
      ['ISP', 'Internet Service Provider', 'Internet Signal Processor', 'Integrated Server Platform', 'Internal System Protocol'],
      ['FAQ', 'Frequently Asked Questions', 'Fast Answer Queries', 'Formal Answer Quotes', 'Filed Answers and Queries'],
      ['WWW', 'World Wide Web', 'Worldwide Web Works', 'Wide World Web', 'Web Wide World'],
      ['CAD', 'Computer Aided Design', 'Central Architectural Database', 'Computer Analysed Diagram', 'Coded Assembly Drawing'],
      ['OCR', 'Optical Character Recognition', 'Onscreen Character Reader', 'Optical Copy Retrieval', 'Ordered Character Rendering'],
      ['PDA', 'Personal Digital Assistant', 'Portable Data Archive', 'Personal Data Application', 'Pocket Display Assistant']
    ] },
    { name: 'Lab and Ward', emo: '🔬', q: [
      ['DNA', 'Deoxyribonucleic Acid', 'Dioxyribose Nuclear Acid', 'Double Nucleic Acid', 'Deoxyribose Nitrate Acid'],
      ['RNA', 'Ribonucleic Acid', 'Ribose Nuclear Acid', 'Replicating Nucleic Acid', 'Regulatory Nitrogen Acid'],
      ['MRI', 'Magnetic Resonance Imaging', 'Molecular Radio Imaging', 'Magnetic Radiation Index', 'Multi Range Imaging'],
      ['LASER', 'Light Amplification by Stimulated Emission of Radiation',
        'Linear Amplification of Synchronised Electromagnetic Rays',
        'Light Activated Signal Emission Ray',
        'Luminous Applied Scanning Emission Ray'],
      ['RADAR', 'Radio Detection And Ranging', 'Radio Analysis and Direction Reading', 'Rapid Detection And Response', 'Radio Amplified Distance And Range'],
      ['SONAR', 'Sound Navigation And Ranging', 'Sonic Object Notification And Radar', 'Submarine Onboard Navigation And Radar', 'Sound Oscillation Navigation And Reading'],
      ['SCUBA', 'Self Contained Underwater Breathing Apparatus', 'Submerged Chamber Underwater Breathing Aid', 'Sealed Compressed Underwater Bottled Air', 'Surface Controlled Underwater Buoyancy Apparatus'],
      ['CPR', 'Cardiopulmonary Resuscitation', 'Cardiac Pressure Restart', 'Chest Pump Revival', 'Critical Pulse Recovery'],
      ['ECG', 'Electrocardiogram', 'Electrical Circulation Graph', 'Enhanced Cardiac Gauge', 'Endocrine Chemistry Gram'],
      ['EEG', 'Electroencephalogram', 'Electro Energy Graph', 'External Eye Gauge', 'Electric Endocrine Gram'],
      ['ICU', 'Intensive Care Unit', 'Immediate Care Unit', 'Internal Casualty Unit', 'Isolated Critical Unit'],
      ['HIV', 'Human Immunodeficiency Virus', 'Hepatic Immune Virus', 'Host Invasive Virus', 'Human Inflammatory Virus'],
      ['ATP', 'Adenosine Triphosphate', 'Active Transport Protein', 'Amino Transfer Peptide', 'Adenine Tri Phosphide'],
      ['TNT', 'Trinitrotoluene', 'Tri Nitrate Toluene', 'Tetra Nitro Toluene', 'Thermal Nitrate Trigger'],
      ['PVC', 'Polyvinyl Chloride', 'Pressed Vinyl Compound', 'Polymer Vinyl Coating', 'Plastic Vinyl Casing'],
      ['CFC', 'Chlorofluorocarbon', 'Carbon Fluoride Compound', 'Chlorinated Fuel Carbon', 'Cooling Fluid Compound'],
      ['LPG', 'Liquefied Petroleum Gas', 'Light Pressure Gas', 'Liquid Propane Gasoline', 'Low Pressure Generator'],
      ['UV', 'Ultraviolet', 'Upper Visible', 'Ultra Vibration', 'Universal Violet'],
      ['FM', 'Frequency Modulation', 'Filtered Modulation', 'Fixed Megahertz', 'Full Modulation'],
      ['VHF', 'Very High Frequency', 'Variable Half Frequency', 'Vertical Harmonic Field', 'Vibrating High Frequency'],
      ['IQ', 'Intelligence Quotient', 'Intellectual Quality', 'Inherited Quotient', 'Insight Quantifier'],
      ['BMI', 'Body Mass Index', 'Basal Metabolic Indicator', 'Body Measurement Index', 'Biological Mass Indicator'],
      ['GMO', 'Genetically Modified Organism', 'Genetic Marker Operation', 'Gene Managed Output', 'Grown Modified Organism'],
      ['ADHD', 'Attention Deficit Hyperactivity Disorder', 'Acute Developmental Hyperactivity Disorder', 'Attention Disruption and Hyperfocus Disorder', 'Adolescent Distraction and Hyperactivity Disorder'],
      ['MMR', 'Measles, Mumps and Rubella', 'Measles, Meningitis and Rubella', 'Mumps, Measles and Roseola', 'Multiple Modern Resistances'],
      ['MRSA', 'Methicillin Resistant Staphylococcus Aureus', 'Multi Resistant Streptococcal Aureus', 'Medically Resistant Staph Alert', 'Micro Resistant Skin Agent'],
      ['GP', 'General Practitioner', 'Group Practitioner', 'Graduate Physician', 'Generalist Practice'],
      ['PPE', 'Personal Protective Equipment', 'Public Protection Equipment', 'Protective Personal Essentials', 'Personal Preventive Equipment'],
      ['SPF', 'Sun Protection Factor', 'Solar Protection Filter', 'Skin Protection Formula', 'Sunlight Prevention Factor'],
      ['AM', 'Amplitude Modulation', 'Audio Modulation', 'Analogue Modulation', 'Ambient Modulation']
    ] },
    { name: 'Badges and Bodies', emo: '🏛️', q: [
      ['UNESCO', 'United Nations Educational, Scientific and Cultural Organization',
        'United Nations Economic, Social and Cultural Office',
        'Union of European States for Culture and Overseas',
        'United Nations Emergency Service for Countries and Orphans'],
      ['NATO', 'North Atlantic Treaty Organization', 'Northern Allied Treaty Organisation', 'National Atlantic Trade Organisation', 'North Atlantic Territorial Office'],
      ['WHO', 'World Health Organization', 'World Hygiene Office', 'Worldwide Health Observatory', 'World Humanitarian Organisation'],
      ['NASA', 'National Aeronautics and Space Administration', 'North American Space Agency', 'National Air and Space Authority', 'National Astronautics and Satellite Administration'],
      ['ESA', 'European Space Agency', 'European Science Association', 'Earth and Space Authority', 'European Satellite Alliance'],
      ['ISS', 'International Space Station', 'Interplanetary Science Station', 'International Science Satellite', 'Integrated Space Structure'],
      ['FBI', 'Federal Bureau of Investigation', 'Federal Board of Inquiry', 'Federal Bureau of Intelligence', 'Force for Bureau Investigation'],
      ['CIA', 'Central Intelligence Agency', 'Combined Intelligence Authority', 'Central Investigation Agency', 'Civil Intelligence Administration'],
      ['FDA', 'Food and Drug Administration', 'Federal Drug Agency', 'Food and Drink Authority', 'Federal Diet Administration'],
      ['EPA', 'Environmental Protection Agency', 'Environment and Pollution Authority', 'Ecological Protection Administration', 'Environmental Policy Agency'],
      ['IRS', 'Internal Revenue Service', 'Income Revenue Service', 'Internal Reporting Service', 'Inland Revenue Service'],
      ['DMV', 'Department of Motor Vehicles', 'Department of Municipal Vehicles', 'Driver and Motor Verification', 'Department of Motoring and Vehicles'],
      ['NHS', 'National Health Service', 'National Hospital Service', 'National Healthcare System', 'Nationwide Health Society'],
      ['BBC', 'British Broadcasting Corporation', 'Britain’s Broadcasting Channel', 'British Board of Communications', 'British Broadcasting Committee'],
      ['CNN', 'Cable News Network', 'Continental News Network', 'Central News Network', 'Combined News Network'],
      ['OPEC', 'Organization of the Petroleum Exporting Countries', 'Organisation of Petrol Extraction Companies', 'Oil Producing and Exporting Countries', 'Organisation for Petroleum Export Control'],
      ['WTO', 'World Trade Organization', 'World Tariff Office', 'Worldwide Traders Organisation', 'World Transport Organisation'],
      ['IMF', 'International Monetary Fund', 'International Money Foundation', 'Interbank Monetary Facility', 'International Market Fund'],
      ['NGO', 'Non-Governmental Organisation', 'National Government Office', 'New Global Organisation', 'Non Government Operation'],
      ['CEO', 'Chief Executive Officer', 'Chief Enterprise Officer', 'Corporate Executive Overseer', 'Chief Executive Operator'],
      ['CFO', 'Chief Financial Officer', 'Corporate Finance Overseer', 'Chief Fiscal Officer', 'Chief Funding Officer'],
      ['RSPCA', 'Royal Society for the Prevention of Cruelty to Animals', 'Royal Society for the Protection and Care of Animals', 'Royal Society for Pets, Creatures and Animals', 'Registered Society for the Prevention of Cruelty to Animals'],
      ['NSPCC', 'National Society for the Prevention of Cruelty to Children', 'National Service for the Protection and Care of Children', 'National Society for the Protection of Children and Carers', 'National Standard for the Prevention of Cruelty to Children'],
      ['RNLI', 'Royal National Lifeboat Institution', 'Royal Naval Lifesaving Institute', 'Royal National Lifeguard Institution', 'Rescue and National Lifeboat Institute'],
      ['UNHCR', 'United Nations High Commissioner for Refugees', 'United Nations Humanitarian Commission for Refugees', 'United Nations Health Care Relief', 'United National Humanitarian Council for Refugees'],
      ['USSR', 'Union of Soviet Socialist Republics', 'United Soviet Socialist Republics', 'Union of Socialist Soviet Regions', 'United States of Soviet Russia'],
      ['FIFA', 'Fédération Internationale de Football Association', 'Federation of International Football Associations', 'Football International Federation Association', 'Fédération Internationale de Football Amateur'],
      ['UEFA', 'Union of European Football Associations', 'United European Football Association', 'Union of European Football Alliances', 'European Union Football Association'],
      ['IOC', 'International Olympic Committee', 'International Olympic Council', 'Intercontinental Olympic Commission', 'International Organising Committee'],
      ['NBA', 'National Basketball Association', 'North American Basketball Association', 'National Basketball Alliance', 'National Basketball Academy'],
      ['NFL', 'National Football League', 'North American Football League', 'National Franchise League', 'National Field League'],
      ['NHL', 'National Hockey League', 'North American Hockey League', 'National Hockey Alliance', 'National Ice Hockey League'],
      ['MLB', 'Major League Baseball', 'Major League Basketball', 'Men’s League Baseball', 'Major Leagues of Baseball'],
      ['PGA', 'Professional Golfers’ Association', 'Professional Golf Alliance', 'Premier Golf Association', 'Players Golf Association'],
      ['ICC', 'International Cricket Council', 'International Cricket Committee', 'Intercontinental Cricket Council', 'International Cricket Congress'],
      ['BAFTA', 'British Academy of Film and Television Arts', 'British Association of Film and Theatre Awards', 'British Academy for Film, Theatre and Arts', 'Broadcast Arts, Film and Television Awards']
    ] },
    { name: 'Everyday Letters', emo: '🗓️', q: [
      ['GPS', 'Global Positioning System', 'General Positioning Satellite', 'Geographic Plotting System', 'Global Path Sensor'],
      ['ATM', 'Automated Teller Machine', 'Automatic Transaction Machine', 'Any Time Money', 'Automated Transfer Machine'],
      ['PIN', 'Personal Identification Number', 'Private Identity Number', 'Personal Index Number', 'Protected Input Number'],
      ['VIP', 'Very Important Person', 'Very Influential Person', 'Verified Important Pass', 'Valued Individual Pass'],
      ['RSVP', 'Répondez s’il vous plaît — French for “please reply”', 'Reply Soon, Very Politely', 'Reserved Seat, Very Prompt', 'Respond Straight, Very Personally'],
      ['ASAP', 'As Soon As Possible', 'At Any Suitable Place', 'Always Send A Post', 'As Simple As Possible'],
      ['DIY', 'Do It Yourself', 'Design It Yourself', 'Done In a Year', 'Draw It Yourself'],
      ['FYI', 'For Your Information', 'For Your Interest', 'From Your Inbox', 'Filed, You’re Informed'],
      ['AKA', 'Also Known As', 'Always Known As', 'Alias Known As', 'And Known As'],
      ['ETA', 'Estimated Time of Arrival', 'Exact Time of Arrival', 'Estimated Travel Allowance', 'Expected Timetable Adjustment'],
      ['AD', 'Anno Domini — Latin for “in the year of the Lord”', 'After Death', 'After Dawn', 'Ancient Date'],
      ['BC', 'Before Christ', 'Before Calendar', 'Before Caesar', 'Backdated Chronology'],
      ['PM', 'Post Meridiem — Latin for “after midday”', 'Past Midday', 'Post Midnight', 'Prime Meridian'],
      ['PS', 'Post Scriptum — Latin for “written afterwards”', 'Personal Statement', 'Page Suffix', 'Please See'],
      ['e.g.', 'exempli gratia — Latin for “for example”', 'Example Given', 'Especially Good', 'Excluding Generally'],
      ['i.e.', 'id est — Latin for “that is”', 'In Effect', 'In Essence', 'Including Examples'],
      ['etc.', 'et cetera — Latin for “and the rest”', 'End The Conversation', 'Every Ticked Category', 'Extra To Consider'],
      ['NB', 'Nota Bene — Latin for “note well”', 'Notice Board', 'Notable Brief', 'New Bulletin'],
      ['CV', 'Curriculum Vitae — Latin for “course of life”', 'Career Values', 'Certified Verification', 'Candidate Version'],
      ['LOL', 'Laugh Out Loud', 'Lots Of Love', 'Laughing Overly Loud', 'Load Of Laughs'],
      ['BRB', 'Be Right Back', 'Back Really Briefly', 'Be Ready, Back', 'Bear with, Right Back'],
      ['UFO', 'Unidentified Flying Object', 'Unknown Flying Object', 'Unidentified Floating Object', 'Unusual Flight Observation'],
      ['CCTV', 'Closed Circuit Television', 'Continuous Camera Television', 'Controlled Camera Television', 'City Centre Television'],
      ['SUV', 'Sport Utility Vehicle', 'Super Utility Vehicle', 'Standard Urban Vehicle', 'Sports Universal Vehicle'],
      ['MPG', 'Miles Per Gallon', 'Metres Per Gallon', 'Mileage Per Gauge', 'Maximum Petrol Gauge'],
      ['HGV', 'Heavy Goods Vehicle', 'Heavy Grade Vehicle', 'High Gross Vehicle', 'Haulage Goods Vehicle'],
      ['MOT', 'Ministry of Transport test', 'Motor Operation Test', 'Mechanical Operating Test', 'Motor Owner’s Test'],
      ['VAT', 'Value Added Tax', 'Variable Applied Tax', 'Value Assessment Tax', 'Vendor Added Tariff'],
      ['ZIP', 'Zone Improvement Plan', 'Zonal Index Postal', 'Zoned Identification Post', 'Zip Identification Placement'],
      ['ISBN', 'International Standard Book Number', 'International Serial Book Number', 'Indexed Standard Book Number', 'International Standard Bibliographic Number'],
      ['BLT', 'Bacon, Lettuce and Tomato', 'Bacon, Leek and Tomato', 'Beef, Lettuce and Tomato', 'Bacon, Lettuce and Toast'],
      ['DJ', 'Disc Jockey', 'Dance Jockey', 'Deck Jockey', 'Digital Jockey'],
      ['MC', 'Master of Ceremonies', 'Microphone Controller', 'Music Curator', 'Main Compere'],
      ['AWOL', 'Absent Without Leave', 'Away Without Official Location', 'Absent With Outstanding Leave', 'Alert Withdrawn On Leave'],
      ['POW', 'Prisoner of War', 'Person of War', 'Prisoner on Watch', 'Police Order Warrant'],
      ['SWAT', 'Special Weapons And Tactics', 'Strategic Weapons And Tactics', 'Security, Weapons And Training', 'Specialist Warrant Action Team'],
      ['NASCAR', 'National Association for Stock Car Auto Racing', 'National Association of Stock Car And Racing', 'North American Stock Car Auto Racing', 'National American Stock Car Association Racing']
    ] }
  ];

  var LIVES = 3;
  var ROUND_LEN = 6;

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
        '.aq-wrap{display:flex;flex-direction:column;align-items:center;gap:11px;position:relative;',
        'font-family:Outfit,sans-serif;width:100%;max-width:540px;margin:auto;',
        'user-select:none;-webkit-user-select:none}',
        '.aq-round{font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;color:#a5b4fc;font-weight:800;',
        'text-align:center}',
        '.aq-word{font:900 clamp(30px,9vw,54px)/1 Outfit,sans-serif;color:#eef2ff;letter-spacing:.06em;',
        'text-shadow:0 0 28px rgba(129,140,248,.7);text-align:center;word-break:break-word}',
        '.aq-word.pop{animation:aqPop .4s ease-out}',
        '@keyframes aqPop{0%{transform:scale(.72);opacity:0}100%{transform:scale(1);opacity:1}}',
        '.aq-bar{width:100%;height:9px;border-radius:6px;background:#1e1b4b;overflow:hidden}',
        '.aq-bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#818cf8,#22d3ee)}',
        '.aq-bar i.low{background:linear-gradient(90deg,#f43f5e,#fb923c)}',
        '.aq-opts{display:flex;flex-direction:column;gap:7px;width:100%}',
        '.aq-o{position:relative;display:flex;align-items:center;gap:10px;text-align:left;',
        'border:2px solid #3f3a86;background:#241f5e;color:#e8e9ff;border-radius:12px;',
        'padding:10px 12px;font:700 clamp(12px,3.3vw,15px)/1.3 Outfit,sans-serif;cursor:pointer;',
        'transition:transform .1s,background .15s,border-color .15s;width:100%}',
        '.aq-o b{flex:0 0 22px;height:22px;border-radius:6px;background:#3f3a86;color:#c7d2fe;',
        'display:grid;place-items:center;font-size:.72rem}',
        '.aq-o:hover{background:#2f2a73}',
        '.aq-o:active{transform:scale(.985)}',
        '.aq-o.right{background:#15653f;border-color:#34d399;color:#eafff4}',
        '.aq-o.right b{background:#34d399;color:#053322}',
        '.aq-o.wrong{background:#73182f;border-color:#fb7185;color:#ffe9ee}',
        '.aq-o.wrong b{background:#fb7185;color:#3b0512}',
        '.aq-o.dim{opacity:.38}',
        '.aq-note{min-height:34px;text-align:center;font:600 clamp(12px,3.2vw,14.5px)/1.35 Outfit,sans-serif;',
        'color:#c7d2fe;padding:0 4px}',
        '.aq-note.good{color:#6ee7b7}',
        '.aq-note.bad{color:#fecdd3}',
        '.aq-foot{display:flex;justify-content:space-between;width:100%;font-size:.75rem;color:#8b93d6}',
        '.aq-foot b{color:#fde68a}',
        '.aq-sp{position:absolute;width:6px;height:6px;border-radius:50%;pointer-events:none;',
        'animation:aqSp .95s ease-out forwards}',
        '@keyframes aqSp{0%{transform:translate(0,0) scale(1);opacity:1}',
        '100%{transform:translate(var(--dx),var(--dy)) scale(0);opacity:0}}'
      ].join('');

      var wrap = document.createElement('div'); wrap.className = 'aq-wrap';
      var round = document.createElement('div'); round.className = 'aq-round';
      var word = document.createElement('div'); word.className = 'aq-word';
      var bar = document.createElement('div'); bar.className = 'aq-bar';
      var fill = document.createElement('i'); bar.appendChild(fill);

      var opts = document.createElement('div'); opts.className = 'aq-opts';
      var buttons = [];
      for (var i = 0; i < 4; i++) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'aq-o';
        var n = document.createElement('b'); n.textContent = i + 1;
        var t = document.createElement('span');
        b.appendChild(n); b.appendChild(t);
        (function (idx) { b.addEventListener('click', function () { answer(g, idx); }); })(i);
        opts.appendChild(b);
        buttons.push({ el: b, tx: t });
      }

      var note = document.createElement('div'); note.className = 'aq-note';
      var foot = document.createElement('div'); foot.className = 'aq-foot';
      var fL = document.createElement('span'), fR = document.createElement('span');
      foot.appendChild(fL); foot.appendChild(fR);

      wrap.appendChild(round); wrap.appendChild(word); wrap.appendChild(bar);
      wrap.appendChild(opts); wrap.appendChild(note); wrap.appendChild(foot);
      root.appendChild(style); root.appendChild(wrap);

      els = { wrap: wrap, round: round, word: word, fill: fill, buttons: buttons,
        note: note, fL: fL, fR: fR };
    }

    function spark(node, colour, n) {
      if (!els) return;
      var r = node.getBoundingClientRect(), w = els.wrap.getBoundingClientRect();
      for (var i = 0; i < n; i++) {
        var p = document.createElement('div');
        p.className = 'aq-sp';
        p.style.background = colour;
        p.style.left = (r.left - w.left + r.width * Math.random()) + 'px';
        p.style.top = (r.top - w.top + r.height / 2) + 'px';
        var a = Math.random() * Math.PI * 2, dist = 26 + Math.random() * 70;
        p.style.setProperty('--dx', (Math.cos(a) * dist).toFixed(0) + 'px');
        p.style.setProperty('--dy', (Math.sin(a) * dist).toFixed(0) + 'px');
        els.wrap.appendChild(p);
        (function (node2) {
          later(function () { if (node2.parentNode) node2.parentNode.removeChild(node2); }, 1050);
        })(p);
      }
    }

    /* ------------------------------------------------------------- rounds */

    function reset(g) {
      var d = g.data;
      clearTimers();
      d.gen = (d.gen || 0) + 1;
      d.order = U.shuffle(ROUNDS.map(function (r, i) { return i; }));
      d.decks = ROUNDS.map(function (r) { return U.shuffle(r.q.slice()); });
      d.cursor = ROUNDS.map(function () { return 0; });
      d.round = 0;
      d.inRound = 0;
      d.asked = 0;
      d.right = 0;
      d.lives = LIVES;
      d.streak = 0;
      d.bestStreak = 0;
      d.locked = true;
      build(g);
      nextQ(g, true);
      g.set('Score', 0);
      g.set('Lives', LIVES);
      g.set('Round', 1);
    }

    function nextQ(g, fresh) {
      var d = g.data;
      var themeIdx = d.order[d.round % d.order.length];
      var theme = ROUNDS[themeIdx];
      var deck = d.decks[themeIdx];
      if (d.cursor[themeIdx] >= deck.length) { U.shuffle(deck); d.cursor[themeIdx] = 0; }
      var set = deck[d.cursor[themeIdx]++];

      d.theme = theme;
      d.truth = set[1];
      d.acronym = set[0];
      var choices = [set[1], set[2], set[3], set[4]].slice();
      U.shuffle(choices);
      d.choices = choices;
      d.correct = choices.indexOf(set[1]);
      d.limit = Math.max(6.5, 16 - d.asked * .3);
      d.left = d.limit;
      d.locked = false;

      els.round.textContent = theme.emo + '  Round ' + (d.round + 1) + ' · ' + theme.name;
      els.word.textContent = set[0];
      els.word.className = 'aq-word pop';
      els.buttons.forEach(function (b, i) {
        b.el.className = 'aq-o';
        b.tx.textContent = choices[i];
      });
      els.note.className = 'aq-note';
      els.note.textContent = fresh ? 'What do the letters actually stand for?' : '';
      els.fL.textContent = 'Question ' + (d.inRound + 1) + ' of ' + ROUND_LEN;
      els.fR.innerHTML = '';
      var bb = document.createElement('b');
      bb.textContent = d.streak > 1 ? 'Streak ×' + d.streak : d.right + ' correct';
      els.fR.appendChild(bb);
      els.fill.style.width = '100%';
      els.fill.className = '';
      g.set('Round', d.round + 1);
    }

    function reveal(g, chosen) {
      var d = g.data;
      els.buttons.forEach(function (b, i) {
        if (i === d.correct) b.el.className = 'aq-o right';
        else if (i === chosen) b.el.className = 'aq-o wrong';
        else b.el.className = 'aq-o dim';
      });
    }

    function answer(g, idx) {
      var d = g.data;
      if (g.state !== 'play' || d.locked) return;
      d.locked = true;
      var right = idx === d.correct;
      reveal(g, idx);

      if (right) {
        d.right++;
        d.streak++;
        if (d.streak > d.bestStreak) d.bestStreak = d.streak;
        var mult = 1 + Math.min(1.6, (d.streak - 1) * .18);
        var pts = Math.round((45 + Math.round(d.left * 8) + d.round * 22) * mult);
        g.score += pts;
        g.set('Score', U.fmt(g.score));
        els.note.className = 'aq-note good';
        els.note.textContent = 'Correct — +' + pts +
          (d.streak > 1 ? '  (streak ×' + mult.toFixed(2) + ')' : '');
        spark(els.buttons[idx].el, '#34d399', 16);
        Milo.sound.coin();
      } else {
        d.streak = 0;
        d.lives--;
        g.set('Lives', Math.max(0, d.lives));
        els.note.className = 'aq-note bad';
        els.note.textContent = d.acronym + ' really stands for “' + d.truth + '”.';
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
      g.set('Lives', Math.max(0, d.lives));
      reveal(g, -1);
      els.note.className = 'aq-note bad';
      els.note.textContent = 'Out of time — ' + d.acronym + ' is “' + d.truth + '”.';
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
            emo: '🔠', title: 'Letters beat you',
            text: d.right + ' right out of ' + d.asked + ', best streak ' + d.bestStreak +
              ', made it to round ' + (d.round + 1) + '.',
            score: g.score
          });
          return;
        }
        d.inRound++;
        if (d.inRound >= ROUND_LEN) {
          d.inRound = 0;
          d.round++;
          var nxt = ROUNDS[d.order[d.round % d.order.length]];
          els.note.className = 'aq-note good';
          els.note.textContent = 'Round ' + (d.round + 1) + ' — ' + nxt.emo + ' ' + nxt.name;
          Milo.sound.powerup();
          later(function () {
            if (d.gen !== gen || g.state === 'over') return;
            nextQ(g, false);
          }, 1200);
          return;
        }
        nextQ(g, false);
      }, 2300);
    }

    return Milo.domGame(host, {
      id: 'acronym-quiz',
      bg: '#0c0a2e',
      stats: ['Score', 'Lives', 'Round'],
      emo: '🔠',
      start: {
        title: 'Acronym Quiz',
        text: 'GPS, RAM, UNESCO, RSVP — you say them every day, but what do the letters ' +
          'actually spell out? Four expansions, three of them invented to look right. ' +
          'Six questions per themed round, a shrinking clock, and three wrong answers end it. ' +
          'Miss one and the real expansion is printed for you.',
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
    id: 'acronym-quiz',
    title: 'Acronym Quiz',
    emo: '🔠',
    category: 'Word',
    tagline: 'What do the letters actually stand for?',
    description: 'A hundred and thirty-eight real acronyms across four themed rounds — screens and ' +
      'circuits, lab and ward, badges and bodies, and the everyday letters you write without ' +
      'thinking. Each one comes with three invented expansions built from the same initials, so ' +
      'guessing from the letters alone will not save you. A few of the decoys are the mistakes ' +
      'people genuinely make: AD is not After Death, e.g. is not Example Given, and the FDA is not ' +
      'the Federal Drug Agency. Six questions to a round, the clock shrinks with every question, a ' +
      'streak multiplies your score up to 2.6x and three misses end the run. Get one wrong and the ' +
      'real expansion is printed for you, which is the fastest way to stop getting it wrong.',
    controls: ['1 2 3 4', 'Click'],
    colors: ['#0c0a2e', '#818cf8'],
    tags: ['word', 'quiz', 'trivia', 'acronyms', 'timed'],
    mount: mount
  });
})();
