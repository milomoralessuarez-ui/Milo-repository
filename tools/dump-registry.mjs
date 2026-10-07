/**
 * Dumps the live game registry as JSON: loads the site headlessly and prints
 * every registered game's catalogue metadata. Used for auditing the catalogue
 * and for planning remix variants.
 *
 *   node tools/dump-registry.mjs [baseUrl] > registry.json
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8099';

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const page = await (await browser.newContext()).newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.Milo && window.Milo.games.length > 0, null, { timeout: 20000 });

const games = await page.evaluate(() =>
  window.Milo.games.map((g) => ({
    id: g.id,
    title: g.title,
    emo: g.emo,
    category: g.category,
    tagline: g.tagline || '',
    description: g.description || '',
    colors: g.colors,
    tags: g.tags,
    variantOf: g.variantOf || null,
    featured: !!g.featured,
  }))
);

console.log(JSON.stringify(games, null, 1));
await browser.close();
