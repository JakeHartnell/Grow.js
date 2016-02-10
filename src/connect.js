GROWJS.prototype.connect = function () {
  var self = this;

  self.ddpclient.connect(function (error, wasReconnect) {
    // if (error) return callback(error);

    if (wasReconnect) {
      console.log("Reestablishment of a Grow server connection.");
    }
    else {
      console.log("Grow server connection established.");
    }

    if (self.uuid || self.token) {
      return self._afterConnect({
        uuid: self.uuid,
        token: self.token
      });
    }

    self.ddpclient.call(
      'Device.register',
      [self.thing],
      function (error, result) {
        // if (error) return callback(error);

        assert(result.uuid, result);
        assert(result.token, result);

        self.uuid = result.uuid;
        self.token = result.token;

        self._afterConnect(result);
      }
    );
  });
};

GROWJS.prototype._afterConnect = function (result) {
  var self = this;

  self.ddpclient.subscribe(
    'Device.messages',
    [{uuid: self.uuid, token: self.token}],
    function (error) {
      // if (error) return callback(error);

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

  // callback(null, result);
};


//// STREAMS //////////////////////////////

//// Readable Stream
// Note this is "readable" from the server perspective.
// The device publishes it's data to the readable stream.

// Make a new readable stream
GROWJS.prototype.readableStream = new Readable({objectMode: true});

// We are pushing data when sensor measures it so we do not do anything
// when we get a request for more data. We just ignore it.
GROWJS.prototype.readableStream._read = function () {};

// We catch any errors
GROWJS.prototype.readableStream.on('error', function (error) {
  console.log("Error", error.message);
});

// We are pushing data to a stream as commands are arriving and are leaving
// to the stream to buffer them. So we simply ignore requests for more data.
GROWJS.prototype._read = function (size) {
  var self = this;
};

//// Writable streams
// Note: this is writable from the server perspective. A device listens on
// the writable stream to recieve new commands.

// Make a new writable stream
GROWJS.prototype.writableStream = new Writable({objectMode: true});

GROWJS.prototype._write = function (chunk, encoding, callback) {
  var self = this;

  self.sendData(chunk, callback);
};

// Sets up listening for actions on the write able stream.
// Updates state and logs event.
GROWJS.prototype.writableStream._write = function (command, encoding, callback) {
  var self = this;

  // Get a list of action objects and calls
  var actions = self.getActions();

  // Make sure to support options too.
  for (var action in actions) {
    // Support command.options
    if (command.type === action.call) {
      if (command.options) {
        self.callAction(action.call, command.options);
      } else {
        self.callAction(action.call);
      }
      // Should the below be done in a callback?
      self.updateProperty(action.name, "state", action.state);

      // If command.options, this should be included in event.
      self.emitEvent({
        name: action.name,
        message: action.eventMessage
      });
    }
  }
};

// We pipe our readable and writable streams to the instance.
GROWJS.prototype.pipeInstance = function () {
  var self = this;

  this.pipe(self.writableStream);
  self.readableStream.pipe(this);
};
