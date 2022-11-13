function empty(value) {
    return value !== value || value === undefined || value === null || value === '';
    //     ^^^^^^^^^^^^^^^
    //     is true iff value is NaN
}

var LEDClockPage = {
    init: function (options) {
        this.ledClock = new LEDClock({
            elementId: 'led-clock'
        });
        this.setPropertiesFromStorage();
        this.setFormValues();
        this.addEvents();
    },

    addEvents: function () {
        var formCheckboxHandler = function (event) {
            var checked;
            if (event.target.hasAttribute('data-led-clock-twenty-four-hour')) {
                console.log('24');
                checked = event.target.checked;
                this.ledClock.setIs24Hour(checked);
                this.ledClock.setTime();
                localStorage.setItem('led-clock--twenty-four-hour', JSON.stringify(checked));
                event.preventDefault();
            }
            if (event.target.hasAttribute('data-led-clock-enable-ticks')) {
                console.log('ticks');
                this.ledClock.enableAudioByUserRequest();
                checked = event.target.checked;
                this.ledClock.setEnableTicks(checked);
                event.preventDefault();
            }
            if (event.target.hasAttribute('data-led-clock-enable-seconds-ticks')) {
                console.log('"ticks');
                this.ledClock.enableAudioByUserRequest();
                checked = event.target.checked;
                this.ledClock.setEnableSecondsTicks(checked);
                event.preventDefault();
            }
        }.bind(this);

        var setDefaultsHandler = function (event) {
            if (!event.target.closest('[data-led-clock-set-defaults]')) {
                return;
            }
            this.setDefaults();
            event.preventDefault();
        }.bind(this);

        var reloadHandler = function (event) {
            if (!event.target.closest('[data-led-clock-reload]')) {
                return;
            }
            console.log('reload');
            location.reload();
        }.bind(this);

        var resetHandler = function (event) {
            if (!event.target.closest('[data-led-clock-reset]')) {
                return;
            }
            this.ledClock.resetDeltaForFun();
        }.bind(this);

        document.addEventListener('input', formCheckboxHandler);
        document.addEventListener('change', formCheckboxHandler);
        document.addEventListener('click', setDefaultsHandler);
        document.addEventListener('click', reloadHandler);
        document.addEventListener('click', resetHandler);
    },

    setPropertiesFromStorage: function () {
        var style = document.documentElement.style;
        var value;

        value = localStorage.getItem('led-clock--twenty-four-hour');
        console.debug("LEDClockPage: localStorage.getItem('led-clock--twenty-four-hour') returned " + JSON.stringify(value));
        if (value !== null) {
            try {
                value = !!JSON.parse(value);
            } catch (e) {
                value = false;
            }
        } else {
            value = false;
        }
        console.debug("value is now " + JSON.stringify(value) + "; setting is24Hour to it");
        this.ledClock.setIs24Hour(value);
    },

    setFormValues: function () {
        var cs = getComputedStyle(document.documentElement);

        Array.from(document.querySelectorAll('[data-led-clock-twenty-four-hour]')).forEach(function (input) {
            var flag = this.ledClock.is24Hour;
            console.debug("LEDClockPage: is24Hour is " + JSON.stringify(flag));
            flag = !!flag;
            console.debug("LEDClockPage: setting checked flag on 24-hour checkbox to " + JSON.stringify(flag));
            input.checked = flag;
        }.bind(this));
        Array.from(document.querySelectorAll('[data-led-clock-enable-ticks]')).forEach(function (input) {
            input.checked = false;
        }.bind(this));
        Array.from(document.querySelectorAll('[data-led-clock-enable-seconds-ticks]')).forEach(function (input) {
            input.checked = false;
        }.bind(this));
    },

    setInputValue: function (input, value) {
        if (input.tagName.toLowerCase() === 'select') {
            return this.setSelectValue(input, value);
        }
        if (input.tagName.toLowerCase() === 'input' && input.type === 'checkbox') {
            input.checked = true;
            return input;
        }
        input.value = value;
        return input;
    },

    setSelectValue: function (input, value) {
        var options;
        var option;
        options = Array.from(input.options).filter(function (option) {
            return option.value === value;
        });
        if (options.length) {
            input.selectedIndex = options[0].index;
            return options[0];
        } else {
            option = document.createElement('option');
            option.setAttribute('value', value);
            option.appendChild(document.createTextNode(value));/* label */
            input.add(option);
            input.selectedIndex = option.index;
            return option;
        }
    },

    setDefaults: function () {
        var style = document.documentElement.style;
        this.ledClock.setIs24Hour(false);
        this.setFormValues();
        try {
            localStorage.removeItem('led-clock--twenty-four-hour');
        } catch (e) { }
    }
};

/*jshint eqnull: true */
document.addEventListener('click', function (event) {
    var target;
    if ((target = event.target.closest('[data-open]')) != null) {
        dataOpen(target);
    }
    if ((target = event.target.closest('[data-close]')) != null) {
        dataClose(target);
    }
});
function dataOpen(target) {
    console.log('data-open');
    var id = target.getAttribute('data-open');
    if (id == null) { return; }
    console.log(id);
    var elt = document.getElementById(id);
    if (elt == null) { return; }
    console.log(elt);
    elt.classList.add('visible');
}
function dataClose(target) {
    var id = target.getAttribute('data-close');
    if (id == null) { return; }
    var elt = document.getElementById(id);
    if (elt == null) { return; }
    elt.classList.remove('visible');
}
