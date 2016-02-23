GROWJS.prototype.sendData = function (data, callback) {
  var self = this;

  if (!self.ddpclient || !self.uuid || !self.token) {
    callback("Invalid connection state.");
    return;
  }

  self.ddpclient.call(
    'Device.sendData',
    [{uuid: self.uuid, token: self.token}, data],
    function (error, result) {
      if (error) console.log(error);

      if (!_.isUndefined(callback)) {
        callback(null, result);
      }
    }
  );
};

GROWJS.prototype.emitEvent = function (eventMessage, callback) {
  var self = this;

  var body = eventMessage;
  body.timestamp = new Date();

  self.ddpclient.call(
    'Device.emitEvent',
    [{uuid: self.uuid, token: self.token}, body],
    function (error, result) {
      if (!_.isUndefined(callback)) {
        callback(error, result);
      }
    }
  );
};

// Maybe this function needs to be split up?
// Maybe two functions? Update property and update component?
// Either way, this is really an update thing function, and exchanges
// way too much info just to update a property.
GROWJS.prototype.updateProperty = function (componentName, propertyKey, value, callback) {
  var self = this;

  var thing = self.growFile.thing;

  // This is implemented on the server as well

  // Find properties in top level thing object
  for (var key in thing) {
    // Find properties in components 
    if (key === "components") {
      for (var item in thing.components) {
        if (thing.components[item].name === componentName) {
          thing.components[item][propertyKey] = value;
        }
      }
    } else if (thing[key] === componentName) {
      thing[key] = value;
    }
  }

  self.writeChangesToGrowFile();

  // Maybe this should be a callback of write changes?
  // Otherwise we have instances when state is out of sync.
  self.ddpclient.call(
    'Device.udpateProperty',
    [{uuid: self.uuid, token: self.token}, componentName, propertyKey, value],
    function (error, result) {
      if (!_.isUndefined(callback)) {
        callback(error, result);
      }
    }
  );
};
