const Thing = require('../../lib/Grow.js');

// A rough GrowFile example... first draft, it's crude.
module.exports = new Thing({
  properties: {
    name: 'Grow File example',
    version: '0.1.5',
      
    // todo, register event listeners for these.
    alerts: {
      temperature: {
        min: 17,
        max: 25
      },
      ph: {
        min: 5.7,
        max: 6.5
      },
      humidity: {
        // percent
        min: 40,
        max: 65
      },
    },

    phases: {
      vegetative: {
        cycles: {
          day: {
            start: 'after 6:00am',
            targets: {
              temperature: 24,
              co2: {
                min: 900,
                max: 1600
              }
            }
          },
          night: {
            start: 'after 9:00pm',
            targets: {
              temperature: 20,
            }
          }
        }
      },
      bloom: {
        cycles: {
          day: {
            start: 'after 7:00am',
            targets: {
              temperature: 24
            }
          },
          night: {
            start: 'after 7:00pm',
            targets: {
              temperature: 20,
              co2: 400
            }
          }
        }
      }
    }
  }
});
