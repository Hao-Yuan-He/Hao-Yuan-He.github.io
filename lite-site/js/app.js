const pubListEl = document.getElementById("pub-list");
const pubStatusEl = document.getElementById("pub-status");
const publicationMode = document.body.dataset.publications || "selected";
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

let publications = [];

function normalizeSpace(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function stripWrapping(value) {
  let v = normalizeSpace(value);
  while ((v.startsWith("{") && v.endsWith("}")) || (v.startsWith('"') && v.endsWith('"'))) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

function splitTopLevel(input, delimiter) {
  const parts = [];
  let start = 0;
  let depth = 0;
  let inQuote = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    const prev = input[i - 1];

    if (ch === '"' && prev !== "\\") inQuote = !inQuote;
    if (!inQuote) {
      if (ch === "{") depth += 1;
      if (ch === "}") depth = Math.max(0, depth - 1);
      if (ch === delimiter && depth === 0) {
        parts.push(input.slice(start, i));
        start = i + 1;
      }
    }
  }

  parts.push(input.slice(start));
  return parts;
}

function parseBibFields(rawFields) {
  const fields = {};
  const chunks = splitTopLevel(rawFields, ",");

  chunks.forEach((chunk) => {
    const idx = chunk.indexOf("=");
    if (idx < 0) return;
    const key = chunk.slice(0, idx).trim().toLowerCase();
    const value = stripWrapping(chunk.slice(idx + 1).trim());
    if (key) fields[key] = value;
  });

  return fields;
}

function parseBibTeX(text) {
  const entries = [];
  let i = 0;

  while (i < text.length) {
    if (text[i] !== "@") {
      i += 1;
      continue;
    }

    const typeStart = i + 1;
    const braceIndex = text.indexOf("{", typeStart);
    if (braceIndex < 0) break;

    const type = text.slice(typeStart, braceIndex).trim().toLowerCase();
    let depth = 1;
    let j = braceIndex + 1;

    while (j < text.length && depth > 0) {
      if (text[j] === "{") depth += 1;
      else if (text[j] === "}") depth -= 1;
      j += 1;
    }

    const block = text.slice(braceIndex + 1, j - 1);
    const comma = block.indexOf(",");
    if (comma > 0) {
      const key = block.slice(0, comma).trim();
      const fields = parseBibFields(block.slice(comma + 1));
      entries.push({ type, key, ...fields });
    }

    i = j;
  }

  return entries;
}

function parseAuthors(authorText) {
  return normalizeSpace(authorText)
    .split(/\s+and\s+/i)
    .map((name) => {
      const clean = normalizeSpace(name.replace(/[{}]/g, ""));
      if (clean.includes(",")) {
        const [last, first] = clean.split(",").map((v) => v.trim());
        return { first: first || "", last: last || "" };
      }
      const parts = clean.split(" ");
      return {
        first: parts.slice(0, -1).join(" "),
        last: parts.slice(-1).join(" "),
      };
    })
    .filter((a) => a.first || a.last);
}

function formatAuthorLine(authors) {
  if (!authors.length) return "";
  if (authors.length === 1) return `${authors[0].first} ${authors[0].last}`.trim();
  if (authors.length === 2) {
    return `${authors[0].first} ${authors[0].last} and ${authors[1].first} ${authors[1].last}`.trim();
  }
  return `${authors
    .slice(0, -1)
    .map((a) => `${a.first} ${a.last}`.trim())
    .join(", ")}, and ${`${authors[authors.length - 1].first} ${authors[authors.length - 1].last}`.trim()}`;
}

function chooseVenue(entry) {
  return entry.journal || entry.booktitle || entry.publisher || "";
}

function isSelected(entry) {
  return /^(true|yes|1)$/i.test(normalizeSpace(entry.selected || ""));
}

function resolveAssetUrl(value, subdir) {
  if (!value) return "";
  if (value.includes("://")) return value;
  return `assets/${subdir}/${value}`;
}

function buildActionItems(entry) {
  const actions = [];
  if (entry.abstract) actions.push({ kind: "button", label: "ABS", action: "toggle-abs" });
  actions.push({ kind: "button", label: "BIB", action: "toggle-bib" });

  const pdf = resolveAssetUrl(entry.pdf, "pdf");
  if (pdf) actions.push({ kind: "link", label: "PDF", href: pdf });

  const slides = resolveAssetUrl(entry.slides, "pdf");
  if (slides) actions.push({ kind: "link", label: "SLIDES", href: slides });

  const poster = resolveAssetUrl(entry.poster, "pdf");
  if (poster) actions.push({ kind: "link", label: "POSTER", href: poster });

  const code = entry.code || "";
  if (code) actions.push({ kind: "link", label: "CODE", href: code });

  const supp = resolveAssetUrl(entry.supp, "pdf");
  if (supp) actions.push({ kind: "link", label: "SUPP", href: supp });

  if (entry.arxiv) actions.push({ kind: "link", label: "ARXIV", href: `https://arxiv.org/abs/${entry.arxiv}` });
  else if (entry.eprint && /arxiv/i.test(entry.archiveprefix || "")) {
    actions.push({ kind: "link", label: "ARXIV", href: `https://arxiv.org/abs/${entry.eprint}` });
  }
  const order = ["ABS", "BIB", "PDF", "ARXIV", "CODE", "SLIDES", "POSTER", "SUPP"];
  actions.sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
  return actions;
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {}

  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(ta);
  return ok;
}

function getMinimalBibTeX(entry) {
  const fields = [
    ["title", entry.title],
    ["author", entry.author],
    ["journal", entry.journal],
    ["booktitle", entry.booktitle],
    ["volume", entry.volume],
    ["number", entry.number],
    ["pages", entry.pages],
    ["year", entry.year],
    ["publisher", entry.publisher],
    ["doi", entry.doi],
    ["arxiv", entry.arxiv || entry.eprint],
    ["url", entry.url],
  ].filter(([, value]) => normalizeSpace(value));

  const lines = fields.map(([k, v]) => `  ${k} = {${normalizeSpace(v)}}`);
  return `@${entry.type}{${entry.key},\n${lines.join(",\n")}\n}`;
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    const yearA = Number(a.year || 0);
    const yearB = Number(b.year || 0);
    if (yearA !== yearB) return yearB - yearA;
    return (a.title || "").localeCompare(b.title || "");
  });
}

