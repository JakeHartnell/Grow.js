var GrowInstance = require('.././grow.js');

// I think this is a simpler model to understand because the 
// implementation and document are blended.

// Connects by default to localhost:3000
var grow = new GrowInstance({
    "name": "Light and light sensor",
    "version": "0.1.1",
    "description": "A basic device example.",
    "owner": "jake@commongarden.org",
    "components": [
        {
            "name": "Light sensor",
            "type": "light",
            "template": "sensor",
            "controller": "analog",
            "actions": [
                {
                    "name": "Log light data",
                    "id": "log_light_data",
                    "schedule": "every 1 second",
                    "function": function () {
                        console.log("Win");
                    }
                }
            ]
        },
        {
            "name": "Light",
            "type": "relay",
            "template": "actuator",
            "state": "off",
            "actions": [
                {
                    "name": "On",
                    "id": "turn_light_on",
                    "updateState": "on",
                    "schedule": "at 9:00am",
                    "event": "Light turned on",
                    "function": function () {
                        console.log("Light on");
                    }
                },
                {
                    "name": "off",
                    "id": "turn_light_off",
                    "updateState": "off",
                    "schedule": "at 8:30pm",
                    "event": "Light turned off",
                    "function": function () {
                        console.log("light off");
                    }
                }
            ]
        }
    ]
});
