/*
  This section contains utilities for calibrating and working with data from ph sensors.
*/

GROWJS.prototype.ph = {
  phData: [],

  // Defaults
  params: {
    vRef: 4.096,
    opampGain: 5.25,
    pH7Cal: 2048,
    pH4Cal: 1286,
    pHStep: 59.16 
  },

  // Adds readings to ph Data.
  addReading: function(reading) {
    if (_.isUndefined(this.phData)) {
      this.phData = [];
      this.phData.push([Date.now(), reading]);
    } else {
      this.phData.push([Date.now(), reading]);
    }
  },

  // Log ph and clear short term data store.
  log_ph: function () {
    var ph = this.calcpH();
    // We reset phData after calculating.
    // delete phData;
    return {
      name: "Ph",
      type: "ph",
      unit: "ph",
      value: ph
    };
  },

  // Lets read our raw reading while in pH7 calibration fluid and store it
  // We will store in raw int formats as this math works the same on pH step calcs
  calibratepH7: function (calnum){
    this.params.pH7Cal = calnum;
    this.calcpHSlope();
  },

  // Lets read our raw reading while in pH7 calibration fluid and store it
  // We will store in raw int formats as this math works the same on pH step calcs
  calibratepH7: function (calnum){
    this.params.pH7Cal = calnum;
    this.calcpHSlope();
  },

  // This is really the heart of the calibration process, we want to capture the
  // probes "age" and compare it to the Ideal Probe, the easiest way to capture two readings,
  // at known point(4 and 7 for example) and calculate the slope.
  // If your slope is drifting too much from ideal (59.16) its time to clean or replace!
  calcpHSlope: function () {
    //RefVoltage * our deltaRawpH / 12bit steps *mV in V / OP-Amp gain /pH step difference 7-4
    this.params.pHStep = ((((this.vRef*(this.params.pH7Cal - this.params.pH4Cal))/4096)*1000)/this.opampGain)/3;
  },

  average: function () {
    var total = 0;
    if (!_.isUndefined(this.phData)) {
      for (var i = this.phData.length - 1; i >= 0; i--) {
        total = total + this.phData[i][1];
      }
      return total / this.phData.length;
    }
  },

  // Now that we know our probe "age" we can calculate the proper pH Its really a matter of applying the math
  // We will find our millivolts based on ADV vref and reading, then we use the 7 calibration
  // to find out how many steps that is away from 7, then apply our calibrated slope to calculate real pH
  calcpH: function() {
    // TODO: use better math than just an average.
    // var result = regression('linear', this.phData);
    var params = this.params;
    var result = this.average();
    var miliVolts = ((result/4096)*params.vRef)*1000;
    var temp = ((((params.vRef*params.pH7Cal)/4096)*1000)- miliVolts)/params.opampGain;
    var pH = 7-(temp/params.pHStep);
    return pH;
  }
};
