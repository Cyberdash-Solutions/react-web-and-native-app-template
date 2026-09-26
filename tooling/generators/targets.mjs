import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '../..');

/**
 * Everything that belongs to one deployment target. Shared packages are never listed: they are
 * target-agnostic and always stay (1.8). Platform-only code (1.11: push on mobile, the PWA on
 * web) lives inside its app, so it leaves with the app folder.
 */
export const TARGETS = {
  mobile: {
    paths: ['apps/mobile', '.github/workflows/mobile.yml'],
    codeowners: ['/apps/mobile/'],
  },
  web: {
    paths: ['apps/web', '.github/workflows/web.yml'],
    codeowners: ['/apps/web/'],
  },
};

export const TARGET_NAMES = Object.keys(TARGETS);

export const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
export const presentTargets = () => TARGET_NAMES.filter((t) => exists(`apps/${t}`));

export function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, {
    cwd: ROOT,
    stdio: opts.capture ? 'pipe' : 'inherit',
    encoding: 'utf8',
    ...opts,
  });
}

export function removeTarget(target, { dryRun = false } = {}) {
  const spec = TARGETS[target];
  for (const rel of spec.paths) {
    if (!exists(rel)) continue;
    console.log(`  - ${rel}`);
    if (!dryRun) fs.rmSync(path.join(ROOT, rel), { recursive: true, force: true });
  }
  if (!dryRun)
    editCodeowners((lines) => lines.filter((l) => !spec.codeowners.some((p) => l.startsWith(p))));
}

/** Restores a target's files from git history (or from the upstream template repo). */
export function restoreTarget(target) {
  const spec = TARGETS[target];
  const marker = `apps/${target}/package.json`;
  let restored = false;
  const hasPath = (ref, p) => {
    try {
      run('git', ['cat-file', '-e', `${ref}:${p}`], { capture: true });
      return true;
    } catch {
      return false;
    }
  };
  try {
    // The last commit that touched the app's package.json is usually the one that deleted it.
    const sha = run('git', ['log', '-1', '--format=%H', '--', marker], { capture: true }).trim();
    if (sha) {
      const source = hasPath(sha, marker) ? sha : `${sha}^`;
      const paths = spec.paths.filter((p) => hasPath(source, p));
      run('git', ['checkout', source, '--', ...paths]);
      console.log(`  + restored ${paths.join(', ')} from ${source.slice(0, 10)}`);
      restored = true;
    }
  } catch {
    restored = false;
  }
  if (!restored) restoreFromTemplateRepo(spec);
  editCodeowners((lines) => [
    ...lines,
    ...spec.codeowners
      .filter((p) => !lines.some((l) => l.startsWith(p)))
      .map((p) => `${p} @your-org/${target}-team`),
  ]);
}

function restoreFromTemplateRepo(spec) {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const repo = process.env.TEMPLATE_REPO ?? pkg.template?.repository;
  if (!repo)
    throw new Error(
      'No git history for this target and no TEMPLATE_REPO / package.json "template.repository" to fetch it from.',
    );
  const tmp = fs.mkdtempSync(path.join(ROOT, 'node_modules/.gen-'));
  try {
    console.log(`  … fetching from ${repo}`);
    execFileSync('git', ['clone', '--depth', '1', '--filter=blob:none', '--sparse', repo, tmp], {
      stdio: 'inherit',
    });
    execFileSync('git', ['sparse-checkout', 'set', '--no-cone', ...spec.paths], {
      cwd: tmp,
      stdio: 'inherit',
    });
    for (const rel of spec.paths) {
      if (!fs.existsSync(path.join(tmp, rel))) continue;
      fs.cpSync(path.join(tmp, rel), path.join(ROOT, rel), { recursive: true });
      console.log(`  + ${rel}`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function editCodeowners(fn) {
  const file = path.join(ROOT, '.github/CODEOWNERS');
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, 'utf8').replace(/\n$/, '').split('\n');
  fs.writeFileSync(file, fn(lines).join('\n') + '\n');
}

/** Re-derives everything that depends on which apps exist (1.10). */
export function syncWorkspace({ install = true } = {}) {
  if (install) run('pnpm', ['install', '--no-frozen-lockfile']);
  run('node', ['tooling/scripts/sync-ts-references.mjs']);
  console.log(`\nTargets now present: ${presentTargets().join(', ') || '(none)'}`);
}
