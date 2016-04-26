# Getting started
Grow.js is an npm packagle for creating and connecting devices to a [Grow-IoT](https://github.com/CommonGarden/Grow-IoT) instance. It is loosely based off of some of the work happening on the W3C web-of-things community group. [Full grow.js documentation can be found here](http://commongarden.github.io/grow.js/).

You will need a microcontroller (such as arduino or raspberry pi). Grow.js works with most devices that can run node, and plays very well with the [Johnny-Five robotics library](http://johnny-five.io/), which has plugins for [a large number of devices](http://johnny-five.io/#platform-support).

Install with:

```bash
npm install grow.js
```

You can connect to our Grow-IoT alpha instance on https://grow.commongarden.org, or see the [Grow-IoT repo](https://github.com/CommonGarden/Grow-IoT) to easily start your own private IoT network. 

## Wiring LED light example
For this example we will switch on an LED connected to an arduino like so:
![Arduino wired with LED light](https://www.google.com/url?sa=i&rct=j&q=&esrc=s&source=images&cd=&cad=rja&uact=8&ved=0ahUKEwif68vOhK3MAhUTzGMKHYVDBQIQjRwIBw&url=https%3A%2F%2Fwww.safaribooksonline.com%2Fblog%2F2013%2F07%2F16%2Fjavascript-powered-arduino-with-johnny-five%2F&bvm=bv.120552933,d.cGc&psig=AFQjCNFDhgoZjnlZkQve5ppkzsCpmW3gGg&ust=1461785262945630)

Using grow.js is as simple as passing in a configuration object to the constructor. You can optionally include a callback function.

```javascript
// Import the grow.js library.
var GrowInstance = require('grow.js');

// Create a new grow instance.
var grow = new GrowInstance({
    "name": "Light",
    "desription": "An LED light with a basic on/off api.",
    "state": "off",
    "actions": [
        {
            "name": "On",
            "id": "turn_light_on",
            "updateState": "on",
            "schedule": "at 9:00am",
            "event": "Light turned on",
            "function": function () {
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
    ]
}, function start () {
    // Optional Callback. Calls turn_light_off function on start.
    grow.callAction("turn_light_off")
});
```

From this we're able to generate a bit of UI using meteor-iot: [TODO: insert image]

The following properties are supported:

**name**: *(required)* The name of the thing.

**id**: *(required)* Must not be shared with any components or actions in the thing.json file. Maybe this could be auto generated?

**owner**: *(currently required)* Currently the email address of the account the device will be added to when it connects. Public devices will not have an owner... but that's a work in progress.

**state**: the current state of the thing. For example, 'on' or 'off'.

**type**: The type of thing, eventually we are going to fine tune the UI for common components like temperature sensors, etc.

**description**: A description for the thing.

**actions**: A list of action objects.

**events**: A list of event objects.

**template**: EXPERIMENTAL -- A web component to use as a template for the ui.

The cool thing is that things can contain other things! The `components` property takes list of thing objects.

**components**: A list of thing objects.

Currently, we don't allow components to have a `components` property.

### Actions
The `actions` property of a thing or component has it's own structure.

**name**: *(required)* the name of the action. For example, "water plant".

**id**: *(required)* the name of the function to call. This much match what is in the implementation.

**options**: an additional arguments or parameters for the function.

**schedule**: a valid later.js text experession that sets up a recurring action, see the [later.js documentation](http://bunkat.github.io/later/) for more info.

**event**: setting this emits an event when the action is called.

**function**: the actual implmentation of the action, this code is run when the action is called, and is not exchanged in any communications.

### Events
Coming soon: *a way to subscribe to device events.*

### state.json

The state.json file is also used for state. In case the device looses internet connnection or power and needs to reset, the grow file contains the instructions such as schedules, where the device is supposed to connect to.

Check out the driver examples for more code.

### Host / Port
The host is where the device will be looking for a CommonGarden-IoT instance. By default the host is set to `localhost` and the port is set to Meteor's standard of `3000`. This will work nicely for usb devices like Arduino.

#### Connecting over wifi
Set the `host` to your computer's IP address where the Grow-IoT instance is running. Simply specify it in your grow.json file.

```json
    "host": "YOUR_IP_HERE",
    "thing": {...}
```

Likewise if you are hosting in the cloud, it should be set to the instance IP address, you can also override the default port by specifiying the `port` option.

#### Connecting over SSL
SSL is supported though will require a bit more setup. If you are hosting your instance off a computer with a dedicated IP address include the following info in your configuration object.

```json
    "host": "YOUR_IP_HERE",
    "port": 443,
    "ssl": true,
```

If you are hosting on a cloud instance, you might need specify the servername. The example below shows you how to connect securely to the instance at [grow.commongarden.org](https://grow.commongarden.org):

```json
    "host": "grow.commongarden.org",
    "tlsOpts": {
        "tls": {
            "servername": "galaxy.meteor.com"
        }
    },
    "port": 443,
    "ssl": true,
    "thing": { ... }
```

# Developing
```bash
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
