/*global Symbol, AudioContext, console */

/**
 * requestAnimationFrame polyfill
 * https://gist.github.com/paulirish/1579671
 */
(function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(
                function () { callback(currTime + timeToCall); },
                timeToCall
            );
            lastTime = currTime + timeToCall;
            return id;
        };
    }
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
}());

/**
 * Array.from polyfill
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
 */
if (!Array.from) {
    Array.from = (function () {
        var symbolIterator;
        try {
            symbolIterator = Symbol.iterator ? Symbol.iterator : 'Symbol(Symbol.iterator)';
        } catch (e) {
            symbolIterator = 'Symbol(Symbol.iterator)';
        }
        var toStr = Object.prototype.toString;
        var isCallable = function (fn) {
            return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
        };
        var toInteger = function (value) {
            var number = Number(value);
            if (isNaN(number)) {
                return 0;
            }
            if (number === 0 || !isFinite(number)) {
                return number;
            }
            return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
        };
        var maxSafeInteger = Math.pow(2, 53) - 1;
        var toLength = function (value) {
            var len = toInteger(value);
            return Math.min(Math.max(len, 0), maxSafeInteger);
        };
        var setGetItemHandler = function setGetItemHandler(isIterator, items) {
            var iterator = isIterator && items[symbolIterator]();
            return function getItem(k) {
                return isIterator ? iterator.next() : items[k];
            };
        };
        var getArray = function getArray(T, A, len, getItem, isIterator, mapFn) {
            var k = 0;
            while (k < len || isIterator) {
                var item = getItem(k);
                var kValue = isIterator ? item.value : item;
                if (isIterator && item.done) {
                    return A;
                } else {
                    if (mapFn) {
                        A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
                    } else {
                        A[k] = kValue;
                    }
                }
                k += 1;
            }
            if (isIterator) {
                throw new TypeError('Array.from: provided arrayLike or iterator has length more then 2 ** 52 - 1');
            } else {
                A.length = len;
            }
            return A;
        };
        return function from(arrayLikeOrIterator /*, mapFn, thisArg */) {
            var C = this;
            var items = Object(arrayLikeOrIterator);
            var isIterator = isCallable(items[symbolIterator]);
            if ((arrayLikeOrIterator === null || arrayLikeOrIterator === undefined) && !isIterator) {
                throw new TypeError('Array.from requires an array-like object or iterator - not null or undefined');
            }
            var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
            var T;
            if (typeof mapFn !== 'undefined') {
                if (!isCallable(mapFn)) {
                    throw new TypeError('Array.from: when provided, the second argument must be a function');
                }
                if (arguments.length > 2) {
                    T = arguments[2];
                }
            }
            var len = toLength(items.length);
            var A = isCallable(C) ? Object(new C(len)) : new Array(len);
            return getArray(T, A, len, setGetItemHandler(isIterator, items), isIterator, mapFn);
        };
    })();
}

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
        this.elements.hour    = this.element.querySelector('[data-led-clock-hour]');
        this.elements.colon   = this.element.querySelector('[data-led-clock-colon]');
        this.elements.minute  = this.element.querySelector('[data-led-clock-minute]');
        this.elements.second  = this.element.querySelector('[data-led-clock-second]');
        this.elements.ampm    = this.element.querySelector('[data-led-clock-ampm]');
        this.elements.weekday = this.element.querySelector('[data-led-clock-weekday]');
        this.elements.day     = this.element.querySelector('[data-led-clock-day]');
        var date = new Date();

        this.audio = new LEDClockAudio(tickURL);

        this.element.classList.add('led-clock');
        this.ticker = new TimeTicker();
        this.ticker.callback = function (date) {
            this.setTime(date, /* tickFlag */ true);
        }.bind(this);
        this.ticker.start();
        this.addOrRemove12HourClass();
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
        this.addOrRemove12HourClass();
    };

    LEDClock.prototype.addOrRemove12HourClass = function () {
        if (this.is24Hour) {
            this.element.classList.remove('led-clock__12-hour');
            this.element.classList.add('led-clock-24-hour');
        } else {
            this.element.classList.remove('led-clock-24-hour');
            this.element.classList.add('led-clock__12-hour');
        }
    };

    LEDClock.prototype.setTime = function (date, tickFlag) {
        if (!date) {
            date = new Date();
        }

        var h = date.getHours();
        var m = date.getMinutes();
        var s = date.getSeconds();
        var ms = date.getMilliseconds();
        var day = date.getDay();
        var dd = String(date.getDate());
        while (dd.length < 2) {
            dd = '!' + dd;
        }

        var mm = ('0' + m).slice(-2);
        var ss = ('0' + s).slice(-2);
        var hh;
        if (this.is24Hour) {
            hh = ('0' + h).slice(-2);
        } else {
            hh = ('!' + ((h + 11) % 12 + 1)).slice(-2);
        }

        if (this.elements.weekday) {
            this.elements.weekday.innerHTML = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day].toUpperCase();
        }
        if (this.elements.day) {
            this.elements.day.innerHTML = dd;
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
