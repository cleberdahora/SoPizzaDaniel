(function() {
  'use strict';

  function routerConfig($locationProvider, $urlRouterProvider, $stateProvider) {
    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/404');

    $stateProvider.state({
      name       : 'home',
      url        : '/',
      templateUrl: templatePath('home/index.html'),
      controller : 'HomeCtrl as home'
    });

    $stateProvider.state({
      name       : 'search',
      url        : '/search/:query?ll',
      templateUrl: templatePath('search/index.html'),
      controller : 'SearchCtrl as search',
      resolve    : {
        coordinates: function(Restangular, $stateParams, lodash) {
          if ($stateParams.ll) {
            return $stateParams.ll
              .split(',')
              .map(parseFloat);
          } else {
            let query = $stateParams.query;

            return Restangular.all('locations')
              .getList({ query })
              .then(lodash.first)
              .then(lodash.property('coordinates'))
              .then(lodash.partialRight(lodash.map, parseFloat));
          }
        }
      }
    });
  }

  function templatePath(relativePath) {
    return '/resources/html/pages/' + relativePath;
  }

  angular
    .module('app')
    .config(routerConfig);
})();
