GROWJS.prototype.setupSensors = function() {
  var self = this;
  self.ph = {
  	phData: [],
  	params: {
      vRef: 4.096,
      opampGain: 5.25,
      pH7Cal: 2048,
      pH4Cal: 1286,
      pHStep: 59.16 
    }
  };
  self.temperature = {};
  self.light = {};
}
