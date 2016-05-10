// Import the grow.js library.
var GrowInstance = require('./grow.js');

// Create a new grow instance. Connects by default to localhost:3000
var grow = new GrowInstance({
    "name": "Light", // The display name for the thing.
    "description": "An LED light with a basic on/off api.",
    "state": "off", // The current state of the thing.
    "owner": "jake@commongarden.org", // The email of the account you want this device to be added to.
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
                // Here we simply log "Light on." See links to hardware
                // examples below to begin using microcontrollers
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
                console.log("Light off.");
            }
        }
    ],
    "events": [
        {
            "name": "Light data", // Events get a display name like actions
            "id": "light_data", // Events also get an id that is unique to the device
            "type": "light", // Data type.
            "schedule": "every 1 second", // Events should have a schedule option that determines how often to check for conditions.
            "function": function () {
                // function should return the event to emit when it should be emited.
                return Math.random();
            }
        }
    ]
}, function start () {
    // Optional Callback function. Calls turn_light_off function on start.
    grow.callAction("turn_light_off");
});
