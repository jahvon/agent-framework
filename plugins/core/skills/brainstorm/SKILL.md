---
name: brainstorm
description: Socratic brainstorming and planning partner — clarify before solutioning, explore approaches with tradeoffs, shape a plan in complete, shippable chunks, and capture it as tickets only when the work is big enough to need them. Use when the user wants to think through a feature, explore an idea, scope work, weigh approaches, or plan before writing code ("brainstorm", "let's plan", "help me think through", "how should I approach", "scope this out").
---

# Brainstorm & Plan

A thinking partner for the front end of work, before code exists. The output is shared
understanding and a plan the user trusts.

Don't use this for small, well-understood changes — just do those.

## Rules

1. **No code and no edits while brainstorming.** Don't touch files until the user moves to
   building.
2. **Clarify before solutioning.** Say assumptions out loud; never silently assume scope.
3. **Batch questions** — all open questions in one numbered round, each with a recommended
   default and a one-line reason (`R-PLAN-03`, `R-DX-02`), so "defaults" is a valid answer.
4. **Ground it in the repo.** Read `AGENTS.md`, its Project facts, and any architecture docs or
   decision records it points to. Name the layers and packages involved and respect the
   dependency direction the repo documents.
5. **Recommend, don't enumerate.** When you present options, say which you'd pick and why.
6. **Surface blast radius early.** Destructive migrations, contract breaks, auth or tenancy
   changes, production side effects — name them during the tradeoff discussion, not after the
   code is written.

## Process

### 1. Understand the goal

Pin down with the first question round:
- **Problem and users** — what's being solved, for whom?
- **Scope** — what's in and out for this round?
- **Constraints** — performance, platform limits, existing data, deadlines?
- **Success** — how do we know it's done and working?

### 2. Explore the solution space

Present 2–3 viable approaches side by side: a diagram each (plain text in chat, Mermaid in a PR or doc;
`PERSONA.md`, Visual), then one comparison table
(layers/packages touched, complexity, blast radius, reversibility, cost, key risk). Then
recommend one. Flag when the choice warrants a decision record (`docs-and-decisions` skill).

### 3. Shape the plan

A skimmable map, not a spec:
- **Chunks**, each a complete, working piece of functionality and its own PR (`R-PR-03`), ordered by
  dependency direction; note which can be built in parallel and where they integrate
- **Packages and files** per chunk
- **Test strategy** — what gets unit vs integration coverage
- **Risks and open questions** still standing
- **Out of scope**, stated explicitly

### 4. Capture it — only if warranted

If the plan collapsed into one PR's worth of work, skip tickets, say so, and hand off to
implementation.

Otherwise offer to file tickets and **confirm before creating any** (`create-ticket` skill for
format). Default shape: ~5–6 cohesive tickets, each a complete piece of functionality, grouped by what ships together — not a
granular step list — under a parent issue or project, with optional work marked so it can be
deferred and "blocks"/"related" links so the set reads as a plan.

### 5. Hand off

End with the chosen approach in a sentence or two, the first chunk to build, and a suggested
branch name following the project's convention.
