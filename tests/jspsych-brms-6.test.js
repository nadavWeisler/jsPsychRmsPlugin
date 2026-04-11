'use strict';

// ---------------------------------------------------------------------------
// Minimal jsPsych 6 global stub so the plugin can be loaded in Node/jsdom
// ---------------------------------------------------------------------------
const parameterType = {
    BOOL: 0,
    STRING: 1,
    INT: 2,
    FLOAT: 3,
    FUNCTION: 4,
    KEYCODE: 5,
    SELECT: 6,
    HTML_STRING: 7,
    IMAGE: 8,
    AUDIO: 9,
    VIDEO: 10,
    OBJECT: 11,
    COMPLEX: 12,
};

global.jsPsych = {
    plugins: {
        parameterType,
    },
    pluginAPI: {
        registerPreload: jest.fn(),
        getKeyboardResponse: jest.fn(),
        cancelKeyboardResponse: jest.fn(),
        cancelAllKeyboardResponses: jest.fn(),
        clearAllTimeouts: jest.fn(),
    },
    finishTrial: jest.fn(),
};

// Stub browser APIs used during module load / trial setup
global.Image = class {
    constructor() { this.onload = null; this.src = ''; }
};
global.requestAnimationFrame = jest.fn((cb) => { cb(); return 1; });
global.cancelAnimationFrame = jest.fn();

// Stub canvas context
const mockContext = {
    save: jest.fn(),
    restore: jest.fn(),
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    drawImage: jest.fn(),
    fillStyle: '',
    globalAlpha: 1,
};

// Patch document.createElement to return a real element or our mock canvas
const realCreateElement = document.createElement.bind(document);
jest.spyOn(document, 'createElement').mockImplementation((tag) => {
    if (tag === 'canvas') {
        const c = {
            width: 400,
            height: 200,
            style: {},
            getContext: jest.fn(() => mockContext),
        };
        return c;
    }
    return realCreateElement(tag);
});

// DPI calibration element
const dpiDiv = realCreateElement('div');
Object.defineProperty(dpiDiv, 'clientHeight', { get: () => 10 }); // 10 px per mm
jest.spyOn(document, 'getElementById').mockImplementation((id) => {
    if (id === 'dpiDiv') return dpiDiv;
    return null;
});

// Load the plugin — CommonJS exports make helpers available for testing.
// The plugin registers itself on global.jsPsych.plugins["rms"] at load time.
const {
    Fixation,
    Mondrian,
    GetStimulusSide,
    GetStimulusLocation,
} = require('../jspsych-brms.js');

// Retrieve the plugin registered on the jsPsych v6 global
const plugin = jsPsych.plugins['rms'];

// ---------------------------------------------------------------------------
// Helper class tests
// ---------------------------------------------------------------------------
describe('Fixation', () => {
    test('draws two rectangles (crosshair) on the context', () => {
        const ctx = { save: jest.fn(), restore: jest.fn(), fillRect: jest.fn(), fillStyle: '' };
        const canvas = { width: 200, height: 100 };
        const fix = new Fixation(20, 4, 'black');
        fix.draw(ctx, canvas);
        expect(ctx.fillRect).toHaveBeenCalledTimes(2);
        expect(ctx.save).toHaveBeenCalledTimes(1);
        expect(ctx.restore).toHaveBeenCalledTimes(1);
    });

    test('uses the colour supplied in constructor', () => {
        const ctx = { save: jest.fn(), restore: jest.fn(), fillRect: jest.fn(), fillStyle: '' };
        const canvas = { width: 200, height: 100 };
        const fix = new Fixation(20, 4, 'red');
        fix.draw(ctx, canvas);
        expect(ctx.fillStyle).toBe('red');
    });
});

describe('Mondrian', () => {
    test('draws the correct number of rectangles', () => {
        const ctx = {
            save: jest.fn(), restore: jest.fn(),
            fillRect: jest.fn(), fillStyle: '', globalAlpha: 1,
        };
        const m = new Mondrian(6, 6, 10, ['#FF0000', '#00FF00'], 150, 73);
        m.draw(ctx, 0.8);
        expect(ctx.fillRect).toHaveBeenCalledTimes(10);
    });

    test('sets globalAlpha to the supplied opacity', () => {
        const ctx = {
            save: jest.fn(), restore: jest.fn(),
            fillRect: jest.fn(), fillStyle: '', globalAlpha: 1,
        };
        const m = new Mondrian(6, 6, 5, ['#FF0000'], 150, 73);
        m.draw(ctx, 0.42);
        expect(ctx.globalAlpha).toBe(0.42);
    });

    test('get_random_number wraps around cyclically', () => {
        const m = new Mondrian(6, 6, 2, ['#FF0000'], 50, 50);
        const total = m.random_numbers.length;
        // Exhaust the array
        for (let i = 0; i < total; i++) { m.get_random_number(); }
        // Index should have wrapped back to 0 → next call returns index 0 again
        const first = m.random_numbers[0];
        const result = m.get_random_number();
        expect(result).toBe(first);
    });
});

