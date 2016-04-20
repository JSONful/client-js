#!/usr/bin/env node
var coffeebar = require('coffeebar')

coffeebar(['eventemitter.coffee', 'client.coffee', 'node_modules/promise-coffee/promise.coffee'], {
    header: false,
    output: 'client.js'
})
coffeebar(['eventemitter.coffee', 'client.coffee', 'node_modules/promise-coffee/promise.coffee'], {
    minify: true,
    output: 'client.min.js',
})
