// Examples of several common uses of the json-config package.


// Load the package and create a new configuration object.
var Configuration = require("../lib/json-config");
var conf = new Configuration();
console.log("New Configuration", conf.toString());


// Merge an object into the configuration.  Configuration objects may have nested objects themselves.  
// It's worth noting that all properties but functions will be preserved, including getters and setters.
conf.merge({
	"author": {
		"name": "Jeremy Fisher",
		"email": "jeremy@rentawebgeek.com"
	}
});
console.log("Result of merging an object", conf.toString());


// Here, we show an example of merging configuration from an object that is JSON encoded in a string.
// Remember that `JSON.parse()` wants member names to be surrounded in quotation marks (").
conf.merge('{"runInBackground": true}');
console.log("Result of merging from a string", conf.toString());


// Obviously, it's useful to store configurations in a file.  Simply call `merge()` with a valid file path
// to parse a JSON file (you can find this file in the source alongside these examples).  For convenience and 
// sanity, JavaScript comments can be included in your configuration files.
conf.merge(__dirname + "/conf/settings.json");
console.log("Result of merging from a file", conf.toString());


// Perhaps the simplest use is to assign (or read) a configuration value directly.  Again, getters and setters
// are preserved through `merge()`.
conf.server.hostname = "dev.localdomain";
console.log("Result of assigning a value", conf.toString());

// It is sometimes useful to assign a value to a deep object using dot notation (such as when parsing 
// command-line arguments).
conf.assign("database.port", 8098);
console.log("Result of assigning a value from a string key", conf.toString());


// For convenience, this helper method will pull configuration values from an array (like `process.argv`) using any flags
// you provide.  In this case, we're using a simulated argv and looking for `-D key=value`.  The second arguments can
// be an array, such as `["-D", "--directive"]`.
conf.assignFromArguments(["-D", "server.hostname=mysite.example.com", "-f", "extrastuff"], "-D");
console.log("Result of assigning values from example arguments", conf.toString());

// The `assignFromArguments()` method will default to `process.argv` and flags will default to `["-D", "--directive"]`.  
// Try invoking this program with `-D <key=value>` or `--directive <key=value>` to see it in action.
conf.assignFromArguments();
console.log("Result of assigning values from argv", conf.toString());

// It can also be useful (albeit dangerous) to use scripts as configurations.  These scripts can be JSON objects with
// code in assignments (such as process.env.PROPERTY || DEFAULT), or immediately invoked function expressions that return a
// complete object.  The standard Node globals are available, `__dirname` and `__filename` are set to match the file being
// included, and a `configuration()` function exists to create nested configurations on the fly from other files or a schema 
// initializer.  Any file ending in `.js` is assumed to be a script, and everything else is treated as plain vanilla
// JSON (with comments).  In the next line, we include a simple settings script.
var conf2 = new Configuration(__dirname + "/conf/settings.js");
console.log("Result of merging a script", conf2);

// Here's an example of using an IIFE in an external script file.
var iife = new Configuration(__dirname + "/conf/iife.js");
console.log("Result of merging an IIFE", iife);

// This example configuration script demonstrates including nested configurations and schemas – check it out!
var conf3 = new Configuration(__dirname + "/conf/nester.js");
console.log("Result of a nesting script", conf3);

// We may also want to disable script configs that could be malicious and stick to straight JSON...
conf3.scriptSupport(false);


