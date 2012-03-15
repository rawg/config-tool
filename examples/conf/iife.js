(function () {
	if (require("os").hostname() === "zeus") {
		return {
			"db": "master1.localdomain"
		};
	} else {
		return {
			"db": "master2.localdomain"
		};
	}
	
})();