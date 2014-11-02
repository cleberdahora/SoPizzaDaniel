(function() {
  'use strict';

  function routerConfig($locationProvider, $urlRouterProvider, $stateProvider) {
    let states = [];

    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/404');

    states.push({
      name       : 'home',
      url        : '/',
      templateUrl: templatePath('home/index.html'),
      controller : 'HomeCtrl as home'
    });

    states.push({
      name       : 'search',
      url        : '/search',
      templateUrl: templatePath('search/index.html'),
      controller : 'SearchCtrl as search'
    });

    states.forEach(state => $stateProvider.state(state));
  }

  function templatePath(relativePath) {
    return '/resources/html/pages/' + relativePath;
  }

  angular
    .module('app')
    .config(routerConfig);
})();
