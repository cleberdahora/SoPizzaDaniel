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

      function getStyle() {
        let elemPos = elem.position();
        let top     = elemPos.top + elem.outerHeight();
        let left    = elemPos.left;
        let width   = elem.outerWidth();

        let toRem = px => (px / 16) + 'rem';

        return {
          left    : toRem(left),
          top     : toRem(top),
          minWidth: toRem(width)
        };
      }

      // Move the directive below the input
      scope.$watch(getStyle, style => {
        directive.css(style);
      }, true);

      elem.on('focus', () => {
        scope.showSuggestions = true;
        scope.$apply();
      });

      elem.on('blur', () => {
        scope.showSuggestions = false;
        scope.$apply();
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
      function goUp(event) {
        let curr = directive.find('.suggestion.focused');
        let currIdx = curr.index();
        let target;

        if (currIdx === -1) {
          // Get the last element by default
          target = angular.element('.suggestion').last();
        } else {
          let firstSuggestion = angular.element('.suggestion').first();

          if (curr.is(firstSuggestion)) {
            // Go to last element and start it all again
            target = directive.find('.suggestion').last();
          } else {
            // Go to previous
            target = curr.prev('.suggestion');
          }
        }

        curr.removeClass('focused');
        target.addClass('focused');

        select(target);
        event.preventDefault();
      }

      function goDown(event) {
        let curr = directive.find('.suggestion.focused');
        let currIdx = curr.index();
        let target;

        if (currIdx === -1) {
          // Get the first element by default
          target = angular.element('.suggestion').first();
        } else {
          let lastSuggestion = angular.element('.suggestion').last();

          if (curr.is(lastSuggestion)) {
            // Go to first element and start it all again
            target = directive.find('.suggestion').first();
          } else {
            // Go to next
            target = curr.next('.suggestion');
          }
        }

        curr.removeClass('focused');
        target.addClass('focused');

        select(target);
        event.preventDefault();
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

      function loseFocus(event) {
        scope.showSuggestions = false;
      }

      // Keyboard navigation
      let keyHandlers = {
        38: goUp,     // Up arrow
        40: goDown,   // Down arrow
        13: loseFocus // Enter key
      };

      elem.bind('keydown', (event) => {
        let code = event.keyCode;
        let handler = keyHandlers[code];

        if (handler) {
          scope.$apply(() => handler(event));
        }
      });

      scope.$watch('suggestions', (suggestions) => {
        let hasSuggestions = suggestions && suggestions.length;
        let isFocused      = elem.is(':focus');

        scope.showSuggestions = hasSuggestions && isFocused;
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
        suggestions : '=',
        click       : '=',
        limit       : '@',
        selectedItem: '='
      },
      link: link
    };
  }

  angular.module('app')
    .directive('myAutocomplete', autocompleteDirective);
})();
