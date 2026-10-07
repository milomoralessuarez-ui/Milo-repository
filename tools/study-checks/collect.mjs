/**
 * Checks for study/collect.js (Blooket-style collectibles), run by
 * tools/smoke-study.mjs. Each check drives the real interface where it can:
 * answering questions earns coins and moves the header badge, one question id
 * can't pay twice inside ten minutes (a miss uses up its try too), guessing
 * and the retry-until-right modes don't pay, a corrupt stored value doesn't
 * switch saving off, a pack opens with its reveal and leaves focus on Done,
 * and the icon the student picks shows on the Gold Quest results board.
 */
const KEY = 'chemquest:collect:v1';

export default async ({ page, go, check, fail, advance, STUDY }) => {
  const coins = () => page.evaluate(() => window.CQCollect.coins());
  const badge = () => page.locator('#bag .cq-badge').textContent();

  /** Answer the question on screen correctly, from the data itself (MC or typed). */
  const answerRight = async () => {
    const want = await page.evaluate(() => {
      const card = document.querySelector('.q-card');
      const prompt = card?.querySelector('.q-prompt')?.textContent.trim();
      if (!prompt) return null;
      const typed = !!card.querySelector('input.input:not([disabled])');
      for (const s of window.STUDY_SETS) {
        const q = s.questions.find((x) => x.prompt === prompt);
        if (q) return { typed, v: q.answer };
        const byTerm = s.terms.find((t) => t.term === prompt);
        if (byTerm) return { typed, v: byTerm.definition };
        const byDef = s.terms.find((t) => t.definition === prompt);
        if (byDef) return { typed, v: byDef.term };
      }
      return null;
    });
    if (!want) return false;
    if (want.typed) {
      const input = page.locator('.q-card input.input:not([disabled])').first();
      await input.fill(want.v);
      await input.press('Enter');
      return true;
    }
    const opt = page.locator('.opt:not([disabled])').filter({ has: page.locator(`text="${want.v.replace(/"/g, '\\"')}"`) }).first();
    if (!(await opt.count())) return false;
    await opt.click();
    return true;
  };

  await check('collect: correct answers earn coins', async () => {
    await page.goto(`${STUDY}#/`, { waitUntil: 'load' });
    await page.evaluate((k) => { try { localStorage.removeItem(k); } catch { /* */ } }, KEY);
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(250);
    if (!(await page.evaluate(() => !!window.CQCollect))) return fail('window.CQCollect is missing');
    if (!(await page.locator('#bag[href="#/collection"]').count())) return fail('no 🎒 header button');
    if ((await coins()) !== 0) fail('a fresh collection did not start at 0 coins');
    if ((await badge()).trim() !== '0') fail(`badge shows "${await badge()}" for 0 coins`);

    await go('/set/c2/learn');
    let earned = 0;
    for (let i = 0; i < 10 && earned < 2; i++) {
      const before = await coins();
      const ok = await answerRight();
      if (!ok) { await page.locator('.q-card .btn.ghost, .opt:not([disabled])').first().click().catch(() => {}); await advance(); continue; }
      await page.waitForTimeout(60);
      const after = await coins();
      if (after !== before + 10) { fail(`a correct answer moved coins ${before} → ${after}, expected +10`); break; }
      if (!earned && !(await page.locator('#bag .cq-badge.pulse').count())) fail('the badge did not pulse when coins arrived');
      earned++;
      await page.waitForTimeout(120);
      const shown = (await badge()).trim();
      if (shown !== String(after)) fail(`badge shows "${shown}", balance is ${after}`);
      if (!(await page.locator('#bag').getAttribute('aria-label')).includes(`${after} coins`)) fail('header button label does not state the balance');
      await advance();
    }
    if (earned < 2) fail(`only ${earned} correct answers could be given in Learn`);
  });

  await check('collect: one id pays once per 10 minutes', async () => {
    const r = await page.evaluate(() => {
      const t = window.CQ.SETS[0].terms;
      const c0 = window.CQCollect.coins();
      window.CQ.bumpMastery(t[5].id, true);
      const c1 = window.CQCollect.coins();
      window.CQ.bumpMastery(t[5].id, true);
      const c2 = window.CQCollect.coins();
      window.CQ.bumpMastery(t[6].id, false);
      const c3 = window.CQCollect.coins();
      // ten minutes later the same id pays again
      const real = Date.now;
      Date.now = () => real() + 10 * 60 * 1000 + 1000;
      try { window.CQ.bumpMastery(t[5].id, true); } finally { Date.now = real; }
      const c4 = window.CQCollect.coins();
      return [c0, c1, c2, c3, c4];
    });
    const [c0, c1, c2, c3, c4] = r;
    if (c1 !== c0 + 10) fail(`first correct answer paid ${c1 - c0}, expected 10`);
    if (c2 !== c1) fail(`the same id paid again within 10 minutes (+${c2 - c1})`);
    if (c3 !== c2) fail(`a wrong answer changed coins by ${c3 - c2}`);
    if (c4 !== c3 + 10) fail(`the id did not pay again after 10 minutes (+${c4 - c3})`);
    // Flashcard "Know it" is self-marked: it must never pay.
    await go('/set/c3/flashcards');
    const before = await coins();
    for (let i = 0; i < 4; i++) await page.keyboard.press('2');
    await page.waitForTimeout(100);
    if ((await coins()) !== before) fail('tapping "Know it" on flashcards earned coins');
  });

  await check('collect: guessing, retries and self-marking do not pay', async () => {
    const browser = page.context().browser();
    const ctx = await browser.newContext();
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(`${STUDY}#/`, { waitUntil: 'load' });
    const pay = (id, ok) => p.evaluate(([id, ok]) => { const c0 = window.CQCollect.coins(); window.CQ.bumpMastery(id, ok); return window.CQCollect.coins() - c0; }, [id, ok]);

    // A miss uses up the id's try: guessing again until right pays nothing.
    await pay('probe-retry', false);
    if ((await pay('probe-retry', true)) !== 0) fail('a question missed and then retried paid coins');

    // Guess guard: six misses in the last ten, then right answers pay only
    // once no more than five of the last ten are misses.
    for (let i = 0; i < 6; i++) await pay(`probe-miss-${i}`, false);
    let paidAt = 0;
    for (let i = 1; i <= 6 && !paidAt; i++) if ((await pay(`probe-hit-${i}`, true)) === 10) paidAt = i;
    if (paidAt !== 5) fail(`after 6 misses, the ${paidAt || 'none'}th right answer paid; expected the 5th`);
    if (!(await p.locator('#toast').filter({ hasText: 'Coins paused' }).count())) fail('no "Coins paused" message when the guard held coins back');

    // Clock set back: the cooldown restarts, it isn't forgotten.
    const back = await p.evaluate(() => { const real = Date.now; Date.now = () => real() - 60000; try { const c0 = window.CQCollect.coins(); window.CQ.bumpMastery('probe-hit-5', true); return window.CQCollect.coins() - c0; } finally { Date.now = real; } });
    if (back !== 0) fail(`setting the clock back let a cooling id pay +${back}`);

    // Match and flashcards, including the router's alternate '#set/…' form.
    for (const h of ['#/set/c2/match', '#set/c1/flashcards', '#set/c2/match/']) {
      await p.evaluate((h) => { location.hash = h; }, h);
      await p.waitForTimeout(120);
      if ((await pay(`probe-route-${h}`, true)) !== 0) fail(`a right answer on ${h} paid coins`);
    }

    // A corrupt stored value is replaced, not a reason to stop saving.
    await p.evaluate((k) => { location.hash = '#/'; localStorage.setItem(k, '{"coins":500,'); }, KEY);
    await p.reload({ waitUntil: 'load' });
    await p.evaluate(() => window.CQCollect.grant(360));
    await p.reload({ waitUntil: 'load' });
    const kept = await p.evaluate(() => window.CQCollect.coins());
    if (kept !== 360) fail(`after a corrupt stored value, granted coins read back as ${kept}, not 360`);
    await ctx.close();
    for (const e of errs) fail(e);
  });

  let gotId = null;
  await check('collect: open a pack', async () => {
    const r0 = await page.evaluate(() => { const c = window.CQCollect; c.grant(-c.coins()); return { none: c.open('lab'), expected: c.expectedAnswers(), packs: c.packs.length, sizes: c.packs.map((p) => p.critters.length) }; });
    if (r0.none !== null) fail('a pack opened with 0 coins');
    if (r0.packs !== 4 || r0.sizes.some((n) => n < 10 || n > 12)) fail(`expected 4 packs of 10–12 critters, got ${r0.sizes}`);
    if (!(r0.expected >= 600 && r0.expected <= 900)) fail(`expected answers to finish the collection is ${r0.expected}, outside 600–900`);

    await page.evaluate(() => window.CQCollect.grant(1000));
    await go('/collection');
    if ((await page.locator('.cq-tile.locked').count()) !== 40) fail('an empty collection should show 40 "?" silhouettes');
    const before = await coins();
    const ownedBefore = await page.evaluate(() => window.CQCollect.owned());
    await page.click('[data-pack="lab"]');
    await page.waitForTimeout(150);
    if (!(await page.locator('.cq-reveal[role=dialog]').count())) return fail('no reveal dialog after opening a pack');
    if (!(await page.locator('.cq-bigpack.shake').count())) fail('the pack did not shake');
    await page.click('.cq-reveal button:has-text("Skip")');
    await page.waitForTimeout(100);
    if (!(await page.locator('.cq-card.flip.shown').count())) fail('Skip did not jump to the revealed card');
    const after = await page.evaluate(() => document.activeElement?.textContent.trim());
    if (after !== 'Done') fail(`after the reveal focus is on "${after}", not Done (an extra Enter could buy a pack)`);
    const name = (await page.locator('.cq-card-name').textContent()).trim();
    const res = await page.evaluate(({ name, ownedBefore }) => {
      const c = window.CQCollect;
      const critter = c.packs.flatMap((p) => p.critters).find((x) => x.name === name);
      return critter && { id: critter.id, rarity: critter.rarity, had: ownedBefore[critter.id] || 0, now: c.owned()[critter.id] || 0 };
    }, { name, ownedBefore });
    if (!res) return fail(`revealed "${name}", which is not a critter`);
    gotId = res.id;
    if (res.now !== res.had + 1) fail(`owning ${res.had} → ${res.now} after opening ${name}`);
    const refund = res.had ? (await page.evaluate((r) => window.CQCollect.rarities.find((x) => x.id === r).refund, res.rarity)) : 0;
    if ((await coins()) !== before - 180 + refund) fail(`coins ${before} → ${await coins()} after a pack, expected −180${refund ? ` +${refund}` : ''}`);
    if (!(await page.locator('.cq-card .cq-rarity').count())) fail('the card shows no rarity label');
    // Close with the keyboard; focus returns to the pack's button.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    if (await page.locator('.cq-reveal').count()) fail('Escape did not close the reveal');
    const focused = await page.evaluate(() => document.activeElement?.dataset?.key);
    if (focused !== 'open-lab') fail(`focus went to "${focused}" after closing, not the pack button`);
    if (!(await page.locator(`.cq-tile[data-critter="${gotId}"]`).count())) fail('the new critter is not shown as owned in the grid');
    if ((await page.locator('.cq-tile.locked').count()) !== 39) fail('the grid still shows 40 silhouettes');

    // Open again from the keyboard alone.
    await page.focus('[data-pack="ocean"]');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape'); // skip
    await page.waitForTimeout(80);
    if (!(await page.locator('.cq-card.shown').count())) fail('Escape did not skip the animation');
    await page.keyboard.press('Escape'); // close
    await page.waitForTimeout(80);
    if (await page.locator('.cq-reveal').count()) fail('second Escape did not close the reveal');
  });

  await check('collect: icon on the Gold Quest board', async () => {
    if (!gotId) return fail('no critter to choose (pack check failed)');
    await go('/collection');
    await page.click(`.cq-tile[data-critter="${gotId}"]`);
    await page.waitForTimeout(100);
    if ((await page.getAttribute(`.cq-tile[data-critter="${gotId}"]`, 'aria-pressed')) !== 'true') fail('chosen critter is not marked as the icon');
    const emoji = await page.evaluate(() => window.CQ.player().icon);
    const want = await page.evaluate((id) => window.CQCollect.packs.flatMap((p) => p.critters).find((c) => c.id === id).emoji, gotId);
    if (emoji !== want) fail(`CQ.player().icon is ${emoji}, expected ${want}`);
    await page.reload({ waitUntil: 'load' });
    if ((await page.evaluate(() => window.CQ.player().icon)) !== want) fail('the icon choice did not survive a reload');

    await go('/set/c1/gold');
    await page.click('text=Start quest');
    await page.waitForTimeout(200);
    // Jump the clock past the end of the quest instead of waiting minutes.
    await page.evaluate(() => { const real = Date.now; window.__cqRealNow = real; Date.now = () => real() + 60 * 60 * 1000; });
    try {
      await page.waitForSelector('.board .brow.me', { timeout: 3000 });
    } finally {
      await page.evaluate(() => { if (window.__cqRealNow) Date.now = window.__cqRealNow; });
    }
    const row = (await page.locator('.board .brow.me .nm').textContent()) || '';
    if (!row.includes(want)) fail(`Gold Quest results show "${row}", without the chosen icon ${want}`);
  });

  await check('collect: phone width, tabs, reduced motion, no storage', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.CQCollect.grant(400));
    await go('/collection');
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) fail('horizontal scroll on the collection page at 390px');
    await page.click('[data-pack="space"]');
    await page.waitForTimeout(200);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) fail('horizontal scroll with the reveal open at 390px');
    const small = await page.evaluate(() => [...document.querySelectorAll('.cq-reveal button')].filter((b) => b.getBoundingClientRect().height < 44).length);
    if (small) fail(`${small} reveal button(s) under 44px tall`);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 360, height: 740 });
    await page.waitForTimeout(100);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) fail('the 🎒 header button causes horizontal scroll at 360px');
    await page.setViewportSize({ width: 1280, height: 900 });

    // A second tab sees coins earned in this one.
    const other = await page.context().newPage();
    await other.goto(`${STUDY}#/`, { waitUntil: 'load' });
    await page.evaluate(() => window.CQCollect.grant(70));
    const want = await coins();
    await other.waitForTimeout(300);
    const seen = (await other.locator('#bag .cq-badge').textContent()).trim();
    if (seen !== String(want)) fail(`the other tab's badge shows ${seen}, balance is ${want}`);
    await other.close();

    // Reduced motion: the reveal is instant.
    const errs = [];
    const browser = page.context().browser();
    const rm = await browser.newContext({ reducedMotion: 'reduce' });
    const p2 = await rm.newPage();
    p2.on('pageerror', (e) => errs.push(`reduced motion: ${e.message}`));
    await p2.goto(`${STUDY}#/collection`, { waitUntil: 'load' });
    await p2.evaluate(() => window.CQCollect.grant(1000));
    const c0 = await p2.evaluate(() => window.CQCollect.coins());
    await p2.focus('[data-pack="lab"]');
    await p2.keyboard.press('Enter');
    if (!(await p2.locator('.cq-card.shown').count())) fail('under reduced motion the reveal was not instant');
    if (await p2.locator('.cq-reveal button:has-text("Skip")').count()) fail('under reduced motion a Skip button was left showing');
    await p2.waitForTimeout(200);
    const said = await p2.locator('.cq-reveal [role=status]').textContent();
    if (!/critter|Duplicate/.test(said || '')) fail(`under reduced motion the result was not put in the status region ("${said}")`);
    await p2.keyboard.press('Enter'); // lands on Done: closes, never buys another
    await p2.waitForTimeout(100);
    const spent = c0 - (await p2.evaluate(() => window.CQCollect.coins()));
    const opened = await p2.evaluate((k) => JSON.parse(localStorage.getItem(k)).opened, KEY);
    if (opened !== 1) fail(`two Enters opened ${opened} packs (spent ${spent})`);
    await rm.close();

    // Storage blocked: the collection still works for the session.
    const ns = await browser.newContext();
    await ns.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });
    });
    const p3 = await ns.newPage();
    p3.on('pageerror', (e) => { if (/collect/.test(e.stack || '')) errs.push(`no storage: ${e.message}`); });
    await p3.goto(`${STUDY}#/collection`, { waitUntil: 'load' });
    const r = await p3.evaluate(() => { const c = window.CQCollect; c.grant(180); const got = c.open('lab'); return { got: !!got, coins: c.coins(), owned: Object.keys(c.owned()).length }; });
    if (!r.got || r.owned !== 1) fail('with storage blocked a pack could not be opened');
    if (!(await p3.locator('.cq-pack').count())) fail('with storage blocked the collection page did not render');
    await ns.close();
    for (const e of errs) fail(e);
  });

  await check('collect: every new Lab problem pays', async () => {
    // Problem Lab reports each problem of a skill under one id ('lab:sci'),
    // but each is new and answered once, so each right answer pays.
    const ctx = await page.context().browser().newContext();
    const p = await ctx.newPage();
    await p.goto(`${STUDY}#/set/c3/lab`, { waitUntil: 'load' });
    await p.waitForTimeout(200);
    const paid = await p.evaluate(() => [1, 2, 3].map(() => { const c0 = window.CQCollect.coins(); window.CQ.bumpMastery('lab:sci', true); return window.CQCollect.coins() - c0; }));
    if (paid.join() !== '10,10,10') fail(`three right Lab answers on one skill paid ${paid.join(', ')}`);
    // The same id elsewhere (a Lab item in a game) still pays once.
    await p.goto(`${STUDY}#/set/c3/gold`, { waitUntil: 'load' });
    await p.waitForTimeout(200);
    const again = await p.evaluate(() => [1, 2].map(() => { const c0 = window.CQCollect.coins(); window.CQ.bumpMastery('lab:std', true); return window.CQCollect.coins() - c0; }));
    if (again.join() !== '10,0') fail(`a repeated Lab id in a game paid ${again.join(', ')}`);
    await ctx.close();
  });
};
