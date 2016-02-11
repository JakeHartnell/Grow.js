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

function GROWJS(implementation, growFile) {
  var self = this;

  // Use local time.
  later.date.localTime();

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

  Duplex.call(self, _.defaults(self.options, {objectMode: true, readableObjectMode: true, writableObjectMode: true}));

  self.uuid = self.options.uuid || null;
  self.token = self.options.token || null;
  self.thing = self.options.thing || null;

  self._messageHandlerInstalled = false;


  // try {
  self.ddpclient = new DDPClient(_.defaults(self.options, {
    host: 'localhost',
    port: 3000,
    ssl: false,
    maintainCollections: false
  }));
  self.connect(function(error, data) {

    self.registerActions(implementation);

    //// Readable Stream
    // Note this is "readable" from the server perspective.
    // The device publishes it's data to the readable stream.
    var readableStream = new Readable({objectMode: true});

    // We are pushing data when sensor measures it so we do not do anything
    // when we get a request for more data. We just ignore it.
    readableStream._read = function () {};

    readableStream.on('error', function (error) {
      console.log("Error", error.message);
    });

    //// Writable streams
    // Note: this is writable from the server perspective. A device listens on
    // the writable stream to recieve new commands.
    writableStream = new Writable({objectMode: true});


    // Sets up listening for actions on the write able stream.
    // Updates state and logs event.
    var actions = self.actions;
    writableStream._write = function (command, encoding, callback) {
      // Make sure to support options too.
      console.log("called");
      for (var action in actions) {
        // console.log(action);
        // Support command.options
        if (command.type === action) {
          if (command.options) {
            actions[action](command.options);
          } else {
            // console.log();
            actions[action]();
          }
          // // Should the below be done in a callback?
          // self.updateProperty(action.name, "state", action.state);

          // // If command.options, this should be included in event.
          // self.emitEvent({
          //   name: action.name,
          //   message: action.eventMessage
          // });
        }
      }

      callback(null);
    };

    self.pipe(writableStream);
    readableStream.pipe(self);
    // self.pipeInstance();
  });

  // self.pipeInstance();
  // }
  // catch (error) {
  //   console.log(error);
  // }

  // We register and start any recurring actions.
  // self.registerActions(implementation);

  // self.pipeInstance();
}

util.inherits(GROWJS, Duplex);
