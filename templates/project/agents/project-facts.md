## Project facts

<!-- agent-framework:begin project-facts -->
<!-- Read by the agent-framework skills. Edit freely: install agent:project adds this block once and never rewrites it. -->
- **Validate:** {{VALIDATE}}
- **Ticket tracker:** {{TRACKER_LINE}}
- **Branches:** `<ticket-id>/<slug>` with a ticket, `<type>/<slug>` without (`fix/empty-ref`)
- **Commits:** Conventional Commits; squash-merged, so the PR title and description become the commit
- **Docs:** `docs/`
- **Decision records:** `{{DECISIONS_DIR}}/`
- **Review routing:** `.github/CODEOWNERS` when present
<!-- agent-framework:end project-facts -->
