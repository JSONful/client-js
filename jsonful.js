var JSONful =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var EventEmitter = __webpack_require__(1);
	var Promise = __webpack_require__(2);
	var Session = __webpack_require__(4);
	var assign = __webpack_require__(6);

	var Client = function (_EventEmitter) {
	    _inherits(Client, _EventEmitter);

	    function Client() {
	        var _ref;

	        _classCallCheck(this, Client);

	        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	            args[_key] = arguments[_key];
	        }

	        var _this = _possibleConstructorReturn(this, (_ref = Client.__proto__ || Object.getPrototypeOf(Client)).call.apply(_ref, [this].concat(args)));

	        _this.url = args[0];
	        _this._wait = 50;
	        _this._queue = [];
	        _this._headers = {};
	        _this._session = null;

	        Session.load(Client.getStorage(), _this);

	        _this.on('session', function (sessionId) {
	            Session.create(Client.getStorage(), sessionId, _this);
	        });
	        return _this;
	    }

	    _createClass(Client, [{
	        key: 'session',
	        value: function session() {
	            return this._session;
	        }
	    }, {
	        key: 'handle_responses',
	        value: function handle_responses(responses, queue) {
	            for (var i = 0; i < responses.length; ++i) {
	                if (_typeof(responses[i]) === 'object' && responses[i].error) {
	                    queue[i].failure(responses[i]);
	                } else {
	                    queue[i].success(responses[i]);
	                }
	            }
	        }
	    }, {
	        key: '_xhrRequest',
	        value: function _xhrRequest(body, next) {
	            var _this2 = this;

	            var xhr = Client.getXhr();
	            xhr.onload = function () {
	                next(xhr.response || JSON.parse(xhr.responseText));
	            };
	            xhr.onerror = function (e) {
	                var response = null;
	                try {
	                    response = xhr.response || JSON.parse(xhr.responseText);
	                } catch (e) {
	                    response = {};
	                }
	                var error = new Error(response);
	                error.status = xhr.status;
	                _this2.emit("error", error, function () {
	                    // retry function
	                    _this2._xhrRequest(body, next);
	                });
	            };

	            var request = assign({}, { requests: body }, this._headers);

	            this.emit("request", request);
	            xhr.open("POST", this.url, true);
	            xhr.responseType = 'json';
	            xhr.setRequestHeader("Content-Type", "application/json");
	            xhr.send(JSON.stringify(request));
	        }
	    }, {
	        key: '_sendRequest',
	        value: function _sendRequest() {
	            var _this3 = this;

	            var queue = this._queue;
	            var body = queue.map(function (b) {
	                return [b.name, b.args];
	            });

	            this._xhrRequest(body, function (response) {
	                _this3.emit("response");
	                if (!response || !(response instanceof Object) || !(response.responses instanceof Array)) {
	                    return _this3.emit("error", new Error("Invalid response from the server", body, response));
	                }

	                for (var action in response) {
	                    if (!response.hasOwnProperty(action)) {
	                        continue;
	                    }
	                    if (typeof _this3['handle_' + action] === 'function') {
	                        _this3['handle_' + action](response[action], queue);
	                    } else {
	                        _this3.emit(action, response[action], queue);
	                    }
	                }
	            });

	            this._queue = [];
	        }
	    }, {
	        key: 'setSessionId',
	        value: function setSessionId(sessionId) {
	            this._headers['session'] = sessionId;
	            return this;
	        }
	    }, {
	        key: 'exec',
	        value: function exec(name) {
	            var _this4 = this;

	            var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
	            var callback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

	            if (typeof args === 'function') {
	                callback = args;
	                args = [];
	            }
	            var promise = new Promise(function (success, failure) {
	                _this4._queue.push({ name: name, args: args, success: success, failure: failure });
	            });

	            if (typeof callback === "function") {
	                promise.then(function (response) {
	                    callback(null, response);
	                });
	                promise.catch(function (err) {
	                    callback(err, null);
	                });
	            }
	            clearTimeout(this._sender);
	            this._sender = setTimeout(function () {
	                _this4._sendRequest();
	            }, this._wait);

	            return promise;
	        }
	    }]);

	    return Client;
	}(EventEmitter);

	Client.getStorage = function () {
	    return localStorage;
	};

	Client.getXhr = function () {
	    return new XMLHttpRequest();
	};

	exports.Client = Client;
	exports.Promise = Promise;

