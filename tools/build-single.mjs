/**
 * Bundles the whole site into one self-contained HTML file.
 *
 *   node tools/build-single.mjs [outfile]
 *
 * The multi-file version under assets/ stays the source of truth; this just
 * inlines the CSS and every script in the order index.html loads them, so the
 * result runs from a single file — handy for sharing a link, emailing it, or
 * dropping it on a USB stick. Nothing is minified: the output stays readable.
 *
 * Pass --fragment to emit only the page content (title, style, markup,
 * scripts) with no <!doctype>/<html>/<head>/<body> wrapper, for hosts that
 * supply their own document skeleton, and --title="..." to override the page
 * title (such a host usually wants a bare product name, not a page headline).
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const fragment = args.includes('--fragment');
const titleArg = (args.find((a) => a.startsWith('--title=')) || '').slice(8);
const out = resolve(ROOT, args.find((a) => !a.startsWith('--')) || 'dist/miloplay.html');

const read = (p) => readFile(resolve(ROOT, p), 'utf8');

// A "</script>" inside a JS string would close the tag it is embedded in.
const safe = (js) => js.replace(/<\/script/gi, '<\\/script');

// Inserted code contains "$" characters (e.g. a literal '$' in a game), and a
// string replacement would read "$'" / "$&" / "$1" as substitution patterns.
// A replacer function inserts the text verbatim.
const literal = (s) => () => s;

let html = await read('index.html');

// --- inline the stylesheet -------------------------------------------------
const css = await read('assets/css/style.css');
html = html.replace(
  /<link rel="stylesheet" href="assets\/css\/style\.css">/,
  literal(`<style>\n${css}\n</style>`)
);

// --- inline every local script, in load order ------------------------------
const scriptRe = /<script src="([^"]+)"><\/script>/g;
const sources = [...html.matchAll(scriptRe)].map((m) => m[1]);
for (const src of sources) {
  const js = await read(src);
  html = html.replace(
    `<script src="${src}"></script>`,
    literal(`<script>\n/* ---- ${src} ---- */\n${safe(js)}\n</script>`)
  );
}

// --- drop the things a single file cannot use ------------------------------
html = html
  .replace(/<link rel="manifest"[^>]*>\s*/, '')
  // The service worker needs its own file; a bundle has nothing to register.
  .replace(/\s*<script>\s*if \('serviceWorker' in navigator[\s\S]*?<\/script>/, '');

if (fragment) {
  const title = titleArg || (html.match(/<title>([\s\S]*?)<\/title>/) || [, 'MiloPlay'])[1];
  const body = (html.match(/<body>([\s\S]*)<\/body>/) || [, html])[1];
  const style = (html.match(/<style>[\s\S]*?<\/style>/) || [''])[0];
  const fonts = (html.match(/<link rel="stylesheet" href="https:\/\/fonts[^>]*>/) || [''])[0];
  html = `<title>${title}</title>\n${fonts}\n${style}\n${body.trim()}\n`;

}

await mkdir(dirname(out), { recursive: true });
await writeFile(out, html);

const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`Bundled ${sources.length} scripts + 1 stylesheet -> ${out} (${kb} KB)`);
