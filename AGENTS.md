# Repository Guidelines

## Project Structure & Module Organization
This repository is a Jekyll-based academic site (al-folio variant). Main content lives in:
- `_pages/`: top-level pages (`about.md`, `publications.md`, `cv.md`)
- `_posts/`, `_news/`, `_projects/`: dated posts, announcements, and project entries
- `_layouts/`, `_includes/`, `_sass/`, `assets/`: templates, partials, styles, JS, images, PDFs
- `_data/` and `_bibliography/`: structured YAML/BibTeX data
- `_plugins/`: custom Ruby plugins
- `_site/`: generated output (build artifact; do not edit directly)

## Build, Test, and Development Commands
- `bundle install`: install Ruby gems from `Gemfile`
- `bundle exec jekyll serve --lsi`: run local dev server with incremental content similarity features
- `bundle exec jekyll build --lsi`: production-style static build
- `bin/cibuild`: CI-equivalent build command
- `docker-compose up`: run site locally via Docker (recommended in upstream docs)
- `pre-commit run --all-files`: run formatting/sanity hooks (`trailing-whitespace`, YAML checks, EOF fixes)

## Coding Style & Naming Conventions
- Use Markdown + YAML front matter for content; keep front matter keys consistent with existing pages.
- Follow existing indentation per file type (2 spaces in YAML/HTML includes; no tabs).
- Name dated content with Jekyll conventions:
  - Posts: `YYYY-MM-DD-title.md` in `_posts/`
  - News: concise, descriptive filenames in `_news/`
- Keep asset paths stable and relative (e.g., `assets/img/...`, `assets/pdf/...`).

## Testing Guidelines
There is no dedicated unit-test framework in this repository. Treat these as required checks before a PR:
- `bundle exec jekyll build --lsi` must pass with no errors.
- `pre-commit run --all-files` should pass.
- For UI/content changes, verify key pages locally (`/`, `/publications/`, `/cv/`) for broken links/layout regressions.

## Commit & Pull Request Guidelines
- Commit style in this repo is short and direct (e.g., `add paper`, `fix bib...`, `docs: ...`).
- Prefer one logical change per commit; use imperative mood and include scope when useful (`news: update neurips entry`).
- PRs should include:
  - Clear summary of what changed and why
  - Linked issue (for features/bugs)
  - Screenshots for visible layout/style changes
  - Confirmation that local build and pre-commit checks passed
