'use strict';

function find(location, callback) {
  callback(null, [{
    name: 'Test place',
    description: 'This is a test place, it exists only in your mind.',
    externalLinks: [
    {
      source: 'foursquare',
      link: 'http://google.com'
    }
    ],
    address: {
      location: {},
      street: '',
    }
  }]);
}

let foursquare = {
  find: find
};

module.exports = foursquare;
