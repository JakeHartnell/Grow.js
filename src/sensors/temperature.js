GROWJS.prototype.temperatureChange = function (value) {
  var self = this;

  return (value * 3.3 / 1024 - 0.33) * 100;
}

GROWJS.prototype.log_temperature = function () {
  var self = this;
  self.readableStream.push({
      name: "Temperture",
      type: "temperature",
      unit: "Celcius",
      value: self.temperature
  });
}

