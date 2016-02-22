

GROWJS.prototype.temperature = {
  data: [],
  params: {},
  // Adds readings to ph Data.
  addReading: function(reading) {
    if (_.isUndefined(this.phData)) {
      this.data = [];
      this.data.push([Date.now(), reading]);
    } else {
      this.data.push([Date.now(), reading]);
    }
  },
  read: function () {
    var temp = this.calc();
    // We clear data after log.
    delete this.data;
    return {
      name: "Temperture",
      type: "temperature",
      unit: "C",
      value: temp
    };
  },
  // TODO
  // The calibration function could be very simple and utilized for 
  // multiple sensors.
  calibrate: function (correct, reading){
    return;
  },

  average: function () {
    var total = 0;
    if (!_.isUndefined(this.data)) {
      for (var i = this.data.length - 1; i >= 0; i--) {
        total = total + this.phData[i][1];
      }
      return total / this.data.length;
    }
  },

  calc: function() {
    // TODO: use better math than just an average.
    // var result = regression('linear', this.data);
    var params = this.params;
    var result = this.average();
    // TODO: incorporate params like vRef.
    return (result * 3.3 / 1024 - 0.33) * 100;
  }
}

GROWJS.prototype.log_temperature = function () {
  var self = this;
  self.readableStream.push({
      name: "Temperture",
      type: "temperature",
      unit: "Celcius",
      value: self.temperature.calc()
  });
}



