var _ = require('underscore');
var assert = require('assert');
var DDPClient = require('ddp');
var EJSON = require("ddp-ejson");
var util = require('util');
var Duplex = require('stream').Duplex;
var Readable = require('stream').Readable;
var Writable = require('stream').Writable;
var fs = require('fs');
var RSVP = require('rsvp');
var later = require('later');

// Use local time.
later.date.localTime();

/**
 * Constructs a new grow instance, connects to the Grow-IoT server specified in the config
   (default localhost:3000), registers the device with the Server (if it's the first time connecting it saves a new
   uuid and token), and sets up readable and writable streams.
 * @constructor
 * @param {Object} config  
 * @param {Function} callback  An optional callback.
 * @return     A new grow instance.
 */
function GROWJS(config, callback) {
  var self = this;

  if (!config) {
    throw new Error("Grow.js requires an config object.");
  }

  if (!(self instanceof GROWJS)) {
    return new GROWJS(config, callback);
  }

  // Check for state.json, if it exists, this device has already been configured.
  try {
    // Note, this won't have functions, so we need to add actions...
    self.config = require('./state.json');
    console.log("Existing state configuration found.");
  }
  catch (error) {
    self.config = _.clone(config || {});
  }

  self.options = _.clone(self.config || {});

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

  // TODO: test to make sure actions are registered even when there is no connection.
  self.connect(function(error, data) {
    if (error) {
      console.log(error);

      // TODO: register actions and make attempt to make reconnection.
      // The idea is that if connection is lost the program shouldn't stop,
      // but should also try to reconnect.
    }

    // These should register reguardless of whether device connects.
    var actionsRegistered = new RSVP.Promise(function(resolve, reject) {
      try {
        resolve(self.registerActions(config));
      }
      catch (error) {
        reject(error);
      }
    });

    actionsRegistered.then(function(value) {
      self.pipeInstance();

      if (!_.isUndefined(callback)) {
        callback(null, self);
      }
    });
  });
}

util.inherits(GROWJS, Duplex);

