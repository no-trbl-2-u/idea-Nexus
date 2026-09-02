---
description: Before a pivot, a scope change, or any step the plan did not name — check the change against spec.md's Refusals and Horizon. Read-only; reports, never blocks.
---

You are invoked under the `seed-check` skill — read-only, no
review checkpoint. Read `skills/seed-check.md` end to end
before touching anything else; that file is the single source
of truth for this command.

The argument is one sentence describing a proposed change.
Answer three questions against `spec.md` (refusal? toward the
Horizon? falsifier odds?) and act per the skill's autonomy
contract: a crossed refusal is a wall and goes to
`plan/AUDIT.md` as `[needs-user-call]`; sideways scope goes to
`plan/PHASE_CANDIDATES.md`; otherwise proceed and record the
three answers in the commit body.

Never edit `spec.md`. Never ask the user; hard rule #6 stands.

Argument: $ARGUMENTS
