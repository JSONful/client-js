var path = require('path');
var webpack = require('webpack');

var config = {
     entry: './src/jsonful.js',
     output: {
         path: __dirname,
         filename: 'jsonful.js',
         library: ['JSONful'],
     },
     module: {
         loaders: [{
             test: /.js?$/,
             loader: 'babel-loader',
             exclude: /node_modules/,
             query: {
                 presets: ['es2015']
             }    
         }]
    }
};

module.exports = config;
