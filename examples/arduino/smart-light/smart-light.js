// Require the Grow.js build and johnny-five library.
const Thing = require('../../../lib/Grow.js');
const five = require('johnny-five');
const later = require('later');

// Use local time, not UTC.
later.date.localTime();

// TODO: use an actual light. : )
const Hs100Api = require('hs100-api');

// See http://johnny-five.io/ to connect devices besides arduino.
const board = new five.Board();


// When board emits a 'ready' event run this start function.
board.on('ready', function start() {
  // Define variables
  var LED = new five.Pin(13),
    lightSensor = new five.Sensor('A1');

  // Create a new thing.
  var light = new Thing({
    uuid: 'dfdcff53-8cf9-4218-a165-6d8152f8fc7c',
    token: 'qL7C76psYiD9okfgtFQXQnrNPek7omi6',

    component: 'smart-light',

    properties: {
      state: 'off',
      threshold: 300,
      interval: 3000,
      currently: null,
      lightconditions: null,
      cycles: {
        day: {
          start: 'after 7:00am'
        },
        night: {
          start: 'after 8:00pm'
        }
      }
    },

    start: function () {
      var interval = this.get('interval');
      
      this.interval = setInterval(function () {
        light.light_data();
        light.check_light_data();
      }, interval);

      var client = new Hs100Api.Client();

      client.startDiscovery().on('plug-new', (plug) => {
        // There is definitely a better way of doing this.
        // todo: get energy usage?
        plug.getInfo().then(console.log);
        if (plug.name === 'Plant Light') {
          this.light = plug;
        }
      });

      this.parseCycles(this.get('cycles'));
    },

    stop: function () {
      clearInterval(this.interval);
      this.removeAllListeners();
    },

    day: function () {
      console.log('It is day!');
      this.set('currently', 'day');
      this.call('turn_on');
    },

    night: function () {
      console.log('It is night!');
      this.set('currently', 'night');
      this.call('turn_off');
    },

    power_data: function () {
      if (this.light) {
        this.light.getInfo().then((data)=> {
          let powerData = data.consumption.get_realtime;
          this.emit({
            type: 'power',
            value: powerData
          });
        });
      }
    },

    turn_on: function () {
      if (this.light) {
        this.light.setPowerState(true);
      }
      this.set('state', 'on');
      console.log('light on');
    },

    turn_off:  function () {
      if (this.light) {
        this.light.setPowerState(false);
      }
      this.set('state', 'off');
      console.log('light off');
    },

    light_data: function () {
      console.log(lightSensor.value);

      light.emit({
        type: 'light',
        value: lightSensor.value
      });
    },

    check_light_data: function () {
      let threshold = this.get('threshold');
      let state = this.get('state');
      let currently = this.get('currently');

      if ((lightSensor.value < threshold) &&
        (this.get('lightconditions') != 'dark') &&
        (currently === 'day')) {

        console.log('Too dark for daylight hours, turning on light.')
        this.set('lightconditions', 'dark');
        this.call('turn_on');
      }

      else if ((lightSensor.value >= threshold) &&
        (this.get('lightconditions') != 'light') &&
        (currently === 'day')) {

        this.set('lightconditions', 'light');
        this.call('turn_off');
      }
    }
  });

  light.connect({
    host: 'grow.commongarden.org',
    tlsOpts: {
      tls: {
        servername: 'galaxy.meteor.com'
      }
    },
    port: 443,
    ssl: true
  });
});
