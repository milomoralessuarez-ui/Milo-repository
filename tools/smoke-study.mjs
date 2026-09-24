/**
 * Headless smoke test for the ChemQuest study site: plays every study mode
 * through a real round while watching for console errors, page exceptions and
 * dead ends.
 *
 *   python3 -m http.server 8099 &        # or any static server at the repo root
 *   node tools/smoke-study.mjs [baseUrl] [--set=c1|c2|c3|c4|all]
 *
 * Unlike tools/verify-study.mjs, which checks the questions themselves, this
 * drives the interface: it answers questions, opens chests, clears a Match
 * board and submits a Test, so a mode that throws or strands a student fails
 * the run rather than shipping. Exits non-zero on any problem, for use in CI.
 *
 * Requires playwright — a local install is used if there is one, otherwise the
 * global one (ES modules ignore NODE_PATH, so the global root is resolved by
 * asking npm for it).
 */
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  const { execSync } = await import('node:child_process');
  const root = (process.env.NODE_PATH || '').split(':').filter(Boolean)[0]
    || execSync('npm root -g', { encoding: 'utf8' }).trim();
  ({ chromium } = await import(`file://${root}/playwright/index.mjs`));
}

const args = process.argv.slice(2);
const BASE = (args.find((a) => !a.startsWith('--')) || 'http://127.0.0.1:8099').replace(/\/$/, '');
const SET = (args.find((a) => a.startsWith('--set=')) || '--set=all').slice(6);
const STUDY = `${BASE}/study/`;

const IGNORE = [/favicon/i, /fonts\.googleapis|fonts\.gstatic/i, /ERR_CERT/i, /AudioContext/i];
const isNoise = (t) => IGNORE.some((re) => re.test(t));

const errors = [];
let scope = 'boot';
const fail = (msg) => errors.push(`[${scope}] ${msg}`);

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('console', (m) => {
  if (m.type() === 'error' && !isNoise(m.text())) fail(`console: ${m.text()}`);
});
page.on('pageerror', (e) => {
  if (!isNoise(String(e))) fail(`pageerror: ${e.message}`);
});

const go = async (hash) => {
  const url = `${STUDY}#${hash}`;
  // Navigating to the URL already showing fires no hashchange, which would
  // leave the previous check's round running; step through home first.
  if (page.url() === url) await page.goto(`${STUDY}#/`, { waitUntil: 'load' });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(250);
};
/** Answer whatever question is on screen; returns false if there wasn't one. */
const answerOne = async (typed = 'x') => {
  const input = page.locator('.q-card input.input:not([disabled])').first();
  if (await input.count()) {
    await input.fill(typed);
    await input.press('Enter');
    return true;
  }
  const opt = page.locator('.opt:not([disabled])').first();
  if (await opt.count()) {
    await opt.click();
    return true;
  }
  return false;
};
/** Pick the right option for whatever question is showing, using the data
    itself, so a check can prove that a correct answer is rewarded. */
const answerCorrectly = async () => {
  const want = await page.evaluate(() => {
    const prompt = document.querySelector('.q-card .q-prompt')?.textContent.trim();
    if (!prompt) return null;
    for (const s of window.STUDY_SETS) {
      const q = s.questions.find((x) => x.prompt === prompt);
      if (q) return q.answer;
      const byTerm = s.terms.find((t) => t.term === prompt);
      if (byTerm) return byTerm.definition;
      const byDef = s.terms.find((t) => t.definition === prompt);
      if (byDef) return byDef.term;
    }
    return null;
  });
  if (want == null) return false;
  const opt = page.locator('.opt:not([disabled])').filter({ has: page.locator(`text="${want.replace(/"/g, '\\"')}"`) }).first();
  if (!(await opt.count())) return false;
  await opt.click();
  return true;
};
/** Click the continue/next button a mode shows after feedback, if present. */
const advance = async () => {
  const next = page.locator('.q-card .row .btn.primary, .panel > .row .btn.primary').first();
  if (await next.count()) await next.click().catch(() => {});
  await page.waitForTimeout(120);
};

await page.goto(STUDY, { waitUntil: 'load' });
await page.waitForTimeout(300);
const sets = await page.evaluate(() => (window.STUDY_SETS || []).map((s) => ({ concept: s.concept, terms: s.terms.length, questions: s.questions.length })));
if (!sets.length) { console.log('FAIL: study/data.js registered no sets'); await browser.close(); process.exit(1); }
if (!(await page.locator('.card.set').count())) fail('home page rendered no study-set cards');
console.log(`Loaded ChemQuest: ${sets.length} sets, ${sets.reduce((n, s) => n + s.terms, 0)} terms, ${sets.reduce((n, s) => n + s.questions, 0)} questions\n`);

