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
 * Constructs a new grow instance, connects to the Grow-IoT server specified in the growFile,
   registers the device with the Server (if it's the first time connecting it saves a new
   uuid and token), and sets up readable and writable streams.
 * @constructor
 * @param {Object} implementation  An object that contains keys and functions that fullfill
 * the api described in the growFile.
 * @param {Object} growFile  A JSON object which describes the device and it's API
 * @param {Function} callback  An optional callback.
 * @return     A new grow instance.
 */
function GROWJS(implementation, growFile, callback) {
  var self = this;

  if (!implementation) {
    throw new Error("Grow.js requires an implementation.");
  }

  if (!(self instanceof GROWJS)) {
    return new GROWJS(implementation, growFile, callback);
  }

  // The grow file is needed to maintain state in case our IoT device looses power or resets.
  if (typeof growFile === "object") {
    // TODO: validate and check this.
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
    if (error) {
      console.log(error);

      // TODO: register actions and make attempt to make reconnection.
      // The idea is that if connection is lost the program shouldn't stop,
      // but should also try to reconnect.
    }

    // These should register reguardless of whether device connects.
    var actionsRegistered = new RSVP.Promise(function(resolve, reject) {
      try {
        resolve(self.registerActions(implementation));
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
