#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECTS_PATH = join(ROOT, 'src/data/projects.json');
const OUT_DIR = join(ROOT, 'public/images/projects');
const OWNER = 'UmuT5513';
const PLACEHOLDER = '/images/projects/placeholder.png';

const gh = (args) => execSync(`gh api ${args}`, { encoding: 'utf8', maxBuffer: 20_000_000 });

const BAD_IMAGE = /shields\.io|img\.shields|badge|logo|visitor|komarev|badges\//i;

function readmeMarkdown(repo) {
  try {
    const b64 = gh(`repos/${OWNER}/${encodeURIComponent(repo)}/readme --jq .content`).trim();
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch {
    return '';
  }
}

function defaultBranch(repo) {
  return gh(`repos/${OWNER}/${encodeURIComponent(repo)} --jq .default_branch`).trim();
}

function imageCandidates(md) {
  const out = [];
  const patterns = [/!\[[^\]]*\]\(([^)\s]+)/g, /<img[^>]+src="([^"]+)"/g];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(md)) !== null) {
      const url = m[1];
      if (url && !BAD_IMAGE.test(url)) out.push(url);
    }
  }
  return out;
}

function extFromUrl(url) {
  const clean = url.split('?')[0].split('#')[0];
  const m = /\.(png|jpe?g|gif|webp|svg|avif)$/i.exec(clean);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : null;
}

function extFromType(ct) {
  if (!ct) return null;
  if (ct.includes('png')) return 'png';
  if (ct.includes('jpeg')) return 'jpg';
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('gif')) return 'gif';
  if (ct.includes('svg')) return 'svg';
  if (ct.includes('avif')) return 'avif';
  return null;
}

const encodePath = (path) => path.split('/').map((seg) => encodeURIComponent(seg)).join('/');

async function download(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(url, { redirect: 'follow', signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return { buf, ext: extFromType(res.headers.get('content-type')) };
  } finally {
    clearTimeout(timer);
  }
}

function downloadPrivate(repo, relPath) {
  const b64 = gh(`repos/${OWNER}/${encodeURIComponent(repo)}/contents/${encodePath(relPath)} --jq .content`)
    .trim().replace(/\s/g, '');
  return Buffer.from(b64, 'base64');
}

async function main() {
  const data = JSON.parse(readFileSync(PROJECTS_PATH, 'utf8'));
  const FORCE = process.argv.includes('--force');
  mkdirSync(OUT_DIR, { recursive: true });
  let changed = 0;

  for (const p of data.projects) {
    if (!FORCE && p.image !== PLACEHOLDER) continue;
    const repo = p.repo;
    if (!repo) {
      console.log(`SKIP ${p.id}: no repo`);
      continue;
    }

    let saved = null;
    const candidates = imageCandidates(readmeMarkdown(repo));
    if (candidates.length > 0) {
      const url = candidates[0];
      try {
        if (/^https?:/i.test(url)) {
          const { buf, ext } = await download(url);
          const finalExt = ext || extFromUrl(url) || 'png';
          writeFileSync(join(OUT_DIR, `${p.id}.${finalExt}`), buf);
          saved = p.image = `/images/projects/${p.id}.${finalExt}`;
        } else {
          const ext = extFromUrl(url) || 'png';
          if (p.private) {
            writeFileSync(join(OUT_DIR, `${p.id}.${ext}`), downloadPrivate(repo, url));
            saved = p.image = `/images/projects/${p.id}.${ext}`;
          } else {
            const branch = defaultBranch(repo);
            const rawUrl = `https://raw.githubusercontent.com/${OWNER}/${repo}/${branch}/${encodePath(url)}`;
            const { buf } = await download(rawUrl);
            writeFileSync(join(OUT_DIR, `${p.id}.${ext}`), buf);
            saved = p.image = `/images/projects/${p.id}.${ext}`;
          }
        }
      } catch (err) {
        console.log(`FAIL readme ${p.id}: ${err.message}`);
      }
    }

    if (!saved && !p.private) {
      try {
        const ogUrl = `https://opengraph.githubassets.com/1/${OWNER}/${repo}`;
        const { buf } = await download(ogUrl);
        writeFileSync(join(OUT_DIR, `${p.id}.png`), buf);
        saved = p.image = `/images/projects/${p.id}.png`;
      } catch (err) {
        console.log(`FAIL og ${p.id}: ${err.message}`);
      }
    }

    if (saved) {
      console.log(`OK ${p.id}: ${saved}`);
      changed++;
    } else {
      console.log(`KEEP placeholder ${p.id}`);
    }
  }

  if (changed > 0) {
    writeFileSync(PROJECTS_PATH, JSON.stringify(data, null, 2) + '\n');
  }
  console.log(`Done. Updated ${changed} project(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});