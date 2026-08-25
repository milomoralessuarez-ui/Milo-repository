/**
 * Keeps the generated lists in index.html and sw.js in step with whatever is
 * actually in assets/js/games/.
 *
 *   node tools/sync-manifest.mjs [--check]
 *
 * Both files carry BEGIN/END marker comments; everything between them is
 * rewritten from the directory listing. With 130 games, hand-maintaining a
 * script tag and a cache entry per game is a bug waiting to happen — a missing
 * script tag silently drops a game, a missing cache entry silently breaks it
 * offline.
 *
 * --check exits non-zero if either file is out of date, for use in CI.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');

const games = (await readdir(resolve(ROOT, 'assets/js/games')))
  .filter((f) => f.endsWith('.js'))
  .map((f) => f.replace(/\.js$/, ''))
  .sort();

/** Replace the text between two marker comments, keeping the markers. */
function fill(text, begin, end, body, label) {
  const i = text.indexOf(begin);
  const j = text.indexOf(end);
  if (i === -1 || j === -1) throw new Error(`markers not found in ${label}`);
  return text.slice(0, i + begin.length) + '\n' + body + '\n' + text.slice(j);
}

const edits = [];

// --- index.html: one script tag per game ---------------------------------
{
  const path = 'index.html';
  const before = await readFile(resolve(ROOT, path), 'utf8');
  const body = games.map((g) => `<script src="assets/js/games/${g}.js"></script>`).join('\n');
  const after = fill(before, '<!-- GAMES:BEGIN -->', '<!-- GAMES:END -->', body, path);
  edits.push({ path, before, after });
}

// --- sw.js: the offline precache list ------------------------------------
{
  const path = 'sw.js';
  const before = await readFile(resolve(ROOT, path), 'utf8');
  // Wrap to keep lines readable rather than one enormous array literal.
  const lines = [];
  let line = ' ';
  for (const g of games) {
    const piece = ` '${g}',`;
    if (line.length + piece.length > 96) { lines.push(line); line = ' '; }
    line += piece;
  }
  if (line.trim()) lines.push(line);
  const body = lines.join('\n').replace(/,$/, '');
  const after = fill(before, '// GAMES:BEGIN', '// GAMES:END', body, path);
  edits.push({ path, before, after });
}

const stale = edits.filter((e) => e.before !== e.after);

if (check) {
  if (stale.length) {
    console.error(`Out of date: ${stale.map((e) => e.path).join(', ')}`);
    console.error('Run: node tools/sync-manifest.mjs');
    process.exit(1);
  }
  console.log(`${games.length} games — index.html and sw.js are up to date.`);
} else {
  for (const e of stale) await writeFile(resolve(ROOT, e.path), e.after);
  console.log(
    stale.length
      ? `${games.length} games — updated ${stale.map((e) => e.path).join(', ')}`
      : `${games.length} games — already up to date.`
  );
}
