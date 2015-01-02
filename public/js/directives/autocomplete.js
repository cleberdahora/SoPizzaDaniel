(function() {
  'use strict';

  function autocompleteDirective($timeout, lodash) {
    function link(scope, elem, attrs, ngModel) {
      if (!ngModel) {
        console.warn('The autocomplete directive requires a ngModel ' +
            'on the element.');
        return;
      }

      let directive = elem.find('.my-autocomplete');
      directive.remove(); // remove from input
      directive.insertAfter(elem);

      // Move the directive below the input
      var elemPosition = elem.position();
      var top  = elemPosition.top + elem.outerHeight();
      var left = elemPosition.left;
      var width = elem.outerWidth();

      directive.css({
        left    : left,
        top     : top,
        minWidth: width
      });


      elem.on('focus', function() {
        directive.show();
      });

      // HACK: no, MEGAHACK.
      // TODO: no description is needed. Just read the code.
      elem.on('blur', function() {
        $timeout(function() {
          if (!elem.is(':focus')) {
            directive.hide();
          }
        }, 500);
      });

      function highlight(text, sections, highlightClass) {
        let wrapperTag = angular.element('<span>').addClass(highlightClass);

        function spliceString(str, offset, length) {
          let args = lodash(arguments)
            .toArray()
            .rest()
            .value();
          let strArray = lodash.toArray(str);

          Array.prototype.splice.apply(strArray, args);

          return strArray.join('');
        }

        let highlighted = lodash(sections)
          .sortBy('offset')
          .reduceRight((text, highlight) => {
            let { offset, length } = highlight;

            let slice       = text.slice(offset, offset + length);
            let tag         = wrapperTag.clone();
            let wrappedText = tag.wrapInner(slice).prop('outerHTML');

            return spliceString(text, offset, length, wrappedText);
          }, text);

        return highlighted;
      }

      // Keyboard navigation
      function goUp() {
        let focusClass = 'focused';
        let curr = directive.find('.suggestion.focused');
        let currIdx = curr.index();
        let target;

        if (currIdx === -1) {
          // Get the last element by default
          target = angular.element('.suggestion:last-child');
        } else {

          if (curr.is(':first-child')) {
            // Go to last element and start it all again
            target = directive.find('.suggestion:last-child');
          } else {
            // Go to previous
            target = curr.prev('.suggestion');
          }
        }

        curr.removeClass(focusClass);
        target.addClass(focusClass);

        select(target);
      }

      function goDown() {
        let focusClass = 'focused';
        let curr = directive.find('.suggestion.focused');
        let currIdx = curr.index();
        let target;

        if (currIdx === -1) {
          // Get the first element by default
          target = angular.element('.suggestion:first-child');
        } else {
          if (curr.is(':last-child')) {
            // Go to first element and start it all again
            target = directive.find('.suggestion:first-child');
          } else {
            // Go to next
            target = curr.next('.suggestion');
          }
        }

        curr.removeClass(focusClass);
        target.addClass(focusClass);

        select(target);
      }

      function select(suggestion) {
        if (!suggestion) {
          suggestion = directive.find('.suggestion.focused');
        }

        if (angular.isElement(suggestion)) {
          suggestion = suggestion.scope().suggestion;
        }

        if (suggestion) {
          let textField = scope.textField;
          suggestion = suggestion[textField || 'text'];

          if (scope.selectedItem) {
            scope.selectedItem.suggestion = suggestion;
          }
        }

        ngModel.$viewValue = suggestion;
        ngModel.$render();
      }

      // Keyboard navigation
      let keyHandlers = {
        38: goUp,
        40: goDown
      };

      elem.bind('keydown', function(event) {
        let code = event.keyCode;
        let handler = keyHandlers[code];

        if (handler) {
          scope.$apply(function() {
            handler();
          });

          event.preventDefault();
        }
      });

      scope.select = select;
      scope.highlight = highlight;
    }

    return {
      restrict: 'EA',
      require: '?ngModel',
      templateUrl: '/resources/html/directives/autocomplete.html',
      transclude: 'true',
      scope: {
        suggestions     : '=',
        click           : '=',
        limit           : '@',
        keyField        : '@',
        textField       : '@',
        descriptionField: '@',
        highlightsField : '@',
        offsetField     : '@',
        lengthField     : '@',
        selectedItem    : '=',
        target          : '@'
      },
      link: link
    };
  }

  angular.module('app')
    .directive('myAutocomplete', autocompleteDirective);
})();
