(function() {
  'use strict';

  function AdminCtrl(Auth, Restangular) {
    let self = this;

    function getPlaces() {
        // TODO: Handle errors here
        Restangular.all('places')
          .getList()
          .then(places => self.places = places);
    }

    function authenticate(email, password) {
      self.authenticating = true;
      Auth.signIn(email, password)
        .then(() => {
          self.authenticating = false;
          getPlaces();
        })
        .catch(err => {
          if (err === Auth.UNPROCESSABLE_ENTITY) {
            alert('Preencha os campos corretamente.');
          }

          if (err === Auth.UNAUTHORIZED) {
            alert('Usuário/senha inválido(s)!');
          }
        });
    }

    if (Auth.isSignedIn) {
      getPlaces();
    }

    self.isSignedIn     = Auth.isSignedIn;
    self.authenticate   = authenticate;
    self.authenticating = false;
  }

  angular.module('app')
    .controller('AdminCtrl', AdminCtrl);
})();
