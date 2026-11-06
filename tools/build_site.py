#!/usr/bin/env python3
"""Refresh page shells and the preview; rebuild the optional local blog if present."""
from pathlib import Path
import hashlib
import re
import subprocess
import sys
from site_shell import render_header, render_footer

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "lite-site"
PAGES = {"index.html": "home", "short-bio.html": "about", "research.html": "research",
         "full-publications.html": "publications", "news.html": "news"}


def main():
    for name, current in PAGES.items():
        path = SITE / name
        content = path.read_text()
        for asset in ("css/styles.css", "js/site.js", "js/app.js"):
            version = hashlib.sha256((SITE / asset).read_bytes()).hexdigest()[:10]
            content = re.sub(re.escape(asset) + r'(?:\?v=[^"\s]+)?',
                             f"{asset}?v={version}", content)
        for part, rendered in (("header", render_header(current=current)),
                               ("footer", render_footer())):
            pattern = rf"<!-- site-{part}:start -->.*?<!-- site-{part}:end -->"
            replacement = f"<!-- site-{part}:start -->\n{rendered}\n<!-- site-{part}:end -->"
            content, count = re.subn(pattern, lambda _: replacement, content, flags=re.S)
            if count != 1:
                raise ValueError(f"Expected exactly one {part} marker in {name}")
        path.write_text(content)
    preview = (SITE / "index.html").read_text().replace(
        '<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n    <meta name="robots" content="noindex" />', 1
    )
    (SITE / "glass-preview.html").write_text(preview)
    blog_builder = ROOT / "tools/build_blog.py"
    blog_sources = ROOT / "blog-src/llm-training-first-principles"
    if blog_builder.is_file() and blog_sources.is_dir():
        subprocess.run([sys.executable, str(blog_builder)], check=True)
    print("Built shared site shell and glass preview.")


if __name__ == "__main__":
    main()