describe('GetStimulusSide', () => {
    test('returns the explicit side when >= 0', () => {
        expect(GetStimulusSide(0)).toBe(0);
        expect(GetStimulusSide(1)).toBe(1);
        expect(GetStimulusSide(2)).toBe(2);
        expect(GetStimulusSide(3)).toBe(3);
    });

    test('returns 0 or 1 for horizontal orientation when side is -1', () => {
        const results = new Set();
        for (let i = 0; i < 200; i++) results.add(GetStimulusSide(-1, 'h'));
        expect([...results].every(v => v === 0 || v === 1)).toBe(true);
    });

    test('returns 2 or 3 for vertical orientation when side is -1', () => {
        const results = new Set();
        for (let i = 0; i < 200; i++) results.add(GetStimulusSide(-1, 'v'));
        expect([...results].every(v => v === 2 || v === 3)).toBe(true);
    });

    test('returns 0-3 for both orientations when side is -1', () => {
        const results = new Set();
        for (let i = 0; i < 400; i++) results.add(GetStimulusSide(-1, 'b'));
        expect([...results].every(v => v >= 0 && v <= 3)).toBe(true);
    });
});

describe('GetStimulusLocation', () => {
    const canvas = { width: 400, height: 200 };

    test('side 0 → three-quarter x position', () => {
        expect(GetStimulusLocation(0, canvas)).toBe(300);
    });

    test('side 1 → quarter x position', () => {
        expect(GetStimulusLocation(1, canvas)).toBe(100);
    });

    test('side 2 → 0', () => {
        expect(GetStimulusLocation(2, canvas)).toBe(0);
    });

    test('side 3 → beyond mid-canvas', () => {
        const loc = GetStimulusLocation(3, canvas);
        expect(loc).toBeGreaterThan(canvas.height / 2);
    });
});

// ---------------------------------------------------------------------------
// jsPsychRms v6 plugin info tests
// ---------------------------------------------------------------------------
describe('jsPsychRms v6 plugin info', () => {
    test('plugin is registered on jsPsych.plugins["rms"]', () => {
        expect(plugin).toBeDefined();
        expect(plugin.info).toBeDefined();
    });

    test('plugin name is "RMS"', () => {
        expect(plugin.info.name).toBe('RMS');
    });

    test('uses numeric parameterType codes (jsPsych v6 style)', () => {
        const params = plugin.info.parameters;
        for (const key of Object.keys(params)) {
            expect(typeof params[key].type).toBe('number');
        }
    });

    test('has all required parameters', () => {
        const required = [
            'colors', 'rectangle_count', 'mondrians_count',
            'mondrian_max_opacity', 'mondrian_min_opacity',
            'trial_duration', 'choices', 'right_up', 'left_down',
            'waiting_time', 'stimulus_opacity', 'stimulus_side',
            'stimulus_duration', 'mask_duration', 'stimulus_width',
            'stimulus_height', 'fade_out_time', 'fade_in_time',
            'fixation_visible', 'rectangle_width', 'rectangle_height',
            'fixation_width', 'fixation_height', 'frame_width',
            'frame_height', 'background_color', 'mask_block_count',
            'correct_responses',
        ];
        const params = plugin.info.parameters;
        for (const key of required) {
            expect(params).toHaveProperty(key);
        }
    });

    test('correct_responses default is an empty array', () => {
        expect(plugin.info.parameters.correct_responses.default).toEqual([]);
    });

    test('stimulus_side default is -1 (random)', () => {
        expect(plugin.info.parameters.stimulus_side.default).toBe(-1);
    });

    test('default choices are q and p', () => {
        expect(plugin.info.parameters.choices.default).toEqual(['q', 'p']);
    });
});

