(function() {
  'use strict';

  const UNAUTHORIZED          = 401;
  const UNPROCESSABLE_ENTITY  = 422;
  const INTERNAL_SERVER_ERROR = 500;

  function AuthService($q, $localStorage, Restangular) {
    let self = this;
    let origin = 'web';

    /**
     * Verifies if the user is authenticated.
     * @returns {bool} True if the user is authenticated. Otherwise false.
     */
    function isSignedIn() {
      return !!$localStorage.authToken;
    }

    /**
     * Authenticates the user.
     * @returns {bool} A promise.
     */
    function signIn(email, password) {
      let deferred = $q.defer();

      Restangular.all('sessions')
        .post({ email, password, origin })
        .then(session => {
          $localStorage.authToken = session;
          deferred.resolve();
        })
      .catch(err => deferred.reject(err.status));

      return deferred.promise;
    }

    function signOut() {
      delete $localStorage.authToken;
    }

    // Methods
    self.isSignedIn = isSignedIn;
    self.signIn     = signIn;
    self.signOut    = signOut;

    // Constants
    self.UNAUTHORIZED          = UNAUTHORIZED;
    self.UNPROCESSABLE_ENTITY  = UNPROCESSABLE_ENTITY;
    self.INTERNAL_SERVER_ERROR = INTERNAL_SERVER_ERROR;
  }

  angular.module('app')
    .service('Auth', AuthService);
})();

