// An example demonstrating the configuration schema utility.

var Configuration = require("../lib/json-config");

// Create a new schema.
var builder = new Configuration.Schema();

// Add a boolean property named "enabled."  The signature for this method is:
// <code>property(name:string, [type:string], [default:any])</code>
builder.property("enabled", "boolean");

// It's OK to make up some things as you go, and to rename properties.
builder.property("mount")
	.dataType("bool")
	.defaultValue(false)
	.name("automount");

// Another way to create a bool, from a convenient helper method.
builder.bool("logging", false);

// Additional type-specific convenience methods.  The complete list of type-specific methods is: `boolean()`, `bool()`,
// `string()`, `text()`, `integer()`, `int()`, `float()`, `double()`, `number()`, `array()`.
builder.int("port", 8080);
builder.float("cost");
builder.array("ids");

// Some validation helpers are provided out of the box, like ranges and minimum length for strings.
builder.int("connections", 10).min(2).max(256);
builder.string("name").length(25);
builder.string("userId").match(/[A-Za-z0-9]/);

// Create a configuration object from the schema.
var example1 = builder.build();

// Sometimes, you might want to prevent the creation of new keys, but still change their values.
example1.lock();

// Assignments work just like usual.
example1.enabled = true;
example1.ids.push(2);
console.log("Example 1", example1.toString());


// It's also possible to perform all of your initializations in a function passed to the constructor.
var example2 = new Configuration.Schema(function () {
	this.bool("debugging", true);
	this.string("dateFormat", "yyyy-mm-dd");
}).build();
console.log("Example 2", example2.toString());


// Nesting gets more complicated.  Let's create a new top-level configuration.
var example3 = new Configuration.Schema(function () {
	// Add a property
	this.bool("debugging", true);
	
	// Now, in the intializer, we add nested schemas.
	this.configuration("logging", new Configuration.Schema(function () {
		this.string("path");
		this.integer("level").min(0).max(5);
	}));
	
	this.configuration("facebook", new Configuration.Schema(function () {
		this.string("appId");
		this.string("authToken");
	}));
	
}).build();

// Set a nested property, just to prove that we can.
example3.facebook.appId = "123456789";
console.log("Example 3", example3.toString());


