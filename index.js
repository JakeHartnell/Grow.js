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

function GROWJS(pathToGrowFile) {
  var self = this;

  if (!(self instanceof GROWJS)) {
    return new GROWJS(pathToGrowFile);
  }

  // The grow file is needed to maintain state in case our IoT device looses power or resets.
  if (pathToGrowFile) {
    self.growFile = require(pathToGrowFile);
  } else {
    self.growFile = require('./grow.json');
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
      'CommonGarden.registerDevice',
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
    'CommonGarden.messages',
    [{uuid: self.uuid, token: self.token}],
    function (error) {
      if (error) return callback(error);

      if (!self._messageHandlerInstalled) {
        self._messageHandlerInstalled = true;

        self.ddpclient.on('message', function (data) {
          data = EJSON.parse(data);

          if (data.msg !== 'added' || data.collection !== 'CommonGarden.messages') {
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
    'CommonGarden.sendData',
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

GROWJS.prototype.pipeInstance = function () {
  // We pipe our readable and writable streams to the instance.
  var self = this;

  this.pipe(self.writableStream);
  self.readableStream.pipe(this);
}

// Takes a model and updates the state property.
GROWJS.prototype.updateState = function (model, state, callback) {
  var self = this;

  var models = [];

  // Find models
  for (key in _.keys(self.growFile.thing)) {
    console.log(key);
    if (key === "model") {
      // models.push(self.growFile.thing.model);
      console.log(self.growFile.thing.model);
    }

    // Grow kits can also contain sensors and actuators, which have their own models.
    // Here we check for there existence and append an models we find to the list.
    if (key === "sensors") {
      for (sensor in self.growFile.thing.sensors) {
        console.log(sensor);
      }
    }

    if (key === "actuators") {
      for (actuator in self.growFile.thing.actuators) {
        console.log(actuator);
      }
    }
  }

  for (thing in models) {
    if (_.isEqual(thing, model)) {
      console.log(model);

    }
  }

  // console.log(self.growFile);
  // console.log(models);

  // model.properties[0].state = state;
  // writes to grow file?
  // Calls method on host?
};

// This will be similar to update state... maybe they could be based on an update property function?
// Takes the model and updates the crons property
GROWJS.prototype.updateCrons = function (model, newCrons) {
  model.properties[0].crons;
};

// This could be very useful in grow.js, as scheduling tasks will be important.
// Stop crons
GROWJS.prototype.stopCrons = function (crons) {
  for (var key in crons) {
     if (crons.hasOwnProperty(key)) {
        var obj = crons[key];
        obj.stop();
     }
  }
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

module.exports = GROWJS;
