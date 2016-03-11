/**
 * Writes any changes to the grow.json file.
 */
GROWJS.prototype.writeChangesToGrowFile = function () {
  var self = this;

  fs.writeFile('./grow.json', JSON.stringify(self.growFile, null, 4), function (error) {
    if (error) return console.log("Error", error);
  });
};
