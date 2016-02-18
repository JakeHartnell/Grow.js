var GrowInstance = require('.././dist/grow.js');
var growfile = '../examples/growhub.json';
var five = require('johnny-five');

var board = new five.Board();

board.on("ready", function start () {

  // Define sensors. We are using johnny-five for this.
  var hygrometer = new five.Hygrometer({
    controller: "HTU21D"
  });
  var barometer = new five.Barometer({
    controller: "MPL3115A2"
  });
  var temperature = new five.Thermometer({
    controller: "MPL3115A2"
  });
  var ph = new five.Sensor("A1");

  // This vartiable holds our sensor data.
  var sensorData = {};

  // On sensor change we add values to sensorData.
  hygrometer.on("change", function() {
    sensorData.humidty = this.relativeHumidity;
  });

  barometer.on("data", function() {
    sensorData.pressure = this.pressure;
  });

  temperature.on("data", function() {
    sensorData.temperature = {
      celsius: this.celsius,
      fahrenheit: this.fahrenheit,
      kelvin: this.kelvin
    };
  });

  ph.on("change", function() {
    sensorData.ph = this.value;
  });

  // Define Actuators
  var fan = new five.Pin(10),
      light = new five.Pin(11),
      wateringPump = new five.Pin(12);

  // Create grow instance
  var grow = GrowInstance({
    // TODO: format sensor data!
    log_temperature: function () {
      console.log(sensorData.temperature);
    },
    log_humidity: function () {
      console.log(sensorData.humidty);
    },
    log_ph: function () {
      console.log("sensorData.ph");
    },
    log_pressure: function () {
      console.log("sensorData.pressure");
    },
    water: function (options) {
      // Needs duration argument.
      console.log(typeof options.duration);
      if (options.duration) {
        wateringPump.low();
        setTimeout(function () {
          wateringPump.high();
        }, options.duration);
      }
    },
    turn_fan_on: function () {
      fan.low();
    },
    turn_fan_off: function () {
      fan.high(); 
    },
    turn_light_on: function () {
      light.low();
    },
    turn_light_off: function () {
      light.high();
    } 
  }, growfile);
});