function entryPrefix(type) {
  const t = String(type || "").toLowerCase();
  if (t === "article") return "J";
  if (t === "inproceedings" || t === "incollection") return "C";
  if (t === "phdthesis" || t === "mastersthesis" || t === "thesis") return "T";
  if (t === "misc" || t === "preprint") return "P";
  return "O";
}

function buildTagMap(entries) {
  const counters = { J: 0, C: 0, T: 0, P: 0, O: 0 };
  const map = {};
  sortEntries(entries).forEach((entry) => {
    const prefix = entryPrefix(entry.type);
    counters[prefix] += 1;
    map[entry.key] = `${prefix}${counters[prefix]}`;
  });
  return map;
}

function formatVenueDetail(entry) {
  const venue = normalizeSpace(chooseVenue(entry));
  const volume = normalizeSpace(entry.volume || "");
  const number = normalizeSpace(entry.number || "");
  const pages = normalizeSpace(entry.pages || "");
  const year = normalizeSpace(entry.year || "");

  const volNo = [volume ? `vol. ${volume}` : "", number ? `no. ${number}` : ""]
    .filter(Boolean)
    .join(", ");

  const parts = [venue, volNo, pages ? `pp. ${pages}` : "", year].filter(Boolean);
  return parts.join(", ");
}

function pubAnchorId(key) {
  return `pub-${String(key || "").toLowerCase().replace(/[^a-z0-9_-]/g, "")}`;
}

function classifyEntry(entry) {
  const type = String(entry.type || "").toLowerCase();
  const abbr = String(entry.abbr || "").toLowerCase();
  const archive = String(entry.archiveprefix || "").toLowerCase();

  if (type === "article") return "journals";
  if (type === "inproceedings" || type === "incollection") return "conferences";
  if (
    type === "misc" ||
    abbr.includes("preprint") ||
    archive.includes("arxiv") ||
    normalizeSpace(entry.arxiv || entry.eprint)
  ) {
    return "preprints";
  }
  return "preprints";
}

