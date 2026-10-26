// =============================================================================
// AK_PATH: the painted-map Alaska outline (promoted from Ep1026.tsx, machine pass 2026-10-26)
//
// A STYLISED outline, hand-placed in a 1000 x 700 draw box (origin top left, +y down): the
// Interior body, a notch in the south coast, the Alaska Peninsula running west and the
// panhandle running south-east off the right edge. It is NOT a true lon/lat projection and must not
// be used to place a real town by coordinate; use it where a film needs "a painted map of Alaska"
// (10-26 S6: a map that unrolls, with a pin at the south coast and a far pin on the North Slope).
// Scale and translate it with a transform to fit the shot. It clips cleanly (closed, no
// self-intersection), so `<clipPath><path d={AK_PATH} /></clipPath>` keeps terrain inside it.
// Ep1026's MapLand (shade, rivers, ranges, drifting cloud shadows) is the reference drawing.
// =============================================================================
export const AK_PATH =
  'M 880,70 L 800,50 L 730,40 L 660,52 L 590,38 L 520,56 L 470,26 L 425,45 L 395,95 L 340,128 L 300,118 L 255,150 L 205,168 L 190,150 L 215,205 L 270,222 L 245,270 L 205,315 L 185,372 L 212,425 L 262,455 L 300,478 L 262,505 L 205,545 L 130,575 L 70,605 L 25,625 L 12,650 L 75,628 L 150,600 L 232,568 L 305,528 L 360,505 L 425,492 L 470,470 L 492,432 L 520,398 L 540,440 L 560,478 L 620,500 L 700,470 L 745,448 L 800,468 L 860,520 L 905,572 L 950,632 L 990,700 L 945,688 L 900,640 L 868,590 L 880,540 L 890,300 Z';
