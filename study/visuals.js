/* ==========================================================================
   Picture Quiz — StudyQuest feature, registers through window.CQ.

   Questions built around drawings, because the notes lean on pictures: the
   lab equipment (Concept 1), the four accuracy/precision targets and reading
   a graduated cylinder (Concept 2), and the three graph types (Concept 4).

   Every figure is inline SVG generated here — no image files — drawn with
   currentColor and the theme's custom properties (see visuals.css) so it
   reads in both the light and the dark theme.

   Mastery ids are "vis:<kind>:<item>", e.g. vis:equipment:beaker,
   vis:targets:precise-not-accurate, vis:meniscus:read, vis:graphs:type-line.
   ========================================================================== */
(() => {
'use strict';
const CQ = window.CQ;
if (!CQ) return;
const { el, shuffle, pick, pct } = CQ;

/* ------------------------------------------------------------ helpers */
const rnd = (lo, hi) => lo + Math.random() * (hi - lo);
const irnd = (lo, hi) => Math.floor(rnd(lo, hi + 1));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = (n) => Math.round(n * 10) / 10;
let uid = 0;
/** One SVG string. The alt text rides on the svg itself as well as on the
    question card's figure wrapper, so the drawing is described wherever it
    is shown (the end-of-round review has no wrapper). */
function svg(w, h, body, alt, cls = '') {
  return `<svg class="vz ${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(alt)}" focusable="false">${body}</svg>`;
}
/** Tick marks up a vertical scale: [{ y, long }] → path data. */
const ticks = (x, list) => list.map(({ y, len }) => `M${x} ${r1(y)}h${len}`).join('');

/* ====================================================== 1. EQUIPMENT
   Each item: the name and use are worded as the notes word them (Concept 1,
   slides 7, 8 and 11–15). `alts` are the plausible distractors for "What is
   this?" (other glassware for glassware); `useAlts` for "What is it used
   for?" leave out a use that overlaps too much to be fair (the notes' beaker
   and Erlenmeyer flask both heat, hold and measure liquids). `avoid` names
   things that are visible in the drawing itself (the rack holds test tubes). */
const EQUIPMENT = [
  { id: 'beaker', name: 'Beaker', page: 11, group: 'Glassware',
    use: 'Holding, mixing, heating, and measuring liquids (and some solids)',
    look: 'A wide, straight-sided glass container with a flat bottom, a small pouring spout at the rim and volume marks up the side. It is partly filled with liquid.',
    alts: ['erlenmeyer', 'graduated-cylinder', 'test-tube', 'funnel'], useAlts: ['graduated-cylinder', 'test-tube', 'funnel', 'dropper'] },
  { id: 'graduated-cylinder', name: 'Graduated cylinder', page: 11, group: 'Glassware',
    use: 'Makes precise volume measurements of liquids',
    look: 'A tall, narrow glass tube standing on a wide foot, with a pouring spout at the top and many evenly spaced marks up its side. Liquid fills the lower part.',
    alts: ['test-tube', 'beaker', 'erlenmeyer', 'thermometer'], useAlts: ['beaker', 'erlenmeyer', 'test-tube', 'pipette', 'meter-stick'] },
  { id: 'erlenmeyer', name: 'Erlenmeyer flask', page: 11, group: 'Glassware',
    use: 'Heating liquids, but can also measure and hold them',
    look: 'A glass container with a narrow neck that widens into a cone-shaped body with a flat bottom. A few volume marks sit on the body; liquid fills the bottom.',
    alts: ['beaker', 'funnel', 'graduated-cylinder', 'test-tube'], useAlts: ['graduated-cylinder', 'test-tube', 'funnel', 'hot-plate'] },
  { id: 'test-tube', name: 'Test tube', page: 12, group: 'Glassware',
    use: 'Used for performing small chemical reactions',
    look: 'A single narrow glass tube with a rounded bottom and an open top, a little liquid in the bottom. No stand and no marks.',
    alts: ['graduated-cylinder', 'pipette', 'dropper', 'beaker'], useAlts: ['graduated-cylinder', 'beaker', 'test-tube-rack', 'dropper'] },
  { id: 'test-tube-rack', name: 'Test tube rack', page: 12, group: 'Glassware',
    use: 'Holds up multiple test tubes at one time',
    look: 'A stand with two end posts and two shelves full of round holes. Three narrow round-bottomed tubes stand in the holes.',
    alts: ['test-tube-holder', 'beaker-tongs', 'hot-plate', 'digital-scale'], useAlts: ['test-tube-holder', 'test-tube', 'beaker-tongs', 'hot-plate'], avoid: ['test-tube'] },
  { id: 'test-tube-holder', name: 'Test tube holder', page: 12, group: 'Glassware',
    use: 'To hold a test tube when heating',
    look: 'A long wire handle with a small spring, ending in a wire clamp that grips a narrow glass tube near its top.',
    alts: ['beaker-tongs', 'test-tube-rack', 'spatula', 'pipette'], useAlts: ['beaker-tongs', 'test-tube-rack', 'heat-gloves', 'test-tube'], avoid: ['test-tube'] },
  { id: 'hot-plate', name: 'Hot plate', page: 13, group: 'Heating',
    use: 'Electricity powered plate for heating chemicals',
    look: 'A flat box with a coiled ring on its top surface, a round dial and a small light on the front, and a power cord out of the side.',
    alts: ['digital-scale', 'test-tube-rack', 'fire-extinguisher', 'thermometer'], useAlts: ['digital-scale', 'erlenmeyer', 'heat-gloves', 'thermometer'] },
  { id: 'digital-scale', name: 'Digital scale', page: 14, group: 'Measuring',
    use: 'Measures mass (usually in grams)',
    look: 'A low box with a flat metal pan on top, and a screen showing 0.00 and two buttons on its sloped front.',
    alts: ['hot-plate', 'meter-stick', 'thermometer', 'graduated-cylinder'], useAlts: ['meter-stick', 'thermometer', 'graduated-cylinder', 'hot-plate'] },
  { id: 'meter-stick', name: 'Meter stick', page: 14, group: 'Measuring',
    use: 'Measures length in mm, cm, or m',
    look: 'A long, flat wooden strip with evenly spaced marks along its edge and the numbers 2 to 20 printed along it.',
    alts: ['thermometer', 'digital-scale', 'spatula', 'graduated-cylinder'], useAlts: ['thermometer', 'digital-scale', 'graduated-cylinder', 'spatula'] },
  { id: 'thermometer', name: 'Thermometer', page: 14, group: 'Measuring',
    use: 'Measures temperature in degrees Fahrenheit or Celsius',
    look: 'A narrow glass tube on a backing board with a round bulb at the bottom. A coloured column rises from the bulb, with a numbered scale on each side.',
    alts: ['graduated-cylinder', 'meter-stick', 'pipette', 'test-tube'], useAlts: ['digital-scale', 'meter-stick', 'graduated-cylinder', 'hot-plate'] },
  { id: 'beaker-tongs', name: 'Beaker tongs', page: 15, group: 'Transferring',
    use: 'Moving and holding a hot beaker',
    look: 'Two long metal arms joined at a pivot like scissors. The top ends are long loops for the hand; the bottom ends curve into a wide, rounded, padded grip.',
    alts: ['test-tube-holder', 'spatula', 'test-tube-rack', 'funnel'], useAlts: ['test-tube-holder', 'heat-gloves', 'spatula', 'test-tube-rack'] },
  { id: 'funnel', name: 'Funnel', page: 15, group: 'Transferring',
    use: 'Transferring liquids from larger containers to smaller',
    look: 'A wide cone, open at the top, narrowing to a long thin tube at the bottom.',
    alts: ['erlenmeyer', 'beaker', 'dropper', 'pipette'], useAlts: ['spatula', 'dropper', 'pipette', 'beaker'] },
  { id: 'spatula', name: 'Spatula', page: 15, group: 'Transferring',
    use: 'Transferring solid chemicals from larger containers to smaller',
    look: 'A long thin metal handle, lying at a slant, with a small spoon-shaped scoop holding some powder at one end and a flat blade at the other.',
    alts: ['beaker-tongs', 'pipette', 'test-tube-holder', 'meter-stick'], useAlts: ['funnel', 'pipette', 'dropper', 'beaker-tongs'] },
  { id: 'pipette', name: 'Pipette', page: 15, group: 'Transferring',
    use: 'Transferring liquids in small precise amounts',
    look: 'A one-piece see-through plastic tool, lying at a slant: a long oval bulb at the top joined to a long thin stem with small marks on it, tapering to a fine tip.',
    alts: ['dropper', 'test-tube', 'funnel', 'thermometer'], useAlts: ['dropper', 'funnel', 'spatula', 'graduated-cylinder'] },
  { id: 'dropper', name: 'Dropper', page: 15, group: 'Transferring',
    use: 'Transferring liquids drop by drop',
    look: 'A ridged rubber bulb with a collar on top of a short glass tube that tapers to a point, with a single drop falling from the tip.',
    alts: ['pipette', 'test-tube', 'funnel', 'graduated-cylinder'], useAlts: ['pipette', 'funnel', 'spatula', 'beaker'] },
  { id: 'goggles', name: 'Safety goggles', page: 7, group: 'Safety',
    use: 'Always wear when using chemicals or fire to protect your eyes',
    look: 'A wide, clear, curved eye shield with a dip for the nose and small vent holes along the top, held on by a broad strap.',
    alts: ['heat-gloves', 'fire-extinguisher', 'beaker-tongs', 'hot-plate'], useAlts: ['heat-gloves', 'fire-extinguisher', 'thermometer', 'beaker-tongs'] },
  { id: 'heat-gloves', name: 'Heat-resistant gloves', page: 7, group: 'Safety',
    use: 'Wear when using hot objects to avoid burning yourself',
    look: 'A thick glove with four fingers, a thumb and a quilted cuff.',
    alts: ['goggles', 'beaker-tongs', 'test-tube-holder', 'fire-extinguisher'], useAlts: ['goggles', 'beaker-tongs', 'test-tube-holder', 'fire-extinguisher'] },
  { id: 'fire-extinguisher', name: 'Fire extinguisher', page: 8, group: 'Safety',
    use: 'Can be used to put out fires',
    look: 'A tall rounded metal tank with a blank label, a squeeze lever and a small dial on top, and a short hose ending in a nozzle.',
    alts: ['goggles', 'hot-plate', 'heat-gloves', 'graduated-cylinder'], useAlts: ['goggles', 'heat-gloves', 'hot-plate', 'test-tube-holder'] },
];
const EQ = new Map(EQUIPMENT.map((e) => [e.id, e]));
const eqByName = (s) => EQ.get(s) || EQUIPMENT.find((e) => e.name.toLowerCase() === String(s).toLowerCase());

/* The drawings. Each fits a 240 × 240 box; classes come from visuals.css:
   o = outline, t = thin line, glass, liq (liquid), metal, rub (rubber),
   red, hot, wood, glove, hl (a glass highlight). */
const DRAW = {
  beaker: () => `
    <path class="glass" d="M50 38Q62 40 68 52V198Q68 212 82 212H158Q172 212 172 198V48Q172 40 180 38Z"/>
    <path class="liq" d="M69.5 128H170.5V198Q170.5 210.5 158 210.5H82Q69.5 210.5 69.5 198Z"/>
    <path class="t" d="M70 128H170"/>
    <path class="o" d="M50 38Q62 40 68 52V198Q68 212 82 212H158Q172 212 172 198V48Q172 40 180 38"/>
    <path class="o" d="M50 38H180"/>
    <path class="t" d="${ticks(146, [{ y: 70, len: 18 }, { y: 87, len: 10 }, { y: 104, len: 18 }, { y: 121, len: 10 }, { y: 138, len: 18 }, { y: 155, len: 10 }, { y: 172, len: 18 }, { y: 189, len: 10 }])}"/>
    <g font-size="11" text-anchor="end"><text x="140" y="74">250</text><text x="140" y="108">200</text><text x="140" y="142">150</text><text x="140" y="176">100</text></g>
    <text x="140" y="58" font-size="10" text-anchor="end">mL</text>
    <path class="hl" d="M82 60V190"/>`,

  'graduated-cylinder': () => {
    const list = [];
    for (let i = 0; i <= 20; i++) list.push({ y: 40 + i * 7.4, len: i % 5 === 0 ? 16 : 8 });
    return `
    <path class="glass" d="M86 14Q95 16 96 26V190H144V18Z"/>
    <path class="liq" d="M97.5 112Q120 124 142.5 112V188.5H97.5Z"/>
    <path class="t" d="M97 112Q120 124 143 112"/>
    <path class="o" d="M86 14Q95 16 96 26V190H144V18"/>
    <path class="o" d="M86 14H144"/>
    <path class="t" d="${ticks(100, list)}"/>
    <g font-size="10.5" font-weight="700"><text x="119" y="44">100</text><text x="119" y="81">75</text><text x="119" y="118">50</text><text x="119" y="155">25</text></g>
    <path class="metal" d="M92 190H148V199H92Z"/><path class="o" d="M92 190H148V199H92Z"/>
    <path class="metal" d="M78 199H162L176 214H64Z"/><path class="o" d="M78 199H162L176 214H64Z"/>
    <path class="hl" d="M104 32V184"/>`;
  },

  erlenmeyer: () => `
    <path class="glass" d="M106 30V92L54 192Q48 210 66 210H174Q192 210 186 192L134 92V30Z"/>
    <path class="liq" d="M71.4 160H168.6L184.6 191Q190 208.5 174 208.5H66Q50 208.5 55.4 191Z"/>
    <path class="t" d="M71 160H169"/>
    <path class="o" d="M106 30V92L54 192Q48 210 66 210H174Q192 210 186 192L134 92V30"/>
    <path class="o" d="M100 24H140V31H100Z"/>
    <path class="t" d="${ticks(100, [{ y: 122, len: 14 }, { y: 167, len: 14 }, { y: 190, len: 14 }])}"/>
    <g font-size="10.5" font-weight="700"><text x="118" y="126">300</text><text x="118" y="171">200</text><text x="118" y="194">100</text></g>
    <text x="118" y="108" font-size="10">mL</text>
    <path class="hl" d="M112 40V96L84 150"/>`,

  'test-tube': () => `
    <g transform="rotate(14 120 120)">
      <path class="glass" d="M103 26V184A17 17 0 0 0 137 184V26Z"/>
      <path class="liq" d="M104.5 148H135.5V184A15.5 15.5 0 0 1 104.5 184Z"/>
      <path class="t" d="M104 148H136"/>
      <path class="o" d="M103 26V184A17 17 0 0 0 137 184V26"/>
      <path class="o" d="M97 22H143V29H97Z"/>
      <path class="hl" d="M111 38V178"/>
    </g>`,

  'test-tube-rack': () => {
    const holes = [60, 90, 120, 150, 180];
    const tubes = [{ x: 60, c: 'liq' }, { x: 120, c: 'liq2' }, { x: 150, c: 'liq3' }];
    const tube = ({ x, c }) => `
      <path class="glass" d="M${x - 8} 50V166A8 8 0 0 0 ${x + 8} 166V50Z"/>
      <path class="${c}" d="M${x - 6.5} 126V166A6.5 6.5 0 0 0 ${x + 6.5} 166V126Z"/>
      <path class="o" d="M${x - 8} 50V166A8 8 0 0 0 ${x + 8} 166V50"/>
      <path class="o" d="M${x - 11} 48H${x + 11}"/>`;
    return `
    <path class="wood" d="M16 202H224V216H16Z"/><path class="o" d="M16 202H224V216H16Z"/>
    <path class="wood" d="M24 64H40V202H24Z"/><path class="o" d="M24 64H40V202H24Z"/>
    <path class="wood" d="M200 64H216V202H200Z"/><path class="o" d="M200 64H216V202H200Z"/>
    ${tubes.map(tube).join('')}
    <path class="wood" d="M40 108H200V116H40Z"/><path class="o" d="M40 108H200V116H40Z"/>
    <path class="wood" d="M48 96H208L200 108H40Z"/><path class="o" d="M48 96H208L200 108H40Z"/>
    ${holes.map((x) => `<ellipse class="${tubes.some((t) => t.x === x) ? 't' : 'hole'}" cx="${x + 4}" cy="102" rx="10" ry="3.6"/>`).join('')}
    <path class="wood" d="M40 176H200V184H40Z"/><path class="o" d="M40 176H200V184H40Z"/>
    <path class="wood" d="M48 164H208L200 176H40Z"/><path class="o" d="M48 164H208L200 176H40Z"/>
    ${holes.map((x) => `<ellipse class="hole" cx="${x + 4}" cy="170" rx="10" ry="3.6"/>`).join('')}`;
  },

  'test-tube-holder': () => `
    <g transform="rotate(-16 150 110)">
      <path class="o" d="M150 92H200M150 112H200" stroke-width="3.4"/>
      <path class="glass" d="M161 30V182A14 14 0 0 0 189 182V30Z"/>
      <path class="liq" d="M162.5 150H187.5V182A12.5 12.5 0 0 1 162.5 182Z"/>
      <path class="o" d="M161 30V182A14 14 0 0 0 189 182V30"/>
      <path class="o" d="M156 26H194"/>
      <path class="o" d="M156 92H158M192 92H200V112H192M156 112H158" stroke-width="3.4"/>
      <path class="metal" d="M156 88H160V116H156Z"/><path class="t" d="M156 88H160V116H156Z"/>
      <path class="metal" d="M190 88H194V116H190Z"/><path class="t" d="M190 88H194V116H190Z"/>
      <path class="o" d="M150 92L118 97H30Q14 97 14 105Q14 113 30 113H118L150 112" stroke-width="3.4"/>
      <path class="o" d="M30 105H116"/>
      ${[122, 130, 138].map((x) => `<ellipse class="t" cx="${x}" cy="104.5" rx="3.6" ry="12"/>`).join('')}
    </g>`,

  'hot-plate': () => `
    <path class="metal" d="M30 136H206V186Q206 192 200 192H36Q30 192 30 186Z"/>
    <path class="metal" d="M206 136L228 110V160L206 186Z"/>
    <path class="surf" d="M30 136L52 110H228L206 136Z"/>
    <path class="o" d="M30 136L52 110H228L206 136ZM30 136V186Q30 192 36 192H200Q206 192 206 186V136M206 186L228 160V110"/>
    ${[60, 46, 32, 18].map((rx, i) => `<ellipse class="coil" cx="129" cy="123" rx="${rx}" ry="${(rx * 0.19).toFixed(1)}"${i ? '' : ' stroke-width="4"'}/>`).join('')}
    <circle class="surf" cx="176" cy="164" r="12"/><circle class="o" cx="176" cy="164" r="12"/><path class="o" d="M176 164L184 156"/>
    <circle class="lamp" cx="56" cy="164" r="6"/><circle class="t" cx="56" cy="164" r="6"/>
    <path class="o" d="M44 192V200M192 192V200"/>
    <path class="o" d="M228 138Q240 146 232 170Q226 190 236 214"/>`,

  'digital-scale': () => `
    <path class="metal" d="M36 140H204L214 196H26Z"/>
    <path class="metal" d="M46 124H194L204 140H36Z"/>
    <path class="o" d="M36 140H204L214 196H26ZM46 124H194L204 140H36"/>
    <path class="o" d="M112 116H128V124H112Z"/>
    <path class="surf" d="M50 96H190L206 110H34Z"/>
    <path class="metal" d="M34 110H206V116H34Z"/>
    <path class="o" d="M50 96H190L206 110H34ZM34 110V116H206V110"/>
    <rect class="screen" x="62" y="152" width="80" height="28" rx="4"/><rect class="t" x="62" y="152" width="80" height="28" rx="4"/>
    <text x="102" y="172" font-size="17" text-anchor="middle" class="mono">0.00</text>
    <rect class="surf" x="154" y="158" width="18" height="12" rx="3"/><rect class="t" x="154" y="158" width="18" height="12" rx="3"/>
    <rect class="surf" x="178" y="158" width="18" height="12" rx="3"/><rect class="t" x="178" y="158" width="18" height="12" rx="3"/>`,

  'meter-stick': () => {
    let t = '', n = '';
    for (let i = 0; i <= 44; i++) {
      const x = 12 + i * 4.9;
      t += `M${r1(x)} 98v${i % 2 === 0 ? (i % 4 === 0 ? 16 : 10) : 6}`;
      if (i % 4 === 0 && i > 0 && i < 44) n += `<text x="${r1(x)}" y="133">${i / 2 + 0}</text>`;
    }
    return `
    <path class="wood" d="M8 98H232V142H8Z"/>
    <path class="wood2" d="M8 142H232L226 152H14Z"/>
    <path class="o" d="M8 98H232V142H8ZM8 142L14 152H226L232 142"/>
    <path class="t" d="${t}"/>
    <g font-size="11" font-weight="700" text-anchor="middle">${n}</g>`;
  },

  thermometer: () => {
    const L = [], R = [];
    for (let i = 0; i <= 16; i++) { const y = 34 + i * 9.5; L.push({ y, len: i % 2 ? -5 : -9 }); R.push({ y, len: i % 2 ? 5 : 9 }); }
    return `
    <rect class="surf" x="70" y="12" width="100" height="220" rx="16"/><rect class="o" x="70" y="12" width="100" height="220" rx="16"/>
    <path class="glass" d="M114 30A6 6 0 0 1 126 30V188H114Z"/>
    <path class="red" d="M116.5 96H123.5V192H116.5Z"/>
    <circle class="red" cx="120" cy="200" r="14"/>
    <path class="o" d="M114 188V30A6 6 0 0 1 126 30V188"/>
    <circle class="o" cx="120" cy="200" r="14"/>
    <path class="t" d="${ticks(110, L)}${ticks(130, R)}"/>
    <g font-size="10" text-anchor="end"><text x="99" y="38">40</text><text x="99" y="76">20</text><text x="99" y="114">0</text><text x="99" y="152">-20</text><text x="99" y="190">-40</text></g>
    <g font-size="10"><text x="141" y="38">104</text><text x="141" y="76">68</text><text x="141" y="114">32</text><text x="141" y="152">-4</text><text x="141" y="190">-40</text></g>
    <g font-size="10" font-weight="800" text-anchor="middle"><text x="96" y="26">°C</text><text x="145" y="26">°F</text></g>`;
  },

  'beaker-tongs': () => `
    <path class="o" d="M120 116L96 46Q88 20 76 24Q64 28 70 50L100 132" stroke-width="4"/>
    <path class="o" d="M120 116L144 46Q152 20 164 24Q176 28 170 50L140 132" stroke-width="4"/>
    <path class="o" d="M120 116L150 150Q176 176 158 204Q150 214 138 214" stroke-width="5"/>
    <path class="o" d="M120 116L90 150Q64 176 82 204Q90 214 102 214" stroke-width="5"/>
    <path class="pad" d="M162 166Q176 186 160 206Q152 214 140 216"/>
    <path class="pad" d="M78 166Q64 186 80 206Q88 214 100 216"/>
    <circle class="metal" cx="120" cy="116" r="7"/><circle class="o" cx="120" cy="116" r="7"/>`,

  funnel: () => `
    <path class="glass" d="M36 44L108 138V212L116 222H124V138L204 44Z"/>
    <path class="o" d="M36 44L108 138V210Q108 218 116 222H124Q132 218 132 210V138L204 44"/>
    <ellipse class="glass" cx="120" cy="44" rx="84" ry="12"/><ellipse class="o" cx="120" cy="44" rx="84" ry="12"/>
    <path class="hl" d="M62 64L112 128M116 150V206"/>`,

  spatula: () => `
    <g transform="rotate(-40 120 120)">
      <rect class="metal" x="52" y="115" width="140" height="10" rx="5"/><rect class="o" x="52" y="115" width="140" height="10" rx="5"/>
      <ellipse class="metal" cx="36" cy="120" rx="24" ry="15"/><ellipse class="o" cx="36" cy="120" rx="24" ry="15"/>
      <ellipse class="powder" cx="34" cy="118" rx="14" ry="8"/>
      <path class="metal" d="M188 111H228Q234 111 234 117V123Q234 129 228 129H188Z"/><path class="o" d="M188 111H228Q234 111 234 117V123Q234 129 228 129H188Z"/>
    </g>
    <g class="powder">${[[24, 196], [36, 206], [18, 210], [30, 216]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join('')}</g>`,

  pipette: () => `
    <g transform="rotate(22 120 120)">
      <path class="glass" d="M106 20Q120 8 134 20Q142 30 142 56Q142 84 128 94V200L121 228H119L112 200V94Q98 84 98 56Q98 30 106 20Z"/>
      <path class="liq" d="M113.5 170H126.5V200L120.5 224H119.5L113.5 200Z"/>
      <path class="o" d="M106 20Q120 8 134 20Q142 30 142 56Q142 84 128 94V200L121 228H119L112 200V94Q98 84 98 56Q98 30 106 20Z"/>
      <path class="t" d="${[112, 124, 136, 148, 160, 172, 184].map((y, i) => `M113 ${y}h${i % 3 === 0 ? 9 : 5}`).join('')}"/>
      <path class="hl" d="M108 32Q104 50 108 72"/>
    </g>`,

  dropper: () => `
    <path class="rub" d="M98 72V36Q98 12 120 12Q142 12 142 36V72Z"/>
    <path class="o" d="M98 72V36Q98 12 120 12Q142 12 142 36V72Z"/>
    <path class="t hl2" d="M104 40H136M104 50H136M104 60H136"/>
    <path class="rub" d="M92 72H148V86H92Z"/><path class="o" d="M92 72H148V86H92Z"/>
    <path class="glass" d="M110 86V168L118 198H122L130 168V86Z"/>
    <path class="liq" d="M111.5 146H128.5V168L121 196.5H119L111.5 168Z"/>
    <path class="o" d="M110 86V168L118 198H122L130 168V86"/>
    <path class="liq" d="M120 208Q113 218 113 223A7 7 0 0 0 127 223Q127 218 120 208Z"/>
    <path class="t" d="M120 208Q113 218 113 223A7 7 0 0 0 127 223Q127 218 120 208Z"/>
    <path class="hl" d="M116 96V160"/>`,

  goggles: () => `
    <path class="rub" d="M4 96Q30 90 44 94V114Q30 118 4 114Z"/><path class="rub" d="M236 96Q210 90 196 94V114Q210 118 236 114Z"/>
    <path class="o" d="M4 96Q30 90 44 94M4 114Q30 118 44 114M236 96Q210 90 196 94M236 114Q210 118 196 114"/>
    <path class="metal" d="M40 80Q40 58 64 58H176Q200 58 200 80V124Q200 150 176 150H150Q136 150 130 138Q120 122 110 138Q104 150 90 150H64Q40 150 40 124Z"/>
    <path class="glass" d="M52 84Q52 70 68 70H172Q188 70 188 84V122Q188 138 172 138H152Q142 138 136 128Q120 106 104 128Q98 138 88 138H68Q52 138 52 122Z"/>
    <path class="o" d="M40 80Q40 58 64 58H176Q200 58 200 80V124Q200 150 176 150H150Q136 150 130 138Q120 122 110 138Q104 150 90 150H64Q40 150 40 124Z"/>
    <path class="t" d="M52 84Q52 70 68 70H172Q188 70 188 84V122Q188 138 172 138H152Q142 138 136 128Q120 106 104 128Q98 138 88 138H68Q52 138 52 122Z"/>
    <g class="dots">${[70, 86, 102, 118, 134, 150, 166].map((x) => `<circle cx="${x}" cy="64" r="2.2"/>`).join('')}</g>
    <path class="hl" d="M66 80Q64 96 70 112M160 80Q164 90 166 104"/>`,

  'heat-gloves': () => `
    <path class="glove" d="M70 174V120L46 94Q38 84 46 78Q54 72 62 80L78 96V50Q78 40 88 40Q98 40 98 50V84Q99 88 100 84V38Q100 28 110 28Q120 28 120 38V82Q121 86 122 82V42Q122 32 132 32Q142 32 142 42V86Q143 90 144 86V58Q144 48 153 48Q162 48 162 58V130Q166 150 166 174Z"/>
    <path class="o" d="M70 174V120L46 94Q38 84 46 78Q54 72 62 80L78 96V50Q78 40 88 40Q98 40 98 50V84Q99 88 100 84V38Q100 28 110 28Q120 28 120 38V82Q121 86 122 82V42Q122 32 132 32Q142 32 142 42V86Q143 90 144 86V58Q144 48 153 48Q162 48 162 58V130Q166 150 166 174"/>
    <path class="t" d="M80 128Q96 140 112 132"/>
    <rect class="cuff" x="62" y="170" width="112" height="54" rx="8"/>
    <path class="t" d="M74 170L62 186M96 170L66 212M118 170L84 224M140 170L106 224M162 170L128 224M174 184L150 224M174 208L170 224"/>
    <rect class="o" x="62" y="170" width="112" height="54" rx="8"/>`,

  'fire-extinguisher': () => `
    <path class="red" d="M90 96Q90 70 120 70Q150 70 150 96V214Q150 222 142 222H98Q90 222 90 214Z"/>
    <path class="o" d="M90 96Q90 70 120 70Q150 70 150 96V214Q150 222 142 222H98Q90 222 90 214Z"/>
    <rect class="surf" x="100" y="122" width="40" height="48" rx="4"/><rect class="t" x="100" y="122" width="40" height="48" rx="4"/>
    <path class="t" d="M108 136H132M108 146H132M108 156H124"/>
    <path class="rub" d="M90 206H150V214Q150 222 142 222H98Q90 222 90 214Z"/>
    <path class="metal" d="M110 54H130V72H110Z"/><path class="o" d="M110 54H130V72H110Z"/>
    <path class="metal" d="M100 42H146L154 50H100Z"/><path class="o" d="M100 42H146L154 50H100Z"/>
    <path class="metal" d="M104 40L62 26Q56 24 58 30L100 48Z"/><path class="o" d="M104 40L62 26Q56 24 58 30L100 48Z"/>
    <path class="metal" d="M104 50L66 50Q60 52 64 56L104 56Z"/><path class="o" d="M104 50L66 50Q60 52 64 56L104 56Z"/>
    <circle class="surf" cx="138" cy="62" r="7"/><circle class="t" cx="138" cy="62" r="7"/><path class="t" d="M138 62L141 58"/>
    <path class="o" d="M150 50Q176 52 178 90Q180 130 170 150" stroke-width="5"/>
    <path class="rub" d="M164 148H178L182 166H160Z"/><path class="o" d="M164 148H178L182 166H160Z"/>
    <path class="hl" d="M100 96V190"/>`,
};
const drawEquipment = (id) => {
  const e = eqByName(id);
  if (!e) throw new Error(`No drawing for "${id}"`);
  return svg(240, 240, DRAW[e.id](), e.look, `eq eq-${e.id}`);
};

function genEquipment(opts = {}) {
  const e = eqByName(opts.item) || pick(EQUIPMENT);
  const variant = opts.variant || (Math.random() < 0.5 ? 'name' : 'use');
  const pool = (variant === 'name' ? e.alts : e.useAlts).map((id) => EQ.get(id)).filter((x) => x && !(e.avoid || []).includes(x.id));
  const others = shuffle(pool).slice(0, 3);
  const base = { id: `vis:equipment:${e.id}`, type: 'mc', setId: 'c1', page: e.page, figure: drawEquipment(e.id), figureAlt: e.look, kind: 'gen' };
  if (variant === 'use') {
    return { ...base, ask: 'Picture quiz · lab equipment', prompt: 'What is this used for?', options: shuffle([e.use, ...others.map((o) => o.use)]), answer: e.use,
      explanation: `Pictured: ${e.name} — ${e.use}.` };
  }
  return { ...base, ask: 'Picture quiz · lab equipment', prompt: 'What is this?', options: shuffle([e.name, ...others.map((o) => o.name)]), answer: e.name,
    explanation: `${e.name}: ${e.use}.` };
}

/* ======================================================== 2. TARGETS
   Concept 2, slide 3: four bullseyes, labelled word for word as below.
   Shots are placed so the category is never a judgement call:
   precise = every shot within 11 units of the group's centre (a tight blob);
   accurate = the group's centre within 4 units of the bullseye;
   spread = no two shots closer than 26 units; off-centre = the group's centre
   at least 40 units from the bullseye (the target's radius is 100). */
const TARGETS = [
  { id: 'precise-accurate', label: 'Precise and Accurate', why: 'The shots are close together (precise) and centred on the bullseye (accurate).',
    look: 'all of the shots touching or overlapping one another, inside the centre circle' },
  { id: 'precise-not-accurate', label: 'Precise but not Accurate', why: 'The shots are close together (precise), but the group is away from the bullseye (not accurate).',
    look: 'all of the shots touching or overlapping one another, in one small patch out in the outer rings' },
  { id: 'accurate-not-precise', label: 'Accurate but not Precise', why: 'The shots are spread apart (not precise), but they surround the bullseye evenly, so their average is on it (accurate).',
    look: 'the shots far apart from one another, placed at even intervals in a ring around the centre circle' },
  { id: 'neither', label: 'Not Accurate or Precise', why: 'The shots are spread apart (not precise) and scattered off to one side of the bullseye (not accurate).',
    look: 'the shots far apart from one another, spread across one side of the target in the outer rings' },
];
const TG = new Map(TARGETS.map((t) => [t.id, t]));
const polar = (r, a) => [Math.cos(a) * r, Math.sin(a) * r];
const centroid = (pts) => pts.reduce(([sx, sy], [x, y]) => [sx + x / pts.length, sy + y / pts.length], [0, 0]);
const minGap = (pts) => { let m = Infinity; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) m = Math.min(m, Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1])); return m; };
function dirWord(x, y) {
  const a = (Math.atan2(y, x) * 180) / Math.PI;   // screen y points down
  if (a > -22.5 && a <= 22.5) return 'right';
  if (a > 22.5 && a <= 67.5) return 'lower right';
  if (a > 67.5 && a <= 112.5) return 'bottom';
  if (a > 112.5 && a <= 157.5) return 'lower left';
  if (a > -67.5 && a <= -22.5) return 'upper right';
  if (a > -112.5 && a <= -67.5) return 'top';
  if (a > -157.5 && a <= -112.5) return 'upper left';
  return 'left';
}
/** Shot positions (target units, radius 100, origin at the bullseye). */
function placeShots(kind) {
  const n = irnd(5, 6);
  for (let tries = 0; tries < 400; tries++) {
    let pts;
    if (kind === 'precise-accurate' || kind === 'precise-not-accurate') {
      const [cx, cy] = kind === 'precise-accurate' ? polar(rnd(0, 2.5), rnd(0, 7)) : polar(rnd(52, 66), rnd(0, Math.PI * 2));
      // a jittered rosette: one shot near the middle, the rest around it
      const a0 = rnd(0, Math.PI * 2);
      const offs = Array.from({ length: n }, (_, i) => (i ? polar(rnd(6.5, 9.5), a0 + (i * 2 * Math.PI) / (n - 1) + rnd(-0.22, 0.22)) : polar(rnd(0, 2), rnd(0, 7))));
      // centre the group exactly on its chosen point
      const [ox, oy] = centroid(offs);
      pts = offs.map(([dx, dy]) => [cx + dx - ox, cy + dy - oy]);
      // tight enough to read as one group, loose enough to count the shots
      if (pts.some(([x, y]) => Math.hypot(x - cx, y - cy) > 11) || minGap(pts) < 4.5) continue;
    } else if (kind === 'accurate-not-precise') {
      const a0 = rnd(0, Math.PI * 2);
      pts = Array.from({ length: n }, (_, i) => polar(rnd(30, 44), a0 + (i * 2 * Math.PI) / n + rnd(-0.18, 0.18)));
      // re-centre the ring exactly so the average is on the bullseye
      const [gx, gy] = centroid(pts);
      pts = pts.map(([x, y]) => [x - gx, y - gy]);
      if (minGap(pts) < 26) continue;
    } else {
      const a0 = rnd(0, Math.PI * 2);
      const span = rnd(1.8, 2.4);   // an arc of roughly 100–140°
      pts = Array.from({ length: n }, (_, i) => polar(rnd(44, 92), a0 + (i * span) / (n - 1) + rnd(-0.12, 0.12)));
      const [gx, gy] = centroid(pts);
      if (Math.hypot(gx, gy) < 40 || minGap(pts) < 26) continue;
    }
    return pts;
  }
  // Never reached in practice (0 failures in 12 000 tries); a fixed layout
  // that meets every rule keeps a figure from ever failing to draw.
  return {
    'precise-accurate': [[0, 0], [7, 1], [-6, 3], [2, -7], [-3, 6]],
    'precise-not-accurate': [[58, 20], [65, 21], [52, 23], [60, 13], [57, 27]],
    'accurate-not-precise': [[36, 0], [11, 34], [-29, 21], [-29, -21], [11, -34]],
    neither: [[80, -30], [62, 12], [70, 50], [40, 72], [30, -60]],
  }[kind];
}
function drawTarget(kind, pts = placeShots(kind)) {
  const t = TG.get(kind);
  const C = 120, S = 1;   // centre, scale (one target unit = one px)
  const bands = [100, 86, 72, 58, 44, 30, 16];
  let rings = bands.map((r, i) => `<circle class="${i % 2 ? 'ring-b' : 'ring-a'}" cx="${C}" cy="${C}" r="${r * S}"/>`).join('');
  rings += `<circle class="t" cx="${C}" cy="${C}" r="${100 * S}"/>`;
  const shots = pts.map(([x, y]) => `<circle class="shot" cx="${r1(C + x * S)}" cy="${r1(C + y * S)}" r="6.5"/>`).join('');
  const [gx, gy] = centroid(pts);
  const where = kind === 'accurate-not-precise' || kind === 'precise-accurate' ? '' : ` towards the ${dirWord(gx, gy)}`;
  const alt = `A bullseye target with ${pts.length} shots: ${t.look}${where}.`;
  return { svg: svg(240, 240, rings + shots, alt, 'target'), alt };
}
function genTargets(opts = {}) {
  const t = TG.get(opts.item) || pick(TARGETS);
  const { svg: fig, alt } = drawTarget(t.id);
  return {
    id: `vis:targets:${t.id}`, kind: 'gen', type: 'mc', setId: 'c2', page: 3,
    ask: 'Picture quiz · accuracy and precision',
    prompt: pick(['The bullseye is the accepted value. How would you describe these shots?', 'Which label fits this target?']),
    figure: fig, figureAlt: alt,
    options: shuffle(TARGETS.map((x) => x.label)), answer: t.label,
    explanation: `${t.label}. ${t.why} Accuracy is how close results are to the accepted value; precision is how close they are to each other.`,
  };
}

