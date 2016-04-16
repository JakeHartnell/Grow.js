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
    var meta = self.getActionByID(action);

    if (!_.isUndefined(meta)) {
      self.startAction(action);
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