// Connects to the Grow-IoT server over DDP.
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

    // console.log(JSON.stringify(self.config));

    self.ddpclient.call(
      'Device.register',
      [self.config],
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

// Runs imediately after a successful connection. Makes sure a UUID and
// token are set.
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

  // Now check to see if we have a stored UUID.
  // If no UUID is specified, store a new UUID.
  if (_.isUndefined(self.config.uuid) || _.isUndefined(self.config.token)) {
    self.config.uuid = result.uuid;
    self.config.token = result.token;

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

// Pipes readable and writeable streams.
GROWJS.prototype.pipeInstance = function () {
  var self = this;

  this.pipe(self.writableStream);
  self.readableStream.pipe(this);
};

// On _write, call this.sendData()
GROWJS.prototype._write = function (chunk, encoding, callback) {
  var self = this;

  self.sendData(chunk, callback);
};

// We are pushing data to a stream as commands are arriving and are leaving
// to the stream to buffer them. So we simply ignore requests for more data.
GROWJS.prototype._read = function (size) {
  var self = this;
};

/**
 * Calls a registered action, emits event if the the action has an 'event'
 * property defined. Updates the state if the action has an 'updateState'
 * property specified.
 * @param      {String}  actionId The name of the function to call.
 * @param      {Object}  options Any options to call with the function.
 */
GROWJS.prototype.callAction = function (actionId, options) {
  var self = this;

  var action = self.getActionByID(actionId);

  // If the actions "event" property is set to null or is undefined,
  // No event is logged. This is used for sensors which are posting data
  // and events would be redundant.
  if (action.event === null || _.isUndefined(action.event)) {
    if (options) {
      action.function(options);
    }
    else {
      action.function();
    }
  }
  // Otherwise we log an event.
  else {
    if (options) {
      action.function(options);
      self.emitEvent({
        name: action.name,
        message: action.event,
        options: options
      });
    }
    else {
      action.function();
      self.emitEvent({
        name: action.name,
        message: action.event
      });
    }
  }

  var component = self.getComponentByActionID(actionId);

  if (action.updateState) {
    self.updateProperty(component.name, "state", action.updateState);
  }
};

/**
 * Registers the implmentation, starts any scheduled actions and sets up 
 * the writeable stream to listen for commands.
 * @param {Object}  implementation  
 */
GROWJS.prototype.registerActions = function () {
  var self = this;
  // This needs to change...
  // self.actions = _.clone(implementation || {});

  self.actions = self.getActionsList();

  // TODO: make sure the implementation matches the growfile.
  // If not, we throw some helpful errors.
  // VALIDATE THIS SHIT.

  // BUG: actions fail to start properly if there are functions not
  // mentioned in grow file.

  // Start actions that have a schedule property.
  self.startScheduledActions();

  // Sets up listening for actions on the writeable stream.
  self.writableStream._write = function (command, encoding, callback) {
    // console.log(command);
    for (var action in self.actions) {
      var actionId = self.actions[action].id;
      if (command.type === actionId) {
        if (command.options) {
          self.callAction(actionId, command.options);

        } else {
          self.callAction(actionId);
        }
      }
    }

    callback(null);
  };
};

/**
 * Loops through registered actions and calls startAction.
 */
GROWJS.prototype.startScheduledActions = function () {
  var self = this;
  self.scheduledActions = [];

  if (_.isUndefined(self.actions)) {
    throw new Error("No actions registered.");
  }

  for (var action in self.actions) {
    var actionId = self.actions[action].id
    var meta = self.getActionByID(actionId);

    if (!_.isUndefined(meta)) {
      self.startAction(actionId);
    }
  }
};


/**
 * Starts a reoccurring action if a schedule property is defined.
 * @param {Object} action An action object.
 */
GROWJS.prototype.startAction = function (action) {
  var self = this;
  var meta = self.getActionByID(action);
  if (!_.isUndefined(meta.schedule)) {
    var schedule = later.parse.text(meta.schedule);
    var scheduledAction = later.setInterval(function() {self.callAction(action);}, schedule);
    self.scheduledActions.push(scheduledAction);
    return scheduledAction;
  }
};

/**
 * Gets the a component by the action it calls.
 */
GROWJS.prototype.getComponentByActionID = function (actionId) {
  var self = this;
  var thing = self.config;

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
              // Check the action id to see if it is the same, return component
              if (component[property][action].id === actionId) {
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
        if (thing[key][actionItem].id === actionId) {
          actionComponent = thing;
        }
      }
    }
  }

  return actionComponent;
};

/**
 * Get action metadata based on the action id
 * @param {String} actionId  The id of the action you want metadata for.
 * @returns {Object}
 */
GROWJS.prototype.getActionByID = function (actionId) {
  var self = this;
  var actionsMeta = self.getActionsList();
  for (var i = actionsMeta.length - 1; i >= 0; i--) {
    if (actionsMeta[i].id === actionId) {
      return actionsMeta[i];
    }
  }
};

/**
 * Get list of action objects in config.
 * @returns {List}
 */
GROWJS.prototype.getActionsList = function () {
  var self = this;
  var thing = self.config;
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


/**
 * Send data to Grow-IoT server.
 * @param      {Object}  data
 * @param      {Function} callback
 */
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

/**
 * Emit device event to Grow-IoT server.
 * @param      {Object}  event
 * @param      {Function} callback
 */
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


/**
 * Update device property on Grow-IoT server.
 * @param {String} componentName  Name of the component you want to update.
 * @param {String} propertyKey  Name of the of the property you wish to update
 * @param {Object|List|String|Number|Boolean} value The new value to set the property to.
 * @param {Function} callback  An optional callback.
 */
GROWJS.prototype.updateProperty = function (componentName, propertyKey, value, callback) {
  var self = this;

  var thing = self.config;

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

/**
 * Writes any changes to the state.json file.
 */
GROWJS.prototype.writeChangesToGrowFile = function () {
  var self = this;

  fs.writeFile('./state.json', JSON.stringify(self.config, null, 4), function (error) {
    if (error) return console.log("Error", error);
  });
};

// Export Grow.js as npm module. Be sure to include last in gulpfile concatonation.
module.exports = GROWJS;
