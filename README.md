# jsPsychRmsPlugin

A jsPsych plugin for implementing **Repeated Masking Suppression (RMS)** and **breaking RMS (bRMS)** paradigms in web-based experiments. This repository ships two entry points for the same task: `jspsych-brms.js` (jsPsych 6) and `jspsych-brms-7.js` (jsPsych 7).

RMS is a technique for presenting stimuli **below the threshold of consciousness for extended durations**. It is closely related to **Continuous Flash Suppression (CFS; Tsuchiya & Koch, 2005)**, but relies on different visual principles and **requires no special apparatus beyond a standard computer and monitor**. RMS is based on **forward- and backward-masking**, separating the target and mask in time.

In RMS, participants are presented with a stream of **Mondrian masks interleaved with a lower-contrast target stimulus**. Typically, the mask is presented for about **67 ms**, and the target for about **34 ms**, repeated over the trial.

In **breaking RMS (bRMS)**, stimuli are presented long enough for the target to **break suppression and become consciously visible**. Participants indicate the **location of the target relative to screen center as soon as it becomes visible**. Their reaction times are taken as **breaking times (BTs)**—a measure of the time required for the stimulus to reach awareness. bRMS BTs have been shown to be a valid index of prioritization for consciousness and to show **convergent validity with bCFS BTs** (Abir & Hassin, 2020).

<img width="384" height="311" alt="image" src="https://github.com/user-attachments/assets/ed459519-30b2-4a80-a000-704e8cb55f51" />

---

## Features

- RMS / bRMS implementation for jsPsych 6 and jsPsych 7
- Alternating **mask–stimulus** presentation with configurable durations
- **Mondrian mask** generator (rectangle size, count, color palette)
- Control over **stimulus contrast** and **mask contrast** (including fade-in/fade-out)
- Flexible **stimulus positioning** (side of screen, randomization)
- Built-in **fixation cross**, frame geometry, and DPI-based scaling
- Automatic logging of **RT**, **breaking time**, **stimulus side**, and **accuracy**

---

## Installation

Load the plugin with a script tag after jsPsych. This snapshot is not published to npm. `package.json` is here so the Jest tests can run.

### jsPsych 6

Use the jsPsych 6 build in this repository (`jspsych.js`), then the v6 plugin. `index.html` is a minimal example of that order.

```html
<script src="jspsych.js"></script>
<script src="jspsych-brms.js"></script>
<link rel="stylesheet" href="css/jspsych.css" type="text/css">
```

That `jspsych.js` creates a hidden `dpiDiv` element (1 mm tall). The plugin reads its `clientHeight` as pixels per millimeter and scales stimulus, mask, and frame sizes from millimeters to pixels.

### jsPsych 7

Load a jsPsych 7 build first, so the `jsPsychModule` global exists, then `jspsych-brms-7.js`. That file defines the global constructor `jsPsychRms`.

```html
<script src="jspsych.js"></script>
<script src="jspsych-brms-7.js"></script>
```

Point `jspsych.js` at your jsPsych 7 build. The copy in this repository is jsPsych 6 and does not define `jsPsychModule`.

On a jsPsych 7 page, add a hidden element with id `dpiDiv` before the trial runs (for example `<div id="dpiDiv" style="height:1mm;width:1mm;visibility:hidden"></div>`). The plugin uses `document.getElementById('dpiDiv').clientHeight` as pixels per millimeter.

## Basic usage

Trial parameters are the same in both versions.

### jsPsych 6

```javascript
var rms_trial = {
  type: 'rms',
  stimulus: 'img/target.png',
  stimulus_side: -1,          // -1: random side
  stimulus_opacity: 0.4,      // max target opacity
  mondrian_max_opacity: 1,
  mondrian_min_opacity: 0.01,
  mask_duration: 67,          // in ms
  stimulus_duration: 34,      // in ms
  trial_duration: 10,         // in seconds
  choices: ['q', 'p'],        // response keys
  correct_responses: ['p']    // optional correctness rule
};

var timeline = [];
timeline.push(rms_trial);

jsPsych.init({
  timeline: timeline
});
```

