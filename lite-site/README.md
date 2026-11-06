# Lite Site (No Jekyll)

This folder is a standalone personal website built with only HTML, CSS, and vanilla JS.

## Run locally

Because publications are loaded with `fetch("data/papers.bib")`, use a local HTTP server:

```bash
cd lite-site
python3 -m http.server 8080
```

Open `http://localhost:8080`.

Pages:
- `index.html`: introduction, selected publications, and awards
- `research.html`: research directions, diagrams, and paper references
- `full-publications.html`: full publication list
- `short-bio.html`: biography and education
- `news.html`: news archive
- `glass-preview.html`: generated preview alias of the homepage

## Shared academic template

Keep the presentation simple and academic: white backgrounds, readable body text,
plain links, and compact publication lists. Transparency is limited to the subtle
navigation background. Preserve research descriptions instead of adding slogans.

All personal-site pages use `css/styles.css` and `js/site.js`.
The navigation and footer templates live in `../tools/site_templates/`.
Keep page-specific content in the HTML files, and edit the shared templates for
site-wide navigation changes. Refresh the shell, preview alias, and asset versions with:

```bash
python3 tools/build_site.py  # from the repository root
```

Do not edit `glass-preview.html` directly. If optional local blog sources and their
generator are present, the build also refreshes those pages (requires pandoc).
The main theme uses system fonts and includes mobile navigation, reduced-transparency
support, a no-blur fallback, keyboard focus states, and print styles.

## Update publications

Edit `data/papers.bib`. The page parses BibTeX and renders citations automatically.
`selected = {true}` entries are shown on `index.html`; all entries are shown on `full-publications.html`.
Badges display venue labels from `abbr`.
Each publication shows action buttons such as `[ABS]`, `[BIB]`, `[PDF]`, `[SLIDES]` when those fields exist.
`[BIB]` toggles a compact BibTeX view with essential fields.

Use the paper's original abstract, not a summary or paraphrase. Prefer the published
version for accepted papers and the linked manuscript version for preprints.
Record the exact source URL (or local PDF path) in `abstract_source`; this metadata
is not displayed or included in the exported citation. Update it when changing versions.

Abstracts support inline math with `$...$` or `\(...\)` and display math with
`$$...$$` or `\[...\]`. Keep TeX backslashes literal in the BibTeX file.
KaTeX 0.19.1 is vendored in `vendor/katex-0.19.1/` with its MIT license and fonts,
so publication math does not depend on a CDN. Both publication pages load KaTeX
and its auto-render extension before `app.js`; typesetting is scoped to abstracts.