const target = SET === 'all' ? 'all' : SET;
const results = [];
const check = async (name, fn) => {
  scope = name;
  const before = errors.length;
  const t0 = Date.now();
  try {
    await fn();
  } catch (e) {
    fail(`threw: ${e.message.split('\n')[0]}`);
  }
  const added = errors.length - before;
  results.push({ name, ok: added === 0, ms: Date.now() - t0 });
  console.log(`${added === 0 ? 'ok  ' : 'FAIL'}  ${name}${added ? ` (${added} problem${added > 1 ? 's' : ''})` : ''}`);
};

await check('flashcards', async () => {
  await go(`/set/${target}/flashcards`);
  if (!(await page.locator('.flash').count())) return fail('no flashcard rendered');
  await page.click('.flash');
  await page.waitForTimeout(500);
  if (!(await page.locator('.flash.flipped').count())) fail('card did not flip on click');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('2');
  await page.keyboard.press('1');
  if (!(await page.locator('.flash-tally').count())) fail('sorting tally disappeared');
});

await check('learn', async () => {
  await go(`/set/${target}/learn`);
  for (let i = 0; i < 12; i++) {
    if (await page.locator('.result-head').count()) break;
    if (!(await answerOne('6100'))) { fail(`no question to answer on step ${i + 1}`); break; }
    await page.waitForTimeout(150);
    await advance();
  }
  if (!(await page.locator('.learn-head').count())) fail('lost the progress header mid-round');
});

await check('test', async () => {
  await go(`/set/${target}/test`);
  await page.click('text=Start test');
  const rows = page.locator('.test-q');
  const n = await rows.count();
  if (!n) return fail('started a test with no questions');
  for (let i = 0; i < n; i++) {
    const row = rows.nth(i);
    if (await row.locator('input').count()) await row.locator('input').fill('298 K');
    else await row.locator('.opt').first().click();
  }
  await page.click('text=Submit test');
  await page.waitForTimeout(400);
  if (!(await page.locator('.score-ring').count())) fail('no score shown after submitting');
});

await check('mistakes', async () => {
  // The Test check above answered every question with its first option, so
  // most of those were wrong — they should be waiting here.
  await go(`/set/${target}/mistakes`);
  const heading = await page.locator('.panel h2').first().textContent().catch(() => '');
  const n = Number((heading.match(/(\d+) to review/) || [])[1] || 0);
  if (!n) return fail(`wrong answers from the Test did not reach the Mistakes list (heading: ${JSON.stringify(heading)})`);
  await page.locator('.panel .btn.primary.lg').first().click();
  await page.waitForTimeout(250);
  let cleared = 0;
  for (let i = 0; i < 6; i++) {
    if (await page.locator('.game-intro h2').count()) break;
    const ok = await answerCorrectly();
    if (!ok && !(await answerOne())) { fail(`no question to answer on review step ${i + 1}`); break; }
    if (ok) cleared++;
    await page.waitForTimeout(200);
    await page.locator('.q-card .row .btn.primary').first().click().catch(() => {});
    await page.waitForTimeout(150);
  }
  await go(`/set/${target}/mistakes`);
  const after = await page.locator('.panel h2').first().textContent().catch(() => '');
  const m = Number((after.match(/(\d+) to review/) || [])[1] || 0);
  if (cleared && m >= n) fail(`answered ${cleared} correctly but the list stayed at ${m} (was ${n})`);
});

