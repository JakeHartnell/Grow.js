/**
 * # Events
 * Events are the newest and hackiest part of grow.js, please help improve.
 * Currently, they are pretty much exactly like actions with a function that returns the value to
 * emit as event or doesn't return (in which case no event is emitted). 
 *
 * The "events" property of a thing takes a list of event objects. For example:

        "events": [
            {
                "name": "Light data",
                "id": "light_data",
                "schedule": "every 1 second",
                "function": function () {
                    // function should return the event to emit when it should be emited.
                    return lightSensor.value;
                }
            }
        ]
 *
 * NOTE: Events run like jobs and so REQUIRE a schedule property. This is not nice, let's rewrite.
 */

/**
 * Registers events in the configuration. 
 */
GROWJS.prototype.registerEvents = function () {
  var self = this;
  self.events = self.getEventsList();

  self.startScheduledEvents();
};


/**
 * Starts a reoccurring event if a schedule property is defined.
 * @param {Object} event An event object.
 */
GROWJS.prototype.startEvent = function (event) {
  var self = this;
  var event = self.getEventByID(event);
  if (!_.isUndefined(event.schedule)) {
    var schedule = later.parse.text(event.schedule);
    var scheduledEvent = later.setInterval(function() {
      // This is a hack.
      if (event.type) {
        self.readableStream.push({
          type: event.type,
          value: event.function()
        });
      }
    }, schedule);
    self.scheduledEvents.push(scheduledEvent);
    return scheduledEvent;
  }
};


/**
 * Loops through registered events and calls startEvent.
 */
GROWJS.prototype.startScheduledEvents = function () {
  var self = this;
  self.scheduledEvents = [];

  if (_.isUndefined(self.events)) {
    throw new Error("No events registered.");
  }

  for (var event in self.events) {
    var eventId = self.events[event].id
    var meta = self.getEventByID(eventId);

    if (!_.isUndefined(meta)) {
      self.startEvent(eventId);
    }
  }
};


/**
 * Get list of event objects in config.
 * @returns {List}
 */
GROWJS.prototype.getEventsList = function () {
  var self = this;
  var thing = self.config;
  var eventMetaData = [];

  for (var key in thing) {
    // Check top level thing model for events.
    if (key === "events") {
      for (var event in thing[key]) {
        eventMetaData.push(thing[key][event]);
      }
    }

    // Grow kits can also contain components, which have their own thing models.
    if (key === "components") {
      for (var component in thing.components) {
        component = thing.components[component];
        for (var property in component) {
          if (property === "events") {
            var componentEvents = component[property];
            for (var componentEvent in componentEvents) {
              eventMetaData.push(componentEvents[componentEvent]);
            }
          }
        }
      }
    }
  }

  return eventMetaData;
};

/**
 * Get event obect by id
 * @param {String} eventId  The id of the event you want to be returned.
 * @returns {Object}
 */
GROWJS.prototype.getEventByID = function (eventId) {
  var self = this;
  var eventsMeta = self.getEventsList();
  for (var i = eventsMeta.length - 1; i >= 0; i--) {
    if (eventsMeta[i].id === eventId) {
      return eventsMeta[i];
    }
  }
};

