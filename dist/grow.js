var _ = require('underscore');
var assert = require('assert');
var DDPClient = require('ddp');
var EJSON = require("ddp-ejson");
var util = require('util');
var Duplex = require('stream').Duplex;
var Readable = require('stream').Readable;
var Writable = require('stream').Writable;
var fs = require('fs');
var later = require('later');

// Use local time.
later.date.localTime();

function GROWJS(implementation, growFile, callback) {
  var self = this;

  if (!implementation) {
    throw new Error("Grow.js requires an implementation.");
  }

  if (!(self instanceof GROWJS)) {
    return new GROWJS(implementation, growFile, callback);
  }

  // The grow file is needed to maintain state in case our IoT device looses power or resets.
  // This part could be better...
  if (typeof growFile === "string") {
    self.pathToGrowFile = growFile;
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

  self.connect(function(error, data) {
    if (error) {console.log(error);}

    self.registerActions(implementation);

    self.pipeInstance();
  });

  if (!_.isUndefined(callback)) {
    callback(null, self);
  }
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

    self.writeChangesToGrowFile();
  }

  /////////// Setup Streams /////////////////////
  // Documentation: https://nodejs.org/api/stream.html

  // Readable Stream: this is "readable" from the server perspective.
  // The device publishes it's data to the readable stream.
  self.readableStream = new Readable({objectMode: true});

  // We are pushing data when sensor measures it so we do not do anything
  // when we get a request for more data. We just ignore it for now.
  self.readableStream._read = function () {};

  self.readableStream.on('error', function (error) {
    console.log("Error", error.message);
  });

  // Writable stream: this is writable from the server perspective. A device listens on
  // the writable stream to recieve new commands.
  self.writableStream = new Writable({objectMode: true});

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

  
};

// Calls action, emits event, and updates state (if applicable).
GROWJS.prototype.callAction = function (functionName, options) {
  var self = this;


  var meta = self.getActionMetaByCall(functionName);

  // If the actions "event" property is set to null or is undefined,
  // No event is logged.
  if (meta.event === null || _.isUndefined(meta.event)) {
    if (options) {
      self.actions[functionName](options);
    }
    else {
      self.actions[functionName]();
    }
  }
  // Otherwise we log an event.
  else {
    if (options) {
      self.actions[functionName](options);
      self.emitEvent({
        name: meta.name,
        message: meta.event,
        options: options
      });
    }
    else {
      self.actions[functionName]();
      self.emitEvent({
        name: meta.name,
        message: meta.event
      });
    }
  }

  var component = self.getComponentByActionCall(functionName);

  if (meta.updateState) {
    self.updateProperty(component.name, "state", meta.updateState);
  }
};

GROWJS.prototype.registerActions = function (implementation) {
  var self = this;
  self.actions = _.clone(implementation || {});

  // TODO: make sure the implementation matches the growfile.
  // If not, we throw some helpful errors.

  // Start actions that have a schedule property.
  self.startScheduledActions();

  // Sets up listening for actions on the writeable stream.
  self.writableStream._write = function (command, encoding, callback) {
    for (var action in self.actions) {
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

// TODO: stop actions, restart action with new schedule, etc.
GROWJS.prototype.startScheduledActions = function () {
  var self = this;
  self.scheduledActions = [];

  if (_.isUndefined(self.actions)) {
    throw new Error("No actions registered.");
  }

  for (var action in self.actions) {
    var meta = self.getActionMetaByCall(action);

    // Actions can optionally log an event when they run.
    // Some actions like logging data from sensors are already posting
    // data so they can leave event undefined or set it to null.
    if (meta.event === null || _.isUndefined(meta.event)) {
      self.startAction(action);
    } else {
      self.startActionWithEventLog(action);
    }
  }

};

// TODO: Support options.
GROWJS.prototype.startActionWithEventLog = function (action) {
  var self = this;
  var meta = self.getActionMetaByCall(action);
  if (!_.isUndefined(meta.schedule)) {
    var schedule = later.parse.text(meta.schedule);
    var scheduledAction = later.setInterval(function() {self.callAction(action);}, schedule);
    // TODO: extend scheduled action so that they have a name.
    self.scheduledActions.push(scheduledAction);
    return scheduledAction;
  }
};

// TODO: Support options.
GROWJS.prototype.startAction = function (action) {
  var self = this;
  var meta = self.getActionMetaByCall(action);
  if (!_.isUndefined(meta.schedule)) {
    var schedule = later.parse.text(meta.schedule);
    var scheduledAction = later.setInterval(function() {self.callAction(action);}, schedule);
    self.scheduledActions.push(scheduledAction);
    return scheduledAction;
  }
};

// Maybe there should be a get action component function?
GROWJS.prototype.getComponentByActionCall = function (functionName) {
  var self = this;
  var thing = self.growFile.thing;

  var actionComponent = {};

  for (var key in thing) {
    if (key === "components") {
      // We loop through the list of component objects
      for (var component in thing.components) {
        component = thing.components[component];
        for (var property in component) {
          if (property === "actions") {
            // Loop through actions list
            for (var action in component[property]) {
              // Check the action call to see if it is the same, return component
              if (component[property][action].call === functionName) {
                actionComponent = component;
              }
            }
          }
        }
      }
    }

    // The top level thing object can also have actions, we check that here.
    if (key === "actions") {
      for (var actionItem in thing[key]) {
        if (thing[key][actionItem].call === functionName) {
          actionComponent = thing;
        }
      }
    }
  }

  return actionComponent;
};

// Returns an object of action metadata based on function name.
GROWJS.prototype.getActionMetaByCall = function (functionName) {
  var self = this;
  var actionsMeta = self.getActionsList();
  for (var i = actionsMeta.length - 1; i >= 0; i--) {
    if (actionsMeta[i].call === functionName) {
      return actionsMeta[i];
    }
  }
};

// Returns a list of action objects in the grow file.
GROWJS.prototype.getActionsList = function () {
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


// TODO: define sensor function and use it to init 
GROWJS.prototype.Sensor = function () {
	var self = this;

	// TODO: get useful info from component.
	// Like type.


	// console.log(component);

	self.log = function () {
		self.readableStream.push({
			'type': 'type',
			'value': 1
		});
	};

	self.data = [];

	self.calibration = {};

	self.addReading = function (reading) {
	      this.data = [];
	      this.data.push([Date.now(), reading]);
	      this.data.push([Date.now(), reading]);
	};

	self.averageData = function () {
		var total = 0;
		if (!_.isUndefined(this.data)) {
		  for (var i = this.data.length - 1; i >= 0; i--) {
		    total = total + this.phData[i][1];
		  }
		  return total / this.data.length;
		}
	};

	// TODO
	// The calibration function could be very simple and utilized for 
	// multiple sensors.
	// Correct reading is optional, if left out, it returns a calibrated reading
	// based on current calibration data.
	self.calibrate = function (reading, correctReading) {
	  // return;
	};

	return self;
};

GROWJS.prototype.registerSensor = function (component) {
	var self = this;

	// TODO: get component type and register as it.
	

	// TODO: if there is already one type of commont we start appending numbers
	/*
		self.ph
		self.ph1
		self.ph2
	*/

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

// Export Grow.js as npm module. Be sure to include last in gulpfile concatonation.
module.exports = GROWJS;
