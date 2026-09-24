/**
 * Plans the remix catalogue: decides which base games get variants and which
 * tuning tier each variant uses, so that the total catalogue lands on an
 * exact target size.
 *
 *   node tools/plan-variants.mjs <registry.json> [--target=1000] > plan.json
 *
 * Eligible bases are single-game files whose runner is Milo.arcade — the
 * only runner where the engine's time-scaling makes a remix genuinely play
 * differently. Pack files (many registers per file), DOM board games and the
 * WebGL games are skipped. Tiers are handed out round-robin so every base
 * gets a Turbo before any base gets a second remix.
 */
import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const regPath = args.find((a) => !a.startsWith('--'));
const TARGET = Number((args.find((a) => a.startsWith('--target=')) || '').slice(9)) || 1000;

if (!regPath) {
  console.error('usage: node tools/plan-variants.mjs <registry.json> [--target=N]');
  process.exit(1);
}

const registry = JSON.parse(await readFile(regPath, 'utf8'));
const byId = new Map(registry.map((g) => [g.id, g]));

// Which single-register files use the arcade runner?
const dir = resolve(ROOT, 'assets/js/games');
const eligible = [];
for (const f of (await readdir(dir)).filter((n) => n.endsWith('.js')).sort()) {
  const src = await readFile(resolve(dir, f), 'utf8');
  const registers = src.match(/Milo\.register\(/g) || [];
  if (registers.length !== 1) continue;
  if (!/Milo\.arcade\(/.test(src)) continue;
  const m = src.match(/id:\s*'([a-z0-9-]+)'/);
  if (!m) continue;
  const g = byId.get(m[1]);
  if (!g || g.variantOf) continue;
  eligible.push(g);
}

// Tuning tiers, in the order they are handed out. `speed` scales game time;
// `hue` rotates the whole canvas so each remix reads as its own game.
const TIERS = [
  { key: 'turbo', speed: 1.35, hue: 130, sat: 1.15, label: 'Turbo', feel: 'about a third faster than the original — the same rules with reaction windows squeezed' },
  { key: 'zen', speed: 0.72, hue: 215, sat: 0.9, label: 'Zen', feel: 'slowed to roughly three-quarter pace — a relaxed, readable take that rewards planning over reflex' },
  { key: 'hyper', speed: 1.7, hue: 300, sat: 1.25, label: 'Hyper', feel: 'seventy percent faster than the original — a frantic expert mode where every run is a sprint' },
  { key: 'insane', speed: 2.0, hue: 20, sat: 1.3, label: 'Insane', feel: 'double speed — the original played at a pace only muscle memory survives' },
];

// The plan is computed from originals only: the remix catalogue is
// regenerated wholesale each time, and build-variants always re-adds the two
// seed remixes, so they are the only existing remixes that count.
const SEEDS = 2;
const existingVariants = registry.filter((g) => g.variantOf);
const originals = registry.length - existingVariants.length;
const need = TARGET - originals - SEEDS;

const plan = [];
let tierIdx = 0;
outer: while (plan.length < need) {
  if (tierIdx >= TIERS.length) break;
  const tier = TIERS[tierIdx];
  for (const g of eligible) {
    if (plan.length >= need) break outer;
    const id = `${g.id}-${tier.key}`;
    if (id === 'neon-snake-turbo' || id === 'brick-breaker-zen') continue;   // seed remixes
    plan.push({
      base: g.id, baseTitle: g.title, id, tier: tier.key, speed: tier.speed, hue: tier.hue, sat: tier.sat,
      tierLabel: tier.label, feel: tier.feel,
      category: g.category, emo: g.emo, tagline: g.tagline, description: g.description,
      colors: g.colors, tags: g.tags,
    });
  }
  tierIdx++;
}

console.error(`registry ${registry.length} (${originals} originals, ${existingVariants.length} remixes) · eligible bases ${eligible.length} · need ${need} · planned ${plan.length}`);
if (plan.length < need) console.error(`WARNING: short by ${need - plan.length} — add more tiers or bases`);
console.log(JSON.stringify(plan, null, 1));
