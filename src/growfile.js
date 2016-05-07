/**
 * Writes any changes to the state.json file. The state.json file is used for state. 
 * In case the device looses internet connnection or power and needs to reset, the grow file contains the instructions such as schedules, where the device is supposed to connect to.
 */
GROWJS.prototype.writeChangesToGrowFile = function () {
  var self = this;

  fs.writeFile('./state.json', JSON.stringify(self.config, null, 4), function (error) {
    if (error) return console.log("Error", error);
  });
};
