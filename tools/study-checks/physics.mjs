/**
 * Physics Lab smoke check, run by tools/smoke-study.mjs: opens the Lab on
 * Unit 3 (Forces), answers three problems correctly, then uses "Show me how"
 * and confirms the method appears, the worked solution follows and the
 * assisted answer earns no mastery. Also checks a figure renders, a slip in
 * the last digit is marked wrong, Enter moves on, the phone layout has no
 * sideways scroll, and the mode is not offered outside Physics.
 *
 * Skips (without failing) when the page does not load study/physics.js.
 */
export default async ({ page, go, check, fail }) => {
  await go('/');
  if (!(await page.evaluate(() => !!window.CQPhysics))) {
    console.log('  physics lab: skipped (study/physics.js is not loaded on this page)');
    return;
  }
  const current = () => page.evaluate(() => {
    const q = window.CQPhysics && window.CQPhysics.current;
    return q && { type: q.type, answer: q.answer, skill: q.skill, id: q.id };
  });
  const answer = async (q, typed) => {
    if (q.type === 'mc') {
      await page.locator(`.px-stage .opt[data-v="${q.answer.replace(/"/g, '\\"')}"]`).click();
    } else {
      const input = page.locator('.px-stage .q-card input.input');
      await input.fill(typed ?? q.answer);
      await input.press('Enter');
    }
    await page.waitForTimeout(150);
  };
  const streak = async () => Number((await page.locator('.px-stats .px-stat b').first().textContent()) || 0);
  const mastery = (id) => page.evaluate((k) => JSON.parse(localStorage.getItem('chemquest:v1') || '{}').mastery?.[k] || 0, id);

  await check('physics lab', async () => {
    await go('/set/phys-u3');
    if (!(await page.locator('.card.mode[href$="/physics"]').count())) fail('Unit 3 does not offer Physics Lab');
    await go('/set/phys-u3/physics');
    if (!(await page.locator('.px-stage .q-card').count())) return fail('no problem on screen');
    const chips = await page.locator('.px-chip').allTextContents();
    if (chips.length !== 5 || !chips.some((t) => /Friction/.test(t)) || chips.some((t) => /Snell|Ohm/.test(t))) fail(`Unit 3 shows the wrong skills: ${chips.join(', ')}`);

    for (let i = 0; i < 3; i++) {
      const q = await current();
      if (!q) return fail('CQPhysics.current is empty');
      await answer(q);
      if (!(await page.locator('.px-stage .feedback.good').count())) fail(`the right answer "${q.answer}" (${q.skill}) was not marked correct`);
      if (!(await page.locator('.px-stage .feedback .px-work, .px-stage .feedback .px-guess').count())) fail(`no worked solution after a ${q.skill} problem`);
      const next = page.locator('.px-stage .btn.primary.lg', { hasText: 'Next problem' });
      if (!(await next.count())) return fail('no "Next problem" button');
      if (i === 2) {
        // Enter moves on to the next problem as well
        const before = await page.locator('.px-stage .q-prompt').textContent();
        await page.locator('.px-stats').click();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(150);
        if ((await page.locator('.px-stage .feedback').count()) || (await page.locator('.px-stage .q-prompt').textContent()) === before) fail('Enter did not move on to a new problem');
      } else {
        await next.click();
        await page.waitForTimeout(120);
      }
    }
    if ((await streak()) !== 3) fail(`three right answers but the streak reads ${await streak()}`);

    // "Show me how": the method appears first, and the assisted answer earns
    // no mastery and no streak.
    const q = await current();
    const before = await mastery(q.id);
    await page.locator('.px-hint-btn').click();
    await page.waitForTimeout(100);
    const hint = page.locator('.px-stage .px-hint');
    if (!(await hint.isVisible())) return fail('"Show me how" did not open the method');
    if (!(await hint.locator('.px-guess').count())) fail('the method panel has no Givens / Unknown / Equation layout');
    if (await hint.locator('.px-ans').count()) fail('the method panel gives away the boxed answer');
    await answer(q);
    if (!(await page.locator('.px-stage .feedback.good').count())) fail('an assisted right answer was not marked correct');
    if ((await mastery(q.id)) !== before) fail(`an assisted answer changed mastery (${before} → ${await mastery(q.id)})`);
    if ((await streak()) !== 3) fail('an assisted answer changed the streak');

    // A figure: a free-body diagram renders as an SVG with a description.
    await page.evaluate(() => window.CQPhysics.show(window.CQPhysics.generate('fbd', { difficulty: 2 })));
    await page.waitForTimeout(100);
    const fig = await page.evaluate(() => {
      const f = document.querySelector('.px-stage .q-figure');
      const s = f && f.querySelector('svg');
      return s ? { label: f.getAttribute('aria-label') || '', w: s.getBoundingClientRect().width, text: s.textContent } : null;
    });
    if (!fig) fail('no figure on a free-body diagram problem');
    else {
      if (fig.label.length < 20) fail('the figure has no description');
      if (fig.w < 100) fail('the figure did not render at a readable size');
      if (!/N/.test(fig.text)) fail('the free-body diagram has no force labels');
    }
    const optCount = await page.locator('.px-stage .opt').count();
    if (optCount !== 4) fail(`a free-body diagram question shows ${optCount} options`);
    await page.keyboard.press('1');
    await page.waitForTimeout(120);
    if (!(await page.locator('.px-stage .feedback').count())) fail('pressing 1 did not choose the first option');

    // A slip in the last digit is wrong: Physics Lab grades exactly.
    const miss = await page.evaluate(() => {
      let q;
      for (let i = 0; i < 200; i++) { q = window.CQPhysics.generate('fma', { difficulty: 1 }); if (q.variant === 'F' && /^\d+ N$/.test(q.answer)) break; }
      window.CQPhysics.show(q);
      return { answer: q.answer, typed: `${Number(q.answer.split(' ')[0]) + 1} N` };
    });
    await page.locator('.px-stage input.input').fill(miss.typed);
    await page.locator('.px-stage input.input').press('Enter');
    await page.waitForTimeout(100);
    if (!(await page.locator('.px-stage .feedback.bad').count())) fail(`"${miss.typed}" was marked right for ${miss.answer}`);

    // Only Physics gets the mode.
    await go('/set/c1');
    if (await page.locator('.card.mode[href$="/physics"]').count()) fail('Physics Lab is offered on Chemistry Concept 1');
    await go('/set/c1/physics');
    if (await page.locator('.px-stage').count()) fail('Physics Lab opened on Chemistry Concept 1');

    // All of Physics: every unit's skills, and no sideways scroll on a phone.
    await page.setViewportSize({ width: 390, height: 844 });
    await go('/set/phys-all/physics');
    if ((await page.locator('.px-chip').count()) < 36) fail(`All of Physics offers only ${await page.locator('.px-chip').count()} skills`);
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail('horizontal scroll at 390px in Physics Lab');
    await page.locator('.px-stage button', { hasText: "Don't know" }).click().catch(() => page.locator('.px-stage .opt').first().click());
    await page.waitForTimeout(150);
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail('horizontal scroll at 390px with a worked solution open');
    await page.setViewportSize({ width: 1280, height: 900 });
  });
};
