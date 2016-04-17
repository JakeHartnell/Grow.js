var GrowInstance = require('.././grow.js');

/* 
   * Add the following options to the configuration objecct if you 
   * want to connect to the Grow-IoT Alpha instance:

   "host": "grow.commongarden.org",
   "tlsOpts": {
        "tls": {
            "servername": "galaxy.meteor.com"
        }
    },
    "port": 443,
    "ssl": true,

    * Grow.js connects to localhost:3000 using the ddp protocol by default.
*/
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