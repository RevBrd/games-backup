// ============================================================================
// FETCH_ART — download the real printed card faces for a set.
//
// These are DERIVED ASSETS, not source. They live in assets/cards/<set>/ and
// are gitignored; the repo stays small and anyone can regenerate them from the
// URLs already sitting in data/raw/*.json.
//
//   node tools/fetch_art.js base1            small only (~160 KB/card)
//   node tools/fetch_art.js base1 --hires    also the large face (~900 KB/card)
//   node tools/fetch_art.js base1,base2      several sets
//
// Already-downloaded files are skipped, so re-running is cheap and it resumes
// cleanly after a failure. Relative paths are what make this work from file://
// with no server.
// ============================================================================

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'cards');

const args = process.argv.slice(2);
const hires = args.includes('--hires');
const sets = (args.find(a => !a.startsWith('--')) || 'base1').split(',');

// One connection at a time is polite and fast enough — 102 cards takes under a
// minute. Nothing here is worth hammering a free CDN over.
function get(url, dest) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, res => {
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const tmp = dest + '.part';
      const f = fs.createWriteStream(tmp);
      res.pipe(f);
      f.on('finish', () => f.close(() => { fs.renameSync(tmp, dest); resolve(); }));
      f.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('timeout: ' + url)));
  });
}

(async () => {
  let got = 0, skipped = 0, failed = 0, bytes = 0;

  for (const set of sets) {
    const raw = path.join(ROOT, 'data', 'raw', set + '.json');
    if (!fs.existsSync(raw)) { console.error(`no data/raw/${set}.json — skipping`); continue; }
    const cards = JSON.parse(fs.readFileSync(raw, 'utf8'));
    const dir = path.join(OUT, set);
    fs.mkdirSync(dir, { recursive: true });

    console.log(`${set}: ${cards.length} cards -> assets/cards/${set}/`);
    for (const c of cards) {
      if (!c.images) continue;
      const jobs = [[c.images.small, `${c.number}.png`]];
      if (hires && c.images.large) jobs.push([c.images.large, `${c.number}_hires.png`]);
      for (const [url, name] of jobs) {
        const dest = path.join(dir, name);
        if (fs.existsSync(dest)) { skipped++; continue; }
        try {
          await get(url, dest);
          bytes += fs.statSync(dest).size;
          got++;
          if (got % 20 === 0) process.stdout.write(`  ${got} fetched…\n`);
        } catch (e) {
          failed++;
          console.error(`  FAILED ${name}: ${e.message}`);
        }
      }
    }
  }

  console.log(`\n${got} fetched (${(bytes / 1048576).toFixed(1)} MB), ${skipped} already present, ${failed} failed`);
  if (failed) process.exitCode = 1;
})();
