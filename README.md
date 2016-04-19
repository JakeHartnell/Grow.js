# Grow.js
### The free, extensible, document-based, interoperable IoT framework
An npm packagle for creating and connecting devices to a [Grow-IoT](https://github.com/CommonGarden/Grow-IoT) instance. It works with most devices that can run node, and plays very well with the [Johnny-Five robotics library](http://johnny-five.io/).

Install with:

```bash
npm install grow.js
```

You will need an instance of Grow-IoT running. Luckily it's pretty easy to get started. Install Meteor if you haven't already:

```bash
git clone https://github.com/CommonGarden/Grow-IoT
cd Grow-IoT
meteor
```

# Example
Using grow.js is as simple as passing in a configuration object to the constructor. You can optionally include a callback function.

```javascript
// Import the grow.js library.
var GrowInstance = require('grow.js');

// Create a new grow instance.
var grow = new GrowInstance({
    "name": "Widget",
    "version": "0.1.1",
    "description": "A basic device example.",
    "owner": "jake@commongarden.org",
    "actions": [
        {
            "name": "Log widget",
            "id": "log_widget",
            "function": function () {
                // This is the implementation of the action.
                // Device specific code can go here, but for
                // the sake of an easy to try example:
                console.log("widget");
            }
        }
    ]
}, function() {
    // Optional Callback. Calls log_widget function on start.
    grow.callAction("log_widget")
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
