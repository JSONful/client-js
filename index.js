var JSONful= require('./lib/jsonful');

if (typeof __webpack_require__  !== 'function'
        || typeof __webpack_public_path__ !== 'string') {
    // It's a node runtime, we should include the xmlhttprequest
    // emulator
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest
    JSONful.Client.getXhr = function() {
        return new XMLHttpRequest;
    };
}

module.exports = JSONful;
