
var fs = require("fs")
	, path = require("path");

function Configuration(fileOrStringOrObject) {
	var _instance = this
		, _locked = false
		, _allowScripts = true;
	
	function flatten(object) {
		var exported = {};
		for (var member in object) {
			
			var getter = object.__lookupGetter__(member)
				, val = (getter) ? getter() : object[member];
				
			if (typeof val === 'object') {
				exported[member] = flatten(val);
			
			} else if (typeof val !== 'function') {
				exported[member] = val;
				
			}
		}
		return exported;
	}
	
	function stripComments(data) {
		return data.replace(/\/\/.*$/mg, "").replace(/\/\*[\s\S]*\*\//mg, "");
	}
	
	function scriptToObject(filepath) {
		if (!_allowScripts) {
			throw "Unauthorized attempt to read scripted configuration"
		}
		
		var obj = null
			, __dirname = path.dirname(filepath)
			, __filename = filepath
			, configuration = function (configOrInitializer) {
				if (typeof configOrInitializer === "function") {
					return (new Configuration.Schema(configOrInitializer).build());
				} else {
					return Configuration.create(configOrInitializer);
				}
			}
			, schema = function (initializer) { return (new Configuration.Schema(initializer).build()); }
			, script = fs.readFileSync(filepath, "utf8");
		
		eval("obj = " + stripComments(script));
		return obj;
	}
	
	function fileToObject(filepath) {
		if (filepath.match(/\.js$/) !== null && _allowScripts) {
			return scriptToObject(filepath);
		} else {
			return stringToObject(fs.readFileSync(filepath, "utf8"));
		}
		
	}
	
	function stringToObject(data) {
		return JSON.parse(stripComments(data));
	}
	
	function anythingToObject(objectOrFileOrString) {
		if (typeof objectOrFileOrString === 'object') {
			return objectOrFileOrString;
			
		} else if (typeof objectOrFileOrString === 'string') {
			if (require("path").existsSync(objectOrFileOrString)) {
				return fileToObject(objectOrFileOrString);
				
			} else {
				return stringToObject(objectOrFileOrString);
				
			}
			
		} else {
			throw "Invalid configuration input";
			
		}
	}
	
	/**
	 * Merge two objects recursively; similar to popular extend() implementations, but handles nested objects
	 */
	function merge(left, right) {
		for (var member in right) {
			if (typeof right[member] !== 'undefined') {
				var g = right.__lookupGetter__(member),
					s = right.__lookupSetter__(member);
				
				if (g || s) {
					if (g) left.__defineGetter__(member, g);
					if (s) left.__defineSetter__(member, s);
					
				} else if (typeof right[member] === 'object' && typeof left[member] === 'object') {
					left[member] = merge(left[member], right[member]);
					
				} else if (typeof left[member] !== 'function' && typeof right[member] !== 'function') {
					if (_locked && typeof left[member] === "undefined") {
						throw "Unable to add configuration directive " + member + " because the configuration has been locked";
					}
					left[member] = right[member];
					
				}
			}
		}
		
		return left;
		
	}
	
	this.merge = function (objectOrFileOrString) {
		var conf = anythingToObject(objectOrFileOrString);
		
		if (!conf || typeof conf !== 'object') {
			throw "Object expected, " + (typeof conf) + " found";
		}
		
		merge(_instance, conf);
		
	};
	
	this.assign = function (property, value) {
		var properties = property.split(".")
			, ref = _instance;
		
		for (var i = 0; i < properties.length - 1; i++) {
			ref = ref[properties[i]];
		}
		
		ref[properties[properties.length - 1]] = value;
		
	};
	
	this.assignFromArguments = function (argv, flags) {
		if (typeof argv === "undefined") {
			argv = process.argv;
		}
		
		if (typeof flags === "string") {
			flags = [flags];
			
		} else if (!(flags instanceof Array)) {
			flags = ["-D", "--directive"];
			
		}
		
		flags.forEach(function (flag) {
			argv.forEach(function (value, key) {
				if (value == flag) {
					var next = key + 1;
					if (next < argv.length) {
						var kv = argv[next].split("=");
						if (kv.length == 2) {
							_instance.assign(kv[0], kv[1]);
						} else {
							throw "Invalid configuration directive: " + argv[next];
						}
					} else {
						throw "Missing configuration directive after " + flag;
					}
				}
			});
		});
		
	};
	
	this.scriptSupport = function (enabled) {
		_allowScripts = (enabled === true);
	};
	
	this.lock = function () {
		_locked = true;
		for (var n in this) {
			if (this[n] instanceof Configuration) {
				this[n].lock();
			}
		}
	};
	
	this.toString = function () {
		return flatten(this);
	};
	
	if (fileOrStringOrObject) {
		this.merge(fileOrStringOrObject);
	}
	
}


Configuration.create = function (fileOrStringOrObject) {
	return new Configuration(fileOrStringOrObject);
};

Configuration.Nil = {};

Configuration.Schema = function (initialize) {
	var dataTypes = {
		"boolean": "boolean",
		"bool": "boolean",
		"string": "string",
		"text": "string",
		"integer": "integer",
		"int": "integer",
		"float": "float",
		"double": "float",
		"number": "float",
		"array": "array",
		"configuration": "configuration",
		"conf": "configuration",
		"config": "configuration",
		"object": "object",
		"obj": "object",
		"path": "path",
		"file": "path",
		"dir": "path"
	};

	var getters = {
		"configuration": function (val) {
			return val;
		}
	};
	
	var setters = {
		"boolean": function (val) {
			if (val) {
				return true;
			} else {
				return false;
			}
			return Configuration.Nil;
		},
		"string": function (val) {
			if (typeof val === "string") {
				return val;
			}
			return Configuration.Nil;
		},
		"integer": function (val) {
			val = parseInt(val);
			if (val !== NaN) {
				return val;
			}
			return Configuration.Nil;
		},
		"float": function (val) {
			val = parseFloat(val);
			if (val !== NaN) {
				return val;
			}
			return Configuration.Nil;
		},
		"array": function (val) {
			if (val instanceof Array) {
				return val;
			}
			return Configuration.Nil;
		},
		"path": function (val) {
			if (path.existsSync(val)) {
				return val;
			}
			return Configuration.Nil
		}
	};
	
	var defaultValues = {
		"bool": false,
		"string": "",
		"integer": 0,
		"float": 0.0,
		"array": [],
		"any": null
	};
	
	var _properties = []
		, _locked = false;
	
	function Property(name, dataType, defaultValue) {
		if (!name) {
			throw "Property name is required";
		}
		
		var _attributes = {
			"setters": [],
			"getters": [],
			"name": name,
			"dataType": "any",
			"defaultValue": Configuration.Nil
		}
		
		this.setter = function (setter) {
			if (typeof setter === "function") {
				_attributes.setters.push(setter);
			}
			return this;
		};
		
		this.getter = function (getter) {
			if (typeof getter === "function") {
				_attributes.getters.push(getter);
			}
			return this;
		};
		
		this.dataType = function (dataType) {
			if (dataTypes[dataType]) dataType = dataTypes[dataType];
			_attributes.dataType = dataType;
			if (setters[dataType]) this.setter(setters[dataType]);
			if (getters[dataType]) this.getter(getters[dataType]);
			if (_attributes.defaultValue === Configuration.Nil && typeof defaultValues[dataType] !== "undefined") _attributes.defaultValue = defaultValues[dataType];
			return this;
		};
		
		this.name = function (name) {
			if (typeof name === "string" && name.length > 0) {
				// Renaming
				if (_attributes.name && _properties[_attributes.name]) delete(_properties[_attributes.name]);
			
				_attributes.name = name;
				_properties[name] = _attributes;
				
			}
			return this;
		};
		
		this.defaultValue = function (defaultValue) {
			_attributes.defaultValue = defaultValue;
			return this;
		};
		
		this.min = function (minimum) {
			this.setter(function (val) {
				if (val >= minimum) {
					return val;
				}
				return Configuration.nil;
			});
			return this;
		};
		
		this.max = function (maximum) {
			this.setter(function (val) {
				if (val <= maximum) {
					return val;
				}
				return Configuration.nil;
			});
			return this;
		};
		
		this.length = function (length) {
			this.setter(function (val) {
				if (val.length <= length) {
					return val;
				}
				return Configuration.Nil;
			});
			return this;
		};
		
		this.match = function (regex) {
			this.setter(function (val) {
				if (typeof val === "string" && val.match(regex)) {
					return val;
				}
				return Configuration.Nil;
			});
			return this;
		};
		
		this.name(name);
		this.dataType(dataType);
		if (typeof defaultValue !== "undefined") this.defaultValue(defaultValue);
		
	}
	
	this.property = function (name, dataType, defaultVal) {
		return new Property(name, dataType, defaultVal);
	};
	
	this.configuration = function (name, defaultVal) {
		return new Property(name, "configuration", defaultVal);
	};
	
	this.lock = function () {
		_locked = true;
	};
	
	this.build = function () {
		var config = new Configuration()
			, values = {};
		
		for (var prop in _properties) {
			(function () {
				var name = prop
					, property = _properties[name]
					, defaultValue = (property.defaultValue instanceof Configuration.Schema) ? property.defaultValue.build() : property.defaultValue;
			
				if (property.getters.length || property.setters.length) {
					// Add setters
					if (property.setters.length) {
						values[name] = defaultValue;
					
						config.__defineSetter__(name, function (value) {
							var i = 0;
						
							do {
								value = property.setters[i](value);
							} while (++i < property.setters.length && value !== Configuration.Nil);
						
							if (value !== Configuration.Nil) values[name] = value;
						
						});
					
						// If setters but no getter
						if (property.getters.length === 0) {
							config.__defineGetter__(name, function () { 
								return values[name]; 
							});
						}
					}
				
					// Add getters
					if (property.getters.length) {
						if (typeof values[name] === "undefined") values[name] = defaultValue;
					
						config.__defineGetter__(name, function () {
							var value = values[name];
							var i = 0;

							do {
								value = property.getters[i](value);
							} while (++i < property.getters.length);
						
							return value;
						});

						// If getters but no setter
						if (property.setters.length === 0 && property.dataType !== "configuration") {
							config.__defineSetter__(name, function (val) { 
								return val; 
							});
						}
				
					}
				
				} else {
					// Simplest case (no getters or setters)
					config[name] = defaultValue;
				
				}
			})();
		}
		
		if (_locked) {
			config.lock();
		}
		
		return config;
	};
	
	for (var n in dataTypes) {
		(function (obj) {
			var realType = dataTypes[n];
			obj[n] = function (name, defaultVal) {
				return obj.property(name, realType, defaultVal);
			};
		})(this);
	}
	
	if (typeof initialize === "function") {
		initialize.apply(this);
	}
	
};

module.exports = Configuration;