function scrollToHashIfPresent() {
  const hash = window.location.hash || "";
  if (!hash.startsWith("#pub-")) return;
  const el = document.querySelector(hash);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function createPublicationNode(entry, tagMap) {
  const node = document.createElement("div");
  node.className = "pub-item";
  node.id = pubAnchorId(entry.key);

  const badgeRow = document.createElement("div");
  badgeRow.className = "badge-row";

  if (entry.abbr) {
    const venueBadge = document.createElement("span");
    venueBadge.className = "badge venue";
    venueBadge.textContent = entry.abbr;
    badgeRow.appendChild(venueBadge);
  }

  const refBadge = document.createElement("span");
  refBadge.className = "badge ref";
  refBadge.textContent = tagMap[entry.key] || "O?";
  badgeRow.appendChild(refBadge);

  const titleEl = document.createElement("h3");
  titleEl.className = "pub-title";
  titleEl.textContent = normalizeSpace(entry.title || "(untitled)");

  const authorLineEl = document.createElement("div");
  authorLineEl.className = "pub-line pub-authors";
  const authorLine = formatAuthorLine(parseAuthors(entry.author || ""));
  authorLineEl.textContent = authorLine;

  const venueLineEl = document.createElement("div");
  venueLineEl.className = "pub-line pub-venue";
  const venueLine = formatVenueDetail(entry);
  venueLineEl.textContent = venueLine;

  const actionRow = document.createElement("div");
  actionRow.className = "pub-actions";

  buildActionItems(entry).forEach((item) => {
    if (item.kind === "button") {
      const btn = document.createElement("button");
      btn.className = "pub-btn";
      btn.type = "button";
      btn.dataset.action = item.action;
      btn.textContent = item.label;
      actionRow.appendChild(btn);
    } else {
      const a = document.createElement("a");
      a.className = "pub-btn";
      a.href = item.href;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = item.label;
      actionRow.appendChild(a);
    }
  });

  const detail = document.createElement("div");
  detail.className = "pub-detail";

  if (entry.abstract) {
    const abs = document.createElement("p");
    abs.className = "pub-abstract";
    abs.textContent = normalizeSpace(entry.abstract);
    abs.hidden = true;
    detail.appendChild(abs);
  }

  const bibWrap = document.createElement("div");
  bibWrap.className = "pub-bib-wrap";
  bibWrap.hidden = true;

  const bibPanel = document.createElement("div");
  bibPanel.className = "pub-bib-panel";

  const bib = document.createElement("pre");
  bib.className = "pub-bib";
  bib.textContent = getMinimalBibTeX(entry);
  bibPanel.appendChild(bib);

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "pub-btn pub-btn-copy";
  copyBtn.dataset.action = "copy-bib";
  copyBtn.textContent = "COPY";
  bibPanel.appendChild(copyBtn);

  const copyStatus = document.createElement("div");
  copyStatus.className = "pub-copy-status";
  copyStatus.setAttribute("aria-live", "polite");
  bibPanel.appendChild(copyStatus);

  bibWrap.appendChild(bibPanel);
  detail.appendChild(bibWrap);

  if (badgeRow.childNodes.length) node.appendChild(badgeRow);
  node.appendChild(titleEl);
  node.appendChild(authorLineEl);
  node.appendChild(venueLineEl);
  node.appendChild(actionRow);
  node.appendChild(detail);
  return node;
}

function renderPublications() {
  pubListEl.innerHTML = "";
  const tagMap = buildTagMap(publications);
  const visible = sortEntries(publications).filter((entry) => {
    return publicationMode === "all" ? true : isSelected(entry);
  });

  const groups = {
    preprints: { title: "Preprints", entries: [] },
    journals: { title: "Journals", entries: [] },
    conferences: { title: "Conferences", entries: [] },
  };

  visible.forEach((entry) => {
    groups[classifyEntry(entry)].entries.push(entry);
  });

  ["preprints", "journals", "conferences"].forEach((gkey) => {
    const group = groups[gkey];
    if (!group.entries.length) return;

    const section = document.createElement("section");
    section.className = "pub-group";

    const heading = document.createElement("h3");
    heading.className = "pub-group-title";
    heading.textContent = group.title;
    section.appendChild(heading);

    const list = document.createElement("div");
    list.className = "pub-group-list";
    group.entries.forEach((entry) => {
      list.appendChild(createPublicationNode(entry, tagMap));
    });
    section.appendChild(list);
    pubListEl.appendChild(section);
  });

  pubStatusEl.textContent = `${visible.length} shown / ${publications.length} total publication(s).`;
  scrollToHashIfPresent();
}

pubListEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.classList.contains("pub-btn")) return;
  if (target.tagName.toLowerCase() === "a") return;

  const item = target.closest(".pub-item");
  if (!item) return;

  const detail = item.querySelector(".pub-detail");
  if (!detail) return;
  const abs = item.querySelector(".pub-abstract");
  const bibWrap = item.querySelector(".pub-bib-wrap");
  const bib = item.querySelector(".pub-bib");
  const action = target.dataset.action;

  if (action === "toggle-abs") {
    if (!abs) return;
    const willOpen = abs.hidden;
    abs.hidden = !willOpen;
    if (bibWrap) bibWrap.hidden = true;
    detail.classList.toggle("open", willOpen);
    return;
  }

  if (action === "toggle-bib") {
    if (!bibWrap) return;
    const willOpen = bibWrap.hidden;
    bibWrap.hidden = !willOpen;
    if (abs) abs.hidden = true;
    detail.classList.toggle("open", willOpen);
    return;
  }

  if (action === "copy-bib") {
    if (!bib) return;
    const status = item.querySelector(".pub-copy-status");
    copyToClipboard(bib.textContent || "").then((ok) => {
      if (!status) return;
      status.textContent = ok ? "BibTeX copied." : "Failed to copy BibTeX.";
      status.classList.add("show");
      window.setTimeout(() => status.classList.remove("show"), 1200);
    });
  }
});

async function init() {
  try {
    const res = await fetch("data/papers.bib");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const bibText = await res.text();
    publications = parseBibTeX(bibText);

    if (!publications.length) {
      pubStatusEl.textContent = "No publications parsed from BibTeX.";
      return;
    }

    renderPublications();
  } catch (err) {
    pubStatusEl.textContent = `Failed to load BibTeX: ${err.message}`;
  }
}

init();
