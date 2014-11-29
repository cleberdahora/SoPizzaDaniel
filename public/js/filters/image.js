(function() {
  'use strict';

  function imageFilter() {
    function filter(image, width = 100, height = 100) {
      let {prefix, suffix} = image;

      return prefix + width + 'x' + height + suffix;
    }

    return filter;
  }

  angular.module('app')
    .filter('image', imageFilter);
})();
