# Remote implementation workflow

Implementation specs live in this directory. GitHub issues track **what to work
on now**; these markdown files remain the **source of truth** for how to build
it.

## Layers

| Layer | Role |
|-------|------|
| [`docs/plans/*.md`](./) | Canonical spec — data models, ADRs, exit criteria, commit/PR strategy |
| [GitHub issues](https://github.com/joshmcarthur/lego-train-layout-planner/issues) | Work queue — order, status, assignee, PR links |
| Pull requests | Delivery — branch, review, merge |

Do not duplicate plan content into issues. Link to the plan file; update the
plan in the repo when the spec changes.

## Picking up work

1. Open the lowest-numbered open issue (or one whose dependencies are closed).
2. Read the linked plan's entry and exit criteria.
3. Write any required ADRs in [`docs/adr/`](../adr/) before coding.
4. Implement per the plan's tasks and commit strategy.
5. Open a PR referencing the issue (`Closes #N` when the issue fully completes;
   `Refs #N` for multi-PR plans like 05).
6. Close the issue when **exit criteria** are met, not merely when a PR merges.

## Agent-assisted sessions

Point the agent at:

- The **issue** for scope ("implement plan 03")
- The **plan file** for instructions
- [`docs/research/lego-track-geometry.md`](../research/lego-track-geometry.md)
  for domain facts

## Plan order and dependencies

See [README.md](./README.md) for the full sequence and dependency graph.

MVP is complete after issue **[08]** is closed. Issue **[09]** is post-MVP.

## Labels (optional)

| Label | Meaning |
|-------|---------|
| `plan` | Implementation plan issue |
| `mvp` | Required for MVP |
| `post-mvp` | Optional stretch |
| `blocked` | Waiting on a dependency issue |
