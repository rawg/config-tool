{
	"server": {
		"hostname": "localhost",
		"port": process.env.port || 8080
	},
	
	// Read in a scripted configuration from this directory
	"database": configuration(__dirname + "/database.js"),
	
	// Read in a JSON configuration from this directory
	"memoryStore": configuration(__dirname + "/memory-store.json"),
	
	// Build a configuration from a schema on the fly
	"logging": configuration(function () {
		this.bool("console", true);
		this.bool("file", true);
		this.path("path");
		this.lock();
	})
}