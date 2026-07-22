const variant = new URLSearchParams(window.location.search).get("variant");
if (variant) document.documentElement.dataset.variant = variant;

const publications = [
  {
    year: 2023,
    title: "Machine/deep learning for software engineering: A systematic literature review",
    authors: "S. Wang, L. Huang, A. Gao, J. Ge, T. Zhang, H. Feng, I. Satyarth, M. Li, H. Zhang, and V. Ng",
    venue: "IEEE Transactions on Software Engineering · 49(3): 1188–1231",
    category: "software mining",
    href: "https://ieeexplore.ieee.org/document/9890772",
  },
  {
    year: 2023,
    title: "Enhancing unsupervised domain adaptation by exploiting the conceptual consistency of multiple self-supervised tasks",
    authors: "H. Sun and M. Li",
    venue: "Science China: Information Sciences · 66(4): 142101",
    category: "machine learning",
    href: "https://link.springer.com/article/10.1007/s11432-021-3449-4",
  },
  {
    year: 2023,
    title: "Capturing the long-distance dependency in the control flow graph via structural-guided attention for bug localization",
    authors: "Y.-F. Ma, Y. Du, and M. Li",
    venue: "Proceedings of IJCAI'23 · Macau, China",
    category: "software mining",
    href: "https://www.ijcai.org/proceedings/2023/0611.pdf",
  },
  {
    year: 2023,
    title: "Semi-supervised learning with support isolation by small-paced self-training",
    authors: "Z. Xie, H. Sun, and M. Li",
    venue: "Proceedings of AAAI'23 · Washington, DC",
    category: "machine learning",
    href: "https://ojs.aaai.org/index.php/AAAI/article/view/26011",
  },
  {
    year: 2023,
    title: "Cooperative and adversarial learning: Co-enhancing discriminability and transferability in domain adaptation",
    authors: "H. Sun, Z. Xie, X.-Y. Li, and M. Li",
    venue: "Proceedings of AAAI'23 · Washington, DC",
    category: "machine learning",
    href: "https://ojs.aaai.org/index.php/AAAI/article/view/26055",
  },
  {
    year: 2023,
    title: "CHRONOS: Time-aware zero-shot identification of libraries from vulnerability reports",
    authors: "Y. Lyu, T. Le Cong, H. Kang, R. Widyasari, Z. Zhao, B. Le, M. Li, and D. Lo",
    venue: "Proceedings of ICSE'23 · Melbourne, Australia",
    category: "software mining",
    href: "https://arxiv.org/abs/2301.05088",
  },
  {
    year: 2022,
    title: "The flowing nature matters: Feature learning from the control flow graph of source code for bug localization",
    authors: "Y.-F. Ma and M. Li",
    venue: "Machine Learning · 111(3): 853–870",
    category: "software mining",
    href: "https://link.springer.com/article/10.1007/s10994-021-06077-7",
  },
  {
    year: 2022,
    title: "Pyramid attention for source code summarization",
    authors: "L. Chai and M. Li",
    venue: "Advances in Neural Information Processing Systems 35",
    category: "software mining",
    href: "https://papers.nips.cc/paper_files/paper/2022/hash/6d4d8c0ceec0f7d7b6ec2a3eecf2e2e5-Abstract-Conference.html",
  },
  {
    year: 2021,
    title: "Deep transfer bug localization",
    authors: "X. Huo, F. Thung, M. Li, D. Lo, and S.-T. Shi",
    venue: "IEEE Transactions on Software Engineering · 47(7): 1368–1380",
    category: "software mining",
    href: "https://ieeexplore.ieee.org/document/8881691",
  },
  {
    year: 2021,
    title: "Towards generating summaries for lexically confusing code through code erosion",
    authors: "Y. Fan and M. Li",
    venue: "Proceedings of IJCAI'21 · Montreal, Canada",
    category: "software mining",
    href: "https://www.ijcai.org/proceedings/2021/0630.pdf",
  },
  {
    year: 2020,
    title: "Control flow graph embedding based on multi-instance decomposition for bug localization",
    authors: "X. Huo, M. Li, and Z.-H. Zhou",
    venue: "Proceedings of AAAI'20 · New York, NY",
    category: "software mining",
    href: "https://ojs.aaai.org/index.php/AAAI/article/view/5611",
  },
  {
    year: 2020,
    title: "Deep time-stream framework for click-through rate prediction by tracking interest evolution",
    authors: "S.-T. Shi, W. Zheng, J. Tang, Q.-G. Chen, Y. Hu, J. Zhu, and M. Li",
    venue: "Proceedings of AAAI'20 · New York, NY",
    category: "machine learning",
    href: "https://ojs.aaai.org/index.php/AAAI/article/view/5494",
  },
  {
    year: 2019,
    title: "Find me if you can: Deep software clone detection by exploiting the contest between the plagiarist and the detector",
    authors: "Y.-Y. Zhang and M. Li",
    venue: "Proceedings of AAAI'19 · Honolulu, HI",
    category: "software mining",
    href: "https://ojs.aaai.org/index.php/AAAI/article/view/3927",
  },
  {
    year: 2019,
    title: "Automatic code review by learning the revision of source code",
    authors: "S.-T. Shi, M. Li, D. Lo, F. Thung, and X. Huo",
    venue: "Proceedings of AAAI'19 · Honolulu, HI",
    category: "software mining",
    href: "https://ojs.aaai.org/index.php/AAAI/article/view/3944",
  },
  {
    year: 2018,
    title: "T2S: Domain adaptation via model-independent inverse mapping and model reuse",
    authors: "Z.-Y. Shen and M. Li",
    venue: "Proceedings of ICDM'18 · Singapore · pp. 1224–1229",
    category: "machine learning",
    href: "https://ieeexplore.ieee.org/document/8594844",
  },
  {
    year: 2018,
    title: "Cutting the software building efforts in continuous integration by semi-supervised online AUC optimization",
    authors: "Z. Xie and M. Li",
    venue: "Proceedings of IJCAI'18 · Stockholm, Sweden · pp. 2875–2881",
    category: "software mining",
    href: "https://www.ijcai.org/proceedings/2018/0399.pdf",
  },
  {
    year: 2018,
    title: "Positive and unlabeled learning for detecting software functional clones with adversarial training",
    authors: "H.-H. Wei and M. Li",
    venue: "Proceedings of IJCAI'18 · Stockholm, Sweden · pp. 2840–2846",
    category: "software mining",
    href: "https://www.ijcai.org/proceedings/2018/0394.pdf",
  },
  {
    year: 2018,
    title: "Semi-supervised AUC optimization without guessing labels of unlabeled data",
    authors: "Z. Xie and M. Li",
    venue: "Proceedings of AAAI'18 · New Orleans, LA · pp. 4310–4317",
    category: "machine learning",
    href: "https://ojs.aaai.org/index.php/AAAI/article/view/11737",
  },
  {
    year: 2017,
    title: "Enhancing the unified features to locate buggy files by exploiting the sequential nature of source code",
    authors: "X. Huo and M. Li",
    venue: "Proceedings of IJCAI'17 · Melbourne, Australia · pp. 1909–1915",
    category: "software mining",
    href: "https://www.ijcai.org/Proceedings/2017/0266.pdf",
  },
  {
    year: 2017,
    title: "Supervised deep features for software functional clone detection by exploiting lexical and syntactical information in source code",
    authors: "H.-H. Wei and M. Li",
    venue: "Proceedings of IJCAI'17 · Melbourne, Australia · pp. 3034–3040",
    category: "software mining",
    href: "https://www.ijcai.org/Proceedings/2017/0423.pdf",
  },
  {
    year: 2016,
    title: "Learning unified features from natural and programming languages for locating buggy source code",
    authors: "X. Huo, M. Li, and Z.-H. Zhou",
    venue: "Proceedings of IJCAI'16 · New York, NY · pp. 1606–1612",
    category: "software mining",
    href: "https://www.ijcai.org/Proceedings/16/Papers/230.pdf",
  },
  {
    year: 2012,
    title: "Sample-based software defect prediction with active and semi-supervised learning",
    authors: "M. Li, H. Zhang, R. Wu, and Z.-H. Zhou",
    venue: "Automated Software Engineering · 19(2): 201–230",
    category: "software mining",
    href: "https://link.springer.com/article/10.1007/s10515-011-0094-2",
  },
];

