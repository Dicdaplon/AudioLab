---
"@audiolab/core": minor
"@audiolab/react": patch
---

`OnsetPipeline` takes `manualThresholdDb` (option and live field): the level an onset
must reach, set by hand, instead of the learnt floor + margin; `onsetThresholdDb` reads
the threshold in force. The detector's settings speak plainly: "A note is present
above … % of the loudest", the cut line and the loudest note as percentages, and the
memory and aggregator folded under "Fine tuning".
