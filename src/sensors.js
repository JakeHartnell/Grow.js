// TODO: define sensor function and use it to init 
GROWJS.prototype.Sensor = function () {
	var self = this;

	// TODO: get useful info from component.
	// Like type.


	// console.log(component);

	self.log = function () {
		self.readableStream.push({
			'type': 'type',
			'value': 1
		});
	};

	self.data = [];

	self.calibration = {};

	self.addReading = function (reading) {
	      this.data = [];
	      this.data.push([Date.now(), reading]);
	      this.data.push([Date.now(), reading]);
	};

	self.averageData = function () {
		var total = 0;
		if (!_.isUndefined(this.data)) {
		  for (var i = this.data.length - 1; i >= 0; i--) {
		    total = total + this.phData[i][1];
		  }
		  return total / this.data.length;
		}
	};

	// TODO
	// The calibration function could be very simple and utilized for 
	// multiple sensors.
	// Correct reading is optional, if left out, it returns a calibrated reading
	// based on current calibration data.
	self.calibrate = function (reading, correctReading) {
	  // return;
	};

	return self;
};

GROWJS.prototype.registerSensor = function (component) {
	var self = this;

	// TODO: get component type and register as it.
	

	// TODO: if there is already one type of commont we start appending numbers
	/*
		self.ph
		self.ph1
		self.ph2
	*/

};
