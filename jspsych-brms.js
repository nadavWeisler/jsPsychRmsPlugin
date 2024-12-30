class Fixation {
    constructor(fixation_width, fixation_height, fixation_color) {
        this.width = fixation_width;
        this.height = fixation_height;
        this.color = fixation_color;
        this.draw = function (context, canvas) {
            context.save();
            context.fillStyle = this.color;
            context.fillRect((canvas.width - this.width) / 2, (canvas.height - this.height) / 2, this.width, this.height);
            context.fillRect(
                (canvas.width - this.height) / 2,
                (canvas.height - this.width) / 2,
                this.height, this.width);
            context.restore();
        };
    }
}

class Stimulus {
    constructor(stimulus_width, stimulus_height, stimulus_src, stimulus_side) {
        this.width = Number(stimulus_width);
        this.height = Number(stimulus_height);
        this.src = stimulus_src;
        this.side = stimulus_side;
        this.img = new Image();
        this.img.id = 'stimulus_img';
        this.img.src = this.src;
        this.img.onload = function () {
            console.log('Stimulus image preloaded');
        };
        this.draw = function (context, canvas, stimulus_opacity) {
            context.save();
            let stimulus_location = GetStimulusLocation(this.side, canvas);

            context.globalAlpha = Number(stimulus_opacity); // Reusing opacity value if it doesn't change

            if (this.side > 1) {
                context.drawImage(this.img, 0, stimulus_location, this.width, this.height);
            } else {
                context.drawImage(this.img,
                    stimulus_location - (this.width / 2), (canvas.height / 2) - (this.height / 2),
                    this.width, this.height);
            }

            context.restore();
        };
    }
}

class Mondrian {
    constructor(rectangle_width, rectangle_height, rectangle_count, rectangle_colors, frame_width, frame_height) {
        this.rectangle_width = Number(rectangle_width);
        this.rectangle_height = Number(rectangle_height);
        this.rectangle_count = Number(rectangle_count);
        this.rectangle_colors = rectangle_colors;
        this.frame_width = Number(frame_width);
        this.frame_height = Number(frame_height);
        this.range = [-this.rectangle_width, -this.rectangle_height,
        this.frame_width + this.rectangle_width, this.frame_height + this.rectangle_height];
        this.random_index = 0;
        this.random_numbers = [];
        for (let i = 0; i < this.rectangle_count * 10; i++) {
            this.random_numbers.push(Math.random());
        }

        this.get_random_number = function () {
            let random_number = this.random_numbers[this.random_index];
            // Increment the index and wrap around if it goes beyond the length of the array
            this.random_index = (this.random_index + 1) % this.random_numbers.length;
            return random_number;
        }

        this.draw = function (context, mondrian_opacity) {
            context.save();
            context.globalAlpha = Number(mondrian_opacity);
            for (let i = 0; i < this.rectangle_count; i++) {
                const x = Math.floor(this.get_random_number() * (this.range[2] - this.range[0]) + this.range[0]);
                const y = Math.floor(this.get_random_number() * (this.range[3] - this.range[1]) + this.range[1]);
                const width = this.rectangle_width + Math.floor(this.get_random_number() * this.rectangle_width);
                const height = this.rectangle_height + Math.floor(this.get_random_number() * this.rectangle_height);
                context.fillStyle = this.rectangle_colors[Math.floor(this.get_random_number() * this.rectangle_colors.length)];
                context.fillRect(x, y, width, height);
            }
            context.restore();
        };
    }
}

function GetStimulusSide(trial_stimulus_side, orientation = 'h') {
    if (trial_stimulus_side >= 0) {
        return trial_stimulus_side
    } else {
        let max_int = 2;
        let min_int = 0;
        if ((orientation === 'v') || (orientation === 'b')) {
            max_int = 4;
            if (orientation === 'v') {
                min_int = 2;
            }
        }
        min_int = Math.ceil(min_int);
        max_int = Math.floor(max_int);
        // Get random integer between min_int and max_int
        return Math.floor(Math.random() * (max_int - min_int)) + min_int;
    }
}

function GetStimulusLocation(stimulus_side, canvas) {
    let stimulus_location;
    if (stimulus_side === 0) {
        stimulus_location = 3 * (canvas.width / 4);
    } else if (stimulus_side === 1) {
        stimulus_location = canvas.width / 4;
    } else if (stimulus_side === 2) {
        stimulus_location = 0;
    } else if (stimulus_side === 3) {
        stimulus_location = (canvas.height / 2) + (canvas.width / 2) + 5;
    }
    return Number(stimulus_location);
}

