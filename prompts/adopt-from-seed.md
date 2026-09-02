# Adopt nexus — from a Seed (the warm path)

> The paste-prompt for a repo that already carries its
> decisions: `spec.md`, `plan/bearings.md`,
> `plan/steps/01_build_plan.md`, a Phase 1 brief, and a
> `nexus.adopt.json` manifest — the shape a build-plan payload
> from [The Estate](https://github.com/no-trbl-2-u/the-estate)
> drops in as. Nothing here is inferred; the script copies the
> kit *around* those files and reports what it could not
> resolve.
>
> Cold start (a spec and nothing else)? Use
> [`adopt.md`](./adopt.md) instead — it reads the kit and
> decides the stack, hosting, and shape for you.

---

## What the operator pastes

At the repo root, after the payload's files are in place:

```
Run `npx --yes github:no-trbl-2-u/idea-Nexus#v0.2-estate adopt --commit`
at the repo root, then read and follow
https://github.com/no-trbl-2-u/idea-Nexus/blob/v0.2-estate/prompts/adopt-from-seed.md
exactly, in order. Do not re-derive anything the payload
already decided.
```

(Node 18+ and git are the only prerequisites. `npx` fetches
the kit at the pinned tag into its cache; nothing is cloned
beside the repo and nothing of the kit's source is left in
it.)

## What the agent does

1. **Run the script if the operator has not.**
   `npx --yes github:no-trbl-2-u/idea-Nexus#v0.2-estate adopt --commit`
   (or `node ../nexus/scripts/adopt.mjs --commit` from a local
   checkout). Read its report. It prints every file it copied,
   every file it **kept** (already present — the payload's),
   every command pointer it generated, and every placeholder
   it could not resolve.

2. **Do not touch the kept files.** `spec.md`,
   `plan/bearings.md`, `plan/steps/01_build_plan.md`, and
   `plan/phases/phase_1_bootstrap.md` are the payload's. If
   one of them looks wrong, that is a `/re-seed` report, not
   an edit.

3. **Clear `plan/AUDIT.md`'s adoption block.** Each
   `[needs-user-call]` row is a placeholder the manifest left
   empty — usually `<HOSTING_URL>` or `<REPO_SLUG>` when the
   repo does not exist yet. Ask the operator for each in one
   batch, sweep the value into the files the row names, delete
   the row. This is the only step that asks a question.

4. **Prune what the payload's `plan/bearings.md` rules out.**
   Its `Surface:`, `Structured data:`, and `Auth:` lines are
   already set. Delete the opt-in skills and scripts those
   lines exclude, exactly as
   [`playbooks/new-project.md`](../playbooks/new-project.md)'s
   prune step lists them, and their command pointers with
   them.

5. **Verify the overlay is live.** `node scripts/pulse.mjs`
   should print the build plan's phase count from the
   payload's Status block. `.claude/commands/` should contain
   a pointer for every file in `skills/`, including any
   seed-specific skill the payload shipped.

6. **Commit** anything steps 3–4 changed as
   `chore: adopt nexus methodology (resolve + prune)`. Push if
   the repo has a remote.

7. **Stop and report.** One paragraph: what was kept, what
   was pruned, what is still `[needs-user-call]`. Then:
   *"Ready for `/ship-a-phase`. Phase 1 is the garden — its
   done-condition is one loop tick on nothing."*

## What the agent does not do

- Re-read the kit's docs to "check" the payload's decisions.
  The payload was written against this kit's tag; the
  decisions are the operator's.
- Invent phases. The Status block is the plan.
- Run `/ship-a-phase`. That is the operator's word, and it is
  the first thing that happens after this prompt returns.

## The manifest

`nexus.adopt.json`, at the repo root, keyed by the literal
placeholder tokens so it documents itself:

```json
{
  "placeholders": {
    "<PROJECT>": "starvu",
    "<PROJECT_LOWER>": "starvu",
    "<PROJECT_TAGLINE>": "one-line description",
    "<HOSTING_URL>": "",
    "<HOSTING_PROVIDER>": "Vercel",
    "<REPO_SLUG>": "",
    "<DEFAULT_BRANCH>": "main",
    "<PROJECT_PKG_PREFIX>": ""
  },
  "cloudLoop": false,
  "data": false
}
```

Empty and missing are the same thing: unresolved, and
reported. `cloudLoop: true` overlays `templates/.github`;
`data: true` overlays `templates/data`. Command-line flags
(`--with-cloud-loop`, `--with-data`) win over the manifest.
After a run the script stamps `adopted: { kit, at }` into the
file, which is the record of which kit tag this repo was
adopted from — the first thing to check before re-running
adopt on a later tag.

## See also

- [`scripts/adopt.mjs`](../scripts/adopt.mjs) — the script;
  its header comment is the contract.
- [`templates/skills/seed-check.md`](../templates/skills/seed-check.md)
  and [`re-seed.md`](../templates/skills/re-seed.md) — the two
  skills that keep a spec honest after adoption; copied by the
  script like every other template skill.
- [`playbooks/new-project.md`](../playbooks/new-project.md) —
  the cold path this shortcuts; its prune list is still the
  authority for step 4.
