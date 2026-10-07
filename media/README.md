# CORE media workspace

No actual logo, photo, or document binaries have been imported yet. `manifest.json` contains seven acquisition records so the work can be tracked without inventing assets or approvals.

## Folder and storage policy

- `logos/`: approved public logo exports; preserve original proportions/endorsement.
- `images/`: optimized program, team, event, and story photography.
- `icons/`: approved public icons/illustrations; sanitize SVGs before use.
- `documents/`: approved public guides/reports only; favor accessible HTML plus downloads.

Naming: `core-home-hero-1600w-v01.webp`, `core-character-workshop-960w-v01.webp`. Keep stable media IDs while versioning filenames for CDN cache changes. Retain source masters in the approved shared media system, not in normal Git. `media/originals/`, common video/design formats, and ZIPs are ignored. Fonts are not bundled.

The workspace validates a **5 MiB per-file budget** for web assets. This is our chosen safeguard, not GitHub's upload limit. GitHub blocks ordinary Git files above 100 MiB; Git LFS exists for larger assets but is **not enabled or configured here**. Decide storage/cost/access first before adding LFS patterns. Reference: https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github

## Register every asset

Keep `id`, `kind`, `status`, `localPath`, `publishedUrl`, `sourceUrl`, `alt.en`, `alt.es`, `approvalRef`, and `owner` in `manifest.json`. Statuses: `needed`, `review`, `approved`, `retired`.

An approved record needs a source, a location, EN/ES alternatives, and an approval reference. The reference is a non-sensitive identifier only: never store consent evidence, names of minors, private storage URLs, or personal records in Git or GitHub issues. Decorative-image handling should be implemented explicitly when needed; current approved-record validation expects meaningful alternatives.

## Add -> review -> publish

1. Obtain the approved original and check usage permission, youth consent, and identifying metadata outside Git.
2. Optimize a public derivative, place it in the correct folder, and add its register entry as `review`.
3. Obtain content/brand approval; record the reference and mark `approved`. Run checks.
4. Upload that exact derivative to GHL Media or the approved public CDN, record its HTTPS URL, and use that URL in the GHL-facing markup.
5. Commit the asset and register together, link the issue, and show its page usage in the PR.

The build copies approved local assets only. It does not upload files, transform image markup, or rewrite URLs. A private GitHub repository is a source workspace, not the live public media host. Do not remove a published asset until all references and any rollback dependency have been reviewed.
