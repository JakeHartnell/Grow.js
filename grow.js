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

function GROWJS(growFile) {
  var self = this;
  
  self.later = later;

  // Use local time.
  self.later.date.localTime();

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


// Todo: break this code up into different files.
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

GROWJS.prototype.updateProperty = function (propertyName, propertyKey, value, callback) {
  var self = this;

  var thing = self.growFile.thing;

  // Find properties in top level thing object
  for (key in thing) {
    if (key === propertyName) {
      // thing[key][propertyKey] = value;
    }

    // Find properties in components 
    if (key === "components") {
      for (component in thing.components) {
        if (thing.components[component].name === propertyName) {
          thing.components[component][propertyKey] = value;
        }
      }
    }
  }

  self.writeChangesToGrowFile();

  self.ddpclient.call(
    'Device.udpateProperties',
    [{uuid: self.uuid, token: self.token}, thing],
    function (error, result) {
      // if (error) return callback(error);
      callback(error, result);
    }
  );
};

GROWJS.prototype.emitEvent = function (eventMessage, callback) {
  var self = this;

  event = {
    event: eventMessage,
    timestamp: new Date()
  };

  self.ddpclient.call(
    'Device.emitEvent',
    [{uuid: self.uuid, token: self.token}, event],
    function (error, result) {
      callback(error, result);
    }
  );
}


// http://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
GROWJS.prototype.executeFunctionByName = function (functionName, context /*, args */) {
  var args = [].slice.call(arguments).splice(2);
  var namespaces = functionName.split(".");
  var func = namespaces.pop();
  for(var i = 0; i < namespaces.length; i++) {
    context = context[namespaces[i]];
  }
  return context[func].apply(context, args);
}


// Modify this so that it is namespaced for grow.
GROWJS.prototype.callFunction = function(str) {
  var arr = str.split(".");

  var fn = this;
  for (var i = 0, len = arr.length; i < len; i++) {
    fn = fn[arr[i]];
  }

  if (typeof fn !== "function") {
    throw new Error("function not found");
  }

  return  fn;
};


GROWJS.prototype.getActions = function () {
  var self = this;
  var actions = [];


  for (key in thing) {
    // The top level thing model.
    if (key === "actions") {
      console.log(typeof thing[key]);
    }

    // Grow kits can also contain sensors and actuators, which have their own models.
    if (key === "components") {
      for (component in thing.components) {
        for (key in component) {
          if (component[key] === "actions") {
            actions.push(component[key]);
          }
        }
      }
    }
  }

  console.log(actions);
  return actions;
}

// Maybe this should just be a start function?
GROWJS.prototype.linkActions = function (actionFunctions) {
  var self = this,
      actions = self.getActions()

  for (key in actionFunctions) {
    console.log(actionFunctions[key]);
  }

  // Basically we need to get it so that the call function 

  // TODO: If action has an "every" atribute, we parse it with later and set the timeout
  // // execute logTime one time on the next occurrence of the text schedule
  // var timer = self.later.setTimeout(logTime, textSched);

  // // execute logTime for each successive occurrence of the text schedule
  // var timer2 = self.later.setInterval(logTime, textSched);


  // When actions are registered pipe instance
  self.pipeInstance();


}

GROWJS.prototype.writableStream._write = function (command, encoding, callback) {
  var self = this;

  // Get a list of action objects and calls
  var actions = self.getActions();

  // Make sure to support options too.
  for (action in actions) {
    // Support command.options
    if (command.type === action.call) {
      if (command.options) {
        self.callFunction(action.call, command.options);
      } else {
        self.callFunction(action.call);
      }
      // Should the below be done in a call back.
      self.updateProperty(action.actuator.name, "state", action.state)
      // If command.options, this should be included in event.
      self.emitEvent({
        name: action.name
      });
    }
  }
}



// Todo support callibaration libraries for sensors.
// These should accumlate data do some basic cleaning and store the data to 
GROWJS.prototype.phChange = function (value) {
  var self = this;

  // Todo: add values to object, when logged, we will do some smoothing.
  return 0.0178 * value - 1.889;
}

GROWJS.prototype.temperatureChange = function (value) {
  var self = this;

  return (value * 3.3 / 1024 - 0.33) * 100;
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

GROWJS.prototype.log_ph = function () {
  var self = this;
  self.readableStream.push({
      name: "Ph",
      type: "ph",
      unit: "ph",
      value: self.ph
  });
}

GROWJS.prototype.log_temperature = function () {
  var self = this;
  self.readableStream.push({
      name: "Temperture",
      type: "temperature",
      unit: "Celcius",
      value: self.temperature
  });
}


GROWJS.prototype.registerEventListeners = function () {
  var self = this;
}

module.exports = GROWJS;
