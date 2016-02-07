var GrowInstance = require('./dist/grow.js');
var five = require('johnny-five');
var growfile = require('./grow.json');
var board = new five.Board();

board.on("ready", function start() {
  var lightSensor = new five.Sensor("A0"),
      lightSensorPower = new five.Pin(12),
      temperatureSensor = new five.Sensor("A2"),
      temperatureSensorPower = new five.Pin(11),
      phSensorPower = new five.Pin(10),
      waterLevelLow = new five.Sensor("A1"),
      phSensor = new five.Sensor("A3"),
      light = new five.Pin(5),
      waterpump = new five.Pin(7);

  /* 
    Create new Grow instance, and pass in an implementation. The implementation
    consists of strings and their corresponding functions.

    By default a Grow instance will look for a grow.json file, 
    but you can optionally passing the configuration as a second
    argument.
  */
  var grow = new GrowInstance({
    // Start is called when the actions are registered.
    // You should include code that gets data from any sensors
    // here.
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
    check_water_level: function (callback) {
      // TODO
      return;
    }
  }, growfile);
});