/* ======================================================= 3. MENISCUS
   Concept 2, slide 8: "When measuring with a graduated cylinder, always
   measure to the bottom of the meniscus (the curve in the liquid)."
   A close-up of the scale: the level always sits on a line, and the curve is
   exactly two small lines deep, so the top edge is a distinct, readable
   wrong answer. */
const SCALES = [
  { minor: 1, every: 5 },     // labels 5 mL apart, 1 mL lines
  { minor: 2, every: 5 },     // labels 10 mL apart, 2 mL lines
  { minor: 0.2, every: 5 },   // labels 1 mL apart, 0.2 mL lines
  { minor: 0.5, every: 10 },  // labels 5 mL apart, 0.5 mL lines
];
const decimals = (m) => (m < 1 ? 1 : 0);
const fmtMl = (v, sc) => `${v.toFixed(decimals(sc.minor))} mL`;
const ordinal = (n) => `${n}${['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : n % 10] || 'th'}`;

function meniscusSpec(opts = {}) {
  const sc = opts.scale || pick(SCALES);
  const N = 18;                                   // lines in the window
  const firstLabel = irnd(1, 6) * sc.every;       // the first labelled line's tick index
  // tick index at the bottom of the window: low enough that the next label
  // up is inside it too, so there are always two labels to work the scale out
  const start = firstLabel - irnd(1, Math.min(sc.every - 1, N - sc.every));
  const level = opts.level != null ? opts.level : start + irnd(3, N - 6); // bottom of the curve
  return { sc, N, start, level };
}
/** Draws the scale; returns svg plus the readings a question needs. */
function drawMeniscus(spec, { annotate = false, small = false } = {}) {
  const { sc, N, start, level } = spec;
  const X0 = 58, X1 = 182, TOP = 32, GAP = 11;
  const y = (i) => TOP + (N - (i - start)) * GAP;   // tick index → y (higher value, higher up)
  const val = (i) => i * sc.minor;
  const top = level + 2;
  const yB = y(level), yT = y(top);
  const ctrl = 2 * yB - yT;
  const mid = (X0 + X1) / 2;
  let tk = '', lab = '';
  for (let i = start; i <= start + N; i++) {
    const major = i % sc.every === 0;
    const half = !major && sc.every === 10 && i % 5 === 0;
    tk += `M${X0} ${r1(y(i))}h${major ? 78 : half ? 64 : 52}`;
    if (major) lab += `<text class="halo" x="${X0 + 84}" y="${r1(y(i) + 4.5)}">${+val(i).toFixed(1)}</text>`;
  }
  const body = `
    <path class="glass" d="M${X0} 4V236H${X1}V4Z"/>
    <path class="liq" d="M${X0 + 1.5} ${r1(yT)}Q${mid} ${r1(ctrl)} ${X1 - 1.5} ${r1(yT)}V236H${X0 + 1.5}Z"/>
    <path class="t" d="M${X0} ${r1(yT)}Q${mid} ${r1(ctrl)} ${X1} ${r1(yT)}" stroke-width="2.2"/>
    <path class="t" d="${tk}"/>
    <g font-size="13.5" font-weight="800">${lab}</g>
    <text class="halo" x="${X1 - 6}" y="19" font-size="12" text-anchor="end">mL</text>
    <path class="o" d="M${X0} 4V236M${X1} 4V236"/>
    ${annotate ? `
      <path class="mark-good" d="M${mid} ${r1(yB)}H${X1 + 26}"/>
      <path class="mark-bad" d="M${X1} ${r1(yT)}H${X1 + 26}"/>
      <text class="mark-good-t" x="${X1 + 30}" y="${r1(yB + 12)}" font-size="17">✓ bottom</text>
      <text class="mark-bad-t" x="${X1 + 30}" y="${r1(yT - 4)}" font-size="17">✗ top</text>` : ''}`;
  // Where a line sits, counted from the labelled line at or below it.
  const place = (i) => {
    const lb = Math.floor(i / sc.every) * sc.every, k = i - lb;
    return k ? `the ${ordinal(k)} small line above the ${+val(lb).toFixed(1)} mark` : `the ${+val(lb).toFixed(1)} mark itself`;
  };
  const alt = `Close-up of a graduated cylinder scale in millilitres, labelled every ${+(sc.minor * sc.every).toFixed(1)} mL with ${sc.every - 1} small lines between labels${sc.every === 10 ? ' (a longer one halfway)' : ''}. The liquid's surface is curved: where it touches the glass walls it is level with ${place(top)}; at the centre of the tube it is level with ${place(level)}.`;
  const w = annotate ? 310 : 240;
  return { svg: svg(w, 240, body, annotate ? `The same scale, marked: the bottom of the curve reads ${fmtMl(val(level), sc)}; the top edge, where the liquid meets the glass, reads ${fmtMl(val(top), sc)}.` : alt, `meniscus${small ? ' small' : ''}`),
    alt, reading: val(level), topReading: val(top) };
}
function genMeniscus(opts = {}) {
  const spec = meniscusSpec(opts);
  const { sc, level } = spec;
  const m = drawMeniscus(spec);
  const answer = fmtMl(m.reading, sc);
  const wrongs = [m.topReading, (level + 1) * sc.minor, (level - 1) * sc.minor, (level - 2) * sc.minor]
    .filter((v) => v >= 0).map((v) => fmtMl(v, sc));
  // The top-edge reading is always offered: it is the mistake the notes warn about.
  const others = [fmtMl(m.topReading, sc), ...shuffle([...new Set(wrongs.slice(1))].filter((w) => w !== answer && w !== fmtMl(m.topReading, sc))).slice(0, 2)];
  const exp = el('div', { class: 'vz-explain' },
    el('div', { class: 'vz-explain-fig', html: drawMeniscus(spec, { annotate: true, small: true }).svg }),
    el('div', {},
      el('p', {}, 'Always measure to the ', el('b', {}, 'bottom of the meniscus'), ' (the curve in the liquid).'),
      el('p', {}, `Each small line is ${+sc.minor.toFixed(1)} mL. The bottom of the curve is on ${answer}; the top edge, where the liquid climbs the glass, would read ${fmtMl(m.topReading, sc)} — too high.`)));
  return {
    id: 'vis:meniscus:read', kind: 'gen', type: 'mc', setId: 'c2', page: 8,
    ask: 'Picture quiz · graduated cylinder',
    prompt: 'What volume does this graduated cylinder read?',
    figure: m.svg, figureAlt: m.alt,
    options: shuffle([answer, ...others]), answer, explanation: exp,
    explanationText: `Measure to the bottom of the meniscus: ${answer} (the top edge reads ${fmtMl(m.topReading, sc)}).`,
  };
}

