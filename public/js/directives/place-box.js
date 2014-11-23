(function() {
  'use strict';

  function placeBoxDirective($state) {
    function link(scope, elem, attrs) {
      function goToPlace() {
        let place   = scope.place;
        let placeId = place._id;

        $state.go('place', { placeId });
      }

      scope.goToPlace = goToPlace;
    }

    return {
      restrict: 'E',
      link: link,
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
