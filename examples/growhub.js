var GrowInstance = require('.././dist/grow.js');
var growfile = '../examples/growhub.json';
var five = require('johnny-five');

var board = new five.Board();

board.on("ready", function start () {

  // Define sensors. We are using johnny-five.io for this.
  var hygrometer = new five.Hygrometer({
    controller: "HTU21D"
  });
  var barometer = new five.Barometer({
    controller: "MPL3115A2"
  });
  var temperature = new five.Thermometer({
    controller: "MPL3115A2"
  });

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

  // Define Actuators
  var fan = new five.Pin(10),
      light = new five.Pin(11),
      wateringPump = new five.Pin(12);

  // Create grow instance, implement API as defined in growhub.json.
  var grow = GrowInstance({
    log_temperature: function () {
      if (typeof sensorData.temperature === 'object') {
        grow.readableStream.push({
          type: "temperature",
          value: sensorData.temperature.celsius
        });
      }
    },
    log_humidity: function () {
      if (typeof sensorData.humidty === 'number') {
        grow.readableStream.push({
          type: "humidty",
          value: sensorData.humidty
        });
      }
    },
    log_pressure: function () {
      if (typeof sensorData.pressure === 'number') {
        grow.readableStream.push({
          type: "pressure",
          value: sensorData.pressure
        });
      }
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