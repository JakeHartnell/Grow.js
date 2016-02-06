/*
  This file contains functions for working with the Common Garden thing data model and the grow.json file.
  (To do, link to dpcumentation)
  
  This includes parsing and updating the grow file, as well as calling functions.


*/

GROWJS.prototype.registerActions = function (implementation) {
  var self = this;
  self.actions = _.clone(implementation || {});

  // TODO: we need to get the actions and check to see if 
  console.log(self.getActions());

  // TODO: If action has an "every" atribute, we parse it with later and set the timeout
  // // execute logTime one time on the next occurrence of the text schedule
  // var timer = self.later.setTimeout(logTime, textSched);

  // // execute logTime for each successive occurrence of the text schedule
  // var timer2 = self.later.setInt erval(logTime, textSched);

};


GROWJS.prototype.getActions = function () {
  var self = this;
  var thing = self.growFile.thing;
  var actions = [];


  for (var key in thing) {
    // The top level thing model.
    if (key === "actions") {
      for (var action in thing[key]) {
        actions.push(action);
      }
    }

    // Grow kits can also contain sensors and actuators, which have their own models.
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

  // console.log(actions);
  return actions;

  // return GROWJS.actions;
};


// http://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
GROWJS.prototype.callAction = function (functionName, options) {
  var self = this;

  if (options) {
    return self.actions[functionName](options);
  }
  else {
    return self.actions[functionName]();
  }
};
