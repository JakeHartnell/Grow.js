// Calls action, emits event, and updates state (if applicable).
GROWJS.prototype.callAction = function (functionName, options) {
  var self = this;

  var meta = self.getActionMetaByCall(functionName);

  // If the actions "event" property is set to null or is undefined,
  // No event is logged.
  if (meta.event === null || _.isUndefined(meta.event)) {
    if (options) {
      self.actions[functionName](options);
    }
    else {
      self.actions[functionName]();
    }
  }
  // Otherwise we log an event.
  else {
    if (options) {
      self.actions[functionName](options);
      self.emitEvent({
        name: meta.name,
        message: meta.event,
        options: options
      });
    }
    else {
      self.actions[functionName]();
      self.emitEvent({
        name: meta.name,
        message: meta.event
      });
    }
  }

  // TODO: If the action has a state property, we update the state.
  // NOT WORKING.
  if (meta.state) {
    self.updateProperty(meta.name, "state", meta.state);
  }
};

GROWJS.prototype.registerActions = function (implementation) {
  var self = this;
  self.actions = _.clone(implementation || {});

  // TODO: make sure the implementation matches the growfile.
  // If not, we throw some helpful errors.

  // Start actions that have a schedule property.
  self.startScheduledActions();

  // Sets up listening for actions on the writeable stream.
  self.writableStream._write = function (command, encoding, callback) {
    for (var action in self.actions) {
      if (command.type === action) {
        if (command.options) {
          self.callAction(action, command.options);

        } else {
          self.callAction(action);
        }
      }
    }

    callback(null);
  };
};

// TODO: stop actions, etc.
GROWJS.prototype.startScheduledActions = function () {
  var self = this;
  self.scheduledActions = [];

  if (_.isUndefined(self.actions)) {
    throw new Error("No actions registered.");
  }

  // TODO if sensor call a separate logData function that doesn't fire and event.
  // Or if event = null perhaps?
  for (var action in self.actions) {
    var meta = self.getActionMetaByCall(action);
    if (meta.event === null || _.isUndefined(meta.event)) {
      self.startAction(action);
    } else {
      self.startActionWithEventLog(action);
    }
  }

};

// TODO: Support options.
GROWJS.prototype.startActionWithEventLog = function (action) {
  var self = this;
  var meta = self.getActionMetaByCall(action);
  if (!_.isUndefined(meta.schedule)) {
    var schedule = later.parse.text(meta.schedule);
    var scheduledAction = later.setInterval(function() {self.callAction(action);}, schedule);
    // TODO: extend scheduled action so that they have a name.
    self.scheduledActions.push(scheduledAction);
    return scheduledAction;
  }
};

// TODO: Support options.
GROWJS.prototype.startAction = function (action) {
  var self = this;
  var meta = self.getActionMetaByCall(action);
  if (!_.isUndefined(meta.schedule)) {
    // console.log(meta.schedule);
    var schedule = later.parse.text(meta.schedule);
    var scheduledAction = later.setInterval(function() {self.callAction(action);}, schedule);
    self.scheduledActions.push(scheduledAction);
    return scheduledAction;
  }
};

// Returns an object of action metadata based on function name.
GROWJS.prototype.getActionMetaByCall = function (functionName) {
  var self = this;
  var actionsMeta = self.getActions();
  for (var i = actionsMeta.length - 1; i >= 0; i--) {
    // console.log(actionsMeta[i]);
    if (actionsMeta[i].call === functionName) {
      return actionsMeta[i];
    }
  }
};

// Returns a list of actions in the grow file.
GROWJS.prototype.getActions = function () {
  var self = this;
  var thing = self.growFile.thing;
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