// Snapshot from the LAMDA member page: https://www.lamda.nju.edu.cn/CH.People.ashx
// The entries below are the students listed under advisor 黎铭.
const students = {
  doctoral: [
    { name: "Ren-Biao Liu", year: "2023", degree: "Ph.D.", href: "https://www.lamda.nju.edu.cn/liurb/" },
    { name: "Hui Sun", year: "2023", degree: "Ph.D.", href: "https://www.lamda.nju.edu.cn/sunh/" },
    { name: "Ya-Li Du", year: "2024", degree: "Ph.D.", href: "https://www.lamda.nju.edu.cn/duyl/" },
    { name: "Hao-Yuan He", year: "2024", degree: "Ph.D.", href: "https://www.lamda.nju.edu.cn/hehy/" },
    { name: "Xin-Ye Li", year: "2024", degree: "Ph.D.", href: "https://www.lamda.nju.edu.cn/lixy/" },
    { name: "Dai-Yang Luan", year: "2024", degree: "Ph.D.", href: "https://www.lamda.nju.edu.cn/luandy/" },
    { name: "Rui-Ce Rao", year: "2024", degree: "Ph.D.", href: "https://www.lamda.nju.edu.cn/raorc/" },
    { name: "Xin Shen", year: "2024", degree: "Ph.D.", href: "https://www.lamda.nju.edu.cn/shenx/" },
    { name: "Shu-Tian Mao", year: "2025", degree: "Ph.D.", href: "https://www.lamda.nju.edu.cn/maozy/" },
    { name: "Jiang-Tian Xue", year: "2025", degree: "Ph.D.", href: "https://www.lamda.nju.edu.cn/xuejt/" },
  ],
  master: [
    { name: "Wen-Jie Deng", year: "2024", degree: "M.Sc.", href: "https://www.lamda.nju.edu.cn/dengwj/" },
    { name: "Chao-Zeng Ma", year: "2024", degree: "M.Sc.", href: "https://www.lamda.nju.edu.cn/macz/" },
    { name: "Chao-Zhi Zhang", year: "2024", degree: "M.Sc.", href: "https://www.lamda.nju.edu.cn/zhangcz/" },
    { name: "Shao-Peng Jia", year: "2025", degree: "M.Sc.", href: "https://www.lamda.nju.edu.cn/jiasp/" },
    { name: "Zhen Sun", year: "2025", degree: "M.Sc.", href: "https://www.lamda.nju.edu.cn/sunz/" },
    { name: "Zi-Rui Wang", year: "2025", degree: "M.Sc.", href: "https://www.lamda.nju.edu.cn/wangzr/" },
    { name: "Yun-Ji Zhang", year: "2025", degree: "M.Sc.", href: "https://www.lamda.nju.edu.cn/zhangyunji/" },
  ],
};