/* ========================================================= 4. GRAPHS
   Concept 4, slides 12–13: the three main types of graphs, the data each one
   shows, and what every graph must have (title, x- and y-axis labels, even
   scale, key if needed). Data mimics the notes' own examples. */
const GRAPH_TYPES = {
  line: { name: 'Line graph', data: 'Quantitative data vs. quantitative data' },
  bar: { name: 'Bar graph', data: 'Qualitative data vs. quantitative data' },
  circle: { name: 'Circle (pie) graph', data: 'Percentages' },
};
const DATA_WRONG = 'Qualitative data vs. qualitative data';
const MUST = { title: 'Title', x: 'X-axis label', y: 'Y-axis label', scale: 'Even scale', key: 'Key' };
const SUBJECTS = ['Math', 'Science', 'English', 'History'];

function graphSpec(opts = {}) {
  const type = opts.graph || pick(['line', 'bar', 'circle']);
  const missing = type === 'circle' ? null : (opts.missing || null);
  const series = missing === 'key' ? 2 : missing ? (Math.random() < 0.4 ? 2 : 1) : (opts.series || (Math.random() < 0.35 ? 2 : 1));
  const g = { type, missing, series };
  if (type === 'line') {
    g.title = 'The change in plant height over time'; g.xl = 'Time (days)'; g.yl = 'Height (cm)';
    g.xs = [0, 2, 4, 6, 8, 10];
    g.names = ['Plant A', 'Plant B'];
    g.data = Array.from({ length: series }, (_, s) => { let h = irnd(1, 3); return g.xs.map((x, i) => (i ? (h += irnd(1, s ? 2 : 4)) : h)); });
    g.ys = missing === 'scale' ? pick([[0, 2, 3, 10, 12, 30], [0, 5, 6, 10, 20, 40], [0, 1, 5, 6, 15, 30]]) : [0, 5, 10, 15, 20, 25];
  } else if (type === 'bar') {
    g.title = 'Student Subject Preferences'; g.xl = 'Subject'; g.yl = '# of Students';
    g.xs = SUBJECTS;
    g.names = ['1st period', '2nd period'];
    g.data = Array.from({ length: series }, () => g.xs.map(() => irnd(2, 12)));
    g.ys = missing === 'scale' ? pick([[0, 1, 2, 6, 7, 14], [0, 2, 3, 8, 10, 16], [0, 4, 5, 6, 12, 16]]) : [0, 2, 4, 6, 8, 10, 12, 14];
  } else {
    g.title = 'Grade Breakdown for Test';
    const pies = [[40, 45, 15], [30, 40, 20, 10], [25, 35, 25, 10, 5], [45, 30, 15, 10], [20, 45, 20, 10, 5]];
    g.data = pick(pies);
    g.names = ["A's", "B's", "C's", "D's", "F's"].slice(0, g.data.length);
  }
  return g;
}
/** Maps a data value onto an axis whose labels may be unevenly spaced, the
    way a hand-drawn graph with a bad scale would plot it. */