/***/ },
/* 1 */
/***/ function(module, exports) {

	function _each(arr, func, thisArg) {
	    for (var i = 0; i < arr.length; i++) {
	        func.call(thisArg, arr[i]);
	    }
	}

	function _remove(arr, element) {
	    var index = arr.indexOf(element);
	    if (index !== -1) {
	        arr.splice(index, 1);
	    }
	}

	function _contains(arr, element) {
	    return arr.indexOf(element) !== -1;
	}

	function EventEmitter() {
	    this.listeners = {};
	}

	EventEmitter.prototype.maxListeners = 10;

	function _validateEventName(eventName) {
	    if (typeof eventName !== 'string') {
	        throw 'eventName is not a string';
	    }
	}

	function _validateListener(listener) {
	    if (typeof listener !== 'function') {
	        throw 'listener is not a function';
	    }
	}

	EventEmitter.prototype.on = function (eventName, listener) {
	    _validateEventName(eventName);
	    _validateListener(listener);
	    this.listeners[eventName] = this.listeners[eventName] || [];
	    if (this.listeners[eventName].length > this.maxListeners) {
	        throw 'Exceeded maxListeners - You might have a memory leak';
	    }
	    if (!_contains(this.listeners[eventName], listener)) {
	        this.listeners[eventName].push(listener);
	        this.emit('on', {
	            eventName: eventName,
	            listener: listener
	        });
	    }
	    return this;
	};

	EventEmitter.prototype.emit = function (eventName, event) {
	    _validateEventName(eventName);
	    var events = Array.prototype.slice.call(arguments, 1);
	    _each(this.listeners[eventName] || [], function (listener) {
	        listener.apply(this, events);
	    }, this);
	    return this;
	};

	EventEmitter.prototype.off = function (eventName, listener) {
	    _validateEventName(eventName);
	    _validateListener(listener);
	    _remove(this.listeners[eventName] || [], listener);

	    this.emit('off', {
	        eventName: eventName,
	        listener: listener
	    });
	    return this;
	};

	EventEmitter.prototype.clearListeners = function (eventName) {
	    _validateEventName(eventName);
	    this.listeners[eventName] = null;
	    return this;
	};

	module.exports = EventEmitter;


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var immediate = __webpack_require__(3);

	/* istanbul ignore next */
	function INTERNAL() {}

	var handlers = {};

	var REJECTED = ['REJECTED'];
	var FULFILLED = ['FULFILLED'];
	var PENDING = ['PENDING'];

	module.exports = Promise;

	function Promise(resolver) {
	  if (typeof resolver !== 'function') {
	    throw new TypeError('resolver must be a function');
	  }
	  this.state = PENDING;
	  this.queue = [];
	  this.outcome = void 0;
	  if (resolver !== INTERNAL) {
	    safelyResolveThenable(this, resolver);
	  }
	}

	Promise.prototype["catch"] = function (onRejected) {
	  return this.then(null, onRejected);
	};
	Promise.prototype.then = function (onFulfilled, onRejected) {
	  if (typeof onFulfilled !== 'function' && this.state === FULFILLED ||
	    typeof onRejected !== 'function' && this.state === REJECTED) {
	    return this;
	  }
	  var promise = new this.constructor(INTERNAL);
	  if (this.state !== PENDING) {
	    var resolver = this.state === FULFILLED ? onFulfilled : onRejected;
	    unwrap(promise, resolver, this.outcome);
	  } else {
	    this.queue.push(new QueueItem(promise, onFulfilled, onRejected));
	  }

	  return promise;
	};
	function QueueItem(promise, onFulfilled, onRejected) {
	  this.promise = promise;
	  if (typeof onFulfilled === 'function') {
	    this.onFulfilled = onFulfilled;
	    this.callFulfilled = this.otherCallFulfilled;
	  }
	  if (typeof onRejected === 'function') {
	    this.onRejected = onRejected;
	    this.callRejected = this.otherCallRejected;
	  }
	}
	QueueItem.prototype.callFulfilled = function (value) {
	  handlers.resolve(this.promise, value);
	};
	QueueItem.prototype.otherCallFulfilled = function (value) {
	  unwrap(this.promise, this.onFulfilled, value);
	};
	QueueItem.prototype.callRejected = function (value) {
	  handlers.reject(this.promise, value);
	};
	QueueItem.prototype.otherCallRejected = function (value) {
	  unwrap(this.promise, this.onRejected, value);
	};

	function unwrap(promise, func, value) {
	  immediate(function () {
	    var returnValue;
	    try {
	      returnValue = func(value);
	    } catch (e) {
	      return handlers.reject(promise, e);
	    }
	    if (returnValue === promise) {
	      handlers.reject(promise, new TypeError('Cannot resolve promise with itself'));
	    } else {
	      handlers.resolve(promise, returnValue);
	    }
	  });
	}

	handlers.resolve = function (self, value) {
	  var result = tryCatch(getThen, value);
	  if (result.status === 'error') {
	    return handlers.reject(self, result.value);
	  }
	  var thenable = result.value;

	  if (thenable) {
	    safelyResolveThenable(self, thenable);
	  } else {
	    self.state = FULFILLED;
	    self.outcome = value;
	    var i = -1;
	    var len = self.queue.length;
	    while (++i < len) {
	      self.queue[i].callFulfilled(value);
	    }
	  }
	  return self;
	};
	handlers.reject = function (self, error) {
	  self.state = REJECTED;
	  self.outcome = error;
	  var i = -1;
	  var len = self.queue.length;
	  while (++i < len) {
	    self.queue[i].callRejected(error);
	  }
	  return self;
	};

	function getThen(obj) {
	  // Make sure we only access the accessor once as required by the spec
	  var then = obj && obj.then;
	  if (obj && typeof obj === 'object' && typeof then === 'function') {
	    return function appyThen() {
	      then.apply(obj, arguments);
	    };
	  }
	}

	function safelyResolveThenable(self, thenable) {
	  // Either fulfill, reject or reject with error
	  var called = false;
	  function onError(value) {
	    if (called) {
	      return;
	    }
	    called = true;
	    handlers.reject(self, value);
	  }

	  function onSuccess(value) {
	    if (called) {
	      return;
	    }
	    called = true;
	    handlers.resolve(self, value);
	  }

	  function tryToUnwrap() {
	    thenable(onSuccess, onError);
	  }

	  var result = tryCatch(tryToUnwrap);
	  if (result.status === 'error') {
	    onError(result.value);
	  }
	}

	function tryCatch(func, value) {
	  var out = {};
	  try {
	    out.value = func(value);
	    out.status = 'success';
	  } catch (e) {
	    out.status = 'error';
	    out.value = e;
	  }
	  return out;
	}

	Promise.resolve = resolve;
	function resolve(value) {
	  if (value instanceof this) {
	    return value;
	  }
	  return handlers.resolve(new this(INTERNAL), value);
	}

	Promise.reject = reject;
	function reject(reason) {
	  var promise = new this(INTERNAL);
	  return handlers.reject(promise, reason);
	}

	Promise.all = all;
	function all(iterable) {
	  var self = this;
	  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
	    return this.reject(new TypeError('must be an array'));
	  }

	  var len = iterable.length;
	  var called = false;
	  if (!len) {
	    return this.resolve([]);
	  }

	  var values = new Array(len);
	  var resolved = 0;
	  var i = -1;
	  var promise = new this(INTERNAL);

	  while (++i < len) {
	    allResolver(iterable[i], i);
	  }
	  return promise;
	  function allResolver(value, i) {
	    self.resolve(value).then(resolveFromAll, function (error) {
	      if (!called) {
	        called = true;
	        handlers.reject(promise, error);
	      }
	    });
	    function resolveFromAll(outValue) {
	      values[i] = outValue;
	      if (++resolved === len && !called) {
	        called = true;
	        handlers.resolve(promise, values);
	      }
	    }
	  }
	}

	Promise.race = race;
	function race(iterable) {
	  var self = this;
	  if (Object.prototype.toString.call(iterable) !== '[object Array]') {
	    return this.reject(new TypeError('must be an array'));
	  }

	  var len = iterable.length;
	  var called = false;
	  if (!len) {
	    return this.resolve([]);
	  }

	  var i = -1;
	  var promise = new this(INTERNAL);

	  while (++i < len) {
	    resolver(iterable[i]);
	  }
	  return promise;
	  function resolver(value) {
	    self.resolve(value).then(function (response) {
	      if (!called) {
	        called = true;
	        handlers.resolve(promise, response);
	      }
	    }, function (error) {
	      if (!called) {
	        called = true;
	        handlers.reject(promise, error);
	      }
	    });
	  }
	}


