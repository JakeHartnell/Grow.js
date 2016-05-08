/*
SSL is supported though will require a bit more setup. If you are hosting your instance off a computer with a dedicated IP address include the following info in your configuration object.

```json
    "host": "YOUR_IP_HERE",
    "port": 443,
    "ssl": true,
```

If you are hosting on a cloud instance such as [Meteor Galaxy](https://galaxy.meteor.com), you might need specify the servername. The example below shows you how to connect securely to the instance at [grow.commongarden.org](https://grow.commongarden.org):

```json
    "host": "grow.commongarden.org",
    "tlsOpts": {
        "tls": {
            "servername": "galaxy.meteor.com"
        }
    },
    "port": 443,
    "ssl": true,
    "thing": { ... }
```
*/

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