function axisPos(v, ys, y0, y1) {
  const step = (y0 - y1) / (ys.length - 1);
  for (let i = 1; i < ys.length; i++) {
    if (v <= ys[i]) return y0 - step * (i - 1 + (v - ys[i - 1]) / (ys[i] - ys[i - 1]));
  }
  return y1;
}
function drawGraph(g) {
  const W = 340, H = 240;
  const id = `vz${++uid}`;
  const hasKey = g.series === 2 && g.missing !== 'key';
  const parts = [];
  const altBits = [];
  if (g.missing !== 'title') { parts.push(`<text x="${W / 2}" y="17" font-size="13.5" font-weight="800" text-anchor="middle">${esc(g.title)}</text>`); altBits.push(`A graph titled "${g.title}".`); }
  else altBits.push('A graph.');
  if (g.type === 'circle') {
    const cx = 170, cy = 130, R = 78;
    let a = -Math.PI / 2;
    const fills = ['c1', 'c2', 'c3', 'c4', 'c5'];
    g.data.forEach((p, i) => {
      const a1 = a + (p / 100) * Math.PI * 2;
      const [x0, y0] = [cx + R * Math.cos(a), cy + R * Math.sin(a)];
      const [x1, y1] = [cx + R * Math.cos(a1), cy + R * Math.sin(a1)];
      parts.push(`<path class="slice ${fills[i]}" d="M${cx} ${cy}L${r1(x0)} ${r1(y0)}A${R} ${R} 0 ${p > 50 ? 1 : 0} 1 ${r1(x1)} ${r1(y1)}Z"/>`);
      const m = (a + a1) / 2;
      const lx = cx + (R + 12) * Math.cos(m), ly = cy + (R + 12) * Math.sin(m);
      const anchor = Math.cos(m) > 0.25 ? 'start' : Math.cos(m) < -0.25 ? 'end' : 'middle';
      parts.push(`<path class="t" d="M${r1(cx + (R - 6) * Math.cos(m))} ${r1(cy + (R - 6) * Math.sin(m))}L${r1(cx + (R + 7) * Math.cos(m))} ${r1(cy + (R + 7) * Math.sin(m))}"/>`);
      parts.push(`<text x="${r1(lx)}" y="${r1(ly + (Math.sin(m) > 0.5 ? 10 : Math.sin(m) < -0.5 ? -2 : 4))}" font-size="12" font-weight="700" text-anchor="${anchor}">${p}% ${esc(g.names[i])}</text>`);
      a = a1;
    });
    altBits.push(`The whole is divided into parts marked ${g.data.map((p, i) => `${p}% ${g.names[i]}`).join(', ')}.`);
    return { svg: svg(W, H, parts.join(''), altBits.join(' '), 'graph'), alt: altBits.join(' ') };
  }
  const L = 58, R = 322, T = hasKey ? 52 : 32, B = 196;
  // axes + grid
  const yPos = (v) => axisPos(v, g.ys, B, T + 6);
  g.ys.forEach((v, i) => {
    const yy = B - ((B - T - 6) / (g.ys.length - 1)) * i;
    if (i) parts.push(`<path class="grid" d="M${L} ${r1(yy)}H${R}"/>`);
    parts.push(`<path class="t" d="M${L - 5} ${r1(yy)}H${L}"/><text x="${L - 8}" y="${r1(yy + 4)}" font-size="11" text-anchor="end">${v}</text>`);
  });
  const xStep = (R - L) / (g.type === 'line' ? g.xs.length - 1 : g.xs.length);
  const xPos = (i) => (g.type === 'line' ? L + xStep * i : L + xStep * (i + 0.5));
  g.xs.forEach((x, i) => {
    parts.push(`<path class="t" d="M${r1(xPos(i))} ${B}V${B + 5}"/><text x="${r1(xPos(i))}" y="${B + 17}" font-size="11" text-anchor="middle">${esc(x)}</text>`);
  });
  if (g.type === 'line') {
    g.data.forEach((ds, s) => {
      const pts = ds.map((v, i) => [r1(xPos(i)), r1(yPos(v))]);
      parts.push(`<path class="series s${s + 1}" d="M${pts.map((p) => p.join(' ')).join('L')}"/>`);
      pts.forEach(([x, y]) => parts.push(s ? `<rect class="mk s2" x="${x - 4.5}" y="${y - 4.5}" width="9" height="9"/>` : `<circle class="mk s1" cx="${x}" cy="${y}" r="4.5"/>`));
    });
  } else {
    const bw = xStep * (g.series === 2 ? 0.34 : 0.56);
    parts.push(`<defs><pattern id="${id}h" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" class="hatch-bg"/><path d="M0 0V6" class="hatch"/></pattern></defs>`);
    g.data.forEach((ds, s) => ds.forEach((v, i) => {
      const x = xPos(i) - (g.series === 2 ? bw * (s ? 0 : 1) + (s ? 1.5 : -1.5) : bw / 2);
      const yy = yPos(v);
      parts.push(`<rect class="bar b${s + 1}" x="${r1(x)}" y="${r1(yy)}" width="${r1(bw)}" height="${r1(B - yy)}"${s ? ` fill="url(#${id}h)"` : ''}/>`);
    }));
  }
  parts.push(`<path class="o" d="M${L} ${T}V${B}H${R}" stroke-width="2.4"/>`);
  if (g.missing !== 'x') parts.push(`<text x="${(L + R) / 2}" y="${H - 6}" font-size="12.5" font-weight="700" text-anchor="middle">${esc(g.xl)}</text>`);
  if (g.missing !== 'y') parts.push(`<text x="16" y="${(T + B) / 2}" font-size="12.5" font-weight="700" text-anchor="middle" transform="rotate(-90 16 ${(T + B) / 2})">${esc(g.yl)}</text>`);
  if (hasKey) {
    // a one-row key under the title, so the plot keeps its full width
    const swatch = (s, x, yy) => (g.type === 'line'
      ? `<path class="series s${s + 1}" d="M${x} ${yy - 4}h22"/>${s ? `<rect class="mk s2" x="${x + 7}" y="${yy - 8}" width="8" height="8"/>` : `<circle class="mk s1" cx="${x + 11}" cy="${yy - 4}" r="4"/>`}`
      : `<rect class="bar b${s + 1}" x="${x + 4}" y="${yy - 10}" width="14" height="12"${s ? ` fill="url(#${id}h)"` : ''}/>`);
    const yy = 41, w = 250, kx = (W - w) / 2 + 10;
    parts.push(`<rect class="keybox" x="${kx}" y="${yy - 14}" width="${w}" height="20" rx="5"/><text x="${kx + 8}" y="${yy}" font-size="11" font-weight="800">Key:</text>`);
    g.names.forEach((n, s) => {
      const x = kx + 42 + s * 104;
      parts.push(`${swatch(s, x, yy)}<text x="${x + 28}" y="${yy}" font-size="11">${esc(n)}</text>`);
    });
  }
  // A description that names what is there — and leaves out what is not,
  // exactly as a sighted student would have to notice it.
  const xDesc = g.type === 'line' ? `numbers ${g.xs.join(', ')}` : g.xs.join(', ');
  altBits.push(`Along the bottom: ${xDesc}${g.missing === 'x' ? '' : `, labelled "${g.xl}"`}.`);
  altBits.push(`Up the side: ${g.ys.join(', ')}${g.missing === 'y' ? '' : `, labelled "${g.yl}"`}.`);
  const unit = g.type === 'line' ? 'value' : 'amount';
  if (g.series === 2) altBits.push(`Two sets of data are shown, one drawn solid and one ${g.type === 'line' ? 'dashed' : 'striped'}${hasKey ? `, with a key naming them "${g.names[0]}" and "${g.names[1]}"` : ''}.`);
  else altBits.push(`One ${unit} is shown for each ${g.type === 'line' ? 'number' : 'subject'}.`);
  const alt = altBits.join(' ');
  return { svg: svg(W, H, parts.join(''), alt, 'graph'), alt };
}
function genGraphs(opts = {}) {
  // item forms: type-line, data-bar, missing-title …
  let [ask, detail] = String(opts.item || '').split('-');
  if (!['type', 'data', 'missing'].includes(ask)) ask = pick(['type', 'type', 'data', 'missing', 'missing']);
  const graph = ask === 'missing' ? pick(['line', 'bar']) : (GRAPH_TYPES[detail] ? detail : pick(['line', 'bar', 'circle']));
  const missing = ask === 'missing' ? (MUST[detail] ? detail : pick(Object.keys(MUST))) : null;
  const g = graphSpec({ graph, missing });
  const { svg: fig, alt } = drawGraph(g);
  const T = GRAPH_TYPES[graph];
  const base = { kind: 'gen', type: 'mc', setId: 'c4', figure: fig, figureAlt: alt, ask: 'Picture quiz · graphs' };
  if (ask === 'type') {
    return { ...base, id: `vis:graphs:type-${graph}`, page: 12, prompt: 'What type of graph is this?',
      options: shuffle(Object.values(GRAPH_TYPES).map((x) => x.name)), answer: T.name,
      explanation: `${T.name}: ${T.data.toLowerCase()}. ${graph === 'line' ? 'Plant height (a number) against time (a number).' : graph === 'bar' ? 'Subjects (descriptions) against # of students (numbers).' : 'Each slice is a percentage of the whole.'}` };
  }
  if (ask === 'data') {
    return { ...base, id: `vis:graphs:data-${graph}`, page: 12, prompt: `This is a ${T.name.toLowerCase()}. What kind of data does this type of graph show?`,
      options: shuffle([...Object.values(GRAPH_TYPES).map((x) => x.data), DATA_WRONG]), answer: T.data,
      explanation: `The notes: line graph — quantitative vs. quantitative; bar graph — qualitative vs. quantitative; circle (pie) graph — percentages. Quantitative data is numerical; qualitative data is descriptive.` };
  }
  const miss = MUST[missing];
  const opts2 = shuffle(Object.keys(MUST).filter((k) => k !== missing)).slice(0, 3).map((k) => MUST[k]);
  const why = {
    title: 'There is no title saying what the graph is about.',
    x: 'The x-axis (along the bottom) has no label saying what was measured.',
    y: 'The y-axis (up the side) has no label saying what was measured.',
    scale: `The y-axis numbers (${g.ys.join(', ')}) go up by different amounts, so the scale is not even.`,
    key: 'It shows two sets of data but no key to say which is which.',
  }[missing];
  return { ...base, id: `vis:graphs:missing-${missing}`, page: 13, prompt: 'Every graph must have certain things. What is this graph missing?',
    options: shuffle([miss, ...opts2]), answer: miss,
    explanation: `${why} Graphs must have a title, x-axis and y-axis labels (with units if needed), an even scale, and a key if needed.` };
}

