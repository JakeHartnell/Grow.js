var validator = require('../src/validate.js');
var assert = require("assert");

describe('These things should validate correctly', function() {
    describe('Thing 1', function() {
        it('should validate', function() {
            var thing1 = {
                "name": "Light", // The display name for the thing.
                "desription": "An LED light with a basic on/off api.",
                "state": "off", // The current state of the thing.
                "owner": "youremailhere@example.com", // The email of the account you want this device to be added to.
                "actions": [ // A list of action objects
                    {
                        "name": "On", // Display name for the action
                        "description": "Turns the light on.", // Optional description
                        "id": "turn_light_on", // A unique id
                        "updateState": "on", // Updates state on function call
                        "schedule": "at 9:00am", // Optional scheduling using later.js
                        "event": "Light turned on", // Optional event to emit when called.
                        "function": function () {
                            // The implementation of the action.
                            LED.high();
                            console.log("Light on.");
                        }
                    },
                    {
                        "name": "off",
                        "id": "turn_light_off",
                        "updateState": "off",
                        "schedule": "at 8:30pm",
                        "event": "Light turned off",
                        "function": function () {
                            LED.low();
                            console.log("Light off.");
                        }
                    },
                ],
                "events": [
                    {
                        "name": "Light data",
                        "id": "light_data",
                        "schedule": "every 1 second",
                        "function": function () {
                            lightSensor.read(function(error, value) {
                              console.log(value);
                            });
                        }
                    }
                ]
            }

            validator.validateThing(thing1);

        })
    })
});



/*
"thing": {
        "name": "value",
        "version": "0.1.5",
        "owner": "Jake@commongarden.org",
        "description": "An example growkit.",
        "type": "growkit",
        "numberOfPlants": 1,
        "state": "No plants",
        "components": [
            {
                "name": "Light sensor",
                "type": "light-sensor",
                "template": "sensor",
                "vRef": 4.96,
                "unit": "milivolts",
                "actions": [
                    {
                        "name": "Log light data",
                        "call": "log_light",
                        "sechedule": "every 1 second",
                        "event": null
                    }
                ]
            },
            {
                "name": "Water level sensor",
                "type": "liquid-level",
                "template": "sensor",
                "vRef": 3.3,
                "unit": "milivolts",
                "events": [
                    {
                        "name": "Water level low",
                        "message": "Refill the water resevoir. You can water the plant like you would any other, the water will drain into the resevoir and this notification will go away."
                    }
                ],
                "actions": [
                    {
                        "name": "Check water level",
                        "call": "check_water_level",
                        "options": {
                            "threshold": 3
                        },
                        "schedule": "every 1 second",
                        "event": null
                    }
                ]
            },
            {
                "name": "Temperature sensor",
                "type": "temperature",
                "template": "sensor",
                "unit": "Celcius",
                "actions": [
                    {
                        "name": "Log temperature data",
                        "call": "log_temperature",
                        "options": {
                            "unit": "C"
                        },
                        "schedule": "every 1 minute",
                        "event": null
                    }
                ]
            },
            {
                "name": "pH sensor",
                "type": "ph",
                "unit": "ph",
                "template": "sensor",
                "actions": [
                    {
                        "name": "Log ph data",
                        "call": "log_ph",
                        "schedule": "every 1 minute",
                        "event": null
                    }
                ]
            },
            {
                "name": "Water pump",
                "type": "water-pump",
                "template": "actuator",
                "state": "off",
                "actions": [
                    {
                        "name": "Water plant",
                        "call": "waterPlant",
                        "options": {
                            "duration": "20 seconds"
                        },
                        "schedule": "at 10:15am",
                        "event": "Watered plant for 20 seconds"
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
                        "name": "Light on",
                        "call": "light_on",
                        "updateState": "on",
                        "schedule": "at 9:00am",
                        "event": "Light turned on"
                    },
                    {
                        "name": "Light off",
                        "call": "light_off",
                        "updateState": "off",
                        "schedule": "at 8:30pm",
                        "event": "Light turned off"
                    }
                ]
            }
        ]
    }

*/
