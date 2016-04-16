var GrowInstance = require('.././dist/grow.js');

// Connects by default to localhost:3000
var grow = new GrowInstance({
	name: "Light",
	type: "light",
	template: "actuator",
	owner: "jake@commongarden.org",
	state: "off",
	actions: {
		turn_on: {
            name: "On",
            updateState: "on",
            schedule: "at 9:00am",
            event: "Light turned on",
            function: function () {
            	console.log("Light turned on");
            }
        },
        turn_off: {
            name: "Off",
            updateState: "off",
            schedule: "at 8:30pm",
            event: "Light turned off",
            function: function () {
            	console.log("Light turned off");
            }
        }
	}
});
