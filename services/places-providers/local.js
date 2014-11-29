'use strict';

var BaseProvider = require('./base.js');

function LocalProvider() {

  function find(coordinates, callback) {
    callback(null, []);
  }

  this.find = find;
}

LocalProvider.prototype = new BaseProvider('local');

module.exports = LocalProvider;
