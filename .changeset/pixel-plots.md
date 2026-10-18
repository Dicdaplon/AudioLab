---
"@audiolab/react": minor
---

Opt-in pixel-art plots. Two optional tokens, unset by default: `--al-viz-pixel` (a cell
size in CSS px; 0, 1 or unset is off) makes `SpectrumPlot`, `TempoPlot`,
`TimeSignalPlot` and `PlayAlongLane` draw on a grid of square cells (stepped equaliser
columns with a bright top cell, lines of cells, dotted grids, pixel discs on the lane,
`image-rendering: pixelated`); `--al-plot-font` sets the canvas font of tick labels and
the empty state (falls back to the mono). `VizTheme` gains the optional `pixel` and
`plotFont` fields. With neither token set, every plot draws exactly as before.
