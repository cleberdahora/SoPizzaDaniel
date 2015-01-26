(function() {
  'use strict';

  function AdminCtrl(Auth) {
    let self = this;

    function authenticate(email, password) {
      self.authenticating = true;
      Auth.signIn(email, password)
        .then(() => {
          self.authenticating = false;
        })
        .catch(err => {
          if (err === Auth.UNPROCESSABLE_ENTITY) {
            alert('Please fill the fields correctly');
          }

          if (err === Auth.UNAUTHORIZED) {
            alert('Wrong user/password!');
          }
        });
    }

    self.authenticate   = authenticate;
    self.authenticating = false;
  }

  angular.module('app')
    .controller('AdminCtrl', AdminCtrl);
})();
