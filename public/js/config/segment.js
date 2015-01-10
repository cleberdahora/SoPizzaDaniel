(function() {
  'use strict';

  function segmentConfig(segmentio) {
    segmentio.load('Ne0RPhSmNNFRlLNp8uBG9Sx1ubuQd5GV');
  }

  angular.module('app')
    .run(segmentConfig);
})();
