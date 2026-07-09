/* akgeo.js — Alaska cartography helpers for slide code (requires d3 loaded).
 *
 * Exists because of a trap discovered on run 2026-07-08: calling
 * proj.fitExtent(...) with a SMALL lon/lat bbox polygon distorts the conic
 * fit and renders the full-state land polygon as a giant fill disc plus a
 * mis-scaled map. The reliable recipe is: fit the FULL state first, then
 * scale by a zoom factor and re-translate so a target lon/lat lands at a
 * chosen screen point — with a STROKE-ONLY coastline at high zoom.
 *
 * Usage:
 *   <script src="@@ASSETS@@/js/d3.v7.min.js"></script>
 *   <script src="@@ASSETS@@/js/akgeo.js"></script>
 *   const ak   = await (await fetch("@@ASSETS@@/geo/alaska-state.geo.json")).json();
 *   // full-state hero map (canonical projection, parallels 55/65, rotate 154):
 *   const proj = AKGeo.alaskaProjection(ak, [[80, 250], [1000, 1160]]);
 *   // regional zoom: put the Stak site at screen (780, 470) at 8.5x:
 *   AKGeo.zoomTo(proj, ak, [-148.6, 69.82], [780, 470], 8.5);
 *   const path = d3.geoPath(proj);
 *   svg.append("path").attr("d", path(ak.features[0]))
 *     .attr("fill", "none")            // STROKE-ONLY at zoom; never fill
 *     .attr("stroke", "#5ac8f0");
 *
 * At zoom > ~2 always draw the land as stroke-only: the polygon's far edges
 * project to enormous coordinates and any fill reads as a solid disc.
 */
(function (global) {
  "use strict";

  function feature(geo) {
    // accept a FeatureCollection, a Feature, or raw geometry
    if (geo && geo.type === "FeatureCollection") return geo;
    if (geo && geo.type === "Feature") return geo;
    return { type: "Feature", geometry: geo };
  }

  /* Canonical Alaska projection (see assets/geo/alaska-places.json), fitted
   * to the FULL state within `extent` = [[x0,y0],[x1,y1]]. */
  function alaskaProjection(geo, extent) {
    if (typeof d3 === "undefined") throw new Error("AKGeo requires d3");
    return d3.geoConicEqualArea()
      .parallels([55, 65])
      .rotate([154, 0])
      .fitExtent(extent || [[0, 0], [1080, 1350]], feature(geo));
  }

  /* Zoom an already-fitted projection so `lonlat` lands at screen `targetXY`
   * at `zoom` times the full-state scale. Mutates and returns `proj`.
   * If `geo` is passed and `proj` is missing, a full-canvas baseline fit is
   * created first (one-call convenience). */
  function zoomTo(proj, geo, lonlat, targetXY, zoom) {
    if (!proj) proj = alaskaProjection(geo, [[0, 0], [1080, 1350]]);
    proj.scale(proj.scale() * (zoom || 1));
    const s = proj(lonlat);
    const t = proj.translate();
    proj.translate([t[0] + (targetXY[0] - s[0]), t[1] + (targetXY[1] - s[1])]);
    return proj;
  }

  global.AKGeo = { alaskaProjection: alaskaProjection, zoomTo: zoomTo };
})(typeof window !== "undefined" ? window : globalThis);
