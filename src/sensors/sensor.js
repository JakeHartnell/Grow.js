class Sensor {
	constructor (type, params = {}) {
	 super()
	 this.data = []
	 this.type = type
	 this.params = params
	} 
	
	// Adds readings to ph Data.
	addReading (reading) {
	    if (_.isUndefined(this.phData)) {
	      this.data = [];
	      this.data.push([Date.now(), reading]);
	    } else {
	      this.data.push([Date.now(), reading]);
	    }
	}
  
  	read () {
  		// perhaps check if a calculate method is defined.
	    // let temp = this.calc();
	    // // We clear data after log.
	    // super.readableStream.push {
	    //   name: "Temperture",
	    //   type: "temperature",
	    //   unit: "C",
	    //   value: temp
	    // };
	}
	
	// TODO
	// The calibration function could be very simple and utilized for 
	// multiple sensors.
	calibrate (correct, reading){
	  // return;
	}

	averageData () {
		var total = 0;
		if (!_.isUndefined(this.data)) {
		  for (var i = this.data.length - 1; i >= 0; i--) {
		    total = total + this.phData[i][1];
		  }
		  return total / this.data.length;
		}
	}

	log (reading) {
	  this.readableStream.push(reading);
	}
}
