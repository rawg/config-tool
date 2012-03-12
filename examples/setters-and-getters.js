// An example of using getters and setters in a configuration object.

//
var Configuration = require("../lib/json-config");

//  
function MyConfig() {
	// A private member to be managed by our setter.
	var addr = "";
	
	// A public, plain-vanilla member.
	this.port = 8080;
	
	// Create a setter that will only mutate a value if the input is a somewhat valid IP address.
	this.__defineSetter__("addr", function (value) {
		if (value.match(/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/)) {
			addr = value; 
		}
	});
	
	// Create a basic getter.
	this.__defineGetter__("addr", function () {
		return addr;
	});
	
}

// Create a new configuration from our custom object.  Note that we could bind the getters and setters directly
// to our configuration object, but watch for scoping issues with whatever data you're accessing and mutating.
var config = new Configuration(new MyConfig());
console.log("After initializing from an object", config.toString());

// Assign a valid IP address.  Look, it worked!
config.addr = "192.168.0.1";
console.log("After assigning a valid IP", config.toString());

// Assign an invalid IP address.  Nothing happens...
config.assign("addr", "bad input");
console.log("After assigning an invalid IP", config.toString());

// Change the public member; nothing fancy here.
config.assign("port", 80);
console.log("After changing a scalar", config.toString());
