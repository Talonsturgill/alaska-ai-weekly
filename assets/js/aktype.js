/* aktype.js — display-type fitting helper for slide code (no dependencies).
 *
 * Exists because of a recurring defect (runs through 2026-07-09): a large
 * Archivo/Unbounded display headline is set at a fixed font-size in a
 * container narrower than its longest line, so the headline SILENTLY wraps
 * one extra line down into the body/attribution block and machine_qa fails
 * it as a text-overprint. DESIGN_DOCTRINE section 2 prescribes a
 * "binary-search font-size" fit-to-box recipe, but every deck re-implemented
 * (or forgot) it. This is the one committed implementation.
 *
 * Note the frontier finding that motivated committing this (2026-07-09
 * typography scan): CSS `text-wrap: balance`/`pretty` only redistribute the
 * lines that naturally occur — per Chrome's own docs they give NO guarantee
 * that text stays within a line count and do NOT prevent overflow. Only a
 * measure-and-shrink pass guarantees "never more than N lines, never
 * overflow." That is what AK.fitText does. Binary search converges in ~8
 * probes (log2 of the size range), sub-millisecond.
 *
 * Usage (call INSIDE renderReady, AFTER fonts are ready so measurement uses
 * the real metrics):
 *
 *   <script src="@@ASSETS@@/js/aktype.js"></script>
 *   window.renderReady = new Promise(async (resolve) => {
 *     await document.fonts.ready;                       // REQUIRED before fitting
 *     AK.fitText(document.querySelector("h1"), { min: 44, max: 80, maxLines: 3 });
 *     resolve(true);
 *   });
 *
 * Contract: the element keeps its CSS width/height; fitText only lowers the
 * font-size (never above `max`) until the element renders in <= maxLines line
 * boxes AND does not overflow its box horizontally or (if the box has a fixed
 * height) vertically. It never enlarges past what fits, never throws, and if
 * even `min` cannot satisfy the constraint it clamps to `min` and sets
 * data-fit-overflow="1" on the element so a human/critic can see the box is
 * genuinely too small. Returns the fit report { size, lines, fit }.
 *
 * <br> line breaks are honored: a maxLines:3 headline authored with two <br>
 * is already 3 lines, so fitText only ever needs to shrink if a line ALSO
 * soft-wraps. This is exactly the run-2026-07-09 failure mode.
 */
(function (global) {
  "use strict";

  var AK = global.AK || (global.AK = {});

  // Count the rendered line boxes of an element (across its text nodes, nested
  // spans and <br>) and whether any line exceeds the element's content box.
  function measure(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var rects = range.getClientRects();
    var tops = {};
    var n = 0;
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (r.width > 1 && r.height > 1) {
        var key = Math.round(r.top);
        if (!(key in tops)) { tops[key] = 1; n++; }
      }
    }
    // scrollWidth/scrollHeight vs client* is the canonical overflow probe.
    var overflowX = el.scrollWidth > el.clientWidth + 1;
    var overflowY = el.scrollHeight > el.clientHeight + 1;
    return { lines: n || 1, overflowX: overflowX, overflowY: overflowY };
  }

  /* Binary-search the largest font-size in [min, max] (px, resolved to 0.5px)
   * at which `el` fits `maxLines` line boxes with no horizontal overflow.
   * `respectHeight` (default: only when the element has a fixed/clipped height)
   * also forbids vertical overflow. Mutates el.style.fontSize; returns a report. */
  function fitText(el, opts) {
    if (!el) return { size: 0, lines: 0, fit: false };
    opts = opts || {};
    var min = opts.min != null ? opts.min : 24;
    var max = opts.max != null ? opts.max : 120;
    var maxLines = opts.maxLines != null ? opts.maxLines : 3;
    // Only enforce vertical overflow when the author gave the box a real
    // height cap (fixed height + hidden/clip overflow); otherwise height is
    // author-intended to grow and line count is the true constraint.
    var cs = getComputedStyle(el);
    var respectHeight = opts.respectHeight != null ? opts.respectHeight
      : (["hidden", "clip"].indexOf(cs.overflowY) !== -1);

    function fitsAt(px) {
      el.style.fontSize = px + "px";
      var m = measure(el);
      var ok = m.lines <= maxLines && !m.overflowX && (!respectHeight || !m.overflowY);
      return ok;
    }

    var lo = min, hi = max, best = null;
    // 0.5px resolution: ~8 iterations over a 40px range.
    for (var it = 0; it < 24 && hi - lo > 0.5; it++) {
      var mid = Math.round(((lo + hi) / 2) * 2) / 2;
      if (fitsAt(mid)) { best = mid; lo = mid; } else { hi = mid; }
    }
    if (best == null) {
      // Even the smallest tested size overflowed; check min explicitly.
      if (fitsAt(min)) { best = min; }
      else { best = min; el.style.fontSize = min + "px"; el.setAttribute("data-fit-overflow", "1"); }
    } else {
      el.style.fontSize = best + "px";
    }
    var fm = measure(el);
    return { size: best, lines: fm.lines, fit: !el.hasAttribute("data-fit-overflow") };
  }

  AK.fitText = fitText;
  AK.measureLines = measure;
})(typeof window !== "undefined" ? window : globalThis);