/* ============================================================ registry */
const KINDS = {
  equipment: { id: 'equipment', name: 'Lab equipment', ico: '🧪', setId: 'c1', desc: 'Name each piece of equipment, or say what it is used for.', gen: genEquipment },
  targets: { id: 'targets', name: 'Accuracy targets', ico: '🎯', setId: 'c2', desc: 'Precise, accurate, both or neither?', gen: genTargets },
  meniscus: { id: 'meniscus', name: 'Read the cylinder', ico: '📏', setId: 'c2', desc: 'Read the volume at the bottom of the meniscus.', gen: genMeniscus },
  graphs: { id: 'graphs', name: 'Graphs', ico: '📊', setId: 'c4', desc: 'Name the graph type, its data, and what it is missing.', gen: genGraphs },
};
const kindsFor = (set) => Object.values(KINDS).filter((k) => set.id === 'chem-all' || k.setId === set.id);
function generate(kind, opts) {
  const k = KINDS[kind];
  if (!k) throw new Error(`Unknown picture kind "${kind}"`);
  return k.gen(opts || {});
}
function draw(kind, item) {
  if (kind === 'equipment') return drawEquipment(item);
  if (kind === 'targets') return drawTarget(TG.has(item) ? item : pick(TARGETS).id).svg;
  if (kind === 'meniscus') return drawMeniscus(meniscusSpec(typeof item === 'object' && item ? item : {})).svg;
  if (kind === 'graphs') {
    const [graph, missing] = String(item || '').split('-');
    return drawGraph(graphSpec({ graph: GRAPH_TYPES[graph] ? graph : undefined, missing: MUST[missing] ? missing : undefined })).svg;
  }
  throw new Error(`Unknown picture kind "${kind}"`);
}

