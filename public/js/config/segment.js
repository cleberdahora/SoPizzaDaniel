(function() {
  'use strict';

  function segmentConfig(segmentio) {
    // Dev
    //segmentio.load('Ne0RPhSmNNFRlLNp8uBG9Sx1ubuQd5GV');
    // Prod
    segmentio.load('nZvoRY5XEAXmK6hFci9YrxpNHmoLYBhg');
  }

  angular.module('app')
    .run(segmentConfig);
})();
