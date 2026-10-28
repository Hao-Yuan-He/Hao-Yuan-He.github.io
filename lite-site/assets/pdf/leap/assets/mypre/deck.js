(function () {
  "use strict";
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  /* Preview embeds (?mypre-embed=1) are real decks shown inside a presenter
     card: they follow the hash, but they must never own keyboard focus, spawn
     their own presenter window or show audience chrome. */
  var embed = /(^|[?&])mypre-embed=1(&|$)/.test(window.location.search);
  if (embed) document.documentElement.setAttribute("data-mypre-embed", "");
  var current = 0;
  var currentStep = 1;
  var counter = document.querySelector("[data-mypre-counter]");
  // Per-slide ordinals also keep offscreen previews and visual snapshots correct.
  slides.forEach(function (slide, i) {
    slide.style.setProperty("--mypre-slide-number", String(i + 1));
  });

  /* ------------------------------------------------------------ reveal steps */

  function stepsOf(slide) {
    var value = Number.parseInt(slide && slide.getAttribute("data-steps") || "1", 10);
    return Number.isInteger(value) && value > 1 ? value : 1;
  }

  /* Show the blocks of steps 1..step; a step-only block only in its own step.
     Pure DOM state, also used by the layout runtime and checks to measure
     every step without painting. Revealed blocks appear at once, unanimated. */
  function applyStep(slide, step) {
    var total = stepsOf(slide);
    if (total === 1) return 1;
    step = Math.max(1, Math.min(total, step));
    var blocks = slide.querySelectorAll(".block[data-step]");
    for (var i = 0; i < blocks.length; i += 1) {
      var block = blocks[i];
      var own = Number.parseInt(block.getAttribute("data-step"), 10);
      var visible = block.hasAttribute("data-step-only") ? own === step : own <= step;
      block.classList.toggle("is-step-hidden", !visible);
    }
    slide.setAttribute("data-step-current", String(step));
    return step;
  }

  function stepOf(slide) {
    var value = Number.parseInt(slide.getAttribute("data-step-current") || "1", 10);
    return Number.isInteger(value) && value >= 1 ? value : 1;
  }

  slides.forEach(function (slide) { applyStep(slide, 1); });

  window.__mypreSteps = {
    count: stepsOf,
    current: stepOf,
    apply: function (slide, step) { return applyStep(slide, step); }
  };

  function clamp(index) {
    return Math.max(0, Math.min(slides.length - 1, index));
  }

  /* The page-change fade is keyed to a short-lived marker set only when the
     slide changes. A block that a reveal step later un-hides starts rendering
     anew, which would replay any block animation; without the marker it does
     not, so stepping within a slide never flashes. */
  var enteringTimer = null;
  function markEntering(slide) {
    slides.forEach(function (other) { other.removeAttribute("data-mypre-entering"); });
    slide.setAttribute("data-mypre-entering", "");
    if (enteringTimer !== null) window.clearTimeout(enteringTimer);
    enteringTimer = window.setTimeout(function () {
      enteringTimer = null;
      slide.removeAttribute("data-mypre-entering");
    }, 250);
  }

  function show(index, updateHash, step) {
    if (slides.length === 0) return;
    var previous = current;
    current = clamp(index);
    var slide = slides[current];
    currentStep = applyStep(slide, typeof step === "number" ? step : 1);
    if (previous !== current) markEntering(slide);
    // Read-only navigation state for CSS themes; shared by every navigation path.
    document.documentElement.style.setProperty("--mypre-slide-number", String(current + 1));
    document.documentElement.style.setProperty("--mypre-slide-count", String(slides.length));
    slides.forEach(function (other, i) {
      other.classList.toggle("is-active", i === current);
      if (i === current && previous !== current) other.scrollTop = 0;
    });
    var layout = window.__mypreLayout;
    if (previous !== current || !settledOnce) {
      settledOnce = true;
      if (layout && typeof layout.settleSlide === "function") layout.settleSlide(slide);
    }
    if (counter) counter.textContent = (current + 1) + " / " + slides.length;
    if (updateHash) {
      var id = slide.id || "slide-" + (current + 1);
      if (window.location.hash !== "#" + id) history.replaceState(null, "", "#" + id);
    }
    try {
      window.dispatchEvent(new CustomEvent("mypre:slide", {
        detail: { index: current, count: slides.length, step: currentStep, steps: stepsOf(slide) }
      }));
    } catch (error) { /* non-fatal: playback also polls on connect */ }
  }
  var settledOnce = false;

  /* Next reveals the slide's next step before leaving it; previous steps back
     and enters the previous slide at its final state, so it never replays. */
  function next() {
    if (currentStep < stepsOf(slides[current])) show(current, true, currentStep + 1);
    else if (current < slides.length - 1) show(current + 1, true, 1);
  }

  function prev() {
    if (currentStep > 1) show(current, true, currentStep - 1);
    else if (current > 0) show(current - 1, true, stepsOf(slides[current - 1]));
  }

  /* Small stable navigation surface so the playback runtime (and tests) reuse
     this navigator instead of duplicating keyboard and listener state. */
  window.__mypreDeck = {
    embed: embed,
    index: function () { return current; },
    count: function () { return slides.length; },
    step: function () { return currentStep; },
    steps: function () { return slides.map(stepsOf); },
    ids: function () { return slides.map(function (slide) { return slide.id || ""; }); },
    labels: function () {
      return slides.map(function (slide) { return slide.getAttribute("aria-label") || ""; });
    },
    /* Defensive: the navigator is shared, so it refuses anything that is not a
       real slide index instead of corrupting the active-slide state. A step is
       optional and clamped to the slide's own range. */
    show: function (index, step) {
      if (typeof index !== "number" || !isFinite(index) || Math.floor(index) !== index) return;
      if (index < 0 || index >= slides.length) return;
      var target = typeof step === "number" && isFinite(step) && Math.floor(step) === step ? step : 1;
      show(index, true, target);
    },
    next: next,
    prev: prev
  };

  /* '#slide-6' opens step 1; '#slide-6/2' (written only by presenter previews)
     opens step 2. The address bar itself stays slide-level. */
  var hashStep = 1;
  function fromHash() {
    var raw = window.location.hash.replace(/^#/, "");
    if (!raw) return;
    var parts = decodeURIComponent(raw).split("/");
    var index = slides.findIndex(function (slide) { return slide.id === parts[0]; });
    if (index < 0) return;
    current = index;
    var step = parts.length > 1 ? Number.parseInt(parts[1], 10) : 1;
    hashStep = Number.isInteger(step) && step >= 1 ? step : 1;
  }

  document.addEventListener("keydown", function (event) {
    if (embed) return;
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    var target = event.target;
    // Editable and dropdown controls keep every key, including the arrows.
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT")) return;
    if (target && target.isContentEditable) return;
    // Space and Enter belong to a focused control, not to slide navigation.
    // Arrow keys stay navigation even while a control has focus.
    if (event.key === " " || event.key === "Enter") {
      if (target && (target.tagName === "BUTTON" || target.tagName === "A" || target.tagName === "SELECT")) return;
    }
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
      case " ":
        next(); event.preventDefault(); break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        prev(); event.preventDefault(); break;
      case "Home": show(0, true, 1); event.preventDefault(); break;
      case "End": show(slides.length - 1, true, stepsOf(slides[slides.length - 1])); event.preventDefault(); break;
      default: break;
    }
  });

  window.addEventListener("hashchange", function () {
    var before = current;
    fromHash();
    var index = current;
    current = before;
    show(index, false, hashStep);
  });

  var prevButton = document.querySelector("[data-mypre-prev]");
  var nextButton = document.querySelector("[data-mypre-next]");
  if (prevButton) prevButton.addEventListener("click", prev);
  if (nextButton) nextButton.addEventListener("click", next);

  var initial = current;
  fromHash();
  var target = current;
  current = initial;
  show(target, false, hashStep);
})();
/**
 * Adaptive spacing runtime (opt-in).
 *
 * A presentation enables it with '--mypre-adaptive: 1' in its own stylesheet.
 * For every slide the runtime measures the actually rendered content (text,
 * formulas, images and grids included) and writes one number, '--mypre-space'
 * in [0, 1], on that slide. tokens.css turns that number into the effective
 * body leading and gap scale, so dense slides get restrained spacing and
 * sparse slides get comfortable spacing without any font, image or content
 * change. The search is a bounded binary search, restarted from scratch on
 * every pass, so repeated settles never compound.
 *
 * Readiness contract, usable by tests and 'mypre check --visual':
 *   window.__mypreLayout.state              "off" | "pending" | "settled"
 *   window.__mypreLayout.ready              Promise, resolves once settled
 *   window.__mypreLayout.settle()           force a re-settle, returns ready
 *   window.__mypreLayout.spaceFor(slide)    current --mypre-space of a slide
 *   window.__mypreLayout.settleSlide(slide) re-settle one slide
 *   document.documentElement data-mypre-spacing = "pending" | "settled"
 *   window event "mypre:spacing"            detail = { state }
 */
