/* Shared navigation. Content and links remain available without JavaScript. */
(function () {
  "use strict";
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (header) {
    var glassMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    header.addEventListener("pointermove", function (event) {
      if (event.pointerType !== "mouse" || glassMotion.matches) return;
      var bounds = header.getBoundingClientRect();
      header.style.setProperty("--glass-x", ((event.clientX - bounds.left) / bounds.width * 100).toFixed(1) + "%");
      header.style.setProperty("--glass-y", ((event.clientY - bounds.top) / bounds.height * 100).toFixed(1) + "%");
    });
    header.addEventListener("pointerleave", function () {
      header.style.removeProperty("--glass-x");
      header.style.removeProperty("--glass-y");
    });
  }
  if (header && toggle && nav) {
    header.classList.add("nav-enhanced");
    function closeMenu() {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      toggle.textContent = "Menu";
    }
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      toggle.textContent = open ? "Close" : "Menu";
    });
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        closeMenu();
        toggle.focus();
      }
    });
    document.addEventListener("click", function (event) {
      if (!header.contains(event.target)) closeMenu();
    });
  }
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* Learning <-> reasoning loop. One clock drives a cycle:
     forward pass -> concepts travel (round, blue -> square, amber) -> bottom-up inference
     -> feedback travels (diamond, amber -> round, blue) -> backpropagation.
     Every delivery fills a pip on the receiving side; each of the three rounds sends
     one more signal than the last, then the loop starts over. */
  var SVG_NS = "http://www.w3.org/2000/svg";
  var CYCLE_MS = 7600;
  var ROUNDS = 3;
  var BLUE = [79, 120, 148];
  var AMBER = [165, 122, 69];

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { return x * x * (3 - 2 * x); }
  function mixColor(a, b, t) {
    return "rgb(" + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(",") + ")";
  }
  /* Intensity of glyph step 0..4 for a wave sweeping through [start, end] of the cycle. */
  function wave(p, start, end, step, reverse) {
    var j = reverse ? 4 - step : step;
    var centre = start + (end - start) * (j + 0.5) / 5;
    return clamp01(1 - Math.abs(p - centre) / ((end - start) * 0.32));
  }

  document.querySelectorAll("[data-reasoning-diagram]").forEach(function (figure) {
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var inView = true;
    var svg = figure.querySelector(".diagram-flow");
    var learning = figure.querySelector(".diagram-learning");
    var symbolic = figure.querySelector(".diagram-symbolic");
    var routeForward = svg.querySelector(".diagram-route-forward");
    var routeBackward = svg.querySelector(".diagram-route-backward");
    var labelForward = figure.querySelector(".diagram-label-forward");
    var labelBackward = figure.querySelector(".diagram-label-backward");
    var netSteps = learning.querySelectorAll("[data-step]");
    var treeSteps = symbolic.querySelectorAll("[data-step]");
    var learningLevel = learning.querySelector(".diagram-progress");
    var symbolicLevel = symbolic.querySelector(".diagram-progress");
    var layer = document.createElementNS(SVG_NS, "g");
    var lengths = [0, 0];
    var clock = 0;
    var lastFrame = null;
    var frameId = 0;

    layer.setAttribute("class", "diagram-particles");
    svg.appendChild(layer);
    /* Each signal is a head plus two fading trail copies. */
    function makeSignals(size) {
      var signals = [];
      for (var i = 0; i < ROUNDS; i++) {
        var parts = [];
        [1, 0.62, 0.38].forEach(function (scale) {
          var rect = document.createElementNS(SVG_NS, "rect");
          var s = size * scale;
          rect.setAttribute("x", -s / 2);
          rect.setAttribute("y", -s / 2);
          rect.setAttribute("width", s);
          rect.setAttribute("height", s);
          rect.style.visibility = "hidden";
          layer.appendChild(rect);
          parts.push({ el: rect, size: s, scale: scale });
        });
        signals.push(parts);
      }
      return signals;
    }
    var forwardSignals = makeSignals(8);
    var backwardSignals = makeSignals(7);

    function layout() {
      var box = svg.getBoundingClientRect();
      var w = box.width;
      var h = box.height;
      if (!w || !h) return;
      svg.setAttribute("viewBox", "0 0 " + w + " " + h);
      routeForward.setAttribute("d", "M4 " + h * 0.3 + " C" + w * 0.3 + " " + h * 0.04 + " " + w * 0.7 + " " + h * 0.04 + " " + (w - 4) + " " + h * 0.3);
      routeBackward.setAttribute("d", "M" + (w - 4) + " " + h * 0.7 + " C" + w * 0.7 + " " + h * 0.96 + " " + w * 0.3 + " " + h * 0.96 + " 4 " + h * 0.7);
      lengths = [routeForward.getTotalLength(), routeBackward.getTotalLength()];
      paint();
    }

    function drawSignals(signals, route, length, p, start, count, fromColor, toColor, forward) {
      signals.forEach(function (parts, i) {
        var u = (p - start - i * 0.05) / 0.27;
        parts.forEach(function (part, k) {
          var v = u - k * 0.045;
          if (i >= count || v <= 0 || v >= 1 || !length) {
            part.el.style.visibility = "hidden";
            return;
          }
          var point = route.getPointAtLength(length * ease(v) * 0.94 + length * 0.03);
          var morph = ease(clamp01((v - 0.3) / 0.5));
          var round = forward ? 1 - morph : morph;
          var radius = part.size / 2 * (0.12 + 0.88 * round);
          part.el.style.visibility = "visible";
          part.el.setAttribute("rx", radius);
          part.el.setAttribute("ry", radius);
          part.el.setAttribute("transform", "translate(" + point.x + " " + point.y + ") rotate(" + (forward ? 0 : 45) + ")");
          part.el.style.fill = mixColor(fromColor, toColor, morph);
          part.el.style.opacity = Math.min(1, v / 0.08, (1 - v) / 0.08) * part.scale;
        });
      });
    }

    function setGlyph(steps, intensity) {
      steps.forEach(function (group) {
        var step = Number(group.getAttribute("data-step"));
        var base = step % 2 ? 0.24 : 0.5;
        group.style.opacity = base + (1 - base) * intensity(step);
      });
    }

    function render() {
      var round = Math.floor(clock / CYCLE_MS) % ROUNDS;
      var p = (clock % CYCLE_MS) / CYCLE_MS;
      var count = round + 1;
      setGlyph(netSteps, function (step) {
        return Math.max(wave(p, 0, 0.14, step, false), wave(p, 0.84, 0.98, step, true));
      });
      setGlyph(treeSteps, function (step) { return wave(p, 0.4, 0.56, step, false); });
      drawSignals(forwardSignals, routeForward, lengths[0], p, 0.12, count, BLUE, AMBER, true);
      drawSignals(backwardSignals, routeBackward, lengths[1], p, 0.56, count, AMBER, BLUE, false);
      var forwardActive = p > 0.1 && p < 0.5;
      var backwardActive = p > 0.54 && p < 0.94;
      labelForward.classList.toggle("is-active", forwardActive);
      routeForward.classList.toggle("is-active", forwardActive);
      labelBackward.classList.toggle("is-active", backwardActive);
      routeBackward.classList.toggle("is-active", backwardActive);
      symbolic.classList.toggle("is-receiving", p > 0.38 && p < 0.6);
      learning.classList.toggle("is-receiving", p > 0.82 || p < 0.03);
      symbolicLevel.dataset.level = String(round + (p >= 0.43 ? 1 : 0));
      learningLevel.dataset.level = String(round + (p >= 0.87 ? 1 : 0));
    }

    function renderStatic() {
      [forwardSignals, backwardSignals].forEach(function (signals) {
        signals.forEach(function (parts) {
          parts.forEach(function (part) { part.el.style.visibility = "hidden"; });
        });
      });
      setGlyph(netSteps, function () { return 0; });
      setGlyph(treeSteps, function () { return 0; });
      figure.querySelectorAll(".is-active, .is-receiving").forEach(function (el) {
        el.classList.remove("is-active", "is-receiving");
      });
      learningLevel.removeAttribute("data-level");
      symbolicLevel.removeAttribute("data-level");
    }

    function paint() {
      if (reducedMotion.matches) renderStatic();
      else render();
    }

    function frame(now) {
      if (lastFrame !== null) clock += Math.min(now - lastFrame, 100);
      lastFrame = now;
      render();
      frameId = requestAnimationFrame(frame);
    }

    function updateAnimation() {
      var running = !reducedMotion.matches && inView && !document.hidden;
      figure.dataset.animated = String(!reducedMotion.matches);
      figure.dataset.paused = String(!running);
      if (running && !frameId) {
        lastFrame = null;
        frameId = requestAnimationFrame(frame);
      } else if (!running && frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
      if (!running) paint();
    }

    if ("ResizeObserver" in window) new ResizeObserver(layout).observe(svg);
    else window.addEventListener("resize", layout);
    layout();

    reducedMotion.addEventListener("change", updateAnimation);
    document.addEventListener("visibilitychange", updateAnimation);
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        updateAnimation();
      });
      observer.observe(figure);
    }
    updateAnimation();
  });
})();