const publicationOrder = [
  "Machine/deep learning for software engineering: A systematic literature review",
  "Enhancing unsupervised domain adaptation by exploiting the conceptual consistency of multiple self-supervised tasks",
  "The flowing nature matters: Feature learning from the control flow graph of source code for bug localization",
  "Deep transfer bug localization",
  "Capturing the long-distance dependency in the control flow graph via structural-guided attention for bug localization",
  "Semi-supervised learning with support isolation by small-paced self-training",
  "Cooperative and adversarial learning: Co-enhancing discriminability and transferability in domain adaptation",
  "CHRONOS: Time-aware zero-shot identification of libraries from vulnerability reports",
  "Pyramid attention for source code summarization",
  "Towards generating summaries for lexically confusing code through code erosion",
  "Control flow graph embedding based on multi-instance decomposition for bug localization",
  "Deep time-stream framework for click-through rate prediction by tracking interest evolution",
  "Find me if you can: Deep software clone detection by exploiting the contest between the plagiarist and the detector",
  "Automatic code review by learning the revision of source code",
  "T2S: Domain adaptation via model-independent inverse mapping and model reuse",
  "Cutting the software building efforts in continuous integration by semi-supervised online AUC optimization",
  "Positive and unlabeled learning for detecting software functional clones with adversarial training",
  "Semi-supervised AUC optimization without guessing labels of unlabeled data",
  "Enhancing the unified features to locate buggy files by exploiting the sequential nature of source code",
  "Supervised deep features for software functional clone detection by exploiting lexical and syntactical information in source code",
  "Learning unified features from natural and programming languages for locating buggy source code",
  "Sample-based software defect prediction with active and semi-supervised learning",
];

const publicationRank = new Map(publicationOrder.map((title, index) => [title, index]));
const orderedPublications = [...publications].sort(
  (left, right) => (publicationRank.get(left.title) ?? Number.MAX_SAFE_INTEGER) - (publicationRank.get(right.title) ?? Number.MAX_SAFE_INTEGER),
);

