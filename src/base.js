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
    // NOTE: we need the methods defined in the config, so we extend the object
    // in state.json.
    self.config = _.extend(require('./state.json'), config);
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

    // These should register reguardless of whether device connects.
    var eventsRegistered = new RSVP.Promise(function(resolve, reject) {
      try {
        resolve(self.registerEvents(config));
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
