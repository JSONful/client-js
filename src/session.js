var Storage = require('nsstorage');

class Session {
    constructor(sessionId, localStorage) {
        this.storage = new Storage.createNamespace(sessionId, localStorage);
    }
    set(name, value) {
        return this.storage.setItem(name, value);
    }
    get(name) {
        return this.storage.getItem(name);
    }
    logout() {
        this.storage.clear();
    }
}

Session.create = (localStorage, sessionId, client) => {
    let storage = Storage.createNamespace('jsonful', localStorage);
    storage.setItem(client.url, sessionId);
    client._session = new Session(sessionId, localStorage);
    client._headers['session'] = sessionId;
}

Session.load = (localStorage, client) => {
    let storage = Storage.createNamespace('jsonful', localStorage);
    let sesId   = storage.getItem(client.url);
    if (sesId) {
        client._session = new Session(sesId, localStorage);
        client._headers['session'] = sesId;
    }
};

module.exports = Session;
