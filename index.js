var JSONful = require('./distribution/jsonful').Client;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest

JSONful.getXhr = function() {
    return new XMLHttpRequest;
};

exports.JSONful = JSONful;
