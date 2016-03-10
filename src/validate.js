var schema = require('validate');
 
// Validates grow file.
GROWJS.prototype.validateGrowFile = function (growFile) {

	var thing = schema({
	  thing: {
	  	name: {
		  type: 'string',
		  required: true,
          message: 'thing.name is required.'
    	},
		owner: {
		  type: 'string',
		  required: true,
		  match: /+\@.+\..+/,
		  message: 'Owner must be valid email, with an account on the host Grow-IoT server.'
		},
		components: {
			type: 'list',
			required: true
		}
	  }
	});

	var errors = thing.validate(obj);

};

// Should validate a component.
GROWJS.prototype.validateComponent = function (component) {
	var component = schema({
	  	name: {
		  type: 'string',
		  required: true,
          message: 'thing.name is required.'
    	},
    	type: {
    		type: 'string',
    		required: true,
    		message: "Component type is required."
    	}
		actions: {
			type: 'list',
			required: true
		}
	  }
	});
};

// A valid grow file should be valid JSON.

// A valid grow file should have at least a name and a type.

