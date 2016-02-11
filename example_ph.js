var GrowInstance = require('./dist/grow.js');
var five = require('johnny-five');
var growfile = require('./ph-sensor.json');
var board = new five.Board();

board.on("ready", function start() {
  var phSensor = new five.Sensor("A0");

  // Collect data from sensors when their value changes. For now we will store
  // it in an object.

  // On Johnny-five's change event we log the value.
  phSensor.on("change", function() {
    grow.ph.addReading(this.value);
  });

  /* 
    Create new Grow instance, and pass in an implementation. The implementation
    consists of strings and their corresponding functions.

    By default a Grow instance will look for a grow.json file, 
    but you can optionally passing the configuration as a second
    argument.
  */
  var grow = new GrowInstance({
    log_ph: function () {
      console.log("aslkdfjlksdf");
    }
  }, growfile);
});