const requestedPublicationLimit = Number(document.documentElement.dataset.publicationLimit);
const visiblePublications = Number.isInteger(requestedPublicationLimit) && requestedPublicationLimit > 0
  ? orderedPublications.slice(0, requestedPublicationLimit)
  : orderedPublications;

const publicationList = document.querySelector("#publication-list");
const resultCount = document.querySelector("#result-count");
const searchInput = document.querySelector("#publication-search");
const studentList = document.querySelector("#student-list");
const filterButtons = document.querySelectorAll("[data-filter]");
const progressBar = document.querySelector("#scroll-progress");
const themeToggle = document.querySelector(".theme-toggle");
const menuToggle = document.querySelector(".menu-toggle");
const mobileNavigation = document.querySelector("#mobile-navigation");

let activeFilter = "all";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderPublication(publication) {
  const link = publication.href
    ? `<a class="publication-link" href="${escapeHtml(publication.href)}" target="_blank" rel="noreferrer">Read paper <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 15 15 5M7 5h8v8"></path></svg></a>`
    : "";

  return `
    <article class="publication-card">
      <div class="publication-year">${escapeHtml(publication.year)}</div>
      <div>
        <h3 class="publication-title">${escapeHtml(publication.title)}</h3>
        <p class="publication-authors">${escapeHtml(publication.authors)}</p>
        <div class="publication-venue">${escapeHtml(publication.venue)}</div>
        ${link}
      </div>
      <span class="publication-tag">${escapeHtml(publication.category)}</span>
    </article>
  `;
}

function renderStudent(student) {
  return `
    <div class="student-row">
      <a class="student-name" href="${escapeHtml(student.href)}" target="_blank" rel="noreferrer">${escapeHtml(student.name)}</a>
      <span class="student-meta">${escapeHtml(student.year)} · ${escapeHtml(student.degree)}</span>
    </div>
  `;
}

function renderStudents() {
  if (!studentList) return;

  const groups = [
    { label: "Doctoral Students", items: students.doctoral },
    { label: "Master Students", items: students.master },
  ];

  studentList.innerHTML = groups
    .map(
      (group) => `
        <div class="student-group">
          <div class="student-role">${escapeHtml(group.label)}</div>
          <div class="student-items">${group.items.map(renderStudent).join("")}</div>
        </div>
      `,
    )
    .join("");
}

function renderPublications() {
  if (!publicationList || !resultCount) return;

  const query = (searchInput?.value || "").trim().toLowerCase();
  const filtered = visiblePublications.filter((publication) => {
    const matchesFilter = activeFilter === "all" || publication.category === activeFilter;
    const searchable = `${publication.title} ${publication.authors} ${publication.venue} ${publication.category}`.toLowerCase();
    return matchesFilter && searchable.includes(query);
  });

  resultCount.textContent = `${filtered.length} selected publications`;
  publicationList.innerHTML = filtered.length
    ? filtered.map(renderPublication).join("")
    : '<p class="empty-state">No publications match that search. Try another keyword or topic.</p>';
}

function updateActiveFilter(nextFilter) {
  activeFilter = nextFilter;
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === nextFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  renderPublications();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => updateActiveFilter(button.dataset.filter));
});

searchInput?.addEventListener("input", renderPublications);
updateActiveFilter("all");
renderStudents();

function updateScrollProgress() {
  if (!progressBar) return;
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  progressBar.style.width = `${Math.min(progress, 100)}%`;
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });
updateScrollProgress();

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("ml-theme", theme);
  } catch {
    // Storage can be unavailable in privacy-restricted contexts.
  }
  themeToggle?.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
}

setTheme("light");

themeToggle?.addEventListener("click", () => {
  setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
});

function closeMobileNavigation() {
  if (!mobileNavigation || !menuToggle) return;
  mobileNavigation.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
}

menuToggle?.addEventListener("click", () => {
  const isOpen = mobileNavigation.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

mobileNavigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMobileNavigation);
});

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const sections = document.querySelectorAll("main section[id]");
const navigationLinks = document.querySelectorAll(".desktop-nav .nav-link");
if ("IntersectionObserver" in window && sections.length && navigationLinks.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navigationLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-35% 0px -55%", threshold: 0 },
  );
  sections.forEach((section) => sectionObserver.observe(section));
}

const currentYear = document.querySelector("#current-year");
if (currentYear) currentYear.textContent = new Date().getFullYear();