/***/ },
/* 3 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';
	var Mutation = global.MutationObserver || global.WebKitMutationObserver;

	var scheduleDrain;

	{
	  if (Mutation) {
	    var called = 0;
	    var observer = new Mutation(nextTick);
	    var element = global.document.createTextNode('');
	    observer.observe(element, {
	      characterData: true
	    });
	    scheduleDrain = function () {
	      element.data = (called = ++called % 2);
	    };
	  } else if (!global.setImmediate && typeof global.MessageChannel !== 'undefined') {
	    var channel = new global.MessageChannel();
	    channel.port1.onmessage = nextTick;
	    scheduleDrain = function () {
	      channel.port2.postMessage(0);
	    };
	  } else if ('document' in global && 'onreadystatechange' in global.document.createElement('script')) {
	    scheduleDrain = function () {

	      // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
	      // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
	      var scriptEl = global.document.createElement('script');
	      scriptEl.onreadystatechange = function () {
	        nextTick();

	        scriptEl.onreadystatechange = null;
	        scriptEl.parentNode.removeChild(scriptEl);
	        scriptEl = null;
	      };
	      global.document.documentElement.appendChild(scriptEl);
	    };
	  } else {
	    scheduleDrain = function () {
	      setTimeout(nextTick, 0);
	    };
	  }
	}

	var draining;
	var queue = [];
	//named nextTick for less confusing stack traces
	function nextTick() {
	  draining = true;
	  var i, oldQueue;
	  var len = queue.length;
	  while (len) {
	    oldQueue = queue;
	    queue = [];
	    i = -1;
	    while (++i < len) {
	      oldQueue[i]();
	    }
	    len = queue.length;
	  }
	  draining = false;
	}

	module.exports = immediate;
	function immediate(task) {
	  if (queue.push(task) === 1 && !draining) {
	    scheduleDrain();
	  }
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Storage = __webpack_require__(5);

	var Session = function () {
	    function Session(sessionId, localStorage) {
	        _classCallCheck(this, Session);

	        this.storage = new Storage.createNamespace(sessionId, localStorage);
	    }

	    _createClass(Session, [{
	        key: 'set',
	        value: function set(name, value) {
	            return this.storage.setItem(name, value);
	        }
	    }, {
	        key: 'get',
	        value: function get(name) {
	            return this.storage.getItem(name);
	        }
	    }, {
	        key: 'logout',
	        value: function logout() {
	            this.storage.clear();
	        }
	    }]);

	    return Session;
	}();

	Session.create = function (localStorage, sessionId, client) {
	    var storage = Storage.createNamespace('jsonful', localStorage);
	    storage.setItem(client.url, sessionId);
	    client._session = new Session(sessionId, localStorage);
	    client._headers['session'] = sessionId;
	};

	Session.load = function (localStorage, client) {
	    var storage = Storage.createNamespace('jsonful', localStorage);
	    var sesId = storage.getItem(client.url);
	    if (sesId) {
	        client._session = new Session(sesId, localStorage);
	        client._headers['session'] = sesId;
	    }
	};

	module.exports = Session;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;'use strict';

	// package module for different environments
	function packageModule(global, name, api) {
	  if (global.define && global.define.amd) {
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (api), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if (true) {
	    module.exports = api;
	  } else {
	    global[name] = api;
	  }
	}

	// SNStorage constructor
	function NSStorage(namespace, storage){
	  this._ns = namespace;
	  this._nsRegex = new RegExp(''+namespace+'_');
	  this._storage = storage;
	  this._keyCache = null;
	  this.length = this._keys().length;
	}

	// Generate an namespaced key
	NSStorage.prototype._genKey = function(key){
	  return this._ns + '_' + key;
	};

	// Check if key is in namespace
	NSStorage.prototype._inNamespace = function(key){
	  return key && (key.indexOf(this._ns) === 0);
	};

	// Check if key exists
	NSStorage.prototype._exists = function(key){
	  return !!this.getItem(key);
	};

	// Get all keys in this namespace
	NSStorage.prototype._keys = function(){
	  if(this._keyCache){
	    return this._keyCache;
	  }else{
	    var keys = [];
	    for(var i=0, len=this._storage.length; i<len; i++) {
	      var key = this._storage.key(i);
	      if(this._inNamespace(key)) keys.push(key.replace(this._nsRegex, ''));
	    }
	    this._keyCache = keys;
	    return keys;
	  }
	};

	NSStorage.prototype._invalidateCache = function(){
	  this._keyCache = null;
	};

	//
	// STORAGE API
	// Spec here: http://dev.w3.org/html5/webstorage/#storage-0
	//

	// Get the key of index idx
	NSStorage.prototype.key = function(idx){
	  return this._keys()[idx] || null;
	};

	// Get item for key
	NSStorage.prototype.getItem = function(key){
	  return this._storage.getItem(this._genKey(key));
	};

	// Set value of key to val
	NSStorage.prototype.setItem = function(key, val){
	  if(!this._exists(key)){
	    this.length++;
	    this._invalidateCache();
	  }
	  this._storage.setItem(this._genKey(key), val);
	};

	// Remove item from storage
	NSStorage.prototype.removeItem = function(key){
	  if(this._exists(key)){
	    this.length--;
	    this._invalidateCache();
	  }
	  this._storage.removeItem(this._genKey(key));
	};

	// Clear storage
	NSStorage.prototype.clear = function(){
	  var _this = this;
	  this._keys().forEach(function(key){
	    _this.removeItem(key);
	  });
	  this._invalidateCache();
	};

	//
	// API
	//
	var API = {
	  createNamespace: function(namespace, storage){
	    return new NSStorage(namespace, storage);
	  }
	};

	// Module packaging
	packageModule(this, 'NSStorage', API);


/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';
	/* eslint-disable no-unused-vars */
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;

	function toObject(val) {
		if (val === null || val === undefined) {
			throw new TypeError('Object.assign cannot be called with null or undefined');
		}

		return Object(val);
	}

	function shouldUseNative() {
		try {
			if (!Object.assign) {
				return false;
			}

			// Detect buggy property enumeration order in older V8 versions.

			// https://bugs.chromium.org/p/v8/issues/detail?id=4118
			var test1 = new String('abc');  // eslint-disable-line
			test1[5] = 'de';
			if (Object.getOwnPropertyNames(test1)[0] === '5') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test2 = {};
			for (var i = 0; i < 10; i++) {
				test2['_' + String.fromCharCode(i)] = i;
			}
			var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
				return test2[n];
			});
			if (order2.join('') !== '0123456789') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test3 = {};
			'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
				test3[letter] = letter;
			});
			if (Object.keys(Object.assign({}, test3)).join('') !==
					'abcdefghijklmnopqrst') {
				return false;
			}

			return true;
		} catch (e) {
			// We don't expect any of the above to throw, but better to be safe.
			return false;
		}
	}

	module.exports = shouldUseNative() ? Object.assign : function (target, source) {
		var from;
		var to = toObject(target);
		var symbols;

		for (var s = 1; s < arguments.length; s++) {
			from = Object(arguments[s]);

			for (var key in from) {
				if (hasOwnProperty.call(from, key)) {
					to[key] = from[key];
				}
			}

			if (Object.getOwnPropertySymbols) {
				symbols = Object.getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) {
					if (propIsEnumerable.call(from, symbols[i])) {
						to[symbols[i]] = from[symbols[i]];
					}
				}
			}
		}

		return to;
	};


/***/ }
/******/ ]);