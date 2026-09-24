/**
 * Problem Lab smoke check, run by tools/smoke-study.mjs: opens the Lab on
 * Concept 3, answers three problems correctly, then uses "Show me how" and
 * confirms the method and the worked solution render — and that the assisted
 * answer earns no mastery.
 */
export default async ({ page, go, check, fail }) => {
  const current = () => page.evaluate(() => {
    const q = window.CQLab && window.CQLab.current;
    return q && { type: q.type, answer: q.answer, skill: q.skill, id: q.id };
  });
  const answer = async (q) => {
    if (q.type === 'mc') {
      await page.locator(`.lab-stage .opt[data-v="${q.answer.replace(/"/g, '\\"')}"]`).click();
    } else {
      const input = page.locator('.lab-stage .q-card input.input');
      await input.fill(q.answer);
      await input.press('Enter');
    }
    await page.waitForTimeout(150);
  };
  const streak = async () => Number((await page.locator('.lab-stats .lab-stat b').first().textContent()) || 0);

  await check('problem lab', async () => {
    await go('/set/c3/lab');
    if (!(await page.locator('.lab-stage .q-card').count())) return fail('no problem on screen');
    if (!(await page.locator('.lab-chip[aria-pressed="true"]').count())) fail('no skill chips switched on');

    for (let i = 0; i < 3; i++) {
      const q = await current();
      if (!q) return fail('CQLab.current is empty');
      await answer(q);
      if (!(await page.locator('.lab-stage .feedback.good').count())) fail(`the right answer "${q.answer}" (${q.skill}) was not marked correct`);
      if (!(await page.locator('.lab-stage .feedback .lab-work').count())) fail(`no worked solution after a ${q.skill} problem`);
      const next = page.locator('.lab-stage .btn.primary.lg', { hasText: 'Next problem' });
      if (!(await next.count())) return fail('no "Next problem" button');
      await next.click();
      await page.waitForTimeout(120);
    }
    if ((await streak()) !== 3) fail(`three right answers but the streak reads ${await streak()}`);

    // "Show me how": the method appears before answering, and the assisted
    // answer is marked right but earns no mastery and no streak.
    const q = await current();
    const before = await page.evaluate((id) => JSON.parse(localStorage.getItem('chemquest:v1') || '{}').mastery?.[id] || 0, q.id);
    await page.locator('.lab-hint-btn').click();
    await page.waitForTimeout(100);
    const hint = page.locator('.lab-stage .lab-hint');
    if (!(await hint.isVisible())) return fail('"Show me how" did not open the method');
    if (!(await hint.locator('.lab-work').count())) fail('the method panel is empty');
    await answer(q);
    if (!(await page.locator('.lab-stage .feedback.good').count())) fail('an assisted right answer was not marked correct');
    if (!(await page.locator('.lab-stage .feedback .lab-work').count())) fail('no worked solution after an assisted answer');
    const after = await page.evaluate((id) => JSON.parse(localStorage.getItem('chemquest:v1') || '{}').mastery?.[id] || 0, q.id);
    if (after !== before) fail(`an assisted answer changed mastery (${before} → ${after})`);
    if ((await streak()) !== 3) fail('an assisted answer changed the streak');

    // A slip in the last digit is wrong, typed into the real card: the Lab
    // grades its calculations exactly, not with the site's 0.6% leeway.
    const miss = await page.evaluate(() => {
      let q;
      for (let i = 0; i < 2000; i++) { q = window.CQLab.generate('std', { difficulty: 2 }); if (/^\d{1,3}(,\d{3})+$/.test(q.answer)) break; }
      window.CQLab.show(q);
      const n = q.answer.replace(/,/g, '');
      return { answer: q.answer, typed: String(BigInt(n) + 1n) };
    });
    await page.locator('.lab-stage .q-card input.input').fill(miss.typed);
    await page.locator('.lab-stage .q-card input.input').press('Enter');
    await page.waitForTimeout(100);
    if (!(await page.locator('.lab-stage .feedback.bad').count())) fail(`"${miss.typed}" was marked right for ${miss.answer}`);

    // Concept 2 gets its own skills; Concept 1 has no Lab at all.
    await go('/set/c2/lab');
    const skills = await page.locator('.lab-chip').allTextContents();
    if (!skills.some((t) => /Temperature/.test(t)) || skills.some((t) => /Dimensional/.test(t))) fail(`Concept 2 shows the wrong skills: ${skills.join(', ')}`);
    await go('/set/c1/lab');
    if (await page.locator('.lab-stage').count()) fail('Problem Lab opened on Concept 1');

    await page.setViewportSize({ width: 390, height: 844 });
    await go('/set/chem-all/lab');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (overflow) fail('horizontal scroll at 390px in Problem Lab');
    // A long fence scrolls inside its box, but the boxed answer is never cut off.
    await go('/set/c3/lab');
    await page.evaluate(() => {
      let q;
      for (let i = 0; i < 5000; i++) { q = window.CQLab.generate('dim', { difficulty: 3 }); if (q.explanation.querySelectorAll('.lab-fence tr:first-child td').length >= 5) break; }
      window.CQLab.show(q);
    });
    await page.locator('.lab-stage button', { hasText: "Don't know" }).click();
    await page.waitForTimeout(150);
    const clip = await page.evaluate(() => {
      const card = document.querySelector('.lab-stage .feedback').getBoundingClientRect();
      return [...document.querySelectorAll('.lab-stage .feedback .lab-ans')].map((b) => b.getBoundingClientRect()).filter((r) => r.right > card.right + 1 || r.left < card.left - 1).length;
    });
    if (clip) fail('a boxed answer is cut off at 390px');
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail('horizontal scroll at 390px with a long fence');
    await page.setViewportSize({ width: 1280, height: 900 });
  });
};
