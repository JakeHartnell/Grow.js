/*
	This file contains utilities for working with data from light sensors.
*/

// should get this from the component.
var vRef = 5.0;

GROWJS.prototype.lightChange = function (value) {
	return;
}

GROWJS.prototype.log_light = function () {
  var self = this;
  self.readableStream.push({
      name: "Light",
      type: "light-sensor",
      unit: "milivolts",
      value: self.light
  });
}