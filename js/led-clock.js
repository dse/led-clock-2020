var TimeTicker = (function () {
    function TimeTicker(options) {
    }
    TimeTicker.prototype.start = function () {
        var date = new Date();
        this.callback(date);
        this.timeout = setTimeout(function () {
            this.start();
        }.bind(this), 500 - date.getTime() % 500);
    };
    TimeTicker.prototype.stop = function () {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    };
    return TimeTicker;
}());

function absoluteURL(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.href;
}

// polyfill
window.AudioContext = window.AudioContext || window.webkitAudioContext;

var LEDClockAudio;

if (window.AudioContext && (location.protocol === 'http:' || location.protocol === 'https:')) {
    LEDClockAudio = (function () {
        var context = new AudioContext();
        var audioCollection = {};
        function LEDClockAudio(url) {
            this.audio = audioCollection[url];
            if (!this.audio) {
                this.audio = audioCollection[url] = {};
                var request = new XMLHttpRequest();
                request.open('GET', url, true);
                request.responseType = 'arraybuffer';
                request.onload = function () {
                    context.decodeAudioData(request.response, function (buffer) {
                        this.audio.buffer = buffer;
                    }.bind(this));
                }.bind(this);
                request.send();
            }
        }
        LEDClockAudio.prototype.play = function () {
            if (!this.audio.buffer) {
                return;
            }
            var source = context.createBufferSource();
            source.buffer = this.audio.buffer;
            source.connect(context.destination);
            source.start(0);
        };
        return LEDClockAudio;
    }());
} else {
    // fallback that works well in Chrome but not Safari.
    LEDClockAudio = (function () {
        function LEDClockAudio(url) {
            this.url = url = absoluteURL(url);
            this.audio = new Audio(url);
            this.audio.volume = 1;
        }
        LEDClockAudio.prototype.play = function () {
            this.audio.currentTime = 0;
            this.audio.play();
        };
        return LEDClockAudio;
    }());
}

/**
 * requestAnimationFrame polyfill
 */

(function () {
    var raf = window.requestAnimationFrame;
    raf = raf || window.mozRequestAnimationFrame;
    raf = raf || window.webkitRequestAnimationFrame;
    raf = raf || window.msRequestAnimationFrame;
    raf = raf || window.oRequestAnimationFrame;
    window.requestAnimationFrame = raf;

    var caf = window.cancelAnimationFrame;
    caf = caf || window.mozCancelAnimationFrame;
    caf = caf || window.webkitCancelAnimationFrame;
    caf = caf || window.msCancelAnimationFrame;
    caf = caf || window.oCancelAnimationFrame;
    caf = caf || window.mozCancelRequestAnimationFrame;
    caf = caf || window.webkitCancelRequestAnimationFrame;
    caf = caf || window.msCancelRequestAnimationFrame;
    caf = caf || window.oCancelRequestAnimationFrame;
    window.cancelAnimationFrame = caf;

    if (!window.requestAnimationFrame || !window.cancelAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
}());

// stackoverflow says absolute URLs work in safari
var tickURL = absoluteURL('sounds/tick2.wav');

var LEDClock = (function () {
    function LEDClock(options) {
        this.is24Hour = false;
        if (options) {
            if (!this.element && options.elementId) {
                this.element = document.getElementById(options.elementId);
            }
            if (!this.element && options.element) {
                this.element = options.element;
            }
        }
        if (!this.element) {
            return;
        }
        this.elements = {};
        this.elements.hour   = this.element.querySelector('[data-led-clock-hour]');
        this.elements.colon  = this.element.querySelector('[data-led-clock-colon]');
        this.elements.minute = this.element.querySelector('[data-led-clock-minute]');
        this.elements.second = this.element.querySelector('[data-led-clock-second]');
        this.elements.ampm   = this.element.querySelector('[data-led-clock-ampm]');
        var date = new Date();

        this.audio = new LEDClockAudio(tickURL);

        this.element.classList.add('led-clock');
        this.ticker = new TimeTicker();
        this.ticker.callback = function (date) {
            this.setTime(date, /* tickFlag */ true);
        }.bind(this);
        this.ticker.start();
    }

    LEDClock.prototype.setEnableTicks = function (flag) {
        flag = !!flag;
        this.enableTicks = flag;
    };

    LEDClock.prototype.setEnableSecondsTicks = function (flag) {
        flag = !!flag;
        this.enableSecondsTicks = flag;
    };

    LEDClock.prototype.setEnableAudio = function (flag) {
        flag = !!flag;
        this.enableAudio = flag;
    };

    LEDClock.prototype.setIs24Hour = function (flag) {
        flag = !!flag;
        console.debug("LEDClock: setting is24Hour to " + JSON.stringify(flag));
        this.is24Hour = flag;
    };

    LEDClock.prototype.setTime = function (date, tickFlag) {
        if (!date) {
            date = new Date();
        }

        var h = date.getHours();
        var m = date.getMinutes();
        var s = date.getSeconds();
        var ms = date.getMilliseconds();

        var mm = ('0' + m).slice(-2);
        var ss = ('0' + s).slice(-2);
        var hh;
        if (this.is24Hour) {
            hh = ('0' + h).slice(-2);
        } else {
            hh = ('!' + ((h + 11) % 12 + 1)).slice(-2);
        }

        if (this.elements.hour) {
            this.elements.hour.innerHTML = hh;
        }
        if (this.elements.colon) {
            this.elements.colon.innerHTML = ms < 500 ? ':' : '&nbsp';
        }
        if (this.elements.minute) {
            this.elements.minute.innerHTML = mm;
        }
        if (this.elements.second) {
            this.elements.second.innerHTML = ss;
        }
        if (this.elements.ampm) {
            if (this.is24Hour) {
                this.elements.ampm.classList.remove('am');
                this.elements.ampm.classList.remove('pm');
            } else {
                this.elements.ampm.classList[h < 12 ? 'add' : 'remove']('am');
                this.elements.ampm.classList[h >= 12 ? 'add' : 'remove']('pm');
            }
        }

        var tick = false;
        if (tickFlag) {
            if (this.enableTicks) {
                if (s === 0 && ms < 500) {
                    tick = true;
                }
            }
            if (this.enableSecondsTicks && this.elements.second) {
                if (ms < 500) {
                    tick = true;
                }
            }
            if (tick) {
                this.audio.play();
            }
        }
    };

    LEDClock.prototype.enableAudioByUserRequest = function () {
        if (this.enabledAudioByUserRequest) {
            return;
        }
        this.enabledAudioByUserRequest = true;
        this.audio.play();
    };

    return LEDClock;
}());