// ---------------------------------------------------------------------------
// jsPsychRms v6 plugin trial tests
// ---------------------------------------------------------------------------
describe('jsPsychRms v6 plugin trial', () => {
    let display_element;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();

        // Reset the global jsPsych mocks so each test starts clean
        jsPsych.finishTrial = jest.fn();
        jsPsych.pluginAPI.getKeyboardResponse = jest.fn();
        jsPsych.pluginAPI.cancelKeyboardResponse = jest.fn();
        jsPsych.pluginAPI.cancelAllKeyboardResponses = jest.fn();
        jsPsych.pluginAPI.clearAllTimeouts = jest.fn();

        display_element = realCreateElement('div');
        display_element.innerHTML = '';
        display_element.append = jest.fn();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    function buildTrial(overrides = {}) {
        return {
            stimulus: 'img/test.png',
            stimulus_side: 0,
            stimulus_opacity: 0.5,
            mondrian_max_opacity: 1,
            mondrian_min_opacity: 0.01,
            mask_duration: 67,
            stimulus_duration: 33,
            trial_duration: 2,
            waiting_time: 0,
            choices: ['q', 'p'],
            right_up: ['P', 'p'],
            left_down: ['Q', 'q'],
            colors: ['#FF0000', '#00FF00', '#0000FF'],
            rectangle_count: 10,
            mondrians_count: 3,
            rectangle_width: 6,
            rectangle_height: 6,
            fixation_width: 8.33,
            fixation_height: 2.34,
            frame_width: 150,
            frame_height: 73.4,
            stimulus_width: 61,
            stimulus_height: 61,
            fade_out_time: 1,
            fade_in_time: 0,
            fixation_visible: true,
            background_color: '#7F7F7F',
            mask_block_count: 1,
            correct_responses: [],
            post_trial_gap: 0,
            ...overrides,
        };
    }

    test('calls getKeyboardResponse with the configured choices', () => {
        plugin.trial(display_element, buildTrial({ choices: ['q', 'p'] }));
        // In v6 the trial setup is wrapped in a 10 ms outer setTimeout
        jest.advanceTimersByTime(15);
        expect(jsPsych.pluginAPI.getKeyboardResponse).toHaveBeenCalledWith(
            expect.objectContaining({ valid_responses: ['q', 'p'] })
        );
    });

    test('does NOT register a keyboard listener when choices is ["none"]', () => {
        plugin.trial(display_element, buildTrial({ choices: ['none'] }));
        jest.advanceTimersByTime(15);
        expect(jsPsych.pluginAPI.getKeyboardResponse).not.toHaveBeenCalled();
    });

    test('finishTrial is called after trial_duration elapses', () => {
        // Timeline: 10ms outer timeout + trial_duration*1000ms + 10ms end_trial timeout
        plugin.trial(display_element, buildTrial({ trial_duration: 1, waiting_time: 0 }));
        jest.advanceTimersByTime(1500);
        expect(jsPsych.finishTrial).toHaveBeenCalledTimes(1);
    });

    test('trial_data contains expected keys', () => {
        plugin.trial(display_element, buildTrial({ trial_duration: 1, waiting_time: 0 }));
        jest.advanceTimersByTime(1500);

        const data = jsPsych.finishTrial.mock.calls[0][0];
        expect(data).toHaveProperty('rt');
        expect(data).toHaveProperty('stimulus');
        expect(data).toHaveProperty('stimulus_side');
        expect(data).toHaveProperty('key_press');
        expect(data).toHaveProperty('is_fullscreen');
        expect(data).toHaveProperty('correct');
        expect(data).toHaveProperty('time_post_trial');
    });

    test('stimulus in trial_data matches the configured stimulus path', () => {
        plugin.trial(display_element, buildTrial({ stimulus: 'img/face.png', trial_duration: 1, waiting_time: 0 }));
        jest.advanceTimersByTime(1500);

        const data = jsPsych.finishTrial.mock.calls[0][0];
        expect(data.stimulus).toBe('img/face.png');
    });

    test('stimulus_side is forced to 0 when explicitly set', () => {
        plugin.trial(display_element, buildTrial({ stimulus_side: 0, trial_duration: 1, waiting_time: 0 }));
        jest.advanceTimersByTime(1500);

        const data = jsPsych.finishTrial.mock.calls[0][0];
        expect(data.stimulus_side).toBe(0);
    });

    test('correct is false when no key was pressed (timeout)', () => {
        // In v6, when no key is pressed response.key remains -1,
        // so key_press = String.fromCharCode(-1) which is not in right_up/left_down → false
        plugin.trial(display_element, buildTrial({ trial_duration: 1, waiting_time: 0 }));
        jest.advanceTimersByTime(1500);

        const data = jsPsych.finishTrial.mock.calls[0][0];
        expect(data.correct).toBe(false);
    });

    test('rt is a number in trial_data', () => {
        plugin.trial(display_element, buildTrial({ trial_duration: 1, waiting_time: 0 }));
        jest.advanceTimersByTime(1500);

        const data = jsPsych.finishTrial.mock.calls[0][0];
        expect(typeof data.rt).toBe('number');
    });
});

