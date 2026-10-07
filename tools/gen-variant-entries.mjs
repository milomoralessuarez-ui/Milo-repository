/**
 * Turns a remix plan (tools/plan-variants.mjs) into catalogue entries for
 * tools/build-variants.mjs: a title, tagline and description per remix that
 * describe the base game's real mechanics and exactly what the tier changes,
 * thumbnail colours hue-shifted the same way the engine shifts the canvas,
 * and searchable tags.
 *
 *   node tools/gen-variant-entries.mjs <plan.json> <out-dir>
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const [planPath, outDir] = process.argv.slice(2);
if (!planPath || !outDir) { console.error('usage: gen-variant-entries <plan.json> <out-dir>'); process.exit(1); }
const plan = JSON.parse(await readFile(planPath, 'utf8'));

const TIER = {
  turbo: {
    emo: '⚡', title: (b) => `${b} Turbo`,
    tagline: (t, b) => t ? `${t} — a third faster` : `${b} at 135% speed`,
    templates: [
      (T, B, m) => `${T} is ${B} with game time running about a third faster. ${m} At this pace the same patterns arrive before you have finished reading them, so the safe routes of the original become gambles here. Turbo keeps its own best score, separate from ${B}.`,
      (T, B, m) => `The same ${B}, wound up: everything moves at 135% speed and the reaction windows shrink to match. ${m} Nothing about the rules changes — only how long you get to respond. A score that felt routine in ${B} is worth something on the Turbo leaderboard.`,
      (T, B, m) => `A faster cut of ${B}. ${m} Turbo multiplies game time by 1.35, which is enough to turn a comfortable rhythm into a proper reflex test without making it unfair. Learn the original first; bring the muscle memory here.`,
      (T, B, m) => `${B}, but hurried. ${m} With the clock running a third faster, hazards bunch up and openings close sooner, and the scoring that ramps in the original ramps here too — just quicker. Separate best score, same controls.`,
      (T, B, m) => `Turbo edition of ${B}: identical mechanics, 35% more speed, its own leaderboard. ${m} The trick is to stop reacting to individual threats and start reading the pattern a beat ahead — the original taught you the pattern, this one tests whether you learned it.`,
    ],
  },
  zen: {
    emo: '🧘', title: (b) => `${b} Zen`,
    tagline: (t, b) => t ? `${t}, at three-quarter pace` : `${b} at a gentler pace`,
    templates: [
      (T, B, m) => `${T} slows ${B} to about three-quarter speed and gives it a calmer palette. ${m} With more time between decisions it becomes a game about planning rather than twitch — good for learning the patterns, or for playing one-handed with a coffee. Zen has its own best score.`,
      (T, B, m) => `The relaxed version of ${B}. ${m} Game time runs at 72% of normal, so everything that felt urgent in the original becomes readable, and long runs are about consistency rather than reflexes. Separate leaderboard, same controls.`,
      (T, B, m) => `${B} at a gentler pace. ${m} Zen is the same game with the clock dialled down — a way to enjoy the mechanics without the pressure, and the best place to work out strategies you can then take back to the original. Scores are kept apart from ${B}.`,
      (T, B, m) => `A slow-motion cut of ${B}, tinted cool. ${m} At three-quarter speed the difficulty ramp still arrives, it just takes its time, so runs last longer and higher scores are realistic for newer players. Your Zen best is tracked on its own.`,
      (T, B, m) => `Zen edition of ${B}: identical rules, 28% slower, separate high score. ${m} Ideal when you want the loop without the adrenaline — or when you want to see exactly how a pattern works before facing it at full speed.`,
    ],
  },
  hyper: {
    emo: '🔥', title: (b) => `${b} Hyper`,
    tagline: (t, b) => t ? `${t} at 170% speed` : `${b} at 170% speed`,
    templates: [
      (T, B, m) => `${T} is ${B} with the clock running 70% faster. ${m} This is the expert cut: openings that lasted a comfortable half-second in the original are gone in a blink, and the difficulty ramp compounds on top. Hyper keeps its own best score — expect it to be a fraction of your ${B} record.`,
      (T, B, m) => `Everything in ${B} at 1.7× speed. ${m} Hyper is for players who have the original memorised and want a version where every run is a sprint; survival past the first minute is an achievement, and the leaderboard is separate.`,
      (T, B, m) => `The frantic edition of ${B}. ${m} With game time at 170%, hazards stack, gaps close early and there is no slack for a bad first move — but the scoring runs just as fast, so short runs can still post big numbers. Own high-score table.`,
      (T, B, m) => `${B}, seventy percent faster, in a hotter palette. ${m} Hyper strips out the breathing room the original gives you; what is left is pure pattern recognition and commitment. Practise in Zen or the original, then come here to see how far it holds.`,
      (T, B, m) => `Hyper edition of ${B}: same mechanics, 1.7× game speed, separate leaderboard. ${m} The best runs come from reading two hazards ahead rather than one — the original rewards that, this one demands it.`,
    ],
  },
  insane: {
    emo: '💀', title: (b) => `${b}: Insane Mode`,
    tagline: (t, b) => t ? `${t} at double speed` : `${b} at double speed`,
    templates: [
      (T, B, m) => `${T} runs ${B} at exactly double speed. ${m} Everything the original does, it does twice as fast — including the difficulty ramp — so this is less a game to beat than a game to survive, and a run that lasts thirty seconds is genuinely good. Own best score, warm palette.`,
      (T, B, m) => `${B} at 2× — the version for people who found Hyper too polite. ${m} At double speed reaction is barely enough; runs are won by knowing what comes next before it appears. Separate leaderboard so the numbers stay honest.`,
      (T, B, m) => `The double-speed edition of ${B}. ${m} Insane keeps every rule intact and simply halves the time you get for each decision; it is brutally short, oddly relaxing once you accept that, and tracked on its own high-score table.`,
      (T, B, m) => `Insane mode for ${B}: identical mechanics, game time × 2, warm palette, separate best score. ${m} Treat the first few runs as reconnaissance — even the opening pattern feels new at this pace.`,
      (T, B, m) => `${B}, twice as fast. ${m} Insane is the top of the remix ladder: past this there is nothing, so a personal best here is the one to brag about. Scores are kept apart from the original and the other remixes.`,
    ],
  },
};

// First one or two sentences of the base description — the actual mechanics.
function mechanics(desc) {
  const s = String(desc || '').replace(/\s+/g, ' ').trim();
  const parts = (s.match(/[^.!?]+[.!?]+/g) || [s]).map((x) => x.trim());
  let out = parts[0] || '';
  if (parts[1] && (out + ' ' + parts[1]).length <= 260) out += ' ' + parts[1];
  out = out.trim();
  if (out && !/[.!?]$/.test(out)) out += '.';
  return out;
}

function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > .5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h * 360, s, l];
}
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  const f = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) r = g = b = l;
  else {
    const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3);
  }
  const to = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
  return '#' + to(r) + to(g) + to(b);
}
const FALLBACK = { turbo: ['#052e16', '#4ade80'], zen: ['#0c1a3a', '#60a5fa'], hyper: ['#3b0764', '#f0abfc'], insane: ['#431407', '#fb923c'] };
function shift(hex, deg, sat, tier, idx) {
  hex = String(hex || '');
  if (/^#[0-9a-f]{3}$/i.test(hex)) hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return FALLBACK[tier][idx];
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h + deg, Math.min(1, s * (sat || 1)), l);
}

const entries = plan.map((p, i) => {
  const t = TIER[p.tier];
  const title = t.title(p.baseTitle);
  const tpl = t.templates[(i * 7 + p.base.length) % t.templates.length];
  const tags = [];
  for (const x of [...(p.tags || []).slice(0, 3), p.tier, 'remix']) if (x && tags.indexOf(x) === -1) tags.push(x);
  return {
    base: p.base, id: p.id, title, emo: t.emo,
    speed: p.speed, hue: p.hue, sat: p.sat,
    tagline: t.tagline(p.tagline, p.baseTitle),
    description: tpl(title, p.baseTitle, mechanics(p.description)),
    colors: [shift(p.colors[0], p.hue, p.sat, p.tier, 0), shift(p.colors[1], p.hue, p.sat, p.tier, 1)],
    tags,
  };
});

await mkdir(outDir, { recursive: true });
await writeFile(resolve(outDir, 'remixes.json'), JSON.stringify(entries, null, 1));
console.log(`${entries.length} remix entries → ${outDir}/remixes.json`);
