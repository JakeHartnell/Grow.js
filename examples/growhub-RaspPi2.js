var GrowInstance = require('.././dist/grow.js');
var growfile = require('./growhub.json');
var five = require('johnny-five');

// TODO: make working on raspberry pi
// var raspi = require('raspi-io');
// var board = new five.Board({
//   io: new raspi()
// });

var board = new five.Board();

board.on("ready", function start () {

  var hygrometer = new five.Hygrometer({
    controller: "HTU21D"
  });

  hygrometer.on("change", function() {
    console.log(this.relativeHumidity + " %");
  });

  var barometer = new five.Barometer({
    controller: "MPL3115A2"
  });

  barometer.on("data", function() {
    console.log("barometer");
    console.log("  pressure : ", this.pressure);
    console.log("--------------------------------------");
  });

  var temperature = new five.Thermometer({
    controller: "MPL3115A2"
  });

  temperature.on("data", function() {
    console.log("temperature");
    console.log("  celsius      : ", this.celsius);
    console.log("  fahrenheit   : ", this.fahrenheit);
    console.log("  kelvin       : ", this.kelvin);
    console.log("--------------------------------------");
  });

  // Define Actuators
  var fan = new five.Pin(4),
      light = new five.Pin(5),
      wateringPump = new five.Pin(6);

  // Create grow instance
  var grow = GrowInstance({
    log_temperature: function () {
      // 

    },
    log_humidity: function () {
      // body...
    },
    log_ph: function () {
      // s
    },
    log_pressure: function () {
      // 
    },
    water: function (options) {
      // Needs duration argument.
      if (options.duration) {
        wateringPump.high();
        setTimeout(function () {
          wateringPump.low();
        }, options.duration);
      }
    },
    turn_fan_off: function () {
      // 
    },
    turn_fan_on: function () {

    },
    turn_light_on: function () {

    },
    turn_light_off: function () {

    } 
  }, growfile);

  console.log(grow.sensor);

});