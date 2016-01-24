var _ = require('underscore');
var assert = require('assert');
var DDPClient = require('ddp');
EJSON = require("ddp-ejson");
var util = require('util');
var Duplex = require('stream').Duplex;
var Readable = require('stream').Readable;
var Writable = require('stream').Writable;
var fs = require('fs');
var cron = require('cron');

function GROWJS(growFile) {
  var self = this;
  
  self.cron = cron;

  if (!(self instanceof GROWJS)) {
    return new GROWJS(pathToGrowFile);
  }

  // The grow file is needed to maintain state in case our IoT device looses power or resets.
  // This part could be better...
  if (growFile) {
    self.growFile = require(growFile);
  } else {
    self.growFile = require('../../grow.json');
  }

  if (!self.growFile) {
    throw new Error("Grow.js requires a grow.json file.");
  }

  self.options = _.clone(self.growFile || {});

  if ((!self.options.uuid || !self.options.token) && (self.options.uuid || self.options.token)) {
    throw new Error("UUID and token are or both required or should be omitted and they will be generated.");
  }

  Duplex.call(self, _.defaults(self.options, {objectMode: true, readableObjectMode: true, writableObjectMode: true}));

  self.uuid = self.options.uuid || null;
  self.token = self.options.token || null;
  self.thing = self.options.thing || null;

  self._messageHandlerInstalled = false;

  self.ddpclient = new DDPClient(_.defaults(self.options, {
    host: 'localhost',
    port: 3000,
    ssl: false,
    maintainCollections: false
  }));
}

util.inherits(GROWJS, Duplex);

GROWJS.prototype.connect = function (callback) {
  var self = this;

  self.ddpclient.connect(function (error, wasReconnect) {
    if (error) return callback(error);

    if (wasReconnect) {
      console.log("Reestablishment of a Grow server connection.");
    }
    else {
      console.log("Grow server connection established.");
    }

    if (self.uuid || self.token) {
      return self._afterConnect(callback, {
        uuid: self.uuid,
        token: self.token
      });
    }

    self.ddpclient.call(
      'Device.register',
      [self.thing],
      function (error, result) {
        if (error) return callback(error);

        assert(result.uuid, result);
        assert(result.token, result);

        self.uuid = result.uuid;
        self.token = result.token;

        self._afterConnect(callback, result);
      }
    );
  });
};

GROWJS.prototype._afterConnect = function (callback, result) {
  var self = this;

  self.ddpclient.subscribe(
    'Device.messages',
    [{uuid: self.uuid, token: self.token}],
    function (error) {
      if (error) return callback(error);

      if (!self._messageHandlerInstalled) {
        self._messageHandlerInstalled = true;

        self.ddpclient.on('message', function (data) {
          data = EJSON.parse(data);

          if (data.msg !== 'added' || data.collection !== 'Device.messages') {
            return;
          }

          self.push(data.fields.body);
        });
      }
    }
  );

  /* Now check to see if we have a stored UUID.
   * If no UUID is specified, store a new UUID. */
  if (_.isUndefined(self.growFile.uuid) || _.isUndefined(self.growFile.token)) {
    self.growFile.uuid = result.uuid;
    self.growFile.token = result.token;
    fs.writeFile('./grow.json', JSON.stringify(self.growFile, null, 4), function (error) {
        if (error) return console.log("Error", error);

        console.log("New configration was saved with a uuid of: " + result.uuid);
    });
  }

  // Make a new readable stream
  self.readableStream = new Readable({objectMode: true});

  // Make a new writable stream
  self.writableStream = new Writable({objectMode: true});

  // We are pushing data when sensor measures it so we do not do anything
  // when we get a request for more data. We just ignore it.
  self.readableStream._read = function () {};

  // We catch any errors
  self.readableStream.on('error', function (error) {
    console.log("Error", error.message);
  });


  callback(null, result);
};

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
      if (error) return callback(error);

      callback(null, result);
    }
  );
};

GROWJS.prototype._write = function (chunk, encoding, callback) {
  var self = this;

  self.sendData(chunk, callback);
};

// We are pushing data to a stream as commands are arriving and are leaving
// to the stream to buffer them. So we simply ignore requests for more data.
GROWJS.prototype._read = function (size) {
  var self = this;
};


// Maybe this can be taken care of by a call back or somewhere else?
GROWJS.prototype.pipeInstance = function () {
  var self = this;

  // We pipe our readable and writable streams to the instance.
  this.pipe(self.writableStream);
  self.readableStream.pipe(this);
}

GROWJS.prototype.writeChangesToGrowFile = function () {
  var self = this;

  fs.writeFile('./grow.json', JSON.stringify(self.growFile, null, 4), function (error) {
    if (error) return console.log("Error", error);
  });
}

GROWJS.prototype.updateProperty = function (propertyName, propertyKey, value) {
  var self = this;

  var thing = self.growFile.thing;

  // Find properties in thing object
  for (key in thing) {
    // The top level thing model.
    if (key === "model") {
      if (thing[key].properties.name === propertyName) {
        thing[key].properties[propertyKey] = value;
      }
    }

    // Grow kits can also contain sensors and actuators, which have their own models.
    if (key === "sensors") {
      for (sensor in thing.sensors) {
        if (thing.sensors[sensor].model.properties.name === propertyName) {
          thing.sensors[sensor].model.properties[propertyKey] = value;
        }
      }
    }

    if (key === "actuators") {
      for (actuator in thing.actuators) {
        if (thing.actuators[actuator].model.properties.name === propertyName) {
          thing.actuators[actuator].model.properties[propertyKey] = value;
        }
      }
    }
  }

  self.writeChangesToGrowFile();

  self.ddpclient.call(
    'Device.udpateProperties',
    [{uuid: self.uuid, token: self.token}, thing],
    function (error, result) {
      if (error) return callback(error);
    }
  );
};

GROWJS.prototype.emitEvent = function (eventMessage) {
  var self = this;

  event = {
    event: eventMessage,
    timestamp: new Date()
  };

  self.ddpclient.call(
    'Device.emitEvent',
    [{uuid: self.uuid, token: self.token}, event],
    function (error, result) {
      if (error) return callback(error);

      callback(null, result);
    }
  );
}

GROWJS.prototype.stopCrons = function (crons) {
  for (var key in crons) {
     if (crons.hasOwnProperty(key)) {
        var obj = crons[key];
        obj.stop();
     }
  }
  console.log("Stopped crons");
}

    // Start crons
GROWJS.prototype.startCrons = function (crons) {
  for (var key in crons) {
     if (crons.hasOwnProperty(key)) {
        var obj = crons[key];
        obj.start();
     }
  }
  console.log("Started crons");
}


// TODO: Add update crons functionality.
// This will be similar to update state... maybe they could be based on an update property function?
// Takes the model and updates the crons property
// GROWJS.prototype.updateCrons = function (model, newCrons) {
//   model.properties[0].crons;
// };

module.exports = GROWJS;
