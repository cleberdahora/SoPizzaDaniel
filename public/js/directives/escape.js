(function() {
  'use strict';

  function escapeDirective($document, $parse, lodash) {
    function link(scope, elem, attrs) {
      let fn = $parse(attrs.myEscape);
      let escKeyCode = 27;

      $document.keydown(event => {
        if (event.keyCode === escKeyCode) {
          scope.$apply(lodash.partial(fn, scope));
        }
      });
    }

    return {
      restrict: 'A',
      link: link
    };
  }

  angular.module('app')
    .directive('myEscape', escapeDirective);
})();
