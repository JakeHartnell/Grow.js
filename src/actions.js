GROWJS.prototype.registerActions = function (implementation) {
  var self = this;
  self.actions = _.clone(implementation || {});

  // var growFileActions = self.getActions();
  // var functionList = [];

  // TODO: do better checks for options.
  // for (var i = growFileActions.length - 1; i >= 0; i--) {
  //   functionList.push(growFileActions[i].call);

  //   // If action has an "schedule" atribute, we parse it with later and set the interval.
  //   if (growFileActions[i].schedule) {
  //     var schedule = later.parse.text(growFileActions[i].schedule);
  //     if (schedule.error !== -1) {
  //       console.log(growFileActions[i].schedule);
  //       console.log(growFileActions[i].schedule.length);
  //       console.log(schedule.error);
  //     }
  //     var functionName = growFileActions[i].call;
  //     if (typeof growFileActions[i].options === "object") {
  //       later.setInterval(self.callAction(functionName, growFileActions[i].options), schedule);
  //     } else {
  //       later.setInterval(self.callAction(functionName), schedule);
  //     }
  //   }
  // }

  // TODO: make sure these match, if not, throw error. Everything referrenced in grow.json
  // should be defined in the implementation.
  // console.log(functionList);

  // console.log(implementation);
};


// Returns a list of actions in the grow file.
GROWJS.prototype.getActions = function () {
  var self = this;
  var thing = self.growFile.thing;
  var actions = [];


  for (var key in thing) {
    // Check top level thing model for actions.
    if (key === "actions") {
      for (var action in thing[key]) {
        actions.push(action);
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
              actions.push(componentActions[componentAction]);
            }
          }
        }
      }
    }
  }

  return actions;
};


GROWJS.prototype.callAction = function (functionName, options) {
  var self = this;

  if (options) {
    return self.actions[functionName](options);
  }
  else {
    return self.actions[functionName]();
  }
};
