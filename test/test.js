// var assert = require('assert');
var GrowInstance = require('../dist/grow.js');
var growFile = require('./testgrow.json');


var grow = new GrowInstance({
    start: function () {
      console.log("Started.")
    },
    waterPlant: function (options) {
      console.log(options);
    },
    light_on: function () {
      console.log("light on");
      // return true;
    },
    light_off: function () {
      return true;
    },
    check_water_level: function () {
      console.log("Water level good");
      return true;
    },
    log_light: function () {
      return true;
    },
    log_temperature: function () {
      return true;
    },
    log_ph: function () {
      return true;
    }

}, growFile);

// console.log(grow);

grow.ph.addReading(200);
grow.ph.addReading(202);
grow.ph.addReading(200);
grow.ph.addReading(203);

grow.ph.calcpH();

