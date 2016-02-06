var assert = require('assert');
var GrowInstance = require('../dist/grow.js');
var growFile = require('./testgrow.json');


var grow = new GrowInstance({
    start: function (callback) {
      // Turn on power for sensors
      // Figure out a version of the kit that doesn't need this hack.
      lightSensorPower.high();
      temperatureSensorPower.high();
      phSensorPower.high();

      // Water pump should be off.
      waterpump.high();

      // Collect data from sensors when their value changes

      // Grow.js has helpers which collect these values and convert
      // as well as clean the data for when it is eventually sent to the
      // host
      // lightSensor.on("change", function() {
      //   grow.light(this.value);
      // });
      // temperatureSensor.on("change", function() {
      //   grow.temperature(this.value);
      // });
      // phSensor.on("change", function() {
      //   grow.ph(this.value);
      // });
    },
    waterPlants: function (options, callback) {
      if (options.duration) {
        waterpump.low();
        setTimeout(function () {
          waterpump.high();
        }, options.duration)
      }
      callback();
    },
    light_on: function (callback) {
      light.low();
      callback();
    },
    light_off: function (callback) {
      light.high();
      callback();
    },
    check_water_level: function (str) {
      // TODO
      console.log("Called" + str);
    }
}, growFile);

