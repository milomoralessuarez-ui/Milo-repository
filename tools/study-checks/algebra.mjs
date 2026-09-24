/**
 * Algebra Lab check, run by tools/smoke-study.mjs (every .mjs in
 * tools/study-checks/ is loaded and its default export called).
 *
 * Opens Algebra Lab on alg1-u2 in a context of its own, answers three problems
 * correctly (reading window.CQAlgebra.current), opens a hint, and checks that
 * the worked steps render, the tally counts, a hinted answer earns no mastery,
 * a miss reaches the Mistakes list and the page fits a phone. Then it narrows
 * alg1-u5 to its graph-reading skills with the skill chips and answers two
 * graphed problems, answers two unit 13 problems, and confirms the Lab is
 * offered on units 13 and 14.
 *
 * Until study/subjects/alg1.js has real content, a minimal Algebra 1 subject
 * is injected with addInitScript; until index.html loads algebra.js, the page
 * is served with the two tags added. Neither touches the real files.
 */

const UNITS = ['Foundations of Algebra', 'Solving Equations', 'Inequalities', 'Functions', 'Linear Equations & Graphs', 'Systems of Equations', 'Exponents & Exponential Functions', 'Polynomials', 'Factoring', 'Quadratic Equations', 'Radicals & the Pythagorean Theorem', 'Statistics', 'Function Families & Transformations', 'Rational Expressions & Equations'];
const GRAPH_U5 = ['Slope from a graph', 'y-intercept from a graph', 'Equation from a graph'];

