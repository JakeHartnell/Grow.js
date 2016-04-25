# Examples

New exmaples are welcome, please feel free to submit a PR with one!

## Light and Light Sensor
This simple an easy to wire sensor is a good way to get started. All you need is a microcontroller that is supported by the Johnny-Five library (many common boards like arduino and raspberry pi are supported) as well as an LED light and photoresistor.

Install the johnny-five library with:

```bash
npm install johnny-five
```

Note: you don't have to use the johnny-five library with grow.js, but it makes getting up and running with the examples much easier.

Wire up your photo resistor like so:

### Board specific tips
#### Arduino
You need to make sure that your arduino is flashed with Standard Firmata. Instructions for doing so can be found here: [TODO: insert link]

#### Raspberry Pi


#### Tessel 2




## Connecting securely to grow.commongarden.org
You can add the following options to the configuration objecct if you want to connect to the [Grow-IoT Alpha instance](https://grow.commongarden.org/):

```json
   "host": "grow.commongarden.org",
   "tlsOpts": {
        "tls": {
            "servername": "galaxy.meteor.com"
        }
    },
    "port": 443,
    "ssl": true,
```