function GetNewCanvas(id, class_name, canvas_width, canvas_height, canvas_position, canvas_visibility) {
    let newCanvas = document.createElement('canvas');
    newCanvas.id = id;
    newCanvas.className = class_name;
    newCanvas.width = canvas_width;
    newCanvas.height = canvas_height;
    newCanvas.style.position = canvas_position;
    newCanvas.style.visibility = canvas_visibility;
    return newCanvas;
}

jsPsych.plugins["rms"] = (function () {
    let plugin = {};

    plugin.info = {
        name: 'RMS',
        description: 'Repeated Mask Suppression (RMS) task',
        parameters: {
            colors: {
                type: jsPsych.plugins.parameterType.COMPLEX,
                pretty_name: 'Color palette',
                default: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'
                ],
                description: "Colors for the Mondrian"
            },
            rectangle_count: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Rectangle number',
                default: 500,
                description: "Number of rectangles in Mondrian"
            },
            mondrians_count: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Mondrian number',
                default: 50,
                description: "Number of Mondrians"
            },
            mondrian_max_opacity: {
                type: jsPsych.plugins.parameterType.FLOAT,
                pretty_name: 'Mondrian maximum contrast',
                default: 1,
                description: "Maximum contrast value for the Mondrian mask."
            },
            mondrian_min_opacity: {
                type: jsPsych.plugins.parameterType.FLOAT,
                pretty_name: 'Mondrian minimum contrast',
                default: 0.01,
                description: "Minimum contrast value for the Mondrian mask."
            },
            trial_duration: {
                type: jsPsych.plugins.parameterType.FLOAT,
                pretty_name: 'Timing response',
                default: 10,
                description: "Maximum time duration allowed for response"
            },
            choices: {
                type: jsPsych.plugins.parameterType.KEYCODE,
                pretty_name: 'Response choices',
                default: ['q', 'p']
            },
            right_up: {
                type: jsPsych.plugins.parameterType.KEYCODE,
                pretty_name: 'Responses meaning "Right" or "Up"',
                default: ['P', 'p']
            },
            left_down: {
                type: jsPsych.plugins.parameterType.KEYCODE,
                pretty_name: 'Responses meaning "Left" or "Down"',
                default: ['Q', 'q']
            },
            waiting_time: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Waiting time',
                default: 0.4,
                description: "Time to wait before showing the stimulus in seconds"
            },
            stimulus_opacity: {
                type: jsPsych.plugins.parameterType.FLOAT,
                pretty_name: 'Stimulus maximum opacity',
                default: 1
            },
            stimulus_side: {
                type: jsPsych.plugins.parameterType.INT,
                default: -1,
                description: "Stimulus side: 0 is right, 1 is left. -1 is random"
            },
            stimulus_duration: {
                type: jsPsych.plugins.parameterType.FLOAT,
                pretty_name: '',
                default: 33,
                description: ""
            },
            mask_duration: {
                type: jsPsych.plugins.parameterType.FLOAT,
                pretty_name: '',
                default: 67,
                description: ""
            },
            stimulus_width: {
                type: jsPsych.plugins.parameterType.FLOAT,
                default: 61,
                description: 'stimulus width constant, mm'
            },
            stimulus_height: {
                type: jsPsych.plugins.parameterType.FLOAT,
                default: 61,
                description: 'stimulus height constant, mm'
            },
            fade_out_time: {
                type: jsPsych.plugins.parameterType.FLOAT,
                pretty_name: 'Fade out time',
                default: 3,
                description: "When to start fading out mask. 0 is never."
            },
            fade_in_time: {
                type: jsPsych.plugins.parameterType.FLOAT,
                pretty_name: 'Fade in time',
                default: 1,
                description: "Duration of stimulus fade in."
            },
            fixation_visible: {
                type: jsPsych.plugins.parameterType.BOOL,
                default: true,
                description: 'Boolean to show fixation'
            },
            rectangle_width: {
                type: jsPsych.plugins.parameterType.FLOAT,
                default: 6,
                description: 'rWidth constant'
            },
            rectangle_height: {
                type: jsPsych.plugins.parameterType.FLOAT,
                default: 6,
                description: 'rHeight constant'
            },
            fixation_width: {
                type: jsPsych.plugins.parameterType.FLOAT,
                default: (25 / 3),
                description: 'fixation length constant'
            },
            fixation_height: {
                type: jsPsych.plugins.parameterType.FLOAT,
                default: 2.34,
                description: 'fixation height constant'
            },
            frame_width: {
                type: jsPsych.plugins.parameterType.FLOAT,
                default: 150,
                description: 'frame width constant, mm'
            },
            frame_height: {
                type: jsPsych.plugins.parameterType.FLOAT,
                default: 73.4,
                description: 'frame height constant, mm'
            },
            background_color: {
                type: jsPsych.plugins.parameterType.KEYCODE,
                default: '#7F7F7F',
                description: 'Background color'
            },
            mask_block_count: {
                type: jsPsych.plugins.parameterType.INT,
                default: 1,
                description: 'Number of blocks to show the mask'
            },
            correct_responses: {
                type: jsPsych.plugins.parameterType.KEYCODE,
                default: [],
                description: 'The correct response to the stimulus'
            }
        }
    };

    jsPsych.pluginAPI.registerPreload('rms', 'stimulus', 'image');

    plugin.trial = function (display_element, trial) {
        // Clear previous
        display_element.innerHTML = '';
        display_element.style.direction = '';

        let allTimeouts = [];

        setTimeout(function () {
            // Get cm in px
            const div_length = Number(document.getElementById("dpiDiv").clientHeight);
            const rectangle_width = Number(trial.rectangle_width * div_length);
            const rectangle_height = Number(trial.rectangle_height * div_length);
            const fixation_width = Number(trial.fixation_width * div_length);
            const fixation_height = Number(trial.fixation_height * div_length);
            const frame_width = Number(trial.frame_width * div_length);
            const frame_height = Number(trial.frame_height * div_length);
            const stimulus_width = Number(trial.stimulus_width * div_length);
            const stimulus_height = Number(trial.stimulus_height * div_length);
            const mask_duration = Number(trial.mask_duration);
            const stimulus_duration = Number(trial.stimulus_duration);
            const stimulus_max_opacity = Number(trial.stimulus_opacity);
            const mondrian_max_opacity = Number(trial.mondrian_max_opacity);
            const mondrian_min_opacity = Number(trial.mondrian_min_opacity);
            const fade_out_time = Number(trial.fade_out_time);
            const fade_in_time = Number(trial.fade_in_time);
            const start_fade_out = (Number(trial.trial_duration) * 1000) - (fade_out_time * 1000);
            const end_fade_in = Number(fade_in_time) * 1000;
            const mask_block_count = Number(trial.mask_block_count);

            let orientation = 'h';
            if (frame_height > frame_width) {
                orientation = 'v';
            }

            const stimulus_side = GetStimulusSide(trial.stimulus_side, orientation);

            const frame_canvas = GetNewCanvas('frame_canvas', 'frame_canvas', frame_width, frame_height, "block", "visible");
            frame_canvas.style.border = "20px double #000000";
            frame_canvas.style.backgroundColor = trial.background_color;
            display_element.append(frame_canvas);

            const frame_context = frame_canvas.getContext("2d");
            const fixation = new Fixation(fixation_width, fixation_height, 'black');
            const stimulus = new Stimulus(stimulus_width, stimulus_height, trial.stimulus, stimulus_side);
            const mondrians = []

            for (let i = 0; i < trial.mondrians_count; i++) {
                mondrians.push(new Mondrian(rectangle_width, rectangle_height,
                    trial.rectangle_count, trial.colors,
                    frame_width, frame_height));
            }

            mondrians_random_numbers = [];
            mondrians_index = 0;
            for (let i = 0; i < trial.trial_duration * 500; i++) {
                mondrians_random_numbers.push(Math.floor(Math.random() * mondrians.length));
            }

            function get_random_mondrian() {
                mondrians_index = (mondrians_index + 1) % mondrians_random_numbers.length;
                return mondrians[mondrians_random_numbers[mondrians_index]];
            }

            // Hide mouse
            document.body.style.cursor = "none";

            // store response
            let response = {
                rt: -1,
                key: -1
            };

            let trial_data = {}

            function is_correct(answer) {
                if (trial.correct_responses.length > 0) {
                    return trial.correct_responses.includes(answer.toLowerCase()) || trial.correct_responses.includes(answer.toUpperCase());
                }
                else {
                    if ((trial.right_up.includes(answer.toLowerCase()) || trial.right_up.includes(answer.toUpperCase())) &&
                        (stimulus_side == '0' || stimulus_side == '2')) {
                        return true;
                    } else if ((trial.left_down.includes(answer.toLowerCase()) || trial.left_down.includes(answer.toUpperCase())) &&
                        (stimulus_side == '1' || stimulus_side == '3')) {
                        return true
                    } else {
                        return false;
                    }
                }

            }

            let start_time = 0;
            let masked = false;
            let current_time = 0;
            let start_mask_time = 0;
            let start_stimulus_time = new Date().getTime();
            let stimulus_opacity = 0;
            let mondrian_opacity = 0;
            let mask_counter = 0;

            function run_animation_loop() {
                // Calculate time elapsed since the last animation frame
                current_time = new Date().getTime();

                // Check if it's time to switch between stimulus and mask
                if (masked && ((current_time - start_mask_time) >= mask_duration) && mask_counter >= mask_block_count) {
                    mask_counter = 0;
                    if (current_time - start_time >= end_fade_in) {
                        stimulus_opacity = stimulus_max_opacity;
                    } else {
                        stimulus_opacity = stimulus_max_opacity * ((current_time - start_time) / end_fade_in);
                    }
                    frame_context.clearRect(0, 0, frame_canvas.width, frame_canvas.height);
                    stimulus.draw(frame_context, frame_canvas, stimulus_opacity);
                    fixation.draw(frame_context, frame_canvas);
                    start_stimulus_time = current_time;
                    masked = false;
                } else if ((!masked && ((current_time - start_stimulus_time) >= stimulus_duration) ||
                    masked && ((current_time - start_mask_time) >= mask_duration) && mask_counter < mask_block_count)) {
                    mask_counter++;
                    if (current_time - start_time >= start_fade_out) {
                        const fade_progress = ((current_time - start_time) - start_fade_out) / (fade_out_time * 1000);
                        mondrian_opacity = (mondrian_max_opacity * (1 - fade_progress)) + (mondrian_min_opacity * fade_progress);
                        mondrian_opacity = Math.max(mondrian_opacity, mondrian_min_opacity);
                    } else {
                        mondrian_opacity = mondrian_max_opacity;
                    }
                    frame_context.clearRect(0, 0, frame_canvas.width, frame_canvas.height);
                    get_random_mondrian().draw(frame_context, mondrian_opacity);
                    fixation.draw(frame_context, frame_canvas);
                    start_mask_time = current_time;
                    masked = true;
                }

                animation = window.requestAnimationFrame(run_animation_loop);
            }

            const end_trial = function () {
                window.cancelAnimationFrame(animation);
                frame_context.clearRect(0, 0, frame_canvas.width, frame_canvas.height);

                let i;

                // kill any remaining setTimeout handlers
                for (i = 0; i < allTimeouts.length; i++) {
                    clearTimeout(allTimeouts[i]);
                }

                // kill keyboard listeners
                if (typeof keyboardListener !== 'undefined') {
                    jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
                }

                jsPsych.pluginAPI.clearAllTimeouts();
                jsPsych.pluginAPI.cancelAllKeyboardResponses();

                let fullscreen = false;
                if ((window.fullScreen) ||
                    (window.innerWidth === screen.width && window.innerHeight === screen.height)) {
                    fullscreen = true;
                }

                let key_press = String.fromCharCode(response.key);

                // gather the data to store for the trial
                trial_data = {
                    "rt": (new Date().getTime() - start_time),
                    "stimulus": trial.stimulus,
                    "stimulus_side": stimulus_side,
                    "key_press": key_press,
                    "time_post_trial": trial.post_trial_gap,
                    "is_fullscreen": fullscreen,
                    "correct": is_correct(key_press)
                };

                // clear the display
                display_element.innerHTML = '';

                // Return mouse
                document.body.style.cursor = "pointer";

                // move on to the next trial
                setTimeout(function () {
                    jsPsych.finishTrial(trial_data);
                }, 10);
            };

            // function to handle responses by the subject
            let after_response = function (info) {
                // only record the first response
                if (response.key === -1) {
                    response = info;
                }
                end_trial();
            };

            let start_trial = function () {
                allTimeouts = [];
                // Start the response listener
                if (JSON.stringify(trial.choices) !== JSON.stringify(["none"])) {
                    let keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
                        callback_function: after_response,
                        valid_responses: trial.choices,
                        rt_method: 'performance',
                        persist: false,
                        allow_held_key: false
                    });
                }

                const endTrialTO = setTimeout(function () {
                    end_trial();
                }, (trial.trial_duration + trial.waiting_time) * 1000);

                const startTrialTO = setTimeout(function () {
                    start_time = new Date().getTime();
                    run_animation_loop();
                }, trial.waiting_time * 1000);

                allTimeouts.push(startTrialTO, endTrialTO);
            };

            start_trial();

        }, 10);
    };

    return plugin;
})();
