#!/usr/bin/env node
// scripts/adopt.mjs — the warm adoption path.
//
// playbooks/new-project.md and prompts/adopt.md assume a cold
// start: an agent reads the kit, infers the stack, hosting, and
// project identity from a spec, and only then copies templates.
// When the adopter arrives with those decisions already made — a
// build-plan payload from The Estate, or any repo carrying
// spec.md + plan/ + a manifest — the inference is waste. This
// script is the deterministic remainder: copy the kit around
// what is already there, sweep the placeholders the manifest
// resolves, and report what it could not decide.
//
//   node scripts/adopt.mjs [adopt] [options]
//   npx --yes github:no-trbl-2-u/idea-Nexus#<tag> adopt [options]
//
//   --target <dir>       repo root to adopt into (default: cwd)
//   --manifest <file>    placeholder manifest (default: nexus.adopt.json in target)
//   --with-cloud-loop    also overlay templates/.github (the GitHub Actions loop)
//   --with-data          also overlay templates/data (gh-as-db / hybrid)
//   --dry-run            print the plan; write nothing
//   --commit             commit the overlay as "chore: adopt nexus methodology"
//
// Three rules, and they are the whole point:
//   1. Never overwrite. A file that already exists in the target
//      is the adopter's — a payload's spec.md, plan/bearings.md,
//      plan/steps/01_build_plan.md — and is reported as "kept".
//   2. Sweep only what this run copied. Existing files are not
//      searched for placeholders; they were never templates.
//   3. Never guess. An unresolved placeholder stays in the file
//      and lands as a [needs-user-call] row in plan/AUDIT.md.
//
// The manifest (nexus.adopt.json) keys placeholders by the literal
// token so the file is its own documentation:
//
//   { "placeholders": { "<PROJECT>": "starvu", "<HOSTING_URL>": "" },
//     "cloudLoop": false, "data": false }
//
// Missing keys and empty strings are both "unresolved". Flags on
// the command line win over the manifest's booleans.

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'))

// The eight tokens the playbook's sweep targets. Other families
// (<N>, <DOMAIN_SPECIALIST>, <SERVICE>, ...) are per-file fill-ins
// that the loop itself resolves phase by phase; they are not
// project identity and are not this script's business.
const SWEPT_TOKENS = [
  '<PROJECT>', '<PROJECT_LOWER>', '<PROJECT_TAGLINE>', '<HOSTING_URL>',
  '<HOSTING_PROVIDER>', '<REPO_SLUG>', '<DEFAULT_BRANCH>', '<PROJECT_PKG_PREFIX>',
]

// The copy map. Same pairs as playbooks/new-project.md "### Copy",
// plus the three the playbook copies in later steps (bearings, the
// build plan, the bootstrap manifest). Opt-in dirs are gated below.
// templates/workspace is never copied: it targets the workspace
// root, not a repo (playbooks/workspace.md).
const COPY_MAP = [
  ['templates/skills', 'skills'],
  ['templates/claude', '.claude'],
  ['templates/claude/CLAUDE.md', 'CLAUDE.md'],
  ['templates/scripts', 'scripts'],
  ['templates/agents.md', 'agents.md'],
  ['templates/env/env.example', '.env.example'],
  ['templates/plan/AUDIT.md', 'plan/AUDIT.md'],
  ['templates/plan/CRITIQUE.md', 'plan/CRITIQUE.md'],
  ['templates/plan/PHASE_CANDIDATES.md', 'plan/PHASE_CANDIDATES.md'],
  ['templates/plan/README.md', 'plan/README.md'],
  ['templates/plan/bearings.md', 'plan/bearings.md'],
  ['templates/plan/steps/01_build_plan.md', 'plan/steps/01_build_plan.md'],
  ['templates/plan/phases', 'plan/phases'],
  ['templates/setup/bootstrap.example.json', 'setup/bootstrap.example.json'],
]
const CLOUD_LOOP_MAP = [['templates/.github', '.github']]
const DATA_MAP = [['templates/data', 'data']]

const GITIGNORE_LINES = ['.env', 'setup/bootstrap.local.json']

function usage(msg) {
  if (msg) console.error(`adopt: ${msg}`)
  console.error('usage: node scripts/adopt.mjs [--target <dir>] [--manifest <file>] [--with-cloud-loop] [--with-data] [--dry-run] [--commit]')
  process.exit(1)
}

function parseArgs(argv) {
  const opts = { target: process.cwd(), manifest: null, cloudLoop: null, data: null, dryRun: false, commit: false }
  const args = [...argv]
  if (args[0] === 'adopt') args.shift() // the npx bin form: `idea-nexus adopt ...`
  while (args.length) {
    const a = args.shift()
    if (a === '--target') opts.target = path.resolve(args.shift() ?? usage('--target needs a dir'))
    else if (a === '--manifest') opts.manifest = path.resolve(args.shift() ?? usage('--manifest needs a file'))
    else if (a === '--with-cloud-loop') opts.cloudLoop = true
    else if (a === '--with-data') opts.data = true
    else if (a === '--dry-run') opts.dryRun = true
    else if (a === '--commit') opts.commit = true
    else if (a === '--help' || a === '-h') usage()
    else usage(`unknown argument ${a}`)
  }
  return opts
}

