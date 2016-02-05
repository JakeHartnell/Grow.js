/*
  This file contains functions for working with the Common Garden thing data model and the grow.json file.
  (To do, link to dpcumentation)
  
  This includes parsing and updating the grow file, as well as calling functions.


*/

// Maybe this should just be a start function?
GROWJS.prototype.linkActions = function (actionFunctions) {
  var self = this,
      actions = self.getActions();

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

GROWJS.prototype.parseActions = function () {
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

GROWJS.Action = function () {
  this.actions = [];
};

GROWJS.Action.prototype.getActions = function () {
  return this.actions;
};


GROWJS.Action.prototype.register = function() {
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

GROWJS.prototype.writableStream._write = function (command, encoding, callback) {
  var self = this;

  // Get a list of action objects and calls
  var actions = self.getActions();

  // Make sure to support options too.
  for (var action in actions) {
    // Support command.options
    if (command.type === action.call) {
      if (command.options) {
        self.callFunction(action.call, command.options);
      } else {
        self.callFunction(action.call);
      }
      // Should the below be done in a call back.
      self.updateProperty(action.actuator.name, "state", action.state);
      // If command.options, this should be included in event.
      self.emitEvent({
        name: action.name
      });
    }
  }
};

GROWJS.prototype.registerEventListeners = function () {
  var self = this;
};



GROWJS.prototype.writeChangesToGrowFile = function () {
  var self = this;

  fs.writeFile('./grow.json', JSON.stringify(self.growFile, null, 4), function (error) {
    if (error) return console.log("Error", error);
  });
};


// http://stackoverflow.com/questions/359788/how-to-execute-a-javascript-function-when-i-have-its-name-as-a-string
GROWJS.prototype.executeFunctionByName = function (functionName, context /*, args */) {
  var args = [].slice.call(arguments).splice(2);
  var namespaces = functionName.split(".");
  var func = namespaces.pop();
  for(var i = 0; i < namespaces.length; i++) {
    context = context[namespaces[i]];
  }
  return context[func].apply(context, args);
};


// Modify this so that it is namespaced for grow.
GROWJS.Actions.prototype.call = function(str) {
  var arr = str.split(".");

  var fn = this;
  for (var i = 0, len = arr.length; i < len; i++) {
    fn = fn[arr[i]];
  }

  if (typeof fn !== "function") {
    throw new Error("function not found");
  }

  return  fn;
};

// module.exports = GROWJS
