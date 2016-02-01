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