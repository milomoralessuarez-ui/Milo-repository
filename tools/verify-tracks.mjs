/**
 * Verifies every Turbo Drift circuit is actually raceable.
 *
 *   node tools/verify-tracks.mjs
 *
 * The fifty tracks are generated from seeds rather than hand-drawn, so this is
 * what stands between a seed change and shipping a circuit that overlaps
 * itself, has a corner tighter than the car can turn, or a jump with no ramp.
 * Exits non-zero on any problem, for use in CI.
 */
import fs from 'fs';
globalThis.window = {};
eval(fs.readFileSync('assets/js/lib/racing.js', 'utf8'));
const R = globalThis.window.Milo.racing;
const src = fs.readFileSync('assets/js/games/turbo-drift.js', 'utf8');
const block = src.slice(src.indexOf('var TRACK_ROWS = ['), src.indexOf('var TRACKS = TRACK_ROWS'));
const rows = [...block.matchAll(/\['([^']+)', '([^']+)', ([\d.\-]+), ([\d.\-]+), ([\d.\-]+), ([\d.\-]+), ([\d.\-]+), ([\d.\-]+), ([\d.\-]+), ([\d.\-]+), ([\d.\-]+), ([\d.\-]+), ([\d.\-]+), ([\d.\-]+), ([\d.\-]+), ([\d.\-]+), ([\d.\-]+), ([\d.\-]+)\]/g)];
if (rows.length !== 50) { console.log(`FAIL: parsed ${rows.length} rows, expected 50`); process.exit(1); }
let bad = 0, walled = 0, gapTotal = 0;
for (const m of rows) {
  const spec = {
    name: m[1], theme: m[2], seed: +m[3], diff: +m[4], laps: +m[5], radius: +m[6],
    amp: +m[7], chic: +m[8], hill: +m[9], hillFreq: +m[10], lobes: +m[11],
    width: +m[12], bank: +m[13], jumps: +m[14], boosts: +m[15], tunnels: +m[16],
    narrow: +m[17], walls: +m[18]
  };
  if (spec.walls) walled++;
  const t = R.buildTrack(spec);
  const problems = R.validateTrack(t);
  // Every hole must be clearable: check the take-off gradient at each lip.
  for (const [a] of t.feats.gaps) {
    const lip = t.samples[(a - 1 + t.n) % t.n];
    if (lip.ty < 0.10) problems.push(`jump lip gradient only ${(lip.ty * 100).toFixed(0)}%`);
    gapTotal++;
  }
  // Every track must carry at least one jump, and the race must not be over
  // in under a minute even in the fastest car (~35 m/s average).
  if (spec.jumps < 1 || t.feats.gaps.length < 1) problems.push('no jump on this track');
  const dist = t.total * spec.laps;
  if (dist < 2100) problems.push(`race only ${Math.round(dist)}m — under a minute flat out`);
  // The 19-car grid stretches ~16 segments behind the line; that stretch must
  // be solid road, or half the field spawns over a hole.
  for (let g2 = 1; g2 <= 18; g2++) {
    if (t.samples[(t.n - g2) % t.n].kind === 1) { problems.push('start grid overlaps a hole'); break; }
  }
  if (problems.length) { console.log(`FAIL ${spec.name}: ${problems.join('; ')}`); bad++; }
}
console.log(`${50 - bad}/50 circuits verified raceable; ${walled}/50 have barriers; ${gapTotal} jumps total; every race 2100m+`);
process.exit(bad ? 1 : 0);
