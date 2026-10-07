# CORE coding-agent instructions

Read `README.md`, `docs/PROJECT-BRIEF.md`, `docs/ARCHITECTURE.md`, `docs/BRAND.md`, and the linked issue before making changes.

## Non-negotiable boundaries

- Public website: HTML, scoped CSS, and vanilla JavaScript embedded in GHL. Keep the foundation dependency-free unless a dependency has a documented benefit and approval.
- Native GHL owns login, recovery, course/group access, and private member documents. Do not introduce custom authentication, Supabase, a new member database, or speculative dashboards.
- No API tokens, CRM exports, student/family records, consent documents, or private asset URLs in source, tests, issues, or generated output. Browser-visible config is public.
- Keep CSS inside `#core-app`. Initialize idempotently; handle the documented GHL `hydrationDone` event without accumulating listeners.
- Update both locale files for every text change. Spanish text and consequential copy require human review.
- Preserve the three current pillar labels. Do not infer enrollment rules, active programs, verified metrics, dates, staff approvals, or working integrations.
- Keep asset IDs stable; use the media register for provenance, EN/ES alternatives, approval status, and the published URL. Do not treat a public photo as automatic permission for reuse.
- Do not reconstruct the logo or remove the Rogers Foundation endorsement. Do not bundle font files.
- Never edit `dist/` as the source. Never publish to production merely because tests pass.

## Definition of done

Link the issue, keep the diff focused, run `npm run check && npm test && npm run build`, verify desktop/mobile and EN/ES behavior, update docs/registers, and record what was and was not tested. Use synthetic test data. Do not represent simulated hydration as a live GHL test.

Production routing is unresolved. The preview uses hashes deliberately and is noindex; changing a config label does not implement indexable routes. `build:release` must remain blocked until an actual production solution and launch review exist.
