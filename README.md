# jsPsychRmsPlugin

A **jsPsych 6** plugin for implementing **Repeated Masking Suppression (RMS)** and **breaking RMS (bRMS)** paradigms in web-based experiments.

RMS is a technique for presenting stimuli **below the threshold of consciousness for extended durations**. It is closely related to **Continuous Flash Suppression (CFS; Tsuchiya & Koch, 2005)**, but relies on different visual principles and **requires no special apparatus beyond a standard computer and monitor**. RMS is based on **forward- and backward-masking**, separating the target and mask in time.

In RMS, participants are presented with a stream of **Mondrian masks interleaved with a lower-contrast target stimulus**. Typically, the mask is presented for about **67 ms**, and the target for about **34 ms**, repeated over the trial.

In **breaking RMS (bRMS)**, stimuli are presented long enough for the target to **break suppression and become consciously visible**. Participants indicate the **location of the target relative to screen center as soon as it becomes visible**. Their reaction times are taken as **breaking times (BTs)**—a measure of the time required for the stimulus to reach awareness. bRMS BTs have been shown to be a valid index of prioritization for consciousness and to show **convergent validity with bCFS BTs** (Abir & Hassin, 2020).

<img width="384" height="311" alt="image" src="https://github.com/user-attachments/assets/ed459519-30b2-4a80-a000-704e8cb55f51" />

---

## Features

- RMS / bRMS implementation for jsPsych 6
- Alternating **mask–stimulus** presentation with configurable durations
- **Mondrian mask** generator (rectangle size, count, color palette)
- Control over **stimulus contrast** and **mask contrast** (including fade-in/fade-out)
- Flexible **stimulus positioning** (side of screen, randomization)
- Built-in **fixation cross**, frame geometry, and DPI-based scaling
- Automatic logging of **RT**, **breaking time**, **stimulus side**, and **accuracy**

---

## Installation

Include the plugin after jsPsych 6 in your HTML:

```html
<script src="jspsych.js"></script>
<script src="jspsych-brms.js"></script>
```

Basic Usage
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

timeline.push(rms_trial);
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

---
