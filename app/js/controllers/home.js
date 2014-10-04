(function() {
  'use strict';

  function HomeCtrl($scope, Restangular) {
    Restangular.all('pizzerias')
      .getList()
      .then(function (pizzerias) {
        $scope.suggestions = pizzerias;
      });
  }

  angular.module('app')
    .controller('HomeCtrl', HomeCtrl);
})();