### jsPsych 7

```javascript
var jsPsych = initJsPsych();

var timeline = [{
  type: jsPsychRms,
  stimulus: 'img/target.png',
  stimulus_side: -1,
  stimulus_opacity: 0.4,
  mondrian_max_opacity: 1,
  mondrian_min_opacity: 0.01,
  mask_duration: 67,
  stimulus_duration: 34,
  trial_duration: 10,
  choices: ['q', 'p'],
  correct_responses: ['p']
}];

jsPsych.run(timeline);
```

## Key Parameters (Selection)

These parameters are defined in `plugin.info.parameters` in the source code.

---

### **Stimulus & Response**

- **`stimulus` (string)** — Path to the target image.
- **`choices` (array)** — Allowed response keys.
- **`right_up`, `left_down` (arrays)** — Keys interpreted as “right/up” vs. “left/down”.
- **`correct_responses` (array)** — Keys considered correct (overrides side-based logic if non-empty).

---

### **Timing & Visibility**

- **`trial_duration` (float, s)** — Total trial duration (response window).
- **`waiting_time` (float, s)** — Delay before first stimulus/mask cycle.
- **`stimulus_duration` (float, ms)** — Duration of each stimulus frame.
- **`mask_duration` (float, ms)** — Duration of each mask frame.
- **`fade_in_time` (float, s)** — Duration of stimulus fade-in.
- **`fade_out_time` (float, s)** — When and how fast the mask fades out toward the end.

---

### **Mask & Frame Parameters**

- **`rectangle_count` (int)** — Number of rectangles per Mondrian mask.
- **`mondrians_count` (int)** — Number of Mondrians generated and randomly sampled.
- **`colors` (array)** — Palette for Mondrian rectangles.
- **`rectangle_width`, `rectangle_height` (float, mm)** — Base rectangle size.
- **`frame_width`, `frame_height` (float, mm)** — Physical frame dimensions.
- **`background_color` (string)** — Frame background color.
- **`mask_block_count` (int)** — Number of consecutive mask frames before switching back to stimulus.

---

### **Stimulus Geometry**

- **`stimulus_width`, `stimulus_height` (float, mm)** — Physical size of the target stimulus.
- **`stimulus_opacity` (float)** — Maximum opacity of the stimulus.
- **`stimulus_side` (int)** —  
  - `0` = right  
  - `1` = left  
  - `2` = top  
  - `3` = bottom  
  - `-1` = random
- **`fixation_visible` (bool)** — Whether to draw a central fixation cross.
- **`fixation_width`, `fixation_height` (float, mm)** — Fixation size.

> All geometric dimensions are converted from **mm → px** at runtime using a DPI calibration element (e.g., `dpiDiv`).

---

## Data Output

Each trial returns at least:

- **`rt`** — Reaction time (ms) from start of RMS cycle (breaking time in bRMS).
- **`stimulus`** — Path to stimulus image.
- **`stimulus_side`** — Actual presentation side (0–3).
- **`key_press`** — Key pressed (character).
- **`correct`** — Boolean correctness (from `correct_responses` or directional logic).
- **`is_fullscreen`** — Whether display was in fullscreen mode.
- **`time_post_trial`** — Post-trial gap (if configured in jsPsych).

`jspsych-brms.js` writes every field above. `jspsych-brms-7.js` writes the same fields except `time_post_trial`. If no key is pressed, the jsPsych 7 plugin records `rt` and `correct` as `null` and `key_press` as an empty string.

---

## Citation

Cite this software with the metadata in [`CITATION.cff`](CITATION.cff).

That file has **no DOI yet**. After Zenodo archives a GitHub release of this repository, add the assigned DOI to the `doi` field in `CITATION.cff`.

## License

GNU General Public License v3.0. The full text is in [`LICENSE`](LICENSE).

## Author

Nadav Weisler — [ORCID 0009-0001-2729-5422](https://orcid.org/0009-0001-2729-5422)

Affiliations: Shalvata Mental Health Center; Data Research Center for Mental Health and Rehabilitation, Clalit; Psychology Department, Hebrew University of Jerusalem.
