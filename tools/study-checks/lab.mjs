/**
 * Problem Lab smoke check, run by tools/smoke-study.mjs: opens the Lab on
 * Concept 3, answers three problems correctly, then uses "Show me how" and
 * confirms the method and the worked solution render — and that the assisted
 * answer earns no mastery. Then the units after the notes: three problems on
 * Unit 10 and two on Unit 8 answered right, a formula graded case-sensitively,
 * "Show me how" on a transition-metal name keeping the Roman numeral back,
 * "p+ n0 e-" labels accepted, the Lab offered on Unit 5 but not on Unit 7,
 * and All of Chemistry's skills grouped by unit.
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

    // Units after the notes: The Mole (3 right answers) and Naming (2), each
    // marked right with a worked solution; the Lab is on Unit 5 but not Unit 7.
    for (const [setId, n] of [['chem-u10', 3], ['chem-u8', 2]]) {
      await go(`/set/${setId}/lab`);
      if (!(await page.locator('.lab-stage .q-card').count())) { fail(`no problem on screen in ${setId}`); continue; }
      for (let i = 0; i < n; i++) {
        const q = await current();
        if (!q) { fail(`CQLab.current is empty on ${setId}`); break; }
        const set = await page.evaluate((skill) => window.CQLab.skills.find((s) => s.id === skill)?.setId, q.skill);
        if (set !== setId) fail(`${setId} served a ${q.skill} problem from ${set}`);
        await answer(q);
        if (!(await page.locator('.lab-stage .feedback.good').count())) fail(`the right answer "${q.answer}" (${q.skill}) was not marked correct on ${setId}`);
        if (!(await page.locator('.lab-stage .feedback .lab-work').count())) fail(`no worked solution after a ${q.skill} problem`);
        const next = page.locator('.lab-stage .btn.primary.lg', { hasText: 'Next problem' });
        if (!(await next.count())) { fail('no "Next problem" button'); break; }
        await next.click();
        await page.waitForTimeout(120);
      }
      if ((await streak()) !== n) fail(`${n} right answers on ${setId} but the streak reads ${await streak()}`);
    }
    // A formula is graded with its capitals: "co" is not CO.
    await page.evaluate(() => {
      let q;
      for (let i = 0; i < 500; i++) { q = window.CQLab.generate('formula', { difficulty: 1 }); if (q.answer.toLowerCase() !== q.answer) break; }
      window.CQLab.show(q);
    });
    const low = await page.evaluate(() => window.CQLab.current.accept[0].toLowerCase());
    await page.locator('.lab-stage .q-card input.input').fill(low);
    await page.locator('.lab-stage .q-card input.input').press('Enter');
    await page.waitForTimeout(100);
    if (!(await page.locator('.lab-stage .feedback.bad').count())) fail(`the formula "${low}" (all lower case) was marked right`);
    // "Show me how" on a transition-metal name teaches the method but does not
    // hand over the Roman numeral or the metal's charge.
    const tm = await page.evaluate(() => {
      let q;
      for (let i = 0; i < 500; i++) { q = window.CQLab.generate('naming', { difficulty: 3 }); if (/\([IV]+\)/.test(q.answer)) break; }
      window.CQLab.show(q);
      return { answer: q.answer, roman: q.answer.match(/\(([IV]+)\)/)[1], charge: ({ I: 1, II: 2, III: 3, IV: 4 })[q.answer.match(/\(([IV]+)\)/)[1]] };
    });
    await page.locator('.lab-hint-btn').click();
    await page.waitForTimeout(100);
    const tmHint = (await page.locator('.lab-stage .lab-hint .lab-work').textContent()) || '';
    if (tmHint.includes(`(${tm.roman})`) || new RegExp(`\\+\\s*${tm.charge}(?!\\d)`).test(tmHint)) fail(`"Show me how" gives away ${tm.answer}: ${tmHint}`);
    // Protons, neutrons, electrons typed with the particle symbols "p+ n0 e-".
    const pne = await page.evaluate(() => {
      const q = window.CQLab.generate('pne', { difficulty: 2 });
      window.CQLab.show(q);
      const [p, n, e] = q.answer.match(/\d+/g);
      return `${p} p+ ${n} n0 ${e} e-`;
    });
    await page.locator('.lab-stage .q-card input.input').fill(pne);
    await page.locator('.lab-stage .q-card input.input').press('Enter');
    await page.waitForTimeout(100);
    if (!(await page.locator('.lab-stage .feedback.good').count())) fail(`"${pne}" was not accepted`);
    await go('/set/chem-u5');
    if (!(await page.locator('.card.mode', { hasText: 'Problem Lab' }).count())) fail('no Problem Lab card on Unit 5');
    await go('/set/chem-u5/lab');
    const u5 = await page.locator('.lab-chip').allTextContents();
    if (!u5.some((t) => /Protons/.test(t)) || u5.some((t) => /Temperature|Molar mass/.test(t))) fail(`Unit 5 shows the wrong skills: ${u5.join(', ')}`);
    await go('/set/chem-u7');
    if (await page.locator('.card.mode', { hasText: 'Problem Lab' }).count()) fail('a Problem Lab card on Unit 7');
    await go('/set/chem-u7/lab');
    if (await page.locator('.lab-stage').count()) fail('Problem Lab opened on Unit 7');
    // All of Chemistry groups the skills by unit.
    await go('/set/chem-all/lab');
    const groups = await page.locator('.lab-group').allTextContents();
    for (const g of ['Concept 2', 'Concept 3', 'Unit 5', 'Unit 10', 'Unit 12']) if (!groups.includes(g)) fail(`All of Chemistry has no "${g}" group of skills (${groups.join(', ')})`);

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
