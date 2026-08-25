/**
 * Headless smoke test: loads the site, then plays every registered game for a
 * short burst while watching for console errors, page exceptions and stalls.
 *
 *   node tools/smoke-test.mjs [baseUrl]
 *
 * Requires playwright on NODE_PATH (globally installed in this environment).
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8099';
const PLAY_MS = 1600;

const IGNORE = [
  /favicon/i,
  /fonts\.googleapis|fonts\.gstatic/i,
  /sw\.js/i,
  /ERR_CONNECTION_RESET/i,
  /The AudioContext was not allowed to start/i,
];

function isNoise(text) {
  return IGNORE.some((re) => re.test(text));
}

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const errors = [];
let scope = 'boot';
page.on('console', (m) => {
  if (m.type() !== 'error') return;
  const where = m.location()?.url || '';
  const text = `${m.text()} ${where}`;
  if (!isNoise(text)) errors.push(`[${scope}] console: ${m.text()}${where ? ` (${where})` : ''}`);
});
page.on('pageerror', (e) => {
  if (!isNoise(String(e))) errors.push(`[${scope}] pageerror: ${e.message}`);
});

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.Milo && window.Milo.games.length > 0, null, { timeout: 15000 });

const games = await page.evaluate(() =>
  window.Milo.games.map((g) => ({ id: g.id, title: g.title, category: g.category }))
);
console.log(`Loaded portal with ${games.length} games.\n`);

// The portal itself must render its home view.
const homeCards = await page.locator('.card').count();
if (homeCards === 0) errors.push('[boot] home page rendered no game cards');

const results = [];
for (const game of games) {
  scope = game.id;
  const before = errors.length;

  await page.goto(`${BASE}/#/play/${encodeURIComponent(game.id)}`, { waitUntil: 'load' });
  await page.waitForTimeout(350);

  // Most games open on a start overlay; idle games (autoStart) begin straight
  // away and legitimately have no Play button.
  const playBtn = page.locator('.overlay .btn-primary').first();
  let started = false;
  try {
    await playBtn.waitFor({ state: 'visible', timeout: 4000 });
    await playBtn.click();
    started = true;
  } catch {
    const autoStarted = await page
      .evaluate((id) => {
        const def = window.Milo.byId[id];
        return !!def && !document.querySelector('.overlay');
      }, game.id)
      .catch(() => false);
    if (autoStarted) {
      started = true;
    } else {
      const diag = await page
        .evaluate(() => {
          const s = document.querySelector('#stage');
          return {
            hash: location.hash,
            overlay: !!document.querySelector('.overlay'),
            stage: s ? s.innerHTML.slice(0, 200) : 'NO STAGE ELEMENT',
          };
        })
        .catch(() => ({ diag: 'unavailable' }));
      errors.push(`[${game.id}] no start button appeared — ${JSON.stringify(diag)}`);
    }
  }

  if (started) {
    await page.waitForTimeout(PLAY_MS);

    // Nudge each game with some input so update paths actually execute.
    for (const key of ['ArrowRight', 'ArrowUp', 'Space', 'ArrowLeft', 'ArrowDown']) {
      await page.keyboard.press(key).catch(() => {});
      await page.waitForTimeout(90);
    }
    const stage = page.locator('#stage');
    // Short timeout: a pointer-locked page can make this hang for the default 30s.
    const box = await stage.boundingBox({ timeout: 2000 }).catch(() => null);
    if (box) {
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.6);
      await page.mouse.down();
      await page.mouse.up();
      await page.waitForTimeout(120);
      await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.45);
      await page.waitForTimeout(400);
    }

    // A live game must have produced a canvas or DOM board inside the stage.
    const alive = await page.evaluate(() => {
      const s = document.querySelector('#stage');
      if (!s) return { ok: false, why: 'no stage element' };
      const hasCanvas = !!s.querySelector('canvas');
      const hasDom = s.children.length > 0;
      return { ok: hasCanvas || hasDom, why: hasCanvas ? 'canvas' : hasDom ? 'dom' : 'empty' };
    });
    if (!alive.ok) errors.push(`[${game.id}] stage is empty (${alive.why})`);
  }

  // Leave no pointer lock behind for the next game.
  await page.evaluate(() => {
    if (document.pointerLockElement) document.exitPointerLock();
  }).catch(() => {});

  const added = errors.length - before;
  results.push({ ...game, errors: added });
  process.stdout.write(
    `${added === 0 ? '  ok  ' : ' FAIL '} ${game.id.padEnd(16)} ${game.title}\n`
  );
}

// Exercise the portal's own views too.
scope = 'routes';
for (const route of ['#/', '#/browse', '#/c/Puzzle', '#/favorites', '#/recent', '#/search/snake', '#/elsewhere', '#/about']) {
  await page.goto(`${BASE}/${route}`, { waitUntil: 'load' });
  await page.waitForTimeout(200);
  const empty = await page.evaluate(() => document.querySelector('#main').children.length === 0);
  if (empty) errors.push(`[routes] ${route} rendered nothing`);
}

await browser.close();

const failed = results.filter((r) => r.errors > 0);
console.log(`\n${results.length - failed.length}/${results.length} games clean.`);
if (errors.length) {
  console.log(`\n${errors.length} problem(s):\n`);
  for (const e of errors) console.log('  ' + e);
  process.exit(1);
}
console.log('No console errors, page exceptions or empty stages.');
