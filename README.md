# Grow.js
An npm packagle of useful functions for working with the [Common Garden Grow app](https://github.com/CommonGarden/Grow).

Install with:

    npm install grow.js

## grow.json
Grow.js uses a `grow.json` file by default to describe itself and its api. It is also used for state, in case the device looses internet connnection or power.

You will need to create a `grow.json` file to connect to a Common Garden Grow app instance (local or in the cloud), as this file is used to generate both the API and UI for the device!

Here is an example for a simple LED light device:

{
    "host": "localhost",
    "port": "3000",
    "thing": {
        "model": {
            "properties": {
                "name": "Light",
                "description": "An LED light.",
                "state": "off",
                "crons": [
                    {
                        "name": "lightsOn",
                        "text": "Lights on",
                        "cron": "* * * * *"
                    },
                    {
                        "name": "lightsOff",
                        "text": "Lights off",
                        "cron": "0 19 * * *"
                    }
                ]
            },
            "events": {
                "turned-on": null,
                "turned-off": null
            },
            "actions": [
                {
                    "name": "On",
                    "call": "light_on"
                },
                {
                    "name": "off",
                    "call": "light_off"
                }
            ]
        }
    }
}

### Host / Port
The host is where the device will be looking for a CommonGarden-IoT instance. If you've got an arduino plugged in via usb and using meteor on the default port, you would use the following in your grow.json file:

```
    "host": "localhost",
    "port": "3000",
```

If connecting over wifi this needs to be set to your computer's IP address.

Likewise if you are hosting in the cloud, it should be set to the instance IP address.

### The 'thing' object
Note the "thing" object. This is where we are defining what the device or thing (as in Internet of Things) *is*. 

A thing must contain at least one model (see below).

It may also contain `sensors` and `actuators`, which are lists of models for the component things.

No other fields are currently supportted.

### Models
Models describe the api of the device. A model object which defines *properties*, *events*, and *actions*. Structuring the data in this way allows us to generate a UI and API for the device based soley on the grow.json file, as well as allowing us to make more complicated devices that might be comprised of many sensors and actuators.

Here's the model for our LED Light again:

```
"model": {
    "properties": {
        "name": "Light",
        "description": "An LED light.",
        "type": "relay",
        "state": "off",
        "crons": [
            {
                "name": "lightsOn",
                "text": "Lights on",
                "cron": "* * * * *"
            },
            {
                "name": "lightsOff",
                "text": "Lights off",
                "cron": "0 19 * * *"
            }
        ]
    },
    "events": {
        "Light on": null,
        "Light off": null
    },
    "actions": [
        {
            "name": "On",
            "call": "light_on"
        },
        {
            "name": "off",
            "call": "light_off"
        }
    ]
}

```

Note, actions are a list of action objects. Each of them will be listed in the UI under there `name`. The `call` property reference the name of a function the driver implementation. TODO: support arguments.

## Driver implementation
A device driver is the birdge between a piece of hardware and the server. Think of the `grow.json` file as a map or blue print, and the driver as the implementation of the blue print.

Once you create a grow.json, you need to create an implementation of that api, and connect to Common Garden. Grow.js is here to help make this easier though.

Here is the example driver for the 

```
var five = require('johnny-five');
var Grow = require('grow.js');

// Create a new Grow object.
var grow = new Grow();

// Note: this defaults to a grow.json file in the main project directory.
// You can alternatively pass in the JSON file you want to use. Like so:
// var growFile = require('./config.json');
// var grow = new Grow(growFile);

// Connect to the new grow instance and write your driver implementation in
// the callback function.
grow.connect(function (error, data) {
  if (error) return console.log("Error", error);

  // BEGIN DRIVER IMPLEMENTATION
  var board = new five.Board();
  
  board.on("ready", function() {
    var light = new five.Pin(13);

    light.high();
    
    // Commands
    grow.writableStream._write = function (command, encoding, callback) {
      if (command.type === 'light_on') {
        // Set pin to high to turn on LED
        light.high();
        
        // Update state of light to "On".
        grow.updateProperty("Light", "state", "on");

        // Emit a light on event.
        grow.emitEvent({
          name: "Light on"
        });
      }

      else if (command.type === 'light_off') {
        light.low();

        grow.updateProperty("Light", "state", "off");

        grow.emitEvent({
          name: "Light off"
        });
      }

      else {
        console.log("Unknown command", command);
      }

      callback(null);
    };

  });

  // END DRIVER IMPLEMENTATION

  // Pipe the instance
  grow.pipeInstance();
});

```

### Example drivers:

* Simple LED light example: https://github.com/CommonGarden/cg-led-light-arduino
* Arduino Growkit: https://github.com/CommonGarden/growkit-arduino