await check('match', async () => {
  await go(`/set/${target}/match`);
  await page.click('text=Start game');
  const tiles = await page.locator('.tile').count();
  if (tiles < 4) return fail(`dealt only ${tiles} tiles`);
  const pairs = await page.evaluate(() => window.STUDY_SETS.flatMap((s) => s.terms).map((t) => [t.term, t.definition]));
  // Tile text must match exactly: one card's answer can be a prefix of another
  // card's question ("1 kg" and "1 kg = ?"), which a player tells apart on
  // sight but a substring match would not.
  const exact = (text) => page.locator('.tile').filter({ hasText: new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).first();
  for (const [term, def] of pairs) {
    const a = exact(term);
    const b = exact(def);
    if ((await a.count()) && (await b.count()) && (await a.isVisible()) && (await b.isVisible())) {
      await a.click(); await b.click();
      await page.waitForTimeout(300);
    }
    if (await page.locator('.game-intro h2').count()) break;
  }
  if (!(await page.locator('.game-intro h2').count())) fail('board never cleared — a pair could not be matched');
});

await check('gold quest', async () => {
  await go(`/set/${target}/gold`);
  await page.click('text=Start quest');
  if (!(await page.locator('#g-gold').count())) return fail('no gold counter in the HUD');
  let opened = 0;
  for (let i = 0; i < 10 && opened < 2; i++) {
    if (!(await answerCorrectly())) await answerOne();
    await page.waitForTimeout(600);
    const chest = page.locator('.chest:not([disabled])').first();
    if (await chest.count()) { await chest.click(); opened++; await page.waitForTimeout(250); }
    await advance();
  }
  if (!opened) fail('never reached a chest after answering correctly');
});

await check('race', async () => {
  await go(`/set/${target}/race`);
  await page.click('text=Start race');
  const lanes = await page.locator('.lane').count();
  if (lanes !== 5) return fail(`expected 5 lanes (you and four bots), found ${lanes}`);
  const posOf = async () => Number(((await page.locator('#r-pos').textContent()) || '0').split('/')[0]);
  let moved = false;
  for (let i = 0; i < 6 && !moved; i++) {
    const before = await posOf();
    if (await answerCorrectly()) {
      await page.waitForTimeout(300);
      if ((await posOf()) > before) moved = true;
      else fail('a correct answer did not move the car');
    } else {
      await answerOne();
      await page.waitForTimeout(200);
      await advance();
    }
    await page.waitForTimeout(500);
  }
  if (!moved) fail('never managed a correct answer to test movement');
});

await check('race to a win', async () => {
  // Answer every question right on the shortest track against the slowest
  // bots: the student must cross first, and the result has to say so.
  await go(`/set/${target}/race`);
  await page.locator('.seg button', { hasText: '10 spaces' }).click();
  await page.locator('.seg button', { hasText: 'Easy' }).click();
  await page.click('text=Start race');
  for (let i = 0; i < 30; i++) {
    if (await page.locator('.game-intro h2').count()) break;
    if (!(await answerCorrectly())) { await answerOne(); await page.waitForTimeout(200); await advance(); }
    await page.waitForTimeout(550);
  }
  const headline = await page.locator('.game-intro h2').textContent().catch(() => '');
  if (!/you won/i.test(headline)) return fail(`crossed the line first but the result reads ${JSON.stringify(headline)}`);
  const top = await page.locator('.board .brow').first().textContent();
  if (!/you/i.test(top)) fail(`won the race but the results board puts ${JSON.stringify(top.trim())} first`);
  await go(`/set/${target}`);
  const stored = await page.evaluate((id) => JSON.parse(localStorage.getItem('chemquest:v1') || '{}').best?.[`race:${id}`], target);
  if (!stored) fail('a win did not record a best time');
  const card = page.locator('.card.mode').filter({ has: page.locator('h3', { hasText: /^Race$/ }) });
  const chip = await card.locator('.chip').textContent().catch(() => '');
  if (!/best/i.test(chip)) fail(`the set page's Race card shows no best time (chip: ${JSON.stringify(chip)})`);
});

await check('blitz', async () => {
  await go(`/set/${target}/blitz`);
  await page.click('text=Go!');
  if (!(await page.locator('#b-score').count())) return fail('no score in the HUD');
  for (let i = 0; i < 5; i++) {
    await answerOne();
    await page.waitForTimeout(650);
    await advance();
  }
  if (!(await page.locator('#b-score').count())) fail('HUD vanished mid-round');
});

// Features that live in their own files bring their own checks: every
// tools/study-checks/*.mjs default-exports async ({ page, go, check, fail,
// answerOne, answerCorrectly, advance, target, STUDY }) and registers its
// checks with check(name, fn), exactly as the ones above do.
{
  const { readdirSync } = await import('node:fs');
  const { fileURLToPath, pathToFileURL } = await import('node:url');
  const dir = fileURLToPath(new URL('./study-checks/', import.meta.url));
  let files = [];
  try { files = readdirSync(dir).filter((f) => f.endsWith('.mjs')).sort(); } catch { /* no extra checks */ }
  for (const f of files) {
    const mod = await import(pathToFileURL(dir + f).href);
    await mod.default({ page, go, check, fail, answerOne, answerCorrectly, advance, target, STUDY });
  }
}

await check('study guide', async () => {
  await go(`/set/${target}/guide`);
  if (!(await page.locator('.term-row').count())) return fail('guide listed no terms');
  await page.fill('input[type=search]', 'beaker');
  await page.waitForTimeout(150);
  await page.fill('input[type=search]', 'zzzznotathing');
  await page.waitForTimeout(150);
  if (!(await page.locator('.empty').count())) fail('no empty state for a search with no matches');
});

await check('phone width', async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const mode of ['', '/flashcards', '/learn', '/test', '/mistakes', '/match', '/race', '/guide']) {
    await go(`/set/${target}${mode}`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (overflow) fail(`horizontal scroll at 390px on "${mode || 'set page'}"`);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
});

await check('bad routes', async () => {
  await go('/set/nope/flashcards');
  await page.waitForTimeout(200);
  if (!(await page.locator('.card.set').count())) fail('an unknown set id did not fall back to the home page');
  await go('/set/c1/notamode');
  if (!(await page.locator('.card.mode').count())) fail('an unknown mode did not fall back to the set page');
});

await browser.close();

const failed = results.filter((r) => !r.ok);
if (errors.length) {
  console.log(`\n${errors.length} problem(s):`);
  for (const e of errors) console.log(`  ${e}`);
  console.log(`\n${failed.length} of ${results.length} modes failed.`);
  process.exit(1);
}
console.log(`\nOK: all ${results.length} checks passed.`);
