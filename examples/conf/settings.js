{
	// Database configuration
	"database": {
		"host": "10.200.66.101",
		"port": 5434,
		"username": "www",
		"password": "@wes0me",
		"schema": "site"
	},
	
	/**
	 * Default server configuration
	 */
	"server": {
		"port": process.env.port || 8080, // this will need to be changed to 80 later
		"hostname": process.env.hostname || "localhost",
		"logToConsole": true
	}
}