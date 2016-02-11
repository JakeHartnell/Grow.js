/*
	This file contains utilities for working with data from light sensors.
*/

GROWJS.prototype.light = {
	data: [],
	params: {
    	vRef: 5.0
	},

	addReading: function (reading) {
		var self = this;
    	self.data.push([Date.now(), reading])
	},

    //Lets read our raw reading while in pH7 calibration fluid and store it
    //We will store in raw int formats as this math works the same on pH step calcs
	calibrateFullSun: function (calnum){
      var self = this;
      self.params.fullSun = calnum;
	},

	log_light: function () {
	  var self = this;
	  self.readableStream.push({
	      name: "Light",
	      type: "light-sensor",
	      unit: "milivolts",
	      value: self.light
	  });
	}
}