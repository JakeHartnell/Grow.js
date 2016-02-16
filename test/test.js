// var assert = require('assert');
var GrowInstance = require('../build/grow.js');
var growFile = require('./testgrow.json');

// Note: we still need to write proper tests.
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
        console.log("light off");
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
  }, 
  growFile, 
  function (error, grow) {
    console.log(grow.getActionMetaByCall("light_on"));
    setTimeout(function(){grow.callAction("light_off");}, 10000)
    grow.callAction("light_off");
    // grow.updateProperty("Smart Pot", "state", "value")
    // grow.emitEvent("message");
    // console.log(grow.sensor);

    // grow.ph.addReading(200);
    // grow.ph.addReading(202);
    // grow.ph.addReading(200);
    // grow.ph.addReading(203);

    grow.getActions();
  }
);


