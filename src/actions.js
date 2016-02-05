/*
  This file contains functions for working with the Common Garden thing data model and the grow.json file.
  (To do, link to dpcumentation)
  
  This includes parsing and updating the grow file, as well as calling functions.


*/

// Maybe this should just be a start function?
GROWJS.prototype.registerActions = function (actionFunctions) {
  var self = this,
      actions = self.Actions.get();

  for (var key in actionFunctions) {
    console.log(actionFunctions[key]);
  }

  // Basically we need to get it so that the call function 

  // TODO: If action has an "every" atribute, we parse it with later and set the timeout
  // // execute logTime one time on the next occurrence of the text schedule
  // var timer = self.later.setTimeout(logTime, textSched);

  // // execute logTime for each successive occurrence of the text schedule
  // var timer2 = self.later.setInterval(logTime, textSched);


  // When actions are registered pipe instance
  self.pipeInstance();

};

GROWJS.Actions = function () {
  this.actions = [];
};

GROWJS.Actions.prototype.parse = function () {
  var self = this;
  var actions = [];


  for (var key in thing) {
    // The top level thing model.
    if (key === "actions") {
      console.log(typeof thing[key]);
    }

    // Grow kits can also contain sensors and actuators, which have their own models.
    if (key === "components") {
      for (var component in thing.components) {
        for (key in component) {
          if (component[key] === "actions") {
            actions.push(component[key]);
          }
        }
      }
    }
  }

  console.log(actions);
  return actions;

};

GROWJS.Actions.prototype.get = function () {
  return this.actions;
};


GROWJS.Actions.prototype.register = function() {
  for(var i = 0; i < arguments.length; ++i) {
    if (typeof arguments[i]  === "function") {
      this.actions.push(arguments[i]);
    } else {
      // unpack array
      for(var j = 0; j < arguments[i].length; ++j) {
        this.actions.push(arguments[i][j]);
      }
    }
  }
};

// http://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
GROWJS.Actions.prototype.call = function (functionName, context /*, args */) {
  var args = [].slice.call(arguments).splice(2);
  var namespaces = functionName.split(".");
  var func = namespaces.pop();
  for(var i = 0; i < namespaces.length; i++) {
    context = this.actions[namespaces[i]];
  }
  return context[func].apply(context, args);
};