/** A round's worth of questions: equipment items never repeat in a round, and
    each kind's items are dealt in turn so a round is not five of one thing. */
function deal(kinds, n) {
  const decks = {
    equipment: () => shuffle(EQUIPMENT).map((e) => ({ item: e.id })),
    // three of each label, so a targets-only round still has ten questions
    targets: () => shuffle([...TARGETS, ...TARGETS, ...TARGETS]).map((t) => ({ item: t.id })),
    meniscus: () => Array.from({ length: n }, () => ({})),
    graphs: () => shuffle(['type-line', 'type-bar', 'type-circle', 'data-line', 'data-bar', 'data-circle', 'missing-title', 'missing-x', 'missing-y', 'missing-scale', 'missing-key']).map((item) => ({ item })),
  };
  const stacks = kinds.map((k) => ({ k: k.id, d: decks[k.id]() }));
  const out = [];
  for (let i = 0; out.length < n && i < n * 4; i++) {
    const s = stacks[i % stacks.length];
    if (s.d.length) out.push(generate(s.k, s.d.shift()));
  }
  return kinds.length > 1 ? shuffle(out) : out;
}

/* ============================================================== mode */
const AVAILABLE = new Set(['c1', 'c2', 'c4', 'chem-all']);
const ROUND = 10;
const KIND_ICON = {
  equipment: () => drawEquipment('erlenmeyer'),
  targets: () => drawTarget('precise-not-accurate', [[40, -34], [46, -30], [38, -26], [44, -24], [49, -35]]).svg,
  meniscus: () => drawEquipment('graduated-cylinder'),
  // a text-free icon: the full graph's labels are unreadable at this size
  graphs: () => svg(64, 64, '<path class="bar b1" d="M14 30h8v22h-8zM26 18h8v34h-8zM38 36h8v16h-8zM50 24h6v28h-6z"/><path class="o" d="M8 8V54H60" stroke-width="2.5"/>', 'A small bar graph'),
};

