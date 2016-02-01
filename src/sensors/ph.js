// Todo support callibaration libraries for sensors.
// These should accumlate data do some basic cleaning and store the data to 
GROWJS.prototype.phChange = function (value) {
  var self = this;

  // Todo: add values to object, when logged, we will do some smoothing.
  return 0.0178 * value - 1.889;
}

GROWJS.prototype.log_ph = function () {
  var self = this;
  self.readableStream.push({
      name: "Ph",
      type: "ph",
      unit: "ph",
      value: self.ph
  });
}
