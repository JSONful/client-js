'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Storage = require('nsstorage');

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