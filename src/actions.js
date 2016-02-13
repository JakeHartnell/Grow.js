GROWJS.prototype.callAction = function (functionName, options) {
  var self = this;

  console.log(self.getActions());

  if (options) {
    self.actions[functionName](options);
    // self.emitEvent({
    //   name: actions[action].name,
    //   message: actions[action].eventMessage,
    //   options: command.options
    // });
  }
  else {
    self.actions[functionName]();
    // Emit event
    // self.emitEvent({
    //   name: actions[action].name,
    //   message: actions[action].eventMessage
    // });
  }
  // If the action has a state property, we update the state.
  // if (actions[action].state) {
  //   self.updateProperty(actions[action].name, "state", actions[action].state);
  // }
};

GROWJS.prototype.registerActions = function (implementation) {
  var self = this;
  self.actions = _.clone(implementation || {});

  // TODO: make sure the implementation matches the growfile.

  // Sets up listening for actions on the writeable stream.
  var actions = self.actions;
  self.writableStream._write = function (command, encoding, callback) {
    for (var action in actions) {
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

// TODO:
GROWJS.prototype.startScheduledActions = function () {
  return;
};

GROWJS.prototype.getActionMetaByCall = function (functionName) {
  var self = this;
  var actionsMeta = self.getActions();
  for (var i = actionsMeta.length - 1; i >= 0; i--) {
    // for (var k = actionsMeta[i].length - 1; k >= 0; k--) {
    //   console.log(i);
    //   console.log(k);
    //   console.log(actionsMeta[i][k]);
    // };
    if (actionsMeta[i].call === functionName) {
      return actionsMeta[i];
    }
  }
};

// Returns a list of actions in the grow file.
GROWJS.prototype.getActions = function () {
  var self = this;
  var thing = self.growFile.thing;
  // console.log(thing);
  var actionMetaData = [];


  for (var key in thing) {
    // console.log(key);
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

