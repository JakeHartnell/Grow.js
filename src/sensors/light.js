/*
	This object contains methods for working with data from light sensors.
*/

// TODO: extend Sensor prototype with extra needed methods.
GROWJS.prototype.light = {
	data: [],
	params: {
    	vRef: 5.0
	},

	addReading: function (reading) {
    	this.data.push([Date.now(), reading])
	},

    //Lets read our raw reading while in pH7 calibration fluid and store it
    //We will store in raw int formats as this math works the same on pH step calcs
	calibrateFullSun: function (calnum){
      this.params.fullSun = calnum;
	},

	log_light: function () {
	  // self.readableStream.push({
	  //     name: "Light",
	  //     type: "light-sensor",
	  //     unit: "milivolts",
	  //     value: self.light
	  // });
	}
}