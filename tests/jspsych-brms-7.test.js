'use strict';

// ---------------------------------------------------------------------------
// Minimal jsPsych 7 module stub so the plugin can be loaded in Node/jsdom
// ---------------------------------------------------------------------------
const ParameterType = {
    INT: 'INT',
    FLOAT: 'FLOAT',
    STRING: 'STRING',
    BOOL: 'BOOL',
    KEYS: 'KEYS',
    COMPLEX: 'COMPLEX',
};

global.jsPsychModule = { ParameterType };

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

// Load the plugin — CommonJS exports make helpers available for testing
const {
    Fixation,
    Mondrian,
    GetStimulusSide,
    GetStimulusLocation,
    jsPsychRms,
} = require('../jspsych-brms-7.js');

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
// jsPsychRms plugin info tests
// ---------------------------------------------------------------------------
describe('jsPsychRms plugin info', () => {
    test('plugin name is "rms"', () => {
        expect(jsPsychRms.info.name).toBe('rms');
    });

    test('uses jspsych.ParameterType values (strings), not numeric codes', () => {
        const params = jsPsychRms.info.parameters;
        for (const key of Object.keys(params)) {
            expect(typeof params[key].type).toBe('string');
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
        const params = jsPsychRms.info.parameters;
        for (const key of required) {
            expect(params).toHaveProperty(key);
        }
    });

    test('correct_responses default is an empty array', () => {
        expect(jsPsychRms.info.parameters.correct_responses.default).toEqual([]);
    });

    test('stimulus_side default is -1 (random)', () => {
        expect(jsPsychRms.info.parameters.stimulus_side.default).toBe(-1);
    });

    test('default choices are q and p', () => {
        expect(jsPsychRms.info.parameters.choices.default).toEqual(['q', 'p']);
    });
});

// ---------------------------------------------------------------------------
// jsPsychRms plugin trial tests
// ---------------------------------------------------------------------------
describe('jsPsychRms plugin trial', () => {
    let plugin;
    let mockJsPsych;
    let display_element;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();

        mockJsPsych = {
            pluginAPI: {
                getKeyboardResponse: jest.fn(),
                cancelAllKeyboardResponses: jest.fn(),
            },
            finishTrial: jest.fn(),
        };

        plugin = new jsPsychRms(mockJsPsych);

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
            right_up: ['p', 'P'],
            left_down: ['q', 'Q'],
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
            ...overrides,
        };
    }

    test('calls getKeyboardResponse with the configured choices', () => {
        plugin.trial(display_element, buildTrial({ choices: ['q', 'p'] }));
        expect(mockJsPsych.pluginAPI.getKeyboardResponse).toHaveBeenCalledWith(
            expect.objectContaining({ valid_responses: ['q', 'p'] })
        );
    });

    test('does NOT register a keyboard listener when choices is ["none"]', () => {
        plugin.trial(display_element, buildTrial({ choices: ['none'] }));
        expect(mockJsPsych.pluginAPI.getKeyboardResponse).not.toHaveBeenCalled();
    });

    test('finishTrial is called after trial_duration elapses', () => {
        plugin.trial(display_element, buildTrial({ trial_duration: 1, waiting_time: 0 }));
        jest.advanceTimersByTime(1500);
        expect(mockJsPsych.finishTrial).toHaveBeenCalledTimes(1);
    });

    test('trial_data contains expected keys', () => {
        plugin.trial(display_element, buildTrial({ trial_duration: 1, waiting_time: 0 }));
        jest.advanceTimersByTime(1500);

        const data = mockJsPsych.finishTrial.mock.calls[0][0];
        expect(data).toHaveProperty('rt');
        expect(data).toHaveProperty('stimulus');
        expect(data).toHaveProperty('stimulus_side');
        expect(data).toHaveProperty('key_press');
        expect(data).toHaveProperty('is_fullscreen');
        expect(data).toHaveProperty('correct');
    });

    test('stimulus in trial_data matches the configured stimulus path', () => {
        plugin.trial(display_element, buildTrial({ stimulus: 'img/face.png', trial_duration: 1, waiting_time: 0 }));
        jest.advanceTimersByTime(1500);

        const data = mockJsPsych.finishTrial.mock.calls[0][0];
        expect(data.stimulus).toBe('img/face.png');
    });

    test('stimulus_side is forced to 0 when explicitly set', () => {
        plugin.trial(display_element, buildTrial({ stimulus_side: 0, trial_duration: 1, waiting_time: 0 }));
        jest.advanceTimersByTime(1500);

        const data = mockJsPsych.finishTrial.mock.calls[0][0];
        expect(data.stimulus_side).toBe(0);
    });

    test('correct is null when no key was pressed (timeout)', () => {
        plugin.trial(display_element, buildTrial({ trial_duration: 1, waiting_time: 0 }));
        jest.advanceTimersByTime(1500);

        const data = mockJsPsych.finishTrial.mock.calls[0][0];
        expect(data.correct).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Correctness logic unit tests (via is_correct behaviour)
// The plugin's is_correct function is internal; we verify it indirectly through
// the trial_data produced at the end of a trial.
// ---------------------------------------------------------------------------
describe('is_correct logic', () => {
    let plugin;
    let mockJsPsych;
    let display_element;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();

        let keyCallback;
        mockJsPsych = {
            pluginAPI: {
                getKeyboardResponse: jest.fn((opts) => { keyCallback = opts.callback_function; }),
                cancelAllKeyboardResponses: jest.fn(),
            },
            finishTrial: jest.fn(),
            _pressKey: (key) => keyCallback && keyCallback({ key, rt: 500 }),
        };

        plugin = new jsPsychRms(mockJsPsych);
        display_element = realCreateElement('div');
        display_element.append = jest.fn();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    function runTrialAndPressKey(trialOverrides, key) {
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
            right_up: ['p', 'P'],
            left_down: ['q', 'Q'],
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
            ...trialOverrides,
        };
        plugin.trial(display_element, trial);
        mockJsPsych._pressKey(key);
    }

    test('right_up key with stimulus_side=0 (right) → correct', () => {
        runTrialAndPressKey({ stimulus_side: 0 }, 'p');
        const data = mockJsPsych.finishTrial.mock.calls[0][0];
        expect(data.correct).toBe(true);
    });

    test('left_down key with stimulus_side=0 (right) → incorrect', () => {
        runTrialAndPressKey({ stimulus_side: 0 }, 'q');
        const data = mockJsPsych.finishTrial.mock.calls[0][0];
        expect(data.correct).toBe(false);
    });

    test('left_down key with stimulus_side=1 (left) → correct', () => {
        runTrialAndPressKey({ stimulus_side: 1 }, 'q');
        const data = mockJsPsych.finishTrial.mock.calls[0][0];
        expect(data.correct).toBe(true);
    });

    test('correct_responses overrides side-based logic', () => {
        runTrialAndPressKey({ stimulus_side: 0, correct_responses: ['q'] }, 'q');
        const data = mockJsPsych.finishTrial.mock.calls[0][0];
        expect(data.correct).toBe(true);
    });

    test('correct_responses mismatch → incorrect', () => {
        runTrialAndPressKey({ stimulus_side: 0, correct_responses: ['q'] }, 'p');
        const data = mockJsPsych.finishTrial.mock.calls[0][0];
        expect(data.correct).toBe(false);
    });
});
