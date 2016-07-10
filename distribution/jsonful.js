'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('micro-events');
var Promise = require('lie');

var Client = function (_EventEmitter) {
    _inherits(Client, _EventEmitter);

    function Client() {
        var _Object$getPrototypeO;

        _classCallCheck(this, Client);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(Client)).call.apply(_Object$getPrototypeO, [this].concat(args)));

        _this.server = args[0];
        _this._wait = 50;
        _this._queue = [];
        _this._headers = {};
        _this.on('session', function (sessionId) {
            _this._headers['session'] = sessionId;
        });
        return _this;
    }

    _createClass(Client, [{
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

            var request = Object.assign({}, { requests: body }, this._headers);

            this.emit("request", request);
            xhr.open("POST", this.server, true);
            xhr.resposneType = 'json';
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

            var args = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
            var callback = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

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

Client.getXhr = function () {
    return new XMLHttpRequest();
};

exports.Client = Client;
exports.Promise = Promise;