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
      let elemPos = elem.position();
      let top     = elemPos.top + elem.outerHeight();
      let left    = elemPos.left;
      let width   = elem.outerWidth();

      directive.css({
        left    : left,
        top     : top,
        minWidth: width
      });

      elem.on('focus', () => directive.show());

      // HACK: no, MEGAHACK.
      // TODO: no description is needed. Just read the code.
      elem.on('blur', () => {
        $timeout(() => {
          if (!elem.is(':focus')) {
            directive.hide();
          }
        }, 100);
      });

      function highlight(text, sections, highlightClass) {
        let wrapperTag = angular.element('<span>').addClass(highlightClass);

        // Apply Array.splice function on a string
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

            if (offset > text.length) {
              return text;
            }

            // wrap highlighted text on the wrapper tag
            let slice       = text.slice(offset, offset + length);
            let tag         = wrapperTag.clone();
            let wrappedText = tag.wrapInner(slice).prop('outerHTML');

            // add the highlighted slice on the original text
            return spliceString(text, offset, length, wrappedText);
          }, text);

        return highlighted;
      }

      // Keyboard navigation
      function goUp() {
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

        curr.removeClass('focused');
        target.addClass('focused');

        select(target);
      }

      function goDown() {
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

        curr.removeClass('focused');
        target.addClass('focused');

        select(target);
      }

      function focus(suggestion) {
        let item = directive
          .find('.suggestion')
          .filter((idx, elem) => {
            let scope = angular.element(elem).scope();
            return scope.suggestion === suggestion;
          });

        directive.find('.suggestion')
          .removeClass('focused');

        item.addClass('focused');
      }

      function select(suggestion) {
        if (!suggestion) {
          suggestion = directive.find('.suggestion.focused');
        }

        if (angular.isElement(suggestion)) {
          suggestion = suggestion.scope().suggestion;
        }

        if (suggestion) {
          if (scope.selectedItem) {
            scope.selectedItem.suggestion = suggestion;
          }

          ngModel.$viewValue = suggestion.value;
        }

        ngModel.$render();
      }

      // Keyboard navigation
      let keyHandlers = {
        38: goUp,
        40: goDown
      };

      elem.bind('keydown', (event) => {
        let code = event.keyCode;
        let handler = keyHandlers[code];

        if (handler) {
          scope.$apply(() => handler());

          event.preventDefault();
        }
      });

      scope.focus     = focus;
      scope.select    = select;
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
        selectedItem    : '='
      },
      link: link
    };
  }

  angular.module('app')
    .directive('myAutocomplete', autocompleteDirective);
})();