function renderPictures(set) {
  const prefs = CQ.state.prefs.pictures ||= { kind: 'mixed' };
  const kinds = kindsFor(set);
  const v = el('div', { class: 'view pq' });
  v.append(CQ.panelHead(set, 'pictures', 'Questions built around drawings, the way the notes teach them: the lab equipment, the accuracy and precision targets, reading a graduated cylinder, and the three types of graph.'));
  const body = el('div', { class: 'stack' });
  v.append(body);
  CQ.main.append(v);
  let keyPick = null;
  CQ.addCleanup(CQ.onKeys((e) => { if (keyPick && /^[1-4]$/.test(e.key)) keyPick(e.key); }));

  const chosen = () => {
    if (kinds.length === 1) return kinds;
    const k = kinds.find((x) => x.id === prefs.kind);
    return k ? [k] : kinds;
  };

  function intro() {
    keyPick = null;
    body.innerHTML = '';
    const best = CQ.state.best[`pictures:${set.id}`];
    const choices = kinds.length > 1 ? [{ id: 'mixed', name: 'Mixed', ico: '🔀', desc: 'A bit of everything below.' }, ...kinds] : kinds;
    const current = kinds.length > 1 && (prefs.kind === 'mixed' || kinds.some((k) => k.id === prefs.kind)) ? prefs.kind : choices[0].id;
    const picker = el('div', { class: 'pq-kinds', role: 'group', 'aria-label': 'Picture topic' },
      ...choices.map((k) => el('button', {
        class: `pq-kind${k.id === current ? ' on' : ''}`, type: 'button', 'aria-pressed': k.id === current ? 'true' : 'false',
        disabled: kinds.length === 1,
        onclick: () => { prefs.kind = k.id; CQ.save(); intro(); $$focus(k.id); },
      },
      el('span', { class: 'pq-thumb', 'aria-hidden': 'true', html: KIND_ICON[k.id] ? KIND_ICON[k.id]() : `<span class="pq-emoji">${k.ico}</span>` }),
      el('span', { class: 'pq-kind-txt' }, el('b', {}, k.name), el('span', {}, k.desc)),
      el('span', { class: 'pq-check', 'aria-hidden': 'true' }, k.id === current ? '✓' : ''))),
    );
    body.append(el('div', { class: 'panel stack' },
      el('div', { class: 'row between' }, CQ.backBtn(set), best != null ? el('span', { class: 'chip warn' }, `Best ${best} / ${ROUND}`) : null),
      el('h2', { class: 'pq-h' }, kinds.length > 1 ? 'Choose a topic' : `Topic: ${kinds[0].name}`),
      picker,
      el('p', { class: 'note' }, `${ROUND} questions per round. Keys 1–4 pick an answer.`),
      el('div', { class: 'row' }, el('button', { class: 'btn primary lg', onclick: play }, 'Start round')),
    ));
  }
  // keep keyboard focus on the topic the student just picked
  function $$focus(id) {
    const i = (kinds.length > 1 ? ['mixed', ...kinds.map((k) => k.id)] : kinds.map((k) => k.id)).indexOf(id);
    const b = body.querySelectorAll('.pq-kind')[i];
    if (b) b.focus();
  }

  function play() {
    const qs = deal(chosen(), ROUND);
    const results = [];
    let i = 0;
    const next = () => {
      keyPick = null;
      body.innerHTML = '';
      if (i >= qs.length) return summary(results);
      const q = qs[i];
      const score = results.filter((r) => r.correct).length;
      const card = CQ.questionCard(q, { onAnswer: (ok, given) => {
        keyPick = null;
        results.push({ q, given, correct: ok });
        CQ.bumpMastery(q.id, ok);
        (ok ? CQ.sfx.good : CQ.sfx.bad)();
        if (ok) CQ.floatText('+1', 'var(--good)');
        $score.textContent = `Score ${results.filter((r) => r.correct).length}`;
        i++;
        const btn = el('button', { class: 'btn primary lg', onclick: next }, i >= qs.length ? 'See results →' : 'Next picture →');
        card.append(el('div', { class: 'row' }, btn));
        btn.focus({ preventScroll: true });
      } });
      const $score = el('span', { class: 'pq-score' }, `Score ${score}`);
      const $count = el('span', { class: 'pq-count', tabindex: '-1' }, `Picture ${i + 1} of ${qs.length}`);
      body.append(
        el('div', { class: 'learn-head' },
          el('div', { class: 'row between' }, CQ.backBtn(set), $count, $score),
          el('div', { class: 'progress' }, el('i', { style: `width:${pct(i, qs.length)}%` }))),
        el('div', { class: 'panel' }, card));
      keyPick = (k) => card.pickByKey && card.pickByKey(k);
      // The old "Next" button is gone: land keyboard and screen-reader focus on
      // the new picture's counter, so "Picture N of 10" is announced and Tab
      // goes straight on to the answers.
      if (i > 0) $count.focus({ preventScroll: true });
    };
    next();
  }

  function summary(results) {
    const score = results.filter((r) => r.correct).length;
    const p = pct(score, results.length);
    const isBest = CQ.recordBest(`pictures:${set.id}`, score);
    if (p >= 80) { CQ.sfx.win(); CQ.confetti(); } else CQ.sfx.lose();
    const missed = results.filter((r) => !r.correct);
    body.innerHTML = '';
    body.append(el('div', { class: 'panel' },
      el('div', { class: 'result-head' },
        el('div', { class: 'score-ring', style: `--p:${p}` }, el('div', {}, `${score}/${results.length}`)),
        el('h2', {}, p === 100 ? 'Perfect round!' : p >= 80 ? 'Sharp eyes!' : p >= 60 ? 'Getting there.' : 'Keep looking closely.'),
        el('p', { class: 'note' }, `${score} of ${results.length} correct${isBest && score ? ' — a new best' : ''}${missed.length ? ` · ${missed.length} to review below` : ''}`)),
      el('div', { class: 'row center' },
        el('button', { class: 'btn primary', onclick: play }, 'Play again'),
        el('button', { class: 'btn ghost', onclick: intro }, 'Change topic'),
        CQ.backBtn(set, 'Back to set'))));
    if (!missed.length) return;
    body.append(el('h2', { class: 'section-title' }, 'Review your misses'),
      el('div', { class: 'pq-review' }, ...missed.map((r) => el('div', { class: 'panel pq-miss' },
        el('div', { class: 'pq-miss-fig', html: r.q.figure }),
        el('div', { class: 'stack' },
          el('div', { class: 'q-tag' }, r.q.ask || ''),
          el('b', { class: 'pq-miss-q' }, r.q.prompt),
          el('div', { class: 'pq-ans bad' }, el('span', { 'aria-hidden': 'true' }, '✗ '), 'Your answer: ', el('b', {}, r.given || '(none)')),
          el('div', { class: 'pq-ans good' }, el('span', { 'aria-hidden': 'true' }, '✓ '), 'Correct: ', el('b', {}, r.q.answer)),
          el('div', { class: 'note' }, r.q.explanation instanceof Node ? r.q.explanationText : r.q.explanation),
          el('div', { class: 'note' }, `${CQ.setOf(r.q.setId).short} · slide ${r.q.page}`))))));
  }
  intro();
}

