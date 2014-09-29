(function() {
  'use strict';

  function HomeCtrl($scope) {
    $scope.suggestions = [
      'a',
      'b',
      'c',
      'd',
      'e',
    ];
  }

  angular.module('app')
    .controller('HomeCtrl', HomeCtrl);
})();
