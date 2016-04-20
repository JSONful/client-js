(function() {
  var EventEmitter, JSONful, Promise, defaultOnReject, defaultOnResolve, isFunction, module, push, setImmediate,
    slice = [].slice,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  EventEmitter = (function() {
    function EventEmitter() {
      this.events = {};
    }

    EventEmitter.prototype.emit = function() {
      var args, event, i, len, listener, ref;
      event = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      if (!this.events[event]) {
        return false;
      }
      ref = this.events[event];
      for (i = 0, len = ref.length; i < len; i++) {
        listener = ref[i];
        listener.apply(null, args);
      }
      return true;
    };

    EventEmitter.prototype.addListener = function(event, listener) {
      var base;
      this.emit('newListener', event, listener);
      ((base = this.events)[event] != null ? base[event] : base[event] = []).push(listener);
      return this;
    };

    EventEmitter.prototype.on = EventEmitter.prototype.addListener;

    EventEmitter.prototype.once = function(event, listener) {
      var fn;
      fn = (function(_this) {
        return function() {
          _this.removeListener(event, fn);
          return listener.apply(null, arguments);
        };
      })(this);
      this.on(event, fn);
      return this;
    };

    EventEmitter.prototype.removeListener = function(event, listener) {
      var l;
      if (!this.events[event]) {
        return this;
      }
      this.events[event] = (function() {
        var i, len, ref, results;
        ref = this.events[event];
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          l = ref[i];
          if (l !== listener) {
            results.push(l);
          }
        }
        return results;
      }).call(this);
      return this;
    };

    EventEmitter.prototype.removeAllListeners = function(event) {
      delete this.events[event];
      return this;
    };

    return EventEmitter;

  })();

  module = {};

  setImmediate = setTimeout;

  JSONful = (function(superClass) {
    extend(JSONful, superClass);

    function JSONful(server) {
      this.server = server;
      this._queue = [];
      this._callback = this._sendRequest.bind(this);
      JSONful.__super__.constructor.call(this);
    }

    JSONful.prototype._xhrRequest = function(reqBody, onready) {
      var xhr;
      xhr = JSONful.getXhr();
      xhr.onload = onready;
      xhr.onerror = function() {
        return console.error(xhr.responseText);
      };
      xhr.open("POST", this.server, true);
      xhr.responseType = 'json';
      xhr.setRequestHeader("Content-Type", "application/json");
      return xhr.send(JSON.stringify({
        requests: reqBody
      }));
    };

    JSONful.prototype.handle_responses = function(responses, queue) {
      var key, results, value;
      results = [];
      for (key in responses) {
        if (!hasProp.call(responses, key)) continue;
        value = responses[key];
        if (typeof value === "object" && value.error) {
          results.push(queue[key].failure(value));
        } else {
          results.push(queue[key].success(value));
        }
      }
      return results;
    };

    JSONful.prototype._sendRequest = function() {
      var queue, requestBody, that;
      queue = this._queue;
      requestBody = queue.map(function(b) {
        return [b.name, b.args];
      });
      that = this;
      this._xhrRequest(requestBody, function() {
        var key, responses, results, value;
        responses = !this.response && typeof this.responseText === "string" ? JSON.parse(this.responseText) : this.response;
        if (!responses || !(responses instanceof Object) || !(responses.responses instanceof Array)) {
          that.emit("error", new Error("Invalid response from the server"), requestBody);
          return;
        }
        results = [];
        for (key in responses) {
          if (!hasProp.call(responses, key)) continue;
          value = responses[key];
          if (typeof that["handle_" + key] === "function") {
            results.push(that["handle_" + key](value, queue));
          } else {
            results.push(that.emit(key, value));
          }
        }
        return results;
      });
      return this._queue = [];
    };

    JSONful.prototype.exec = function(name, args, callback) {
      var promise;
      if (args == null) {
        args = [];
      }
      if (callback == null) {
        callback = null;
      }
      promise = new Promise((function(success, failure) {
        return this._queue.push({
          name: name,
          args: args,
          success: success,
          failure: failure
        });
      }).bind(this));
      if (typeof callback === "function") {
        promise.then(function(response) {
          return callback(null, response);
        });
        promise["catch"](function(err) {
          return callback(err, null);
        });
      }
      clearTimeout(this._sender);
      this._sender = setTimeout(this._callback);
      return promise;
    };

    return JSONful;

  })(EventEmitter);

  JSONful.getXhr = function() {
    return new XMLHttpRequest;
  };

  this.JSONful = JSONful;

  this.Promise = Promise;

  this.EventEmitter = EventEmitter;

  'use strict';

  push = Array.prototype.push;

  isFunction = function(arg) {
    return typeof arg === 'function';
  };

  defaultOnResolve = function(result) {
    return result;
  };

  defaultOnReject = function(reason) {
    throw reason;
  };

  module.exports = Promise = (function() {
    function Promise(executor) {
      var err, error, reject, resolve;
      this._reactions = [];
      resolve = this._resolve(true);
      reject = this._resolve(false);
      try {
        executor(resolve, reject);
      } catch (error) {
        err = error;
        reject(err);
      }
    }

    Promise.prototype.then = function(onResolve, onReject) {
      if (!isFunction(onResolve)) {
        onResolve = defaultOnResolve;
      }
      if (!isFunction(onReject)) {
        onReject = defaultOnReject;
      }
      return new this.constructor((function(_this) {
        return function(resolve, reject) {
          var enqueue;
          enqueue = _this._settled ? setImmediate : push.bind(_this._reactions);
          return enqueue(function() {
            var callback, err, error, result;
            callback = _this._success ? onResolve : onReject;
            try {
              result = callback(_this._result);
            } catch (error) {
              err = error;
              return reject(err);
            }
            return resolve(result);
          });
        };
      })(this));
    };

    Promise.prototype["catch"] = function(onReject) {
      return this.then(null, onReject);
    };

    Promise.prototype._resolve = function(success) {
      return (function(_this) {
        return function(result) {
          var err, error, promise, reason;
          if (_this._resolved) {
            return;
          }
          _this._resolved = true;
          if (success) {
            if (result === _this) {
              reason = new TypeError("can't resolve a promise with itself");
              return _this._settle(false, reason);
            }
            try {
              promise = _this.constructor._normalizeThenable(result);
            } catch (error) {
              err = error;
              return _this._settle(false, err);
            }
            if (promise) {
              promise.then(function(result) {
                return _this._settle(true, result);
              }, function(reason) {
                return _this._settle(false, reason);
              });
              return;
            }
          }
          return _this._settle(success, result);
        };
      })(this);
    };

    Promise.prototype._settle = function(success, result) {
      var i, len, reaction, ref;
      if (this._settled) {
        return;
      }
      this._settled = true;
      this._success = success;
      this._result = result;
      ref = this._reactions;
      for (i = 0, len = ref.length; i < len; i++) {
        reaction = ref[i];
        setImmediate(reaction);
      }
      return this._reactions = null;
    };

    Promise.resolve = function(value) {
      var err, error, promise;
      try {
        promise = this._normalizeThenable(value);
      } catch (error) {
        err = error;
        return this.reject(err);
      }
      return promise || new this(function(resolve, reject) {
        return resolve(value);
      });
    };

    Promise.reject = function(reason) {
      return new this(function(resolve, reject) {
        return reject(reason);
      });
    };

    Promise._normalizeThenable = function(arg) {
      var ref, thenMethod;
      thenMethod = arg != null ? arg.then : void 0;
      if (!isFunction(thenMethod)) {
        return false;
      }
      if (arg instanceof this) {
        return arg;
      } else if ((ref = typeof arg) === 'boolean' || ref === 'number') {
        return false;
      } else {
        return new this(function(resolve, reject) {
          return thenMethod.call(arg, resolve, reject);
        });
      }
    };

    return Promise;

  })();

}).call(this);