// ---------------------------------------------------------------------------
// Correctness logic unit tests (verified via trial_data)
// In v6, getKeyboardResponse callback receives { key: numericKeyCode, rt }
// ---------------------------------------------------------------------------
describe('is_correct logic (v6)', () => {
    let display_element;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();

        let keyCallback;
        jsPsych.finishTrial = jest.fn();
        jsPsych.pluginAPI.getKeyboardResponse = jest.fn((opts) => { keyCallback = opts.callback_function; });
        jsPsych.pluginAPI.cancelKeyboardResponse = jest.fn();
        jsPsych.pluginAPI.cancelAllKeyboardResponses = jest.fn();
        jsPsych.pluginAPI.clearAllTimeouts = jest.fn();

        // Expose a helper to simulate a key press using a numeric keyCode
        jsPsych._pressKey = (keyCode) => keyCallback && keyCallback({ key: keyCode, rt: 500 });

        display_element = realCreateElement('div');
        display_element.append = jest.fn();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    function runTrialAndPressKey(trialOverrides, keyCode) {
        const trial = {
            stimulus: 'img/test.png',
            stimulus_side: 0,
            stimulus_opacity: 0.5,
            mondrian_max_opacity: 1,
            mondrian_min_opacity: 0.01,
            mask_duration: 67,
            stimulus_duration: 33,
            trial_duration: 5,
            waiting_time: 0,
            choices: ['q', 'p'],
            right_up: ['P', 'p'],
            left_down: ['Q', 'q'],
            colors: ['#FF0000'],
            rectangle_count: 5,
            mondrians_count: 2,
            rectangle_width: 6,
            rectangle_height: 6,
            fixation_width: 8.33,
            fixation_height: 2.34,
            frame_width: 150,
            frame_height: 73.4,
            stimulus_width: 61,
            stimulus_height: 61,
            fade_out_time: 1,
            fade_in_time: 0,
            fixation_visible: true,
            background_color: '#7F7F7F',
            mask_block_count: 1,
            correct_responses: [],
            post_trial_gap: 0,
            ...trialOverrides,
        };
        plugin.trial(display_element, trial);
        // Advance past the 10 ms outer timeout so the keyboard listener is registered
        jest.advanceTimersByTime(15);
        jsPsych._pressKey(keyCode);
        // Advance past the 10 ms end_trial timeout
        jest.advanceTimersByTime(15);
    }

    test('right_up key (p=112) with stimulus_side=0 (right) → correct', () => {
        runTrialAndPressKey({ stimulus_side: 0 }, 112); // 'p'
        const data = jsPsych.finishTrial.mock.calls[0][0];
        expect(data.correct).toBe(true);
    });

    test('left_down key (q=113) with stimulus_side=0 (right) → incorrect', () => {
        runTrialAndPressKey({ stimulus_side: 0 }, 113); // 'q'
        const data = jsPsych.finishTrial.mock.calls[0][0];
        expect(data.correct).toBe(false);
    });

    test('left_down key (q=113) with stimulus_side=1 (left) → correct', () => {
        runTrialAndPressKey({ stimulus_side: 1 }, 113); // 'q'
        const data = jsPsych.finishTrial.mock.calls[0][0];
        expect(data.correct).toBe(true);
    });

    test('correct_responses overrides side-based logic', () => {
        // 'q' (113) is in correct_responses, so it should be correct even with side=0
        runTrialAndPressKey({ stimulus_side: 0, correct_responses: ['q'] }, 113);
        const data = jsPsych.finishTrial.mock.calls[0][0];
        expect(data.correct).toBe(true);
    });

    test('correct_responses mismatch → incorrect', () => {
        // correct_responses=['q'] but 'p' (112) is pressed → incorrect
        runTrialAndPressKey({ stimulus_side: 0, correct_responses: ['q'] }, 112);
        const data = jsPsych.finishTrial.mock.calls[0][0];
        expect(data.correct).toBe(false);
    });

    test('key_press in trial_data is the character for the pressed keyCode', () => {
        runTrialAndPressKey({ stimulus_side: 0 }, 112); // 'p'
        const data = jsPsych.finishTrial.mock.calls[0][0];
        expect(data.key_press).toBe('p');
    });
});
