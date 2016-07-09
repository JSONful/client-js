var JSONful = require('./src/jsonful').Client;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest

JSONful.getXhr = function() {
    return new XMLHttpRequest;
};

exports.JSONful = JSONful;
