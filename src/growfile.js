// This function needs work as it is currently our number one source of problems.
GROWJS.prototype.writeChangesToGrowFile = function () {
  var self = this;

  if (typeof self.pathToGrowFile === 'string') {
    // Stupid hack.
    console.log(self.pathToGrowFile);
    console.log(process.cwd());

    fs.writeFile(self.pathToGrowFile.slice(1), JSON.stringify(self.growFile, null, 4), function (error) {
      if (error) return console.log("Error", error);
    });
  } else {
    console.log(process.cwd());

    fs.writeFile('./grow.json', JSON.stringify(self.growFile, null, 4), function (error) {
      if (error) return console.log("Error", error);
    });
  }

  // TODO: implement optional callback.
};
