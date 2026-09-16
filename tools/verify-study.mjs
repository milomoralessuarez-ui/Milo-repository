/**
 * Checks every ChemQuest study question is actually answerable.
 *
 *   node tools/verify-study.mjs
 *
 * The questions in study/data.js are extracted from the class notes rather
 * than hand-written, so this is what stands between an extraction change and
 * shipping a question a student cannot answer: a multiple choice item whose
 * right answer is missing from its options, two options that say the same
 * thing, a true/false item with a third answer, a typed-answer item whose
 * answer is a paragraph, a prompt that gives the answer away, or a set too
 * small for a mode to run. Exits non-zero on any problem, for use in CI.
 */
import fs from 'fs';

globalThis.window = {};
eval(fs.readFileSync('study/data.js', 'utf8'));
const SETS = globalThis.window.STUDY_SETS;

const problems = [];
const warnings = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
/** Match the app's own written-answer normalisation closely enough to spot leaks. */
const loose = (s) => norm(s).replace(/[×·*]/g, 'x').replace(/[°º]/g, '').replace(/(\d),(?=\d{3})/g, '$1').replace(/[.!?;:]+$/, '');

if (!Array.isArray(SETS) || !SETS.length) {
  console.log('FAIL: study/data.js defines no sets');
  process.exit(1);
}

// Modes need a working floor: Match deals six pairs, multiple choice needs
// four distinct options, so a set below these cannot be played at all.
const MIN_TERMS_FOR_MATCH = 6;
const MIN_TERMS_FOR_MC = 4;

let totalTerms = 0;
let totalQuestions = 0;
const byType = { mc: 0, tf: 0, written: 0 };

for (const set of SETS) {
  const sid = `Concept ${set.concept}`;
  for (const field of ['concept', 'title', 'summary', 'topics', 'terms', 'questions']) {
    if (set[field] == null) fail(sid, `missing "${field}"`);
  }
  const terms = set.terms || [];
  const questions = set.questions || [];
  totalTerms += terms.length;
  totalQuestions += questions.length;

  if (terms.length < MIN_TERMS_FOR_MATCH) fail(sid, `only ${terms.length} terms — Match needs ${MIN_TERMS_FOR_MATCH}`);
  if (terms.length < MIN_TERMS_FOR_MC) fail(sid, `only ${terms.length} terms — generated multiple choice needs ${MIN_TERMS_FOR_MC}`);

  // Match pairs a term against its definition, so a definition shared by two
  // terms makes a round unwinnable — the app dedupes, but the data should not
  // rely on that.
  const termNames = new Map();
  const defs = new Map();
  for (const t of terms) {
    const where = `${sid} term "${t.term}"`;
    if (!t.term || !t.definition) fail(where, 'term or definition is empty');
    if (!Number.isInteger(t.page)) fail(where, `page is ${JSON.stringify(t.page)}, expected a slide number`);
    if (!t.topic) fail(where, 'missing topic');
    if (termNames.has(norm(t.term))) fail(where, 'duplicate term');
    termNames.set(norm(t.term), t);
    if (defs.has(norm(t.definition))) fail(where, `shares its definition with "${defs.get(norm(t.definition)).term}"`);
    defs.set(norm(t.definition), t);
    if (t.definition.length > 160) warn(where, `definition is ${t.definition.length} characters — long for a flashcard`);
    if (set.topics && !set.topics.includes(t.topic)) warn(where, `topic "${t.topic}" is not in the set's topic list`);
  }

  const ids = new Set();
  const prompts = new Map();
  for (const q of questions) {
    const where = `${sid} ${q.id || '(no id)'}`;
    if (!q.id) fail(where, 'missing id');
    if (ids.has(q.id)) fail(where, 'duplicate id');
    ids.add(q.id);
    if (!q.prompt) fail(where, 'empty prompt');
    if (!q.answer) fail(where, 'empty answer');
    if (!q.explanation) fail(where, 'no explanation — every answer screen shows one');
    if (!Number.isInteger(q.page)) fail(where, `page is ${JSON.stringify(q.page)}, expected a slide number`);
    if (!['easy', 'medium', 'hard'].includes(q.difficulty)) warn(where, `difficulty is ${JSON.stringify(q.difficulty)}`);
    if (prompts.has(norm(q.prompt))) fail(where, `duplicate prompt of ${prompts.get(norm(q.prompt))}`);
    prompts.set(norm(q.prompt), q.id);

    byType[q.type] = (byType[q.type] || 0) + 1;

    if (q.type === 'mc') {
      const o = q.options;
      if (!Array.isArray(o) || o.length !== 4) fail(where, `has ${Array.isArray(o) ? o.length : 0} options, expected 4`);
      else {
        if (new Set(o.map(norm)).size !== 4) fail(where, 'two options say the same thing');
        if (!o.includes(q.answer)) fail(where, `answer ${JSON.stringify(q.answer)} is not one of its options`);
        // An option that contains the answer (or vice versa) reads as a second
        // correct choice to a student — except between two numbers, where one
        // digit string is often a substring of another ("1,000" inside
        // "1,000,000") while the values are plainly different.
        const asNumber = (v) => {
          const m = loose(v).match(/^-?\d*\.?\d+$/);
          return m ? Number(m[0]) : null;
        };
        for (const x of o) {
          if (x === q.answer) continue;
          const a = loose(q.answer), b = loose(x);
          const na = asNumber(q.answer), nb = asNumber(x);
          if (na !== null && nb !== null) continue;
          if (a.length > 2 && b.length > 2 && (a.includes(b) || b.includes(a))) warn(where, `option ${JSON.stringify(x)} overlaps the answer`);
        }
        if (o.some((x) => /^(all|none) of the above/i.test(x))) fail(where, 'uses "all/none of the above"');
      }
    } else if (q.type === 'tf') {
      if (!['True', 'False'].includes(q.answer)) fail(where, `true/false answer is ${JSON.stringify(q.answer)}`);
    } else if (q.type === 'written') {
      if (!Array.isArray(q.accept)) fail(where, 'written question has no "accept" list (it may be empty, but it must exist)');
      if (q.answer.split(/\s+/).length > 6) warn(where, `typed answer is ${q.answer.split(/\s+/).length} words — hard to type exactly`);
      if ((q.accept || []).some((a) => norm(a) === norm(q.answer))) warn(where, 'accept list repeats the canonical answer');
    } else {
      fail(where, `unknown type ${JSON.stringify(q.type)}`);
    }

    // A prompt containing its own answer is free marks when the student has to
    // produce it. In multiple choice it is not necessarily a fault: "what is
    // the independent variable?" quotes the scenario back by design, and the
    // distractors are quoted from it too, so knowing which part to pick is
    // still the skill being tested. Fail the first, flag the second.
    if (q.answer.length > 3 && loose(q.prompt).includes(loose(q.answer))) {
      if (q.type === 'written') fail(where, `prompt gives away the answer (${JSON.stringify(q.answer)})`);
      else if (q.type === 'mc') {
        const others = (q.options || []).filter((x) => x !== q.answer);
        const alsoQuoted = others.filter((x) => loose(q.prompt).includes(loose(x))).length;
        if (alsoQuoted === 0) fail(where, `prompt quotes the answer and none of the distractors — free marks`);
        else warn(where, 'answer appears in the prompt (fine if picking the right part is the skill)');
      }
    }
  }

  // Learn and Test let a student turn types off, so each set needs enough of
  // each to still be worth a round on its own.
  const counts = questions.reduce((m, q) => ({ ...m, [q.type]: (m[q.type] || 0) + 1 }), {});
  for (const [type, min] of [['mc', 10], ['tf', 5], ['written', 5]]) {
    if ((counts[type] || 0) < min) warn(sid, `only ${counts[type] || 0} ${type} questions (want ${min}+, a student can study that type alone)`);
  }
}

