var EventEmitter = require('micro-events');
var Promise = require('lie');
var Session = require('./session');
var assign  = require('object-assign');

class Client extends EventEmitter {
    constructor(...args) {
        super(...args);
        this.url    = args[0];
        this._wait  = 50;
        this._queue = [];
        this._headers = {};
        this._session = null;

        Session.load(Client.getStorage(), this);

        this.on('session', (sessionId) => {
            Session.create(Client.getStorage(), sessionId, this);
        });
    }

    session() {
        return this._session;
    }

    handle_responses(responses, queue) {
        for (let i = 0; i < responses.length; ++i) {
            if (typeof responses[i] === 'object' && responses[i].error) {
                queue[i].failure(responses[i]);
            } else {
                queue[i].success(responses[i]);
            }
        }
    }

    _xhrRequest(body, next) {
        let xhr = Client.getXhr();
        xhr.onload = () => {
            next(xhr.response || JSON.parse(xhr.responseText));
        };
        xhr.onerror = (e) => {
            let response = null;
            try {
                response = xhr.response || JSON.parse(xhr.responseText)
            } catch (e) {
                response = {};
            }
            let error = new Error(response);
            error.status = xhr.status;
            this.emit("error", error, () => {
                // retry function
                this._xhrRequest(body, next);
            });
        };

        let request = assign({}, {requests: body}, this._headers);

        this.emit("request", request);
        xhr.open("POST", this.url, true);
        xhr.responseType = 'json';
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(request));
    }

    _sendRequest() {
        let queue = this._queue;
        let body  = queue.map((b) => {
            return [b.name, b.args];
        });

        this._xhrRequest(body, (response) => {
            this.emit("response");
            if (!response || !(response instanceof Object) || !(response.responses instanceof Array)) {
                return this.emit("error", new Error("Invalid response from the server", body, response));
            }

            for (let action in response) {
                if (!response.hasOwnProperty(action)) {
                    continue;
                }
                if (typeof this['handle_' + action] === 'function') {
                    this['handle_' + action](response[action], queue);
                } else {
                    this.emit(action, response[action], queue);
                }
            }
        });

        this._queue = [];
    }

    setSessionId (sessionId) {
        this._headers['session'] = sessionId;
        return this;
    }
    exec(name, args = [], callback = null) {
        if (typeof args === 'function') {
            callback = args;
            args = [];
        }
        let promise = new Promise((success, failure) => {
            this._queue.push({name: name, args: args, success: success, failure: failure});
        });

        if (typeof callback === "function") {
            promise.then((response) => {
                callback(null, response);
            });
            promise.catch((err) => {
                callback(err, null);
            });
        }
        clearTimeout(this._sender);
        this._sender = setTimeout(() => {
            this._sendRequest();
        }, this._wait);

        return promise;
    }
}

Client.getStorage = () => {
    return localStorage;
};

Client.getXhr = () => {
    return new XMLHttpRequest;
};

exports.Client = Client;
exports.Promise = Promise;
