# Grow.js
An npm packagle for creating and connecting devices to a [Grow-IoT](https://github.com/CommonGarden/Grow-IoT) instance. It works with most devices that can run node, and plays very well with the [Johnny-Five robotics library](http://johnny-five.io/).

Install with:

    npm install grow.js

## Examples:
Here are a few example drivers you can take a look at.
* Simple LED light example: https://github.com/CommonGarden/cg-led-light-arduino
* Arduino Growkit: https://github.com/CommonGarden/growkit-arduino

## Describing Devices
Grow.js uses a `grow.json` file by default to describe itself and its api. This basic data model means that you can connect many different kinds of devices and even build your own. You will need to create a `grow.json` file to connect to a Common Garden Grow app instance (local or in the cloud).

Here is an example for a simple Ph sensor:

```
{
    "thing": {
        "name": "Ph sensor",
        "description": "An ph sensor.",
        "type": "ph",
        "owner": "jake@commongarden.org",
        "actions": [
            {
                "name": "Log ph data",
                "call": "log_ph",
                "schedule": "every 1 minute",
            }
        ]
    }
}
```

The grow file is also used for state. In case the device looses internet connnection or power and needs to reset, the grow file contains the instructions such as schedules, where the device is supposed to connect to.

### The 'thing' object
A 'thing' in the Grow-IoT sense is a simple data model for describing an IoT device. Things can have the following properties:

**name**: *(required)* The name of the thing. Must not be shared with any components or actions in the grow.json file.

**owner**: *(required)* The email address of the account the device will be added to when it connects. Note: this is temporary as we're going to working on UI for connecting and confirguring devices over bluetooth or wifi.

**state**: the current state of the thing. For example, 'on' or 'off'.

**type**: The type of thing, eventually we are going to fine tune the UI for common components like temperature sensors, etc.

**description**: A description for the thing.

**actions**: A list of action objects.

**events**: A list of event objects.

The cool thing is that things can contain other things! The `components` property takes list of thing objects.

**components**: A list of thing objects.

For example: 

```
"thing": {
        "name": "Plant waterer",
        "description": "Waters a plant and logs moisture data.",
        "components": [
            {
                "name": "Moisture sensor",
                "type": "moisture",
                "template": "sensor",
                "actions": [
                    {
                        "name": "Log moisture data",
                        "call": "log_moisture",
                        "sechedule": "every 1 second"
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
                        "event": "Watered plant for 20 seconds"
                    }
                ]
            }
        ]
    }
}
```

Currently, we don't allow components to have a `components` property.

### Actions
The `actions` property of a thing or component has it's own structure.

**name**: *(required)* the name of the action. For example, "water plant".

**call**: *(required)* the name of the function to call. This much match what is in the implementation.

**options**: an additional arguments or parameters for the function.

**schedule**: a valid later.js text experession that sets up a recurring action, see the [later.js documentation](http://bunkat.github.io/later/) for more info.

**event**: setting this logs an event when the action is called.

## Implementation

In addition to the `grow.json` file you will need an implementation. **This is where you define the functions that are referenced in the `grow.json` file.** Take for example this simple ph sensor:

    "thing": {
        "name": "Ph sensor",
        "description": "An ph sensor.",
        "type": "ph",
        "owner": "jake@commongarden.org",
        "actions": [
            {
                "name": "Log ph data",
                "call": "log_ph",
                "schedule": "every 1 minute",
            }
        ],
    }

In the above example, in the list of actions, `log_ph` is the call for the action. Grow.js will expect that function to be defined in the implementation.

```

var GrowInstance = require('grow.js');

var grow = new GrowInstance({
  log_ph: function () {
    // Code to get ph and log it
  }
});

```

Check out the driver examples for more code.

### Host / Port
The host is where the device will be looking for a CommonGarden-IoT instance. By default the host is set to `localhost` and the port is set to Meteor's standard of `3000`. This will work nicely for usb devices like Arduino.

#### Connecting over wifi
Set the `host` to your computer's IP address where the Grow-IoT instance is running. Simply specify it in your grow.json file.

```
    "host": "YOUR_IP_HERE",
    "thing": {...}
```

Likewise if you are hosting in the cloud, it should be set to the instance IP address, you can also override the default port by specifiying the `port` option.

#### Connecting over SSL
SSL is supported though will require a bit more setup. If you are hosting your instance off a computer with a dedicated IP address include the following info in your grow.json file.

    "host": "YOUR_IP_HERE",
    "port": 443,
    "ssl": true,

If you are hosting on a cloud instance, you might need specify the servername. The example below shows you how to connect securely to the instance at [grow.commongarden.org](https://grow.commongarden.org):

    "host": "grow.commongarden.org",
    "tlsOpts": {
        "tls": {
            "servername": "galaxy.meteor.com"
        }
    },
    "port": 443,
    "ssl": true,
    "thing": { ... }

# Developing
```
git clone https://github.com/CommonGarden/grow.js
cd grow.js
npm install
```

We use [gulp](http://gulpjs.com/) as our task runner. We use it to run tests, build docs, minify the code, lint things, etc.

`gulp build` concatonates the files in the `src` folder into one grow.js file.

`gulp test` runs tests in the test folder.

`gulp docs` builds the documentation in the docs folder.


## Contributing

Please read:
* [Code of Conduct](https://github.com/CommonGarden/Organization/blob/master/code-of-conduct.md)
* [Contributing info](https://github.com/CommonGarden/Organization/blob/master/contributing.md)

### Reach out
Get involved with our community in any way you are interested:

* [Join us on Slack](http://slack.commongarden.org) — Collaboration and real time discussions.
* [Forum](http://forum.commongarden.org/) — General discussion and support by the Common Garden community.

### Acknowledgements
Special thanks to @Mitar for contributing the starting point for this library. This work was also inspired by work the [W3C interest group on the internet of things](https://github.com/w3c/web-of-things-framework).

## License
Grow.js is released under the 2-Clause BSD License, sometimes referred to as the "Simplified BSD License" or the "FreeBSD License".