/** Serve study/ with algebra.css/.js and an Algebra 1 subject, whatever the checkout has. */
export async function prepareContext(ctx, STUDY) {
  // The page must come from the network so the route below can see it.
  await ctx.route(/\/study\/(index\.html)?(\?[^#]*)?$/, async (route) => {
    const resp = await route.fetch();
    let body = await resp.text();
    if (!/algebra\.js/.test(body)) {
      body = body.replace('</head>', '<link rel="stylesheet" href="algebra.css">\n</head>');
      const tags = [...body.matchAll(/<script src="[^"]+"><\/script>/g)];
      const last = tags[tags.length - 1];
      body = last ? body.slice(0, last.index + last[0].length) + '\n<script src="algebra.js"></script>' + body.slice(last.index + last[0].length)
        : body.replace('</body>', '<script src="algebra.js"></script>\n</body>');
    }
    await route.fulfill({ response: resp, body, headers: { ...resp.headers(), 'content-type': 'text/html; charset=utf-8' } });
  });
  let real = false;
  try {
    const r = await fetch(new URL('subjects/alg1.js', STUDY));
    real = r.ok && /alg1-u1/.test(await r.text());
  } catch { /* no server reachable: inject */ }
  if (!real) {
    await ctx.addInitScript((units) => {
      window.STUDY_SUBJECTS = window.STUDY_SUBJECTS || [];
      if (window.STUDY_SUBJECTS.some((s) => s && s.id === 'alg1')) return;
      window.STUDY_SUBJECTS.push({
        id: 'alg1', name: 'Algebra 1', emoji: '📈', color: '#7c5cff',
        blurb: 'Test stand-in for the Algebra 1 course.',
        sets: units.map((title, i) => ({
          id: `alg1-u${i + 1}`, unit: i + 1, title, summary: `Unit ${i + 1} stand-in.`, topics: ['t'],
          terms: Array.from({ length: 8 }, (_, k) => ({ term: `Term ${i + 1}.${k + 1}`, definition: `Definition ${i + 1}.${k + 1}`, topic: 't' })),
          questions: [],
        })),
      });
    }, UNITS);
  }
  return { injected: !real };
}

const NOISE = [/favicon/i, /fonts\.googleapis|fonts\.gstatic/i, /ERR_CERT/i, /AudioContext/i, /net::ERR_/i];

export default async function algebraChecks({ page, check, fail, STUDY }) {
  const browser = page.context().browser();
  await check('algebra lab', async () => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
    try {
      await prepareContext(ctx, STUDY);
      const p = await ctx.newPage();
      p.on('console', (m) => { if (m.type() === 'error' && !NOISE.some((re) => re.test(m.text()))) fail(`console: ${m.text()}`); });
      p.on('pageerror', (e) => fail(`pageerror: ${e.message}`));
      const go = async (hash) => { await p.goto(`${STUDY}#${hash}`, { waitUntil: 'load' }); await p.waitForTimeout(250); };

      await go('/set/alg1-u2');
      if (!(await p.locator('a.card.mode[href$="/algebra"]').count())) return fail('no Algebra Lab card on the alg1-u2 set page');
      await go('/set/alg1-u2/algebra');
      const h1 = await p.locator('h1').first().textContent();
      if (!/Algebra Lab/.test(h1 || '')) return fail(`Algebra Lab did not open (h1: ${JSON.stringify(h1)})`);
      const on = await p.locator('.alg-chip[aria-pressed="true"]').count();
      if (on < 5) fail(`expected the unit's skills to be picked by default, ${on} on`);

      /** Answer whatever is on screen correctly, from CQAlgebra.current. */
      const answerRight = async () => {
        const cur = await p.evaluate(() => { const q = window.CQAlgebra && window.CQAlgebra.current; return q && { type: q.type, answer: q.answer, skill: q.skill }; });
        if (!cur) { fail('CQAlgebra.current is empty on the Algebra Lab screen'); return null; }
        if (!cur.skill || !/^(one-step|two-step|multi-step|dist-eq|both-sides|proportion|percent|literal|abs-eq)$/.test(cur.skill)) fail(`a unit 2 screen served skill "${cur.skill}"`);
        if (cur.type === 'written') {
          await p.fill('.q-card input.input', cur.answer);
          await p.press('.q-card input.input', 'Enter');
        } else {
          await p.locator(`.q-card .opt[data-v=${JSON.stringify(cur.answer)}]`).first().click();
        }
        await p.waitForTimeout(120);
        return cur;
      };

      for (let i = 1; i <= 3; i++) {
        const cur = await answerRight();
        if (!cur) return;
        if (!(await p.locator('.q-card .feedback.good').count())) fail(`problem ${i} (${cur.skill}: ${cur.answer}) was not marked correct`);
        const steps = await p.locator('.q-card .feedback .alg-steps li').count();
        if (!steps) fail(`problem ${i} showed no worked steps`);
        await p.keyboard.press('Enter');                       // "Next problem" has focus
        await p.waitForTimeout(150);
      }
      const hud = (await p.locator('.alg-hud').textContent()) || '';
      if (!/3 \/ 3/.test(hud)) fail(`tally should read 3 / 3 after three right answers, HUD: ${JSON.stringify(hud)}`);
      if (!/🔥 3/.test(hud)) fail(`streak should be 3, HUD: ${JSON.stringify(hud)}`);
      const mastered = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('chemquest:v1') || '{}').mastery || {}).filter((k) => k.startsWith('alg:')).length);
      if (!mastered) fail('unassisted right answers recorded no alg: mastery');

      // A hint (labelled "Hint", since new skills show a method rather than a first step) shows, and a hinted right answer earns nothing.
      const before = await p.evaluate(() => { const q = window.CQAlgebra.current; return { id: q.id, m: JSON.parse(localStorage.getItem('chemquest:v1') || '{}').mastery?.[q.id] ?? 0, first: q.hint && q.hint.why }; });
      await p.click('.alg-hint-btn');
      await p.waitForTimeout(100);
      const hint = ((await p.locator('.alg-hint').textContent()) || '').trim();
      if (!hint || !hint.includes(before.first)) fail(`the hint did not show the hint text (${JSON.stringify(hint.slice(0, 80))})`);
      if (!/^💡 Hint: /.test(hint)) fail(`the hint box is not labelled "💡 Hint:" (${JSON.stringify(hint.slice(0, 40))})`);
      if (/\bnull\b|undefined|NaN/.test(hint)) fail(`the hint shows junk: ${JSON.stringify(hint)}`);
      await answerRight();
      const after = await p.evaluate((id) => JSON.parse(localStorage.getItem('chemquest:v1') || '{}').mastery?.[id] ?? 0, before.id);
      if (after > before.m) fail('a hinted answer still earned mastery');
      if (!(await p.locator('.q-card .feedback .alg-steps li').count())) fail('no worked steps after the hinted problem');
      const visible = await p.locator('.q-card .feedback .alg-steps li').first().isVisible();
      if (!visible) fail('the worked steps are not visible');

      // A miss lands in Mistakes and comes back as a fresh problem of that skill.
      await p.click('.alg-actions .btn.primary');
      await p.waitForTimeout(120);
      const missed = await p.evaluate(() => window.CQAlgebra.current.id);
      if (await p.locator('.q-card input.input').count()) { await p.fill('.q-card input.input', 'zzz'); await p.press('.q-card input.input', 'Enter'); }
      else await p.locator(`.q-card .opt:not([data-v=${JSON.stringify(await p.evaluate(() => window.CQAlgebra.current.answer))}])`).first().click();
      await p.waitForTimeout(120);
      await go('/set/alg1-u2/mistakes');
      const label = await p.evaluate((id) => (window.CQAlgebra.skills.find((s) => `alg:${s.id}` === id) || {}).label, missed);
      const listed = (await p.locator('.mistake-row').allTextContents()).join(' | ');
      if (!listed.includes(label)) fail(`a missed Algebra Lab problem (${missed}) is not in Mistakes: ${listed.slice(0, 200)}`);
      else {
        await p.locator('.panel .btn.primary.lg').first().click();
        await p.waitForTimeout(200);
        if (!(await p.locator('.q-card .q-prompt').count())) fail('Mistakes could not rebuild an Algebra Lab problem');
      }

      // The games draw generated multiple-choice problems for Algebra sets.
      // Checked on the pool itself: a short race samples only a few of its
      // ~60 questions, so looking for one on screen failed about a quarter
      // of the time.
      const pool = await p.evaluate(() => {
        const qs = window.CQ.gameQuestions(window.CQ.getSet('alg1-u8'));
        const alg = qs.filter((q) => /^alg:/.test(q.id));
        return { total: qs.length, alg: alg.length, bad: alg.filter((q) => q.type !== 'mc' || (q.options || []).length !== 4 || new Set(q.options).size !== 4 || !q.options.includes(q.answer)).length, prompts: alg.slice(0, 3).map((q) => String(q.prompt)) };
      });
      if (pool.alg < 10) fail(`a unit 8 game pool holds only ${pool.alg} Algebra Lab problems (of ${pool.total})`);
      if (pool.bad) fail(`${pool.bad} Algebra Lab game questions are malformed`);
      const chemPool = await p.evaluate(() => window.CQ.gameQuestions(window.CQ.getSet('c1')).filter((q) => /^alg:/.test(q.id)).length);
      if (chemPool) fail(`a chemistry game pool holds ${chemPool} Algebra Lab problems`);
      // …and a unit 8 race starts with them in its pool.
      await go('/set/alg1-u8/race');
      await p.locator('text=Start race').click();
      await p.waitForTimeout(250);
      const shown = ((await p.locator('.q-card .q-prompt').first().textContent().catch(() => '')) || '').trim();
      if (!shown) fail('the unit 8 race showed no question');

      // Graph reading on unit 5: switch the chips to the three graph skills only.
      await go('/set/alg1-u5/algebra');
      const chips = p.locator('.alg-unit').first().locator('.alg-chip');
      for (let i = 0; i < await chips.count(); i++) {
        const c = chips.nth(i);
        const name = ((await c.locator('.alg-chip-name').textContent()) || '').trim();
        const on = (await c.getAttribute('aria-pressed')) === 'true';
        if (GRAPH_U5.includes(name) && !on) await c.click();
      }
      for (let i = 0; i < await chips.count(); i++) {
        const c = chips.nth(i);
        const name = ((await c.locator('.alg-chip-name').textContent()) || '').trim();
        if (!GRAPH_U5.includes(name) && (await c.getAttribute('aria-pressed')) === 'true') await c.click();
      }
      await p.waitForTimeout(150);
      if ((await p.locator('.alg-chip[aria-pressed="true"]').count()) !== 3) fail('could not narrow alg1-u5 to its three graph skills');
      /** Answers the problem on screen correctly; it must come from one of `ids` (and carry a grid when `graph`). */
      const answerOn = async (label, ids, graph) => {
        const cur = await p.evaluate(() => { const q = window.CQAlgebra && window.CQAlgebra.current; return q && { type: q.type, answer: q.answer, skill: q.skill }; });
        if (!cur) return fail(`${label}: no problem on screen`);
        if (!ids.includes(cur.skill)) fail(`${label}: served skill "${cur.skill}"`);
        if (graph) {
          const fig = p.locator('.q-card .q-figure');
          if (!(await fig.locator('svg.alg-grid').count())) fail(`${label}: ${cur.skill} shows no coordinate grid`);
          const alt = (await fig.getAttribute('aria-label')) || '';
          if (alt.length < 20 || (!/^[−-]?[\d/.]+$/.test(cur.answer) && alt.includes(cur.answer))) fail(`${label}: the grid's alt text is missing or gives the answer (${JSON.stringify(alt)})`);
        }
        if (cur.type === 'written') { await p.fill('.q-card input.input', cur.answer); await p.press('.q-card input.input', 'Enter'); }
        else await p.locator(`.q-card .opt[data-v=${JSON.stringify(cur.answer)}]`).first().click();
        await p.waitForTimeout(120);
        if (!(await p.locator('.q-card .feedback.good').count())) fail(`${label}: the right answer "${cur.answer}" (${cur.skill}) was not marked correct`);
        if (!(await p.locator('.q-card .feedback .alg-steps li').count())) fail(`${label}: no worked steps after ${cur.skill}`);
        await p.locator('.alg-actions .btn.primary').click();
        await p.waitForTimeout(150);
      };
      const U5 = ['graph-slope', 'graph-y-int', 'graph-line-eq'];
      for (let i = 1; i <= 2; i++) await answerOn(`alg1-u5 graph problem ${i}`, U5, true);
      const U13 = await p.evaluate(() => window.CQAlgebra.skills.filter((s) => s.setId === 'alg1-u13').map((s) => s.id));
      if (U13.length < 6) fail(`unit 13 has only ${U13.length} Algebra Lab skills`);
      for (const id of ['alg1-u13', 'alg1-u14']) {
        await go(`/set/${id}`);
        if (!(await p.locator('a.card.mode[href$="/algebra"]').count())) fail(`Algebra Lab is not offered on ${id}`);
      }
      await go('/set/alg1-u13/algebra');
      for (let i = 1; i <= 2; i++) await answerOn(`alg1-u13 problem ${i}`, U13, false);

      // Every unit, the combined set, and a phone.
      for (const id of ['alg1-u9', 'alg1-u5', 'alg1-u14', 'alg1-all']) {
        await go(`/set/${id}/algebra`);
        if (!(await p.locator('.q-card').count())) fail(`no problem rendered on ${id}`);
      }
      await p.setViewportSize({ width: 390, height: 844 });
      for (const id of ['alg1-u2', 'alg1-u3', 'alg1-u11', 'alg1-u4', 'alg1-u13']) {
        await go(`/set/${id}/algebra`);
        const over = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        if (over) fail(`horizontal scroll at 390px on ${id}`);
      }
      // Not offered where it makes no sense.
      await go('/set/c1');
      if (await p.locator('a.card.mode[href$="/algebra"]').count()) fail('Algebra Lab is offered on a chemistry set');
    } finally {
      await ctx.close();
    }
  });
}
