(function() {
  'use strict';

  function postInterceptor($injector) {
    function interceptor(data, operation, what, url, response, deferred) {
      if ('post' === operation) {
        var location = response.headers('location');
        var status   = response.status;

        if (location && 201 === status && !data) {
          // TODO: Fix injection
          var Restangular = $injector.get('Restangular');
          var promise = Restangular
            .customGET(location);

          return promise;
        }
      }
      return data;
    }
    return interceptor;
  }

  function RestangularConfig($injector, RestangularProvider) {
    RestangularProvider.setBaseUrl('/api');
    RestangularProvider.setDefaultHttpFields({ cache: false });
    RestangularProvider.addResponseInterceptor(postInterceptor($injector));
  }

  angular.module('app')
    .config(RestangularConfig);
})();
