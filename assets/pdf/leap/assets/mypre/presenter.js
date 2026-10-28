(function () {
  "use strict";
  var VERSION = 1;
  var REF_WIDTH = 1512;
  var REF_HEIGHT = 850;
  var SESSION_RE = /^[0-9a-f]{32}$/;
  var PING_MS = 2000;
  var STALE_MS = 8000;
  var CONNECT_MS = 5000;
  var MAX_SLIDES = 10000;

  var doc = document;
  var body = doc.body;
  var origin = window.location.origin;
  var fileProtocol = window.location.protocol === "file:";
  var audience = window.opener || null;

  var clock = doc.querySelector("[data-presenter-clock]");
  var status = doc.querySelector("[data-presenter-status]");
  var counter = doc.querySelector("[data-presenter-counter]");
  var prevButton = doc.querySelector("[data-presenter-prev]");
  var nextButton = doc.querySelector("[data-presenter-next]");
  var startButton = doc.querySelector("[data-presenter-start]");
  var pauseButton = doc.querySelector("[data-presenter-pause]");
  var resetButton = doc.querySelector("[data-presenter-reset]");
  var currentFrame = doc.querySelector("[data-presenter-current-frame]");
  var nextFrame = doc.querySelector("[data-presenter-next-frame]");
  var currentLabel = doc.querySelector("[data-presenter-current-label]");
  var nextLabel = doc.querySelector("[data-presenter-next-label]");
  var endPlaceholder = doc.querySelector("[data-presenter-end]");
  var notice = doc.querySelector("[data-presenter-notice]");

  /* --------------------------------------------------------------- session */

  function readFragment() {
    var raw = window.location.hash.replace(/^#/, "");
    var params = new URLSearchParams(raw);
    var session = params.get("session") || "";
    var index = Number.parseInt(params.get("index") || "0", 10);
    return {
      session: SESSION_RE.test(session) ? session : "",
      index: Number.isInteger(index) && index >= 0 ? index : 0
    };
  }

  /* A monotonic clock: the talk timer and the liveness checks must not jump
     when the system clock is corrected during a presentation. */
  function monotonic() {
    return window.performance && typeof window.performance.now === "function"
      ? window.performance.now()
      : Date.now();
  }

  var pinned = readFragment();
  var connection = "connecting";
  var connectingSince = 0;
  var index = pinned.index;
  var count = 0;
  var ids = [];
  var labels = [];
  var step = 1;
  var steps = [];
  var lastSeen = 0;

  function stepsAt(at) {
    var value = steps[at];
    return Number.isInteger(value) && value >= 1 ? value : 1;
  }

  function atStart() { return index <= 0 && step <= 1; }
  function atEnd() { return index >= count - 1 && step >= stepsAt(index); }

  /* -------------------------------------------------------------------- UI */

  function setConnection(state, message) {
    connection = state;
    connectingSince = state === "connecting" ? monotonic() : 0;
    body.setAttribute("data-presenter-connection", state);
    if (status) status.textContent = message;
    var usable = state === "connected";
    if (prevButton) prevButton.disabled = !usable || atStart();
    if (nextButton) nextButton.disabled = !usable || atEnd();
    if (notice) notice.hidden = state !== "standalone";
    updateCounter();
  }

  function updateCounter() {
    if (!counter) return;
    counter.textContent = count > 0 ? (index + 1) + " / " + count : "– / –";
  }

  function slideUrl(id, at) {
    var base = new URL("index.html", window.location.href);
    var suffix = Number.isInteger(at) && at > 1 ? "/" + at : "";
    return base.href + "?mypre-embed=1#" + encodeURIComponent(id) + suffix;
  }

  /* Preview frames load the compiled deck at its reference viewport and are
     scaled down as a whole, so nothing is re-laid-out or clipped. Only the
     fragment changes between slides, which the deck follows in place. */
  function setFrame(frame, id, at) {
    if (!frame || !id) return;
    var target = slideUrl(id, at);
    if (frame.getAttribute("src") !== target) frame.setAttribute("src", target);
  }

  function clearFrame(frame) {
    if (frame) frame.removeAttribute("src");
  }

  function scaleFrames() {
    [currentFrame, nextFrame].forEach(function (frame) {
      if (!frame) return;
      var host = frame.parentElement;
      if (!host) return;
      var scale = Math.min(host.clientWidth / REF_WIDTH, host.clientHeight / REF_HEIGHT);
      if (!isFinite(scale) || scale <= 0) return;
      frame.style.transform = "scale(" + scale + ")";
    });
  }

  if (typeof ResizeObserver === "function") {
    var observer = new ResizeObserver(scaleFrames);
    [currentFrame, nextFrame].forEach(function (frame) {
      if (frame && frame.parentElement) observer.observe(frame.parentElement);
    });
  }
  window.addEventListener("resize", scaleFrames);

  function renderState() {
    updateCounter();
    if (count === 0) return;
    setFrame(currentFrame, ids[index], step);
    if (currentLabel) currentLabel.textContent = labels[index] || "";
    /* The next view is the next reveal step of this slide when there is one,
       otherwise the next slide at its first step. */
    var nextStep = step < stepsAt(index);
    var hasNext = nextStep || index + 1 < count;
    if (endPlaceholder) endPlaceholder.hidden = hasNext;
    if (nextFrame) nextFrame.hidden = !hasNext;
    if (nextStep) {
      setFrame(nextFrame, ids[index], step + 1);
      if (nextLabel) nextLabel.textContent = (labels[index] || "") + " · step " + (step + 1) + "/" + stepsAt(index);
    } else if (hasNext) {
      setFrame(nextFrame, ids[index + 1], 1);
      if (nextLabel) nextLabel.textContent = labels[index + 1] || "";
    } else {
      clearFrame(nextFrame);
      if (nextLabel) nextLabel.textContent = "";
    }
    if (prevButton) prevButton.disabled = connection !== "connected" || atStart();
    if (nextButton) nextButton.disabled = connection !== "connected" || atEnd();
    scaleFrames();
  }

  /* ----------------------------------------------------------------- timer */

  var accumulated = 0;
  var startedAt = null;
  var rendered = "";

  function elapsed() {
    return accumulated + (startedAt === null ? 0 : monotonic() - startedAt);
  }

  function format(ms) {
    var total = Math.max(0, Math.floor(ms / 1000));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var seconds = total % 60;
    var pad = function (value) { return (value < 10 ? "0" : "") + value; };
    return (hours > 0 ? hours + ":" + pad(minutes) : pad(minutes)) + ":" + pad(seconds);
  }

  function renderClock() {
    var text = format(elapsed());
    if (text === rendered) return;
    rendered = text;
    if (clock) clock.textContent = text;
  }

  function reflectTimer() {
    var running = startedAt !== null;
    body.setAttribute("data-presenter-timer", running ? "running" : "paused");
    if (startButton) {
      startButton.setAttribute("aria-pressed", running ? "true" : "false");
      startButton.disabled = running;
    }
    if (pauseButton) {
      pauseButton.setAttribute("aria-pressed", running ? "false" : "true");
      pauseButton.disabled = !running;
    }
    renderClock();
  }

  function startTimer() {
    if (startedAt !== null) return;
    startedAt = monotonic();
    reflectTimer();
  }

  function pauseTimer() {
    if (startedAt === null) return;
    accumulated += monotonic() - startedAt;
    startedAt = null;
    reflectTimer();
  }

  function resetTimer() {
    accumulated = 0;
    startedAt = null;
    rendered = "";
    reflectTimer();
  }

  window.setInterval(renderClock, 250);

  /* -------------------------------------------------------------- messages */

  function post(message) {
    if (!audience) return false;
    try {
      audience.postMessage(message, "*");
      return true;
    } catch (error) {
      return false;
    }
  }

  function originAcceptable(source) {
    if (source === origin) return true;
    return fileProtocol && source === "null";
  }

  function accept(event) {
    if (!audience || event.source !== audience) return null;
    if (!originAcceptable(event.origin)) return null;
    var data = event.data;
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    if (data.v !== VERSION) return null;
    if (typeof data.session !== "string" || data.session !== pinned.session) return null;
    if (typeof data.type !== "string" || data.type.length > 32) return null;
    return data;
  }

  function validState(data) {
    if (!Number.isInteger(data.index) || data.index < 0) return false;
    if (!Number.isInteger(data.count) || data.count < 1 || data.count > MAX_SLIDES) return false;
    if (data.index >= data.count) return false;
    if (!Array.isArray(data.ids) || data.ids.length !== data.count) return false;
    for (var i = 0; i < data.ids.length; i += 1) {
      var id = data.ids[i];
      if (typeof id !== "string" || id.length === 0 || id.length > 200) return false;
    }
    if (data.labels !== undefined && data.labels !== null) {
      // Captions are optional and auxiliary. The audience bounds them at the
      // sender (LABEL_SEND_LIMIT there); this is the outer limit it must stay
      // under, so a long heading never blocks the handshake.
      if (!Array.isArray(data.labels) || data.labels.length !== data.count) return false;
      for (var j = 0; j < data.labels.length; j += 1) {
        if (typeof data.labels[j] !== "string" || data.labels[j].length > 400) return false;
      }
    }
    if (data.steps !== undefined && data.steps !== null) {
      if (!Array.isArray(data.steps) || data.steps.length !== data.count) return false;
      for (var k = 0; k < data.steps.length; k += 1) {
        if (!Number.isInteger(data.steps[k]) || data.steps[k] < 1 || data.steps[k] > 100) return false;
      }
      if (!Number.isInteger(data.step) || data.step < 1 || data.step > data.steps[data.index]) return false;
    }
    return true;
  }

  function hello() {
    if (!audience || !pinned.session) return;
    post({ v: VERSION, session: pinned.session, type: "presenter-hello" });
  }

  window.addEventListener("message", function (event) {
    var data = accept(event);
    if (!data) return;
    if (data.type === "state") {
      // Only a well-formed state proves the audience is there. A malformed or
      // unknown message must never revive a disconnected session.
      if (!validState(data)) return;
      lastSeen = monotonic();
      if (connection !== "connected") setConnection("connected", "Connected to the audience window.");
      index = data.index;
      count = data.count;
      ids = data.ids.slice();
      labels = Array.isArray(data.labels) ? data.labels.slice() : [];
      steps = Array.isArray(data.steps) ? data.steps.slice() : [];
      step = steps.length > 0 ? data.step : 1;
      renderState();
      return;
    }
    if (data.type === "bye") {
      lastSeen = 0;
      setConnection(
        "disconnected",
        "The audience window closed or reloaded. Use Presenter in the deck to reconnect."
      );
      return;
    }
    if (data.type === "pong") {
      // Liveness only, and only for a session a valid state already proved.
      if (connection === "connected") lastSeen = monotonic();
    }
  });

  /* The connection is only ever declared stale while this window is visible, so
     a throttled background tab cannot report a healthy audience as gone. While
     not connected this keeps asking, so a transient loss recovers on its own
     instead of leaving a dead control that claims nothing. */
  window.setInterval(function () {
    if (!audience || !pinned.session) return;
    if (doc.visibilityState !== "visible") return;
    var now = monotonic();
    if (connection === "connected" && now - lastSeen > STALE_MS) {
      setConnection(
        "disconnected",
        "Lost contact with the audience window. Use Presenter in the deck to reconnect."
      );
    } else if (connection === "connecting" && connectingSince > 0 && now - connectingSince > CONNECT_MS) {
      setConnection(
        "disconnected",
        "No answer from the audience window. Use Presenter in the deck to reconnect."
      );
    }
    post({ v: VERSION, session: pinned.session, type: connection === "connected" ? "ping" : "presenter-hello" });
  }, PING_MS);

  doc.addEventListener("visibilitychange", function () {
    if (doc.visibilityState !== "visible") return;
    lastSeen = monotonic();
    hello();
  });

  /* A reused presenter window is re-pointed by the audience, which rewrites
     this fragment; the fragment is therefore the pinned session, and only the
     opener can set it. */
  window.addEventListener("hashchange", function () {
    var next = readFragment();
    if (next.session === pinned.session) return;
    pinned = next;
    count = 0;
    ids = [];
    labels = [];
    steps = [];
    step = 1;
    setConnection("connecting", "Connecting to the audience window…");
    clearFrame(currentFrame);
    clearFrame(nextFrame);
    hello();
  });

  /* ------------------------------------------------------------ navigation */

  function goto(target) {
    if (connection !== "connected") return;
    if (!Number.isInteger(target) || target < 0 || target >= count) return;
    post({ v: VERSION, session: pinned.session, type: "goto", index: target });
  }

  /* Step-aware when the audience reports steps; otherwise plain slide moves. */
  function forward() {
    if (connection !== "connected" || atEnd()) return;
    if (steps.length > 0) post({ v: VERSION, session: pinned.session, type: "next" });
    else goto(index + 1);
  }

  function backward() {
    if (connection !== "connected" || atStart()) return;
    if (steps.length > 0) post({ v: VERSION, session: pinned.session, type: "prev" });
    else goto(index - 1);
  }

  if (prevButton) prevButton.addEventListener("click", backward);
  if (nextButton) nextButton.addEventListener("click", forward);
  if (startButton) startButton.addEventListener("click", startTimer);
  if (pauseButton) pauseButton.addEventListener("click", pauseTimer);
  if (resetButton) resetButton.addEventListener("click", resetTimer);

  doc.addEventListener("keydown", function (event) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    var target = event.target;
    var key = event.key;
    if (target && target.nodeType === 1) {
      var tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;
      // Space and Enter activate the focused control; arrow keys keep navigating.
      if ((key === " " || key === "Enter") && (tag === "BUTTON" || tag === "A")) return;
    }
    switch (key) {
      case "ArrowRight":
      case "ArrowDown":
      case "PageDown":
        forward(); event.preventDefault(); break;
      case "ArrowLeft":
      case "ArrowUp":
      case "PageUp":
        backward(); event.preventDefault(); break;
      case "Home": goto(0); event.preventDefault(); break;
      case "End": goto(count - 1); event.preventDefault(); break;
      default: break;
    }
  });

  /* ------------------------------------------------------------------ boot */

  if (!audience) {
    setConnection("standalone", "No audience window: this page only works when the deck opens it.");
  } else if (!pinned.session) {
    setConnection("standalone", "Missing session: use Presenter in the deck to open this window.");
  } else {
    setConnection("connecting", "Connecting to the audience window…");
    hello();
  }
  reflectTimer();
  scaleFrames();

  /* Test-facing surface: the same state the UI renders, no hidden controls. */
  window.__myprePresenter = {
    version: VERSION,
    session: pinned.session,
    state: function () {
      return {
        connection: connection,
        index: index,
        count: count,
        step: step,
        elapsed: elapsed(),
        running: startedAt !== null,
        current: currentFrame ? currentFrame.getAttribute("src") || "" : "",
        next: nextFrame && !nextFrame.hidden ? nextFrame.getAttribute("src") || "" : "",
        status: status ? status.textContent || "" : ""
      };
    },
    ping: function () { post({ v: VERSION, session: pinned.session, type: "ping" }); }
  };
})();