function walkFiles(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name)
    if (entry.isSymbolicLink()) continue
    if (entry.isDirectory()) out.push(...walkFiles(abs))
    else out.push(abs)
  }
  return out
}

// Expand a [src, dest] pair into per-file [srcAbs, destAbs] pairs so
// the never-overwrite rule applies file by file, not dir by dir — a
// target that already has plan/phases/phase_1_bootstrap.md still
// receives phase_canonical_sibling.md.
function expandPair([src, dest]) {
  const srcAbs = path.join(ROOT, src)
  if (!fs.existsSync(srcAbs)) return []
  if (fs.statSync(srcAbs).isFile()) return [[srcAbs, dest]]
  // Forward slashes throughout: the report and the AUDIT rows read the same on every OS.
  return walkFiles(srcAbs).map((f) => [f, path.join(dest, path.relative(srcAbs, f)).split(path.sep).join('/')])
}

function loadManifest(file) {
  if (!fs.existsSync(file)) return { placeholders: {}, cloudLoop: false, data: false, present: false }
  let raw
  try {
    raw = JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch (err) {
    usage(`${file} is not valid JSON — ${err.message}`)
  }
  const placeholders = raw.placeholders ?? {}
  for (const key of Object.keys(placeholders)) {
    if (!SWEPT_TOKENS.includes(key)) {
      console.error(`adopt: warning — manifest key ${key} is not one of the swept tokens; ignored`)
    }
  }
  return { placeholders, cloudLoop: !!raw.cloudLoop, data: !!raw.data, present: true, raw }
}

function sweep(text, placeholders) {
  const unresolved = new Set()
  let out = text
  // Longest token first so <PROJECT_LOWER> is never half-eaten by <PROJECT>.
  const tokens = [...SWEPT_TOKENS].sort((a, b) => b.length - a.length)
  for (const token of tokens) {
    if (!out.includes(token)) continue
    const value = placeholders[token]
    if (typeof value === 'string' && value.length) out = out.split(token).join(value)
    else unresolved.add(token)
  }
  return { text: out, unresolved }
}

function ensureGitignore(target, dryRun, log) {
  const file = path.join(target, '.gitignore')
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : ''
  const lines = new Set(existing.split(/\r?\n/).map((l) => l.trim()))
  const missing = GITIGNORE_LINES.filter((l) => !lines.has(l))
  if (!missing.length) return
  log(`gitignore  + ${missing.join(', ')}`)
  if (dryRun) return
  const sep = existing.length && !existing.endsWith('\n') ? '\n' : ''
  fs.writeFileSync(file, `${existing}${sep}${existing.length ? '\n' : ''}# nexus: never commit local secrets\n${missing.join('\n')}\n`)
}

// Every skills/<name>.md needs a .claude/commands/<name>.md pointer
// or Claude Code never sees the verb (concepts/skills-anatomy.md).
// Payload skills arrive without one; generate the terse pointer.
function ensureCommandPointers(target, dryRun, log) {
  const skillsDir = path.join(target, 'skills')
  const commandsDir = path.join(target, '.claude', 'commands')
  if (!fs.existsSync(skillsDir)) return []
  const made = []
  for (const f of fs.readdirSync(skillsDir).filter((x) => x.endsWith('.md'))) {
    const pointer = path.join(commandsDir, f)
    if (fs.existsSync(pointer)) continue
    const name = f.replace(/\.md$/, '')
    const text = fs.readFileSync(path.join(skillsDir, f), 'utf-8')
    const fm = text.match(/^---\r?\n[\s\S]*?description:\s*(.+?)\r?\n[\s\S]*?---/)
    const description = fm ? fm[1].trim().replace(/^"|"$/g, '') : `Run the ${name} skill.`
    const body = `---
description: ${description}
---

You are invoked under the \`${name}\` skill. Read \`skills/${name}.md\`
end to end before touching anything else; that file is the single
source of truth for this command.

Argument: $ARGUMENTS
`
    log(`pointer    .claude/commands/${f}`)
    made.push(`.claude/commands/${f}`)
    if (dryRun) continue
    fs.mkdirSync(commandsDir, { recursive: true })
    fs.writeFileSync(pointer, body)
  }
  return made
}

function appendAudit(target, rows, dryRun, log) {
  if (!rows.length) return
  const file = path.join(target, 'plan', 'AUDIT.md')
  const stamp = new Date().toISOString().slice(0, 10)
  const block = [
    '',
    `## Adoption (${stamp})`,
    '',
    '> Written by `scripts/adopt.mjs`. Each row is a placeholder the',
    '> manifest did not resolve. Fill it in the named files (or in',
    '> `nexus.adopt.json` and re-run adopt on a clean checkout), then',
    '> delete the row.',
    '',
    ...rows.map((r) => `- [needs-user-call] ${r}`),
    '',
  ].join('\n')
  log(`audit      ${rows.length} [needs-user-call] row(s) -> plan/AUDIT.md`)
  if (dryRun) return
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.appendFileSync(file, block)
}

function stampManifest(file, manifest, dryRun) {
  if (dryRun) return
  const raw = manifest.present ? manifest.raw : { placeholders: {} }
  raw.adopted = { kit: `${PKG.name}@${PKG.version}`, at: new Date().toISOString() }
  fs.writeFileSync(file, `${JSON.stringify(raw, null, 2)}\n`)
}

function main() {
  const opts = parseArgs(process.argv.slice(2))
  const target = opts.target
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) usage(`target ${target} is not a directory`)
  const manifestFile = opts.manifest ?? path.join(target, 'nexus.adopt.json')
  const manifest = loadManifest(manifestFile)
  const cloudLoop = opts.cloudLoop ?? manifest.cloudLoop
  const data = opts.data ?? manifest.data
  const log = (line) => console.log(`${opts.dryRun ? '[dry-run] ' : ''}${line}`)

  console.log(`adopt: ${PKG.name}@${PKG.version} -> ${target}`)
  console.log(`adopt: manifest ${manifest.present ? path.relative(target, manifestFile) || manifestFile : '(none — every swept token will be unresolved)'}`)

  const pairs = [...COPY_MAP, ...(cloudLoop ? CLOUD_LOOP_MAP : []), ...(data ? DATA_MAP : [])]
  const files = pairs.flatMap(expandPair)

  const copied = []
  const kept = []
  const unresolvedByFile = new Map()

  for (const [srcAbs, destRel] of files) {
    const destAbs = path.join(target, destRel)
    if (fs.existsSync(destAbs)) {
      kept.push(destRel)
      continue
    }
    const isText = /\.(md|json|mjs|js|cjs|ts|yml|yaml|txt|example|toml|env)$/i.test(srcAbs) || path.basename(srcAbs).startsWith('.')
    let content = fs.readFileSync(srcAbs)
    if (isText) {
      const { text, unresolved } = sweep(content.toString('utf-8'), manifest.placeholders)
      content = Buffer.from(text, 'utf-8')
      if (unresolved.size) unresolvedByFile.set(destRel, [...unresolved])
    }
    copied.push(destRel)
    if (!opts.dryRun) {
      fs.mkdirSync(path.dirname(destAbs), { recursive: true })
      fs.writeFileSync(destAbs, content)
    }
  }

  for (const f of copied) log(`copy       ${f}`)
  for (const f of kept) log(`kept       ${f}`)

  ensureGitignore(target, opts.dryRun, log)
  const pointers = ensureCommandPointers(target, opts.dryRun, log)

  // One audit row per unresolved token, naming every file it is in.
  const byToken = new Map()
  for (const [file, tokens] of unresolvedByFile) {
    for (const t of tokens) byToken.set(t, [...(byToken.get(t) ?? []), file])
  }
  const rows = [...byToken].map(([t, fileList]) => `${t} unresolved in ${fileList.length} file(s): ${fileList.join(', ')}`)
  appendAudit(target, rows, opts.dryRun, log)
  stampManifest(manifestFile, manifest, opts.dryRun)

  console.log('')
  console.log(`adopt: ${copied.length} copied, ${kept.length} kept, ${pointers.length} pointer(s) generated, ${byToken.size} unresolved token(s)${cloudLoop ? ', cloud loop on' : ''}${data ? ', data layer on' : ''}`)
  for (const [t, fileList] of byToken) console.log(`  ${t}: ${fileList.length} file(s)`)

  if (opts.commit && !opts.dryRun) {
    try {
      execSync('git rev-parse --is-inside-work-tree', { cwd: target, stdio: 'pipe' })
      execSync('git add -A', { cwd: target, stdio: 'pipe' })
      execSync('git commit -q -m "chore: adopt nexus methodology"', { cwd: target, stdio: 'pipe' })
      console.log('adopt: committed "chore: adopt nexus methodology" (not pushed)')
    } catch (err) {
      console.error(`adopt: commit skipped — ${String(err.stderr ?? err.message).trim()}`)
    }
  }

  console.log('')
  console.log('next: open your agent at the repo root and run /ship-a-phase.')
  if (byToken.size) console.log('      clear the [needs-user-call] rows in plan/AUDIT.md first, or the loop will park on them.')
}

main()
