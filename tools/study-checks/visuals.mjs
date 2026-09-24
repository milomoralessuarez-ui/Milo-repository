/**
 * Picture Quiz checks (study/visuals.js), run by tools/smoke-study.mjs.
 *
 * Plays a full round of Picture Quiz for every set it suits (Concepts 1, 2
 * and 4), confirming each question shows an <svg> drawing with a non-empty
 * aria-label, that the round ends in a score with a review of the misses, and
 * that a missed picture reaches the Mistakes list. Also checks the drawing
 * library itself: every equipment item draws, and the four accuracy/precision
 * targets are generated unambiguously.
 */
export default async function visualsChecks({ page, go, check, fail, answerOne }) {
  await check('picture quiz: drawing library', async () => {
    const r = await page.evaluate(() => {
      const V = window.CQVisuals;
      if (!V) return { missing: true };
      const out = { bad: [], kinds: V.kinds, equipment: V.equipment.length };
      for (const id of V.equipmentIds) {
        const s = V.draw('equipment', id);
        if (!/^<svg[\s\S]*<\/svg>$/.test(s) || !/aria-label="[^"]+"/.test(s)) out.bad.push(`equipment ${id}`);
      }
      for (const kind of V.kinds) {
        for (let i = 0; i < 25; i++) {
          const q = V.generate(kind, {});
          if (!q.figure || !q.figureAlt) out.bad.push(`${kind}: no figure/alt`);
          if (!q.options.includes(q.answer)) out.bad.push(`${kind}: answer not among options`);
          if (new Set(q.options).size !== q.options.length) out.bad.push(`${kind}: duplicate options ${q.options.join(' | ')}`);
          if (!q.id.startsWith(`vis:${kind}:`)) out.bad.push(`${kind}: bad id ${q.id}`);
          // the alt text must not name the answer (a scale's spacing, "labelled
          // every 10 mL", is not a reading, even when it equals one)
          const alt = q.figureAlt.toLowerCase().replace(/labelled every [\d.]+ ml/, '');
          if (alt.includes(String(q.answer).toLowerCase())) out.bad.push(`${kind}: alt gives away "${q.answer}"`);
        }
      }
      // Targets: precise = a tight group; accurate = centred on the bullseye.
      const cen = (p) => p.reduce(([a, b], [x, y]) => [a + x / p.length, b + y / p.length], [0, 0]);
      const spread = (p) => { const [gx, gy] = cen(p); return Math.max(...p.map(([x, y]) => Math.hypot(x - gx, y - gy))); };
      for (let i = 0; i < 200; i++) {
        for (const kind of ['precise-accurate', 'precise-not-accurate', 'accurate-not-precise', 'neither']) {
          const p = V.placeShots(kind);
          const off = Math.hypot(...cen(p));
          const tight = spread(p) <= 11, centred = off <= 6;
          const ok = { 'precise-accurate': tight && centred, 'precise-not-accurate': tight && off >= 40, 'accurate-not-precise': !tight && spread(p) >= 25 && centred, neither: !tight && off >= 40 }[kind];
          if (!ok) { out.bad.push(`target ${kind} ambiguous (spread ${spread(p).toFixed(1)}, off ${off.toFixed(1)})`); break; }
          if (p.length < 5 || p.length > 6) out.bad.push(`target ${kind}: ${p.length} shots`);
        }
      }
      // The thermometer's two scales must agree with the notes' °F = (°C × 9/5) + 32.
      const th = V.draw('equipment', 'thermometer');
      const col = (anchor) => [...th.matchAll(/<text x="(\d+)" y="(\d+)">(-?\d+)<\/text>/g)]
        .filter((m) => (anchor === 'C' ? +m[1] < 120 : +m[1] > 120)).map((m) => [+m[2], +m[3]]);
      const C = col('C'), F = col('F');
      if (C.length < 3 || C.length !== F.length) out.bad.push('thermometer: scales missing');
      for (const [y, c] of C) { const f = F.find(([fy]) => fy === y); if (!f || f[1] !== c * 9 / 5 + 32) out.bad.push(`thermometer: ${c}°C sits opposite ${f ? f[1] : '?'}°F`); }
      if (!th.includes('°C') || !th.includes('°F')) out.bad.push('thermometer: scales not headed °C / °F');
      out.bad = [...new Set(out.bad)].slice(0, 8);
      return out;
    });
    if (r.missing) return fail('window.CQVisuals is not defined');
    if (r.equipment < 18) fail(`only ${r.equipment} equipment drawings`);
    for (const b of r.bad) fail(b);
  });

  for (const setId of ['c1', 'c2', 'c4']) {
    await check(`picture quiz: ${setId} round`, async () => {
      await go(`/set/${setId}/pictures`);
      if (!(await page.locator('h1', { hasText: 'Picture Quiz' }).count())) return fail('Picture Quiz did not open');
      await page.click('text=Start round');
      await page.waitForTimeout(200);
      let n = 0;
      for (let i = 0; i < 12; i++) {
        if (await page.locator('.score-ring').count()) break;
        const fig = page.locator('.q-card .q-figure svg').first();
        if (!(await fig.count())) { fail(`question ${i + 1} has no <svg> drawing`); break; }
        const label = ((await fig.getAttribute('aria-label')) || '').trim();
        const wrap = ((await page.locator('.q-card .q-figure').first().getAttribute('aria-label')) || '').trim();
        if (!label || !wrap) fail(`question ${i + 1}'s drawing has no aria-label`);
        const box = await fig.boundingBox();
        if (!box || box.height < 150) fail(`question ${i + 1}'s drawing renders only ${box ? Math.round(box.height) : 0}px tall`);
        if (!(await answerOne())) { fail(`no answer to pick on question ${i + 1}`); break; }
        n++;
        await page.waitForTimeout(120);
        await page.locator('.q-card .row .btn.primary').first().click();
        await page.waitForTimeout(120);
        // focus must land on the new picture's counter, not fall to <body>
        if (i === 0 && !(await page.locator('.q-card').count() === 0)) {
          const cls = await page.evaluate(() => document.activeElement && document.activeElement.className);
          if (cls !== 'pq-count') fail(`after "Next picture" focus is on ${cls || 'body'}, not the picture counter`);
        }
      }
      if (n !== 10) fail(`a round asked ${n} questions, expected 10`);
      if (!(await page.locator('.score-ring').count())) return fail('no score after ten answers');
      const misses = await page.locator('.pq-miss').count();
      const score = Number(((await page.locator('.score-ring').textContent()) || '').split('/')[0]);
      if (misses !== 10 - score) fail(`score ${score}/10 but ${misses} misses reviewed`);
      if (misses && !(await page.locator('.pq-miss svg[aria-label]').count())) fail('the review of misses shows no drawings');
      if (misses) {
        await go(`/set/${setId}/mistakes`);
        const rows = await page.locator('.mistake-row', { hasText: 'Picture:' }).count();
        if (!rows) fail('missed pictures did not reach the Mistakes list');
      }
    });
  }

  await check('picture quiz: not offered for Concept 3', async () => {
    await go('/set/c3');
    if (await page.locator('.card.mode', { hasText: 'Picture Quiz' }).count()) fail('Concept 3 lists Picture Quiz');
    await go('/set/c3/pictures');
    if (await page.locator('h1', { hasText: 'Picture Quiz' }).count()) fail('#/set/c3/pictures opened the mode');
  });

  await check('picture quiz: phone width', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await go('/set/chem-all/pictures');
    await page.click('text=Start round');
    await page.waitForTimeout(200);
    for (let i = 0; i < 3; i++) {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      if (overflow) fail(`horizontal scroll at 390px on picture ${i + 1}`);
      await answerOne();
      await page.waitForTimeout(100);
      await page.locator('.q-card .row .btn.primary').first().click();
      await page.waitForTimeout(100);
    }
    await page.setViewportSize({ width: 1280, height: 900 });
  });
}
