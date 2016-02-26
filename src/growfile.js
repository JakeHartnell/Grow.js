GROWJS.prototype.writeChangesToGrowFile = function () {
  var self = this;

  if (typeof self.pathToGrowFile === 'string') {
    // Stupid hack.
    fs.writeFile(self.pathToGrowFile.slice(1), JSON.stringify(self.growFile, null, 4), function (error) {
      if (error) return console.log("Error", error);
    });
  } else {
    fs.writeFile('./grow.json', JSON.stringify(self.growFile, null, 4), function (error) {
      if (error) return console.log("Error", error);
    });
  }

  // TODO: implement optional callback.
};
