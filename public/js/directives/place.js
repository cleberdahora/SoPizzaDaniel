(function() {
  'use strict';

  function placeDirective() {
    function link(scope, elem, attrs) {
    }

    return {
      restrict: 'E',
      link: link,
      templateUrl: '/resources/html/directives/place.html',
      replace: true,
      scope: {
        place: '='
      }
    };
  }

  angular.module('app')
    .directive('myPlace', placeDirective);
})();
