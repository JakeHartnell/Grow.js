[![Slack Status](http://slack.commongarden.org/badge.svg)](http://slack.commongarden.org), [Feature Requests](http://forum.commongarden.org/c/feature-requests), [General Feedback](http://forum.commongarden.org/c/feedback)

# Grow.js
An npm packagle of useful functions for working with the [Grow-IoT app](https://github.com/CommonGarden/Grow-IoT).

Install with:

    npm install grow.js

NOTE: This is a work in progress. If you want to help read the code and comments.

# Developing
```
    git clone https://github.com/CommonGarden/grow.js
    cd grow.js
    npm install
```

#### Build grow.js with Gulp
We use [gulp](http://gulpjs.com/) as our build system, to run the examples or tests, be sure to buld the files in the `/dist/` folder. You can do so with a simple command.

```
    gulp
```

## grow.json

Grow.js uses a `grow.json` file by default to describe itself and its api. 

You will need to create a `grow.json` file to connect to a Common Garden Grow app instance (local or in the cloud). When connecting to the Grow-IoT server, grow.js prvodes info in the grow.json file so that the server and uses this to create both the UI and API.

The grow file is also used for state, in case the device looses internet connnection or power, and needs to reset.

Here is an example for a simple Ph sensor:

```
{
    "thing": {
        "name": "Ph sensor",
        "description": "An ph sensor.",
        "type": "ph",
        "class": "sensor",
        "unit": "ph",
        "actions": [
            {
                "name": "Log ph data",
                "call": "log_ph",
                "schedule": "every 1 minute",
                "event-message": "Watered plant for 20 seconds"
            }
        ]
    }
}
```

### The 'thing' object
Note the "thing" object. This is where we are defining what the device or thing (as in Internet of Things) *is*.

Things can support properties, events, actions. Things can also have `components`, or a list thing objects that comprise a thing.

```
"thing": {
        "name": "Smart Pot",
        "description": "An example growkit.",
        "type": "growkit",
        "components": [
            {
                "name": "Light sensor",
                "type": "light-sensor",
                "class": "sensor",
                "vRef": 4.96,
                "unit": "milivolts",
                "actions": [
                    {
                        "name": "Log light data",
                        "call": "log_light",
                        "sechedule": "every 1 second"
                    }
                ]
            },
            {
                "name": "Water level sensor",
                "type": "liquid-level",
                "class": "sensor",
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
                        "schedule": "every 1 second"
                    }
                ]
            },
            {
                "name": "Temperature sensor",
                "type": "temperature",
                "class": "sensor",
                "unit": "Celcius",
                "actions": [
                    {
                        "name": "Log temperature data",
                        "call": "log_temperature",
                        "options": {
                            "unit": "C"
                        },
                        "schedule": "every 1 minute"
                    }
                ]
            },
            {
                "name": "pH sensor",
                "type": "ph",
                "unit": "ph",
                "class": "sensor",
                "actions": [
                    {
                        "name": "Log ph data",
                        "call": "log_ph",
                        "schedule": "every 1 minute",
                        "event-message": "Watered plant for 20 seconds"
                    }
                ]
            },
            {
                "name": "Water pump",
                "type": "water-pump",
                "class": "actuator",
                "state": "off",
                "actions": [
                    {
                        "name": "Water plant",
                        "call": "waterPlant",
                        "options": {
                            "duration": "20 seconds"
                        },
                        "schedule": "at 10:15am",
                        "event-message": "Watered plant for 20 seconds"
                    }
                ]
            },
            {
                "name": "Light",
                "type": "relay",
                "class": "actuator",
                "state": "on",
                "actions": [
                    {
                        "name": "On",
                        "call": "light_on",
                        "state": "on",
                        "schedule": "at 9:00am",
                        "event-message": "Light turned on"
                    },
                    {
                        "name": "off",
                        "call": "light_off",
                        "state": "off",
                        "schedule": "at 8:30pm",
                        "event-message": "Light turned off"
                    }
                ]
            }
        ]
    }
}
```

## Implementation

In addition to the `grow.json` file you will need an implementation. This is where you define the functions that are referenced in the grow file. In the above example, in the list of actions, `log_ph` is the call for the action. Grow.js will expect that function to be defined in the implementation.

```

var GrowInstance = require('grow.js');
var five = require('johnny-five');
var growfile = require('./ph-sensor.json');
var board = new five.Board();

// When the board is ready we run the callback function start()
board.on("ready", function start() {
  var phSensor = new five.Sensor("A0");

  // On Johnny-five's change event we add the reading to grow.js's
  // sensor utilities.
  phSensor.on("change", function() {
    grow.ph.addReading(this.value);
  });

  // Here we create the grow instance and pass in the implemnetation and 
  // growfile.
  var grow = new GrowInstance({
    log_ph: function () {
      reading = grow.ph.log_ph();
      grow.readableStream.push(reading);
    }
  }, growfile);
});

```


### Host / Port
The host is where the device will be looking for a CommonGarden-IoT instance. By default the host is set to `localhost` and the port is set to Meteor's standard of `3000`. This will work nicely for usb devices like Arduino.

If connecting over wifi this needs to be set to your computer's IP address. Simply specify it in your grow.json file.

```
    "host": "localhost",
    "port": "3000",
    "thing": {...}
```

Likewise if you are hosting in the cloud, it should be set to the instance IP address.

### Example drivers:

* Simple LED light example: https://github.com/CommonGarden/cg-led-light-arduino
* Arduino Growkit: https://github.com/CommonGarden/growkit-arduino
* See the examples folder.


