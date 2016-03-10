var assert = require('assert');
var GrowInstance = require('.././grow.js');
var growFile = './test/testgrow.json';

// describe('Actions', function () {
//   // Note: we still need to write proper tests.
//   // Need some work to be done with promises so that the actions
//   // are registered by the time the code runs.
//   before(function() {
    var grow = new GrowInstance({
          waterPlant: function (options) {
            return true;
          },
          light_on: function () {
            return true;
          },
          light_off: function () {
            return true;
          },
          check_water_level: function () {
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
      growFile
    );
  // });


  // TODO: figure out why grow is not defined. Once we get some basic 
  // tests working, it will be easier to write more.
//   it('should return true when calling log_ph', function () {
//     assert.equal(grow.callAction('log_ph'), true);
//   });
// });


