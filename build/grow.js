'use strict';

var _ = require('underscore');
var assert = require('assert');
var DDPClient = require('ddp');
EJSON = require("ddp-ejson");
var util = require('util');
var Duplex = require('stream').Duplex;
var Readable = require('stream').Readable;
var Writable = require('stream').Writable;
var fs = require('fs');
var later = require('later');
var regression = require('regression');
var time = require('time')(Date);

// Use local time.
later.date.localTime();

function GROWJS(implementation, growFile, callback) {
  var self = this;

  if (!implementation) {
    throw new Error("Grow.js requires an implementation.");
  }

  if (!(self instanceof GROWJS)) {
    return new GROWJS(growFile);
  }

  // The grow file is needed to maintain state in case our IoT device looses power or resets.
  // This part could be better...
  if (growFile) {
    self.growFile = growFile;
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

  Duplex.call(self, _.defaults(self.options, { objectMode: true, readableObjectMode: true, writableObjectMode: true }));

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

  self.connect(function (error, data) {
    if (error) {
      console.log(error);
    }

    self.registerActions(implementation);

    self.pipeInstance();

    if (!_.isUndefined(callback)) {
      callback(null, self);
    }
  });
}

util.inherits(GROWJS, Duplex);

GROWJS.prototype.connect = function (callback) {
  var self = this;

  self.ddpclient.connect(function (error, wasReconnect) {
    // if (error) return callback(error);

    if (wasReconnect) {
      console.log("Reestablishment of a Grow server connection.");
    } else {
      console.log("Grow server connection established.");
    }

    if (self.uuid || self.token) {
      return self._afterConnect({
        uuid: self.uuid,
        token: self.token
      });
    }

    self.ddpclient.call('Device.register', [self.thing], function (error, result) {
      // if (error) return callback(error);

      assert(result.uuid, result);
      assert(result.token, result);

      self.uuid = result.uuid;
      self.token = result.token;

      self._afterConnect(callback, result);
    });
  });
};

GROWJS.prototype._afterConnect = function (callback, result) {
  var self = this;

  self.ddpclient.subscribe('Device.messages', [{ uuid: self.uuid, token: self.token }], function (error) {
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
  });

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

  /////////// Setup Streams /////////////////////
  // Documentation: https://nodejs.org/api/stream.html

  // Readable Stream: this is "readable" from the server perspective.
  // The device publishes it's data to the readable stream.
  self.readableStream = new Readable({ objectMode: true });

  // We are pushing data when sensor measures it so we do not do anything
  // when we get a request for more data. We just ignore it for now.
  self.readableStream._read = function () {};

  self.readableStream.on('error', function (error) {
    console.log("Error", error.message);
  });

  // Writable stream: this is writable from the server perspective. A device listens on
  // the writable stream to recieve new commands.
  self.writableStream = new Writable({ objectMode: true });

  callback(null, result);
};

// We pipe our readable and writable streams to the instance.
GROWJS.prototype.pipeInstance = function () {
  var self = this;

  this.pipe(self.writableStream);
  self.readableStream.pipe(this);
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

GROWJS.prototype.writeChangesToGrowFile = function () {
  var self = this;

  fs.writeFile('./grow.json', JSON.stringify(self.growFile, null, 4), function (error) {
    if (error) return console.log("Error", error);
  });
};

// Calls action, emits event, and updates state (if applicable).
GROWJS.prototype.callAction = function (functionName, options) {
  var self = this;

  var meta = self.getActionMetaByCall(functionName);

  if (options) {
    self.actions[functionName](options);
    self.emitEvent({
      name: meta.name,
      message: meta["event-message"],
      options: command.options
    });
  } else {
    self.actions[functionName]();
    self.emitEvent({
      name: meta.name,
      message: meta["event-message"]
    });
  }

  // TODO: If the action has a state property, we update the state.
  if (meta.state) {
    self.updateProperty(meta.name, "state", meta.state);
  }
};

GROWJS.prototype.registerActions = function (implementation) {
  var self = this;
  self.actions = _.clone(implementation || {});

  // TODO: make sure the implementation matches the growfile.

  // Sets up listening for actions on the writeable stream.
  var actions = self.actions;
  self.writableStream._write = function (command, encoding, callback) {
    for (var action in actions) {
      if (command.type === action) {
        if (command.options) {
          self.callAction(action, command.options);
        } else {
          self.callAction(action);
        }
      }
    }

    callback(null);
  };
};

// TODO:
GROWJS.prototype.startScheduledActions = function () {
  return;
};

// Returns an object of action metadata based on function name.
GROWJS.prototype.getActionMetaByCall = function (functionName) {
  var self = this;
  var actionsMeta = self.getActions();
  for (var i = actionsMeta.length - 1; i >= 0; i--) {
    if (actionsMeta[i].call === functionName) {
      return actionsMeta[i];
    }
  }
};

// Returns a list of actions in the grow file.
GROWJS.prototype.getActions = function () {
  var self = this;
  var thing = self.growFile.thing;
  var actionMetaData = [];

  for (var key in thing) {
    // Check top level thing model for actions.
    if (key === "actions") {
      for (var action in thing[key]) {
        actionMetaData.push(action);
      }
    }

    // Grow kits can also contain components, which have their own thing models.
    if (key === "components") {
      for (var component in thing.components) {
        component = thing.components[component];
        for (var property in component) {
          if (property === "actions") {
            var componentActions = component[property];
            for (var componentAction in componentActions) {
              actionMetaData.push(componentActions[componentAction]);
            }
          }
        }
      }
    }
  }

  return actionMetaData;
};

GROWJS.prototype.sendData = function (data, callback) {
  var self = this;

  if (!self.ddpclient || !self.uuid || !self.token) {
    callback("Invalid connection state.");
    return;
  }

  self.ddpclient.call('Device.sendData', [{ uuid: self.uuid, token: self.token }, data], function (error, result) {
    if (error) return callback(error);

    callback(null, result);
  });
};

GROWJS.prototype.emitEvent = function (eventMessage, callback) {
  var self = this;

  var body = {
    event: eventMessage,
    timestamp: new Date()
  };

  self.ddpclient.call('Device.emitEvent', [{ uuid: self.uuid, token: self.token }, body], function (error, result) {
    if (!_.isUndefined(callback)) {
      callback(error, result);
    }
  });
};

// Maybe this function needs to be split up?
// Maybe two functions? Update property and update component?
GROWJS.prototype.updateProperty = function (propertyName, propertyKey, value, callback) {
  var self = this;

  var thing = self.growFile.thing;

  // Find properties in top level thing object
  for (var key in thing) {
    // Find properties in components
    if (key === "components") {
      for (var component in thing.components) {
        if (thing.components[component].name === propertyName) {
          thing.components[component][propertyKey] = value;
        }
      }
    } else if (thing[key] === propertyName) {
      thing[key] = value;
    }
  }

  self.writeChangesToGrowFile();

  self.ddpclient.call('Device.udpateProperties', [{ uuid: self.uuid, token: self.token }, thing], function (error, result) {
    callback(error, result);
  });
};

/*
  This section contains utilities for calibrating and working with data from ph sensors.
*/

GROWJS.prototype.ph = {
  phData: [],

  // Defaults
  params: {
    vRef: 4.096,
    opampGain: 5.25,
    pH7Cal: 2048,
    pH4Cal: 1286,
    pHStep: 59.16
  },

  // Adds readings to ph Data.
  addReading: function addReading(reading) {
    if (_.isUndefined(this.phData)) {
      this.phData = [];
      this.phData.push([Date.now(), reading]);
    } else {
      this.phData.push([Date.now(), reading]);
    }
  },

  // Log ph and clear short term data store.
  log_ph: function log_ph() {
    var ph = this.calcpH();
    // We reset phData after calculating.
    // delete phData;
    return {
      name: "Ph",
      type: "ph",
      unit: "ph",
      value: ph
    };
  },

  // Lets read our raw reading while in pH7 calibration fluid and store it
  // We will store in raw int formats as this math works the same on pH step calcs
  calibratepH7: function calibratepH7(calnum) {
    this.params.pH7Cal = calnum;
    this.calcpHSlope();
  },

  // Lets read our raw reading while in pH7 calibration fluid and store it
  // We will store in raw int formats as this math works the same on pH step calcs
  calibratepH7: function calibratepH7(calnum) {
    this.params.pH7Cal = calnum;
    this.calcpHSlope();
  },

  // This is really the heart of the calibration process, we want to capture the
  // probes "age" and compare it to the Ideal Probe, the easiest way to capture two readings,
  // at known point(4 and 7 for example) and calculate the slope.
  // If your slope is drifting too much from ideal (59.16) its time to clean or replace!
  calcpHSlope: function calcpHSlope() {
    //RefVoltage * our deltaRawpH / 12bit steps *mV in V / OP-Amp gain /pH step difference 7-4
    this.params.pHStep = this.vRef * (this.params.pH7Cal - this.params.pH4Cal) / 4096 * 1000 / this.opampGain / 3;
  },

  average: function average() {
    var total = 0;
    if (!_.isUndefined(this.phData)) {
      for (var i = this.phData.length - 1; i >= 0; i--) {
        total = total + this.phData[i][1];
      }
      return total / this.phData.length;
    }
  },

  // Now that we know our probe "age" we can calculate the proper pH Its really a matter of applying the math
  // We will find our millivolts based on ADV vref and reading, then we use the 7 calibration
  // to find out how many steps that is away from 7, then apply our calibrated slope to calculate real pH
  calcpH: function calcpH() {
    // TODO: use better math than just an average.
    // var result = regression('linear', this.phData);
    var params = this.params;
    var result = this.average();
    var miliVolts = result / 4096 * params.vRef * 1000;
    var temp = (params.vRef * params.pH7Cal / 4096 * 1000 - miliVolts) / params.opampGain;
    var pH = 7 - temp / params.pHStep;
    return pH;
  }
};

// Export Grow.js as npm module. Be sure to include last in gulpfile concatonation.
module.exports = GROWJS;