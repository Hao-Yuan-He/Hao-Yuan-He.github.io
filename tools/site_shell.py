"""Shared HTML shell for the static pages and Markdown blog generator."""
from pathlib import Path
from string import Template

TEMPLATES = Path(__file__).resolve().parent / "site_templates"


def render_header(root="", current="home"):
    fields = {f"{page}_current": ' aria-current="page"' if page == current else ""
              for page in ("home", "about", "research", "publications", "news", "blog")}
    return Template((TEMPLATES / "header.html").read_text()).substitute(root=root, **fields).rstrip()


def render_footer(root="", blog=False):
    return Template((TEMPLATES / "footer.html").read_text()).substitute(
        root=root, license=" · 文字与图采用 CC BY 4.0 许可" if blog else ""
    ).rstrip()
