/**
 * Geometry Lab smoke check (study/geometry.js), run by tools/smoke-study.mjs.
 *
 * Opens the Lab on Unit 6 (Right Triangles and Trigonometry), answers three
 * problems correctly from CQGeometry.current — by typing or with the number
 * keys — and confirms each is marked right with a worked solution and a
 * rendered figure; uses "Show me how" once and confirms the assisted answer
 * earns no mastery and no streak; checks that a rounding slip is marked wrong;
 * that Enter moves to the next problem; that the mode is offered on every
 * Geometry set but not on another subject; and that a phone-width screen has
 * no horizontal scroll. Skips (does not fail) when geometry.js is not loaded.
 */
export default async ({ page, go, check, fail }) => {
  await go('/');
  const loaded = await page.evaluate(() => !!window.CQGeometry);
  if (!loaded) {
    console.log('skip  geometry lab (study/geometry.js is not loaded on the page)');
    return;
  }
  const current = () => page.evaluate(() => {
    const q = window.CQGeometry && window.CQGeometry.current;
    return q && { type: q.type, answer: q.answer, skill: q.skill, id: q.id, options: q.options || null, figure: !!q.figure };
  });
  const mastery = (id) => page.evaluate((k) => JSON.parse(localStorage.getItem('chemquest:v1') || '{}').mastery?.[k] || 0, id);
  const streak = async () => Number((await page.locator('.gm-stats .gm-stat b').first().textContent()) || 0);
  const answer = async (q, { keys = false } = {}) => {
    if (q.type === 'mc') {
      if (keys) await page.keyboard.press(String(q.options.indexOf(q.answer) + 1));
      else await page.locator(`.gm-stage .opt[data-v="${q.answer.replace(/"/g, '\\"')}"]`).click();
    } else {
      const input = page.locator('.gm-stage .q-card input.input');
      await input.fill(q.answer);
      await input.press('Enter');
    }
    await page.waitForTimeout(150);
  };
  const figureOk = () => page.evaluate(() => {
    const box = document.querySelector('.gm-stage .q-figure');
    if (!box) return 'no figure box';
    const svg = box.querySelector('svg');
    if (!svg) return 'no <svg> in the figure';
    const r = svg.getBoundingClientRect();
    if (r.width < 80 || r.height < 40) return `the figure is only ${Math.round(r.width)}×${Math.round(r.height)}px`;
    if (!(box.getAttribute('aria-label') || '').trim()) return 'the figure has no text alternative';
    if (!svg.querySelector('line, polygon, path, circle, polyline')) return 'the figure draws nothing';
    return '';
  });

  await check('geometry lab', async () => {
    await go('/set/geo-u6/geometry');
    if (!(await page.locator('.gm-stage .q-card').count())) return fail('no problem on screen');
    if (!(await page.locator('.gm-chip[aria-pressed="true"]').count())) fail('no skill chips switched on');

    for (let i = 0; i < 3; i++) {
      const q = await current();
      if (!q) return fail('CQGeometry.current is empty');
      if (!q.id.startsWith('geom:')) fail(`unexpected id ${q.id}`);
      if (q.figure) { const f = await figureOk(); if (f) fail(`${q.skill}: ${f}`); }
      await answer(q, { keys: i === 1 });
      if (!(await page.locator('.gm-stage .feedback.good').count())) fail(`the right answer "${q.answer}" (${q.skill}) was not marked correct`);
      if (!(await page.locator('.gm-stage .feedback .gm-work').count())) fail(`no worked solution after a ${q.skill} problem`);
      const next = page.locator('.gm-stage .btn.primary.lg', { hasText: 'Next problem' });
      if (!(await next.count())) return fail('no "Next problem" button');
      if (i === 2) {
        // Enter moves on
        const before = q.id + q.answer;
        await page.keyboard.press('Enter');
        await page.waitForTimeout(150);
        const after = await current();
        if (!after || (await page.locator('.gm-stage .feedback').count())) fail('Enter did not move to the next problem');
        else if (after.id + after.answer === before && !(await page.locator('.gm-stage .q-card').count())) fail('no new problem after Enter');
      } else {
        await next.click();
        await page.waitForTimeout(120);
      }
    }
    if ((await streak()) !== 3) fail(`three right answers but the streak reads ${await streak()}`);

    // Every Unit 6 skill draws its figure.
    const figs = await page.evaluate(() => {
      const G = window.CQGeometry;
      return G.skills.filter((s) => s.setId === 'geo-u6').map((s) => { const q = G.generate(s.id, { difficulty: 2 }); return q.figure && q.figureAlt ? '' : s.id; }).filter(Boolean);
    });
    if (figs.length) fail(`no figure for ${figs.join(', ')}`);
    await page.evaluate(() => { const G = window.CQGeometry; G.show(G.generate('trigside', { difficulty: 2 })); });
    await page.waitForTimeout(100);
    { const f = await figureOk(); if (f) fail(`trigside: ${f}`); }

    // "Show me how": the method appears, and the assisted right answer earns no mastery and no streak.
    const q = await current();
    const before = await mastery(q.id);
    const s0 = await streak();
    await page.locator('.gm-hint-btn').click();
    await page.waitForTimeout(100);
    const hint = page.locator('.gm-stage .gm-hint');
    if (!(await hint.isVisible())) return fail('"Show me how" did not open the method');
    if (!(await hint.locator('.gm-work').count())) fail('the method panel is empty');
    if (await hint.locator('.gm-ans').count()) fail('"Show me how" shows a boxed answer');
    await answer(q);
    if (!(await page.locator('.gm-stage .feedback.good').count())) fail('an assisted right answer was not marked correct');
    const after = await mastery(q.id);
    if (after !== before) fail(`an assisted answer changed mastery (${before} → ${after})`);
    if ((await streak()) !== s0) fail('an assisted answer changed the streak');

    // Exact grading, typed into the real card: one tenth off is wrong.
    const slip = await page.evaluate(() => {
      const G = window.CQGeometry;
      const q = G.generate('trigside', { difficulty: 2 });
      G.show(q);
      const [v, u] = q.answer.split(' ');
      return { answer: q.answer, typed: `${(Number(v) + 0.1).toFixed(1)} ${u}` };
    });
    await page.locator('.gm-stage .q-card input.input').fill(slip.typed);
    await page.locator('.gm-stage .q-card input.input').press('Enter');
    await page.waitForTimeout(100);
    if (!(await page.locator('.gm-stage .feedback.bad').count())) fail(`"${slip.typed}" was marked right for ${slip.answer}`);

    // Offered on every Geometry set, not on another subject.
    await go('/set/geo-all');
    if (!(await page.locator('.card.mode h3', { hasText: /^Geometry Lab$/ }).count())) fail('Geometry Lab is not offered on All of Geometry');
    await go('/set/geo-u9');
    if (!(await page.locator('.card.mode h3', { hasText: /^Geometry Lab$/ }).count())) fail('Geometry Lab is not offered on Unit 9');
    await go('/set/c1');
    if (await page.locator('.card.mode h3', { hasText: /^Geometry Lab$/ }).count()) fail('Geometry Lab is offered on Chemistry Concept 1');
    await go('/set/c1/geometry');
    if (await page.locator('.gm-stage').count()) fail('Geometry Lab opened on Chemistry Concept 1');

    // Phone width: no sideways scroll, with the chips, a figure and a worked solution.
    await page.setViewportSize({ width: 390, height: 844 });
    await go('/set/geo-all/geometry');
    await page.locator('.gm-stage button', { hasText: "Don't know" }).click().catch(() => {});
    const mc = page.locator('.gm-stage .opt').first();
    if (await mc.count()) await mc.click().catch(() => {});
    await page.waitForTimeout(150);
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) fail('horizontal scroll at 390px in Geometry Lab');
    await page.setViewportSize({ width: 1280, height: 900 });
  });
};
