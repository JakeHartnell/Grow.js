/**
 * Writes any changes to the state.json file.
 */
GROWJS.prototype.writeChangesToGrowFile = function () {
  var self = this;

  fs.writeFile('./state.json', JSON.stringify(self.config, null, 4), function (error) {
    if (error) return console.log("Error", error);
  });
};
