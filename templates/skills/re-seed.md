# Skill: re-seed

> **Writes a field report. Changes nothing else.** When the
> build has stopped matching `spec.md`, this skill writes the
> report that travels back to wherever the spec came from. It
> never edits `spec.md`, the build plan, or the phases — those
> are answered with a new export, not a patch.
>
> Decide-and-ship. The report is the deliverable; the operator
> carries it.

## 1. Purpose

`spec.md` carries an `origin:` line (`idea-NNNN @ state/NNNN`
for Estate exports; any stable pointer works). That line is a
return address. A spec is a snapshot of a decision; the build
learns things the snapshot did not know. When the gap becomes
structural — a refusal had to be crossed, the Horizon changed
shape, the remaining phases no longer describe the work — the
correct move is to send that knowledge *back* so the source
can re-issue, branch, or record that the road was abandoned
on purpose.

The wrong move is to quietly edit `spec.md` until it matches
what was built. That is how a stale spec becomes an invisible
one, and how the next adopter inherits a lie.

## 2. Invocation

```
/re-seed                              # write the report from the current state
/re-seed --reason "<one line>"        # seed the "What drifted" paragraph
```

Triggered by:
- `/seed-check` finding a refusal that had to be crossed.
- A phase shipped in a way the plan did not describe, and
  the next phases no longer fit.
- The Horizon's falsifier fired, or something showed it was
  aimed wrong.
- The operator saying the project has become a different
  project.

## 3. Autonomy contract

- `RE-SEED.md` absent → create it with the template below.
- `RE-SEED.md` present → append a new dated report; never
  edit an earlier one.
- `origin:` missing from `spec.md` → write the report anyway
  with `origin: unknown` and add a `[needs-user-call]` row to
  `plan/AUDIT.md`; the report is still worth having.
- Recommendation unclear → pick the most conservative of the
  three (record as abandoned < graft < re-seed) and say why
  in one line. The source decides; the report informs.

## 4. The procedure

1. Read `spec.md` (`origin:`, `## Horizon`, `## Refusals`)
   and `plan/steps/01_build_plan.md` (the Status block).
2. Read `git log --oneline -30` for the shape of what was
   actually built.
3. Write or append `RE-SEED.md` at the repo root:

```markdown
# Field report — <ISO>

origin: <copied from spec.md, unchanged>
built-through: <last shipped phase and its commit>

## What drifted
<One paragraph. Which refusal, which phase, which part of the
Horizon.>

## What was built instead
<Plainly. Stack, shape, what runs where. No justification yet.>

## Why
<The reason the drift happened — a constraint the spec did not
know, a refusal that was wrong, a better road found. Honest,
not defensive.>

## What the source should do
<One of: re-seed from the current state / graft this as a new
idea / record the road as abandoned. Your recommendation and
one line why.>
```

4. Commit `RE-SEED.md` alone:
   `re-seed: <one-line summary of the drift>`. Push per the
   repo's standing rule.
5. Print one line telling the operator the report exists and
   where. Stop. The operator carries it to the source.

## 5. Output

```
re-seed: RE-SEED.md written (origin idea-0003 @ state/0012) — recommends: graft
```

## 6. Hard rules

1. **Never rewrite `spec.md`** to match what was built.
2. **Never edit an earlier report.** Append, dated.
3. **Report at the first crossed refusal.** A report then
   costs a paragraph; a report after six phases costs a
   re-plan.
4. **No `AskUserQuestion`.** Hard rule #6 stands; the report
   *is* the question, asked in writing.

## 7. Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Reports pile up unread | Nobody carries them back | The operator's job; `/oversight` should list `RE-SEED.md` entries newer than the last spec |
| Report reads as a defense | "Why" written before "What was built instead" | Rewrite in order; the template's order is deliberate |
| `origin: unknown` | Spec was hand-authored, not exported | Fine — the report still names the drift; add the origin when known |
| Same drift reported twice | Earlier report not read before appending | Read `RE-SEED.md` first; append only what is new |

## 8. Quick reference

- Read: `spec.md`, `plan/steps/01_build_plan.md`, git log.
- Write: `RE-SEED.md` (append-only), one commit.
- Never: `spec.md`, `plan/`, phase briefs.
- Pairs with: `/seed-check` (the gate that usually triggers it).