// The app's own answer checker has to accept every variant the data promises,
// and reject a value that is right but carries the wrong unit. Lift the three
// functions out of app.js rather than re-implementing them here, so this
// notices when the two drift apart.
{
  const src = fs.readFileSync('study/app.js', 'utf8');
  const grab = (name) => {
    const i = src.indexOf(`function ${name}(`);
    if (i < 0) return '';
    let depth = 0;
    for (let k = src.indexOf('{', i); k < src.length; k++) {
      if (src[k] === '{') depth++;
      else if (src[k] === '}' && --depth === 0) return src.slice(i, k + 1);
    }
    return '';
  };
  const code = ['norm', 'parseNum', 'checkWritten'].map(grab).join('\n');
  if (!code.includes('function checkWritten')) {
    warn('answer checking', 'could not lift checkWritten() out of study/app.js — skipped');
  } else {
    const checkWritten = new Function(`${code}; return checkWritten;`)();
    for (const set of SETS) {
      for (const q of (set.questions || []).filter((x) => x.type === 'written')) {
        const where = `Concept ${set.concept} ${q.id}`;
        for (const variant of [q.answer, ...(q.accept || [])]) {
          if (!checkWritten(q, variant)) fail(where, `the app rejects its own accepted answer ${JSON.stringify(variant)}`);
        }
        // A numeric answer with a unit must not accept a different unit.
        const m = /^\s*(-?[\d.,]+)\s*([A-Za-z°µ/]+)\s*$/.exec(q.answer);
        if (m) {
          const wrong = /k$|kelvin/i.test(m[2]) ? '°F' : 'furlongs';
          if (checkWritten(q, `${m[1]} ${wrong}`)) fail(where, `accepts ${JSON.stringify(`${m[1]} ${wrong}`)} for an answer measured in ${m[2]}`);
        }
      }
    }
  }
}

for (const w of warnings) console.log(`warn  ${w}`);
for (const p of problems) console.log(`FAIL  ${p}`);

const summary = `${SETS.length} sets, ${totalTerms} terms, ${totalQuestions} questions `
  + `(${byType.mc} multiple choice, ${byType.tf} true/false, ${byType.written} written)`;

if (problems.length) {
  console.log(`\n${problems.length} problem(s), ${warnings.length} warning(s) across ${summary}`);
  process.exit(1);
}
console.log(`\nOK: ${summary}${warnings.length ? ` — ${warnings.length} warning(s)` : ''}`);