CQ.registerMode({
  id: 'pictures', name: 'Picture Quiz', ico: '🖼️', color: '#22d3ee', before: 'match',
  desc: 'Name the equipment, judge the targets, read the cylinder and spot what a graph is missing — all from drawings.',
  available: (set) => AVAILABLE.has(set.id),
  render: renderPictures,
});

/* Picture questions join Gold Quest, Race and Blitz for the sets they fit. */
CQ.addGameSource((set) => {
  if (!AVAILABLE.has(set.id)) return [];
  try { return deal(kindsFor(set), 10); } catch (e) { console.error(e); return []; }
});

/* The Mistakes list can show and re-serve a missed picture item. */
CQ.registerItemResolver('vis', (id) => {
  const [, kind, item] = id.split(':');
  if (!KINDS[kind]) return null;
  let label;
  if (kind === 'equipment') { const e = EQ.get(item); if (!e) return null; label = `Picture: ${e.name} — name it or say what it is for`; }
  else if (kind === 'targets') { const t = TG.get(item); if (!t) return null; label = `Picture: a target that is "${t.label}"`; }
  else if (kind === 'meniscus') label = 'Picture: read a graduated cylinder at the bottom of the meniscus';
  else {
    const [ask, detail] = String(item).split('-');
    if (ask === 'missing' && MUST[detail]) label = `Picture: a graph missing its ${MUST[detail].toLowerCase()}`;
    else if ((ask === 'type' || ask === 'data') && GRAPH_TYPES[detail]) label = `Picture: ${ask === 'type' ? 'recognise a' : 'the data shown by a'} ${GRAPH_TYPES[detail].name.toLowerCase()}`;
    else return null;
  }
  return { setId: KINDS[kind].setId, label, make: () => generate(kind, { item }) };
});

/* For tests and the contact sheet. */
window.CQVisuals = {
  kinds: Object.keys(KINDS),
  generate,
  equipment: EQUIPMENT.map((e) => e.name),
  equipmentIds: EQUIPMENT.map((e) => e.id),
  targets: TARGETS.map((t) => t.label),
  draw,
  placeShots,
};
})();
