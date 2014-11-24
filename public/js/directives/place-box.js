(function() {
  'use strict';

  function placeBoxDirective($state) {
    return {
      restrict: 'E',
      templateUrl: '/resources/html/directives/place-box.html',
      replace: true,
      scope: {
        place: '='
      }
    };
  }

  angular.module('app')
    .directive('myPlaceBox', placeBoxDirective);
})();
