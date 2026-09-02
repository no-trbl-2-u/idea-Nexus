---
description: The build has drifted from spec.md — a refusal was crossed, the Horizon changed shape, or the phases no longer describe the work. Write the field report that goes back to the spec's origin. Changes nothing else.
---

You are invoked under the `re-seed` skill — full autonomy, no
review checkpoint. Read `skills/re-seed.md` end to end before
touching anything else; that file is the single source of
truth for this command.

Write or append a dated report to `RE-SEED.md` at the repo
root using the skill's template (what drifted, what was built
instead, why, what the source should do). Commit it alone as
`re-seed: <summary>`, print one line naming the file and your
recommendation, and stop. The operator carries the report to
the source named by `spec.md`'s `origin:` line.

Never rewrite `spec.md` to match what was built. Never edit an
earlier report.

Optional: `--reason "<one line>"` seeds the "What drifted"
paragraph.

Argument: $ARGUMENTS