(function () {
  "use strict";
  var root = document.documentElement;
  function readNumber(name) {
    var raw = getComputedStyle(root).getPropertyValue(name).trim();
    var value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : null;
  }
  var flag = getComputedStyle(root).getPropertyValue("--mypre-adaptive").trim();
  var flagNumber = Number.parseFloat(flag);
  var enabled = flag !== "" && !(Number.isFinite(flagNumber) && flagNumber <= 0);
  if (!enabled) {
    window.__mypreLayout = {
      state: "off",
      ready: Promise.resolve(),
      settle: function () { return Promise.resolve(); },
      settleSlide: function () {},
      spaceFor: function () { return null; }
    };
    return;
  }

  // The public tokens stay authored CSS: validate and clamp them into private
  // '--mypre-resolved-*' values, never write back to the author's tokens, and
  // re-resolve on every settle so media queries keep their authority.
  root.style.setProperty("--mypre-resolved-adaptive", "1");
  var fillTarget = 1;
  function resolveBounds() {
    function resolve(source, target, fallback, lo, hi) {
      var value = readNumber(source);
      if (value === null) value = fallback;
      value = Math.min(hi, Math.max(lo, value));
      root.style.setProperty(target, String(value));
      return value;
    }
    var leadingMin = resolve("--mypre-leading-min", "--mypre-resolved-leading-min", 1.3, 1, 2.5);
    resolve("--mypre-leading-max", "--mypre-resolved-leading-max", 1.65, leadingMin, 3);
    var gapMin = resolve("--mypre-gap-scale-min", "--mypre-resolved-gap-min", 0.9, 0.5, 2.5);
    resolve("--mypre-gap-scale-max", "--mypre-resolved-gap-max", 1.5, gapMin, 3);
    fillTarget = resolve("--mypre-fill-target", "--mypre-resolved-fill-target", 1, 0.5, 1);
  }
  resolveBounds();

  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var settled = false;
  var readyResolve;
  var readyPromise = new Promise(function (resolve) { readyResolve = resolve; });
  window.__mypreLayout = {
    state: "pending",
    ready: readyPromise,
    settle: function () { settleAll(); finish(); return readyPromise; },
    settleSlide: function (slide) { if (slide) settleSlide(slide); },
    spaceFor: function (slide) {
      if (!slide) return null;
      var value = Number.parseFloat(slide.style.getPropertyValue("--mypre-space"));
      return Number.isFinite(value) ? value : null;
    }
  };

  function contentOf(slide) { return slide.querySelector(":scope > .slide__content"); }

  /* Bounding box of the direct children: the actually used content, so a
     centred min-height:100% container reads as sparse rather than full. */
  function usedHeight(content) {
    var top = Infinity;
    var bottom = -Infinity;
    var children = content.children;
    for (var i = 0; i < children.length; i += 1) {
      var rect = children[i].getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (rect.top < top) top = rect.top;
      if (rect.bottom > bottom) bottom = rect.bottom;
    }
    return bottom > top ? bottom - top : 0;
  }

  /* Acceptable spacing: the slide must not overflow (the same signal the
     checker reports, so layout and diagnostics cannot disagree) and, when a
     comfort target below 1 is configured, the used content must stay within
     that share of the usable frame. */
  function fits(slide) {
    if (slide.clientHeight === 0) return true; /* not laid out (display: none) */
    if (slide.scrollHeight > slide.clientHeight + 0.5) return false;
    if (fillTarget >= 1) return true;
    var content = contentOf(slide);
    if (!content) return true;
    var styles = getComputedStyle(slide);
    var available = slide.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
    return usedHeight(content) <= available * fillTarget + 0.5;
  }

  function setSpace(slide, space) {
    slide.style.setProperty("--mypre-space", String(space));
  }

  /* A slide with reveal steps keeps one spacing for all its steps, so text does
     not re-space as the speaker steps through it: the spacing must fit every
     step state. States are switched synchronously and restored, never painted. */
  function fitsAllSteps(slide) {
    var steps = window.__mypreSteps;
    var total = steps ? steps.count(slide) : 1;
    if (total <= 1) return fits(slide);
    var shown = steps.current(slide);
    var ok = true;
    for (var step = 1; step <= total && ok; step += 1) {
      steps.apply(slide, step);
      ok = fits(slide);
    }
    steps.apply(slide, shown);
    return ok;
  }

  /* Largest spacing that still fits: 1 when everything fits at the loosest
     bound, 0 when even the tightest bound overflows (which the checker then
     reports honestly instead of hiding content). */
  function settleSlide(slide) {
    if (!contentOf(slide)) return;
    setSpace(slide, 1);
    if (fitsAllSteps(slide)) { setSpace(slide, 1); return; }
    setSpace(slide, 0);
    if (!fitsAllSteps(slide)) { setSpace(slide, 0); return; }
    var lo = 0;
    var hi = 1;
    for (var i = 0; i < 8; i += 1) {
      var mid = (lo + hi) / 2;
      setSpace(slide, mid);
      if (fitsAllSteps(slide)) lo = mid;
      else hi = mid;
    }
    setSpace(slide, Math.round(lo * 1000) / 1000);
  }

  /* Measure every slide by briefly activating it. The class toggling is
     synchronous, so the browser never paints an intermediate state. */
  function settleAll() {
    resolveBounds();
    var i;
    var previousActive = null;
    for (i = 0; i < slides.length; i += 1) {
      if (slides[i].classList.contains("is-active")) previousActive = slides[i];
    }
    for (i = 0; i < slides.length; i += 1) {
      var slide = slides[i];
      var wasActive = slide.classList.contains("is-active");
      if (!wasActive) slide.classList.add("is-active");
      settleSlide(slide);
      if (!wasActive) slide.classList.remove("is-active");
    }
    if (previousActive) previousActive.classList.add("is-active");
  }

  function finish() {
    if (settled) return;
    settled = true;
    window.__mypreLayout.state = "settled";
    root.setAttribute("data-mypre-spacing", "settled");
    // Set once the first pass has completed. Later passes may flip the spacing
    // attribute back to 'pending' (so waiters can observe them) without hiding
    // the deck again.
    root.setAttribute("data-mypre-ready", "");
    try { window.dispatchEvent(new CustomEvent("mypre:spacing", { detail: { state: "settled" } })); } catch (error) {}
    readyResolve();
  }

  root.setAttribute("data-mypre-spacing", "pending");
  settleAll();
  var fallback = window.setTimeout(function () { settleAll(); finish(); }, 2500);

  function whenFontsReady() {
    return document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  }
  function whenImagesReady() {
    return Promise.all(Array.prototype.slice.call(document.images).map(function (image) {
      if (image.complete) return Promise.resolve();
      return new Promise(function (resolve) {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }));
  }
  Promise.all([whenFontsReady(), whenImagesReady()]).then(function () {
    window.clearTimeout(fallback);
    settleAll();
    finish();
  });

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    // Mark the layout as pending synchronously so a waiter sees the resize and
    // can await the re-settle; the deck stays visible because the first pass
    // already set data-mypre-ready.
    root.setAttribute("data-mypre-spacing", "pending");
    window.__mypreLayout.state = "pending";
    if (resizeTimer !== null) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      resizeTimer = null;
      settleAll();
      root.setAttribute("data-mypre-spacing", "settled");
      window.__mypreLayout.state = "settled";
      try { window.dispatchEvent(new CustomEvent("mypre:spacing", { detail: { state: window.__mypreLayout.state } })); } catch (error) {}
    }, 120);
  });
})();
(function () {
  "use strict";
  var deck = window.__mypreDeck;
  if (!deck || deck.embed) return;

  var VERSION = 1;
  var PRESENTER_PAGE = "presenter.html";
  var SESSION_RE = /^[0-9a-f]{32}$/;
  /* Kept below the presenter's per-label limit (400) with headroom, so every
     label this document can produce passes the receiver's schema. */
  var LABEL_SEND_LIMIT = 160;
  var IDLE_MS = 2500;
  /* A warning is held open so it can be read, but only for this long: an old
     message must never pin the bar for the rest of the talk. */
  var MESSAGE_MS = 10000;
  /* Reveal band at the bottom of the window. Only this edge is a reveal
     gesture: pointer noise over the slide, the wheel and ordinary navigation
     keys must leave the bar alone. */
  var EDGE_BAND = 96;
  var CLOSE_POLL_MS = 1000;
  var RESYNC_MS = [400, 1500];

  var doc = document;
  var root = doc.documentElement;
  var origin = window.location.origin;
  var fileProtocol = window.location.protocol === "file:";
  var fullscreenButton = doc.querySelector("[data-mypre-fullscreen]");
  var presenterButton = doc.querySelector("[data-mypre-presenter]");
  var status = doc.querySelector("[data-mypre-playback-status]");
  var controls = doc.querySelector(".controls");

  /* Presentation-local chrome lives outside the deck, so hiding it never
     touches slide content or the deck's own layout. */
  /* Ordinary status never opens the bar: a successful shortcut or navigation
     must not flash chrome. A warning or error does, and holds it open until it
     is replaced, so a blocked pop-up or a refused fullscreen is actually
     readable. */
  function announce(message, tone) {
    if (!status) return;
    if (messageTimer !== null) {
      window.clearTimeout(messageTimer);
      messageTimer = null;
    }
    status.textContent = message || "";
    if (message) status.setAttribute("data-tone", tone || "info");
    status.hidden = !message;
    chromeHold = Boolean(message) && (tone || "info") !== "info";
    if (chromeHold) {
      // Readable, but bounded: once it clears, the bar can go quiet again.
      messageTimer = window.setTimeout(function () {
        messageTimer = null;
        announce("", "info");
      }, MESSAGE_MS);
      revealChrome();
    } else {
      scheduleIdle();
    }
  }

  /* A warning has served its purpose as soon as the action it complained about
     succeeds, so the next successful attempt takes it down. */
  function clearWarning() {
    if (chromeHold) announce("", "info");
  }

  function newSession() {
    var bytes = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (var i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    var hex = "";
    for (var j = 0; j < bytes.length; j += 1) hex += (bytes[j] + 256).toString(16).slice(1);
    return hex;
  }

  var session = newSession();
  var presenter = null;
  var presenterLive = false;
  var resync = [];

  /* ------------------------------------------------------------- fullscreen */

  function fullscreenSupported() {
    var supported = Boolean(
      doc.documentElement.requestFullscreen || doc.documentElement.webkitRequestFullscreen
    );
    if (doc.fullscreenEnabled === false) supported = false;
    if (doc.webkitFullscreenEnabled === false) supported = false;
    return supported;
  }

  function fullscreenElement() {
    return doc.fullscreenElement || doc.webkitFullscreenElement || null;
  }

  function describe(error) {
    var message = error && error.message ? String(error.message) : "";
    return message.length > 90 ? message.slice(0, 90) : message;
  }

  function enterFullscreen() {
    var request = doc.documentElement.requestFullscreen || doc.documentElement.webkitRequestFullscreen;
    if (!request) {
      announce("Fullscreen is not available in this browser.", "warn");
      return;
    }
    try {
      var result = request.call(doc.documentElement);
      if (result && typeof result.catch === "function") {
        result.catch(function (error) {
          announce("Fullscreen was refused: " + (describe(error) || "not allowed") + ".", "warn");
        });
      }
    } catch (error) {
      announce("Fullscreen was refused: " + (describe(error) || "not allowed") + ".", "warn");
    }
  }

  function exitFullscreen() {
    var exit = doc.exitFullscreen || doc.webkitExitFullscreen;
    if (!exit) return;
    try {
      var result = exit.call(doc);
      if (result && typeof result.catch === "function") {
        result.catch(function (error) {
          announce("Could not leave fullscreen: " + (describe(error) || "unknown reason") + ".", "warn");
        });
      }
    } catch (error) {
      announce("Could not leave fullscreen: " + (describe(error) || "unknown reason") + ".", "warn");
    }
  }

  function toggleFullscreen() {
    if (fullscreenElement()) exitFullscreen();
    else enterFullscreen();
  }

  function reflectFullscreen() {
    // Entering or leaving fullscreen succeeded, so a previous refusal message
    // is stale. It must not keep the bar open for the rest of the talk.
    clearWarning();
    var active = Boolean(fullscreenElement());
    if (fullscreenButton) {
      var supported = fullscreenSupported();
      fullscreenButton.setAttribute("aria-pressed", active ? "true" : "false");
      fullscreenButton.textContent = active ? "Exit fullscreen" : "Fullscreen";
      fullscreenButton.disabled = !supported;
      if (supported) fullscreenButton.removeAttribute("title");
      else fullscreenButton.setAttribute("title", "Fullscreen is not available in this browser");
    }
    scheduleIdle();
  }

  /* ------------------------------------------- audience chrome (hidden first) */

  var idleTimer = null;
  var messageTimer = null;
  /* Set while a warning or error is on screen: a message the audience needs to
     read must not fade out with the rest of the chrome. */
  var chromeHold = false;

  /* Only keyboard focus pins the bar. A control the audience just clicked keeps
     DOM focus but is not :focus-visible, so the bar still steps aside. */
  function controlsHaveFocus() {
    var active = doc.activeElement;
    if (!controls || !active || active === doc.body || !controls.contains(active)) return false;
    try {
      return active.matches(":focus-visible");
    } catch (error) {
      return true;
    }
  }

  function chromeVisible() {
    return !root.hasAttribute("data-mypre-chrome");
  }

  function showChrome() {
    if (chromeVisible()) return;
    root.removeAttribute("data-mypre-chrome");
  }

  function hideChrome() {
    if (chromeHold || controlsHaveFocus()) return;
    root.setAttribute("data-mypre-chrome", "hidden");
  }

  function scheduleIdle() {
    if (idleTimer !== null) window.clearTimeout(idleTimer);
    idleTimer = null;
    if (chromeHold || controlsHaveFocus()) return;
    idleTimer = window.setTimeout(function () {
      idleTimer = null;
      hideChrome();
    }, IDLE_MS);
  }

  function revealChrome() {
    showChrome();
    scheduleIdle();
  }

  /* The bottom band is the intentional reveal area, for pointer and touch. */
  function atBottomEdge(event) {
    var height = window.innerHeight || root.clientHeight || 0;
    var y = null;
    if (event && typeof event.clientY === "number") y = event.clientY;
    else if (event && event.touches && event.touches.length > 0) y = event.touches[0].clientY;
    else if (event && event.changedTouches && event.changedTouches.length > 0) {
      y = event.changedTouches[0].clientY;
    }
    return y !== null && y >= height - EDGE_BAND;
  }

  function onEdgePointer(event) {
    if (atBottomEdge(event)) revealChrome();
  }

  ["pointermove", "pointerdown", "touchstart", "touchmove"].forEach(function (name) {
    doc.addEventListener(name, onEdgePointer, { passive: true });
  });

  /* Tabbing into the controls both reveals and holds them. */
  doc.addEventListener("focusin", function (event) {
    if (controls && controls.contains(event.target)) revealChrome();
    else scheduleIdle();
  });
  doc.addEventListener("focusout", scheduleIdle);
  doc.addEventListener("fullscreenchange", reflectFullscreen);
  doc.addEventListener("webkitfullscreenchange", reflectFullscreen);

  /* --------------------------------------------------------------- presenter */

  function post(message) {
    if (!presenter) return false;
    try {
      presenter.postMessage(message, "*");
      return true;
    } catch (error) {
      return false;
    }
  }

  /* Preview captions are auxiliary: they are capped here, at the sender, so a
     presentation with an unusually long heading still connects. The heading
     text on the slides themselves is never truncated. */
  function previewLabel(label) {
    var text = typeof label === "string" ? label : "";
    if (text.length <= LABEL_SEND_LIMIT) return text;
    var bounded = text.slice(0, LABEL_SEND_LIMIT);
    // Never leave a lone surrogate behind when cutting a long label.
    if (/[\uD800-\uDBFF]$/.test(bounded)) bounded = bounded.slice(0, -1);
    return bounded;
  }

  function stateMessage() {
    return {
      v: VERSION,
      session: session,
      type: "state",
      index: deck.index(),
      count: deck.count(),
      ids: deck.ids(),
      labels: deck.labels().map(previewLabel),
      step: deck.step(),
      steps: deck.steps()
    };
  }

  function sendState() {
    if (post(stateMessage())) presenterLive = true;
    reflectPresenter();
  }

  function clearResync() {
    resync.forEach(function (handle) { window.clearTimeout(handle); });
    resync = [];
  }

  /* One presenter window per audience session: two decks on the same opaque
     file origin can never retarget each other's window by name. */
  function presenterWindowName() {
    return "mypre-presenter-" + session;
  }

  function openPresenter() {
    if (presenter && !presenterIsClosed()) {
      // Already live: focus and resync. Re-opening it would reload the window
      // and throw away the presenter's timer and previews.
      try { presenter.focus(); } catch (error) { /* focus is best effort */ }
      sendState();
      announce("Presenter window focused.", "info");
      reflectPresenter();
      return;
    }
    var target;
    try {
      target = new URL(PRESENTER_PAGE, window.location.href);
    } catch (error) {
      announce("Could not build the presenter address.", "warn");
      return;
    }
    target.hash = "session=" + session + "&index=" + deck.index();
    var win = null;
    try {
      win = window.open(target.href, presenterWindowName(), "popup=yes,width=1200,height=820");
    } catch (error) {
      win = null;
    }
    if (!win) {
      announce("The presenter window was blocked. Allow pop-ups for this file, then try again.", "warn");
      return;
    }
    presenter = win;
    presenterLive = false;
    announce(
      "Presenter window opened. Keep it on your screen, move the audience window to the projector, then press F.", "info"
    );
    try { win.focus(); } catch (error) { /* focus is best effort */ }
    clearResync();
    /* The presenter announces itself once its runtime is live. These retries
       also cover a reused window whose document did not reload. */
    resync = RESYNC_MS.map(function (delay) { return window.setTimeout(sendState, delay); });
    reflectPresenter();
  }

  function presenterIsClosed() {
    if (!presenter) return true;
    try {
      return presenter.closed === true;
    } catch (error) {
      return true;
    }
  }

  function reflectPresenter() {
    if (!presenterButton) return;
    var open = Boolean(presenter) && !presenterIsClosed();
    presenterButton.setAttribute("aria-pressed", open ? "true" : "false");
    presenterButton.textContent = open ? "Focus presenter" : "Presenter";
  }

  window.setInterval(function () {
    if (presenter && presenterIsClosed()) {
      presenter = null;
      presenterLive = false;
      clearResync();
      announce("Presenter window closed.", "info");
      reflectPresenter();
    }
  }, CLOSE_POLL_MS);

  /* ---------------------------------------------------------------- messages */

  function originAcceptable(source) {
    if (source === origin) return true;
    return fileProtocol && source === "null";
  }

  /* Only the window this document opened may drive it, and only with the
     session token minted for this page load. */
  function accept(event) {
    if (!presenter || event.source !== presenter) return null;
    if (!originAcceptable(event.origin)) return null;
    var data = event.data;
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    if (data.v !== VERSION) return null;
    if (typeof data.session !== "string" || !SESSION_RE.test(data.session) || data.session !== session) {
      return null;
    }
    if (typeof data.type !== "string" || data.type.length > 32) return null;
    var hasIndex = Object.prototype.hasOwnProperty.call(data, "index");
    if (hasIndex) {
      if (typeof data.index !== "number" || !isFinite(data.index) || Math.floor(data.index) !== data.index) {
        return null;
      }
    }
    // A navigation request without a usable index is dropped here rather than
    // reaching the navigator as NaN.
    if (data.type === "goto" && !hasIndex) return null;
    return data;
  }

  window.addEventListener("message", function (event) {
    var data = accept(event);
    if (!data) return;
    if (data.type === "presenter-hello") {
      clearResync();
      sendState();
      return;
    }
    if (data.type === "ping") {
      if (post({ v: VERSION, session: session, type: "pong" })) presenterLive = true;
      return;
    }
    if (data.type === "goto") {
      if (!Number.isInteger(data.index)) return;
      if (data.index < 0 || data.index >= deck.count()) return;
      deck.show(data.index);
      return;
    }
    if (data.type === "next") { deck.next(); return; }
    if (data.type === "prev") { deck.prev(); }
  });

  window.addEventListener("mypre:slide", sendState);

  function farewell() {
    if (!presenter) return;
    post({ v: VERSION, session: session, type: "bye" });
    presenter = null;
    presenterLive = false;
  }
  window.addEventListener("pagehide", farewell);
  window.addEventListener("beforeunload", farewell);

  /* --------------------------------------------------------------- shortcuts */

  function isTyping(target) {
    if (!target || target.nodeType !== 1) return false;
    var tag = target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    return target.isContentEditable === true;
  }

  doc.addEventListener("keydown", function (event) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    if (isTyping(event.target)) return;
    if (event.key === "f" || event.key === "F") {
      toggleFullscreen();
      event.preventDefault();
      return;
    }
    if (event.key === "p" || event.key === "P") {
      openPresenter();
      event.preventDefault();
    }
  });

  if (fullscreenButton) fullscreenButton.addEventListener("click", toggleFullscreen);
  if (presenterButton) presenterButton.addEventListener("click", openPresenter);

  reflectFullscreen();
  reflectPresenter();

  /* Small, stable surface for independent playback tests: it exposes state and
     the same actions the visible controls perform, never a private back door. */
  window.__myprePlayback = {
    version: VERSION,
    session: session,
    fullscreenSupported: fullscreenSupported(),
    state: function () {
      return {
        index: deck.index(),
        count: deck.count(),
        step: deck.step(),
        presenter: Boolean(presenter) && !presenterIsClosed(),
        connected: presenterLive,
        fullscreen: Boolean(fullscreenElement()),
        chrome: root.getAttribute("data-mypre-chrome") || "shown",
        message: status ? status.textContent || "" : ""
      };
    },
    openPresenter: openPresenter,
    closePresenter: function () { if (presenter) { try { presenter.close(); } catch (error) { /* already gone */ } } },
    toggleFullscreen: toggleFullscreen
  };
})();
