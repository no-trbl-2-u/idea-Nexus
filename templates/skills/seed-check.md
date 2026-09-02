# Skill: seed-check

> **Read-only. Reports, never blocks.** One read of `spec.md`
> before any step the build plan did not name. It is the only
> thing standing between the loop and a slow drift into a
> different project.
>
> Decide-and-ship. No `AskUserQuestion` — hard rule #6 stands.
> A finding that needs the user goes to `plan/AUDIT.md` as a
> `[needs-user-call]` row, same as every other skill.

## 1. Purpose

`spec.md` arrived with two sections the loop must not erode:
the **Horizon** (what this is, and what would show it was
aimed wrong) and the **Refusals** (what it will not become,
each with its argument beside it). Phases are written against
both. Drift never announces itself — it arrives as a
dependency the plan did not name, a feature a critique asked
for, a "while I'm in here." `seed-check` is the one-read gate
on exactly those moments.

This is distinct from `/critique` (which finds defects in
what shipped) and `/expand` (which proposes new phases).
`seed-check` judges a *proposed change* against the spec's
walls before the change happens.

## 2. Invocation

```
/seed-check <one-sentence description of the proposed change>
```

Also run implicitly by `/ship-a-phase` and `/iterate` before
any step that is not in the phase brief. If `spec.md` has no
`## Refusals` or `## Horizon` section, print one line saying
so and exit 0 — there is nothing to check against, and that
fact belongs in `plan/AUDIT.md` as a `[needs-user-call]` row.

## 3. Autonomy contract

- Change is in the phase brief already → not a `seed-check`
  case; do the work.
- Change breaks a refusal → do not make it. File a
  `[needs-user-call]` row in `plan/AUDIT.md` quoting the
  refusal, and, if the wall genuinely looks wrong now, run
  `/re-seed`.
- Change moves toward the Horizon → proceed; note the answer
  in the commit body.
- Change moves sideways (neither toward nor against) → it is
  scope. Append it to `plan/PHASE_CANDIDATES.md`; do not fold
  it into the current phase.
- Change alters the Horizon's falsifier odds → proceed if it
  passes the other two, and say so in the commit body. That
  is information the operator wants.

## 4. The procedure

1. Read `spec.md` — the `## Refusals` and `## Horizon`
   sections. Nothing else is needed.
2. State the proposed change in one sentence.
3. Answer three questions, each yes/no with one line of
   reasoning:
   - **Does this break a refusal?** Quote the refusal.
   - **Does this move toward the Horizon?** Name which part.
   - **Does it change the falsifier's odds?** Up or down, and
     why.
4. Act per §3. Record the three answers in the commit body
   under a `Seed-check:` heading, or in the phase's notes if
   no commit results.

## 5. Output

Three lines, in the commit body or the terminal:

```
Seed-check: <change>
- refusal: no | YES — "<quoted refusal>"
- horizon: toward (<part>) | sideways | against
- falsifier: unchanged | more likely (<why>) | less likely (<why>)
```

## 6. Hard rules

1. **A refusal is a wall.** Do not soften it by
   reinterpreting it. If it reads as a wall, it is a wall.
2. **Never rewrite `spec.md`.** The spec is an export from
   somewhere else; its `origin:` line is the return address.
   Drift goes back through `/re-seed`, not into the file.
3. **Small is not exempt.** Small is how drift arrives.

## 7. Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Every check says "sideways" | Horizon is written as a feature list, not a direction | `/re-seed`: the spec cannot steer |
| Refusals keep getting crossed | The refusals were wrong, or the project has changed | `/re-seed` with the pattern named |
| `spec.md` missing the two sections | Not a build-plan export, or hand-edited | `[needs-user-call]` row; do not invent sections |
| Check skipped "because it was small" | Habit | The commit body has no `Seed-check:` block — `/critique` should flag it |

## 8. Quick reference

- Read: `spec.md` (`## Refusals`, `## Horizon`).
- Write: commit body (`Seed-check:` block), `plan/AUDIT.md`
  (`[needs-user-call]`), `plan/PHASE_CANDIDATES.md` (scope).
- Never: `spec.md`.
- Escalate: `/re-seed` when a wall has to come down.
