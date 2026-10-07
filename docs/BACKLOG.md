# CORE implementation backlog

Initial baseline: October 7, 2026. GitHub Issues are the live task/status source; this file is the workstream index, not a separate board. Owners and due dates are intentionally unassigned until agreed.

| Issue | Workstream | Initial status | Main dependency |
|---|---|---|---|
| [#1](https://github.com/hustlescientist/core/issues/1) | Approved media, logo, brand, resource files | Open | Asset owners and permissions |
| [#2](https://github.com/hustlescientist/core/issues/2) | Full public SPA and content migration | Open | Approved content/media |
| [#3](https://github.com/hustlescientist/core/issues/3) | GHL forms, portal, CRM handoffs | Open | Verified account destinations and staff workflows |
| [#4](https://github.com/hustlescientist/core/issues/4) | EN/ES and accessibility review | Open | Complete authored journeys and reviewers |
| [#5](https://github.com/hustlescientist/core/issues/5) | Production routing, SEO, GHL staging | Open | GHL path/host validation |
| [#6](https://github.com/hustlescientist/core/issues/6) | Whole-task QA and launch evidence | Open | Prior workstreams |

## Foundation completed in this workspace

Source/config/content separation; shared editor workspace; scoped brand tokens; responsive bilingual preview with 11 views; distinct program routes; keyboard/focus basics; public integration placeholders; media register and storage policy; local build/check/test commands; development GHL embed; coding-agent rules; templates and a validation-only CI workflow.

## Operating workflow

Take an issue -> create a focused branch -> update code/content/media register -> run checks -> attach review evidence -> open PR -> review/merge -> test GHL staging -> publish only after approval. Use branch names such as `feat/homepage`, `content/spanish-review`, `media/program-photos`, `fix/mobile-nav`.

Split each workstream into smaller issues as work starts. Record blockers in the issue rather than silently substituting guessed content or URLs. A GitHub Projects board, branch-protection rules, automatic deployments, and scheduled monitoring are not configured by this starter.
