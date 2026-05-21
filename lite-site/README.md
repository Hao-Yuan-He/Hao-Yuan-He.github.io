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
- `index.html`: introduction + services + awards + selected publications
- `full-publications.html`: full publication list

## Update publications

Edit `data/papers.bib`. The page parses BibTeX and renders citations automatically.
`selected = {true}` entries are shown on `index.html`; all entries are shown on `full-publications.html`.
Badges display venue labels from `abbr`.
Each publication shows action buttons such as `[ABS]`, `[BIB]`, `[PDF]`, `[SLIDES]` when those fields exist.
`[BIB]` toggles a compact BibTeX view with essential fields.
